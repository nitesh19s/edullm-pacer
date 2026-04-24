/**
 * Enhanced Vector Store with Real Embeddings
 *
 * Integrates with Enhanced LLM Service for real OpenAI embeddings
 * Provides semantic search, document chunking, and batch processing
 *
 * @version 2.0.0
 * @author EduLLM Platform
 */

class EnhancedVectorStore {
    constructor() {
        // Core storage
        this.vectors = new Map(); // id -> {embedding, metadata, content}
        this.collections = new Map(); // collection -> Set of IDs
        this.documents = new Map(); // docId -> {chunks: [], metadata}

        // Configuration
        this.config = {
            dimension: 1536, // OpenAI text-embedding-3-small
            embeddingModel: 'text-embedding-3-small',
            chunkSize: 512,
            chunkOverlap: 50,
            batchSize: 100 // Process 100 chunks at a time
        };

        // Statistics
        this.stats = {
            totalVectors: 0,
            totalDocuments: 0,
            totalChunks: 0,
            embeddingsGenerated: 0,
            searchQueries: 0,
            lastUpdated: null
        };

        // Initialization
        this.isInitialized = false;
        this.isProcessing = false;

        this.loadFromStorage();
    }

    /**
     * Initialize the enhanced vector store
     */
    async initialize() {
        if (this.isInitialized) return true;

        try {
            console.log('🔧 Initializing Enhanced Vector Store...');

            // Check if LLM service is available
            const llmService = window.enhancedLLMService || window.llmService;
            if (!llmService) {
                console.warn('⚠️ LLM Service not available - embeddings will fail');
            } else if (!llmService.isProviderConfigured || !llmService.isProviderConfigured('openai')) {
                console.warn('⚠️ OpenAI not configured - embeddings require OpenAI API key');
            }

            this.isInitialized = true;
            console.log('✅ Enhanced Vector Store initialized');
            console.log(`   Vectors: ${this.vectors.size}`);
            console.log(`   Collections: ${this.collections.size}`);
            console.log(`   Documents: ${this.documents.size}`);

            return true;
        } catch (error) {
            console.error('❌ Enhanced Vector Store initialization failed:', error);
            return false;
        }
    }

    /**
     * Add document with automatic chunking and embedding
     */
    async addDocument(content, metadata = {}) {
        const docId = metadata.id || this.generateId('doc');

        console.log(`📄 Processing document: ${metadata.title || docId}`);

        try {
            // Chunk the document
            const chunks = this.chunkText(content, this.config.chunkSize, this.config.chunkOverlap);
            console.log(`   Created ${chunks.length} chunks`);

            // Generate embeddings for all chunks
            const chunkIds = [];

            for (let i = 0; i < chunks.length; i += this.config.batchSize) {
                const batch = chunks.slice(i, Math.min(i + this.config.batchSize, chunks.length));

                console.log(`   Embedding batch ${Math.floor(i / this.config.batchSize) + 1}/${Math.ceil(chunks.length / this.config.batchSize)}...`);

                // Generate embeddings
                const embeddings = await this.generateEmbeddings(batch);

                // Add to vector store
                for (let j = 0; j < batch.length; j++) {
                    const chunkId = `${docId}_chunk_${i + j}`;
                    const chunkMetadata = {
                        ...metadata,
                        documentId: docId,
                        chunkIndex: i + j,
                        chunkCount: chunks.length,
                        collection: metadata.collection || 'default'
                    };

                    await this.addVector(chunkId, embeddings[j], chunkMetadata, batch[j]);
                    chunkIds.push(chunkId);
                }
            }

            // Store document metadata
            this.documents.set(docId, {
                chunks: chunkIds,
                metadata: metadata,
                content: content,
                addedAt: Date.now()
            });

            this.stats.totalDocuments++;
            this.stats.totalChunks += chunks.length;
            this.stats.lastUpdated = Date.now();

            await this.saveToStorage();

            console.log(`✅ Document added: ${chunkIds.length} chunks embedded`);

            return {
                documentId: docId,
                chunkIds: chunkIds,
                chunkCount: chunks.length
            };

        } catch (error) {
            console.error(`❌ Failed to add document:`, error);
            throw error;
        }
    }

    /**
     * Chunk text into overlapping segments
     */
    chunkText(text, chunkSize = 512, overlap = 50) {
        const chunks = [];
        const words = text.split(/\s+/);

        let start = 0;
        while (start < words.length) {
            const end = Math.min(start + chunkSize, words.length);
            const chunk = words.slice(start, end).join(' ');

            if (chunk.trim().length > 0) {
                chunks.push(chunk);
            }

            // Move forward by (chunkSize - overlap) words
            start += (chunkSize - overlap);

            // Break if we can't make meaningful progress
            if (start >= words.length) break;
        }

        return chunks.length > 0 ? chunks : [text]; // Fallback to whole text
    }

    /**
     * Generate embeddings using LLM service or local models
     */
    async generateEmbeddings(texts) {
        // Convert single text to array
        const textArray = Array.isArray(texts) ? texts : [texts];

        // Try local model manager first (free!)
        if (window.localModelManager && window.localModelManager.isInitialized()) {
            try {
                console.log('📐 Using local embeddings (FREE)');
                const embeddings = await window.localModelManager.generateEmbeddings(textArray);

                this.stats.embeddingsGenerated += textArray.length;

                // Update dimension based on first embedding
                if (embeddings && embeddings.length > 0 && embeddings[0].length !== this.config.dimension) {
                    console.log(`📏 Updating dimension: ${this.config.dimension} → ${embeddings[0].length}`);
                    this.config.dimension = embeddings[0].length;
                }

                return embeddings;
            } catch (localError) {
                console.warn('⚠️ Local embedding failed, trying API service:', localError.message);
            }
        }

        // Fallback to API-based LLM service
        const llmService = window.enhancedLLMService || window.llmService;

        if (!llmService) {
            throw new Error('No embedding service available. Configure either:\n1. Local models (Settings → Local AI Models) - FREE\n2. API service (Settings → LLM Configuration) - Paid');
        }

        if (!llmService.generateEmbeddings) {
            throw new Error('Embedding generation not supported by LLM service');
        }

        try {
            // Generate embeddings using API
            console.log('📐 Using API embeddings (costs apply)');
            const result = await llmService.generateEmbeddings(textArray, this.config.embeddingModel);

            this.stats.embeddingsGenerated += textArray.length;

            // Update dimension if different
            if (result.dimensions && result.dimensions !== this.config.dimension) {
                console.log(`📏 Updating dimension: ${this.config.dimension} → ${result.dimensions}`);
                this.config.dimension = result.dimensions;
            }

            return result.embeddings;
        } catch (error) {
            console.error('❌ Embedding generation failed:', error);
            throw new Error(`Failed to generate embeddings: ${error.message}`);
        }
    }

    /**
     * Add a single vector (internal use)
     */
    async addVector(id, embedding, metadata = {}, content = '') {
        if (!Array.isArray(embedding)) {
            throw new Error('Embedding must be an array');
        }

        this.vectors.set(id, {
            embedding: embedding,
            metadata: metadata,
            content: content,
            addedAt: Date.now()
        });

        // Add to collection
        const collection = metadata.collection || 'default';
        if (!this.collections.has(collection)) {
            this.collections.set(collection, new Set());
        }
        this.collections.get(collection).add(id);

        this.stats.totalVectors++;

        return id;
    }

    /**
     * Semantic search with real embeddings
     */
    async search(query, options = {}) {
        const {
            topK = 5,
            collection = null,
            filter = null,
            minScore = 0.0,
            includeContent = true
        } = options;

        this.stats.searchQueries++;

        try {
            // Generate embedding for query
            console.log(`🔍 Searching: "${query.substring(0, 50)}..."`);
            const queryEmbeddings = await this.generateEmbeddings([query]);
            const queryEmbedding = queryEmbeddings[0];

            // Get relevant vector IDs
            let vectorIds = [];
            if (collection && this.collections.has(collection)) {
                vectorIds = Array.from(this.collections.get(collection));
            } else {
                vectorIds = Array.from(this.vectors.keys());
            }

            console.log(`   Searching through ${vectorIds.length} vectors...`);

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
                        content: includeContent ? vector.content : undefined
                    });
                }
            }

            // Sort by similarity score (descending)
            results.sort((a, b) => b.score - a.score);

            // Return top K results
            const topResults = results.slice(0, topK);

            console.log(`✅ Found ${topResults.length} results (scores: ${topResults.map(r => r.score.toFixed(3)).join(', ')})`);

            return topResults;

        } catch (error) {
            console.error('❌ Search failed:', error);
            throw error;
        }
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(vecA, vecB) {
        if (vecA.length !== vecB.length) {
            throw new Error(`Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`);
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
     * Get document by ID
     */
    getDocument(docId) {
        return this.documents.get(docId);
    }

    /**
     * Delete document and all its chunks
     */
    async deleteDocument(docId) {
        const doc = this.documents.get(docId);
        if (!doc) {
            return false;
        }

        // Delete all chunks
        for (const chunkId of doc.chunks) {
            this.deleteVector(chunkId);
        }

        this.documents.delete(docId);
        this.stats.totalDocuments--;

        await this.saveToStorage();

        console.log(`🗑️ Deleted document ${docId} and ${doc.chunks.length} chunks`);
        return true;
    }

    /**
     * Delete a single vector
     */
    deleteVector(id) {
        const vector = this.vectors.get(id);
        if (vector) {
            // Remove from collections
            for (const [collName, ids] of this.collections.entries()) {
                ids.delete(id);
            }

            this.stats.totalVectors--;
        }
        return this.vectors.delete(id);
    }

    /**
     * Clear all data
     */
    clear() {
        this.vectors.clear();
        this.collections.clear();
        this.documents.clear();

        this.stats = {
            totalVectors: 0,
            totalDocuments: 0,
            totalChunks: 0,
            embeddingsGenerated: 0,
            searchQueries: 0,
            lastUpdated: null
        };

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
            ...this.stats,
            totalVectors: this.vectors.size,
            totalDocuments: this.documents.size,
            dimension: this.config.dimension,
            collections: collections,
            memoryUsageMB: this.estimateMemoryUsage(),
            isInitialized: this.isInitialized,
            config: { ...this.config }
        };
    }

    /**
     * Estimate memory usage in MB
     */
    estimateMemoryUsage() {
        let totalBytes = 0;

        // Vectors
        for (const vector of this.vectors.values()) {
            totalBytes += vector.embedding.length * 4; // 4 bytes per float32
            totalBytes += JSON.stringify(vector.metadata).length;
            totalBytes += vector.content.length * 2; // UTF-16 chars
        }

        // Documents
        for (const doc of this.documents.values()) {
            totalBytes += doc.content.length * 2;
            totalBytes += JSON.stringify(doc.metadata).length;
        }

        return (totalBytes / (1024 * 1024)).toFixed(2);
    }

    /**
     * Generate unique ID
     */
    generateId(prefix = 'vec') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Save to localStorage
     */
    async saveToStorage() {
        try {
            // Convert Maps to arrays for storage
            const data = {
                vectors: Array.from(this.vectors.entries()),
                collections: Array.from(this.collections.entries()).map(
                    ([name, ids]) => [name, Array.from(ids)]
                ),
                documents: Array.from(this.documents.entries()),
                config: this.config,
                stats: this.stats,
                savedAt: Date.now()
            };

            localStorage.setItem('enhancedVectorStore', JSON.stringify(data));

            // Also update old storage for backward compatibility
            localStorage.setItem('vectorStore', JSON.stringify({
                vectors: data.vectors,
                collections: data.collections,
                dimension: this.config.dimension,
                savedAt: data.savedAt
            }));

            return true;
        } catch (error) {
            console.error('Failed to save vector store:', error);

            // Handle quota exceeded
            if (error.name === 'QuotaExceededError') {
                console.warn('⚠️ localStorage quota exceeded - consider clearing old data');
            }

            return false;
        }
    }

    /**
     * Load from localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('enhancedVectorStore');
            if (!stored) {
                // Try old format
                const oldStored = localStorage.getItem('vectorStore');
                if (oldStored) {
                    return this.loadOldFormat(oldStored);
                }
                return false;
            }

            const data = JSON.parse(stored);

            // Restore vectors
            this.vectors = new Map(data.vectors || []);

            // Restore collections
            this.collections = new Map(
                (data.collections || []).map(([name, ids]) => [name, new Set(ids)])
            );

            // Restore documents
            this.documents = new Map(data.documents || []);

            // Restore config
            if (data.config) {
                this.config = { ...this.config, ...data.config };
            }

            // Restore stats
            if (data.stats) {
                this.stats = { ...this.stats, ...data.stats };
            }

            console.log(`✅ Loaded Enhanced Vector Store from storage`);
            console.log(`   Vectors: ${this.vectors.size}`);
            console.log(`   Documents: ${this.documents.size}`);

            return true;
        } catch (error) {
            console.error('Failed to load vector store:', error);
            return false;
        }
    }

    /**
     * Load old format for backward compatibility
     */
    loadOldFormat(stored) {
        try {
            const data = JSON.parse(stored);

            this.vectors = new Map(data.vectors || []);
            this.collections = new Map(
                (data.collections || []).map(([name, ids]) => [name, new Set(ids)])
            );
            this.config.dimension = data.dimension || 1536;

            console.log(`✅ Migrated ${this.vectors.size} vectors from old format`);
            return true;
        } catch (error) {
            console.error('Failed to load old format:', error);
            return false;
        }
    }

    /**
     * Export to JSON
     */
    exportToJSON() {
        const data = {
            vectors: Array.from(this.vectors.entries()).map(([id, v]) => ({
                id,
                embedding: v.embedding,
                metadata: v.metadata,
                content: v.content
            })),
            documents: Array.from(this.documents.entries()).map(([id, d]) => ({
                id,
                ...d
            })),
            config: this.config,
            stats: this.stats,
            exportedAt: new Date().toISOString()
        };

        return JSON.stringify(data, null, 2);
    }

    /**
     * Import from JSON
     */
    async importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            // Import vectors
            for (const v of data.vectors) {
                await this.addVector(v.id, v.embedding, v.metadata, v.content);
            }

            // Import documents
            for (const d of data.documents) {
                this.documents.set(d.id, {
                    chunks: d.chunks,
                    metadata: d.metadata,
                    content: d.content,
                    addedAt: d.addedAt
                });
            }

            await this.saveToStorage();

            console.log(`✅ Imported ${data.vectors.length} vectors and ${data.documents.length} documents`);
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    }
}

// Create global instance
window.enhancedVectorStore = new EnhancedVectorStore();

// Alias for backward compatibility
if (!window.vectorStore) {
    window.vectorStore = window.enhancedVectorStore;
}

console.log('✅ Enhanced Vector Store module loaded');
