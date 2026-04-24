"""End-to-end RAG pipeline.

Single entry point that orchestrates:
    Documents -> Chunks -> Embedded index -> Retrieve for query -> Generate answer

This is what the FastAPI layer (Workstream B7) calls. Keeps the integration
wiring in one place so the CLI, API, and experiments all use the same flow.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field

from edullm_pacer.chunkers.base import BaseChunker
from edullm_pacer.embeddings.base import Embedder
from edullm_pacer.generation.base import Generator
from edullm_pacer.generation.prompt import build_rag_prompt
from edullm_pacer.retrieval.faiss_retriever import FaissRetriever
from edullm_pacer.schemas import (
    Chunk,
    Document,
    GenerationResult,
    Query,
    RetrievalResult,
)
from edullm_pacer.utils.logging import get_logger

logger = get_logger(__name__)


@dataclass
class PipelineOutput:
    """Full pipeline result for one query."""

    query: Query
    retrieval: RetrievalResult
    generation: GenerationResult
    total_latency_ms: float = 0.0
    extra: dict = field(default_factory=dict)


class RAGPipeline:
    """End-to-end RAG pipeline.

    Holds the components in memory and exposes:
        index(documents)   - chunk + embed + add to retriever
        ask(query, k)      - retrieve + generate
        save() / load()    - persist the index

    Args:
        chunker: chunking strategy instance.
        embedder: embedder backend.
        generator: generator backend.
        top_k: default retrieval depth.
    """

    def __init__(
        self,
        chunker: BaseChunker,
        embedder: Embedder,
        generator: Generator,
        top_k: int = 5,
    ) -> None:
        self.chunker = chunker
        self.embedder = embedder
        self.generator = generator
        self.top_k = top_k
        self.retriever = FaissRetriever(embedder=embedder)

    # --- Indexing ---

    def index(
        self,
        documents: list[Document],
        show_progress: bool = False,
    ) -> list[Chunk]:
        """Chunk and index a batch of documents."""
        all_chunks: list[Chunk] = []
        for doc in documents:
            chunks = self.chunker.chunk(doc)
            all_chunks.extend(chunks)

        if not all_chunks:
            logger.warning("No chunks produced - skipping indexing")
            return []

        self.retriever.add_chunks(all_chunks, show_progress=show_progress)
        logger.info(
            f"Indexed {len(documents):,} docs -> {len(all_chunks):,} chunks "
            f"using {self.chunker.__class__.__name__}"
        )
        return all_chunks

    # --- Query ---

    def ask(
        self,
        query: Query,
        k: int | None = None,
        metadata_filter: dict | None = None,
        max_tokens: int = 512,
        temperature: float = 0.2,
    ) -> PipelineOutput:
        """Answer a query grounded in the indexed corpus."""
        k = k or self.top_k
        overall_start = time.perf_counter()

        retrieval = self.retriever.retrieve(
            query, k=k, metadata_filter=metadata_filter,
        )
        context_chunks = [r.chunk for r in retrieval.retrieved]
        prompt = build_rag_prompt(query, context_chunks)

        gen_out = self.generator.generate(
            prompt, max_tokens=max_tokens, temperature=temperature,
        )
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
        total_ms = (time.perf_counter() - overall_start) * 1000.0

        return PipelineOutput(
            query=query,
            retrieval=retrieval,
            generation=generation,
            total_latency_ms=total_ms,
        )

    def __len__(self) -> int:
        return len(self.retriever)
