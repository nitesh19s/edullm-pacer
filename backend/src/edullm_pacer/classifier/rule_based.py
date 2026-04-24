"""Rule-based document-type classifier.

Uses weighted regex pattern matching against known structural markers of each
educational document type.  No ML dependency — works offline, instant.

Score per type = (sum of matched-pattern weights) / (sum of all weights for that type).
The type with the highest score wins if it exceeds MIN_CONFIDENCE; otherwise UNKNOWN.
"""
from __future__ import annotations

import re
from typing import Any

from edullm_pacer.schemas import DocumentMetadata, DocumentType

from .base import BaseClassifier

# --------------------------------------------------------------------------
# Pattern banks — (pattern, weight)
# --------------------------------------------------------------------------

_PATTERNS: dict[DocumentType, list[tuple[str, float]]] = {
    DocumentType.PAST_PAPER: [
        (r"\b(question\s+paper|exam|examination)\b", 2.0),
        (r"\b(max(?:imum)?\s+marks?)\b", 2.0),
        (r"\b(time\s+allowed|time\s*:\s*\d+\s*(?:hours?|hrs?))\b", 2.0),
        (r"\(\d+\s*marks?\)", 1.5),              # "(2 marks)"
        (r"^\s*(?:q|question)\.?\s*\d+\b", 1.0),
        (r"\b(?:section|part)\s+[A-Z]\b", 1.0),
        (r"\b(?:answer\s+(?:all|any)\s+(?:questions?|of))\b", 1.5),
        (r"\b(?:roll\s+no\.?|registration\s+no\.?)\b", 1.0),
    ],
    DocumentType.LESSON_PLAN: [
        (r"\blesson\s+plan\b", 3.0),
        (r"\b(?:materials?\s+(?:needed|required)|resources?\s+(?:needed|required))\b", 2.0),
        (r"\bduration\s*:", 1.5),
        (r"\b(?:learning\s+(?:outcomes?|objectives?))\b", 1.5),
        (r"\bassessment\s*(?:criteria|method)?\b", 1.0),
        (r"\b(?:prior\s+knowledge|prerequisite\s+knowledge)\b", 1.5),
        (r"\b(?:teacher\s+activity|student\s+activity)\b", 2.0),
        (r"\b(?:introduction|development|closure)\s*\d*\s*:", 1.0),
    ],
    DocumentType.SYLLABUS: [
        (r"\b(?:syllabus|course\s+outline|curriculum)\b", 3.0),
        (r"\b(?:periods?|lectures?)\s*:\s*\d+", 2.0),
        (r"\b(?:marks?\s+distribution|weightage|marks?\s+allotted)\b", 2.0),
        (r"\bunit\s+[ivxlIVXL\d]+\s*[.:\-]\s*[A-Z]", 1.5),
        (r"\b(?:prescribed|reference)\s+books?\b", 1.5),
        (r"\b(?:internal\s+assessment|external\s+exam)\b", 1.5),
        (r"\b(?:course\s+(?:code|credits?|duration))\b", 1.0),
    ],
    DocumentType.WORKED_EXAMPLE: [
        (r"^\s*(?:example|ex\.?)\s+\d+\s*[:.]\s*", 2.5),
        (r"^\s*(?:given|find|required|to\s+find)\s*:", 2.0),
        (r"^\s*(?:solution|sol\.?)\s*[:\-]", 2.0),
        (r"\bstep\s+\d+\s*:", 1.5),
        (r"^\s*(?:answer|ans\.?)\s*[:\-=]", 1.5),
        (r"^\s*[∴∵]|^\s*therefore\b|^\s*hence\b", 1.0),
        (r"\b(?:substituting|simplifying|solving)\b", 1.0),
    ],
    DocumentType.LECTURE_NOTES: [
        (r"\bslide\s+\d+\b", 2.5),
        (r"\blecture\s+\d+\b", 2.0),
        (r"\b(?:today.?s?\s+(?:topic|agenda|outline))\b", 2.0),
        (r"\bkey\s+takeaway\b", 1.5),
        (r"^\s*[\*\-•]\s+[A-Z]", 1.0),           # bullet points
        (r"\b(?:recap|last\s+lecture|previous\s+class)\b", 1.5),
        (r"\breferences?\s*[:\[]\s*\d+", 1.0),
    ],
    DocumentType.TEXTBOOK_CHAPTER: [
        (r"^\s*chapter\s+\d+\b", 3.0),
        (r"\b(?:definition|def\.?)\s*[:\-]", 2.0),
        (r"\b(?:theorem|lemma|proposition|corollary|axiom|postulate)\b", 2.0),
        (r"\b(?:exercises?|practice\s+problems?)\s*\d*\s*[:\-]", 1.5),
        (r"\b(?:summary|key\s+points?|points?\s+to\s+remember)\b", 1.5),
        (r"\b(?:fig(?:ure)?\.?\s*\d+|table\s+\d+)\b", 1.0),
        (r"\b(?:review\s+questions?|self[\s-]+assessment)\b", 1.0),
        (r"\b(?:introduction|overview)\s*\n", 1.0),
    ],
    DocumentType.REFERENCE_MATERIAL: [
        (r"\b(?:index|glossary|bibliography|references)\b", 2.0),
        (r"\bappendix\s+[A-Z\d]\b", 2.0),
        (r"\b(?:see\s+also|cf\.|ibid\.)\b", 1.5),
        (r"^\s*[A-Z][a-z]+,\s+[A-Z]\.\s", 1.5),  # author citations
        (r"\b(?:doi|isbn|issn)\b", 2.0),
        (r"\b(?:et\s+al\.|op\.\s*cit\.)\b", 1.0),
    ],
}

# Minimum confidence to assign a type (vs UNKNOWN).
_MIN_CONFIDENCE = 0.15


class RuleBasedClassifier(BaseClassifier):
    """Fast, offline document-type classifier driven by weighted regex patterns.

    Args:
        min_confidence: minimum score threshold to assign a type; below this
            UNKNOWN is returned.
        sample_chars: how many characters of the document to scan (default: first
            4 000 characters — enough to catch structural markers in any header).
    """

    def __init__(
        self,
        min_confidence: float = _MIN_CONFIDENCE,
        sample_chars: int = 4_000,
    ) -> None:
        self.min_confidence = min_confidence
        self.sample_chars = sample_chars
        # Pre-compile all patterns.
        self._compiled: dict[DocumentType, list[tuple[re.Pattern[str], float]]] = {
            doc_type: [
                (re.compile(pat, re.IGNORECASE | re.MULTILINE), weight)
                for pat, weight in patterns
            ]
            for doc_type, patterns in _PATTERNS.items()
        }

    def classify(
        self,
        text: str,
        metadata: DocumentMetadata | None = None,
    ) -> DocumentType:
        """Return the most likely DocumentType for the given text."""
        # Honour explicit metadata hint.
        if metadata is not None and metadata.doc_type != DocumentType.UNKNOWN:
            return DocumentType(metadata.doc_type)

        sample = text[: self.sample_chars]
        scores = self._score(sample)
        if not scores:
            return DocumentType.UNKNOWN

        best_type, best_score = max(scores.items(), key=lambda kv: kv[1])
        return best_type if best_score >= self.min_confidence else DocumentType.UNKNOWN

    def scores(self, text: str) -> dict[DocumentType, float]:
        """Return confidence scores for all types (useful for inspection / calibration)."""
        return self._score(text[: self.sample_chars])

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _score(self, sample: str) -> dict[DocumentType, float]:
        result: dict[DocumentType, float] = {}
        for doc_type, patterns in self._compiled.items():
            total_weight = sum(w for _, w in patterns)
            matched_weight: float = 0.0
            for pattern, weight in patterns:
                if pattern.search(sample):
                    matched_weight += weight
            result[doc_type] = matched_weight / total_weight if total_weight > 0 else 0.0
        return result

    def __repr__(self) -> str:  # pragma: no cover
        return f"RuleBasedClassifier(min_confidence={self.min_confidence})"


def _coerce(value: Any) -> dict[str, Any]:  # noqa: ANN401 — internal helper
    return value if isinstance(value, dict) else {}
