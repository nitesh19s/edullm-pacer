"""
Heterogeneous Corpus Ablation — EduLLM-PACER
=============================================
Runs the 4 ablation conditions on the 30-doc heterogeneous corpus so that
the RuleBasedClassifier actually fires (all docs have doc_type=unknown),
producing distinct chunking strategies per document type and measurable
variance between pacer_full / A1_no_router / A2_no_boundary / A3_no_cas.

Usage:
    cd /Users/nitesh/edullm
    OMP_NUM_THREADS=8 MKL_NUM_THREADS=8 \\
        backend/.venv/bin/python scripts/run_hetero_ablation.py
"""
from __future__ import annotations

import csv
import json
import os
import sys
import time
from pathlib import Path

N_CORES = str(os.cpu_count() or 8)
os.environ.setdefault("OMP_NUM_THREADS",        N_CORES)
os.environ.setdefault("MKL_NUM_THREADS",        N_CORES)
os.environ.setdefault("OPENBLAS_NUM_THREADS",   N_CORES)
os.environ.setdefault("TOKENIZERS_PARALLELISM", "true")

ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "backend" / "src"))

from edullm_pacer.schemas import Document, DocumentMetadata, DocumentType, GradeLevel
from edullm_pacer.experiments.config import ConditionConfig, ExperimentConfig
from edullm_pacer.experiments.runner import ConditionRunner

# ── Paths ─────────────────────────────────────────────────────────────────────
CORPUS_PATH    = ROOT / "data" / "processed" / "hetero_corpus.jsonl"
BENCHMARK_PATH = ROOT / "data" / "processed" / "hetero_benchmark.jsonl"
OUTPUT_CSV     = ROOT / "experiments" / "results_paper" / "table3_hetero_ablation.csv"
PARTIAL_DIR    = ROOT / "experiments" / "results" / "hetero_ablation"

EMBEDDING_MODEL  = "BAAI/bge-large-en-v1.5"
EMBED_BATCH_SIZE = 128

# ── Conditions ────────────────────────────────────────────────────────────────
# A1_no_router: when routing is disabled the system falls back to FIXED
# chunking (the simplest common baseline — splits at character boundaries
# regardless of document structure). HybridChunker uses the same structural
# boundaries as EducationalChunker (via _find_unit_boundaries), making
# hybrid ≡ educational for short-to-medium units. FIXED chunking is the
# appropriate "no-routing" baseline because it represents the common default
# in RAG systems that lack document-type awareness.
ABLATION_CONDITIONS = [
    ConditionConfig(name="pacer_full",     mode="adaptive", use_router=True,  use_boundary_pp=True,  chunk_size=2000, chunk_overlap=100, max_unit_chars=4000, retriever="hybrid"),
    ConditionConfig(name="A1_fixed_base",  mode="fixed",    strategy="fixed", use_router=False, use_boundary_pp=False, chunk_size=2000, chunk_overlap=100, max_unit_chars=4000, retriever="hybrid"),
    ConditionConfig(name="A2_no_boundary", mode="adaptive", use_router=True,  use_boundary_pp=False, chunk_size=2000, chunk_overlap=100, max_unit_chars=4000, retriever="hybrid"),
    ConditionConfig(name="A3_no_cas",      mode="adaptive", use_router=True,  use_boundary_pp=True,  chunk_size=2000, chunk_overlap=100, max_unit_chars=4000, retriever="hybrid", extra={"disable_cas": True}),
    # External baseline: LangChain-style RecursiveCharacterTextSplitter, no routing, no boundary PP.
    ConditionConfig(name="B0_recursive_base", mode="fixed", strategy="recursive", use_router=False, use_boundary_pp=False, chunk_size=2000, chunk_overlap=100, max_unit_chars=4000, retriever="hybrid"),
]

BASE_CFG = dict(
    experiment_id     = "pacer_hetero_ablation",
    description       = "PACER ablation on heterogeneous corpus (5 doc types, doc_type=unknown)",
    embedding_models  = [EMBEDDING_MODEL],
    generator_models  = ["none"],
    benchmark_path    = str(BENCHMARK_PATH),
    documents_db_path = str(ROOT / "data" / "db" / "edullm-database.db"),  # won't exist → JSONL path used
    output_dir        = str(PARTIAL_DIR),
    top_k             = 10,
    k_values          = [1, 3, 5, 10],
)

# ── Load heterogeneous corpus with CORRECT doc_type ───────────────────────────
_DOC_TYPE_MAP = {t.value: t for t in DocumentType}

def load_hetero_documents() -> list[Document]:
    docs: list[Document] = []
    with open(CORPUS_PATH) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            d = json.loads(line)
            meta_raw  = d.get("metadata", {})
            dt_raw    = meta_raw.get("doc_type", "unknown")
            doc_type  = _DOC_TYPE_MAP.get(dt_raw, DocumentType.UNKNOWN)
            try:
                grade = GradeLevel(meta_raw.get("grade", "unknown"))
            except ValueError:
                grade = GradeLevel.UNKNOWN
            meta = DocumentMetadata(
                subject  = meta_raw.get("subject"),
                grade    = grade,
                doc_type = doc_type,
                source   = meta_raw.get("source", "hetero"),
            )
            docs.append(Document(doc_id=d["doc_id"], text=d["text"], metadata=meta))
    return docs


# ── Load embedder once ─────────────────────────────────────────────────────────
def load_shared_embedder():
    from edullm_pacer.embeddings.sentence_transformer import SentenceTransformerEmbedder
    print(f"\n🔄 Loading embedder {EMBEDDING_MODEL} (batch_size={EMBED_BATCH_SIZE})…")
    t0  = time.perf_counter()
    emb = SentenceTransformerEmbedder(model_name=EMBEDDING_MODEL)
    _   = emb.dim
    _orig = emb.encode
    def fast_encode(texts, batch_size=EMBED_BATCH_SIZE, **kw):
        return _orig(texts, batch_size=batch_size, **kw)
    emb.encode = fast_encode
    print(f"✅ Embedder ready in {time.perf_counter()-t0:.1f}s  dim={emb.dim}")
    return emb


# ── Per-condition run ──────────────────────────────────────────────────────────
def run_condition(cfg, condition, shared_embedder, hetero_docs):
    runner = ConditionRunner(cfg=cfg, condition=condition,
                             embedding_model=EMBEDDING_MODEL, generator_model=None)

    # Patch: use shared embedder
    runner._load_embedder = lambda: shared_embedder

    # Patch: use heterogeneous documents (doc_type=unknown → classifier fires)
    runner._load_documents = lambda: hetero_docs

    t0      = time.perf_counter()
    records = runner.run()
    runner.save(records)
    elapsed = (time.perf_counter() - t0) / 60

    mrr_vals  = [r.retrieval.mrr          for r in records if r.retrieval and r.retrieval.mrr is not None]
    ndcg_vals = [r.retrieval.ndcg_at_k.get(10) for r in records
                 if r.retrieval and r.retrieval.ndcg_at_k and r.retrieval.ndcg_at_k.get(10)]
    cas_vals  = [r.cas.overall            for r in records if r.cas]
    lat_vals  = [r.latency_ms             for r in records if r.latency_ms]

    def avg(lst): return round(sum(lst)/len(lst), 4) if lst else None

    result = {
        "condition":   condition.name,
        "mrr":         avg(mrr_vals),
        "ndcg_at_10":  avg([v for v in ndcg_vals if v is not None]),
        "cas_overall": avg(cas_vals),
        "n_queries":   len(records),
        "latency_ms":  avg(lat_vals),
    }
    print(f"  ✅ {condition.name:<18} {elapsed:.1f} min | "
          f"MRR={result['mrr']}  nDCG@10={result['ndcg_at_10']}  CAS={result['cas_overall']}")
    return result


def save_csv(rows):
    if not rows:
        return
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    fields = ["condition", "mrr", "ndcg_at_10", "cas_overall", "n_queries", "latency_ms"]
    with open(OUTPUT_CSV, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    print(f"\n💾 Results → {OUTPUT_CSV}")


# ── Verify classifier fires correctly on a sample doc ─────────────────────────
def verify_classifier(docs):
    from edullm_pacer.classifier.rule_based import RuleBasedClassifier
    from edullm_pacer.router.rule_based    import RuleBasedRouter
    clf    = RuleBasedClassifier()
    router = RuleBasedRouter(classifier=clf)   # wire classifier for UNKNOWN→auto-classify
    print("\n🔍 Classifier / Router verification (first of each type):")
    seen = set()
    for doc in docs:
        dt       = clf.classify(doc.text, doc.metadata)
        strategy = router.route(doc)
        key      = (doc.metadata.source or "?")
        if key not in seen:
            seen.add(key)
            dt_str = doc.metadata.doc_type.value if hasattr(doc.metadata.doc_type, 'value') else str(doc.metadata.doc_type)
            print(f"  {doc.doc_id:<35} declared={dt_str:<8} "
                  f"→ classified={dt.value:<22} → strategy={strategy}")
    print()


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    PARTIAL_DIR.mkdir(parents=True, exist_ok=True)

    hetero_docs = load_hetero_documents()
    print(f"\n📂 Loaded {len(hetero_docs)} heterogeneous documents from {CORPUS_PATH.name}")

    verify_classifier(hetero_docs)

    shared_emb = load_shared_embedder()
    cfg        = ExperimentConfig(conditions=ABLATION_CONDITIONS, **BASE_CFG)

    completed = []
    for cond in ABLATION_CONDITIONS:
        print(f"\n{'='*60}\n▶  {cond.name}")
        result = run_condition(cfg, cond, shared_emb, hetero_docs)
        if result:
            completed.append(result)

    save_csv(completed)

    print(f"\n{'='*60}")
    print("🎉 Heterogeneous ablation complete!")
    print(f"\n{'Condition':<20} {'MRR':>6}  {'nDCG@10':>8}  {'CAS':>6}")
    print("-" * 46)
    for r in completed:
        mrr  = f"{r['mrr']:.4f}"  if r['mrr']  else "—"
        ndcg = f"{r['ndcg_at_10']:.4f}" if r['ndcg_at_10'] else "—"
        cas  = f"{r['cas_overall']:.4f}" if r['cas_overall'] else "—"
        print(f"{r['condition']:<20} {mrr:>6}  {ndcg:>8}  {cas:>6}")


if __name__ == "__main__":
    main()
