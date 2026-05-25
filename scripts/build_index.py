"""Build (or rebuild) the FAISS index from the corpus JSONL.

Usage:
    # MiniLM (fast, ~1 min)
    python scripts/build_index.py

    # bge-large (PACER paper model, ~70 min on CPU, ~5 min on GPU)
    python scripts/build_index.py --model BAAI/bge-large-en-v1.5

After building, update .env:
    EDULLM_EMBEDDER_MODEL=BAAI/bge-large-en-v1.5
Then restart the server: ./start.sh
"""
import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend" / "src"))

from edullm_pacer.embeddings import SentenceTransformerEmbedder
from edullm_pacer.chunkers import get_chunker
from edullm_pacer.pipeline import RAGPipeline
from edullm_pacer.generation import DummyGenerator
from edullm_pacer.schemas import ChunkingStrategy, Document
from edullm_pacer.utils.io import read_jsonl_as
from edullm_pacer.utils.logging import get_logger

logger = get_logger(__name__)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="sentence-transformers/all-MiniLM-L6-v2")
    parser.add_argument("--corpus", default=str(ROOT / "data/processed/documents_reconstructed.jsonl"))
    parser.add_argument("--index-dir", default=str(ROOT / "data/index"))
    parser.add_argument("--chunker", default="educational")
    args = parser.parse_args()

    corpus = Path(args.corpus)
    index_dir = Path(args.index_dir)

    if not corpus.exists():
        logger.error(f"Corpus not found: {corpus}")
        sys.exit(1)

    logger.info(f"Model    : {args.model}")
    logger.info(f"Corpus   : {corpus}")
    logger.info(f"Index dir: {index_dir}")

    embedder = SentenceTransformerEmbedder(model_name=args.model)
    chunker  = get_chunker(ChunkingStrategy(args.chunker))
    pipeline = RAGPipeline(chunker=chunker, embedder=embedder, generator=DummyGenerator())

    docs = list(read_jsonl_as(corpus, Document))
    logger.info(f"Loaded {len(docs):,} documents")

    pipeline.index(docs, show_progress=True)
    index_dir.mkdir(parents=True, exist_ok=True)
    pipeline.retriever.save(index_dir)

    logger.info(f"Done — {len(pipeline):,} chunks saved to {index_dir}")
    logger.info(f"Now set EDULLM_EMBEDDER_MODEL={args.model} in .env and restart the server.")

if __name__ == "__main__":
    main()
