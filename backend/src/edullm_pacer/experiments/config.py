"""Experiment configuration schemas.

All experiment runs are fully described by ExperimentConfig so that results
are reproducible and the paper's methodology section can cite exact settings.

Usage::

    cfg = ExperimentConfig.from_yaml("experiments/configs/main_experiment.yaml")
    for condition in cfg.conditions:
        for emb in cfg.embedding_models:
            for gen in cfg.generator_models:
                run_id = cfg.run_id(condition.name, emb, gen)
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, Field


class ConditionConfig(BaseModel):
    """One experimental condition (a row in the paper's main table)."""

    name: str
    """Human-readable label, e.g. 'pacer', 'fixed_512', 'recursive_1024'."""

    mode: Literal["fixed", "adaptive"] = "fixed"
    """'adaptive' = PACER (classifier+router selects chunker per document).
    'fixed' = a single chunking strategy for all documents."""

    strategy: str = "educational"
    """Chunking strategy for fixed mode. Ignored when mode='adaptive'."""

    chunk_size: int = 2000
    chunk_overlap: int = 100
    max_unit_chars: int = 4000      # only used by educational / hybrid

    use_boundary_pp: bool = False
    """Apply BoundaryPostProcessor after chunking."""

    use_router: bool = False
    """Use the classifier+router to select strategy. Only meaningful in adaptive mode."""

    retriever: Literal["hybrid", "dense", "sparse"] = "hybrid"
    """Retrieval backend for this condition."""

    extra: dict[str, Any] = Field(default_factory=dict)


class ExperimentConfig(BaseModel):
    """Full experiment specification."""

    experiment_id: str
    description: str = ""

    conditions: list[ConditionConfig]
    embedding_models: list[str]
    generator_models: list[str]

    benchmark_path: str = "data/processed/benchmark.jsonl"
    documents_db_path: str = "data/db/edullm-database.db"
    output_dir: str = "experiments/results"

    top_k: int = 10
    k_values: list[int] = Field(default_factory=lambda: [1, 3, 5, 10])
    max_queries: int | None = None
    """Cap the benchmark to N queries — useful for smoke tests."""

    seed: int = 42

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def run_id(self, condition: str, embedding: str, generator: str) -> str:
        """Canonical run identifier used as the output filename stem."""
        emb_short = embedding.split("/")[-1].replace("-", "_").lower()
        gen_short = generator.split("/")[-1].replace("-", "_").lower() if generator else "nogen"
        return f"{self.experiment_id}__{condition}__{emb_short}__{gen_short}"

    @classmethod
    def from_yaml(cls, path: str | Path) -> "ExperimentConfig":
        try:
            import yaml  # type: ignore[import-untyped]
        except ImportError as e:
            raise ImportError("pip install pyyaml") from e
        with open(path) as f:
            data = yaml.safe_load(f)
        return cls.model_validate(data)

    def to_yaml(self, path: str | Path) -> None:
        try:
            import yaml
        except ImportError as e:
            raise ImportError("pip install pyyaml") from e
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            yaml.dump(self.model_dump(mode="json"), f, default_flow_style=False, sort_keys=False)

    def all_runs(self) -> list[tuple[ConditionConfig, str, str]]:
        """Cartesian product: condition × embedding × generator."""
        runs = []
        for cond in self.conditions:
            for emb in self.embedding_models:
                for gen in self.generator_models:
                    runs.append((cond, emb, gen))
        return runs
