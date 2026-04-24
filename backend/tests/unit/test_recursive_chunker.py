"""Unit tests for the recursive chunker."""
from __future__ import annotations

import pytest

from edullm_pacer.chunkers import RecursiveChunker, get_chunker
from edullm_pacer.schemas import ChunkingStrategy, Document


@pytest.fixture
def long_doc() -> Document:
    paragraphs = [
        "Photosynthesis is the process by which plants make food. "
        "It requires sunlight, water, and carbon dioxide. " * 8,
        "The chloroplast is the organelle where photosynthesis happens. "
        "Chlorophyll inside it absorbs light. " * 8,
        "The Calvin cycle fixes carbon dioxide into glucose. "
        "This happens in the stroma of the chloroplast. " * 8,
    ]
    text = "\n\n".join(paragraphs)
    return Document(doc_id="test_long", text=text)


def test_recursive_produces_multiple_chunks(long_doc: Document) -> None:
    chunker = RecursiveChunker(chunk_size=400, chunk_overlap=50)
    chunks = chunker.chunk(long_doc)
    assert len(chunks) >= 2
    assert all(c.metadata.strategy == ChunkingStrategy.RECURSIVE.value for c in chunks)


def test_recursive_chunk_size_soft_limit(long_doc: Document) -> None:
    chunker = RecursiveChunker(chunk_size=400, chunk_overlap=50)
    chunks = chunker.chunk(long_doc)
    # Size is a soft target; allow some slop because of the overlap prefix.
    for c in chunks:
        assert len(c.text) <= 700


def test_recursive_handles_short_doc() -> None:
    short = Document(doc_id="short", text="A short sentence about biology.")
    chunks = RecursiveChunker(chunk_size=2000).chunk(short)
    assert len(chunks) == 1
    assert chunks[0].text == "A short sentence about biology."


def test_recursive_registry() -> None:
    chunker = get_chunker("recursive", chunk_size=300, chunk_overlap=30)
    assert isinstance(chunker, RecursiveChunker)
    assert chunker.chunk_size == 300
