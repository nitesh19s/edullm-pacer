"""Build a canonical manifest over the raw document corpus.

Produces two files in data/processed/:
    - manifest.csv  : human-browsable audit
    - manifest.jsonl: machine-readable for the pipeline

Expected raw layout (but adapts to what it finds):
    data/raw/
        <subject>/<grade>/<doc_type>/file.{txt,md,json}
    or flat with filename conventions
    or any structure - the script just scans for text-like files.

Usage:
    python -m edullm_pacer.data.build_manifest --raw-dir data/raw
"""
from __future__ import annotations

import csv
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path

import typer

from edullm_pacer.schemas import DocumentType, GradeLevel
from edullm_pacer.utils.logging import get_logger

logger = get_logger(__name__)
app = typer.Typer(help="Build a canonical manifest over the raw document corpus.")


TEXT_EXTENSIONS = {".txt", ".md", ".json", ".jsonl"}

# Heuristics to infer metadata from path/filename when explicit tags are missing.
# Patterns are matched AFTER underscores/hyphens are replaced with spaces.
_GRADE_PATTERNS: dict[str, GradeLevel] = {
    r"\b(k ?5|elementary|primary|grade ?[12345])\b": GradeLevel.ELEMENTARY,
    r"\b(6|7|8|middle|grade ?[678])\b": GradeLevel.MIDDLE,
    r"\b(9|10|secondary|grade ?(9|10))\b": GradeLevel.SECONDARY,
    r"\b(11|12|higher ?secondary|plus ?two|senior ?secondary)\b": GradeLevel.HIGHER_SECONDARY,
    r"\b(ug|undergrad|undergraduate|b ?tech|b ?sc|bachelor)\b": GradeLevel.UNDERGRADUATE,
    r"\b(pg|postgrad|postgraduate|m ?tech|m ?sc|master|phd)\b": GradeLevel.POSTGRADUATE,
}

_DOCTYPE_PATTERNS: dict[str, DocumentType] = {
    r"\b(textbook|chapter|ncert|cbse ?text)\b": DocumentType.TEXTBOOK_CHAPTER,
    r"\b(lecture|slides?|ppt|lecture ?notes?)\b": DocumentType.LECTURE_NOTES,
    r"\b(past ?paper|question ?paper|exam|previous ?year)\b": DocumentType.PAST_PAPER,
    r"\b(lesson ?plan|teaching ?plan)\b": DocumentType.LESSON_PLAN,
    r"\b(syllabus|curriculum|course ?outline)\b": DocumentType.SYLLABUS,
    r"\b(worked ?example|solved ?problem|solution)\b": DocumentType.WORKED_EXAMPLE,
}

_SUBJECT_KEYWORDS: dict[str, str] = {
    "math": "mathematics", "mathematics": "mathematics",
    "phys": "physics", "physics": "physics",
    "chem": "chemistry", "chemistry": "chemistry",
    "bio": "biology", "biology": "biology",
    "hist": "history", "history": "history",
    "lit": "literature", "literature": "literature", "english": "english",
    "cs": "computer-science", "computer": "computer-science",
    "comp sci": "computer-science", "computer science": "computer-science",
}


@dataclass
class ManifestRow:
    doc_id: str
    path: str
    filename: str
    subject: str | None
    grade: str
    doc_type: str
    language: str
    word_count: int
    char_count: int
    size_bytes: int
    warnings: str  # semicolon-separated list

    @classmethod
    def header(cls) -> list[str]:
        return list(cls.__dataclass_fields__.keys())


# --------------------------------------------------------------------------
# Heuristics
# --------------------------------------------------------------------------


def _infer_from_path(path: Path) -> tuple[str | None, GradeLevel, DocumentType]:
    """Best-effort metadata extraction from path components."""
    # Normalize: lowercase + path-component separator, and replace underscores/hyphens
    # with spaces so word boundaries work intuitively on compound names like
    # "lecture_notes" or "past-paper".
    normalized = "/".join(p.lower() for p in path.parts)
    tokenized = re.sub(r"[_\-]+", " ", normalized)
    subject = _match_subject(tokenized)
    grade = _match_first(tokenized, _GRADE_PATTERNS, GradeLevel.UNKNOWN)
    doc_type = _match_first(tokenized, _DOCTYPE_PATTERNS, DocumentType.UNKNOWN)
    return subject, grade, doc_type


def _match_subject(s: str) -> str | None:
    # Sort by length desc so "computer science" matches before "computer".
    for key in sorted(_SUBJECT_KEYWORDS, key=len, reverse=True):
        if re.search(rf"\b{re.escape(key)}\b", s):
            return _SUBJECT_KEYWORDS[key]
    return None


def _match_first(s: str, patterns: dict, default):  # type: ignore[no-untyped-def]
    # Match longer patterns first so "higher_secondary" wins over "secondary".
    for pat in sorted(patterns, key=len, reverse=True):
        if re.search(pat, s):
            return patterns[pat]
    return default


def _detect_language(text: str) -> str:
    """Very cheap language heuristic. Replace with langdetect later if needed."""
    devanagari = sum(1 for c in text[:2000] if "\u0900" <= c <= "\u097f")
    if devanagari > 50:
        return "hi"
    return "en"


def _read_text(path: Path) -> str:
    """Read text from a file regardless of format. Returns "" on failure."""
    try:
        if path.suffix.lower() == ".json":
            obj = json.loads(path.read_text(encoding="utf-8"))
            for key in ("text", "content", "body"):
                if isinstance(obj, dict) and isinstance(obj.get(key), str):
                    return obj[key]
            return json.dumps(obj, ensure_ascii=False)
        return path.read_text(encoding="utf-8", errors="replace")
    except Exception as exc:  # noqa: BLE001 - we *want* to catch everything here
        logger.warning(f"Failed to read {path}: {exc}")
        return ""


def _scan_for_warnings(text: str, path: Path) -> list[str]:
    """Collect quality flags reviewers care about."""
    warnings = []
    if not text.strip():
        warnings.append("empty")
        return warnings
    if len(text) < 200:
        warnings.append("very_short")
    # Non-printable ratio: crude OCR artefact detector.
    non_print = sum(1 for c in text if not (c.isprintable() or c in "\n\t\r"))
    if non_print / max(len(text), 1) > 0.02:
        warnings.append("high_non_printable_ratio")
    # Suspicious repetition: OCR or corruption artefact.
    if re.search(r"(.)\1{30,}", text):
        warnings.append("char_repetition")
    if path.stat().st_size > 5_000_000:
        warnings.append("very_large")
    return warnings


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------


def build_manifest(raw_dir: Path, out_dir: Path) -> list[ManifestRow]:
    """Scan raw_dir recursively and emit manifest rows."""
    if not raw_dir.exists():
        raise FileNotFoundError(f"Raw dir not found: {raw_dir}")

    rows: list[ManifestRow] = []
    seen_ids: set[str] = set()

    files = sorted(p for p in raw_dir.rglob("*") if p.is_file() and p.suffix.lower() in TEXT_EXTENSIONS)
    logger.info(f"Scanning {len(files)} text files under {raw_dir}")

    for idx, path in enumerate(files):
        rel = path.relative_to(raw_dir)
        doc_id = f"doc_{idx:06d}"
        if doc_id in seen_ids:
            continue
        seen_ids.add(doc_id)

        text = _read_text(path)
        subject, grade, doc_type = _infer_from_path(path)
        language = _detect_language(text)
        warnings = _scan_for_warnings(text, path)

        row = ManifestRow(
            doc_id=doc_id,
            path=str(rel),
            filename=path.name,
            subject=subject,
            grade=grade.value if hasattr(grade, "value") else str(grade),
            doc_type=doc_type.value if hasattr(doc_type, "value") else str(doc_type),
            language=language,
            word_count=len(text.split()),
            char_count=len(text),
            size_bytes=path.stat().st_size,
            warnings=";".join(warnings),
        )
        rows.append(row)

    _write_outputs(rows, out_dir)
    _print_summary(rows)
    return rows


def _write_outputs(rows: list[ManifestRow], out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    csv_path = out_dir / "manifest.csv"
    jsonl_path = out_dir / "manifest.jsonl"

    with csv_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=ManifestRow.header())
        writer.writeheader()
        for r in rows:
            writer.writerow(asdict(r))

    with jsonl_path.open("w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(asdict(r), ensure_ascii=False) + "\n")

    logger.info(f"Wrote {csv_path} and {jsonl_path}")


def _print_summary(rows: list[ManifestRow]) -> None:
    if not rows:
        logger.warning("No documents found.")
        return
    total_words = sum(r.word_count for r in rows)
    by_type: dict[str, int] = {}
    by_grade: dict[str, int] = {}
    by_subject: dict[str, int] = {}
    warning_count = 0
    for r in rows:
        by_type[r.doc_type] = by_type.get(r.doc_type, 0) + 1
        by_grade[r.grade] = by_grade.get(r.grade, 0) + 1
        if r.subject:
            by_subject[r.subject] = by_subject.get(r.subject, 0) + 1
        if r.warnings:
            warning_count += 1

    logger.info("=" * 60)
    logger.info(f"Total documents : {len(rows):,}")
    logger.info(f"Total words     : {total_words:,}")
    logger.info(f"Avg words/doc   : {total_words // len(rows):,}")
    logger.info(f"With warnings   : {warning_count} ({warning_count * 100 // len(rows)}%)")
    logger.info(f"By type         : {dict(sorted(by_type.items(), key=lambda x: -x[1]))}")
    logger.info(f"By grade        : {dict(sorted(by_grade.items(), key=lambda x: -x[1]))}")
    logger.info(f"By subject      : {dict(sorted(by_subject.items(), key=lambda x: -x[1]))}")
    logger.info("=" * 60)


@app.command()
def main(
    raw_dir: Path = typer.Option(Path("data/raw"), "--raw-dir", help="Directory with raw docs"),
    out_dir: Path = typer.Option(Path("data/processed"), "--out-dir", help="Where to write manifest"),
) -> None:
    """CLI entry point."""
    build_manifest(raw_dir, out_dir)


if __name__ == "__main__":
    app()
