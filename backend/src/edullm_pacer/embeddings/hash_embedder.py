"""Deterministic hash-based embedder for offline tests.

NOT suitable for production retrieval. Its purpose is to let us test the
retrieval/indexing pipeline end-to-end in CI without downloading any models.
"""
from __future__ import annotations

import hashlib

import numpy as np

from edullm_pacer.embeddings.base import Embedder, register_embedder


@register_embedder("hash")
class HashEmbedder(Embedder):
    """Deterministic pseudo-embedder for tests.

    Hashes each text to a dense vector using repeated SHA-256 bytes. The vectors
    are deterministic and L2-normalized, so similarity search works correctly
    (same text retrieves identical vectors), but it has no semantic meaning.
    """

    def __init__(self, model_name: str = "hash-test", dim: int = 128) -> None:
        self.name = model_name
        self._dim = dim

    @property
    def dim(self) -> int:
        return self._dim

    def encode(
        self,
        texts: list[str],
        batch_size: int = 32,  # noqa: ARG002
        normalize: bool = True,
        show_progress: bool = False,  # noqa: ARG002
    ) -> np.ndarray:
        if not texts:
            return np.zeros((0, self._dim), dtype=np.float32)

        out = np.zeros((len(texts), self._dim), dtype=np.float32)
        bytes_needed = self._dim * 4  # float32 = 4 bytes
        for i, text in enumerate(texts):
            buf = b""
            seed = text.encode("utf-8")
            while len(buf) < bytes_needed:
                seed = hashlib.sha256(seed).digest()
                buf += seed
            arr = np.frombuffer(buf[:bytes_needed], dtype=np.uint32).astype(np.float32)
            arr = (arr / np.float32(2**32)) - 0.5  # center around 0
            out[i] = arr

        if normalize:
            norms = np.linalg.norm(out, axis=1, keepdims=True) + 1e-9
            out = out / norms

        return out
