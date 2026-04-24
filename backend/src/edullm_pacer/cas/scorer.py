"""Curriculum Alignment Score (CAS) computation.

CAS = α · grade_match + β · prereq_preservation + γ · bloom_alignment

Each sub-score is in [0, 1].  Default weights were set by the paper's protocol;
they can be calibrated from human-rating data using ``CASScorer.calibrate()``.

Sub-score definitions
---------------------
grade_match
    Ordinal proximity between the query's expected grade level and the chunk's
    grade metadata.  Same grade → 1.0; adjacent → 0.7; two apart → 0.3; beyond
    → 0.0; any UNKNOWN → 0.5 (neutral).

prereq_preservation
    Proportion of non-trivial query tokens that appear in the chunk's
    ``prerequisites`` + ``concepts`` lists.  Falls back to raw token overlap
    when the chunk has no structured metadata.

bloom_alignment
    Cognitive proximity on Bloom's revised taxonomy (6-level hierarchy).
    Same level → 1.0; one step apart → 0.8; two steps → 0.5; three → 0.2;
    further → 0.0; any UNKNOWN → 0.5.
"""
from __future__ import annotations

import re
from typing import Sequence

from edullm_pacer.schemas import BloomLevel, CASScore, Chunk, GradeLevel, Query

# ---------------------------------------------------------------------------
# Ordinal grade map (lower = earlier)
# ---------------------------------------------------------------------------
_GRADE_ORDER: dict[str, int] = {
    GradeLevel.ELEMENTARY: 0,
    GradeLevel.MIDDLE: 1,
    GradeLevel.SECONDARY: 2,
    GradeLevel.HIGHER_SECONDARY: 3,
    GradeLevel.UNDERGRADUATE: 4,
    GradeLevel.POSTGRADUATE: 5,
}

# Grade match score by ordinal distance.
_GRADE_SCORE: dict[int, float] = {0: 1.0, 1: 0.7, 2: 0.3}
_GRADE_UNKNOWN_SCORE = 0.5

# ---------------------------------------------------------------------------
# Bloom level cognitive proximity
# ---------------------------------------------------------------------------
_BLOOM_ORDER: dict[str, int] = {
    BloomLevel.REMEMBER: 0,
    BloomLevel.UNDERSTAND: 1,
    BloomLevel.APPLY: 2,
    BloomLevel.ANALYZE: 3,
    BloomLevel.EVALUATE: 4,
    BloomLevel.CREATE: 5,
}

_BLOOM_SCORE: dict[int, float] = {0: 1.0, 1: 0.8, 2: 0.5, 3: 0.2}
_BLOOM_UNKNOWN_SCORE = 0.5

# Stop-words to exclude from token overlap (small set to stay dependency-free).
_STOP_WORDS = frozenset(
    "a an the is are was were be been being have has had do does did "
    "will would could should may might shall can of in on at by for "
    "to from with and or not but this that these those it its".split()
)


class CASScorer:
    """Compute Curriculum Alignment Score for (query, chunk) pairs.

    Args:
        alpha: weight for grade_match (default 0.40).
        beta:  weight for prereq_preservation (default 0.35).
        gamma: weight for bloom_alignment (default 0.25).
    """

    def __init__(
        self,
        alpha: float = 0.40,
        beta: float = 0.35,
        gamma: float = 0.25,
    ) -> None:
        if abs(alpha + beta + gamma - 1.0) > 1e-6:
            raise ValueError("alpha + beta + gamma must sum to 1.0")
        self.alpha = alpha
        self.beta = beta
        self.gamma = gamma

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def score(self, query: Query, chunk: Chunk) -> CASScore:
        """Return the CAS breakdown for a single (query, chunk) pair."""
        gm = self._grade_match(query, chunk)
        pp = self._prereq_preservation(query, chunk)
        ba = self._bloom_alignment(query, chunk)
        overall = self.alpha * gm + self.beta * pp + self.gamma * ba
        return CASScore(
            overall=round(overall, 4),
            grade_match=round(gm, 4),
            prereq_preservation=round(pp, 4),
            bloom_alignment=round(ba, 4),
            weights={"alpha": self.alpha, "beta": self.beta, "gamma": self.gamma},
        )

    def score_batch(
        self,
        query: Query,
        chunks: Sequence[Chunk],
    ) -> list[CASScore]:
        """Score a query against multiple chunks."""
        return [self.score(query, chunk) for chunk in chunks]

    def mean_cas(self, scores: Sequence[CASScore]) -> float:
        """Average overall CAS across a sequence of scores."""
        if not scores:
            return 0.0
        return sum(s.overall for s in scores) / len(scores)

    def calibrate(
        self,
        human_ratings: list[dict],
        *,
        learning_rate: float = 0.01,
        max_iter: int = 500,
    ) -> "CASScorer":
        """Adjust weights to minimise MSE against human ratings.

        Each entry in ``human_ratings`` must have keys:
            ``query``, ``chunk``, ``rating`` (float in [1, 5], normalised to [0, 1] internally).

        Returns a new CASScorer with calibrated weights (original unchanged).
        This is a simple gradient-descent implementation with no external ML dep.
        """
        if not human_ratings:
            return self

        alpha, beta, gamma = self.alpha, self.beta, self.gamma

        for _ in range(max_iter):
            d_alpha = d_beta = d_gamma = 0.0
            for entry in human_ratings:
                q: Query = entry["query"]
                c: Chunk = entry["chunk"]
                target = (float(entry["rating"]) - 1.0) / 4.0  # normalise [1,5] → [0,1]
                gm = self._grade_match(q, c)
                pp = self._prereq_preservation(q, c)
                ba = self._bloom_alignment(q, c)
                pred = alpha * gm + beta * pp + gamma * ba
                err = pred - target
                d_alpha += err * gm
                d_beta += err * pp
                d_gamma += err * ba

            n = len(human_ratings)
            alpha -= learning_rate * (2 * d_alpha / n)
            beta -= learning_rate * (2 * d_beta / n)
            gamma -= learning_rate * (2 * d_gamma / n)

            # Project onto simplex: keep positive and normalise.
            alpha = max(alpha, 0.05)
            beta = max(beta, 0.05)
            gamma = max(gamma, 0.05)
            total = alpha + beta + gamma
            alpha /= total
            beta /= total
            gamma /= total

        return CASScorer(alpha=round(alpha, 4), beta=round(beta, 4), gamma=round(gamma, 4))

    # ------------------------------------------------------------------
    # Sub-score helpers
    # ------------------------------------------------------------------

    def _grade_match(self, query: Query, chunk: Chunk) -> float:
        q_grade = str(query.grade)
        c_grade = str(chunk.metadata.grade)

        if q_grade == GradeLevel.UNKNOWN or c_grade == GradeLevel.UNKNOWN:
            return _GRADE_UNKNOWN_SCORE

        q_ord = _GRADE_ORDER.get(q_grade)
        c_ord = _GRADE_ORDER.get(c_grade)
        if q_ord is None or c_ord is None:
            return _GRADE_UNKNOWN_SCORE

        dist = abs(q_ord - c_ord)
        return _GRADE_SCORE.get(dist, 0.0)

    def _prereq_preservation(self, query: Query, chunk: Chunk) -> float:
        # Build the "reference vocabulary" from chunk concepts + prerequisites.
        ref_tokens = set()
        for term in chunk.metadata.concepts + chunk.metadata.prerequisites:
            ref_tokens.update(_tokenise(term))

        # If no structured metadata, fall back to raw chunk text tokens.
        if not ref_tokens:
            ref_tokens = _tokenise(chunk.text)

        query_tokens = _tokenise(query.text)
        if not query_tokens:
            return 0.0

        overlap = query_tokens & ref_tokens
        return len(overlap) / len(query_tokens)

    def _bloom_alignment(self, query: Query, chunk: Chunk) -> float:
        q_bloom = str(query.bloom_level)
        c_bloom = str(chunk.metadata.bloom_level)

        if q_bloom == BloomLevel.UNKNOWN or c_bloom == BloomLevel.UNKNOWN:
            return _BLOOM_UNKNOWN_SCORE

        q_ord = _BLOOM_ORDER.get(q_bloom)
        c_ord = _BLOOM_ORDER.get(c_bloom)
        if q_ord is None or c_ord is None:
            return _BLOOM_UNKNOWN_SCORE

        dist = abs(q_ord - c_ord)
        return _BLOOM_SCORE.get(dist, 0.0)

    def __repr__(self) -> str:  # pragma: no cover
        return f"CASScorer(α={self.alpha}, β={self.beta}, γ={self.gamma})"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _tokenise(text: str) -> set[str]:
    """Lowercase word tokens, filtering stop-words and short tokens."""
    tokens = re.findall(r"[a-zA-Z]{3,}", text.lower())
    return {t for t in tokens if t not in _STOP_WORDS}
