"""Single-condition experiment runner.

Runs one (condition, embedding_model, generator_model) triple end-to-end:
  1. Load documents from SQLite.
  2. Build the pipeline (PACER adaptive or fixed baseline).
  3. Index all documents.
  4. Run every benchmark query through the pipeline.
  5. Compute retrieval metrics + CAS per query.
  6. Save EvaluationRecords to JSONL and a summary JSON.

Designed to be called from Colab or the CLI, one condition at a time, so
failed runs can be retried without re-running everything.

Usage::

    runner = ConditionRunner(cfg, condition, embedding_model, generator_model)
    records = runner.run()
    runner.save(records)
"""
from __future__ import annotations

import json
import time
from pathlib import Path

from edullm_pacer.benchmark.sqlite_exporter import export_entries
from edullm_pacer.benchmark.quality_filter import is_valid_entry
from edullm_pacer.cas.scorer import CASScorer
from edullm_pacer.eval.retrieval_metrics import compute_retrieval_metrics
from edullm_pacer.experiments.config import ConditionConfig, ExperimentConfig
from edullm_pacer.experiments.pacer_pipeline import (
    PACERPipeline,
    build_baseline_pipeline,
    build_pacer_pipeline,
)
from edullm_pacer.schemas import (
    BloomLevel,
    CASScore,
    Chunk,
    ChunkingStrategy,
    Document,
    DocumentMetadata,
    DocumentType,
    EvaluationRecord,
    GenerationMetrics,
    GradeLevel,
    Query,
    RetrievalMetrics,
)
from edullm_pacer.utils.io import read_jsonl, write_jsonl
from edullm_pacer.utils.logging import get_logger

logger = get_logger(__name__)


class ConditionRunner:
    """Run one experimental condition and produce EvaluationRecords.

    Args:
        cfg:             full experiment config.
        condition:       the specific condition to run.
        embedding_model: HuggingFace model name for the embedder.
        generator_model: HuggingFace model name for the generator (or None).
        cas_scorer:      optional CASScorer (constructed with default weights if None).
    """

    def __init__(
        self,
        cfg: ExperimentConfig,
        condition: ConditionConfig,
        embedding_model: str,
        generator_model: str | None = None,
        cas_scorer: CASScorer | None = None,
    ) -> None:
        self.cfg = cfg
        self.condition = condition
        self.embedding_model = embedding_model
        self.generator_model = generator_model
        self.cas_scorer = cas_scorer or CASScorer()
        self.run_id = cfg.run_id(condition.name, embedding_model, generator_model or "nogen")

    # ------------------------------------------------------------------
    # Main entry point
    # ------------------------------------------------------------------

    def run(self) -> list[EvaluationRecord]:
        """Execute the full index → query → evaluate loop."""
        logger.info(f"=== Starting run: {self.run_id} ===")

        # 1. Load documents
        documents = self._load_documents()
        logger.info(f"Loaded {len(documents):,} documents")

        # 2. Load queries
        queries = self._load_queries()
        logger.info(f"Loaded {len(queries):,} queries")

        # 3. Build pipeline
        pipeline = self._build_pipeline()

        # 4. Index
        t_idx = time.perf_counter()
        chunks, strategy_counts = pipeline.index(documents)
        index_sec = time.perf_counter() - t_idx
        logger.info(
            f"Indexed {len(chunks):,} chunks in {index_sec:.1f}s | strategy dist: {strategy_counts}"
        )

        # 5. Evaluate
        records = self._evaluate(pipeline, queries)

        logger.info(
            f"Run {self.run_id} complete: {len(records)} queries | "
            f"mean MRR={self._mean_mrr(records):.3f}"
        )
        return records

    def save(self, records: list[EvaluationRecord], output_dir: str | Path | None = None) -> Path:
        """Write records + summary to disk."""
        out_dir = Path(output_dir or self.cfg.output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        records_path = out_dir / f"{self.run_id}.jsonl"
        write_jsonl(records_path, records)

        summary = self._summarise(records)
        summary_path = out_dir / f"{self.run_id}.summary.json"
        summary_path.write_text(json.dumps(summary, indent=2))

        logger.info(f"Saved {len(records)} records → {records_path}")
        return records_path

    def is_done(self, output_dir: str | Path | None = None) -> bool:
        """Return True if this run's output already exists (for resumption)."""
        out_dir = Path(output_dir or self.cfg.output_dir)
        return (out_dir / f"{self.run_id}.jsonl").exists()

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _load_documents(self) -> list[Document]:
        """Export from SQLite and convert to Document objects."""
        raw = export_entries(self.cfg.documents_db_path)
        # Filter: keep only entries with enough text to be useful chunks.
        filtered = [e for e in raw if len(e.get("question", "") + e.get("answer", "")) > 100]

        documents: list[Document] = []
        seen_ids: set[str] = set()
        for e in filtered:
            doc_id = e["id"]
            if doc_id in seen_ids:
                continue
            seen_ids.add(doc_id)

            # Combine Q+A as the document text.
            text = f"Question: {e['question']}\n\nAnswer: {e['answer']}".strip()
            if not text:
                continue

            grade_level = e.get("grade_level", GradeLevel.UNKNOWN)
            # All NCERT SQLite entries are textbook Q&A pairs — set doc_type
            # explicitly so the PACER router routes them to EDUCATIONAL chunking
            # rather than falling back to UNKNOWN → HYBRID.
            meta = DocumentMetadata(
                subject=e.get("subject"),
                grade=grade_level if isinstance(grade_level, GradeLevel) else GradeLevel.UNKNOWN,
                doc_type=DocumentType.TEXTBOOK_CHAPTER,
                source=e.get("source", "NCERT"),
            )
            documents.append(Document(doc_id=doc_id, text=text, metadata=meta))

        return documents

    def _load_queries(self) -> list[Query]:
        """Load benchmark queries from JSONL."""
        path = Path(self.cfg.benchmark_path)
        if not path.exists():
            raise FileNotFoundError(f"Benchmark not found: {path}. Run: edullm benchmark")

        queries = [Query.model_validate(d) for d in read_jsonl(path)]
        if self.cfg.max_queries:
            queries = queries[: self.cfg.max_queries]
        return queries

    def _build_pipeline(self) -> PACERPipeline:
        """Construct the pipeline from config + loaded model objects."""
        embedder = self._load_embedder()
        generator = self._load_generator()
        cond = self.condition

        if cond.mode == "adaptive":
            return build_pacer_pipeline(
                embedder=embedder,
                generator=generator,
                use_boundary_pp=cond.use_boundary_pp,
                use_router=cond.use_router,
                chunk_size=cond.chunk_size,
                chunk_overlap=cond.chunk_overlap,
                max_unit_chars=cond.max_unit_chars,
                retriever_type=cond.retriever,
                top_k=self.cfg.top_k,
            )
        else:
            return build_baseline_pipeline(
                strategy=cond.strategy,
                embedder=embedder,
                generator=generator,
                chunk_size=cond.chunk_size,
                chunk_overlap=cond.chunk_overlap,
                max_unit_chars=cond.max_unit_chars,
                use_boundary_pp=cond.use_boundary_pp,
                retriever_type=cond.retriever,
                top_k=self.cfg.top_k,
            )

    def _load_embedder(self):
        """Load the SentenceTransformer embedder (lazy import)."""
        from edullm_pacer.embeddings.sentence_transformer import SentenceTransformerEmbedder
        logger.info(f"Loading embedder: {self.embedding_model}")
        return SentenceTransformerEmbedder(model_name=self.embedding_model)

    def _load_generator(self):
        """Load the HF generator or return None (retrieval-only)."""
        if not self.generator_model:
            return None
        from edullm_pacer.generation.hf_local import HFLocalGenerator
        logger.info(f"Loading generator: {self.generator_model}")
        return HFLocalGenerator(model_name=self.generator_model)

    def _evaluate(
        self, pipeline: PACERPipeline, queries: list[Query]
    ) -> list[EvaluationRecord]:
        records: list[EvaluationRecord] = []
        for i, query in enumerate(queries):
            if (i + 1) % 50 == 0:
                logger.info(f"  Query {i+1}/{len(queries)}")
            record = self._evaluate_one(pipeline, query)
            records.append(record)
        return records

    def _evaluate_one(self, pipeline: PACERPipeline, query: Query) -> EvaluationRecord:
        t0 = time.perf_counter()
        output = pipeline.ask(query, k=self.cfg.top_k)
        latency_ms = (time.perf_counter() - t0) * 1000.0

        retrieved_ids = [r.chunk.chunk_id for r in output.retrieval.retrieved]
        relevant_ids = set(query.expected_chunk_ids)
        # Fall back to doc-level relevance when no chunk-level gold set exists.
        if not relevant_ids and query.expected_doc_ids:
            relevant_ids = {
                r.chunk.chunk_id
                for r in output.retrieval.retrieved
                if r.chunk.metadata.doc_id in query.expected_doc_ids
            }

        retrieval_metrics = compute_retrieval_metrics(
            retrieved_ids, relevant_ids, self.cfg.k_values
        )

        cas: CASScore | None = None
        retrieved_chunks = [r.chunk for r in output.retrieval.retrieved]
        if retrieved_chunks:
            cas_scores = self.cas_scorer.score_batch(query, retrieved_chunks)
            n = len(cas_scores)
            cas = CASScore(
                overall=round(sum(s.overall for s in cas_scores) / n, 4),
                grade_match=round(sum(s.grade_match for s in cas_scores) / n, 4),
                prereq_preservation=round(sum(s.prereq_preservation for s in cas_scores) / n, 4),
                bloom_alignment=round(sum(s.bloom_alignment for s in cas_scores) / n, 4),
                weights=cas_scores[0].weights,
            )

        gen_metrics: GenerationMetrics | None = None
        if output.generation is not None:
            # Faithfulness and relevancy require LLM-judge — set to None here,
            # filled by a separate CAS/RAGAS evaluation pass on Colab.
            gen_metrics = GenerationMetrics()

        return EvaluationRecord(
            experiment_id=self.run_id,
            query_id=query.query_id,
            strategy=self.condition.name,
            embedding_model=self.embedding_model,
            generator_model=self.generator_model,
            retrieval=retrieval_metrics,
            generation=gen_metrics,
            cas=cas,
            latency_ms=round(latency_ms, 2),
        )

    # ------------------------------------------------------------------
    # Summary helpers
    # ------------------------------------------------------------------

    def _summarise(self, records: list[EvaluationRecord]) -> dict:
        from edullm_pacer.eval.retrieval_metrics import average_retrieval_metrics
        avg = average_retrieval_metrics([r.retrieval for r in records])
        cas_scores = [r.cas.overall for r in records if r.cas]
        lats = [r.latency_ms for r in records if r.latency_ms]
        return {
            "run_id": self.run_id,
            "condition": self.condition.name,
            "embedding_model": self.embedding_model,
            "generator_model": self.generator_model,
            "n_queries": len(records),
            "precision": avg.precision_at_k,
            "recall": avg.recall_at_k,
            "ndcg": avg.ndcg_at_k,
            "mrr": avg.mrr,
            "mean_cas": round(sum(cas_scores) / len(cas_scores), 4) if cas_scores else None,
            "mean_latency_ms": round(sum(lats) / len(lats), 2) if lats else None,
        }

    @staticmethod
    def _mean_mrr(records: list[EvaluationRecord]) -> float:
        vals = [r.retrieval.mrr for r in records if r.retrieval.mrr is not None]
        return sum(vals) / len(vals) if vals else 0.0
