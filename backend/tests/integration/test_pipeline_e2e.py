"""End-to-end RAG pipeline smoke test.

Uses HashEmbedder + DummyGenerator + the educational chunker so it runs fully
offline and proves the whole stack wires together correctly.
"""
from __future__ import annotations

import pytest

from edullm_pacer.chunkers import EducationalChunker
from edullm_pacer.embeddings import HashEmbedder
from edullm_pacer.generation import DummyGenerator
from edullm_pacer.pipeline import RAGPipeline
from edullm_pacer.schemas import Document, DocumentMetadata, GradeLevel, Query


@pytest.fixture
def corpus() -> list[Document]:
    biology = Document(
        doc_id="bio_001",
        text=(
            "Chapter 13 Photosynthesis\n\n"
            "Definition: Photosynthesis is the process by which green plants convert "
            "light energy into chemical energy in the form of glucose.\n\n"
            "Example 1: In a leaf cell, chloroplasts capture sunlight via chlorophyll. "
            "The light reactions produce ATP and NADPH.\n\n"
            "Q1. Where does the Calvin cycle occur?\n"
            "Answer: The Calvin cycle occurs in the stroma of the chloroplast.\n"
        ),
        metadata=DocumentMetadata(subject="biology", grade=GradeLevel.SECONDARY),
    )
    physics = Document(
        doc_id="phy_001",
        text=(
            "Chapter 5 Forces\n\n"
            "Definition: A force is a push or pull on an object that can cause "
            "it to accelerate.\n\n"
            "Q1. What is the SI unit of force?\n"
            "Answer: The newton (N), defined as kg*m/s^2.\n"
        ),
        metadata=DocumentMetadata(subject="physics", grade=GradeLevel.SECONDARY),
    )
    math = Document(
        doc_id="math_001",
        text=(
            "Example: A quadratic equation has the form ax^2 + bx + c = 0.\n"
            "Solution: Use the quadratic formula x = (-b +- sqrt(b^2 - 4ac)) / 2a.\n"
        ),
        metadata=DocumentMetadata(subject="mathematics", grade=GradeLevel.SECONDARY),
    )
    return [biology, physics, math]


@pytest.fixture
def pipeline(corpus: list[Document]) -> RAGPipeline:
    pipe = RAGPipeline(
        chunker=EducationalChunker(chunk_size=2000),
        embedder=HashEmbedder(dim=128),
        generator=DummyGenerator(),
        top_k=3,
    )
    pipe.index(corpus)
    return pipe


def test_pipeline_indexes_documents(pipeline: RAGPipeline, corpus: list[Document]) -> None:
    # 3 documents -> should produce several chunks via the educational chunker.
    assert len(pipeline) > len(corpus)


def test_pipeline_retrieves_and_generates(pipeline: RAGPipeline) -> None:
    # With HashEmbedder (deterministic, not semantic), use a near-exact match
    # so we can assert retrieval returns the expected chunk. Semantic models
    # would succeed with paraphrases; the hash embedder only matches text.
    query = Query(
        query_id="q1",
        text="Q1. Where does the Calvin cycle occur?\nAnswer: The Calvin cycle occurs in the stroma of the chloroplast.",
    )
    result = pipeline.ask(query, k=3)

    # Retrieval produced something.
    assert len(result.retrieval.retrieved) > 0
    # The top chunk should be the Q&A about Calvin cycle.
    top_text = result.retrieval.retrieved[0].chunk.text.lower()
    assert "calvin" in top_text

    # Generation produced a response with the dummy signature.
    assert result.generation.answer.startswith("[dummy]")
    # Context chunks were passed through to the generation result.
    assert len(result.generation.context_chunks) == len(result.retrieval.retrieved)

    # Latencies were measured.
    assert result.total_latency_ms >= 0
    assert result.retrieval.latency_ms is not None
    assert result.generation.latency_ms is not None


def test_pipeline_respects_subject_filter(pipeline: RAGPipeline) -> None:
    query = Query(query_id="q2", text="definition and example")
    result = pipeline.ask(query, k=5, metadata_filter={"subject": "physics"})
    # Every retrieved chunk should be from physics.
    for r in result.retrieval.retrieved:
        assert r.chunk.metadata.subject == "physics"


def test_pipeline_handles_no_match_gracefully(pipeline: RAGPipeline) -> None:
    # Filter that nothing matches.
    query = Query(query_id="q3", text="anything")
    result = pipeline.ask(query, k=5, metadata_filter={"subject": "music"})
    assert result.retrieval.retrieved == []
    # Generation still runs even with no context.
    assert result.generation.answer
    assert result.generation.context_chunks == []
