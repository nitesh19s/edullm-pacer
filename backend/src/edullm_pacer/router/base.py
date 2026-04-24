"""Abstract base class for PACER strategy routers."""
from __future__ import annotations

from abc import ABC, abstractmethod

from edullm_pacer.schemas import ChunkingStrategy, Document


class BaseRouter(ABC):
    """Maps a Document to the optimal ChunkingStrategy.

    Implementations may be rule-based (lookup table) or learned (sklearn model).
    """

    @abstractmethod
    def route(self, document: Document) -> ChunkingStrategy:
        """Return the recommended chunking strategy for this document."""
        ...

    def route_batch(self, documents: list[Document]) -> list[ChunkingStrategy]:
        """Route a list of documents; override for batched efficiency."""
        return [self.route(doc) for doc in documents]
