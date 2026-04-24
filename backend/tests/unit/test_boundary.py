"""Tests for the pedagogical boundary detector and post-processor."""
from __future__ import annotations

import pytest

from edullm_pacer.boundary import BoundaryPostProcessor, detect_boundary_violations, ends_mid_unit
from edullm_pacer.schemas import Chunk, ChunkMetadata, ChunkingStrategy


def _chunk(text: str, idx: int = 0, preserved: bool = True) -> Chunk:
    meta = ChunkMetadata(
        doc_id="doc1",
        chunk_index=idx,
        strategy=ChunkingStrategy.RECURSIVE,
        pedagogical_boundary_preserved=preserved,
    )
    return Chunk(chunk_id=f"doc1::chunk_{idx:05d}::test", text=text, metadata=meta)


# ---------------------------------------------------------------------------
# ends_mid_unit — unit-level tests
# ---------------------------------------------------------------------------

CLOSED_DEFINITION = """
Chapter 5: Forces

Definition: A force is a push or pull acting on an object.
Forces can change the speed, direction, or shape of an object.
Newton's laws describe how forces behave.
Gravity and friction are common examples of forces.
"""

OPEN_DEFINITION = """
Some narrative about motion.

Definition: A force is a push or pull
"""

CLOSED_QA = """
Q3. What is the unit of force?
Answer: The SI unit of force is newton (N), named after Isaac Newton.
"""

OPEN_QA = """
Lots of solved problems above.

Q5. State Newton's second law of motion.
"""

CLOSED_EXAMPLE = """
Example 2: A car travels 100 km in 2 hours. Find its speed.
Given: distance = 100 km, time = 2 h
Solution: speed = distance / time = 50 km/h
∴ The speed of the car is 50 km/h.
"""

OPEN_EXAMPLE = """
We now solve some numerical problems.

Example 3: A ball is dropped from a height of 20 m.
"""


def test_closed_definition_not_flagged():
    assert not ends_mid_unit(CLOSED_DEFINITION)


def test_open_definition_flagged():
    assert ends_mid_unit(OPEN_DEFINITION)


def test_closed_qa_not_flagged():
    assert not ends_mid_unit(CLOSED_QA)


def test_open_qa_flagged():
    assert ends_mid_unit(OPEN_QA)


def test_closed_example_not_flagged():
    assert not ends_mid_unit(CLOSED_EXAMPLE)


def test_open_example_flagged():
    assert ends_mid_unit(OPEN_EXAMPLE)


def test_empty_text_not_flagged():
    assert not ends_mid_unit("")


def test_plain_narrative_not_flagged():
    text = "This is a paragraph about science. It has no structural markers at all."
    assert not ends_mid_unit(text)


# ---------------------------------------------------------------------------
# detect_boundary_violations
# ---------------------------------------------------------------------------


def test_detect_returns_correct_indices():
    chunks_text = [CLOSED_DEFINITION, OPEN_QA, CLOSED_EXAMPLE, OPEN_EXAMPLE]
    violations = detect_boundary_violations(chunks_text)
    assert 1 in violations  # OPEN_QA
    assert 3 in violations  # OPEN_EXAMPLE
    assert 0 not in violations
    assert 2 not in violations


# ---------------------------------------------------------------------------
# BoundaryPostProcessor — flag only
# ---------------------------------------------------------------------------


def test_flag_only_marks_violated_chunks():
    chunks = [
        _chunk(CLOSED_DEFINITION, 0),
        _chunk(OPEN_QA, 1),
        _chunk(CLOSED_EXAMPLE, 2),
    ]
    processor = BoundaryPostProcessor(merge=False)
    result = processor.process(chunks)

    assert result[0].metadata.pedagogical_boundary_preserved is True
    assert result[1].metadata.pedagogical_boundary_preserved is False
    assert result[2].metadata.pedagogical_boundary_preserved is True


def test_flag_only_does_not_change_text():
    chunks = [_chunk(OPEN_QA, 0)]
    processor = BoundaryPostProcessor(merge=False)
    result = processor.process(chunks)
    assert result[0].text == OPEN_QA


def test_empty_list_returns_empty():
    assert BoundaryPostProcessor().process([]) == []


# ---------------------------------------------------------------------------
# BoundaryPostProcessor — merge
# ---------------------------------------------------------------------------


OPEN_Q = "Q6. Explain the law of conservation of energy.\n"
ANSWER = "Answer: Energy cannot be created or destroyed, only converted.\n"


def test_merge_joins_violating_pair():
    chunks = [_chunk(OPEN_Q, 0), _chunk(ANSWER, 1)]
    processor = BoundaryPostProcessor(merge=True)
    result = processor.process(chunks)

    assert len(result) == 1
    assert OPEN_Q.strip() in result[0].text
    assert ANSWER.strip() in result[0].text
    assert result[0].metadata.pedagogical_boundary_preserved is True


def test_merge_respects_max_chars():
    big_answer = "Answer: " + "x" * 10_000
    chunks = [_chunk(OPEN_Q, 0), _chunk(big_answer, 1)]
    processor = BoundaryPostProcessor(merge=True, max_merge_chars=500)
    result = processor.process(chunks)

    # Too big to merge → flagged but separate.
    assert len(result) == 2
    assert result[0].metadata.pedagogical_boundary_preserved is False


# ---------------------------------------------------------------------------
# violation_rate
# ---------------------------------------------------------------------------


def test_violation_rate_all_clean():
    chunks = [_chunk(CLOSED_DEFINITION, 0), _chunk(CLOSED_QA, 1)]
    processor = BoundaryPostProcessor()
    assert processor.violation_rate(chunks) == 0.0


def test_violation_rate_partial():
    chunks = [_chunk(CLOSED_DEFINITION, 0), _chunk(OPEN_QA, 1)]
    processor = BoundaryPostProcessor()
    rate = processor.violation_rate(chunks)
    assert 0.0 < rate <= 1.0
