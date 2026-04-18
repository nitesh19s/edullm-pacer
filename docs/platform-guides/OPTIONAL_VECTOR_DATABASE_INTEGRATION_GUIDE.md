# Optional: Vector Database Integration Guide

## Overview

This guide explains how to optionally upgrade from the current in-memory vector store to an external vector database. **This is NOT required for research** but can provide benefits for large-scale deployments.

**Current Status:** ✅ In-memory vector store works perfectly for PhD research scope
**When to Upgrade:** Only if you exceed 10,000 documents or need persistence beyond browser

---

## Do You Actually Need This?

### ✅ Current In-Memory Solution Works If:
- You have < 10,000 documents
- Research scope is well-defined
- Single-user platform
- OK with browser storage limits
- Data export is acceptable backup strategy

### ⚠️ Consider Upgrade If:
- You plan to scale beyond 10,000 documents
- Need multi-user concurrent access
- Want production-grade persistence
- Require advanced indexing (HNSW, IVF)
- Need distributed search capabilities

---

## Option 1: ChromaDB (Recommended for Budget)

**Cost:** FREE (self-hosted)
**Complexity:** Medium
**Time to Integrate:** 1-2 weeks
**Best For:** PhD research on budget

### Advantages:
- ✅ Free and open-source
- ✅ Easy to set up locally
- ✅ Python-based (familiar for researchers)
- ✅ Good performance for medium datasets
- ✅ Active community support

### Architecture:

```
┌─────────────────┐
│  Browser (UI)   │
│  JavaScript     │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  Python Backend │
│  Flask/FastAPI  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    ChromaDB     │
│   (Persistent)  │
└─────────────────┘
```

### Setup Steps:

#### 1. Install ChromaDB

```bash
# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install ChromaDB
pip install chromadb
pip install chromadb-client

# Install web framework
pip install fastapi uvicorn
# OR
pip install flask flask-cors
```

#### 2. Create Python Backend (`server/chroma_backend.py`)

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any
import uuid

app = FastAPI()

# Enable CORS for browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ChromaDB client
chroma_client = chromadb.Client(Settings(
    chroma_db_impl="duckdb+parquet",
    persist_directory="./chroma_data"
))

# Get or create collection
collection = chroma_client.get_or_create_collection(
    name="edullm_vectors",
    metadata={"description": "EduLLM educational content embeddings"}
)

@app.get("/")
def read_root():
    return {"status": "ChromaDB backend running", "collection": "edullm_vectors"}

@app.post("/embeddings/add")
async def add_embeddings(data: Dict[str, Any]):
    """Add embeddings to ChromaDB"""
    try:
        embeddings = data.get("embeddings", [])
        texts = data.get("texts", [])
        metadatas = data.get("metadatas", [])
        ids = data.get("ids", [])

        # Generate IDs if not provided
        if not ids:
            ids = [str(uuid.uuid4()) for _ in embeddings]

        collection.add(
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
            ids=ids
        )

        return {
            "success": True,
            "count": len(embeddings),
            "ids": ids
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/embeddings/search")
async def search_embeddings(data: Dict[str, Any]):
    """Search for similar embeddings"""
    try:
        query_embeddings = data.get("query_embeddings", [])
        n_results = data.get("n_results", 10)
        where = data.get("where", None)  # Metadata filters

        results = collection.query(
            query_embeddings=query_embeddings,
            n_results=n_results,
            where=where
        )

        return {
            "success": True,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/embeddings/count")
async def get_count():
    """Get total number of embeddings"""
    count = collection.count()
    return {"count": count}

@app.delete("/embeddings/clear")
async def clear_collection():
    """Clear all embeddings (use with caution!)"""
    global collection
    chroma_client.delete_collection("edullm_vectors")
    collection = chroma_client.get_or_create_collection("edullm_vectors")
    return {"success": True, "message": "Collection cleared"}

@app.delete("/embeddings/{id}")
async def delete_embedding(id: str):
    """Delete specific embedding by ID"""
    try:
        collection.delete(ids=[id])
        return {"success": True, "deleted_id": id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

#### 3. Run the Backend

```bash
# Activate virtual environment
source venv/bin/activate

# Run server
python server/chroma_backend.py

# Server will start on http://localhost:8000
```

#### 4. Update Vector Store to Use ChromaDB (`vector-store-enhanced.js`)

Add configuration option:

```javascript
class EnhancedVectorStore {
    constructor() {
        // Existing code...

        this.config = {
            // Existing config...
            useExternalDB: false,  // Toggle for ChromaDB
            dbEndpoint: 'http://localhost:8000'
        };
    }

    /**
     * Add document with automatic chunking and embedding
     */
    async addDocument(content, metadata = {}) {
        const docId = metadata.id || this.generateId('doc');

        console.log(`📄 Processing document: ${metadata.title || docId}`);

        try {
            // Chunk the document
            const chunks = this.chunkText(content, this.config.chunkSize, this.config.chunkOverlap);
            console.log(`   Created ${chunks.length} chunks`);

            // Generate embeddings for all chunks
            const chunkIds = [];
            const allEmbeddings = [];
            const allTexts = [];
            const allMetadatas = [];

            for (let i = 0; i < chunks.length; i += this.config.batchSize) {
                const batch = chunks.slice(i, Math.min(i + this.config.batchSize, chunks.length));

                console.log(`   Embedding batch ${Math.floor(i / this.config.batchSize) + 1}/${Math.ceil(chunks.length / this.config.batchSize)}...`);

                // Generate embeddings
                const embeddings = await this.generateEmbeddings(batch);

                // Store or upload to ChromaDB
                if (this.config.useExternalDB) {
                    // Prepare data for ChromaDB
                    for (let j = 0; j < batch.length; j++) {
                        const chunkId = `${docId}_chunk_${i + j}`;
                        chunkIds.push(chunkId);
                        allEmbeddings.push(embeddings[j]);
                        allTexts.push(batch[j]);
                        allMetadatas.push({
                            ...metadata,
                            chunkId: chunkId,
                            chunkIndex: i + j,
                            documentId: docId
                        });
                    }
                } else {
                    // Existing in-memory storage
                    for (let j = 0; j < batch.length; j++) {
                        const chunkId = `${docId}_chunk_${i + j}`;
                        await this.addVector(
                            chunkId,
                            embeddings[j],
                            { ...metadata, chunkIndex: i + j, documentId: docId },
                            batch[j]
                        );
                        chunkIds.push(chunkId);
                    }
                }
            }

            // If using external DB, upload in batch
            if (this.config.useExternalDB) {
                await this.uploadToChromaDB(allEmbeddings, allTexts, allMetadatas, chunkIds);
            }

            // Update document registry
            this.documents.set(docId, {
                chunks: chunkIds,
                metadata: metadata,
                addedAt: Date.now()
            });

            this.stats.totalDocuments++;
            this.stats.totalChunks += chunkIds.length;
            this.stats.lastUpdated = Date.now();

            console.log(`✅ Document added: ${chunkIds.length} chunks`);

            return {
                documentId: docId,
                chunkCount: chunkIds.length,
                chunkIds: chunkIds
            };

        } catch (error) {
            console.error('❌ Failed to add document:', error);
            throw error;
        }
    }

    /**
     * Upload embeddings to ChromaDB
     */
    async uploadToChromaDB(embeddings, texts, metadatas, ids) {
        try {
            const response = await fetch(`${this.config.dbEndpoint}/embeddings/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    embeddings: embeddings,
                    texts: texts,
                    metadatas: metadatas,
                    ids: ids
                })
            });

            if (!response.ok) {
                throw new Error(`ChromaDB upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`✅ Uploaded ${result.count} embeddings to ChromaDB`);
            return result;

        } catch (error) {
            console.error('❌ ChromaDB upload failed:', error);
            throw error;
        }
    }

    /**
     * Search (updated to support ChromaDB)
     */
    async search(query, options = {}) {
        const topK = options.topK || 10;

        try {
            // Generate query embedding
            const queryEmbeddings = await this.generateEmbeddings([query]);
            const queryEmbedding = queryEmbeddings[0];

            if (this.config.useExternalDB) {
                // Search ChromaDB
                return await this.searchChromaDB(queryEmbedding, topK, options);
            } else {
                // Existing in-memory search
                return this.searchInMemory(queryEmbedding, topK, options);
            }

        } catch (error) {
            console.error('❌ Search failed:', error);
            throw error;
        }
    }

    /**
     * Search ChromaDB
     */
    async searchChromaDB(queryEmbedding, topK, options = {}) {
        try {
            // Build metadata filter if needed
            const where = {};
            if (options.collection) {
                where.collection = options.collection;
            }
            if (options.filter) {
                Object.assign(where, options.filter);
            }

            const response = await fetch(`${this.config.dbEndpoint}/embeddings/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query_embeddings: [queryEmbedding],
                    n_results: topK,
                    where: Object.keys(where).length > 0 ? where : null
                })
            });

            if (!response.ok) {
                throw new Error(`ChromaDB search failed: ${response.statusText}`);
            }

            const result = await response.json();

            // Transform ChromaDB results to match expected format
            const results = result.results;
            const searchResults = [];

            for (let i = 0; i < results.ids[0].length; i++) {
                searchResults.push({
                    id: results.ids[0][i],
                    content: results.documents[0][i],
                    metadata: results.metadatas[0][i],
                    score: 1 - results.distances[0][i]  // Convert distance to similarity
                });
            }

            this.stats.searchQueries++;
            return searchResults;

        } catch (error) {
            console.error('❌ ChromaDB search failed:', error);
            throw error;
        }
    }

    /**
     * Existing in-memory search (keep for fallback)
     */
    searchInMemory(queryEmbedding, topK, options = {}) {
        // Existing implementation...
        const results = [];

        for (const [id, vector] of this.vectors) {
            // Apply collection filter
            if (options.collection) {
                const vectorCollections = this.getVectorCollections(id);
                if (!vectorCollections.has(options.collection)) {
                    continue;
                }
            }

            // Apply metadata filter
            if (options.filter) {
                let matchesFilter = true;
                for (const [key, value] of Object.entries(options.filter)) {
                    if (vector.metadata[key] !== value) {
                        matchesFilter = false;
                        break;
                    }
                }
                if (!matchesFilter) continue;
            }

            // Calculate similarity
            const similarity = this.cosineSimilarity(queryEmbedding, vector.embedding);

            results.push({
                id: id,
                content: vector.content,
                metadata: vector.metadata,
                score: similarity
            });
        }

        // Sort by similarity and take top K
        results.sort((a, b) => b.score - a.score);
        const topResults = results.slice(0, topK);

        this.stats.searchQueries++;
        return topResults;
    }
}
```

#### 5. Enable ChromaDB in Settings

Add UI toggle in settings:

```javascript
// In settings section
<label>
    <input type="checkbox" id="useExternalDB">
    Use External Vector Database (ChromaDB)
</label>

<input type="text" id="dbEndpoint" value="http://localhost:8000"
       placeholder="ChromaDB endpoint">
```

Update settings save:

```javascript
const useExternalDB = document.getElementById('useExternalDB').checked;
const dbEndpoint = document.getElementById('dbEndpoint').value;

if (window.enhancedVectorStore) {
    window.enhancedVectorStore.config.useExternalDB = useExternalDB;
    window.enhancedVectorStore.config.dbEndpoint = dbEndpoint;
}
```

#### 6. Test the Integration

```javascript
// Enable ChromaDB
window.enhancedVectorStore.config.useExternalDB = true;

// Test upload
await ragOrchestrator.addPDFDocument(pdfFile, {
    title: "Test Document",
    subject: "Physics"
});

// Test search
const results = await enhancedVectorStore.search("What is photosynthesis?", {
    topK: 5
});

console.log(results);
```

#### 7. Verify ChromaDB Storage

```bash
# Check collection count
curl http://localhost:8000/embeddings/count

# Response: {"count": 150}
```

### Deployment Options:

**Local Development:**
```bash
python server/chroma_backend.py
```

**Production (Docker):**
```dockerfile
FROM python:3.9

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY server/ ./server/

EXPOSE 8000

CMD ["uvicorn", "server.chroma_backend:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t edullm-chroma .
docker run -d -p 8000:8000 -v $(pwd)/chroma_data:/app/chroma_data edullm-chroma
```

---

## Option 2: Pinecone (Production-Grade, Paid)

**Cost:** $70-100/month
**Complexity:** Low (fully managed)
**Time to Integrate:** 3-5 days
**Best For:** Production deployments

### Advantages:
- ✅ Fully managed (no infrastructure)
- ✅ Excellent performance
- ✅ Built-in monitoring
- ✅ Automatic scaling
- ✅ Production-ready

### Setup Steps:

#### 1. Sign Up and Get API Key
```
1. Go to https://pinecone.io
2. Create account
3. Create new index
4. Get API key
```

#### 2. Install Pinecone Client
```bash
npm install @pinecone-database/pinecone
```

#### 3. Update Vector Store

```javascript
import { PineconeClient } from "@pinecone-database/pinecone";

class PineconeVectorStore extends EnhancedVectorStore {
    async initializePinecone() {
        this.pinecone = new PineconeClient();

        await this.pinecone.init({
            apiKey: this.config.pineconeApiKey,
            environment: this.config.pineconeEnvironment
        });

        this.index = this.pinecone.Index("edullm");
    }

    async addDocument(content, metadata = {}) {
        // Generate embeddings (same as before)
        const chunks = this.chunkText(content);
        const embeddings = await this.generateEmbeddings(chunks);

        // Upload to Pinecone
        const vectors = embeddings.map((embedding, i) => ({
            id: `${metadata.id}_${i}`,
            values: embedding,
            metadata: {
                text: chunks[i],
                ...metadata
            }
        }));

        await this.index.upsert({
            upsertRequest: {
                vectors: vectors
            }
        });
    }

    async search(query, options = {}) {
        const queryEmbedding = await this.generateEmbeddings([query]);

        const results = await this.index.query({
            queryRequest: {
                vector: queryEmbedding[0],
                topK: options.topK || 10,
                includeMetadata: true,
                filter: options.filter
            }
        });

        return results.matches.map(match => ({
            id: match.id,
            content: match.metadata.text,
            metadata: match.metadata,
            score: match.score
        }));
    }
}
```

**Cost:** ~$70/month for 100K vectors, ~$100/month for 500K vectors

---

## Option 3: Weaviate (Open Source)

**Cost:** FREE (self-hosted) or $50+/month (cloud)
**Complexity:** High
**Time to Integrate:** 1-2 weeks
**Best For:** Large-scale deployments

### Quick Setup (Docker):

```bash
docker run -d \
  -p 8080:8080 \
  -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true \
  -e PERSISTENCE_DATA_PATH=/var/lib/weaviate \
  semitechnologies/weaviate:latest
```

### Integration similar to ChromaDB with Weaviate client.

---

## Decision Matrix

| Criteria | ChromaDB | Pinecone | Weaviate |
|----------|----------|----------|----------|
| **Cost** | FREE | $70-100/mo | FREE (self) |
| **Setup Time** | 1-2 weeks | 3-5 days | 1-2 weeks |
| **Performance** | Good | Excellent | Excellent |
| **Scalability** | Medium | High | High |
| **Management** | Self-hosted | Managed | Self/Managed |
| **Recommended For** | PhD Research | Production | Enterprise |

---

## Recommendation

### For PhD Research: ChromaDB
- Free and sufficient
- Easy to set up locally
- Good performance for research scale
- Complete control over data

### For Production: Pinecone
- If budget allows
- Minimal management overhead
- Excellent performance
- Production-ready out of box

---

## When to Actually Do This

**Do It Now If:**
- You have >5,000 documents already
- You're experiencing performance issues
- You need multi-user access
- You want production deployment

**Wait Until Later If:**
- You have <5,000 documents
- Current performance is acceptable
- Single-user research
- Budget constrained

**The in-memory solution is perfectly fine for most PhD research scenarios.**

---

## Migration Strategy (If You Decide to Upgrade)

1. **Export current data**
   ```javascript
   const data = enhancedVectorStore.exportToJSON();
   ```

2. **Set up ChromaDB backend**
   ```bash
   python server/chroma_backend.py
   ```

3. **Import data to ChromaDB**
   ```javascript
   await enhancedVectorStore.importFromJSON(data, { useExternalDB: true });
   ```

4. **Test and verify**
   ```javascript
   const results = await enhancedVectorStore.search("test query");
   ```

5. **Switch permanently**
   ```javascript
   enhancedVectorStore.config.useExternalDB = true;
   ```

---

**Conclusion:** Vector database integration is **optional** and should only be considered if you experience actual limitations with the current in-memory solution.

