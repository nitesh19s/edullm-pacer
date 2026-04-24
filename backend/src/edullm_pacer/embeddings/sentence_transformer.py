"""Sentence-transformer backend.

Default free backend. Works with any HuggingFace model that exposes a
sentence-transformers interface:
  - BAAI/bge-large-en-v1.5 (primary, 1024-dim)
  - BAAI/bge-base-en-v1.5 (768-dim, faster)
  - sentence-transformers/all-MiniLM-L6-v2 (384-dim, fastest)
  - jinaai/jina-embeddings-v3 (1024-dim, multilingual for Hindi content)

Lazy-imports sentence-transformers so the package still imports without it.
"""
from __future__ import annotations

from typing import TYPE_CHECKING

import numpy as np

from edullm_pacer.embeddings.base import Embedder, register_embedder

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer


@register_embedder("sentence-transformer")
class SentenceTransformerEmbedder(Embedder):
    """Wrapper around sentence-transformers models.

    Args:
        model_name: HuggingFace model id.
        device: "cuda", "cpu", or None for auto-detect.
        cache_dir: where to cache model weights (default: HF cache).
        trust_remote_code: pass-through for models like Jina v3.
    """

    def __init__(
        self,
        model_name: str = "BAAI/bge-large-en-v1.5",
        device: str | None = None,
        cache_dir: str | None = None,
        trust_remote_code: bool = False,
    ) -> None:
        self.name = model_name
        self._device = device
        self._cache_dir = cache_dir
        self._trust_remote_code = trust_remote_code
        self._model: SentenceTransformer | None = None
        self._dim: int | None = None

    @property
    def dim(self) -> int:
        if self._dim is None:
            _ = self._get_model()  # loading sets dim
        assert self._dim is not None
        return self._dim

    def _get_model(self) -> SentenceTransformer:
        if self._model is not None:
            return self._model
        try:
            from sentence_transformers import SentenceTransformer
        except ImportError as e:
            raise ImportError(
                "SentenceTransformerEmbedder requires sentence-transformers. "
                "Install: pip install sentence-transformers"
            ) from e
        self._model = SentenceTransformer(
            self.name,
            device=self._device,
            cache_folder=self._cache_dir,
            trust_remote_code=self._trust_remote_code,
        )
        self._dim = int(self._model.get_sentence_embedding_dimension() or 0)
        return self._model

    def encode(
        self,
        texts: list[str],
        batch_size: int = 32,
        normalize: bool = True,
        show_progress: bool = False,
    ) -> np.ndarray:
        if not texts:
            return np.zeros((0, self.dim), dtype=np.float32)
        model = self._get_model()
        embeddings = model.encode(
            texts,
            batch_size=batch_size,
            normalize_embeddings=normalize,
            show_progress_bar=show_progress,
            convert_to_numpy=True,
        )
        return embeddings.astype(np.float32)
