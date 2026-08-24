#!/usr/bin/env python3
"""
Evaluate fine-tuned NCERT models on NCERT test Q&A pairs.
Metrics: ROUGE-L (F1) per answer, averaged across the sample.

Usage:
    python3 eval-models.py                          # 100 random samples (ncert-edu vs llama3)
    python3 eval-models.py --n 200                  # custom sample size
    python3 eval-models.py --all                    # all 867 pairs (slow)
    python3 eval-models.py --resume                 # continue from saved results
    python3 eval-models.py --models ncert-edu:latest mistral-ncert:latest llama3:latest
"""

import argparse
import json
import os
import random
import sys
import time
from datetime import datetime

import requests
from rouge_score import rouge_scorer

OLLAMA_URL        = "http://localhost:11434"
DEFAULT_MODELS    = ["ncert-edu:latest", "llama3:latest"]
TEST_FILE         = "/Users/nitesh/edullm-platform/ncert_qa_test.json"
RESULTS_FILE      = "/Users/nitesh/edullm-platform/eval-results.json"
TIMEOUT           = 120

scorer = rouge_scorer.RougeScorer(["rougeL"], use_stemmer=True)

ALPACA_TEMPLATE = (
    "Below is an instruction that describes a task, paired with an input that "
    "provides further context. Write a response that appropriately completes the request.\n\n"
    "### Instruction:\n{instruction}\n\n"
    "### Input:\n{input}\n\n"
    "### Response:\n"
)


def build_prompt(pair):
    return ALPACA_TEMPLATE.format(
        instruction=pair["instruction"],
        input=pair["input"],
    )


def query_model(model, prompt):
    try:
        resp = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False},
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("response", "").strip(), data.get("eval_count", 0), data.get("total_duration", 0)
    except Exception as e:
        return f"ERROR: {e}", 0, 0


def rouge_l(pred, ref):
    scores = scorer.score(ref, pred)
    return round(scores["rougeL"].fmeasure, 4)


def print_progress(i, total, results):
    ncert_scores = [r["ncert_rouge_l"] for r in results if r["ncert_rouge_l"] is not None]
    llama_scores = [r["llama3_rouge_l"] for r in results if r["llama3_rouge_l"] is not None]
    ncert_avg = sum(ncert_scores) / len(ncert_scores) if ncert_scores else 0
    llama_avg = sum(llama_scores) / len(llama_scores) if llama_scores else 0
    print(
        f"\r[{i}/{total}]  ncert-edu avg ROUGE-L: {ncert_avg:.4f}  |  "
        f"llama3 avg ROUGE-L: {llama_avg:.4f}",
        end="",
        flush=True,
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--n", type=int, default=100, help="Sample size (ignored with --all)")
    parser.add_argument("--all", action="store_true", help="Run on full test set")
    parser.add_argument("--resume", action="store_true", help="Continue from saved results")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--models", nargs="+", default=DEFAULT_MODELS, help="Ollama model names to evaluate")
    args = parser.parse_args()

    with open(TEST_FILE) as f:
        all_pairs = json.load(f)

    random.seed(args.seed)
    if args.all:
        pairs = all_pairs
    else:
        pairs = random.sample(all_pairs, min(args.n, len(all_pairs)))

    results = []
    done_indices = set()

    if args.resume and os.path.exists(RESULTS_FILE):
        with open(RESULTS_FILE) as f:
            saved = json.load(f)
        results = saved.get("results", [])
        done_indices = {r["index"] for r in results}
        print(f"Resuming — {len(done_indices)} already done.")

    models = args.models
    # build short key from model name (strip tag, replace - with _)
    model_keys = [m.split(":")[0].replace("-", "_").replace(".", "_") for m in models]

    print(f"\nEvaluating {len(pairs)} pairs | models: {', '.join(models)}\n")
    start = time.time()

    for i, pair in enumerate(pairs, 1):
        idx = all_pairs.index(pair) if pair in all_pairs else i
        if idx in done_indices:
            continue

        prompt = build_prompt(pair)
        gold   = pair["output"]
        row    = {"index": idx, "instruction": pair["instruction"][:80], "gold": gold[:300]}

        for key, model_name in zip(model_keys, models):
            pred, tokens, _ = query_model(model_name, prompt)
            row[f"{key}_rouge_l"] = rouge_l(pred, gold) if not pred.startswith("ERROR") else None
            row[f"{key}_tokens"]  = tokens
            row[f"{key}_pred"]    = pred[:300]

        results.append(row)

        # simple progress
        scored = {k: [r[f"{k}_rouge_l"] for r in results if r.get(f"{k}_rouge_l") is not None] for k in model_keys}
        parts  = "  |  ".join(f"{k}: {sum(v)/len(v):.4f}" for k, v in scored.items() if v)
        print(f"\r[{i}/{len(pairs)}]  {parts}", end="", flush=True)

        if i % 10 == 0:
            with open(RESULTS_FILE, "w") as f:
                json.dump({"meta": {"run_date": datetime.now().isoformat(), "n": len(pairs), "models": models}, "results": results}, f, indent=2)

    print()

    with open(RESULTS_FILE, "w") as f:
        json.dump({"meta": {"run_date": datetime.now().isoformat(), "n": len(pairs), "models": models}, "results": results}, f, indent=2)

    # ── summary ──────────────────────────────────────────────────────────────
    elapsed = time.time() - start

    all_scores = {
        k: [r[f"{k}_rouge_l"] for r in results if r.get(f"{k}_rouge_l") is not None]
        for k in model_keys
    }

    def wins(key):
        others = [k for k in model_keys if k != key]
        return sum(
            1 for r in results
            if all((r.get(f"{key}_rouge_l") or 0) > (r.get(f"{o}_rouge_l") or 0) for o in others)
        )

    print(f"\n{'='*60}")
    print(f"  Evaluation complete  ({len(results)} pairs, {elapsed:.0f}s)")
    print(f"{'='*60}")
    print(f"  {'Model':<25} {'ROUGE-L avg':>12}  {'Wins':>6}")
    print(f"  {'-'*50}")
    for key, model_name in zip(model_keys, models):
        scores = all_scores[key]
        avg    = sum(scores) / len(scores) if scores else 0
        print(f"  {model_name:<25} {avg:>12.4f}  {wins(key):>6}")
    print(f"{'='*60}")
    print(f"\n  Results saved → {RESULTS_FILE}\n")


if __name__ == "__main__":
    main()
