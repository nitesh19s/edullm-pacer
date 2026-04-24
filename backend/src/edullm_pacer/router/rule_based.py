"""Rule-based strategy router.

Maps DocumentType → ChunkingStrategy using an evidence-based lookup table.
The classifier is run first when doc_type is UNKNOWN.

Routing rationale
-----------------
* textbook_chapter  → educational   Richly structured; definitions/theorems/examples
                                     must be kept intact.
* lecture_notes     → recursive     Slide/bullet structure suits recursive paragraph
                                     splitting; no strict pedagogical pairs to preserve.
* past_paper        → educational   Q&A pairs must never be split.
* lesson_plan       → educational   Learning-objective → activity pairs must stay together.
* syllabus          → fixed         Tabular, uniform density; no pedagogical pairs.
* worked_example    → educational   Problem → solution pairs must stay together.
* reference_material→ semantic      Concept-dense, no instructional structure.
* unknown           → hybrid        Safe default: structural awareness + semantic sub-split.
"""
from __future__ import annotations

from edullm_pacer.schemas import ChunkingStrategy, Document, DocumentType

from .base import BaseRouter

# Canonical routing table — justification in module docstring above.
ROUTING_TABLE: dict[str, ChunkingStrategy] = {
    DocumentType.TEXTBOOK_CHAPTER:  ChunkingStrategy.EDUCATIONAL,
    DocumentType.LECTURE_NOTES:     ChunkingStrategy.RECURSIVE,
    DocumentType.PAST_PAPER:        ChunkingStrategy.EDUCATIONAL,
    DocumentType.LESSON_PLAN:       ChunkingStrategy.EDUCATIONAL,
    DocumentType.SYLLABUS:          ChunkingStrategy.FIXED,
    DocumentType.WORKED_EXAMPLE:    ChunkingStrategy.EDUCATIONAL,
    DocumentType.REFERENCE_MATERIAL: ChunkingStrategy.SEMANTIC,
    DocumentType.UNKNOWN:           ChunkingStrategy.HYBRID,
}


class RuleBasedRouter(BaseRouter):
    """Deterministic strategy router backed by ROUTING_TABLE.

    Args:
        classifier: optional BaseClassifier instance.  When the document's
            doc_type is UNKNOWN the classifier is invoked to infer the type
            before table lookup.  If no classifier is provided, UNKNOWN maps
            to HYBRID.
        overrides: dict mapping DocumentType → ChunkingStrategy to override
            individual routing decisions (useful for ablation experiments).
    """

    def __init__(
        self,
        classifier=None,  # BaseClassifier | None — lazy import avoids circular dep
        overrides: dict[str, ChunkingStrategy] | None = None,
    ) -> None:
        self.classifier = classifier
        self._table: dict[str, ChunkingStrategy] = {**ROUTING_TABLE, **(overrides or {})}

    def route(self, document: Document) -> ChunkingStrategy:
        doc_type_val = document.metadata.doc_type  # may be str or enum
        doc_type = DocumentType(doc_type_val) if isinstance(doc_type_val, str) else doc_type_val

        if doc_type == DocumentType.UNKNOWN and self.classifier is not None:
            doc_type = self.classifier.classify_document(document)

        return self._table.get(doc_type, ChunkingStrategy.HYBRID)

    def explain(self, document: Document) -> dict[str, str]:
        """Return a dict with routing decision and the reason. Useful for logging."""
        doc_type_val = document.metadata.doc_type
        doc_type = DocumentType(doc_type_val) if isinstance(doc_type_val, str) else doc_type_val
        inferred = False

        if doc_type == DocumentType.UNKNOWN and self.classifier is not None:
            doc_type = self.classifier.classify_document(document)
            inferred = True

        strategy = self._table.get(doc_type, ChunkingStrategy.HYBRID)
        return {
            "doc_type": doc_type.value,
            "strategy": strategy.value,
            "inferred": str(inferred),
            "source": "classifier" if inferred else "metadata",
        }

    def __repr__(self) -> str:  # pragma: no cover
        clf_name = type(self.classifier).__name__ if self.classifier else "None"
        return f"RuleBasedRouter(classifier={clf_name})"
