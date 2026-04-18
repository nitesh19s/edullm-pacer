# Phase 2 Quick Start Guide

**Get started with the new research tools in 5 minutes**

---

## ✅ What's New

You now have **5 powerful research modules** integrated into your platform:

1. **📊 Analytics Dashboard** - Comprehensive reports and insights
2. **⚖️ Baseline Comparator** - Systematic experiment comparison
3. **📈 Statistical Analyzer** - Rigorous statistical tests
4. **📄 Enhanced PDF Processor** - Better NCERT extraction
5. **🧪 A/B Testing Framework** - Controlled experiments

---

## 🚀 Quick Start

### Step 1: Refresh Your Browser

The new modules are already loaded! Just refresh:
```
http://localhost:8080
```

### Step 2: Explore New Sections

Check the sidebar - you'll see a new **"Research Tools"** section with:
- Analytics
- Comparisons
- A/B Testing

### Step 3: Try Basic Features

#### Generate Your First Analytics Report

1. Click **Analytics** in the sidebar
2. Click **"Generate Report"**
3. View your comprehensive research summary!

#### Compare Experiments

1. Go to **Experiments** page
2. Create 2-3 experiments (or use existing ones)
3. Click **Comparisons** in sidebar
4. Click **"New Comparison"**
5. Select experiments to compare
6. View statistical results!

#### Run Statistical Tests

Open browser console and try:

```javascript
// Basic statistics
const data = [0.85, 0.87, 0.89, 0.86, 0.88];
const stats = window.statisticalAnalyzer.calculateDescriptiveStats(data);
console.log('Mean:', stats.mean);
console.log('95% CI:', stats.ci95);

// T-test
const sample1 = [0.85, 0.87, 0.89];
const sample2 = [0.90, 0.92, 0.91];
const test = window.statisticalAnalyzer.tTest(sample1, sample2);
console.log('p-value:', test.pValue);
console.log('Significant:', test.significant);
```

---

## 📖 Common Workflows

### Workflow 1: Compare Two Approaches

```javascript
// 1. Create two experiments with different configs
const exp1 = await window.experimentTracker.createExperiment(
    'Semantic Chunking',
    'Using semantic boundaries'
);

const exp2 = await window.experimentTracker.createExperiment(
    'Fixed Chunking',
    'Using fixed size chunks'
);

// 2. Run experiments and record metrics
// ... your experiment code ...

// 3. Compare them
const comparison = await window.baselineComparator.createComparison(
    'Chunking Strategy Comparison',
    [exp1.id, exp2.id],
    { metrics: ['precision', 'recall', 'f1_score'] }
);

// 4. View results
console.log('Winner:', comparison.results.rankings.overall[0]);
console.log('Insights:', comparison.results.insights);
```

### Workflow 2: Run A/B Test

```javascript
// 1. Create test
const test = await window.abTestingFramework.createTest(
    'Context Window Size Test',
    {
        primaryMetric: 'f1_score',
        minimumSampleSize: 30
    }
);

// 2. Add variants
await window.abTestingFramework.addVariant(test.id, 'Small (2k)', {
    parameters: { contextSize: 2000 },
    isControl: true
});

await window.abTestingFramework.addVariant(test.id, 'Large (4k)', {
    parameters: { contextSize: 4000 }
});

// 3. Start test
await window.abTestingFramework.startTest(test.id);

// 4. Run queries and record results
// For each query:
const variant = await window.abTestingFramework.assignVariant(test.id, userId);
// ... run query with variant config ...
await window.abTestingFramework.recordObservation(test.id, variant.id, {
    f1_score: 0.88,
    precision: 0.89,
    recall: 0.87
});

// 5. Check results
const results = window.abTestingFramework.getCurrentResults(test.id);
console.log('Winner:', results.stats.winner);
```

### Workflow 3: Generate Research Report

```javascript
// 1. Initialize dashboard
await window.analyticsDashboard.initialize();

// 2. Generate comprehensive report
const report = await window.analyticsDashboard.generateReport(
    'default_dashboard',
    {
        name: 'Weekly Progress Report',
        timeRange: { start: lastWeek, end: Date.now() }
    }
);

// 3. View sections
console.log('Executive Summary:', report.sections[0].data);
console.log('Key Insights:', report.sections[5].data.insights);
console.log('Recommendations:', report.sections[5].data.recommendations);

// 4. Export to Markdown
const markdown = window.analyticsDashboard.exportReport(
    report.id,
    'markdown'
);

// 5. Download or copy
console.log(markdown);
```

---

## 🎯 Testing the Features

### Test 1: Verify All Modules Loaded

Open browser console:

```javascript
// Check all modules are loaded
console.log('✅ Modules Status:');
console.log('Baseline Comparator:', typeof window.baselineComparator);
console.log('Statistical Analyzer:', typeof window.statisticalAnalyzer);
console.log('Analytics Dashboard:', typeof window.analyticsDashboard);
console.log('Enhanced PDF Processor:', typeof window.enhancedPDFProcessor);
console.log('A/B Testing Framework:', typeof window.abTestingFramework);

// Should all show 'object'
```

### Test 2: Create Demo Experiments

```javascript
// Create 3 demo experiments
for (let i = 1; i <= 3; i++) {
    const exp = await window.experimentTracker.createExperiment(
        `Demo Experiment ${i}`,
        `Testing approach ${i}`
    );

    const run = await window.experimentTracker.startRun(exp.id, 'Run 1');

    // Log some metrics
    window.experimentTracker.logMetric('precision', 0.80 + Math.random() * 0.15);
    window.experimentTracker.logMetric('recall', 0.75 + Math.random() * 0.15);
    window.experimentTracker.logMetric('f1_score', 0.77 + Math.random() * 0.15);

    await window.experimentTracker.endRun();
}

console.log('✅ Created 3 demo experiments!');
```

### Test 3: Generate Demo Report

```javascript
// Initialize and generate
await window.analyticsDashboard.initialize();
const report = await window.analyticsDashboard.generateReport();

console.log('✅ Report generated!');
console.log('Sections:', report.sections.map(s => s.title));
```

---

## 🔧 Troubleshooting

### Issue: Modules not loading

**Solution:** Check browser console for errors. Ensure all script files are in the same directory:
```
ls -la edullm-platform/
# Should see:
# - baseline-comparator.js
# - statistical-analyzer.js
# - analytics-dashboard.js
# - enhanced-pdf-processor.js
# - ab-testing-framework.js
```

### Issue: Can't see new pages in sidebar

**Solution:** Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Functions undefined

**Solution:** Ensure modules are initialized:
```javascript
await window.baselineComparator.initialize();
await window.statisticalAnalyzer.initialize();
await window.analyticsDashboard.initialize();
```

### Issue: localStorage full

**Solution:** Export data and clear:
```javascript
// Export
const data = localStorage.getItem('rag_comparisons');
// Save to file, then:
localStorage.clear();
```

---

## 📚 Next Steps

1. **Read Full Documentation**: See `PHASE_2_FEATURES.md` for complete details

2. **Run Your First Study**:
   - Define research question
   - Create baseline
   - Run variations
   - Compare statistically
   - Generate report

3. **Explore Statistical Tests**:
   - Try different tests (t-test, ANOVA, correlation)
   - Check normality
   - Detect outliers
   - Calculate effect sizes

4. **Build Your Research Pipeline**:
   - Data upload → Experiments → Analytics → Comparisons → Reports

5. **Export Results**:
   - All modules support export (JSON, CSV, Markdown)
   - Use for publications and presentations

---

## 💡 Pro Tips

### Tip 1: Always Check Significance

```javascript
// Don't just compare means - test significance!
const test = window.statisticalAnalyzer.tTest(sample1, sample2);
if (test.significant) {
    console.log('✅ Significant difference found!');
    console.log('Effect size:', test.effectSize.interpretation);
}
```

### Tip 2: Use Descriptive Statistics

```javascript
// Get full picture of your data
const stats = window.statisticalAnalyzer.calculateDescriptiveStats(data);
console.log('Mean:', stats.mean);
console.log('Median:', stats.median);
console.log('Std Dev:', stats.stdDev);
console.log('95% CI:', stats.ci95);
console.log('Skewness:', stats.skewness); // Check distribution shape
```

### Tip 3: Check for Outliers

```javascript
// Before analysis, detect outliers
const outliers = window.statisticalAnalyzer.detectOutliers(data);
console.log('IQR outliers:', outliers.methods.iqr.count);
console.log('Recommendation:', outliers.summary.recommendation);
```

### Tip 4: Regular Reports

```javascript
// Generate weekly/monthly reports
const report = await window.analyticsDashboard.generateReport(
    'default_dashboard',
    { name: 'Week ' + weekNumber }
);
```

### Tip 5: Document Everything

```javascript
// Add descriptions to experiments
const exp = await window.experimentTracker.createExperiment(
    'Clear Name',
    'Detailed description: testing X vs Y because...'
);

// Add tags for organization
exp.tags = ['phase-1', 'chunking', 'optimization'];
```

---

## 📊 Example: Complete Research Study

Here's a complete example workflow:

```javascript
// === SETUP ===
await window.baselineComparator.initialize();
await window.statisticalAnalyzer.initialize();
await window.analyticsDashboard.initialize();
await window.abTestingFramework.initialize();

// === BASELINE ===
const baseline = await window.experimentTracker.createExperiment(
    'Baseline RAG',
    'Initial configuration with semantic chunking'
);

// Run baseline tests (30 queries)
for (let i = 0; i < 30; i++) {
    const run = await window.experimentTracker.startRun(baseline.id);
    // ... run query ...
    window.experimentTracker.logMetric('precision', result.precision);
    window.experimentTracker.logMetric('recall', result.recall);
    await window.experimentTracker.endRun();
}

// === OPTIMIZATION EXPERIMENT ===
const optimized = await window.experimentTracker.createExperiment(
    'Optimized RAG',
    'Improved chunking + better retrieval'
);

// Run same 30 queries
for (let i = 0; i < 30; i++) {
    const run = await window.experimentTracker.startRun(optimized.id);
    // ... run query ...
    window.experimentTracker.logMetric('precision', result.precision);
    window.experimentTracker.logMetric('recall', result.recall);
    await window.experimentTracker.endRun();
}

// === ANALYSIS ===
// 1. Compare statistically
const comparison = await window.baselineComparator.createComparison(
    'Baseline vs Optimized',
    [baseline.id, optimized.id],
    {
        metrics: ['precision', 'recall', 'f1_score'],
        statisticalTests: true,
        confidenceLevel: 0.95
    }
);

console.log('Winner:', comparison.results.rankings.overall[0]);
console.log('Improvement:', comparison.results.lift);
console.log('Significant:', comparison.results.statisticalResults);

// 2. Detailed statistics
const baselineRuns = window.experimentTracker.getRuns(baseline.id);
const baselinePrecision = baselineRuns.map(r => r.metrics.precision);

const optimizedRuns = window.experimentTracker.getRuns(optimized.id);
const optimizedPrecision = optimizedRuns.map(r => r.metrics.precision);

const tTest = window.statisticalAnalyzer.tTest(
    baselinePrecision,
    optimizedPrecision
);

console.log('Statistical Test:');
console.log('- p-value:', tTest.pValue);
console.log('- Significant:', tTest.significant);
console.log('- Effect size:', tTest.effectSize.interpretation);

// 3. Generate report
const report = await window.analyticsDashboard.generateReport();

// 4. Export for paper
const markdown = window.analyticsDashboard.exportReport(report.id, 'markdown');
console.log(markdown);

// === PUBLICATION READY ===
console.log('✅ Study Complete!');
console.log('- Baseline performance documented');
console.log('- Improvement quantified');
console.log('- Statistical significance confirmed');
console.log('- Results exported for publication');
```

---

## 🎓 For PhD Research

### Research Quality Checklist

- [ ] Baseline established and documented
- [ ] Multiple runs (n ≥ 30) for statistical power
- [ ] Statistical significance tested (p < 0.05)
- [ ] Effect sizes calculated and reported
- [ ] Assumptions checked (normality, outliers)
- [ ] Multiple comparisons corrected (if needed)
- [ ] Results reproducible (all parameters saved)
- [ ] Comprehensive report generated
- [ ] Results exported for publication

### Publication-Ready Output

All modules support export formats suitable for academic papers:
- **CSV**: For importing into statistical software
- **JSON**: For sharing data and reproducibility
- **Markdown**: For converting to LaTeX/PDF

---

## ✅ Summary

You now have a **complete research infrastructure** for your PhD work:

✅ **Experiment Tracking** - Track all experiments and runs
✅ **Statistical Analysis** - Rigorous hypothesis testing
✅ **Systematic Comparison** - Compare approaches objectively
✅ **A/B Testing** - Run controlled experiments
✅ **Comprehensive Analytics** - Generate publication-ready reports

**Everything works offline** and persists in your browser!

**Ready to start your research? Open the platform and explore the new Research Tools section!**

---

For complete details, see `PHASE_2_FEATURES.md`

For the overall comparison of research requirements, see `RESEARCH_TOOL_COMPARISON.md`
