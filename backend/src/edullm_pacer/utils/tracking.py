"""Thin wrapper around Weights & Biases.

Soft-fails when W&B is unavailable or not configured, so local dev never breaks.
Any component can call `tracker = ExperimentTracker.init(...)` and log freely.
"""
from __future__ import annotations

from contextlib import contextmanager
from typing import Any

from edullm_pacer.config import settings
from edullm_pacer.utils.logging import get_logger

logger = get_logger(__name__)

try:
    import wandb  # type: ignore[import-untyped]
    _WANDB_AVAILABLE = True
except ImportError:
    _WANDB_AVAILABLE = False
    wandb = None  # type: ignore[assignment]


class ExperimentTracker:
    """Wrapper around wandb that no-ops gracefully when not configured."""

    def __init__(self, run: Any = None) -> None:
        self._run = run

    @classmethod
    def init(
        cls,
        experiment_name: str,
        config: dict[str, Any] | None = None,
        tags: list[str] | None = None,
        notes: str | None = None,
    ) -> ExperimentTracker:
        if not _WANDB_AVAILABLE:
            logger.debug("wandb not installed - tracking disabled")
            return cls()
        if not settings.wandb_api_key:
            logger.debug("WANDB_API_KEY not set - tracking disabled")
            return cls()

        try:
            run = wandb.init(  # type: ignore[union-attr]
                project=settings.wandb_project,
                entity=settings.wandb_entity,
                name=experiment_name,
                config=config or {},
                tags=tags or [],
                notes=notes,
                reinit=True,
            )
            logger.info(f"W&B run initialized: {run.url}")  # type: ignore[attr-defined]
            return cls(run=run)
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"W&B init failed: {exc} - continuing without tracking")
            return cls()

    def log(self, metrics: dict[str, Any], step: int | None = None) -> None:
        if self._run is None:
            return
        try:
            self._run.log(metrics, step=step)
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"W&B log failed: {exc}")

    def log_artifact(self, path: str, name: str, type_: str = "dataset") -> None:
        if self._run is None or not _WANDB_AVAILABLE:
            return
        try:
            artifact = wandb.Artifact(name=name, type=type_)  # type: ignore[union-attr]
            artifact.add_file(path)
            self._run.log_artifact(artifact)
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"W&B artifact upload failed: {exc}")

    def finish(self) -> None:
        if self._run is None:
            return
        try:
            self._run.finish()
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"W&B finish failed: {exc}")


@contextmanager
def track_experiment(
    experiment_name: str,
    config: dict[str, Any] | None = None,
    tags: list[str] | None = None,
    notes: str | None = None,
):  # type: ignore[no-untyped-def]
    """Context manager so runs always close cleanly.

    Example:
        with track_experiment("baseline_fixed_256", config={"k": 10}) as tracker:
            tracker.log({"precision_at_5": 0.73})
    """
    tracker = ExperimentTracker.init(experiment_name, config=config, tags=tags, notes=notes)
    try:
        yield tracker
    finally:
        tracker.finish()
