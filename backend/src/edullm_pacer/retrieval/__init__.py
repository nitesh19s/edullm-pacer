"""Retrieval layer.

Public API:
    FaissRetriever  - dense retrieval via FAISS
    BM25Retriever   - sparse lexical retrieval
    HybridRetriever - FAISS + BM25 combined with RRF fusion
"""
from edullm_pacer.retrieval.bm25_retriever import BM25Retriever
from edullm_pacer.retrieval.faiss_retriever import FaissRetriever
from edullm_pacer.retrieval.hybrid_retriever import HybridRetriever

__all__ = ["BM25Retriever", "FaissRetriever", "HybridRetriever"]
