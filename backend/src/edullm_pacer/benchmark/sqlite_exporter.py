"""Export raw Q&A entries from the EduLLM SQLite database.

Reads ``documents`` table, parses the ``text`` field (which contains
``"Question: ...\n\nAnswer: ..."``), and returns structured dicts ready for
the BenchmarkDatasetBuilder.

Grade → GradeLevel mapping (NCERT/CBSE):
  7, 8       → middle
  9, 10      → secondary
  11, 12     → higher_secondary
  other / ?  → unknown
"""
from __future__ import annotations

import json
import re
import sqlite3
from pathlib import Path

from edullm_pacer.schemas import GradeLevel

_GRADE_MAP: dict[int, GradeLevel] = {
    7: GradeLevel.MIDDLE,
    8: GradeLevel.MIDDLE,
    9: GradeLevel.SECONDARY,
    10: GradeLevel.SECONDARY,
    11: GradeLevel.HIGHER_SECONDARY,
    12: GradeLevel.HIGHER_SECONDARY,
}

# Pattern to split "Question: … \n\n Answer: …" text blobs.
_ANS_RE = re.compile(r"\nAnswer\s*:\s*", re.IGNORECASE)
_Q_PREFIX = re.compile(r"^Question\s*:\s*", re.IGNORECASE)


def _parse_text(raw: str) -> tuple[str, str]:
    """Extract (question_text, answer_text) from a raw text blob."""
    parts = _ANS_RE.split(raw, maxsplit=1)
    if len(parts) == 2:
        q_part = _Q_PREFIX.sub("", parts[0]).strip()
        a_part = parts[1].strip()
        return q_part, a_part
    # Fallback: whole text is treated as question, no answer.
    return _Q_PREFIX.sub("", raw).strip(), ""


def _map_grade(raw_grade) -> GradeLevel:
    try:
        g = int(raw_grade)
        return _GRADE_MAP.get(g, GradeLevel.UNKNOWN)
    except (TypeError, ValueError):
        return GradeLevel.UNKNOWN


def export_entries(db_path: str | Path) -> list[dict]:
    """Read all rows from the SQLite ``documents`` table.

    Returns a list of dicts with keys:
        id, subject, grade, grade_level, chapter, question, answer, source, difficulty
    """
    db_path = Path(db_path)
    if not db_path.exists():
        raise FileNotFoundError(f"SQLite database not found: {db_path}")

    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("SELECT id, text, metadata FROM documents")
    rows = cur.fetchall()
    conn.close()

    entries: list[dict] = []
    for row in rows:
        try:
            meta = json.loads(row["metadata"]) if row["metadata"] else {}
        except (json.JSONDecodeError, TypeError):
            meta = {}

        # Prefer structured metadata question; fall back to parsing text.
        meta_q = str(meta.get("question", "")).strip()
        parsed_q, parsed_a = _parse_text(row["text"] or "")

        question = meta_q if len(meta_q) >= 10 else parsed_q
        answer = parsed_a

        raw_grade = meta.get("grade")
        entries.append({
            "id": row["id"],
            "subject": str(meta.get("subject", "")).strip() or None,
            "grade": raw_grade,
            "grade_level": _map_grade(raw_grade),
            "chapter": str(meta.get("chapter", "")).strip() or None,
            "topic": str(meta.get("topic", "")).strip() or None,
            "question": question,
            "answer": answer,
            "source": str(meta.get("source", "NCERT")).strip(),
            "difficulty": str(meta.get("difficulty", "medium")).strip(),
        })

    return entries
