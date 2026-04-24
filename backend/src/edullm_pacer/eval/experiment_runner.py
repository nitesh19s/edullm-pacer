"""Experiment runner for PACER evaluation.

Runs the full retrieve → score loop over a set of queries and produces
EvaluationRecord objects that can be saved to JSONL for analysis.

The runner is strategy-agnostic: pass any retriever and it will compute
retrieval metrics + CAS for all queries.

Usage::

    from edullm_pacer.eval import ExperimentRunner

    runner = ExperimentRunner(
        retriever=my_retriever,
        cas_scorer=CASScorer(),
        experiment_id="pacer_educational_bge",
        embedding_model="BAAI/bge-large-en-v1.5",
        strategy="educational",
    )
    records = runner.run(queries)
    runner.save(records, Path("results/pacer_educational_bge.jsonl"))
"""
from __future__ import annotations

import time
import uuid
from pathlib import Path
from typing import Protocol, runtime_checkable

from edullm_pacer.cas.scorer import CASScorer
from edullm_pacer.eval.retrieval_metrics import average_retrieval_metrics, compute_retrieval_metrics
from edullm_pacer.schemas import (
    CASScore,
    Chunk,
    EvaluationRecord,
    Query,
    RetrievalMetrics,
)
from edullm_pacer.utils.io import write_jsonl
from edullm_pacer.utils.logging import get_logger

logger = get_logger(__name__)


@runtime_checkable
class Retriever(Protocol):
    """Minimal protocol for any retriever the runner can call."""

    def retrieve(self, query_text: str, top_k: int = 10) -> list[Chunk]:
        """Return chunks ranked by relevance, most relevant first."""
        ...


class ExperimentRunner:
    """Evaluate a retriever over a query set and produce EvaluationRecord rows.

    Args:
        retriever:       any object implementing ``retrieve(text, top_k) → list[Chunk]``.
        cas_scorer:      CASScorer instance (or None to skip CAS).
        experiment_id:   label for this experimental run.
        embedding_model: name of the embedding model used.
        strategy:        chunking strategy name.
        generator_model: name of the generator model (optional).
        top_k:           number of chunks to retrieve per query.
        k_values:        cut-off depths for precision/recall/nDCG.
    """

    def __init__(
        self,
        retriever: Retriever,
        cas_scorer: CASScorer | None = None,
        *,
        experiment_id: str | None = None,
        embedding_model: str = "unknown",
        strategy: str = "unknown",
        generator_model: str | None = None,
        top_k: int = 10,
        k_values: list[int] | None = None,
    ) -> None:
        self.retriever = retriever
        self.cas_scorer = cas_scorer
        self.experiment_id = experiment_id or str(uuid.uuid4())[:8]
        self.embedding_model = embedding_model
        self.strategy = strategy
        self.generator_model = generator_model
        self.top_k = top_k
        self.k_values = k_values or [1, 3, 5, 10]

    # ------------------------------------------------------------------

    def run(self, queries: list[Query]) -> list[EvaluationRecord]:
        """Run evaluation over all queries and return records."""
        records: list[EvaluationRecord] = []
        for i, query in enumerate(queries):
            logger.debug(f"[{i+1}/{len(queries)}] {query.query_id}")
            record = self._evaluate_one(query)
            records.append(record)
        logger.info(
            f"Experiment {self.experiment_id}: {len(records)} queries evaluated. "
            f"Mean MRR={self._mean_mrr(records):.3f}"
        )
        return records

    def summary(self, records: list[EvaluationRecord]) -> dict:
        """Return a summary dict of macro-averaged metrics."""
        retrieval_metrics = [r.retrieval for r in records]
        avg = average_retrieval_metrics(retrieval_metrics)

        cas_scores = [r.cas.overall for r in records if r.cas is not None]
        mean_cas = sum(cas_scores) / len(cas_scores) if cas_scores else None

        latencies = [r.latency_ms for r in records if r.latency_ms is not None]
        mean_lat = sum(latencies) / len(latencies) if latencies else None

        return {
            "experiment_id": self.experiment_id,
            "strategy": self.strategy,
            "embedding_model": self.embedding_model,
            "n_queries": len(records),
            "precision": avg.precision_at_k,
            "recall": avg.recall_at_k,
            "ndcg": avg.ndcg_at_k,
            "mrr": avg.mrr,
            "mean_cas": mean_cas,
            "mean_latency_ms": mean_lat,
        }

    def save(self, records: list[EvaluationRecord], path: Path) -> None:
        """Write records to a JSONL file."""
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        write_jsonl(path, records)
        logger.info(f"Saved {len(records)} records → {path}")

    # ------------------------------------------------------------------

    def _evaluate_one(self, query: Query) -> EvaluationRecord:
        t0 = time.perf_counter()
        chunks = self.retriever.retrieve(query.text, top_k=self.top_k)
        latency_ms = (time.perf_counter() - t0) * 1000

        retrieved_ids = [c.chunk_id for c in chunks]
        relevant_ids = set(query.expected_chunk_ids)
        # Fall back to doc-level relevance if no chunk-level gold set.
        if not relevant_ids and query.expected_doc_ids:
            relevant_ids = {
                c.chunk_id for c in chunks if c.metadata.doc_id in query.expected_doc_ids
            }

        retrieval: RetrievalMetrics = compute_retrieval_metrics(
            retrieved_ids, relevant_ids, self.k_values
        )

        cas: CASScore | None = None
        if self.cas_scorer is not None and chunks:
            cas_scores = self.cas_scorer.score_batch(query, chunks)
            mean_overall = sum(s.overall for s in cas_scores) / len(cas_scores)
            # Return the average as a synthetic CASScore for the record.
            cas = CASScore(
                overall=round(mean_overall, 4),
                grade_match=round(sum(s.grade_match for s in cas_scores) / len(cas_scores), 4),
                prereq_preservation=round(
                    sum(s.prereq_preservation for s in cas_scores) / len(cas_scores), 4
                ),
                bloom_alignment=round(
                    sum(s.bloom_alignment for s in cas_scores) / len(cas_scores), 4
                ),
                weights=cas_scores[0].weights,
            )

        return EvaluationRecord(
            experiment_id=self.experiment_id,
            query_id=query.query_id,
            strategy=self.strategy,
            embedding_model=self.embedding_model,
            generator_model=self.generator_model,
            retrieval=retrieval,
            cas=cas,
            latency_ms=round(latency_ms, 2),
        )

    @staticmethod
    def _mean_mrr(records: list[EvaluationRecord]) -> float:
        vals = [r.retrieval.mrr for r in records if r.retrieval.mrr is not None]
        return sum(vals) / len(vals) if vals else 0.0
