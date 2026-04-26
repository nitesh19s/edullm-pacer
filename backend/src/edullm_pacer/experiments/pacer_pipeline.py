"""PACER adaptive pipeline.

The key novelty over the plain RAGPipeline: instead of one fixed chunker,
PACER selects the optimal chunking strategy *per document* using the
classifier + router, then optionally post-processes with the boundary detector.

Usage::

    from edullm_pacer.experiments.pacer_pipeline import build_pacer_pipeline, build_baseline_pipeline

    # Full PACER
    pipeline = build_pacer_pipeline(embedder, generator, use_boundary_pp=True)
    pipeline.index(documents)
    result = pipeline.ask(query)

    # Baseline (fixed strategy)
    pipeline = build_baseline_pipeline("recursive", chunk_size=512, embedder=embedder, generator=generator)
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from edullm_pacer.boundary.post_processor import BoundaryPostProcessor
from edullm_pacer.chunkers.registry import get_chunker
from edullm_pacer.classifier.rule_based import RuleBasedClassifier
from edullm_pacer.embeddings.base import Embedder
from edullm_pacer.generation.base import Generator
from edullm_pacer.generation.prompt import build_rag_prompt
from edullm_pacer.retrieval.bm25_retriever import BM25Retriever
from edullm_pacer.retrieval.faiss_retriever import FaissRetriever
from edullm_pacer.retrieval.hybrid_retriever import HybridRetriever
from edullm_pacer.router.rule_based import RuleBasedRouter
from edullm_pacer.schemas import (
    Chunk,
    ChunkingStrategy,
    Document,
    GenerationResult,
    Query,
    RetrievalResult,
)
from edullm_pacer.utils.logging import get_logger

if TYPE_CHECKING:
    from edullm_pacer.chunkers.base import BaseChunker

logger = get_logger(__name__)


@dataclass
class PipelineOutput:
    query: Query
    retrieval: RetrievalResult
    generation: GenerationResult | None
    total_latency_ms: float = 0.0
    chunks_indexed: int = 0
    strategy_counts: dict[str, int] = field(default_factory=dict)


class PACERPipeline:
    """Adaptive RAG pipeline with per-document strategy selection.

    Args:
        router:        RuleBasedRouter (includes classifier inside).
        chunkers:      dict mapping ChunkingStrategy → chunker instance.
        embedder:      embedding backend.
        generator:     generation backend (None = retrieval-only).
        boundary_pp:   optional BoundaryPostProcessor.
        retriever_type: 'hybrid' | 'dense' | 'sparse'.
        top_k:         default retrieval depth.
    """

    def __init__(
        self,
        router: RuleBasedRouter,
        chunkers: dict[ChunkingStrategy, "BaseChunker"],
        embedder: Embedder,
        generator: Generator | None = None,
        boundary_pp: BoundaryPostProcessor | None = None,
        retriever_type: str = "hybrid",
        top_k: int = 10,
    ) -> None:
        self.router = router
        self.chunkers = chunkers
        self.embedder = embedder
        self.generator = generator
        self.boundary_pp = boundary_pp
        self.retriever_type = retriever_type
        self.top_k = top_k

        self._dense = FaissRetriever(embedder=embedder)
        self._sparse = BM25Retriever()
        self._hybrid = HybridRetriever(dense=self._dense, sparse=self._sparse)

    # ------------------------------------------------------------------
    # Indexing
    # ------------------------------------------------------------------

    def index(self, documents: list[Document]) -> tuple[list[Chunk], dict[str, int]]:
        """Chunk, post-process, and index all documents.

        Returns (all_chunks, strategy_counts) where strategy_counts maps
        strategy name → number of chunks produced with that strategy.
        """
        all_chunks: list[Chunk] = []
        strategy_counts: dict[str, int] = {}

        for doc in documents:
            strategy = self.router.route(doc)
            chunker = self.chunkers.get(strategy)
            if chunker is None:
                # Fallback to hybrid if the routed strategy has no chunker loaded.
                fallback = ChunkingStrategy.HYBRID
                chunker = self.chunkers.get(fallback)
                logger.warning(f"No chunker for {strategy}, falling back to {fallback}")

            chunks = chunker.chunk(doc)

            if self.boundary_pp is not None:
                chunks = self.boundary_pp.process(chunks)

            all_chunks.extend(chunks)
            strategy_counts[strategy.value] = strategy_counts.get(strategy.value, 0) + len(chunks)

        if not all_chunks:
            logger.warning("No chunks produced — index is empty")
            return [], strategy_counts

        self._dense.add_chunks(all_chunks)
        self._sparse.add_chunks(all_chunks)
        logger.info(
            f"PACER indexed {len(documents):,} docs → {len(all_chunks):,} chunks | "
            f"strategy dist: {strategy_counts}"
        )
        return all_chunks, strategy_counts

    # ------------------------------------------------------------------
    # Query
    # ------------------------------------------------------------------

    def retrieve(self, query: Query, k: int | None = None) -> RetrievalResult:
        k = k or self.top_k
        retriever = {
            "hybrid": self._hybrid,
            "dense": self._dense,
            "sparse": self._sparse,
        }[self.retriever_type]
        return retriever.retrieve(query, k=k)

    def ask(
        self,
        query: Query,
        k: int | None = None,
        max_tokens: int = 512,
        temperature: float = 0.2,
    ) -> PipelineOutput:
        k = k or self.top_k
        t0 = time.perf_counter()
        retrieval = self.retrieve(query, k=k)

        generation: GenerationResult | None = None
        if self.generator is not None:
            context_chunks = [r.chunk for r in retrieval.retrieved]
            prompt = build_rag_prompt(query, context_chunks)
            gen_out = self.generator.generate(prompt, max_tokens=max_tokens, temperature=temperature)
            generation = GenerationResult(
                query=query,
                answer=gen_out.text,
                context_chunks=context_chunks,
                model_name=gen_out.model_name,
                latency_ms=gen_out.latency_ms,
                token_usage={
                    "prompt": gen_out.prompt_tokens or 0,
                    "completion": gen_out.completion_tokens or 0,
                },
            )

        total_ms = (time.perf_counter() - t0) * 1000.0
        return PipelineOutput(query=query, retrieval=retrieval, generation=generation,
                              total_latency_ms=total_ms)

    def __len__(self) -> int:
        return len(self._dense)


# ---------------------------------------------------------------------------
# Factory functions
# ---------------------------------------------------------------------------


def build_pacer_pipeline(
    embedder: Embedder,
    generator: Generator | None = None,
    *,
    use_boundary_pp: bool = True,
    use_router: bool = True,
    chunk_size: int = 2000,
    chunk_overlap: int = 100,
    max_unit_chars: int = 4000,
    retriever_type: str = "hybrid",
    top_k: int = 10,
) -> PACERPipeline:
    """Build the full PACER adaptive pipeline."""
    clf = RuleBasedClassifier() if use_router else None
    router = RuleBasedRouter(classifier=clf)

    chunkers = {
        s: get_chunker(s, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        for s in ChunkingStrategy
    }

    boundary_pp = BoundaryPostProcessor(merge=False) if use_boundary_pp else None

    return PACERPipeline(
        router=router,
        chunkers=chunkers,
        embedder=embedder,
        generator=generator,
        boundary_pp=boundary_pp,
        retriever_type=retriever_type,
        top_k=top_k,
    )


def build_baseline_pipeline(
    strategy: str | ChunkingStrategy,
    embedder: Embedder,
    generator: Generator | None = None,
    *,
    chunk_size: int = 512,
    chunk_overlap: int = 64,
    max_unit_chars: int = 4000,
    use_boundary_pp: bool = False,
    retriever_type: str = "hybrid",
    top_k: int = 10,
) -> PACERPipeline:
    """Build a non-adaptive baseline that uses a single fixed chunking strategy."""
    from edullm_pacer.router.rule_based import ROUTING_TABLE

    if isinstance(strategy, str):
        strategy = ChunkingStrategy(strategy)

    chunker = get_chunker(strategy, chunk_size=chunk_size, chunk_overlap=chunk_overlap)

    # Router always returns this fixed strategy.
    fixed_table = {dt: strategy for dt in ROUTING_TABLE}
    router = RuleBasedRouter(classifier=None, overrides=fixed_table)
    chunkers = {strategy: chunker}
    boundary_pp = BoundaryPostProcessor(merge=False) if use_boundary_pp else None

    return PACERPipeline(
        router=router,
        chunkers=chunkers,
        embedder=embedder,
        generator=generator,
        boundary_pp=boundary_pp,
        retriever_type=retriever_type,
        top_k=top_k,
    )
