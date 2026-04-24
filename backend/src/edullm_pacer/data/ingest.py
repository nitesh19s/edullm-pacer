"""Convert raw text files into canonical Document JSONL using the manifest.

Reads:  data/raw/**/*.{txt, md, json}
        data/processed/manifest.jsonl   (from build_manifest)

Writes: data/processed/documents.jsonl  (one Document per line)
        data/processed/ingestion_report.json

The ingester:
  - Loads metadata from the manifest (subject, grade, doc_type, language)
  - Reads and normalizes the text
  - Deduplicates by content hash
  - Skips files flagged 'empty' in the manifest
  - Reports detailed stats reviewers will ask about

Usage:
    python -m edullm_pacer.data.ingest
    edullm ingest --raw-dir data/raw --out-dir data/processed
"""
from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from collections import Counter
from dataclasses import asdict, dataclass, field
from pathlib import Path

import typer

from edullm_pacer.schemas import (
    Document,
    DocumentMetadata,
    DocumentType,
    GradeLevel,
)
from edullm_pacer.utils.io import read_jsonl, write_jsonl
from edullm_pacer.utils.logging import get_logger

logger = get_logger(__name__)
app = typer.Typer(help="Ingest raw documents into canonical Document JSONL.")


# --------------------------------------------------------------------------
# Text normalization
# --------------------------------------------------------------------------


_MULTI_SPACE = re.compile(r"[ \t]+")
_MULTI_NEWLINE = re.compile(r"\n{3,}")
_SOFT_HYPHEN = re.compile(r"\u00ad")
_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def normalize_text(text: str) -> str:
    """Canonical text normalization for educational content.

    - NFC Unicode normalization (combines composed characters)
    - Strip soft hyphens (OCR artefact)
    - Remove control characters except \\n and \\t
    - Collapse runs of whitespace
    - Cap consecutive blank lines at 2
    """
    if not text:
        return ""
    text = unicodedata.normalize("NFC", text)
    text = _SOFT_HYPHEN.sub("", text)
    text = _CONTROL_CHARS.sub("", text)
    # Normalize line endings before collapsing whitespace.
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = _MULTI_SPACE.sub(" ", text)
    text = _MULTI_NEWLINE.sub("\n\n", text)
    return text.strip()


def content_hash(text: str) -> str:
    """SHA-256 hash of normalized text. Used for deduplication."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


# --------------------------------------------------------------------------
# Manifest row -> Document
# --------------------------------------------------------------------------


def _read_text_from_file(path: Path) -> str:
    """Read text from .txt, .md, .json, or .jsonl. Returns '' on failure."""
    try:
        suffix = path.suffix.lower()
        if suffix == ".json":
            obj = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(obj, dict):
                for key in ("text", "content", "body", "raw_text"):
                    val = obj.get(key)
                    if isinstance(val, str):
                        return val
            return json.dumps(obj, ensure_ascii=False)
        if suffix == ".jsonl":
            parts: list[str] = []
            for obj in read_jsonl(path):
                for key in ("text", "content", "body"):
                    val = obj.get(key)
                    if isinstance(val, str):
                        parts.append(val)
                        break
            return "\n\n".join(parts)
        return path.read_text(encoding="utf-8", errors="replace")
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"Failed to read {path}: {exc}")
        return ""


def _manifest_row_to_document(row: dict, raw_dir: Path) -> Document | None:
    """Convert one manifest row into a Document. Returns None on failure/skip."""
    warnings_str = row.get("warnings") or ""
    if "empty" in warnings_str:
        return None

    rel_path = row["path"]
    full_path = raw_dir / rel_path
    if not full_path.exists():
        logger.warning(f"Manifest entry missing on disk: {full_path}")
        return None

    raw_text = _read_text_from_file(full_path)
    clean_text = normalize_text(raw_text)

    if not clean_text:
        return None

    metadata = DocumentMetadata(
        subject=row.get("subject"),
        grade=GradeLevel(row.get("grade", "unknown")),
        doc_type=DocumentType(row.get("doc_type", "unknown")),
        language=row.get("language", "en"),
        source=_infer_source(rel_path),
        word_count=len(clean_text.split()),
        page_count=None,
        extra={
            "original_path": rel_path,
            "original_filename": row.get("filename"),
            "manifest_warnings": warnings_str,
            "char_count_raw": len(raw_text),
            "char_count_normalized": len(clean_text),
        },
    )

    return Document(doc_id=row["doc_id"], text=clean_text, metadata=metadata)


def _infer_source(rel_path: str) -> str | None:
    """Heuristic: guess the publisher/source from the path."""
    lower = rel_path.lower()
    for source in ("ncert", "cbse", "icse", "ib", "shoolini", "university"):
        if source in lower:
            return source.upper()
    return None


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------


@dataclass
class IngestionReport:
    total_manifest_rows: int = 0
    documents_written: int = 0
    skipped_empty: int = 0
    skipped_missing: int = 0
    skipped_duplicate: int = 0
    by_subject: dict[str, int] = field(default_factory=dict)
    by_grade: dict[str, int] = field(default_factory=dict)
    by_doc_type: dict[str, int] = field(default_factory=dict)
    total_words: int = 0
    total_chars: int = 0

    def to_dict(self) -> dict:
        return asdict(self)


def ingest(
    raw_dir: Path,
    processed_dir: Path,
    manifest_path: Path | None = None,
) -> IngestionReport:
    """Run ingestion. Writes documents.jsonl + ingestion_report.json."""
    manifest_path = manifest_path or (processed_dir / "manifest.jsonl")
    if not manifest_path.exists():
        raise FileNotFoundError(
            f"Manifest not found at {manifest_path}. "
            "Run `edullm manifest` first."
        )

    report = IngestionReport()
    seen_hashes: set[str] = set()
    documents: list[Document] = []

    rows = list(read_jsonl(manifest_path))
    report.total_manifest_rows = len(rows)
    logger.info(f"Ingesting from {len(rows)} manifest rows")

    for row in rows:
        doc = _manifest_row_to_document(row, raw_dir)
        if doc is None:
            if not (raw_dir / row["path"]).exists():
                report.skipped_missing += 1
            else:
                report.skipped_empty += 1
            continue

        h = content_hash(doc.text)
        if h in seen_hashes:
            report.skipped_duplicate += 1
            continue
        seen_hashes.add(h)
        documents.append(doc)

        # Track stats as we go.
        report.by_subject[doc.metadata.subject or "unknown"] = (
            report.by_subject.get(doc.metadata.subject or "unknown", 0) + 1
        )
        grade_val = _enum_val(doc.metadata.grade)
        doctype_val = _enum_val(doc.metadata.doc_type)
        report.by_grade[grade_val] = report.by_grade.get(grade_val, 0) + 1
        report.by_doc_type[doctype_val] = report.by_doc_type.get(doctype_val, 0) + 1
        report.total_words += doc.metadata.word_count or 0
        report.total_chars += len(doc.text)

    report.documents_written = len(documents)

    # Write outputs.
    docs_path = processed_dir / "documents.jsonl"
    report_path = processed_dir / "ingestion_report.json"
    write_jsonl(docs_path, documents)
    report_path.write_text(json.dumps(report.to_dict(), indent=2), encoding="utf-8")

    _log_summary(report, docs_path, report_path)
    return report


def _enum_val(v) -> str:  # type: ignore[no-untyped-def]
    return v.value if hasattr(v, "value") else str(v)


def _log_summary(report: IngestionReport, docs_path: Path, report_path: Path) -> None:
    total = report.total_manifest_rows
    pct = lambda x: f"({x * 100 // max(total, 1)}%)"  # noqa: E731
    logger.info("=" * 60)
    logger.info("INGESTION COMPLETE")
    logger.info("=" * 60)
    logger.info(f"Manifest rows       : {total:,}")
    logger.info(f"Documents written   : {report.documents_written:,} {pct(report.documents_written)}")
    logger.info(f"Skipped (empty)     : {report.skipped_empty:,} {pct(report.skipped_empty)}")
    logger.info(f"Skipped (missing)   : {report.skipped_missing:,} {pct(report.skipped_missing)}")
    logger.info(f"Skipped (duplicate) : {report.skipped_duplicate:,} {pct(report.skipped_duplicate)}")
    logger.info(f"Total words         : {report.total_words:,}")
    logger.info(f"Total chars         : {report.total_chars:,}")
    if report.documents_written:
        logger.info(f"Avg words/doc       : {report.total_words // report.documents_written:,}")
    logger.info(f"By subject          : {dict(Counter(report.by_subject).most_common(10))}")
    logger.info(f"By grade            : {dict(Counter(report.by_grade).most_common())}")
    logger.info(f"By doc_type         : {dict(Counter(report.by_doc_type).most_common())}")
    logger.info(f"Output              : {docs_path}")
    logger.info(f"Report              : {report_path}")
    logger.info("=" * 60)


@app.command()
def main(
    raw_dir: Path = typer.Option(Path("data/raw"), "--raw-dir"),
    processed_dir: Path = typer.Option(Path("data/processed"), "--out-dir"),
    manifest: Path | None = typer.Option(None, "--manifest"),
) -> None:
    """CLI entry point."""
    ingest(raw_dir, processed_dir, manifest_path=manifest)


if __name__ == "__main__":
    app()
