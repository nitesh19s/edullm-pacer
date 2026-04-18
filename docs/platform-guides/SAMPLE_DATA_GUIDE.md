# Sample Data Testing Guide

## ✅ **Sample Data is Now Loaded!**

The platform now includes realistic NCERT educational content for testing **without needing OpenAI API**.

---

## 🚀 **Quick Start - 3 Simple Commands**

### **Step 1: Load All Sample Data (30 seconds)**

**In browser console, paste:**

```javascript
await sampleDataLoader.loadAll()
```

**This will load:**
- ✅ 5 NCERT documents (Physics, Chemistry, Biology, Math)
- ✅ 4 sample experiments with metrics
- ✅ 3 baseline configurations
- ✅ 2 A/B tests
- ✅ Dashboard metrics and activity log

---

### **Step 2: Test Semantic Search (5 seconds)**

```javascript
await sampleDataLoader.testSearch("What is motion?")
```

**You'll see:**
- Top 3 relevant chunks from documents
- Similarity scores
- Document titles and subjects

---

### **Step 3: Test Complete RAG Query (5 seconds)**

```javascript
await sampleDataLoader.testRAGQuery("What is Newton's first law?")
```

**You'll see:**
- Simulated answer from "LLM"
- Source citations
- Retrieval and generation times
- Confidence level

---

## 📚 **What's Included in Sample Data**

### **Documents (5 NCERT Chapters):**

1. **Physics - Motion in a Straight Line** (Grade 11, Chapter 1)
   - Topics: Position, displacement, velocity, acceleration, equations of motion

2. **Chemistry - Basic Concepts** (Grade 11, Chapter 1)
   - Topics: Matter, atoms, molecules, mole concept, stoichiometry

3. **Biology - The Living World** (Grade 11, Chapter 1)
   - Topics: Characteristics of life, biodiversity, classification, binomial nomenclature

4. **Mathematics - Sets** (Grade 11, Chapter 1)
   - Topics: Set notation, types of sets, operations, De Morgan's laws

5. **Physics - Units and Measurements** (Grade 11, Chapter 2)
   - Topics: SI units, dimensional analysis, significant figures, errors

### **Each document is:**
- ✅ Chunked into segments (512 words per chunk)
- ✅ Embedded with simulated vectors (1536 dimensions)
- ✅ Fully searchable
- ✅ Includes metadata (subject, grade, chapter)

---

## 🧪 **Sample Experiments (4 Completed)**

1. **Baseline RAG Performance**
   - Chunk size: 512, Overlap: 50
   - F1 Score: 0.90, Accuracy: 0.91

2. **Small Chunk Size Test**
   - Chunk size: 256, Overlap: 50
   - F1 Score: 0.90, Accuracy: 0.89

3. **Large Chunk Size Test**
   - Chunk size: 1024, Overlap: 100
   - F1 Score: 0.89, Accuracy: 0.92

4. **High Temperature Test**
   - Temperature: 1.2
   - F1 Score: 0.87, Accuracy: 0.86

---

## 📊 **Sample Baselines (3 Configurations)**

1. **Default Configuration** - Standard settings
2. **High Precision Config** - Optimized for accuracy
3. **Fast Response Config** - Optimized for speed

---

## 🧬 **Sample A/B Tests (2 Tests)**

1. **Chunk Size Optimization** (Draft)
   - Testing different chunk sizes

2. **Temperature vs Accuracy** (Running)
   - Finding optimal temperature for educational content

---

## 💡 **Try These Sample Queries**

```javascript
// Query 1: Physics
await sampleDataLoader.testRAGQuery("What are the equations of motion?")

// Query 2: Chemistry
await sampleDataLoader.testRAGQuery("Define the mole concept")

// Query 3: Biology
await sampleDataLoader.testRAGQuery("What are characteristics of living organisms?")

// Query 4: Mathematics
await sampleDataLoader.testRAGQuery("Explain De Morgan's Laws")

// Query 5: General search
await sampleDataLoader.testSearch("velocity and acceleration")
```

---

## 🎯 **What You Can Test Now**

### **1. Semantic Search**
```javascript
// Search for content
await sampleDataLoader.testSearch("force and motion")
await sampleDataLoader.testSearch("chemical reactions")
await sampleDataLoader.testSearch("classification of organisms")
```

### **2. RAG Queries**
```javascript
// Get simulated answers
await sampleDataLoader.testRAGQuery("What is displacement?")
await sampleDataLoader.testRAGQuery("What is Avogadro's number?")
```

### **3. View Experiments**
```javascript
// See all experiments
experimentTracker.experiments.forEach(exp => {
    console.log(exp.name, ':', exp.metrics.f1Score)
})
```

### **4. View Baselines**
```javascript
// See all baselines
baselineComparator.getBaselines().forEach(baseline => {
    console.log(baseline.name, ':', baseline.config)
})
```

### **5. Check Dashboard**
```javascript
// View dashboard metrics
dashboardManager.getStatistics()
```

### **6. View Vector Store**
```javascript
// Check loaded data
enhancedVectorStore.getStatistics()
// Should show: 5 documents, ~100+ chunks
```

---

## 🎨 **Using the UI**

After loading sample data, you can use the UI:

### **Experiments Section:**
- View 4 completed experiments
- See their metrics and parameters
- Create comparisons between them

### **Comparisons Section:**
- Create new comparisons
- Use the 3 sample baselines
- Compare experiment results

### **A/B Testing Section:**
- View 2 sample A/B tests
- One in draft, one running
- Start/stop tests

### **Dashboard:**
- See real-time metrics
- View activity log (5 recent activities)
- Check curriculum coverage

---

## 🔧 **Advanced Usage**

### **Test with Different Parameters**

```javascript
// Search with filters
await enhancedVectorStore.search("motion", {
    topK: 5,
    filter: { subject: 'Physics' },
    minScore: 0.3
})

// Search specific subject
await enhancedVectorStore.search("laws", {
    filter: { subject: 'Physics', grade: 11 }
})
```

### **Create Your Own Experiment**

```javascript
// Create new experiment based on sample data
const expId = experimentTracker.createExperiment({
    name: "My Custom Test",
    type: "rag_evaluation",
    description: "Testing my hypothesis",
    parameters: {
        chunkSize: 768,
        chunkOverlap: 75,
        topK: 7,
        temperature: 0.5
    }
})

// Add metrics
experimentTracker.recordMetrics(expId, {
    precision: 0.93,
    recall: 0.87,
    f1Score: 0.90,
    accuracy: 0.90
})

// Complete it
experimentTracker.completeExperiment(expId)
```

### **Create Comparison**

```javascript
// Get experiment IDs
const expIds = Array.from(experimentTracker.experiments.keys()).slice(0, 3)

// Create comparison
baselineComparator.createComparison(
    'Chunk Size Comparison',
    expIds,
    {
        metrics: ['f1Score', 'accuracy', 'precision'],
        includeStatisticalTests: true,
        confidenceLevel: 0.95
    }
)
```

---

## 📈 **Performance Stats**

After loading sample data:

```javascript
// Overall stats
console.log('Documents:', enhancedVectorStore.stats.totalDocuments)
console.log('Chunks:', enhancedVectorStore.stats.totalChunks)
console.log('Experiments:', experimentTracker.experiments.size)
console.log('Baselines:', baselineComparator.baselines.length)
console.log('A/B Tests:', abTesting.tests.size)
```

**Expected output:**
```
Documents: 5
Chunks: ~100-150 (depends on chunking)
Experiments: 4
Baselines: 3
A/B Tests: 2
```

---

## 🗑️ **Clear Sample Data**

When you want to start fresh:

```javascript
sampleDataLoader.clearAll()
```

This removes all sample:
- Documents and embeddings
- Experiments
- Baselines
- A/B tests

---

## 🎯 **Workflow Example**

**Complete testing workflow:**

```javascript
// Step 1: Load data
await sampleDataLoader.loadAll()

// Step 2: Test search
await sampleDataLoader.testSearch("motion")

// Step 3: Test RAG
await sampleDataLoader.testRAGQuery("What is Newton's first law?")

// Step 4: View experiments
experimentTracker.experiments.forEach(exp => {
    console.log(`${exp.name}: F1=${exp.metrics.f1Score}`)
})

// Step 5: Create comparison
const expIds = Array.from(experimentTracker.experiments.keys()).slice(0, 2)
baselineComparator.createComparison('Test Comparison', expIds)

// Step 6: View dashboard
dashboardManager.refresh()
```

---

## ❓ **FAQ**

**Q: Do I need OpenAI API for sample data?**
A: No! Sample data uses simulated embeddings. Works completely offline.

**Q: Is the data realistic?**
A: Yes! Real NCERT chapter content with realistic metrics.

**Q: Can I add my own documents?**
A: Yes! Use `sampleDataLoader.loadDocuments()` as a template.

**Q: How long does it take to load?**
A: About 30 seconds for all 5 documents.

**Q: Can I modify the sample data?**
A: Yes! Edit `load-sample-data.js` to add your content.

**Q: Does it work with the UI?**
A: Yes! All UI features work with sample data.

---

## 🚀 **Next Steps**

After loading sample data:

1. ✅ **Explore Experiments** - View and compare the 4 experiments
2. ✅ **Test Comparisons** - Create comparisons between experiments
3. ✅ **Try A/B Tests** - Start the draft A/B test
4. ✅ **Query Documents** - Ask questions about the loaded content
5. ✅ **Check Dashboard** - View metrics and activity log

---

## 📝 **Summary**

**To get started:**
```javascript
await sampleDataLoader.loadAll()
```

**To test search:**
```javascript
await sampleDataLoader.testSearch("your query here")
```

**To test RAG:**
```javascript
await sampleDataLoader.testRAGQuery("your question here")
```

**To clear:**
```javascript
sampleDataLoader.clearAll()
```

---

**You can now test all platform features without needing the OpenAI API!** 🎉
