# Smart Chunking User Guide

**EduLLM Platform - Smart Chunking Feature Complete Guide**

---

## ✂️ Overview

Smart Chunking helps you visualize and optimize how documents are split into smaller segments for better RAG retrieval performance.

**Key Features:**
- 📊 Visual chunk preview
- 🎛️ Adjustable chunk size & overlap
- 🧠 Multiple chunking methods
- 📈 Real-time statistics
- 💾 Export functionality

---

## 🎯 Why Chunking Matters

### The Problem

RAG systems search through documents to find relevant information. If documents are too long:
- ❌ Search is less precise
- ❌ Irrelevant content gets mixed in
- ❌ Response quality suffers

### The Solution

Break documents into smaller "chunks":
- ✅ Better search precision
- ✅ More relevant results
- ✅ Higher quality responses

### Example

**Bad (No Chunking):**
```
[Entire 50-page textbook as one chunk]
Query: "Pythagoras theorem"
Result: Returns whole book, hard to find specific info
```

**Good (With Chunking):**
```
[Book split into 100 chunks, each 1-2 paragraphs]
Query: "Pythagoras theorem"
Result: Returns specific section about Pythagoras
```

---

## 🚀 Quick Start

### Step 1: Navigate to Smart Chunking

Click **"Smart Chunking"** in the sidebar (third item under Features)

### Step 2: Select a Document

Use the dropdown at the top to select a document

### Step 3: Adjust Settings

- **Chunk Size:** Use slider to set size (100-1000 words)
- **Overlap:** Use slider to set overlap (0-200 words)

### Step 4: View Results

- See chunks displayed below
- Check statistics (Total Chunks, Avg Size, Semantic Score)

---

## 🎛️ Controls Explained

### Chunk Size

**What it does:** Sets how many words per chunk

**Range:** 100 - 1000 words

**Recommendations:**
- **Small (100-300):** Very precise, many chunks
- **Medium (300-500):** Balanced (recommended for RAG)
- **Large (500-1000):** More context, fewer chunks

**Example:**
```
Document: 2000 words
Chunk Size: 400 words
Result: ~5 chunks
```

### Overlap

**What it does:** How many words repeat between consecutive chunks

**Range:** 0 - 200 words

**Recommendations:**
- **No Overlap (0):** Fastest, least storage
- **Small (25-50):** Good balance
- **Medium (50-100):** Better continuity (recommended)
- **Large (100-200):** Maximum context preservation

**Example:**
```
Chunk 1: Words 1-400
Chunk 2: Words 351-750 (50 word overlap)
Chunk 3: Words 701-1100 (50 word overlap)
```

### Why Overlap?

Prevents information loss at chunk boundaries:

**Without Overlap:**
```
Chunk 1: "...theorem states that in a"
Chunk 2: "right-angled triangle, the square..."
❌ Split mid-sentence!
```

**With Overlap (50 words):**
```
Chunk 1: "...theorem states that in a right-angled triangle"
Chunk 2: "theorem states that in a right-angled triangle, the square..."
✅ Complete context preserved!
```

---

## 📊 Statistics Explained

### Total Chunks

Total number of chunks created from the document

**Interpretation:**
- More chunks = Better precision, more storage
- Fewer chunks = Faster search, less storage

### Average Chunk Size

Average number of words per chunk

**Ideal Range:** 300-500 words

**Use:**
- Check if chunks are consistent
- Verify settings are applied correctly

### Semantic Score

Score from 0-10 indicating chunk quality

**Calculation:** Based on chunk size consistency

**Interpretation:**
- **8-10:** Excellent consistency
- **6-8:** Good consistency
- **4-6:** Fair consistency
- **0-4:** Poor consistency (highly variable sizes)

**Tip:** Higher scores = better RAG performance

---

## 🧠 Chunking Methods

### Method 1: Fixed-Size (Default)

**How it works:**
- Split by word count
- Uses specified chunk size and overlap
- Simple and predictable

**Best for:**
- General purpose
- Consistent chunk sizes needed
- Maximum control

**Example:**
```
Setting: 500 words, 50 overlap
Input: 2000-word document
Output: ~4 chunks of 500 words each
```

### Method 2: Sentence-Based

**How it works:**
- Split at sentence boundaries
- Maintains sentence integrity
- Variable chunk sizes

**Best for:**
- Preserving sentence context
- Natural language flow
- Question-answer pairs

**Example:**
```
Setting: Target 500 words
Input: Document with 50 sentences
Output: Chunks of 3-5 sentences each
```

### Method 3: Semantic

**How it works:**
- Split at section/paragraph boundaries
- Maintains semantic units
- Most variable sizes

**Best for:**
- Structured documents (headings, sections)
- Maintaining topic coherence
- Educational content

**Example:**
```
Input: Document with sections
Output: One chunk per section
```

---

## 📝 Best Practices

### 1. Start with Defaults

```javascript
Chunk Size: 500 words
Overlap: 50 words
Method: Fixed
```

Test with these, then adjust based on results.

### 2. Match Content Type

**Textbook/Educational:**
- Larger chunks (400-600)
- More overlap (75-100)
- Semantic method

**Reference/Lookup:**
- Smaller chunks (200-400)
- Less overlap (25-50)
- Fixed method

**Q&A Pairs:**
- Small chunks (100-300)
- No overlap
- Sentence method

### 3. Test and Iterate

1. Chunk document with initial settings
2. Test some queries in RAG Chat
3. Check if results are relevant
4. Adjust chunk size based on feedback
5. Re-test

### 4. Monitor Statistics

Check after chunking:
- ✅ Total chunks reasonable (not too many/few)
- ✅ Avg size close to target
- ✅ Semantic score > 6

### 5. Export and Reuse

Once you find optimal settings:
```javascript
// Export current chunks
window.chunkingManager.exportChunks();

// Save settings
window.chunkingManager.saveSettings();
```

---

## 🔧 Advanced Usage

### Programmatic Chunking

```javascript
// Set custom settings
window.chunkingManager.settings.chunkSize = 400;
window.chunkingManager.settings.overlap = 75;

// Rechunk current document
await window.chunkingManager.rechunk();

// Get chunks
const chunks = window.chunkingManager.chunks;
console.log(`Created ${chunks.length} chunks`);
```

### Compare Methods

```javascript
const text = "Your document text here...";

// Try all methods
const fixed = window.chunkingManager.fixedSizeChunking(text);
const sentence = window.chunkingManager.sentenceChunking(text);
const semantic = window.chunkingManager.semanticChunking(text);

console.log('Fixed:', fixed.length, 'chunks');
console.log('Sentence:', sentence.length, 'chunks');
console.log('Semantic:', semantic.length, 'chunks');
```

### Load Custom Document

```javascript
// Add custom document
window.chunkingManager.documents.push({
    id: 'custom_doc',
    name: 'My Custom Document',
    content: 'Your text content here...',
    metadata: { type: 'custom' }
});

// Update selector
window.chunkingManager.updateDocumentSelector();

// Load and chunk
await window.chunkingManager.loadDocument('custom_doc');
```

### Access Raw Chunks

```javascript
// Get all chunks
const allChunks = window.chunkingManager.chunks;

// Get chunk text only
const chunkTexts = allChunks.map(c => c.text);

// Get chunks with specific size
const largeChunks = allChunks.filter(c => c.wordCount > 500);

// Calculate statistics
const totalWords = allChunks.reduce((sum, c) => sum + c.wordCount, 0);
console.log('Total words:', totalWords);
```

---

## 📊 Optimization Guide

### Goal: Maximize RAG Performance

**Step 1: Baseline**
```
Chunk Size: 500
Overlap: 50
```

**Step 2: Test Queries**
Run 10-20 test queries in RAG Chat

**Step 3: Evaluate**
- Are answers complete?
- Too much irrelevant content?
- Missing important details?

**Step 4: Adjust**

**If answers incomplete:**
→ Increase chunk size (600-700)
→ Increase overlap (75-100)

**If too much irrelevant content:**
→ Decrease chunk size (300-400)
→ Keep overlap moderate (50)

**If losing context:**
→ Increase overlap (100-150)
→ Try semantic method

**Step 5: Re-test**
Repeat until optimal

---

## 🎓 Example Scenarios

### Scenario 1: Mathematics Textbook

**Goal:** Answer specific math questions

**Optimal Settings:**
```
Chunk Size: 400 words
Overlap: 75 words
Method: Semantic
```

**Reason:** Math content is structured (theorems, examples). Semantic chunking preserves complete concepts.

### Scenario 2: Physics Reference

**Goal:** Quick lookups of formulas and definitions

**Optimal Settings:**
```
Chunk Size: 250 words
Overlap: 25 words
Method: Fixed
```

**Reason:** Small chunks for precision. Less overlap since lookups are specific.

### Scenario 3: Biology Essays

**Goal:** Comprehensive explanations

**Optimal Settings:**
```
Chunk Size: 600 words
Overlap: 100 words
Method: Sentence
```

**Reason:** Larger chunks maintain narrative flow. Sentence boundaries preserve meaning.

---

## 🐛 Troubleshooting

### Issue: Too Many Chunks

**Symptoms:** Thousands of chunks, slow search

**Solution:**
- Increase chunk size
- Reduce overlap
- Use semantic method for structured docs

### Issue: Too Few Chunks

**Symptoms:** Only 2-3 chunks, low precision

**Solution:**
- Decrease chunk size
- Ensure document has enough content
- Check if document loaded correctly

### Issue: Inconsistent Chunk Sizes

**Symptoms:** Semantic score < 4

**Solution:**
- Use fixed-size method instead
- Increase min/max chunk size range
- Check document formatting

### Issue: Loss of Context

**Symptoms:** RAG responses incomplete or fragmented

**Solution:**
- Increase overlap (75-150)
- Increase chunk size
- Try semantic method

### Issue: Can't See Chunks

**Cause:** No document selected or UI not updated

**Solution:**
```javascript
// Check if document loaded
console.log(window.chunkingManager.currentDocument);

// Check chunks exist
console.log(window.chunkingManager.chunks.length);

// Force rechunk
await window.chunkingManager.rechunk();

// Force display update
window.chunkingManager.displayChunks();
```

---

## 💡 Pro Tips

### Tip 1: Use Overlap Wisely

```
Question type → Overlap needed
Simple lookup → 0-25 words
Definitions → 25-50 words
Explanations → 50-100 words
Complex topics → 100-150 words
```

### Tip 2: Chunk Size by Content

```
Content density → Chunk size
Dense (Math) → 300-400 words
Medium (Science) → 400-500 words
Sparse (Essays) → 500-700 words
```

### Tip 3: Test with Edge Cases

```javascript
// Test with your actual queries
const testQueries = [
    "What is X?",  // Definition
    "How does Y work?",  // Explanation
    "Give example of Z"  // Example request
];

// Run through RAG and check quality
```

### Tip 4: Export Optimal Configs

```javascript
// Save winning configuration
const config = {
    chunkSize: window.chunkingManager.settings.chunkSize,
    overlap: window.chunkingManager.settings.overlap,
    method: window.chunkingManager.settings.method,
    document: window.chunkingManager.currentDocument.name,
    stats: window.chunkingManager.statistics
};

console.log(JSON.stringify(config, null, 2));
// Save this for future reference
```

### Tip 5: Batch Process

```javascript
// Process multiple documents with same settings
const optimalSettings = {
    chunkSize: 450,
    overlap: 75
};

for (const doc of window.chunkingManager.documents) {
    window.chunkingManager.settings = { ...window.chunkingManager.settings, ...optimalSettings };
    await window.chunkingManager.loadDocument(doc.id);
    window.chunkingManager.exportChunks();
}
```

---

## 📊 Feature Status

✅ Fixed-size chunking
✅ Sentence-based chunking
✅ Semantic chunking
✅ Real-time visualization
✅ Statistics calculation
✅ Export functionality
✅ Settings persistence
✅ Multiple documents
✅ Dynamic rechunking

**Smart Chunking: 100% Complete**

---

## 🎯 Quick Reference

### Optimal Settings for RAG

```
General Purpose:
- Chunk Size: 400-500 words
- Overlap: 50-75 words
- Method: Fixed

Educational Content:
- Chunk Size: 400-600 words
- Overlap: 75-100 words
- Method: Semantic

Reference Material:
- Chunk Size: 200-400 words
- Overlap: 25-50 words
- Method: Fixed

Long-form Content:
- Chunk Size: 500-700 words
- Overlap: 100-150 words
- Method: Sentence
```

---

**Master chunking, master RAG! ✂️✨**
