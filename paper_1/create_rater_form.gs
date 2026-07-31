// ============================================================
// PACER — 50-Pair Expert Rater Form Generator
// Paste into script.google.com → Run createRaterForm()
// The form will appear in your Google Drive.
// ============================================================

function createRaterForm() {

  var form = FormApp.create('PACER CAS Expert Rater Study — 50 Pairs');
  form.setDescription(
    'Thank you for participating in the PACER curriculum alignment validation study.\n\n' +
    'You will rate 50 (question, retrieved chunk) pairs on three dimensions ' +
    'using a 1–5 scale. Please read the rubric carefully before starting.\n\n' +
    'Estimated time: 45–60 minutes.\n' +
    'Contact: nitesh.sharma@shoolini.edu.in');
  form.setCollectEmail(false);
  form.setProgressBar(true);

  // ── SECTION 0: Rater information ──────────────────────────
  form.addSectionHeaderItem()
    .setTitle('Section 0 — Rater Information')
    .setHelpText('Please complete this section before rating.');

  form.addTextItem()
    .setTitle('Full Name')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Designation (e.g. PGT Science / Asst. Professor / Curriculum Designer)')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Institution')
    .setRequired(true);

  var expItem = form.addMultipleChoiceItem()
    .setTitle('Years of teaching / research experience')
    .setRequired(true);
  expItem.setChoiceValues(['< 2 years','2–5 years','5–10 years','More than 10 years']);

  form.addTextItem()
    .setTitle('Subject(s) you teach or research')
    .setRequired(true);

  // ── SECTION 0b: Rubric ─────────────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('Rating Rubric — Please read before starting')
    .setHelpText(
      'Rate each pair on three dimensions (1 = lowest, 5 = highest):\n\n' +
      'GRADE MATCH — Does the retrieved chunk\'s complexity match the grade level of the student\'s query?\n' +
      '  1 = Completely wrong grade band\n' +
      '  2 = Adjacent grade but too advanced/simple\n' +
      '  3 = Approximately right, minor mismatches\n' +
      '  4 = Well-matched to query grade level\n' +
      '  5 = Perfectly calibrated\n\n' +
      'PREREQ COVERAGE — Does the chunk assume the right prior knowledge?\n' +
      '  1 = Assumes far too much prior knowledge\n' +
      '  2 = Significant missing prerequisites\n' +
      '  3 = Some prerequisites assumed; student would manage with effort\n' +
      '  4 = Well-scaffolded for the grade level\n' +
      '  5 = Fully self-contained and accessible\n\n' +
      'BLOOM ALIGNMENT — Does the chunk match the cognitive level of the query?\n' +
      '  1 = Complete mismatch (e.g. definition chunk for an Evaluate query)\n' +
      '  2 = Two or more Bloom levels away\n' +
      '  3 = Adjacent Bloom level (e.g. chunk Explains; query asks to Apply)\n' +
      '  4 = Good match to query cognitive level\n' +
      '  5 = Exact Bloom level match');

  // ── STRATUM A ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section A \u2014 High-Variance Pairs (Pairs 1\u201320)")
    .setHelpText("These 20 pairs had the highest rater disagreement in the preliminary study. Your expert ratings will help clarify whether disagreement was due to genuine ambiguity or lack of calibration.");

  // Pair 01: pair_0000
  form.addSectionHeaderItem()
    .setTitle("Pair 01/50  [pair_0000  |  Grade: Middle  |  Bloom: Evaluate]")
    .setHelpText("QUESTION: What are the reasons that contribute to the endangered status of the greater one-horned rhinoceros?\n\nRETRIEVED CHUNK: 4. Tail (T) - Tail (T)\n\nWe need to find the probability of getting at least one tail.\n\nLet's first find the total number of possible outcomes, which is 4.\n\nNow, let's count the favorable outcomes (outcomes with at least one tail):");

  var item_01_gm = form.addScaleItem()
    .setTitle("Pair 01 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_01_pr = form.addScaleItem()
    .setTitle("Pair 01 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_01_bl = form.addScaleItem()
    .setTitle("Pair 01 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 01 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 02: pair_0001
  form.addSectionHeaderItem()
    .setTitle("Pair 02/50  [pair_0001  |  Grade: Middle  |  Bloom: Evaluate]")
    .setHelpText("QUESTION: Do you think the crops grown in the Amazon Basin are sufficient to meet the dietary needs of its inhabitants?\n\nRETRIEVED CHUNK: Note: We used the formula A(t) = P(1 + rt/n)^(nt), where r is the annual in[2D[K\ninterest rate (5% or 0.05 in this case), n is the number of times interest [K\nis compounded per year, and t is time in years. However, since we are using[5D[K\nusing continuous compounding, we used the formula A(t) = Pe^(rt).\n\nQuestion: 22. In a culture, the bacteria count is 1,00,000. The number is increased by 10% in 2\n\nAnswer: To solve this problem, we will use the concept of exponential growth. The r[1D[K");

  var item_02_gm = form.addScaleItem()
    .setTitle("Pair 02 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_02_pr = form.addScaleItem()
    .setTitle("Pair 02 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_02_bl = form.addScaleItem()
    .setTitle("Pair 02 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 02 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 03: pair_0002
  form.addSectionHeaderItem()
    .setTitle("Pair 03/50  [pair_0002  |  Grade: Middle  |  Bloom: Remember]")
    .setHelpText("QUESTION: Where is the Amazon Basin located?\n\nRETRIEVED CHUNK: 1. Imagine two triangles: PQR and POR.");

  var item_03_gm = form.addScaleItem()
    .setTitle("Pair 03 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_03_pr = form.addScaleItem()
    .setTitle("Pair 03 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_03_bl = form.addScaleItem()
    .setTitle("Pair 03 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 03 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 04: pair_0003
  form.addSectionHeaderItem()
    .setTitle("Pair 04/50  [pair_0003  |  Grade: Middle  |  Bloom: Remember]")
    .setHelpText("QUESTION: Name three types of crops that people of the Amazon Basin grow.\n\nRETRIEVED CHUNK: 3. Add up these products to get the total sum.");

  var item_04_gm = form.addScaleItem()
    .setTitle("Pair 04 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_04_pr = form.addScaleItem()
    .setTitle("Pair 04 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_04_bl = form.addScaleItem()
    .setTitle("Pair 04 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 04 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 05: pair_0004
  form.addSectionHeaderItem()
    .setTitle("Pair 05/50  [pair_0004  |  Grade: Middle  |  Bloom: Create]")
    .setHelpText("QUESTION: Design a cultural festival in the Amazon Basin that showcases the importance of maize, beans, and cassava in their diet and culture.\n\nRETRIEVED CHUNK: f data as it represents discrete frequencies and co[2D[K\ncontains both mid-values and class marks.\n\nFirst, we need to calculate the sum of all mangoes using the formula: Sum =[1D[K\n= \u2211(mid-value \u00d7 frequency)\n= [(50 + 51) \u00d7 15] + [(53 + 54) \u00d7 110] + [(56 + 57) \u00d7 135] + [(59 + 60) \u00d7 1[1D[K\n115] + [(62 + 63) \u00d7 25]\n= (101 \u00d7 15) + (107 \u00d7 110) + (113 \u00d7 135) + (119 \u00d7 115) + (125 \u00d7 25)\n= 1515 + 11770 + 15295 + 13635 + 3125\nSum of all mangoes = 51,100\n\nNow, we calculate the total number of values:");

  var item_05_gm = form.addScaleItem()
    .setTitle("Pair 05 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_05_pr = form.addScaleItem()
    .setTitle("Pair 05 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_05_bl = form.addScaleItem()
    .setTitle("Pair 05 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 05 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 06: pair_0005
  form.addSectionHeaderItem()
    .setTitle("Pair 06/50  [pair_0005  |  Grade: Middle  |  Bloom: Create]")
    .setHelpText("QUESTION: Propose a conservation plan to protect the one-horned rhinoceros in its natural habitat, considering the threats of habitat loss and poaching.\n\nRETRIEVED CHUNK: 4. Tail (T) - Tail (T)\n\nWe need to find the probability of getting at least one tail.\n\nLet's first find the total number of possible outcomes, which is 4.\n\nNow, let's count the favorable outcomes (outcomes with at least one tail):");

  var item_06_gm = form.addScaleItem()
    .setTitle("Pair 06 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_06_pr = form.addScaleItem()
    .setTitle("Pair 06 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_06_bl = form.addScaleItem()
    .setTitle("Pair 06 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 06 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM B ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section B \u2014 Lower CAS Pairs (Pairs 21\u201340)")
    .setHelpText("These 20 pairs had the lowest curriculum alignment scores in the preliminary study. They are the most discriminating \u2014 please rate carefully.");

  // Pair 07: pair_0006
  form.addSectionHeaderItem()
    .setTitle("Pair 07/50  [pair_0006  |  Grade: Middle  |  Bloom: Create]")
    .setHelpText("QUESTION: Design a hypothetical class with a simplified ratio of girls to boys, where the number of girls is a multiple of 4 and the number of boys is a multiple of 5.\n\nRETRIEVED CHUNK: **Condition (i): Youngest is a girl**\n\nTo solve this, we need to understand what \"conditioning\" means in probabili[9D[K\nprobability. When we condition on an event, we are only considering the out[3D[K\noutcomes that already satisfy that event. In this case, we know that the yo[2D[K\nyoungest child is a girl. Now, we want to find the probability that both ch[2D[K\nchildren are girls given this information.\n\nThere are four possible outcomes for two children: BB (both boys), BG (boy-[5D[K\n(b");

  var item_07_gm = form.addScaleItem()
    .setTitle("Pair 07 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_07_pr = form.addScaleItem()
    .setTitle("Pair 07 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_07_bl = form.addScaleItem()
    .setTitle("Pair 07 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 07 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM A ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section A \u2014 High-Variance Pairs (Pairs 1\u201320)")
    .setHelpText("These 20 pairs had the highest rater disagreement in the preliminary study. Your expert ratings will help clarify whether disagreement was due to genuine ambiguity or lack of calibration.");

  // Pair 08: pair_0007
  form.addSectionHeaderItem()
    .setTitle("Pair 08/50  [pair_0007  |  Grade: Middle  |  Bloom: Create]")
    .setHelpText("QUESTION: Propose a real-life scenario where you need to find the ratio of girls to boys in a class, and explain how you would use the steps described in the passage to simplify the ratio.\n\nRETRIEVED CHUNK: 4. Since the triangles are similar, we can set up a proportion using their [K\ncorresponding sides. Let's say the width of the river (side QR) is x.\n\nUsing the concept of similarity, we can write:\n\nAB / BC = CP / QR\n\nWe know that AB = distance from the girl to the point directly below her (l[2D[K\n(let's call it 'd'), and BC = height at which she is sitting. Similarly, CP[2D[K\nCP = height of the temple stair and QR = width of the river.\n\nSubstituting these values into the proportion, we get:");

  var item_08_gm = form.addScaleItem()
    .setTitle("Pair 08 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_08_pr = form.addScaleItem()
    .setTitle("Pair 08 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_08_bl = form.addScaleItem()
    .setTitle("Pair 08 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 08 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 09: pair_0008
  form.addSectionHeaderItem()
    .setTitle("Pair 09/50  [pair_0008  |  Grade: Middle  |  Bloom: Evaluate]")
    .setHelpText("QUESTION: What are the limitations of the method used to find the ratio of girls to boys in the class?\n\nRETRIEVED CHUNK: 4. Since the triangles are similar, we can set up a proportion using their [K\ncorresponding sides. Let's say the width of the river (side QR) is x.\n\nUsing the concept of similarity, we can write:\n\nAB / BC = CP / QR\n\nWe know that AB = distance from the girl to the point directly below her (l[2D[K\n(let's call it 'd'), and BC = height at which she is sitting. Similarly, CP[2D[K\nCP = height of the temple stair and QR = width of the river.\n\nSubstituting these values into the proportion, we get:");

  var item_09_gm = form.addScaleItem()
    .setTitle("Pair 09 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_09_pr = form.addScaleItem()
    .setTitle("Pair 09 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_09_bl = form.addScaleItem()
    .setTitle("Pair 09 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 09 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 10: pair_0011
  form.addSectionHeaderItem()
    .setTitle("Pair 10/50  [pair_0011  |  Grade: Middle  |  Bloom: Remember]")
    .setHelpText("QUESTION: What is the simplified ratio of girls to boys in the class?\n\nRETRIEVED CHUNK: **Condition (i): Youngest is a girl**\n\nTo solve this, we need to understand what \"conditioning\" means in probabili[9D[K\nprobability. When we condition on an event, we are only considering the out[3D[K\noutcomes that already satisfy that event. In this case, we know that the yo[2D[K\nyoungest child is a girl. Now, we want to find the probability that both ch[2D[K\nchildren are girls given this information.\n\nThere are four possible outcomes for two children: BB (both boys), BG (boy-[5D[K\n(b");

  var item_10_gm = form.addScaleItem()
    .setTitle("Pair 10 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_10_pr = form.addScaleItem()
    .setTitle("Pair 10 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_10_bl = form.addScaleItem()
    .setTitle("Pair 10 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 10 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM B ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section B \u2014 Lower CAS Pairs (Pairs 21\u201340)")
    .setHelpText("These 20 pairs had the lowest curriculum alignment scores in the preliminary study. They are the most discriminating \u2014 please rate carefully.");

  // Pair 11: pair_0014
  form.addSectionHeaderItem()
    .setTitle("Pair 11/50  [pair_0014  |  Grade: Secondary  |  Bloom: Understand]")
    .setHelpText("QUESTION: What are the different class intervals formed by the teacher to create a grouped frequency distribution of the marks obtained by the students?\n\nRETRIEVED CHUNK: Question: 1. Collect the marks obtained by all the students of your class in Mathematics in the\n\nAnswer: For this question, let's assume we have a class of 40 students who took the[3D[K\nthe latest Mathematics examination. We will collect their marks and form a [K\ngrouped frequency distribution.\n\nFirst, we need to arrange the marks in ascending order: 50, 60, 65, 70, 75,[3D[K\n75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, [K\n155, 160, 165, 170, 175, 180, 185, 190");

  var item_11_gm = form.addScaleItem()
    .setTitle("Pair 11 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_11_pr = form.addScaleItem()
    .setTitle("Pair 11 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_11_bl = form.addScaleItem()
    .setTitle("Pair 11 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 11 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 12: pair_0016
  form.addSectionHeaderItem()
    .setTitle("Pair 12/50  [pair_0016  |  Grade: Secondary  |  Bloom: Evaluate]")
    .setHelpText("QUESTION: Is the grouped frequency distribution formed by the teacher an effective way to analyze the marks obtained by the students?\n\nRETRIEVED CHUNK: Question: 1. Collect the marks obtained by all the students of your class in Mathematics in the\n\nAnswer: For this question, let's assume we have a class of 40 students who took the[3D[K\nthe latest Mathematics examination. We will collect their marks and form a [K\ngrouped frequency distribution.\n\nFirst, we need to arrange the marks in ascending order: 50, 60, 65, 70, 75,[3D[K\n75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, [K\n155, 160, 165, 170, 175, 180, 185, 190");

  var item_12_gm = form.addScaleItem()
    .setTitle("Pair 12 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_12_pr = form.addScaleItem()
    .setTitle("Pair 12 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_12_bl = form.addScaleItem()
    .setTitle("Pair 12 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 12 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM A ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section A \u2014 High-Variance Pairs (Pairs 1\u201320)")
    .setHelpText("These 20 pairs had the highest rater disagreement in the preliminary study. Your expert ratings will help clarify whether disagreement was due to genuine ambiguity or lack of calibration.");

  // Pair 13: pair_0021
  form.addSectionHeaderItem()
    .setTitle("Pair 13/50  [pair_0021  |  Grade: Higher Secondary  |  Bloom: Create]")
    .setHelpText("QUESTION: Propose a new mode of human reproduction, explaining how it would work and the advantages and disadvantages of this method compared to the current viviparous mode.\n\nRETRIEVED CHUNK: Question: 9. It is required to seat 5 men and 4 women in a row so that the women occupy the\n\nAnswer: To solve this problem, we will first arrange the 5 men in a row and then pl[2D[K\nplace the 4 women in the even places.\n\nStep 1: Arrange the 5 men in a row.\nThere are 5! (5 factorial) ways to arrange 5 men in a row. \n\n5! = 5 x 4 x 3 x 2 x 1\n= 120\n\nSo, there are 120 ways to arrange the 5 men.\n\nStep 2: Place the 4 women in the even places.\nThere are 4 even places (2nd, 4th, 6th, and 8th) where we");

  var item_13_gm = form.addScaleItem()
    .setTitle("Pair 13 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_13_pr = form.addScaleItem()
    .setTitle("Pair 13 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_13_bl = form.addScaleItem()
    .setTitle("Pair 13 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 13 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM B ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section B \u2014 Lower CAS Pairs (Pairs 21\u201340)")
    .setHelpText("These 20 pairs had the lowest curriculum alignment scores in the preliminary study. They are the most discriminating \u2014 please rate carefully.");

  // Pair 14: pair_0022
  form.addSectionHeaderItem()
    .setTitle("Pair 14/50  [pair_0022  |  Grade: Higher Secondary  |  Bloom: Evaluate]")
    .setHelpText("QUESTION: What are the advantages of sexual reproduction in humans compared to asexual reproduction?\n\nRETRIEVED CHUNK: solutions or no solution at all.\n\nLet's consider two examples:");

  var item_14_gm = form.addScaleItem()
    .setTitle("Pair 14 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_14_pr = form.addScaleItem()
    .setTitle("Pair 14 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_14_bl = form.addScaleItem()
    .setTitle("Pair 14 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 14 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 15: pair_0023
  form.addSectionHeaderItem()
    .setTitle("Pair 15/50  [pair_0023  |  Grade: Higher Secondary  |  Bloom: Evaluate]")
    .setHelpText("QUESTION: Do you think viviparity is more beneficial for humans than oviparity or ovoviviparity? Argue for or against this statement.\n\nRETRIEVED CHUNK: 1. Reflexivity");

  var item_15_gm = form.addScaleItem()
    .setTitle("Pair 15 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_15_pr = form.addScaleItem()
    .setTitle("Pair 15 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_15_bl = form.addScaleItem()
    .setTitle("Pair 15 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 15 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM C ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section C \u2014 High CAS Anchor Pairs (Pairs 41\u201350)")
    .setHelpText("These 10 pairs had the highest curriculum alignment scores. They serve as positive anchors \u2014 we expect you to rate them highly too.");

  // Pair 16: pair_0026
  form.addSectionHeaderItem()
    .setTitle("Pair 16/50  [pair_0026  |  Grade: Higher Secondary  |  Bloom: Analyze]")
    .setHelpText("QUESTION: What are the key differences between scalar and non-scalar quantities, as described in the passage?\n\nRETRIEVED CHUNK: Example: If you move 5 meters east from your current position, the distance[8D[K\ndistance moved is a scalar (5 meters), but if we specify that the movement [K\nwas in the eastward direction, then the quantity becomes a vector (eastward[9D[K\n(eastward displacement of 5 meters).\n\nNow, let's relate scalars to vectors:\n\nA **vector can be represented by a scalar** when its magnitude is known. Fo[2D[K\nFor instance, if you have a force acting on an object, the force can be rep[3D[K\nrepresented");

  var item_16_gm = form.addScaleItem()
    .setTitle("Pair 16 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_16_pr = form.addScaleItem()
    .setTitle("Pair 16 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_16_bl = form.addScaleItem()
    .setTitle("Pair 16 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 16 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM A ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section A \u2014 High-Variance Pairs (Pairs 1\u201320)")
    .setHelpText("These 20 pairs had the highest rater disagreement in the preliminary study. Your expert ratings will help clarify whether disagreement was due to genuine ambiguity or lack of calibration.");

  // Pair 17: pair_0030
  form.addSectionHeaderItem()
    .setTitle("Pair 17/50  [pair_0030  |  Grade: Higher Secondary  |  Bloom: Understand]")
    .setHelpText("QUESTION: What is the main function of exocrine glands in relation to their secretions?\n\nRETRIEVED CHUNK: 2. Identify coefficients a, b, c");

  var item_17_gm = form.addScaleItem()
    .setTitle("Pair 17 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_17_pr = form.addScaleItem()
    .setTitle("Pair 17 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_17_bl = form.addScaleItem()
    .setTitle("Pair 17 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 17 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM B ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section B \u2014 Lower CAS Pairs (Pairs 21\u201340)")
    .setHelpText("These 20 pairs had the lowest curriculum alignment scores in the preliminary study. They are the most discriminating \u2014 please rate carefully.");

  // Pair 18: pair_0031
  form.addSectionHeaderItem()
    .setTitle("Pair 18/50  [pair_0031  |  Grade: Higher Secondary  |  Bloom: Understand]")
    .setHelpText("QUESTION: How do you think the 'mechanisms to control the secretion' of exocrine glands work, based on the analogy provided in the passage?\n\nRETRIEVED CHUNK: 2. Explain each step clearly and concisely.");

  var item_18_gm = form.addScaleItem()
    .setTitle("Pair 18 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_18_pr = form.addScaleItem()
    .setTitle("Pair 18 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_18_bl = form.addScaleItem()
    .setTitle("Pair 18 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 18 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 19: pair_0032
  form.addSectionHeaderItem()
    .setTitle("Pair 19/50  [pair_0032  |  Grade: Higher Secondary  |  Bloom: Analyze]")
    .setHelpText("QUESTION: How do the mechanisms of the body control the secretion of exocrine glands, and what can we learn from the comparison with a faucet?\n\nRETRIEVED CHUNK: 2. Explain each step clearly and concisely.");

  var item_19_gm = form.addScaleItem()
    .setTitle("Pair 19 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_19_pr = form.addScaleItem()
    .setTitle("Pair 19 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_19_bl = form.addScaleItem()
    .setTitle("Pair 19 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 19 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 20: pair_0034
  form.addSectionHeaderItem()
    .setTitle("Pair 20/50  [pair_0034  |  Grade: Higher Secondary  |  Bloom: Remember]")
    .setHelpText("QUESTION: What is an exocrine gland, as defined in the passage?\n\nRETRIEVED CHUNK: 1. The first term, 'a', is given as 'a'.");

  var item_20_gm = form.addScaleItem()
    .setTitle("Pair 20 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_20_pr = form.addScaleItem()
    .setTitle("Pair 20 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_20_bl = form.addScaleItem()
    .setTitle("Pair 20 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 20 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 21: pair_0038
  form.addSectionHeaderItem()
    .setTitle("Pair 21/50  [pair_0038  |  Grade: Secondary  |  Bloom: Apply]")
    .setHelpText("QUESTION: What specific question from Exercise 7.1 of NCERT Class 9 Mathematics would you like me to help you with?\n\nRETRIEVED CHUNK: Question: EXERCISE 1.1\n\nAnswer: I'd be happy to help you with Exercise 1.1 of NCERT Class 12 Mathematics.\n\n**Exercise 1.1:**");

  var item_21_gm = form.addScaleItem()
    .setTitle("Pair 21 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_21_pr = form.addScaleItem()
    .setTitle("Pair 21 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_21_bl = form.addScaleItem()
    .setTitle("Pair 21 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 21 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM A ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section A \u2014 High-Variance Pairs (Pairs 1\u201320)")
    .setHelpText("These 20 pairs had the highest rater disagreement in the preliminary study. Your expert ratings will help clarify whether disagreement was due to genuine ambiguity or lack of calibration.");

  // Pair 22: pair_0039
  form.addSectionHeaderItem()
    .setTitle("Pair 22/50  [pair_0039  |  Grade: Secondary  |  Bloom: Apply]")
    .setHelpText("QUESTION: What exact question from Exercise 7.3 of NCERT Class 9 Mathematics are you struggling with?\n\nRETRIEVED CHUNK: Question: EXERCISE 1.1\n\nAnswer: I'd be happy to help you with Exercise 1.1 of NCERT Class 12 Mathematics.\n\n**Exercise 1.1:**");

  var item_22_gm = form.addScaleItem()
    .setTitle("Pair 22 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_22_pr = form.addScaleItem()
    .setTitle("Pair 22 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_22_bl = form.addScaleItem()
    .setTitle("Pair 22 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 22 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 23: pair_0040
  form.addSectionHeaderItem()
    .setTitle("Pair 23/50  [pair_0040  |  Grade: Secondary  |  Bloom: Create]")
    .setHelpText("QUESTION: Design a detailed solution guideline that I can follow to get a clear and detailed solution for any question in NCERT Class 9 Mathematics.\n\nRETRIEVED CHUNK: Answer: I'd be happy to help you with the question.\n\nHowever, I don't see the specific question from NCERT Class 11 Mathematics [K\nthat you would like me to answer. Could you please provide the question num[3D[K\nnumber or a brief description of the topic (e.g., algebra, geometry, calcul[6D[K\ncalculus)?\n\nOnce I have the correct question, I'll provide a detailed and clear explana[7D[K\nexplanation in student-friendly language, aligning with the NCERT Curriculu[9D[K\nCurriculum for Class 11");

  var item_23_gm = form.addScaleItem()
    .setTitle("Pair 23 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_23_pr = form.addScaleItem()
    .setTitle("Pair 23 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_23_bl = form.addScaleItem()
    .setTitle("Pair 23 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 23 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM B ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section B \u2014 Lower CAS Pairs (Pairs 21\u201340)")
    .setHelpText("These 20 pairs had the lowest curriculum alignment scores in the preliminary study. They are the most discriminating \u2014 please rate carefully.");

  // Pair 24: pair_0044
  form.addSectionHeaderItem()
    .setTitle("Pair 24/50  [pair_0044  |  Grade: Middle  |  Bloom: Analyze]")
    .setHelpText("QUESTION: What are the similarities and differences in the steps used to solve each of the linear equations in the passage?\n\nRETRIEVED CHUNK: solution at all. Imagine two roads that run parallel but never connect - yo[2D[K\nyou can't find a place where both roads meet!\n\nSo, to summarize:\n\n- Lines intersecting = Consistent pair with one solution\n- Lines coinciding = Dependent pair with infinite solutions\n- Parallel lines = No solution\n\nUnderstanding these concepts will help you visualize and solve linear equat[5D[K\nequations in the graphical method.\n\nQuestion: 3. Algebraic Methods : We have discussed the following methods for findin");

  var item_24_gm = form.addScaleItem()
    .setTitle("Pair 24 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_24_pr = form.addScaleItem()
    .setTitle("Pair 24 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_24_bl = form.addScaleItem()
    .setTitle("Pair 24 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 24 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM C ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section C \u2014 High CAS Anchor Pairs (Pairs 41\u201350)")
    .setHelpText("These 10 pairs had the highest curriculum alignment scores. They serve as positive anchors \u2014 we expect you to rate them highly too.");

  // Pair 25: pair_0045
  form.addSectionHeaderItem()
    .setTitle("Pair 25/50  [pair_0045  |  Grade: Middle  |  Bloom: Analyze]")
    .setHelpText("QUESTION: How does the concept of a linear equation relate to the graph of a straight line, as described in the passage?\n\nRETRIEVED CHUNK: 1. Equation of a Line:\n\nThe equation of a line can be written in two forms:\n\na) Slope-Intercept Form (y = mx + c):\n\nwhere m is the slope and c is the y-intercept.\n\nb) Point-Slope Form (y - y1 = m(x - x1)):\n\nwhere (x1, y1) is a point on the line and m is the slope.\n\nTo find the equation of a line, we need to know either the slope or two poi[3D[K\npoints on the line. If we know the slope and one point, we can use the poin[4D[K\npoint-slope form to write the equation of the line.");

  var item_25_gm = form.addScaleItem()
    .setTitle("Pair 25 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_25_pr = form.addScaleItem()
    .setTitle("Pair 25 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_25_bl = form.addScaleItem()
    .setTitle("Pair 25 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 25 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM B ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section B \u2014 Lower CAS Pairs (Pairs 21\u201340)")
    .setHelpText("These 20 pairs had the lowest curriculum alignment scores in the preliminary study. They are the most discriminating \u2014 please rate carefully.");

  // Pair 26: pair_0046
  form.addSectionHeaderItem()
    .setTitle("Pair 26/50  [pair_0046  |  Grade: Middle  |  Bloom: Evaluate]")
    .setHelpText("QUESTION: What are the necessary steps to solve a linear equation, and can you give an example from the passage?\n\nRETRIEVED CHUNK: Exercise 5.3 of NCERT Class 10 Mathematics deals with solving linear equati[6D[K\nequations in one variable.\n\n**What is a Linear Equation?**\n\nA linear equation is an equation in which the highest power of the variable[8D[K\nvariable (in this case, 'x') is 1. For example: x + 2 = 7, 2x - 3 = 5\n\n**How to Solve Linear Equations?**\n\nTo solve a linear equation, we need to isolate the variable (in this case, [K\n'x') on one side of the equation.\n\nHere's the step-by-step process:");

  var item_26_gm = form.addScaleItem()
    .setTitle("Pair 26 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_26_pr = form.addScaleItem()
    .setTitle("Pair 26 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_26_bl = form.addScaleItem()
    .setTitle("Pair 26 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 26 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 27: pair_0047
  form.addSectionHeaderItem()
    .setTitle("Pair 27/50  [pair_0047  |  Grade: Middle  |  Bloom: Evaluate]")
    .setHelpText("QUESTION: Do you think following the same steps to solve a linear equation will always lead to a correct solution, and why or why not?\n\nRETRIEVED CHUNK: solutions or no solution at all.\n\nLet's consider two examples:");

  var item_27_gm = form.addScaleItem()
    .setTitle("Pair 27 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_27_pr = form.addScaleItem()
    .setTitle("Pair 27 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_27_bl = form.addScaleItem()
    .setTitle("Pair 27 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 27 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM A ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section A \u2014 High-Variance Pairs (Pairs 1\u201320)")
    .setHelpText("These 20 pairs had the highest rater disagreement in the preliminary study. Your expert ratings will help clarify whether disagreement was due to genuine ambiguity or lack of calibration.");

  // Pair 28: pair_0048
  form.addSectionHeaderItem()
    .setTitle("Pair 28/50  [pair_0048  |  Grade: Middle  |  Bloom: Understand]")
    .setHelpText("QUESTION: What are the different factors that influence the development of a society, as mentioned in the passage?\n\nRETRIEVED CHUNK: 2. Understand the context and any given conditions.");

  var item_28_gm = form.addScaleItem()
    .setTitle("Pair 28 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_28_pr = form.addScaleItem()
    .setTitle("Pair 28 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_28_bl = form.addScaleItem()
    .setTitle("Pair 28 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 28 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM B ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section B \u2014 Lower CAS Pairs (Pairs 21\u201340)")
    .setHelpText("These 20 pairs had the lowest curriculum alignment scores in the preliminary study. They are the most discriminating \u2014 please rate carefully.");

  // Pair 29: pair_0049
  form.addSectionHeaderItem()
    .setTitle("Pair 29/50  [pair_0049  |  Grade: Middle  |  Bloom: Understand]")
    .setHelpText("QUESTION: How does the concept of 'when' relate to the development of different societies, according to the passage?\n\nRETRIEVED CHUNK: (i) Man is not mortal.\n\nIn this statement, the word \"not\" has been used before the word \"mortal\". T[1D[K\nThis means that man can be mortal, but it is not always the case. Therefore[9D[K\nTherefore, this statement is a conditional statement.\n\n(ii) Line l is not parallel to line m.\n\nHere, we're saying that line l is NOT parallel to line m. It doesn't mean t[1D[K\nthat line l and line m are always NOT parallel. We need more information ab[2D[K\nabout these lines to make a conclusion.\n\n(iii) Th");

  var item_29_gm = form.addScaleItem()
    .setTitle("Pair 29 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_29_pr = form.addScaleItem()
    .setTitle("Pair 29 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_29_bl = form.addScaleItem()
    .setTitle("Pair 29 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 29 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 30: pair_0051
  form.addSectionHeaderItem()
    .setTitle("Pair 30/50  [pair_0051  |  Grade: Middle  |  Bloom: Create]")
    .setHelpText("QUESTION: Propose a new way to categorize societies based on the factors mentioned in the passage ('how' and 'when'). Be sure to include clear examples for each category.\n\nRETRIEVED CHUNK: 1. Understand the context and identify what needs to be found.");

  var item_30_gm = form.addScaleItem()
    .setTitle("Pair 30 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_30_pr = form.addScaleItem()
    .setTitle("Pair 30 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_30_bl = form.addScaleItem()
    .setTitle("Pair 30 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 30 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM A ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section A \u2014 High-Variance Pairs (Pairs 1\u201320)")
    .setHelpText("These 20 pairs had the highest rater disagreement in the preliminary study. Your expert ratings will help clarify whether disagreement was due to genuine ambiguity or lack of calibration.");

  // Pair 31: pair_0052
  form.addSectionHeaderItem()
    .setTitle("Pair 31/50  [pair_0052  |  Grade: Middle  |  Bloom: Apply]")
    .setHelpText("QUESTION: A new society is being developed in a remote island. What are some physical, biological, cultural, and economic factors that could influence its development?\n\nRETRIEVED CHUNK: 2. Geometry: Topics include points, lines, circles, triangles, quadrilatera[12D[K\nquadrilaterals, and 3D geometry.");

  var item_31_gm = form.addScaleItem()
    .setTitle("Pair 31 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_31_pr = form.addScaleItem()
    .setTitle("Pair 31 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_31_bl = form.addScaleItem()
    .setTitle("Pair 31 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 31 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 32: pair_0055
  form.addSectionHeaderItem()
    .setTitle("Pair 32/50  [pair_0055  |  Grade: Higher Secondary  |  Bloom: Understand]")
    .setHelpText("QUESTION: According to the passage, what is meant by 'net of states' share' in the context of Tax Revenue?\n\nRETRIEVED CHUNK: 3. Isolate the variable: Use inverse operations (such as addition/subtracti[18D[K\naddition/subtraction, multiplication/division) to get rid of any constants [K\nor coefficients.\n\nUnfortunately, without more information about the equation, I cannot provid[6D[K\nprovide a specific solution.\n\nQuestion: 7. (a) Total revenue in the market - I = `46000\n\nAnswer: Let's break it down step by step.\n\nThe problem is related to the Total Revenue Formula, which states that Tota[4D[K\nTotal Revenue = Sum o");

  var item_32_gm = form.addScaleItem()
    .setTitle("Pair 32 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_32_pr = form.addScaleItem()
    .setTitle("Pair 32 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_32_bl = form.addScaleItem()
    .setTitle("Pair 32 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 32 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM B ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section B \u2014 Lower CAS Pairs (Pairs 21\u201340)")
    .setHelpText("These 20 pairs had the lowest curriculum alignment scores in the preliminary study. They are the most discriminating \u2014 please rate carefully.");

  // Pair 33: pair_0056
  form.addSectionHeaderItem()
    .setTitle("Pair 33/50  [pair_0056  |  Grade: Higher Secondary  |  Bloom: Remember]")
    .setHelpText("QUESTION: According to the passage, what does 'net of states' share' mean in the context of Tax Revenue?\n\nRETRIEVED CHUNK: Example: If A = {1, 2} and B = {2, 3}, then A\u222aB = {1, 2, 3}\n\n(v) n(A U B): The number of elements in the union of sets A and B.");

  var item_33_gm = form.addScaleItem()
    .setTitle("Pair 33 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_33_pr = form.addScaleItem()
    .setTitle("Pair 33 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_33_bl = form.addScaleItem()
    .setTitle("Pair 33 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 33 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM A ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section A \u2014 High-Variance Pairs (Pairs 1\u201320)")
    .setHelpText("These 20 pairs had the highest rater disagreement in the preliminary study. Your expert ratings will help clarify whether disagreement was due to genuine ambiguity or lack of calibration.");

  // Pair 34: pair_0057
  form.addSectionHeaderItem()
    .setTitle("Pair 34/50  [pair_0057  |  Grade: Higher Secondary  |  Bloom: Evaluate]")
    .setHelpText("QUESTION: What are the implications of deducting the amount of tax shared with state governments in calculating Tax Revenue?\n\nRETRIEVED CHUNK: 3. Isolate the variable: Use inverse operations (such as addition/subtracti[18D[K\naddition/subtraction, multiplication/division) to get rid of any constants [K\nor coefficients.\n\nUnfortunately, without more information about the equation, I cannot provid[6D[K\nprovide a specific solution.\n\nQuestion: 7. (a) Total revenue in the market - I = `46000\n\nAnswer: Let's break it down step by step.\n\nThe problem is related to the Total Revenue Formula, which states that Tota[4D[K\nTotal Revenue = Sum o");

  var item_34_gm = form.addScaleItem()
    .setTitle("Pair 34 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_34_pr = form.addScaleItem()
    .setTitle("Pair 34 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_34_bl = form.addScaleItem()
    .setTitle("Pair 34 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 34 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM C ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section C \u2014 High CAS Anchor Pairs (Pairs 41\u201350)")
    .setHelpText("These 10 pairs had the highest curriculum alignment scores. They serve as positive anchors \u2014 we expect you to rate them highly too.");

  // Pair 35: pair_0067
  form.addSectionHeaderItem()
    .setTitle("Pair 35/50  [pair_0067  |  Grade: Higher Secondary  |  Bloom: Evaluate]")
    .setHelpText("QUESTION: What is the primary reason for growing global concerns about the environment, according to the passage?\n\nRETRIEVED CHUNK: 2. Understand the context and any given conditions.");

  var item_35_gm = form.addScaleItem()
    .setTitle("Pair 35 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_35_pr = form.addScaleItem()
    .setTitle("Pair 35 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_35_bl = form.addScaleItem()
    .setTitle("Pair 35 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 35 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM A ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section A \u2014 High-Variance Pairs (Pairs 1\u201320)")
    .setHelpText("These 20 pairs had the highest rater disagreement in the preliminary study. Your expert ratings will help clarify whether disagreement was due to genuine ambiguity or lack of calibration.");

  // Pair 36: pair_0070
  form.addSectionHeaderItem()
    .setTitle("Pair 36/50  [pair_0070  |  Grade: Higher Secondary  |  Bloom: Analyze]")
    .setHelpText("QUESTION: How does the role of indigenous communities in environmental conservation relate to the growing concern about protecting nature?\n\nRETRIEVED CHUNK: 1. Understand the context and identify what needs to be found.");

  var item_36_gm = form.addScaleItem()
    .setTitle("Pair 36 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_36_pr = form.addScaleItem()
    .setTitle("Pair 36 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_36_bl = form.addScaleItem()
    .setTitle("Pair 36 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 36 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM C ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section C \u2014 High CAS Anchor Pairs (Pairs 41\u201350)")
    .setHelpText("These 10 pairs had the highest curriculum alignment scores. They serve as positive anchors \u2014 we expect you to rate them highly too.");

  // Pair 37: pair_0071
  form.addSectionHeaderItem()
    .setTitle("Pair 37/50  [pair_0071  |  Grade: Secondary  |  Bloom: Evaluate]")
    .setHelpText("QUESTION: What are the advantages and disadvantages of intravarietal crossing compared to interspecific or intergeneric crossing?\n\nRETRIEVED CHUNK: solution at all. Imagine two roads that run parallel but never connect - yo[2D[K\nyou can't find a place where both roads meet!\n\nSo, to summarize:\n\n- Lines intersecting = Consistent pair with one solution\n- Lines coinciding = Dependent pair with infinite solutions\n- Parallel lines = No solution\n\nUnderstanding these concepts will help you visualize and solve linear equat[5D[K\nequations in the graphical method.\n\nQuestion: 3. Algebraic Methods : We have discussed the following methods for findin");

  var item_37_gm = form.addScaleItem()
    .setTitle("Pair 37 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_37_pr = form.addScaleItem()
    .setTitle("Pair 37 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_37_bl = form.addScaleItem()
    .setTitle("Pair 37 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 37 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 38: pair_0072
  form.addSectionHeaderItem()
    .setTitle("Pair 38/50  [pair_0072  |  Grade: Secondary  |  Bloom: Evaluate]")
    .setHelpText("QUESTION: Do you think the benefits of interspecific or intergeneric crossing outweigh the challenges of breeding plants from different genera or species?\n\nRETRIEVED CHUNK: (iv) If a plant is alive, then it has flowers.\n\nThis statement is also an example of a conditional statement. The condition[9D[K\ncondition is \"a plant is alive\" and the consequence or effect is \"it has fl[2D[K\nflowers\".\n\nTo understand this statement, we need to know that not all living organisms[9D[K\norganisms have flowers. However, many plants are known to have beautiful fl[2D[K\nflowers as part of their reproductive cycle.\n\nThis type of statement can be represented mathematically as:\n\n\"");

  var item_38_gm = form.addScaleItem()
    .setTitle("Pair 38 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_38_pr = form.addScaleItem()
    .setTitle("Pair 38 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_38_bl = form.addScaleItem()
    .setTitle("Pair 38 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 38 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 39: pair_0083
  form.addSectionHeaderItem()
    .setTitle("Pair 39/50  [pair_0083  |  Grade: Secondary  |  Bloom: Understand]")
    .setHelpText("QUESTION: What is the mathematical rule that determines the number of pairs of rabbits in a given month?\n\nRETRIEVED CHUNK: Question: 1. Consider the following situation.\n\nAnswer: Let's solve this classic problem using a simple mathematical model.\n\nThe problem states that we start with just two rabbits and let them reprodu[7D[K\nreproduce. We want to find out how many pairs of rabbits we will have after[5D[K\nafter each month. To do this, we need to understand the pattern in the numb[4D[K\nnumber of rabbit pairs.\n\nMonth 0: We start with 1 pair of rabbits.\nMonth 1: The initial pair produces a new pair, so we now ha");

  var item_39_gm = form.addScaleItem()
    .setTitle("Pair 39 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_39_pr = form.addScaleItem()
    .setTitle("Pair 39 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_39_bl = form.addScaleItem()
    .setTitle("Pair 39 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 39 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 40: pair_0086
  form.addSectionHeaderItem()
    .setTitle("Pair 40/50  [pair_0086  |  Grade: Secondary  |  Bloom: Remember]")
    .setHelpText("QUESTION: According to the mathematical model, how is the number of rabbit pairs calculated each month?\n\nRETRIEVED CHUNK: Question: 1. Consider the following situation.\n\nAnswer: Let's solve this classic problem using a simple mathematical model.\n\nThe problem states that we start with just two rabbits and let them reprodu[7D[K\nreproduce. We want to find out how many pairs of rabbits we will have after[5D[K\nafter each month. To do this, we need to understand the pattern in the numb[4D[K\nnumber of rabbit pairs.\n\nMonth 0: We start with 1 pair of rabbits.\nMonth 1: The initial pair produces a new pair, so we now ha");

  var item_40_gm = form.addScaleItem()
    .setTitle("Pair 40 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_40_pr = form.addScaleItem()
    .setTitle("Pair 40 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_40_bl = form.addScaleItem()
    .setTitle("Pair 40 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 40 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM B ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section B \u2014 Lower CAS Pairs (Pairs 21\u201340)")
    .setHelpText("These 20 pairs had the lowest curriculum alignment scores in the preliminary study. They are the most discriminating \u2014 please rate carefully.");

  // Pair 41: pair_0093
  form.addSectionHeaderItem()
    .setTitle("Pair 41/50  [pair_0093  |  Grade: Higher Secondary  |  Bloom: Analyze]")
    .setHelpText("QUESTION: What are the similarities and differences between the two constraints, x + 2y \u2264 4 and x - y \u2264 -1, in terms of their graphical representation on the coordinate plane?\n\nRETRIEVED CHUNK: 3. y \u2265 0\n\nWe can start by graphing these constraints on a coordinate plane. The const[5D[K\nconstraint x + y \u2264 4 is a line with slope -1 and intercept 4. Since x \u2265 0 a[1D[K\nand y \u2265 0, we will only consider the first quadrant.\n\nNow, let's find the corner points of the feasible region:\n\nCorner point 1: (0,0) - This point lies on the x-axis and satisfies all con[3D[K\nconstraints.\nCorner point 2: (0,4) - This point lies on the y-axis and satisfies all con[3D[K\nconstraints.\nCorner point 3: (4,");

  var item_41_gm = form.addScaleItem()
    .setTitle("Pair 41 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_41_pr = form.addScaleItem()
    .setTitle("Pair 41 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_41_bl = form.addScaleItem()
    .setTitle("Pair 41 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 41 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 42: pair_0110
  form.addSectionHeaderItem()
    .setTitle("Pair 42/50  [pair_0110  |  Grade: Higher Secondary  |  Bloom: Remember]")
    .setHelpText("QUESTION: According to the passage, what is the approximate number of people who are considered the poorest?\n\nRETRIEVED CHUNK: 3. Now, we'll calculate the deviations from the median age for each person:[7D[K\nperson:\nDeviations: | Age - Median |\n|--------------|\n| 16 - 31.5    | 15.5\n| 21 - 31.5    | 10\n| 26 - 31.5    | 5\n| 31 - 31.5    | 0\n| 36 - 31.5    | 4.5\n| 41 - 31.5    | 9.5\n| 46 - 31.5    | 14.5\n| 51 - 31.5    | 19.5");

  var item_42_gm = form.addScaleItem()
    .setTitle("Pair 42 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_42_pr = form.addScaleItem()
    .setTitle("Pair 42 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_42_bl = form.addScaleItem()
    .setTitle("Pair 42 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 42 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM C ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section C \u2014 High CAS Anchor Pairs (Pairs 41\u201350)")
    .setHelpText("These 10 pairs had the highest curriculum alignment scores. They serve as positive anchors \u2014 we expect you to rate them highly too.");

  // Pair 43: pair_0113
  form.addSectionHeaderItem()
    .setTitle("Pair 43/50  [pair_0113  |  Grade: Higher Secondary  |  Bloom: Create]")
    .setHelpText("QUESTION: Design a new slogan that captures the essence of India's commitment to supporting both its soldiers and farmers, similar to 'Jai Jawan Jai Kisan'.\n\nRETRIEVED CHUNK: 2. Fuel price in Delhi = \u20b945 per litre");

  var item_43_gm = form.addScaleItem()
    .setTitle("Pair 43 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_43_pr = form.addScaleItem()
    .setTitle("Pair 43 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_43_bl = form.addScaleItem()
    .setTitle("Pair 43 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 43 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 44: pair_0124
  form.addSectionHeaderItem()
    .setTitle("Pair 44/50  [pair_0124  |  Grade: Secondary  |  Bloom: Create]")
    .setHelpText("QUESTION: Propose a scenario where an elementary event is not possible, and explain why it cannot be considered an elementary event.\n\nRETRIEVED CHUNK: Question: 1. An event having only one outcome of the experiment is called an elementary\n\nAnswer: Class 10 Mathematics Students,\n\nLet's learn about an important concept in Probability - Elementary Events!\n\nAn event is called an elementary event if it has only one possible outcome [K\nwhen the experiment is conducted. In simpler terms, if you can predict exac[4D[K\nexactly what will happen during the experiment with 100% certainty, then th[2D[K\nthat outcome is considered an elementary event.\n\nT");

  var item_44_gm = form.addScaleItem()
    .setTitle("Pair 44 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_44_pr = form.addScaleItem()
    .setTitle("Pair 44 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_44_bl = form.addScaleItem()
    .setTitle("Pair 44 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 44 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM B ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section B \u2014 Lower CAS Pairs (Pairs 21\u201340)")
    .setHelpText("These 20 pairs had the lowest curriculum alignment scores in the preliminary study. They are the most discriminating \u2014 please rate carefully.");

  // Pair 45: pair_0126
  form.addSectionHeaderItem()
    .setTitle("Pair 45/50  [pair_0126  |  Grade: Higher Secondary  |  Bloom: Understand]")
    .setHelpText("QUESTION: How did the team ensure accuracy while comparing verses from different manuscripts?\n\nRETRIEVED CHUNK: solutions, while pair (v) has a consistent solution.\n\nQuestion: 4. Which of the following pairs of linear equations are consistent/inconsistent? If\n\nAnswer: Class 10 students! Let's solve this problem step by step.\n\n(i) x + y = 5, 2x + 2y = 10\nTo check if these equations are consistent or inconsistent, we need to see [K\nif they have the same solution. \n\nFirst, let's multiply the first equation by 2: \n2(x + y) = 2(5)\n\u21d2 2x + 2y = 10\n\nNow we can compare both equations:\nx + y = 5\n2x + 2y = 10\n\nThey");

  var item_45_gm = form.addScaleItem()
    .setTitle("Pair 45 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_45_pr = form.addScaleItem()
    .setTitle("Pair 45 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_45_bl = form.addScaleItem()
    .setTitle("Pair 45 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 45 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 46: pair_0129
  form.addSectionHeaderItem()
    .setTitle("Pair 46/50  [pair_0129  |  Grade: Higher Secondary  |  Bloom: Analyze]")
    .setHelpText("QUESTION: How did the team led by V.S. Sukthankar face the challenge of comparing Sanskrit manuscripts written in different scripts?\n\nRETRIEVED CHUNK: Let's analyze each option:\n\n(i) The collection of all the months of a year beginning with the letter J:[2D[K\nJ: This is not a set because it contains multiple elements (January, June, [K\nJuly, ...), but it doesn't explicitly define which months to include.\n\n(ii) The collection of ten most talented writers of India: This is a set be[2D[K\nbecause it's a well-defined collection of unique individuals.\n\n(iii) A team of eleven best-cricket batsmen of the world: Similar to option[6D[K\noption (ii");

  var item_46_gm = form.addScaleItem()
    .setTitle("Pair 46 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_46_pr = form.addScaleItem()
    .setTitle("Pair 46 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_46_bl = form.addScaleItem()
    .setTitle("Pair 46 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 46 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM A ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section A \u2014 High-Variance Pairs (Pairs 1\u201320)")
    .setHelpText("These 20 pairs had the highest rater disagreement in the preliminary study. Your expert ratings will help clarify whether disagreement was due to genuine ambiguity or lack of calibration.");

  // Pair 47: pair_0132
  form.addSectionHeaderItem()
    .setTitle("Pair 47/50  [pair_0132  |  Grade: Higher Secondary  |  Bloom: Understand]")
    .setHelpText("QUESTION: How does the primary meristem in a monocot root contribute to the growth of the plant, according to the passage?\n\nRETRIEVED CHUNK: 2. Now, let's count the frequency of leaves in each class and add them up:\n   - 117.5 - 126.5: 3\n   - 126.5 - 135.5: 10 (5 + 5)\n   - 136.5 - 145.5: 21 (9 + 12)\n   - 146.5 - 155.5: 17 (12 + 5)\n   - 156.5 - 165.5: 9\n   - 166.5 - 175.5: 8\n   - 176.5 - 185.5: 4");

  var item_47_gm = form.addScaleItem()
    .setTitle("Pair 47 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_47_pr = form.addScaleItem()
    .setTitle("Pair 47 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_47_bl = form.addScaleItem()
    .setTitle("Pair 47 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 47 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // Pair 48: pair_0133
  form.addSectionHeaderItem()
    .setTitle("Pair 48/50  [pair_0133  |  Grade: Higher Secondary  |  Bloom: Apply]")
    .setHelpText("QUESTION: If you were to compare the root systems of a monocot and a dicot plant, how would you describe the primary differences in their root structures?\n\nRETRIEVED CHUNK: Example 1: A triangle with base 10 cm and height 6 cm is similar to a trian[5D[K\ntriangle with base 15 cm and height 9 cm. Although they have different size[4D[K\nsizes, their shapes are identical.");

  var item_48_gm = form.addScaleItem()
    .setTitle("Pair 48 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_48_pr = form.addScaleItem()
    .setTitle("Pair 48 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_48_bl = form.addScaleItem()
    .setTitle("Pair 48 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 48 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM B ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section B \u2014 Lower CAS Pairs (Pairs 21\u201340)")
    .setHelpText("These 20 pairs had the lowest curriculum alignment scores in the preliminary study. They are the most discriminating \u2014 please rate carefully.");

  // Pair 49: pair_0134
  form.addSectionHeaderItem()
    .setTitle("Pair 49/50  [pair_0134  |  Grade: Higher Secondary  |  Bloom: Apply]")
    .setHelpText("QUESTION: Suppose you're given a seedling of a monocot plant, how would you use the features of its root system to optimize its water absorption?\n\nRETRIEVED CHUNK: 3. If the result is equal to zero, then \u03b1 is indeed a root of the given equ[3D[K\nequation.\n\nFor example, let's say we want to find if \u03b1 = -1 is a root of the quadratic[9D[K\nquadratic equation x^2 + 5x + 6 = 0.\n\nSubstitute \u03b1 = -1 in place of x: a(-1)^2 + b(-1) + c = 0\nSimplify: a(1) - b + c = 0\nSince (-1)^2 = 1, we get: a - b + c = 0\n\nNow, compare this with the original equation: \u03b1 is a root if a\u03b1^2 + b\u03b1 + c [K\n= 0\n\nSo, in this case, since a(-1)^2 + b(-1) + c = 0, \u03b1 = -1 is indeed a root of");

  var item_49_gm = form.addScaleItem()
    .setTitle("Pair 49 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_49_pr = form.addScaleItem()
    .setTitle("Pair 49 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_49_bl = form.addScaleItem()
    .setTitle("Pair 49 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 49 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── STRATUM C ──────────────────────────────────────────────
  form.addPageBreakItem()
    .setTitle("Section C \u2014 High CAS Anchor Pairs (Pairs 41\u201350)")
    .setHelpText("These 10 pairs had the highest curriculum alignment scores. They serve as positive anchors \u2014 we expect you to rate them highly too.");

  // Pair 50: pair_0148
  form.addSectionHeaderItem()
    .setTitle("Pair 50/50  [pair_0148  |  Grade: Secondary  |  Bloom: Remember]")
    .setHelpText("QUESTION: What is a main difference between government colleges and private colleges in terms of fees?\n\nRETRIEVED CHUNK: pr[4D[K\nrepresented as {a1, a2, a3, ..., an} where 'n' represents the last element [K\nin the set.\n\nFor example, consider the set of all students in your class. This is a fini[4D[K\nfinite set because it has a specific number of students (let's say 20).\n\nAnother example is the set of all capitals of Indian states. There are only[4D[K\nonly 28 capitals, so this is also a finite set.\n\nIn conclusion, infinite sets have an unlimited number of elements, while fi[2D[K\nfinite sets have a limited");

  var item_50_gm = form.addScaleItem()
    .setTitle("Pair 50 \u2014 Grade Match")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_50_pr = form.addScaleItem()
    .setTitle("Pair 50 \u2014 Prereq Coverage")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  var item_50_bl = form.addScaleItem()
    .setTitle("Pair 50 \u2014 Bloom Alignment")
    .setBounds(1, 5)
    .setLabels('1 — No match / Inaccessible', '5 — Perfect match / Fully accessible')
    .setRequired(true);

  form.addTextItem()
    .setTitle("Pair 50 \u2014 Notes (optional, for borderline cases)")
    .setRequired(false);

  // ── Done ────────────────────────────────────────────────────
  var url = form.getPublishedUrl();
  var editUrl = form.getEditUrl();
  Logger.log('Form created!');
  Logger.log('Share this with raters: ' + url);
  Logger.log('Edit URL: ' + editUrl);
  Browser.msgBox(
    'Form created successfully!\n\n' +
    'Rater URL:\n' + url + '\n\n' +
    'Edit URL:\n' + editUrl);
}