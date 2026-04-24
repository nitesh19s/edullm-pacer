"""Benchmark dataset subpackage.

Public API::

    from edullm_pacer.benchmark import BenchmarkDatasetBuilder

    builder = BenchmarkDatasetBuilder(db_path="data/db/edullm-database.db")
    queries = builder.build(target_n=900)
    builder.save(queries, "data/processed/benchmark.jsonl")
    print(builder.stats(queries))
"""
from edullm_pacer.benchmark.bloom_tagger import tag_bloom, tag_bloom_batch
from edullm_pacer.benchmark.dataset_builder import BenchmarkDatasetBuilder
from edullm_pacer.benchmark.quality_filter import filter_entries, is_valid_entry
from edullm_pacer.benchmark.sqlite_exporter import export_entries

__all__ = [
    "BenchmarkDatasetBuilder",
    "export_entries",
    "is_valid_entry",
    "filter_entries",
    "tag_bloom",
    "tag_bloom_batch",
]
