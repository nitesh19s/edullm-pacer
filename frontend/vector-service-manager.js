/**
 * Vector Service Manager
 *
 * Unified interface for vector storage supporting multiple backends:
 * - ChromaDB (production-grade, persistent)
 * - In-Memory (fast, development)
 *
 * Automatically handles fallback and migration between backends.
 */

class VectorServiceManager {
    constructor(database, config = {}) {
        this.database = database;
        this.config = {
            preferredBackend: config.preferredBackend || 'chromadb', // 'chromadb' or 'inmemory'
            chromadbUrl: config.chromadbUrl || 'http://localhost:8000',
            autoMigrate: config.autoMigrate !== false,
            enableCache: config.enableCache !== false,
            enableLogging: config.enableLogging !== false
        };

        this.chromadbClient = null;
        this.inMemoryStore = null;
        this.activeBackend = null;
        this.initialized = false;

        // Cache for frequently accessed vectors
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
    }

    /**
     * Initialize vector service
     */
    async initialize() {
        if (this.initialized) return;

        console.log('🚀 Initializing Vector Service Manager...');

        // Initialize backends based on preference
        if (this.config.preferredBackend === 'chromadb') {
            await this.initializeWithChromaDB();
        } else {
            await this.initializeWithInMemory();
        }

        this.initialized = true;
        console.log(`✅ Vector Service initialized with ${this.activeBackend} backend`);

        return this.activeBackend;
    }

    /**
     * Initialize with ChromaDB (fallback to in-memory if unavailable)
     */
    async initializeWithChromaDB() {
        try {
            // Try ChromaDB first
            this.chromadbClient = new ChromaDBClient({
                serverUrl: this.config.chromadbUrl,
                enableFallback: true,
                enableLogging: this.config.enableLogging
            });

            const mode = await this.chromadbClient.initialize();

            if (mode === 'chromadb') {
                this.activeBackend = 'chromadb';
                this.log('ChromaDB backend activated');

                // Auto-migrate from IndexedDB if enabled
                if (this.config.autoMigrate) {
                    await this.checkAndMigrateFromIndexedDB();
                }
            } else {
                this.activeBackend = 'inmemory';
                this.inMemoryStore = this.chromadbClient.fallbackStore;
                this.log('ChromaDB unavailable, using in-memory backend');
            }
        } catch (error) {
            this.log('ChromaDB initialization failed, falling back to in-memory', 'warn');
            await this.initializeWithInMemory();
        }
    }

    /**
     * Initialize with in-memory store
     */
    async initializeWithInMemory() {
        if (typeof VectorStoreEnhanced !== 'undefined') {
            this.inMemoryStore = new VectorStoreEnhanced();
            await this.inMemoryStore.initialize();
        } else {
            this.inMemoryStore = new SimpleVectorStore();
        }

        this.activeBackend = 'inmemory';
        this.log('In-memory backend activated');
    }

    /**
     * Check if embeddings exist in IndexedDB and migrate to ChromaDB
     */
    async checkAndMigrateFromIndexedDB() {
        try {
            if (!this.database) return;

            // Get embeddings from IndexedDB
            const embeddings = await this.database.getAll('embeddings');

            if (embeddings && embeddings.length > 0) {
                this.log(`Found ${embeddings.length} embeddings in IndexedDB`);

                const shouldMigrate = confirm(
                    `Found ${embeddings.length} embeddings in local storage.\n\n` +
                    `Would you like to migrate them to ChromaDB for better performance?`
                );

                if (shouldMigrate) {
                    await this.migrateFromIndexedDB(embeddings);
                }
            }
        } catch (error) {
            this.log(`Auto-migration check failed: ${error.message}`, 'warn');
        }
    }

    /**
     * Migrate embeddings from IndexedDB to ChromaDB
     */
    async migrateFromIndexedDB(embeddings) {
        try {
            this.log('Starting migration from IndexedDB to ChromaDB...');

            // Group by collection (subject_grade)
            const collections = {};

            embeddings.forEach(emb => {
                const collectionName = `${emb.subject}_grade_${emb.grade}`.toLowerCase();
                if (!collections[collectionName]) {
                    collections[collectionName] = [];
                }

                collections[collectionName].push({
                    id: emb.id,
                    embedding: emb.vector,
                    text: emb.text || '',
                    metadata: {
                        subject: emb.subject,
                        grade: emb.grade,
                        chapter: emb.chapter,
                        chunkId: emb.chunkId
                    }
                });
            });

            // Migrate each collection
            let totalMigrated = 0;
            for (const [collectionName, collectionEmbeddings] of Object.entries(collections)) {
                await this.chromadbClient.addEmbeddings(collectionName, collectionEmbeddings);
                totalMigrated += collectionEmbeddings.length;
                this.log(`Migrated ${collectionEmbeddings.length} embeddings to ${collectionName}`);
            }

            this.log(`✅ Migration complete: ${totalMigrated} embeddings migrated`);
            alert(`Successfully migrated ${totalMigrated} embeddings to ChromaDB!`);

            return { success: true, count: totalMigrated };
        } catch (error) {
            this.log(`Migration failed: ${error.message}`, 'error');
            alert(`Migration failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Add embeddings to vector store
     * @param {Array} embeddings - Embeddings to add
     * @param {string} collectionName - Optional collection name
     */
    async addEmbeddings(embeddings, collectionName = 'default') {
        const backend = this.getActiveBackend();

        try {
            const result = await backend.addEmbeddings(collectionName, embeddings);

            // Clear cache for this collection
            this.clearCacheForCollection(collectionName);

            return result;
        } catch (error) {
            this.log(`Failed to add embeddings: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Query vector store for similar vectors
     * @param {Array} queryVector - Query embedding
     * @param {number} topK - Number of results
     * @param {Object} filter - Metadata filter
     * @param {string} collectionName - Collection to search
     */
    async query(queryVector, topK = 5, filter = {}, collectionName = 'default') {
        // Check cache first
        const cacheKey = this.getCacheKey(queryVector, topK, filter, collectionName);
        if (this.config.enableCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                this.log('Cache hit for query');
                return cached.results;
            }
        }

        const backend = this.getActiveBackend();

        try {
            const results = await backend.query(collectionName, queryVector, topK, filter);

            // Cache results
            if (this.config.enableCache) {
                this.cache.set(cacheKey, {
                    results,
                    timestamp: Date.now()
                });
            }

            return results;
        } catch (error) {
            this.log(`Query failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Get collection statistics
     * @param {string} collectionName - Collection name
     */
    async getCollectionStats(collectionName = 'default') {
        const backend = this.getActiveBackend();

        try {
            return await backend.getCollectionStats(collectionName);
        } catch (error) {
            this.log(`Failed to get stats: ${error.message}`, 'error');
            return { name: collectionName, count: 0, error: error.message };
        }
    }

    /**
     * List all collections
     */
    async listCollections() {
        const backend = this.getActiveBackend();

        try {
            return await backend.listCollections();
        } catch (error) {
            this.log(`Failed to list collections: ${error.message}`, 'error');
            return [];
        }
    }

    /**
     * Delete collection
     * @param {string} collectionName - Collection to delete
     */
    async deleteCollection(collectionName) {
        const backend = this.getActiveBackend();

        try {
            const result = await backend.deleteCollection(collectionName);
            this.clearCacheForCollection(collectionName);
            return result;
        } catch (error) {
            this.log(`Failed to delete collection: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Switch backend
     * @param {string} newBackend - 'chromadb' or 'inmemory'
     * @param {boolean} migrate - Whether to migrate data
     */
    async switchBackend(newBackend, migrate = false) {
        if (newBackend === this.activeBackend) {
            this.log('Already using ' + newBackend + ' backend');
            return;
        }

        this.log(`Switching from ${this.activeBackend} to ${newBackend}...`);

        // Export current data if migrating
        let exportedData = null;
        if (migrate) {
            exportedData = await this.exportAllCollections();
        }

        // Initialize new backend
        if (newBackend === 'chromadb') {
            await this.initializeWithChromaDB();
        } else {
            await this.initializeWithInMemory();
        }

        // Import data if migrating
        if (migrate && exportedData) {
            await this.importAllCollections(exportedData);
        }

        this.cache.clear();
        this.log(`✅ Switched to ${newBackend} backend`);
    }

    /**
     * Export all collections
     */
    async exportAllCollections() {
        const backend = this.getActiveBackend();
        const collections = await backend.listCollections();
        const exported = [];

        for (const collectionName of collections) {
            const data = await backend.exportCollection(collectionName);
            exported.push(data);
        }

        return exported;
    }

    /**
     * Import all collections
     */
    async importAllCollections(collectionsData) {
        const backend = this.getActiveBackend();

        for (const collectionData of collectionsData) {
            await backend.importCollection(collectionData);
        }

        this.log(`Imported ${collectionsData.length} collections`);
    }

    /**
     * Get active backend instance
     */
    getActiveBackend() {
        if (this.activeBackend === 'chromadb' && this.chromadbClient) {
            return this.chromadbClient;
        } else if (this.inMemoryStore) {
            return this.inMemoryStore;
        }

        throw new Error('No active backend available');
    }

    /**
     * Get current backend type
     */
    getBackendType() {
        return this.activeBackend;
    }

    /**
     * Check if ChromaDB is active
     */
    isUsingChromaDB() {
        return this.activeBackend === 'chromadb';
    }

    /**
     * Get cache key for query
     */
    getCacheKey(queryVector, topK, filter, collectionName) {
        return `${collectionName}_${topK}_${JSON.stringify(filter)}_${queryVector.slice(0, 5).join(',')}`;
    }

    /**
     * Clear cache for collection
     */
    clearCacheForCollection(collectionName) {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.startsWith(collectionName)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
    }

    /**
     * Clear all cache
     */
    clearCache() {
        this.cache.clear();
        this.log('Cache cleared');
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            activeBackend: this.activeBackend,
            chromadbAvailable: this.chromadbClient !== null,
            chromadbConnected: this.chromadbClient?.isChromaDBConnected() || false,
            inMemoryAvailable: this.inMemoryStore !== null,
            cacheEnabled: this.config.enableCache,
            cacheSize: this.cache.size
        };
    }

    /**
     * Log message
     */
    log(message, level = 'info') {
        if (!this.config.enableLogging) return;

        const prefix = '[VectorService]';
        switch (level) {
            case 'error':
                console.error(prefix, message);
                break;
            case 'warn':
                console.warn(prefix, message);
                break;
            default:
                console.log(prefix, message);
        }
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.VectorServiceManager = VectorServiceManager;
}
