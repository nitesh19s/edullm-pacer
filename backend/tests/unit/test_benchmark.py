"""Tests for Workstream D: benchmark dataset builder."""
from __future__ import annotations

import json
import sqlite3
import tempfile
from pathlib import Path

import pytest

from edullm_pacer.benchmark.bloom_tagger import tag_bloom, tag_bloom_batch
from edullm_pacer.benchmark.dataset_builder import BenchmarkDatasetBuilder
from edullm_pacer.benchmark.quality_filter import filter_entries, is_valid_entry
from edullm_pacer.benchmark.sqlite_exporter import export_entries
from edullm_pacer.schemas import BloomLevel, GradeLevel, Query


# ---------------------------------------------------------------------------
# quality_filter tests
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "question,answer,expected",
    [
        # Good entry
        (
            "What is the process of photosynthesis and how does it work?",
            "Photosynthesis is the process by which plants use sunlight, water, and CO2 to "
            "produce glucose and oxygen. It occurs in chloroplasts and involves light-dependent "
            "and light-independent reactions.",
            True,
        ),
        # Short question
        ("Q?", "A good long answer that is more than eighty characters long for sure.", False),
        # Refusal answer
        (
            "Explain Newton's second law of motion in detail",
            "I'd be happy to help you with your question! However, I notice that the question "
            "doesn't seem to be related to any topic.",
            False,
        ),
        # Exercise stub question
        (
            "EXERCISE 11.1",
            "A great answer with more than eighty characters to pass the length filter.",
            False,
        ),
        # Short answer
        (
            "What is the SI unit of force and how is it defined in physics?",
            "Newton.",
            False,
        ),
        # "Please provide more context"
        (
            "Define the term osmosis and explain its significance",
            "Could you please provide more context about what subject this is for?",
            False,
        ),
    ],
)
def test_is_valid_entry(question, answer, expected):
    assert is_valid_entry(question, answer) is expected


def test_filter_entries_removes_bad():
    entries = [
        {"question": "EXERCISE 11.1", "answer": "x" * 100},
        {
            "question": "What is osmosis and why is it important in biology?",
            "answer": "Osmosis is the movement of water molecules across a semi-permeable "
                      "membrane from a region of lower solute concentration to higher.",
        },
    ]
    result = filter_entries(entries)
    assert len(result) == 1
    assert "osmosis" in result[0]["question"].lower()


# ---------------------------------------------------------------------------
# bloom_tagger tests
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "question,expected_bloom",
    [
        ("Define osmosis.", BloomLevel.REMEMBER),
        ("State Newton's first law of motion.", BloomLevel.REMEMBER),
        ("What is the SI unit of force?", BloomLevel.REMEMBER),
        ("Explain the process of photosynthesis.", BloomLevel.UNDERSTAND),
        ("Why does ice float on water?", BloomLevel.UNDERSTAND),
        ("Calculate the speed of a car travelling 120 km in 2 hours.", BloomLevel.APPLY),
        ("Solve: 2x + 5 = 11", BloomLevel.APPLY),
        ("Find the area of a triangle with base 6 cm and height 4 cm.", BloomLevel.APPLY),
        ("Compare aerobic and anaerobic respiration.", BloomLevel.ANALYZE),
        ("Differentiate between acids and bases.", BloomLevel.ANALYZE),
        ("Evaluate the impact of deforestation on biodiversity.", BloomLevel.EVALUATE),
        ("Do you think economic growth always leads to development?", BloomLevel.EVALUATE),
        ("Design an experiment to verify Ohm's law.", BloomLevel.CREATE),
    ],
)
def test_bloom_tagger(question, expected_bloom):
    assert tag_bloom(question) == expected_bloom


def test_bloom_batch_length():
    qs = ["Define force.", "Calculate velocity.", "Explain photosynthesis."]
    results = tag_bloom_batch(qs)
    assert len(results) == 3
    assert all(isinstance(b, BloomLevel) for b in results)


def test_bloom_default_is_understand():
    # A question with no clear Bloom keyword should default to UNDERSTAND.
    assert tag_bloom("Describe the water cycle.") == BloomLevel.UNDERSTAND


# ---------------------------------------------------------------------------
# sqlite_exporter tests — uses a temporary in-memory SQLite DB
# ---------------------------------------------------------------------------


def _make_test_db(tmp_path: Path) -> Path:
    db_path = tmp_path / "test.db"
    conn = sqlite3.connect(str(db_path))
    conn.execute(
        "CREATE TABLE documents "
        "(id TEXT PRIMARY KEY, collection_id TEXT, text TEXT, metadata TEXT, created_at TEXT)"
    )
    rows = [
        (
            "doc1",
            "coll1",
            "Question: What is photosynthesis?\n\nAnswer: Photosynthesis converts sunlight "
            "into glucose in plant chloroplasts.",
            json.dumps({"subject": "Science", "grade": 9, "chapter": "Food", "difficulty": "easy",
                        "question": "What is photosynthesis?"}),
            "2026-01-01T00:00:00Z",
        ),
        (
            "doc2",
            "coll1",
            "Question: EXERCISE 11.1\n\nAnswer: Short.",
            json.dumps({"subject": "Mathematics", "grade": 10, "chapter": "Algebra",
                        "difficulty": "medium", "question": "EXERCISE 11.1"}),
            "2026-01-01T00:00:01Z",
        ),
        (
            "doc3",
            "coll1",
            "Question: Calculate the area of a circle with radius 7 cm.\n\nAnswer: "
            "Area = πr² = π × 49 ≈ 153.94 cm². Using π = 22/7, area = 154 cm².",
            json.dumps({"subject": "Mathematics", "grade": 8, "chapter": "Mensuration",
                        "difficulty": "medium", "question": "Calculate the area of a circle with radius 7 cm."}),
            "2026-01-01T00:00:02Z",
        ),
    ]
    conn.executemany(
        "INSERT INTO documents VALUES (?,?,?,?,?)", rows
    )
    conn.commit()
    conn.close()
    return db_path


def test_export_entries_basic(tmp_path):
    db = _make_test_db(tmp_path)
    entries = export_entries(db)
    assert len(entries) == 3
    assert entries[0]["subject"] == "Science"
    assert entries[0]["grade"] == 9
    assert entries[0]["grade_level"] == GradeLevel.SECONDARY


def test_export_entries_grade_mapping(tmp_path):
    db = _make_test_db(tmp_path)
    entries = export_entries(db)
    grade_map = {e["id"]: e["grade_level"] for e in entries}
    assert grade_map["doc1"] == GradeLevel.SECONDARY     # grade 9
    assert grade_map["doc3"] == GradeLevel.MIDDLE        # grade 8


def test_export_entries_missing_db():
    with pytest.raises(FileNotFoundError):
        export_entries("/nonexistent/path/db.sqlite")


# ---------------------------------------------------------------------------
# BenchmarkDatasetBuilder tests
# ---------------------------------------------------------------------------


def _make_rich_test_db(tmp_path: Path, n: int = 60) -> Path:
    """Create a test DB with enough rows for stratified sampling."""
    db_path = tmp_path / "rich.db"
    conn = sqlite3.connect(str(db_path))
    conn.execute(
        "CREATE TABLE documents "
        "(id TEXT PRIMARY KEY, collection_id TEXT, text TEXT, metadata TEXT, created_at TEXT)"
    )
    subjects = ["Mathematics", "Science", "Social Science"] * (n // 3 + 1)
    grades = [7, 8, 9, 10, 11, 12] * (n // 6 + 1)
    rows = []
    for i in range(n):
        subj = subjects[i % len(subjects)]
        grade = grades[i % len(grades)]
        q = f"Explain the concept of topic {i} in detail as it applies to {subj}."
        a = (
            f"The concept of topic {i} relates to {subj} grade {grade}. "
            "It involves several important principles that students need to understand "
            "and apply in various contexts across the curriculum."
        )
        rows.append((
            f"doc_{i}",
            "coll1",
            f"Question: {q}\n\nAnswer: {a}",
            json.dumps({"subject": subj, "grade": grade, "chapter": f"Ch{i}",
                        "difficulty": "medium", "question": q}),
            "2026-01-01T00:00:00Z",
        ))
    conn.executemany("INSERT INTO documents VALUES (?,?,?,?,?)", rows)
    conn.commit()
    conn.close()
    return db_path


def test_builder_returns_query_objects(tmp_path):
    db = _make_rich_test_db(tmp_path, n=60)
    builder = BenchmarkDatasetBuilder(db_path=db)
    queries = builder.build(target_n=30)
    assert len(queries) <= 30
    assert all(isinstance(q, Query) for q in queries)


def test_builder_query_ids_unique(tmp_path):
    db = _make_rich_test_db(tmp_path, n=60)
    builder = BenchmarkDatasetBuilder(db_path=db)
    queries = builder.build(target_n=30)
    ids = [q.query_id for q in queries]
    assert len(ids) == len(set(ids))


def test_builder_bloom_levels_assigned(tmp_path):
    db = _make_rich_test_db(tmp_path, n=60)
    builder = BenchmarkDatasetBuilder(db_path=db)
    queries = builder.build(target_n=30)
    # All "Explain …" questions should be UNDERSTAND
    assert all(q.bloom_level == BloomLevel.UNDERSTAND for q in queries)


def test_builder_stats_keys(tmp_path):
    db = _make_rich_test_db(tmp_path, n=60)
    builder = BenchmarkDatasetBuilder(db_path=db)
    queries = builder.build(target_n=30)
    stats = builder.stats(queries)
    assert {"total", "by_subject", "by_grade_level", "by_bloom_level"} <= set(stats.keys())
    assert stats["total"] == len(queries)


def test_builder_save_creates_jsonl(tmp_path):
    db = _make_rich_test_db(tmp_path, n=60)
    out = tmp_path / "bench.jsonl"
    builder = BenchmarkDatasetBuilder(db_path=db)
    queries = builder.build(target_n=20)
    builder.save(queries, out)
    assert out.exists()
    lines = out.read_text().splitlines()
    assert len(lines) == len(queries)
    # Each line is valid JSON with a query_id field
    for line in lines:
        data = json.loads(line)
        assert "query_id" in data
        assert "text" in data


def test_builder_reproducible_with_seed(tmp_path):
    db = _make_rich_test_db(tmp_path, n=60)
    b1 = BenchmarkDatasetBuilder(db_path=db, seed=99)
    b2 = BenchmarkDatasetBuilder(db_path=db, seed=99)
    q1 = [q.query_id for q in b1.build(target_n=20)]
    q2 = [q.query_id for q in b2.build(target_n=20)]
    assert q1 == q2
