"""Unit tests for the educational (pedagogy-aware) chunker."""
from __future__ import annotations

import pytest

from edullm_pacer.chunkers import EducationalChunker, get_chunker
from edullm_pacer.chunkers.educational import _find_unit_boundaries
from edullm_pacer.schemas import ChunkingStrategy, Document


TEXTBOOK_SAMPLE = """Chapter 13 Photosynthesis

Learning Objectives
By the end of this chapter, students will be able to identify the stages of
photosynthesis and explain how chlorophyll absorbs light.

Definition: Photosynthesis is the process by which green plants convert
light energy into chemical energy in the form of glucose.

Example 1: A leaf cell contains chloroplasts. When sunlight strikes the leaf,
chlorophyll molecules in the thylakoid membrane absorb photons. This initiates
the light-dependent reactions.

Solution: The light reactions produce ATP and NADPH. These molecules are used
in the Calvin cycle to fix carbon dioxide into glucose.

Theorem 1: The net equation for photosynthesis is 6CO2 + 6H2O -> C6H12O6 + 6O2.

Proof: Each molecule of glucose requires six carbon dioxide molecules. By
conservation of mass, six water molecules are also consumed and six oxygen
molecules are released.

Q1. What are the two stages of photosynthesis?
Answer: The light-dependent reactions and the Calvin cycle.

Q2. Where in the chloroplast does the Calvin cycle occur?
Answer: In the stroma.

Summary: Photosynthesis converts light energy into chemical energy. Chlorophyll
absorbs light; the Calvin cycle fixes carbon dioxide.
"""


@pytest.fixture
def textbook_doc() -> Document:
    return Document(doc_id="textbook_001", text=TEXTBOOK_SAMPLE)


def test_unit_detector_finds_pedagogical_structure(textbook_doc: Document) -> None:
    units = _find_unit_boundaries(textbook_doc.text)
    kinds = [u.kind for u in units]
    # The sample has a chapter header, learning objective, definition, example,
    # solution, theorem, proof, two questions, and a summary.
    assert "section_header" in kinds
    assert "learning_objective" in kinds
    assert "definition" in kinds
    assert "worked_example" in kinds
    assert "theorem" in kinds
    assert "proof" in kinds
    assert "question" in kinds
    assert "summary" in kinds


def test_educational_chunker_preserves_boundaries(textbook_doc: Document) -> None:
    chunker = EducationalChunker(chunk_size=2000)
    chunks = chunker.chunk(textbook_doc)

    # Every chunk should be marked as boundary-preserving.
    assert all(c.metadata.pedagogical_boundary_preserved for c in chunks)

    # The definition should not be split mid-unit. Find the chunk containing it.
    def_chunks = [c for c in chunks if "Definition:" in c.text]
    assert len(def_chunks) == 1
    # Definition should stay whole (not split across chunks).
    assert "green plants convert" in def_chunks[0].text

    # Each Q&A pair should stay together: the answer should be in the same chunk
    # as its question.
    for qn, ans_snippet in [("Q1.", "light-dependent reactions"), ("Q2.", "stroma")]:
        q_chunks = [c for c in chunks if qn in c.text]
        assert len(q_chunks) >= 1
        assert any(ans_snippet in c.text for c in q_chunks), (
            f"Answer for {qn} should stay in same chunk as the question"
        )


def test_educational_tags_unit_kind_in_metadata(textbook_doc: Document) -> None:
    chunks = EducationalChunker().chunk(textbook_doc)
    kinds = {c.metadata.extra.get("unit_kind") for c in chunks}
    # At least a few different pedagogical unit types should be represented.
    assert len(kinds) >= 3


def test_educational_narrative_fallback() -> None:
    # No pedagogical markers at all: should produce one big unit (narrative).
    plain = Document(
        doc_id="plain",
        text="Plants are green. They need sunlight. They perform a process. " * 30,
    )
    chunks = EducationalChunker(chunk_size=5000).chunk(plain)
    assert len(chunks) == 1
    assert chunks[0].metadata.extra.get("unit_kind") == "narrative"


def test_educational_registry() -> None:
    chunker = get_chunker("educational")
    assert isinstance(chunker, EducationalChunker)
    assert chunker.strategy == ChunkingStrategy.EDUCATIONAL
