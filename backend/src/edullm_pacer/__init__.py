"""PACER — Pedagogy-Aware Adaptive Chunking for Educational RAG.

Top-level package.
"""
from __future__ import annotations

__version__ = "0.1.0"
__author__ = "Nitesh Sharma"

from edullm_pacer.config import settings
from edullm_pacer.schemas import (
    BloomLevel,
    Chunk,
    ChunkingStrategy,
    ChunkMetadata,
    Document,
    DocumentMetadata,
    DocumentType,
    GradeLevel,
    Query,
    RetrievalResult,
)

__all__ = [
    "BloomLevel",
    "Chunk",
    "ChunkMetadata",
    "ChunkingStrategy",
    "Document",
    "DocumentMetadata",
    "DocumentType",
    "GradeLevel",
    "Query",
    "RetrievalResult",
    "__version__",
    "settings",
]
