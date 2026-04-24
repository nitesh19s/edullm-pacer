"""Base class for all chunking strategies.

Every chunker implements the same interface:
    chunker.chunk(document) -> list[Chunk]

This makes strategies swappable and enables the router to pick between them.
"""
from __future__ import annotations

import hashlib
from abc import ABC, abstractmethod

from edullm_pacer.schemas import Chunk, ChunkingStrategy, ChunkMetadata, Document


class BaseChunker(ABC):
    """Abstract base class for chunking strategies."""

    strategy: ChunkingStrategy  # must be set by each subclass

    def __init__(self, chunk_size: int = 512, chunk_overlap: int = 64) -> None:
        if chunk_overlap >= chunk_size:
            raise ValueError("chunk_overlap must be less than chunk_size")
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    @abstractmethod
    def chunk(self, document: Document) -> list[Chunk]:
        """Split a document into chunks. Must be implemented by each subclass."""
        ...

    # --- shared helpers ---

    def _make_chunk_id(self, doc_id: str, idx: int, text: str) -> str:
        """Deterministic chunk ID: doc_id + index + short hash of text."""
        h = hashlib.md5(text.encode("utf-8")).hexdigest()[:8]
        return f"{doc_id}::chunk_{idx:05d}::{h}"

    def _make_metadata(
        self,
        document: Document,
        chunk_index: int,
        char_start: int | None = None,
        char_end: int | None = None,
    ) -> ChunkMetadata:
        """Inherit relevant fields from document metadata."""
        return ChunkMetadata(
            doc_id=document.doc_id,
            chunk_index=chunk_index,
            strategy=self.strategy,
            subject=document.metadata.subject,
            grade=document.metadata.grade,
            doc_type=document.metadata.doc_type,
            char_start=char_start,
            char_end=char_end,
        )

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}("
            f"strategy={self.strategy.value}, "
            f"chunk_size={self.chunk_size}, "
            f"chunk_overlap={self.chunk_overlap})"
        )
