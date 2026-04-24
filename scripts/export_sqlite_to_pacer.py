"""Export chunks from the edullm-platform SQLite database into PACER format.

Reads:  data/db/edullm-database.db
Writes: data/processed/documents_from_sqlite.jsonl
        data/processed/export_report.json

Performs:
  - Filters out junk (copyright disclaimers, very short chunks, front matter)
  - Maps metadata to PACER's schema (subject, grade, doc_type enums)
  - Groups chunks by chapter to reconstruct approximate full documents
  - Reports quality stats

Usage:
    python scripts/export_sqlite_to_pacer.py
    python scripts/export_sqlite_to_pacer.py --db-path data/db/edullm-database.db
"""
from __future__ import annotations

import json
import re
import sqlite3
import sys
from collections import defaultdict
from dataclasses import asdict, dataclass, field
from pathlib import Path

# Allow running from repo root without install.
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend" / "src"))

from edullm_pacer.schemas import Document, DocumentMetadata, DocumentType, GradeLevel
from edullm_pacer.utils.io import write_jsonl
from edullm_pacer.utils.logging import get_logger

logger = get_logger(__name__)


# --------------------------------------------------------------------------
# Junk filters
# --------------------------------------------------------------------------

# Patterns that indicate front-matter, copyright, or non-content chunks.
_JUNK_PATTERNS = [
    re.compile(r"the responsibility for the correctness", re.IGNORECASE),
    re.compile(r"territorial waters of india", re.IGNORECASE),
    re.compile(r"published by the director", re.IGNORECASE),
    re.compile(r"all rights reserved", re.IGNORECASE),
    re.compile(r"no part of this publication", re.IGNORECASE),
    re.compile(r"isbn\s+\d", re.IGNORECASE),
    re.compile(r"^\s*\d+\s*$"),  # page numbers only
    re.compile(r"ncert/cbse content", re.IGNORECASE),
    re.compile(r"printed at\b", re.IGNORECASE),
    re.compile(r"first edition", re.IGNORECASE),
    re.compile(r"republished|reprinted", re.IGNORECASE),
]

MIN_USEFUL_LENGTH = 100  # chars


def _is_junk(text: str) -> bool:
    """True if this chunk is front matter, copyright, or too short to be useful."""
    if len(text.strip()) < MIN_USEFUL_LENGTH:
        return True
    for pat in _JUNK_PATTERNS:
        if pat.search(text[:500]):  # only check the first 500 chars
            return True
    return False


# --------------------------------------------------------------------------
# Metadata mapping
# --------------------------------------------------------------------------

_GRADE_MAP: dict[str, GradeLevel] = {
    "7": GradeLevel.MIDDLE,
    "8": GradeLevel.MIDDLE,
    "9": GradeLevel.SECONDARY,
    "10": GradeLevel.SECONDARY,
    "11": GradeLevel.HIGHER_SECONDARY,
    "12": GradeLevel.HIGHER_SECONDARY,
}

_SUBJECT_MAP: dict[str, str] = {
    "Mathematics": "mathematics",
    "Science": "science",
    "Social Science": "social-science",
    "Physics": "physics",
    "Chemistry": "chemistry",
    "Biology": "biology",
    "History": "history",
    "Geography": "geography",
    "Economics": "economics",
    "Political Science": "political-science",
}


def _map_metadata(raw_meta: dict) -> DocumentMetadata:
    subject_raw = raw_meta.get("subject", "unknown")
    grade_raw = str(raw_meta.get("grade", "unknown"))
    chapter = raw_meta.get("chapter", "")

    return DocumentMetadata(
        subject=_SUBJECT_MAP.get(subject_raw, subject_raw.lower()),
        grade=_GRADE_MAP.get(grade_raw, GradeLevel.UNKNOWN),
        doc_type=DocumentType.TEXTBOOK_CHAPTER,  # all NCERT content is textbook
        language="en",
        source="NCERT",
        board="CBSE",
        extra={
            "original_subject": subject_raw,
            "original_grade": grade_raw,
            "chapter": chapter,
            "source_db": "edullm-platform",
        },
    )


# --------------------------------------------------------------------------
# Grouping: reconstruct chapter-level documents from chunks
# --------------------------------------------------------------------------


def _group_key(meta: dict) -> str:
    """Group chunks into approximate documents by subject+grade+chapter."""
    subj = meta.get("subject", "unknown")
    grade = meta.get("grade", "unknown")
    chapter = meta.get("chapter", "unknown")
    return f"{subj}|{grade}|{chapter}"


# --------------------------------------------------------------------------
# Export
# --------------------------------------------------------------------------


@dataclass
class ExportReport:
    total_rows: int = 0
    junk_filtered: int = 0
    chunks_kept: int = 0
    documents_created: int = 0
    by_subject: dict[str, int] = field(default_factory=dict)
    by_grade: dict[str, int] = field(default_factory=dict)
    avg_doc_length_chars: int = 0
    mode: str = "chunks"  # "chunks" or "reconstructed"


def export_as_chunks(
    db_path: Path,
    out_path: Path,
) -> ExportReport:
    """Export each SQLite row as a standalone Document (no reconstruction)."""
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    cursor = conn.execute("SELECT id, text, metadata FROM documents")

    report = ExportReport(mode="chunks")
    documents: list[Document] = []

    for row in cursor:
        report.total_rows += 1
        text = row["text"]
        if _is_junk(text):
            report.junk_filtered += 1
            continue

        raw_meta = json.loads(row["metadata"]) if row["metadata"] else {}
        meta = _map_metadata(raw_meta)
        meta.word_count = len(text.split())

        doc = Document(doc_id=row["id"], text=text, metadata=meta)
        documents.append(doc)
        report.chunks_kept += 1

        subj = meta.subject or "unknown"
        report.by_subject[subj] = report.by_subject.get(subj, 0) + 1
        grade_val = meta.grade.value if hasattr(meta.grade, "value") else str(meta.grade)
        report.by_grade[grade_val] = report.by_grade.get(grade_val, 0) + 1

    conn.close()
    report.documents_created = len(documents)
    if documents:
        report.avg_doc_length_chars = sum(len(d.text) for d in documents) // len(documents)

    write_jsonl(out_path, documents)
    return report


def export_as_reconstructed_docs(
    db_path: Path,
    out_path: Path,
) -> ExportReport:
    """Group chunks by subject+grade+chapter and concatenate into documents.

    This produces larger documents suitable for re-chunking with PACER's
    5 strategies — which is what Paper 1 needs.
    """
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    cursor = conn.execute("SELECT id, text, metadata FROM documents ORDER BY id")

    report = ExportReport(mode="reconstructed")
    groups: dict[str, list[tuple[str, dict]]] = defaultdict(list)

    for row in cursor:
        report.total_rows += 1
        text = row["text"]
        if _is_junk(text):
            report.junk_filtered += 1
            continue
        report.chunks_kept += 1
        raw_meta = json.loads(row["metadata"]) if row["metadata"] else {}
        key = _group_key(raw_meta)
        groups[key].append((text, raw_meta))

    conn.close()

    documents: list[Document] = []
    for idx, (key, chunks) in enumerate(sorted(groups.items())):
        combined_text = "\n\n".join(text for text, _ in chunks)
        sample_meta = chunks[0][1]
        meta = _map_metadata(sample_meta)
        meta.word_count = len(combined_text.split())
        meta.extra["chunk_count"] = len(chunks)
        meta.extra["group_key"] = key

        doc = Document(
            doc_id=f"ncert_{idx:05d}",
            text=combined_text,
            metadata=meta,
        )
        documents.append(doc)

        subj = meta.subject or "unknown"
        report.by_subject[subj] = report.by_subject.get(subj, 0) + 1
        grade_val = meta.grade.value if hasattr(meta.grade, "value") else str(meta.grade)
        report.by_grade[grade_val] = report.by_grade.get(grade_val, 0) + 1

    report.documents_created = len(documents)
    if documents:
        report.avg_doc_length_chars = sum(len(d.text) for d in documents) // len(documents)

    write_jsonl(out_path, documents)
    return report


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Export SQLite to PACER format")
    parser.add_argument("--db-path", default="data/db/edullm-database.db")
    parser.add_argument("--out-dir", default="data/processed")
    parser.add_argument(
        "--mode",
        choices=["chunks", "reconstructed", "both"],
        default="both",
        help="'chunks' keeps each row as a doc; 'reconstructed' groups by chapter",
    )
    args = parser.parse_args()

    db_path = Path(args.db_path)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    if not db_path.exists():
        logger.error(f"Database not found: {db_path}")
        sys.exit(1)

    if args.mode in ("chunks", "both"):
        report = export_as_chunks(db_path, out_dir / "documents_chunks.jsonl")
        _print_report(report, "CHUNK-LEVEL EXPORT")
        (out_dir / "export_chunks_report.json").write_text(
            json.dumps(asdict(report), indent=2)
        )

    if args.mode in ("reconstructed", "both"):
        report = export_as_reconstructed_docs(db_path, out_dir / "documents_reconstructed.jsonl")
        _print_report(report, "RECONSTRUCTED DOCUMENT EXPORT")
        (out_dir / "export_reconstructed_report.json").write_text(
            json.dumps(asdict(report), indent=2)
        )


def _print_report(report: ExportReport, title: str) -> None:
    logger.info("=" * 60)
    logger.info(title)
    logger.info("=" * 60)
    logger.info(f"Mode              : {report.mode}")
    logger.info(f"Total DB rows     : {report.total_rows:,}")
    logger.info(f"Junk filtered     : {report.junk_filtered:,}")
    logger.info(f"Chunks kept       : {report.chunks_kept:,}")
    logger.info(f"Documents created : {report.documents_created:,}")
    logger.info(f"Avg doc length    : {report.avg_doc_length_chars:,} chars")
    logger.info(f"By subject        : {report.by_subject}")
    logger.info(f"By grade          : {report.by_grade}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
