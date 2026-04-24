"""Data ingestion and manifest utilities."""
from edullm_pacer.data.build_manifest import ManifestRow, build_manifest
from edullm_pacer.data.ingest import IngestionReport, ingest, normalize_text

__all__ = [
    "IngestionReport",
    "ManifestRow",
    "build_manifest",
    "ingest",
    "normalize_text",
]
