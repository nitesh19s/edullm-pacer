"""Pedagogical boundary detector.

Standalone module that detects whether a chunk ends mid-pedagogical-unit —
i.e., a structural opener (Definition, Theorem, Example, Q&A pair) appears
near the end of the chunk without a natural closure.

This is deliberately kept separate from the EducationalChunker so it can be
applied as a post-processing step on output from *any* chunker (recursive,
fixed, semantic) to audit and flag boundary violations.
"""
from __future__ import annotations

import re

# ---------------------------------------------------------------------------
# Reuse opener patterns from the educational chunker (no circular dep —
# we duplicate the compiled forms here so this module is self-contained).
# ---------------------------------------------------------------------------

_OPENER_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"^\s*(chapter|unit|section|module|lesson)\s+\d+", re.I), "section_header"),
    (re.compile(r"^\s*(learning\s+objectives?|by\s+the\s+end|after\s+(reading|studying))", re.I),
     "learning_objective"),
    (re.compile(r"^\s*(definition|def\.?)\s*[:\-]", re.I), "definition"),
    (re.compile(r"^\s*(example|worked\s+example|illustration|ex\.?\s*\d)", re.I), "worked_example"),
    (re.compile(r"^\s*(theorem|lemma|proposition|corollary|axiom|postulate)\b", re.I), "theorem"),
    (re.compile(r"^\s*(proof|solution|sol\.?)\s*[:\-]?", re.I), "proof"),
    (re.compile(r"^\s*(q|question)\.?\s*\d+", re.I), "question"),
    (re.compile(r"^\s*\d+\.\s+[A-Z]", re.I), "numbered_item"),
    (re.compile(r"^\s*(activity|try\s+yourself|exercise|ex\.?\s*\d)", re.I), "activity"),
    (re.compile(r"^\s*(key\s+points?|summary|note\s*[:\-]|remember)", re.I), "summary"),
]

_CLOSER_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\b(hence\s+proved|hence\b|therefore\b|q\.?e\.?d\.?|answer\s*[:\-])", re.I),
    re.compile(r"\b(end\s+of\s+(chapter|section|example))\b", re.I),
    re.compile(r"[∴∵]"),   # therefore / because symbols
    re.compile(r"^\s*∴", re.MULTILINE),
]

# How many lines from the end of a chunk to scan for "dangling" openers.
_TAIL_LINES = 5
# Minimum body lines that must follow an opener to consider the unit closed.
_MIN_BODY_LINES = 1


def find_opener(line: str) -> str | None:
    """Return the unit kind if *line* matches a pedagogical opener, else None."""
    stripped = line.lstrip()
    for pattern, kind in _OPENER_PATTERNS:
        if pattern.match(stripped):
            return kind
    return None


def has_closer(text: str) -> bool:
    """Return True if *text* contains an explicit closure marker."""
    for pattern in _CLOSER_PATTERNS:
        if pattern.search(text):
            return True
    return False


def ends_mid_unit(chunk_text: str) -> bool:
    """Heuristic: does this chunk end partway through a pedagogical unit?

    Strategy:
    1. Look at the last ``_TAIL_LINES`` lines of the chunk.
    2. Find the last opener in that tail.
    3. If the opener is found AND there are fewer than ``_MIN_BODY_LINES``
       non-empty lines after it AND no closer follows — the unit is dangling.
    """
    lines = [ln for ln in chunk_text.splitlines() if ln.strip()]
    if not lines:
        return False

    tail = lines[-_TAIL_LINES:]
    last_opener_idx: int | None = None
    for i, line in enumerate(tail):
        if find_opener(line) is not None:
            last_opener_idx = i

    if last_opener_idx is None:
        return False

    # Lines after the opener (within the tail).
    body_lines_after = [ln for ln in tail[last_opener_idx + 1:] if ln.strip()]
    if len(body_lines_after) >= _MIN_BODY_LINES:
        return False

    # Check the full chunk for a closer AFTER the opener position.
    all_lines = chunk_text.splitlines()
    opener_abs = len(all_lines) - _TAIL_LINES + last_opener_idx
    after_opener_text = "\n".join(all_lines[max(0, opener_abs):])
    return not has_closer(after_opener_text)


def detect_boundary_violations(chunks_text: list[str]) -> list[int]:
    """Return the indices of chunks that end mid-pedagogical-unit."""
    return [i for i, text in enumerate(chunks_text) if ends_mid_unit(text)]
