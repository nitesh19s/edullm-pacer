"""
Ablation Study Runner — EduLLM-PACER
=====================================
Runs 3 ablated PACER conditions against the 900-query NCERT benchmark:

  A1-NoRouter   : PACER pipeline with router disabled (educational chunker always)
  A2-NoBoundary : PACER pipeline with boundary post-processor disabled
  A3-NoCAS      : PACER pipeline, CAS scorer replaced with zeros

Results are appended to experiments/results_paper/table2_ablation.csv

Usage:
    cd /Users/nitesh/edullm
    backend/.venv/bin/python scripts/run_ablation.py

Estimated time: ~20-40 min on CPU with bge-large-en-v1.5
"""
from __future__ import annotations

import csv
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "backend" / "src"))

from edullm_pacer.experiments.config import ConditionConfig, ExperimentConfig
from edullm_pacer.experiments.runner import ConditionRunner

# ─── Config ────────────────────────────────────────────────────────────────────

EMBEDDING_MODEL = "BAAI/bge-large-en-v1.5"
OUTPUT_CSV      = ROOT / "experiments" / "results_paper" / "table2_ablation.csv"

BASE_CFG = dict(
    experiment_id    = "pacer_ablation",
    description      = "PACER ablation: remove one component at a time",
    embedding_models = [EMBEDDING_MODEL],
    generator_models = ["none"],
    benchmark_path   = str(ROOT / "data" / "processed" / "benchmark.jsonl"),
    documents_db_path= str(ROOT / "data" / "db" / "edullm-database.db"),
    output_dir       = str(ROOT / "experiments" / "results" / "ablation"),
    top_k            = 10,
    k_values         = [1, 3, 5, 10],
)

ABLATION_CONDITIONS = [
    ConditionConfig(
        name             = "pacer_full",
        mode             = "adaptive",
        use_router       = True,
        use_boundary_pp  = True,
        chunk_size       = 2000,
        chunk_overlap    = 100,
        max_unit_chars   = 4000,
        retriever        = "hybrid",
    ),
    ConditionConfig(
        name             = "A1_no_router",
        mode             = "adaptive",
        use_router       = False,       # ← router disabled
        use_boundary_pp  = True,
        chunk_size       = 2000,
        chunk_overlap    = 100,
        max_unit_chars   = 4000,
        retriever        = "hybrid",
    ),
    ConditionConfig(
        name             = "A2_no_boundary",
        mode             = "adaptive",
        use_router       = True,
        use_boundary_pp  = False,       # ← boundary PP disabled
        chunk_size       = 2000,
        chunk_overlap    = 100,
        max_unit_chars   = 4000,
        retriever        = "hybrid",
    ),
    ConditionConfig(
        name             = "A3_no_cas",
        mode             = "adaptive",
        use_router       = True,
        use_boundary_pp  = True,
        chunk_size       = 2000,
        chunk_overlap    = 100,
        max_unit_chars   = 4000,
        retriever        = "hybrid",
        extra            = {"disable_cas": True},  # handled in scorer
    ),
]

# ─── Runner ────────────────────────────────────────────────────────────────────

def run_condition(cfg: ExperimentConfig, condition: ConditionConfig) -> dict:
    runner = ConditionRunner(
        cfg            = cfg,
        condition      = condition,
        embedding_model= EMBEDDING_MODEL,
        generator_model= None,
    )

    if runner.is_done():
        print(f"  ⏭  {condition.name} already done — loading summary")
        summary_path = (
            Path(cfg.output_dir) / f"{runner.run_id}.summary.json"
        )
        import json
        return json.loads(summary_path.read_text())

    t0 = time.perf_counter()
    records = runner.run()
    runner.save(records)
    elapsed = time.perf_counter() - t0
    print(f"  ✅ {condition.name} done in {elapsed/60:.1f} min")

    # Build summary row
    mrr_vals  = [r.retrieval.mrr  for r in records if r.retrieval.mrr  is not None]
    ndcg_vals = [r.retrieval.ndcg_at_k.get(10, None) for r in records
                 if r.retrieval and r.retrieval.ndcg_at_k]
    cas_vals  = [r.cas.overall    for r in records if r.cas]
    lat_vals  = [r.latency_ms     for r in records if r.latency_ms]

    def avg(lst): return round(sum(lst) / len(lst), 4) if lst else None

    return {
        "condition"   : condition.name,
        "mrr"         : avg(mrr_vals),
        "ndcg_at_10"  : avg([v for v in ndcg_vals if v is not None]),
        "cas_overall" : avg(cas_vals),
        "n_queries"   : len(records),
        "latency_ms"  : avg(lat_vals),
    }


def main():
    cfg = ExperimentConfig(conditions=ABLATION_CONDITIONS, **BASE_CFG)
    rows = []

    for condition in ABLATION_CONDITIONS:
        print(f"\n{'='*60}")
        print(f"Running: {condition.name}")
        print(f"  router={condition.use_router}  boundary_pp={condition.use_boundary_pp}")
        print(f"{'='*60}")
        result = run_condition(cfg, condition)
        rows.append(result)
        print(f"  MRR={result.get('mrr')}  nDCG@10={result.get('ndcg_at_10')}  CAS={result.get('cas_overall')}")

    # Write CSV
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ["condition", "mrr", "ndcg_at_10", "cas_overall", "n_queries", "latency_ms"]
    with open(OUTPUT_CSV, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n✅ Ablation results saved → {OUTPUT_CSV}")
    print("\nResults summary:")
    for r in rows:
        print(f"  {r['condition']:20s}  MRR={r.get('mrr')}  nDCG@10={r.get('ndcg_at_10')}  CAS={r.get('cas_overall')}")


if __name__ == "__main__":
    main()
