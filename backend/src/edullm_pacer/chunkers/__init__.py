"""Chunking strategies for educational content.

Public API:
    - BaseChunker: abstract base for custom chunkers
    - FixedSizeChunker: token-based sliding window
    - RecursiveChunker: LangChain-style recursive splitter (strong 2026 baseline)
    - SemanticChunker: embedding-based semantic splitter
    - EducationalChunker: pedagogy-aware structural splitter (PACER component)
    - HybridChunker: educational + semantic combined
    - get_chunker(strategy): factory returning a chunker instance
"""
from edullm_pacer.chunkers.base import BaseChunker
from edullm_pacer.chunkers.educational import EducationalChunker
from edullm_pacer.chunkers.fixed import FixedSizeChunker
from edullm_pacer.chunkers.hybrid import HybridChunker
from edullm_pacer.chunkers.recursive import RecursiveChunker
from edullm_pacer.chunkers.registry import (
    available_strategies,
    get_chunker,
    register_chunker,
)
from edullm_pacer.chunkers.semantic import SemanticChunker

__all__ = [
    "BaseChunker",
    "EducationalChunker",
    "FixedSizeChunker",
    "HybridChunker",
    "RecursiveChunker",
    "SemanticChunker",
    "available_strategies",
    "get_chunker",
    "register_chunker",
]
