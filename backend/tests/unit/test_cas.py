"""Tests for the Curriculum Alignment Score (CAS) scorer."""
from __future__ import annotations

import pytest

from edullm_pacer.cas import CASScorer
from edullm_pacer.schemas import (
    BloomLevel,
    Chunk,
    ChunkMetadata,
    ChunkingStrategy,
    GradeLevel,
    Query,
)


def _query(
    text: str = "What is photosynthesis?",
    grade: GradeLevel = GradeLevel.SECONDARY,
    bloom: BloomLevel = BloomLevel.UNDERSTAND,
) -> Query:
    return Query(query_id="q1", text=text, grade=grade, bloom_level=bloom)


def _chunk(
    text: str = "Photosynthesis is the process by which plants convert sunlight.",
    grade: GradeLevel = GradeLevel.SECONDARY,
    bloom: BloomLevel = BloomLevel.UNDERSTAND,
    concepts: list[str] | None = None,
    prerequisites: list[str] | None = None,
) -> Chunk:
    meta = ChunkMetadata(
        doc_id="doc1",
        chunk_index=0,
        strategy=ChunkingStrategy.EDUCATIONAL,
        grade=grade,
        bloom_level=bloom,
        concepts=concepts or [],
        prerequisites=prerequisites or [],
    )
    return Chunk(chunk_id="doc1::chunk_00000::test", text=text, metadata=meta)


scorer = CASScorer()


# ---------------------------------------------------------------------------
# Grade match
# ---------------------------------------------------------------------------


def test_grade_match_same_grade():
    q = _query(grade=GradeLevel.SECONDARY)
    c = _chunk(grade=GradeLevel.SECONDARY)
    cas = scorer.score(q, c)
    assert cas.grade_match == 1.0


def test_grade_match_adjacent_grade():
    q = _query(grade=GradeLevel.SECONDARY)
    c = _chunk(grade=GradeLevel.HIGHER_SECONDARY)
    cas = scorer.score(q, c)
    assert cas.grade_match == 0.7


def test_grade_match_two_apart():
    q = _query(grade=GradeLevel.MIDDLE)
    c = _chunk(grade=GradeLevel.HIGHER_SECONDARY)
    cas = scorer.score(q, c)
    assert cas.grade_match == 0.3


def test_grade_match_far_apart():
    q = _query(grade=GradeLevel.ELEMENTARY)
    c = _chunk(grade=GradeLevel.POSTGRADUATE)
    cas = scorer.score(q, c)
    assert cas.grade_match == 0.0


def test_grade_match_unknown_returns_neutral():
    q = _query(grade=GradeLevel.UNKNOWN)
    c = _chunk(grade=GradeLevel.SECONDARY)
    cas = scorer.score(q, c)
    assert cas.grade_match == 0.5


# ---------------------------------------------------------------------------
# Bloom alignment
# ---------------------------------------------------------------------------


def test_bloom_same_level():
    q = _query(bloom=BloomLevel.APPLY)
    c = _chunk(bloom=BloomLevel.APPLY)
    cas = scorer.score(q, c)
    assert cas.bloom_alignment == 1.0


def test_bloom_one_step():
    q = _query(bloom=BloomLevel.UNDERSTAND)
    c = _chunk(bloom=BloomLevel.APPLY)
    cas = scorer.score(q, c)
    assert cas.bloom_alignment == 0.8


def test_bloom_two_steps():
    q = _query(bloom=BloomLevel.REMEMBER)
    c = _chunk(bloom=BloomLevel.APPLY)
    cas = scorer.score(q, c)
    assert cas.bloom_alignment == 0.5


def test_bloom_three_steps():
    q = _query(bloom=BloomLevel.REMEMBER)
    c = _chunk(bloom=BloomLevel.ANALYZE)
    cas = scorer.score(q, c)
    assert cas.bloom_alignment == 0.2


def test_bloom_unknown_returns_neutral():
    q = _query(bloom=BloomLevel.UNKNOWN)
    c = _chunk(bloom=BloomLevel.APPLY)
    cas = scorer.score(q, c)
    assert cas.bloom_alignment == 0.5


# ---------------------------------------------------------------------------
# Prereq preservation
# ---------------------------------------------------------------------------


def test_prereq_exact_match_via_concepts():
    q = _query(text="Explain photosynthesis and chlorophyll")
    c = _chunk(
        concepts=["photosynthesis", "chlorophyll", "light reactions"],
        text="This chunk text is irrelevant here.",
    )
    cas = scorer.score(q, c)
    # "photosynthesis" and "chlorophyll" should overlap.
    assert cas.prereq_preservation > 0.0


def test_prereq_no_overlap():
    q = _query(text="What is photosynthesis?")
    c = _chunk(
        text="Electrochemistry deals with galvanic cells and electrode potentials.",
        concepts=[],
        prerequisites=[],
    )
    cas = scorer.score(q, c)
    # Very little token overlap expected.
    assert cas.prereq_preservation < 0.5


# ---------------------------------------------------------------------------
# Overall CAS
# ---------------------------------------------------------------------------


def test_overall_is_weighted_sum():
    q = _query(grade=GradeLevel.SECONDARY, bloom=BloomLevel.UNDERSTAND)
    c = _chunk(grade=GradeLevel.SECONDARY, bloom=BloomLevel.UNDERSTAND)
    cas = scorer.score(q, c)

    expected = scorer.alpha * cas.grade_match + scorer.beta * cas.prereq_preservation + scorer.gamma * cas.bloom_alignment
    assert abs(cas.overall - round(expected, 4)) < 1e-4


def test_weights_sum_to_one():
    assert abs(scorer.alpha + scorer.beta + scorer.gamma - 1.0) < 1e-9


def test_invalid_weights_raise():
    with pytest.raises(ValueError, match="sum to 1.0"):
        CASScorer(alpha=0.5, beta=0.5, gamma=0.5)


# ---------------------------------------------------------------------------
# Batch scoring
# ---------------------------------------------------------------------------


def test_score_batch_length():
    q = _query()
    chunks = [_chunk() for _ in range(5)]
    scores = scorer.score_batch(q, chunks)
    assert len(scores) == 5


def test_mean_cas():
    from edullm_pacer.schemas import CASScore

    scores = [CASScore(overall=0.8, grade_match=1.0, prereq_preservation=0.7, bloom_alignment=0.5)]
    assert scorer.mean_cas(scores) == 0.8


def test_mean_cas_empty():
    assert scorer.mean_cas([]) == 0.0


# ---------------------------------------------------------------------------
# Calibrate (smoke test — just checks it runs and returns a CASScorer)
# ---------------------------------------------------------------------------


def test_calibrate_returns_scorer():
    q = _query()
    c = _chunk()
    data = [{"query": q, "chunk": c, "rating": 4.0}] * 10
    calibrated = scorer.calibrate(data, max_iter=20)
    assert isinstance(calibrated, CASScorer)
    assert abs(calibrated.alpha + calibrated.beta + calibrated.gamma - 1.0) < 1e-4


def test_calibrate_empty_data_returns_same():
    same = scorer.calibrate([])
    assert same is scorer
