"""Standard IR evaluation metrics for retrieval quality.

All functions operate on plain Python types (lists and sets of IDs) so they
can be used independently of any retriever implementation.

Functions
---------
precision_at_k   — fraction of top-k results that are relevant
recall_at_k      — fraction of relevant docs found in top-k
mrr              — mean reciprocal rank (first relevant hit)
ndcg_at_k        — normalised discounted cumulative gain
compute_retrieval_metrics — convenience wrapper returning RetrievalMetrics

Aggregation
-----------
average_retrieval_metrics — macro-average a list of RetrievalMetrics
"""
from __future__ import annotations

import math

from edullm_pacer.schemas import RetrievalMetrics

_DEFAULT_K = [1, 3, 5, 10]


def precision_at_k(
    retrieved_ids: list[str],
    relevant_ids: set[str],
    k: int,
) -> float:
    """Fraction of the top-*k* retrieved items that are relevant."""
    if k <= 0:
        return 0.0
    top_k = retrieved_ids[:k]
    hits = sum(1 for r in top_k if r in relevant_ids)
    return hits / k


def recall_at_k(
    retrieved_ids: list[str],
    relevant_ids: set[str],
    k: int,
) -> float:
    """Fraction of all relevant items found in the top-*k* results."""
    if not relevant_ids:
        return 0.0
    top_k = retrieved_ids[:k]
    hits = sum(1 for r in top_k if r in relevant_ids)
    return hits / len(relevant_ids)


def mrr(retrieved_ids: list[str], relevant_ids: set[str]) -> float:
    """Reciprocal rank of the first relevant item (0.0 if none found)."""
    for rank, rid in enumerate(retrieved_ids, start=1):
        if rid in relevant_ids:
            return 1.0 / rank
    return 0.0


def ndcg_at_k(
    retrieved_ids: list[str],
    relevant_ids: set[str],
    k: int,
) -> float:
    """Normalised Discounted Cumulative Gain at *k*.

    Binary relevance: 1 if the retrieved ID is in relevant_ids, else 0.
    IDCG is the gain of a perfect ranking (all relevant docs at the top).
    """
    if k <= 0 or not relevant_ids:
        return 0.0

    top_k = retrieved_ids[:k]
    dcg = sum(
        1.0 / math.log2(rank + 1)
        for rank, rid in enumerate(top_k, start=1)
        if rid in relevant_ids
    )
    # Perfect ranking: min(k, |relevant|) hits at the top ranks.
    ideal_hits = min(k, len(relevant_ids))
    idcg = sum(1.0 / math.log2(rank + 1) for rank in range(1, ideal_hits + 1))
    return dcg / idcg if idcg > 0 else 0.0


def compute_retrieval_metrics(
    retrieved_ids: list[str],
    relevant_ids: set[str],
    k_values: list[int] = _DEFAULT_K,
) -> RetrievalMetrics:
    """Compute all standard IR metrics for one query.

    Args:
        retrieved_ids: chunk/doc IDs in rank order (first = most relevant).
        relevant_ids:  set of ground-truth IDs for this query.
        k_values:      list of cut-off depths.

    Returns:
        RetrievalMetrics with precision_at_k, recall_at_k, ndcg_at_k, mrr filled.
    """
    return RetrievalMetrics(
        precision_at_k={k: precision_at_k(retrieved_ids, relevant_ids, k) for k in k_values},
        recall_at_k={k: recall_at_k(retrieved_ids, relevant_ids, k) for k in k_values},
        ndcg_at_k={k: ndcg_at_k(retrieved_ids, relevant_ids, k) for k in k_values},
        mrr=mrr(retrieved_ids, relevant_ids),
    )


def average_retrieval_metrics(metrics_list: list[RetrievalMetrics]) -> RetrievalMetrics:
    """Macro-average a list of per-query RetrievalMetrics."""
    if not metrics_list:
        return RetrievalMetrics()

    # Collect all k values present across all metrics.
    all_k = set()
    for m in metrics_list:
        all_k.update(m.precision_at_k.keys())
        all_k.update(m.recall_at_k.keys())
        all_k.update(m.ndcg_at_k.keys())

    n = len(metrics_list)

    def _avg_at_k(getter, k: int) -> float:
        vals = [getter(m).get(k, 0.0) for m in metrics_list]
        return sum(vals) / n

    mrr_vals = [m.mrr for m in metrics_list if m.mrr is not None]

    return RetrievalMetrics(
        precision_at_k={k: _avg_at_k(lambda m: m.precision_at_k, k) for k in sorted(all_k)},
        recall_at_k={k: _avg_at_k(lambda m: m.recall_at_k, k) for k in sorted(all_k)},
        ndcg_at_k={k: _avg_at_k(lambda m: m.ndcg_at_k, k) for k in sorted(all_k)},
        mrr=sum(mrr_vals) / len(mrr_vals) if mrr_vals else None,
    )
