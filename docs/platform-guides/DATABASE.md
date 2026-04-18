# EduLLM Platform Database System

## Overview

The EduLLM Platform uses **IndexedDB** for client-side database storage. This provides a robust, structured database solution that can handle large amounts of data efficiently.

## Database Architecture

### Database Name
- **Database**: `EduLLMPlatform`
- **Version**: 1

### Object Stores (Tables)

#### 1. **curriculum** - NCERT Curriculum Data
Stores all curriculum content including chapters, topics, and metadata.

**Schema:**
```javascript
{
  id: autoIncrement,
  subject: string,        // 'mathematics', 'physics', 'chemistry', 'biology'
  grade: number,          // 9, 10, 11, 12
  chapter: string,        // Chapter name
  content: string,        // Chapter content
  keyTopics: array,       // Key topics array
  learningObjectives: array,
  exercises: array,
  vocabulary: array,
  metadata: object,
  createdAt: ISOString,
  updatedAt: ISOString
}
```

**Indexes:**
- `subject` - Index on subject field
- `grade` - Index on grade field
- `chapter` - Index on chapter field
- `subject_grade` - Composite index on [subject, grade]

#### 2. **chunks** - Content Chunks
Stores processed content chunks for RAG retrieval.

**Schema:**
```javascript
{
  id: autoIncrement,
  subject: string,
  grade: number,
  chapter: string,
  chunkIndex: number,
  content: string,
  metadata: object,
  createdAt: ISOString
}
```

**Indexes:**
- `subject`, `grade`, `chapter`, `chunkIndex`
- `subject_grade_chapter` - Composite index

#### 3. **chatHistory** - Chat Messages
Stores all chat interactions and responses.

**Schema:**
```javascript
{
  id: autoIncrement,
  sessionId: string,
  type: string,           // 'user' or 'ai'
  content: string,
  response: string,       // AI response (for user messages)
  sources: array,
  subject: string,
  grade: number,
  filters: object,
  timestamp: ISOString,
  confidence: number
}
```

**Indexes:**
- `timestamp` - For chronological ordering
- `sessionId` - For session-based queries
- `subject`, `grade` - For filtering

#### 4. **interactions** - User Interactions
Tracks all user interactions for analytics.

**Schema:**
```javascript
{
  id: autoIncrement,
  type: string,           // 'click', 'search', 'upload', 'download', 'navigation'
  section: string,        // 'dashboard', 'rag', 'chunking', etc.
  action: string,         // Specific action name
  metadata: object,       // Additional data
  timestamp: ISOString
}
```

**Indexes:**
- `type` - Interaction type
- `timestamp` - For chronological ordering
- `section` - For section-based queries

#### 5. **uploadedFiles** - File Metadata
Stores metadata about uploaded PDF files.

**Schema:**
```javascript
{
  id: autoIncrement,
  fileName: string,
  fileSize: number,
  fileType: string,
  subject: string,
  grade: number,
  status: string,         // 'processing', 'processed', 'failed'
  chaptersFound: number,
  totalWords: number,
  processingTime: number,
  uploadDate: ISOString,
  metadata: object
}
```

**Indexes:**
- `fileName`, `subject`, `grade`, `uploadDate`, `status`

#### 6. **settings** - Platform Settings
Stores user and platform settings.

**Schema:**
```javascript
{
  key: string,            // Primary key
  value: any,            // Setting value (object, string, number, etc.)
  updatedAt: ISOString
}
```

#### 7. **statistics** - Platform Statistics
Stores aggregated statistics.

**Schema:**
```javascript
{
  key: 'current',        // Primary key
  documentsIndexed: number,
  queriesProcessed: number,
  accuracyRate: number,
  avgResponseTime: number,
  updatedAt: ISOString
}
```

#### 8. **searchIndex** - Search Index
Stores searchable keywords and their associations.

**Schema:**
```javascript
{
  id: autoIncrement,
  keyword: string,
  subject: string,
  grade: number,
  chapter: string,
  data: object,          // Associated data
  createdAt: ISOString
}
```

**Indexes:**
- `keyword`, `subject`, `grade`

#### 9. **knowledgeGraph** - Knowledge Graph Data
Stores concept relationships and graph data.

**Schema:**
```javascript
{
  id: autoIncrement,
  subject: string,
  chapter: string,
  concept: string,
  topics: array,
  connections: array,
  relatedConcepts: array,
  createdAt: ISOString
}
```

**Indexes:**
- `subject`, `chapter`, `concept`

## Usage Examples

### Initialize Database
```javascript
const database = new EduLLMDatabase();
await database.initialize();
```

### Save Curriculum Data
```javascript
const curriculumData = {
  mathematics: {
    10: {
      chapters: {
        'Real Numbers': { content: '...', keyTopics: [...] }
      }
    }
  }
};
await database.saveCurriculumData(curriculumData);
```

### Get Curriculum Data
```javascript
// Get all data
const allData = await database.getCurriculumData();

// Get by subject
const mathData = await database.getCurriculumData({ subject: 'mathematics' });

// Get by subject and grade
const math10Data = await database.getCurriculumData({ 
  subject: 'mathematics', 
  grade: 10 
});
```

### Save Chat Message
```javascript
await database.saveChatMessage({
  sessionId: 'session_123',
  type: 'user',
  content: 'What is a quadratic equation?',
  subject: 'mathematics',
  grade: 10
});
```

### Get Chat History
```javascript
// Get all chat history
const history = await database.getChatHistory();

// Get by session
const sessionHistory = await database.getChatHistory('session_123', 50);
```

### Log User Interaction
```javascript
await database.logInteraction({
  type: 'click',
  section: 'rag',
  action: 'filter_changed',
  metadata: { filter: 'subject', value: 'mathematics' }
});
```

### Save Settings
```javascript
await database.saveSetting('platformSettings', {
  primaryCurriculum: 'ncert',
  language: 'en',
  temperature: 0.7
});
```

### Get Settings
```javascript
const settings = await database.getSetting('platformSettings');
const allSettings = await database.getAllSettings();
```

### Update Statistics
```javascript
await database.updateStatistics({
  queriesProcessed: 3500,
  accuracyRate: 95.2
});
```

### Database Management
```javascript
// Get database size
const size = await database.getDatabaseSize();
console.log(`Usage: ${size.usagePercent}%`);

// Export database
const exportData = await database.exportDatabase();

// Import database
await database.importDatabase(exportData);

// Clear database
await database.clearDatabase();
```

## Integration with Platform

The database is automatically initialized when the platform starts:

```javascript
// In script.js
constructor() {
  this.database = new EduLLMDatabase();
  // ...
}

async init() {
  await this.database.initialize();
  // Load saved statistics
  const stats = await this.database.getStatistics();
  // ...
}
```

## Data Persistence

- **IndexedDB** provides persistent storage that survives browser restarts
- Data is stored locally in the browser
- No server required - fully client-side
- Can handle large datasets (hundreds of MB)

## Migration from localStorage

The database system includes automatic migration from localStorage:
- Settings are migrated from localStorage to database on first load
- Existing localStorage data is preserved for backward compatibility
- Gradual migration ensures no data loss

## Performance

- **Fast Queries**: IndexedDB uses indexes for fast lookups
- **Efficient Storage**: Structured storage reduces memory usage
- **Async Operations**: All operations are asynchronous and non-blocking
- **Batch Operations**: Multiple operations can be batched in transactions

## Browser Support

IndexedDB is supported in all modern browsers:
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Opera: Full support

## Best Practices

1. **Always initialize** the database before use
2. **Use transactions** for multiple related operations
3. **Handle errors** gracefully with try-catch blocks
4. **Index queries** for better performance
5. **Clean up** old data periodically to manage storage

## Future Enhancements

- Backend synchronization support
- Data encryption for sensitive information
- Advanced query capabilities
- Real-time data synchronization
- Multi-user support with user accounts

---

*Database System Version: 1.0*  
*Last Updated: January 2025*



