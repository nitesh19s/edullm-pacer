"""
Ablation Study Runner — EduLLM-PACER (OPTIMISED)
=================================================
Optimisations vs original:
  1. Embedder loaded ONCE and shared across all conditions (saves ~65 min/condition)
  2. batch_size=128 for encode (4x faster than default 32 on CPU)
  3. OMP/MKL threads set to all available cores at import time
  4. DEADLINE: if remaining time < 1 condition, saves progress and exits gracefully

Conditions:
  pacer_full     — full PACER (router + boundary)
  A1_no_router   — router disabled
  A2_no_boundary — boundary post-processor disabled
  A3_no_cas      — CAS scorer zeroed out (retrieval unchanged)

Results saved to experiments/results_paper/table2_ablation.csv
Partial per-condition JSONL: experiments/results/ablation/

Usage:
    cd /Users/nitesh/edullm
    OMP_NUM_THREADS=8 MKL_NUM_THREADS=8 TOKENIZERS_PARALLELISM=true \\
        backend/.venv/bin/python scripts/run_ablation.py
"""
from __future__ import annotations

import csv
import os
import signal
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

# ── Max CPU threads before any heavy import ──────────────────────────────────
N_CORES = str(os.cpu_count() or 8)
os.environ.setdefault("OMP_NUM_THREADS",          N_CORES)
os.environ.setdefault("MKL_NUM_THREADS",          N_CORES)
os.environ.setdefault("OPENBLAS_NUM_THREADS",     N_CORES)
os.environ.setdefault("TOKENIZERS_PARALLELISM",   "true")

ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "backend" / "src"))

from edullm_pacer.experiments.config import ConditionConfig, ExperimentConfig
from edullm_pacer.experiments.runner import ConditionRunner

# ── Deadline: hard stop 10 min before 5 PM IST ───────────────────────────────
IST = ZoneInfo("Asia/Kolkata")
DEADLINE = datetime.now(IST).replace(hour=16, minute=50, second=0, microsecond=0)
CONDITION_BUDGET_MIN = 70          # if less than this many minutes remain, pause

# ── Config ───────────────────────────────────────────────────────────────────
EMBEDDING_MODEL = "BAAI/bge-large-en-v1.5"
EMBED_BATCH_SIZE = 128             # 4× faster than default 32 on CPU
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

ABLATION_CONDITIONS = [
    ConditionConfig(name="pacer_full",     mode="adaptive", use_router=True,  use_boundary_pp=True,  chunk_size=2000, chunk_overlap=100, max_unit_chars=4000, retriever="hybrid"),
    ConditionConfig(name="A1_no_router",   mode="adaptive", use_router=False, use_boundary_pp=True,  chunk_size=2000, chunk_overlap=100, max_unit_chars=4000, retriever="hybrid"),
    ConditionConfig(name="A2_no_boundary", mode="adaptive", use_router=True,  use_boundary_pp=False, chunk_size=2000, chunk_overlap=100, max_unit_chars=4000, retriever="hybrid"),
    ConditionConfig(name="A3_no_cas",      mode="adaptive", use_router=True,  use_boundary_pp=True,  chunk_size=2000, chunk_overlap=100, max_unit_chars=4000, retriever="hybrid", extra={"disable_cas": True}),
]

# ── Shared embedder (load once) ───────────────────────────────────────────────

def load_shared_embedder():
    from edullm_pacer.embeddings.sentence_transformer import SentenceTransformerEmbedder
    print(f"\n🔄 Loading embedder {EMBEDDING_MODEL} (shared, batch_size={EMBED_BATCH_SIZE})...")
    t0 = time.perf_counter()
    emb = SentenceTransformerEmbedder(model_name=EMBEDDING_MODEL)
    _ = emb.dim   # force model load
    # Patch encode to always use our batch_size
    _orig_encode = emb.encode
    def fast_encode(texts, batch_size=EMBED_BATCH_SIZE, **kw):
        return _orig_encode(texts, batch_size=batch_size, **kw)
    emb.encode = fast_encode
    print(f"✅ Embedder ready in {time.perf_counter()-t0:.1f}s  dim={emb.dim}")
    return emb

# ── Deadline helpers ──────────────────────────────────────────────────────────

def minutes_remaining() -> float:
    return (DEADLINE - datetime.now(IST)).total_seconds() / 60

def should_pause() -> bool:
    rem = minutes_remaining()
    if rem < CONDITION_BUDGET_MIN:
        print(f"\n⏰ Only {rem:.0f} min left before 5 PM deadline — pausing to save progress.")
        return True
    return False

# ── Per-condition runner ──────────────────────────────────────────────────────

def run_condition(cfg: ExperimentConfig, condition: ConditionConfig, shared_embedder) -> dict | None:
    runner = ConditionRunner(cfg=cfg, condition=condition,
                             embedding_model=EMBEDDING_MODEL, generator_model=None)

    if runner.is_done():
        import json
        summary_path = PARTIAL_DIR / f"{runner.run_id}.summary.json"
        print(f"  ⏭  {condition.name} already done — loading saved summary")
        return json.loads(summary_path.read_text())

    # Patch runner to reuse shared embedder
    runner._load_embedder = lambda: shared_embedder

    t0 = time.perf_counter()
    records = runner.run()
    runner.save(records)
    elapsed = (time.perf_counter() - t0) / 60

    mrr_vals  = [r.retrieval.mrr for r in records if r.retrieval.mrr is not None]
    ndcg_vals = [r.retrieval.ndcg_at_k.get(10) for r in records
                 if r.retrieval and r.retrieval.ndcg_at_k and r.retrieval.ndcg_at_k.get(10)]
    cas_vals  = [r.cas.overall for r in records if r.cas]
    lat_vals  = [r.latency_ms  for r in records if r.latency_ms]

    def avg(lst): return round(sum(lst)/len(lst), 4) if lst else None

    result = {
        "condition":    condition.name,
        "mrr":          avg(mrr_vals),
        "ndcg_at_10":   avg([v for v in ndcg_vals if v is not None]),
        "cas_overall":  avg(cas_vals),
        "n_queries":    len(records),
        "latency_ms":   avg(lat_vals),
    }
    print(f"  ✅ {condition.name} done in {elapsed:.1f} min | "
          f"MRR={result['mrr']}  nDCG@10={result['ndcg_at_10']}  CAS={result['cas_overall']}")
    return result

# ── Save whatever completed so far ───────────────────────────────────────────

def save_csv(rows: list[dict]):
    if not rows:
        return
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ["condition", "mrr", "ndcg_at_10", "cas_overall", "n_queries", "latency_ms"]
    with open(OUTPUT_CSV, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    print(f"\n💾 Results saved → {OUTPUT_CSV}")

# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print(f"🕐 Start: {datetime.now(IST).strftime('%H:%M:%S IST')}")
    print(f"🏁 Deadline: {DEADLINE.strftime('%H:%M IST')}  ({minutes_remaining():.0f} min remaining)")
    print(f"💻 CPU cores: {N_CORES}  |  Embed batch_size: {EMBED_BATCH_SIZE}")

    cfg = ExperimentConfig(conditions=ABLATION_CONDITIONS, **BASE_CFG)
    shared_embedder = load_shared_embedder()

    completed = []
    skipped   = []

    for condition in ABLATION_CONDITIONS:
        print(f"\n{'='*60}")
        print(f"▶  {condition.name}  |  {datetime.now(IST).strftime('%H:%M IST')}  |  "
              f"{minutes_remaining():.0f} min left")

        # Check deadline BEFORE starting (skip already-done ones)
        runner_tmp = ConditionRunner(cfg=cfg, condition=condition,
                                     embedding_model=EMBEDDING_MODEL, generator_model=None)
        if not runner_tmp.is_done() and should_pause():
            skipped.append(condition.name)
            print(f"  ⏸  {condition.name} skipped — resume manually with: "
                  f"backend/.venv/bin/python scripts/run_ablation.py")
            break

        result = run_condition(cfg, condition, shared_embedder)
        if result:
            completed.append(result)

    save_csv(completed)

    print(f"\n{'='*60}")
    print(f"Done at {datetime.now(IST).strftime('%H:%M:%S IST')}")
    print(f"✅ Completed: {[r['condition'] for r in completed]}")
    if skipped:
        print(f"⏸  Skipped (resume manually): {skipped}")
        print(f"   Run: cd /Users/nitesh/edullm && backend/.venv/bin/python scripts/run_ablation.py")
    else:
        print("🎉 All 4 ablation conditions finished!")

if __name__ == "__main__":
    main()
