"""Evaluation subpackage.

Public API::

    from edullm_pacer.eval import ExperimentRunner
    from edullm_pacer.eval.retrieval_metrics import compute_retrieval_metrics, average_retrieval_metrics
"""
from edullm_pacer.eval.experiment_runner import ExperimentRunner
from edullm_pacer.eval.retrieval_metrics import (
    average_retrieval_metrics,
    compute_retrieval_metrics,
    mrr,
    ndcg_at_k,
    precision_at_k,
    recall_at_k,
)

__all__ = [
    "ExperimentRunner",
    "compute_retrieval_metrics",
    "average_retrieval_metrics",
    "precision_at_k",
    "recall_at_k",
    "mrr",
    "ndcg_at_k",
]
