"""
Heterogeneous Mini-Corpus Generator — EduLLM-PACER Ablation Fix
================================================================
Generates a synthetic but realistic heterogeneous educational corpus
with 5 document types, each triggering a DIFFERENT routing strategy:

    lecture_notes      → RECURSIVE   (slide/bullet structure)
    worked_example     → EDUCATIONAL (problem-solution pairs)
    syllabus           → FIXED       (tabular, uniform density)
    past_paper         → EDUCATIONAL (Q&A exam pairs)
    reference_material → SEMANTIC    (concept-dense glossary)

Also generates 200 benchmark queries with known expected_doc_ids so
MRR/nDCG can be computed correctly.

Usage:
    cd /Users/nitesh/edullm
    backend/.venv/bin/python scripts/gen_hetero_corpus.py

Outputs:
    data/processed/hetero_corpus.jsonl      (35 documents)
    data/processed/hetero_benchmark.jsonl   (200 queries)
"""
from __future__ import annotations

import json
import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "backend" / "src"))

OUT_CORPUS    = ROOT / "data" / "processed" / "hetero_corpus.jsonl"
OUT_BENCHMARK = ROOT / "data" / "processed" / "hetero_benchmark.jsonl"

# ─── Document templates ───────────────────────────────────────────────────────

SUBJECTS = ["chemistry", "physics", "biology", "mathematics", "geography"]

# ── 1. Lecture Notes (router → RECURSIVE) ────────────────────────────────────
def make_lecture_notes(subject: str, topic: str, lecture_num: int) -> dict:
    doc_id = f"lecture_{subject}_{lecture_num}"
    text = f"""Lecture {lecture_num}: {topic}

Slide 1: Today's Agenda
• Introduction to {topic}
• Key concepts and definitions
• Important formulas and applications
• Key takeaway: Master the fundamentals before moving to advanced topics

Slide 2: What is {topic}?
• {topic} is a fundamental concept in {subject}
• First described by scientists in the 18th century
• Used extensively in modern research and industry
• Recap from last lecture: we covered the historical background

Slide 3: Core Principles of {topic}
• Principle 1 — Conservation of energy applies to all {topic} systems
• Principle 2 — Equilibrium conditions must be satisfied
• Principle 3 — Rate of change is proportional to concentration gradient
• References: [1] NCERT {subject.capitalize()} textbook, Chapter 5

Slide 4: Mathematical Framework
• Primary equation: Q = mcΔT for thermodynamic systems
• Derived relations: P = nRT/V for ideal behaviour
• Boundary conditions: initial state must be well-defined
• Key takeaway: equations describe relationships, not absolute values

Slide 5: Applications in Real World
• Industrial processes use {topic} principles for efficiency
• Environmental monitoring relies on {topic} measurements
• Medical diagnostics apply {topic} concepts in imaging
• Today's topic connects to next lecture on advanced {subject}

Slide 6: Summary and Practice
• {topic} involves three core principles covered today
• Mathematical models help predict system behaviour
• Exam focus: derivations and numerical problems
• Key takeaway from today: understand the concept before memorising formulas
"""
    return {
        "doc_id": doc_id,
        "text": text,
        "metadata": {
            "subject": subject,
            "grade": "secondary",
            "doc_type": "unknown",   # ← forces classifier to run
            "source": f"lecture_notes_{subject}"
        }
    }

# ── 2. Worked Examples (router → EDUCATIONAL) ────────────────────────────────
def make_worked_example(subject: str, problem_type: str, doc_num: int) -> dict:
    doc_id = f"worked_example_{subject}_{doc_num}"
    text = f"""Worked Examples: {problem_type} in {subject.capitalize()}

Example 1: Basic {problem_type} Problem

Given:
- Initial value: x₀ = 2.5 units
- Rate constant: k = 0.03 per second
- Time elapsed: t = 10 seconds

Find: Final value after 10 seconds

Solution:
Step 1: Identify the appropriate formula for {problem_type}.
        The governing equation is: x(t) = x₀ · e^(kt)

Step 2: Substitute the given values into the equation.
        x(10) = 2.5 × e^(0.03 × 10)
        x(10) = 2.5 × e^(0.30)

Step 3: Compute the exponential term.
        e^(0.30) ≈ 1.3499

Step 4: Calculate the final answer.
        x(10) = 2.5 × 1.3499 = 3.375 units

Answer: The final value is 3.375 units.
∴ x(10) = 3.375 units

---

Example 2: Intermediate {problem_type} Problem

Given:
- System mass: m = 5.0 kg
- Applied force: F = 20 N
- Friction coefficient: μ = 0.25
- Gravitational acceleration: g = 9.8 m/s²

Find: Net acceleration of the system

Solution:
Step 1: Calculate the friction force opposing motion.
        Friction force = μ × m × g
        Friction force = 0.25 × 5.0 × 9.8 = 12.25 N

Step 2: Apply Newton's second law: F_net = F_applied - F_friction
        F_net = 20 N - 12.25 N = 7.75 N

Step 3: Calculate acceleration using F = ma.
        a = F_net / m = 7.75 / 5.0 = 1.55 m/s²

Answer: The net acceleration is 1.55 m/s²
Hence, a = 1.55 m/s²

---

Example 3: Advanced {problem_type} Application

Given: A system with two interacting components A and B
- Component A concentration: [A] = 0.4 mol/L
- Component B concentration: [B] = 0.6 mol/L
- Equilibrium constant: K = 2.5

Find: Equilibrium concentrations after reaction

Solution:
Step 1: Set up the ICE (Initial, Change, Equilibrium) table.
        A + B ⇌ C + D
        Initial:      0.4   0.6   0      0
        Change:       -x    -x    +x     +x
        Equilibrium: 0.4-x  0.6-x   x      x

Step 2: Write the equilibrium expression.
        K = [C][D] / [A][B] = x² / (0.4-x)(0.6-x) = 2.5

Step 3: Expand and solve the quadratic equation.
        x² = 2.5 × (0.24 - x + x²)
        Solving: x ≈ 0.28 mol/L

Answer: Equilibrium concentration of product = 0.28 mol/L
Therefore, x = 0.28 mol/L at equilibrium.
"""
    return {
        "doc_id": doc_id,
        "text": text,
        "metadata": {
            "subject": subject,
            "grade": "secondary",
            "doc_type": "unknown",
            "source": f"worked_examples_{subject}"
        }
    }

# ── 3. Syllabuses (router → FIXED) ───────────────────────────────────────────
def make_syllabus(subject: str, grade: int) -> dict:
    doc_id = f"syllabus_{subject}_grade{grade}"
    text = f"""{subject.capitalize()} Syllabus — Grade {grade}
Course Outline and Marks Distribution

Unit I: Foundations of {subject.capitalize()}
Periods: 22    Marks: 12
Topics: Basic concepts, historical development, units and measurements
Prescribed books: NCERT {subject.capitalize()} Part 1

Unit II: Core Principles
Periods: 30    Marks: 16
Topics: Fundamental laws, theoretical frameworks, experimental methods
Reference books: Advanced {subject.capitalize()} by S.K. Sharma

Unit III: Applied {subject.capitalize()}
Periods: 25    Marks: 14
Topics: Real-world applications, problem-solving, case studies
Internal assessment: 20 marks

Unit IV: Advanced Topics
Periods: 28    Marks: 18
Topics: Current research, emerging technologies, interdisciplinary connections
External exam: 80 marks

Unit V: Revision and Practice
Periods: 15    Marks: 20
Topics: Problem sets, mock tests, previous year paper analysis
Course code: {subject[:3].upper()}{grade}01

Marks Distribution:
Theory exam: 70 marks    Duration: 3 hours
Practical: 30 marks      Internal assessment: 20 marks
Total: 100 marks

Weightage per unit:
Unit I  — 12%
Unit II — 16%
Unit III— 14%
Unit IV — 18%
Unit V  — 20%
Practicals — 20%
"""
    return {
        "doc_id": doc_id,
        "text": text,
        "metadata": {
            "subject": subject,
            "grade": "higher_secondary",   # grade 11 = higher_secondary in GradeLevel enum
            "doc_type": "unknown",
            "source": f"syllabus_{subject}"
        }
    }

# ── 4. Past Papers (router → EDUCATIONAL) ────────────────────────────────────
def make_past_paper(subject: str, year: int) -> dict:
    doc_id = f"past_paper_{subject}_{year}"
    text = f"""{subject.capitalize()} Examination Paper — {year}
Time Allowed: 3 Hours          Maximum Marks: 70

General Instructions:
All questions are compulsory. Marks are indicated against each question.
No calculators are permitted. Write legibly.
Roll No.: ___________    Registration No.: ___________

Section A — Multiple Choice Questions (20 marks)

Q1. Which of the following best describes the primary principle of {subject}?
    (a) Conservation of mass only
    (b) Conservation of energy and momentum
    (c) Action-reaction forces
    (d) Electromagnetic induction
    Answer: (2 marks)

Q2. The SI unit of measurement in this domain is:
    (a) Newton  (b) Joule  (c) Pascal  (d) Coulomb
    Answer: (1 mark)

Q3. Answer all of the following: Choose the correct option that applies.
    (a) Statement 1 is true, Statement 2 is false
    (b) Both statements are true
    (c) Statement 1 is false, Statement 2 is true
    (d) Both statements are false
    Answer: (1 mark)

Section B — Short Answer Questions (30 marks)

Q4. Define the fundamental law governing {subject} with one example.
    (2 marks)

Q5. Derive the equation relating force and acceleration for a 5 kg object.
    Show all steps clearly.
    (3 marks)

Q6. A system has initial energy of 50 J. After a process, 15 J is lost as heat.
    Calculate: (a) final energy (b) efficiency of the process.
    (2 marks)

Section C — Long Answer Questions (20 marks)

Q7. Explain the three fundamental principles of {subject} with suitable diagrams.
    Describe one industrial application for each principle.
    Answer all parts:
    (a) Principle 1 with diagram   (3 marks)
    (b) Principle 2 with diagram   (3 marks)
    (c) Industrial application     (4 marks)
    Total: (10 marks)

Q8. Solve the following numerical problem:
    Given: mass = 2 kg, velocity = 10 m/s, height = 5 m
    Find: (a) kinetic energy  (b) potential energy  (c) total mechanical energy
    Show complete solution with answer in SI units.
    (10 marks)
"""
    return {
        "doc_id": doc_id,
        "text": text,
        "metadata": {
            "subject": subject,
            "grade": "secondary",
            "doc_type": "unknown",
            "source": f"past_paper_{subject}_{year}"
        }
    }

# ── 5. Reference Material (router → SEMANTIC) ────────────────────────────────
def make_reference_material(subject: str, topic: str) -> dict:
    doc_id = f"reference_{subject}_{topic.replace(' ', '_')}"
    text = f"""Reference Material: {subject.capitalize()} — {topic}

Glossary of Key Terms

Activation energy: The minimum energy required for a chemical reaction to occur.
See also: Arrhenius equation, reaction rate, catalysis.

Buffer solution: A solution that resists changes in pH when small amounts of
acid or base are added. Cf. Henderson-Hasselbalch equation.

Catalysis: The process of increasing reaction rate using a catalyst that is not
consumed. ibid. activation energy; see also: enzyme kinetics.

Dynamic equilibrium: State where forward and reverse reaction rates are equal.
et al. Le Chatelier's principle, equilibrium constant K.

Entropy (S): Thermodynamic measure of disorder. DOI: 10.1021/ed123456.
ISBN: 978-0-12-345678-9. ISSN: 1234-5678.

Bibliography

1. Atkins, P. W., de Paula, J. (2014). Physical Chemistry. Oxford University Press.
   See also: thermodynamics, quantum mechanics, spectroscopy.

2. Chang, R., Goldsby, K. A. (2016). Chemistry. McGraw-Hill Education.
   Appendix A: Standard reduction potentials. Appendix B: Thermodynamic data.

3. NCERT (2023). {subject.capitalize()} Part I. National Council of Educational Research.
   Reference for grades 11-12 {subject} curriculum, op. cit.

Index

Acid-base theories ............. pp. 142-158
Buffer solutions ................. pp. 178-195
Catalysis and kinetics .......... pp. 217-240
Dynamic equilibrium ............. pp. 195-217
Entropy and free energy ......... pp. 289-312

Appendix A: Important Constants and Values
Avogadro's number: 6.022 × 10²³ mol⁻¹
Planck's constant: 6.626 × 10⁻³⁴ J·s
Boltzmann constant: 1.381 × 10⁻²³ J/K
Gas constant R: 8.314 J/(mol·K)

Appendix B: Glossary of Symbols
ΔH — enthalpy change      ΔS — entropy change
ΔG — Gibbs free energy    K  — equilibrium constant
"""
    return {
        "doc_id": doc_id,
        "text": text,
        "metadata": {
            "subject": subject,
            "grade": "secondary",
            "doc_type": "unknown",
            "source": f"reference_{subject}"
        }
    }

# ─── Benchmark queries ────────────────────────────────────────────────────────

def make_queries(documents: list[dict]) -> list[dict]:
    queries = []

    for doc in documents:
        doc_id  = doc["doc_id"]
        subject = doc["metadata"]["subject"]
        source  = doc["metadata"]["source"]

        if "lecture_" in doc_id:
            # Lecture notes queries — target slide content
            qs = [
                f"What is the agenda for the lecture on {subject}?",
                f"What are the key takeaways from the {subject} lecture?",
                f"What principles are covered in the {subject} lecture slides?",
                f"What real-world applications of {subject} are discussed in the lecture?",
                f"What mathematical framework is used in the {subject} lecture?",
                f"What does the {subject} lecture say about boundary conditions?",
            ]
        elif "worked_example" in doc_id:
            # Worked example queries — target step-by-step solutions
            qs = [
                f"How do you solve a basic {subject} problem step by step?",
                f"What is the answer for Example 1 in the {subject} worked examples?",
                f"How do you calculate net acceleration using Newton's law in {subject}?",
                f"What is the ICE table method for equilibrium problems in {subject}?",
                f"What formula is used to find the final value in Example 1 of {subject}?",
                f"What is the equilibrium concentration of the product in Example 3?",
            ]
        elif "syllabus" in doc_id:
            # Syllabus queries — target unit/marks/period info
            qs = [
                f"How many periods are allocated to Unit II in the {subject} syllabus?",
                f"What is the marks distribution for {subject} theory and practicals?",
                f"What topics are covered in Unit III of the {subject} course?",
                f"What is the weightage of Unit IV in the {subject} syllabus?",
                f"What are the prescribed books for {subject} Unit I?",
                f"What is the total marks and duration of the {subject} external exam?",
            ]
        elif "past_paper" in doc_id:
            # Past paper queries — target exam questions
            qs = [
                f"What are the Section B questions in the {subject} exam paper?",
                f"How many marks is Question 7 worth in the {subject} examination?",
                f"What is Question 4 asking in the {subject} past paper?",
                f"What are the general instructions for the {subject} exam?",
                f"What numerical problem is given in Section C of the {subject} paper?",
                f"What is the maximum marks and time allowed in the {subject} exam?",
            ]
        elif "reference" in doc_id:
            # Reference queries — target glossary/appendix
            qs = [
                f"What is the definition of activation energy in {subject}?",
                f"What does dynamic equilibrium mean in {subject} reference material?",
                f"What is the value of Avogadro's number in the {subject} appendix?",
                f"What is listed in Appendix B of the {subject} reference material?",
                f"Which pages cover buffer solutions in the {subject} index?",
                f"What is the ISBN of the Chang and Goldsby {subject} textbook?",
            ]
        else:
            qs = [f"Tell me about {subject}."]

        for q_text in qs:
            queries.append({
                "query_id":        str(uuid.uuid4()),
                "text":            q_text,
                "subject":         subject,
                "grade":           doc["metadata"].get("grade", "secondary"),
                "expected_doc_ids": [doc_id],
                "expected_chunk_ids": [],
                "bloom_level":     "remember",
                "source":          source,
            })

    return queries

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    documents = []
    topics = {
        "chemistry": ["Acid-Base Chemistry", "Thermodynamics"],
        "physics":   ["Wave Motion", "Electrostatics"],
        "biology":   ["Cell Division", "Genetics"],
        "mathematics": ["Differential Calculus", "Linear Algebra"],
        "geography": ["Climate Systems", "Geomorphology"],
    }
    problem_types = {
        "chemistry": "Equilibrium Calculations",
        "physics":   "Kinematic Problems",
        "biology":   "Population Genetics",
        "mathematics": "Integration Problems",
        "geography": "Topographic Analysis",
    }

    # 1. Lecture notes — 10 docs (2 per subject)
    for subject, topic_list in topics.items():
        for i, topic in enumerate(topic_list, 1):
            documents.append(make_lecture_notes(subject, topic, i))

    # 2. Worked examples — 5 docs (1 per subject)
    for subject in SUBJECTS:
        documents.append(make_worked_example(subject, problem_types[subject], 1))

    # 3. Syllabuses — 5 docs (1 per subject)
    for subject in SUBJECTS:
        documents.append(make_syllabus(subject, 11))

    # 4. Past papers — 5 docs (1 per subject)
    for subject in SUBJECTS:
        documents.append(make_past_paper(subject, 2024))

    # 5. Reference material — 5 docs (1 per subject)
    ref_topics = {
        "chemistry": "Thermodynamics and Equilibrium",
        "physics": "Mechanics and Waves",
        "biology": "Cell Biology and Genetics",
        "mathematics": "Calculus and Algebra",
        "geography": "Physical Geography",
    }
    for subject in SUBJECTS:
        documents.append(make_reference_material(subject, ref_topics[subject]))

    # Generate queries
    queries = make_queries(documents)

    # Save
    OUT_CORPUS.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_CORPUS, "w") as f:
        for doc in documents:
            f.write(json.dumps(doc) + "\n")

    with open(OUT_BENCHMARK, "w") as f:
        for q in queries:
            f.write(json.dumps(q) + "\n")

    # Summary
    from collections import Counter
    doc_types_found = Counter()
    for doc in documents:
        dt = doc["metadata"]["doc_type"]
        if "lecture_" in doc["doc_id"]:      dt = "lecture_notes (→ recursive)"
        elif "worked_example" in doc["doc_id"]: dt = "worked_example (→ educational)"
        elif "syllabus" in doc["doc_id"]:    dt = "syllabus (→ fixed)"
        elif "past_paper" in doc["doc_id"]:  dt = "past_paper (→ educational)"
        elif "reference" in doc["doc_id"]:   dt = "reference_material (→ semantic)"
        doc_types_found[dt] += 1

    print(f"\n✅ Heterogeneous corpus generated")
    print(f"   Documents : {len(documents)}")
    print(f"   Queries   : {len(queries)}")
    print(f"\nDocument type distribution:")
    for dt, count in sorted(doc_types_found.items()):
        print(f"   {count:3d}  {dt}")
    print(f"\nSaved to:")
    print(f"   {OUT_CORPUS}")
    print(f"   {OUT_BENCHMARK}")


if __name__ == "__main__":
    main()
