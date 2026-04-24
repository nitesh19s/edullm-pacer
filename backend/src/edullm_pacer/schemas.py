"""Core data schemas used across the PACER pipeline.

Single source of truth for document, chunk, query, and result structures.
All components (chunkers, retriever, evaluator) operate on these types.
"""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


# --------------------------------------------------------------------------
# Enumerations
# --------------------------------------------------------------------------


class DocumentType(str, Enum):
    """Educational document types. Used by the router to select chunking strategy."""

    TEXTBOOK_CHAPTER = "textbook_chapter"
    LECTURE_NOTES = "lecture_notes"
    PAST_PAPER = "past_paper"
    LESSON_PLAN = "lesson_plan"
    SYLLABUS = "syllabus"
    WORKED_EXAMPLE = "worked_example"
    REFERENCE_MATERIAL = "reference_material"
    UNKNOWN = "unknown"


class GradeLevel(str, Enum):
    """NCERT/CBSE grade levels + higher ed."""

    ELEMENTARY = "elementary"        # K-5
    MIDDLE = "middle"                # 6-8
    SECONDARY = "secondary"          # 9-10
    HIGHER_SECONDARY = "higher_secondary"  # 11-12
    UNDERGRADUATE = "undergraduate"
    POSTGRADUATE = "postgraduate"
    UNKNOWN = "unknown"


class BloomLevel(str, Enum):
    """Bloom's taxonomy cognitive levels (revised)."""

    REMEMBER = "remember"
    UNDERSTAND = "understand"
    APPLY = "apply"
    ANALYZE = "analyze"
    EVALUATE = "evaluate"
    CREATE = "create"
    UNKNOWN = "unknown"


class ChunkingStrategy(str, Enum):
    """Chunking strategies available in the PACER strategy bank."""

    FIXED = "fixed"
    RECURSIVE = "recursive"
    SEMANTIC = "semantic"
    EDUCATIONAL = "educational"
    HYBRID = "hybrid"


# --------------------------------------------------------------------------
# Document + chunk
# --------------------------------------------------------------------------


class DocumentMetadata(BaseModel):
    """Metadata attached to every ingested document."""

    model_config = ConfigDict(use_enum_values=True)

    subject: str | None = None
    grade: GradeLevel = GradeLevel.UNKNOWN
    doc_type: DocumentType = DocumentType.UNKNOWN
    language: str = "en"
    source: str | None = None       # e.g., "NCERT", "CBSE", "Shoolini_internal"
    board: str | None = None        # curriculum board
    ocr_confidence: float | None = None
    page_count: int | None = None
    word_count: int | None = None
    ingested_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    extra: dict[str, Any] = Field(default_factory=dict)


class Document(BaseModel):
    """A single ingested document."""

    doc_id: str
    text: str
    metadata: DocumentMetadata = Field(default_factory=DocumentMetadata)


class ChunkMetadata(BaseModel):
    """Metadata attached to every chunk. Inherits from parent document."""

    model_config = ConfigDict(use_enum_values=True)

    doc_id: str
    chunk_index: int
    strategy: ChunkingStrategy
    subject: str | None = None
    grade: GradeLevel = GradeLevel.UNKNOWN
    doc_type: DocumentType = DocumentType.UNKNOWN
    bloom_level: BloomLevel = BloomLevel.UNKNOWN
    concepts: list[str] = Field(default_factory=list)
    prerequisites: list[str] = Field(default_factory=list)
    char_start: int | None = None
    char_end: int | None = None
    token_count: int | None = None
    pedagogical_boundary_preserved: bool = True
    extra: dict[str, Any] = Field(default_factory=dict)


class Chunk(BaseModel):
    """A single chunk produced by a chunker."""

    chunk_id: str
    text: str
    metadata: ChunkMetadata

    @property
    def char_length(self) -> int:
        return len(self.text)


# --------------------------------------------------------------------------
# Query + retrieval
# --------------------------------------------------------------------------


class Query(BaseModel):
    """A user or benchmark query."""

    model_config = ConfigDict(use_enum_values=True)

    query_id: str
    text: str
    subject: str | None = None
    grade: GradeLevel = GradeLevel.UNKNOWN
    bloom_level: BloomLevel = BloomLevel.UNKNOWN
    expected_doc_ids: list[str] = Field(default_factory=list)   # gold docs
    expected_chunk_ids: list[str] = Field(default_factory=list)  # gold chunks
    expected_answer: str | None = None
    extra: dict[str, Any] = Field(default_factory=dict)


class RetrievedChunk(BaseModel):
    """A chunk retrieved for a query, with its score."""

    chunk: Chunk
    score: float
    rank: int


class RetrievalResult(BaseModel):
    """Retrieval output for one query."""

    query: Query
    retrieved: list[RetrievedChunk]
    latency_ms: float | None = None


# --------------------------------------------------------------------------
# Generation
# --------------------------------------------------------------------------


class GenerationResult(BaseModel):
    """Generator output for one query given retrieved context."""

    query: Query
    answer: str
    context_chunks: list[Chunk]
    model_name: str
    latency_ms: float | None = None
    token_usage: dict[str, int] = Field(default_factory=dict)


# --------------------------------------------------------------------------
# Evaluation
# --------------------------------------------------------------------------


class RetrievalMetrics(BaseModel):
    """Standard IR metrics for a single query or averaged over a set."""

    precision_at_k: dict[int, float] = Field(default_factory=dict)
    recall_at_k: dict[int, float] = Field(default_factory=dict)
    ndcg_at_k: dict[int, float] = Field(default_factory=dict)
    mrr: float | None = None


class GenerationMetrics(BaseModel):
    """RAGAS-style generation quality metrics."""

    faithfulness: float | None = None
    answer_relevancy: float | None = None
    context_precision: float | None = None
    context_recall: float | None = None


class CASScore(BaseModel):
    """Curriculum Alignment Score breakdown."""

    overall: float
    grade_match: float
    prereq_preservation: float
    bloom_alignment: float
    weights: dict[str, float] = Field(default_factory=dict)


class EvaluationRecord(BaseModel):
    """A single row in the experiment results table."""

    experiment_id: str
    query_id: str
    strategy: ChunkingStrategy | str
    embedding_model: str
    generator_model: str | None = None
    retrieval: RetrievalMetrics
    generation: GenerationMetrics | None = None
    cas: CASScore | None = None
    latency_ms: float | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
