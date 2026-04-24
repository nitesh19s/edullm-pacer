"""End-to-end retrieval pipeline tests using the deterministic hash embedder.

These tests run offline and in CI - no model downloads required.
"""
from __future__ import annotations

from pathlib import Path

import pytest

from edullm_pacer.embeddings import HashEmbedder
from edullm_pacer.retrieval import BM25Retriever, FaissRetriever, HybridRetriever
from edullm_pacer.schemas import (
    Chunk,
    ChunkingStrategy,
    ChunkMetadata,
    Query,
)


def _make_chunk(chunk_id: str, text: str, **meta_kwargs) -> Chunk:  # type: ignore[no-untyped-def]
    return Chunk(
        chunk_id=chunk_id,
        text=text,
        metadata=ChunkMetadata(
            doc_id="doc1",
            chunk_index=0,
            strategy=ChunkingStrategy.FIXED,
            **meta_kwargs,
        ),
    )


@pytest.fixture
def chunks() -> list[Chunk]:
    return [
        _make_chunk("c1", "Photosynthesis converts light into chemical energy in plants.", subject="biology"),
        _make_chunk("c2", "Newton's three laws describe the motion of objects.", subject="physics"),
        _make_chunk("c3", "A quadratic equation has the form ax squared plus bx plus c equals zero.", subject="mathematics"),
        _make_chunk("c4", "Chlorophyll is the green pigment in plants that absorbs light.", subject="biology"),
        _make_chunk("c5", "The Calvin cycle fixes carbon dioxide into glucose.", subject="biology"),
    ]


# --------------------------------------------------------------------------
# FaissRetriever
# --------------------------------------------------------------------------


def test_faiss_retriever_retrieves_exact_match(chunks: list[Chunk]) -> None:
    embedder = HashEmbedder(dim=128)
    retriever = FaissRetriever(embedder=embedder, chunks=chunks)
    assert len(retriever) == 5

    query = Query(query_id="q1", text=chunks[0].text)  # query = chunk text verbatim
    result = retriever.retrieve(query, k=3)

    assert len(result.retrieved) == 3
    # Exact text match should rank first with score ~= 1.0 (normalized cosine).
    assert result.retrieved[0].chunk.chunk_id == "c1"
    assert result.retrieved[0].score > 0.99
    assert result.latency_ms is not None and result.latency_ms >= 0


def test_faiss_retriever_respects_metadata_filter(chunks: list[Chunk]) -> None:
    retriever = FaissRetriever(embedder=HashEmbedder(dim=128), chunks=chunks)
    query = Query(query_id="q", text="plants and energy")
    result = retriever.retrieve(query, k=5, metadata_filter={"subject": "biology"})
    assert all(r.chunk.metadata.subject == "biology" for r in result.retrieved)
    assert len(result.retrieved) <= 3  # only 3 biology chunks in fixture


def test_faiss_save_and_load_roundtrip(chunks: list[Chunk], tmp_path: Path) -> None:
    embedder = HashEmbedder(dim=128)
    retriever = FaissRetriever(embedder=embedder, chunks=chunks)

    save_dir = tmp_path / "index"
    retriever.save(save_dir)
    assert (save_dir / "index.faiss").exists()
    assert (save_dir / "chunks.jsonl").exists()
    assert (save_dir / "meta.json").exists()

    reloaded = FaissRetriever.load(save_dir, embedder=HashEmbedder(dim=128))
    assert len(reloaded) == len(chunks)

    query = Query(query_id="q", text=chunks[2].text)
    result = reloaded.retrieve(query, k=1)
    assert result.retrieved[0].chunk.chunk_id == "c3"


def test_faiss_empty_index_returns_empty() -> None:
    retriever = FaissRetriever(embedder=HashEmbedder(dim=64))
    query = Query(query_id="q", text="anything")
    result = retriever.retrieve(query, k=5)
    assert result.retrieved == []


# --------------------------------------------------------------------------
# BM25Retriever
# --------------------------------------------------------------------------


def test_bm25_finds_keyword_match(chunks: list[Chunk]) -> None:
    retriever = BM25Retriever(chunks=chunks)
    query = Query(query_id="q", text="chlorophyll")
    result = retriever.retrieve(query, k=3)
    # c4 mentions chlorophyll explicitly - should rank first.
    assert result.retrieved[0].chunk.chunk_id == "c4"


def test_bm25_metadata_filter(chunks: list[Chunk]) -> None:
    retriever = BM25Retriever(chunks=chunks)
    query = Query(query_id="q", text="motion objects laws")
    result = retriever.retrieve(query, k=5, metadata_filter={"subject": "physics"})
    assert len(result.retrieved) == 1
    assert result.retrieved[0].chunk.chunk_id == "c2"


# --------------------------------------------------------------------------
# HybridRetriever
# --------------------------------------------------------------------------


def test_hybrid_retriever_combines_both(chunks: list[Chunk]) -> None:
    embedder = HashEmbedder(dim=128)
    dense = FaissRetriever(embedder=embedder, chunks=chunks)
    sparse = BM25Retriever(chunks=chunks)
    hybrid = HybridRetriever(dense=dense, sparse=sparse, rrf_k=60)

    query = Query(query_id="q", text="chlorophyll light pigment")
    result = hybrid.retrieve(query, k=3)

    assert 1 <= len(result.retrieved) <= 3
    # c4 mentions chlorophyll and pigment - should surface in top results.
    returned_ids = {r.chunk.chunk_id for r in result.retrieved}
    assert "c4" in returned_ids


def test_hybrid_retriever_ranks_are_contiguous(chunks: list[Chunk]) -> None:
    embedder = HashEmbedder(dim=128)
    hybrid = HybridRetriever(
        dense=FaissRetriever(embedder=embedder, chunks=chunks),
        sparse=BM25Retriever(chunks=chunks),
    )
    result = hybrid.retrieve(Query(query_id="q", text="anything"), k=3)
    ranks = [r.rank for r in result.retrieved]
    assert ranks == list(range(len(ranks)))
