# EduLLM Database V3 API Documentation

Complete API reference for the EduLLM Platform Database System (Version 3).

## Table of Contents

1. [Getting Started](#getting-started)
2. [Configuration](#configuration)
3. [CRUD Operations](#crud-operations)
4. [Query Methods](#query-methods)
5. [Batch Operations](#batch-operations)
6. [Export & Import](#export--import)
7. [Backup & Restore](#backup--restore)
8. [Migration System](#migration-system)
9. [Testing & Validation](#testing--validation)
10. [Performance Monitoring](#performance-monitoring)
11. [Cache Management](#cache-management)
12. [Best Practices](#best-practices)
13. [Complete Examples](#complete-examples)

---

## Getting Started

### Basic Initialization

```javascript
// Create database instance with default settings
const db = new EduLLMDatabaseV3();

// Initialize connection
await db.initialize();

// Check if database is ready
console.log('Database ready:', db.isInitialized);
```

### Custom Configuration

```javascript
const db = new EduLLMDatabaseV3({
    dbName: 'MyCustomDB',
    version: 3,
    enableCache: true,
    cacheTimeout: 10000, // 10 seconds
    enableLogging: true,
    enablePerformanceMonitoring: true,
    batchSize: 1000
});

await db.initialize();
```

---

## Configuration

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dbName` | String | `'EduLLMPlatform'` | Database name |
| `version` | Number | `3` | Database version |
| `enableCache` | Boolean | `true` | Enable in-memory caching |
| `cacheTimeout` | Number | `5000` | Cache TTL in milliseconds |
| `enableLogging` | Boolean | `true` | Enable console logging |
| `enablePerformanceMonitoring` | Boolean | `true` | Track performance metrics |
| `batchSize` | Number | `1000` | Default batch operation size |

---

## CRUD Operations

### Create (Insert)

Insert a new record into a store.

```javascript
// Basic create
const id = await db.create('curriculum', {
    subject: 'Physics',
    grade: 11,
    chapter: 'Motion in a Straight Line',
    content: 'Chapter content...',
    keyTopics: ['Speed', 'Velocity', 'Acceleration'],
    learningObjectives: ['Understand kinematics']
});

console.log('Created record with ID:', id);
```

**Features:**
- Auto-adds `createdAt` and `updatedAt` timestamps
- Returns the auto-generated ID
- Invalidates cache for the store

### Read (Get)

Retrieve a record by its key.

```javascript
// Read a record
const record = await db.read('curriculum', 123);

if (record) {
    console.log('Subject:', record.subject);
    console.log('Grade:', record.grade);
} else {
    console.log('Record not found');
}
```

**Features:**
- Checks cache first (if enabled)
- Returns `undefined` if not found
- Updates cache after successful read

### Update

Update an existing record.

```javascript
// Update a record
const record = await db.read('curriculum', 123);
record.content = 'Updated content...';
record.keyTopics.push('New topic');

await db.update('curriculum', record);
```

**Features:**
- Auto-updates `updatedAt` timestamp
- Invalidates cache
- Uses `put()` so creates if not exists

### Delete

Remove a record from a store.

```javascript
// Delete a record
await db.delete('curriculum', 123);
console.log('Record deleted');
```

**Features:**
- Invalidates cache
- No error if record doesn't exist

---

## Query Methods

### Get All Records

```javascript
// Get all records
const allRecords = await db.getAll('curriculum');
console.log(`Total records: ${allRecords.length}`);
```

### Pagination

```javascript
// Get records with pagination
const page1 = await db.getAll('curriculum', {
    limit: 10,
    offset: 0
});

const page2 = await db.getAll('curriculum', {
    limit: 10,
    offset: 10
});
```

### Sorting

```javascript
// Get records sorted by an index
const sortedByGrade = await db.getAll('curriculum', {
    orderBy: 'grade',
    direction: 'next' // 'next' for ascending, 'prev' for descending
});
```

### Query by Index

```javascript
// Exact match
const physics11 = await db.query('curriculum', 'subject_grade', {
    exact: ['Physics', 11]
});

// Range query
const grades9to12 = await db.query('curriculum', 'grade', {
    lower: 9,
    upper: 12,
    lowerOpen: false, // Include 9
    upperOpen: false  // Include 12
});

// Lower bound only
const grade10Plus = await db.query('curriculum', 'grade', {
    lower: 10
});

// With pagination
const results = await db.query('curriculum', 'subject', {
    exact: 'Mathematics'
}, {
    limit: 20,
    offset: 0
});
```

### Count Records

```javascript
// Count all records in a store
const total = await db.count('curriculum');

// Count with index filter
const physicsCount = await db.count('curriculum', 'subject', {
    exact: 'Physics'
});
```

### Clear Store

```javascript
// Delete all records from a store
await db.clear('curriculum');
console.log('All curriculum records deleted');
```

---

## Batch Operations

### Batch Create

Insert multiple records efficiently.

```javascript
const newChapters = [
    { subject: 'Physics', grade: 11, chapter: 'Ch1', content: '...' },
    { subject: 'Physics', grade: 11, chapter: 'Ch2', content: '...' },
    { subject: 'Physics', grade: 11, chapter: 'Ch3', content: '...' }
];

const ids = await db.batchCreate('curriculum', newChapters);
console.log(`Created ${ids.length} records`);
```

**Performance:** ~10x faster than individual creates for large batches.

### Batch Delete

Delete multiple records by their IDs.

```javascript
const idsToDelete = [1, 2, 3, 4, 5];
await db.batchDelete('curriculum', idsToDelete);
console.log(`Deleted ${idsToDelete.length} records`);
```

---

## Export & Import

### Export Data

Export entire database or specific stores to JSON.

```javascript
// Export entire database
const exportData = await db.exportData();
console.log('Exported data:', exportData);

// Export specific stores
const partialExport = await db.exportData(['curriculum', 'chunks']);

// Export as Blob
const blob = await db.exportData(null, { format: 'blob' });
```

### Export to File

Download database as JSON file.

```javascript
// Export and download
await db.exportToFile('my-backup.json');

// Export specific stores
await db.exportToFile('curriculum-only.json', ['curriculum']);
```

### Import Data

Import data from JSON export.

```javascript
const importData = { /* exported data */ };

// Import with default options
const result = await db.importData(importData);
console.log(`Imported ${result.recordsImported} records`);

// Import with clear first
await db.importData(importData, {
    clearBeforeImport: true,
    skipErrors: false
});

// Import with progress callback
await db.importData(importData, {
    onProgress: (progress) => {
        console.log(`${progress.storeName}: ${progress.current}/${progress.total}`);
    }
});
```

### Import from File

```javascript
// User selects file via <input type="file">
const fileInput = document.querySelector('#importFile');
const file = fileInput.files[0];

const result = await db.importFromFile(file, {
    clearBeforeImport: true
});

console.log(`Import successful: ${result.success}`);
console.log(`Records imported: ${result.recordsImported}`);
```

---

## Backup & Restore

### Create Backup

Create a backup snapshot of the database.

```javascript
// Create full backup
const backup = await db.createBackup('My Daily Backup');
console.log('Backup created with ID:', backup.id);
console.log('Backup size:', backup.size, 'bytes');

// Create partial backup (specific stores only)
await db.createBackup('Curriculum Only Backup', {
    includeAllStores: false,
    storeNames: ['curriculum', 'chunks']
});

// Create backup but don't save to IndexedDB
const backupData = await db.createBackup('Memory Only', {
    saveToIndexedDB: false,
    returnData: true
});
```

### List Backups

```javascript
const backups = await db.listBackups();

backups.forEach(backup => {
    console.log(`ID: ${backup.id}`);
    console.log(`Name: ${backup.name}`);
    console.log(`Date: ${backup.timestamp}`);
    console.log(`Type: ${backup.type}`);
    console.log(`Size: ${(backup.size / 1024 / 1024).toFixed(2)} MB`);
    console.log('---');
});
```

### Restore from Backup

```javascript
// Restore from backup ID
const result = await db.restoreFromBackup(123);
console.log('Restore successful:', result.success);

// Restore specific stores only
await db.restoreFromBackup(123, {
    specificStores: ['curriculum'],
    clearBeforeRestore: true,
    createBackupBeforeRestore: true // Safety backup
});

// Restore from backup data object
const backupData = { /* backup data */ };
await db.restoreFromBackup(backupData);
```

### Delete Backup

```javascript
await db.deleteBackup(123);
console.log('Backup deleted');
```

### Cleanup Old Backups

```javascript
// Keep only last 10 backups
const result = await db.cleanupBackups({
    keepCount: 10
});
console.log(`Deleted ${result.deleted} old backups`);

// Delete backups older than 30 days
await db.cleanupBackups({
    olderThanDays: 30
});
```

### Download Backup

```javascript
// Download backup as JSON file
await db.downloadBackup(123, 'my-backup.json');
```

---

## Migration System

### Register Migration

```javascript
// Register a new migration
db.registerMigration(4, async (database, transaction) => {
    console.log('Running migration to version 4...');

    // Add new index
    await db.addIndexToStore('curriculum', 'difficulty', 'difficulty');

    // Transform data
    await db.transformStoreData('curriculum', (record) => {
        record.difficulty = record.difficulty || 'medium';
        return record;
    });
}, {
    description: 'Add difficulty field to curriculum',
    reversible: true
});
```

### Run Migrations

```javascript
// Run all pending migrations
const result = await db.runMigrations();
console.log(`Ran ${result.migrationsRun} migrations`);

if (!result.success) {
    console.error('Migration errors:', result.errors);
}

// Run migrations up to specific version
await db.runMigrations(5);
```

### Migration History

```javascript
const history = await db.getMigrationHistory();

history.forEach(migration => {
    console.log(`Version ${migration.version}: ${migration.status}`);
    console.log(`Applied at: ${migration.timestamp}`);
});
```

### Rollback

```javascript
// Rollback to version 2
const result = await db.rollbackToVersion(2);
console.log('Rolled back to version:', result.version);
```

### Migration Helpers

```javascript
// Transform store data
await db.transformStoreData('curriculum', async (record) => {
    // Add new field
    record.tags = [];

    // Modify existing field
    record.grade = parseInt(record.grade);

    return record;
});

// Copy data between stores
await db.copyStoreData('oldStore', 'newStore', (record) => {
    // Transform during copy
    return {
        ...record,
        newField: 'value'
    };
});

// Rename store
await db.renameStore('oldName', 'newName');
```

---

## Testing & Validation

### Health Check

Run comprehensive database health check.

```javascript
const health = await db.healthCheck();

console.log('Status:', health.status); // 'healthy', 'warning', or 'critical'
console.log('Connection:', health.checks.connection);
console.log('Schema valid:', health.checks.schema.valid);
console.log('Storage used:', health.checks.storage.percentUsed + '%');

if (health.issues.length > 0) {
    console.error('Issues:', health.issues);
}

if (health.warnings.length > 0) {
    console.warn('Warnings:', health.warnings);
}
```

### Validate Schema

```javascript
const validation = await db.validateSchema();

console.log('Schema valid:', validation.valid);
console.log('Stores found:', validation.storeCount);
console.log('Indexes found:', validation.indexCount);

if (validation.errors.length > 0) {
    console.error('Errors:', validation.errors);
}

if (validation.warnings.length > 0) {
    console.warn('Warnings:', validation.warnings);
}
```

### Validate Records

```javascript
// Validate single record
const record = await db.read('curriculum', 123);
const validation = db.validateRecord('curriculum', record);

if (!validation.valid) {
    console.error('Validation errors:', validation.errors);
}

if (validation.warnings.length > 0) {
    console.warn('Warnings:', validation.warnings);
}

// Validate entire store
const results = await db.validateStore('curriculum');
console.log(`Valid: ${results.valid}/${results.total}`);
console.log(`Invalid: ${results.invalid}`);

// Validate with auto-fix
await db.validateStore('curriculum', {
    fix: true // Automatically fix missing timestamps
});
```

### Check Data Integrity

```javascript
const integrity = await db.checkDataIntegrity();

console.log('Data integrity:', integrity.valid ? 'OK' : 'ISSUES FOUND');
console.log('Checks run:', integrity.checksRun);

if (integrity.issues.length > 0) {
    console.error('Integrity issues:', integrity.issues);
}
```

### Performance Benchmark

```javascript
const benchmark = await db.runBenchmark({
    iterations: 100,
    storeName: 'curriculum'
});

console.log('Create avg:', benchmark.operations.create.avg.toFixed(2) + 'ms');
console.log('Read avg:', benchmark.operations.read.avg.toFixed(2) + 'ms');
console.log('Update avg:', benchmark.operations.update.avg.toFixed(2) + 'ms');
console.log('Delete avg:', benchmark.operations.delete.avg.toFixed(2) + 'ms');
console.log('Query total:', benchmark.operations.query.total.toFixed(2) + 'ms');
```

### Generate Statistics

```javascript
const stats = await db.generateStatisticsReport();

console.log('Database:', stats.database.name, 'v' + stats.database.version);
console.log('Total stores:', stats.totals.storeCount);
console.log('Total records:', stats.totals.recordCount);
console.log('Storage used:', stats.storage.usedMB + ' MB');
console.log('Cache hit rate:', (stats.cache.hitRate * 100).toFixed(2) + '%');

stats.stores.forEach(store => {
    console.log(`${store.name}: ${store.count} records`);
});
```

---

## Performance Monitoring

### Get Performance Metrics

```javascript
const metrics = db.getPerformanceMetrics();

console.log('Average query time:', metrics.avgQueryTime.toFixed(2) + 'ms');
console.log('Total queries:', metrics.totalQueries);
console.log('Cache hit rate:', (metrics.cacheStats.hitRate * 100).toFixed(2) + '%');

// Recent operations
metrics.operations.slice(-10).forEach(op => {
    console.log(`${op.operation} on ${op.storeName}: ${op.duration.toFixed(2)}ms`);
});
```

### Database Information

```javascript
const info = await db.getDatabaseInfo();

console.log('Database:', info.name);
console.log('Version:', info.version);

info.stores.forEach(store => {
    console.log(`Store: ${store.name}`);
    console.log(`  Records: ${store.count}`);
    console.log(`  Indexes: ${store.indexes.join(', ')}`);
});
```

---

## Cache Management

### Get Cache Statistics

```javascript
const cacheStats = db.getCacheStats();

console.log('Cache size:', cacheStats.size);
console.log('Cache hits:', cacheStats.hits);
console.log('Cache misses:', cacheStats.misses);
console.log('Hit rate:', (cacheStats.hitRate * 100).toFixed(2) + '%');
console.log('Evictions:', cacheStats.evictions);
```

### Clear Cache

```javascript
// Clear all cache
db.clearCache();

// Cache is automatically invalidated on write operations
await db.create('curriculum', { /* data */ }); // Invalidates curriculum cache
```

---

## Best Practices

### 1. Always Initialize First

```javascript
const db = new EduLLMDatabaseV3();
await db.initialize(); // Critical!

// Now safe to use
const records = await db.getAll('curriculum');
```

### 2. Use Batch Operations for Bulk Data

```javascript
// ❌ Slow
for (const record of manyRecords) {
    await db.create('curriculum', record);
}

// ✅ Fast
await db.batchCreate('curriculum', manyRecords);
```

### 3. Leverage Indexes for Queries

```javascript
// ❌ Slow - full table scan
const allRecords = await db.getAll('curriculum');
const filtered = allRecords.filter(r => r.subject === 'Physics');

// ✅ Fast - uses index
const physics = await db.query('curriculum', 'subject', {
    exact: 'Physics'
});
```

### 4. Enable Caching for Read-Heavy Workloads

```javascript
const db = new EduLLMDatabaseV3({
    enableCache: true,
    cacheTimeout: 10000 // 10 seconds
});
```

### 5. Regular Backups

```javascript
// Create daily backup
setInterval(async () => {
    await db.createBackup(`Auto backup ${new Date().toLocaleDateString()}`);
    await db.cleanupBackups({ keepCount: 10 });
}, 24 * 60 * 60 * 1000); // Daily
```

### 6. Monitor Health

```javascript
// Weekly health check
setInterval(async () => {
    const health = await db.healthCheck();

    if (health.status !== 'healthy') {
        console.error('Database health issues:', health.issues);
        // Alert admin, create backup, etc.
    }
}, 7 * 24 * 60 * 60 * 1000); // Weekly
```

### 7. Validate Before Import

```javascript
const importData = JSON.parse(jsonString);

// Validate format
if (!importData.metadata || !importData.stores) {
    throw new Error('Invalid import format');
}

// Import with error handling
const result = await db.importData(importData, {
    skipErrors: true,
    validateSchema: true
});

if (!result.success) {
    console.error('Import errors:', result.errors);
}
```

### 8. Use Transactions for Related Operations

```javascript
// Create curriculum with chunks in single transaction
const curriculumId = await db.create('curriculum', curriculumData);

const chunks = generateChunks(curriculumData.content);
await db.batchCreate('chunks', chunks.map(chunk => ({
    ...chunk,
    curriculumId
})));
```

---

## Complete Examples

### Example 1: Full CRUD Lifecycle

```javascript
// Initialize
const db = new EduLLMDatabaseV3();
await db.initialize();

// Create
const id = await db.create('curriculum', {
    subject: 'Mathematics',
    grade: 10,
    chapter: 'Algebra',
    content: 'Algebraic expressions and equations...',
    keyTopics: ['Variables', 'Equations', 'Functions'],
    learningObjectives: ['Solve linear equations']
});

console.log('Created with ID:', id);

// Read
const record = await db.read('curriculum', id);
console.log('Retrieved:', record.chapter);

// Update
record.keyTopics.push('Quadratic Equations');
await db.update('curriculum', record);
console.log('Updated');

// Delete
await db.delete('curriculum', id);
console.log('Deleted');
```

### Example 2: Advanced Querying

```javascript
// Get all Physics chapters for grade 11
const physics11 = await db.query('curriculum', 'subject_grade', {
    exact: ['Physics', 11]
});

console.log(`Found ${physics11.length} Physics chapters for grade 11`);

// Get chapters from grades 9-12
const allGrades = await db.query('curriculum', 'grade', {
    lower: 9,
    upper: 12
});

// Get with pagination
const page1 = await db.query('curriculum', 'subject', {
    exact: 'Mathematics'
}, {
    limit: 10,
    offset: 0
});

const page2 = await db.query('curriculum', 'subject', {
    exact: 'Mathematics'
}, {
    limit: 10,
    offset: 10
});
```

### Example 3: Backup & Restore Workflow

```javascript
// Create daily backup
async function createDailyBackup() {
    const date = new Date().toLocaleDateString();
    const backup = await db.createBackup(`Daily backup - ${date}`);

    console.log('Backup created:');
    console.log('  ID:', backup.id);
    console.log('  Size:', (backup.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('  Records:', backup.recordCount);

    // Cleanup old backups (keep last 7)
    await db.cleanupBackups({ keepCount: 7 });

    return backup;
}

// Restore from backup
async function restoreFromLatestBackup() {
    const backups = await db.listBackups();

    if (backups.length === 0) {
        console.error('No backups available');
        return;
    }

    const latest = backups[0]; // Most recent
    console.log('Restoring from:', latest.name);

    const result = await db.restoreFromBackup(latest.id);

    if (result.success) {
        console.log('Restore successful!');
        console.log('Stores restored:', result.storesImported);
        console.log('Records restored:', result.recordsImported);
    }
}
```

### Example 4: Migration Example

```javascript
// Define migration to version 4
db.registerMigration(4, async (database) => {
    console.log('Migrating to version 4...');

    // Add new index
    await db.addIndexToStore('curriculum', 'difficulty', 'difficulty', {
        unique: false
    });

    // Transform existing data
    await db.transformStoreData('curriculum', (record) => {
        // Add difficulty field based on grade
        if (!record.difficulty) {
            record.difficulty = record.grade >= 11 ? 'hard' : 'medium';
        }
        return record;
    });

    console.log('Migration complete!');
}, {
    description: 'Add difficulty level to curriculum',
    reversible: true
});

// Run migration
const result = await db.runMigrations(4);
console.log('Migration result:', result);
```

### Example 5: Health Monitoring Dashboard

```javascript
async function displayDatabaseHealth() {
    const health = await db.healthCheck();
    const stats = await db.generateStatisticsReport();

    console.log('=== Database Health Dashboard ===');
    console.log(`Status: ${health.status.toUpperCase()}`);
    console.log(`Time: ${new Date().toLocaleString()}`);
    console.log();

    console.log('Connection:', health.checks.connection ? '✓' : '✗');
    console.log('Schema:', health.checks.schema.valid ? '✓' : '✗');
    console.log();

    console.log('Storage:');
    console.log(`  Used: ${health.checks.storage.usedMB} MB`);
    console.log(`  Quota: ${health.checks.storage.quotaMB} MB`);
    console.log(`  Percent: ${health.checks.storage.percentUsed}%`);
    console.log();

    console.log('Performance:');
    console.log(`  Avg Query Time: ${health.checks.performance.avgQueryTime.toFixed(2)}ms`);
    console.log(`  Total Queries: ${health.checks.performance.totalQueries}`);
    console.log(`  Cache Hit Rate: ${(health.checks.performance.cacheHitRate * 100).toFixed(2)}%`);
    console.log();

    console.log('Stores:');
    stats.stores.forEach(store => {
        const storeHealth = health.checks.stores.find(s => s.name === store.name);
        console.log(`  ${store.name}: ${store.count} records [${storeHealth.status}]`);
    });
    console.log();

    if (health.issues.length > 0) {
        console.log('Issues:');
        health.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    if (health.warnings.length > 0) {
        console.log('Warnings:');
        health.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
}

// Run every hour
setInterval(displayDatabaseHealth, 60 * 60 * 1000);
```

### Example 6: Bulk Data Import

```javascript
async function importCurriculum(jsonFile) {
    const db = new EduLLMDatabaseV3();
    await db.initialize();

    // Create backup before import
    console.log('Creating safety backup...');
    await db.createBackup('Pre-import backup');

    // Read file
    const reader = new FileReader();
    reader.onload = async (e) => {
        const data = JSON.parse(e.target.result);

        console.log('Starting import...');
        console.log(`Importing ${data.metadata.totalRecords} records`);

        // Import with progress tracking
        const result = await db.importData(data, {
            clearBeforeImport: false,
            skipErrors: true,
            onProgress: (progress) => {
                console.log(`Importing ${progress.storeName}: ${progress.current}/${progress.total}`);
            }
        });

        console.log('Import complete!');
        console.log(`Success: ${result.success}`);
        console.log(`Stores imported: ${result.storesImported}`);
        console.log(`Records imported: ${result.recordsImported}`);

        if (result.errors.length > 0) {
            console.error('Errors:', result.errors);
        }

        // Validate imported data
        console.log('Validating imported data...');
        const validation = await db.validateStore('curriculum', {
            fix: true
        });

        console.log(`Validation: ${validation.valid}/${validation.total} valid`);
    };

    reader.readAsText(jsonFile);
}
```

---

## API Quick Reference

### CRUD
- `create(storeName, data)` - Insert record
- `read(storeName, key)` - Get record
- `update(storeName, data)` - Update record
- `delete(storeName, key)` - Delete record

### Query
- `getAll(storeName, options)` - Get all records
- `query(storeName, indexName, query, options)` - Query by index
- `count(storeName, indexName, query)` - Count records
- `clear(storeName)` - Delete all records

### Batch
- `batchCreate(storeName, records)` - Insert multiple
- `batchDelete(storeName, keys)` - Delete multiple

### Export/Import
- `exportData(storeNames, options)` - Export to JSON
- `exportToFile(filename, storeNames)` - Download JSON
- `importData(data, options)` - Import from JSON
- `importFromFile(file, options)` - Import from file

### Backup/Restore
- `createBackup(name, options)` - Create backup
- `listBackups()` - List all backups
- `restoreFromBackup(id, options)` - Restore backup
- `deleteBackup(id)` - Delete backup
- `cleanupBackups(options)` - Cleanup old backups
- `downloadBackup(id, filename)` - Download backup

### Migration
- `registerMigration(version, fn, options)` - Register migration
- `runMigrations(targetVersion)` - Run migrations
- `getMigrationHistory()` - Get history
- `rollbackToVersion(version)` - Rollback
- `validateSchema()` - Validate schema

### Testing
- `healthCheck()` - Full health check
- `checkDataIntegrity()` - Integrity check
- `validateRecord(storeName, record)` - Validate record
- `validateStore(storeName, options)` - Validate store
- `runBenchmark(options)` - Performance benchmark
- `generateStatisticsReport()` - Statistics report

### Performance
- `getPerformanceMetrics()` - Get metrics
- `getCacheStats()` - Cache statistics
- `clearCache()` - Clear cache
- `getDatabaseInfo()` - Database info

### Utilities
- `initialize()` - Initialize database
- `close()` - Close connection
- `deleteDatabase(dbName)` - Delete database (static)

---

## Support

For issues, questions, or contributions, please refer to the main project repository.

**Version:** 3.0
**Last Updated:** 2025-01-17
