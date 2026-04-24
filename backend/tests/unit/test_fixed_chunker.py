"""Unit tests for the fixed-size chunker."""
from __future__ import annotations

import pytest

from edullm_pacer.chunkers import FixedSizeChunker, get_chunker
from edullm_pacer.schemas import (
    ChunkingStrategy,
    Document,
    DocumentMetadata,
    DocumentType,
    GradeLevel,
)


@pytest.fixture
def sample_doc() -> Document:
    # ~1500 tokens of repeating educational-style text.
    paragraph = (
        "Photosynthesis is the process by which green plants use sunlight to "
        "synthesise foods from carbon dioxide and water. It generally involves "
        "the green pigment chlorophyll and generates oxygen as a by-product. "
    )
    text = paragraph * 100
    return Document(
        doc_id="test_doc_001",
        text=text,
        metadata=DocumentMetadata(
            subject="biology",
            grade=GradeLevel.SECONDARY,
            doc_type=DocumentType.TEXTBOOK_CHAPTER,
        ),
    )


def test_fixed_chunker_splits_long_document(sample_doc: Document) -> None:
    chunker = FixedSizeChunker(chunk_size=256, chunk_overlap=32)
    chunks = chunker.chunk(sample_doc)

    assert len(chunks) > 1, "long document should produce multiple chunks"
    for c in chunks:
        assert c.metadata.token_count is not None
        assert c.metadata.token_count <= 256
        assert c.metadata.strategy == ChunkingStrategy.FIXED.value
        assert c.metadata.doc_id == sample_doc.doc_id


def test_fixed_chunker_single_short_doc() -> None:
    short_doc = Document(doc_id="short", text="A short sentence.")
    chunks = FixedSizeChunker(chunk_size=512).chunk(short_doc)
    assert len(chunks) == 1
    assert chunks[0].text.strip() == "A short sentence."


def test_fixed_chunker_inherits_doc_metadata(sample_doc: Document) -> None:
    chunks = FixedSizeChunker().chunk(sample_doc)
    assert all(c.metadata.subject == "biology" for c in chunks)
    assert all(c.metadata.grade == GradeLevel.SECONDARY.value for c in chunks)


def test_registry_returns_fixed_chunker() -> None:
    chunker = get_chunker(ChunkingStrategy.FIXED, chunk_size=128, chunk_overlap=16)
    assert isinstance(chunker, FixedSizeChunker)
    assert chunker.chunk_size == 128


def test_registry_string_key_works() -> None:
    chunker = get_chunker("fixed")
    assert isinstance(chunker, FixedSizeChunker)


def test_overlap_validation() -> None:
    with pytest.raises(ValueError, match="overlap"):
        FixedSizeChunker(chunk_size=100, chunk_overlap=100)


def test_empty_document_returns_no_chunks() -> None:
    empty_doc = Document(doc_id="empty", text="   ")
    chunks = FixedSizeChunker().chunk(empty_doc)
    assert chunks == []


def test_chunk_ids_are_deterministic(sample_doc: Document) -> None:
    chunks_a = FixedSizeChunker(chunk_size=256, chunk_overlap=32).chunk(sample_doc)
    chunks_b = FixedSizeChunker(chunk_size=256, chunk_overlap=32).chunk(sample_doc)
    assert [c.chunk_id for c in chunks_a] == [c.chunk_id for c in chunks_b]
