"""Registry for chunking strategies.

Provides `get_chunker(strategy)` so consumers don't need to import each chunker class.
"""
from __future__ import annotations

from typing import Any

from edullm_pacer.chunkers.base import BaseChunker
from edullm_pacer.chunkers.educational import EducationalChunker
from edullm_pacer.chunkers.fixed import FixedSizeChunker
from edullm_pacer.chunkers.hybrid import HybridChunker
from edullm_pacer.chunkers.recursive import RecursiveChunker
from edullm_pacer.chunkers.semantic import SemanticChunker
from edullm_pacer.schemas import ChunkingStrategy

_REGISTRY: dict[ChunkingStrategy, type[BaseChunker]] = {
    ChunkingStrategy.FIXED: FixedSizeChunker,
    ChunkingStrategy.RECURSIVE: RecursiveChunker,
    ChunkingStrategy.SEMANTIC: SemanticChunker,
    ChunkingStrategy.EDUCATIONAL: EducationalChunker,
    ChunkingStrategy.HYBRID: HybridChunker,
}


def register_chunker(strategy: ChunkingStrategy, chunker_cls: type[BaseChunker]) -> None:
    """Register a chunker class for a strategy."""
    _REGISTRY[strategy] = chunker_cls


def get_chunker(strategy: ChunkingStrategy | str, **kwargs: Any) -> BaseChunker:
    """Instantiate a chunker by strategy name.

    Args:
        strategy: chunking strategy enum or string.
        **kwargs: passed to the chunker constructor.

    Raises:
        KeyError: if strategy is not registered.
    """
    if isinstance(strategy, str):
        strategy = ChunkingStrategy(strategy)
    if strategy not in _REGISTRY:
        available = ", ".join(s.value for s in _REGISTRY)
        raise KeyError(f"Chunker '{strategy.value}' not registered. Available: {available}")
    return _REGISTRY[strategy](**kwargs)


def available_strategies() -> list[ChunkingStrategy]:
    return list(_REGISTRY.keys())
