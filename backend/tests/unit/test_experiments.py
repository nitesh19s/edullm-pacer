"""Tests for Workstream E: experiment infrastructure.

All tests use HashEmbedder and DummyGenerator — no GPU, no internet required.
"""
from __future__ import annotations

import json
import sqlite3
import tempfile
from pathlib import Path

import pytest

from edullm_pacer.embeddings.hash_embedder import HashEmbedder
from edullm_pacer.experiments.config import ConditionConfig, ExperimentConfig
from edullm_pacer.experiments.pacer_pipeline import build_baseline_pipeline, build_pacer_pipeline
from edullm_pacer.experiments.results_analyzer import ResultsAnalyzer
from edullm_pacer.generation.dummy import DummyGenerator
from edullm_pacer.schemas import (
    BloomLevel,
    CASScore,
    Document,
    DocumentMetadata,
    DocumentType,
    EvaluationRecord,
    GenerationMetrics,
    GradeLevel,
    Query,
    RetrievalMetrics,
)
from edullm_pacer.utils.io import write_jsonl


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


def _make_docs(n: int = 10) -> list[Document]:
    subjects = ["Mathematics", "Science", "Social Science"]
    texts = [
        "Definition: A force is a push or pull. Forces can change speed and direction.",
        "Theorem: The sum of angles in a triangle is 180 degrees. Proof: extend one side.",
        "Q1. What is photosynthesis? Answer: It converts sunlight to glucose in chloroplasts.",
        "Example 1: A car travels 60 km in 1 hour. Find its speed. Solution: Speed = 60 km/h.",
        "Chapter 4: Democracy. A government elected by the people is a democratic government.",
    ] * (n // 5 + 1)
    docs = []
    for i in range(n):
        meta = DocumentMetadata(
            subject=subjects[i % len(subjects)],
            grade=GradeLevel.SECONDARY,
            doc_type=DocumentType.UNKNOWN,
        )
        docs.append(Document(doc_id=f"doc_{i:03d}", text=texts[i % len(texts)], metadata=meta))
    return docs


def _make_queries(n: int = 5) -> list[Query]:
    return [
        Query(
            query_id=f"q_{i:03d}",
            text=f"What is concept number {i}?",
            subject="Science",
            grade=GradeLevel.SECONDARY,
            bloom_level=BloomLevel.UNDERSTAND,
        )
        for i in range(n)
    ]


# ---------------------------------------------------------------------------
# ExperimentConfig
# ---------------------------------------------------------------------------


def test_experiment_config_basic():
    cfg = ExperimentConfig(
        experiment_id="test_exp",
        conditions=[
            ConditionConfig(name="pacer", mode="adaptive", use_boundary_pp=True, use_router=True),
            ConditionConfig(name="fixed_512", mode="fixed", strategy="fixed", chunk_size=512),
        ],
        embedding_models=["BAAI/bge-large-en-v1.5"],
        generator_models=["Llama-3.1-8B"],
    )
    assert len(cfg.conditions) == 2
    assert len(cfg.all_runs()) == 2  # 2 conditions × 1 emb × 1 gen


def test_run_id_format():
    cfg = ExperimentConfig(
        experiment_id="myexp",
        conditions=[ConditionConfig(name="pacer", mode="adaptive")],
        embedding_models=["BAAI/bge-large-en-v1.5"],
        generator_models=["Llama-3.1-8B"],
    )
    rid = cfg.run_id("pacer", "BAAI/bge-large-en-v1.5", "Llama-3.1-8B")
    assert rid.startswith("myexp__pacer__")
    assert "__" in rid


def test_condition_config_defaults():
    cond = ConditionConfig(name="test", mode="fixed")
    assert cond.strategy == "educational"
    assert cond.use_boundary_pp is False
    assert cond.retriever == "hybrid"


# ---------------------------------------------------------------------------
# PACERPipeline (PACER mode)
# ---------------------------------------------------------------------------


def test_pacer_pipeline_index_and_retrieve():
    embedder = HashEmbedder(dim=32)
    pipeline = build_pacer_pipeline(
        embedder=embedder,
        generator=None,
        use_boundary_pp=True,
        use_router=True,
        chunk_size=500,
        chunk_overlap=50,
    )
    docs = _make_docs(10)
    chunks, strategy_counts = pipeline.index(docs)

    assert len(chunks) > 0
    assert isinstance(strategy_counts, dict)
    assert len(pipeline) > 0


def test_pacer_pipeline_ask_retrieval_only():
    embedder = HashEmbedder(dim=32)
    pipeline = build_pacer_pipeline(embedder=embedder, generator=None, chunk_size=500)
    pipeline.index(_make_docs(5))

    query = _make_queries(1)[0]
    output = pipeline.ask(query, k=3)

    assert output.retrieval is not None
    assert len(output.retrieval.retrieved) <= 3
    assert output.generation is None


def test_pacer_pipeline_ask_with_generator():
    embedder = HashEmbedder(dim=32)
    generator = DummyGenerator()
    pipeline = build_pacer_pipeline(embedder=embedder, generator=generator, chunk_size=500)
    pipeline.index(_make_docs(5))

    output = pipeline.ask(_make_queries(1)[0], k=3)
    assert output.generation is not None
    assert isinstance(output.generation.answer, str)


# ---------------------------------------------------------------------------
# PACERPipeline (baseline mode)
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("strategy", ["fixed", "recursive", "educational", "hybrid"])
def test_baseline_pipeline_strategies(strategy):
    embedder = HashEmbedder(dim=32)
    pipeline = build_baseline_pipeline(strategy=strategy, embedder=embedder, chunk_size=500)
    docs = _make_docs(5)
    chunks, counts = pipeline.index(docs)
    assert len(chunks) > 0


def test_baseline_pipeline_no_boundary_pp():
    embedder = HashEmbedder(dim=32)
    pipeline = build_baseline_pipeline(
        "fixed", embedder=embedder, chunk_size=300, use_boundary_pp=False
    )
    assert pipeline.boundary_pp is None


def test_baseline_pipeline_with_boundary_pp():
    embedder = HashEmbedder(dim=32)
    pipeline = build_baseline_pipeline(
        "recursive", embedder=embedder, chunk_size=300, use_boundary_pp=True
    )
    assert pipeline.boundary_pp is not None


# ---------------------------------------------------------------------------
# Retriever types
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("retriever_type", ["dense", "sparse", "hybrid"])
def test_pipeline_retriever_types(retriever_type):
    embedder = HashEmbedder(dim=32)
    pipeline = build_baseline_pipeline(
        "fixed", embedder=embedder, chunk_size=500, retriever_type=retriever_type
    )
    pipeline.index(_make_docs(5))
    output = pipeline.ask(_make_queries(1)[0], k=3)
    assert output.retrieval is not None


# ---------------------------------------------------------------------------
# ResultsAnalyzer
# ---------------------------------------------------------------------------


def _make_eval_record(condition: str, emb: str, gen: str | None, mrr: float) -> EvaluationRecord:
    return EvaluationRecord(
        experiment_id=f"exp__{condition}__{emb}__nogen",
        query_id="q_001",
        strategy=condition,
        embedding_model=emb,
        generator_model=gen,
        retrieval=RetrievalMetrics(
            precision_at_k={10: 0.5},
            recall_at_k={10: 0.8},
            ndcg_at_k={10: round(mrr * 0.9, 4)},
            mrr=mrr,
        ),
        cas=CASScore(
            overall=0.72, grade_match=0.8, prereq_preservation=0.65, bloom_alignment=0.7,
            weights={"alpha": 0.4, "beta": 0.35, "gamma": 0.25},
        ),
        latency_ms=120.0,
    )


def test_results_analyzer_main_table(tmp_path):
    records = [
        _make_eval_record("pacer", "bge-large", None, 0.85),
        _make_eval_record("fixed_512", "bge-large", None, 0.62),
        _make_eval_record("recursive_1024", "bge-large", None, 0.71),
    ]
    jsonl = tmp_path / "results.jsonl"
    write_jsonl(jsonl, records)

    analyzer = ResultsAnalyzer(tmp_path)
    analyzer.load()
    table = analyzer.main_table()

    assert len(table) == 3
    assert table[0]["condition"] == "pacer"   # sorted by MRR descending
    assert table[0]["mrr"] == pytest.approx(0.85)


def test_results_analyzer_ablation_table(tmp_path):
    records = [
        _make_eval_record("pacer_full", "bge", None, 0.88),
        _make_eval_record("pacer_no_router", "bge", None, 0.78),
        _make_eval_record("pacer_no_boundary", "bge", None, 0.82),
        _make_eval_record("fixed_512", "bge", None, 0.60),  # not an ablation condition
    ]
    jsonl = tmp_path / "results.jsonl"
    write_jsonl(jsonl, records)

    analyzer = ResultsAnalyzer(tmp_path)
    analyzer.load()
    abl = analyzer.ablation_table()

    names = {r["condition"] for r in abl}
    assert "pacer_full" in names
    assert "pacer_no_router" in names
    assert "fixed_512" not in names


def test_results_analyzer_latex_table(tmp_path):
    records = [_make_eval_record("pacer", "bge", None, 0.85)]
    jsonl = tmp_path / "results.jsonl"
    write_jsonl(jsonl, records)

    analyzer = ResultsAnalyzer(tmp_path)
    analyzer.load()
    latex = analyzer.latex_table1()

    assert r"\begin{table}" in latex
    assert r"\toprule" in latex
    assert "pacer" in latex


def test_results_analyzer_empty_dir(tmp_path):
    analyzer = ResultsAnalyzer(tmp_path)
    analyzer.load()
    assert analyzer.main_table() == []
    assert analyzer.ablation_table() == []


def test_results_analyzer_save_summary(tmp_path):
    records = [_make_eval_record("pacer", "bge", None, 0.85)]
    write_jsonl(tmp_path / "r.jsonl", records)

    analyzer = ResultsAnalyzer(tmp_path)
    analyzer.load()
    summary_path = tmp_path / "summary.json"
    analyzer.save_summary(summary_path)

    data = json.loads(summary_path.read_text())
    assert "main_table" in data
    assert "ablation_table" in data
