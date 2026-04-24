"""Hybrid chunker.

Two-pass strategy:
  1. Educational pass: identify pedagogical units (never split across their boundaries).
  2. Semantic pass: within each large unit, split at semantic boundaries.

This combines the strengths of structure-awareness (educational) with
semantic coherence (semantic chunker) and is the strongest baseline in our
strategy bank aside from PACER itself.
"""
from __future__ import annotations

from edullm_pacer.chunkers.base import BaseChunker
from edullm_pacer.chunkers.educational import _find_unit_boundaries
from edullm_pacer.chunkers.semantic import SemanticChunker
from edullm_pacer.schemas import Chunk, ChunkingStrategy, Document


class HybridChunker(BaseChunker):
    """Educational-first, semantic-within.

    Args:
        chunk_size: target chunk size in characters.
        chunk_overlap: overlap between chunks.
        min_semantic_split_chars: units larger than this get semantic sub-splitting.
        breakpoint_percentile: percentile for semantic splits.
        embedding_model_name: sentence-transformer for semantic pass.
    """

    strategy = ChunkingStrategy.HYBRID

    def __init__(
        self,
        chunk_size: int = 2000,
        chunk_overlap: int = 100,
        min_semantic_split_chars: int = 3500,
        breakpoint_percentile: float = 85.0,
        embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
    ) -> None:
        super().__init__(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        self.min_semantic_split_chars = min_semantic_split_chars
        self._semantic = SemanticChunker(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            breakpoint_percentile=breakpoint_percentile,
            embedding_model_name=embedding_model_name,
        )

    def chunk(self, document: Document) -> list[Chunk]:
        if not document.text.strip():
            return []

        units = _find_unit_boundaries(document.text)
        chunks: list[Chunk] = []
        idx = 0

        for unit in units:
            if len(unit.text) <= self.chunk_size:
                chunks.append(self._wrap_unit(document, unit, idx))
                idx += 1
                continue

            if len(unit.text) < self.min_semantic_split_chars:
                chunks.append(self._wrap_unit(document, unit, idx))
                idx += 1
                continue

            # Large unit: semantic sub-split.
            sub_doc = Document(
                doc_id=f"{document.doc_id}__unit_{idx}",
                text=unit.text,
                metadata=document.metadata,
            )
            sub_chunks = self._semantic.chunk(sub_doc)
            for sc in sub_chunks:
                chunk_id = self._make_chunk_id(document.doc_id, idx, sc.text)
                metadata = self._make_metadata(document, idx)
                metadata.extra["unit_kind"] = unit.kind
                metadata.extra["parent_unit"] = idx
                metadata.pedagogical_boundary_preserved = True
                chunks.append(Chunk(chunk_id=chunk_id, text=sc.text, metadata=metadata))
                idx += 1

        return chunks

    def _wrap_unit(self, document: Document, unit, idx: int) -> Chunk:  # type: ignore[no-untyped-def]
        chunk_id = self._make_chunk_id(document.doc_id, idx, unit.text)
        metadata = self._make_metadata(document, idx, char_start=unit.start, char_end=unit.end)
        metadata.extra["unit_kind"] = unit.kind
        metadata.pedagogical_boundary_preserved = True
        return Chunk(chunk_id=chunk_id, text=unit.text, metadata=metadata)
