"""Bloom's taxonomy tagger for question text.

Maps a question string to a BloomLevel using keyword matching on the question
stem.  No ML dependency — rules are derived from standard Bloom's action-verb
taxonomies used in NCERT/CBSE pedagogy literature.

Priority order: EVALUATE > ANALYZE > CREATE > APPLY > UNDERSTAND > REMEMBER
(higher order wins when multiple stems match).
"""
from __future__ import annotations

import re

from edullm_pacer.schemas import BloomLevel

# Each entry: (compiled pattern, BloomLevel)
# Patterns match the START of a question or key verb phrases.
_RULES: list[tuple[re.Pattern[str], BloomLevel]] = [
    # CREATE — design, propose, compose, formulate
    (re.compile(
        r"\b(design|create|construct|compose|formulate|propose|develop|invent|plan\s+a|"
        r"write\s+a\s+(program|algorithm|formula)|derive\s+an?\s+expression)\b", re.I),
     BloomLevel.CREATE),

    # EVALUATE — judge, justify, argue, assess, defend
    (re.compile(
        r"\b(evaluate|assess|judge|justify|defend|argue|critique|appraise|"
        r"do\s+you\s+think|in\s+your\s+opinion|should|would\s+you)\b", re.I),
     BloomLevel.EVALUATE),

    # ANALYZE — compare, differentiate, examine, distinguish, relate
    (re.compile(
        r"\b(analyze|analyse|compare|contrast|differentiate|distinguish|examine|"
        r"investigate|classify|categorize|relate|what\s+is\s+the\s+(relationship|difference|"
        r"similarity)|how\s+(are|do)\s+\w+\s+(different|similar|related))\b", re.I),
     BloomLevel.ANALYZE),

    # APPLY — calculate, solve, find, compute, use, apply, determine
    (re.compile(
        r"\b(calculate|compute|solve|find|determine|show\s+that|prove|verify|"
        r"apply|use\s+the|evaluate\s+the\s+(expression|integral|derivative|value)|"
        r"simplify|factorise|factorize|expand|integrate|differentiate\s+the|"
        r"draw\s+(a\s+graph|the\s+graph)|plot)\b", re.I),
     BloomLevel.APPLY),

    # UNDERSTAND — explain, describe, how does, why, summarize, interpret
    (re.compile(
        r"\b(explain|describe|summarize|summarise|interpret|illustrate|"
        r"how\s+does|how\s+do|why\s+(does|do|is|are|was|were|did)|what\s+happens|"
        r"what\s+are\s+the\s+(reasons|causes|effects|consequences)|"
        r"give\s+(an?\s+)?(example|reason|account)|outline)\b", re.I),
     BloomLevel.UNDERSTAND),

    # REMEMBER — define, state, list, name, what is, identify, recall
    (re.compile(
        r"\b(define|state|list|name|identify|recall|write\s+(the|down)|"
        r"what\s+is\s+(the\s+)?(definition|meaning|formula|unit|value|SI\s+unit)|"
        r"who\s+(is|was|invented|discovered)|when\s+(was|did)|where\s+(is|was)|"
        r"what\s+is\s+the\s+(full\s+form|symbol)|give\s+(the\s+)?(definition|formula|value))\b",
        re.I),
     BloomLevel.REMEMBER),
]

# Default when no rule matches — most NCERT questions are at UNDERSTAND level.
_DEFAULT = BloomLevel.UNDERSTAND


def tag_bloom(question: str) -> BloomLevel:
    """Return the most likely Bloom level for the given question text."""
    for pattern, level in _RULES:
        if pattern.search(question):
            return level
    return _DEFAULT


def tag_bloom_batch(questions: list[str]) -> list[BloomLevel]:
    return [tag_bloom(q) for q in questions]
