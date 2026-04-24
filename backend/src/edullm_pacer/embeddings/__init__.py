"""Embedding backends.

Public API:
    get_embedder(backend) -> Embedder
    available_backends() -> list[str]
"""
# Import backends to trigger their @register_embedder decorators.
from edullm_pacer.embeddings.base import Embedder, available_backends, get_embedder
from edullm_pacer.embeddings.hash_embedder import HashEmbedder
from edullm_pacer.embeddings.sentence_transformer import SentenceTransformerEmbedder

__all__ = [
    "Embedder",
    "HashEmbedder",
    "SentenceTransformerEmbedder",
    "available_backends",
    "get_embedder",
]
