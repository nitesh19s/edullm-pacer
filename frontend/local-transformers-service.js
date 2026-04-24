/**
 * Local Transformers.js Service
 * Runs AI models directly in the browser using Transformers.js
 * No backend required, 100% client-side, works offline
 *
 * Note: Requires Transformers.js library to be loaded
 * Add to HTML: <script type="module" src="https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.0"></script>
 */

class LocalTransformersService {
    constructor() {
        this.initialized = false;
        this.available = false;
        this.embedder = null;
        this.generator = null;

        // Configuration
        this.config = {
            embeddingModel: 'Xenova/all-MiniLM-L6-v2',      // 80MB, 384-dim
            generationModel: 'Xenova/flan-t5-small',         // 300MB
            maxLength: 512,
            temperature: 0.7
        };

        // Model loading status
        this.loadingStatus = {
            embedder: 'not-loaded',  // not-loaded, loading, loaded, error
            generator: 'not-loaded'
        };

        // Statistics
        this.stats = {
            totalEmbeddings: 0,
            totalGenerations: 0,
            totalProcessingTime: 0,
            avgEmbeddingTime: 0,
            avgGenerationTime: 0,
            modelsLoaded: 0
        };
    }

    /**
     * Initialize the service and check if Transformers.js is available
     */
    async initialize() {
        console.log('🌐 Initializing Browser-Based Transformers.js Service...');

        try {
            // Check if Transformers.js is available
            if (typeof window.transformers === 'undefined') {
                console.warn('⚠️ Transformers.js not loaded');
                console.log('💡 Add to HTML: <script type="module">');
                console.log('    import * as transformers from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.0";');
                console.log('    window.transformers = transformers;');
                console.log('  </script>');
                this.available = false;
                return false;
            }

            this.available = true;
            this.initialized = true;
            console.log('✅ Transformers.js is available');
            console.log('💡 Models will be loaded on first use (lazy loading)');

            return true;

        } catch (error) {
            console.error('❌ Transformers.js initialization error:', error);
            this.available = false;
            return false;
        }
    }

    /**
     * Load embedding model (lazy loading)
     */
    async loadEmbeddingModel() {
        if (this.embedder) {
            return this.embedder;
        }

        if (this.loadingStatus.embedder === 'loading') {
            // Wait for loading to complete
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if (this.loadingStatus.embedder === 'loaded') {
                        clearInterval(checkInterval);
                        resolve(this.embedder);
                    } else if (this.loadingStatus.embedder === 'error') {
                        clearInterval(checkInterval);
                        resolve(null);
                    }
                }, 100);
            });
        }

        console.log('📥 Loading embedding model (80MB, ~10-30 seconds)...');
        this.loadingStatus.embedder = 'loading';

        try {
            const { pipeline } = window.transformers;

            this.embedder = await pipeline(
                'feature-extraction',
                this.config.embeddingModel,
                {
                    quantized: true,  // Use quantized version for smaller size
                    progress_callback: (progress) => {
                        if (progress.status === 'progress') {
                            const percent = Math.round((progress.loaded / progress.total) * 100);
                            console.log(`📥 Downloading model: ${percent}%`);
                        }
                    }
                }
            );

            this.loadingStatus.embedder = 'loaded';
            this.stats.modelsLoaded++;
            console.log('✅ Embedding model loaded successfully');

            return this.embedder;

        } catch (error) {
            console.error('❌ Failed to load embedding model:', error);
            this.loadingStatus.embedder = 'error';
            throw error;
        }
    }

    /**
     * Load generation model (lazy loading)
     */
    async loadGenerationModel() {
        if (this.generator) {
            return this.generator;
        }

        if (this.loadingStatus.generator === 'loading') {
            // Wait for loading to complete
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if (this.loadingStatus.generator === 'loaded') {
                        clearInterval(checkInterval);
                        resolve(this.generator);
                    } else if (this.loadingStatus.generator === 'error') {
                        clearInterval(checkInterval);
                        resolve(null);
                    }
                }, 100);
            });
        }

        console.log('📥 Loading generation model (300MB, ~30-60 seconds)...');
        this.loadingStatus.generator = 'loading';

        try {
            const { pipeline } = window.transformers;

            this.generator = await pipeline(
                'text2text-generation',
                this.config.generationModel,
                {
                    quantized: true,
                    progress_callback: (progress) => {
                        if (progress.status === 'progress') {
                            const percent = Math.round((progress.loaded / progress.total) * 100);
                            console.log(`📥 Downloading model: ${percent}%`);
                        }
                    }
                }
            );

            this.loadingStatus.generator = 'loaded';
            this.stats.modelsLoaded++;
            console.log('✅ Generation model loaded successfully');

            return this.generator;

        } catch (error) {
            console.error('❌ Failed to load generation model:', error);
            this.loadingStatus.generator = 'error';
            throw error;
        }
    }

    /**
     * Generate embedding for a single text
     * @param {string} text - Text to embed
     * @returns {Promise<number[]>} - Embedding vector (384-dim)
     */
    async generateEmbedding(text) {
        if (!this.available) {
            throw new Error('Transformers.js not available');
        }

        const startTime = Date.now();

        try {
            // Load model if not loaded
            const embedder = await this.loadEmbeddingModel();

            // Generate embedding
            const output = await embedder(text, {
                pooling: 'mean',
                normalize: true
            });

            // Convert to regular array
            const embedding = Array.from(output.data);

            // Update stats
            const duration = Date.now() - startTime;
            this.stats.totalEmbeddings++;
            this.stats.totalProcessingTime += duration;
            this.stats.avgEmbeddingTime = this.stats.totalProcessingTime / this.stats.totalEmbeddings;

            return embedding;

        } catch (error) {
            console.error('❌ Embedding generation error:', error);
            throw error;
        }
    }

    /**
     * Generate embeddings for multiple texts
     * @param {string[]} texts - Array of texts
     * @returns {Promise<number[][]>} - Array of embeddings
     */
    async generateEmbeddings(texts) {
        console.log(`📊 Generating embeddings for ${texts.length} texts...`);

        const embeddings = [];

        for (let i = 0; i < texts.length; i++) {
            const embedding = await this.generateEmbedding(texts[i]);
            embeddings.push(embedding);

            if ((i + 1) % 10 === 0) {
                console.log(`✅ Processed ${i + 1}/${texts.length}`);
            }
        }

        console.log(`✅ All ${texts.length} embeddings generated`);
        return embeddings;
    }

    /**
     * Generate text using local model
     * @param {string} prompt - The prompt
     * @param {object} options - Generation options
     * @returns {Promise<object>} - Generated response
     */
    async generateText(prompt, options = {}) {
        if (!this.available) {
            throw new Error('Transformers.js not available');
        }

        const startTime = Date.now();

        try {
            // Load model if not loaded
            const generator = await this.loadGenerationModel();

            // Generate text
            const output = await generator(prompt, {
                max_length: options.maxTokens || this.config.maxLength,
                temperature: options.temperature || this.config.temperature,
                do_sample: true,
                top_k: 50,
                top_p: 0.95
            });

            const generatedText = output[0].generated_text;

            // Update stats
            const duration = Date.now() - startTime;
            this.stats.totalGenerations++;
            this.stats.totalProcessingTime += duration;
            this.stats.avgGenerationTime = this.stats.totalProcessingTime / this.stats.totalGenerations;

            return {
                content: generatedText,
                model: this.config.generationModel,
                provider: 'transformers-browser',
                usage: {
                    prompt_tokens: Math.ceil(prompt.length / 4),
                    completion_tokens: Math.ceil(generatedText.length / 4),
                    total_tokens: Math.ceil((prompt.length + generatedText.length) / 4)
                },
                finishReason: 'stop',
                metadata: {
                    duration: duration,
                    browser: true
                }
            };

        } catch (error) {
            console.error('❌ Text generation error:', error);
            throw error;
        }
    }

    /**
     * Generate RAG-enhanced answer
     * @param {string} query - User question
     * @param {string} context - Retrieved context
     * @param {object} options - Generation options
     */
    async generateRAGAnswer(query, context, options = {}) {
        const prompt = `Context: ${context}\n\nQuestion: ${query}\n\nAnswer:`;
        return await this.generateText(prompt, options);
    }

    /**
     * Check if models are loaded
     */
    isModelLoaded(type) {
        if (type === 'embedder') {
            return this.loadingStatus.embedder === 'loaded';
        } else if (type === 'generator') {
            return this.loadingStatus.generator === 'loaded';
        }
        return false;
    }

    /**
     * Get loading status
     */
    getLoadingStatus() {
        return this.loadingStatus;
    }

    /**
     * Get statistics
     */
    getStatistics() {
        return {
            ...this.stats,
            available: this.available,
            loadingStatus: this.loadingStatus,
            embeddingModel: this.config.embeddingModel,
            generationModel: this.config.generationModel
        };
    }

    /**
     * Check if service is available
     */
    isAvailable() {
        return this.available;
    }

    /**
     * Update configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        console.log('⚙️ Transformers.js config updated:', this.config);
    }

    /**
     * Reset statistics
     */
    resetStatistics() {
        this.stats = {
            totalEmbeddings: 0,
            totalGenerations: 0,
            totalProcessingTime: 0,
            avgEmbeddingTime: 0,
            avgGenerationTime: 0,
            modelsLoaded: this.stats.modelsLoaded
        };
        console.log('📊 Statistics reset');
    }

    /**
     * Unload models to free memory
     */
    unloadModels() {
        this.embedder = null;
        this.generator = null;
        this.loadingStatus.embedder = 'not-loaded';
        this.loadingStatus.generator = 'not-loaded';
        console.log('🗑️ Models unloaded from memory');
    }
}

// Initialize global instance
window.localTransformersService = new LocalTransformersService();

console.log('🌐 Local Transformers.js Service loaded');
