"""
Chunk Pedagogical Completeness Analysis — Fix #3
==================================================
Measures whether retrieved chunks preserve complete pedagogical units.

For each query in the hetero benchmark, retrieves the top-1 chunk from:
  • PACER full (adaptive routing, educational chunker for worked examples)
  • B0_recursive_base (uniform recursive, no routing)

Scores each chunk on:
  1. completeness  — chunk contains a full instructional unit:
       worked_example docs: contains both "Example N" + "Solution" text
       lecture_note docs:   contains ≥1 complete "Slide N" unit
       syllabus docs:       contains ≥1 complete unit entry with marks/topics
       past_paper docs:     contains ≥1 complete question+answer block
       reference docs:      contains ≥1 appendix section
  2. boundary_start — chunk starts at a natural pedagogical boundary
       (example/slide/unit/question/appendix opener)
  3. avg_chunk_length — chars in top-1 retrieved chunk (proxy for context richness)

Output:
    experiments/results_paper/table5_chunk_quality.csv
    console report by doc-type

Usage:
    backend/.venv/bin/python scripts/run_chunk_quality.py
"""
from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "backend" / "src"))

CORPUS_PATH    = ROOT / "data" / "processed" / "hetero_corpus.jsonl"
BENCHMARK_PATH = ROOT / "data" / "processed" / "hetero_benchmark.jsonl"
OUT_CSV        = ROOT / "experiments" / "results_paper" / "table5_chunk_quality.csv"

EMBED_MODEL  = "BAAI/bge-large-en-v1.5"
EMBED_BATCH  = 128
TOP_K        = 5

# ── Completeness scorers ──────────────────────────────────────────────────────

_EXAMPLE_OPENER = re.compile(r"(?m)^\s*(?:Example|Worked\s+Example)\s+\d+", re.I)
# Synthetic docs use "Answer:" ; real NCERT uses "Solution"; accept both
_SOLUTION_LINE  = re.compile(r"(?m)^\s*(?:Solution|Answer)\b",               re.I)
_SLIDE_OPENER   = re.compile(r"(?m)^\s*Slide\s+\d+\b",                       re.I)
_UNIT_OPENER    = re.compile(r"(?m)^Unit\s+[IVX\d]+[:\s]",                   re.I)
_MARKS_LINE     = re.compile(r"Marks\s*[:\-]?\s*\d+",                        re.I)
_SECTION_HDR    = re.compile(r"(?m)^Section\s+[A-Z]\b",                      re.I)
_QUESTION_LINE  = re.compile(r"(?m)^\s*Q\.?\s*\d+",                          re.I)
_APPENDIX_HDR   = re.compile(r"(?m)^Appendix\s+[A-Z]\b",                     re.I)
_BIB_HDR        = re.compile(r"(?m)^Bibliography",                            re.I)

# Pedagogical boundary openers (for boundary_start detection)
_BOUNDARY_OPENERS = [
    re.compile(r"(?m)^\s*(?:Example|Worked\s+Example)\s+\d+",  re.I),  # worked example
    re.compile(r"(?m)^\s*Slide\s+\d+\b",                        re.I),  # lecture slide
    re.compile(r"(?m)^Unit\s+[IVX\d]+[:\s]",                    re.I),  # syllabus unit
    re.compile(r"(?m)^Section\s+[A-Z]\b",                       re.I),  # past paper section
    re.compile(r"(?m)^\s*Q\.?\s*\d+\b",                         re.I),  # past paper question
    re.compile(r"(?m)^Appendix\s+[A-Z]\b",                      re.I),  # reference appendix
    re.compile(r"(?m)^Bibliography",                             re.I),  # reference bibliography
    re.compile(r"(?m)^WORKED EXAMPLES:",                         re.I),  # NCERT WE header
    re.compile(r"(?m)^EXAMINATION",                              re.I),  # NCERT PP header
]


def _doc_type_from_id(doc_id: str) -> str:
    for prefix, dtype in [
        ("lecture_",    "lecture_notes"),
        ("worked_",     "worked_example"),
        ("syllabus_",   "syllabus"),
        ("past_paper_", "past_paper"),
        ("reference_",  "reference_material"),
        ("ncert_",      "worked_example"),
    ]:
        if doc_id.startswith(prefix):
            return dtype
    return "other"


def _score_chunk(chunk_text: str, doc_type: str) -> dict:
    text = chunk_text

    if doc_type == "worked_example":
        has_opener   = bool(_EXAMPLE_OPENER.search(text))
        has_solution = bool(_SOLUTION_LINE.search(text))
        complete     = has_opener and has_solution
    elif doc_type == "lecture_notes":
        complete     = len(_SLIDE_OPENER.findall(text)) >= 1
    elif doc_type == "syllabus":
        has_unit     = bool(_UNIT_OPENER.search(text))
        has_marks    = bool(_MARKS_LINE.search(text))
        complete     = has_unit and has_marks
    elif doc_type == "past_paper":
        has_section  = bool(_SECTION_HDR.search(text))
        has_question = bool(_QUESTION_LINE.search(text))
        complete     = has_section or (has_question and len(_QUESTION_LINE.findall(text)) >= 2)
    elif doc_type == "reference_material":
        has_appendix = bool(_APPENDIX_HDR.search(text))
        has_bib      = bool(_BIB_HDR.search(text))
        complete     = has_appendix or has_bib
    else:
        complete = False

    boundary_start = any(p.match(text.lstrip()) for p in _BOUNDARY_OPENERS)

    return {
        "complete":       int(complete),
        "boundary_start": int(boundary_start),
        "length":         len(text),
    }


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    from edullm_pacer.embeddings.sentence_transformer import SentenceTransformerEmbedder
    from edullm_pacer.experiments.pacer_pipeline import (
        build_baseline_pipeline,
        build_pacer_pipeline,
    )
    from edullm_pacer.schemas import Document, Query

    # Load data
    raw_docs = [json.loads(l) for l in open(CORPUS_PATH) if l.strip()]
    raw_qs   = [json.loads(l) for l in open(BENCHMARK_PATH) if l.strip()]
    documents = [Document(doc_id=d["doc_id"], text=d["text"],
                          metadata=d.get("metadata", {})) for d in raw_docs]
    print(f"Corpus:    {len(documents)} docs")
    print(f"Benchmark: {len(raw_qs)} queries")

    # Shared embedder
    print(f"\nLoading embedder {EMBED_MODEL}…")
    embedder = SentenceTransformerEmbedder(model_name=EMBED_MODEL)
    _orig = embedder.encode
    def _fast_encode(texts, batch_size=EMBED_BATCH, **kw):
        return _orig(texts, batch_size=batch_size, **kw)
    embedder.encode = _fast_encode
    print(f"  dim={embedder.dim}")

    # Build + index PACER
    print("\n─── Indexing: PACER full ───────────────────────────────────────")
    pacer_pipe = build_pacer_pipeline(
        embedder=embedder, generator=None,
        use_boundary_pp=True, use_router=True,
        chunk_size=2000, chunk_overlap=100, max_unit_chars=4000,
        retriever_type="hybrid", top_k=TOP_K,
    )
    t0 = time.perf_counter()
    pacer_chunks, pacer_dist = pacer_pipe.index(documents)
    print(f"  {len(pacer_chunks)} chunks in {time.perf_counter()-t0:.1f}s | {pacer_dist}")

    # Build + index B0_recursive
    print("\n─── Indexing: B0_recursive_base ────────────────────────────────")
    b0_pipe = build_baseline_pipeline(
        strategy="recursive", embedder=embedder, generator=None,
        chunk_size=2000, chunk_overlap=100, use_boundary_pp=False,
        retriever_type="hybrid", top_k=TOP_K,
    )
    t0 = time.perf_counter()
    b0_chunks, b0_dist = b0_pipe.index(documents)
    print(f"  {len(b0_chunks)} chunks in {time.perf_counter()-t0:.1f}s | {b0_dist}")

    # Per-query chunk quality analysis
    print(f"\n─── Analysing chunk quality for {len(raw_qs)} queries ─────────")

    results_pacer: list[dict] = []
    results_b0:    list[dict] = []

    for raw_q in raw_qs:
        q = Query(
            query_id       = raw_q["query_id"],
            text           = raw_q["text"],
            expected_doc_ids = raw_q["expected_doc_ids"],
        )
        doc_type = _doc_type_from_id(q.expected_doc_ids[0])

        # PACER top-1
        pacer_out = pacer_pipe.ask(q)
        if pacer_out.retrieval.retrieved:
            top_pacer = pacer_out.retrieval.retrieved[0].chunk
            results_pacer.append({
                "doc_type": doc_type,
                **_score_chunk(top_pacer.text, doc_type),
            })

        # B0 top-1
        b0_out = b0_pipe.ask(q)
        if b0_out.retrieval.retrieved:
            top_b0 = b0_out.retrieval.retrieved[0].chunk
            results_b0.append({
                "doc_type": doc_type,
                **_score_chunk(top_b0.text, doc_type),
            })

    # ── Aggregate ─────────────────────────────────────────────────────────
    from collections import defaultdict

    def _agg(results: list[dict]) -> dict:
        by_type: dict[str, list[dict]] = defaultdict(list)
        for r in results:
            by_type[r["doc_type"]].append(r)
        summary = {}
        for dtype, rows in by_type.items():
            n = len(rows)
            summary[dtype] = {
                "n":               n,
                "complete_pct":    sum(r["complete"] for r in rows) / n * 100,
                "boundary_pct":    sum(r["boundary_start"] for r in rows) / n * 100,
                "avg_length":      sum(r["length"] for r in rows) / n,
            }
        # Overall
        all_n = len(results)
        summary["OVERALL"] = {
            "n":            all_n,
            "complete_pct": sum(r["complete"]       for r in results) / all_n * 100,
            "boundary_pct": sum(r["boundary_start"] for r in results) / all_n * 100,
            "avg_length":   sum(r["length"]         for r in results) / all_n,
        }
        return summary

    pacer_agg = _agg(results_pacer)
    b0_agg    = _agg(results_b0)

    # ── Print report ──────────────────────────────────────────────────────
    all_dtypes = sorted(set(pacer_agg) | set(b0_agg))
    print(f"\n{'='*72}")
    print("Chunk Pedagogical Completeness: PACER vs B0_recursive_base")
    print(f"{'='*72}")
    print(f"{'Doc type':<22}  {'N':>4}  "
          f"{'PACER_comp%':>11}  {'B0_comp%':>8}  {'ΔPACER':>7}  "
          f"{'PACER_len':>9}  {'B0_len':>6}")
    print("-" * 72)

    for dtype in all_dtypes:
        p = pacer_agg.get(dtype, {})
        b = b0_agg.get(dtype, {})
        if not p or not b:
            continue
        delta = p["complete_pct"] - b["complete_pct"]
        print(
            f"{dtype:<22}  {p['n']:>4}  "
            f"{p['complete_pct']:>11.1f}  {b['complete_pct']:>8.1f}  "
            f"{delta:>+7.1f}  "
            f"{p['avg_length']:>9.0f}  {b['avg_length']:>6.0f}"
        )

    print()

    # Boundary start
    print(f"{'Doc type':<22}  {'PACER_bdry%':>11}  {'B0_bdry%':>8}  {'Δ':>5}")
    print("-" * 55)
    for dtype in all_dtypes:
        p = pacer_agg.get(dtype, {})
        b = b0_agg.get(dtype, {})
        if not p or not b:
            continue
        delta = p["boundary_pct"] - b["boundary_pct"]
        print(f"{dtype:<22}  {p['boundary_pct']:>11.1f}  {b['boundary_pct']:>8.1f}  {delta:>+5.1f}")

    # ── Write CSV ──────────────────────────────────────────────────────────
    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_CSV, "w") as f:
        f.write("condition,doc_type,n_queries,complete_pct,boundary_start_pct,avg_chunk_length\n")
        for dtype in all_dtypes:
            p = pacer_agg.get(dtype, {})
            b = b0_agg.get(dtype, {})
            if p:
                f.write(f"pacer_full,{dtype},{p['n']},{p['complete_pct']:.1f},"
                        f"{p['boundary_pct']:.1f},{p['avg_length']:.0f}\n")
            if b:
                f.write(f"B0_recursive_base,{dtype},{b['n']},{b['complete_pct']:.1f},"
                        f"{b['boundary_pct']:.1f},{b['avg_length']:.0f}\n")
    print(f"\n💾 CSV → {OUT_CSV}")

    p_ov = pacer_agg.get("OVERALL", {})
    b_ov = b0_agg.get("OVERALL", {})
    print(f"\n✅ Overall: PACER completeness {p_ov.get('complete_pct', 0):.1f}%  "
          f"vs B0 {b_ov.get('complete_pct', 0):.1f}%  "
          f"(Δ={p_ov.get('complete_pct', 0)-b_ov.get('complete_pct', 0):+.1f}pp)")


if __name__ == "__main__":
    main()
