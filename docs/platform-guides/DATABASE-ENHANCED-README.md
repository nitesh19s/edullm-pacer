# Enhanced Database v2 Documentation

## Overview

The EduLLM Platform database has been upgraded to version 2 with comprehensive enhancements for scalability, performance, and functionality. The database now supports advanced features like experiments tracking, analytics, A/B testing, embeddings storage, and automatic migrations.

## What's New in v2

### New Object Stores (8 Additional Stores)

1. **experiments** - Store experiment definitions
2. **experimentRuns** - Track experiment execution results
3. **analytics** - Store analytics reports and metrics
4. **baselines** - Manage baseline comparisons
5. **abTests** - A/B testing framework data
6. **embeddings** - Vector embeddings for semantic search
7. **cache** - Persistent cache for performance
8. **backups** - Backup metadata tracking

### Migration System

Automatic migration from v1 to v2:
- Non-destructive upgrades
- Sequential migration execution
- Version tracking
- Backwards compatibility

### Performance Features

- **In-Memory Cache**: 5-second TTL for frequently accessed data
- **Persistent Cache**: 1-hour TTL in IndexedDB
- **Pagination**: Limit/offset support for all queries
- **Batch Operations**: Process multiple items efficiently
- **Optimized Indexes**: Compound indexes for fast queries

### Data Integrity

- Automatic validation
- Orphaned data detection
- Self-repair capabilities
- Storage quota monitoring

### Backup & Restore

- Full and partial backups
- Backup history tracking
- One-click restore
- Export/Import functionality

## Architecture

### Database Schema

```
EduLLMPlatform v2
├── curriculum (v1)           - NCERT curriculum data
├── chunks (v1)               - Content chunks
├── chatHistory (v1)          - Chat conversations
├── interactions (v1)         - User interactions
├── uploadedFiles (v1)        - File metadata
├── settings (v1)             - User settings
├── statistics (v1)           - Platform statistics
├── searchIndex (v1)          - Search optimization
├── knowledgeGraph (v1)       - Concept relationships
├── experiments (v2)          - Experiment definitions
├── experimentRuns (v2)       - Run results
├── analytics (v2)            - Analytics data
├── baselines (v2)            - Baseline metrics
├── abTests (v2)              - A/B test data
├── embeddings (v2)           - Vector embeddings
├── cache (v2)                - Persistent cache
└── backups (v2)              - Backup metadata
```

### Indexes

**Experiments Store:**
- name (non-unique)
- status (non-unique)
- createdAt (non-unique)
- tags (multi-entry, non-unique)

**Experiment Runs Store:**
- experimentId (non-unique)
- timestamp (non-unique)
- status (non-unique)
- [experimentId, timestamp] (compound)

**Embeddings Store:**
- chunkId (non-unique)
- subject (non-unique)
- grade (non-unique)
- modelVersion (non-unique)
- [chunkId, modelVersion] (compound, unique)

## Usage Guide

### Initialization

```javascript
const db = new EduLLMDatabase();
await db.initialize();
```

### Experiments

**Create Experiment:**
```javascript
const experimentId = await db.saveExperiment({
    name: 'RAG Performance Test',
    description: 'Testing different chunking strategies',
    parameters: {
        chunkSize: 500,
        overlap: 50,
        model: 'gpt-4'
    },
    tags: ['rag', 'chunking'],
    status: 'created'
});
```

**Get Experiments:**
```javascript
// Get all experiments
const allExperiments = await db.getExperiments();

// Get with filters
const runningExps = await db.getExperiments({
    status: 'running'
});

// Get with pagination
const pagedExps = await db.getExperiments(
    { tags: ['rag'] },
    { limit: 10, offset: 0 }
);
```

**Update Experiment:**
```javascript
await db.saveExperiment({
    id: experimentId,
    name: 'Updated Name',
    status: 'completed'
});
```

**Delete Experiment:**
```javascript
// Deletes experiment and all its runs
await db.deleteExperiment(experimentId);
```

### Experiment Runs

**Create Run:**
```javascript
await db.saveExperimentRun({
    experimentId: 1,
    parameters: {
        iteration: 1,
        temperature: 0.7
    },
    metrics: {
        precision: [
            { step: 1, value: 0.75 },
            { step: 2, value: 0.78 }
        ],
        recall: [
            { step: 1, value: 0.70 },
            { step: 2, value: 0.73 }
        ]
    },
    results: {
        accuracy: 0.85,
        f1Score: 0.82
    },
    status: 'completed',
    duration: 3500
});
```

**Get Runs:**
```javascript
// Get all runs for an experiment
const runs = await db.getExperimentRuns(experimentId);

// With pagination
const recentRuns = await db.getExperimentRuns(
    experimentId,
    { limit: 5, offset: 0 }
);
```

### Analytics

**Save Analytics:**
```javascript
await db.saveAnalytics({
    type: 'report',
    experimentId: 1,
    data: {
        title: 'Weekly Performance Report',
        metrics: {
            avgAccuracy: 0.87,
            totalQueries: 1250,
            avgResponseTime: 450
        }
    }
});
```

**Get Analytics:**
```javascript
// Get all analytics
const analytics = await db.getAnalytics();

// Filter by type
const reports = await db.getAnalytics({ type: 'report' });

// Filter by experiment
const expAnalytics = await db.getAnalytics({
    experimentId: 1
});
```

### Baselines

**Save Baseline:**
```javascript
await db.saveBaseline({
    name: 'RAG Baseline v1',
    category: 'rag',
    metrics: {
        precision: 0.75,
        recall: 0.70,
        f1Score: 0.725
    },
    description: 'Initial RAG system baseline'
});
```

**Get Baselines:**
```javascript
// Get all baselines
const allBaselines = await db.getBaselines();

// Get by category
const ragBaselines = await db.getBaselines('rag');
```

### A/B Tests

**Create Test:**
```javascript
await db.saveABTest({
    name: 'Chunking Method Comparison',
    description: 'Compare fixed vs semantic chunking',
    variants: [
        { id: 'A', name: 'Fixed Size', allocation: 0.5 },
        { id: 'B', name: 'Semantic', allocation: 0.5 }
    ],
    status: 'running',
    startDate: new Date().toISOString(),
    trafficAllocation: { A: 0.5, B: 0.5 }
});
```

**Get Tests:**
```javascript
// Get all tests
const allTests = await db.getABTests();

// Get by status
const runningTests = await db.getABTests('running');
```

### Embeddings

**Save Single Embedding:**
```javascript
await db.saveEmbedding({
    chunkId: 1,
    vector: [0.1, 0.2, 0.3, 0.4, 0.5],
    subject: 'Mathematics',
    grade: 10,
    modelVersion: 'v1'
});
```

**Batch Save Embeddings:**
```javascript
const embeddings = [
    { chunkId: 1, vector: [...], subject: 'Math', grade: 10 },
    { chunkId: 2, vector: [...], subject: 'Science', grade: 10 },
    { chunkId: 3, vector: [...], subject: 'History', grade: 11 }
];
await db.batchSaveEmbeddings(embeddings);
```

**Get Embeddings:**
```javascript
// Get specific embedding
const embedding = await db.getEmbedding(1, 'v1');

// Get by filter
const mathEmbeddings = await db.getEmbeddingsByFilter({
    subject: 'Mathematics'
});
```

### Cache Operations

**In-Memory Cache:**
```javascript
// Set cache (5s TTL)
db.setCache('key', { data: 'value' });

// Get from cache
const cached = db.getFromCache('key');

// Invalidate cache
db.invalidateCache('category'); // or db.invalidateCache() for all
```

**Persistent Cache:**
```javascript
// Save to persistent cache (1h TTL)
await db.saveToPersistentCache('key', { data: 'value' }, 'category');

// Get from persistent cache
const cached = await db.getFromPersistentCache('key');

// Clean expired entries
await db.cleanExpiredCache();
```

### Backup & Restore

**Create Backup:**
```javascript
// Full backup
const fullBackup = await db.createBackup('full');
console.log('Backup ID:', fullBackup.id);

// Partial backup (essential data only)
const partialBackup = await db.createBackup('partial');
```

**Restore from Backup:**
```javascript
const backup = await db.createBackup('full');
await db.restoreFromBackup(backup.data);
```

**Get Backup History:**
```javascript
const history = await db.getBackupHistory(10);
history.forEach(backup => {
    console.log(`${backup.timestamp}: ${backup.type} (${backup.size} bytes)`);
});
```

### Export & Import

**Export Database:**
```javascript
// Basic export
const exportData = await db.exportDatabase();

// Include embeddings
const fullExport = await db.exportDatabase({
    includeEmbeddings: true
});

// Download export
const blob = new Blob([JSON.stringify(exportData)], {
    type: 'application/json'
});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `edullm-backup-${Date.now()}.json`;
a.click();
```

**Import Database:**
```javascript
// From file
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    const text = await file.text();
    const data = JSON.parse(text);
    await db.importDatabase(data);
};
fileInput.click();
```

### Performance Monitoring

**Get Metrics:**
```javascript
const metrics = await db.getPerformanceMetrics();
console.log('Database Version:', metrics.databaseVersion);
console.log('Cache Size:', metrics.cacheSize);
console.log('Experiments:', metrics.experiments);
console.log('Storage:', metrics.storage);
```

**Optimize Database:**
```javascript
const result = await db.optimizeDatabase();
console.log('Items removed:', result.itemsRemoved);
console.log('Expired cache:', result.expiredCache);
console.log('Old interactions:', result.oldInteractions);
```

### Data Integrity

**Validate Integrity:**
```javascript
const report = await db.validateDataIntegrity();
if (!report.valid) {
    console.log('Issues found:', report.issues);

    // Automatic repair
    const repairResult = await db.repairDatabase(report);
    console.log('Items repaired:', repairResult.itemsRepaired);
}
```

**Clear Database:**
```javascript
// Clear everything
await db.clearDatabase();

// Clear but keep settings
await db.clearDatabase({ excludeSettings: true });

// Clear but keep settings and backups
await db.clearDatabase({
    excludeSettings: true,
    excludeBackups: true
});
```

## Performance Tips

### 1. Use Pagination for Large Datasets

```javascript
// Instead of loading everything
const allRuns = await db.getExperimentRuns(expId);

// Use pagination
const page1 = await db.getExperimentRuns(expId, { limit: 50, offset: 0 });
const page2 = await db.getExperimentRuns(expId, { limit: 50, offset: 50 });
```

### 2. Leverage Caching

```javascript
// Check cache first
let data = db.getFromCache('experiments_list');
if (!data) {
    data = await db.getExperiments();
    db.setCache('experiments_list', data);
}
```

### 3. Use Batch Operations

```javascript
// Instead of multiple saves
for (const emb of embeddings) {
    await db.saveEmbedding(emb); // Slow
}

// Use batch save
await db.batchSaveEmbeddings(embeddings); // Fast
```

### 4. Use Specific Indexes

```javascript
// Uses compound index - Fast
const runs = await db.getExperimentRuns(experimentId);

// Uses compound index with pagination - Fast
const recentRuns = await db.getExperimentRuns(
    experimentId,
    { limit: 10 }
);
```

### 5. Regular Maintenance

```javascript
// Run weekly
async function weeklyMaintenance() {
    await db.optimizeDatabase();
    const report = await db.validateDataIntegrity();
    if (!report.valid) {
        await db.repairDatabase(report);
    }
    await db.createBackup('full');
}
```

## Migration Guide (v1 → v2)

### Automatic Migration

The database automatically migrates from v1 to v2 when initialized:

```javascript
const db = new EduLLMDatabase();
await db.initialize();
// Migration happens automatically if needed
```

### What Happens During Migration

1. Detects current version (v1)
2. Creates new object stores:
   - experiments
   - experimentRuns
   - analytics
   - baselines
   - abTests
   - embeddings
   - cache
   - backups
3. Adds indexes to new stores
4. Preserves all existing data
5. Updates version to 2

### No Data Loss

- All v1 data is preserved
- No schema changes to existing stores
- Only new stores are added
- Backwards compatible

## Troubleshooting

### Issue: Database size exceeding quota

**Solution:**
```javascript
// Check usage
const size = await db.getDatabaseSize();
console.log(`Usage: ${size.usagePercent}%`);

// Optimize
await db.optimizeDatabase();

// Clear old data
await db.clearDatabase({
    excludeSettings: true,
    excludeBackups: true
});
```

### Issue: Slow queries

**Solution:**
```javascript
// Use pagination
const results = await db.getExperiments({}, {
    limit: 50,
    offset: 0
});

// Use specific filters
const filtered = await db.getExperiments({
    status: 'running'
});

// Enable caching
db.setCache('key', data);
```

### Issue: Orphaned data

**Solution:**
```javascript
// Validate and repair
const report = await db.validateDataIntegrity();
if (!report.valid) {
    await db.repairDatabase(report);
}
```

## API Reference

### Constructor

```javascript
new EduLLMDatabase()
```

### Methods

#### Initialization
- `initialize()` - Initialize database connection

#### Experiments
- `saveExperiment(experimentData)` - Create/update experiment
- `getExperiments(filters, pagination)` - Get experiments
- `getExperimentById(id)` - Get specific experiment
- `deleteExperiment(id)` - Delete experiment

#### Experiment Runs
- `saveExperimentRun(runData)` - Create/update run
- `getExperimentRuns(experimentId, pagination)` - Get runs
- `deleteExperimentRun(id)` - Delete run

#### Analytics
- `saveAnalytics(analyticsData)` - Save analytics
- `getAnalytics(filters, pagination)` - Get analytics

#### Baselines
- `saveBaseline(baselineData)` - Save baseline
- `getBaselines(category)` - Get baselines

#### A/B Tests
- `saveABTest(testData)` - Create/update test
- `getABTests(status)` - Get tests

#### Embeddings
- `saveEmbedding(embeddingData)` - Save single embedding
- `batchSaveEmbeddings(embeddings)` - Batch save
- `getEmbedding(chunkId, modelVersion)` - Get embedding
- `getEmbeddingsByFilter(filters)` - Get filtered embeddings

#### Cache
- `setCache(key, value)` - Set in-memory cache
- `getFromCache(key)` - Get from in-memory cache
- `invalidateCache(category)` - Clear cache
- `saveToPersistentCache(key, value, category)` - Persistent cache
- `getFromPersistentCache(key)` - Get from persistent cache
- `cleanExpiredCache()` - Remove expired entries

#### Backup & Restore
- `createBackup(type)` - Create backup ('full' or 'partial')
- `restoreFromBackup(backupData)` - Restore from backup
- `getBackupHistory(limit)` - Get backup records

#### Maintenance
- `getPerformanceMetrics()` - Get database metrics
- `optimizeDatabase()` - Optimize database
- `validateDataIntegrity()` - Check integrity
- `repairDatabase(report)` - Repair issues
- `clearDatabase(options)` - Clear database
- `exportDatabase(options)` - Export data
- `importDatabase(data)` - Import data

## Testing

Run the comprehensive test suite:

1. Open `index.html`
2. Uncomment the test script:
```html
<!-- Test Scripts (Load only when needed) -->
<script src="test-database-enhanced.js"></script>
```
3. Open browser console
4. Watch tests execute automatically

The test suite covers:
- Database initialization and migration
- All CRUD operations
- Pagination
- Caching
- Backup/restore
- Performance metrics
- Data integrity
- Export/import

## Best Practices

### 1. Always Initialize First

```javascript
const db = new EduLLMDatabase();
await db.initialize();
// Now ready to use
```

### 2. Use Pagination for Lists

```javascript
// Good
const page = await db.getExperiments({}, { limit: 50 });

// Avoid
const all = await db.getExperiments(); // Could be thousands
```

### 3. Cache Frequently Accessed Data

```javascript
let experiments = db.getFromCache('experiments');
if (!experiments) {
    experiments = await db.getExperiments();
    db.setCache('experiments', experiments);
}
```

### 4. Create Regular Backups

```javascript
// Weekly full backup
setInterval(async () => {
    await db.createBackup('full');
}, 7 * 24 * 60 * 60 * 1000);
```

### 5. Monitor Database Health

```javascript
// Monthly integrity check
setInterval(async () => {
    const report = await db.validateDataIntegrity();
    if (!report.valid) {
        await db.repairDatabase(report);
    }
}, 30 * 24 * 60 * 60 * 1000);
```

## Version History

### v2.0.0 (Current)
- Added 8 new object stores
- Implemented migration system
- Added pagination support
- Added caching layer
- Added backup/restore
- Added performance monitoring
- Added data integrity validation
- Added batch operations

### v1.0.0
- Initial release
- 9 core object stores
- Basic CRUD operations

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API reference
3. Run the test suite
4. Check browser console for errors

## License

Part of the EduLLM Platform project.
