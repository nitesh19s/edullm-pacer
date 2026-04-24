"""Centralized logging setup.

Usage in any module:
    from edullm_pacer.utils.logging import get_logger
    logger = get_logger(__name__)
    logger.info("hello")
"""
from __future__ import annotations

import sys
from pathlib import Path

from loguru import logger as _loguru_logger

from edullm_pacer.config import settings

_CONFIGURED = False


def _configure_once() -> None:
    global _CONFIGURED
    if _CONFIGURED:
        return

    _loguru_logger.remove()  # drop default handler
    _loguru_logger.add(
        sys.stderr,
        level=settings.log_level,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
            "<level>{message}</level>"
        ),
        colorize=True,
    )

    # Also log to a rotating file inside experiments/logs.
    log_dir = Path("experiments/logs")
    log_dir.mkdir(parents=True, exist_ok=True)
    _loguru_logger.add(
        log_dir / "edullm_{time:YYYY-MM-DD}.log",
        level="DEBUG",
        rotation="50 MB",
        retention="14 days",
        compression="gz",
    )

    _CONFIGURED = True


def get_logger(name: str | None = None):  # type: ignore[no-untyped-def]
    """Return a loguru logger bound to a module name."""
    _configure_once()
    return _loguru_logger.bind(name=name or "edullm")
