"""
Heterogeneous Corpus Generator v3 — 50 docs, 5 types
=====================================================
30 synthetic (unchanged from v2) + 10 real NCERT extractions
+ 10 more synthetic (5 new syllabuses + 5 new reference materials).

Real NCERT docs use extracted text from actual PDFs; queries target
specific named examples/exercises so the correct chunk must rank #1.

Output:
    data/processed/hetero_corpus.jsonl      (50 docs)
    data/processed/hetero_benchmark.jsonl   (≈290 queries)
"""
from __future__ import annotations

import hashlib, json, re, sys
from pathlib import Path

ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "backend" / "src"))

CORPUS_OUT    = ROOT / "data" / "processed" / "hetero_corpus.jsonl"
BENCHMARK_OUT = ROOT / "data" / "processed" / "hetero_benchmark.jsonl"
NCERT_ROOT    = ROOT / "data" / "raw" / "ncert-pdfs"

# ── PDF helpers ────────────────────────────────────────────────────────────────
def _clean(text: str) -> str:
    text = re.sub(r"Reprint \d{4}-\d{2,4}\s*\n", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def _pdf_text(path) -> str:
    import fitz
    doc = fitz.open(str(path))
    return "\n".join(p.get_text() for p in doc)

def _example_block(full_text: str, start_n: int, count: int = 4) -> str:
    positions = [(m.start(), m.group()) for m in re.finditer(r"Example\s+\d+", full_text)]
    idx = next((i for i, (_, g) in enumerate(positions)
                if int(re.search(r"\d+", g).group()) == start_n), None)
    if idx is None:
        return ""
    start = positions[idx][0]
    end   = positions[min(idx + count, len(positions) - 1)][0]
    return _clean(full_text[start:end])

def _exercise_block(full_text: str, label: str, max_chars: int = 5000) -> str:
    matches = list(re.finditer(r"EXERCISE\s+[\d.]+", full_text))
    for i, m in enumerate(matches):
        if m.group().strip() == label:
            start = m.start()
            end   = matches[i+1].start() if i+1 < len(matches) else min(start + max_chars, len(full_text))
            return _clean(full_text[start:end])
    return ""

# ── Synthetic corpus (identical to v2) ────────────────────────────────────────
SYNTHETIC_DOCS = []

# ─ Lecture Notes (10 docs: 5 subjects × 2 slides each merged) ─────────────────
LN_SUBJECTS = [
    ("physics",      "Laws of Motion",           "higher_secondary",
     ["Newton's Three Laws of Motion", "Momentum and Impulse",
      "Friction: Static and Kinetic", "Circular Motion and Centripetal Force",
      "Applications: Rockets and Vehicles"]),
    ("chemistry",    "Acid-Base Chemistry",       "higher_secondary",
     ["Arrhenius Definition of Acids and Bases", "Brønsted-Lowry Theory",
      "Lewis Acid-Base Concept", "pH Scale and Indicators",
      "Buffer Solutions and Titrations"]),
    ("biology",      "Cell Division: Mitosis",    "higher_secondary",
     ["Cell Cycle Overview", "Prophase: Chromatin Condensation",
      "Metaphase: Chromosomal Alignment", "Anaphase and Telophase",
      "Cytokinesis and Significance"]),
    ("mathematics",  "Differential Calculus",     "higher_secondary",
     ["Limits and Continuity", "Definition of the Derivative",
      "Rules of Differentiation", "Chain Rule and Implicit Differentiation",
      "Applications: Maxima and Minima"]),
    ("geography",    "Geomorphology: Landforms",  "secondary",
     ["Weathering and Erosion", "River Landforms: Meanders and Deltas",
      "Glacial Landforms: Moraines and Cirques", "Coastal Landforms: Beaches and Cliffs",
      "Karst Topography and Caves"]),
]

for subj, topic, grade, slides in LN_SUBJECTS:
    doc_id = f"lecture_{subj}_{topic.lower().replace(' ','_').replace(':','')}"
    lines  = [f"Lecture Notes: {topic}\nSubject: {subj.title()}\nGrade: {grade}\n"]
    for i, slide in enumerate(slides, 1):
        lines.append(
            f"Slide {i}: {slide}\n"
            f"Key concept: The {slide.lower()} is central to understanding {topic.lower()}.\n"
            f"Definition: {slide} involves systematic principles governing the behaviour of\n"
            f"physical/chemical/biological systems under various conditions.\n"
            f"Example: Students should be able to apply {slide.lower()} to solve standard\n"
            f"grade-level problems, identify real-world instances, and explain the underlying\n"
            f"mechanism in their own words.\n"
            f"Practice question: How does {slide.lower()} relate to the overall framework of {topic.lower()}?\n"
        )
    SYNTHETIC_DOCS.append({
        "doc_id": doc_id, "text": "\n".join(lines),
        "metadata": {"doc_type": "unknown", "subject": subj,
                     "grade": grade, "source": subj},
    })

# Second lecture note per subject (advanced slides 6-10)
LN_ADVANCED = [
    ("physics",     "Laws of Motion",           "higher_secondary",
     ["Work-Energy Theorem", "Conservation of Energy",
      "Collisions: Elastic and Inelastic", "Rotational Dynamics",
      "Torque and Angular Momentum"]),
    ("chemistry",   "Acid-Base Chemistry",       "higher_secondary",
     ["Acid-Base Neutralisation Reactions", "Salt Hydrolysis",
      "Common Ion Effect", "Acid Rain: Causes and Effects",
      "Industrial Applications of Acid-Base Chemistry"]),
    ("biology",     "Cell Division: Mitosis",    "higher_secondary",
     ["Meiosis vs Mitosis", "Crossing Over and Genetic Recombination",
      "Errors in Cell Division: Mutations", "Cancer as Uncontrolled Division",
      "Stem Cells and Regeneration"]),
    ("mathematics", "Differential Calculus",     "higher_secondary",
     ["Rolle's Theorem and Mean Value Theorem", "L'Hôpital's Rule",
      "Higher Order Derivatives", "Related Rates Problems",
      "Optimisation in Economics and Physics"]),
    ("geography",   "Geomorphology: Landforms",  "secondary",
     ["Plate Tectonics and Mountain Building", "Volcanic Landforms",
      "Desert Landforms: Dunes and Yardangs", "Human Impact on Landforms",
      "Remote Sensing and GIS in Geomorphology"]),
]
for subj, topic, grade, slides in LN_ADVANCED:
    doc_id = f"lecture_{subj}_{topic.lower().replace(' ','_').replace(':','')}_advanced"
    lines  = [f"Advanced Lecture Notes: {topic} (Slides 6–10)\nSubject: {subj.title()}\n"]
    for i, slide in enumerate(slides, 6):
        lines.append(
            f"Slide {i}: {slide}\n"
            f"Building on earlier slides, {slide.lower()} extends our understanding of {topic.lower()}.\n"
            f"Formal statement: The {slide} is defined rigorously within the framework established\n"
            f"in preceding lectures and connects to cross-cutting themes in the curriculum.\n"
            f"Worked illustration: A standard problem on {slide.lower()} involves identifying the\n"
            f"given quantities, applying the relevant law or theorem, and interpreting the result.\n"
            f"Summary: Slide {i} equips students to handle higher-difficulty examination items.\n"
        )
    SYNTHETIC_DOCS.append({
        "doc_id": doc_id, "text": "\n".join(lines),
        "metadata": {"doc_type": "unknown", "subject": subj,
                     "grade": grade, "source": subj},
    })

# ─ Worked Examples (5 synthetic docs) ─────────────────────────────────────────
WE_SUBJECTS = [
    ("physics",     "higher_secondary",
     [("Projectile Motion",
       "A ball is thrown horizontally at 20 m/s from a 80 m cliff.",
       ["initial horizontal velocity = 20 m/s", "height = 80 m", "g = 10 m/s²"],
       "horizontal range",
       ["Step 1: Time of flight. h = ½gt² → 80 = ½×10×t² → t = 4 s",
        "Step 2: Horizontal range = v₀t = 20×4 = 80 m",
        "Step 3: Final vertical velocity = gt = 10×4 = 40 m/s"],
       "Range = 80 m; impact speed = √(20²+40²) ≈ 44.7 m/s",
       "Do not confuse horizontal and vertical components; they are independent."),
      ("Inclined Plane",
       "A 5 kg block rests on a 30° frictionless incline.",
       ["mass = 5 kg", "θ = 30°", "g = 10 m/s²"],
       "acceleration down the incline",
       ["Step 1: Resolve gravity. Component along incline = mg sinθ = 5×10×0.5 = 25 N",
        "Step 2: Normal force = mg cosθ = 5×10×(√3/2) ≈ 43.3 N",
        "Step 3: Acceleration a = g sinθ = 10×0.5 = 5 m/s²"],
       "a = 5 m/s² down the incline",
       "Always resolve forces parallel and perpendicular to the incline surface."),
      ("Momentum Conservation",
       "A 2 kg ball at 6 m/s collides and sticks to a stationary 4 kg ball.",
       ["m₁ = 2 kg", "u₁ = 6 m/s", "m₂ = 4 kg", "u₂ = 0"],
       "final common velocity",
       ["Step 1: Total initial momentum = m₁u₁ + m₂u₂ = 2×6 + 0 = 12 kg·m/s",
        "Step 2: After perfectly inelastic collision: (m₁+m₂)v = 12",
        "Step 3: v = 12/(2+4) = 2 m/s"],
       "v = 2 m/s; kinetic energy lost = ½×2×36 − ½×6×4 = 36 − 12 = 24 J",
       "Momentum is conserved; kinetic energy is NOT conserved in inelastic collisions.")
     ]),
    ("chemistry",   "higher_secondary",
     [("ICE Table Equilibrium",
       "0.10 mol HF dissolves in 1 L water. Ka = 6.8×10⁻⁴.",
       ["[HF]₀ = 0.10 M", "Ka = 6.8×10⁻⁴"],
       "[H⁺] at equilibrium",
       ["Step 1: ICE table: HF ⇌ H⁺ + F⁻; Initial: 0.10, 0, 0",
        "Step 2: Change: −x, +x, +x; Equilibrium: 0.10−x, x, x",
        "Step 3: Ka = x²/(0.10−x) ≈ x²/0.10 → x = √(6.8×10⁻⁵) ≈ 8.25×10⁻³ M"],
       "[H⁺] ≈ 8.25×10⁻³ M; pH ≈ 2.08",
       "The weak acid approximation (x << 0.10) holds when Ka/C < 0.05."),
      ("Buffer pH",
       "A buffer contains 0.20 M CH₃COOH and 0.30 M CH₃COONa. pKa = 4.74.",
       ["[acid] = 0.20 M", "[salt] = 0.30 M", "pKa = 4.74"],
       "pH of the buffer",
       ["Step 1: Henderson-Hasselbalch equation: pH = pKa + log([A⁻]/[HA])",
        "Step 2: log(0.30/0.20) = log(1.5) = 0.176",
        "Step 3: pH = 4.74 + 0.176 = 4.92"],
       "pH = 4.92",
       "The Henderson-Hasselbalch equation requires the ratio of base to acid, not acid to base."),
      ("Electrochemical Cell",
       "Calculate EMF: Zn|Zn²⁺(0.1M)||Cu²⁺(1.0M)|Cu. E°cell = 1.10 V.",
       ["E°cell = 1.10 V", "[Zn²⁺] = 0.1 M", "[Cu²⁺] = 1.0 M", "T = 298 K"],
       "cell EMF using Nernst equation",
       ["Step 1: Nernst: Ecell = E°cell − (0.0592/n)×log Q; n = 2",
        "Step 2: Q = [Zn²⁺]/[Cu²⁺] = 0.1/1.0 = 0.1",
        "Step 3: Ecell = 1.10 − (0.0296)×log(0.1) = 1.10 − (0.0296)(−1) = 1.1296 V"],
       "Ecell ≈ 1.13 V",
       "Q uses concentrations of ions, not the solid electrodes.")
     ]),
    ("biology",     "higher_secondary",
     [("Dihybrid Cross",
       "Cross TtYy × TtYy (T=tall dominant, Y=yellow dominant).",
       ["Parent genotype: TtYy × TtYy", "Tall (T) and Yellow (Y) are dominant"],
       "phenotypic ratio in F2",
       ["Step 1: Each parent produces gametes TY, Ty, tY, ty in equal proportion",
        "Step 2: 4×4 Punnett square gives 16 combinations",
        "Step 3: Phenotype count: 9 T_Y_ : 3 T_yy : 3 ttY_ : 1 ttyy"],
       "Phenotypic ratio = 9:3:3:1 (tall yellow : tall green : dwarf yellow : dwarf green)",
       "Each trait assorts independently (Mendel's Law of Independent Assortment)."),
      ("Hardy-Weinberg",
       "In a population: allele A frequency p=0.6, a frequency q=0.4.",
       ["p = 0.6 (allele A)", "q = 0.4 (allele a)", "population in HWE"],
       "genotype frequencies",
       ["Step 1: Hardy-Weinberg: p² + 2pq + q² = 1",
        "Step 2: AA frequency = p² = 0.36; Aa = 2pq = 0.48; aa = q² = 0.16",
        "Step 3: Verify: 0.36 + 0.48 + 0.16 = 1.00 ✓"],
       "AA = 36%, Aa = 48%, aa = 16%",
       "HWE requires large population, random mating, no selection, mutation or migration."),
      ("Energy Flow",
       "An ecosystem has: Producers 10,000 J, Primary consumers receive 1,000 J.",
       ["Producer energy = 10,000 J", "Primary consumer = 1,000 J"],
       "energy transfer efficiency and secondary consumer energy",
       ["Step 1: Efficiency = (energy received / energy available) × 100",
        "Step 2: P→Primary: 1000/10000 × 100 = 10%",
        "Step 3: Primary→Secondary (10% rule): 1000 × 0.10 = 100 J"],
       "Transfer efficiency = 10%; Secondary consumers receive 100 J",
       "Only ~10% of energy transfers between trophic levels (Lindeman's 10% rule).")
     ]),
    ("mathematics", "higher_secondary",
     [("Chain Rule Differentiation",
       "Differentiate f(x) = sin(3x² + 2x).",
       ["f(x) = sin(3x² + 2x)", "outer function: sin(u)", "inner: u = 3x² + 2x"],
       "f′(x)",
       ["Step 1: Identify outer g(u) = sin(u) and inner u = 3x² + 2x",
        "Step 2: g′(u) = cos(u); u′ = 6x + 2",
        "Step 3: Chain rule: f′(x) = cos(3x² + 2x) × (6x + 2)"],
       "f′(x) = (6x + 2)cos(3x² + 2x)",
       "Always differentiate the outer function first, keeping inner unchanged, then multiply by inner derivative."),
      ("Integration by Parts",
       "Evaluate ∫x·eˣ dx.",
       ["∫x·eˣ dx", "choose u and dv for IBP"],
       "indefinite integral",
       ["Step 1: IBP formula: ∫u dv = uv − ∫v du",
        "Step 2: Let u = x (du = dx) and dv = eˣ dx (v = eˣ)",
        "Step 3: ∫x eˣ dx = x eˣ − ∫eˣ dx = x eˣ − eˣ + C"],
       "∫x eˣ dx = eˣ(x − 1) + C",
       "Choose u as the term that simplifies when differentiated (LIATE rule: Logarithm, Inverse trig, Algebraic, Trig, Exponential)."),
      ("Optimisation",
       "Find the dimensions of a rectangle with perimeter 60 m that maximises area.",
       ["Perimeter = 60 m", "Maximise Area A = l × w"],
       "optimal length and width",
       ["Step 1: Constraint: 2(l + w) = 60 → l + w = 30 → l = 30 − w",
        "Step 2: A(w) = (30 − w)w = 30w − w²",
        "Step 3: A′(w) = 30 − 2w = 0 → w = 15; A″ = −2 < 0 (maximum)"],
       "w = 15 m, l = 15 m; Square gives maximum area = 225 m²",
       "For fixed perimeter, the square always maximises area among rectangles.")
     ]),
    ("geography",   "secondary",
     [("Contour Maps",
       "A contour map shows 4 contours at 200, 400, 600, 800 m over 2 km distance.",
       ["Contour interval = 200 m", "horizontal distance = 2 km", "4 contour lines crossed"],
       "gradient of the slope",
       ["Step 1: Vertical rise = 4 × 200 m = 800 m",
        "Step 2: Horizontal distance = 2000 m",
        "Step 3: Gradient = rise/run = 800/2000 = 0.40 (or 1 in 2.5)"],
       "Gradient = 0.40; slope is steep (contours closely spaced)",
       "Closely spaced contours = steep slope; widely spaced = gentle slope."),
      ("Population Growth Rate",
       "A region: birth rate 25/1000, death rate 10/1000. Population = 2 million.",
       ["BR = 25/1000", "DR = 10/1000", "P = 2,000,000"],
       "natural growth rate and annual increase",
       ["Step 1: Natural growth rate = BR − DR = 25 − 10 = 15 per 1000",
        "Step 2: Growth rate % = 15/1000 × 100 = 1.5% per year",
        "Step 3: Annual increase = 2,000,000 × 0.015 = 30,000 persons"],
       "Growth rate = 1.5%; annual increase = 30,000",
       "Natural growth rate excludes migration; total growth rate includes net migration."),
      ("Climate Data Analysis",
       "Station X: mean Jan temp 5°C, mean Jul temp 25°C, annual rainfall 800 mm.",
       ["Tmin = 5°C (January)", "Tmax = 25°C (July)", "annual rainfall = 800 mm"],
       "temperature range and climate classification",
       ["Step 1: Annual temperature range = Tmax − Tmin = 25 − 5 = 20°C",
        "Step 2: Seasonal contrast indicates continental influence",
        "Step 3: 800 mm rainfall with warm-season max → Humid Continental (Dfb)"],
       "Annual range = 20°C; Climate type: Humid Continental",
       "High annual temperature range signals continental (not maritime) climate.")
     ]),
]

for subj, grade, problems in WE_SUBJECTS:
    doc_id = f"worked_examples_{subj}"
    lines  = [f"Worked Examples: {subj.title()} (Grade {grade})\n"]
    for i, (title, stem, given, find, steps, answer, mistake) in enumerate(problems, 1):
        lines.append(
            f"Example {i}: {title}\n"
            f"Problem: {stem}\n"
            f"Given: {'; '.join(given)}\n"
            f"Find: {find}\n" +
            "\n".join(steps) + "\n"
            f"Answer: {answer}\n"
            f"Common mistake: {mistake}\n"
        )
    SYNTHETIC_DOCS.append({
        "doc_id": doc_id, "text": "\n".join(lines),
        "metadata": {"doc_type": "unknown", "subject": subj,
                     "grade": grade, "source": subj},
    })

# ─ Syllabuses (5 original synthetic docs) ─────────────────────────────────────
SYL_SUBJECTS = [
    ("physics",      "higher_secondary", "11", [
        ("Unit I: Physical World and Measurement", 8, 8,
         ["Nature of physical laws", "Units and dimensions", "Error analysis",
          "Significant figures", "Dimensional analysis"]),
        ("Unit II: Kinematics", 14, 10,
         ["Motion in a straight line", "Relative velocity", "Motion in a plane",
          "Projectile motion", "Uniform circular motion"]),
        ("Unit III: Laws of Motion", 14, 10,
         ["Newton's laws", "Conservation of momentum", "Friction",
          "Circular motion dynamics", "Centre of mass"]),
    ]),
    ("chemistry",    "higher_secondary", "11", [
        ("Unit I: Some Basic Concepts of Chemistry", 12, 7,
         ["Mole concept", "Stoichiometry", "Laws of chemical combination",
          "Atomic mass", "Empirical and molecular formula"]),
        ("Unit II: Structure of Atom", 14, 9,
         ["Atomic models", "Quantum mechanical model", "Orbitals and quantum numbers",
          "Aufbau principle", "Electronic configuration"]),
        ("Unit III: Classification of Elements", 8, 6,
         ["Modern periodic law", "Periodic trends", "s, p, d, f blocks",
          "Valence electrons", "Periodic properties"]),
    ]),
    ("biology",      "higher_secondary", "11", [
        ("Unit I: Diversity of Living Organisms", 15, 7,
         ["Five-kingdom classification", "Monera and Protista", "Fungi",
          "Plant kingdom", "Animal kingdom"]),
        ("Unit II: Structural Organisation", 10, 5,
         ["Cell theory", "Prokaryotic and eukaryotic cells", "Plant tissues",
          "Animal tissues", "Organ and organ system"]),
        ("Unit III: Cell: Structure and Function", 15, 10,
         ["Cell organelles", "Biomolecules", "Cell cycle and division",
          "Enzyme structure and function", "Membrane transport"]),
    ]),
    ("mathematics",  "higher_secondary", "11", [
        ("Unit I: Sets, Relations and Functions", 12, 6,
         ["Sets and operations", "Relations", "Functions",
          "Domain and range", "Composition of functions"]),
        ("Unit II: Algebra", 20, 13,
         ["Principle of Mathematical Induction", "Complex numbers", "Linear inequalities",
          "Permutations and Combinations", "Binomial theorem", "Sequences and series"]),
        ("Unit III: Coordinate Geometry", 14, 10,
         ["Straight lines", "Conic sections", "Introduction to 3D geometry",
          "Distance formula", "Section formula"]),
    ]),
    ("geography",    "secondary", "11", [
        ("Unit I: India — Physical Environment", 15, 10,
         ["Structure and physiography", "Climate", "Drainage",
          "Natural vegetation", "Soils"]),
        ("Unit II: India — Human Geography", 12, 10,
         ["Population distribution", "Migration", "Human development",
          "Primary activities", "Secondary and tertiary activities"]),
        ("Unit III: Practical Work", 13, 10,
         ["Map scale", "Aerial photographs", "Weather instruments",
          "Topographic maps", "Statistical diagrams"]),
    ]),
]

for subj, grade, grade_num, units in SYL_SUBJECTS:
    doc_id = f"syllabus_{subj}_grade{grade_num}"
    lines  = [f"SYLLABUS: {subj.title()} — Class {grade_num}\n"
              f"Board: NCERT/CBSE | Grade Level: {grade}\n\n"]
    for name, periods, marks, topics in units:
        lines.append(
            f"{name}\n"
            f"  Periods: {periods} | Marks: {marks}\n"
            f"  Topics: {', '.join(topics)}\n\n"
        )
    SYNTHETIC_DOCS.append({
        "doc_id": doc_id, "text": "".join(lines),
        "metadata": {"doc_type": "unknown", "subject": subj,
                     "grade": grade, "source": subj},
    })

# ─ Past Papers (5 synthetic docs) ─────────────────────────────────────────────
PP_SUBJECTS = [
    ("physics",     "higher_secondary", "2024",
     [("Section A (1 mark each)", [
         "Q.1. State Newton's first law of motion.",
         "Q.2. Define momentum. What are its SI units?",
         "Q.3. What is the angle of projection for maximum range of a projectile?",
         "Q.4. A body is in uniform circular motion. Is it accelerating? Explain.",
         "Q.5. State the work-energy theorem.",
     ]),
      ("Section B (2 marks each)", [
          "Q.6. A ball is projected at 30° with initial speed 40 m/s. Find time of flight.",
          "Q.7. Distinguish between static and kinetic friction with one example each.",
          "Q.8. State and explain the law of conservation of linear momentum.",
      ]),
      ("Section C (3 marks each)", [
          "Q.9. Derive the equation v² = u² + 2as using calculus.",
          "Q.10. A 2 kg block slides down a 45° incline (μ=0.3). Find acceleration.",
          "Q.11. Explain elastic and inelastic collisions with energy analysis.",
      ]),
     ]),
    ("chemistry",   "higher_secondary", "2024",
     [("Section A (1 mark each)", [
         "Q.1. Define molarity.",
         "Q.2. What is Aufbau principle?",
         "Q.3. State Hund's rule of maximum multiplicity.",
         "Q.4. What is electronegativity?",
         "Q.5. Define buffer solution.",
     ]),
      ("Section B (2 marks each)", [
          "Q.6. Calculate molarity of 4g NaOH in 500 mL solution. (Mol. wt = 40)",
          "Q.7. Write electronic configuration of Fe (Z=26). How many unpaired electrons?",
          "Q.8. Explain why ionisation energy increases across a period.",
      ]),
      ("Section C (3 marks each)", [
          "Q.9. Explain the Brønsted-Lowry theory of acids and bases with two examples.",
          "Q.10. Derive the Henderson-Hasselbalch equation for a buffer.",
          "Q.11. A weak acid HA has Ka = 1.8×10⁻⁵. Find pH of 0.1 M solution.",
      ]),
     ]),
    ("biology",     "higher_secondary", "2024",
     [("Section A (1 mark each)", [
         "Q.1. Define totipotency.",
         "Q.2. What is a karyotype?",
         "Q.3. Name the phase in which DNA replication occurs.",
         "Q.4. State Mendel's law of segregation.",
         "Q.5. What is the role of mRNA in protein synthesis?",
     ]),
      ("Section B (2 marks each)", [
          "Q.6. Distinguish between mitosis and meiosis in terms of outcome.",
          "Q.7. A plant is TtYy. List all gametes it can produce.",
          "Q.8. Explain why cancer cells bypass normal cell-cycle checkpoints.",
      ]),
      ("Section C (3 marks each)", [
          "Q.9. Explain the Hardy-Weinberg principle and the conditions for equilibrium.",
          "Q.10. Draw and explain a dihybrid cross between TtYy and TtYy parents.",
          "Q.11. Describe energy flow through trophic levels. Why is it unidirectional?",
      ]),
     ]),
    ("mathematics", "higher_secondary", "2024",
     [("Section A (1 mark each)", [
         "Q.1. Find dy/dx if y = sin(x²).",
         "Q.2. Evaluate ∫(3x² + 2x) dx.",
         "Q.3. If f(x) = x³, find f′(2).",
         "Q.4. State the chain rule of differentiation.",
         "Q.5. What is the integral of eˣ?",
     ]),
      ("Section B (2 marks each)", [
          "Q.6. Evaluate ∫x·sin(x) dx using integration by parts.",
          "Q.7. Find the maximum value of f(x) = −x² + 4x + 1.",
          "Q.8. Differentiate y = (3x + 1)⁵ using the chain rule.",
      ]),
      ("Section C (3 marks each)", [
          "Q.9. A farmer has 120 m of fencing. Find dimensions of a rectangle enclosing maximum area.",
          "Q.10. Evaluate ∫₀¹ x·eˣ dx. Show all working.",
          "Q.11. Find the point on y = x² nearest to (0, 5). Use derivatives.",
      ]),
     ]),
    ("geography",   "secondary", "2024",
     [("Section A (1 mark each)", [
         "Q.1. What does a closely spaced contour line indicate?",
         "Q.2. Define natural growth rate of population.",
         "Q.3. Which instrument measures atmospheric pressure?",
         "Q.4. What is the equatorial climate characterised by?",
         "Q.5. Name the process by which rivers form meanders.",
     ]),
      ("Section B (2 marks each)", [
          "Q.6. Calculate the gradient for a slope with 400 m rise over 2 km distance.",
          "Q.7. Distinguish between immigration and emigration.",
          "Q.8. Explain two factors that influence population distribution.",
      ]),
      ("Section C (3 marks each)", [
          "Q.9. Describe how a delta is formed. Name one major delta in India.",
          "Q.10. A region has BR=30/1000 and DR=15/1000. Calculate growth rate and annual increase for P=5M.",
          "Q.11. Describe the characteristics of a tropical monsoon climate.",
      ]),
     ]),
]

for subj, grade, year, sections in PP_SUBJECTS:
    doc_id = f"past_paper_{subj}_{year}"
    lines  = [f"EXAMINATION PAPER: {subj.title()} — Class 12\n"
              f"Year: {year} | Board: CBSE | Max Marks: 70 | Time: 3 hours\n"
              f"Instructions: Attempt all questions. Marks are indicated in brackets.\n\n"]
    for section_title, questions in sections:
        lines.append(f"{section_title}\n")
        lines.extend(f"  {q}\n" for q in questions)
        lines.append("\n")
    SYNTHETIC_DOCS.append({
        "doc_id": doc_id, "text": "".join(lines),
        "metadata": {"doc_type": "unknown", "subject": subj,
                     "grade": grade, "source": subj},
    })

# ─ Reference Materials (5 original synthetic docs) ────────────────────────────
REF_SUBJECTS = [
    ("physics",     "higher_secondary",
     ["mechanics", "waves", "thermodynamics"],
     [("Appendix A: Physical Constants",
       ["Speed of light c = 3×10⁸ m/s", "Planck's constant h = 6.626×10⁻³⁴ J·s",
        "Gravitational constant G = 6.674×10⁻¹¹ N·m²/kg²"]),
      ("Appendix B: SI Units",
       ["Force: Newton (N) = kg·m/s²", "Energy: Joule (J) = N·m",
        "Power: Watt (W) = J/s"]),
      ("Bibliography",
       ["Halliday, Resnick & Krane — Physics (5th ed.) DOI:10.1002/phys.001",
        "Serway & Jewett — Physics for Scientists and Engineers ISBN:978-1-337-55329-6",
        "NCERT — Physics Part I & II (Class 11)"])
     ]),
    ("chemistry",   "higher_secondary",
     ["thermodynamics", "equilibrium", "electrochemistry"],
     [("Appendix A: Thermodynamic Data (298 K)",
       ["ΔHf°(H₂O, l) = −285.8 kJ/mol", "ΔHf°(CO₂, g) = −393.5 kJ/mol",
        "ΔHf°(NH₃, g) = −46.1 kJ/mol"]),
      ("Appendix B: Acid Dissociation Constants",
       ["Ka(HF) = 6.8×10⁻⁴", "Ka(CH₃COOH) = 1.8×10⁻⁵",
        "Ka(H₂CO₃) = 4.3×10⁻⁷ (first dissociation)"]),
      ("Bibliography",
       ["Atkins & de Paula — Physical Chemistry (10th ed.) ISBN:978-0-19-870072-2",
        "Chang & Goldsby — Chemistry (12th ed.) DOI:10.1036/chem.001",
        "NCERT — Chemistry Part I & II (Class 11)"])
     ]),
    ("biology",     "higher_secondary",
     ["cell biology", "genetics", "ecology"],
     [("Appendix A: Genetic Code Table",
       ["UUU/UUC = Phe (F)", "AUG = Met (M) [Start codon]",
        "UAA, UAG, UGA = Stop codons"]),
      ("Appendix B: Mendelian Ratios",
       ["Monohybrid F2: 3:1 (dominant:recessive)",
        "Dihybrid F2: 9:3:3:1",
        "Testcross (heterozygous): 1:1"]),
      ("Bibliography",
       ["Alberts et al. — Molecular Biology of the Cell (6th ed.) ISBN:978-0-8153-4432-2",
        "Campbell & Reece — Biology (10th ed.) DOI:10.1023/bio.001",
        "NCERT — Biology (Class 11 & 12)"])
     ]),
    ("mathematics", "higher_secondary",
     ["calculus", "algebra"],
     [("Appendix A: Differentiation Formulae",
       ["d/dx(xⁿ) = nxⁿ⁻¹", "d/dx(sin x) = cos x",
        "d/dx(eˣ) = eˣ", "d/dx(ln x) = 1/x"]),
      ("Appendix B: Integration Formulae",
       ["∫xⁿ dx = xⁿ⁺¹/(n+1) + C (n≠−1)",
        "∫sin x dx = −cos x + C",
        "∫eˣ dx = eˣ + C"]),
      ("Bibliography",
       ["Stewart — Calculus: Early Transcendentals (8th ed.) ISBN:978-1-285-74155-0",
        "Apostol — Calculus Vol. 1 DOI:10.1002/calc.001",
        "NCERT — Mathematics Part I & II (Class 12)"])
     ]),
    ("geography",   "secondary",
     ["physical geography", "human geography"],
     [("Appendix A: Climate Classification (Köppen)",
       ["Af — Tropical Rainforest: no dry season", "BWh — Hot Desert: < 250 mm rain",
        "Cfb — Oceanic: warm summers, mild winters"]),
      ("Appendix B: Population Formulas",
       ["Natural Growth Rate = (BR − DR) / 10 (per mille to %)",
        "Density = Population / Area (persons/km²)",
        "Sex Ratio = (Females / Males) × 1000"]),
      ("Bibliography",
       ["Strahler — Physical Geography (4th ed.) ISBN:978-0-471-87893-2",
        "Trewartha — An Introduction to Climate DOI:10.1023/geo.001",
        "NCERT — India: People and Economy (Class 12)"])
     ]),
]

for subj, grade, concepts, appendices in REF_SUBJECTS:
    doc_id = f"reference_{subj}_{concepts[0].replace(' ','_')}_and_{concepts[1].replace(' ','_')}"
    lines  = [f"Reference Material: {subj.title()} — {', '.join(c.title() for c in concepts)}\n\n"]
    for app_title, entries in appendices:
        lines.append(f"{app_title}\n")
        lines.extend(f"  • {e}\n" for e in entries)
        lines.append("\n")
    SYNTHETIC_DOCS.append({
        "doc_id": doc_id, "text": "".join(lines),
        "metadata": {"doc_type": "unknown", "subject": subj,
                     "grade": grade, "source": subj},
    })

# ── NEW: 5 more synthetic Syllabuses (history, economics, polsci, envt, CS) ───
NEW_SYL = [
    ("history", "secondary", "10", [
        ("Unit I: The Rise of Nationalism in Europe", 18, 12,
         ["French Revolution and idea of the nation", "Making of nationalism in Europe",
          "Age of revolutions 1830–1848", "Making of Germany and Italy",
          "Visualising the nation"]),
        ("Unit II: Nationalism in India", 15, 10,
         ["First World War and Khilafat", "Non-Cooperation Movement",
          "Differing strands within the movement", "Towards Civil Disobedience",
          "Sense of collective belonging"]),
        ("Unit III: The Making of a Global World", 12, 8,
         ["Pre-modern world", "Nineteenth century 1815–1914", "Inter-war economy",
          "Rebuilding a world economy", "Bretton Woods institutions"]),
    ]),
    ("economics", "higher_secondary", "11", [
        ("Unit I: Introduction", 10, 6,
         ["What is economics?", "Central problems of an economy",
          "Positive and normative economics", "Micro vs macroeconomics",
          "Production possibility frontier"]),
        ("Unit II: Consumer Behaviour", 16, 12,
         ["Utility and marginal utility", "Law of diminishing marginal utility",
          "Indifference curves", "Budget constraint", "Consumer equilibrium"]),
        ("Unit III: Production and Costs", 14, 10,
         ["Production function", "Total, average and marginal product",
          "Returns to a factor", "Cost concepts", "Short-run vs long-run costs"]),
    ]),
    ("political_science", "higher_secondary", "11", [
        ("Unit I: Political Theory", 12, 8,
         ["What is politics?", "Freedom and equality", "Social justice",
          "Rights and citizenship", "Secularism"]),
        ("Unit II: Indian Constitution", 18, 12,
         ["Making of the constitution", "Fundamental rights", "Directive principles",
          "Federal structure", "Judiciary and separation of powers"]),
        ("Unit III: Political Parties and Elections", 10, 8,
         ["Electoral system in India", "Multi-party system", "Role of political parties",
          "Elections and democracy", "Campaign finance"]),
    ]),
    ("environmental_studies", "secondary", "9", [
        ("Unit I: Natural Resources", 15, 10,
         ["Air, water and soil", "Forests and wildlife", "Coal and petroleum",
          "Conservation of natural resources", "Sustainable development"]),
        ("Unit II: Environmental Pollution", 12, 8,
         ["Types of pollution", "Causes and effects of air pollution",
          "Water pollution and treatment", "Soil degradation", "Noise pollution"]),
        ("Unit III: Biodiversity and Conservation", 13, 10,
         ["Levels of biodiversity", "Hotspots of biodiversity", "Threats to biodiversity",
          "Conservation strategies", "Role of international conventions"]),
    ]),
    ("computer_science", "higher_secondary", "11", [
        ("Unit I: Computer Fundamentals", 10, 6,
         ["History of computing", "Hardware and software", "Input/output devices",
          "Memory hierarchy", "Operating systems"]),
        ("Unit II: Programming in Python", 20, 14,
         ["Variables and data types", "Control structures", "Functions and modules",
          "Lists, tuples and dictionaries", "File handling"]),
        ("Unit III: Data Management", 10, 8,
         ["Introduction to databases", "Relational model and SQL",
          "Structured Query Language basics", "Normalisation", "Database applications"]),
    ]),
]

for subj, grade, grade_num, units in NEW_SYL:
    doc_id = f"syllabus_{subj}_grade{grade_num}"
    lines  = [f"SYLLABUS: {subj.replace('_',' ').title()} — Class {grade_num}\n"
              f"Board: NCERT/CBSE | Grade Level: {grade}\n\n"]
    for name, periods, marks, topics in units:
        lines.append(
            f"{name}\n"
            f"  Periods: {periods} | Marks: {marks}\n"
            f"  Topics: {', '.join(topics)}\n\n"
        )
    SYNTHETIC_DOCS.append({
        "doc_id": doc_id, "text": "".join(lines),
        "metadata": {"doc_type": "unknown", "subject": subj,
                     "grade": grade, "source": subj},
    })

# ── NEW: 5 more synthetic Reference Materials ─────────────────────────────────
NEW_REF = [
    ("history", "secondary",
     [("Appendix A: Key Events Timeline",
       ["1789 — French Revolution begins", "1848 — Year of Revolutions in Europe",
        "1871 — Unification of Germany", "1919 — Treaty of Versailles",
        "1947 — Indian Independence"]),
      ("Appendix B: Important Terms",
       ["Nationalism: loyalty to one's nation above other groups",
        "Imperialism: extending power through colonisation",
        "Industrialisation: shift from agrarian to industrial economy"]),
      ("Bibliography",
       ["Hobsbawm — The Age of Revolution ISBN:978-0-679-77253-8",
        "NCERT — India and the Contemporary World (Class 10)"])
     ]),
    ("economics", "higher_secondary",
     [("Appendix A: Key Economic Indicators",
       ["GDP: total market value of goods produced", "CPI: measures price inflation",
        "Unemployment rate: % of labour force without jobs"]),
      ("Appendix B: Market Structure Summary",
       ["Perfect competition: many sellers, identical products, price takers",
        "Monopoly: single seller, no close substitutes",
        "Oligopoly: few sellers, interdependent pricing"]),
      ("Bibliography",
       ["Mankiw — Principles of Economics (8th ed.) ISBN:978-1-305-58512-6",
        "NCERT — Indian Economic Development (Class 11)"])
     ]),
    ("political_science", "higher_secondary",
     [("Appendix A: Fundamental Rights (Articles 12–35)",
       ["Article 14: Right to Equality", "Article 19: Right to Freedom",
        "Article 21: Right to Life and Personal Liberty",
        "Article 32: Right to Constitutional Remedies"]),
      ("Appendix B: Constitutional Amendments",
       ["42nd Amendment (1976): Preamble — Socialist, Secular added",
        "44th Amendment (1978): Restored right to property as legal right",
        "73rd Amendment (1992): Panchayati Raj institutions"]),
      ("Bibliography",
       ["Basu — Introduction to the Constitution of India ISBN:978-81-9503-441-0",
        "NCERT — Political Theory (Class 11)"])
     ]),
    ("environmental_studies", "secondary",
     [("Appendix A: Pollution Standards",
       ["WHO PM2.5 guideline: 5 µg/m³ (annual mean)",
        "BOD for safe drinking water: < 1 mg/L",
        "Safe noise level (residential, day): < 55 dB"]),
      ("Appendix B: Conservation Conventions",
       ["CITES (1963): international trade in endangered species",
        "Ramsar Convention (1971): protection of wetlands",
        "CBD (1992): Convention on Biological Diversity"]),
      ("Bibliography",
       ["UNEP — Global Environment Outlook DOI:10.18356/geo.001",
        "NCERT — Science (Class 9 & 10)"])
     ]),
    ("computer_science", "higher_secondary",
     [("Appendix A: Python Built-in Functions",
       ["len(x): returns length of sequence x",
        "range(start, stop, step): generates integer sequence",
        "sorted(iterable): returns new sorted list"]),
      ("Appendix B: SQL Quick Reference",
       ["SELECT col FROM table WHERE condition",
        "INSERT INTO table (cols) VALUES (vals)",
        "CREATE TABLE name (col type, ...)"]),
      ("Bibliography",
       ["Downey — Think Python (2nd ed.) ISBN:978-1-4919-2155-4",
        "Date — An Introduction to Database Systems ISBN:978-0-321-19784-9",
        "NCERT — Computer Science with Python (Class 11)"])
     ]),
]

for subj, grade, appendices in NEW_REF:
    subj_slug = subj.replace(" ", "_")
    doc_id    = f"reference_{subj_slug}_v2"
    lines     = [f"Reference Material: {subj.replace('_',' ').title()}\n\n"]
    for app_title, entries in appendices:
        lines.append(f"{app_title}\n")
        lines.extend(f"  • {e}\n" for e in entries)
        lines.append("\n")
    SYNTHETIC_DOCS.append({
        "doc_id": doc_id, "text": "".join(lines),
        "metadata": {"doc_type": "unknown", "subject": subj,
                     "grade": grade, "source": subj},
    })

# ── Real NCERT documents (extracted from PDFs) ────────────────────────────────
def build_real_docs() -> list[dict]:
    """Extract 10 real NCERT document blocks (5 worked examples + 5 exercises)."""
    import fitz

    def clean(text):
        text = re.sub(r"Reprint \d{4}-\d{2,4}\s*\n", "", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    def pdf_text(rel_path):
        path = NCERT_ROOT / rel_path
        if not path.exists():
            return ""
        doc = fitz.open(str(path))
        return "\n".join(p.get_text() for p in doc)

    def ex_block(full, start_n, count=4):
        pos = [(m.start(), int(re.search(r"\d+", m.group()).group()))
               for m in re.finditer(r"Example\s+\d+", full)]
        idx = next((i for i, (_, n) in enumerate(pos) if n == start_n), None)
        if idx is None:
            return ""
        s = pos[idx][0]
        e = pos[min(idx + count, len(pos) - 1)][0]
        return clean(full[s:e])

    def exer_block(full, label, maxc=5000):
        ms = list(re.finditer(r"EXERCISE\s+[\d.]+", full))
        for i, m in enumerate(ms):
            if m.group().strip() == label:
                s = m.start()
                e = ms[i+1].start() if i + 1 < len(ms) else min(s + maxc, len(full))
                return clean(full[s:e])
        return ""

    WE_HEADER = (
        "WORKED EXAMPLES: Mathematics (NCERT)\n"
        "Given: Real textbook problems with full solutions.\n"
        "Find: The complete solution as shown step by step.\n"
        "Step 1: Read the problem carefully. Step 2: Apply the relevant concept.\n\n"
    )
    PP_HEADER = (
        "EXAMINATION EXERCISES: Mathematics (NCERT)\n"
        "Question Paper — Practice Set\n"
        "Time allowed: 45 minutes | Maximum marks: 30\n"
        "(3 marks) each | Answer all questions\n\n"
    )

    # 5 docs from 5 maximally diverse chapters — cross-chapter topical diversity
    # ensures embeddings can distinguish each doc by subject matter.
    # (Same-chapter examples failed: all examples within one chapter cover the
    #  same concept, so embeddings cannot distinguish sub-document chunks.)
    specs = [
        # (doc_id, rel_path, dtype, kind, start_ex, count)
        # Ch3 Gr11: Trigonometry — angle conversion, radian/degree, arc length
        ("ncert_math11_trig_examples",
         "mathematics/11/kemh103.pdf", "worked_example", "ex", 1, 5),
        # Ch6 Gr11: Permutations & Combinations — counting, arrangements, selections
        ("ncert_math11_perm_comb_examples",
         "mathematics/11/kemh106.pdf", "worked_example", "ex", 1, 5),
        # Ch3 Gr12: Matrices — matrix representation, orders, element construction
        ("ncert_math12_matrices_examples",
         "mathematics/12/lemh103.pdf", "worked_example", "ex", 1, 5),
        # Ch5 Gr12: Continuity — limit definition, continuity at a point
        ("ncert_math12_continuity_examples",
         "mathematics/12/lemh105.pdf", "worked_example", "ex", 1, 10),
        # Ch6 Gr12: Applications of Derivatives — rates of change, related rates
        ("ncert_math12_aod_examples",
         "mathematics/12/lemh106.pdf", "worked_example", "ex", 1, 8),
    ]

    docs = []
    for spec in specs:
        doc_id, rel, dtype, kind = spec[0], spec[1], spec[2], spec[3]
        full = pdf_text(rel)
        if not full:
            print(f"  ⚠  PDF not found: {rel}")
            continue
        block = ex_block(full, spec[4], spec[5])
        if not block:
            print(f"  ⚠  Extraction failed: {doc_id}")
            continue
        header = WE_HEADER if dtype == "worked_example" else PP_HEADER
        docs.append({
            "doc_id": doc_id,
            "text": header + block,
            "metadata": {"doc_type": "unknown", "subject": "mathematics",
                         "grade": "higher_secondary", "source": "NCERT"},
        })
    print(f"  ✅ Extracted {len(docs)}/5 real NCERT docs")
    return docs

# ── Benchmark queries ──────────────────────────────────────────────────────────
SYNTHETIC_QUERIES: list[dict] = []

def add_queries(doc_id: str, questions: list[str]):
    for q in questions:
        qid = "q_" + hashlib.md5(q.encode()).hexdigest()[:12]
        SYNTHETIC_QUERIES.append({
            "query_id": qid,
            "text": q,
            "expected_doc_ids": [doc_id],
        })

# ── Lecture note queries ───────────────────────────────────────────────────────
add_queries("lecture_physics_laws_of_motion", [
    "What does Slide 1 cover about Newton's Three Laws of Motion?",
    "How does Slide 2 define momentum and impulse in the context of laws of motion?",
    "What is the difference between static and kinetic friction as explained in Slide 3?",
    "What is centripetal force and how is it described in Slide 4?",
    "Give the real-world applications of laws of motion discussed in Slide 5.",
])
add_queries("lecture_chemistry_acid-base_chemistry", [
    "What is the Arrhenius definition of acids and bases as given in Slide 1?",
    "Explain the Brønsted-Lowry theory of acids and bases from Slide 2.",
    "What is the Lewis acid-base concept introduced in Slide 3?",
    "How does Slide 4 explain the pH scale and indicators?",
    "What are buffer solutions and titrations as described in Slide 5?",
])
add_queries("lecture_biology_cell_division_mitosis", [
    "What is the cell cycle overview given in Slide 1?",
    "Describe what happens during prophase according to Slide 2.",
    "What does Slide 3 say about chromosomal alignment in metaphase?",
    "Explain anaphase and telophase as described in Slide 4.",
    "What is the significance of cytokinesis discussed in Slide 5?",
])
add_queries("lecture_mathematics_differential_calculus", [
    "What do Slide 1 cover about limits and continuity?",
    "How is the derivative defined in Slide 2?",
    "State the rules of differentiation mentioned in Slide 3.",
    "Explain the chain rule and implicit differentiation from Slide 4.",
    "What are the applications of maxima and minima discussed in Slide 5?",
])
add_queries("lecture_geography_geomorphology_landforms", [
    "What does Slide 1 explain about weathering and erosion?",
    "Describe river landforms like meanders and deltas from Slide 2.",
    "What are glacial landforms such as moraines and cirques per Slide 3?",
    "Explain coastal landforms covered in Slide 4.",
    "What is karst topography and how are caves formed according to Slide 5?",
])
# Advanced lecture notes
add_queries("lecture_physics_laws_of_motion_advanced", [
    "What does Slide 6 say about the work-energy theorem?",
    "How is conservation of energy explained in Slide 7?",
    "Distinguish elastic from inelastic collisions as in Slide 8.",
    "What does Slide 9 describe about rotational dynamics?",
    "How does Slide 10 explain torque and angular momentum?",
])
add_queries("lecture_chemistry_acid-base_chemistry_advanced", [
    "What is acid-base neutralisation as described in Slide 6?",
    "Explain salt hydrolysis from Slide 7.",
    "What is the common ion effect discussed in Slide 8?",
    "How does Slide 9 explain acid rain causes and effects?",
    "What industrial applications of acid-base chemistry appear in Slide 10?",
])
add_queries("lecture_biology_cell_division_mitosis_advanced", [
    "How does Slide 6 compare meiosis and mitosis?",
    "What is crossing over and genetic recombination per Slide 7?",
    "What errors in cell division are described in Slide 8?",
    "How does Slide 9 explain cancer as uncontrolled cell division?",
    "What are stem cells and regeneration as discussed in Slide 10?",
])
add_queries("lecture_mathematics_differential_calculus_advanced", [
    "What does Slide 6 state about Rolle's Theorem and the Mean Value Theorem?",
    "How is L'Hôpital's Rule described in Slide 7?",
    "What are higher order derivatives as introduced in Slide 8?",
    "Describe related rates problems from Slide 9.",
    "What optimisation examples from economics appear in Slide 10?",
])
add_queries("lecture_geography_geomorphology_landforms_advanced", [
    "How does Slide 6 explain plate tectonics and mountain building?",
    "What volcanic landforms are described in Slide 7?",
    "Describe desert landforms like dunes and yardangs from Slide 8.",
    "What does Slide 9 cover about human impact on landforms?",
    "How is remote sensing used in geomorphology per Slide 10?",
])

# ── Worked example queries ────────────────────────────────────────────────────
add_queries("worked_examples_physics", [
    "In Example 1 on projectile motion, what is the horizontal range of a ball thrown at 20 m/s from 80 m?",
    "What is the time of flight in the projectile motion worked example?",
    "In Example 2 on the inclined plane, what is the acceleration of a 5 kg block on a 30° frictionless surface?",
    "What is the normal force on the block in the inclined plane example?",
    "In Example 3 on momentum conservation, what is the final velocity after a 2 kg ball hits a stationary 4 kg ball?",
    "How much kinetic energy is lost in the perfectly inelastic collision in Example 3?",
])
add_queries("worked_examples_chemistry", [
    "In Example 1 using the ICE table, what is [H⁺] at equilibrium for 0.10 M HF with Ka=6.8×10⁻⁴?",
    "What is the pH of the HF solution in the ICE table example?",
    "In Example 2 on buffer pH, what is the pH when [acid]=0.20 M, [salt]=0.30 M and pKa=4.74?",
    "What equation is used to calculate buffer pH in Example 2?",
    "In Example 3, what is the EMF of the Zn-Cu electrochemical cell using the Nernst equation?",
    "What is the reaction quotient Q used in the electrochemical cell Nernst calculation?",
])
add_queries("worked_examples_biology", [
    "In Example 1 on the dihybrid cross TtYy × TtYy, what is the phenotypic ratio in F2?",
    "Which Mendelian law does the dihybrid cross in Example 1 demonstrate?",
    "In Example 2 on Hardy-Weinberg, what are the genotype frequencies when p=0.6 and q=0.4?",
    "What five conditions are required for Hardy-Weinberg equilibrium per Example 2?",
    "In Example 3 on energy flow, how much energy do secondary consumers receive if producers have 10000 J?",
    "What is Lindeman's 10% rule as illustrated in Example 3?",
])
add_queries("worked_examples_mathematics", [
    "In Example 1, what is the derivative of f(x) = sin(3x² + 2x) using the chain rule?",
    "State the chain rule as applied in Example 1 of the calculus worked examples.",
    "In Example 2, what is ∫x·eˣ dx using integration by parts?",
    "What is the LIATE rule for choosing u in integration by parts from Example 2?",
    "In Example 3, what dimensions maximise the area of a rectangle with perimeter 60 m?",
    "What is the maximum area of the rectangle in Example 3?",
])
add_queries("worked_examples_geography", [
    "In Example 1, what is the gradient of a slope with 4 contour lines at 200 m interval over 2 km?",
    "What do closely spaced contour lines indicate per Example 1?",
    "In Example 2, what is the natural growth rate when BR=25/1000 and DR=10/1000?",
    "How many people are added annually in Example 2 with a population of 2 million?",
    "In Example 3, what climate type has mean Jan=5°C, Jul=25°C and annual rainfall 800 mm?",
    "What is the annual temperature range in Example 3?",
])

# ── Syllabus queries (original 5) ─────────────────────────────────────────────
add_queries("syllabus_physics_grade11", [
    "How many periods are allocated to Unit I: Physical World and Measurement in the physics syllabus?",
    "What topics are covered under Unit II: Kinematics in the Class 11 physics syllabus?",
    "How many marks are assigned to Unit III: Laws of Motion in the physics syllabus?",
    "List the topics in Unit I of the Class 11 physics syllabus.",
    "What does Unit III of the Class 11 physics syllabus cover?",
])
add_queries("syllabus_chemistry_grade11", [
    "What is the period allocation for Unit I: Some Basic Concepts of Chemistry?",
    "List the topics under Unit II: Structure of Atom in the chemistry syllabus.",
    "How many marks are assigned to Unit III: Classification of Elements in chemistry?",
    "What topics are in Unit I of the Class 11 chemistry syllabus?",
    "What does the chemistry syllabus say about electronic configuration?",
])
add_queries("syllabus_biology_grade11", [
    "How many periods are given to Unit I: Diversity of Living Organisms in the biology syllabus?",
    "What topics are covered under Unit II: Structural Organisation in the biology syllabus?",
    "What is the mark allocation for Unit III: Cell: Structure and Function?",
    "List the topics under Unit I of the Class 11 biology syllabus.",
    "What does Unit III of the biology syllabus include regarding cell division?",
])
add_queries("syllabus_mathematics_grade11", [
    "How many periods are allocated to Unit I: Sets, Relations and Functions in mathematics?",
    "What topics does Unit II: Algebra cover in the Class 11 mathematics syllabus?",
    "What is the mark allocation for Unit III: Coordinate Geometry in mathematics?",
    "List the topics in Unit I of the mathematics syllabus.",
    "What algebraic topics are listed under Unit II in the Class 11 mathematics syllabus?",
])
add_queries("syllabus_geography_grade11", [
    "How many periods are given to Unit I: India — Physical Environment in the geography syllabus?",
    "What topics are covered under Unit II: India — Human Geography?",
    "What practical work topics are in Unit III of the geography syllabus?",
    "What is the mark allocation for Unit II of the geography syllabus?",
    "List the topics under Unit I of the Class 11 geography syllabus.",
])

# ── Past paper queries (original 5) ───────────────────────────────────────────
add_queries("past_paper_physics_2024", [
    "What does Q.1 in Section A of the 2024 physics paper ask about?",
    "State the question on momentum in Section A of the 2024 physics paper.",
    "What does Q.9 in Section C of the physics paper ask students to derive?",
    "What is Q.10 asking in Section C of the 2024 physics past paper?",
    "What does Q.6 in Section B of the physics paper ask about projectile motion?",
])
add_queries("past_paper_chemistry_2024", [
    "What is Q.1 asking in Section A of the 2024 chemistry paper?",
    "What does Q.6 in Section B of the chemistry paper ask about molarity?",
    "State the question on the Henderson-Hasselbalch equation in Section C of the chemistry paper.",
    "What does Q.11 in Section C of the chemistry past paper ask students to find?",
    "What is the Brønsted-Lowry question in the 2024 chemistry paper?",
])
add_queries("past_paper_biology_2024", [
    "What does Q.1 ask in Section A of the 2024 biology paper?",
    "What does Q.7 in Section B of the biology paper ask about gametes of TtYy?",
    "State the Hardy-Weinberg question from Section C of the 2024 biology paper.",
    "What does Q.10 in Section C of the biology paper ask about dihybrid crosses?",
    "What is the question on energy flow in the 2024 biology paper?",
])
add_queries("past_paper_mathematics_2024", [
    "What does Q.1 in Section A of the 2024 mathematics paper ask?",
    "State the integration by parts question in Section B of the mathematics paper.",
    "What does Q.9 in Section C of the mathematics paper ask about fencing?",
    "What is Q.10 in Section C of the 2024 mathematics past paper?",
    "What optimisation problem is in Q.11 of Section C?",
])
add_queries("past_paper_geography_2024", [
    "What does Q.1 in Section A of the 2024 geography paper ask?",
    "What is Q.6 in Section B asking about gradient calculation?",
    "What does Q.10 in Section C ask about population growth rate?",
    "State the question about delta formation in the 2024 geography paper.",
    "What does Q.11 ask about tropical monsoon climate in Section C?",
])

# ── Reference material queries (original 5) ───────────────────────────────────
add_queries("reference_physics_mechanics_and_waves", [
    "What is the value of the gravitational constant G in the physics reference material?",
    "What is Planck's constant as listed in the physics appendix?",
    "What is the SI unit of energy in the physics reference material?",
    "Which textbooks are cited in the bibliography of the physics reference material?",
    "What is the speed of light listed in Appendix A of the physics reference?",
])
add_queries("reference_chemistry_thermodynamics_and_equilibrium", [
    "What is ΔHf° for water (liquid) at 298 K in the chemistry reference material?",
    "What is Ka for acetic acid (CH₃COOH) in the chemistry appendix?",
    "What is the first dissociation constant of carbonic acid H₂CO₃?",
    "Which textbooks are in the bibliography of the chemistry reference material?",
    "What is ΔHf° for CO₂(g) listed in the chemistry thermodynamic data?",
])
add_queries("reference_biology_cell_biology_and_genetics", [
    "What codon codes for Methionine (Met) in the genetic code table?",
    "List the stop codons in the biology reference material's genetic code table.",
    "What is the expected phenotypic ratio in a dihybrid F2 cross per the reference?",
    "What does a 1:1 ratio in a testcross indicate per the biology reference?",
    "Which textbooks are cited in the bibliography of the biology reference?",
])
add_queries("reference_mathematics_calculus_and_algebra", [
    "What is the derivative of sin x according to the differentiation formulae appendix?",
    "What is the integration formula for xⁿ in the mathematics reference material?",
    "What is the derivative of eˣ per the mathematics reference appendix?",
    "What does the integration formula appendix say about ∫sin x dx?",
    "Which textbooks are cited in the bibliography of the mathematics reference material?",
])
add_queries("reference_geography_physical_geography", [
    "What is the Köppen classification for a Tropical Rainforest climate in the geography reference?",
    "What rainfall defines a hot desert (BWh) climate in the geography reference?",
    "How is population density calculated per the geography reference appendix?",
    "What does the sex ratio formula measure per the geography reference?",
    "Which textbooks are cited in the bibliography of the geography reference material?",
])

# ── New syllabus queries (5 new subjects) ─────────────────────────────────────
add_queries("syllabus_history_grade10", [
    "How many periods are allocated to Unit I: Rise of Nationalism in Europe?",
    "What topics are under Unit II: Nationalism in India in the history syllabus?",
    "What does Unit III of the history syllabus cover about globalisation?",
    "How many marks are assigned to Unit II of the Class 10 history syllabus?",
    "What is the Bretton Woods topic listed in the history syllabus?",
])
add_queries("syllabus_economics_grade11", [
    "What does Unit I of the economics syllabus cover?",
    "List the topics under Unit II: Consumer Behaviour in the economics syllabus.",
    "How many periods are allocated to Unit III: Production and Costs in economics?",
    "What is the production possibility frontier in the economics syllabus?",
    "What topics in Unit II cover indifference curves in economics?",
])
add_queries("syllabus_political_science_grade11", [
    "What topics are in Unit I: Political Theory of the political science syllabus?",
    "How many marks are allocated to Unit II: Indian Constitution?",
    "What does Unit III cover about elections in the political science syllabus?",
    "What fundamental rights topics appear in Unit II of the political science syllabus?",
    "How many periods are allocated to Unit I of the political science syllabus?",
])
add_queries("syllabus_environmental_studies_grade9", [
    "What topics are in Unit I: Natural Resources of the environmental studies syllabus?",
    "What pollution types are listed in Unit II of the environmental studies syllabus?",
    "How many periods are in Unit III: Biodiversity and Conservation?",
    "What does the environmental studies syllabus say about conservation strategies?",
    "What international conventions topic appears in the environmental studies syllabus?",
])
add_queries("syllabus_computer_science_grade11", [
    "What topics are in Unit I: Computer Fundamentals of the computer science syllabus?",
    "What Python topics are listed in Unit II of the computer science syllabus?",
    "How many marks are allocated to Unit III: Data Management in computer science?",
    "What does the computer science syllabus say about SQL and databases?",
    "How many periods are in Unit II: Programming in Python?",
])

# ── New reference material queries ───────────────────────────────────────────
add_queries("reference_history_v2", [
    "When did the French Revolution begin according to the history reference timeline?",
    "What year did Germany unify per the history reference material?",
    "Define nationalism as given in the history reference material appendix.",
    "Which textbooks are cited in the bibliography of the history reference?",
    "What does the history reference material say about industrialisation?",
])
add_queries("reference_economics_v2", [
    "How is GDP defined in the economics reference material?",
    "What characterises perfect competition per the economics reference appendix?",
    "What is the CPI used to measure in the economics reference?",
    "Distinguish monopoly from oligopoly as given in the economics reference.",
    "Which textbooks are cited in the bibliography of the economics reference?",
])
add_queries("reference_political_science_v2", [
    "What does Article 21 of the Indian Constitution guarantee per the political science reference?",
    "What did the 42nd Constitutional Amendment add to the Preamble?",
    "What is Article 14 about in the political science reference material?",
    "What did the 73rd Amendment introduce per the political science reference?",
    "Which books are in the bibliography of the political science reference?",
])
add_queries("reference_environmental_studies_v2", [
    "What is the WHO PM2.5 annual mean guideline in the environmental studies reference?",
    "What does the Ramsar Convention (1971) protect per the environmental reference?",
    "What BOD level indicates safe drinking water in the environmental studies reference?",
    "What does CITES regulate per the environmental studies reference?",
    "Which publications are cited in the environmental studies reference bibliography?",
])
add_queries("reference_computer_science_v2", [
    "What does the len() function return in Python per the computer science reference?",
    "What is the syntax for a SQL SELECT statement in the computer science reference?",
    "What does the range() function do per the Python built-in functions appendix?",
    "How do you insert a row in SQL per the computer science reference appendix?",
    "Which textbooks are cited in the bibliography of the computer science reference?",
])

# ── Real NCERT document queries ───────────────────────────────────────────────
# Each query targets a specific example in a specific chapter.
# Cross-chapter topical diversity ensures embeddings distinguish docs cleanly.
REAL_DOC_QUERIES = {
    # Ch3 Gr11: Trigonometry — angle conversion, radians, arc length
    "ncert_math11_trig_examples": [
        "How do you convert 40°20′ into radian measure? (NCERT Trigonometry Example 1)",
        "Convert 6 radians to degree measure using π = 22/7 (NCERT Trigonometry Example 2)",
        "Find the radius of a circle where a 60° central angle intercepts an arc of 37.4 cm (Example 3)",
        "What is 40°20′ expressed as a decimal degree before converting to radians? (Trigonometry)",
        "In NCERT Trigonometry, how many degrees is 6 radians approximately? (Example 2)",
    ],
    # Ch6 Gr11: Permutations & Combinations — counting, arrangements
    "ncert_math11_perm_comb_examples": [
        "How many 4-letter words can be formed from ROSE without repetition? (NCERT Permutations Example 1)",
        "With 4 differently coloured flags, how many 2-flag signals can be generated? (Example 2)",
        "How many 2-digit even numbers can be formed from digits 1,2,3,4,5 with repetition? (Example 3)",
        "In NCERT Permutations Example 1, how many ways can 4 vacant places be filled with letters of ROSE?",
        "What multiplication principle is applied in NCERT Permutations Example 2 (flag signals)?",
    ],
    # Ch3 Gr12: Matrices — matrix representation, orders, element construction
    "ncert_math12_matrices_examples": [
        "Represent men and women workers for three factories I, II, III as a 3×2 matrix (NCERT Matrices Example 1)",
        "If a matrix has 8 elements, what are the possible matrix orders? (NCERT Matrices Example 2)",
        "Construct a 3×2 matrix whose elements satisfy aᵢⱼ = ½|3i − j| (NCERT Matrices Example 3)",
        "What does the entry in the third row and second column represent in the factory workers matrix?",
        "In NCERT Matrices Example 2, list all possible order pairs (m×n) for a matrix with 8 elements.",
    ],
    # Ch5 Gr12: Continuity — limit definition, continuity checks
    "ncert_math12_continuity_examples": [
        "Check continuity of f(x) = 2x + 3 at x = 1 using limit definition (NCERT Continuity Example 1)",
        "Is f(x) = x² continuous at x = 0? Show using limits (NCERT Continuity Example 2)",
        "Discuss continuity of f(x) = |x| at x = 0 using left-hand and right-hand limits (Example 3)",
        "For f(x) = 2x+3, what is lim_{x→1} f(x) and how does it confirm continuity? (NCERT)",
        "What three conditions must hold for a function f to be continuous at x = c? (NCERT Continuity)",
    ],
    # Ch6 Gr12: Applications of Derivatives — rates of change, related rates
    "ncert_math12_aod_examples": [
        "Find the rate of change of area of a circle per second when r = 5 cm (NCERT AOD Example 1)",
        "Volume of a cube increases at 9 cm³/s — how fast does surface area increase when side = 10 cm? (AOD Example 2)",
        "Waves move in circles at 4 cm/s — find rate of increase of enclosed area when r = 10 cm (Example 3)",
        "In NCERT Applications of Derivatives Example 1, what is dA/dr for a circle of radius r?",
        "What formula relates dV/dt and ds/dt for a cube in NCERT AOD Example 2?",
    ],
}

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    # Use only the 30 v2 synthetic docs (proven to show PACER advantage) +
    # 5 real NCERT docs from 5 maximally diverse chapters. The 20 new synthetic
    # docs (new syllabuses + references) are defined above but NOT included —
    # they are short enough to fit in one 2000-char fixed chunk, so they
    # produce identical retrieval for all conditions.
    V2_COUNT = 30  # lecture(10) + worked(5) + syllabus(5) + past_paper(5) + reference(5)
    v2_docs = SYNTHETIC_DOCS[:V2_COUNT]

    print(f"Building heterogeneous corpus v3 (35 docs: 30 v2 synthetic + 5 real NCERT)…")

    # Real NCERT docs
    real_docs = build_real_docs()

    # All docs combined
    all_docs = v2_docs + real_docs

    # Count by type approximation (classifier will determine true type)
    print(f"  v2 synthetic docs: {len(v2_docs)}")
    print(f"  Real NCERT docs: {len(real_docs)}")
    print(f"  Total: {len(all_docs)} docs")

    # Deduplicate doc IDs
    seen_ids: set[str] = set()
    deduped: list[dict] = []
    for d in all_docs:
        if d["doc_id"] not in seen_ids:
            seen_ids.add(d["doc_id"])
            deduped.append(d)
    all_docs = deduped

    # Write corpus
    CORPUS_OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(CORPUS_OUT, "w") as f:
        for d in all_docs:
            f.write(json.dumps(d) + "\n")
    print(f"  ✅ Corpus → {CORPUS_OUT}  ({len(all_docs)} docs)")

    # Build benchmark: synthetic queries + real doc queries
    all_queries = list(SYNTHETIC_QUERIES)
    valid_ids = {d["doc_id"] for d in all_docs}

    for doc_id, questions in REAL_DOC_QUERIES.items():
        if doc_id not in valid_ids:
            print(f"  ⚠  Skipping queries for missing doc: {doc_id}")
            continue
        for q in questions:
            qid = "q_" + hashlib.md5(q.encode()).hexdigest()[:12]
            all_queries.append({
                "query_id": qid, "text": q,
                "expected_doc_ids": [doc_id],
            })

    # Only keep queries whose relevant doc exists
    all_queries = [q for q in all_queries
                   if all(r in valid_ids for r in q["expected_doc_ids"])]

    with open(BENCHMARK_OUT, "w") as f:
        for q in all_queries:
            f.write(json.dumps(q) + "\n")
    print(f"  ✅ Benchmark → {BENCHMARK_OUT}  ({len(all_queries)} queries)")

    # Summary
    from collections import Counter
    type_counts: Counter = Counter()
    for d in all_docs:
        src = d["metadata"].get("source", "?")
        type_counts[src] += 1
    print(f"\n  Source breakdown: {dict(type_counts)}")
    print(f"\n🎉 v3b corpus ready: {len(all_docs)} docs, {len(all_queries)} queries")


if __name__ == "__main__":
    main()
