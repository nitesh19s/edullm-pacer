"""End-to-end ingestion test: raw files -> manifest -> documents.jsonl."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from edullm_pacer.data.build_manifest import build_manifest
from edullm_pacer.data.ingest import ingest, normalize_text
from edullm_pacer.utils.io import read_jsonl_as
from edullm_pacer.schemas import Document


@pytest.fixture
def mini_corpus(tmp_path: Path) -> Path:
    """Synthetic corpus mirroring the expected raw/ layout."""
    raw = tmp_path / "raw"

    # Biology textbook chapter.
    (raw / "biology" / "secondary" / "textbook").mkdir(parents=True)
    (raw / "biology" / "secondary" / "textbook" / "ncert_ch13.txt").write_text(
        "Photosynthesis is the process by which plants convert light energy.\n\n"
        "Chlorophyll absorbs red and blue light. " * 50,
        encoding="utf-8",
    )

    # Same file duplicated in another subject folder — deduplication check.
    (raw / "misc").mkdir()
    (raw / "misc" / "photosynthesis_copy.txt").write_text(
        "Photosynthesis is the process by which plants convert light energy.\n\n"
        "Chlorophyll absorbs red and blue light. " * 50,
        encoding="utf-8",
    )

    # Past paper with soft hyphens and control chars to test normalization.
    (raw / "mathematics" / "higher_secondary" / "past_paper").mkdir(parents=True)
    (raw / "mathematics" / "higher_secondary" / "past_paper" / "cbse_2023.md").write_text(
        "# CBSE 2023\n\n\n\n\nEval\u00aduate  the   integral.\x07\n\nQ1. Find dy/dx." * 10,
        encoding="utf-8",
    )

    # Empty file.
    (raw / "misc" / "empty.txt").write_text("", encoding="utf-8")

    return raw


def test_normalize_text_strips_soft_hyphen_and_controls() -> None:
    dirty = "Eval\u00aduate\x07 the\r\n\r\nintegral.   OK"
    clean = normalize_text(dirty)
    assert "\u00ad" not in clean
    assert "\x07" not in clean
    assert "Evaluate the" in clean
    assert "   " not in clean


def test_ingest_produces_documents_jsonl(mini_corpus: Path, tmp_path: Path) -> None:
    out = tmp_path / "processed"
    build_manifest(mini_corpus, out)
    report = ingest(mini_corpus, out)

    # Expect 4 manifest rows (3 non-empty + 1 empty).
    assert report.total_manifest_rows == 4
    # Empty file should be skipped.
    assert report.skipped_empty == 1
    # The duplicated photosynthesis file should dedupe to one document.
    assert report.skipped_duplicate == 1
    assert report.documents_written == 2

    docs_path = out / "documents.jsonl"
    assert docs_path.exists()
    docs = list(read_jsonl_as(docs_path, Document))
    assert len(docs) == 2

    # Verify one of the documents has the expected metadata.
    bio = next(
        d for d in docs
        if d.metadata.extra.get("original_filename") in {"ncert_ch13.txt", "photosynthesis_copy.txt"}
    )
    assert bio.text.startswith("Photosynthesis")
    assert bio.metadata.word_count > 50

    # Report should be written too.
    report_path = out / "ingestion_report.json"
    assert report_path.exists()
    report_data = json.loads(report_path.read_text())
    assert report_data["documents_written"] == 2


def test_ingest_requires_manifest(tmp_path: Path) -> None:
    raw = tmp_path / "raw"
    raw.mkdir()
    processed = tmp_path / "processed"
    processed.mkdir()
    with pytest.raises(FileNotFoundError, match="Manifest not found"):
        ingest(raw, processed)
