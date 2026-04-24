"""Integration test: manifest builder handles a realistic mini-corpus."""
from __future__ import annotations

from pathlib import Path

import pytest

from edullm_pacer.data.build_manifest import build_manifest


@pytest.fixture
def mini_corpus(tmp_path: Path) -> Path:
    """Build a small synthetic corpus mirroring the expected raw/ layout."""
    raw = tmp_path / "raw"

    # A textbook chapter on photosynthesis for secondary biology.
    (raw / "biology" / "secondary" / "textbook").mkdir(parents=True)
    (raw / "biology" / "secondary" / "textbook" / "ncert_ch13_photosynthesis.txt").write_text(
        "Photosynthesis is the process by which green plants convert light energy. "
        * 100,
        encoding="utf-8",
    )

    # Past paper for maths, higher-secondary.
    (raw / "mathematics" / "higher_secondary" / "past_paper").mkdir(parents=True)
    (raw / "mathematics" / "higher_secondary" / "past_paper" / "cbse_2023_class12.md").write_text(
        "# CBSE Class 12 Mathematics 2023\n\nQ1. Evaluate the integral. " * 50,
        encoding="utf-8",
    )

    # Lecture notes for undergrad CS, JSON format.
    (raw / "computer-science" / "undergraduate" / "lecture_notes").mkdir(parents=True)
    text_content = "Recursion is when a function calls itself. " * 40
    (raw / "computer-science" / "undergraduate" / "lecture_notes" / "cs101.json").write_text(
        f'{{"title": "Recursion", "text": "{text_content}"}}',
        encoding="utf-8",
    )

    # Suspicious file: very short, triggers a warning.
    (raw / "misc").mkdir()
    (raw / "misc" / "short_note.txt").write_text("Too short.", encoding="utf-8")

    return raw


def test_build_manifest_detects_structure(mini_corpus: Path, tmp_path: Path) -> None:
    out = tmp_path / "processed"
    rows = build_manifest(mini_corpus, out)

    assert len(rows) == 4
    assert (out / "manifest.csv").exists()
    assert (out / "manifest.jsonl").exists()

    by_path = {r.path: r for r in rows}

    bio = by_path["biology/secondary/textbook/ncert_ch13_photosynthesis.txt"]
    assert bio.subject == "biology"
    assert bio.grade == "secondary"
    assert bio.doc_type == "textbook_chapter"
    assert bio.word_count > 100

    math = by_path["mathematics/higher_secondary/past_paper/cbse_2023_class12.md"]
    assert math.subject == "mathematics"
    assert math.grade == "higher_secondary"
    assert math.doc_type == "past_paper"

    cs = by_path["computer-science/undergraduate/lecture_notes/cs101.json"]
    assert cs.subject == "computer-science"
    assert cs.grade == "undergraduate"
    assert cs.doc_type == "lecture_notes"

    short = by_path["misc/short_note.txt"]
    assert "very_short" in short.warnings
