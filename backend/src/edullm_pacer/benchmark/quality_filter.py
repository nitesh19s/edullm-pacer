"""Quality filter for raw SQLite Q&A entries.

A row is rejected if:
- The question is too short or structurally invalid (e.g., "EXERCISE 11.1")
- The answer is a refusal / placeholder ("I'd be happy to help…")
- The question is front-matter or copyright text
- The answer is too short to be informative

Filtering is intentionally conservative — prefer keeping borderline entries
over discarding valid curriculum content.
"""
from __future__ import annotations

import re

# ------------------------------------------------------------------
# Thresholds
# ------------------------------------------------------------------
_MIN_QUESTION_CHARS = 25       # skip "EXERCISE 11.1" style entries
_MIN_ANSWER_CHARS = 80         # skip stub answers
_MAX_QUESTION_CHARS = 600      # very long "questions" are usually raw text dumps

# Patterns that mark a bad question (case-insensitive)
_BAD_QUESTION_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"^(exercise|ex\.?|activity)\s+\d+[\.\d]*$", re.I),
    re.compile(r"\b(responsibility for the correctness|publisher|printed at)\b", re.I),
    re.compile(r"^(figure|fig\.?|table|diagram)\s+\d+", re.I),
    re.compile(r"^\d+[\.\)]\s*$"),               # standalone number/bullet
    re.compile(r"^(chapter|unit|section)\s+\d+$", re.I),
]

# Patterns that mark a bad answer
_BAD_ANSWER_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"i.{0,10}(d be happy to help|m here to help)", re.I),
    re.compile(r"please provide more context", re.I),
    re.compile(r"(i cannot|i can't|i am not able to) (answer|help|provide)", re.I),
    re.compile(r"i notice that the question doesn.t seem to be related", re.I),
    re.compile(r"as an ai (language model|assistant)", re.I),
    re.compile(r"could you (please )?(clarify|provide|share)", re.I),
]


def is_valid_entry(question: str, answer: str) -> bool:
    """Return True if the Q&A pair passes all quality checks."""
    q = question.strip()
    a = answer.strip()

    if len(q) < _MIN_QUESTION_CHARS or len(q) > _MAX_QUESTION_CHARS:
        return False

    if len(a) < _MIN_ANSWER_CHARS:
        return False

    for pat in _BAD_QUESTION_PATTERNS:
        if pat.search(q):
            return False

    for pat in _BAD_ANSWER_PATTERNS:
        if pat.search(a):
            return False

    return True


def filter_entries(
    entries: list[dict],
    question_key: str = "question",
    answer_key: str = "answer",
) -> list[dict]:
    """Filter a list of dicts, keeping only those that pass quality checks."""
    return [
        e for e in entries
        if is_valid_entry(e.get(question_key, ""), e.get(answer_key, ""))
    ]
