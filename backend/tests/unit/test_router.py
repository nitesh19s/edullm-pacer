"""Tests for the rule-based strategy router."""
from __future__ import annotations

import pytest

from edullm_pacer.classifier import RuleBasedClassifier
from edullm_pacer.router import ROUTING_TABLE, RuleBasedRouter
from edullm_pacer.schemas import (
    ChunkingStrategy,
    Document,
    DocumentMetadata,
    DocumentType,
)


def _make_doc(doc_type: DocumentType) -> Document:
    meta = DocumentMetadata(doc_type=doc_type)
    return Document(doc_id=f"test_{doc_type.value}", text="sample", metadata=meta)


# ---------------------------------------------------------------------------
# Routing table coverage
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "doc_type, expected_strategy",
    [
        (DocumentType.TEXTBOOK_CHAPTER, ChunkingStrategy.EDUCATIONAL),
        (DocumentType.LECTURE_NOTES, ChunkingStrategy.RECURSIVE),
        (DocumentType.PAST_PAPER, ChunkingStrategy.EDUCATIONAL),
        (DocumentType.LESSON_PLAN, ChunkingStrategy.EDUCATIONAL),
        (DocumentType.SYLLABUS, ChunkingStrategy.FIXED),
        (DocumentType.WORKED_EXAMPLE, ChunkingStrategy.EDUCATIONAL),
        (DocumentType.REFERENCE_MATERIAL, ChunkingStrategy.SEMANTIC),
        (DocumentType.UNKNOWN, ChunkingStrategy.HYBRID),
    ],
)
def test_routing_table(doc_type, expected_strategy):
    router = RuleBasedRouter()
    doc = _make_doc(doc_type)
    assert router.route(doc) == expected_strategy


# ---------------------------------------------------------------------------
# Classifier integration
# ---------------------------------------------------------------------------

TEXTBOOK_TEXT = """
Chapter 5: Gravitation
Definition: Gravitational force is the attractive force between masses.
Theorem: Newton's Law of Gravitation — F = Gm1m2/r²
Exercises: 1. Find the force between two 10 kg bodies.
Summary: Gravity acts between all masses.
"""


def test_router_uses_classifier_when_unknown():
    clf = RuleBasedClassifier()
    router = RuleBasedRouter(classifier=clf)

    # Document with UNKNOWN type but textbook-like text.
    doc = Document(
        doc_id="d1",
        text=TEXTBOOK_TEXT,
        metadata=DocumentMetadata(doc_type=DocumentType.UNKNOWN),
    )
    strategy = router.route(doc)
    # Classifier should infer TEXTBOOK_CHAPTER → educational.
    assert strategy == ChunkingStrategy.EDUCATIONAL


def test_router_without_classifier_unknown_is_hybrid():
    router = RuleBasedRouter(classifier=None)
    doc = _make_doc(DocumentType.UNKNOWN)
    assert router.route(doc) == ChunkingStrategy.HYBRID


# ---------------------------------------------------------------------------
# Overrides
# ---------------------------------------------------------------------------


def test_routing_override():
    overrides = {DocumentType.SYLLABUS: ChunkingStrategy.EDUCATIONAL}
    router = RuleBasedRouter(overrides=overrides)
    doc = _make_doc(DocumentType.SYLLABUS)
    assert router.route(doc) == ChunkingStrategy.EDUCATIONAL


# ---------------------------------------------------------------------------
# Explain
# ---------------------------------------------------------------------------


def test_explain_returns_dict_with_required_keys():
    router = RuleBasedRouter()
    doc = _make_doc(DocumentType.TEXTBOOK_CHAPTER)
    info = router.explain(doc)
    assert {"doc_type", "strategy", "inferred", "source"} <= set(info.keys())
    assert info["source"] == "metadata"


def test_explain_marks_inferred_when_classifier_used():
    clf = RuleBasedClassifier()
    router = RuleBasedRouter(classifier=clf)
    doc = Document(
        doc_id="d2",
        text=TEXTBOOK_TEXT,
        metadata=DocumentMetadata(doc_type=DocumentType.UNKNOWN),
    )
    info = router.explain(doc)
    assert info["source"] == "classifier"
    assert info["inferred"] == "True"


# ---------------------------------------------------------------------------
# Batch routing
# ---------------------------------------------------------------------------


def test_route_batch():
    router = RuleBasedRouter()
    docs = [_make_doc(dt) for dt in DocumentType if dt != DocumentType.UNKNOWN]
    strategies = router.route_batch(docs)
    assert len(strategies) == len(docs)
    assert all(isinstance(s, ChunkingStrategy) for s in strategies)


# ---------------------------------------------------------------------------
# ROUTING_TABLE completeness
# ---------------------------------------------------------------------------


def test_routing_table_covers_all_document_types():
    covered = set(ROUTING_TABLE.keys())
    all_types = set(DocumentType)
    assert all_types <= covered
