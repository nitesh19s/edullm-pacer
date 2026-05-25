"""
patch_worked_examples.py
========================
Replaces the worked_examples_* documents in hetero_corpus.jsonl with
longer, more detailed versions (2,500–3,000 chars each, ~8,000 chars per doc).

KEY DESIGN CONSTRAINT:
  Each individual example MUST exceed chunk_size=2000 chars so that:
    - Educational chunker (max_unit_chars=4000) → keeps each example as ONE unit
    - Hybrid chunker (chunk_size=2000)           → sub-splits each example into 2 chunks
  This creates a measurable retrieval difference on queries that target
  BOTH the setup/procedure AND the final numerical answer.

Run after gen_hetero_corpus.py:
    backend/.venv/bin/python scripts/patch_worked_examples.py
"""
from __future__ import annotations
import json, uuid
from pathlib import Path

ROOT          = Path(__file__).parents[1]
CORPUS_PATH   = ROOT / "data" / "processed" / "hetero_corpus.jsonl"
BENCH_PATH    = ROOT / "data" / "processed" / "hetero_benchmark.jsonl"

# ─── DETAILED WORKED EXAMPLES ─────────────────────────────────────────────────
# Each example is ~2,500–3,000 chars so educational chunks it as ONE unit but
# hybrid/fixed (chunk_size=2000) must split it mid-example.

DETAILED_EXAMPLES: dict[str, dict] = {

"worked_examples_physics": {
  "text": """Worked Examples: Kinematics, Dynamics, and Momentum Problems
Subject: Physics  |  Grade: Higher Secondary

Example 1: Projectile Motion — Ball Launched from a Cliff
Given: A ball is launched horizontally from the edge of a cliff of height 80 m with an initial horizontal velocity u_x = 25 m/s. Assume no air resistance and take g = 10 m/s² acting vertically downward. The ground below is flat.
Find: (a) Time of flight T, (b) Horizontal range R, (c) Velocity of the ball just before it hits the ground (magnitude and direction).
Step 1 — Identify independent motions: Horizontal motion is uniform (no horizontal acceleration). Vertical motion is free fall from rest. These two components are completely independent of each other.
Step 2 — Time of flight from vertical motion: Using s = ut + ½at² for vertical direction with u_y = 0 (launched horizontally), a = g = 10 m/s², and s = 80 m (downward). So: 80 = 0 × T + ½ × 10 × T² → 80 = 5T² → T² = 16 → T = 4 s.
Step 3 — Horizontal range: x = u_x × T = 25 × 4 = 100 m. The ball lands 100 m from the base of the cliff.
Step 4 — Final vertical velocity: v_y = u_y + gT = 0 + 10 × 4 = 40 m/s (downward). The horizontal velocity remains unchanged: v_x = u_x = 25 m/s (horizontal).
Step 5 — Resultant velocity: magnitude |v| = √(v_x² + v_y²) = √(625 + 1600) = √2225 ≈ 47.2 m/s. Direction: θ = arctan(v_y/v_x) = arctan(40/25) = arctan(1.6) ≈ 58.0° below the horizontal.
Step 6 — Verification using energy: KE gained = ½m|v|² − ½m|u|² = ½m(2225 − 625) = ½m × 1600 = 800m J. PE lost = mgh = m × 10 × 80 = 800m J. ✓ Energy is conserved.
Answer: Time of flight T = 4 s; Horizontal range R = 100 m; Impact speed ≈ 47.2 m/s at 58° below the horizontal.
Common mistake: Students often forget that u_y = 0 for a horizontal launch (not u_y = u_x). Always separate horizontal and vertical components first.

Example 2: Newton's Second Law with an Inclined Plane
Given: A 5 kg block rests on an inclined plane at angle θ = 30° to the horizontal. The coefficient of kinetic friction between the block and the plane is μ_k = 0.20. The block is given a push and slides DOWN the incline. Take g = 10 m/s².
Find: (a) Normal reaction force N, (b) Friction force f (direction and magnitude), (c) Net force down the incline, (d) Acceleration of the block.
Step 1 — Set up coordinates: x-axis along the incline (positive down the slope), y-axis perpendicular to the incline.
Step 2 — Resolve weight: Component along incline (down): mg sin30° = 5 × 10 × 0.5 = 25 N. Component perpendicular (into surface): mg cos30° = 5 × 10 × (√3/2) ≈ 43.3 N.
Step 3 — Normal force from y-equilibrium: N = mg cos30° ≈ 43.3 N (the block does not accelerate perpendicular to the incline).
Step 4 — Kinetic friction force: Since the block slides DOWN, friction acts UP the incline. f = μ_k × N = 0.20 × 43.3 = 8.66 N (up the incline).
Step 5 — Net force along incline: F_net = mg sin30° − f = 25 − 8.66 = 16.34 N (down the incline). The block accelerates down.
Step 6 — Acceleration: a = F_net / m = 16.34 / 5 = 3.27 m/s² (down the incline).
Step 7 — Check limiting case: if μ_k were 0.58 (= tan30°), friction would exactly balance gravity component → a = 0 (uniform motion). For μ_k > tan30°, the block would decelerate.
Answer: N = 43.3 N; Friction = 8.66 N (up the slope); Net force = 16.34 N; Acceleration = 3.27 m/s² down the incline.

Example 3: Conservation of Momentum in a Two-Body Collision
Given: A 4 kg cart A moving at 6 m/s east collides with a stationary 2 kg cart B on a frictionless track. After the collision, cart A moves at 2 m/s east.
Find: (a) Velocity of cart B after the collision, (b) Whether the collision is elastic or inelastic, (c) If inelastic, how much kinetic energy was lost.
Step 1 — Apply conservation of linear momentum (isolated system, frictionless track): p_initial = p_final → m_A u_A + m_B u_B = m_A v_A + m_B v_B → (4)(6) + (2)(0) = (4)(2) + (2)v_B → 24 = 8 + 2v_B → 2v_B = 16 → v_B = 8 m/s east.
Step 2 — Calculate initial kinetic energy: KE_i = ½m_A u_A² + ½m_B u_B² = ½(4)(36) + 0 = 72 J.
Step 3 — Calculate final kinetic energy: KE_f = ½(4)(4) + ½(2)(64) = 8 + 64 = 72 J.
Step 4 — Compare kinetic energies: KE_i = KE_f = 72 J. Since kinetic energy IS conserved, the collision is ELASTIC.
Step 5 — Verify using elastic collision condition: For elastic collision, e = 1 (coefficient of restitution). e = (v_B − v_A)/(u_A − u_B) = (8 − 2)/(6 − 0) = 6/6 = 1. ✓ Confirmed elastic.
Step 6 — Physical interpretation: In an elastic collision between unequal masses, the lighter body moves faster after collision. Here cart B (2 kg) moves at 8 m/s, much faster than cart A (4 kg) at 2 m/s.
Answer: v_B = 8 m/s east. The collision IS elastic (KE conserved at 72 J, e = 1). No kinetic energy was lost.
""",
  "queries": [
      ("In Example 1 on Projectile Motion, what are the step-by-step calculations "
       "for time of flight, range, and the impact velocity direction?",),
      ("In Example 2 about the inclined plane problem, what are the normal force, "
       "friction force, and final acceleration of the block sliding down?",),
      ("In Example 3 on Conservation of Momentum, what is cart B's velocity "
       "and how is it determined whether the collision is elastic or not?",),
      ("For Example 2, what formula is used in Step 3 to find the normal force "
       "and what is the final numerical value?",),
      ("In Example 1 of the physics worked examples, what verification method "
       "confirms the impact speed calculation in Step 6?",),
      ("Example 3 of the physics worked problems: what is the coefficient of restitution "
       "and what does its value of 1 confirm about the type of collision?",),
  ],
},

"worked_examples_chemistry": {
  "text": """Worked Examples: Equilibrium and Electrochemistry Problems
Subject: Chemistry  |  Grade: Higher Secondary

Example 1: ICE Table for Equilibrium Constant
Given: For the reaction PCl₅(g) ⇌ PCl₃(g) + Cl₂(g), initially 2.0 mol of PCl₅ is placed in a 1.0 L flask. At equilibrium, 0.8 mol of PCl₅ remains. Temperature is constant at 500 K.
Find: (a) Moles of PCl₃ and Cl₂ at equilibrium, (b) K_c and K_p for the reaction.
Step 1 — Set up the ICE table (Initial, Change, Equilibrium in mol/L since V = 1 L):
  Species:       PCl₅    PCl₃    Cl₂
  Initial (M):   2.0     0.0     0.0
  Change (M):   −x      +x      +x
  Equilibrium:  2.0−x   x       x
Step 2 — Use equilibrium data to find x: at equilibrium, [PCl₅] = 0.8 mol/L, so 2.0 − x = 0.8 → x = 1.2 mol/L. Therefore [PCl₃] = [Cl₂] = x = 1.2 M.
Step 3 — Calculate K_c: K_c = [PCl₃][Cl₂]/[PCl₅] = (1.2)(1.2)/(0.8) = 1.44/0.8 = 1.80 M.
Step 4 — Calculate K_p from K_c: K_p = K_c(RT)^Δn. Here Δn = (1+1) − 1 = +1. R = 0.0821 L·atm/(mol·K), T = 500 K. So K_p = 1.80 × (0.0821 × 500)^1 = 1.80 × 41.05 = 73.9 atm.
Step 5 — Check direction of equilibrium: Since K_c = 1.80 > 1, equilibrium lies toward products (PCl₃ and Cl₂). The dissociation of PCl₅ is significant (60% dissociated from initial 2.0 mol → 0.8 mol remaining).
Step 6 — Calculate degree of dissociation: α = x / initial moles = 1.2 / 2.0 = 0.60, meaning 60% of PCl₅ dissociates.
Answer: [PCl₃] = [Cl₂] = 1.2 M; K_c = 1.80 M; K_p = 73.9 atm; Degree of dissociation α = 0.60 (60%).
Common mistake: Students often forget to use molarity (mol/L) not moles in K_c expression. Since V = 1 L here, moles = molarity, but always divide by volume in general.

Example 2: pH Calculation for a Buffer Solution
Given: A buffer is prepared by mixing 100 mL of 0.20 M acetic acid (CH₃COOH) and 150 mL of 0.15 M sodium acetate (CH₃COONa). Ka of acetic acid = 1.8 × 10⁻⁵ at 25°C. After mixing, 5 mL of 1.0 M NaOH is added to this buffer.
Find: (a) pH of the buffer before NaOH addition, (b) pH after NaOH addition, (c) change in pH.
Step 1 — Calculate moles before mixing: moles CH₃COOH = 0.100 L × 0.20 M = 0.020 mol. moles CH₃COO⁻ = 0.150 L × 0.15 M = 0.0225 mol.
Step 2 — pH before NaOH using Henderson-Hasselbalch: pKa = −log(1.8×10⁻⁵) = −log(1.8) − log(10⁻⁵) = −0.255 + 5 = 4.745. pH = pKa + log([A⁻]/[HA]) = 4.745 + log(0.0225/0.020) = 4.745 + log(1.125) = 4.745 + 0.051 = 4.796 ≈ 4.80.
Step 3 — Effect of adding NaOH: moles NaOH added = 0.005 L × 1.0 M = 0.005 mol. NaOH reacts with weak acid: CH₃COOH + OH⁻ → CH₃COO⁻ + H₂O. New moles CH₃COOH = 0.020 − 0.005 = 0.015 mol. New moles CH₃COO⁻ = 0.0225 + 0.005 = 0.0275 mol.
Step 4 — pH after NaOH addition: pH = 4.745 + log(0.0275/0.015) = 4.745 + log(1.833) = 4.745 + 0.263 = 5.008 ≈ 5.01.
Step 5 — Change in pH: ΔpH = 5.01 − 4.80 = +0.21 pH units. Note: if pure water had 5 mL of 1.0 M NaOH added, pH would jump to ~11. The buffer resisted the change effectively.
Answer: pH before NaOH = 4.80; pH after 5 mL of 1.0 M NaOH = 5.01; Change in pH = +0.21 units.
Key insight: Buffer capacity is greatest at pH = pKa (= 4.745 here). This buffer was close to its optimal pH, hence it resisted the change effectively.

Example 3: Standard Cell Potential and Spontaneity
Given: For the electrochemical cell Cr|Cr³⁺(1M)||Fe²⁺(1M)|Fe, given standard reduction potentials: E°(Cr³⁺/Cr) = −0.74 V; E°(Fe²⁺/Fe) = −0.44 V. At 25°C, F = 96,485 C/mol.
Find: (a) Cell notation and which electrode is anode, (b) E°_cell, (c) ΔG°, (d) Equilibrium constant K_eq.
Step 1 — Identify anode and cathode: Lower E° → anode (oxidation). E°(Cr³⁺/Cr) = −0.74 V < E°(Fe²⁺/Fe) = −0.44 V. Therefore Cr is the anode (Cr → Cr³⁺ + 3e⁻) and Fe is the cathode (Fe²⁺ + 2e⁻ → Fe).
Step 2 — Balance electrons using LCM: Anode releases 3e⁻; Cathode accepts 2e⁻. LCM = 6. Overall: 2Cr + 3Fe²⁺ → 2Cr³⁺ + 3Fe. Number of electrons transferred n = 6.
Step 3 — E°_cell: E°_cell = E°_cathode − E°_anode = (−0.44) − (−0.74) = −0.44 + 0.74 = +0.30 V. Positive E°_cell confirms the reaction is spontaneous under standard conditions.
Step 4 — ΔG°: ΔG° = −nFE° = −(6)(96485)(0.30) = −6 × 28945.5 = −173,673 J = −173.7 kJ. Negative ΔG° confirms spontaneity.
Step 5 — Equilibrium constant: ln K = −ΔG°/(RT) = 173,673/(8.314 × 298) = 173,673/2477.6 = 70.1. K_eq = e^70.1 ≈ 2.6 × 10³⁰. Extremely large K means reaction goes essentially to completion.
Step 6 — Cell notation: Cr|Cr³⁺(1M)||Fe²⁺(1M)|Fe. Anode (Cr) written on left; cathode (Fe) on right; double vertical line represents salt bridge.
Answer: Anode = Cr; Cathode = Fe; E°_cell = +0.30 V; ΔG° = −173.7 kJ; K_eq ≈ 2.6×10³⁰ (reaction essentially complete).
""",
  "queries": [
      ("In Example 1 on equilibrium constant, show the ICE table setup and give "
       "the final K_c and K_p values with units.",),
      ("In Example 2 on the buffer solution, what is the pH before and after adding NaOH, "
       "and how much did the pH change?",),
      ("In Example 3 on electrochemical cells, which electrode is the anode, "
       "what is E°_cell, and what is ΔG°?",),
      ("For Example 1 in chemistry worked examples, what is the degree of dissociation "
       "of PCl₅ and how is it calculated from the ICE table?",),
      ("In Example 2 of chemistry problems, what Henderson-Hasselbalch calculation "
       "gives the buffer pH before NaOH addition?",),
      ("In Example 3, how is the equilibrium constant K_eq derived from the cell potential, "
       "and what does the very large value indicate?",),
  ],
},

"worked_examples_biology": {
  "text": """Worked Examples: Genetics and Ecology Problems
Subject: Biology  |  Grade: Higher Secondary

Example 1: Dihybrid Cross and Probability
Given: In Mendel's pea plant experiment, Tall (T) is dominant over Dwarf (t) and Round seeds (R) are dominant over Wrinkled (r). Plant 1 has genotype TtRr. Plant 2 has genotype TtRr. These two plants are crossed.
Find: (a) Gamete types from each parent, (b) F2 phenotypic ratio using the product law, (c) Probability of getting a Tall Wrinkled plant (T_rr) from this cross, (d) Expected number of Tall Wrinkled plants if 320 offspring are produced.
Step 1 — Gamete types: For TtRr, each gamete gets one allele for each gene. Gametes: TR, Tr, tR, tr — each with probability 1/4. Both parents produce the same gametes (both TtRr).
Step 2 — Construct Punnett Square (4×4 = 16 boxes): Rows: TR, Tr, tR, tr from parent 1. Columns: TR, Tr, tR, tr from parent 2. Fill all 16 combinations.
Step 3 — Count phenotypic classes: T_R_ (Tall Round) = 9 boxes (TTRR, TTRr, TtRR, TtRr, TTRr, TtRr, TtRR, TtRr — 9 total). T_rr (Tall Wrinkled) = 3. ttR_ (Dwarf Round) = 3. ttrr (Dwarf Wrinkled) = 1.
Step 4 — Phenotypic ratio: 9 Tall Round : 3 Tall Wrinkled : 3 Dwarf Round : 1 Dwarf Wrinkled = 9:3:3:1 ratio. This is the diagnostic ratio for dihybrid crosses following independent assortment.
Step 5 — Probability of Tall Wrinkled (T_rr): Using the product law: P(T_) × P(rr) = (3/4) × (1/4) = 3/16. This confirms the Punnett square result.
Step 6 — Expected number in 320 offspring: E(Tall Wrinkled) = (3/16) × 320 = 60 plants.
Step 7 — Genotypic composition of Tall Wrinkled: T_rr includes TTrr (probability 1/16) and Ttrr (probability 2/16). Ratio of TTrr:Ttrr = 1:2. Confirm: 1+2=3, consistent with 3/16 probability.
Answer: Phenotypic ratio = 9:3:3:1; P(Tall Wrinkled) = 3/16; Expected Tall Wrinkled from 320 offspring = 60 plants.

Example 2: Hardy-Weinberg Equilibrium Calculations
Given: In a population of 10,000 individuals of a plant species, the flower colour gene has two alleles: Red (A, dominant) and White (a, recessive). 900 plants show white flowers (aa phenotype). The population is in Hardy-Weinberg equilibrium.
Find: (a) Allele frequencies p and q, (b) Expected frequencies of AA, Aa, and aa genotypes, (c) Expected numbers of each genotype in the population of 10,000, (d) Confirm Hardy-Weinberg holds.
Step 1 — Frequency of aa (recessive phenotype): q² = 900/10,000 = 0.09.
Step 2 — Allele frequency q (recessive): q = √0.09 = 0.30. Therefore q = 0.30.
Step 3 — Allele frequency p (dominant): p = 1 − q = 1 − 0.30 = 0.70.
Step 4 — Expected genotype frequencies using p² + 2pq + q²: AA (p²) = (0.70)² = 0.49. Aa (2pq) = 2(0.70)(0.30) = 0.42. aa (q²) = (0.30)² = 0.09. Check: 0.49 + 0.42 + 0.09 = 1.00 ✓
Step 5 — Expected numbers in 10,000 individuals: AA = 0.49 × 10,000 = 4,900. Aa = 0.42 × 10,000 = 4,200. aa = 0.09 × 10,000 = 900. Total = 10,000 ✓
Step 6 — Verify Hardy-Weinberg: The given aa count (900) matches the expected (900 from q²). Therefore the population IS in Hardy-Weinberg equilibrium (consistent with large population, random mating, no selection, mutation, or migration).
Step 7 — What fraction are carriers?: Heterozygous Aa = 0.42 = 42% of the population are carriers (red phenotype but carry white allele).
Answer: p = 0.70; q = 0.30; AA = 4,900 (49%); Aa = 4,200 (42%); aa = 900 (9%). Population is in H-W equilibrium. 42% are carriers.

Example 3: Energy Flow in an Ecosystem
Given: In a grassland ecosystem, solar energy captured by grass (producers) = 50,000 kJ per hectare per year. Ecological efficiency at each trophic level is 10%. The food chain is: Grass → Grasshoppers → Frogs → Snakes → Hawk.
Find: (a) Energy available at each trophic level, (b) How much solar energy must producers capture for one Hawk to obtain 5 kJ, (c) Number of Snakes needed to sustain the Hawks' annual energy need of 500 kJ.
Step 1 — Energy at each trophic level (10% efficiency): T1 Grass = 50,000 kJ. T2 Grasshoppers = 10% × 50,000 = 5,000 kJ. T3 Frogs = 10% × 5,000 = 500 kJ. T4 Snakes = 10% × 500 = 50 kJ. T5 Hawk = 10% × 50 = 5 kJ.
Step 2 — Energy required for 1 kJ at Hawk level: To get 5 kJ at T5, producers need to fix 50,000 kJ. Per kJ at T5: 50,000/5 = 10,000 kJ from producers per 1 kJ at Hawk level.
Step 3 — Solar energy needed for 5 kJ to Hawk: 5 kJ × 10,000 = 50,000 kJ. Confirms: the 50,000 kJ from producers yields 5 kJ for Hawks.
Step 4 — Number of Snakes for 500 kJ Hawks need: Each Snake provides 50/N_snakes kJ to Hawks. Actually: 50 kJ (T4 total) → 5 kJ for all Hawks. For 500 kJ needed by Hawks, need 10× more producers → 500,000 kJ at producer level, giving 50 kJ at Snake level to provide 500 kJ... Wait: re-read: Hawks need 500 kJ total; T4 → T5 efficiency is 10%; so T4 Snakes must have 500/0.10 = 5,000 kJ. Since T3 Frogs → T4 at 10%, Frogs need 50,000 kJ. And T2 Grasshoppers → T3 at 10%: 500,000 kJ. T1 Grass: 5,000,000 kJ.
Step 5 — In context of our ecosystem: our ecosystem has 50,000 kJ at T1 → only 50 kJ at T4 and 5 kJ at T5. To support Hawks needing 500 kJ, we need 100 hectares of this grassland.
Answer: T1=50,000; T2=5,000; T3=500; T4=50; T5=5 kJ per hectare. For 500 kJ Hawks need: 100 hectares of grassland required. 10,000 kJ of solar energy is needed per 1 kJ reaching the Hawk level.
""",
  "queries": [
      ("In Example 1 on Dihybrid Cross, what are the step-by-step derivation of "
       "the 9:3:3:1 ratio and the expected number of Tall Wrinkled plants from 320 offspring?",),
      ("In Example 2 on Hardy-Weinberg, what are the allele frequencies and expected "
       "numbers of each genotype in the population of 10,000?",),
      ("In Example 3 on Energy Flow, what is the energy at each trophic level and "
       "how many hectares are needed to support Hawks requiring 500 kJ?",),
      ("For Example 1 in biology worked examples, use the product law to calculate "
       "the probability of a Tall Wrinkled plant and confirm with the Punnett square.",),
      ("In Example 2, what percentage of the population are heterozygous carriers "
       "and how is this calculated from Hardy-Weinberg?",),
      ("In Example 3, how much solar energy from producers is required to deliver "
       "1 kJ of energy to a Hawk, based on the 10% efficiency at each trophic level?",),
  ],
},

"worked_examples_mathematics": {
  "text": """Worked Examples: Calculus Problems
Subject: Mathematics  |  Grade: Higher Secondary

Example 1: Chain Rule — Differentiate a Nested Composite Function
Given: Differentiate y = ln(sin(x²)) with respect to x.
Find: dy/dx, identifying the chain rule application at each level.
Step 1 — Identify the composite structure (working from outside to inside): Outermost function: f(u) = ln(u). Middle function: g(v) = sin(v). Innermost function: h(x) = x². So y = f(g(h(x))) = ln(sin(x²)).
Step 2 — Apply chain rule from outside to inside: dy/dx = [1/sin(x²)] × d/dx[sin(x²)].
Step 3 — Differentiate the middle layer d/dx[sin(x²)]: Apply chain rule again: d/dx[sin(x²)] = cos(x²) × d/dx(x²) = cos(x²) × 2x.
Step 4 — Combine all layers: dy/dx = [1/sin(x²)] × [cos(x²) × 2x] = 2x·cos(x²)/sin(x²) = 2x·cot(x²).
Step 5 — Simplify: Using the identity cot(θ) = cos(θ)/sin(θ): dy/dx = 2x·cot(x²). This is the most compact form.
Step 6 — Verify by logarithmic differentiation (alternative method): y = ln(sin(x²)). Taking d/dx both sides: dy/dx = d/dx[ln(sin(x²))] = 1/(sin(x²)) × cos(x²) × 2x = 2x cot(x²). ✓ Same answer.
Step 7 — Domain consideration: The derivative exists only where sin(x²) > 0 (so ln is defined and denominator non-zero). This occurs for x² ∈ (0, π), i.e., x ∈ (0, √π) ∪ (−√π, 0), and periodically.
Answer: dy/dx = 2x·cot(x²). Key: three-layer chain rule applied from outermost to innermost function.

Example 2: Integration by Parts Applied Twice — ∫x²·cos(x) dx
Given: Evaluate ∫x²·cos(x) dx using the integration by parts formula ∫u dv = uv − ∫v du.
Find: The antiderivative, showing all steps including the second application of the formula.
Step 1 — Apply LIATE rule to choose u and dv: LIATE = Logarithm, Inverse trig, Algebraic, Trig, Exponential. Algebraic (x²) has higher priority than Trig (cos x), so choose u = x², dv = cos(x) dx.
Step 2 — First application: u = x², dv = cos x dx → du = 2x dx, v = sin x. Apply: ∫x² cos x dx = x²·sin x − ∫sin x · 2x dx = x² sin x − 2∫x sin x dx.
Step 3 — Second application for ∫x sin x dx: u = x, dv = sin x dx → du = dx, v = −cos x. ∫x sin x dx = x(−cos x) − ∫(−cos x) dx = −x cos x + sin x.
Step 4 — Substitute back: ∫x² cos x dx = x² sin x − 2(−x cos x + sin x) = x² sin x + 2x cos x − 2 sin x.
Step 5 — Add constant: ∫x² cos x dx = x² sin x + 2x cos x − 2 sin x + C.
Step 6 — Verify by differentiation: d/dx[x² sin x + 2x cos x − 2 sin x] = 2x sin x + x² cos x + 2 cos x − 2x sin x − 2 cos x = x² cos x. ✓ Matches the original integrand.
Answer: ∫x² cos(x) dx = x² sin x + 2x cos x − 2 sin x + C. Integration by parts applied twice using LIATE priority.

Example 3: Optimisation — Maximum Volume of an Open Box
Given: A rectangular piece of cardboard is 40 cm × 30 cm. Equal squares of side x cm are cut from each corner, and the sides are folded up to make an open-top box.
Find: (a) Volume V as a function of x, (b) Value of x that maximises volume, (c) Maximum volume.
Step 1 — Set up the volume function: After cutting squares of side x from each corner and folding: Length = 40 − 2x, Width = 30 − 2x, Height = x. Constraint: x > 0 and x < 15 (since width = 30 − 2x > 0 → x < 15). V(x) = x(40 − 2x)(30 − 2x).
Step 2 — Expand V(x): V = x(1200 − 80x − 60x + 4x²) = x(1200 − 140x + 4x²) = 4x³ − 140x² + 1200x.
Step 3 — Find critical points using V'(x) = 0: V'(x) = 12x² − 280x + 1200. Set V'(x) = 0: 12x² − 280x + 1200 = 0 → 3x² − 70x + 300 = 0.
Step 4 — Solve quadratic: x = [70 ± √(4900 − 3600)] / 6 = [70 ± √1300] / 6 = [70 ± 36.06] / 6. So x₁ = (70 + 36.06)/6 = 17.68 (outside domain x < 15, reject). x₂ = (70 − 36.06)/6 = 5.66 cm.
Step 5 — Second derivative test: V''(x) = 24x − 280. V''(5.66) = 24(5.66) − 280 = 135.84 − 280 = −144.16 < 0. Therefore x = 5.66 is a LOCAL MAXIMUM. ✓
Step 6 — Maximum volume: V(5.66) = 5.66 × (40 − 11.32) × (30 − 11.32) = 5.66 × 28.68 × 18.68 ≈ 5.66 × 535.8 ≈ 3032.7 cm³.
Answer: x = 5.66 cm (square side to cut); Maximum volume ≈ 3,033 cm³ (= 3.033 litres).
""",
  "queries": [
      ("In Example 1 on Chain Rule, what are the three nested layers identified "
       "and what is the final derivative of ln(sin(x²))?",),
      ("In Example 2 on Integration by Parts, how is it applied twice for ∫x²·cos(x)dx "
       "and what is the final antiderivative?",),
      ("In Example 3 on Optimisation, what is the volume function V(x), what value "
       "of x maximises it, and what is the maximum volume?",),
      ("For Example 1 in mathematics, what is the domain constraint on x where "
       "the derivative dy/dx exists?",),
      ("In Example 2, what does the LIATE rule specify for choosing u and dv, "
       "and which verification step confirms the answer?",),
      ("In Example 3, what quadratic equation must be solved to find the critical point, "
       "and how does the second derivative test confirm it is a maximum?",),
  ],
},

"worked_examples_geography": {
  "text": """Worked Examples: Map Skills and Human Geography Problems
Subject: Geography  |  Grade: Higher Secondary

Example 1: Contour Map Interpretation and Cross-Section Drawing
Given: A topographic map at scale 1:50,000 has contour lines at 10 m intervals. Along a transect AB, the contour lines crossed are (from A to B): 100, 110, 120, 130, 120, 110, 100, 90, 80 m. The horizontal distance between contours on the map averages 0.5 cm.
Find: (a) Actual horizontal distance between consecutive contours on the ground, (b) Average gradient of the uphill section from A to the summit, (c) Vertical exaggeration if the cross-section is drawn with horizontal scale 1:50,000 and vertical scale 1:5,000.
Step 1 — Actual distance between contours: Map distance = 0.5 cm; Scale = 1:50,000. Actual distance = 0.5 cm × 50,000 = 25,000 cm = 250 m per contour interval.
Step 2 — Identify summit: The highest contour is 130 m. From A (100 m) to summit (130 m): 3 intervals × 250 m = 750 m horizontal distance; vertical rise = 30 m.
Step 3 — Average gradient from A to summit: Gradient = vertical rise / horizontal distance = 30 / 750 = 1/25. As a percentage: (30/750) × 100 = 4.0%. As an angle: arctan(1/25) ≈ 2.3°.
Step 4 — Vertical exaggeration (VE): VE = (vertical scale) / (horizontal scale) = (1/5,000) / (1/50,000) = 50,000/5,000 = 10. The cross-section exaggerates vertical features by a factor of 10.
Step 5 — Interpret the profile: A to summit: gentle uphill gradient (4%). Summit to right: downhill back to 100 m (symmetric). Then continues down to 80 m — indicating a valley on the right side of the transect. Profile shape: hill with a valley on the right.
Step 6 — Calculate relief: Total relief = highest point − lowest point = 130 − 80 = 50 m.
Answer: Ground distance between contours = 250 m; Gradient from A to summit = 1:25 (4.0% = 2.3°); Vertical exaggeration = 10; Total relief = 50 m.
Common mistake: Confusing map scale with vertical exaggeration. Vertical exaggeration only applies when different scales are used for horizontal and vertical axes in cross-section drawing.

Example 2: Population Growth Rate and Doubling Time
Given: Country X had a population of 80 million in 2000 and 100 million in 2020. Country Y has a natural increase rate (NIR) of 2.5% per year. Calculate for Country X: (a) Annual growth rate r, (b) Doubling time using the Rule of 70, (c) Projected population in 2040. For Country Y starting at 50 million, find doubling time.
Step 1 — Growth rate for Country X: Using compound growth formula: P_t = P_0 × (1+r)^t. 100 = 80 × (1+r)^20 → (1+r)^20 = 100/80 = 1.25. Taking 20th root: 1+r = 1.25^(1/20) = 1.25^0.05. Using ln: 0.05 × ln(1.25) = 0.05 × 0.2231 = 0.01116. So r = e^0.01116 − 1 ≈ 0.01122 = 1.12% per year.
Step 2 — Doubling time for Country X (Rule of 70): T_double = 70 / r(%) = 70 / 1.12 ≈ 62.5 years. Country X will double its 2000 population by approximately 2063.
Step 3 — Projected population for Country X in 2040: t = 40 years from 2000. P_2040 = 80 × (1.01122)^40. Using approximation: (1+r)^40 ≈ e^(0.01122 × 40) = e^0.4488 ≈ 1.566. P_2040 ≈ 80 × 1.566 = 125.3 million.
Step 4 — Doubling time for Country Y (NIR = 2.5%): T_double = 70 / 2.5 = 28 years. Country Y's population will double in 28 years.
Step 5 — Starting at 50 million, Country Y reaches 100 million in 28 years.
Step 6 — Comparison: Country X (r = 1.12%) takes ~62.5 years to double; Country Y (r = 2.5%) takes only 28 years. Country Y will face much faster population pressure on resources and infrastructure.
Answer: Country X growth rate = 1.12% per year; Doubling time ≈ 62.5 years; 2040 population ≈ 125 million. Country Y doubling time = 28 years (from 50 to 100 million).

Example 3: Climate Data Interpretation — Climograph Analysis
Given: Station Z has the following monthly temperature (°C) and rainfall (mm) data:
  Jan: 15°C, 5mm | Feb: 18°C, 8mm | Mar: 24°C, 15mm | Apr: 30°C, 20mm | May: 35°C, 25mm | Jun: 32°C, 180mm | Jul: 29°C, 300mm | Aug: 28°C, 280mm | Sep: 30°C, 120mm | Oct: 26°C, 30mm | Nov: 20°C, 10mm | Dec: 16°C, 5mm.
Find: (a) Annual temperature range, (b) Annual rainfall total, (c) Month of maximum rainfall, (d) Climate classification and reasoning.
Step 1 — Annual temperature range: Max temperature = 35°C (May); Min temperature = 15°C (January). Range = 35 − 15 = 20°C. Moderate range indicates proximity to ocean or tropical location.
Step 2 — Annual rainfall total: Sum all months = 5+8+15+20+25+180+300+280+120+30+10+5 = 998 mm ≈ 1000 mm per year.
Step 3 — Seasonal pattern: Jan–May: Dry season (5–25 mm/month). Jun–Sep: Wet season (120–300 mm/month, peak in July). Oct–Dec: Post-monsoon drying. Maximum rainfall in July (300 mm). This is a pronounced monsoon pattern.
Step 4 — Temperature pattern: High temperatures year-round (15–35°C). Hottest month is May (pre-monsoon), not July (monsoon brings clouds and cooling). This is diagnostic of the Indian monsoon pattern.
Step 5 — Climate classification: Annual rainfall ~1,000 mm (moderate for tropical); Hot throughout year (T_min = 15°C > 10°C); Pronounced dry and wet seasons with monsoon peak; Hottest month before wettest month (May → July). Classification: Tropical Monsoon (Köppen Am) — rainfall > 60 mm in driest month or annual total > 100 × (100 − driest month mm). Boundary between Aw (tropical savanna) and Am (monsoon).
Step 6 — Geographical implication: This climate is typical of peninsular India (Mumbai, Chennai). The dry season (Jan–May) requires irrigation for agriculture; the wet season (Jun–Sep) supports rice cultivation.
Answer: Temperature range = 20°C; Annual rainfall ≈ 1,000 mm; Peak rainfall July (300 mm); Climate = Tropical Monsoon (Am). Characteristic of peninsular India.
""",
  "queries": [
      ("In Example 1 on Contour Maps, what is the actual ground distance between contours, "
       "the gradient from A to summit, and the vertical exaggeration?",),
      ("In Example 2 on Population Growth, what is Country X's annual growth rate, "
       "doubling time, and projected 2040 population?",),
      ("In Example 3 on Climate Data, what is the annual temperature range, total rainfall, "
       "and the climate classification with reasoning?",),
      ("For Example 1 in geography, what formula relates map scale, actual distance, "
       "and what common mistake is warned about?",),
      ("In Example 2, how is the Rule of 70 applied to find doubling times "
       "and which country (X or Y) will double its population faster?",),
      ("In Example 3, what seasonal rainfall pattern is identified and what "
       "Köppen classification is given with its key criteria?",),
  ],
},

}  # end DETAILED_EXAMPLES


def patch():
    # Load existing corpus
    with open(CORPUS_PATH) as f:
        docs = [json.loads(l) for l in f if l.strip()]

    # Load existing benchmark
    with open(BENCH_PATH) as f:
        existing_queries = [json.loads(l) for l in f if l.strip()]

    # Remove old worked_examples docs from corpus
    new_docs = [d for d in docs if not d["doc_id"].startswith("worked_examples_")]

    # Remove old worked_examples queries from benchmark
    we_doc_ids = {d["doc_id"] for d in docs if d["doc_id"].startswith("worked_examples_")}
    new_queries = [q for q in existing_queries if not any(did in q["expected_doc_ids"] for did in we_doc_ids)]

    # Add new worked_examples docs and queries
    subjects = ["physics", "chemistry", "biology", "mathematics", "geography"]
    for subj in subjects:
        key = f"worked_examples_{subj}"
        info = DETAILED_EXAMPLES[key]
        doc = {
            "doc_id": key,
            "text": info["text"],
            "metadata": {
                "subject": subj,
                "grade": "higher_secondary",
                "doc_type": "unknown",
                "source": f"worked_examples_{subj}",
            }
        }
        new_docs.append(doc)
        for q_tuple in info["queries"]:
            q_text = q_tuple[0]
            new_queries.append({
                "query_id": str(uuid.uuid4()),
                "text": q_text,
                "subject": subj,
                "grade": "higher_secondary",
                "expected_doc_ids": [key],
                "expected_chunk_ids": [],
                "bloom_level": "apply",
                "source": f"worked_examples_{subj}",
            })

    # Write updated files
    with open(CORPUS_PATH, "w") as f:
        for doc in new_docs:
            f.write(json.dumps(doc) + "\n")

    with open(BENCH_PATH, "w") as f:
        for q in new_queries:
            f.write(json.dumps(q) + "\n")

    # Stats
    we_new = [d for d in new_docs if d["doc_id"].startswith("worked_examples_")]
    print(f"✅ Worked examples patched to detailed versions")
    print(f"   Worked example doc sizes:")
    for d in we_new:
        print(f"   {d['doc_id']}: {len(d['text'])} chars")
    print(f"\n   Total docs:    {len(new_docs)}")
    print(f"   Total queries: {len(new_queries)}")


if __name__ == "__main__":
    patch()
