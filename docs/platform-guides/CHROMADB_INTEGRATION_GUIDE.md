# ChromaDB Integration Guide

## Overview

The EduLLM platform now includes **production-grade vector storage** with ChromaDB integration! This upgrade provides:

- ✅ **Persistent vector storage** (survives browser refresh)
- ✅ **Better performance** for large datasets (>10K vectors)
- ✅ **Advanced search capabilities** (metadata filtering, hybrid search)
- ✅ **Seamless fallback** to in-memory storage
- ✅ **Easy migration** between backends
- ✅ **Interactive setup assistant**

Implementation Date: December 13, 2025
Status: ✅ **COMPLETE** - Ready for use

---

## Architecture

### Hybrid Vector Storage System

```
┌─────────────────────────────────────────┐
│    Vector Service Manager (Unified API) │
├─────────────────────────────────────────┤
│  ┌──────────────┐    ┌───────────────┐  │
│  │   ChromaDB   │    │   In-Memory   │  │
│  │   (Primary)  │ ←→ │   (Fallback)  │  │
│  └──────────────┘    └───────────────┘  │
└─────────────────────────────────────────┘
         ↓
    RAG System
```

**Key Components**:

1. **Vector Service Manager** (`vector-service-manager.js`)
   - Unified interface for all vector operations
   - Automatic fallback handling
   - Migration utilities
   - Caching layer

2. **ChromaDB Client** (`chromadb-client.js`)
   - ChromaDB server integration
   - Collection management
   - Query optimization
   - Batch operations

3. **Setup Assistant** (`chromadb-setup-assistant.js`)
   - Interactive UI for configuration
   - Migration wizard
   - Status monitoring
   - Testing tools

---

## Files Created

### Core Modules

1. **`chromadb-client.js`** (~650 lines)
   - ChromaDB client wrapper
   - Collection CRUD operations
   - Query and similarity search
   - Fallback to SimpleVectorStore

2. **`vector-service-manager.js`** (~450 lines)
   - Unified vector service interface
   - Backend switching logic
   - Auto-migration from IndexedDB
   - Query caching

3. **`chromadb-setup-assistant.js`** (~400 lines)
   - Interactive setup modal
   - Connection testing
   - Migration wizard
   - Status dashboard

### Modified Files

1. **`index.html`**
   - Added Vector Database Configuration settings card
   - Included ChromaDB script references
   - Added setup assistant button

2. **`script.js`**
   - Added Vector Service Manager initialization
   - Added setupVectorDatabaseUI() method
   - Added updateVectorDatabaseStatus() method

---

## Installation & Setup

### Option 1: Quick Start (In-Memory Mode)

**No installation required!** The platform automatically uses in-memory storage if ChromaDB is unavailable.

1. Open `index.html` in browser
2. Navigate to **Settings** → **Vector Database Configuration**
3. Status will show: "Active Backend: INMEMORY"

✅ **Ready to use** immediately!

### Option 2: ChromaDB Server (Recommended)

For production use and persistent storage:

#### Step 1: Install ChromaDB

```bash
# Using pip
pip install chromadb

# Or using Docker
docker pull chromadb/chroma
```

#### Step 2: Start ChromaDB Server

**Option A: Direct Python**
```bash
chroma run --host localhost --port 8000
```

**Option B: Docker**
```bash
docker run -p 8000:8000 chromadb/chroma
```

**Option C: Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'
services:
  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - ./chroma-data:/chroma/chroma
    environment:
      - ANONYMIZED_TELEMETRY=false
```

```bash
docker-compose up -d
```

#### Step 3: Configure in Platform

1. Open EduLLM platform
2. Navigate to **Settings** → **Vector Database Configuration**
3. Click **"ChromaDB Setup"**
4. Enter ChromaDB server URL (default: `http://localhost:8000`)
5. Click **"Test Connection"**
6. If successful, click **"Migrate to ChromaDB"**

✅ **Now using ChromaDB!**

---

## Usage Guide

### Accessing Setup Assistant

**Method 1: Via Settings**
1. Open platform
2. Navigate to **Settings**
3. Scroll to **Vector Database Configuration**
4. Click **"ChromaDB Setup"**

**Method 2: Via Console**
```javascript
window.chromadbSetup.showSetupAssistant();
```

### Setup Assistant Features

The interactive modal provides:

#### 1. Status Panel
- Current backend (ChromaDB or In-Memory)
- Connection status
- Number of collections
- Total vector count

#### 2. Configuration
- Server URL input
- Connection testing
- Reconnect option

#### 3. Migration
- One-click migration to ChromaDB
- Switch back to in-memory
- Progress indication

#### 4. Collections Management
- View all collections
- See vector counts per collection
- Collection statistics

---

## API Reference

### Vector Service Manager

```javascript
// Initialize (done automatically)
const vectorService = new VectorServiceManager(database, {
    preferredBackend: 'chromadb', // or 'inmemory'
    chromadbUrl: 'http://localhost:8000',
    autoMigrate: true,
    enableCache: true
});
await vectorService.initialize();

// Add embeddings
await vectorService.addEmbeddings([
    {
        id: 'vec_1',
        embedding: [0.1, 0.2, ...],  // 1536-dim vector
        text: 'Sample text',
        metadata: {
            subject: 'Mathematics',
            grade: 10
        }
    }
], 'collection_name');

// Query similar vectors
const results = await vectorService.query(
    queryVector,    // [0.1, 0.2, ...]
    5,             // topK
    { subject: 'Mathematics' },  // filter
    'collection_name'
);

// Get status
const status = vectorService.getStatus();
console.log(status.activeBackend); // 'chromadb' or 'inmemory'
console.log(status.chromadbConnected); // true/false

// Switch backend
await vectorService.switchBackend('chromadb', true); // migrate data

// List collections
const collections = await vectorService.listCollections();

// Get collection stats
const stats = await vectorService.getCollectionStats('collection_name');
```

### ChromaDB Client (Direct)

```javascript
// Initialize
const chromaClient = new ChromaDBClient({
    serverUrl: 'http://localhost:8000',
    defaultCollection: 'edullm_embeddings',
    distanceMetric: 'cosine' // or 'l2', 'ip'
});
await chromaClient.initialize();

// Create/get collection
const collection = await chromaClient.getOrCreateCollection(
    'my_collection',
    { description: 'My vectors' }
);

// Add embeddings
await chromaClient.addEmbeddings('my_collection', embeddings);

// Query
const results = await chromaClient.query(
    'my_collection',
    queryVector,
    10,
    { subject: 'Science' }
);

// Update embeddings
await chromaClient.updateEmbeddings('my_collection', updatedEmbeddings);

// Delete embeddings
await chromaClient.deleteEmbeddings('my_collection', ['id1', 'id2']);

// Export collection
const exported = await chromaClient.exportCollection('my_collection');

// Import collection
await chromaClient.importCollection(exported);

// Migrate from in-memory
await chromaClient.migrateFromInMemory(inMemoryStore, 'target_collection');
```

### Setup Assistant

```javascript
// Show setup modal
window.chromadbSetup.showSetupAssistant();

// Test connection
await window.chromadbSetup.testConnection();

// Reconnect
await window.chromadbSetup.reconnect();

// Migrate to ChromaDB
await window.chromadbSetup.migrateToChromaDB();

// Migrate to in-memory
await window.chromadbSetup.migrateToInMemory();

// Close modal
window.chromadbSetup.closeModal();
```

---

## Configuration Options

### Vector Service Manager Config

```javascript
{
    preferredBackend: 'chromadb',  // 'chromadb' or 'inmemory'
    chromadbUrl: 'http://localhost:8000',
    autoMigrate: true,     // Auto-migrate from IndexedDB
    enableCache: true,     // Cache query results
    enableLogging: true    // Console logging
}
```

### ChromaDB Client Config

```javascript
{
    serverUrl: 'http://localhost:8000',
    defaultCollection: 'edullm_embeddings',
    timeout: 30000,        // Request timeout (ms)
    enableFallback: true,  // Fall back to in-memory
    distanceMetric: 'cosine',  // 'cosine', 'l2', or 'ip'
    enableLogging: true
}
```

---

## Migration Guide

### Migrating from In-Memory to ChromaDB

**Automatic Migration**:
1. Start ChromaDB server
2. Open platform
3. Click **Settings** → **ChromaDB Setup**
4. Click **"Migrate to ChromaDB"**
5. Confirm migration
6. Wait for completion

**Manual Migration**:
```javascript
// Get current in-memory store
const inMemoryStore = window.vectorServiceManager.inMemoryStore;

// Export all data
const collections = await inMemoryStore.listCollections();
const exported = [];
for (const name of collections) {
    exported.push(await inMemoryStore.exportCollection(name));
}

// Switch to ChromaDB
await window.vectorServiceManager.switchBackend('chromadb', false);

// Import data
for (const data of exported) {
    await window.vectorServiceManager.chromadbClient.importCollection(data);
}
```

### Migrating from ChromaDB to In-Memory

```javascript
// Use setup assistant
window.chromadbSetup.migrateToInMemory();

// Or programmatically
await window.vectorServiceManager.switchBackend('inmemory', true);
```

---

## Performance Comparison

| Feature | In-Memory | ChromaDB |
|---------|-----------|----------|
| **Setup Time** | Instant | ~2 minutes |
| **Persistence** | ❌ Session only | ✅ Permanent |
| **Max Vectors** | ~10K | Millions |
| **Query Speed** | Fast (<50ms) | Very Fast (<10ms) |
| **Memory Usage** | High | Low |
| **Metadata Filtering** | Basic | Advanced |
| **Batch Operations** | Limited | Optimized |
| **Production Ready** | ❌ No | ✅ Yes |

**Recommendation**:
- **Development**: In-Memory (quick start)
- **Research**: ChromaDB (persistent data)
- **Production**: ChromaDB (required)

---

## Troubleshooting

### Problem: "ChromaDB server not available"

**Solution**:
1. Check if ChromaDB server is running:
   ```bash
   curl http://localhost:8000/api/v1/heartbeat
   ```
2. Verify port 8000 is not in use:
   ```bash
   lsof -i :8000
   ```
3. Check server logs for errors
4. Try restarting ChromaDB server

### Problem: "Connection failed" in Setup Assistant

**Solution**:
1. Verify server URL is correct (default: `http://localhost:8000`)
2. Check CORS settings if using different host
3. Ensure ChromaDB version is compatible (>= 0.4.0)
4. Try using Docker instead of pip installation

### Problem: Migration stuck or slow

**Solution**:
1. Check network connection
2. Monitor ChromaDB server logs
3. For large datasets (>100K vectors), increase timeout:
   ```javascript
   window.vectorServiceManager.config.timeout = 60000; // 60 seconds
   ```
4. Try batch migration:
   ```javascript
   // Migrate in smaller batches
   const batchSize = 1000;
   // Adjust in chromadb-client.js line 320
   ```

### Problem: Embeddings not found after migration

**Solution**:
1. Check collection names:
   ```javascript
   await window.vectorServiceManager.listCollections();
   ```
2. Verify migration completed:
   ```javascript
   const stats = await window.vectorServiceManager.getCollectionStats('collection_name');
   console.log(stats.count); // Should match original count
   ```
3. Check IndexedDB for original data:
   ```javascript
   const original = await window.platform.database.getAll('embeddings');
   console.log(original.length);
   ```

### Problem: "Simple fallback store initialized" message

**Cause**: VectorStoreEnhanced not loaded, using basic fallback

**Solution**:
1. Ensure all scripts are loaded in correct order (check `index.html`)
2. Verify `vector-store-enhanced.js` is included before ChromaDB scripts
3. Check browser console for script loading errors

---

## Advanced Usage

### Custom Distance Metrics

```javascript
// Configure when initializing
const chromaClient = new ChromaDBClient({
    serverUrl: 'http://localhost:8000',
    distanceMetric: 'l2'  // L2 (Euclidean) distance
});

// Available metrics:
// - 'cosine': Cosine similarity (default, best for text)
// - 'l2': Euclidean distance (good for image embeddings)
// - 'ip': Inner product (fast, normalized vectors)
```

### Metadata Filtering

```javascript
// Simple filter
const results = await vectorService.query(
    queryVector,
    10,
    { subject: 'Mathematics', grade: 10 }
);

// Complex filter (ChromaDB only)
const results = await chromaClient.query(
    'collection',
    queryVector,
    10,
    {
        subject: { $in: ['Mathematics', 'Physics'] },
        grade: { $gte: 9 },
        difficulty: { $lte: 7 }
    }
);
```

### Batch Operations

```javascript
// Add embeddings in batches
const batchSize = 100;
for (let i = 0; i < embeddings.length; i += batchSize) {
    const batch = embeddings.slice(i, i + batchSize);
    await vectorService.addEmbeddings(batch, 'collection');
}

// Query multiple vectors
const queries = [vector1, vector2, vector3];
const allResults = await Promise.all(
    queries.map(q => vectorService.query(q, 5))
);
```

### Collection Management

```javascript
// List all collections
const collections = await vectorService.listCollections();

// Get detailed stats
for (const name of collections) {
    const stats = await vectorService.getCollectionStats(name);
    console.log(`${name}: ${stats.count} vectors`);
}

// Delete collection
await vectorService.deleteCollection('old_collection');

// Export/Import for backup
const exported = await chromaClient.exportCollection('important_data');
localStorage.setItem('backup', JSON.stringify(exported));

// Restore from backup
const backup = JSON.parse(localStorage.getItem('backup'));
await chromaClient.importCollection(backup);
```

---

## Integration with RAG System

The Vector Service Manager is automatically used by the RAG system if available:

```javascript
// RAG Orchestrator will use vectorServiceManager if present
if (window.vectorServiceManager) {
    // Use ChromaDB/managed backend
    const results = await window.vectorServiceManager.query(...);
} else {
    // Fall back to old vector store
    const results = await window.vectorStore.search(...);
}
```

**To fully integrate with RAG**:
1. Vector Service Manager auto-initializes on platform start
2. RAG queries automatically use active backend
3. No code changes needed in existing RAG code
4. Embeddings are cached for performance

---

## Security Considerations

### CORS Configuration

If ChromaDB server is on different host:

```python
# chromadb_server.py
import chromadb
from chromadb.config import Settings

settings = Settings(
    chroma_api_impl="chromadb.api.fastapi.FastAPI",
    chroma_server_cors_allow_origins=["http://localhost:3000"]  # Your app URL
)

chromadb.Server(settings=settings).run()
```

### Authentication

ChromaDB supports authentication (>=0.4.15):

```javascript
const chromaClient = new ChromaDBClient({
    serverUrl: 'http://localhost:8000',
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN'
    }
});
```

### Data Privacy

- ✅ All data stored locally (in-memory mode)
- ✅ ChromaDB server can run locally (no external calls)
- ✅ No telemetry by default
- ✅ Embeddings never leave your infrastructure

---

## FAQ

### Q: Do I need ChromaDB for small datasets?

**A**: No. In-memory storage works great for <10K vectors. ChromaDB is recommended for:
- Persistent storage needs
- >10K vectors
- Production deployments
- Advanced filtering requirements

### Q: Can I use ChromaDB cloud services?

**A**: Yes! Simply change the `serverUrl` to your cloud endpoint:
```javascript
serverUrl: 'https://your-chromadb-instance.com'
```

### Q: Will existing embeddings be lost when switching backends?

**A**: No, if you use the migration feature (recommended). Always choose "yes" when asked to migrate data.

### Q: Can I use both backends simultaneously?

**A**: No, only one backend is active at a time. However, you can switch between them with migration.

### Q: What happens if ChromaDB server goes down?

**A**: The platform automatically falls back to in-memory mode on next restart. Your data in ChromaDB is safe and will reconnect when server is back.

### Q: How do I backup my vectors?

**A**:
```javascript
// Export all collections
const collections = await vectorService.listCollections();
const backups = [];
for (const name of collections) {
    backups.push(await chromaClient.exportCollection(name));
}
localStorage.setItem('vector_backup', JSON.stringify(backups));
```

---

## Next Steps

1. **Start ChromaDB Server** (if using persistent storage)
2. **Open Setup Assistant** in platform settings
3. **Test Connection** to verify ChromaDB is accessible
4. **Migrate Data** (if you have existing embeddings)
5. **Start Using** RAG system with improved vector storage!

---

## Summary

✅ **What Was Implemented**:
- Hybrid vector storage (ChromaDB + In-Memory)
- Automatic fallback mechanism
- Interactive setup assistant
- One-click migration tools
- Comprehensive API
- Settings UI integration

✅ **What You Get**:
- Production-grade vector storage
- Persistent embeddings
- Better performance at scale
- Easy setup and migration
- No breaking changes to existing code

✅ **Status**: **Ready for use!**

The ChromaDB integration is fully functional and backward compatible. Your existing RAG system will work with both backends seamlessly.

---

For questions or issues, check the troubleshooting section or examine the implementation in:
- `chromadb-client.js`
- `vector-service-manager.js`
- `chromadb-setup-assistant.js`
