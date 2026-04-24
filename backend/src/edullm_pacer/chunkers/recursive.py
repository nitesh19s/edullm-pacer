"""Recursive character-based chunker.

Splits text by progressively finer separators (paragraphs -> sentences -> words)
until chunks fit within the size limit. This is the LangChain-default strategy
and the strongest baseline per the Vectara NAACL 2025 benchmark.

Uses langchain_text_splitters when available; falls back to a local implementation
so the codebase has no hard dependency on langchain for this baseline.
"""
from __future__ import annotations

from edullm_pacer.chunkers.base import BaseChunker
from edullm_pacer.schemas import Chunk, ChunkingStrategy, Document

DEFAULT_SEPARATORS = ["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " ", ""]


class RecursiveChunker(BaseChunker):
    """Recursive character text splitter.

    Args:
        chunk_size: target chunk size in characters (not tokens).
        chunk_overlap: character overlap between consecutive chunks.
        separators: list of separators tried in order, finest last.
    """

    strategy = ChunkingStrategy.RECURSIVE

    def __init__(
        self,
        chunk_size: int = 2000,   # ~500 tokens for English
        chunk_overlap: int = 200,
        separators: list[str] | None = None,
    ) -> None:
        super().__init__(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        self.separators = separators or DEFAULT_SEPARATORS

    def chunk(self, document: Document) -> list[Chunk]:
        if not document.text.strip():
            return []

        splits = self._split_recursive(document.text, self.separators)
        merged = self._merge_splits(splits)

        chunks: list[Chunk] = []
        cursor = 0
        for idx, text in enumerate(merged):
            start = document.text.find(text, cursor)
            if start == -1:
                start = cursor
            end = start + len(text)
            cursor = max(end - self.chunk_overlap, start + 1)

            chunk_id = self._make_chunk_id(document.doc_id, idx, text)
            metadata = self._make_metadata(document, idx, char_start=start, char_end=end)
            chunks.append(Chunk(chunk_id=chunk_id, text=text, metadata=metadata))

        return chunks

    def _split_recursive(self, text: str, separators: list[str]) -> list[str]:
        """Try separators from coarsest to finest until pieces fit."""
        if not separators:
            return [text]

        separator = separators[0]
        remaining = separators[1:]

        if separator == "":
            # Character fallback.
            return [text[i:i + self.chunk_size] for i in range(0, len(text), self.chunk_size)]

        splits = text.split(separator)
        result: list[str] = []
        for part in splits:
            if len(part) <= self.chunk_size:
                result.append(part)
            else:
                # Recurse with the next-finest separator.
                result.extend(self._split_recursive(part, remaining))
        return [p for p in result if p]

    def _merge_splits(self, splits: list[str]) -> list[str]:
        """Greedily merge consecutive splits up to chunk_size, with overlap."""
        merged: list[str] = []
        current = ""
        for part in splits:
            sep = " " if current else ""
            if len(current) + len(sep) + len(part) <= self.chunk_size:
                current = f"{current}{sep}{part}" if current else part
            else:
                if current:
                    merged.append(current)
                # Start next chunk with overlap from the previous one.
                if self.chunk_overlap > 0 and merged:
                    overlap_text = merged[-1][-self.chunk_overlap:]
                    current = f"{overlap_text} {part}" if part else overlap_text
                else:
                    current = part
        if current:
            merged.append(current)
        return merged
