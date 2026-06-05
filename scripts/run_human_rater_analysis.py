"""
Human Rater CAS Validation Analysis
=====================================
Computes:
  1. Cohen's κ between H1 and H2 (per dimension + overall)  [needs both]
  2. Pearson r  between each human rater and each LLM judge  [one rater is enough]
  3. Pearson r  between averaged human ratings and each LLM judge  [needs both]
  4. Suggested α/β/γ weight recalibration based on human κ profile
  5. Updated Table 3 (CAS inter-judge) values for the manuscript

Input options (in priority order):
  A) data/labels/CAS_Rating_Sheet.xlsx   — both H1 and H2 in one file (columns F-H / I-K)
  B) data/labels/H1_ratings.csv          — H1 only (pair_id, grade_match, prereq_coverage, bloom_fit)
     data/labels/H2_ratings.csv          — H2 only (same columns)
  C) Any of the above partially filled — script runs what's available

LLM judge files (always required):
  data/labels/cas_groq_ratings.jsonl     — groq_llama  (Llama-3.3-70B)
  data/labels/cas_groq8b_ratings.jsonl   — groq_llama8b (Llama-3.1-8B)
  data/labels/cas_gemini_ratings.jsonl   — gemini

Output:
  experiments/results_paper/table6_human_rater_validation.json
  experiments/results_paper/table6_human_rater_validation.csv
  Console report with all numbers ready to paste into manuscript

Usage:
  backend/.venv/bin/python scripts/run_human_rater_analysis.py
"""
from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).parents[1]
XLSX_PATH  = ROOT / "data" / "labels" / "CAS_Rating_Sheet.xlsx"
H1_CSV     = ROOT / "data" / "labels" / "H1_ratings.csv"
H2_CSV     = ROOT / "data" / "labels" / "H2_ratings.csv"
GROQ_JSONL   = ROOT / "data" / "labels" / "cas_groq_ratings.jsonl"
GROQ8B_JSONL = ROOT / "data" / "labels" / "cas_groq8b_ratings.jsonl"
GEMINI_JSONL = ROOT / "data" / "labels" / "cas_gemini_ratings.jsonl"
OUT_JSON   = ROOT / "experiments" / "results_paper" / "table6_human_rater_validation.json"
OUT_CSV    = ROOT / "experiments" / "results_paper" / "table6_human_rater_validation.csv"

DIMS = ["grade_match", "prereq_coverage", "bloom_fit"]
DIM_LABELS = {"grade_match": "Grade Match", "prereq_coverage": "Prereq Coverage", "bloom_fit": "Bloom Alignment"}

# ── Utilities ──────────────────────────────────────────────────────────────────

def _kappa(a: list[int], b: list[int], n_cats: int = 5) -> float:
    """Cohen's κ for two raters, integer categories 1..n_cats."""
    assert len(a) == len(b)
    n = len(a)
    # Observed agreement
    po = sum(1 for x, y in zip(a, b) if x == y) / n
    # Expected agreement
    cats = list(range(1, n_cats + 1))
    pe = sum(
        (a.count(c) / n) * (b.count(c) / n)
        for c in cats
    )
    if pe == 1.0:
        return 1.0
    return (po - pe) / (1 - pe)


def _pearson(x: list[float], y: list[float]) -> tuple[float, float]:
    """Returns (r, p-value) using scipy if available, else approximate."""
    try:
        from scipy.stats import pearsonr
        r, p = pearsonr(x, y)
        return float(r), float(p)
    except ImportError:
        n = len(x)
        mx, my = sum(x) / n, sum(y) / n
        num = sum((xi - mx) * (yi - my) for xi, yi in zip(x, y))
        dx  = math.sqrt(sum((xi - mx) ** 2 for xi in x))
        dy  = math.sqrt(sum((yi - my) ** 2 for yi in y))
        if dx == 0 or dy == 0:
            return 0.0, 1.0
        r = num / (dx * dy)
        # Approximate p-value via t-distribution (n-2 df)
        t = r * math.sqrt(n - 2) / math.sqrt(max(1e-9, 1 - r**2))
        # Use normal approx for large n
        p = 2 * (1 - _normal_cdf(abs(t)))
        return r, p


def _normal_cdf(z: float) -> float:
    return 0.5 * (1 + math.erf(z / math.sqrt(2)))


def _load_jsonl(path: Path) -> dict[str, dict]:
    """Returns {pair_id: {grade_match, prereq_coverage, bloom_fit}}"""
    out = {}
    for line in path.read_text().splitlines():
        if not line.strip():
            continue
        d = json.loads(line)
        out[d["pair_id"]] = {
            "grade_match":     d.get("grade_match", None),
            "prereq_coverage": d.get("prereq_coverage", None),
            "bloom_fit":       d.get("bloom_fit", None),
        }
    return out


def _load_xlsx_human(path: Path) -> tuple[dict, dict]:
    """Returns (h1_ratings, h2_ratings) as {pair_id: {grade_match, prereq_coverage, bloom_fit}}"""
    import openpyxl
    wb = openpyxl.load_workbook(path)
    ws = wb["RATING SHEET"]

    h1, h2 = {}, {}
    for row in ws.iter_rows(min_row=3, values_only=True):  # skip 2 header rows
        pair_id = row[0]
        if pair_id is None:
            continue
        h1_g, h1_p, h1_b = row[5], row[6], row[7]
        h2_g, h2_p, h2_b = row[8], row[9], row[10]
        if any(v is not None for v in [h1_g, h1_p, h1_b]):
            h1[pair_id] = {"grade_match": h1_g, "prereq_coverage": h1_p, "bloom_fit": h1_b}
        if any(v is not None for v in [h2_g, h2_p, h2_b]):
            h2[pair_id] = {"grade_match": h2_g, "prereq_coverage": h2_p, "bloom_fit": h2_b}
    return h1, h2


def _load_csv_human(path: Path) -> dict[str, dict]:
    """Loads a CSV with columns: pair_id, grade_match, prereq_coverage, bloom_fit"""
    import csv
    out = {}
    with open(path) as f:
        reader = csv.DictReader(f)
        for row in reader:
            pid = row["pair_id"].strip()
            out[pid] = {
                "grade_match":     int(row["grade_match"]),
                "prereq_coverage": int(row["prereq_coverage"]),
                "bloom_fit":       int(row["bloom_fit"]),
            }
    return out


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 70)
    print("PACER — Human Rater CAS Validation Analysis")
    print("=" * 70)

    # ── Load LLM judge ratings ────────────────────────────────────────────
    llm_judges: dict[str, dict] = {
        "Groq Llama-3.3-70B":   _load_jsonl(GROQ_JSONL),
        "Groq Llama-3.1-8B":    _load_jsonl(GROQ8B_JSONL),
        "Gemini 2.5 Flash":     _load_jsonl(GEMINI_JSONL),
    }
    all_pairs = sorted(llm_judges["Groq Llama-3.3-70B"].keys())
    print(f"\nLLM judges loaded: {len(all_pairs)} pairs each")

    # ── Load human ratings ────────────────────────────────────────────────
    h1_ratings: dict = {}
    h2_ratings: dict = {}

    # Try xlsx first (both raters in one file)
    if XLSX_PATH.exists():
        h1_xlsx, h2_xlsx = _load_xlsx_human(XLSX_PATH)
        if h1_xlsx:
            h1_ratings = h1_xlsx
            print(f"H1 loaded from xlsx: {len(h1_ratings)} pairs filled")
        if h2_xlsx:
            h2_ratings = h2_xlsx
            print(f"H2 loaded from xlsx: {len(h2_ratings)} pairs filled")

    # Override/supplement with separate CSVs if present
    if H1_CSV.exists():
        h1_ratings = _load_csv_human(H1_CSV)
        print(f"H1 loaded from CSV: {len(h1_ratings)} pairs")
    if H2_CSV.exists():
        h2_ratings = _load_csv_human(H2_CSV)
        print(f"H2 loaded from CSV: {len(h2_ratings)} pairs")

    if not h1_ratings and not h2_ratings:
        print("\n⚠️  No human ratings found.")
        print("   Options:")
        print(f"   A) Fill H1/H2 columns in: {XLSX_PATH}")
        print(f"   B) Create: {H1_CSV}  (columns: pair_id, grade_match, prereq_coverage, bloom_fit)")
        print(f"      Create: {H2_CSV}  (same columns)")
        return

    results = {}

    # ── Cohen's κ: H1 vs H2 ──────────────────────────────────────────────
    if h1_ratings and h2_ratings:
        common = sorted(set(h1_ratings) & set(h2_ratings))
        print(f"\nH1 ∩ H2 common pairs: {len(common)}")
        print("\n── Cohen's κ: H1 vs H2 ─────────────────────────────────────────")
        kappa_h1h2 = {}
        for dim in DIMS:
            a = [int(h1_ratings[p][dim]) for p in common if h1_ratings[p][dim] is not None]
            b = [int(h2_ratings[p][dim]) for p in common if h2_ratings[p][dim] is not None]
            # Use only pairs where both rated
            pairs_ok = [p for p in common
                        if h1_ratings[p][dim] is not None and h2_ratings[p][dim] is not None]
            a2 = [int(h1_ratings[p][dim]) for p in pairs_ok]
            b2 = [int(h2_ratings[p][dim]) for p in pairs_ok]
            k = _kappa(a2, b2)
            kappa_h1h2[dim] = round(k, 3)
            print(f"  {DIM_LABELS[dim]:<22}: κ = {k:.3f}  (n={len(pairs_ok)})")

        overall_kappa_h1h2 = round(sum(kappa_h1h2.values()) / len(kappa_h1h2), 3)
        print(f"  {'Overall mean':<22}: κ = {overall_kappa_h1h2:.3f}")
        results["cohen_kappa_h1_h2"] = {**kappa_h1h2, "overall_mean": overall_kappa_h1h2}
    else:
        print("\n⚠️  Only one rater available — Cohen's κ (H1 vs H2) not computed yet.")
        results["cohen_kappa_h1_h2"] = None

    # ── Pearson r: Human vs LLM judges ───────────────────────────────────
    print("\n── Pearson r: Human vs LLM judges ──────────────────────────────")
    pearson_results = {}

    for human_name, human_data in [("H1", h1_ratings), ("H2", h2_ratings)]:
        if not human_data:
            continue
        pearson_results[human_name] = {}
        common_h = [p for p in all_pairs if p in human_data]
        print(f"\n  {human_name} ({len(common_h)} pairs):")
        for judge_name, judge_data in llm_judges.items():
            pearson_results[human_name][judge_name] = {}
            for dim in DIMS:
                pairs_ok = [p for p in common_h
                            if human_data[p][dim] is not None
                            and judge_data.get(p, {}).get(dim) is not None]
                hvals = [float(human_data[p][dim])  for p in pairs_ok]
                jvals = [float(judge_data[p][dim]) for p in pairs_ok]
                r, p = _pearson(hvals, jvals)
                pearson_results[human_name][judge_name][dim] = {"r": round(r, 3), "p": round(p, 4)}
            # Overall (flatten all dims)
            all_h, all_j = [], []
            for p_id in common_h:
                for dim in DIMS:
                    hv = human_data[p_id].get(dim)
                    jv = judge_data.get(p_id, {}).get(dim)
                    if hv is not None and jv is not None:
                        all_h.append(float(hv))
                        all_j.append(float(jv))
            r_all, p_all = _pearson(all_h, all_j)
            pearson_results[human_name][judge_name]["overall"] = {"r": round(r_all, 3), "p": round(p_all, 4)}
            sig = "***" if p_all < 0.001 else "**" if p_all < 0.01 else "*" if p_all < 0.05 else ""
            print(f"    {judge_name:<25}: r = {r_all:.3f}{sig}  (n={len(all_h)//3})")

    results["pearson_human_vs_llm"] = pearson_results

    # ── Averaged human vs LLM ─────────────────────────────────────────────
    if h1_ratings and h2_ratings:
        print("\n── Pearson r: Averaged human (H1+H2 mean) vs LLM judges ────────")
        pearson_avg = {}
        common_both = [p for p in all_pairs if p in h1_ratings and p in h2_ratings]
        for judge_name, judge_data in llm_judges.items():
            all_h, all_j = [], []
            for p_id in common_both:
                for dim in DIMS:
                    h1v = h1_ratings[p_id].get(dim)
                    h2v = h2_ratings[p_id].get(dim)
                    jv  = judge_data.get(p_id, {}).get(dim)
                    if h1v is not None and h2v is not None and jv is not None:
                        all_h.append((float(h1v) + float(h2v)) / 2)
                        all_j.append(float(jv))
            r, p = _pearson(all_h, all_j)
            sig = "***" if p < 0.001 else "**" if p < 0.01 else "*" if p < 0.05 else ""
            print(f"  {judge_name:<25}: r = {r:.3f}{sig}  (n={len(all_h)//3})")
            pearson_avg[judge_name] = {"r": round(r, 3), "p": round(p, 4)}
        results["pearson_avg_human_vs_llm"] = pearson_avg

    # ── Suggested weight recalibration ────────────────────────────────────
    if h1_ratings:
        print("\n── Suggested CAS weight recalibration ───────────────────────────")
        print("  (based on κ or inter-rater agreement pattern across dimensions)")
        if results.get("cohen_kappa_h1_h2"):
            kd = results["cohen_kappa_h1_h2"]
            raw = {d: max(kd[d], 0.01) for d in DIMS}
        else:
            # Use H1-vs-best-LLM-judge Pearson r as proxy
            best_judge = "Groq Llama-3.3-70B"
            raw = {}
            for dim in DIMS:
                pairs_ok = [p for p in all_pairs
                            if p in h1_ratings
                            and h1_ratings[p][dim] is not None
                            and llm_judges[best_judge].get(p, {}).get(dim) is not None]
                hv = [float(h1_ratings[p][dim]) for p in pairs_ok]
                jv = [float(llm_judges[best_judge][p][dim]) for p in pairs_ok]
                r, _ = _pearson(hv, jv)
                raw[dim] = max(r, 0.01)

        total = sum(raw.values())
        weights = {d: round(raw[d] / total, 2) for d in DIMS}
        # Force sum=1.00 by adjusting bloom (lowest reliability usually)
        diff = round(1.0 - sum(weights.values()), 2)
        weights["bloom_fit"] = round(weights["bloom_fit"] + diff, 2)
        print(f"  Suggested α (Grade Match):       {weights['grade_match']:.2f}  (current: 0.45)")
        print(f"  Suggested β (Prereq Coverage):   {weights['prereq_coverage']:.2f}  (current: 0.40)")
        print(f"  Suggested γ (Bloom Alignment):   {weights['bloom_fit']:.2f}  (current: 0.15)")
        results["suggested_weights"] = weights

    # ── Manuscript-ready summary ──────────────────────────────────────────
    print("\n" + "=" * 70)
    print("MANUSCRIPT NUMBERS (paste into manuscript)")
    print("=" * 70)

    if results.get("cohen_kappa_h1_h2"):
        kd = results["cohen_kappa_h1_h2"]
        print(f"\nCohen's κ (H1 vs H2):")
        print(f"  Grade Match:       κ = {kd['grade_match']:.3f}")
        print(f"  Prereq Coverage:   κ = {kd['prereq_coverage']:.3f}")
        print(f"  Bloom Alignment:   κ = {kd['bloom_fit']:.3f}")
        print(f"  Overall mean:      κ = {kd['overall_mean']:.3f}")

    if results.get("pearson_avg_human_vs_llm"):
        print(f"\nPearson r (averaged human vs LLM judge):")
        for j, v in results["pearson_avg_human_vs_llm"].items():
            print(f"  {j}: r = {v['r']:.3f}  p = {v['p']:.4f}")

    # ── Write outputs ─────────────────────────────────────────────────────
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_JSON, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n💾 JSON → {OUT_JSON}")

    # CSV summary
    with open(OUT_CSV, "w") as f:
        f.write("metric,dimension,value\n")
        if results.get("cohen_kappa_h1_h2"):
            for dim, v in results["cohen_kappa_h1_h2"].items():
                f.write(f"cohen_kappa_h1_h2,{dim},{v}\n")
        for human, jdict in results.get("pearson_human_vs_llm", {}).items():
            for judge, ddict in jdict.items():
                if "overall" in ddict:
                    f.write(f"pearson_{human}_vs_{judge.replace(' ','_')},overall,{ddict['overall']['r']}\n")
        if results.get("pearson_avg_human_vs_llm"):
            for judge, v in results["pearson_avg_human_vs_llm"].items():
                f.write(f"pearson_avg_human_vs_{judge.replace(' ','_')},overall,{v['r']}\n")
    print(f"💾 CSV → {OUT_CSV}")
    print("\n✅ Done.")


if __name__ == "__main__":
    main()
