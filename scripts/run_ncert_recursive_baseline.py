"""
NCERT External Baseline — B0_recursive_base
============================================
Runs LangChain-style RecursiveCharacterTextSplitter (PACER's RecursiveChunker)
on the full 8,563-doc NCERT corpus with the 900-query benchmark, and appends
the result to experiments/results_paper/table2_ablation.csv.

This is the external baseline that fixes the flat NCERT ablation (all 4
PACER conditions score 0.9241 because NCERT docs are homogeneous TEXTBOOK_CHAPTER
— routing always returns educational). B0_recursive_base uses generic paragraph/
sentence splits with no pedagogical awareness, giving an honest comparison point.

Usage:
    cd /Users/nitesh/edullm
    backend/.venv/bin/python scripts/run_ncert_recursive_baseline.py
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

from edullm_pacer.experiments.config import ConditionConfig, ExperimentConfig
from edullm_pacer.experiments.runner import ConditionRunner

EMBEDDING_MODEL  = "BAAI/bge-large-en-v1.5"
EMBED_BATCH_SIZE = 128

OUTPUT_CSV  = ROOT / "experiments" / "results_paper" / "table2_ablation.csv"
PARTIAL_DIR = ROOT / "experiments" / "results" / "ablation"

BASE_CFG = dict(
    experiment_id     = "pacer_ablation",
    description       = "PACER ablation: remove one component at a time",
    embedding_models  = [EMBEDDING_MODEL],
    generator_models  = ["none"],
    benchmark_path    = str(ROOT / "data" / "processed" / "benchmark.jsonl"),
    documents_db_path = str(ROOT / "data" / "db" / "edullm-database.db"),
    output_dir        = str(PARTIAL_DIR),
    top_k             = 10,
    k_values          = [1, 3, 5, 10],
)

CONDITION = ConditionConfig(
    name             = "B0_recursive_base",
    mode             = "fixed",
    strategy         = "recursive",
    use_router       = False,
    use_boundary_pp  = False,
    chunk_size       = 2000,
    chunk_overlap    = 100,
    max_unit_chars   = 4000,
    retriever        = "hybrid",
)


def load_shared_embedder():
    from edullm_pacer.embeddings.sentence_transformer import SentenceTransformerEmbedder
    print(f"\n🔄 Loading embedder {EMBEDDING_MODEL} (batch_size={EMBED_BATCH_SIZE})…")
    t0 = time.perf_counter()
    emb = SentenceTransformerEmbedder(model_name=EMBEDDING_MODEL)
    _ = emb.dim
    _orig = emb.encode
    def fast_encode(texts, batch_size=EMBED_BATCH_SIZE, **kw):
        return _orig(texts, batch_size=batch_size, **kw)
    emb.encode = fast_encode
    print(f"✅ Embedder ready in {time.perf_counter()-t0:.1f}s  dim={emb.dim}")
    return emb


def append_to_csv(row: dict):
    """Append one result row to table2_ablation.csv, preserving all existing columns."""
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    base_fields = ["condition", "mrr", "ndcg_at_10", "cas_overall", "n_queries", "latency_ms"]

    # Read existing rows so we can deduplicate by condition name
    existing: list[dict] = []
    extra_fields: list[str] = []
    if OUTPUT_CSV.exists():
        with open(OUTPUT_CSV, newline="") as f:
            reader = csv.DictReader(f)
            existing = list(reader)
            if reader.fieldnames:
                extra_fields = [c for c in reader.fieldnames if c not in base_fields]

    # Populate extra columns for the new row (empty string keeps CSV valid)
    for col in extra_fields:
        row.setdefault(col, "")
    # Add a note for B0 if the notes column exists
    if "notes" in extra_fields and not row.get("notes"):
        row["notes"] = (
            "External baseline: LangChain-style RecursiveCharacterTextSplitter "
            "(paragraph/sentence splits, no routing, no pedagogical awareness)"
        )

    fields = base_fields + extra_fields

    # Remove any stale row for this condition, then append
    existing = [r for r in existing if r.get("condition") != row["condition"]]
    existing.append(row)

    with open(OUTPUT_CSV, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(existing)
    print(f"\n💾 Appended {row['condition']} → {OUTPUT_CSV}")


def main():
    cfg = ExperimentConfig(conditions=[CONDITION], **BASE_CFG)
    shared_emb = load_shared_embedder()

    runner = ConditionRunner(
        cfg=cfg, condition=CONDITION,
        embedding_model=EMBEDDING_MODEL, generator_model=None,
    )

    if runner.is_done():
        print(f"⏭  B0_recursive_base already done — loading saved result")
        summary_path = PARTIAL_DIR / f"{runner.run_id}.summary.json"
        if summary_path.exists():
            row = json.loads(summary_path.read_text())
            append_to_csv(row)
            return

    runner._load_embedder = lambda: shared_emb

    print(f"\n{'='*60}")
    print("▶  B0_recursive_base  (LangChain-style recursive, no routing)")
    t0 = time.perf_counter()
    records = runner.run()
    runner.save(records)
    elapsed = (time.perf_counter() - t0) / 60

    mrr_vals  = [r.retrieval.mrr          for r in records if r.retrieval and r.retrieval.mrr is not None]
    ndcg_vals = [r.retrieval.ndcg_at_k.get(10) for r in records
                 if r.retrieval and r.retrieval.ndcg_at_k and r.retrieval.ndcg_at_k.get(10)]
    cas_vals  = [r.cas.overall            for r in records if r.cas]
    lat_vals  = [r.latency_ms             for r in records if r.latency_ms]

    def avg(lst): return round(sum(lst)/len(lst), 4) if lst else None

    row = {
        "condition":   "B0_recursive_base",
        "mrr":         avg(mrr_vals),
        "ndcg_at_10":  avg([v for v in ndcg_vals if v is not None]),
        "cas_overall": avg(cas_vals),
        "n_queries":   len(records),
        "latency_ms":  avg(lat_vals),
    }

    print(f"\n✅ B0_recursive_base done in {elapsed:.1f} min")
    print(f"   MRR={row['mrr']}  nDCG@10={row['ndcg_at_10']}  CAS={row['cas_overall']}")
    print(f"   Queries={row['n_queries']}  Latency={row['latency_ms']}ms")

    append_to_csv(row)

    # Show updated table
    print(f"\n{'='*60}")
    print("Updated table2_ablation.csv:")
    print(f"\n{'Condition':<22} {'MRR':>6}  {'nDCG@10':>8}  {'CAS':>6}")
    print("-" * 50)
    with open(OUTPUT_CSV) as f:
        for r in csv.DictReader(f):
            mrr  = f"{float(r['mrr']):.4f}"  if r['mrr']  else "—"
            ndcg = f"{float(r['ndcg_at_10']):.4f}" if r['ndcg_at_10'] else "—"
            cas  = f"{float(r['cas_overall']):.4f}" if r['cas_overall'] else "—"
            print(f"{r['condition']:<22} {mrr:>6}  {ndcg:>8}  {cas:>6}")


if __name__ == "__main__":
    main()
