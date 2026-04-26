"""Workstream E — Experiment infrastructure.

Public API::

    from edullm_pacer.experiments import ExperimentConfig, ConditionRunner, ResultsAnalyzer

    cfg = ExperimentConfig.from_yaml("experiments/configs/main_experiment.yaml")
    runner = ConditionRunner(cfg, cfg.conditions[0], "BAAI/bge-large-en-v1.5")
    records = runner.run()
    runner.save(records)
"""
from edullm_pacer.experiments.config import ConditionConfig, ExperimentConfig
from edullm_pacer.experiments.results_analyzer import ResultsAnalyzer
from edullm_pacer.experiments.runner import ConditionRunner

__all__ = ["ExperimentConfig", "ConditionConfig", "ConditionRunner", "ResultsAnalyzer"]
