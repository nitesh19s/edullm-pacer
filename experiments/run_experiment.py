#!/usr/bin/env python3
"""Entry script for running PACER experiments on Google Colab (T4 GPU).

Usage — run a single condition (recommended for Colab: one cell per condition):

    python experiments/run_experiment.py \
        --config experiments/configs/main_experiment.yaml \
        --condition pacer \
        --embedding BAAI/bge-large-en-v1.5 \
        --generator meta-llama/Llama-3.1-8B-Instruct

    # Retrieval-only (faster, no GPU memory for generator):
    python experiments/run_experiment.py \
        --config experiments/configs/main_experiment.yaml \
        --condition fixed_512 \
        --embedding BAAI/bge-large-en-v1.5

    # Quick smoke test (50 queries):
    python experiments/run_experiment.py \
        --config experiments/configs/main_experiment.yaml \
        --condition pacer \
        --embedding sentence-transformers/all-MiniLM-L6-v2 \
        --max-queries 50

    # Run ALL conditions for one embedding (sequential — use tmux or Colab loop):
    python experiments/run_experiment.py \
        --config experiments/configs/main_experiment.yaml \
        --embedding BAAI/bge-large-en-v1.5 \
        --all

    # Print results summary after all runs:
    python experiments/run_experiment.py --results experiments/results/

Colab setup cell (paste at top of notebook):
    !git clone https://github.com/<your-repo>/edullm.git
    %cd edullm
    !pip install -e backend/ -q
    !pip install pyyaml -q
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Make sure the package is importable when run from repo root.
sys.path.insert(0, str(Path(__file__).parent.parent / "backend" / "src"))


def main() -> None:
    parser = argparse.ArgumentParser(description="EduLLM-PACER experiment runner")
    parser.add_argument("--config", default="experiments/configs/main_experiment.yaml")
    parser.add_argument("--condition", help="Condition name to run")
    parser.add_argument("--embedding", help="Embedding model name")
    parser.add_argument("--generator", default=None, help="Generator model (optional)")
    parser.add_argument("--max-queries", type=int, default=None)
    parser.add_argument("--all", action="store_true", help="Run all conditions for given embedding")
    parser.add_argument("--results", default=None, help="Print summary for results directory")
    parser.add_argument("--latex", action="store_true", help="Print LaTeX tables")
    parser.add_argument("--skip-done", action="store_true", default=True,
                        help="Skip runs that already have output (default: True)")
    args = parser.parse_args()

    # ── Print results summary ──────────────────────────────────────────
    if args.results:
        _print_summary(args.results, latex=args.latex)
        return

    # ── Load config ───────────────────────────────────────────────────
    from edullm_pacer.experiments.config import ExperimentConfig
    cfg = ExperimentConfig.from_yaml(args.config)
    if args.max_queries:
        cfg = cfg.model_copy(update={"max_queries": args.max_queries})

    embedding = args.embedding
    if not embedding:
        parser.error("--embedding is required unless --results is used")

    # ── Build list of runs ────────────────────────────────────────────
    if args.all:
        runs = [
            (cond, embedding, gen)
            for cond in cfg.conditions
            for gen in (cfg.generator_models if args.generator is None else [args.generator])
        ]
    else:
        if not args.condition:
            parser.error("--condition is required unless --all is set")
        cond_obj = next((c for c in cfg.conditions if c.name == args.condition), None)
        if cond_obj is None:
            print(f"Unknown condition '{args.condition}'. Available:")
            for c in cfg.conditions:
                print(f"  {c.name}")
            sys.exit(1)
        runs = [(cond_obj, embedding, args.generator)]

    # ── Execute ───────────────────────────────────────────────────────
    from edullm_pacer.experiments.runner import ConditionRunner

    for cond, emb, gen in runs:
        runner = ConditionRunner(cfg, cond, emb, gen)

        if args.skip_done and runner.is_done(cfg.output_dir):
            print(f"[skip] {runner.run_id} — already done")
            continue

        print(f"\n{'='*60}")
        print(f"Running: {runner.run_id}")
        print(f"{'='*60}")

        records = runner.run()
        runner.save(records, cfg.output_dir)

        summary = runner._summarise(records)
        print(f"\nResults for {runner.run_id}:")
        print(f"  MRR:       {summary['mrr']:.4f}" if summary['mrr'] else "  MRR: n/a")
        print(f"  nDCG@10:   {summary['ndcg'].get(10, 'n/a')}")
        print(f"  P@10:      {summary['precision'].get(10, 'n/a')}")
        print(f"  Mean CAS:  {summary['mean_cas']}")
        print(f"  Latency:   {summary['mean_latency_ms']} ms/query")

    print("\nAll done.")


def _print_summary(results_dir: str, latex: bool = False) -> None:
    from edullm_pacer.experiments.results_analyzer import ResultsAnalyzer

    analyzer = ResultsAnalyzer(results_dir)
    analyzer.load()

    print("\n── Main Table ──────────────────────────────────────────────")
    rows = analyzer.main_table()
    if rows:
        _print_table(rows, cols=["condition", "embedding", "mrr", "ndcg@10", "cas"])
    else:
        print("  (no results found)")

    abl = analyzer.ablation_table()
    if abl:
        print("\n── Ablation Table ──────────────────────────────────────────")
        _print_table(abl, cols=["condition", "mrr", "ndcg@10", "cas"])

    if latex and rows:
        print("\n── LaTeX Table 1 ───────────────────────────────────────────")
        print(analyzer.latex_table1())
        if abl:
            print("\n── LaTeX Ablation ──────────────────────────────────────────")
            print(analyzer.latex_ablation())


def _print_table(rows: list[dict], cols: list[str]) -> None:
    """Simple ASCII table."""
    widths = {c: max(len(c), max(len(_fmt(r.get(c))) for r in rows)) for c in cols}
    header = "  ".join(c.ljust(widths[c]) for c in cols)
    sep = "  ".join("-" * widths[c] for c in cols)
    print(header)
    print(sep)
    for row in rows:
        print("  ".join(_fmt(row.get(c)).ljust(widths[c]) for c in cols))


def _fmt(v) -> str:
    if v is None:
        return "—"
    if isinstance(v, float):
        return f"{v:.4f}"
    return str(v)


if __name__ == "__main__":
    main()
