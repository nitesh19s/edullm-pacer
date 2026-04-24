"""Hybrid retriever using Reciprocal Rank Fusion (RRF).

Combines a dense retriever (FAISS) and a sparse retriever (BM25) by re-ranking
their outputs with RRF. Standard approach that consistently beats either alone.

RRF formula: score(d) = sum over retrievers of 1 / (rrf_k + rank_r(d))
    where rrf_k ~ 60 is a constant that downweights the influence of each
    individual ranking.
"""
from __future__ import annotations

import time
from dataclasses import dataclass

from edullm_pacer.retrieval.bm25_retriever import BM25Retriever
from edullm_pacer.retrieval.faiss_retriever import FaissRetriever
from edullm_pacer.schemas import Query, RetrievalResult, RetrievedChunk


@dataclass
class HybridRetriever:
    """Dense + sparse with RRF fusion.

    Args:
        dense: FAISS (or other dense) retriever.
        sparse: BM25 retriever.
        rrf_k: RRF constant. 60 is the standard default.
        overfetch: multiple of k to retrieve from each underlying retriever
            before fusion. Higher = more accurate, slower.
    """

    dense: FaissRetriever
    sparse: BM25Retriever
    rrf_k: int = 60
    overfetch: int = 3

    def retrieve(
        self,
        query: Query,
        k: int = 10,
        metadata_filter: dict | None = None,
    ) -> RetrievalResult:
        start = time.perf_counter()
        fetch_k = k * self.overfetch

        dense_res = self.dense.retrieve(query, k=fetch_k, metadata_filter=metadata_filter)
        sparse_res = self.sparse.retrieve(query, k=fetch_k, metadata_filter=metadata_filter)

        # RRF fusion.
        scores: dict[str, float] = {}
        chunk_cache: dict[str, RetrievedChunk] = {}

        for res in (dense_res, sparse_res):
            for item in res.retrieved:
                cid = item.chunk.chunk_id
                scores[cid] = scores.get(cid, 0.0) + 1.0 / (self.rrf_k + item.rank + 1)
                if cid not in chunk_cache:
                    chunk_cache[cid] = item

        fused = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)[:k]
        retrieved: list[RetrievedChunk] = []
        for rank, (cid, fused_score) in enumerate(fused):
            original = chunk_cache[cid]
            retrieved.append(
                RetrievedChunk(chunk=original.chunk, score=float(fused_score), rank=rank)
            )

        elapsed_ms = (time.perf_counter() - start) * 1000.0
        return RetrievalResult(query=query, retrieved=retrieved, latency_ms=elapsed_ms)
