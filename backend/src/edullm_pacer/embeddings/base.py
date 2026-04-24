"""Embedding layer.

Every backend implements the `Embedder` protocol:
    .encode(texts: list[str], batch_size: int) -> np.ndarray  shape (N, dim)
    .dim property
    .name property

Callers only depend on the protocol, not the concrete backend. This makes
embedding-model ablations trivial for the paper.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

import numpy as np


class Embedder(ABC):
    """Abstract embedder interface."""

    name: str
    dim: int

    @abstractmethod
    def encode(
        self,
        texts: list[str],
        batch_size: int = 32,
        normalize: bool = True,
        show_progress: bool = False,
    ) -> np.ndarray:
        """Encode a list of strings.

        Args:
            texts: input strings.
            batch_size: forwarding batch size for the underlying model.
            normalize: L2-normalize vectors. Required for cosine retrieval.
            show_progress: print a progress bar for long jobs.

        Returns:
            np.ndarray of shape (len(texts), self.dim), dtype float32.
        """
        ...

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(name={self.name!r}, dim={self.dim})"


# --------------------------------------------------------------------------
# Registry
# --------------------------------------------------------------------------


_EMBEDDER_REGISTRY: dict[str, type[Embedder]] = {}


def register_embedder(backend: str) -> Any:
    """Decorator to register an embedder backend."""

    def deco(cls: type[Embedder]) -> type[Embedder]:
        _EMBEDDER_REGISTRY[backend] = cls
        return cls

    return deco


def get_embedder(backend: str, **kwargs: Any) -> Embedder:
    """Instantiate an embedder by backend name.

    Args:
        backend: one of "sentence-transformer", "openai", "hash" (test-only).
        **kwargs: backend-specific config.
    """
    if backend not in _EMBEDDER_REGISTRY:
        available = ", ".join(_EMBEDDER_REGISTRY)
        raise KeyError(
            f"Embedder backend '{backend}' not registered. Available: {available}"
        )
    return _EMBEDDER_REGISTRY[backend](**kwargs)


def available_backends() -> list[str]:
    return list(_EMBEDDER_REGISTRY.keys())
