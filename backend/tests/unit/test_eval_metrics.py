"""Tests for retrieval evaluation metrics."""
from __future__ import annotations

import math

import pytest

from edullm_pacer.eval.retrieval_metrics import (
    average_retrieval_metrics,
    compute_retrieval_metrics,
    mrr,
    ndcg_at_k,
    precision_at_k,
    recall_at_k,
)
from edullm_pacer.schemas import RetrievalMetrics


# ---------------------------------------------------------------------------
# precision_at_k
# ---------------------------------------------------------------------------


def test_precision_at_k_perfect():
    assert precision_at_k(["a", "b", "c"], {"a", "b", "c"}, k=3) == 1.0


def test_precision_at_k_zero():
    assert precision_at_k(["x", "y", "z"], {"a", "b"}, k=3) == 0.0


def test_precision_at_k_partial():
    # 1 of 3 relevant at top-3
    assert precision_at_k(["a", "x", "y"], {"a", "b"}, k=3) == pytest.approx(1 / 3)


def test_precision_at_k_truncation():
    # Only top-2 considered even if more retrieved
    assert precision_at_k(["x", "a", "b"], {"a", "b"}, k=2) == pytest.approx(1 / 2)


def test_precision_at_k_zero_k():
    assert precision_at_k(["a"], {"a"}, k=0) == 0.0


# ---------------------------------------------------------------------------
# recall_at_k
# ---------------------------------------------------------------------------


def test_recall_at_k_perfect():
    assert recall_at_k(["a", "b"], {"a", "b"}, k=2) == 1.0


def test_recall_at_k_partial():
    assert recall_at_k(["a", "x", "y"], {"a", "b"}, k=3) == pytest.approx(0.5)


def test_recall_at_k_zero():
    assert recall_at_k(["x", "y"], {"a", "b"}, k=2) == 0.0


def test_recall_at_k_empty_relevant():
    assert recall_at_k(["a"], set(), k=1) == 0.0


# ---------------------------------------------------------------------------
# mrr
# ---------------------------------------------------------------------------


def test_mrr_first_hit_rank1():
    assert mrr(["a", "b", "c"], {"a"}) == 1.0


def test_mrr_first_hit_rank2():
    assert mrr(["x", "a", "b"], {"a"}) == pytest.approx(1 / 2)


def test_mrr_first_hit_rank3():
    assert mrr(["x", "y", "a"], {"a"}) == pytest.approx(1 / 3)


def test_mrr_no_hit():
    assert mrr(["x", "y", "z"], {"a"}) == 0.0


def test_mrr_multiple_relevant_picks_first():
    assert mrr(["x", "a", "b"], {"a", "b"}) == pytest.approx(1 / 2)


# ---------------------------------------------------------------------------
# ndcg_at_k
# ---------------------------------------------------------------------------


def test_ndcg_perfect_ranking():
    # Single relevant doc at rank 1 → IDCG = 1/log2(2) = 1.0 → nDCG = 1.0
    assert ndcg_at_k(["a", "x", "y"], {"a"}, k=3) == pytest.approx(1.0)


def test_ndcg_relevant_at_rank2():
    # DCG = 1/log2(3) ≈ 0.631; IDCG = 1/log2(2) = 1.0
    expected = (1 / math.log2(3)) / (1 / math.log2(2))
    assert ndcg_at_k(["x", "a", "y"], {"a"}, k=3) == pytest.approx(expected)


def test_ndcg_no_relevant():
    assert ndcg_at_k(["x", "y"], {"a"}, k=2) == 0.0


def test_ndcg_empty_relevant():
    assert ndcg_at_k(["a", "b"], set(), k=2) == 0.0


def test_ndcg_all_relevant():
    # Perfect: a, b both relevant and at top-2
    assert ndcg_at_k(["a", "b"], {"a", "b"}, k=2) == pytest.approx(1.0)


def test_ndcg_k_zero():
    assert ndcg_at_k(["a"], {"a"}, k=0) == 0.0


# ---------------------------------------------------------------------------
# compute_retrieval_metrics
# ---------------------------------------------------------------------------


def test_compute_retrieval_metrics_structure():
    metrics = compute_retrieval_metrics(["a", "b", "x", "y"], {"a", "b"}, k_values=[1, 3, 5])
    assert set(metrics.precision_at_k.keys()) == {1, 3, 5}
    assert set(metrics.recall_at_k.keys()) == {1, 3, 5}
    assert set(metrics.ndcg_at_k.keys()) == {1, 3, 5}
    assert metrics.mrr is not None


def test_compute_retrieval_metrics_values():
    retrieved = ["a", "x", "b"]
    relevant = {"a", "b"}
    m = compute_retrieval_metrics(retrieved, relevant, k_values=[3])
    assert m.precision_at_k[3] == pytest.approx(2 / 3)
    assert m.recall_at_k[3] == pytest.approx(1.0)
    assert m.mrr == pytest.approx(1.0)  # "a" is at rank 1


# ---------------------------------------------------------------------------
# average_retrieval_metrics
# ---------------------------------------------------------------------------


def test_average_retrieval_metrics_empty():
    avg = average_retrieval_metrics([])
    assert avg == RetrievalMetrics()


def test_average_retrieval_metrics_single():
    m = compute_retrieval_metrics(["a", "b"], {"a"}, k_values=[1, 3])
    avg = average_retrieval_metrics([m])
    assert avg.precision_at_k == m.precision_at_k
    assert avg.mrr == m.mrr


def test_average_retrieval_metrics_two_queries():
    m1 = compute_retrieval_metrics(["a", "x"], {"a"}, k_values=[1])
    m2 = compute_retrieval_metrics(["x", "a"], {"a"}, k_values=[1])
    avg = average_retrieval_metrics([m1, m2])
    # P@1: (1.0 + 0.0) / 2 = 0.5
    assert avg.precision_at_k[1] == pytest.approx(0.5)
    # MRR: (1.0 + 0.5) / 2 = 0.75
    assert avg.mrr == pytest.approx(0.75)
