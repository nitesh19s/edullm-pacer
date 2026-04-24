/**
 * Local Ollama Service
 * Provides local LLM and embedding capabilities without API costs
 * Uses Ollama running locally on port 11434
 */

class LocalOllamaService {
    constructor() {
        this.baseURL = 'http://localhost:11434';
        this.initialized = false;
        this.available = false;

        // Default models
        this.config = {
            embeddingModel: 'nomic-embed-text',
            generationModel: 'llama3.2:latest', // 2GB, fast and good quality
            temperature: 0.7,
            maxTokens: 2000
        };

        // Statistics tracking
        this.stats = {
            totalRequests: 0,
            totalEmbeddings: 0,
            totalGenerations: 0,
            totalTokens: 0,
            errors: 0,
            avgResponseTime: 0,
            totalResponseTime: 0
        };

        // Available models cache
        this.availableModels = [];
    }

    /**
     * Initialize and check if Ollama is running
     */
    async initialize() {
        console.log('🤖 Initializing Local Ollama Service...');

        try {
            // Check if Ollama is running
            const response = await fetch(`${this.baseURL}/api/tags`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                this.availableModels = data.models || [];
                this.available = true;
                this.initialized = true;

                console.log('✅ Ollama is running');
                console.log(`📦 Available models: ${this.availableModels.map(m => m.name).join(', ')}`);

                // Check if required models are available
                this.checkRequiredModels();

                return true;
            } else {
                throw new Error('Ollama not responding');
            }
        } catch (error) {
            console.warn('⚠️ Ollama not available:', error.message);
            console.log('💡 To use local models, install Ollama from https://ollama.com');
            this.available = false;
            this.initialized = true;
            return false;
        }
    }

    /**
     * Check if required models are installed
     */
    checkRequiredModels() {
        const embeddingModelExists = this.availableModels.some(
            m => m.name.includes(this.config.embeddingModel)
        );
        const generationModelExists = this.availableModels.some(
            m => m.name.includes('llama') || m.name.includes('mistral')
        );

        if (!embeddingModelExists) {
            console.warn(`⚠️ Embedding model '${this.config.embeddingModel}' not found`);
            console.log('Run: ollama pull nomic-embed-text');
        }

        if (!generationModelExists) {
            console.warn(`⚠️ Generation model not found`);
            console.log('Run: ollama pull llama3.2');
        }
    }

    /**
     * Generate embeddings for a single text
     * @param {string} text - Text to embed
     * @returns {Promise<number[]>} - Embedding vector
     */
    async generateEmbedding(text) {
        if (!this.available) {
            throw new Error('Ollama service not available');
        }

        const startTime = Date.now();

        try {
            const response = await fetch(`${this.baseURL}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.config.embeddingModel,
                    prompt: text
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            const data = await response.json();

            // Update stats
            const duration = Date.now() - startTime;
            this.updateStats('embedding', duration);

            return data.embedding; // Returns 768-dimensional vector

        } catch (error) {
            this.stats.errors++;
            console.error('❌ Embedding generation error:', error);
            throw error;
        }
    }

    /**
     * Generate embeddings for multiple texts (batch)
     * @param {string[]} texts - Array of texts to embed
     * @returns {Promise<number[][]>} - Array of embedding vectors
     */
    async generateEmbeddings(texts) {
        console.log(`📊 Generating embeddings for ${texts.length} texts...`);

        const embeddings = [];
        const batchSize = 10; // Process 10 at a time

        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            const batchPromises = batch.map(text => this.generateEmbedding(text));
            const batchResults = await Promise.all(batchPromises);
            embeddings.push(...batchResults);

            console.log(`✅ Processed ${Math.min(i + batchSize, texts.length)}/${texts.length}`);
        }

        return embeddings;
    }

    /**
     * Generate text using local LLM
     * @param {string} prompt - The prompt to generate from
     * @param {object} options - Generation options
     * @returns {Promise<object>} - Generated response
     */
    async generateText(prompt, options = {}) {
        if (!this.available) {
            throw new Error('Ollama service not available');
        }

        const startTime = Date.now();

        const requestBody = {
            model: options.model || this.config.generationModel,
            prompt: prompt,
            stream: false,
            options: {
                temperature: options.temperature || this.config.temperature,
                num_predict: options.maxTokens || this.config.maxTokens,
                top_p: options.topP || 0.9,
                stop: options.stop || []
            }
        };

        try {
            const response = await fetch(`${this.baseURL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            const data = await response.json();

            // Update stats
            const duration = Date.now() - startTime;
            this.updateStats('generation', duration, data.eval_count || 0);

            return {
                content: data.response,
                model: requestBody.model,
                provider: 'ollama-local',
                usage: {
                    prompt_tokens: data.prompt_eval_count || 0,
                    completion_tokens: data.eval_count || 0,
                    total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
                },
                finishReason: 'stop',
                metadata: {
                    duration: duration,
                    tokensPerSecond: data.eval_count ? (data.eval_count / (duration / 1000)).toFixed(2) : 0
                }
            };

        } catch (error) {
            this.stats.errors++;
            console.error('❌ Text generation error:', error);
            throw error;
        }
    }

    /**
     * Generate text with streaming
     * @param {string} prompt - The prompt
     * @param {function} onChunk - Callback for each chunk
     * @param {object} options - Generation options
     */
    async generateStream(prompt, onChunk, options = {}) {
        if (!this.available) {
            throw new Error('Ollama service not available');
        }

        const requestBody = {
            model: options.model || this.config.generationModel,
            prompt: prompt,
            stream: true,
            options: {
                temperature: options.temperature || this.config.temperature,
                num_predict: options.maxTokens || this.config.maxTokens
            }
        };

        try {
            const response = await fetch(`${this.baseURL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(Boolean);

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.response) {
                            fullText += data.response;
                            onChunk(data.response, fullText);
                        }
                    } catch (e) {
                        console.warn('Failed to parse chunk:', e);
                    }
                }
            }

            return fullText;

        } catch (error) {
            this.stats.errors++;
            console.error('❌ Streaming error:', error);
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
        const prompt = this.buildRAGPrompt(query, context);
        return await this.generateText(prompt, options);
    }

    /**
     * Build RAG prompt
     */
    buildRAGPrompt(query, context) {
        return `You are an educational AI assistant specialized in NCERT curriculum.
Use the following context to answer the student's question accurately and clearly.

CONTEXT:
${context}

QUESTION: ${query}

INSTRUCTIONS:
- Provide a clear, accurate answer based on the context above
- Cite specific information from the context
- If the context doesn't contain enough information, say so
- Use simple language appropriate for students
- Be concise but thorough

ANSWER:`;
    }

    /**
     * Update statistics
     */
    updateStats(type, duration, tokens = 0) {
        this.stats.totalRequests++;
        this.stats.totalResponseTime += duration;
        this.stats.avgResponseTime = this.stats.totalResponseTime / this.stats.totalRequests;

        if (type === 'embedding') {
            this.stats.totalEmbeddings++;
        } else if (type === 'generation') {
            this.stats.totalGenerations++;
            this.stats.totalTokens += tokens;
        }
    }

    /**
     * Get service statistics
     */
    getStatistics() {
        return {
            ...this.stats,
            available: this.available,
            embeddingModel: this.config.embeddingModel,
            generationModel: this.config.generationModel,
            availableModels: this.availableModels.map(m => ({
                name: m.name,
                size: this.formatBytes(m.size),
                modified: new Date(m.modified_at).toLocaleDateString()
            }))
        };
    }

    /**
     * Get available models
     */
    getAvailableModels() {
        return this.availableModels;
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
        console.log('⚙️ Ollama config updated:', this.config);
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Reset statistics
     */
    resetStatistics() {
        this.stats = {
            totalRequests: 0,
            totalEmbeddings: 0,
            totalGenerations: 0,
            totalTokens: 0,
            errors: 0,
            avgResponseTime: 0,
            totalResponseTime: 0
        };
        console.log('📊 Statistics reset');
    }
}

// Initialize global instance
window.localOllamaService = new LocalOllamaService();

console.log('🤖 Local Ollama Service loaded');
