"""Abstract base class for document-type classifiers."""
from __future__ import annotations

from abc import ABC, abstractmethod

from edullm_pacer.schemas import Document, DocumentMetadata, DocumentType


class BaseClassifier(ABC):
    """Predicts the DocumentType of a document.

    All classifiers implement the same interface so the router can swap them.
    """

    @abstractmethod
    def classify(self, text: str, metadata: DocumentMetadata | None = None) -> DocumentType:
        """Classify raw text (+ optional metadata hints) into a DocumentType."""
        ...

    def classify_document(self, document: Document) -> DocumentType:
        """Convenience wrapper: classify a full Document object."""
        return self.classify(document.text, document.metadata)
