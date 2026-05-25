"""
Generation Quality Comparison — Fix #3
=======================================
Runs 50 hetero-corpus queries through:
  • PACER full (adaptive routing, educational/recursive/fixed/semantic)
  • B0_recursive_base (LangChain-style recursive, no routing)

For each query both conditions retrieve top-3 chunks, a Groq LLM generates
an answer, and a second Groq call judges pairwise which answer is better.

Output:
    experiments/results_paper/table5_generation_quality.csv
    experiments/results/generation_quality_records.jsonl

Usage:
    backend/.venv/bin/python scripts/run_generation_quality.py

Requirements:
    GROQ_API_KEY env var set (free at console.groq.com)
"""
from __future__ import annotations

import json
import os
import random
import sys
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "backend" / "src"))

# ── Config ────────────────────────────────────────────────────────────────────
CORPUS_PATH    = ROOT / "data" / "processed" / "hetero_corpus.jsonl"
BENCHMARK_PATH = ROOT / "data" / "processed" / "hetero_benchmark.jsonl"
OUT_CSV        = ROOT / "experiments" / "results_paper" / "table5_generation_quality.csv"
OUT_JSONL      = ROOT / "experiments" / "results" / "generation_quality_records.jsonl"

EMBED_MODEL    = "BAAI/bge-large-en-v1.5"
EMBED_BATCH    = 128
GEN_MODEL      = "llama-3.3-70b-versatile"
TOP_K          = 3
N_QUERIES      = 50        # stratified: 10 per doc type
RANDOM_SEED    = 42

# ── Helpers ───────────────────────────────────────────────────────────────────
def _load_jsonl(path: Path) -> list[dict]:
    with open(path) as f:
        return [json.loads(l) for l in f if l.strip()]


def _doc_type_of(query_text: str, doc_id: str, docs: list[dict]) -> str:
    """Guess doc type from doc_id prefix for stratified sampling."""
    for prefix, dtype in [
        ("lecture_",    "lecture_notes"),
        ("worked_",     "worked_example"),
        ("syllabus_",   "syllabus"),
        ("past_paper_", "past_paper"),
        ("reference_",  "reference_material"),
    ]:
        if doc_id.startswith(prefix):
            return dtype
    return "other"


def _stratified_sample(queries: list[dict], docs: list[dict],
                        n_per_type: int = 10, seed: int = RANDOM_SEED) -> list[dict]:
    """Sample n_per_type queries per doc-type bucket."""
    rng = random.Random(seed)
    buckets: dict[str, list[dict]] = {}
    for q in queries:
        doc_id = q["expected_doc_ids"][0]
        dtype  = _doc_type_of(q.get("text", ""), doc_id, docs)
        buckets.setdefault(dtype, []).append(q)

    sampled: list[dict] = []
    for dtype in sorted(buckets):
        pool = buckets[dtype]
        n    = min(n_per_type, len(pool))
        sampled.extend(rng.sample(pool, n))
    return sampled


def _chunks_to_context(chunks) -> str:
    parts = []
    for i, c in enumerate(chunks, 1):
        parts.append(f"[Source {i}] (doc: {c.doc_id})\n{c.text.strip()}")
    return "\n\n".join(parts)


def _build_rag_prompt(query: str, context: str) -> str:
    return (
        f"Context:\n{context}\n\n"
        f"Question: {query}\n\n"
        "Answer based only on the context above. Be concise and accurate."
    )


def _judge_prompt(query: str, answer_a: str, answer_b: str) -> str:
    """Pairwise judge prompt — blind to which is PACER vs recursive."""
    return (
        f"You are an educational quality evaluator.\n"
        f"A student asked: \"{query}\"\n\n"
        f"Answer A:\n{answer_a}\n\n"
        f"Answer B:\n{answer_b}\n\n"
        "Evaluate which answer is more accurate, complete, and helpful for a "
        "school student. Respond with EXACTLY one word: A, B, or Tie. "
        "Then on the next line explain in one sentence why."
    )


def _call_groq(client, prompt: str, model: str, max_tokens: int = 300,
               system: str | None = None) -> tuple[str, float]:
    msgs = []
    if system:
        msgs.append({"role": "system", "content": system})
    msgs.append({"role": "user", "content": prompt})
    t0 = time.perf_counter()
    resp = client.chat.completions.create(
        model=model, messages=msgs, max_tokens=max_tokens, temperature=0.1
    )
    elapsed_ms = (time.perf_counter() - t0) * 1000
    return resp.choices[0].message.content.strip(), elapsed_ms


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    from groq import Groq

    from edullm_pacer.embeddings.sentence_transformer import SentenceTransformerEmbedder
    from edullm_pacer.experiments.pacer_pipeline import (
        build_baseline_pipeline,
        build_pacer_pipeline,
    )
    from edullm_pacer.schemas import Document, Query

    groq_key = os.getenv("GROQ_API_KEY", "")
    if not groq_key:
        raise SystemExit("GROQ_API_KEY not set")
    groq_client = Groq(api_key=groq_key)

    # ── Load corpus + benchmark ────────────────────────────────────────────
    raw_docs  = _load_jsonl(CORPUS_PATH)
    raw_qs    = _load_jsonl(BENCHMARK_PATH)
    documents = [Document(doc_id=d["doc_id"], text=d["text"],
                          metadata=d.get("metadata", {})) for d in raw_docs]
    print(f"Corpus:    {len(documents)} docs")
    print(f"Benchmark: {len(raw_qs)} queries")

    # ── Stratified sample ──────────────────────────────────────────────────
    sampled_qs = _stratified_sample(raw_qs, raw_docs, n_per_type=10)
    print(f"Sampled:   {len(sampled_qs)} queries ({N_QUERIES} target)")

    # ── Load shared embedder ───────────────────────────────────────────────
    print(f"\nLoading embedder {EMBED_MODEL}…")
    embedder = SentenceTransformerEmbedder(model_name=EMBED_MODEL)
    _orig = embedder.encode
    embedder.encode = lambda texts, **kw: _orig(texts, batch_size=EMBED_BATCH, **kw)
    print(f"  dim={embedder.dim}")

    # ── Build + index PACER pipeline ───────────────────────────────────────
    print("\n─── Indexing: PACER full ───────────────────────────────────────")
    pacer_pipe = build_pacer_pipeline(
        embedder=embedder, generator=None,
        use_boundary_pp=True, use_router=True,
        chunk_size=2000, chunk_overlap=100, max_unit_chars=4000,
        retriever_type="hybrid", top_k=TOP_K,
    )
    t0 = time.perf_counter()
    pacer_chunks, pacer_dist = pacer_pipe.index(documents)
    pacer_idx_s = time.perf_counter() - t0
    print(f"  {len(pacer_chunks)} chunks in {pacer_idx_s:.1f}s | dist: {pacer_dist}")

    # ── Build + index B0 recursive pipeline ───────────────────────────────
    print("\n─── Indexing: B0_recursive_base ────────────────────────────────")
    b0_pipe = build_baseline_pipeline(
        strategy="recursive", embedder=embedder, generator=None,
        chunk_size=2000, chunk_overlap=100, use_boundary_pp=False,
        retriever_type="hybrid", top_k=TOP_K,
    )
    t0 = time.perf_counter()
    b0_chunks, b0_dist = b0_pipe.index(documents)
    b0_idx_s = time.perf_counter() - t0
    print(f"  {len(b0_chunks)} chunks in {b0_idx_s:.1f}s | dist: {b0_dist}")

    # ── Generation + judging ───────────────────────────────────────────────
    sys_answer = (
        "You are an expert educational assistant for Indian school students. "
        "Answer based only on the provided context. Be clear and concise."
    )
    records: list[dict[str, Any]] = []

    pacer_wins = b0_wins = ties = errors = 0
    pacer_scores: list[float] = []
    b0_scores:    list[float] = []

    print(f"\n─── Generating + judging {len(sampled_qs)} queries ───────────")
    for i, raw_q in enumerate(sampled_qs, 1):
        qtext   = raw_q["text"]
        doc_id  = raw_q["expected_doc_ids"][0]
        dtype   = _doc_type_of(qtext, doc_id, [])
        q = Query(query_id=raw_q["query_id"], text=qtext,
                  expected_doc_ids=raw_q["expected_doc_ids"])

        # Retrieve
        pacer_out = pacer_pipe.ask(q)
        b0_out    = b0_pipe.ask(q)

        pacer_ctx = _chunks_to_context(
            pacer_out.retrieval.retrieved_chunks[:TOP_K])
        b0_ctx    = _chunks_to_context(
            b0_out.retrieval.retrieved_chunks[:TOP_K])

        # Generate answers
        pacer_ans, pacer_gen_ms = _call_groq(
            groq_client, _build_rag_prompt(qtext, pacer_ctx),
            GEN_MODEL, max_tokens=250, system=sys_answer,
        )
        b0_ans, b0_gen_ms = _call_groq(
            groq_client, _build_rag_prompt(qtext, b0_ctx),
            GEN_MODEL, max_tokens=250, system=sys_answer,
        )

        # Randomise A/B to avoid position bias
        rng_local = random.Random(raw_q["query_id"])
        swap = rng_local.random() < 0.5
        answer_a = b0_ans if swap else pacer_ans
        answer_b = pacer_ans if swap else b0_ans
        a_label  = "B0" if swap else "PACER"
        b_label  = "PACER" if swap else "B0"

        judge_resp, judge_ms = _call_groq(
            groq_client, _judge_prompt(qtext, answer_a, answer_b),
            GEN_MODEL, max_tokens=80,
        )
        first_word = judge_resp.split()[0].upper().rstrip(".,;:")

        if first_word == "A":
            winner = a_label
        elif first_word == "B":
            winner = b_label
        elif first_word in ("TIE", "BOTH", "NEITHER"):
            winner = "tie"
        else:
            winner = "unclear"

        if winner == "PACER":
            pacer_wins += 1
            pacer_score, b0_score = 1.0, 0.0
        elif winner == "B0":
            b0_wins += 1
            pacer_score, b0_score = 0.0, 1.0
        elif winner == "tie":
            ties += 1
            pacer_score, b0_score = 0.5, 0.5
        else:
            errors += 1
            pacer_score, b0_score = 0.5, 0.5

        pacer_scores.append(pacer_score)
        b0_scores.append(b0_score)

        rec = {
            "query_id":    raw_q["query_id"],
            "doc_type":    dtype,
            "query":       qtext,
            "pacer_answer": pacer_ans,
            "b0_answer":   b0_ans,
            "judge_raw":   judge_resp,
            "winner":      winner,
            "pacer_score": pacer_score,
            "b0_score":    b0_score,
            "pacer_gen_ms": round(pacer_gen_ms, 1),
            "b0_gen_ms":   round(b0_gen_ms, 1),
            "judge_ms":    round(judge_ms, 1),
        }
        records.append(rec)
        print(f"  [{i:2d}/{len(sampled_qs)}] {dtype:<20} → winner={winner:<6}  "
              f"PACER={pacer_score:.1f} B0={b0_score:.1f}  "
              f"q: {qtext[:55]}…")

        # Be polite to Groq free tier (3 req/s limit)
        time.sleep(0.5)

    # ── Summaries ──────────────────────────────────────────────────────────
    n = len(records)
    pacer_avg   = sum(pacer_scores) / n
    b0_avg      = sum(b0_scores) / n
    pacer_win_pct = pacer_wins / n * 100
    b0_win_pct    = b0_wins  / n * 100
    tie_pct       = ties     / n * 100

    print(f"\n{'='*60}")
    print("Generation Quality Results:")
    print(f"  Queries evaluated: {n}")
    print(f"  PACER wins:   {pacer_wins}/{n}  ({pacer_win_pct:.1f}%)")
    print(f"  B0 wins:      {b0_wins}/{n}  ({b0_win_pct:.1f}%)")
    print(f"  Ties:         {ties}/{n}  ({tie_pct:.1f}%)")
    print(f"  Errors:       {errors}")
    print(f"  PACER avg score: {pacer_avg:.3f}  (1=win, 0.5=tie, 0=loss)")
    print(f"  B0    avg score: {b0_avg:.3f}")

    # Per-type breakdown
    from collections import defaultdict
    type_wins: dict[str, dict[str, int]] = defaultdict(lambda: {"pacer": 0, "b0": 0, "tie": 0})
    for r in records:
        w = r["winner"]
        if w == "PACER":  type_wins[r["doc_type"]]["pacer"] += 1
        elif w == "B0":   type_wins[r["doc_type"]]["b0"]    += 1
        else:             type_wins[r["doc_type"]]["tie"]    += 1

    print("\n  Per doc-type:")
    print(f"  {'type':<22} PACER  B0  Tie")
    for dtype in sorted(type_wins):
        tw = type_wins[dtype]
        print(f"  {dtype:<22} {tw['pacer']:>5}  {tw['b0']:>3}  {tw['tie']:>3}")

    # ── Write CSV ──────────────────────────────────────────────────────────
    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_CSV, "w") as f:
        f.write("condition,n_queries,win_count,win_pct,avg_score,pacer_chunks,b0_chunks\n")
        f.write(f"pacer_full,{n},{pacer_wins},{pacer_win_pct:.1f},{pacer_avg:.4f},{len(pacer_chunks)},{len(b0_chunks)}\n")
        f.write(f"B0_recursive_base,{n},{b0_wins},{b0_win_pct:.1f},{b0_avg:.4f},{len(pacer_chunks)},{len(b0_chunks)}\n")
        f.write(f"tie,{n},{ties},{tie_pct:.1f},,{len(pacer_chunks)},{len(b0_chunks)}\n")
    print(f"\n💾 CSV → {OUT_CSV}")

    # ── Write JSONL records ────────────────────────────────────────────────
    OUT_JSONL.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_JSONL, "w") as f:
        for r in records:
            f.write(json.dumps(r) + "\n")
    print(f"💾 JSONL → {OUT_JSONL}")

    print(f"\n✅ Fix #3 complete — PACER preferred by LLM judge in "
          f"{pacer_win_pct:.0f}% of {n} queries "
          f"(vs {b0_win_pct:.0f}% B0, {tie_pct:.0f}% tie)")


if __name__ == "__main__":
    main()
