"""Dense retriever backed by FAISS.

Indexes a collection of chunks using an Embedder, then retrieves the top-k
most similar chunks for a query. Uses cosine similarity (inner product on
L2-normalized vectors) so it works with any Embedder.

Persists the index + chunk metadata so experiments are reproducible.
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import TYPE_CHECKING

import numpy as np

from edullm_pacer.embeddings.base import Embedder
from edullm_pacer.schemas import Chunk, Query, RetrievalResult, RetrievedChunk
from edullm_pacer.utils.logging import get_logger

if TYPE_CHECKING:
    import faiss  # type: ignore[import-untyped]

logger = get_logger(__name__)


def _require_faiss():  # type: ignore[no-untyped-def]
    try:
        import faiss
        return faiss
    except ImportError as e:
        raise ImportError(
            "FaissRetriever requires faiss. Install with: pip install faiss-cpu"
        ) from e


class FaissRetriever:
    """In-memory FAISS-based dense retriever.

    Uses IndexFlatIP (exact cosine via inner product on normalized vectors).
    For < 100k chunks this is fast enough and gives reference-quality results.
    For larger corpora swap in IndexHNSWFlat or IndexIVFFlat.

    Args:
        embedder: any Embedder implementation.
        chunks: optional list to build the index from at construction time.
    """

    def __init__(self, embedder: Embedder, chunks: list[Chunk] | None = None) -> None:
        self.embedder = embedder
        self._chunks: list[Chunk] = []
        self._id_to_index: dict[str, int] = {}
        self._index = None  # faiss.Index
        if chunks:
            self.add_chunks(chunks)

    # --- Indexing ---

    def add_chunks(
        self,
        chunks: list[Chunk],
        batch_size: int = 64,
        show_progress: bool = False,
    ) -> None:
        """Embed and add chunks to the index."""
        if not chunks:
            return

        faiss = _require_faiss()
        texts = [c.text for c in chunks]
        vectors = self.embedder.encode(
            texts, batch_size=batch_size, normalize=True, show_progress=show_progress,
        )

        if self._index is None:
            self._index = faiss.IndexFlatIP(self.embedder.dim)

        start = len(self._chunks)
        self._index.add(vectors.astype(np.float32))
        for i, chunk in enumerate(chunks):
            self._id_to_index[chunk.chunk_id] = start + i
            self._chunks.append(chunk)

        logger.info(
            f"Indexed {len(chunks):,} chunks "
            f"(index size: {self._index.ntotal:,}, dim: {self.embedder.dim})"
        )

    # --- Retrieval ---

    def retrieve(
        self,
        query: Query,
        k: int = 10,
        metadata_filter: dict | None = None,
    ) -> RetrievalResult:
        """Retrieve top-k chunks for a query.

        Args:
            query: the Query object.
            k: number of chunks to return.
            metadata_filter: optional dict like {"subject": "biology"}; chunks
                whose metadata doesn't match are dropped after retrieval.
        """
        if self._index is None or self._index.ntotal == 0:
            return RetrievalResult(query=query, retrieved=[], latency_ms=0.0)

        start = time.perf_counter()
        query_vec = self.embedder.encode(
            [query.text], normalize=True, show_progress=False,
        ).astype(np.float32)

        # Over-retrieve if filtering to avoid returning fewer than k.
        search_k = min(k * 3 if metadata_filter else k, self._index.ntotal)
        scores, indices = self._index.search(query_vec, search_k)

        retrieved: list[RetrievedChunk] = []
        rank = 0
        for score, idx in zip(scores[0], indices[0], strict=True):
            if idx < 0:
                continue
            chunk = self._chunks[idx]
            if metadata_filter and not _matches_filter(chunk, metadata_filter):
                continue
            retrieved.append(RetrievedChunk(chunk=chunk, score=float(score), rank=rank))
            rank += 1
            if len(retrieved) >= k:
                break

        elapsed_ms = (time.perf_counter() - start) * 1000.0
        return RetrievalResult(query=query, retrieved=retrieved, latency_ms=elapsed_ms)

    # --- Persistence ---

    def save(self, directory: str | Path) -> None:
        """Persist the FAISS index + chunk metadata to a directory."""
        faiss = _require_faiss()
        directory = Path(directory)
        directory.mkdir(parents=True, exist_ok=True)

        faiss.write_index(self._index, str(directory / "index.faiss"))
        with (directory / "chunks.jsonl").open("w", encoding="utf-8") as f:
            for chunk in self._chunks:
                f.write(chunk.model_dump_json() + "\n")
        meta = {
            "embedder_name": self.embedder.name,
            "embedder_dim": self.embedder.dim,
            "n_chunks": len(self._chunks),
        }
        (directory / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
        logger.info(f"Saved retriever to {directory}")

    @classmethod
    def load(cls, directory: str | Path, embedder: Embedder) -> FaissRetriever:
        """Load an index from disk. The caller supplies the Embedder."""
        faiss = _require_faiss()
        directory = Path(directory)

        meta_path = directory / "meta.json"
        if not meta_path.exists():
            raise FileNotFoundError(f"No retriever found at {directory}")

        meta = json.loads(meta_path.read_text())
        if meta["embedder_dim"] != embedder.dim:
            raise ValueError(
                f"Embedder dim mismatch: index has {meta['embedder_dim']}, "
                f"embedder has {embedder.dim}"
            )

        retriever = cls(embedder=embedder)
        retriever._index = faiss.read_index(str(directory / "index.faiss"))

        with (directory / "chunks.jsonl").open("r", encoding="utf-8") as f:
            for i, line in enumerate(f):
                if not line.strip():
                    continue
                chunk = Chunk.model_validate_json(line)
                retriever._chunks.append(chunk)
                retriever._id_to_index[chunk.chunk_id] = i

        logger.info(f"Loaded retriever from {directory} ({len(retriever._chunks):,} chunks)")
        return retriever

    def __len__(self) -> int:
        return len(self._chunks)


def _matches_filter(chunk: Chunk, filt: dict) -> bool:
    """True if the chunk's metadata matches all key/value pairs in filt."""
    meta = chunk.metadata
    for key, expected in filt.items():
        actual = getattr(meta, key, None)
        actual_val = actual.value if hasattr(actual, "value") else actual
        if actual_val != expected:
            return False
    return True
