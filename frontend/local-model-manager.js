/**
 * Local Model Manager
 * Unified interface for local AI models
 * Automatically selects best available option: Ollama (preferred) or Transformers.js (fallback)
 */

class LocalModelManager {
    constructor() {
        this.initialized = false;
        this.preferredProvider = 'ollama';  // 'ollama' or 'transformers'
        this.activeProvider = null;

        // Configuration
        this.config = {
            autoFallback: true,           // Automatically fallback if preferred fails
            preferOllama: true,            // Prefer Ollama over browser models
            cacheEmbeddings: true,         // Cache embeddings in localStorage
            maxCacheSize: 1000             // Max cached embeddings
        };

        // Embedding cache
        this.embeddingCache = new Map();
        this.loadEmbeddingCache();

        // Statistics
        this.stats = {
            totalRequests: 0,
            ollamaRequests: 0,
            transformersRequests: 0,
            cacheHits: 0,
            errors: 0
        };
    }

    /**
     * Initialize both services and select best option
     */
    async initialize() {
        console.log('🚀 Initializing Local Model Manager...');

        try {
            // Initialize both services
            let ollamaAvailable = false;
            let transformersAvailable = false;

            // Check Ollama
            if (window.localOllamaService) {
                ollamaAvailable = await window.localOllamaService.initialize();
            }

            // Check Transformers.js
            if (window.localTransformersService) {
                transformersAvailable = await window.localTransformersService.initialize();
            }

            // Select provider
            if (ollamaAvailable && this.config.preferOllama) {
                this.activeProvider = 'ollama';
                console.log('✅ Using Ollama (local server)');
            } else if (transformersAvailable) {
                this.activeProvider = 'transformers';
                console.log('✅ Using Transformers.js (browser)');
            } else {
                console.error('❌ No local models available');
                console.log('💡 Install Ollama or enable Transformers.js');
                this.initialized = true;
                return false;
            }

            this.initialized = true;
            console.log(`✅ Local Model Manager ready (Provider: ${this.activeProvider})`);

            return true;

        } catch (error) {
            console.error('❌ Local Model Manager initialization error:', error);
            return false;
        }
    }

    /**
     * Generate embedding (with caching)
     * @param {string} text - Text to embed
     * @returns {Promise<number[]>} - Embedding vector
     */
    async generateEmbedding(text) {
        if (!this.initialized) {
            throw new Error('Local Model Manager not initialized');
        }

        this.stats.totalRequests++;

        // Check cache first
        if (this.config.cacheEmbeddings) {
            const cacheKey = this.getCacheKey(text);
            if (this.embeddingCache.has(cacheKey)) {
                this.stats.cacheHits++;
                console.log('✅ Cache hit for embedding');
                return this.embeddingCache.get(cacheKey);
            }
        }

        try {
            let embedding;

            // Try active provider
            if (this.activeProvider === 'ollama') {
                embedding = await window.localOllamaService.generateEmbedding(text);
                this.stats.ollamaRequests++;
            } else if (this.activeProvider === 'transformers') {
                embedding = await window.localTransformersService.generateEmbedding(text);
                this.stats.transformersRequests++;
            }

            // Cache the result
            if (this.config.cacheEmbeddings && embedding) {
                const cacheKey = this.getCacheKey(text);
                this.embeddingCache.set(cacheKey, embedding);
                this.saveEmbeddingCache();
            }

            return embedding;

        } catch (error) {
            this.stats.errors++;
            console.error('❌ Embedding generation error:', error);

            // Try fallback if enabled
            if (this.config.autoFallback && this.activeProvider === 'ollama') {
                console.log('⚠️ Trying fallback to Transformers.js...');
                try {
                    const embedding = await window.localTransformersService.generateEmbedding(text);
                    this.stats.transformersRequests++;
                    return embedding;
                } catch (fallbackError) {
                    console.error('❌ Fallback also failed:', fallbackError);
                    throw fallbackError;
                }
            }

            throw error;
        }
    }

    /**
     * Generate embeddings for multiple texts
     * @param {string[]} texts - Array of texts
     * @returns {Promise<number[][]>} - Array of embeddings
     */
    async generateEmbeddings(texts) {
        if (!this.initialized) {
            throw new Error('Local Model Manager not initialized');
        }

        console.log(`📊 Generating ${texts.length} embeddings...`);

        try {
            if (this.activeProvider === 'ollama') {
                return await window.localOllamaService.generateEmbeddings(texts);
            } else if (this.activeProvider === 'transformers') {
                return await window.localTransformersService.generateEmbeddings(texts);
            }
        } catch (error) {
            this.stats.errors++;
            console.error('❌ Batch embedding error:', error);
            throw error;
        }
    }

    /**
     * Generate text
     * @param {string} prompt - The prompt
     * @param {object} options - Generation options
     * @returns {Promise<object>} - Generated response
     */
    async generateText(prompt, options = {}) {
        if (!this.initialized) {
            throw new Error('Local Model Manager not initialized');
        }

        this.stats.totalRequests++;

        try {
            let response;

            if (this.activeProvider === 'ollama') {
                response = await window.localOllamaService.generateText(prompt, options);
                this.stats.ollamaRequests++;
            } else if (this.activeProvider === 'transformers') {
                response = await window.localTransformersService.generateText(prompt, options);
                this.stats.transformersRequests++;
            }

            return response;

        } catch (error) {
            this.stats.errors++;
            console.error('❌ Text generation error:', error);

            // Try fallback if enabled
            if (this.config.autoFallback && this.activeProvider === 'ollama') {
                console.log('⚠️ Trying fallback to Transformers.js...');
                try {
                    const response = await window.localTransformersService.generateText(prompt, options);
                    this.stats.transformersRequests++;
                    return response;
                } catch (fallbackError) {
                    console.error('❌ Fallback also failed:', fallbackError);
                    throw fallbackError;
                }
            }

            throw error;
        }
    }

    /**
     * Generate text with streaming (Ollama only)
     * @param {string} prompt - The prompt
     * @param {function} onChunk - Callback for chunks
     * @param {object} options - Options
     */
    async generateStream(prompt, onChunk, options = {}) {
        if (!this.initialized) {
            throw new Error('Local Model Manager not initialized');
        }

        if (this.activeProvider !== 'ollama') {
            throw new Error('Streaming only supported with Ollama');
        }

        return await window.localOllamaService.generateStream(prompt, onChunk, options);
    }

    /**
     * Generate RAG answer
     * @param {string} query - User question
     * @param {string} context - Retrieved context
     * @param {object} options - Options
     */
    async generateRAGAnswer(query, context, options = {}) {
        if (!this.initialized) {
            throw new Error('Local Model Manager not initialized');
        }

        try {
            if (this.activeProvider === 'ollama') {
                return await window.localOllamaService.generateRAGAnswer(query, context, options);
            } else if (this.activeProvider === 'transformers') {
                return await window.localTransformersService.generateRAGAnswer(query, context, options);
            }
        } catch (error) {
            this.stats.errors++;
            console.error('❌ RAG answer generation error:', error);
            throw error;
        }
    }

    /**
     * Switch provider
     * @param {string} provider - 'ollama' or 'transformers'
     */
    async switchProvider(provider) {
        if (provider !== 'ollama' && provider !== 'transformers') {
            throw new Error('Invalid provider. Use "ollama" or "transformers"');
        }

        // Check if provider is available
        let available = false;
        if (provider === 'ollama') {
            available = window.localOllamaService && window.localOllamaService.isAvailable();
        } else if (provider === 'transformers') {
            available = window.localTransformersService && window.localTransformersService.isAvailable();
        }

        if (!available) {
            throw new Error(`Provider "${provider}" is not available`);
        }

        this.activeProvider = provider;
        console.log(`✅ Switched to ${provider}`);
    }

    /**
     * Get cache key for text
     */
    getCacheKey(text) {
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `emb_${hash}_${this.activeProvider}`;
    }

    /**
     * Load embedding cache from localStorage
     */
    loadEmbeddingCache() {
        try {
            const cached = localStorage.getItem('local_embedding_cache');
            if (cached) {
                const data = JSON.parse(cached);
                this.embeddingCache = new Map(Object.entries(data));
                console.log(`📥 Loaded ${this.embeddingCache.size} cached embeddings`);
            }
        } catch (error) {
            console.warn('Failed to load embedding cache:', error);
        }
    }

    /**
     * Save embedding cache to localStorage
     */
    saveEmbeddingCache() {
        try {
            // Limit cache size
            if (this.embeddingCache.size > this.config.maxCacheSize) {
                const entries = Array.from(this.embeddingCache.entries());
                const trimmed = entries.slice(-this.config.maxCacheSize);
                this.embeddingCache = new Map(trimmed);
            }

            const data = Object.fromEntries(this.embeddingCache);
            localStorage.setItem('local_embedding_cache', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save embedding cache:', error);
        }
    }

    /**
     * Clear embedding cache
     */
    clearCache() {
        this.embeddingCache.clear();
        localStorage.removeItem('local_embedding_cache');
        console.log('🗑️ Embedding cache cleared');
    }

    /**
     * Get combined statistics
     */
    getStatistics() {
        const stats = { ...this.stats };

        // Add provider-specific stats
        if (window.localOllamaService) {
            stats.ollama = window.localOllamaService.getStatistics();
        }
        if (window.localTransformersService) {
            stats.transformers = window.localTransformersService.getStatistics();
        }

        stats.activeProvider = this.activeProvider;
        stats.cacheSize = this.embeddingCache.size;

        return stats;
    }

    /**
     * Check if a provider is available
     */
    isProviderAvailable(provider) {
        if (provider === 'ollama') {
            return window.localOllamaService && window.localOllamaService.isAvailable();
        } else if (provider === 'transformers') {
            return window.localTransformersService && window.localTransformersService.isAvailable();
        }
        return false;
    }

    /**
     * Get active provider
     */
    getActiveProvider() {
        return this.activeProvider;
    }

    /**
     * Check if initialized
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Update configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        console.log('⚙️ Config updated:', this.config);
    }

    /**
     * Reset statistics
     */
    resetStatistics() {
        this.stats = {
            totalRequests: 0,
            ollamaRequests: 0,
            transformersRequests: 0,
            cacheHits: 0,
            errors: 0
        };

        if (window.localOllamaService) {
            window.localOllamaService.resetStatistics();
        }
        if (window.localTransformersService) {
            window.localTransformersService.resetStatistics();
        }

        console.log('📊 All statistics reset');
    }
}

// Initialize global instance
window.localModelManager = new LocalModelManager();

console.log('🚀 Local Model Manager loaded');
