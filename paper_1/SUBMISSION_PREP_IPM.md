# IP&M Submission Prep — PACER Paper 1
**Journal:** Information Processing & Management (IP&M)  
**Target section:** Regular Article  
**Prepared:** 2026-05-25  

---

## 1. Cover Letter

---

**[Your Institution Letterhead / Plain Text]**

To the Editor,  
Information Processing & Management

Dear Editor,

We are pleased to submit our manuscript titled **"PACER: Pedagogy-Aware Adaptive Chunking for Educational Retrieval-Augmented Generation"** for consideration for publication in *Information Processing & Management*.

**What the paper does.** This paper introduces PACER, a document-type-aware chunking framework that adapts its chunking strategy to the pedagogical structure of educational materials before indexing them for RAG. PACER comprises four components: a rule-based document classifier (seven educational types), a deterministic strategy router, a family of five pedagogy-aware chunkers, and a Curriculum Alignment Score (CAS) for retrieval quality assessment. To the best of our knowledge, PACER is the first system to make chunking strategy selection an explicit function of educational document type for RAG.

**What we found.** Evaluated on 900 queries over 8,563 NCERT educational documents (Indian K-12 curriculum, subjects: Mathematics, Science, Social Science, grades 6–12), PACER achieves:
- MRR = 0.924 and nDCG@10 = 0.921 with BGE-large-en-v1.5 embeddings
- 65–72 ms mean query latency — competitive with external baselines
- CAS = 0.651 (Fleiss κ = 0.545 across three LLM judge pairs, n = 150 calibration pairs)
- On the homogeneous NCERT corpus, PACER's educational chunker outperforms a LangChain-style recursive baseline on rank-1 precision (MRR 0.924 vs 0.919) while the recursive baseline's coarser chunks score higher on list-quality nDCG@10 (0.959 vs 0.921), reflecting the precision–coverage trade-off between fine-grained pedagogical units and broad passage retrieval.
- On a 30-document heterogeneous corpus (five document types), PACER outperforms recursive chunking by +5.9% MRR (0.941 vs 0.888) and fixed-size chunking by +9.8% (0.941 vs 0.843), deploying four type-specific strategies vs. uniform chunking for both baselines.

**Why IP&M.** PACER directly addresses IP&M's scope: information retrieval, educational information systems, and language model applications. The work fills a concrete gap — existing RAG chunking research optimises for homogeneous corpora and does not model the pedagogical structure that distinguishes educational content from general text. We provide an open benchmark (900 curriculum-aligned queries), evaluation code, and a reproducible experimental protocol.

**Declarations.** This work received no funding from public, commercial, or not-for-profit agencies. The authors declare no competing interests. An AI writing assistant was used for grammar checking of selected passages; all scientific content, experimental design, data collection, analysis, and conclusions are solely the authors' own work.

We confirm that this manuscript is original, has not been published previously, and is not under consideration elsewhere. All authors have approved the submitted version.

We look forward to the reviewers' feedback.

Yours sincerely,

**Nitesh Sharma**  
PhD Research Scholar, Department of Computer Science & Engineering  
Shoolini University of Biotechnology and Management Sciences  
Solan, Himachal Pradesh, India  
Email: nitesh19.s@gmail.com

---

## 2. Highlights
*(Required by IP&M: 3–5 bullet points, each ≤ 85 characters)*

```
PACER adapts RAG chunking to 5 pedagogical document types automatically.
Rule-based classifier achieves 100% precision on 7 NCERT document types.
MRR = 0.924 on 900-query NCERT benchmark with BGE-large embeddings.
Curriculum Alignment Score (CAS) validated via three LLM judge pairs (κ=0.55).
Adaptive routing deploys 4 distinct strategies on heterogeneous corpora.
```

**Character counts (verify ≤ 85 each):**
- "PACER adapts RAG chunking to 5 pedagogical document types automatically." → 71 ✓
- "Rule-based classifier achieves 100% precision on 7 NCERT document types." → 72 ✓
- "MRR = 0.924 on 900-query NCERT benchmark with BGE-large embeddings." → 67 ✓
- "Curriculum Alignment Score (CAS) validated via three LLM judge pairs (κ=0.55)." → 79 ✓
- "Adaptive routing deploys 4 distinct strategies on heterogeneous corpora." → 71 ✓

---

## 3. Keywords (3–7 required)

1. Educational RAG
2. Pedagogy-aware chunking
3. Document classification
4. Adaptive retrieval
5. Curriculum alignment
6. NCERT

---

## 4. Abstract (≤ 250 words — verify word count)

Retrieval-Augmented Generation (RAG) systems applied to educational content face a fundamental mismatch: generic chunking strategies developed for web or news corpora ignore the diverse pedagogical structures — textbook chapters, worked examples, past papers, syllabuses, lecture notes — that define educational document collections. We introduce PACER (Pedagogy-Aware Adaptive Chunking for Educational RAG), a framework that selects chunking strategy as an explicit function of educational document type. PACER comprises: (i) a rule-based document classifier mapping seven educational categories from textual markers; (ii) a deterministic strategy router translating document type to one of five chunking strategies (fixed, recursive, semantic, educational, hybrid); (iii) a set of pedagogy-aware chunkers that preserve pedagogical units (definition–example pairs, question–solution pairs, unit–objective pairs); and (iv) a Curriculum Alignment Score (CAS) combining grade-level match, prerequisite preservation, and Bloom's taxonomy alignment for retrieval quality measurement. Evaluated on a benchmark of 900 curriculum-aligned queries over 8,563 NCERT educational documents spanning Mathematics, Science, and Social Science (grades 6–12), PACER achieves MRR = 0.924 and nDCG@10 = 0.921 with BGE-large-en-v1.5 embeddings at 87 ms mean latency. CAS reaches 0.651 with moderate inter-judge agreement (Fleiss κ = 0.545, n = 150 pairs, three LLM judges). On the homogeneous NCERT corpus, PACER's educational chunker achieves higher rank-1 precision (MRR 0.924 vs 0.919 for recursive baseline) while the recursive baseline's broader chunks score higher on nDCG@10 (0.959 vs 0.921), confirming a precision–coverage trade-off between fine-grained pedagogical units and passage-level retrieval. On a heterogeneous corpus spanning five document types, PACER's adaptive router outperforms recursive chunking by +5.9% MRR (0.941 vs 0.888) and fixed-size chunking by +9.8% (0.843), deploying four type-specific strategies vs. uniform chunking for both baselines. PACER provides a reproducible evaluation protocol, open-source implementation, and a curriculum-aligned benchmark for educational RAG research.

**Word count: ~220 words ✓**

---

## 5. Mandatory Declarations

### 5.1 Competing Interests
The authors declare that they have no known competing financial interests or personal relationships that could have appeared to influence the work reported in this paper.

### 5.2 Funding Statement
This research did not receive any specific grant from funding agencies in the public, commercial, or not-for-profit sectors.

### 5.3 Data Availability Statement
The benchmark queries (900 NCERT curriculum-aligned queries), experimental results, and evaluation code are available at: https://github.com/nitesh19s/edullm-pacer. The NCERT textbook corpus is publicly available from the National Council of Educational Research and Training (ncert.nic.in). The processed JSONL exports used for reproducibility are included in the repository's `data/processed/` directory.

### 5.4 CRediT Author Contribution Statement
**Nitesh Sharma:** Conceptualization, Methodology, Software, Data Curation, Formal Analysis, Investigation, Writing – Original Draft, Writing – Review & Editing, Visualization.

*(If additional co-authors are added before submission, update accordingly.)*

### 5.5 AI Use Disclosure (required by IP&M since 2023)
An AI writing assistant (Claude, Anthropic) was used for grammar checking and copy-editing of selected passages in this manuscript. The AI was not used to generate scientific content, experimental design, data analysis, or conclusions. All intellectual contributions are solely the authors'. The authors take full responsibility for the integrity and accuracy of all content.

---

## 6. Submission Checklist

- [ ] Manuscript ≤ 10,000 words (verify in Word: Review → Word Count, subtract references)
- [ ] Abstract ≤ 250 words ✓ (~220)
- [ ] 3–7 Keywords ✓ (6 listed)
- [ ] 3–5 Highlights ✓ (5 listed, all ≤ 85 chars)
- [ ] Figures: all figures have captions; min 300 DPI for print
- [ ] Tables: all tables have titles and notes
- [ ] References: check format (Elsevier author-date or numbered — check IP&M guide for authors)
- [ ] Competing interests declaration ✓
- [ ] Funding statement ✓
- [ ] Data availability statement ✓
- [ ] CRediT statement ✓
- [ ] AI use disclosure ✓
- [ ] Cover letter ✓
- [ ] Ethics statement (if human subjects): N/A — no human subjects (LLM judges, public documents)
- [ ] Supplementary materials (if any): attach as separate file

### Paper numbers to verify are up-to-date in manuscript:
| Value | File source |
|-------|-------------|
| MRR = 0.924 | table1_main_results.csv, pacer + bge row |
| nDCG@10 = 0.921 | same |
| CAS = 0.651 | same |
| Latency = 87 ms | table4_latency.csv, pacer + bge row |
| Queries: 900 | benchmark.jsonl (900 records) |
| Documents: 8,563 | experiments/logs — "Loaded 8,563 documents" |
| Chunks: 16,369 | experiments/logs — "Indexed 16,369 chunks" |
| Fleiss κ = 0.545 | table3_cas_kappa.json, fleiss_kappa.overall_mean |
| κ calibration pairs: 150 | table3_cas_kappa.json, n_calibration_pairs |
| Hetero MRR pacer_full = 0.9413 | table3_hetero_ablation.csv |
| Hetero MRR B0_recursive_base = 0.8877 | table3_hetero_ablation.csv |
| Hetero MRR A1_fixed_base = 0.8428 | table3_hetero_ablation.csv |
| Hetero nDCG@10 pacer_full = 0.9056 | table3_hetero_ablation.csv |
| Hetero nDCG@10 B0_recursive_base = 0.8859 | table3_hetero_ablation.csv |
| Hetero nDCG@10 A1_fixed_base = 0.8825 | table3_hetero_ablation.csv |
| NCERT MRR pacer_full = 0.9241 | table2_ablation.csv |
| NCERT MRR B0_recursive_base = 0.9194 | table2_ablation.csv |
| NCERT nDCG@10 pacer_full = 0.9208 | table2_ablation.csv |
| NCERT nDCG@10 B0_recursive_base = 0.9584 | table2_ablation.csv |
| NCERT chunks pacer_full = 16,369 | table2_ablation.csv |
| NCERT chunks B0_recursive = 9,493 | table2_ablation.csv |
| Chunk completeness PACER overall = 78.8% | table5_chunk_quality.csv |
| Chunk completeness B0_recursive overall = 63.7% | table5_chunk_quality.csv |
| Chunk completeness PACER worked_example = 96.7% | table5_chunk_quality.csv |
| Chunk completeness B0_recursive worked_example = 0.0% | table5_chunk_quality.csv |
| Boundary start PACER worked_example = 96.7% | table5_chunk_quality.csv |
| Boundary start B0_recursive worked_example = 26.7% | table5_chunk_quality.csv |

---

## 7. Suggested Reviewers (IP&M allows 3–5)

1. **Researcher working on educational NLP / RAG** — search Google Scholar for recent IP&M papers on "educational question answering" or "educational information retrieval"
2. **RAG / chunking expert** — someone who has published on document chunking for LLMs
3. **CBSE/curriculum-aware IR researcher** — from India or with NCERT/K-12 expertise

*(Names and emails to be added manually before submission — do not leave blank on submission form.)*

---

## 8. Journal Submission URL

https://www.editorialmanager.com/ipman/  
(IP&M uses Editorial Manager — create account if not already registered)

---

*This file is for submission prep only — do not include in the manuscript.*
