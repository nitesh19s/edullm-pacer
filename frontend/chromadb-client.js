/**
 * ChromaDB Client Integration
 *
 * Provides integration with ChromaDB for advanced vector storage and retrieval.
 * Supports both ChromaDB server mode and in-memory fallback.
 *
 * Features:
 * - Collection management
 * - Embedding storage and retrieval
 * - Advanced similarity search
 * - Metadata filtering
 * - Batch operations
 * - Migration from in-memory store
 */

class ChromaDBClient {
    constructor(config = {}) {
        this.config = {
            serverUrl: config.serverUrl || 'http://localhost:8000',
            defaultCollection: config.defaultCollection || 'edullm_embeddings',
            timeout: config.timeout || 30000,
            enableFallback: config.enableFallback !== false,
            distanceMetric: config.distanceMetric || 'cosine', // cosine, l2, ip
            enableLogging: config.enableLogging !== false
        };

        this.client = null;
        this.collections = new Map();
        this.isConnected = false;
        this.mode = 'unknown'; // 'chromadb', 'fallback'
        this.fallbackStore = null;
    }

    /**
     * Initialize ChromaDB client
     */
    async initialize() {
        try {
            // Try to connect to ChromaDB server
            await this.connectToChromaDB();
            this.mode = 'chromadb';
            this.log('ChromaDB client initialized successfully');
        } catch (error) {
            this.log('ChromaDB server not available, using fallback mode', 'warn');

            if (this.config.enableFallback) {
                await this.initializeFallback();
                this.mode = 'fallback';
            } else {
                throw new Error('ChromaDB server unavailable and fallback disabled');
            }
        }

        return this.mode;
    }

    /**
     * Connect to ChromaDB server
     */
    async connectToChromaDB() {
        // Check if ChromaDB JavaScript client is available
        if (typeof ChromaClient === 'undefined') {
            throw new Error('ChromaDB client library not loaded');
        }

        try {
            // Initialize ChromaDB client
            // Note: This uses the chromadb-client library which needs to be included
            this.client = new ChromaClient({
                path: this.config.serverUrl
            });

            // Test connection by listing collections
            await this.client.heartbeat();

            this.isConnected = true;
            this.log('Connected to ChromaDB server at ' + this.config.serverUrl);
        } catch (error) {
            this.isConnected = false;
            throw new Error('Failed to connect to ChromaDB: ' + error.message);
        }
    }

    /**
     * Initialize fallback in-memory store
     */
    async initializeFallback() {
        // Use existing VectorStoreEnhanced as fallback
        if (typeof VectorStoreEnhanced !== 'undefined') {
            this.fallbackStore = new VectorStoreEnhanced();
            await this.fallbackStore.initialize();
            this.log('Fallback in-memory store initialized');
        } else {
            // Create simple in-memory fallback
            this.fallbackStore = new SimpleVectorStore();
            this.log('Simple fallback store initialized');
        }
    }

    /**
     * Get or create a collection
     * @param {string} collectionName - Name of the collection
     * @param {Object} metadata - Collection metadata
     */
    async getOrCreateCollection(collectionName, metadata = {}) {
        if (this.mode === 'fallback') {
            return this.fallbackStore.getOrCreateCollection(collectionName);
        }

        try {
            // Check if collection exists in cache
            if (this.collections.has(collectionName)) {
                return this.collections.get(collectionName);
            }

            // Try to get existing collection
            let collection;
            try {
                collection = await this.client.getCollection({
                    name: collectionName
                });
                this.log(`Retrieved existing collection: ${collectionName}`);
            } catch (error) {
                // Collection doesn't exist, create it
                collection = await this.client.createCollection({
                    name: collectionName,
                    metadata: {
                        ...metadata,
                        created_at: Date.now(),
                        distance_metric: this.config.distanceMetric
                    }
                });
                this.log(`Created new collection: ${collectionName}`);
            }

            // Cache collection
            this.collections.set(collectionName, collection);
            return collection;
        } catch (error) {
            this.log(`Failed to get/create collection: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Add embeddings to collection
     * @param {string} collectionName - Collection name
     * @param {Array} embeddings - Array of embedding objects
     */
    async addEmbeddings(collectionName, embeddings) {
        if (this.mode === 'fallback') {
            return this.fallbackStore.addEmbeddings(collectionName, embeddings);
        }

        try {
            const collection = await this.getOrCreateCollection(collectionName);

            // Prepare data for ChromaDB format
            const ids = embeddings.map(e => e.id || this.generateId());
            const vectors = embeddings.map(e => e.embedding);
            const metadatas = embeddings.map(e => ({
                text: e.text || '',
                subject: e.subject || '',
                grade: e.grade || '',
                chapter: e.chapter || '',
                chunkIndex: e.chunkIndex || 0,
                ...e.metadata
            }));
            const documents = embeddings.map(e => e.text || '');

            // Add to ChromaDB
            await collection.add({
                ids,
                embeddings: vectors,
                metadatas,
                documents
            });

            this.log(`Added ${embeddings.length} embeddings to ${collectionName}`);
            return { success: true, count: embeddings.length };
        } catch (error) {
            this.log(`Failed to add embeddings: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Query collection for similar vectors
     * @param {string} collectionName - Collection name
     * @param {Array} queryEmbedding - Query vector
     * @param {number} topK - Number of results to return
     * @param {Object} filter - Metadata filter
     */
    async query(collectionName, queryEmbedding, topK = 5, filter = {}) {
        if (this.mode === 'fallback') {
            return this.fallbackStore.query(collectionName, queryEmbedding, topK, filter);
        }

        try {
            const collection = await this.getOrCreateCollection(collectionName);

            // Build where clause from filter
            const where = this.buildWhereClause(filter);

            // Query ChromaDB
            const results = await collection.query({
                queryEmbeddings: [queryEmbedding],
                nResults: topK,
                where: where
            });

            // Transform results to standard format
            return this.transformQueryResults(results);
        } catch (error) {
            this.log(`Query failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Build ChromaDB where clause from filter object
     */
    buildWhereClause(filter) {
        if (!filter || Object.keys(filter).length === 0) {
            return undefined;
        }

        const conditions = [];

        // Convert filter to ChromaDB where format
        for (const [key, value] of Object.entries(filter)) {
            if (value !== undefined && value !== null) {
                if (typeof value === 'string') {
                    conditions.push({ [key]: { $eq: value } });
                } else if (typeof value === 'number') {
                    conditions.push({ [key]: { $eq: value } });
                } else if (Array.isArray(value)) {
                    conditions.push({ [key]: { $in: value } });
                }
            }
        }

        if (conditions.length === 0) {
            return undefined;
        }

        return conditions.length === 1 ? conditions[0] : { $and: conditions };
    }

    /**
     * Transform ChromaDB query results to standard format
     */
    transformQueryResults(chromaResults) {
        const results = [];

        if (!chromaResults.ids || chromaResults.ids.length === 0) {
            return results;
        }

        const ids = chromaResults.ids[0];
        const distances = chromaResults.distances[0];
        const metadatas = chromaResults.metadatas[0];
        const documents = chromaResults.documents[0];

        for (let i = 0; i < ids.length; i++) {
            results.push({
                id: ids[i],
                distance: distances[i],
                similarity: 1 - distances[i], // Convert distance to similarity
                metadata: metadatas[i],
                text: documents[i]
            });
        }

        return results;
    }

    /**
     * Delete embeddings from collection
     * @param {string} collectionName - Collection name
     * @param {Array} ids - IDs to delete
     */
    async deleteEmbeddings(collectionName, ids) {
        if (this.mode === 'fallback') {
            return this.fallbackStore.deleteEmbeddings(collectionName, ids);
        }

        try {
            const collection = await this.getOrCreateCollection(collectionName);

            await collection.delete({
                ids: ids
            });

            this.log(`Deleted ${ids.length} embeddings from ${collectionName}`);
            return { success: true, count: ids.length };
        } catch (error) {
            this.log(`Failed to delete embeddings: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Update embeddings in collection
     * @param {string} collectionName - Collection name
     * @param {Array} embeddings - Embeddings to update
     */
    async updateEmbeddings(collectionName, embeddings) {
        if (this.mode === 'fallback') {
            return this.fallbackStore.updateEmbeddings(collectionName, embeddings);
        }

        try {
            const collection = await this.getOrCreateCollection(collectionName);

            const ids = embeddings.map(e => e.id);
            const vectors = embeddings.map(e => e.embedding);
            const metadatas = embeddings.map(e => e.metadata);
            const documents = embeddings.map(e => e.text || '');

            await collection.update({
                ids,
                embeddings: vectors,
                metadatas,
                documents
            });

            this.log(`Updated ${embeddings.length} embeddings in ${collectionName}`);
            return { success: true, count: embeddings.length };
        } catch (error) {
            this.log(`Failed to update embeddings: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Get collection statistics
     * @param {string} collectionName - Collection name
     */
    async getCollectionStats(collectionName) {
        if (this.mode === 'fallback') {
            return this.fallbackStore.getCollectionStats(collectionName);
        }

        try {
            const collection = await this.getOrCreateCollection(collectionName);
            const count = await collection.count();

            return {
                name: collectionName,
                count: count,
                mode: this.mode
            };
        } catch (error) {
            this.log(`Failed to get collection stats: ${error.message}`, 'error');
            return { name: collectionName, count: 0, error: error.message };
        }
    }

    /**
     * List all collections
     */
    async listCollections() {
        if (this.mode === 'fallback') {
            return this.fallbackStore.listCollections();
        }

        try {
            const collections = await this.client.listCollections();
            return collections.map(c => c.name);
        } catch (error) {
            this.log(`Failed to list collections: ${error.message}`, 'error');
            return [];
        }
    }

    /**
     * Delete a collection
     * @param {string} collectionName - Collection name
     */
    async deleteCollection(collectionName) {
        if (this.mode === 'fallback') {
            return this.fallbackStore.deleteCollection(collectionName);
        }

        try {
            await this.client.deleteCollection({ name: collectionName });
            this.collections.delete(collectionName);
            this.log(`Deleted collection: ${collectionName}`);
            return { success: true };
        } catch (error) {
            this.log(`Failed to delete collection: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Migrate data from in-memory store to ChromaDB
     * @param {Object} inMemoryStore - Existing in-memory vector store
     * @param {string} collectionName - Target collection name
     */
    async migrateFromInMemory(inMemoryStore, collectionName = 'edullm_embeddings') {
        if (this.mode !== 'chromadb') {
            throw new Error('Cannot migrate: ChromaDB not connected');
        }

        try {
            this.log(`Starting migration to ChromaDB collection: ${collectionName}`);

            // Get all embeddings from in-memory store
            const embeddings = await inMemoryStore.getAllEmbeddings();

            if (embeddings.length === 0) {
                this.log('No embeddings to migrate');
                return { success: true, count: 0 };
            }

            // Add embeddings in batches
            const batchSize = 100;
            let migratedCount = 0;

            for (let i = 0; i < embeddings.length; i += batchSize) {
                const batch = embeddings.slice(i, i + batchSize);
                await this.addEmbeddings(collectionName, batch);
                migratedCount += batch.length;
                this.log(`Migrated ${migratedCount}/${embeddings.length} embeddings`);
            }

            this.log(`Migration complete: ${migratedCount} embeddings`);
            return { success: true, count: migratedCount };
        } catch (error) {
            this.log(`Migration failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Export collection data
     * @param {string} collectionName - Collection name
     */
    async exportCollection(collectionName) {
        if (this.mode === 'fallback') {
            return this.fallbackStore.exportCollection(collectionName);
        }

        try {
            const collection = await this.getOrCreateCollection(collectionName);

            // Get all data from collection
            const result = await collection.get();

            return {
                name: collectionName,
                count: result.ids.length,
                data: {
                    ids: result.ids,
                    embeddings: result.embeddings,
                    metadatas: result.metadatas,
                    documents: result.documents
                },
                exportedAt: Date.now()
            };
        } catch (error) {
            this.log(`Export failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Import collection data
     * @param {Object} exportedData - Previously exported data
     */
    async importCollection(exportedData) {
        if (this.mode === 'fallback') {
            return this.fallbackStore.importCollection(exportedData);
        }

        try {
            const { name, data } = exportedData;
            const collection = await this.getOrCreateCollection(name);

            // Add all data
            await collection.add({
                ids: data.ids,
                embeddings: data.embeddings,
                metadatas: data.metadatas,
                documents: data.documents
            });

            this.log(`Imported ${data.ids.length} embeddings to ${name}`);
            return { success: true, count: data.ids.length };
        } catch (error) {
            this.log(`Import failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `emb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get current mode
     */
    getMode() {
        return this.mode;
    }

    /**
     * Check if ChromaDB is connected
     */
    isChromaDBConnected() {
        return this.mode === 'chromadb' && this.isConnected;
    }

    /**
     * Log message
     */
    log(message, level = 'info') {
        if (!this.config.enableLogging) return;

        const prefix = '[ChromaDB]';
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

/**
 * Simple in-memory vector store (fallback)
 */
class SimpleVectorStore {
    constructor() {
        this.collections = new Map();
    }

    getOrCreateCollection(name) {
        if (!this.collections.has(name)) {
            this.collections.set(name, {
                name,
                embeddings: []
            });
        }
        return this.collections.get(name);
    }

    async addEmbeddings(collectionName, embeddings) {
        const collection = this.getOrCreateCollection(collectionName);
        collection.embeddings.push(...embeddings);
        return { success: true, count: embeddings.length };
    }

    async query(collectionName, queryEmbedding, topK = 5, filter = {}) {
        const collection = this.getOrCreateCollection(collectionName);

        // Filter embeddings
        let filtered = collection.embeddings;
        if (Object.keys(filter).length > 0) {
            filtered = filtered.filter(emb => {
                return Object.entries(filter).every(([key, value]) => {
                    return emb.metadata && emb.metadata[key] === value;
                });
            });
        }

        // Calculate similarities
        const results = filtered.map(emb => ({
            ...emb,
            similarity: this.cosineSimilarity(queryEmbedding, emb.embedding)
        }));

        // Sort by similarity and take top K
        results.sort((a, b) => b.similarity - a.similarity);
        return results.slice(0, topK);
    }

    cosineSimilarity(a, b) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    async deleteEmbeddings(collectionName, ids) {
        const collection = this.getOrCreateCollection(collectionName);
        collection.embeddings = collection.embeddings.filter(e => !ids.includes(e.id));
        return { success: true, count: ids.length };
    }

    async updateEmbeddings(collectionName, embeddings) {
        await this.deleteEmbeddings(collectionName, embeddings.map(e => e.id));
        await this.addEmbeddings(collectionName, embeddings);
        return { success: true, count: embeddings.length };
    }

    getCollectionStats(collectionName) {
        const collection = this.getOrCreateCollection(collectionName);
        return {
            name: collectionName,
            count: collection.embeddings.length,
            mode: 'simple_fallback'
        };
    }

    listCollections() {
        return Array.from(this.collections.keys());
    }

    deleteCollection(collectionName) {
        this.collections.delete(collectionName);
        return { success: true };
    }

    getAllEmbeddings() {
        const all = [];
        this.collections.forEach(collection => {
            all.push(...collection.embeddings);
        });
        return all;
    }

    exportCollection(collectionName) {
        const collection = this.getOrCreateCollection(collectionName);
        return {
            name: collectionName,
            count: collection.embeddings.length,
            data: collection.embeddings,
            exportedAt: Date.now()
        };
    }

    importCollection(exportedData) {
        const { name, data } = exportedData;
        this.collections.set(name, {
            name,
            embeddings: data
        });
        return { success: true, count: data.length };
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.ChromaDBClient = ChromaDBClient;
    window.SimpleVectorStore = SimpleVectorStore;
}
