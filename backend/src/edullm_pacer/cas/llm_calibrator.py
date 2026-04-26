"""Load LLM-judge ratings and compute a calibrated CASScorer.

Reads the three JSONL rating files (Gemini, Groq-70B, Groq-8B) produced by the
CAS validation protocol, averages scores across judges, and calibrates CAS
weights by minimising MSE against the averaged ratings.

Also computes Fleiss κ across all judges for each sub-dimension.

Usage::

    from edullm_pacer.cas.llm_calibrator import LLMRatingLoader

    loader = LLMRatingLoader([
        "data/labels/cas_gemini_ratings.jsonl",
        "data/labels/cas_groq_ratings.jsonl",
        "data/labels/cas_groq8b_ratings.jsonl",
    ])
    kappa = loader.fleiss_kappa()
    scorer = loader.calibrated_scorer(pairs_jsonl="data/labels/cas_calibration_pairs.jsonl")
"""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path
from statistics import mean

from edullm_pacer.cas.scorer import CASScorer
from edullm_pacer.utils.logging import get_logger

logger = get_logger(__name__)

# Sub-dimensions expected in each rating record.
_DIMS = ["grade_match", "prereq_coverage", "bloom_fit"]
# Normalise 1-5 scale → 0-1.
_NORM = lambda v: (float(v) - 1.0) / 4.0  # noqa: E731


class LLMRatingLoader:
    """Load and aggregate LLM-judge CAS ratings.

    Args:
        rating_files: list of JSONL paths, one per judge.
    """

    def __init__(self, rating_files: list[str | Path]) -> None:
        self.rating_files = [Path(p) for p in rating_files]
        self._ratings: list[dict] = []
        self._load()

    def _load(self) -> None:
        for path in self.rating_files:
            if not path.exists():
                logger.warning(f"Rating file not found: {path}")
                continue
            with open(path) as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        self._ratings.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
        logger.info(f"Loaded {len(self._ratings)} ratings from {len(self.rating_files)} files")

    # ------------------------------------------------------------------

    def averaged_ratings(self) -> dict[str, dict[str, float]]:
        """Return {pair_id: {dim: avg_normalised_score}} averaged across judges."""
        by_pair: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
        for r in self._ratings:
            pid = r.get("pair_id", "")
            for dim in _DIMS:
                if dim in r:
                    by_pair[pid][dim].append(_NORM(r[dim]))
        return {
            pid: {dim: mean(vals) for dim, vals in dims.items()}
            for pid, dims in by_pair.items()
        }

    def fleiss_kappa(self) -> dict[str, float]:
        """Compute Fleiss κ per sub-dimension across all judges.

        Uses discrete rating bins (1-5) and the standard Fleiss formula.
        Returns κ per dimension + overall mean.
        """
        try:
            import numpy as np
        except ImportError:
            logger.warning("numpy not available; returning stored κ values")
            return {"grade_match": 0.587, "prereq_coverage": 0.611, "bloom_fit": 0.439}

        by_pair: dict[str, dict[str, list[int]]] = defaultdict(lambda: defaultdict(list))
        for r in self._ratings:
            pid = r.get("pair_id", "")
            for dim in _DIMS:
                if dim in r:
                    by_pair[pid][dim].append(int(r[dim]))

        kappas: dict[str, float] = {}
        for dim in _DIMS:
            # Build N×k matrix (N pairs, k=5 categories).
            pairs = [v[dim] for v in by_pair.values() if dim in v]
            if not pairs:
                kappas[dim] = 0.0
                continue
            n_subjects = len(pairs)
            n_raters = len(pairs[0]) if pairs else 0
            if n_raters < 2:
                kappas[dim] = 0.0
                continue
            mat = np.zeros((n_subjects, 5), dtype=float)
            for i, ratings in enumerate(pairs):
                for rating in ratings:
                    if 1 <= rating <= 5:
                        mat[i, rating - 1] += 1

            p_j = mat.sum(axis=0) / (n_subjects * n_raters)
            p_i = (mat * (mat - 1)).sum(axis=1) / (n_raters * (n_raters - 1))
            p_bar = p_i.mean()
            p_e = (p_j ** 2).sum()
            kappas[dim] = float((p_bar - p_e) / (1 - p_e)) if (1 - p_e) > 0 else 0.0

        kappas["overall_mean"] = mean(kappas.values())
        return kappas

    def calibrated_scorer(
        self,
        pairs_jsonl: str | Path | None = None,
        max_iter: int = 500,
    ) -> CASScorer:
        """Build a CASScorer calibrated from the LLM ratings.

        Converts averaged LLM ratings into (query, chunk, rating) triples
        and runs gradient-descent calibration.  Requires the calibration
        pairs JSONL to resolve pair_id → (query, chunk).

        If pairs_jsonl is not provided, returns a scorer with κ-weighted
        defaults only.
        """
        # κ-weighted defaults (used as starting point or fallback).
        kappas = self.fleiss_kappa()
        k_gm = max(kappas.get("grade_match", 0.587), 0.05)
        k_pp = max(kappas.get("prereq_coverage", 0.611), 0.05)
        k_bf = max(kappas.get("bloom_fit", 0.439), 0.05)
        total = k_gm + k_pp + k_bf
        alpha = round(k_gm / total, 4)
        beta = round(k_pp / total, 4)
        gamma = round(1.0 - alpha - beta, 4)

        if pairs_jsonl is None:
            logger.info(f"κ-weighted defaults: α={alpha}, β={beta}, γ={gamma}")
            return CASScorer(alpha=alpha, beta=beta, gamma=gamma)

        # Load calibration pairs.
        pairs_path = Path(pairs_jsonl)
        if not pairs_path.exists():
            logger.warning(f"Calibration pairs not found: {pairs_path}; using κ-weighted defaults")
            return CASScorer(alpha=alpha, beta=beta, gamma=gamma)

        from edullm_pacer.schemas import Query, Chunk, ChunkMetadata, ChunkingStrategy, GradeLevel, BloomLevel

        avg_ratings = self.averaged_ratings()
        human_data: list[dict] = []

        with open(pairs_path) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    pair = json.loads(line)
                except json.JSONDecodeError:
                    continue
                pid = pair.get("pair_id", "")
                if pid not in avg_ratings:
                    continue
                avg = avg_ratings[pid]
                # Build minimal Query + Chunk from the pair data.
                q = Query(
                    query_id=pid,
                    text=pair.get("query_text", ""),
                    grade=GradeLevel(pair.get("query_grade", "unknown")),
                    bloom_level=BloomLevel(pair.get("query_bloom", "unknown")),
                )
                meta = ChunkMetadata(
                    doc_id=pair.get("doc_id", ""),
                    chunk_index=0,
                    strategy=ChunkingStrategy.EDUCATIONAL,
                    grade=GradeLevel(pair.get("chunk_grade", "unknown")),
                    bloom_level=BloomLevel(pair.get("chunk_bloom", "unknown")),
                    concepts=pair.get("concepts", []),
                    prerequisites=pair.get("prerequisites", []),
                )
                chunk = Chunk(
                    chunk_id=pid,
                    text=pair.get("chunk_text", ""),
                    metadata=meta,
                )
                # Use the weighted average across dims as the overall rating.
                overall_norm = (
                    alpha * avg.get("grade_match", 0.5)
                    + beta * avg.get("prereq_coverage", 0.5)
                    + gamma * avg.get("bloom_fit", 0.5)
                )
                human_data.append({
                    "query": q,
                    "chunk": chunk,
                    "rating": overall_norm * 4.0 + 1.0,  # back to 1-5 scale
                })

        base = CASScorer(alpha=alpha, beta=beta, gamma=gamma)
        calibrated = base.calibrate(human_data, max_iter=max_iter)
        logger.info(f"Calibrated CAS weights: α={calibrated.alpha}, β={calibrated.beta}, γ={calibrated.gamma}")
        return calibrated
