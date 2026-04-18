# EduLLM Database V3 - Quick Start Usage Guide

Practical examples and common use cases for the EduLLM Platform Database System.

## Quick Start

### 1. Basic Setup (5 minutes)

```javascript
// Step 1: Create database instance
const db = new EduLLMDatabaseV3();

// Step 2: Initialize
await db.initialize();

// Step 3: You're ready!
const count = await db.count('curriculum');
console.log(`Database has ${count} curriculum records`);
```

### 2. Your First CRUD Operations (10 minutes)

```javascript
// Create a new curriculum entry
const newChapter = {
    subject: 'Physics',
    grade: 11,
    chapter: 'Laws of Motion',
    content: 'Newton\'s laws explain motion...',
    keyTopics: ['Inertia', 'Force', 'Momentum'],
    learningObjectives: [
        'Understand Newton\'s three laws',
        'Calculate force and acceleration'
    ]
};

const chapterId = await db.create('curriculum', newChapter);
console.log('Created chapter with ID:', chapterId);

// Read it back
const chapter = await db.read('curriculum', chapterId);
console.log('Chapter title:', chapter.chapter);

// Update it
chapter.keyTopics.push('Action-Reaction');
await db.update('curriculum', chapter);
console.log('Updated!');

// Delete it
await db.delete('curriculum', chapterId);
console.log('Deleted!');
```

---

## Common Use Cases

### Use Case 1: Adding New Curriculum Content

**Scenario:** Teacher wants to add a new chapter with content chunks.

```javascript
async function addNewChapter(chapterData) {
    const db = new EduLLMDatabaseV3();
    await db.initialize();

    // 1. Create curriculum entry
    const curriculumId = await db.create('curriculum', {
        subject: chapterData.subject,
        grade: chapterData.grade,
        chapter: chapterData.title,
        content: chapterData.fullContent,
        keyTopics: chapterData.topics,
        learningObjectives: chapterData.objectives,
        vocabulary: chapterData.keywords
    });

    console.log(`Created curriculum entry: ${curriculumId}`);

    // 2. Split content into chunks
    const chunks = splitIntoChunks(chapterData.fullContent, 500);

    // 3. Create chunks in batch
    const chunkRecords = chunks.map((chunkText, index) => ({
        subject: chapterData.subject,
        grade: chapterData.grade,
        chapter: chapterData.title,
        content: chunkText,
        chunkIndex: index,
        metadata: {
            curriculumId,
            totalChunks: chunks.length
        }
    }));

    const chunkIds = await db.batchCreate('chunks', chunkRecords);
    console.log(`Created ${chunkIds.length} chunks`);

    // 4. Update statistics
    await db.update('statistics', {
        key: 'totalChapters',
        value: await db.count('curriculum')
    });

    return {
        curriculumId,
        chunkCount: chunkIds.length
    };
}

// Helper function
function splitIntoChunks(text, maxLength) {
    const words = text.split(' ');
    const chunks = [];
    let currentChunk = '';

    for (const word of words) {
        if ((currentChunk + word).length > maxLength && currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = word + ' ';
        } else {
            currentChunk += word + ' ';
        }
    }

    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
}
```

### Use Case 2: Student Query History

**Scenario:** Track and retrieve student's chat history.

```javascript
async function addChatMessage(sessionId, question, answer, metadata) {
    const db = new EduLLMDatabaseV3();
    await db.initialize();

    const messageId = await db.create('chatHistory', {
        sessionId,
        question,
        answer,
        timestamp: new Date().toISOString(),
        subject: metadata.subject,
        grade: metadata.grade,
        context: metadata.retrievedChunks,
        feedbackRating: null
    });

    return messageId;
}

async function getStudentHistory(sessionId, limit = 50) {
    const db = new EduLLMDatabaseV3();
    await db.initialize();

    const history = await db.query('chatHistory', 'sessionId', {
        exact: sessionId
    }, {
        limit,
        offset: 0
    });

    return history.sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
    );
}

async function searchChatHistory(searchTerm) {
    const db = new EduLLMDatabaseV3();
    await db.initialize();

    const allHistory = await db.getAll('chatHistory', { limit: 1000 });

    return allHistory.filter(msg =>
        msg.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
}
```

### Use Case 3: File Upload Processing

**Scenario:** Teacher uploads PDF, system processes and stores it.

```javascript
async function processUploadedFile(file, metadata) {
    const db = new EduLLMDatabaseV3();
    await db.initialize();

    // 1. Create upload record
    const uploadId = await db.create('uploadedFiles', {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        subject: metadata.subject,
        grade: metadata.grade,
        uploadDate: new Date().toISOString(),
        status: 'processing',
        processedChunks: 0,
        totalChunks: 0
    });

    try {
        // 2. Extract text from PDF
        const text = await extractTextFromPDF(file);

        // 3. Split into chunks
        const chunks = splitIntoChunks(text, 500);

        // 4. Update upload record
        await db.update('uploadedFiles', {
            id: uploadId,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            subject: metadata.subject,
            grade: metadata.grade,
            uploadDate: new Date().toISOString(),
            status: 'chunking',
            totalChunks: chunks.length
        });

        // 5. Store chunks
        const chunkRecords = chunks.map((chunk, index) => ({
            subject: metadata.subject,
            grade: metadata.grade,
            chapter: metadata.chapter || file.name,
            content: chunk,
            chunkIndex: index,
            metadata: {
                uploadId,
                fileName: file.name
            }
        }));

        await db.batchCreate('chunks', chunkRecords);

        // 6. Mark as complete
        await db.update('uploadedFiles', {
            id: uploadId,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            subject: metadata.subject,
            grade: metadata.grade,
            uploadDate: new Date().toISOString(),
            status: 'completed',
            processedChunks: chunks.length,
            totalChunks: chunks.length,
            completedDate: new Date().toISOString()
        });

        console.log(`Successfully processed ${file.name}: ${chunks.length} chunks`);

        return { uploadId, chunkCount: chunks.length };

    } catch (error) {
        // Mark as failed
        await db.update('uploadedFiles', {
            id: uploadId,
            fileName: file.name,
            status: 'failed',
            error: error.message
        });

        throw error;
    }
}

async function getUploadStatus(uploadId) {
    const db = new EduLLMDatabaseV3();
    await db.initialize();

    const upload = await db.read('uploadedFiles', uploadId);

    return {
        status: upload.status,
        progress: upload.totalChunks > 0
            ? (upload.processedChunks / upload.totalChunks) * 100
            : 0,
        fileName: upload.fileName,
        uploadDate: upload.uploadDate
    };
}
```

### Use Case 4: Analytics Dashboard

**Scenario:** Display real-time statistics on admin dashboard.

```javascript
async function getDashboardStatistics() {
    const db = new EduLLMDatabaseV3();
    await db.initialize();

    // Get comprehensive stats
    const stats = await db.generateStatisticsReport();

    // Get specific counts
    const documentsIndexed = await db.count('curriculum');
    const chunksCreated = await db.count('chunks');
    const queriesProcessed = await db.count('chatHistory');
    const uploadsCompleted = await db.count('uploadedFiles');

    // Get recent activity
    const recentChats = await db.getAll('chatHistory', {
        orderBy: 'timestamp',
        direction: 'prev',
        limit: 10
    });

    const recentUploads = await db.getAll('uploadedFiles', {
        orderBy: 'uploadDate',
        direction: 'prev',
        limit: 5
    });

    // Calculate accuracy (chats with positive feedback)
    const allChats = await db.getAll('chatHistory');
    const ratedChats = allChats.filter(chat => chat.feedbackRating !== null);
    const positiveChats = ratedChats.filter(chat => chat.feedbackRating >= 4);
    const accuracyRate = ratedChats.length > 0
        ? (positiveChats.length / ratedChats.length) * 100
        : 0;

    // Performance metrics
    const performanceMetrics = db.getPerformanceMetrics();

    return {
        counts: {
            documents: documentsIndexed,
            chunks: chunksCreated,
            queries: queriesProcessed,
            uploads: uploadsCompleted
        },
        accuracy: {
            rate: accuracyRate,
            totalRated: ratedChats.length,
            positive: positiveChats.length
        },
        recentActivity: {
            chats: recentChats,
            uploads: recentUploads
        },
        performance: {
            avgQueryTime: performanceMetrics.avgQueryTime,
            totalQueries: performanceMetrics.totalQueries,
            cacheHitRate: performanceMetrics.cacheStats.hitRate
        },
        storage: stats.storage
    };
}

// Update dashboard every 10 seconds
async function startDashboardAutoRefresh(updateCallback) {
    setInterval(async () => {
        const stats = await getDashboardStatistics();
        updateCallback(stats);
    }, 10000);
}
```

### Use Case 5: Scheduled Backups

**Scenario:** Automatically backup database daily and cleanup old backups.

```javascript
class DatabaseBackupManager {
    constructor(db) {
        this.db = db;
        this.isRunning = false;
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;

        // Create initial backup
        await this.createBackup();

        // Schedule daily backups at 2 AM
        const now = new Date();
        const nextBackup = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1,
            2, 0, 0
        );

        const msUntilBackup = nextBackup - now;

        setTimeout(() => {
            this.createBackup();
            // Then every 24 hours
            setInterval(() => this.createBackup(), 24 * 60 * 60 * 1000);
        }, msUntilBackup);

        console.log('Backup manager started');
        console.log('Next backup at:', nextBackup.toLocaleString());
    }

    async createBackup() {
        try {
            const date = new Date();
            const backupName = `Auto Backup - ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

            console.log('Creating backup:', backupName);

            const backup = await this.db.createBackup(backupName, {
                saveToIndexedDB: true
            });

            console.log('Backup created successfully:');
            console.log('  ID:', backup.id);
            console.log('  Size:', (backup.size / 1024 / 1024).toFixed(2), 'MB');
            console.log('  Records:', backup.recordCount);

            // Cleanup old backups (keep last 30)
            const cleanup = await this.db.cleanupBackups({
                keepCount: 30
            });

            if (cleanup.deleted > 0) {
                console.log(`Cleaned up ${cleanup.deleted} old backups`);
            }

            // Download weekly backups
            if (date.getDay() === 0) { // Sunday
                await this.db.downloadBackup(backup.id);
                console.log('Weekly backup downloaded');
            }

        } catch (error) {
            console.error('Backup failed:', error);
            // Could send notification to admin here
        }
    }

    stop() {
        this.isRunning = false;
        console.log('Backup manager stopped');
    }
}

// Usage
const db = new EduLLMDatabaseV3();
await db.initialize();

const backupManager = new DatabaseBackupManager(db);
backupManager.start();
```

### Use Case 6: Data Export for Reports

**Scenario:** Export specific data for external analysis.

```javascript
async function exportCurriculumReport(subject, grade) {
    const db = new EduLLMDatabaseV3();
    await db.initialize();

    // Get curriculum data
    const curriculum = await db.query('curriculum', 'subject_grade', {
        exact: [subject, grade]
    });

    // Get related chunks
    const chunks = await db.query('chunks', 'subject_grade_chapter', {
        lower: [subject, grade],
        upper: [subject, grade]
    });

    // Get usage statistics
    const chats = await db.query('chatHistory', 'subject', {
        exact: subject
    });

    // Prepare export data
    const report = {
        metadata: {
            subject,
            grade,
            generatedAt: new Date().toISOString(),
            generatedBy: 'EduLLM Platform'
        },
        summary: {
            totalChapters: curriculum.length,
            totalChunks: chunks.length,
            totalQueries: chats.length
        },
        curriculum: curriculum.map(c => ({
            chapter: c.chapter,
            topics: c.keyTopics,
            objectives: c.learningObjectives,
            chunkCount: chunks.filter(ch => ch.chapter === c.chapter).length
        })),
        usage: {
            queriesByChapter: getQueriesByChapter(chats),
            topQuestions: getTopQuestions(chats, 10)
        }
    };

    // Download as JSON
    const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `curriculum-report-${subject}-grade${grade}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return report;
}

function getQueriesByChapter(chats) {
    const byChapter = {};
    chats.forEach(chat => {
        if (chat.context && chat.context.chapter) {
            byChapter[chat.context.chapter] = (byChapter[chat.context.chapter] || 0) + 1;
        }
    });
    return byChapter;
}

function getTopQuestions(chats, limit) {
    return chats
        .sort((a, b) => (b.feedbackRating || 0) - (a.feedbackRating || 0))
        .slice(0, limit)
        .map(chat => ({
            question: chat.question,
            answer: chat.answer,
            rating: chat.feedbackRating
        }));
}
```

### Use Case 7: Database Health Monitoring

**Scenario:** Monitor database health and alert on issues.

```javascript
class DatabaseHealthMonitor {
    constructor(db, alertCallback) {
        this.db = db;
        this.alertCallback = alertCallback;
        this.checkInterval = null;
    }

    async start(intervalMinutes = 60) {
        // Initial check
        await this.performHealthCheck();

        // Schedule regular checks
        this.checkInterval = setInterval(
            () => this.performHealthCheck(),
            intervalMinutes * 60 * 1000
        );

        console.log(`Health monitoring started (every ${intervalMinutes} minutes)`);
    }

    async performHealthCheck() {
        console.log('Running health check...');

        const health = await this.db.healthCheck();
        const stats = await this.db.generateStatisticsReport();

        // Check for critical issues
        if (health.status === 'critical') {
            this.alertCallback({
                severity: 'critical',
                message: 'Database has critical issues',
                issues: health.issues,
                timestamp: new Date()
            });
        }

        // Check storage usage
        if (parseFloat(health.checks.storage.percentUsed) > 80) {
            this.alertCallback({
                severity: 'warning',
                message: `Storage usage at ${health.checks.storage.percentUsed}%`,
                timestamp: new Date()
            });
        }

        // Check performance
        if (health.checks.performance.avgQueryTime > 100) {
            this.alertCallback({
                severity: 'warning',
                message: `Average query time: ${health.checks.performance.avgQueryTime.toFixed(2)}ms`,
                recommendation: 'Consider clearing cache or optimizing queries',
                timestamp: new Date()
            });
        }

        // Check data integrity
        if (!health.checks.integrity.valid) {
            this.alertCallback({
                severity: 'warning',
                message: 'Data integrity issues detected',
                issues: health.checks.integrity.issues,
                timestamp: new Date()
            });
        }

        // Log healthy status
        if (health.status === 'healthy') {
            console.log('✓ Database health: OK');
            console.log(`  Storage: ${health.checks.storage.percentUsed}%`);
            console.log(`  Avg query time: ${health.checks.performance.avgQueryTime.toFixed(2)}ms`);
            console.log(`  Total records: ${stats.totals.recordCount}`);
        }

        return health;
    }

    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log('Health monitoring stopped');
        }
    }
}

// Usage
const db = new EduLLMDatabaseV3();
await db.initialize();

const monitor = new DatabaseHealthMonitor(db, (alert) => {
    console.error(`[${alert.severity.toUpperCase()}] ${alert.message}`);

    // Could send email, push notification, etc.
    if (alert.severity === 'critical') {
        sendAdminNotification(alert);
    }
});

monitor.start(60); // Check every hour
```

---

## Integration Examples

### Integration with React

```javascript
// DatabaseContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';

const DatabaseContext = createContext(null);

export function DatabaseProvider({ children }) {
    const [db, setDb] = useState(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        async function initDb() {
            const database = new EduLLMDatabaseV3();
            await database.initialize();
            setDb(database);
            setIsReady(true);
        }
        initDb();
    }, []);

    return (
        <DatabaseContext.Provider value={{ db, isReady }}>
            {children}
        </DatabaseContext.Provider>
    );
}

export function useDatabase() {
    const context = useContext(DatabaseContext);
    if (!context) {
        throw new Error('useDatabase must be used within DatabaseProvider');
    }
    return context;
}

// Component usage
function CurriculumList() {
    const { db, isReady } = useDatabase();
    const [curriculum, setCurriculum] = useState([]);

    useEffect(() => {
        if (!isReady) return;

        async function loadCurriculum() {
            const data = await db.getAll('curriculum', { limit: 50 });
            setCurriculum(data);
        }

        loadCurriculum();
    }, [db, isReady]);

    if (!isReady) return <div>Loading database...</div>;

    return (
        <ul>
            {curriculum.map(item => (
                <li key={item.id}>{item.chapter}</li>
            ))}
        </ul>
    );
}
```

### Integration with Express.js (for IndexedDB alternative)

While IndexedDB is browser-only, the same patterns can be adapted for server-side databases.

```javascript
// database-service.js
class DatabaseService {
    constructor() {
        this.db = null;
    }

    async initialize() {
        if (this.db) return this.db;

        this.db = new EduLLMDatabaseV3();
        await this.db.initialize();

        return this.db;
    }

    async getCurriculum(subject, grade) {
        await this.initialize();
        return this.db.query('curriculum', 'subject_grade', {
            exact: [subject, grade]
        });
    }

    async addChatHistory(sessionId, question, answer, metadata) {
        await this.initialize();
        return this.db.create('chatHistory', {
            sessionId,
            question,
            answer,
            timestamp: new Date().toISOString(),
            ...metadata
        });
    }
}

module.exports = new DatabaseService();
```

---

## Troubleshooting

### Issue: Database not initializing

```javascript
// Check if IndexedDB is supported
if (!window.indexedDB) {
    console.error('IndexedDB not supported in this browser');
}

// Check for quota errors
try {
    await db.initialize();
} catch (error) {
    if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded');
        // Cleanup old data or request persistent storage
        await navigator.storage.persist();
    }
}
```

### Issue: Slow queries

```javascript
// Run performance benchmark
const benchmark = await db.runBenchmark();
console.log('Query performance:', benchmark.operations.query);

// Check if indexes are being used
const validation = await db.validateSchema();
console.log('Missing indexes:', validation.warnings);

// Clear cache to reset
db.clearCache();
```

### Issue: Data integrity problems

```javascript
// Run integrity check
const integrity = await db.checkDataIntegrity();

if (!integrity.valid) {
    console.error('Integrity issues:', integrity.issues);

    // Fix orphaned records
    // Manually clean up based on issues
}

// Validate and fix timestamps
await db.validateStore('curriculum', { fix: true });
```

---

## Next Steps

1. Review the [Database Schema Documentation](./DATABASE_SCHEMA.md)
2. Explore the [Complete API Reference](./DATABASE_API.md)
3. Implement backups and monitoring
4. Optimize queries using indexes
5. Set up automated health checks

**Happy coding!**
