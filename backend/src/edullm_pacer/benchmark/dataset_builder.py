"""Benchmark dataset builder.

Reads from the EduLLM SQLite database, applies quality filtering, assigns
Bloom levels, balances across subjects / grades / Bloom levels, and writes
the final benchmark as ``data/processed/benchmark.jsonl``.

Target: 800–1000 curriculum-grounded queries.

Usage::

    from edullm_pacer.benchmark import BenchmarkDatasetBuilder

    builder = BenchmarkDatasetBuilder(db_path="data/db/edullm-database.db")
    queries = builder.build(target_n=900)
    builder.save(queries, "data/processed/benchmark.jsonl")
    print(builder.stats(queries))
"""
from __future__ import annotations

import hashlib
import random
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from edullm_pacer.benchmark.bloom_tagger import tag_bloom
from edullm_pacer.benchmark.quality_filter import is_valid_entry
from edullm_pacer.benchmark.sqlite_exporter import export_entries
from edullm_pacer.schemas import BloomLevel, GradeLevel, Query
from edullm_pacer.utils.io import write_jsonl
from edullm_pacer.utils.logging import get_logger

logger = get_logger(__name__)

# Subjects present in the NCERT corpus.
_KNOWN_SUBJECTS = {"Mathematics", "Science", "Social Science"}

# Balanced target fractions per axis.
_SUBJECT_TARGETS: dict[str, float] = {
    "Mathematics": 1 / 3,
    "Science": 1 / 3,
    "Social Science": 1 / 3,
}
_GRADE_TARGETS: dict[GradeLevel, float] = {
    GradeLevel.MIDDLE: 0.20,           # grades 7-8
    GradeLevel.SECONDARY: 0.40,        # grades 9-10 (richer content)
    GradeLevel.HIGHER_SECONDARY: 0.40, # grades 11-12
}


class BenchmarkDatasetBuilder:
    """Build a balanced evaluation benchmark from the NCERT SQLite corpus.

    Args:
        db_path:  path to ``edullm-database.db``.
        seed:     random seed for reproducible sampling.
    """

    def __init__(
        self,
        db_path: str | Path = "data/db/edullm-database.db",
        seed: int = 42,
    ) -> None:
        self.db_path = Path(db_path)
        self.seed = seed

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def build(self, target_n: int = 900) -> list[Query]:
        """Return a balanced list of Query objects.

        Steps:
        1. Export all entries from SQLite.
        2. Quality-filter.
        3. Tag Bloom levels.
        4. Stratified sample to ``target_n``.
        5. Convert to Query objects.
        """
        logger.info(f"Loading entries from {self.db_path}")
        raw = export_entries(self.db_path)
        logger.info(f"Loaded {len(raw)} raw entries")

        filtered = [
            e for e in raw
            if is_valid_entry(e["question"], e["answer"])
        ]
        logger.info(f"After quality filter: {len(filtered)} entries")

        # Tag Bloom levels.
        for e in filtered:
            e["bloom_level"] = tag_bloom(e["question"])

        # Stratified sample.
        sampled = self._stratified_sample(filtered, target_n)
        logger.info(f"Sampled {len(sampled)} entries (target={target_n})")

        queries = [self._to_query(e) for e in sampled]
        return queries

    def save(self, queries: list[Query], output_path: str | Path) -> Path:
        """Write queries to a JSONL file."""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        write_jsonl(output_path, queries)
        logger.info(f"Saved {len(queries)} queries → {output_path}")
        return output_path

    def stats(self, queries: list[Query]) -> dict[str, Any]:
        """Return a breakdown dict suitable for logging / the paper."""
        subjects: Counter = Counter()
        grades: Counter = Counter()
        blooms: Counter = Counter()

        for q in queries:
            subjects[q.subject or "unknown"] += 1
            grades[str(q.grade)] += 1
            blooms[str(q.bloom_level)] += 1

        return {
            "total": len(queries),
            "by_subject": dict(subjects.most_common()),
            "by_grade_level": dict(grades.most_common()),
            "by_bloom_level": dict(blooms.most_common()),
        }

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _stratified_sample(
        self, entries: list[dict], target_n: int
    ) -> list[dict]:
        """Stratified sampling across subject × grade_level strata."""
        rng = random.Random(self.seed)

        # Group into strata.
        strata: dict[tuple, list[dict]] = defaultdict(list)
        for e in entries:
            subject = e.get("subject") or "unknown"
            if subject not in _KNOWN_SUBJECTS:
                subject = "unknown"
            grade_level = e.get("grade_level", GradeLevel.UNKNOWN)
            strata[(subject, str(grade_level))].append(e)

        # Compute how many to draw from each stratum.
        # desired = target_n × subject_fraction × grade_fraction
        alloc: dict[tuple, int] = {}
        for (subj, grade), members in strata.items():
            subj_frac = _SUBJECT_TARGETS.get(subj, 0.0)
            try:
                grade_frac = _GRADE_TARGETS.get(GradeLevel(grade), 0.05)
            except ValueError:
                grade_frac = 0.05
            desired = int(target_n * subj_frac * grade_frac)
            alloc[(subj, grade)] = min(desired, len(members))

        # Fill any remaining quota from the largest strata (round-robin).
        total_alloc = sum(alloc.values())
        sorted_strata = sorted(strata.keys(), key=lambda k: -len(strata[k]))
        i = 0
        max_rounds = target_n * len(sorted_strata)  # safety guard
        rounds = 0
        while total_alloc < target_n and rounds < max_rounds:
            k = sorted_strata[i % len(sorted_strata)]
            if alloc[k] < len(strata[k]):
                alloc[k] += 1
                total_alloc += 1
            i += 1
            rounds += 1

        # Sample from each stratum.
        sampled: list[dict] = []
        for key, n in alloc.items():
            pool = strata[key]
            rng.shuffle(pool)
            sampled.extend(pool[:n])

        rng.shuffle(sampled)
        return sampled[:target_n]

    def _to_query(self, entry: dict) -> Query:
        """Convert a raw entry dict to a Query object."""
        qid = self._make_query_id(entry)
        doc_id = entry.get("id", "")
        return Query(
            query_id=qid,
            text=entry["question"],
            subject=entry.get("subject"),
            grade=GradeLevel(entry["grade_level"])
            if isinstance(entry["grade_level"], GradeLevel)
            else GradeLevel.UNKNOWN,
            bloom_level=entry.get("bloom_level", BloomLevel.UNKNOWN),
            expected_doc_ids=[doc_id] if doc_id else [],
            expected_answer=entry.get("answer") or None,
            extra={
                "source_id": doc_id,
                "chapter": entry.get("chapter") or "",
                "topic": entry.get("topic") or "",
                "difficulty": entry.get("difficulty", "medium"),
                "raw_grade": str(entry.get("grade", "")),
            },
        )

    @staticmethod
    def _make_query_id(entry: dict) -> str:
        """Deterministic query ID from source id + question hash."""
        src = entry.get("id", "")
        h = hashlib.md5(entry.get("question", "").encode()).hexdigest()[:6]
        return f"bq_{src}_{h}" if src else f"bq_anon_{h}"
