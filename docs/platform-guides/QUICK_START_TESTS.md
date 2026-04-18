# Quick Start Tests - API Connected

## Test 1: Verify LLM Connection (30 seconds)

Open browser console (F12) and run:

```javascript
// Test OpenAI connection
await enhancedLLMService.generateResponse("What is 2+2?")
```

**Expected Result:**
```javascript
{
  content: "2+2 equals 4.",
  model: "gpt-3.5-turbo" (or gpt-4),
  provider: "openai",
  usage: { prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 }
}
```

**If you see this:** ✅ LLM is working!
**If you see error:** ❌ Check API key is correct

---

## Test 2: Verify Embeddings (30 seconds)

```javascript
// Test embedding generation
const result = await enhancedLLMService.generateEmbedding("This is a test")
console.log("Dimensions:", result.dimensions)
console.log("First 5 values:", result.embedding.slice(0, 5))
```

**Expected Result:**
```javascript
Dimensions: 1536
First 5 values: [0.0234, -0.0156, 0.0423, -0.0089, 0.0167]
```

**If you see this:** ✅ Embeddings are working!
**If you see error:** ❌ Check API key has embedding permissions

---

## Test 3: Check Vector Store (10 seconds)

```javascript
// Check vector store is ready
enhancedVectorStore.getStatistics()
```

**Expected Result:**
```javascript
{
  totalVectors: 0,  // Will be 0 until you upload documents
  totalDocuments: 0,
  totalChunks: 0,
  embeddingsGenerated: 0,
  searchQueries: 0
}
```

**If you see this:** ✅ Vector store is ready!

---

## Test 4: Check RAG Orchestrator (10 seconds)

```javascript
// Check RAG system
ragOrchestrator.getStatistics()
```

**Expected Result:**
```javascript
{
  totalQueries: 0,
  totalDocuments: 0,
  avgRetrievalTime: 0,
  avgGenerationTime: 0,
  vectorStoreStats: {...},
  llmStats: {...}
}
```

**If you see this:** ✅ RAG system is ready!

---

## Test 5: Test Complete RAG Pipeline (Before uploading documents)

This will fail (expected) but verify the pipeline is working:

```javascript
// Try a query (should fail gracefully since no documents uploaded)
await ragOrchestrator.generateAnswer("What is photosynthesis?")
```

**Expected Result:**
```javascript
{
  answer: "I don't have enough information to answer that question based on the available documents.",
  sources: [],
  confidence: 'low'
}
```

**This is CORRECT!** It means:
- ✅ RAG pipeline is working
- ✅ It correctly detects no documents
- ✅ Ready to process documents

---

## Next: Upload Your First Document

After these tests pass, proceed to upload a PDF document.
