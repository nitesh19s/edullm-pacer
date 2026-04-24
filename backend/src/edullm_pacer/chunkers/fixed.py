"""Fixed-size (sliding window) chunker.

Baseline chunker. Splits text into fixed-size windows with configurable overlap.
Uses tiktoken for token counting so chunks respect LLM token budgets. Falls back
to a whitespace-based tokenizer when tiktoken's encoding cache is unreachable
(e.g. in isolated CI or air-gapped environments).
"""
from __future__ import annotations

from typing import Protocol

from edullm_pacer.chunkers.base import BaseChunker
from edullm_pacer.schemas import Chunk, ChunkingStrategy, Document


class _Tokenizer(Protocol):
    def encode(self, text: str) -> list[int]: ...
    def decode(self, tokens: list[int]) -> str: ...


class _WhitespaceTokenizer:
    """Fallback tokenizer - word-level, good enough for chunking without network."""

    def encode(self, text: str) -> list[int]:
        # Map each word to a deterministic int id. Order preserving.
        self._words: list[str] = text.split(" ")
        return list(range(len(self._words)))

    def decode(self, tokens: list[int]) -> str:
        return " ".join(self._words[t] for t in tokens)


def _load_tokenizer(encoding_name: str) -> _Tokenizer:
    try:
        import tiktoken
        return tiktoken.get_encoding(encoding_name)
    except Exception:  # noqa: BLE001 - any failure drops to fallback
        return _WhitespaceTokenizer()


class FixedSizeChunker(BaseChunker):
    """Token-count-based sliding window chunker.

    Args:
        chunk_size: target chunk size in tokens.
        chunk_overlap: overlap in tokens between consecutive chunks.
        encoding_name: tiktoken encoding. cl100k_base matches GPT-3.5/4 tokenization.
    """

    strategy = ChunkingStrategy.FIXED

    def __init__(
        self,
        chunk_size: int = 512,
        chunk_overlap: int = 64,
        encoding_name: str = "cl100k_base",
    ) -> None:
        super().__init__(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        self._encoding_name = encoding_name

    def _get_encoder(self) -> _Tokenizer:
        # Lazily create a fresh tokenizer each chunk() call because the
        # fallback is stateful (it captures the word list inside encode()).
        return _load_tokenizer(self._encoding_name)

    def chunk(self, document: Document) -> list[Chunk]:
        if not document.text.strip():
            return []

        encoder = self._get_encoder()
        tokens = encoder.encode(document.text)
        if len(tokens) <= self.chunk_size:
            return [self._single_chunk(document, tokens, encoder)]

        chunks: list[Chunk] = []
        step = self.chunk_size - self.chunk_overlap
        chunk_idx = 0

        for start in range(0, len(tokens), step):
            end = min(start + self.chunk_size, len(tokens))
            window_tokens = tokens[start:end]
            text = encoder.decode(window_tokens)

            chunk_id = self._make_chunk_id(document.doc_id, chunk_idx, text)
            metadata = self._make_metadata(document, chunk_idx)
            metadata.token_count = len(window_tokens)

            chunks.append(Chunk(chunk_id=chunk_id, text=text, metadata=metadata))
            chunk_idx += 1

            if end == len(tokens):
                break

        return chunks

    def _single_chunk(
        self, document: Document, tokens: list[int], encoder: _Tokenizer,
    ) -> Chunk:
        text = encoder.decode(tokens)
        chunk_id = self._make_chunk_id(document.doc_id, 0, text)
        metadata = self._make_metadata(document, 0, char_start=0, char_end=len(text))
        metadata.token_count = len(tokens)
        return Chunk(chunk_id=chunk_id, text=text, metadata=metadata)
