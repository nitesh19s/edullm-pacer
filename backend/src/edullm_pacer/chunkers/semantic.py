"""Semantic similarity chunker.

Splits text at points of maximum embedding distance between adjacent sentences.
Inspired by Kamradt's semantic splitter, the LlamaIndex SemanticSplitterNodeParser,
and Max-Min semantic chunking (Kiss et al., 2025).

Note: 2025-26 benchmarks (Vectara NAACL 2025, FloTorch 2026) show semantic
chunking often underperforms recursive chunking on end-to-end accuracy due to
tiny fragment sizes. We include a `min_chunk_chars` floor to address this.

Usage requires sentence-transformers. Lazy-imported so the package still loads
without it, and a clear error is raised only when you actually instantiate this chunker.
"""
from __future__ import annotations

import re
from typing import TYPE_CHECKING

import numpy as np

from edullm_pacer.chunkers.base import BaseChunker
from edullm_pacer.schemas import Chunk, ChunkingStrategy, Document

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer

_SENTENCE_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z\u0900-\u097f])")


def _split_sentences(text: str) -> list[str]:
    """Lightweight sentence splitter. Good enough for English + Hindi."""
    sentences = [s.strip() for s in _SENTENCE_RE.split(text) if s.strip()]
    return sentences or [text]


class SemanticChunker(BaseChunker):
    """Embedding-based semantic chunker with a size floor.

    Args:
        chunk_size: target chunk size in characters (soft limit).
        chunk_overlap: characters of overlap between chunks.
        min_chunk_chars: minimum size; chunks smaller than this are merged.
        breakpoint_percentile: similarity-distance percentile that triggers a split.
        embedding_model_name: sentence-transformer model to use.
        embedding_model: pre-loaded model to reuse across chunker instances.
    """

    strategy = ChunkingStrategy.SEMANTIC

    def __init__(
        self,
        chunk_size: int = 2000,
        chunk_overlap: int = 0,
        min_chunk_chars: int = 300,
        breakpoint_percentile: float = 85.0,
        embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        embedding_model: SentenceTransformer | None = None,
    ) -> None:
        super().__init__(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        self.min_chunk_chars = min_chunk_chars
        self.breakpoint_percentile = breakpoint_percentile
        self.embedding_model_name = embedding_model_name
        self._model = embedding_model

    def _get_model(self) -> SentenceTransformer:
        if self._model is not None:
            return self._model
        try:
            from sentence_transformers import SentenceTransformer
        except ImportError as e:
            raise ImportError(
                "SemanticChunker requires sentence-transformers. "
                "Install with: pip install sentence-transformers"
            ) from e
        self._model = SentenceTransformer(self.embedding_model_name)
        return self._model

    def chunk(self, document: Document) -> list[Chunk]:
        if not document.text.strip():
            return []

        sentences = _split_sentences(document.text)
        if len(sentences) < 3:
            # Too few sentences for semantic splitting; fall back to one chunk.
            return [self._single_chunk(document, document.text)]

        model = self._get_model()
        embeddings = model.encode(sentences, convert_to_numpy=True, show_progress_bar=False)
        distances = self._cosine_distances(embeddings)
        breakpoints = self._select_breakpoints(distances)

        # Build chunks from sentence groups.
        groups = self._group_sentences(sentences, breakpoints)
        groups = self._enforce_min_size(groups)

        chunks: list[Chunk] = []
        cursor = 0
        for idx, text in enumerate(groups):
            start = document.text.find(text[:50], cursor) if text else cursor
            start = max(start, 0)
            end = start + len(text)
            cursor = end
            chunk_id = self._make_chunk_id(document.doc_id, idx, text)
            metadata = self._make_metadata(document, idx, char_start=start, char_end=end)
            chunks.append(Chunk(chunk_id=chunk_id, text=text, metadata=metadata))
        return chunks

    def _single_chunk(self, document: Document, text: str) -> Chunk:
        metadata = self._make_metadata(document, 0, char_start=0, char_end=len(text))
        return Chunk(
            chunk_id=self._make_chunk_id(document.doc_id, 0, text),
            text=text,
            metadata=metadata,
        )

    @staticmethod
    def _cosine_distances(embeddings: np.ndarray) -> np.ndarray:
        """1 - cosine similarity for consecutive sentence pairs."""
        a = embeddings[:-1]
        b = embeddings[1:]
        num = (a * b).sum(axis=1)
        denom = np.linalg.norm(a, axis=1) * np.linalg.norm(b, axis=1) + 1e-9
        cos_sim = num / denom
        return 1.0 - cos_sim

    def _select_breakpoints(self, distances: np.ndarray) -> list[int]:
        """Indices after which a new chunk begins."""
        if len(distances) == 0:
            return []
        threshold = float(np.percentile(distances, self.breakpoint_percentile))
        return [i for i, d in enumerate(distances) if d > threshold]

    @staticmethod
    def _group_sentences(sentences: list[str], breakpoints: list[int]) -> list[str]:
        groups: list[str] = []
        start = 0
        for bp in breakpoints:
            groups.append(" ".join(sentences[start:bp + 1]))
            start = bp + 1
        if start < len(sentences):
            groups.append(" ".join(sentences[start:]))
        return [g for g in groups if g]

    def _enforce_min_size(self, groups: list[str]) -> list[str]:
        """Merge groups smaller than min_chunk_chars with their neighbor."""
        if not groups:
            return groups
        merged: list[str] = [groups[0]]
        for g in groups[1:]:
            if len(merged[-1]) < self.min_chunk_chars:
                merged[-1] = f"{merged[-1]} {g}"
            elif len(g) < self.min_chunk_chars:
                merged[-1] = f"{merged[-1]} {g}"
            else:
                merged.append(g)
        return merged
