// EduLLM Platform Database System - Enhanced Version
// Uses IndexedDB for client-side storage with structured data management
// Version 2: Added experiments, analytics, migrations, and performance optimizations

class EduLLMDatabase {
    constructor() {
        this.dbName = 'EduLLMPlatform';
        this.version = 2; // Upgraded for new features
        this.db = null;
        this.isInitialized = false;
        this.cache = new Map(); // In-memory cache for performance
        this.cacheTimeout = 5000; // 5 seconds cache TTL
        this.migrations = this.setupMigrations();
    }

    // Setup migration handlers
    setupMigrations() {
        return {
            1: (db, transaction) => {
                // Version 1: Initial schema (already exists)
                console.log('✅ Version 1 schema already applied');
            },
            2: (db, transaction) => {
                // Version 2: Add new object stores for experiments and analytics
                this.migrateToVersion2(db, transaction);
            }
        };
    }

    // Initialize database
    async initialize() {
        if (this.isInitialized) {
            return this.db;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Database initialization failed:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                console.log(`✅ Database initialized successfully (v${this.version})`);
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const transaction = event.target.transaction;
                const oldVersion = event.oldVersion;

                console.log(`📊 Upgrading database from v${oldVersion} to v${this.version}`);

                // Create initial schema if new database
                if (oldVersion === 0) {
                    this.createObjectStores(db);
                }

                // Apply migrations sequentially
                for (let v = oldVersion + 1; v <= this.version; v++) {
                    if (this.migrations[v]) {
                        console.log(`🔄 Applying migration v${v}...`);
                        this.migrations[v](db, transaction);
                    }
                }

                console.log('✅ Database schema upgrade complete');
            };
        });
    }

    // Create object stores (tables)
    createObjectStores(db) {
        // NCERT Curriculum Data Store
        if (!db.objectStoreNames.contains('curriculum')) {
            const curriculumStore = db.createObjectStore('curriculum', { keyPath: 'id', autoIncrement: true });
            curriculumStore.createIndex('subject', 'subject', { unique: false });
            curriculumStore.createIndex('grade', 'grade', { unique: false });
            curriculumStore.createIndex('chapter', 'chapter', { unique: false });
            curriculumStore.createIndex('subject_grade', ['subject', 'grade'], { unique: false });
        }

        // Content Chunks Store
        if (!db.objectStoreNames.contains('chunks')) {
            const chunksStore = db.createObjectStore('chunks', { keyPath: 'id', autoIncrement: true });
            chunksStore.createIndex('subject', 'subject', { unique: false });
            chunksStore.createIndex('grade', 'grade', { unique: false });
            chunksStore.createIndex('chapter', 'chapter', { unique: false });
            chunksStore.createIndex('chunkIndex', 'chunkIndex', { unique: false });
            chunksStore.createIndex('subject_grade_chapter', ['subject', 'grade', 'chapter'], { unique: false });
        }

        // Chat History Store
        if (!db.objectStoreNames.contains('chatHistory')) {
            const chatStore = db.createObjectStore('chatHistory', { keyPath: 'id', autoIncrement: true });
            chatStore.createIndex('timestamp', 'timestamp', { unique: false });
            chatStore.createIndex('sessionId', 'sessionId', { unique: false });
            chatStore.createIndex('subject', 'subject', { unique: false });
            chatStore.createIndex('grade', 'grade', { unique: false });
        }

        // User Interactions Store
        if (!db.objectStoreNames.contains('interactions')) {
            const interactionsStore = db.createObjectStore('interactions', { keyPath: 'id', autoIncrement: true });
            interactionsStore.createIndex('type', 'type', { unique: false });
            interactionsStore.createIndex('timestamp', 'timestamp', { unique: false });
            interactionsStore.createIndex('section', 'section', { unique: false });
        }

        // Uploaded Files Store
        if (!db.objectStoreNames.contains('uploadedFiles')) {
            const filesStore = db.createObjectStore('uploadedFiles', { keyPath: 'id', autoIncrement: true });
            filesStore.createIndex('fileName', 'fileName', { unique: false });
            filesStore.createIndex('subject', 'subject', { unique: false });
            filesStore.createIndex('grade', 'grade', { unique: false });
            filesStore.createIndex('uploadDate', 'uploadDate', { unique: false });
            filesStore.createIndex('status', 'status', { unique: false });
        }

        // Settings Store
        if (!db.objectStoreNames.contains('settings')) {
            const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Statistics Store
        if (!db.objectStoreNames.contains('statistics')) {
            const statsStore = db.createObjectStore('statistics', { keyPath: 'key' });
        }

        // Search Index Store
        if (!db.objectStoreNames.contains('searchIndex')) {
            const searchStore = db.createObjectStore('searchIndex', { keyPath: 'id', autoIncrement: true });
            searchStore.createIndex('keyword', 'keyword', { unique: false });
            searchStore.createIndex('subject', 'subject', { unique: false });
            searchStore.createIndex('grade', 'grade', { unique: false });
        }

        // Knowledge Graph Store
        if (!db.objectStoreNames.contains('knowledgeGraph')) {
            const graphStore = db.createObjectStore('knowledgeGraph', { keyPath: 'id', autoIncrement: true });
            graphStore.createIndex('subject', 'subject', { unique: false });
            graphStore.createIndex('chapter', 'chapter', { unique: false });
            graphStore.createIndex('concept', 'concept', { unique: false });
        }
    }

    // Migration to Version 2: Add new object stores
    migrateToVersion2(db, transaction) {
        // Experiments Store - for experiment definitions
        if (!db.objectStoreNames.contains('experiments')) {
            const experimentsStore = db.createObjectStore('experiments', { keyPath: 'id', autoIncrement: true });
            experimentsStore.createIndex('name', 'name', { unique: false });
            experimentsStore.createIndex('status', 'status', { unique: false });
            experimentsStore.createIndex('createdAt', 'createdAt', { unique: false });
            experimentsStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
            console.log('✅ Created experiments store');
        }

        // Experiment Runs Store - for experiment execution results
        if (!db.objectStoreNames.contains('experimentRuns')) {
            const runsStore = db.createObjectStore('experimentRuns', { keyPath: 'id', autoIncrement: true });
            runsStore.createIndex('experimentId', 'experimentId', { unique: false });
            runsStore.createIndex('timestamp', 'timestamp', { unique: false });
            runsStore.createIndex('status', 'status', { unique: false });
            runsStore.createIndex('experiment_timestamp', ['experimentId', 'timestamp'], { unique: false });
            console.log('✅ Created experimentRuns store');
        }

        // Analytics Store - for analytics reports and data
        if (!db.objectStoreNames.contains('analytics')) {
            const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id', autoIncrement: true });
            analyticsStore.createIndex('type', 'type', { unique: false });
            analyticsStore.createIndex('timestamp', 'timestamp', { unique: false });
            analyticsStore.createIndex('experimentId', 'experimentId', { unique: false });
            analyticsStore.createIndex('type_timestamp', ['type', 'timestamp'], { unique: false });
            console.log('✅ Created analytics store');
        }

        // Baselines Store - for baseline comparisons
        if (!db.objectStoreNames.contains('baselines')) {
            const baselinesStore = db.createObjectStore('baselines', { keyPath: 'id', autoIncrement: true });
            baselinesStore.createIndex('name', 'name', { unique: false });
            baselinesStore.createIndex('category', 'category', { unique: false });
            baselinesStore.createIndex('createdAt', 'createdAt', { unique: false });
            console.log('✅ Created baselines store');
        }

        // A/B Tests Store - for A/B testing data
        if (!db.objectStoreNames.contains('abTests')) {
            const abTestsStore = db.createObjectStore('abTests', { keyPath: 'id', autoIncrement: true });
            abTestsStore.createIndex('name', 'name', { unique: false });
            abTestsStore.createIndex('status', 'status', { unique: false });
            abTestsStore.createIndex('startDate', 'startDate', { unique: false });
            abTestsStore.createIndex('endDate', 'endDate', { unique: false });
            console.log('✅ Created abTests store');
        }

        // Embeddings Store - for vector storage and semantic search
        if (!db.objectStoreNames.contains('embeddings')) {
            const embeddingsStore = db.createObjectStore('embeddings', { keyPath: 'id', autoIncrement: true });
            embeddingsStore.createIndex('chunkId', 'chunkId', { unique: false });
            embeddingsStore.createIndex('subject', 'subject', { unique: false });
            embeddingsStore.createIndex('grade', 'grade', { unique: false });
            embeddingsStore.createIndex('modelVersion', 'modelVersion', { unique: false });
            embeddingsStore.createIndex('chunk_model', ['chunkId', 'modelVersion'], { unique: true });
            console.log('✅ Created embeddings store');
        }

        // Cache Store - for performance optimization
        if (!db.objectStoreNames.contains('cache')) {
            const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
            cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
            cacheStore.createIndex('category', 'category', { unique: false });
            console.log('✅ Created cache store');
        }

        // Backups Metadata Store - for backup tracking
        if (!db.objectStoreNames.contains('backups')) {
            const backupsStore = db.createObjectStore('backups', { keyPath: 'id', autoIncrement: true });
            backupsStore.createIndex('timestamp', 'timestamp', { unique: false });
            backupsStore.createIndex('type', 'type', { unique: false });
            console.log('✅ Created backups store');
        }

        console.log('✅ Version 2 migration complete - All new stores created');
    }

    // ========== CURRICULUM DATA OPERATIONS ==========

    async saveCurriculumData(curriculumData) {
        await this.initialize();
        const transaction = this.db.transaction(['curriculum'], 'readwrite');
        const store = transaction.objectStore('curriculum');

        // Clear existing data
        await store.clear();

        // Save new data
        const promises = [];
        for (const [subject, grades] of Object.entries(curriculumData)) {
            for (const [grade, gradeData] of Object.entries(grades)) {
                for (const [chapterName, chapterData] of Object.entries(gradeData.chapters || {})) {
                    const data = {
                        subject,
                        grade: parseInt(grade),
                        chapter: chapterName,
                        content: chapterData.content,
                        keyTopics: chapterData.keyTopics || [],
                        learningObjectives: chapterData.learningObjectives || [],
                        exercises: chapterData.exercises || [],
                        vocabulary: chapterData.vocabulary || [],
                        metadata: gradeData.metadata || {},
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    promises.push(store.add(data));
                }
            }
        }

        await Promise.all(promises);
        console.log('✅ Curriculum data saved to database');
        return true;
    }

    async getCurriculumData(filters = {}) {
        await this.initialize();
        const transaction = this.db.transaction(['curriculum'], 'readonly');
        const store = transaction.objectStore('curriculum');

        return new Promise((resolve, reject) => {
            const results = [];
            let request;

            if (filters.subject && filters.grade) {
                const index = store.index('subject_grade');
                request = index.openCursor(IDBKeyRange.only([filters.subject, filters.grade]));
            } else if (filters.subject) {
                const index = store.index('subject');
                request = index.openCursor(IDBKeyRange.only(filters.subject));
            } else if (filters.grade) {
                const index = store.index('grade');
                request = index.openCursor(IDBKeyRange.only(filters.grade));
            } else {
                request = store.openCursor();
            }

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    async getChapterContent(subject, grade, chapter) {
        await this.initialize();
        const transaction = this.db.transaction(['curriculum'], 'readonly');
        const store = transaction.objectStore('curriculum');
        const index = store.index('subject_grade_chapter');

        return new Promise((resolve, reject) => {
            const request = index.get([subject, grade, chapter]);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // ========== CHUNKS OPERATIONS ==========

    async saveChunks(chunks) {
        await this.initialize();
        const transaction = this.db.transaction(['chunks'], 'readwrite');
        const store = transaction.objectStore('chunks');

        // Clear existing chunks
        await store.clear();

        // Save new chunks
        const promises = chunks.map(chunk => store.add({
            ...chunk,
            createdAt: new Date().toISOString()
        }));

        await Promise.all(promises);
        console.log(`✅ Saved ${chunks.length} chunks to database`);
        return true;
    }

    async getChunks(filters = {}) {
        await this.initialize();
        const transaction = this.db.transaction(['chunks'], 'readonly');
        const store = transaction.objectStore('chunks');

        return new Promise((resolve, reject) => {
            const results = [];
            let request;

            if (filters.subject && filters.grade && filters.chapter) {
                const index = store.index('subject_grade_chapter');
                request = index.openCursor(IDBKeyRange.only([filters.subject, filters.grade, filters.chapter]));
            } else if (filters.subject && filters.grade) {
                const index = store.index('subject_grade_chapter');
                request = index.openKeyCursor();
            } else {
                request = store.openCursor();
            }

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const value = cursor.value;
                    if (!filters.subject || value.subject === filters.subject) {
                        if (!filters.grade || value.grade === filters.grade) {
                            if (!filters.chapter || value.chapter === filters.chapter) {
                                results.push(value);
                            }
                        }
                    }
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // ========== CHAT HISTORY OPERATIONS ==========

    async saveChatMessage(message) {
        await this.initialize();
        const transaction = this.db.transaction(['chatHistory'], 'readwrite');
        const store = transaction.objectStore('chatHistory');

        const chatData = {
            sessionId: message.sessionId || this.generateSessionId(),
            type: message.type || 'user',
            content: message.content,
            response: message.response || null,
            sources: message.sources || [],
            subject: message.subject || null,
            grade: message.grade || null,
            filters: message.filters || {},
            timestamp: new Date().toISOString(),
            confidence: message.confidence || null
        };

        return new Promise((resolve, reject) => {
            const request = store.add(chatData);
            request.onsuccess = () => {
                console.log('✅ Chat message saved');
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getChatHistory(sessionId = null, limit = 50) {
        await this.initialize();
        const transaction = this.db.transaction(['chatHistory'], 'readonly');
        const store = transaction.objectStore('chatHistory');
        const index = store.index('timestamp');

        return new Promise((resolve, reject) => {
            const results = [];
            const request = index.openCursor(null, 'prev'); // Get latest first

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && results.length < limit) {
                    const value = cursor.value;
                    if (!sessionId || value.sessionId === sessionId) {
                        results.push(value);
                    }
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    async clearChatHistory(sessionId = null) {
        await this.initialize();
        const transaction = this.db.transaction(['chatHistory'], 'readwrite');
        const store = transaction.objectStore('chatHistory');

        if (sessionId) {
            const index = store.index('sessionId');
            return new Promise((resolve, reject) => {
                const request = index.openCursor(IDBKeyRange.only(sessionId));
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        cursor.delete();
                        cursor.continue();
                    } else {
                        resolve();
                    }
                };
                request.onerror = () => reject(request.error);
            });
        } else {
            return store.clear();
        }
    }

    // ========== USER INTERACTIONS OPERATIONS ==========

    async logInteraction(interaction) {
        await this.initialize();
        const transaction = this.db.transaction(['interactions'], 'readwrite');
        const store = transaction.objectStore('interactions');

        const interactionData = {
            type: interaction.type, // 'click', 'search', 'upload', 'download', etc.
            section: interaction.section,
            action: interaction.action,
            metadata: interaction.metadata || {},
            timestamp: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.add(interactionData);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getInteractions(filters = {}) {
        await this.initialize();
        const transaction = this.db.transaction(['interactions'], 'readonly');
        const store = transaction.objectStore('interactions');

        return new Promise((resolve, reject) => {
            const results = [];
            let request;

            if (filters.type) {
                const index = store.index('type');
                request = index.openCursor(IDBKeyRange.only(filters.type));
            } else if (filters.section) {
                const index = store.index('section');
                request = index.openCursor(IDBKeyRange.only(filters.section));
            } else {
                request = store.openCursor(null, 'prev');
            }

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // ========== UPLOADED FILES OPERATIONS ==========

    async saveUploadedFile(fileData) {
        await this.initialize();
        const transaction = this.db.transaction(['uploadedFiles'], 'readwrite');
        const store = transaction.objectStore('uploadedFiles');

        const fileRecord = {
            fileName: fileData.fileName,
            fileSize: fileData.fileSize,
            fileType: fileData.fileType,
            subject: fileData.subject || null,
            grade: fileData.grade || null,
            status: fileData.status || 'processed', // 'processing', 'processed', 'failed'
            chaptersFound: fileData.chaptersFound || 0,
            totalWords: fileData.totalWords || 0,
            processingTime: fileData.processingTime || 0,
            uploadDate: new Date().toISOString(),
            metadata: fileData.metadata || {}
        };

        return new Promise((resolve, reject) => {
            const request = store.add(fileRecord);
            request.onsuccess = () => {
                console.log('✅ File record saved');
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getUploadedFiles(filters = {}) {
        await this.initialize();
        const transaction = this.db.transaction(['uploadedFiles'], 'readonly');
        const store = transaction.objectStore('uploadedFiles');

        return new Promise((resolve, reject) => {
            const results = [];
            let request;

            if (filters.subject) {
                const index = store.index('subject');
                request = index.openCursor(IDBKeyRange.only(filters.subject));
            } else if (filters.status) {
                const index = store.index('status');
                request = index.openCursor(IDBKeyRange.only(filters.status));
            } else {
                request = store.openCursor(null, 'prev');
            }

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const value = cursor.value;
                    if (!filters.grade || value.grade === filters.grade) {
                        results.push(value);
                    }
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // ========== SETTINGS OPERATIONS ==========

    async saveSetting(key, value) {
        await this.initialize();
        const transaction = this.db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');

        const setting = {
            key,
            value,
            updatedAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.put(setting);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getSetting(key) {
        await this.initialize();
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');

        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result ? request.result.value : null);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllSettings() {
        await this.initialize();
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');

        return new Promise((resolve, reject) => {
            const results = {};
            const request = store.openCursor();

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    results[cursor.value.key] = cursor.value.value;
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // ========== STATISTICS OPERATIONS ==========

    async saveStatistics(stats) {
        await this.initialize();
        const transaction = this.db.transaction(['statistics'], 'readwrite');
        const store = transaction.objectStore('statistics');

        const statsData = {
            key: 'current',
            ...stats,
            updatedAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.put(statsData);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getStatistics() {
        await this.initialize();
        const transaction = this.db.transaction(['statistics'], 'readonly');
        const store = transaction.objectStore('statistics');

        return new Promise((resolve, reject) => {
            const request = store.get('current');
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? {
                    documentsIndexed: result.documentsIndexed || 0,
                    queriesProcessed: result.queriesProcessed || 0,
                    accuracyRate: result.accuracyRate || 0,
                    avgResponseTime: result.avgResponseTime || 0
                } : null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async updateStatistics(updates) {
        const current = await this.getStatistics();
        const updated = { ...current, ...updates };
        await this.saveStatistics(updated);
        return updated;
    }

    // ========== SEARCH INDEX OPERATIONS ==========

    async saveSearchIndex(indexData) {
        await this.initialize();
        const transaction = this.db.transaction(['searchIndex'], 'readwrite');
        const store = transaction.objectStore('searchIndex');

        // Clear existing index
        await store.clear();

        // Save new index entries
        const promises = Object.entries(indexData).map(([key, data]) => {
            return store.add({
                keyword: key,
                ...data,
                createdAt: new Date().toISOString()
            });
        });

        await Promise.all(promises);
        console.log('✅ Search index saved to database');
        return true;
    }

    async searchIndex(query, filters = {}) {
        await this.initialize();
        const transaction = this.db.transaction(['searchIndex'], 'readonly');
        const store = transaction.objectStore('searchIndex');
        const index = store.index('keyword');

        const queryLower = query.toLowerCase();
        const results = [];

        return new Promise((resolve, reject) => {
            const request = index.openCursor();

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const keyword = cursor.value.keyword.toLowerCase();
                    if (keyword.includes(queryLower) || queryLower.includes(keyword)) {
                        if (!filters.subject || cursor.value.subject === filters.subject) {
                            if (!filters.grade || cursor.value.grade === filters.grade) {
                                results.push(cursor.value);
                            }
                        }
                    }
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // ========== KNOWLEDGE GRAPH OPERATIONS ==========

    async saveKnowledgeGraph(graphData) {
        await this.initialize();
        const transaction = this.db.transaction(['knowledgeGraph'], 'readwrite');
        const store = transaction.objectStore('knowledgeGraph');

        // Clear existing graph
        await store.clear();

        // Save graph nodes and connections
        const promises = [];
        for (const [subject, chapters] of Object.entries(graphData)) {
            for (const [chapter, data] of Object.entries(chapters)) {
                promises.push(store.add({
                    subject,
                    chapter,
                    concept: chapter,
                    topics: data.topics || [],
                    connections: data.connections || [],
                    relatedConcepts: data.relatedConcepts || [],
                    createdAt: new Date().toISOString()
                }));
            }
        }

        await Promise.all(promises);
        console.log('✅ Knowledge graph saved to database');
        return true;
    }

    async getKnowledgeGraph(subject = null) {
        await this.initialize();
        const transaction = this.db.transaction(['knowledgeGraph'], 'readonly');
        const store = transaction.objectStore('knowledgeGraph');

        return new Promise((resolve, reject) => {
            const results = {};
            let request;

            if (subject) {
                const index = store.index('subject');
                request = index.openCursor(IDBKeyRange.only(subject));
            } else {
                request = store.openCursor();
            }

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const value = cursor.value;
                    if (!results[value.subject]) {
                        results[value.subject] = {};
                    }
                    results[value.subject][value.chapter] = {
                        topics: value.topics,
                        connections: value.connections,
                        relatedConcepts: value.relatedConcepts
                    };
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // ========== EXPERIMENTS OPERATIONS ==========

    async saveExperiment(experimentData) {
        await this.initialize();
        const transaction = this.db.transaction(['experiments'], 'readwrite');
        const store = transaction.objectStore('experiments');

        const experiment = {
            name: experimentData.name,
            description: experimentData.description || '',
            parameters: experimentData.parameters || {},
            tags: experimentData.tags || [],
            status: experimentData.status || 'created',
            createdAt: experimentData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: experimentData.metadata || {}
        };

        return new Promise((resolve, reject) => {
            const request = experimentData.id ? store.put({ ...experiment, id: experimentData.id }) : store.add(experiment);
            request.onsuccess = () => {
                this.invalidateCache('experiments');
                console.log('✅ Experiment saved');
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getExperiments(filters = {}, pagination = {}) {
        await this.initialize();
        const cacheKey = `experiments_${JSON.stringify(filters)}_${JSON.stringify(pagination)}`;

        // Check cache first
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const transaction = this.db.transaction(['experiments'], 'readonly');
        const store = transaction.objectStore('experiments');

        return new Promise((resolve, reject) => {
            const results = [];
            const { limit = 50, offset = 0 } = pagination;
            let count = 0;
            let skipped = 0;
            let request;

            if (filters.status) {
                const index = store.index('status');
                request = index.openCursor(IDBKeyRange.only(filters.status), 'prev');
            } else if (filters.tags && filters.tags.length > 0) {
                const index = store.index('tags');
                request = index.openCursor(IDBKeyRange.only(filters.tags[0]));
            } else {
                const index = store.index('createdAt');
                request = index.openCursor(null, 'prev');
            }

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && count < limit) {
                    if (skipped < offset) {
                        skipped++;
                        cursor.continue();
                        return;
                    }
                    results.push(cursor.value);
                    count++;
                    cursor.continue();
                } else {
                    this.setCache(cacheKey, results);
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    async getExperimentById(id) {
        await this.initialize();
        const transaction = this.db.transaction(['experiments'], 'readonly');
        const store = transaction.objectStore('experiments');

        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteExperiment(id) {
        await this.initialize();
        const transaction = this.db.transaction(['experiments', 'experimentRuns'], 'readwrite');
        const experimentsStore = transaction.objectStore('experiments');
        const runsStore = transaction.objectStore('experimentRuns');

        // Delete experiment and all its runs
        return new Promise((resolve, reject) => {
            experimentsStore.delete(id);

            const index = runsStore.index('experimentId');
            const request = index.openCursor(IDBKeyRange.only(id));

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    this.invalidateCache('experiments');
                    this.invalidateCache('experimentRuns');
                    console.log('✅ Experiment and runs deleted');
                    resolve();
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // ========== EXPERIMENT RUNS OPERATIONS ==========

    async saveExperimentRun(runData) {
        await this.initialize();
        const transaction = this.db.transaction(['experimentRuns'], 'readwrite');
        const store = transaction.objectStore('experimentRuns');

        const run = {
            experimentId: runData.experimentId,
            timestamp: runData.timestamp || new Date().toISOString(),
            parameters: runData.parameters || {},
            metrics: runData.metrics || {},
            results: runData.results || {},
            status: runData.status || 'completed',
            duration: runData.duration || 0,
            logs: runData.logs || [],
            metadata: runData.metadata || {}
        };

        return new Promise((resolve, reject) => {
            const request = runData.id ? store.put({ ...run, id: runData.id }) : store.add(run);
            request.onsuccess = () => {
                this.invalidateCache('experimentRuns');
                console.log('✅ Experiment run saved');
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getExperimentRuns(experimentId, pagination = {}) {
        await this.initialize();
        const cacheKey = `experimentRuns_${experimentId}_${JSON.stringify(pagination)}`;

        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const transaction = this.db.transaction(['experimentRuns'], 'readonly');
        const store = transaction.objectStore('experimentRuns');
        const index = store.index('experiment_timestamp');

        return new Promise((resolve, reject) => {
            const results = [];
            const { limit = 100, offset = 0 } = pagination;
            let count = 0;
            let skipped = 0;

            const request = index.openCursor(
                IDBKeyRange.bound([experimentId, ''], [experimentId, '\uffff']),
                'prev'
            );

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && count < limit) {
                    if (skipped < offset) {
                        skipped++;
                        cursor.continue();
                        return;
                    }
                    results.push(cursor.value);
                    count++;
                    cursor.continue();
                } else {
                    this.setCache(cacheKey, results);
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    async deleteExperimentRun(id) {
        await this.initialize();
        const transaction = this.db.transaction(['experimentRuns'], 'readwrite');
        const store = transaction.objectStore('experimentRuns');

        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => {
                this.invalidateCache('experimentRuns');
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ========== ANALYTICS OPERATIONS ==========

    async saveAnalytics(analyticsData) {
        await this.initialize();
        const transaction = this.db.transaction(['analytics'], 'readwrite');
        const store = transaction.objectStore('analytics');

        const analytics = {
            type: analyticsData.type, // 'report', 'metric', 'visualization'
            experimentId: analyticsData.experimentId || null,
            data: analyticsData.data || {},
            timestamp: new Date().toISOString(),
            metadata: analyticsData.metadata || {}
        };

        return new Promise((resolve, reject) => {
            const request = store.add(analytics);
            request.onsuccess = () => {
                this.invalidateCache('analytics');
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getAnalytics(filters = {}, pagination = {}) {
        await this.initialize();
        const transaction = this.db.transaction(['analytics'], 'readonly');
        const store = transaction.objectStore('analytics');

        return new Promise((resolve, reject) => {
            const results = [];
            const { limit = 50, offset = 0 } = pagination;
            let count = 0;
            let skipped = 0;
            let request;

            if (filters.type) {
                const index = store.index('type_timestamp');
                request = index.openCursor(
                    IDBKeyRange.bound([filters.type, ''], [filters.type, '\uffff']),
                    'prev'
                );
            } else if (filters.experimentId) {
                const index = store.index('experimentId');
                request = index.openCursor(IDBKeyRange.only(filters.experimentId), 'prev');
            } else {
                const index = store.index('timestamp');
                request = index.openCursor(null, 'prev');
            }

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && count < limit) {
                    if (skipped < offset) {
                        skipped++;
                        cursor.continue();
                        return;
                    }
                    results.push(cursor.value);
                    count++;
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // ========== BASELINES OPERATIONS ==========

    async saveBaseline(baselineData) {
        await this.initialize();
        const transaction = this.db.transaction(['baselines'], 'readwrite');
        const store = transaction.objectStore('baselines');

        const baseline = {
            name: baselineData.name,
            category: baselineData.category || 'general',
            metrics: baselineData.metrics || {},
            description: baselineData.description || '',
            createdAt: new Date().toISOString(),
            metadata: baselineData.metadata || {}
        };

        return new Promise((resolve, reject) => {
            const request = baselineData.id ? store.put({ ...baseline, id: baselineData.id }) : store.add(baseline);
            request.onsuccess = () => {
                this.invalidateCache('baselines');
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getBaselines(category = null) {
        await this.initialize();
        const cacheKey = `baselines_${category}`;

        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const transaction = this.db.transaction(['baselines'], 'readonly');
        const store = transaction.objectStore('baselines');

        return new Promise((resolve, reject) => {
            const results = [];
            let request;

            if (category) {
                const index = store.index('category');
                request = index.openCursor(IDBKeyRange.only(category));
            } else {
                request = store.openCursor();
            }

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    this.setCache(cacheKey, results);
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // ========== A/B TESTS OPERATIONS ==========

    async saveABTest(testData) {
        await this.initialize();
        const transaction = this.db.transaction(['abTests'], 'readwrite');
        const store = transaction.objectStore('abTests');

        const abTest = {
            name: testData.name,
            description: testData.description || '',
            variants: testData.variants || [],
            status: testData.status || 'draft',
            startDate: testData.startDate || null,
            endDate: testData.endDate || null,
            trafficAllocation: testData.trafficAllocation || {},
            results: testData.results || {},
            metadata: testData.metadata || {}
        };

        return new Promise((resolve, reject) => {
            const request = testData.id ? store.put({ ...abTest, id: testData.id }) : store.add(abTest);
            request.onsuccess = () => {
                this.invalidateCache('abTests');
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getABTests(status = null) {
        await this.initialize();
        const cacheKey = `abTests_${status}`;

        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const transaction = this.db.transaction(['abTests'], 'readonly');
        const store = transaction.objectStore('abTests');

        return new Promise((resolve, reject) => {
            const results = [];
            let request;

            if (status) {
                const index = store.index('status');
                request = index.openCursor(IDBKeyRange.only(status));
            } else {
                request = store.openCursor();
            }

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    this.setCache(cacheKey, results);
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // ========== EMBEDDINGS OPERATIONS ==========

    async saveEmbedding(embeddingData) {
        await this.initialize();
        const transaction = this.db.transaction(['embeddings'], 'readwrite');
        const store = transaction.objectStore('embeddings');

        const embedding = {
            chunkId: embeddingData.chunkId,
            vector: embeddingData.vector, // Array of numbers
            subject: embeddingData.subject || null,
            grade: embeddingData.grade || null,
            modelVersion: embeddingData.modelVersion || 'v1',
            createdAt: new Date().toISOString(),
            metadata: embeddingData.metadata || {}
        };

        return new Promise((resolve, reject) => {
            const request = store.add(embedding);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async batchSaveEmbeddings(embeddings) {
        await this.initialize();
        const transaction = this.db.transaction(['embeddings'], 'readwrite');
        const store = transaction.objectStore('embeddings');

        const promises = embeddings.map(embeddingData => {
            return new Promise((resolve, reject) => {
                const embedding = {
                    chunkId: embeddingData.chunkId,
                    vector: embeddingData.vector,
                    subject: embeddingData.subject || null,
                    grade: embeddingData.grade || null,
                    modelVersion: embeddingData.modelVersion || 'v1',
                    createdAt: new Date().toISOString(),
                    metadata: embeddingData.metadata || {}
                };

                const request = store.add(embedding);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        });

        const results = await Promise.all(promises);
        console.log(`✅ Batch saved ${embeddings.length} embeddings`);
        return results;
    }

    async getEmbedding(chunkId, modelVersion = 'v1') {
        await this.initialize();
        const transaction = this.db.transaction(['embeddings'], 'readonly');
        const store = transaction.objectStore('embeddings');
        const index = store.index('chunk_model');

        return new Promise((resolve, reject) => {
            const request = index.get([chunkId, modelVersion]);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getEmbeddingsByFilter(filters = {}) {
        await this.initialize();
        const transaction = this.db.transaction(['embeddings'], 'readonly');
        const store = transaction.objectStore('embeddings');

        return new Promise((resolve, reject) => {
            const results = [];
            let request;

            if (filters.subject) {
                const index = store.index('subject');
                request = index.openCursor(IDBKeyRange.only(filters.subject));
            } else if (filters.grade) {
                const index = store.index('grade');
                request = index.openCursor(IDBKeyRange.only(filters.grade));
            } else {
                request = store.openCursor();
            }

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (!filters.modelVersion || cursor.value.modelVersion === filters.modelVersion) {
                        results.push(cursor.value);
                    }
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // ========== CACHE OPERATIONS ==========

    setCache(key, value) {
        const expiresAt = Date.now() + this.cacheTimeout;
        this.cache.set(key, { value, expiresAt });
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() > cached.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return cached.value;
    }

    invalidateCache(category = null) {
        if (category) {
            // Remove all cache entries for a specific category
            for (const [key] of this.cache) {
                if (key.startsWith(category)) {
                    this.cache.delete(key);
                }
            }
        } else {
            // Clear entire cache
            this.cache.clear();
        }
    }

    async saveToPersistentCache(key, value, category = 'general') {
        await this.initialize();
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');

        const cacheEntry = {
            key,
            value,
            category,
            expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
            createdAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.put(cacheEntry);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getFromPersistentCache(key) {
        await this.initialize();
        const transaction = this.db.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');

        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => {
                const result = request.result;
                if (result && new Date(result.expiresAt) > new Date()) {
                    resolve(result.value);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async cleanExpiredCache() {
        await this.initialize();
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const index = store.index('expiresAt');

        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            const request = index.openCursor(IDBKeyRange.upperBound(now));
            let deleted = 0;

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    deleted++;
                    cursor.continue();
                } else {
                    console.log(`✅ Cleaned ${deleted} expired cache entries`);
                    resolve(deleted);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // ========== BACKUP OPERATIONS ==========

    async createBackup(type = 'full') {
        await this.initialize();
        console.log(`🔄 Creating ${type} backup...`);

        const backupData = {
            version: this.version,
            type,
            timestamp: new Date().toISOString()
        };

        // Export all data
        if (type === 'full') {
            backupData.curriculum = await this.getCurriculumData();
            backupData.chunks = await this.getChunks();
            backupData.chatHistory = await this.getChatHistory(null, 10000);
            backupData.interactions = await this.getInteractions();
            backupData.uploadedFiles = await this.getUploadedFiles();
            backupData.settings = await this.getAllSettings();
            backupData.statistics = await this.getStatistics();
            backupData.knowledgeGraph = await this.getKnowledgeGraph();
            backupData.experiments = await this.getExperiments({}, { limit: 10000 });
            backupData.baselines = await this.getBaselines();
            backupData.abTests = await this.getABTests();
        } else if (type === 'partial') {
            // Only backup essential data
            backupData.experiments = await this.getExperiments({}, { limit: 10000 });
            backupData.settings = await this.getAllSettings();
            backupData.statistics = await this.getStatistics();
        }

        // Save backup metadata
        const transaction = this.db.transaction(['backups'], 'readwrite');
        const store = transaction.objectStore('backups');

        return new Promise((resolve, reject) => {
            const metadataRequest = store.add({
                type,
                timestamp: backupData.timestamp,
                size: JSON.stringify(backupData).length,
                itemCount: Object.keys(backupData).length
            });

            metadataRequest.onsuccess = () => {
                console.log(`✅ Backup created (ID: ${metadataRequest.result})`);
                resolve({
                    id: metadataRequest.result,
                    data: backupData
                });
            };

            metadataRequest.onerror = () => reject(metadataRequest.error);
        });
    }

    async restoreFromBackup(backupData) {
        await this.initialize();
        console.log('🔄 Restoring from backup...');

        try {
            // Restore data in correct order
            if (backupData.curriculum) await this.saveCurriculumData(backupData.curriculum);
            if (backupData.chunks) await this.saveChunks(backupData.chunks);
            if (backupData.settings) {
                for (const [key, value] of Object.entries(backupData.settings)) {
                    await this.saveSetting(key, value);
                }
            }
            if (backupData.statistics) await this.saveStatistics(backupData.statistics);
            if (backupData.knowledgeGraph) await this.saveKnowledgeGraph(backupData.knowledgeGraph);

            // Restore experiments
            if (backupData.experiments) {
                for (const experiment of backupData.experiments) {
                    await this.saveExperiment(experiment);
                }
            }

            // Restore baselines
            if (backupData.baselines) {
                for (const baseline of backupData.baselines) {
                    await this.saveBaseline(baseline);
                }
            }

            // Restore A/B tests
            if (backupData.abTests) {
                for (const test of backupData.abTests) {
                    await this.saveABTest(test);
                }
            }

            this.invalidateCache(); // Clear all cache
            console.log('✅ Database restored from backup');
            return true;
        } catch (error) {
            console.error('❌ Backup restoration failed:', error);
            return false;
        }
    }

    async getBackupHistory(limit = 10) {
        await this.initialize();
        const transaction = this.db.transaction(['backups'], 'readonly');
        const store = transaction.objectStore('backups');
        const index = store.index('timestamp');

        return new Promise((resolve, reject) => {
            const results = [];
            const request = index.openCursor(null, 'prev');
            let count = 0;

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && count < limit) {
                    results.push(cursor.value);
                    count++;
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // ========== UTILITY METHODS ==========

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async getDatabaseSize() {
        await this.initialize();
        if (!navigator.storage || !navigator.storage.estimate) {
            return null;
        }

        const estimate = await navigator.storage.estimate();
        return {
            usage: estimate.usage || 0,
            quota: estimate.quota || 0,
            usagePercent: estimate.quota ? ((estimate.usage / estimate.quota) * 100).toFixed(2) : 0
        };
    }

    async clearDatabase(options = {}) {
        await this.initialize();
        const { excludeSettings = false, excludeBackups = false } = options;

        const objectStores = [
            'curriculum', 'chunks', 'chatHistory', 'interactions',
            'uploadedFiles', 'statistics', 'searchIndex', 'knowledgeGraph',
            'experiments', 'experimentRuns', 'analytics', 'baselines',
            'abTests', 'embeddings', 'cache'
        ];

        // Add settings and backups if not excluded
        if (!excludeSettings) objectStores.push('settings');
        if (!excludeBackups) objectStores.push('backups');

        const promises = objectStores.map(storeName => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            return transaction.objectStore(storeName).clear();
        });

        await Promise.all(promises);
        this.invalidateCache(); // Clear in-memory cache
        console.log(`✅ Database cleared (${objectStores.length} stores)`);
        return true;
    }

    async exportDatabase(options = {}) {
        await this.initialize();
        const { includeEmbeddings = false, includeCache = false } = options;

        console.log('🔄 Exporting database...');

        const exportData = {
            version: this.version,
            exportDate: new Date().toISOString(),
            curriculum: await this.getCurriculumData(),
            chunks: await this.getChunks(),
            chatHistory: await this.getChatHistory(null, 10000),
            interactions: await this.getInteractions(),
            uploadedFiles: await this.getUploadedFiles(),
            settings: await this.getAllSettings(),
            statistics: await this.getStatistics(),
            knowledgeGraph: await this.getKnowledgeGraph(),
            experiments: await this.getExperiments({}, { limit: 10000 }),
            baselines: await this.getBaselines(),
            abTests: await this.getABTests()
        };

        // Optionally include embeddings (can be large)
        if (includeEmbeddings) {
            exportData.embeddings = await this.getEmbeddingsByFilter({});
        }

        // Optionally include cache (usually not needed)
        if (includeCache) {
            exportData.cache = Array.from(this.cache.entries());
        }

        const exportSize = JSON.stringify(exportData).length;
        console.log(`✅ Database exported (${(exportSize / 1024 / 1024).toFixed(2)} MB)`);

        return exportData;
    }

    async importDatabase(data) {
        await this.initialize();
        console.log('🔄 Importing database...');

        try {
            // Import core data
            if (data.curriculum) await this.saveCurriculumData(data.curriculum);
            if (data.chunks) await this.saveChunks(data.chunks);
            if (data.settings) {
                for (const [key, value] of Object.entries(data.settings)) {
                    await this.saveSetting(key, value);
                }
            }
            if (data.statistics) await this.saveStatistics(data.statistics);
            if (data.knowledgeGraph) await this.saveKnowledgeGraph(data.knowledgeGraph);

            // Import experiments
            if (data.experiments) {
                for (const experiment of data.experiments) {
                    await this.saveExperiment(experiment);
                }
                console.log(`✅ Imported ${data.experiments.length} experiments`);
            }

            // Import baselines
            if (data.baselines) {
                for (const baseline of data.baselines) {
                    await this.saveBaseline(baseline);
                }
                console.log(`✅ Imported ${data.baselines.length} baselines`);
            }

            // Import A/B tests
            if (data.abTests) {
                for (const test of data.abTests) {
                    await this.saveABTest(test);
                }
                console.log(`✅ Imported ${data.abTests.length} A/B tests`);
            }

            // Import embeddings (if present)
            if (data.embeddings && data.embeddings.length > 0) {
                await this.batchSaveEmbeddings(data.embeddings);
                console.log(`✅ Imported ${data.embeddings.length} embeddings`);
            }

            this.invalidateCache(); // Clear all cache
            console.log('✅ Database imported successfully');
            return true;
        } catch (error) {
            console.error('❌ Database import failed:', error);
            return false;
        }
    }

    // ========== PERFORMANCE & MONITORING METHODS ==========

    async getPerformanceMetrics() {
        await this.initialize();

        const metrics = {
            databaseVersion: this.version,
            cacheSize: this.cache.size,
            timestamp: new Date().toISOString()
        };

        // Count items in each store
        const stores = [
            'curriculum', 'chunks', 'chatHistory', 'interactions',
            'uploadedFiles', 'settings', 'statistics', 'searchIndex',
            'knowledgeGraph', 'experiments', 'experimentRuns',
            'analytics', 'baselines', 'abTests', 'embeddings', 'cache', 'backups'
        ];

        const counts = await Promise.all(
            stores.map(async (storeName) => {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);

                return new Promise((resolve) => {
                    const request = store.count();
                    request.onsuccess = () => {
                        resolve({ store: storeName, count: request.result });
                    };
                    request.onerror = () => {
                        resolve({ store: storeName, count: 0 });
                    };
                });
            })
        );

        counts.forEach(({ store, count }) => {
            metrics[store] = count;
        });

        // Add storage metrics
        const storageInfo = await this.getDatabaseSize();
        if (storageInfo) {
            metrics.storage = storageInfo;
        }

        return metrics;
    }

    async optimizeDatabase() {
        await this.initialize();
        console.log('🔄 Optimizing database...');

        let optimized = 0;

        // 1. Clean expired cache entries
        const expiredCacheCount = await this.cleanExpiredCache();
        optimized += expiredCacheCount;

        // 2. Clear in-memory cache
        this.invalidateCache();

        // 3. Vacuum old interactions (keep last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const transaction = this.db.transaction(['interactions'], 'readwrite');
        const store = transaction.objectStore('interactions');
        const index = store.index('timestamp');

        const oldInteractionsDeleted = await new Promise((resolve) => {
            let deleted = 0;
            const request = index.openCursor(IDBKeyRange.upperBound(thirtyDaysAgo));

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    deleted++;
                    cursor.continue();
                } else {
                    resolve(deleted);
                }
            };

            request.onerror = () => resolve(0);
        });

        optimized += oldInteractionsDeleted;

        console.log(`✅ Database optimized (removed ${optimized} items)`);
        return {
            itemsRemoved: optimized,
            expiredCache: expiredCacheCount,
            oldInteractions: oldInteractionsDeleted
        };
    }

    async validateDataIntegrity() {
        await this.initialize();
        console.log('🔄 Validating data integrity...');

        const issues = [];

        // 1. Check for orphaned experiment runs
        const allExperiments = await this.getExperiments({}, { limit: 10000 });
        const experimentIds = new Set(allExperiments.map(e => e.id));

        const allRuns = await new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['experimentRuns'], 'readonly');
            const store = transaction.objectStore('experimentRuns');
            const results = [];
            const request = store.openCursor();

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });

        const orphanedRuns = allRuns.filter(run => !experimentIds.has(run.experimentId));
        if (orphanedRuns.length > 0) {
            issues.push({
                type: 'orphaned_runs',
                count: orphanedRuns.length,
                message: `Found ${orphanedRuns.length} experiment runs without parent experiments`
            });
        }

        // 2. Check for embeddings without chunks
        const allChunks = await this.getChunks();
        const chunkIds = new Set(allChunks.map((c, i) => i));

        const allEmbeddings = await this.getEmbeddingsByFilter({});
        const orphanedEmbeddings = allEmbeddings.filter(emb => !chunkIds.has(emb.chunkId));
        if (orphanedEmbeddings.length > 0) {
            issues.push({
                type: 'orphaned_embeddings',
                count: orphanedEmbeddings.length,
                message: `Found ${orphanedEmbeddings.length} embeddings without chunks`
            });
        }

        // 3. Check database size vs quota
        const storageInfo = await this.getDatabaseSize();
        if (storageInfo && storageInfo.usagePercent > 80) {
            issues.push({
                type: 'storage_warning',
                usage: storageInfo.usagePercent,
                message: `Storage usage at ${storageInfo.usagePercent}% of quota`
            });
        }

        if (issues.length === 0) {
            console.log('✅ Data integrity check passed');
        } else {
            console.log(`⚠️ Found ${issues.length} integrity issues`);
        }

        return {
            valid: issues.length === 0,
            issues,
            timestamp: new Date().toISOString()
        };
    }

    async repairDatabase(integrityReport) {
        await this.initialize();
        console.log('🔄 Repairing database...');

        let repaired = 0;

        for (const issue of integrityReport.issues) {
            if (issue.type === 'orphaned_runs') {
                // Delete orphaned experiment runs
                const allRuns = await new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(['experimentRuns'], 'readonly');
                    const store = transaction.objectStore('experimentRuns');
                    const results = [];
                    const request = store.openCursor();

                    request.onsuccess = (event) => {
                        const cursor = event.target.result;
                        if (cursor) {
                            results.push(cursor.value);
                            cursor.continue();
                        } else {
                            resolve(results);
                        }
                    };

                    request.onerror = () => reject(request.error);
                });

                const allExperiments = await this.getExperiments({}, { limit: 10000 });
                const experimentIds = new Set(allExperiments.map(e => e.id));

                for (const run of allRuns) {
                    if (!experimentIds.has(run.experimentId)) {
                        await this.deleteExperimentRun(run.id);
                        repaired++;
                    }
                }
            } else if (issue.type === 'orphaned_embeddings') {
                // Could delete or keep orphaned embeddings based on policy
                console.log('⚠️ Orphaned embeddings found (manual review recommended)');
            }
        }

        console.log(`✅ Database repaired (${repaired} items fixed)`);
        return { itemsRepaired: repaired };
    }
}

// Export for use in the main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EduLLMDatabase;
}

// Global instance for browser usage
if (typeof window !== 'undefined') {
    window.EduLLMDatabase = EduLLMDatabase;
}



