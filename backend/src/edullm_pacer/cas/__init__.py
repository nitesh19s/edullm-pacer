"""Curriculum Alignment Score (CAS) subpackage.

Public API::

    from edullm_pacer.cas import CASScorer

    scorer = CASScorer(alpha=0.40, beta=0.35, gamma=0.25)
    cas = scorer.score(query, chunk)   # → CASScore
    print(cas.overall, cas.grade_match, cas.prereq_preservation, cas.bloom_alignment)
"""
from edullm_pacer.cas.scorer import CASScorer

__all__ = ["CASScorer"]
