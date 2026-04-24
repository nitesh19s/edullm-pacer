"""API integration tests using FastAPI's TestClient.

Exercises the HTTP surface with no real server - the pipeline runs in-process
with offline-only components (hash embedder + dummy generator).
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from edullm_pacer.api.server import app, state, build_default_pipeline
from edullm_pacer.schemas import Document, DocumentMetadata, GradeLevel


@pytest.fixture
def client() -> TestClient:
    # Ensure the pipeline is built and seeded with a small corpus.
    state.pipeline = build_default_pipeline(chunker_strategy="educational")
    state.stats["total_queries"] = 0
    state.stats["total_latency_ms"] = 0.0

    docs = [
        Document(
            doc_id="bio_001",
            text=(
                "Definition: Photosynthesis is how green plants convert light "
                "energy into chemical energy.\n\n"
                "Q1. Where does the Calvin cycle occur?\n"
                "Answer: The Calvin cycle occurs in the stroma of the chloroplast."
            ),
            metadata=DocumentMetadata(subject="biology", grade=GradeLevel.SECONDARY),
        ),
        Document(
            doc_id="phy_001",
            text=(
                "Definition: A force is a push or pull on an object.\n\n"
                "Q1. What is the SI unit of force?\n"
                "Answer: The newton (N)."
            ),
            metadata=DocumentMetadata(subject="physics", grade=GradeLevel.SECONDARY),
        ),
    ]
    state.pipeline.index(docs)
    return TestClient(app)


def test_health_endpoint(client: TestClient) -> None:
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_chunkers_endpoint(client: TestClient) -> None:
    r = client.get("/api/chunkers")
    assert r.status_code == 200
    strategies = r.json()["strategies"]
    assert "fixed" in strategies
    assert "educational" in strategies


def test_query_endpoint_returns_answer_and_sources(client: TestClient) -> None:
    r = client.post(
        "/api/query",
        json={
            "query": (
                "Q1. Where does the Calvin cycle occur?\n"
                "Answer: The Calvin cycle occurs in the stroma of the chloroplast."
            ),
            "k": 3,
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["answer"].startswith("[dummy]")
    assert len(body["sources"]) >= 1
    # Top source should be the Calvin cycle chunk.
    assert "calvin" in body["sources"][0]["preview"].lower()
    assert body["total_latency_ms"] >= 0


def test_query_endpoint_respects_subject_filter(client: TestClient) -> None:
    r = client.post(
        "/api/query",
        json={
            "query": "definition and example",
            "filters": {"subject": "physics"},
            "k": 5,
        },
    )
    assert r.status_code == 200
    body = r.json()
    # Every returned source should be physics.
    for src in body["sources"]:
        assert src["subject"] == "physics"


def test_query_endpoint_accepts_resourceType_alias(client: TestClient) -> None:
    # The web UI uses "resourceType" camelCase - make sure it maps.
    r = client.post(
        "/api/query",
        json={
            "query": "anything",
            "filters": {"resourceType": "textbook_chapter"},
            "k": 3,
        },
    )
    assert r.status_code == 200


def test_stats_endpoint_reflects_queries(client: TestClient) -> None:
    # Do a couple of queries first.
    client.post("/api/query", json={"query": "force", "k": 3})
    client.post("/api/query", json={"query": "plants", "k": 3})
    r = client.get("/api/stats")
    assert r.status_code == 200
    body = r.json()
    assert body["total_queries"] >= 2
    assert body["chunks_indexed"] > 0
    assert body["documents_indexed"] == 2
