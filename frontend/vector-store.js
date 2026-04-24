// Vector Store for EduLLM Platform
// Client-side vector database with similarity search

class VectorStore {
    constructor() {
        this.vectors = new Map(); // id -> {embedding, metadata, content}
        this.index = null;
        this.dimension = 384; // Default dimension for embeddings
        this.isInitialized = false;
        this.collections = new Map(); // collection name -> vector IDs

        this.loadFromStorage();
    }

    /**
     * Initialize the vector store
     */
    async initialize() {
        try {
            console.log('🔧 Initializing vector store...');
            this.isInitialized = true;
            console.log('✅ Vector store initialized');
            return true;
        } catch (error) {
            console.error('❌ Vector store initialization failed:', error);
            return false;
        }
    }

    /**
     * Add a single vector to the store
     */
    async add(id, embedding, metadata = {}, content = '') {
        if (!Array.isArray(embedding)) {
            throw new Error('Embedding must be an array');
        }

        this.vectors.set(id, {
            embedding: embedding,
            metadata: metadata,
            content: content,
            addedAt: Date.now()
        });

        // Add to collection if specified
        const collection = metadata.collection || 'default';
        if (!this.collections.has(collection)) {
            this.collections.set(collection, new Set());
        }
        this.collections.get(collection).add(id);

        return id;
    }

    /**
     * Add multiple vectors in batch
     */
    async addBatch(items) {
        const ids = [];
        for (const item of items) {
            const id = item.id || this.generateId();
            await this.add(id, item.embedding, item.metadata, item.content);
            ids.push(id);
        }

        // Save after batch operation
        await this.saveToStorage();

        console.log(`✅ Added ${ids.length} vectors to store`);
        return ids;
    }

    /**
     * Search for similar vectors using cosine similarity
     */
    async search(queryEmbedding, options = {}) {
        const {
            topK = 5,
            collection = null,
            filter = null,
            minScore = 0.0
        } = options;

        if (!Array.isArray(queryEmbedding)) {
            throw new Error('Query embedding must be an array');
        }

        // Get relevant vector IDs
        let vectorIds = [];
        if (collection && this.collections.has(collection)) {
            vectorIds = Array.from(this.collections.get(collection));
        } else {
            vectorIds = Array.from(this.vectors.keys());
        }

        // Calculate similarities
        const results = [];
        for (const id of vectorIds) {
            const vector = this.vectors.get(id);

            // Apply metadata filter if provided
            if (filter && !this.matchesFilter(vector.metadata, filter)) {
                continue;
            }

            const similarity = this.cosineSimilarity(queryEmbedding, vector.embedding);

            if (similarity >= minScore) {
                results.push({
                    id: id,
                    score: similarity,
                    metadata: vector.metadata,
                    content: vector.content
                });
            }
        }

        // Sort by similarity score (descending)
        results.sort((a, b) => b.score - a.score);

        // Return top K results
        return results.slice(0, topK);
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(vecA, vecB) {
        if (vecA.length !== vecB.length) {
            throw new Error('Vectors must have the same dimension');
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        if (denominator === 0) {
            return 0;
        }

        return dotProduct / denominator;
    }

    /**
     * Check if metadata matches filter
     */
    matchesFilter(metadata, filter) {
        for (const [key, value] of Object.entries(filter)) {
            if (metadata[key] !== value) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get vector by ID
     */
    get(id) {
        return this.vectors.get(id);
    }

    /**
     * Delete vector by ID
     */
    delete(id) {
        const vector = this.vectors.get(id);
        if (vector) {
            // Remove from collections
            for (const [collName, ids] of this.collections.entries()) {
                ids.delete(id);
            }
        }
        return this.vectors.delete(id);
    }

    /**
     * Clear all vectors
     */
    clear() {
        this.vectors.clear();
        this.collections.clear();
        this.saveToStorage();
        console.log('🗑️ Vector store cleared');
    }

    /**
     * Get statistics
     */
    getStatistics() {
        const collections = {};
        for (const [name, ids] of this.collections.entries()) {
            collections[name] = ids.size;
        }

        return {
            totalVectors: this.vectors.size,
            dimension: this.dimension,
            collections: collections,
            memoryUsage: this.estimateMemoryUsage(),
            isInitialized: this.isInitialized
        };
    }

    /**
     * Estimate memory usage in MB
     */
    estimateMemoryUsage() {
        // Rough estimate: embedding (4 bytes per float) + metadata + content
        let totalBytes = 0;
        for (const vector of this.vectors.values()) {
            totalBytes += vector.embedding.length * 4; // floats
            totalBytes += JSON.stringify(vector.metadata).length;
            totalBytes += vector.content.length * 2; // UTF-16 chars
        }
        return (totalBytes / (1024 * 1024)).toFixed(2);
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `vec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Save to localStorage
     */
    async saveToStorage() {
        try {
            // Convert Map to array for storage
            const vectorsArray = Array.from(this.vectors.entries());
            const collectionsArray = Array.from(this.collections.entries()).map(
                ([name, ids]) => [name, Array.from(ids)]
            );

            const data = {
                vectors: vectorsArray,
                collections: collectionsArray,
                dimension: this.dimension,
                savedAt: Date.now()
            };

            localStorage.setItem('vectorStore', JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save vector store:', error);
            return false;
        }
    }

    /**
     * Load from localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('vectorStore');
            if (!stored) {
                return false;
            }

            const data = JSON.parse(stored);

            // Restore vectors
            this.vectors = new Map(data.vectors);

            // Restore collections
            this.collections = new Map(
                data.collections.map(([name, ids]) => [name, new Set(ids)])
            );

            this.dimension = data.dimension || 384;

            console.log(`✅ Loaded ${this.vectors.size} vectors from storage`);
            return true;
        } catch (error) {
            console.error('Failed to load vector store:', error);
            return false;
        }
    }

    /**
     * Export vectors to JSON
     */
    export() {
        const vectorsArray = Array.from(this.vectors.entries()).map(([id, data]) => ({
            id: id,
            embedding: data.embedding,
            metadata: data.metadata,
            content: data.content
        }));

        return {
            vectors: vectorsArray,
            statistics: this.getStatistics(),
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Import vectors from JSON
     */
    async import(data) {
        if (!data.vectors || !Array.isArray(data.vectors)) {
            throw new Error('Invalid import data format');
        }

        let imported = 0;
        for (const item of data.vectors) {
            await this.add(item.id, item.embedding, item.metadata, item.content);
            imported++;
        }

        await this.saveToStorage();
        console.log(`✅ Imported ${imported} vectors`);
        return imported;
    }
}

// Embedding Manager - handles embedding generation
class EmbeddingManager {
    constructor(vectorStore, llmService) {
        this.vectorStore = vectorStore;
        this.llmService = llmService;
        this.embeddingModel = 'text-embedding-3-small';
        this.dimension = 1536; // OpenAI embedding dimension
        this.cache = new Map(); // text -> embedding cache
    }

    /**
     * Generate embedding for text
     */
    async generateEmbedding(text) {
        // Check cache first
        if (this.cache.has(text)) {
            return this.cache.get(text);
        }

        // Check if LLM service is available and configured
        if (this.llmService && this.llmService.isConfigured) {
            try {
                const result = await this.llmService.generateEmbedding(text, this.embeddingModel);
                const embedding = result.embedding;

                // Cache the result
                this.cache.set(text, embedding);

                return embedding;
            } catch (error) {
                console.warn('⚠️ Failed to generate real embedding, using simulated:', error);
                return this.generateSimulatedEmbedding(text);
            }
        } else {
            // Use simulated embeddings if LLM not configured
            console.log('⚠️ LLM not configured, using simulated embeddings');
            return this.generateSimulatedEmbedding(text);
        }
    }

    /**
     * Generate simulated embedding (for testing without API)
     */
    generateSimulatedEmbedding(text) {
        // Simple deterministic embedding based on text features
        const embedding = new Array(384).fill(0);

        // Use text characteristics to create pseudo-embedding
        const words = text.toLowerCase().split(/\s+/);
        const chars = text.toLowerCase();

        for (let i = 0; i < words.length && i < 384; i++) {
            const word = words[i];
            const hash = this.simpleHash(word);
            embedding[i % 384] += Math.sin(hash) * 0.1;
        }

        for (let i = 0; i < chars.length && i < 384; i++) {
            embedding[i % 384] += Math.cos(chars.charCodeAt(i)) * 0.05;
        }

        // Normalize
        const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return embedding.map(val => val / (norm || 1));
    }

    /**
     * Simple hash function for deterministic embedding
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return hash;
    }

    /**
     * Generate embeddings for multiple texts
     */
    async generateEmbeddings(texts) {
        const embeddings = [];

        // Check if we can use batch API
        if (this.llmService && this.llmService.isConfigured && texts.length > 1) {
            try {
                const result = await this.llmService.generateEmbeddings(texts, this.embeddingModel);
                return result.embeddings;
            } catch (error) {
                console.warn('⚠️ Batch embedding failed, falling back to individual:', error);
            }
        }

        // Generate individually
        for (const text of texts) {
            const embedding = await this.generateEmbedding(text);
            embeddings.push(embedding);
        }

        return embeddings;
    }

    /**
     * Index NCERT data with embeddings
     */
    async indexNCERTData(dataProcessor) {
        console.log('🔧 Starting NCERT data indexing...');

        const startTime = Date.now();
        let indexed = 0;

        try {
            // Get all chunks from data processor
            const allChunks = dataProcessor.getAllChunks ? dataProcessor.getAllChunks() : [];

            if (allChunks.length === 0) {
                console.warn('⚠️ No NCERT data available to index');
                return { indexed: 0, timeTaken: 0 };
            }

            // Process in batches
            const batchSize = 10;
            for (let i = 0; i < allChunks.length; i += batchSize) {
                const batch = allChunks.slice(i, i + batchSize);
                const texts = batch.map(chunk => chunk.content);

                const embeddings = await this.generateEmbeddings(texts);

                // Add to vector store
                const items = batch.map((chunk, idx) => ({
                    id: `ncert_${chunk.metadata.subject}_${chunk.metadata.grade}_${i + idx}`,
                    embedding: embeddings[idx],
                    metadata: {
                        ...chunk.metadata,
                        collection: 'ncert',
                        indexed_at: Date.now()
                    },
                    content: chunk.content
                }));

                await this.vectorStore.addBatch(items);
                indexed += items.length;

                console.log(`📊 Indexed ${indexed}/${allChunks.length} chunks`);
            }

            const timeTaken = (Date.now() - startTime) / 1000;
            console.log(`✅ Indexing complete: ${indexed} chunks in ${timeTaken.toFixed(2)}s`);

            return {
                indexed: indexed,
                timeTaken: timeTaken,
                averageTime: timeTaken / indexed
            };

        } catch (error) {
            console.error('❌ Indexing failed:', error);
            throw error;
        }
    }

    /**
     * Search using embeddings
     */
    async search(query, options = {}) {
        const queryEmbedding = await this.generateEmbedding(query);
        return await this.vectorStore.search(queryEmbedding, {
            topK: options.topK || 5,
            collection: options.collection || 'ncert',
            filter: options.filter,
            minScore: options.minScore || 0.5
        });
    }

    /**
     * Get statistics
     */
    getStatistics() {
        return {
            ...this.vectorStore.getStatistics(),
            cacheSize: this.cache.size,
            embeddingModel: this.embeddingModel,
            dimension: this.dimension,
            usingRealEmbeddings: this.llmService && this.llmService.isConfigured
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Embedding cache cleared');
    }
}

// Create global instances
window.vectorStore = new VectorStore();
window.embeddingManager = new EmbeddingManager(window.vectorStore, window.llmService);

console.log('✅ Vector Store & Embedding Manager initialized');
