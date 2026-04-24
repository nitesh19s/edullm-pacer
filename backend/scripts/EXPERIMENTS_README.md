# Workstream E — How to Fill Every [TBD] in the Paper

## What you need before starting

```bash
conda activate edullm
cd ~/edullm

# Required Python packages
pip install ragas sentence-transformers scikit-learn scipy
pip install google-generativeai groq  # for LLM judges and query synthesis
```

Add your API keys to `~/edullm/.env`:
```
GROQ_API_KEY=your_groq_key      # free at console.groq.com
GOOGLE_API_KEY=your_gemini_key  # free at aistudio.google.com
```

---

## Step 0: Verify your data exists

```bash
ls data/processed/documents_reconstructed.jsonl
# Should exist. If not: python scripts/export_sqlite_to_pacer.py --mode reconstructed
```

---

## Step 1: Build the query benchmark (runs once)

```bash
python backend/scripts/build_benchmark.py --generator groq --target-n 800
```

This takes 20-40 minutes with Groq (free tier). Check the output:
```bash
cat data/benchmark/benchmark_report.json
# Should show ~800 queries distributed across subjects, grades, Bloom levels
```

---

## Step 2: Run experiments (fills Table 2, 5, 7 and Section 5.2)

For a smoke test (fast, uses small MiniLM embedding, synthetic queries):
```bash
python backend/scripts/run_experiments.py --tasks 1,2,3,5
```

For publication-quality results (slow, uses BGE-large, real queries):
```bash
python backend/scripts/run_experiments.py \
    --tasks 1,2,3,5 \
    --embedding BAAI/bge-large-en-v1.5
```

Expected time on T4 GPU:
- Task 1 (main comparison): 2-4 hours
- Task 2 (ablations): 1-2 hours
- Task 3 (per-doc-type): 1-2 hours
- Task 5 (latency): 30 minutes

---

## Step 3: CAS calibration (fills Section 5.4)

### 3a. Generate calibration pairs
```bash
python backend/scripts/run_experiments.py --tasks 4
```

This creates:
- `data/labels/cas_calibration_pairs.jsonl` (150 query-chunk pairs to rate)
- `data/labels/CAS_RATING_INSTRUCTIONS.md` (instructions for raters)

### 3b. Send to human raters
Share `data/labels/cas_calibration_pairs.jsonl` with your 2 raters.
Give them `data/labels/CAS_RATING_INSTRUCTIONS.md`.

Ask them to add columns:
- h1_grade_match, h1_prereq_coverage, h1_bloom_fit  (Rater H1)
- h2_grade_match, h2_prereq_coverage, h2_bloom_fit  (Rater H2)

Save their completed file as `data/labels/cas_human_ratings.jsonl`

### 3c. Once human ratings are back
```bash
python backend/scripts/run_experiments.py --tasks 4
```

This computes Cohen's kappa, calibrates alpha/beta/gamma, and writes the
numbers directly usable in Section 5.4 of the paper.

---

## Step 4: Compile paper tables

```bash
cat experiments/results/paper_tables.json
```

This JSON contains structured data matching every table in the manuscript.
Use it to fill in the [TBD] values.

---

## Step 5: What to look for in the results

### Table 2 (main comparison)
- PACER should improve P@5 over Fixed-512 (the strongest baseline per Vectara 2025)
- If PACER does NOT improve over Fixed-512, check:
  a. Is the corpus heterogeneous enough? (Check task3_per_doctype.csv)
  b. Is the educational chunker actually preserving boundaries?
  c. Are gold labels in the query benchmark correct?

### Table 5 (per-document-type)
- You NEED at least one document type where a different strategy wins
- If the same strategy wins everywhere, the router premise is weakened
- This is still publishable as a negative result, but change the framing

### Section 5.4 (CAS validation)
- Target: Cohen's kappa >= 0.6 human-human
- If kappa < 0.6, discuss as a limitation and report it anyway
- Reviewers respect transparency; hiding poor kappa is worse

### Latency (Table 7)
- Target: sub-3 second total latency
- If PACER is more than 20% slower than Fixed-512, that's worth discussing
- The overhead should come from classification (~50ms) not chunking

---

## Troubleshooting

**"No module named ragas"**
```bash
pip install ragas
```

**"FAISS out of memory"**
Use fewer documents:
```python
documents = documents[:100]  # in run_experiments.py main()
```

**"Groq rate limited"**
Add sleep(1) in the synthesis loop or use --generator gemini

**"Benchmark queries have no expected_doc_ids"**
This is expected for synthesized queries. The retrieval metrics will be 0.
To fix: after generating, manually annotate 50-100 queries with gold doc IDs,
or use passage-level matching (chunks containing the passage used for synthesis).
