# PACER Version 2 — Expert Rater Calibration Protocol
## CAS Human Validation: Calibrated Re-Rating Study

---

## Goal
Establish defensible inter-rater reliability (Krippendorff α ≥ 0.60, ICC(A,k) ≥ 0.50) for the
three CAS dimensions across 3–5 trained expert raters, replacing the uncalibrated teacher panel
results from Version 1.

**Target venue:** Journal (e.g., Computers & Education: AI, Information Processing & Management,
AIED conference full paper)

---

## Rater Recruitment (3–5 raters needed)

| Role | Required profile | Count |
|---|---|---|
| R1 — STEM Expert | CBSE Math or Science PGT, ≥ 5 yrs, familiar with grades 7–12 curriculum | 1–2 |
| R2 — Pedagogy Expert | Educational psychologist or curriculum designer, familiar with Bloom's taxonomy | 1 |
| R3 — CS/AI Faculty | ML/NLP researcher or professor familiar with RAG and educational AI | 1–2 |

**Minimum viable set:** R1 + R2 + R3 (3 raters). Ideal: 5 raters for higher ICC(A,k).

---

## Item Sample (50 pairs — not 150)

Select 50 pairs from the existing 150 to maximise discriminability:
- **25 pairs** where Version 1 teacher consensus was HIGH variance (item SD > 1.2 on any dimension)
- **15 pairs** where teacher mean was Mid band (CAS 2.5–3.5) — these are the discriminating cases
- **10 pairs** where teacher mean was High band but with spread (to confirm ceiling vs genuine High)

**Rationale:** Fatigue (150 pairs in one session) was a key driver of low IRR in Version 1.
50 pairs is achievable in 45–60 minutes with calibration.

---

## Calibration Session (60–90 minutes, before independent rating)

### Step 1 — Dimension walkthrough (15 min)

Walk raters through the three dimensions using the rubric below:

#### Grade Match (1–5)
Measures: Does the retrieved chunk's complexity match the grade level implied by the query?

| Score | Anchor description |
|---|---|
| 1 | Chunk is clearly from a different grade band (e.g., Grade 12 content for a Grade 7 query) |
| 2 | Chunk is from adjacent grade but notably too advanced or too simple |
| 3 | Chunk is approximately grade-appropriate but has minor mismatches |
| 4 | Chunk is well-matched to the query's grade level |
| 5 | Chunk is perfectly calibrated — exactly the right complexity, terminology, and depth |

#### Prerequisite Coverage (1–5)
Measures: Does the chunk assume the right prior knowledge for the student asking the question?

| Score | Anchor description |
|---|---|
| 1 | Chunk assumes extensive prior knowledge the student at this level would not have |
| 2 | Chunk assumes significant prerequisites not covered at this grade level |
| 3 | Chunk assumes some prerequisites; a typical student might manage with effort |
| 4 | Chunk is appropriately scaffolded for the grade level |
| 5 | Chunk is self-contained and fully accessible to a student at this grade level |

#### Bloom Alignment (1–5)
Measures: Does the chunk match the cognitive level of the student's query?

| Score | Anchor description |
|---|---|
| 1 | Complete mismatch — chunk addresses Remember-level content for an Evaluate-level query, or vice versa |
| 2 | Weak match — chunk is two or more Bloom levels away from the query |
| 3 | Partial match — chunk is adjacent but not exact (e.g., chunk explains, query asks to analyse) |
| 4 | Good match — chunk addresses the intended cognitive level |
| 5 | Exact match — chunk directly supports the cognitive demand of the query |

---

### Step 2 — Practice rating with 10 anchor pairs (30 min)

Rate 10 pre-scored anchor pairs independently, then discuss disagreements as a group.
Anchor pairs should include at least:
- 2 clear Low pairs (CAS < 2.5) — e.g., Grade 12 calculus chunk retrieved for a Grade 7 query
- 3 Mid pairs (CAS 2.5–3.5) — the most discriminating cases
- 5 High pairs (CAS > 3.5) — confirm shared understanding of High vs Very High

**Goal:** All raters within ±1 on ≥ 80% of anchor pairs before proceeding to independent rating.
If not achieved, discuss remaining disagreements and re-anchor.

---

### Step 3 — Independent rating of 50 pairs (45–60 min)

- Raters rate independently with no communication
- Provide rating form (Google Form or spreadsheet) with:
  - Pair ID
  - Student question (with grade level and subject shown)
  - Retrieved chunk
  - Three rating sliders (1–5) for GM, PR, BL
  - Optional free-text notes field

---

## Analysis Plan

### Primary IRR metrics
1. **Krippendorff α (ordinal)** — target ≥ 0.60 per dimension
2. **ICC(A,k) — average raters, absolute agreement** — target ≥ 0.50
3. **Mean pairwise linear-weighted Cohen's κ** — target ≥ 0.60

### Secondary metrics
4. % exact agreement, % adjacent agreement (±1)
5. Correlation between expert rater consensus and Version 1 teacher panel means
6. Correlation between expert rater consensus and LLM judge scores

### CAS weight calibration
Once IRR is confirmed (α ≥ 0.60 on all dimensions):
- Compute per-pair expert consensus CAS score (mean across raters)
- Run grid search over α, β, γ (step 0.05, constraint α+β+γ=1)
- Select weights maximising Pearson r between formula CAS and expert consensus CAS
- Report optimised weights and compare to Version 1 heuristic weights (α=0.45, β=0.40, γ=0.15)

---

## Timeline

| Week | Task |
|---|---|
| Week 1 | Recruit raters, confirm availability |
| Week 2 | Select 50-pair sample, prepare rating materials |
| Week 3 | Run calibration session (online or in-person, 90 min) |
| Week 3 | Independent rating (raters complete asynchronously within 48 hrs) |
| Week 4 | Compute IRR, calibrate weights, write Version 2 §4.5 and §5.4 |

---

## Version 2 paper changes (once calibration data is in hand)

| Section | Change |
|---|---|
| §4.5 | Replace Version 1 teacher panel description with calibrated protocol description |
| Table 5 | Replace teacher panel means with expert rater IRR (α, ICC, κ) |
| §5.4 | Report calibrated IRR numbers; add Pearson r with LLM judges |
| §6.3 | Replace ceiling-effect discussion with strong reliability claim |
| Limitation 5 | Remove — limitation is resolved |
| Abstract | Replace "teacher panel" sentence with IRR-validated claim |

---

## Contact for rater recruitment
Nitesh Sharma — nitesh.sharma@shoolini.edu.in
Yogananda School of AI, Computers & Data Science, Shoolini University
