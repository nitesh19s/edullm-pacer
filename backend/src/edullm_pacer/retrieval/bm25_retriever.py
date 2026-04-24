"""BM25 lexical retriever.

Classic lexical baseline. Strong on queries with exact terminology matches
(e.g., named concepts, proper nouns, specific formulas) where dense retrievers
sometimes miss. Used alone as a baseline and combined with FAISS in the hybrid
retriever for best-of-both-worlds performance.
"""
from __future__ import annotations

import re
import time
from typing import TYPE_CHECKING

from edullm_pacer.schemas import Chunk, Query, RetrievalResult, RetrievedChunk
from edullm_pacer.utils.logging import get_logger

if TYPE_CHECKING:
    from rank_bm25 import BM25Okapi

logger = get_logger(__name__)

_TOKEN_RE = re.compile(r"\b[\w']+\b", re.UNICODE)


def _tokenize(text: str) -> list[str]:
    """Lightweight word tokenizer. Lowercase, unicode-aware."""
    return _TOKEN_RE.findall(text.lower())


def _require_bm25():  # type: ignore[no-untyped-def]
    try:
        from rank_bm25 import BM25Okapi
        return BM25Okapi
    except ImportError as e:
        raise ImportError(
            "BM25Retriever requires rank_bm25. Install: pip install rank-bm25"
        ) from e


class BM25Retriever:
    """BM25 sparse retriever."""

    def __init__(self, chunks: list[Chunk] | None = None) -> None:
        self._chunks: list[Chunk] = []
        self._bm25: BM25Okapi | None = None
        if chunks:
            self.add_chunks(chunks)

    def add_chunks(self, chunks: list[Chunk]) -> None:
        """Rebuild the BM25 index with the existing + new chunks."""
        BM25Okapi = _require_bm25()  # noqa: N806
        self._chunks.extend(chunks)
        tokenized = [_tokenize(c.text) for c in self._chunks]
        self._bm25 = BM25Okapi(tokenized)
        logger.info(f"BM25 indexed {len(self._chunks):,} chunks")

    def retrieve(
        self,
        query: Query,
        k: int = 10,
        metadata_filter: dict | None = None,
    ) -> RetrievalResult:
        if self._bm25 is None or not self._chunks:
            return RetrievalResult(query=query, retrieved=[], latency_ms=0.0)

        start = time.perf_counter()
        query_tokens = _tokenize(query.text)
        scores = self._bm25.get_scores(query_tokens)

        # Over-retrieve if filtering.
        search_k = min(k * 3 if metadata_filter else k, len(self._chunks))
        top_indices = scores.argsort()[::-1][:search_k]

        retrieved: list[RetrievedChunk] = []
        rank = 0
        for idx in top_indices:
            chunk = self._chunks[idx]
            if metadata_filter and not _matches_filter(chunk, metadata_filter):
                continue
            retrieved.append(
                RetrievedChunk(chunk=chunk, score=float(scores[idx]), rank=rank)
            )
            rank += 1
            if len(retrieved) >= k:
                break

        elapsed_ms = (time.perf_counter() - start) * 1000.0
        return RetrievalResult(query=query, retrieved=retrieved, latency_ms=elapsed_ms)

    def __len__(self) -> int:
        return len(self._chunks)


def _matches_filter(chunk: Chunk, filt: dict) -> bool:
    meta = chunk.metadata
    for key, expected in filt.items():
        actual = getattr(meta, key, None)
        actual_val = actual.value if hasattr(actual, "value") else actual
        if actual_val != expected:
            return False
    return True
