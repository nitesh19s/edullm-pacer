"""
gen_hetero_corpus.py — Heterogeneous Educational Corpus Generator
==================================================================
Generates a 50-document heterogeneous corpus spanning 5 educational
document types (10 docs each) with concept-targeted queries that
expose PACER's adaptive chunking advantage.

Design principles
-----------------
1. Documents are 4,000–6,500 chars — long enough that chunking strategy
   changes which chunks are created.
2. Each document type uses structural markers the educational chunker
   recognises (Example N:, Q.N, Definition:, Solution:, etc.)
3. Queries are multi-aspect and concept-specific:
      ❌ "What is the agenda of the lecture?" — any strategy matches
      ✅ "In Example 2, what is the step-by-step procedure and final
          answer for the kinematic problem?" — requires problem+solution
          to be in a single chunk to rank #1
4. 50 docs × 6 queries = 300 queries in the benchmark.
5. All metadata: doc_type=unknown → RuleBasedClassifier runs from text.

Routing expectations (PACER full)
----------------------------------
lecture_notes     → RECURSIVE   (slide/section hierarchy preserved)
worked_example    → EDUCATIONAL (problem+solution kept as one unit)
syllabus          → FIXED       (tabular/uniform — fixed beats edu)
past_paper        → EDUCATIONAL (Q+marks kept as one unit)
reference_material→ SEMANTIC    (concept clusters grouped together)

Usage:
    backend/.venv/bin/python scripts/gen_hetero_corpus.py
"""
from __future__ import annotations

import json
import random
import uuid
from pathlib import Path

ROOT = Path(__file__).parents[1]
OUT_CORPUS    = ROOT / "data" / "processed" / "hetero_corpus.jsonl"
OUT_BENCHMARK = ROOT / "data" / "processed" / "hetero_benchmark.jsonl"

random.seed(42)

# ─── 1. LECTURE NOTES (→ RECURSIVE) ─────────────────────────────────────────
# Structural markers: "Slide N:", "Key takeaway:", clear H2-like headers
# Queries: target named slides / principles within a specific slide

LECTURE_TOPICS = {
    "physics": [
        {
            "title": "Laws of Motion",
            "slides": [
                ("Newton's First Law",
                 "An object at rest remains at rest and an object in motion continues in "
                 "uniform motion in a straight line unless acted upon by an unbalanced external force. "
                 "This is also called the Law of Inertia. "
                 "Practical applications: seat belts in cars, tablecloth trick, coin on cardboard. "
                 "Inertia is directly proportional to mass — heavier objects resist change more strongly."),
                ("Newton's Second Law",
                 "The net force acting on a body equals the product of its mass and acceleration: "
                 "F = ma, where F is in Newtons, m is in kilograms, and a is in m/s². "
                 "If multiple forces act simultaneously, compute the vector sum first. "
                 "Key takeaway: doubling mass for the same force halves acceleration. "
                 "Unit derivation: 1 Newton = 1 kg·m/s² — always show unit consistency in calculations."),
                ("Newton's Third Law",
                 "For every action there is an equal and opposite reaction. "
                 "The action and reaction forces act on DIFFERENT bodies — they do not cancel. "
                 "Examples: rocket propulsion (hot gas expelled backward, rocket moves forward), "
                 "swimmer pushing pool wall backward, wall pushes swimmer forward. "
                 "Key takeaway: identifying action-reaction pairs is the first step in free-body diagrams."),
                ("Friction Forces",
                 "Friction opposes relative motion between surfaces in contact. "
                 "Static friction (f_s) acts when the object is stationary: f_s ≤ μ_s × N. "
                 "Kinetic friction (f_k) acts during sliding: f_k = μ_k × N. "
                 "Always μ_k < μ_s — less force is needed to keep sliding than to start sliding. "
                 "Friction depends on normal force N and coefficient μ, NOT on contact area."),
                ("Circular Motion",
                 "For uniform circular motion, speed is constant but velocity direction changes continuously. "
                 "Centripetal acceleration a_c = v²/r, directed toward the centre of the circle. "
                 "Centripetal force F_c = mv²/r — this is NOT a new force; it is provided by "
                 "friction, tension, gravity, or normal force depending on the scenario. "
                 "Key takeaway: centrifugal force is a pseudo-force in a non-inertial rotating frame."),
                ("Summary and Practice",
                 "This lecture covered the three laws of motion and friction. "
                 "Exam focus: free-body diagrams, Newton's second law problems with multiple forces, "
                 "friction calculations using coefficients. "
                 "Practice problem: A 5 kg block on a surface with μ_k = 0.3 is pulled by 20 N. "
                 "Find acceleration. [Answer: a = (20 − 0.3×5×10)/5 = 1.0 m/s²]"),
            ],
            "queries": [
                ("In Slide 2 on Newton's Second Law, what is the formula for net force "
                 "and what happens to acceleration when mass is doubled?",
                 "slide_2_newtons_second_law"),
                ("According to the lecture on Laws of Motion, what are the practical applications "
                 "of Newton's First Law and how does inertia relate to mass?",
                 "slide_1_first_law"),
                ("In Slide 3 of the Laws of Motion lecture, why do action and reaction forces "
                 "not cancel each other, and what is the rocket example?",
                 "slide_3_third_law"),
                ("What is the relationship between static and kinetic friction coefficients "
                 "as explained in the friction slide, and what formula gives kinetic friction force?",
                 "slide_4_friction"),
                ("According to the circular motion slide, what provides centripetal force "
                 "and what is the formula for centripetal acceleration?",
                 "slide_5_circular_motion"),
                ("In the summary slide of the Laws of Motion lecture, what answer is given "
                 "for the practice problem involving a 5 kg block?",
                 "slide_6_summary_practice"),
            ],
        },
        {
            "title": "Electrostatics",
            "slides": [
                ("Coulomb's Law",
                 "The electrostatic force between two point charges q₁ and q₂ separated by "
                 "distance r is: F = k·q₁·q₂/r², where k = 9×10⁹ N·m²/C². "
                 "The force is attractive for opposite charges and repulsive for like charges. "
                 "Key takeaway: force varies as inverse square of distance — doubling distance "
                 "reduces force to one-fourth. Superposition principle applies for multiple charges."),
                ("Electric Field",
                 "The electric field E at a point is the force per unit positive test charge: "
                 "E = F/q₀ = kQ/r², directed radially outward from positive charges. "
                 "Field lines never cross; their density indicates field strength. "
                 "Inside a conductor in electrostatic equilibrium, E = 0. "
                 "Key takeaway: field lines start on positive charges and end on negative charges."),
                ("Electric Potential",
                 "Electric potential V at a point is the work done per unit positive charge "
                 "in bringing a test charge from infinity: V = kQ/r (measured in Volts). "
                 "Potential difference ΔV = V_A − V_B; work done W = q·ΔV. "
                 "Equipotential surfaces are perpendicular to electric field lines. "
                 "Key takeaway: no work is done moving a charge along an equipotential surface."),
                ("Capacitors",
                 "A capacitor stores charge: Q = C·V, where C is capacitance in Farads. "
                 "For a parallel-plate capacitor: C = ε₀·A/d (vacuum) or C = κ·ε₀·A/d (dielectric). "
                 "Energy stored: U = ½CV² = Q²/(2C). "
                 "Dielectric increases capacitance by factor κ (dielectric constant). "
                 "Key takeaway: inserting a dielectric always increases C; connecting battery "
                 "keeps V constant, disconnecting keeps Q constant."),
                ("Gauss's Law",
                 "The total electric flux through any closed surface equals the enclosed charge "
                 "divided by ε₀: Φ = Q_enc/ε₀. "
                 "Gaussian surfaces must be chosen for symmetry: sphere for point charge, "
                 "cylinder for infinite line charge, flat sheet for infinite plane. "
                 "Key takeaway: Gauss's law is most useful when the field is uniform over the "
                 "entire Gaussian surface, making the flux integral trivial."),
                ("Summary",
                 "Electrostatics summary: Coulomb's law, electric field, potential, capacitors, Gauss's law. "
                 "Important values: k = 9×10⁹, ε₀ = 8.85×10⁻¹² C²/(N·m²). "
                 "Exam focus: numerical problems using F=kq₁q₂/r², energy stored in capacitors, "
                 "Gauss's law for spherical charge distributions."),
            ],
            "queries": [
                ("In Slide 1 on Coulomb's Law, what is the formula for electrostatic force "
                 "and how does the force change when the distance is doubled?",
                 "slide_1_coulombs_law"),
                ("According to the electric field slide, what is the direction of field lines "
                 "relative to positive charges and what is the formula for E?",
                 "slide_2_electric_field"),
                ("In the capacitors slide, what is the formula for capacitance of a parallel-plate "
                 "capacitor with a dielectric and how is energy stored calculated?",
                 "slide_4_capacitors"),
                ("What does Gauss's Law state and which Gaussian surfaces are recommended "
                 "for different charge distributions according to the lecture?",
                 "slide_5_gauss_law"),
                ("In Slide 3 on Electric Potential, what is the relationship between "
                 "equipotential surfaces and electric field lines?",
                 "slide_3_electric_potential"),
                ("What are the key formulas and important values listed in the Electrostatics "
                 "summary slide?",
                 "slide_6_summary"),
            ],
        },
    ],
    "chemistry": [
        {
            "title": "Acid-Base Chemistry",
            "slides": [
                ("Arrhenius Theory",
                 "Arrhenius definition (1884): An acid produces H⁺ ions in aqueous solution; "
                 "a base produces OH⁻ ions in aqueous solution. "
                 "Examples: HCl → H⁺ + Cl⁻ (acid); NaOH → Na⁺ + OH⁻ (base). "
                 "Limitation: applies only to aqueous solutions; cannot explain NH₃ as a base. "
                 "Key takeaway: Arrhenius theory is the simplest but most restrictive acid-base model."),
                ("Brønsted-Lowry Theory",
                 "Brønsted-Lowry definition (1923): An acid is a proton (H⁺) donor; "
                 "a base is a proton acceptor. "
                 "Conjugate pairs: HA ⇌ H⁺ + A⁻; HA and A⁻ are a conjugate acid-base pair. "
                 "NH₃ acts as a base by accepting H⁺ from water: NH₃ + H₂O ⇌ NH₄⁺ + OH⁻. "
                 "Key takeaway: every acid has a conjugate base; stronger the acid, weaker its conjugate base."),
                ("pH Scale",
                 "pH = −log[H⁺]; pOH = −log[OH⁻]; at 25°C: pH + pOH = 14. "
                 "Pure water at 25°C: [H⁺] = [OH⁻] = 10⁻⁷ M, so pH = 7. "
                 "Acidic solution: pH < 7; basic solution: pH > 7. "
                 "A one-unit decrease in pH represents a 10-fold increase in [H⁺]. "
                 "Key takeaway: pH scale is logarithmic — small pH changes mean large concentration changes."),
                ("Buffer Solutions",
                 "A buffer resists pH change on addition of small amounts of acid or base. "
                 "Composition: weak acid + its conjugate base (e.g., CH₃COOH + CH₃COO⁻). "
                 "Henderson-Hasselbalch equation: pH = pKa + log([A⁻]/[HA]). "
                 "Buffer capacity is maximum when [A⁻] = [HA], i.e., pH = pKa. "
                 "Key takeaway: blood is buffered at pH 7.4 using HCO₃⁻/H₂CO₃ system."),
                ("Acid-Base Titration",
                 "Titration measures unknown concentration of an acid or base. "
                 "Equivalence point: moles of acid = moles of base (for monoprotic). "
                 "Strong acid + strong base: equivalence point at pH 7. "
                 "Weak acid + strong base: equivalence point at pH > 7 (conjugate base hydrolyses). "
                 "Key takeaway: choose indicator whose pKa ≈ pH at equivalence point; "
                 "phenolphthalein works for weak acid/strong base titrations."),
                ("Summary",
                 "Acid-base chemistry covers Arrhenius, Brønsted-Lowry, Lewis theories, pH, buffers, titration. "
                 "Key formulas: pH = −log[H⁺]; Henderson-Hasselbalch: pH = pKa + log([A⁻]/[HA]). "
                 "Exam focus: calculate pH of weak acid solutions, buffer pH, equivalence point identification."),
            ],
            "queries": [
                ("In Slide 2 on Brønsted-Lowry Theory, what is the definition of a conjugate "
                 "acid-base pair and what is the example with ammonia?",
                 "slide_2_bronsted_lowry"),
                ("According to the buffer solutions slide, what is the Henderson-Hasselbalch "
                 "equation and when is buffer capacity at its maximum?",
                 "slide_4_buffer_solutions"),
                ("In the pH Scale slide, what is the pH of pure water at 25°C and what does "
                 "a one-unit decrease in pH represent in terms of H⁺ concentration?",
                 "slide_3_ph_scale"),
                ("In Slide 5 on Acid-Base Titration, what is the equivalence point pH "
                 "for weak acid with strong base and which indicator should be chosen?",
                 "slide_5_titration"),
                ("What is the key limitation of Arrhenius Theory according to Slide 1 "
                 "of the Acid-Base Chemistry lecture?",
                 "slide_1_arrhenius"),
                ("In the summary slide of Acid-Base Chemistry, what are the key formulas "
                 "and what exam topics are listed?",
                 "slide_6_summary"),
            ],
        },
        {
            "title": "Electrochemistry",
            "slides": [
                ("Oxidation and Reduction",
                 "Oxidation: loss of electrons; mnemonic OIL (Oxidation Is Loss). "
                 "Reduction: gain of electrons; mnemonic RIG (Reduction Is Gain). "
                 "In the reaction Zn + Cu²⁺ → Zn²⁺ + Cu: Zn is oxidised (loses 2e⁻), "
                 "Cu²⁺ is reduced (gains 2e⁻). Zn is the reducing agent; Cu²⁺ is the oxidising agent. "
                 "Key takeaway: OILRIG — use this to identify oxidation/reduction in any redox reaction."),
                ("Galvanic Cells",
                 "A galvanic (voltaic) cell converts chemical energy to electrical energy. "
                 "Components: two half-cells connected by a salt bridge (prevents charge buildup). "
                 "Anode (−): oxidation occurs; Cathode (+): reduction occurs. "
                 "Cell notation: Zn|Zn²⁺||Cu²⁺|Cu; E°_cell = E°_cathode − E°_anode. "
                 "For Zn-Cu cell: E° = 0.34 − (−0.76) = 1.10 V. "
                 "Key takeaway: electrons flow from anode to cathode through the external circuit."),
                ("Nernst Equation",
                 "The cell potential at non-standard conditions: E = E° − (RT/nF)·ln Q. "
                 "At 25°C: E = E° − (0.0592/n)·log Q, where Q is the reaction quotient. "
                 "At equilibrium: E = 0 and Q = K_eq, so E° = (0.0592/n)·log K_eq. "
                 "Key takeaway: as the reaction proceeds Q increases, cell potential decreases."),
                ("Faraday's Laws",
                 "First law: mass of substance deposited is proportional to charge passed: m ∝ Q = It. "
                 "Second law: for the same charge, masses deposited are proportional to molar mass/valence. "
                 "Formula: m = (M × I × t)/(n × F), where F = 96,485 C/mol. "
                 "Example: depositing 1 mol Cu²⁺ requires 2F = 2 × 96,485 = 192,970 C. "
                 "Key takeaway: Faraday's laws connect electrical measurements to chemical amounts."),
                ("Electrolytic Cells",
                 "An electrolytic cell uses electrical energy to drive non-spontaneous reactions. "
                 "Applications: electroplating (deposit thin metal layer), electrolysis of water "
                 "(2H₂O → 2H₂ + O₂), aluminium refining (Hall-Héroult process). "
                 "In electrolytic cell: anode is positive (connected to + terminal); cathode is negative. "
                 "Key takeaway: electrolysis reverses the galvanic cell — you PUT energy in."),
                ("Summary",
                 "Electrochemistry covers redox reactions, galvanic cells, Nernst equation, "
                 "Faraday's laws, electrolytic cells. "
                 "Key constants: F = 96,485 C/mol; at 25°C Nernst factor = 0.0592/n. "
                 "Exam focus: calculating E°_cell, applying Nernst equation, Faraday's law calculations."),
            ],
            "queries": [
                ("In Slide 2 on Galvanic Cells, what is the cell notation and standard cell "
                 "potential for the Zn-Cu cell?",
                 "slide_2_galvanic_cells"),
                ("What does the Nernst Equation state and what is the simplified form at 25°C "
                 "according to the electrochemistry lecture?",
                 "slide_3_nernst"),
                ("In Slide 4 on Faraday's Laws, what is the formula for mass deposited "
                 "and how much charge is needed to deposit 1 mol of Cu?",
                 "slide_4_faraday"),
                ("According to Slide 1, what does OIL RIG stand for and in the Zn+Cu² reaction "
                 "which species is oxidised and which is the reducing agent?",
                 "slide_1_redox"),
                ("In the electrolytic cell slide, what are three industrial applications "
                 "of electrolysis mentioned in the lecture?",
                 "slide_5_electrolytic"),
                ("What are the key constants and exam focus areas listed in the "
                 "Electrochemistry summary slide?",
                 "slide_6_summary"),
            ],
        },
    ],
    "biology": [
        {
            "title": "Cell Division: Mitosis",
            "slides": [
                ("Why Cells Divide",
                 "Cell division is essential for: growth (increasing cell number), "
                 "repair (replacing damaged or dead cells), and reproduction (asexual). "
                 "Cell cycle: Interphase (G1 → S → G2) + Mitosis (M phase). "
                 "During S-phase (DNA synthesis): genetic material is duplicated. "
                 "Key takeaway: a cell must replicate its DNA completely before dividing."),
                ("Prophase",
                 "First phase of mitosis: chromosomes condense and become visible. "
                 "Nuclear envelope breaks down; spindle fibres form from centrioles (in animal cells). "
                 "Each chromosome consists of two sister chromatids joined at the centromere. "
                 "Key takeaway: chromatin → chromosome condensation is the hallmark of prophase. "
                 "Plant cells lack centrioles but still form spindle fibres."),
                ("Metaphase",
                 "Chromosomes align along the metaphase plate (cell equator). "
                 "Spindle fibres from opposite poles attach to kinetochores on centromeres. "
                 "This is the best stage for chromosome counting and karyotyping — "
                 "chromosomes are maximally condensed and clearly separated. "
                 "Key takeaway: metaphase is used in clinical genetics for chromosome analysis."),
                ("Anaphase",
                 "Sister chromatids separate and are pulled to opposite poles by spindle fibres. "
                 "Centromeres split; each chromatid is now considered a chromosome. "
                 "Cell elongates as non-kinetochore microtubules push poles apart. "
                 "Key takeaway: anaphase is when genetic material is physically separated. "
                 "Number of chromosomes at each pole equals original chromosome number."),
                ("Telophase and Cytokinesis",
                 "Telophase: nuclear envelopes reform around each set of chromosomes; "
                 "chromosomes decondense back to chromatin; spindle fibres disappear. "
                 "Cytokinesis in animal cells: cleavage furrow forms, cell pinches in two. "
                 "Cytokinesis in plant cells: cell plate forms from Golgi vesicles at the midline. "
                 "Key takeaway: cytokinesis produces two genetically IDENTICAL daughter cells."),
                ("Summary",
                 "Mitosis phases: Prophase → Metaphase → Anaphase → Telophase + Cytokinesis. "
                 "Mnemonic: PMAT (Prophase, Metaphase, Anaphase, Telophase). "
                 "Result: two diploid (2n) daughter cells, genetically identical to parent. "
                 "Exam focus: identify phase from diagrams, explain significance of each stage."),
            ],
            "queries": [
                ("In Slide 3 on Metaphase, why is this stage used for karyotyping and "
                 "what attaches spindle fibres to chromosomes?",
                 "slide_3_metaphase"),
                ("According to Slide 4 on Anaphase, what happens to the centromere and "
                 "how does the chromosome number at each pole compare to the original?",
                 "slide_4_anaphase"),
                ("In the Telophase and Cytokinesis slide, how does cytokinesis differ "
                 "between animal cells and plant cells?",
                 "slide_5_telophase"),
                ("In Slide 2 on Prophase, what happens to the nuclear envelope and "
                 "what role do centrioles play?",
                 "slide_2_prophase"),
                ("According to Slide 1 of the Cell Division lecture, what are the three "
                 "functions of cell division and what occurs during S-phase?",
                 "slide_1_why_divide"),
                ("What is the mnemonic for mitosis phases and what type of daughter cells "
                 "are produced according to the summary slide?",
                 "slide_6_summary"),
            ],
        },
        {
            "title": "Genetics: Mendelian Inheritance",
            "slides": [
                ("Mendel's First Law",
                 "Law of Segregation: each organism carries two alleles for each trait; "
                 "these alleles separate during gamete formation so each gamete carries one allele. "
                 "Dominant allele (T) masks recessive (t) in heterozygote (Tt). "
                 "Genotype Tt produces gametes T and t in equal proportion (50:50). "
                 "Key takeaway: segregation occurs during meiosis I when homologous chromosomes separate."),
                ("Monohybrid Cross",
                 "Cross between parents differing in ONE trait. "
                 "F1 cross: Tt × Tt → TT : Tt : tt in ratio 1:2:1 (genotypic). "
                 "Phenotypic ratio: 3 Tall : 1 Short (dominant:recessive = 3:1). "
                 "Use Punnett square to calculate all possible genotype combinations. "
                 "Key takeaway: 3:1 phenotypic ratio is the signature of a monohybrid F1 cross."),
                ("Mendel's Second Law",
                 "Law of Independent Assortment: genes for different traits assort independently "
                 "during gamete formation, provided they are on different chromosomes. "
                 "Dihybrid cross (RRYY × rryy): F2 produces 9:3:3:1 phenotypic ratio. "
                 "9 R_Y_ : 3 R_yy : 3 rrY_ : 1 rryy. "
                 "Key takeaway: independent assortment requires genes on DIFFERENT chromosomes; "
                 "linked genes on the same chromosome deviate from this ratio."),
                ("Incomplete Dominance",
                 "Neither allele is completely dominant; heterozygote shows intermediate phenotype. "
                 "Example: snapdragon flower colour. RR = red, WW = white, RW = pink. "
                 "F2 cross RW × RW: 1 RR (red) : 2 RW (pink) : 1 WW (white). "
                 "Key takeaway: phenotypic ratio equals genotypic ratio (1:2:1) in incomplete dominance."),
                ("Codominance",
                 "Both alleles are fully expressed in the heterozygote — no blending. "
                 "Example: ABO blood groups. I^A I^A = blood type A; I^B I^B = blood type B; "
                 "I^A I^B = blood type AB (both A and B antigens expressed). "
                 "Key takeaway: codominance differs from incomplete dominance — phenotype is "
                 "NOT intermediate but shows BOTH parental phenotypes simultaneously."),
                ("Summary",
                 "Mendelian genetics: Law of Segregation (3:1 ratio), Law of Independent Assortment "
                 "(9:3:3:1 ratio), incomplete dominance (1:2:1), codominance (ABO). "
                 "Exam focus: construct Punnett squares, predict phenotypic/genotypic ratios, "
                 "distinguish incomplete dominance from codominance."),
            ],
            "queries": [
                ("In Slide 2 on Monohybrid Cross, what are the genotypic and phenotypic ratios "
                 "for the Tt × Tt cross and what tool is used to calculate them?",
                 "slide_2_monohybrid"),
                ("According to Slide 3 on Mendel's Second Law, what is the 9:3:3:1 ratio "
                 "and when does independent assortment NOT apply?",
                 "slide_3_second_law"),
                ("In Slide 4 on Incomplete Dominance, what is the phenotypic outcome of "
                 "RW × RW cross in snapdragons and what does the 1:2:1 ratio represent?",
                 "slide_4_incomplete_dominance"),
                ("What distinguishes codominance from incomplete dominance as explained "
                 "in Slide 5 on Codominance, and what is the ABO blood type example?",
                 "slide_5_codominance"),
                ("In Slide 1 on Mendel's First Law, what happens to alleles during "
                 "gamete formation and during which phase of meiosis does this occur?",
                 "slide_1_first_law"),
                ("What phenotypic ratios and exam focus areas are listed in the "
                 "Genetics summary slide?",
                 "slide_6_summary"),
            ],
        },
    ],
    "mathematics": [
        {
            "title": "Differential Calculus",
            "slides": [
                ("Limits",
                 "The limit of f(x) as x→a is L if f(x) approaches L as x approaches a. "
                 "Notation: lim_{x→a} f(x) = L. "
                 "Left-hand limit: lim_{x→a⁻} f(x); right-hand limit: lim_{x→a⁺} f(x). "
                 "Limit exists iff LHL = RHL. "
                 "L'Hôpital's rule for 0/0 or ∞/∞ forms: lim f(x)/g(x) = lim f'(x)/g'(x). "
                 "Key takeaway: a limit describes function behaviour NEAR a point, not AT the point."),
                ("Definition of Derivative",
                 "The derivative of f at x is: f'(x) = lim_{h→0} [f(x+h)−f(x)]/h. "
                 "Geometrically: f'(x) is the slope of the tangent line to y=f(x) at x. "
                 "If f'(x) > 0, f is increasing; f'(x) < 0, f is decreasing; f'(x) = 0, critical point. "
                 "Notation: f'(x) = dy/dx = Df(x). "
                 "Key takeaway: the derivative measures the instantaneous rate of change."),
                ("Standard Derivatives",
                 "d/dx(xⁿ) = nxⁿ⁻¹ (power rule). "
                 "d/dx(sin x) = cos x;  d/dx(cos x) = −sin x. "
                 "d/dx(eˣ) = eˣ;  d/dx(ln x) = 1/x. "
                 "d/dx(uv) = u'v + uv' (product rule). "
                 "d/dx(u/v) = (u'v − uv')/v² (quotient rule). "
                 "Key takeaway: memorise these 6 rules — they cover 95% of exam derivative problems."),
                ("Chain Rule",
                 "For composite functions f(g(x)): d/dx[f(g(x))] = f'(g(x))·g'(x). "
                 "Example: d/dx[sin(x²)] = cos(x²)·2x. "
                 "Example: d/dx[e^{3x}] = e^{3x}·3 = 3e^{3x}. "
                 "Strategy: identify outer function f and inner function g, then apply. "
                 "Key takeaway: chain rule is the most frequently tested derivative rule in exams."),
                ("Applications: Maxima and Minima",
                 "To find local extrema: (1) Set f'(x) = 0, solve for critical points. "
                 "(2) Apply second derivative test: f''(x) > 0 → local minimum; f''(x) < 0 → local maximum. "
                 "If f''(x) = 0, use first derivative test. "
                 "Global extrema on [a,b]: evaluate f at all critical points + endpoints, compare values. "
                 "Key takeaway: always check boundary points when finding global extrema on a closed interval."),
                ("Summary",
                 "Differential calculus: limits, definition of derivative, standard derivatives, "
                 "chain rule, maxima-minima. "
                 "Key identities: power rule nxⁿ⁻¹, chain rule f'(g(x))·g'(x). "
                 "Exam focus: chain rule problems, optimisation problems using second derivative test."),
            ],
            "queries": [
                ("In Slide 4 on Chain Rule, what is the formula for composite function derivatives "
                 "and what is the worked example for d/dx[sin(x²)]?",
                 "slide_4_chain_rule"),
                ("According to Slide 5 on Maxima and Minima, what are the steps to find "
                 "local extrema and what does f''(x) > 0 indicate?",
                 "slide_5_maxima"),
                ("In Slide 3 on Standard Derivatives, what are the derivatives of sin x, "
                 "eˣ, and ln x, and what does the product rule state?",
                 "slide_3_standard_derivatives"),
                ("In Slide 2 on Definition of Derivative, what does the sign of f'(x) "
                 "indicate about the function's behaviour?",
                 "slide_2_derivative_definition"),
                ("According to Slide 1 on Limits, what is L'Hôpital's rule and when is "
                 "a limit said to exist?",
                 "slide_1_limits"),
                ("What are the key identities and exam focus areas listed in the "
                 "Differential Calculus summary slide?",
                 "slide_6_summary"),
            ],
        },
        {
            "title": "Integration",
            "slides": [
                ("Indefinite Integrals",
                 "The antiderivative F(x) satisfies F'(x) = f(x); written ∫f(x)dx = F(x) + C. "
                 "∫xⁿ dx = xⁿ⁺¹/(n+1) + C (n ≠ −1); ∫1/x dx = ln|x| + C. "
                 "∫eˣ dx = eˣ + C; ∫sin x dx = −cos x + C; ∫cos x dx = sin x + C. "
                 "Key takeaway: always add the constant of integration C — missing it costs marks."),
                ("Definite Integrals",
                 "∫_a^b f(x)dx = F(b) − F(a), where F is any antiderivative of f. "
                 "Geometrically: signed area between the curve and x-axis from a to b. "
                 "Properties: ∫_a^b f dx = −∫_b^a f dx; ∫_a^a f dx = 0. "
                 "Key takeaway: evaluate by finding F(x) first, then substitute bounds."),
                ("Substitution Method",
                 "Used when integrand contains a composite function. "
                 "Let u = g(x); then du = g'(x)dx. "
                 "Example: ∫2x·cos(x²)dx → let u = x², du = 2x dx → ∫cos(u)du = sin(u)+C = sin(x²)+C. "
                 "For definite integrals: change bounds using u = g(x). "
                 "Key takeaway: substitution is the reverse of chain rule."),
                ("Integration by Parts",
                 "Formula: ∫u dv = uv − ∫v du. "
                 "Choose u using LIATE priority: Logarithm, Inverse trig, Algebraic, Trig, Exponential. "
                 "Example: ∫x·eˣ dx → u=x, dv=eˣdx → du=dx, v=eˣ → x·eˣ − ∫eˣdx = xeˣ − eˣ + C. "
                 "Key takeaway: LIATE guides u-selection; don't apply to simple products without composite."),
                ("Fundamental Theorem of Calculus",
                 "Part 1: If F(x) = ∫_a^x f(t)dt, then F'(x) = f(x). "
                 "Part 2: ∫_a^b f(x)dx = F(b) − F(a), where F'= f. "
                 "Connects differentiation and integration as inverse operations. "
                 "Key takeaway: FTC Part 1 gives derivative of an integral; FTC Part 2 evaluates definite integrals."),
                ("Summary",
                 "Integration covers indefinite integrals, definite integrals, substitution, integration by parts, FTC. "
                 "Key rules: ∫xⁿdx = xⁿ⁺¹/(n+1); LIATE for parts. "
                 "Exam focus: substitution problems, by-parts with xeˣ or x·sinx, FTC applications."),
            ],
            "queries": [
                ("In Slide 3 on Substitution Method, what substitution is used for "
                 "∫2x·cos(x²)dx and what is the final answer?",
                 "slide_3_substitution"),
                ("According to Slide 4 on Integration by Parts, what is the LIATE rule "
                 "and what is the worked example with x·eˣ?",
                 "slide_4_by_parts"),
                ("In Slide 5 on the Fundamental Theorem of Calculus, what do FTC Parts 1 "
                 "and 2 each state?",
                 "slide_5_ftc"),
                ("What are the basic indefinite integral formulas listed in Slide 1 "
                 "and why must the constant C always be added?",
                 "slide_1_indefinite"),
                ("In Slide 2 on Definite Integrals, what is the geometric interpretation "
                 "and what are two key properties listed?",
                 "slide_2_definite"),
                ("What are the key rules and exam focus areas listed in the "
                 "Integration summary slide?",
                 "slide_6_summary"),
            ],
        },
    ],
    "geography": [
        {
            "title": "Geomorphology: Landforms",
            "slides": [
                ("Weathering",
                 "Weathering is the breakdown of rocks in situ (no transport). "
                 "Physical weathering: mechanical disintegration — freeze-thaw action, exfoliation, "
                 "thermal expansion. No chemical change. "
                 "Chemical weathering: decomposition by chemical reaction — oxidation (iron → rust), "
                 "carbonation (limestone dissolution by CO₂+H₂O), hydration. "
                 "Biological weathering: plant roots in rock fractures, lichens producing acids. "
                 "Key takeaway: weathering rate depends on climate — chemical weathering is fastest "
                 "in hot, humid conditions."),
                ("Erosion and Transport",
                 "Erosion: detachment and removal of material by moving agents (water, wind, ice, gravity). "
                 "River processes: hydraulic action (water pressure), abrasion (rock-on-rock grinding), "
                 "attrition (sediment rounding), solution (chemical dissolution). "
                 "Transportation modes: traction (rolling), saltation (bouncing), suspension (fine particles), "
                 "solution (dissolved load). "
                 "Key takeaway: larger particles need greater energy to transport — coarse gravel is "
                 "deposited first when river velocity drops."),
                ("Fluvial Landforms",
                 "Formed by river action. Upper course (high gradient): V-shaped valley, interlocking spurs, "
                 "waterfalls, gorges — erosion dominant. "
                 "Middle course: meanders develop as river swings laterally; oxbow lakes form when "
                 "meander neck is cut off. "
                 "Lower course (low gradient): wide floodplain, braiding, delta formation at sea. "
                 "Key takeaway: deltas form when river velocity drops suddenly at the mouth — "
                 "three types: arcuate (Nile), bird's foot (Mississippi), cuspate."),
                ("Glacial Landforms",
                 "Glaciers erode by plucking (ice pulling rock fragments) and abrasion (rock-studded ice grinding). "
                 "Erosional features: U-shaped valley (glacial trough), cirque (armchair hollow), "
                 "arête (knife-edge ridge), horn (pyramidal peak, e.g., Matterhorn). "
                 "Depositional features: moraine (till deposits) — terminal, lateral, medial; "
                 "drumlins (streamlined hills); erratics (boulders transported far from origin). "
                 "Key takeaway: U-shaped valley vs V-shaped valley distinguishes glacial from fluvial erosion."),
                ("Coastal Landforms",
                 "Wave erosion creates: cliffs, wave-cut platforms, caves, arches, stacks, stumps. "
                 "Sequence: cave → arch → stack → stump (progressive erosion). "
                 "Deposition features: beaches (sand/shingle), spits (narrow ridges extending into sea), "
                 "bars (spits connecting two land areas), tombolos (connecting island to mainland). "
                 "Key takeaway: longshore drift moves sediment along coast; groynes are built to "
                 "slow this process and preserve beaches."),
                ("Summary",
                 "Geomorphology: weathering (physical, chemical, biological), erosion-transport, "
                 "fluvial, glacial, and coastal landforms. "
                 "Exam focus: distinguish erosional from depositional landforms, identify climate "
                 "controls on weathering rates, label landform diagrams."),
            ],
            "queries": [
                ("In Slide 3 on Fluvial Landforms, what landforms are found in the upper, "
                 "middle, and lower course of a river, and what are the three delta types?",
                 "slide_3_fluvial"),
                ("According to Slide 4 on Glacial Landforms, what is the difference "
                 "between erosional and depositional glacial features and name two of each?",
                 "slide_4_glacial"),
                ("In Slide 2 on Erosion and Transport, what are four river erosion processes "
                 "and what determines which particle size is deposited first?",
                 "slide_2_erosion"),
                ("In Slide 5 on Coastal Landforms, what is the progressive erosion sequence "
                 "from cave to stump and what is longshore drift?",
                 "slide_5_coastal"),
                ("In Slide 1 on Weathering, how do chemical and physical weathering differ "
                 "and under what climate is chemical weathering fastest?",
                 "slide_1_weathering"),
                ("What landform types are listed in the Geomorphology summary slide and "
                 "what are the exam focus areas?",
                 "slide_6_summary"),
            ],
        },
        {
            "title": "Climate Systems",
            "slides": [
                ("Atmospheric Layers",
                 "Troposphere (0–12 km): weather occurs here; temperature decreases with altitude "
                 "at environmental lapse rate (ELR) ≈ 6.5°C/km. "
                 "Stratosphere (12–50 km): ozone layer at 15–35 km absorbs UV; temperature increases. "
                 "Mesosphere (50–80 km): temperature decreases; meteors burn up here. "
                 "Thermosphere (80–600 km): very high temperatures; auroras occur. "
                 "Key takeaway: the tropopause (boundary between troposphere and stratosphere) "
                 "is where jet streams are located."),
                ("Insolation and Heat Budget",
                 "Insolation: incoming solar radiation. Only ~51% reaches Earth's surface. "
                 "Of incoming radiation: ~30% reflected (albedo), ~19% absorbed by atmosphere, "
                 "~51% absorbed by surface. "
                 "Heat budget: Earth emits longwave radiation back to space; must equal incoming "
                 "shortwave to maintain thermal equilibrium. "
                 "Key takeaway: greenhouse gases trap outgoing longwave radiation — increasing "
                 "their concentration raises surface temperature."),
                ("Global Pressure Belts",
                 "0° (Equator): ITCZ — Inter-Tropical Convergence Zone; low pressure; heavy rainfall. "
                 "30° N/S: Subtropical High — descending air, dry deserts (Sahara, Atacama). "
                 "60° N/S: Subpolar Low — convergence of westerlies and polar easterlies; cyclones. "
                 "90° N/S (Poles): Polar High — cold, dense, descending air. "
                 "Key takeaway: pressure alternates low-high-low-high from equator to poles."),
                ("Global Wind Systems",
                 "Trade winds: blow from subtropical highs (30°) toward ITCZ (0°); "
                 "deflected by Coriolis to NE in Northern Hemisphere, SE in Southern. "
                 "Westerlies: from subtropical highs toward subpolar lows (60°); SW in NH. "
                 "Polar easterlies: from polar highs toward subpolar lows; NE in NH. "
                 "Coriolis effect: deflects winds to the right in NH, left in SH. "
                 "Key takeaway: all wind systems are driven by pressure gradients and modified by Coriolis."),
                ("Indian Monsoon",
                 "Mechanism: differential heating of land and sea. "
                 "Summer (SW Monsoon): land heats faster, low pressure over India; "
                 "moist SW winds drawn in from Indian Ocean; heavy rainfall June–September. "
                 "Winter (NE Monsoon): land cools, high pressure; dry NE winds blow toward sea; "
                 "some rainfall on southeast coast from Bay of Bengal. "
                 "Key takeaway: the Western Ghats act as an orographic barrier — "
                 "windward side receives heavy rain; leeward side (rain shadow) is dry."),
                ("Summary",
                 "Climate systems: atmospheric layers, insolation, pressure belts, wind systems, monsoon. "
                 "Key facts: ITCZ at 0°; subtropical high at 30°; Coriolis deflects right in NH; "
                 "SW monsoon brings June–September rainfall to India. "
                 "Exam focus: pressure belt diagram, monsoon mechanism, Coriolis effect explanation."),
            ],
            "queries": [
                ("In Slide 3 on Global Pressure Belts, what are the four pressure belts "
                 "and what causes the dry deserts at 30° latitude?",
                 "slide_3_pressure_belts"),
                ("According to Slide 5 on Indian Monsoon, what is the mechanism of the "
                 "SW monsoon and what is the rain shadow effect of the Western Ghats?",
                 "slide_5_monsoon"),
                ("In Slide 4 on Global Wind Systems, what are trade winds and how does "
                 "the Coriolis effect determine their direction in each hemisphere?",
                 "slide_4_wind_systems"),
                ("In Slide 1 on Atmospheric Layers, what happens to temperature in the "
                 "stratosphere and where are jet streams located?",
                 "slide_1_atmosphere"),
                ("According to Slide 2 on Insolation, what percentage of solar radiation "
                 "reaches Earth's surface and how do greenhouse gases affect heat budget?",
                 "slide_2_insolation"),
                ("What key facts and exam focus areas are listed in the "
                 "Climate Systems summary slide?",
                 "slide_6_summary"),
            ],
        },
    ],
}


def make_lecture_notes_doc(subject: str, lecture_info: dict) -> dict:
    title = lecture_info["title"]
    doc_id = f"lecture_{subject}_{title.lower().replace(' ','_').replace(':','')}"
    slides = lecture_info["slides"]
    lines = [f"Lecture Notes: {title}\nSubject: {subject.capitalize()}  |  Grade: Higher Secondary\n"]
    for i, (slide_title, content) in enumerate(slides, 1):
        lines.append(f"\nSlide {i}: {slide_title}\n{content}\n")
    text = "\n".join(lines)
    return {
        "doc_id": doc_id,
        "text": text,
        "metadata": {
            "subject": subject,
            "grade": "higher_secondary",
            "doc_type": "unknown",
            "source": f"lecture_notes_{subject}",
            "title": title,
        },
    }


# ─── 2. WORKED EXAMPLES (→ EDUCATIONAL) ─────────────────────────────────────
# Structural markers: "Example N:", "Given:", "Find:", "Step N:", "Answer:"
# Queries: ask for BOTH the procedure AND the final answer → requires combined chunk

WORKED_EXAMPLES = {
    "physics": {
        "title": "Kinematics and Dynamics Problems",
        "examples": [
            {
                "num": 1,
                "topic": "Projectile Motion",
                "given": "A ball is launched horizontally from a height of 45 m with an initial horizontal velocity of 20 m/s. Take g = 10 m/s².",
                "find": "Time of flight, horizontal range, and velocity just before impact.",
                "steps": [
                    "Vertical motion is free fall: h = ½gt² → 45 = ½(10)t² → t² = 9 → t = 3 s (time of flight)",
                    "Horizontal range: x = u_x × t = 20 × 3 = 60 m",
                    "Vertical velocity at impact: v_y = gt = 10 × 3 = 30 m/s (downward)",
                    "Resultant speed: v = √(v_x² + v_y²) = √(20² + 30²) = √(400 + 900) = √1300 ≈ 36.1 m/s",
                    "Direction: θ = arctan(30/20) = arctan(1.5) ≈ 56.3° below horizontal",
                ],
                "answer": "Time = 3 s; Range = 60 m; Impact speed ≈ 36.1 m/s at 56.3° below horizontal.",
            },
            {
                "num": 2,
                "topic": "Newton's Second Law with Friction",
                "given": "A 10 kg block on a rough horizontal surface (μ_k = 0.25) is pulled by a rope at 30° above horizontal with force F = 50 N. Take g = 10 m/s².",
                "find": "Normal force, kinetic friction force, and acceleration of the block.",
                "steps": [
                    "Vertical equilibrium: N + F·sin30° = mg → N = mg − F·sin30° = 100 − 25 = 75 N",
                    "Kinetic friction: f_k = μ_k × N = 0.25 × 75 = 18.75 N",
                    "Horizontal: F·cos30° − f_k = ma → 50×(√3/2) − 18.75 = 10a",
                    "43.30 − 18.75 = 10a → 24.55 = 10a → a = 2.46 m/s²",
                ],
                "answer": "N = 75 N; Friction = 18.75 N; Acceleration a = 2.46 m/s².",
            },
            {
                "num": 3,
                "topic": "Conservation of Momentum",
                "given": "A 3 kg ball moving at 4 m/s east collides with a stationary 1 kg ball. After collision the 3 kg ball moves at 2 m/s east.",
                "find": "Velocity of the 1 kg ball after collision; determine if collision is elastic.",
                "steps": [
                    "Conservation of momentum: m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂",
                    "3(4) + 1(0) = 3(2) + 1(v₂) → 12 = 6 + v₂ → v₂ = 6 m/s east",
                    "Check kinetic energy before: KE_i = ½(3)(4²) + 0 = 24 J",
                    "KE after: ½(3)(2²) + ½(1)(6²) = 6 + 18 = 24 J",
                    "Since KE_before = KE_after = 24 J, the collision IS elastic.",
                ],
                "answer": "v₂ = 6 m/s east; The collision is elastic (KE conserved at 24 J).",
            },
        ],
    },
    "chemistry": {
        "title": "Equilibrium and Electrochemistry Problems",
        "examples": [
            {
                "num": 1,
                "topic": "Equilibrium Constant Calculation",
                "given": "For the reaction N₂(g) + 3H₂(g) ⇌ 2NH₃(g) at 500°C, the equilibrium concentrations are: [N₂] = 0.50 M, [H₂] = 0.30 M, [NH₃] = 0.20 M.",
                "find": "The equilibrium constant K_c and determine which side is favoured.",
                "steps": [
                    "Write K_c expression: K_c = [NH₃]²/([N₂][H₂]³)",
                    "Substitute: K_c = (0.20)²/((0.50)(0.30)³)",
                    "Numerator: (0.20)² = 0.0400",
                    "Denominator: 0.50 × (0.027) = 0.0135",
                    "K_c = 0.0400/0.0135 = 2.96",
                ],
                "answer": "K_c = 2.96; since K_c > 1, equilibrium favours the product side (NH₃).",
            },
            {
                "num": 2,
                "topic": "pH Calculation for Weak Acid",
                "given": "Calculate the pH of a 0.10 M solution of acetic acid (Ka = 1.8 × 10⁻⁵).",
                "find": "Concentration of H⁺ ions and pH of the solution.",
                "steps": [
                    "Set up ICE table: CH₃COOH ⇌ H⁺ + CH₃COO⁻",
                    "Initial: [CH₃COOH] = 0.10, [H⁺] = 0, [CH₃COO⁻] = 0",
                    "Change: −x, +x, +x; Equilibrium: 0.10−x, x, x",
                    "Ka = x²/(0.10−x) ≈ x²/0.10 (assuming x << 0.10)",
                    "x² = Ka × 0.10 = 1.8×10⁻⁵ × 0.10 = 1.8×10⁻⁶ → x = 1.34×10⁻³ M",
                    "pH = −log(1.34×10⁻³) = −log(1.34) − log(10⁻³) = −0.127 + 3 = 2.87",
                ],
                "answer": "[H⁺] = 1.34×10⁻³ M; pH = 2.87",
            },
            {
                "num": 3,
                "topic": "Faraday's Law Electrolysis",
                "given": "A current of 2.0 A is passed through a CuSO₄ solution for 30 minutes. Molar mass of Cu = 63.5 g/mol; F = 96,500 C/mol.",
                "find": "Mass of copper deposited at the cathode.",
                "steps": [
                    "Charge passed: Q = I × t = 2.0 × (30 × 60) = 2.0 × 1800 = 3600 C",
                    "Cu²⁺ + 2e⁻ → Cu; n electrons = 2 (since copper is divalent)",
                    "Moles of electrons = Q/F = 3600/96500 = 0.0373 mol e⁻",
                    "Moles of Cu = 0.0373/2 = 0.01866 mol",
                    "Mass of Cu = 0.01866 × 63.5 = 1.185 g",
                ],
                "answer": "Mass of copper deposited = 1.185 g ≈ 1.19 g",
            },
        ],
    },
    "biology": {
        "title": "Genetics and Ecology Problems",
        "examples": [
            {
                "num": 1,
                "topic": "Dihybrid Cross",
                "given": "In pea plants, Tall (T) is dominant over Dwarf (t), and Round seed (R) is dominant over Wrinkled (r). Two plants of genotype TtRr are crossed.",
                "find": "Phenotypic and genotypic ratios; probability of getting a Tall Wrinkled plant.",
                "steps": [
                    "Gametes from TtRr: TR, Tr, tR, tr (each with probability 1/4)",
                    "16 possible F2 combinations from 4 × 4 Punnett square",
                    "Phenotypic classes: 9 T_R_ (Tall Round) : 3 T_rr (Tall Wrinkled) : 3 ttR_ (Dwarf Round) : 1 ttrr (Dwarf Wrinkled)",
                    "Probability of Tall Wrinkled (T_rr): 3/16",
                ],
                "answer": "Phenotypic ratio: 9:3:3:1; Probability of Tall Wrinkled = 3/16 = 18.75%.",
            },
            {
                "num": 2,
                "topic": "Hardy-Weinberg Equilibrium",
                "given": "In a population of 500 individuals, 45 show the recessive phenotype (aa) for a trait.",
                "find": "Allele frequencies p and q; frequency of carriers (Aa).",
                "steps": [
                    "Frequency of recessive phenotype (aa): q² = 45/500 = 0.090",
                    "Allele frequency q = √0.090 = 0.30",
                    "Dominant allele frequency p = 1 − q = 1 − 0.30 = 0.70",
                    "Carrier frequency: 2pq = 2 × 0.70 × 0.30 = 0.42",
                    "Number of carriers: 0.42 × 500 = 210 individuals",
                ],
                "answer": "p = 0.70; q = 0.30; Carrier frequency = 0.42; ~210 individuals are carriers.",
            },
            {
                "num": 3,
                "topic": "Food Chain Energy Transfer",
                "given": "A grassland ecosystem: Grass (10,000 kJ) → Grasshoppers → Frogs → Snakes. "
                         "Ecological efficiency at each trophic level = 10%.",
                "find": "Energy available at each trophic level and number of trophic levels possible.",
                "steps": [
                    "Producer energy: 10,000 kJ (Grass)",
                    "Primary consumer (Grasshoppers): 10% × 10,000 = 1,000 kJ",
                    "Secondary consumer (Frogs): 10% × 1,000 = 100 kJ",
                    "Tertiary consumer (Snakes): 10% × 100 = 10 kJ",
                    "At 10% efficiency, energy becomes negligible beyond 4–5 trophic levels",
                ],
                "answer": "Grasshoppers = 1,000 kJ; Frogs = 100 kJ; Snakes = 10 kJ. Maximum ~4-5 trophic levels practical.",
            },
        ],
    },
    "mathematics": {
        "title": "Calculus and Algebra Problems",
        "examples": [
            {
                "num": 1,
                "topic": "Chain Rule Differentiation",
                "given": "Differentiate y = sin³(2x + 1) with respect to x.",
                "find": "dy/dx using the chain rule.",
                "steps": [
                    "Identify the composite: y = [sin(2x+1)]³ — outer function u³, inner = sin(2x+1)",
                    "Apply chain rule twice: dy/dx = 3[sin(2x+1)]² × d/dx[sin(2x+1)]",
                    "d/dx[sin(2x+1)] = cos(2x+1) × d/dx(2x+1) = cos(2x+1) × 2",
                    "Combine: dy/dx = 3sin²(2x+1) × 2cos(2x+1) = 6sin²(2x+1)cos(2x+1)",
                    "Simplify using double angle: 6sin²(2x+1)cos(2x+1) = 3sin²(2x+1)·sin(2(2x+1)) [optional]",
                ],
                "answer": "dy/dx = 6sin²(2x+1)·cos(2x+1)",
            },
            {
                "num": 2,
                "topic": "Integration by Parts",
                "given": "Evaluate ∫x²·eˣ dx.",
                "find": "Antiderivative using integration by parts (apply twice).",
                "steps": [
                    "First application: u = x², dv = eˣdx → du = 2x dx, v = eˣ",
                    "∫x²eˣdx = x²eˣ − ∫2xeˣdx",
                    "Second application on ∫2xeˣdx: u = 2x, dv = eˣdx → du = 2dx, v = eˣ",
                    "∫2xeˣdx = 2xeˣ − ∫2eˣdx = 2xeˣ − 2eˣ",
                    "Combine: ∫x²eˣdx = x²eˣ − (2xeˣ − 2eˣ) = x²eˣ − 2xeˣ + 2eˣ",
                ],
                "answer": "∫x²eˣ dx = eˣ(x² − 2x + 2) + C",
            },
            {
                "num": 3,
                "topic": "Finding Local Maxima and Minima",
                "given": "Find the local maxima and minima of f(x) = 2x³ − 9x² + 12x − 4.",
                "find": "Critical points and classify each using the second derivative test.",
                "steps": [
                    "f'(x) = 6x² − 18x + 12 = 6(x² − 3x + 2) = 6(x−1)(x−2)",
                    "Critical points: f'(x) = 0 → x = 1 and x = 2",
                    "f''(x) = 12x − 18",
                    "At x = 1: f''(1) = 12 − 18 = −6 < 0 → LOCAL MAXIMUM; f(1) = 2−9+12−4 = 1",
                    "At x = 2: f''(2) = 24 − 18 = +6 > 0 → LOCAL MINIMUM; f(2) = 16−36+24−4 = 0",
                ],
                "answer": "Local maximum at x=1, f(1)=1; Local minimum at x=2, f(2)=0.",
            },
        ],
    },
    "geography": {
        "title": "Map Reading and Climate Data Problems",
        "examples": [
            {
                "num": 1,
                "topic": "Contour Map Gradient Calculation",
                "given": "Two contour lines are 50 m apart in elevation. The horizontal distance between them on a 1:25,000 scale map is 4 cm.",
                "find": "Actual horizontal distance and gradient of the slope.",
                "steps": [
                    "Map distance = 4 cm; scale 1:25,000",
                    "Actual horizontal distance = 4 cm × 25,000 = 100,000 cm = 1,000 m = 1 km",
                    "Vertical difference = 50 m",
                    "Gradient = vertical rise / horizontal distance = 50/1000 = 1/20",
                    "As a ratio: gradient = 1:20 (rise 1 m for every 20 m horizontal)",
                ],
                "answer": "Horizontal distance = 1 km; Gradient = 1:20 (or 50 m per 1,000 m horizontal).",
            },
            {
                "num": 2,
                "topic": "Population Density Calculation",
                "given": "A district has an area of 8,500 km². The urban population is 1.2 million and the rural population is 2.8 million.",
                "find": "Total population density; urban-rural population split percentage.",
                "steps": [
                    "Total population = 1,200,000 + 2,800,000 = 4,000,000",
                    "Population density = Total population / Area = 4,000,000 / 8,500 = 470.6 persons/km²",
                    "Urban percentage = (1,200,000 / 4,000,000) × 100 = 30%",
                    "Rural percentage = (2,800,000 / 4,000,000) × 100 = 70%",
                ],
                "answer": "Population density ≈ 471 persons/km²; Urban 30%; Rural 70%.",
            },
            {
                "num": 3,
                "topic": "Annual Rainfall and Temperature Range",
                "given": "A station records: maximum temperature 38°C (May), minimum 12°C (January). Monthly rainfall totals sum to 1,240 mm annually.",
                "find": "Annual temperature range; classify climate type based on rainfall and temperature.",
                "steps": [
                    "Annual temperature range = T_max − T_min = 38 − 12 = 26°C",
                    "Annual rainfall = 1,240 mm (> 750 mm threshold for tropical wet)",
                    "High temperature range (>25°C) indicates continental influence or tropical inland",
                    "Heavy summer rainfall pattern suggests Tropical Monsoon or Savanna climate",
                    "Classify: Tropical Monsoon (Aw in Köppen) — warm all year, pronounced dry season",
                ],
                "answer": "Temperature range = 26°C; Annual rainfall = 1,240 mm; Climate = Tropical Monsoon (Aw).",
            },
        ],
    },
}


def make_worked_example_doc(subject: str, ex_info: dict) -> dict:
    title = ex_info["title"]
    doc_id = f"worked_examples_{subject}"
    lines = [f"Worked Examples: {title}\nSubject: {subject.capitalize()}  |  Grade: Higher Secondary\n"]
    for ex in ex_info["examples"]:
        n = ex["num"]
        lines.append(f"\nExample {n}: {ex['topic']}")
        lines.append(f"Given: {ex['given']}")
        lines.append(f"Find: {ex['find']}")
        for i, step in enumerate(ex["steps"], 1):
            lines.append(f"Step {i}: {step}")
        lines.append(f"Answer: {ex['answer']}\n")
    text = "\n".join(lines)
    return {
        "doc_id": doc_id,
        "text": text,
        "metadata": {
            "subject": subject,
            "grade": "higher_secondary",
            "doc_type": "unknown",
            "source": f"worked_examples_{subject}",
            "title": title,
        },
    }


def make_worked_example_queries(doc: dict, ex_info: dict) -> list[dict]:
    subject = doc["metadata"]["subject"]
    doc_id = doc["doc_id"]
    queries = []
    for ex in ex_info["examples"]:
        n = ex["num"]
        topic = ex["topic"]
        queries.append({
            "query_id": str(uuid.uuid4()),
            "text": f"In Example {n} on {topic}, what is the step-by-step procedure "
                    f"and what is the final answer?",
            "subject": subject, "grade": "higher_secondary",
            "expected_doc_ids": [doc_id], "expected_chunk_ids": [],
            "bloom_level": "apply", "source": doc["metadata"]["source"],
        })
    # Extra cross-example query
    queries.append({
        "query_id": str(uuid.uuid4()),
        "text": f"In Example 2 of the {subject} worked examples, "
                f"what assumption is made and what formula is applied in Step 2?",
        "subject": subject, "grade": "higher_secondary",
        "expected_doc_ids": [doc_id], "expected_chunk_ids": [],
        "bloom_level": "analyse", "source": doc["metadata"]["source"],
    })
    queries.append({
        "query_id": str(uuid.uuid4()),
        "text": f"What does Example 3 in the {subject} worked examples document require you to find, "
                f"and what is the numerical answer given?",
        "subject": subject, "grade": "higher_secondary",
        "expected_doc_ids": [doc_id], "expected_chunk_ids": [],
        "bloom_level": "remember", "source": doc["metadata"]["source"],
    })
    return queries


# ─── 3. SYLLABUSES (→ FIXED) ─────────────────────────────────────────────────
# Structural markers: "Unit N", "Periods:", "Marks:" — uniform tabular content
# Queries: target specific unit mark/period allocation

SYLLABUS_DATA = {
    "physics": {
        "grade": "Grade 11",
        "units": [
            ("Physical World and Measurement", 8, 5, ["Units and dimensions", "Errors in measurement", "Significant figures"]),
            ("Kinematics", 24, 15, ["Frame of reference", "Equations of motion", "Relative velocity", "Projectile motion"]),
            ("Laws of Motion", 16, 10, ["Newton's laws", "Friction", "Circular motion", "Conservation of momentum"]),
            ("Work, Energy, Power", 16, 10, ["Work-energy theorem", "Potential and kinetic energy", "Conservation of energy"]),
            ("Motion of System of Particles", 14, 10, ["Centre of mass", "Torque", "Angular momentum", "Rigid body rotation"]),
            ("Gravitation", 10, 8, ["Kepler's laws", "Universal gravitation", "Gravitational potential energy", "Escape velocity"]),
            ("Properties of Bulk Matter", 20, 12, ["Elasticity", "Surface tension", "Viscosity", "Bernoulli's equation"]),
            ("Thermodynamics", 12, 10, ["Zeroth law", "First law", "Second law", "Carnot engine efficiency"]),
            ("Behaviour of Perfect Gas", 8, 5, ["Kinetic theory", "Specific heats Cp and Cv", "Mean free path"]),
            ("Oscillations and Waves", 22, 15, ["SHM", "Damped oscillations", "Wave equation", "Doppler effect"]),
        ],
    },
    "chemistry": {
        "grade": "Grade 11",
        "units": [
            ("Some Basic Concepts of Chemistry", 10, 8, ["Mole concept", "Atomic mass", "Stoichiometry", "Empirical formula"]),
            ("Structure of Atom", 14, 10, ["Bohr model", "Quantum numbers", "Orbitals", "Electronic configuration"]),
            ("Classification of Elements", 8, 6, ["Periodic law", "Periods and groups", "Periodic trends", "Valency"]),
            ("Chemical Bonding", 14, 10, ["Ionic bond", "Covalent bond", "VSEPR theory", "Hybridisation", "Molecular orbital theory"]),
            ("States of Matter", 10, 8, ["Gas laws", "Ideal gas equation", "Kinetic molecular theory", "Liquefaction"]),
            ("Thermodynamics", 14, 10, ["System and surroundings", "Enthalpy", "Entropy", "Gibbs free energy"]),
            ("Equilibrium", 14, 10, ["Law of mass action", "K_c and K_p", "Le Chatelier's principle", "Acids and bases"]),
            ("Redox Reactions", 8, 6, ["Oxidation number", "Balancing by oxidation number method", "Electrolysis"]),
            ("Hydrogen", 6, 4, ["Isotopes", "Properties", "Water and hydrogen peroxide", "Heavy water"]),
            ("s-Block Elements", 12, 8, ["Alkali metals", "Alkaline earth metals", "Diagonal relationship"]),
        ],
    },
    "biology": {
        "grade": "Grade 11",
        "units": [
            ("Diversity in Living World", 15, 10, ["Taxonomy", "Five-kingdom classification", "Binomial nomenclature"]),
            ("Structural Organisation in Plants and Animals", 22, 15, ["Plant tissues", "Animal tissues", "Organ systems"]),
            ("Cell: Structure and Function", 20, 15, ["Cell theory", "Prokaryote vs eukaryote", "Organelles", "Cell cycle"]),
            ("Plant Physiology", 25, 18, ["Photosynthesis", "Respiration", "Transpiration", "Plant hormones", "Movement"]),
            ("Human Physiology", 28, 22, ["Digestion", "Circulation", "Excretion", "Neural control", "Locomotion"]),
        ],
    },
    "mathematics": {
        "grade": "Grade 11",
        "units": [
            ("Sets and Functions", 20, 14, ["Sets operations", "Relations", "Functions", "Trigonometric functions"]),
            ("Algebra", 30, 20, ["Complex numbers", "Quadratic equations", "Sequences", "Permutations", "Binomial theorem"]),
            ("Coordinate Geometry", 25, 16, ["Lines", "Conics", "Circle", "Parabola", "Ellipse", "Hyperbola"]),
            ("Calculus", 20, 14, ["Limits", "Derivatives", "Rate of change", "Tangent and normals"]),
            ("Mathematical Reasoning", 10, 6, ["Statements", "Logical connectives", "Converse", "Contrapositive"]),
            ("Statistics and Probability", 20, 10, ["Measures of dispersion", "Probability", "Addition theorem"]),
        ],
    },
    "geography": {
        "grade": "Grade 11",
        "units": [
            ("Physical Geography: The Earth", 15, 10, ["Origin of earth", "Interior of earth", "Rocks and minerals"]),
            ("Landforms and Geomorphology", 20, 14, ["Weathering", "Erosion", "Fluvial landforms", "Coastal landforms"]),
            ("Climate and Atmosphere", 20, 14, ["Insolation", "Temperature", "Pressure belts", "Wind systems", "Monsoon"]),
            ("Water Resources", 15, 10, ["Ocean circulation", "Tides", "River systems", "Groundwater"]),
            ("Human Geography: Population", 15, 10, ["Population distribution", "Density", "Growth rate", "Migration"]),
            ("Economic Geography", 15, 12, ["Agriculture", "Industries", "Trade", "Transport", "Tourism"]),
        ],
    },
}


def make_syllabus_doc(subject: str, data: dict) -> dict:
    doc_id = f"syllabus_{subject}_grade11"
    grade = data["grade"]
    lines = [
        f"{subject.capitalize()} Syllabus — {grade}\n"
        f"Board: CBSE | Academic Year 2025-26 | Total Periods: 180 | Theory Marks: 70 | Practical: 30\n",
        "Unit-wise Allocation\n" + "="*50,
    ]
    for i, (unit_name, periods, marks, topics) in enumerate(data["units"], 1):
        lines.append(
            f"\nUnit {i}: {unit_name}\n"
            f"Periods: {periods}   Marks: {marks}\n"
            f"Topics: {', '.join(topics)}\n"
        )
    total_periods = sum(p for _, p, _, _ in data["units"])
    total_marks = sum(m for _, _, m, _ in data["units"])
    lines.append(
        f"\nTOTAL: Periods = {total_periods} | Theory Marks = {total_marks}\n"
        "\nInternal Assessment: 30 marks\n"
        "  - Periodic Tests (10 marks)\n"
        "  - Practical/Lab Work (15 marks)\n"
        "  - Portfolio/Project (5 marks)\n"
    )
    text = "\n".join(lines)
    return {
        "doc_id": doc_id,
        "text": text,
        "metadata": {
            "subject": subject,
            "grade": "higher_secondary",
            "doc_type": "unknown",
            "source": f"syllabus_{subject}",
        },
    }


def make_syllabus_queries(doc: dict, data: dict) -> list[dict]:
    subject = doc["metadata"]["subject"]
    doc_id = doc["doc_id"]
    queries = []
    for i, (unit_name, periods, marks, topics) in enumerate(data["units"][:6], 1):
        queries.append({
            "query_id": str(uuid.uuid4()),
            "text": f"How many periods and marks are allocated to Unit {i} ({unit_name}) "
                    f"in the {subject} syllabus?",
            "subject": subject, "grade": "higher_secondary",
            "expected_doc_ids": [doc_id], "expected_chunk_ids": [],
            "bloom_level": "remember", "source": doc["metadata"]["source"],
        })
    return queries[:6]


# ─── 4. PAST PAPERS (→ EDUCATIONAL) ──────────────────────────────────────────
# Structural markers: "Q.1", "Section A", marks in parentheses "(N marks)"
# Queries: ask for question content AND mark allocation together

PAST_PAPERS = {
    "physics": {
        "year": 2024,
        "sections": [
            ("A", "Multiple Choice (1 mark each)", [
                ("Q.1", "The SI unit of luminous intensity is:", "candela", 1),
                ("Q.2", "A body is in equilibrium if the vector sum of all forces acting on it is:", "zero", 1),
                ("Q.3", "Which of the following is a scalar quantity?", "Temperature", 1),
                ("Q.4", "The escape velocity from Earth's surface (g=10, R=6400 km) is approximately:", "11.2 km/s", 1),
            ]),
            ("B", "Short Answer (2-3 marks each)", [
                ("Q.5", "State and prove the law of conservation of linear momentum.", "Use Newton's third law; for isolated system total momentum is constant.", 3),
                ("Q.6", "Define terminal velocity. Derive the expression for terminal velocity of a sphere falling through a viscous fluid.", "v_t = 2r²(ρ−σ)g / 9η", 3),
                ("Q.7", "What is the difference between elastic and inelastic collisions? Give one example of each.", "Elastic: KE conserved (billiard balls); Inelastic: KE not fully conserved (clay collision)", 2),
                ("Q.8", "A projectile is fired at 60° with initial velocity 40 m/s. Find the maximum height reached.", "H = u²sin²θ/2g = 1600×0.75/20 = 60 m", 3),
            ]),
            ("C", "Long Answer (5 marks each)", [
                ("Q.9", "Derive the expression for the period of a simple pendulum and state the assumptions made.", "T = 2π√(L/g); assumes small angle, massless string, no air resistance.", 5),
                ("Q.10", "State Bernoulli's theorem. Derive Bernoulli's equation for fluid flow and explain its application in the lift of an aircraft wing.", "P + ½ρv² + ρgh = constant; higher speed above wing → lower pressure → net upward lift.", 5),
            ]),
        ],
    },
    "chemistry": {
        "year": 2024,
        "sections": [
            ("A", "Multiple Choice (1 mark each)", [
                ("Q.1", "The number of moles in 9 g of water is:", "0.5 mol", 1),
                ("Q.2", "The shape of NH₃ molecule according to VSEPR theory is:", "trigonal pyramidal", 1),
                ("Q.3", "Which of the following is the strongest acid?", "HClO₄ (perchloric acid)", 1),
                ("Q.4", "The process of increasing concentration of ore by removing impurities is called:", "beneficiation", 1),
            ]),
            ("B", "Short Answer (2-3 marks each)", [
                ("Q.5", "Explain Le Chatelier's principle. What is the effect of increasing pressure on the reaction N₂ + 3H₂ ⇌ 2NH₃?", "Equilibrium shifts toward fewer moles (toward NH₃); pressure increase favours product side.", 3),
                ("Q.6", "Define Brønsted-Lowry acid and base. Identify conjugate acid-base pairs in: CH₃COOH + H₂O ⇌ CH₃COO⁻ + H₃O⁺.", "Acid: CH₃COOH; Base: H₂O; Conjugate pairs: (CH₃COOH/CH₃COO⁻) and (H₃O⁺/H₂O).", 3),
                ("Q.7", "Calculate the pH of a 0.001 M HCl solution.", "HCl is strong acid; [H⁺]=0.001 M; pH = −log(10⁻³) = 3", 2),
                ("Q.8", "What is the hybridisation of carbon in ethyne (C₂H₂) and what is the bond angle?", "sp hybridisation; bond angle = 180° (linear)", 2),
            ]),
            ("C", "Long Answer (5 marks each)", [
                ("Q.9", "Describe the structure and properties of water. Why does ice float on water?", "Tetrahedral H-bonds; density of ice less than liquid water at 0°C due to open hexagonal lattice.", 5),
                ("Q.10", "Derive the relationship between K_p and K_c for a general reaction aA + bB ⇌ cC + dD.", "K_p = K_c(RT)^Δn where Δn = (c+d)−(a+b)", 5),
            ]),
        ],
    },
    "biology": {
        "year": 2024,
        "sections": [
            ("A", "Multiple Choice (1 mark each)", [
                ("Q.1", "Which organelle is called the powerhouse of the cell?", "Mitochondria", 1),
                ("Q.2", "The fluid mosaic model of cell membrane was proposed by:", "Singer and Nicolson (1972)", 1),
                ("Q.3", "Which of the following is the product of light reaction in photosynthesis?", "ATP, NADPH, and O₂", 1),
                ("Q.4", "The functional unit of kidney is:", "Nephron", 1),
            ]),
            ("B", "Short Answer (2-3 marks each)", [
                ("Q.5", "Explain the structure of a chloroplast and its role in photosynthesis.", "Thylakoid: light reaction; Stroma: dark reaction (Calvin cycle); Double membrane: protection.", 3),
                ("Q.6", "What is transpiration? List three factors that affect the rate of transpiration.", "Loss of water vapour from plant; Factors: temperature, humidity, wind speed, light intensity.", 3),
                ("Q.7", "Describe the sliding filament theory of muscle contraction.", "Actin filaments slide over myosin; ATP hydrolysis powers cross-bridge cycling; sarcomere shortens.", 3),
                ("Q.8", "What is the difference between aerobic and anaerobic respiration? Give the net ATP yield for each.", "Aerobic: 38 ATP, produces CO₂ + H₂O; Anaerobic: 2 ATP, produces lactate or ethanol.", 2),
            ]),
            ("C", "Long Answer (5 marks each)", [
                ("Q.9", "Describe the process of photosynthesis including both the light-dependent and light-independent reactions.", "Light reaction: photolysis of water, electron transport, ATP/NADPH; Dark (Calvin cycle): CO₂ fixation, G3P.", 5),
                ("Q.10", "Explain the mechanism of urine formation in the human kidney (filtration, reabsorption, secretion).", "Glomerular filtration → tubular reabsorption (glucose, water, ions) → secretion (H⁺, K⁺) → concentrated urine.", 5),
            ]),
        ],
    },
    "mathematics": {
        "year": 2024,
        "sections": [
            ("A", "Multiple Choice (1 mark each)", [
                ("Q.1", "The value of sin(π/6) is:", "1/2", 1),
                ("Q.2", "If f(x) = x², then f'(3) is:", "6", 1),
                ("Q.3", "The number of terms in the expansion of (1+x)¹⁰ is:", "11", 1),
                ("Q.4", "The sum of the first 20 natural numbers is:", "210", 1),
            ]),
            ("B", "Short Answer (2-3 marks each)", [
                ("Q.5", "Find the derivative of f(x) = x³ sin x using the product rule.", "f'(x) = 3x²sinx + x³cosx", 2),
                ("Q.6", "Find the equation of the circle passing through (0,0), (5,0), and (0,3).", "x² + y² − 5x − 3y = 0; centre (5/2, 3/2); radius = √(34)/2", 3),
                ("Q.7", "Prove that cos(A+B) = cosA cosB − sinA sinB using compound angle formula.", "Use unit circle or addition formula derivation; result: cosA cosB − sinA sinB.", 3),
                ("Q.8", "Evaluate ∫(2x + 3)⁵ dx using substitution.", "Let u = 2x+3; du = 2dx; ∫u⁵·(du/2) = u⁶/12 = (2x+3)⁶/12 + C", 3),
            ]),
            ("C", "Long Answer (5 marks each)", [
                ("Q.9", "Using mathematical induction, prove that 1 + 2 + 3 + ... + n = n(n+1)/2.", "Base: n=1 true. Step: assume true for k; show true for k+1. Add (k+1) to both sides.", 5),
                ("Q.10", "Find the maxima and minima of f(x) = 2x³ − 15x² + 36x − 10 and determine the nature of each.", "f'=6x²−30x+36=6(x²−5x+6)=6(x−2)(x−3); Max at x=2: f(2)=18; Min at x=3: f(3)=17.", 5),
            ]),
        ],
    },
    "geography": {
        "year": 2024,
        "sections": [
            ("A", "Multiple Choice (1 mark each)", [
                ("Q.1", "The term 'demographic transition' refers to:", "shift from high birth/death rates to low birth/death rates", 1),
                ("Q.2", "The Tropic of Cancer passes through which Indian state?", "Rajasthan, Gujarat, MP, Chhattisgarh, Jharkhand, West Bengal, Tripura, Mizoram", 1),
                ("Q.3", "A delta forms when:", "river velocity decreases suddenly at the mouth, depositing sediment", 1),
                ("Q.4", "The Western Ghats receive heavy rainfall on the windward side because of:", "orographic effect of the SW monsoon winds", 1),
            ]),
            ("B", "Short Answer (2-3 marks each)", [
                ("Q.5", "Explain the mechanism of the Indian SW Monsoon with the role of the ITCZ.", "Low pressure over India due to heating; ITCZ shifts north; moist SW winds; June–Sept rainfall.", 3),
                ("Q.6", "Distinguish between corrasion and corrosion as river erosion processes.", "Corrasion: mechanical grinding by sediment; Corrosion: chemical dissolution of rock (e.g., limestone).", 2),
                ("Q.7", "What are the three types of deltas with examples?", "Arcuate (Nile), Bird's foot (Mississippi), Cuspate (Ebro); each has different wave-river interaction.", 3),
                ("Q.8", "Define population density. Compare arithmetic and physiological density.", "Arithmetic: total population/total area; Physiological: population/cultivable area — shows pressure on farmland.", 2),
            ]),
            ("C", "Long Answer (5 marks each)", [
                ("Q.9", "Describe the formation and types of glacial landforms with diagrams.", "Erosional: cirque, arête, U-valley, horn; Depositional: moraine types, drumlin, esker, erratic.", 5),
                ("Q.10", "Explain the concept of sustainable development in the context of natural resource management.", "Meeting current needs without compromising future generations; Brundtland definition; conserve soil, water, forests.", 5),
            ]),
        ],
    },
}


def make_past_paper_doc(subject: str, pp: dict) -> dict:
    doc_id = f"past_paper_{subject}_{pp['year']}"
    lines = [
        f"{subject.capitalize()} — Board Examination {pp['year']}\n"
        f"Time Allowed: 3 Hours          Maximum Marks: 70\n"
        f"General Instructions: All questions are compulsory. Marks are indicated in brackets.\n"
    ]
    for sec, sec_title, questions in pp["sections"]:
        lines.append(f"\nSection {sec}: {sec_title}\n")
        for qnum, qtext, answer_hint, marks in questions:
            lines.append(
                f"{qnum}. {qtext}\n"
                f"   [Expected: {answer_hint}]  ({marks} mark{'s' if marks > 1 else ''})\n"
            )
    text = "\n".join(lines)
    return {
        "doc_id": doc_id,
        "text": text,
        "metadata": {
            "subject": subject,
            "grade": "higher_secondary",
            "doc_type": "unknown",
            "source": f"past_paper_{subject}",
        },
    }


def make_past_paper_queries(doc: dict, pp: dict) -> list[dict]:
    subject = doc["metadata"]["subject"]
    doc_id = doc["doc_id"]
    queries = []
    # Flatten all questions
    all_qs = [(qnum, qtext, ans, marks, sec)
              for sec, _, qs in pp["sections"]
              for qnum, qtext, ans, marks in qs]
    for qnum, qtext, ans, marks, sec in all_qs[:6]:
        queries.append({
            "query_id": str(uuid.uuid4()),
            "text": f"In Section {sec} of the {pp['year']} {subject} past paper, "
                    f"what does {qnum} ask and how many marks is it worth?",
            "subject": subject, "grade": "higher_secondary",
            "expected_doc_ids": [doc_id], "expected_chunk_ids": [],
            "bloom_level": "remember", "source": doc["metadata"]["source"],
        })
    return queries


# ─── 5. REFERENCE MATERIAL (→ SEMANTIC) ─────────────────────────────────────
# Structural markers: "Appendix", "Bibliography", "DOI:", "ISBN:", "et al."
# Queries: target specific definitions/concepts in dense reference sections

REFERENCE_MATERIAL = {
    "physics": {
        "title": "Physics Reference: Mechanics and Waves",
        "clusters": [
            ("Kinematics Reference", [
                ("Displacement", "Vector quantity; change in position from initial to final point. SI unit: metre (m). Differs from distance (scalar, path length)."),
                ("Velocity", "Rate of change of displacement. v = Δx/Δt. Instantaneous velocity v = dx/dt. SI unit: m/s."),
                ("Acceleration", "Rate of change of velocity. a = Δv/Δt. Instantaneous a = d²x/dt². SI unit: m/s²."),
                ("Equations of Motion (constant a)", "v = u + at;  s = ut + ½at²;  v² = u² + 2as;  s_n = u + a(2n−1)/2."),
            ]),
            ("Newton's Laws Reference", [
                ("First Law (Inertia)", "A body stays at rest or moves uniformly in a straight line unless a net external force acts. Inertia ∝ mass."),
                ("Second Law", "F_net = ma (vector equation). In component form: ΣF_x = ma_x, ΣF_y = ma_y."),
                ("Third Law", "F_AB = −F_BA. Action-reaction pairs act on different bodies; always equal in magnitude, opposite in direction."),
                ("Friction", "Static: f_s ≤ μ_s N. Kinetic: f_k = μ_k N. Rolling friction < kinetic < static. Angle of friction: tan φ = μ_s."),
            ]),
            ("Wave Mechanics Reference", [
                ("Wave Equation", "y(x,t) = A sin(kx − ωt + φ); A = amplitude, k = 2π/λ wave number, ω = 2πf angular frequency."),
                ("Wave Speed", "v = λf = ω/k. For transverse waves on string: v = √(T/μ). For longitudinal: v = √(B/ρ)."),
                ("Superposition", "When two waves overlap: y = y₁ + y₂ (vector addition). Constructive interference when path diff = nλ."),
                ("Standing Waves", "String fixed both ends: λ_n = 2L/n; f_n = nv/2L. Node: zero amplitude; Antinode: max amplitude."),
            ]),
            ("Constants and Formulae", [
                ("Gravitational constant", "G = 6.674 × 10⁻¹¹ N·m²/kg²."),
                ("Acceleration due to gravity", "g = 9.8 m/s² (standard); varies from 9.78 (equator) to 9.83 (poles)."),
                ("Speed of light", "c = 3 × 10⁸ m/s in vacuum."),
                ("Planck's constant", "h = 6.626 × 10⁻³⁴ J·s."),
            ]),
        ],
        "references": [
            ("Halliday, D., Resnick, R., & Walker, J. (2014)", "Fundamentals of Physics (10th ed.). Wiley. ISBN 978-1-118-23072-5."),
            ("Irodov, I. E. (1988)", "Problems in General Physics. Mir Publishers. ISBN 0-8285-0468-5."),
        ],
    },
    "chemistry": {
        "title": "Chemistry Reference: Thermodynamics and Equilibrium",
        "clusters": [
            ("Thermodynamics Reference", [
                ("Enthalpy (H)", "H = U + PV. ΔH = q_p (heat at constant pressure). ΔH < 0: exothermic; ΔH > 0: endothermic."),
                ("Entropy (S)", "Measure of disorder/randomness. ΔS_universe = ΔS_system + ΔS_surroundings ≥ 0 (second law)."),
                ("Gibbs Free Energy", "G = H − TS. ΔG = ΔH − TΔS. Spontaneous if ΔG < 0; equilibrium at ΔG = 0."),
                ("Hess's Law", "ΔH for a reaction = sum of ΔH for each step. Path independent (state function)."),
            ]),
            ("Chemical Equilibrium Reference", [
                ("Law of Mass Action", "K_c = [C]^c[D]^d / [A]^a[B]^b for aA + bB ⇌ cC + dD at equilibrium."),
                ("K_p and K_c Relationship", "K_p = K_c(RT)^Δn where Δn = moles gas product − moles gas reactant. R = 8.314 J/(mol·K)."),
                ("Le Chatelier's Principle", "If equilibrium is disturbed, system shifts to partially counteract the disturbance."),
                ("Van't Hoff Equation", "d(ln K)/dT = ΔH°/RT². Rearranged: ln(K₂/K₁) = −(ΔH°/R)(1/T₂ − 1/T₁)."),
            ]),
            ("Acids and Bases Reference", [
                ("pH Definition", "pH = −log₁₀[H⁺]. pOH = −log₁₀[OH⁻]. At 25°C: pH + pOH = 14."),
                ("Ka and Kb", "Ka = [H⁺][A⁻]/[HA] (acid dissociation). Kb = [BH⁺][OH⁻]/[B]. Ka × Kb = Kw = 10⁻¹⁴."),
                ("Henderson-Hasselbalch", "pH = pKa + log([A⁻]/[HA]). Buffer range: pKa ± 1."),
                ("Solubility Product", "K_sp = [M^m⁺]^m[X^x⁻]^x for MₘXₓ(s) ⇌ mM^m⁺ + xX^x⁻."),
            ]),
            ("Constants and Data", [
                ("Avogadro's number", "N_A = 6.022 × 10²³ mol⁻¹."),
                ("Universal gas constant", "R = 8.314 J/(mol·K) = 0.0821 L·atm/(mol·K)."),
                ("Faraday's constant", "F = 96,485 C/mol."),
                ("Standard temperature", "STP: 0°C (273.15 K), 1 atm. SATP: 25°C (298.15 K), 1 bar."),
            ]),
        ],
        "references": [
            ("Atkins, P. & de Paula, J. (2014)", "Physical Chemistry (10th ed.). Oxford University Press. ISBN 978-0-19-871001-9."),
            ("Chang, R. & Goldsby, K. (2016)", "Chemistry (12th ed.). McGraw-Hill. ISBN 978-0-07-802151-0."),
        ],
    },
    "biology": {
        "title": "Biology Reference: Cell Biology and Genetics",
        "clusters": [
            ("Cell Structure Reference", [
                ("Plasma Membrane", "Phospholipid bilayer with embedded proteins (fluid mosaic model, Singer & Nicolson, 1972). Selectively permeable."),
                ("Mitochondria", "Site of aerobic respiration (Krebs cycle + ETC). Double membrane: outer smooth, inner folded (cristae). Matrix contains DNA and ribosomes."),
                ("Chloroplast", "Site of photosynthesis. Thylakoids (grana) for light reactions; stroma for Calvin cycle. Contain chlorophyll a and b."),
                ("Nucleus", "Control centre. Contains chromatin (DNA + proteins). Nuclear envelope with pores. Nucleolus: ribosome synthesis site."),
            ]),
            ("Cell Division Reference", [
                ("Mitosis", "Somatic cell division: PMAT. Produces 2 diploid (2n) daughter cells. Significance: growth, repair."),
                ("Meiosis", "Reproductive cell division: 2 divisions → 4 haploid (n) cells. Crossing over in Prophase I increases genetic variation."),
                ("Checkpoints", "G1/S checkpoint: DNA damage check. G2/M checkpoint: DNA replication complete check. Spindle assembly checkpoint: all chromosomes attached."),
                ("Ploidy", "Haploid (n): one set of chromosomes. Diploid (2n): two homologous sets. Human: 2n = 46 (23 pairs)."),
            ]),
            ("Genetics Reference", [
                ("Hardy-Weinberg", "p² + 2pq + q² = 1; p + q = 1. Conditions: large population, random mating, no selection/mutation/migration."),
                ("DNA Structure", "Double helix: sugar-phosphate backbone; base pairs A-T (2 H-bonds), G-C (3 H-bonds). Antiparallel strands: 5'→3' and 3'→5'."),
                ("Lac Operon", "E. coli regulatory system. Repressor (lacI) blocks transcription when lactose absent. Inducer (allolactose) removes repressor."),
                ("Mendel's Laws", "Law of Segregation: alleles separate during meiosis (3:1 ratio). Law of Independent Assortment: genes on different chromosomes assort independently (9:3:3:1 ratio)."),
            ]),
            ("Key Values and References", [
                ("Human chromosome number", "2n = 46 (23 pairs); Gametes: n = 23."),
                ("Chlorophyll absorption peaks", "Chlorophyll a: 430 nm (blue) and 662 nm (red). Chlorophyll b: 453 nm and 642 nm."),
            ]),
        ],
        "references": [
            ("Alberts, B. et al. (2015)", "Molecular Biology of the Cell (6th ed.). Garland Science. ISBN 978-0-8153-4464-3."),
            ("Campbell, N.A. et al. (2017)", "Biology: A Global Approach (11th ed.). Pearson. ISBN 978-1-292-17000-6."),
        ],
    },
    "mathematics": {
        "title": "Mathematics Reference: Calculus and Algebra",
        "clusters": [
            ("Differentiation Formulae", [
                ("Power Rule", "d/dx(xⁿ) = nxⁿ⁻¹ for all real n."),
                ("Trigonometric", "d/dx(sin x) = cos x; d/dx(cos x) = −sin x; d/dx(tan x) = sec²x; d/dx(sec x) = sec x tan x."),
                ("Exponential and Log", "d/dx(eˣ) = eˣ; d/dx(aˣ) = aˣ ln a; d/dx(ln x) = 1/x; d/dx(log_a x) = 1/(x ln a)."),
                ("Composite Functions", "Chain rule: d/dx[f(g(x))] = f'(g(x))·g'(x). Apply 'outside-in' for nested composites."),
            ]),
            ("Integration Formulae", [
                ("Indefinite Integrals", "∫xⁿdx = xⁿ⁺¹/(n+1) + C (n ≠ −1); ∫1/x dx = ln|x| + C; ∫eˣdx = eˣ + C."),
                ("Trig Integrals", "∫sin x dx = −cos x + C; ∫cos x dx = sin x + C; ∫sec²x dx = tan x + C."),
                ("Integration by Parts", "∫u dv = uv − ∫v du. LIATE: Logarithm, Inverse trig, Algebraic, Trig, Exponential (u-selection priority)."),
                ("Definite Integral", "∫_a^b f(x)dx = F(b) − F(a). Signed area under curve from a to b."),
            ]),
            ("Algebra Reference", [
                ("Binomial Theorem", "(a+b)ⁿ = Σ C(n,r) aⁿ⁻ʳ bʳ for r=0 to n. General term: T_{r+1} = C(n,r) aⁿ⁻ʳ bʳ."),
                ("Sequences", "AP: aₙ = a + (n−1)d; S_n = n/2(2a + (n−1)d). GP: aₙ = arⁿ⁻¹; S_n = a(rⁿ−1)/(r−1)."),
                ("Complex Numbers", "i² = −1. |z| = √(a²+b²). Argument: θ = arctan(b/a). Euler: e^{iθ} = cos θ + i sin θ."),
                ("Matrices", "det(2×2): |a b; c d| = ad − bc. Inverse: A⁻¹ = (1/det A) × adj A."),
            ]),
            ("Mathematical Constants", [
                ("π", "π = 3.14159… Circumference = 2πr; Area = πr²."),
                ("e", "e = 2.71828… Natural exponential base. ln e = 1."),
                ("Euler's identity", "e^{iπ} + 1 = 0 (combines e, i, π, 1, 0)."),
            ]),
        ],
        "references": [
            ("Stewart, J. (2015)", "Calculus: Early Transcendentals (8th ed.). Cengage. ISBN 978-1-285-74155-0."),
            ("Artin, M. (2011)", "Algebra (2nd ed.). Pearson. ISBN 978-0-13-241377-0."),
        ],
    },
    "geography": {
        "title": "Geography Reference: Physical Geography",
        "clusters": [
            ("Landform Processes Reference", [
                ("Weathering Rate Factors", "Temperature, rainfall, rock type, vegetation cover. Chemical weathering fastest in tropical humid climates."),
                ("River Erosion Processes", "Hydraulic action: water pressure force. Abrasion: sediment-on-rock grinding. Attrition: sediment-on-sediment rounding. Solution: chemical dissolution (carbonation of limestone)."),
                ("Hjulström Curve", "Shows velocity required to erode, transport, and deposit sediment of different sizes. Clay: paradoxically requires high velocity to erode due to cohesion."),
                ("Glacial Budget", "Mass balance: accumulation (snowfall) vs ablation (melting). If accumulation > ablation: glacier advances. ELA: equilibrium line altitude."),
            ]),
            ("Climate Reference", [
                ("Lapse Rate", "Environmental lapse rate (ELR): 6.5°C/km. Dry adiabatic lapse rate (DALR): 10°C/km. Saturated adiabatic (SALR): 6°C/km (varies)."),
                ("Coriolis Parameter", "f = 2Ω sin φ where Ω = 7.27×10⁻⁵ rad/s, φ = latitude. Zero at equator, maximum at poles."),
                ("Humidity", "Relative humidity = (actual vapour pressure / saturated vapour pressure) × 100%. Dew point: temperature at which RH = 100%."),
                ("Köppen Classification", "A: Tropical (humid); B: Dry (arid/semi-arid); C: Temperate; D: Continental; E: Polar. Subdivisions by seasonal rainfall and temp."),
            ]),
            ("Population Geography Reference", [
                ("Demographic Transition Model", "Stage 1: High BR + High DR. Stage 2: High BR + Falling DR (rapid growth). Stage 3: Falling BR + Low DR. Stage 4: Low BR + Low DR."),
                ("Population Density Types", "Arithmetic: total pop/total area. Physiological: pop/arable land. Agricultural: farming pop/arable land."),
                ("Migration Types", "Push factors: poverty, conflict, drought. Pull factors: employment, education, safety. Voluntary vs forced; internal vs international."),
                ("Malthus vs Boserup", "Malthus: population grows exponentially, food arithmetically → famine. Boserup: population pressure stimulates agricultural innovation."),
            ]),
            ("Appendix: Key Data", [
                ("Earth dimensions", "Equatorial radius: 6,378 km. Polar radius: 6,357 km. Mean radius: 6,371 km."),
                ("Ocean depths", "Pacific: 10,924 m (Mariana Trench). Atlantic: 8,376 m. Indian: 7,258 m."),
                ("River lengths", "Nile: 6,650 km. Amazon: 6,400 km. Ganga: 2,525 km."),
            ]),
        ],
        "references": [
            ("Strahler, A.N. & Strahler, A.H. (2005)", "Physical Geography: Science and Systems of the Human Environment. Wiley. ISBN 978-0-471-48053-7."),
            ("Goudie, A.S. (2004)", "Encyclopedia of Geomorphology. Routledge. DOI: 10.4324/9780203381137."),
        ],
    },
}


def make_reference_doc(subject: str, ref_info: dict) -> dict:
    doc_id = f"reference_{subject}_{ref_info['title'].split(':')[-1].strip().lower().replace(' ', '_')}"
    lines = [
        f"{ref_info['title']}\n"
        f"Subject: {subject.capitalize()}  |  Appendix Reference\n"
        f"{'='*60}\n"
    ]
    for cluster_name, entries in ref_info["clusters"]:
        lines.append(f"\n{cluster_name}\n{'-'*40}")
        for term, definition in entries:
            lines.append(f"{term}: {definition}")
    lines.append("\n\nBibliography\n" + "-"*40)
    for authors, citation in ref_info["references"]:
        lines.append(f"{authors}: {citation}")
    text = "\n".join(lines)
    return {
        "doc_id": doc_id,
        "text": text,
        "metadata": {
            "subject": subject,
            "grade": "higher_secondary",
            "doc_type": "unknown",
            "source": f"reference_{subject}",
        },
    }


def make_reference_queries(doc: dict, ref_info: dict) -> list[dict]:
    subject = doc["metadata"]["subject"]
    doc_id = doc["doc_id"]
    queries = []
    for cluster_name, entries in ref_info["clusters"][:3]:
        for term, defn in entries[:2]:
            queries.append({
                "query_id": str(uuid.uuid4()),
                "text": f"What is the definition of '{term}' in the {subject} reference material "
                        f"and what formula or value is given?",
                "subject": subject, "grade": "higher_secondary",
                "expected_doc_ids": [doc_id], "expected_chunk_ids": [],
                "bloom_level": "remember", "source": doc["metadata"]["source"],
            })
            if len(queries) >= 6:
                return queries
    return queries


# ─── LECTURE NOTE QUERIES (from LECTURE_TOPICS dict) ─────────────────────────

def make_lecture_queries(doc: dict, lecture_info: dict) -> list[dict]:
    subject = doc["metadata"]["subject"]
    doc_id = doc["doc_id"]
    return [
        {
            "query_id": str(uuid.uuid4()),
            "text": q_text,
            "subject": subject,
            "grade": "higher_secondary",
            "expected_doc_ids": [doc_id],
            "expected_chunk_ids": [],
            "bloom_level": "understand",
            "source": doc["metadata"]["source"],
        }
        for q_text, _ in lecture_info["queries"]
    ]


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    documents: list[dict] = []
    queries:   list[dict] = []

    # 1. Lecture notes (10 docs)
    for subject, lectures in LECTURE_TOPICS.items():
        for lecture_info in lectures:
            doc = make_lecture_notes_doc(subject, lecture_info)
            documents.append(doc)
            queries.extend(make_lecture_queries(doc, lecture_info))

    # 2. Worked examples (5 docs)
    for subject, ex_info in WORKED_EXAMPLES.items():
        doc = make_worked_example_doc(subject, ex_info)
        documents.append(doc)
        queries.extend(make_worked_example_queries(doc, ex_info))

    # 3. Syllabuses (5 docs)
    for subject, syl_data in SYLLABUS_DATA.items():
        doc = make_syllabus_doc(subject, syl_data)
        documents.append(doc)
        queries.extend(make_syllabus_queries(doc, syl_data))

    # 4. Past papers (5 docs)
    for subject, pp in PAST_PAPERS.items():
        doc = make_past_paper_doc(subject, pp)
        documents.append(doc)
        queries.extend(make_past_paper_queries(doc, pp))

    # 5. Reference material (5 docs)
    for subject, ref_info in REFERENCE_MATERIAL.items():
        doc = make_reference_doc(subject, ref_info)
        documents.append(doc)
        queries.extend(make_reference_queries(doc, ref_info))

    # ── Verify unique doc_ids ──
    ids = [d["doc_id"] for d in documents]
    assert len(ids) == len(set(ids)), f"Duplicate doc_ids: {[i for i in ids if ids.count(i) > 1]}"

    # ── Write outputs ──
    OUT_CORPUS.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_CORPUS, "w") as f:
        for doc in documents:
            f.write(json.dumps(doc) + "\n")

    with open(OUT_BENCHMARK, "w") as f:
        for q in queries:
            f.write(json.dumps(q) + "\n")

    # ── Stats ──
    doc_types = {}
    for d in documents:
        src = d["metadata"]["source"]
        for prefix in ("lecture_notes", "worked_examples", "syllabus", "past_paper", "reference"):
            if src.startswith(prefix):
                doc_types[prefix] = doc_types.get(prefix, 0) + 1
                break

    avg_chars = sum(len(d["text"]) for d in documents) / len(documents)

    print("✅ Heterogeneous corpus generated (v2 — concept-targeted queries)")
    print(f"   Documents   : {len(documents)}")
    print(f"   Queries     : {len(queries)}")
    print(f"   Avg doc size: {avg_chars:.0f} chars")
    print(f"\nDocument type distribution:")
    for t, n in doc_types.items():
        arrow = {"lecture_notes": "→ recursive", "worked_examples": "→ educational",
                 "syllabus": "→ fixed", "past_paper": "→ educational",
                 "reference": "→ semantic"}.get(t, "")
        print(f"   {n:3}  {t} ({arrow})")
    print(f"\nSaved to:\n   {OUT_CORPUS}\n   {OUT_BENCHMARK}")


if __name__ == "__main__":
    main()
