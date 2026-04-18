# Getting Started with Real Research

**Now that Phase 2 is complete, here's how to start your actual PhD research**

---

## 🎯 Current Status

✅ **Phase 2 Complete**: All research infrastructure is ready
✅ **Tested Successfully**: All modules working perfectly
✅ **Demo Data Created**: 3 experiments with 30 runs for testing

---

## 🚀 Next Steps for Real Research

### Step 1: Clean Demo Data (Optional)

If you want to start fresh:

```javascript
// Clear all demo data
localStorage.clear();

// Or keep some items and clear others
localStorage.removeItem('rag_experiments');
localStorage.removeItem('rag_comparisons');
localStorage.removeItem('rag_ab_tests');

// Then refresh the page
location.reload();
```

### Step 2: Upload Real NCERT Data

1. **Download NCERT PDFs**
   - Go to https://ncert.nic.in/textbook.php
   - Download PDFs for your target subjects and grades
   - Recommended: Start with 1-2 subjects (e.g., Mathematics Grade 10)

2. **Upload to Platform**
   - Click **"Data Upload"** in sidebar
   - Drag & drop NCERT PDF files
   - Enhanced PDF processor will extract:
     - Chapter structure
     - Headings and sections
     - Equations and tables
     - Images
     - Complete text content

3. **Index the Data**
   - Go to **"Experiments"** page
   - Click **"Index NCERT Data"**
   - This creates vector embeddings
   - **Note**: Currently uses simulated embeddings (works for testing)
   - For production: Add OpenAI API key (see Step 3)

### Step 3: Add OpenAI API Key (For Production)

**Current State**: Using simulated embeddings (good for testing)
**For Production**: Need real embeddings from OpenAI

1. **Get API Key**
   - Sign up at https://platform.openai.com
   - Create API key
   - Add credits ($5-10 is enough for research)

2. **Add to Platform**
   - Click **"Settings"** in sidebar
   - Find "LLM API Configuration" section
   - Enter your API key
   - Select model: `gpt-4-turbo-preview` or `gpt-3.5-turbo`
   - Click "Save Settings"

3. **Verify**
   ```javascript
   console.log('LLM configured:', window.llmService.isConfigured);
   // Should show: true
   ```

### Step 4: Create Your First Real Experiment

**Research Question Example**:
*"Does semantic chunking improve retrieval accuracy compared to fixed-size chunks for NCERT Mathematics content?"*

```javascript
// 1. Create baseline experiment
const baseline = await window.experimentTracker.createExperiment(
    'Baseline: Fixed-Size Chunking (512 tokens)',
    'Testing standard 512-token chunks with 50-token overlap',
    {
        chunkSize: 512,
        overlap: 50,
        retrievalMethod: 'cosine',
        embeddingModel: 'text-embedding-3-small'
    }
);

// 2. Run 30 test queries
const testQueries = [
    "Explain Pythagoras theorem",
    "What is quadratic formula?",
    "Define linear equations",
    // ... add 27 more queries
];

for (const query of testQueries) {
    const run = await window.experimentTracker.startRun(baseline.id);

    // Run your RAG query
    const result = await runRAGQuery(query);

    // Log metrics
    window.experimentTracker.logMetric('precision', result.precision);
    window.experimentTracker.logMetric('recall', result.recall);
    window.experimentTracker.logMetric('f1_score', result.f1_score);
    window.experimentTracker.logMetric('response_time', result.responseTime);

    await window.experimentTracker.endRun();
}

console.log('✅ Baseline experiment complete!');
```

### Step 5: Create Variations for Testing

```javascript
// Create semantic chunking experiment
const semantic = await window.experimentTracker.createExperiment(
    'Semantic Chunking (Sentence Boundaries)',
    'Using sentence boundaries for natural chunk breaks',
    {
        chunkingMethod: 'semantic',
        minChunkSize: 256,
        maxChunkSize: 768,
        retrievalMethod: 'cosine'
    }
);

// Run same test queries
// ... (same loop as baseline)

// Create hybrid approach
const hybrid = await window.experimentTracker.createExperiment(
    'Hybrid: Semantic + BM25',
    'Combining semantic chunking with BM25+Cosine fusion',
    {
        chunkingMethod: 'semantic',
        retrievalMethod: 'hybrid',
        fusionWeight: 0.7
    }
);

// Run same test queries
// ... (same loop as baseline)
```

### Step 6: Analyze Results

```javascript
// 1. Generate analytics report
await window.analyticsDashboard.initialize();
const report = await window.analyticsDashboard.generateReport(
    'default_dashboard',
    { name: 'Initial Research Results' }
);

// 2. Compare all approaches
const comparison = await window.baselineComparator.createComparison(
    'Chunking Strategy Comparison',
    [baseline.id, semantic.id, hybrid.id],
    {
        metrics: ['precision', 'recall', 'f1_score', 'response_time'],
        statisticalTests: true,
        confidenceLevel: 0.95
    }
);

// 3. View results
console.log('Winner:', comparison.results.rankings.overall[0]);
console.log('Insights:', comparison.results.insights);

// 4. Export for paper
const markdown = window.analyticsDashboard.exportReport(report.id, 'markdown');
copy(markdown); // Copy to clipboard
```

### Step 7: Run A/B Test for Optimization

```javascript
// Test if increasing top_k improves results
const test = await window.abTestingFramework.createTest(
    'Top-K Retrieval Optimization',
    {
        primaryMetric: 'f1_score',
        minimumSampleSize: 30
    }
);

await window.abTestingFramework.addVariant(test.id, 'Top-K = 3', {
    parameters: { topK: 3 },
    isControl: true
});

await window.abTestingFramework.addVariant(test.id, 'Top-K = 5', {
    parameters: { topK: 5 }
});

await window.abTestingFramework.startTest(test.id);

// Run queries for both variants...
// Check winner
const results = window.abTestingFramework.getCurrentResults(test.id);
console.log('Winner:', results.stats.winner);
```

---

## 📊 Research Workflow Template

### Week 1: Setup & Baseline
- [ ] Upload NCERT data (2-3 subjects)
- [ ] Index with vector embeddings
- [ ] Create baseline experiment
- [ ] Run 30+ test queries
- [ ] Calculate baseline metrics

### Week 2: Variations
- [ ] Identify 3-5 variations to test
- [ ] Create experiments for each
- [ ] Run same test queries
- [ ] Record all metrics

### Week 3: Analysis
- [ ] Compare all approaches
- [ ] Run statistical tests
- [ ] Generate comprehensive report
- [ ] Identify best configuration

### Week 4: Optimization
- [ ] Create A/B tests for fine-tuning
- [ ] Test parameter variations
- [ ] Validate improvements
- [ ] Document findings

### Ongoing: Documentation
- [ ] Export weekly reports
- [ ] Save comparison results
- [ ] Document methodology
- [ ] Prepare publication drafts

---

## 🎓 Research Quality Checklist

Before publishing results, ensure:

- [ ] **Sample Size**: At least 30 runs per experiment
- [ ] **Statistical Tests**: Significance tested (p < 0.05)
- [ ] **Effect Sizes**: Calculated and reported (Cohen's d)
- [ ] **Assumptions Checked**: Normality, outliers verified
- [ ] **Reproducible**: All parameters documented
- [ ] **Baseline Established**: Clear baseline for comparison
- [ ] **Multiple Metrics**: Not just one metric optimized
- [ ] **Cross-validated**: Results consistent across test sets

---

## 💡 Pro Tips

### Tip 1: Start Small
- Begin with 1 subject, 1 grade
- Test with 10 queries first
- Scale up once methodology is solid

### Tip 2: Keep Queries Consistent
- Use same test queries across all experiments
- Save queries in a file
- This ensures fair comparison

### Tip 3: Document Everything
```javascript
// Add detailed descriptions
const exp = await window.experimentTracker.createExperiment(
    'Clear Name',
    'Detailed description: what, why, how...'
);

// Add metadata
exp.tags = ['phase-1', 'baseline', 'math-grade10'];
exp.metadata = {
    dataset: 'NCERT Math Grade 10',
    queryCount: 30,
    dateStarted: new Date().toISOString()
};
```

### Tip 4: Export Regularly
```javascript
// Weekly exports
const report = await window.analyticsDashboard.generateReport();
const markdown = window.analyticsDashboard.exportReport(report.id, 'markdown');

// Save to file with date
const filename = `report-${new Date().toISOString().split('T')[0]}.md`;
// Download or save
```

### Tip 5: Use Version Control
```bash
# Track your research progress
git add .
git commit -m "Week 1: Baseline experiments complete"
git tag -a v1.0-baseline -m "Baseline results"
```

---

## 🔧 Useful Console Commands

### Quick Status Check
```javascript
// See all experiments
window.experimentTracker.getAllExperiments().forEach(e => {
    console.log(`${e.name}: ${e.runCount} runs`);
});

// See all comparisons
window.baselineComparator.getAllComparisons().forEach(c => {
    console.log(`${c.name}: ${c.status}`);
});

// See all A/B tests
window.abTestingFramework.getAllTests().forEach(t => {
    console.log(`${t.name}: ${t.status}`);
});
```

### Export Everything
```javascript
// Export all experiments
const allExps = window.experimentTracker.getAllExperiments();
const expData = JSON.stringify(allExps, null, 2);
copy(expData);

// Export all comparisons
const allComps = window.baselineComparator.getAllComparisons();
const compData = JSON.stringify(allComps, null, 2);
copy(compData);
```

### Backup Your Data
```javascript
// Backup everything to JSON
const backup = {
    timestamp: Date.now(),
    experiments: Array.from(window.experimentTracker.experiments.entries()),
    runs: Array.from(window.experimentTracker.runs.entries()),
    comparisons: Array.from(window.baselineComparator.comparisons.entries()),
    tests: Array.from(window.abTestingFramework.tests.entries())
};

const backupJSON = JSON.stringify(backup, null, 2);
copy(backupJSON);
// Save this to a file!
```

---

## 📚 Example Research Questions

### For RAG Systems

1. **Chunking Strategy**
   - Does semantic chunking improve retrieval vs fixed-size?
   - What's the optimal chunk size (256, 512, 1024 tokens)?
   - Does overlap improve performance? If so, how much?

2. **Retrieval Method**
   - Cosine similarity vs BM25 vs hybrid?
   - Dense vs sparse retrieval?
   - What top-k value is optimal (3, 5, 10)?

3. **Context Window**
   - How much context is needed for accurate answers?
   - Does more context always improve results?
   - Trade-off between context size and speed?

4. **Embedding Models**
   - text-embedding-3-small vs large?
   - OpenAI vs Cohere vs others?
   - Fine-tuned vs pre-trained?

5. **Generation Prompts**
   - Different prompt templates?
   - With/without examples?
   - System message variations?

---

## 🎯 Your Next Action

**Right now, you should:**

1. **Decide**: Keep demo data or clear it?
   ```javascript
   // Option A: Clear demo data
   localStorage.clear();
   location.reload();

   // Option B: Keep demo data for reference
   // (no action needed)
   ```

2. **Prepare**: Download 1-2 NCERT PDFs you want to research

3. **Plan**: Define your first research question
   - What are you comparing?
   - What metrics matter?
   - How many test queries?

4. **Start**: Create your first real experiment!

---

## 📞 Need Help?

**Documentation:**
- `PHASE_2_FEATURES.md` - Complete API reference
- `PHASE_2_QUICKSTART.md` - Quick examples
- `SESSION_SUMMARY.md` - What we built

**In Console:**
```javascript
// Check module status
console.log({
    tracker: window.experimentTracker.initialized,
    analyzer: window.statisticalAnalyzer.initialized,
    dashboard: window.analyticsDashboard.initialized,
    comparator: window.baselineComparator.initialized,
    abTesting: window.abTestingFramework.initialized
});
```

---

**Ready to start your research? Let's begin! 🚀**
