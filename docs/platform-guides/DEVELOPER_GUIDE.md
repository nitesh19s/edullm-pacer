# EduLLM Platform - Developer Guide

**Technical Reference for Contributors and Developers**

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Database System](#database-system)
4. [API Reference](#api-reference)
5. [Adding Features](#adding-features)
6. [Testing](#testing)
7. [Performance Optimization](#performance-optimization)
8. [Contributing](#contributing)

---

## Architecture Overview

### Technology Stack

```
├── Frontend: Vanilla JavaScript (ES6+)
├── Storage: IndexedDB + localStorage
├── ML/AI: TensorFlow.js + Custom RAG
├── UI: HTML5 + CSS3 (CSS Variables)
└── Build: None (pure client-side)
```

### Design Patterns

**Manager Pattern**
- Each feature has a manager class
- Manages state, UI, and business logic
- Example: `DashboardManager`, `RAGChatManager`

**Service Pattern**
- Core services shared across features
- Example: `database`, `embeddingManager`, `ragSystem`

**Observer Pattern**
- Event-driven updates
- Managers notify each other of changes

### File Structure

```
edullm-platform/
│
├── index.html                    # Main UI structure
├── styles.css                    # All styling (8000+ lines)
├── script.js                     # Initialization & routing
│
├── Core Managers:
│   ├── dashboard-manager.js      # Dashboard metrics & activities
│   ├── rag-chat-manager.js       # Chat interface & RAG queries
│   ├── data-upload-manager.js    # PDF upload & processing
│   ├── chunking-manager.js       # Text segmentation
│   ├── knowledge-graph-manager.js # Graph visualization
│   ├── experiment-tracker.js     # Experiment management
│   ├── analytics-manager.js      # Usage analytics
│   └── settings-manager.js       # Configuration
│
├── Core Services:
│   ├── database.js               # IndexedDB v2 (17 stores)
│   ├── embedding-manager.js      # Vector embeddings
│   ├── rag-system.js             # Vector similarity search
│   ├── llm-service.js            # LLM API integration
│   └── pdf-processor.js          # PDF text extraction
│
├── Utilities:
│   ├── chunking-strategies.js    # Chunking algorithms
│   ├── sample-data-init.js       # Demo data loader
│   └── database-init.js          # DB initialization
│
└── Documentation:
    ├── README.md                 # Project overview
    ├── USER_GUIDE.md             # User manual
    ├── DEVELOPER_GUIDE.md        # This file
    └── DEPLOYMENT.md             # Deployment guide
```

---

## Core Components

### 1. Database (database.js)

**Purpose**: Persistent storage using IndexedDB

**Class**: `EnhancedDatabase`

**Key Methods**:
```javascript
// Initialize database
await database.initialize()

// Save document
const docId = await database.saveDocument(doc)

// Query documents
const docs = await database.getDocuments(
    { subject: 'math' },
    { limit: 10, offset: 0 }
)

// Full-text search
const results = await database.searchDocuments('pythagorean', {
    fields: ['text', 'title']
})
```

**17 Object Stores**:
1. `documents` - PDF metadata
2. `chunks` - Text segments
3. `embeddings` - Vector representations
4. `knowledge_graph` - Graph data
5. `chat_history` - Conversations
6. `experiments` - Experiment configs
7. `experimentRuns` - Run results
8. `analytics` - Usage metrics
9. `baselines` - Baseline data
10. `abTests` - A/B test configs
11. `settings` - User preferences
12. `uploads` - File tracking
13. `cache` - Query cache
14. `backups` - Snapshots
15. `query_logs` - Search logs
16. `feedback` - User feedback
17. `metadata` - System metadata

**Schema Definition**:
```javascript
const storeConfigs = [
    {
        name: 'documents',
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
            { name: 'subject', keyPath: 'subject' },
            { name: 'grade', keyPath: 'grade' },
            { name: 'timestamp', keyPath: 'timestamp' }
        ]
    },
    // ... more stores
]
```

### 2. Embedding Manager (embedding-manager.js)

**Purpose**: Generate and manage vector embeddings

**Class**: `EmbeddingManager`

**Supported Models**:
- Universal Sentence Encoder (USE) - 512 dimensions
- MiniLM - 384 dimensions
- Custom API endpoints

**Key Methods**:
```javascript
// Initialize with model
await embeddingManager.initialize('use') // or 'minilm'

// Generate embedding
const vector = await embeddingManager.encode('sample text')

// Batch encoding
const vectors = await embeddingManager.encodeBatch([
    'text 1',
    'text 2',
    'text 3'
])

// Add document with embedding
await embeddingManager.addDocument({
    text: 'The Pythagorean theorem...',
    metadata: { subject: 'math', grade: 10 }
})

// Search by similarity
const results = embeddingManager.search('pythagorean theorem', 5)
```

**Implementation**:
```javascript
class EmbeddingManager {
    constructor() {
        this.model = null
        this.modelType = 'use'
        this.documents = []
        this.embeddings = []
    }

    async loadModel(modelType) {
        if (modelType === 'use') {
            const use = require('@tensorflow-models/universal-sentence-encoder')
            this.model = await use.load()
        } else if (modelType === 'minilm') {
            // Load MiniLM from transformers.js
        }
    }

    async encode(text) {
        const embedding = await this.model.embed([text])
        return embedding.arraySync()[0]
    }

    cosineSimilarity(vecA, vecB) {
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
        const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
        const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
        return dotProduct / (magA * magB)
    }
}
```

### 3. RAG System (rag-system.js)

**Purpose**: Retrieval-Augmented Generation pipeline

**Class**: `RAGSystem`

**Pipeline Stages**:
1. Query preprocessing
2. Vector embedding
3. Similarity search
4. Context ranking
5. LLM generation
6. Response formatting

**Key Methods**:
```javascript
// Add data
ragSystem.add('text content', {
    subject: 'math',
    grade: 10,
    chapter: 'Triangles'
})

// Find relevant chunks
const results = ragSystem.find('pythagorean theorem', 3)
// Returns: [{ text, score, info }, ...]

// Full RAG query (with LLM)
const response = await ragSystem.query('What is Pythagorean theorem?')
// Returns: { answer, sources, confidence }
```

**Implementation**:
```javascript
class RAGSystem {
    constructor(embeddingManager) {
        this.embeddingManager = embeddingManager
        this.data = []
    }

    add(text, metadata = {}) {
        this.data.push({
            text: text,
            info: metadata,
            embedding: null // Lazy loading
        })
    }

    async find(query, topK = 3) {
        // 1. Embed query
        const queryEmbedding = await this.embeddingManager.encode(query)

        // 2. Compute similarities
        const similarities = this.data.map((item, index) => ({
            index,
            score: this.cosineSimilarity(queryEmbedding, item.embedding)
        }))

        // 3. Sort and return top-K
        similarities.sort((a, b) => b.score - a.score)
        return similarities.slice(0, topK).map(s => ({
            text: this.data[s.index].text,
            score: s.score,
            info: this.data[s.index].info
        }))
    }
}
```

### 4. RAG Chat Manager (rag-chat-manager.js)

**Purpose**: Chat UI and query orchestration

**Class**: `RAGChatManager`

**Properties**:
```javascript
{
    chatHistory: [],      // Message array
    currentFilters: {     // Active filters
        subject: 'all',
        grade: 'all',
        source: 'all'
    },
    settings: {           // RAG settings
        topK: 3,
        temperature: 0.7,
        maxTokens: 500,
        includeExamples: true,
        includeCitations: true
    },
    isProcessing: false,  // Query in progress
    initialized: false    // Initialization status
}
```

**Key Methods**:
```javascript
// Initialize chat
await ragChatManager.initialize()

// Handle user message
await ragChatManager.handleSendMessage()

// RAG query pipeline
await ragChatManager.processRAGQuery(userQuery)

// Message management
ragChatManager.addUserMessage(text)
ragChatManager.addAssistantMessage(text, sources)

// Persistence
ragChatManager.saveChatHistory()
ragChatManager.loadChatHistory()

// Utilities
ragChatManager.clearChat()
ragChatManager.exportChat()
ragChatManager.getStatistics()
```

**Query Pipeline**:
```javascript
async processRAGQuery(userQuery) {
    // 1. Preprocess
    const cleanQuery = this.preprocessQuery(userQuery)

    // 2. Check data availability
    if (!this.checkDataAvailability()) {
        return this.addAssistantMessage('No data loaded...')
    }

    // 3. Retrieve context
    const chunks = await this.retrieveContext(cleanQuery)

    // 4. Generate response
    let response
    if (this.isLLMConfigured()) {
        response = await this.generateLLMResponse(userQuery, chunks)
    } else {
        response = this.generateTemplateResponse(userQuery, chunks)
    }

    // 5. Display
    this.addAssistantMessage(response.text, response.sources)

    // 6. Track metrics
    this.trackQueryMetrics(userQuery, chunks, duration)
}
```

### 5. Dashboard Manager (dashboard-manager.js)

**Purpose**: Real-time metrics and activity tracking

**Class**: `DashboardManager`

**Properties**:
```javascript
{
    metrics: {
        documentsIndexed: 12847,
        queriesProcessed: 3421,
        accuracyRate: 94.7,
        avgResponseTime: 1.2
    },
    activities: [],
    curriculumCoverage: {
        mathematics: 85,
        physics: 72,
        chemistry: 68,
        biology: 91
    }
}
```

**Key Methods**:
```javascript
// Initialize dashboard
await dashboardManager.initialize()

// Refresh from various sources
dashboardManager.refreshMetrics()

// Update displays
dashboardManager.updateMetricsDisplay()
dashboardManager.updateActivityDisplay()
dashboardManager.updateCurriculumDisplay()

// Add activity
dashboardManager.addActivity('upload', 'PDF uploaded: Math Chapter 1')

// Auto-refresh
dashboardManager.startAutoRefresh() // Every 5 seconds
dashboardManager.stopAutoRefresh()

// Data management
dashboardManager.reset()
dashboardManager.exportData()
```

**Persistence Strategy**:
```javascript
// Dual storage: localStorage + IndexedDB
async saveToStorage() {
    // Quick access
    localStorage.setItem('dashboard_metrics', JSON.stringify(this.metrics))

    // Persistent
    await this.database.saveStatistics(this.metrics)
}

async loadFromDatabase() {
    const stats = await this.database.getStatistics()
    this.metrics = {
        documentsIndexed: stats.documentsIndexed || this.metrics.documentsIndexed,
        // ... merge with defaults
    }
}
```

### 6. Experiment Tracker (experiment-tracker.js)

**Purpose**: A/B testing and experiment management

**Class**: `ExperimentTracker`

**Key Methods**:
```javascript
// Create experiment
const experiment = await experimentTracker.createExperiment(
    'Test Top-K Values',
    'Compare K=3 vs K=5',
    ['retrieval', 'performance']
)

// Configure experiment
await experimentTracker.updateExperiment(expId, {
    parameters: {
        topK: 5,
        temperature: 0.7,
        model: 'use'
    }
})

// Run experiment
const runId = await experimentTracker.runExperiment(expId, testQueries)

// Get results
const results = experimentTracker.getExperimentResults(expId)

// Compare with baseline
const comparison = experimentTracker.compareWithBaseline(expId, baselineId)

// A/B test
const winner = experimentTracker.runABTest(variantA, variantB, queries)
```

---

## Database System

### IndexedDB v2 Architecture

**Version Management**:
```javascript
const DB_VERSION = 2

function upgradeDatabase(db, oldVersion, newVersion) {
    if (oldVersion < 1) {
        // Create initial stores
        createObjectStore(db, 'documents', { keyPath: 'id', autoIncrement: true })
        // ... more stores
    }

    if (oldVersion < 2) {
        // Add new stores in v2
        createObjectStore(db, 'experiments', { keyPath: 'id', autoIncrement: true })
        // ... more v2 stores
    }
}
```

### CRUD Operations

**Create**:
```javascript
async saveDocument(doc) {
    const transaction = this.db.transaction(['documents'], 'readwrite')
    const store = transaction.objectStore('documents')

    const request = store.add({
        ...doc,
        timestamp: Date.now(),
        version: 1
    })

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}
```

**Read**:
```javascript
async getDocuments(filters = {}, options = {}) {
    const { limit = 100, offset = 0, orderBy = 'timestamp' } = options

    const transaction = this.db.transaction(['documents'], 'readonly')
    const store = transaction.objectStore('documents')

    let cursor
    if (filters.subject) {
        const index = store.index('subject')
        cursor = index.openCursor(IDBKeyRange.only(filters.subject))
    } else {
        cursor = store.openCursor()
    }

    const results = []
    let count = 0
    let skipped = 0

    return new Promise((resolve) => {
        cursor.onsuccess = (event) => {
            const cursor = event.target.result
            if (cursor && count < limit) {
                if (skipped < offset) {
                    skipped++
                    cursor.continue()
                    return
                }

                results.push(cursor.value)
                count++
                cursor.continue()
            } else {
                resolve(results)
            }
        }
    })
}
```

**Update**:
```javascript
async updateDocument(id, updates) {
    const doc = await this.getDocumentById(id)
    const updated = {
        ...doc,
        ...updates,
        updatedAt: Date.now()
    }

    const transaction = this.db.transaction(['documents'], 'readwrite')
    const store = transaction.objectStore('documents')
    store.put(updated)

    return updated
}
```

**Delete**:
```javascript
async deleteDocument(id) {
    const transaction = this.db.transaction(['documents'], 'readwrite')
    const store = transaction.objectStore('documents')
    store.delete(id)

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve(true)
        transaction.onerror = () => reject(transaction.error)
    })
}
```

### Advanced Queries

**Full-Text Search**:
```javascript
async searchDocuments(query, options = {}) {
    const { fields = ['text', 'title'], caseSensitive = false } = options
    const searchTerm = caseSensitive ? query : query.toLowerCase()

    const allDocs = await this.getDocuments()

    return allDocs.filter(doc => {
        return fields.some(field => {
            const value = doc[field] || ''
            const searchValue = caseSensitive ? value : value.toLowerCase()
            return searchValue.includes(searchTerm)
        })
    })
}
```

**Aggregation**:
```javascript
async getStatistics() {
    const docs = await this.getDocuments()

    return {
        totalDocuments: docs.length,
        bySubject: this.groupBy(docs, 'subject'),
        byGrade: this.groupBy(docs, 'grade'),
        totalSize: docs.reduce((sum, d) => sum + (d.size || 0), 0),
        averageSize: docs.reduce((sum, d) => sum + (d.size || 0), 0) / docs.length
    }
}

groupBy(array, key) {
    return array.reduce((result, item) => {
        const group = item[key] || 'unknown'
        result[group] = (result[group] || 0) + 1
        return result
    }, {})
}
```

---

## API Reference

### Global Objects

All managers are available on `window`:

```javascript
window.database              // EnhancedDatabase instance
window.embeddingManager      // EmbeddingManager instance
window.ragSystem             // RAGSystem instance
window.llmService            // LLMService instance
window.dashboardManager      // DashboardManager instance
window.ragChatManager        // RAGChatManager instance
window.dataUploadManager     // DataUploadManager instance
window.chunkingManager       // ChunkingManager instance
window.knowledgeGraphManager // KnowledgeGraphManager instance
window.experimentTracker     // ExperimentTracker instance
window.analyticsManager      // AnalyticsManager instance
window.settingsManager       // SettingsManager instance
```

### Manager Lifecycle

All managers follow this pattern:

```javascript
class FeatureManager {
    constructor(dependencies) {
        this.initialized = false
        // ... setup
    }

    async initialize() {
        console.log('🔧 Initializing FeatureManager...')

        // Setup logic
        this.setupEventListeners()
        await this.loadData()

        this.initialized = true
        console.log('✅ FeatureManager initialized')
        return true
    }

    setupEventListeners() {
        // Bind UI events
    }

    async loadData() {
        // Load from database/storage
    }
}
```

### Event System

**Dispatching Events**:
```javascript
// Dispatch custom event
window.dispatchEvent(new CustomEvent('dataUploaded', {
    detail: {
        filename: 'math_ch1.pdf',
        documentId: 123,
        chunks: 45
    }
}))
```

**Listening for Events**:
```javascript
// Listen in other managers
window.addEventListener('dataUploaded', (event) => {
    console.log('Data uploaded:', event.detail)
    dashboardManager.addActivity('upload', `Uploaded: ${event.detail.filename}`)
    dashboardManager.refreshMetrics()
})
```

**Standard Events**:
- `dataUploaded` - New PDF processed
- `experimentCompleted` - Experiment finished
- `chatMessageSent` - User sent message
- `settingsChanged` - Configuration updated
- `graphUpdated` - Knowledge graph modified

---

## Adding Features

### Step 1: Create Manager Class

```javascript
/**
 * NewFeature Manager
 * Description of what this feature does
 */

class NewFeatureManager {
    constructor(database) {
        this.database = database
        this.initialized = false
        this.data = []
    }

    /**
     * Initialize the feature
     */
    async initialize() {
        console.log('🎯 Initializing NewFeature...')

        try {
            // Load data from database
            await this.loadData()

            // Setup UI listeners
            this.setupEventListeners()

            // Initialize state
            this.updateDisplay()

            this.initialized = true
            console.log('✅ NewFeature initialized')
            return true

        } catch (error) {
            console.error('❌ NewFeature initialization error:', error)
            return false
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const button = document.getElementById('newFeatureButton')
        if (button) {
            button.addEventListener('click', () => this.handleAction())
        }
    }

    /**
     * Load data from database
     */
    async loadData() {
        if (this.database) {
            this.data = await this.database.getNewFeatureData()
        }
    }

    /**
     * Handle user action
     */
    async handleAction() {
        console.log('🔄 Processing action...')
        // Implementation
    }

    /**
     * Update display
     */
    updateDisplay() {
        const container = document.getElementById('newFeatureContainer')
        if (!container) return

        container.innerHTML = this.data.map(item => `
            <div class="feature-item">${item.name}</div>
        `).join('')
    }
}

// Initialize global instance
window.newFeatureManager = new NewFeatureManager(window.database)

console.log('🎯 NewFeature Manager loaded')
```

### Step 2: Add UI in index.html

```html
<!-- Add tab button -->
<div class="tabs">
    <!-- ... existing tabs -->
    <button class="tab-button" data-tab="newFeature">
        <i class="fas fa-star"></i>
        New Feature
    </button>
</div>

<!-- Add tab content -->
<div id="newFeatureTab" class="tab-content">
    <div class="page-header">
        <h2>
            <i class="fas fa-star"></i>
            New Feature
        </h2>
        <p>Description of the feature</p>
    </div>

    <div class="content-grid">
        <div class="card">
            <div class="card-header">
                <h3>Feature Controls</h3>
            </div>
            <div class="card-content">
                <div id="newFeatureContainer">
                    <!-- Dynamic content here -->
                </div>
                <button id="newFeatureButton" class="btn-primary">
                    <i class="fas fa-play"></i>
                    Run Feature
                </button>
            </div>
        </div>
    </div>
</div>
```

### Step 3: Add Styles in styles.css

```css
/* New Feature Styles */
#newFeatureTab {
    /* Tab-specific styles */
}

.feature-item {
    padding: 1rem;
    border: 1px solid hsl(var(--border));
    border-radius: 8px;
    margin-bottom: 0.5rem;
}

.feature-item:hover {
    background: hsl(var(--muted));
}
```

### Step 4: Register in script.js

```javascript
// In initializeManagers() function
async function initializeManagers() {
    // ... existing managers

    // Initialize NewFeature Manager
    if (window.newFeatureManager) {
        await window.newFeatureManager.initialize()
    }
}
```

### Step 5: Add Database Store (if needed)

```javascript
// In database.js - storeConfigs array
{
    name: 'newFeatureData',
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
        { name: 'name', keyPath: 'name', unique: false },
        { name: 'timestamp', keyPath: 'timestamp', unique: false }
    ]
}

// Add CRUD methods
async saveNewFeatureData(data) {
    return await this.genericSave('newFeatureData', data)
}

async getNewFeatureData(filters = {}, options = {}) {
    return await this.genericGet('newFeatureData', filters, options)
}
```

---

## Testing

### Manual Testing

**Browser Console**:
```javascript
// Test manager initialization
console.log(window.ragChatManager.initialized) // should be true

// Test RAG query
await ragChatManager.processRAGQuery('test question')

// Test database
await database.getDocuments()

// Test embeddings
await embeddingManager.encode('test text')
```

### Automated Testing

```javascript
/**
 * Test Suite for NewFeature
 */
class NewFeatureTests {
    constructor() {
        this.results = []
    }

    async runAll() {
        console.log('🧪 Running NewFeature tests...')

        await this.testInitialization()
        await this.testDataLoading()
        await this.testUserActions()
        await this.testErrorHandling()

        this.printResults()
    }

    async testInitialization() {
        try {
            assert(window.newFeatureManager, 'Manager exists')
            assert(window.newFeatureManager.initialized, 'Manager initialized')
            this.pass('Initialization')
        } catch (error) {
            this.fail('Initialization', error)
        }
    }

    async testDataLoading() {
        try {
            await window.newFeatureManager.loadData()
            assert(window.newFeatureManager.data.length > 0, 'Data loaded')
            this.pass('Data Loading')
        } catch (error) {
            this.fail('Data Loading', error)
        }
    }

    pass(testName) {
        this.results.push({ test: testName, status: 'PASS' })
    }

    fail(testName, error) {
        this.results.push({ test: testName, status: 'FAIL', error })
    }

    printResults() {
        console.table(this.results)
        const passed = this.results.filter(r => r.status === 'PASS').length
        const total = this.results.length
        console.log(`✅ ${passed}/${total} tests passed`)
    }
}

// Helper function
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`)
    }
}
```

### Performance Testing

```javascript
/**
 * Performance benchmarks
 */
async function runPerformanceBenchmarks() {
    console.log('⚡ Running performance benchmarks...')

    // Test RAG query speed
    console.time('RAG Query')
    await ragChatManager.processRAGQuery('test question')
    console.timeEnd('RAG Query')

    // Test embedding generation
    console.time('Embedding')
    await embeddingManager.encode('test text')
    console.timeEnd('Embedding')

    // Test database read
    console.time('Database Read')
    await database.getDocuments({}, { limit: 100 })
    console.timeEnd('Database Read')

    // Test vector search
    console.time('Vector Search')
    ragSystem.find('test query', 10)
    console.timeEnd('Vector Search')
}
```

---

## Performance Optimization

### 1. Lazy Loading

```javascript
// Load models only when needed
async initializeEmbeddings() {
    if (!this.embeddingManager.model) {
        await this.embeddingManager.loadModel('use')
    }
}
```

### 2. Caching

```javascript
// Cache query results
class QueryCache {
    constructor(maxSize = 100) {
        this.cache = new Map()
        this.maxSize = maxSize
    }

    get(query) {
        return this.cache.get(this.hashQuery(query))
    }

    set(query, results) {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value
            this.cache.delete(firstKey)
        }
        this.cache.set(this.hashQuery(query), results)
    }

    hashQuery(query) {
        // Simple hash function
        return query.toLowerCase().trim()
    }
}
```

### 3. Batch Processing

```javascript
// Process multiple embeddings at once
async processDocumentsBatch(documents) {
    const texts = documents.map(d => d.text)
    const embeddings = await this.embeddingManager.encodeBatch(texts)

    return documents.map((doc, i) => ({
        ...doc,
        embedding: embeddings[i]
    }))
}
```

### 4. Web Workers

```javascript
// Offload heavy computation to worker
const worker = new Worker('embedding-worker.js')

worker.postMessage({
    type: 'encode',
    texts: ['text1', 'text2', 'text3']
})

worker.onmessage = (event) => {
    const { embeddings } = event.data
    // Use embeddings
}
```

### 5. IndexedDB Optimization

```javascript
// Use compound indexes for common queries
{
    name: 'subject_grade',
    keyPath: ['subject', 'grade'],
    unique: false
}

// Query with compound index
const index = store.index('subject_grade')
const range = IDBKeyRange.only(['math', 10])
const results = index.getAll(range)
```

---

## Contributing

### Code Style

**Naming Conventions**:
- Classes: `PascalCase` (e.g., `RAGChatManager`)
- Functions: `camelCase` (e.g., `processQuery`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_TOKENS`)
- Private methods: `_camelCase` (e.g., `_internalHelper`)

**Comments**:
```javascript
/**
 * Function description
 *
 * @param {string} query - User query text
 * @param {number} topK - Number of results
 * @returns {Promise<Array>} - Search results
 */
async function searchDocuments(query, topK = 5) {
    // Implementation
}
```

**Error Handling**:
```javascript
try {
    await riskyOperation()
} catch (error) {
    console.error('❌ Operation failed:', error)
    // Fallback or user notification
    showNotification('Operation failed', 'error')
}
```

### Commit Messages

Follow conventional commits:

```
feat: Add new feature
fix: Fix bug in component
docs: Update documentation
style: Format code
refactor: Refactor module
test: Add tests
perf: Improve performance
```

### Pull Request Process

1. Fork the repository
2. Create feature branch (`feature/amazing-feature`)
3. Make changes with tests
4. Update documentation
5. Run all tests
6. Submit PR with description

### Code Review Checklist

- [ ] Code follows style guide
- [ ] Comments explain why, not what
- [ ] Tests added for new features
- [ ] Documentation updated
- [ ] No console errors
- [ ] Performance impact minimal
- [ ] Browser compatibility checked

---

## Debugging Tips

### Common Issues

**Issue: Manager not initialized**
```javascript
// Check initialization
if (!window.ragChatManager.initialized) {
    console.log('Manager not initialized yet')
    await window.ragChatManager.initialize()
}
```

**Issue: Database connection failed**
```javascript
// Check database state
if (!window.database.db) {
    console.log('Database not connected')
    await window.database.initialize()
}
```

**Issue: Embeddings slow**
```javascript
// Switch to faster model
await embeddingManager.loadModel('minilm') // Instead of 'use'
```

### Browser DevTools

**Console Logging**:
- All managers use emoji prefixes (💬, 📊, 📁, etc.)
- Filter console by emoji to focus on specific manager

**Network Tab**:
- Check TensorFlow.js model loading
- Verify API calls to LLM services

**Application Tab**:
- IndexedDB: Inspect all 17 object stores
- localStorage: Check cached data
- Session Storage: Temporary data

**Performance Tab**:
- Profile RAG query execution
- Identify bottlenecks
- Measure render times

---

## Security Considerations

### Data Privacy

- All data stored locally (IndexedDB + localStorage)
- No external transmission except LLM API (optional)
- API keys stored only in browser
- No server-side logging

### Input Sanitization

```javascript
// Sanitize user input
function sanitizeInput(text) {
    return text
        .trim()
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .substring(0, 5000) // Limit length
}
```

### API Key Management

```javascript
// Store securely in localStorage
function saveAPIKey(key) {
    if (key && key.length > 0) {
        localStorage.setItem('llm_api_key', btoa(key)) // Base64 encode
    }
}

function getAPIKey() {
    const encoded = localStorage.getItem('llm_api_key')
    return encoded ? atob(encoded) : null
}
```

---

**For user documentation, see USER_GUIDE.md**

**For deployment instructions, see DEPLOYMENT.md**
