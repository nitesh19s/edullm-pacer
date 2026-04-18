# EduLLM Platform Database Schema

**Database Engine**: IndexedDB (Browser-based NoSQL)
**Database Name**: `EduLLMPlatform`
**Current Version**: 2
**Total Object Stores**: 17

---

## Overview

The EduLLM Platform uses IndexedDB for client-side storage, providing a robust, structured database system for educational content, user interactions, experiments, and analytics. All data is stored locally in the user's browser with optional backup/export capabilities.

---

## Object Stores (Tables)

### 1. **curriculum** - NCERT Curriculum Data
Stores the complete NCERT curriculum content organized by subject, grade, and chapter.

**Key Path**: `id` (auto-increment)

**Indexes**:
- `subject` - Subject name (e.g., "Mathematics", "Physics")
- `grade` - Grade level (9-12)
- `chapter` - Chapter name
- `subject_grade` - Composite index for efficient subject+grade queries

**Schema**:
```javascript
{
    id: number (auto),
    subject: string,
    grade: number,
    chapter: string,
    content: string,           // Full chapter content
    keyTopics: string[],       // Main topics covered
    learningObjectives: string[],
    exercises: object[],       // Chapter exercises
    vocabulary: string[],      // Key terms
    metadata: object,          // Additional chapter metadata
    createdAt: ISO8601 string,
    updatedAt: ISO8601 string
}
```

**Use Cases**:
- Store NCERT curriculum
- Query by subject/grade/chapter
- Retrieve learning materials
- Track curriculum coverage

---

### 2. **chunks** - Content Chunks
Stores chunked content for RAG (Retrieval-Augmented Generation) processing.

**Key Path**: `id` (auto-increment)

**Indexes**:
- `subject` - Subject of the chunk
- `grade` - Grade level
- `chapter` - Chapter name
- `chunkIndex` - Position in document
- `subject_grade_chapter` - Composite index for hierarchical queries

**Schema**:
```javascript
{
    id: number (auto),
    subject: string,
    grade: number,
    chapter: string,
    chunkIndex: number,        // Position in original document
    text: string,              // Chunk content (512-1024 tokens)
    metadata: object,          // Source info, boundaries, etc.
    tokenCount: number,        // Number of tokens
    createdAt: ISO8601 string
}
```

**Use Cases**:
- Store document chunks for RAG
- Semantic search
- Context retrieval
- Document reconstruction

---

### 3. **chatHistory** - Chat Conversations
Stores all RAG chat interactions between user and system.

**Key Path**: `id` (auto-increment)

**Indexes**:
- `timestamp` - Message timestamp
- `sessionId` - Chat session identifier
- `subject` - Subject discussed
- `grade` - Grade level

**Schema**:
```javascript
{
    id: number (auto),
    sessionId: string,         // UUID for session
    role: "user" | "assistant" | "system",
    content: string,           // Message text
    subject: string,           // Derived from context
    grade: number,             // Derived from context
    timestamp: number,         // Unix timestamp
    metadata: {
        retrievedChunks: number, // Number of chunks used
        llmUsed: boolean,
        responseTime: number,    // ms
        accuracy: number         // 0-100
    }
}
```

**Use Cases**:
- Store chat history
- Track conversations
- Analyze query patterns
- Calculate statistics

---

### 4. **interactions** - User Interactions
Tracks all user interactions with the platform for analytics.

**Key Path**: `id` (auto-increment)

**Indexes**:
- `type` - Interaction type
- `timestamp` - When it occurred
- `section` - Platform section

**Schema**:
```javascript
{
    id: number (auto),
    type: string,              // "click", "upload", "search", "export", etc.
    section: string,           // "dashboard", "rag", "chunking", etc.
    details: object,           // Additional interaction data
    timestamp: number,         // Unix timestamp
    sessionId: string          // Current session
}
```

**Use Cases**:
- Track user behavior
- Generate analytics
- Identify usage patterns
- Performance monitoring

---

### 5. **uploadedFiles** - File Upload Tracking
Tracks all files uploaded to the platform.

**Key Path**: `id` (auto-increment)

**Indexes**:
- `fileName` - Original filename
- `subject` - Assigned subject
- `grade` - Assigned grade
- `uploadDate` - Upload timestamp
- `status` - Processing status

**Schema**:
```javascript
{
    id: number (auto),
    fileName: string,
    fileSize: number,          // bytes
    fileType: string,          // "pdf", "txt", "md"
    subject: string,
    grade: number,
    content: string,           // Extracted text
    status: "pending" | "processing" | "completed" | "failed",
    uploadDate: ISO8601 string,
    processedDate: ISO8601 string,
    metadata: {
        pages: number,
        chunkCount: number,
        embeddingCount: number
    }
}
```

**Use Cases**:
- Track uploaded files
- Monitor processing status
- File management
- Content organization

---

### 6. **settings** - User Settings
Stores user preferences and configuration.

**Key Path**: `key` (manual, e.g., "theme", "model", "chunkSize")

**Schema**:
```javascript
{
    key: string,               // Setting identifier
    value: any,                // Setting value
    updatedAt: ISO8601 string
}
```

**Use Cases**:
- Store user preferences
- Configuration management
- Personalization
- Feature flags

---

### 7. **statistics** - Platform Statistics
Stores aggregated statistics and metrics.

**Key Path**: `key` (manual, e.g., "totalDocuments", "totalQueries")

**Schema**:
```javascript
{
    key: string,               // Statistic identifier
    value: number | object,    // Statistic value
    history: array,            // Historical values
    updatedAt: ISO8601 string
}
```

**Use Cases**:
- Track platform metrics
- Dashboard statistics
- Performance monitoring
- Trend analysis

---

### 8. **searchIndex** - Search Optimization
Inverted index for fast keyword searches.

**Key Path**: `id` (auto-increment)

**Indexes**:
- `keyword` - Indexed keyword
- `subject` - Subject
- `grade` - Grade level

**Schema**:
```javascript
{
    id: number (auto),
    keyword: string,           // Indexed term (lowercase)
    subject: string,
    grade: number,
    chunkIds: number[],        // Chunk IDs containing this keyword
    frequency: number,         // Total occurrences
    idf: number                // Inverse document frequency
}
```

**Use Cases**:
- Fast keyword search
- Full-text search
- Search autocomplete
- Query suggestions

---

### 9. **knowledgeGraph** - Concept Relationships
Stores concept nodes and relationships for knowledge graph.

**Key Path**: `id` (auto-increment)

**Indexes**:
- `subject` - Subject
- `chapter` - Chapter
- `concept` - Concept name

**Schema**:
```javascript
{
    id: number (auto),
    concept: string,           // Concept name (e.g., "Quadratic Equation")
    type: "topic" | "subtopic" | "term" | "formula",
    subject: string,
    chapter: string,
    definition: string,
    examples: string[],
    relatedConcepts: number[], // IDs of related concepts
    prerequisites: number[],   // IDs of prerequisite concepts
    metadata: {
        difficulty: number,     // 1-5
        importance: number,     // 1-5
        chunkIds: number[]      // Source chunks
    }
}
```

**Use Cases**:
- Build knowledge graph
- Show concept relationships
- Learning path generation
- Prerequisite tracking

---

### 10. **experiments** - Experiment Definitions
Stores experiment configurations for testing different approaches.

**Key Path**: `id` (auto-increment)

**Indexes**:
- `name` - Experiment name
- `status` - Current status
- `createdAt` - Creation date
- `tags` - Multi-entry index for tags

**Schema**:
```javascript
{
    id: number (auto),
    name: string,
    description: string,
    type: "rag" | "chunking" | "embedding" | "graph" | "llm",
    config: object,            // Experiment configuration
    status: "draft" | "running" | "completed" | "paused",
    tags: string[],
    createdAt: ISO8601 string,
    updatedAt: ISO8601 string,
    createdBy: string
}
```

**Use Cases**:
- Define experiments
- Track experiment status
- A/B testing
- Performance comparison

---

### 11. **experimentRuns** - Experiment Execution Results
Stores results from experiment executions.

**Key Path**: `id` (auto-increment)

**Indexes**:
- `experimentId` - Parent experiment
- `timestamp` - Run timestamp
- `status` - Run status
- `experiment_timestamp` - Composite index

**Schema**:
```javascript
{
    id: number (auto),
    experimentId: number,      // Foreign key to experiments
    timestamp: ISO8601 string,
    status: "running" | "completed" | "failed",
    config: object,            // Run configuration
    results: {
        metrics: object,        // Performance metrics
        samples: array,         // Sample outputs
        errors: array           // Any errors encountered
    },
    duration: number,          // Run duration in ms
    resourceUsage: object      // Memory, CPU, etc.
}
```

**Use Cases**:
- Store experiment results
- Compare runs
- Performance analysis
- Result visualization

---

### 12. **analytics** - Analytics Reports
Stores generated analytics reports and aggregated data.

**Key Path**: `id` (auto-increment)

**Indexes**:
- `type` - Report type
- `timestamp` - Generation time
- `experimentId` - Related experiment (optional)
- `type_timestamp` - Composite index

**Schema**:
```javascript
{
    id: number (auto),
    type: "performance" | "usage" | "accuracy" | "custom",
    timestamp: ISO8601 string,
    experimentId: number,      // Optional
    data: object,              // Report data
    visualizations: array,     // Chart configs
    insights: string[],        // Generated insights
    period: {
        start: ISO8601 string,
        end: ISO8601 string
    }
}
```

**Use Cases**:
- Store analytics reports
- Historical analysis
- Trend visualization
- Performance tracking

---

### 13. **baselines** - Performance Baselines
Stores baseline metrics for comparison.

**Key Path**: `id` (auto-increment)

**Indexes**:
- `name` - Baseline name
- `category` - Category
- `createdAt` - Creation date

**Schema**:
```javascript
{
    id: number (auto),
    name: string,
    category: "rag" | "chunking" | "embedding" | "overall",
    metrics: {
        accuracy: number,
        responseTime: number,
        precision: number,
        recall: number,
        f1Score: number
    },
    config: object,            // Configuration used
    sampleSize: number,        // Number of samples
    createdAt: ISO8601 string,
    notes: string
}
```

**Use Cases**:
- Store baseline performance
- Compare experiments
- Track improvements
- Regression detection

---

### 14. **abTests** - A/B Testing
Manages A/B tests for platform features.

**Key Path**: `id` (auto-increment)

**Indexes**:
- `name` - Test name
- `status` - Current status
- `startDate` - Test start
- `endDate` - Test end

**Schema**:
```javascript
{
    id: number (auto),
    name: string,
    description: string,
    variants: [
        {
            id: string,
            name: string,
            config: object,
            traffic: number       // % allocation
        }
    ],
    metrics: string[],         // Metrics to track
    status: "draft" | "running" | "completed" | "paused",
    startDate: ISO8601 string,
    endDate: ISO8601 string,
    results: object,           // Aggregated results
    winner: string             // Winning variant ID
}
```

**Use Cases**:
- A/B testing
- Feature testing
- Performance optimization
- User experience testing

---

### 15. **embeddings** - Vector Embeddings
Stores vector embeddings for semantic search.

**Key Path**: `id` (auto-increment)

**Indexes**:
- `chunkId` - Source chunk
- `subject` - Subject
- `grade` - Grade level
- `modelVersion` - Embedding model version
- `chunk_model` - Composite unique index

**Schema**:
```javascript
{
    id: number (auto),
    chunkId: number,           // Foreign key to chunks
    vector: Float32Array,      // Embedding vector (512D)
    subject: string,
    grade: number,
    modelVersion: string,      // e.g., "universal-sentence-encoder-v4"
    createdAt: ISO8601 string,
    metadata: {
        dimension: number,
        norm: number            // Vector norm
    }
}
```

**Use Cases**:
- Semantic search
- Similarity computation
- RAG retrieval
- Clustering

---

### 16. **cache** - Performance Cache
Caches frequently accessed data for performance.

**Key Path**: `key` (manual, e.g., "query:hash123")

**Indexes**:
- `expiresAt` - Expiration timestamp
- `category` - Cache category

**Schema**:
```javascript
{
    key: string,               // Cache key
    value: any,                // Cached value
    expiresAt: number,         // Unix timestamp
    category: string,          // "query", "embedding", "search"
    createdAt: number,
    hitCount: number,          // Access count
    size: number               // Approximate size in bytes
}
```

**Use Cases**:
- Cache query results
- Cache embeddings
- Performance optimization
- Reduce recomputation

---

### 17. **backups** - Backup Metadata
Tracks backup operations and metadata.

**Key Path**: `id` (auto-increment)

**Indexes**:
- `timestamp` - Backup timestamp
- `type` - Backup type

**Schema**:
```javascript
{
    id: number (auto),
    timestamp: ISO8601 string,
    type: "manual" | "automatic" | "export",
    stores: string[],          // Backed up stores
    size: number,              // Total size in bytes
    itemCount: number,         // Total items
    format: "json" | "blob",
    location: string,          // Storage location reference
    status: "completed" | "failed",
    error: string              // Error message if failed
}
```

**Use Cases**:
- Track backups
- Restore points
- Data migration
- Disaster recovery

---

## Database Relationships

### Foreign Key Relationships

```
curriculum (id) ← chunks (metadata.curriculumId)
chunks (id) ← embeddings (chunkId)
chunks (id) ← searchIndex (chunkIds[])
chunks (id) ← knowledgeGraph (metadata.chunkIds[])

experiments (id) ← experimentRuns (experimentId)
experiments (id) ← analytics (experimentId)

chatHistory (sessionId) → interactions (sessionId)
uploadedFiles (id) → chunks (metadata.fileId)
```

### Logical Relationships

```
subject + grade + chapter → curriculum → chunks → embeddings
                                       → searchIndex
                                       → knowledgeGraph

user query → chatHistory → retrievedChunks → embeddings → chunks
                                                        → searchIndex
```

---

## Database Statistics

| Metric | Value |
|--------|-------|
| **Total Object Stores** | 17 |
| **Indexes** | 47 |
| **Composite Indexes** | 5 |
| **Auto-increment Keys** | 15 |
| **Manual Keys** | 2 |
| **Multi-entry Indexes** | 1 (`experiments.tags`) |
| **Unique Indexes** | 1 (`embeddings.chunk_model`) |

---

## Storage Estimates

Based on typical usage:

| Store | Average Item Size | Typical Count | Total Size |
|-------|-------------------|---------------|------------|
| curriculum | 10 KB | 200 | 2 MB |
| chunks | 2 KB | 45,000 | 90 MB |
| embeddings | 2.5 KB | 45,000 | 112.5 MB |
| chatHistory | 0.5 KB | 5,000 | 2.5 MB |
| knowledgeGraph | 1 KB | 500 | 500 KB |
| uploadedFiles | 5 KB | 100 | 500 KB |
| searchIndex | 0.2 KB | 10,000 | 2 MB |
| experiments | 2 KB | 50 | 100 KB |
| experimentRuns | 5 KB | 200 | 1 MB |
| analytics | 10 KB | 100 | 1 MB |
| **Total** | - | - | **~212 MB** |

**Note**: Browser storage limits are typically 50-100 GB, so plenty of headroom.

---

## Performance Considerations

### Indexes Strategy

✅ **Single-field indexes** for common queries (subject, grade, timestamp)
✅ **Composite indexes** for multi-field queries (subject+grade+chapter)
✅ **Multi-entry indexes** for array fields (tags)
✅ **Unique indexes** to prevent duplicates (chunk+model)

### Query Optimization

- Use indexes for WHERE clauses
- Use composite indexes for multi-field filters
- Use cursor ranges for pagination
- Use `openCursor()` for large result sets
- Cache frequently accessed data

### Write Optimization

- Batch writes with transactions
- Use `put()` instead of `add()` for updates
- Clear before bulk insert (if replacing all)
- Use `autoIncrement` for primary keys

---

## Browser Compatibility

| Browser | IndexedDB Support | Version Required |
|---------|-------------------|------------------|
| Chrome | ✅ Full | 24+ |
| Firefox | ✅ Full | 16+ |
| Safari | ✅ Full | 10+ |
| Edge | ✅ Full | 12+ |
| Mobile Chrome | ✅ Full | All |
| Mobile Safari | ✅ Full | 10+ |

---

## Database Migrations

### Version History

**Version 1** (Initial):
- 9 core stores: curriculum, chunks, chatHistory, interactions, uploadedFiles, settings, statistics, searchIndex, knowledgeGraph

**Version 2** (Current):
- Added 8 stores: experiments, experimentRuns, analytics, baselines, abTests, embeddings, cache, backups
- Added composite indexes
- Added multi-entry indexes

**Future Versions**:
- Version 3: Planned indexes optimization
- Version 4: Planned sharding for large datasets

---

## Summary

The EduLLM database schema is designed for:
- ✅ **Educational Content**: Curriculum, chunks, embeddings
- ✅ **User Interactions**: Chat, uploads, analytics
- ✅ **Knowledge Management**: Graph, search, concepts
- ✅ **Experimentation**: Experiments, runs, baselines, A/B tests
- ✅ **Performance**: Cache, indexes, optimization
- ✅ **Reliability**: Backups, migrations, error handling

**Total Capacity**: 17 object stores, 47 indexes, scalable to millions of records.
