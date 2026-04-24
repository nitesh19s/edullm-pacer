"""FastAPI server exposing the RAG pipeline.

Endpoints:
    GET  /                 - health check
    GET  /api/stats        - basic system stats for the UI's stats panel
    POST /api/query        - answer a query, returns text + cited sources
    GET  /api/chunkers     - list available chunking strategies
    POST /api/reindex      - rebuild index with a different chunker (dev use)

This is deliberately minimal. It wraps the RAGPipeline so the web UI (or any
HTTP client) can use it without knowing any Python details.

Run locally:
    uvicorn edullm_pacer.api.server:app --reload --port 8000

Then point your existing index.html at http://localhost:8000/api/query.
"""
from __future__ import annotations

import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from edullm_pacer.chunkers import get_chunker
from edullm_pacer.embeddings import HashEmbedder, SentenceTransformerEmbedder
from edullm_pacer.generation import DummyGenerator, Generator
from edullm_pacer.pipeline import RAGPipeline
from edullm_pacer.schemas import ChunkingStrategy, Query
from edullm_pacer.utils.logging import get_logger

logger = get_logger(__name__)


# --------------------------------------------------------------------------
# Global pipeline state
# --------------------------------------------------------------------------


class AppState:
    pipeline: RAGPipeline | None = None
    stats = {
        "total_queries": 0,
        "total_latency_ms": 0.0,
        "startup_time": time.time(),
    }


state = AppState()


def build_default_pipeline(
    chunker_strategy: str = "educational",
    embedder_backend: str = "hash",
    generator: Generator | None = None,
) -> RAGPipeline:
    """Construct a pipeline with sensible defaults.

    The defaults (hash embedder + dummy generator) run with no downloads so
    the server comes up instantly for local development. For production swap
    to "sentence-transformer" + a real generator.
    """
    if embedder_backend == "hash":
        embedder = HashEmbedder(dim=128)
    elif embedder_backend == "sentence-transformer":
        embedder = SentenceTransformerEmbedder(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
        )
    else:
        raise ValueError(f"Unknown embedder backend: {embedder_backend}")

    chunker = get_chunker(ChunkingStrategy(chunker_strategy))
    gen = generator or DummyGenerator()
    return RAGPipeline(chunker=chunker, embedder=embedder, generator=gen, top_k=5)


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[no-untyped-def]
    """Build the pipeline on startup, clean up on shutdown."""
    logger.info("Starting EduLLM-PACER API server")
    state.pipeline = build_default_pipeline()
    logger.info("Server ready")
    yield
    logger.info("Shutting down")


app = FastAPI(
    title="EduLLM-PACER API",
    version="0.1.0",
    description=(
        "Pedagogy-Aware Adaptive Chunking for Educational RAG. "
        "Research prototype — not for production."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the bundled web UI so the server is self-contained for demos.
_STATIC_DIR = Path(__file__).parent / "static"
if _STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=_STATIC_DIR), name="static")


@app.get("/ui")
def ui() -> FileResponse:
    """Serve the bundled web UI."""
    index = _STATIC_DIR / "index.html"
    if not index.exists():
        raise HTTPException(404, "UI not installed")
    return FileResponse(index)


# --------------------------------------------------------------------------
# Schemas exposed to the UI
# --------------------------------------------------------------------------


class QueryFilters(BaseModel):
    """Mirrors the filter dropdowns in the existing web UI."""

    subject: str | None = None
    grade: str | None = None
    doc_type: str | None = Field(None, alias="resourceType")
    language: str | None = None

    model_config = {"populate_by_name": True}

    def to_metadata_filter(self) -> dict[str, Any]:
        out: dict[str, Any] = {}
        if self.subject:
            out["subject"] = self.subject
        if self.grade and self.grade != "all":
            out["grade"] = self.grade
        if self.doc_type and self.doc_type != "all":
            out["doc_type"] = self.doc_type
        return out


class QueryRequest(BaseModel):
    query: str
    filters: QueryFilters | None = None
    k: int = 5


class CitedSource(BaseModel):
    source_index: int
    chunk_id: str
    subject: str | None = None
    grade: str | None = None
    doc_type: str | None = None
    preview: str


class QueryResponse(BaseModel):
    answer: str
    sources: list[CitedSource]
    retrieval_latency_ms: float | None = None
    generation_latency_ms: float | None = None
    total_latency_ms: float


class StatsResponse(BaseModel):
    total_queries: int
    avg_latency_ms: float
    documents_indexed: int
    chunks_indexed: int
    uptime_seconds: float


# --------------------------------------------------------------------------
# Endpoints
# --------------------------------------------------------------------------


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok", "service": "edullm-pacer", "version": "0.1.0"}


@app.get("/api/stats", response_model=StatsResponse)
def stats() -> StatsResponse:
    if state.pipeline is None:
        raise HTTPException(503, "Pipeline not initialized")
    n = state.stats["total_queries"]
    avg = (state.stats["total_latency_ms"] / n) if n else 0.0
    return StatsResponse(
        total_queries=n,
        avg_latency_ms=avg,
        documents_indexed=len({c.metadata.doc_id for c in state.pipeline.retriever._chunks}),
        chunks_indexed=len(state.pipeline),
        uptime_seconds=time.time() - state.stats["startup_time"],
    )


@app.get("/api/chunkers")
def chunkers() -> dict[str, list[str]]:
    from edullm_pacer.chunkers import available_strategies
    return {"strategies": [s.value for s in available_strategies()]}


@app.post("/api/query", response_model=QueryResponse)
def query_endpoint(req: QueryRequest) -> QueryResponse:
    if state.pipeline is None:
        raise HTTPException(503, "Pipeline not initialized")

    q = Query(query_id=f"q_{state.stats['total_queries']}", text=req.query)
    metadata_filter = req.filters.to_metadata_filter() if req.filters else None

    try:
        result = state.pipeline.ask(q, k=req.k, metadata_filter=metadata_filter)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Query failed")
        raise HTTPException(500, f"Query failed: {exc}") from exc

    # Update stats.
    state.stats["total_queries"] += 1
    state.stats["total_latency_ms"] += result.total_latency_ms

    sources = []
    for i, r in enumerate(result.retrieval.retrieved, start=1):
        meta = r.chunk.metadata
        sources.append(
            CitedSource(
                source_index=i,
                chunk_id=r.chunk.chunk_id,
                subject=meta.subject,
                grade=meta.grade if isinstance(meta.grade, str) else getattr(meta.grade, "value", None),
                doc_type=meta.doc_type if isinstance(meta.doc_type, str) else getattr(meta.doc_type, "value", None),
                preview=r.chunk.text[:200] + ("…" if len(r.chunk.text) > 200 else ""),
            )
        )

    return QueryResponse(
        answer=result.generation.answer,
        sources=sources,
        retrieval_latency_ms=result.retrieval.latency_ms,
        generation_latency_ms=result.generation.latency_ms,
        total_latency_ms=result.total_latency_ms,
    )
