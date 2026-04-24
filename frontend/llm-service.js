// LLM Service for EduLLM Platform
// Handles OpenAI API integration for RAG chat functionality

class LLMService {
    constructor() {
        this.apiKey = null;
        this.baseUrl = 'https://api.openai.com/v1';
        this.model = 'gpt-4o-mini'; // Default model (updated - but local models preferred)
        this.temperature = 0.7;
        this.maxTokens = 1000;
        this.isConfigured = false;
        this.requestCount = 0;
        this.totalTokens = 0;

        // Load API key from localStorage
        this.loadConfiguration();
    }

    /**
     * Load configuration from localStorage
     */
    loadConfiguration() {
        try {
            const savedConfig = localStorage.getItem('llm_config');
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                this.apiKey = config.apiKey;
                this.model = config.model || this.model;
                this.temperature = config.temperature || this.temperature;
                this.maxTokens = config.maxTokens || this.maxTokens;
                this.isConfigured = !!this.apiKey;
            }
        } catch (error) {
            console.error('Failed to load LLM configuration:', error);
        }
    }

    /**
     * Save configuration to localStorage
     */
    saveConfiguration(config) {
        try {
            const configToSave = {
                apiKey: config.apiKey || this.apiKey,
                model: config.model || this.model,
                temperature: config.temperature !== undefined ? config.temperature : this.temperature,
                maxTokens: config.maxTokens || this.maxTokens
            };

            localStorage.setItem('llm_config', JSON.stringify(configToSave));

            // Update instance variables
            this.apiKey = configToSave.apiKey;
            this.model = configToSave.model;
            this.temperature = configToSave.temperature;
            this.maxTokens = configToSave.maxTokens;
            this.isConfigured = !!this.apiKey;

            return true;
        } catch (error) {
            console.error('Failed to save LLM configuration:', error);
            return false;
        }
    }

    /**
     * Validate API key format
     */
    validateApiKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return false;
        }
        // OpenAI keys start with 'sk-'
        return apiKey.startsWith('sk-') && apiKey.length > 20;
    }

    /**
     * Test API connection
     */
    async testConnection() {
        if (!this.isConfigured) {
            throw new Error('LLM service not configured. Please add your OpenAI API key.');
        }

        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API connection failed');
            }

            return { success: true, message: 'Connected successfully!' };
        } catch (error) {
            console.error('LLM connection test failed:', error);
            throw error;
        }
    }

    /**
     * Generate chat completion with context
     */
    async generateResponse(userMessage, context = [], options = {}) {
        if (!this.isConfigured) {
            throw new Error('LLM service not configured. Please add your OpenAI API key in Settings.');
        }

        // Build messages array
        const messages = [
            {
                role: 'system',
                content: this.buildSystemPrompt(options.subject, options.grade)
            },
            ...context.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            {
                role: 'user',
                content: userMessage
            }
        ];

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: options.model || this.model,
                    messages: messages,
                    temperature: options.temperature !== undefined ? options.temperature : this.temperature,
                    max_tokens: options.maxTokens || this.maxTokens,
                    stream: false
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to generate response');
            }

            const data = await response.json();

            // Update statistics
            this.requestCount++;
            this.totalTokens += data.usage?.total_tokens || 0;

            return {
                content: data.choices[0].message.content,
                model: data.model,
                usage: data.usage,
                finishReason: data.choices[0].finish_reason
            };
        } catch (error) {
            console.error('LLM generation failed:', error);
            throw error;
        }
    }

    /**
     * Generate streaming response
     */
    async generateStreamingResponse(userMessage, context = [], options = {}, onChunk) {
        if (!this.isConfigured) {
            throw new Error('LLM service not configured. Please add your OpenAI API key in Settings.');
        }

        const messages = [
            {
                role: 'system',
                content: this.buildSystemPrompt(options.subject, options.grade)
            },
            ...context.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            {
                role: 'user',
                content: userMessage
            }
        ];

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: options.model || this.model,
                    messages: messages,
                    temperature: options.temperature !== undefined ? options.temperature : this.temperature,
                    max_tokens: options.maxTokens || this.maxTokens,
                    stream: true
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to generate streaming response');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);

                        if (data === '[DONE]') {
                            continue;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices[0]?.delta?.content || '';

                            if (content) {
                                fullContent += content;
                                if (onChunk) {
                                    onChunk(content, fullContent);
                                }
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }

            this.requestCount++;

            return {
                content: fullContent,
                model: options.model || this.model
            };
        } catch (error) {
            console.error('Streaming generation failed:', error);
            throw error;
        }
    }

    /**
     * Build system prompt for educational context
     */
    buildSystemPrompt(subject, grade) {
        let prompt = `You are an expert educational AI assistant specializing in Indian NCERT curriculum. `;

        if (subject && grade) {
            prompt += `You are currently helping with ${subject} for Grade ${grade}. `;
        }

        prompt += `Your role is to:
1. Provide accurate, clear, and educational explanations
2. Use age-appropriate language for the student's grade level
3. Reference NCERT curriculum concepts when relevant
4. Break down complex topics into understandable parts
5. Encourage learning through examples and practice
6. Cite specific NCERT chapters or topics when applicable

Guidelines:
- Be patient and supportive
- Use simple language for complex concepts
- Provide step-by-step explanations when needed
- Include relevant examples from the NCERT curriculum
- Format mathematical equations and formulas clearly
- Encourage critical thinking

Always maintain an educational, friendly, and helpful tone.`;

        return prompt;
    }

    /**
     * Generate embeddings for text
     */
    async generateEmbedding(text, model = 'text-embedding-3-small') {
        if (!this.isConfigured) {
            throw new Error('LLM service not configured. Please add your OpenAI API key.');
        }

        try {
            const response = await fetch(`${this.baseUrl}/embeddings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    input: text
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to generate embedding');
            }

            const data = await response.json();
            return {
                embedding: data.data[0].embedding,
                model: data.model,
                usage: data.usage
            };
        } catch (error) {
            console.error('Embedding generation failed:', error);
            throw error;
        }
    }

    /**
     * Batch generate embeddings
     */
    async generateEmbeddings(texts, model = 'text-embedding-3-small') {
        if (!this.isConfigured) {
            throw new Error('LLM service not configured.');
        }

        try {
            const response = await fetch(`${this.baseUrl}/embeddings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    input: texts
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to generate embeddings');
            }

            const data = await response.json();
            return {
                embeddings: data.data.map(item => item.embedding),
                model: data.model,
                usage: data.usage
            };
        } catch (error) {
            console.error('Batch embedding generation failed:', error);
            throw error;
        }
    }

    /**
     * Get available models
     */
    async getAvailableModels() {
        if (!this.isConfigured) {
            return this.getDefaultModels();
        }

        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                return this.getDefaultModels();
            }

            const data = await response.json();
            const chatModels = data.data
                .filter(model => model.id.includes('gpt'))
                .map(model => ({
                    id: model.id,
                    name: model.id,
                    created: model.created
                }))
                .sort((a, b) => b.created - a.created);

            return chatModels.length > 0 ? chatModels : this.getDefaultModels();
        } catch (error) {
            console.error('Failed to fetch models:', error);
            return this.getDefaultModels();
        }
    }

    /**
     * Get default models list
     */
    getDefaultModels() {
        return [
            { id: 'gpt-4o', name: 'GPT-4o (Latest)', created: 0 },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fastest, Cheapest)', created: 0 },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', created: 0 },
            { id: 'gpt-4', name: 'GPT-4', created: 0 },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Faster)', created: 0 }
        ];
    }

    /**
     * Get usage statistics
     */
    getStatistics() {
        return {
            requestCount: this.requestCount,
            totalTokens: this.totalTokens,
            estimatedCost: this.calculateCost(),
            isConfigured: this.isConfigured,
            model: this.model
        };
    }

    /**
     * Calculate estimated cost
     */
    calculateCost() {
        // Rough estimates for GPT-4 Turbo
        // $10 per 1M input tokens, $30 per 1M output tokens
        // Average ~50% input, 50% output
        const costPer1MTokens = 20; // Average
        return (this.totalTokens / 1000000) * costPer1MTokens;
    }

    /**
     * Reset statistics
     */
    resetStatistics() {
        this.requestCount = 0;
        this.totalTokens = 0;
    }

    /**
     * Clear configuration
     */
    clearConfiguration() {
        try {
            localStorage.removeItem('llm_config');
            this.apiKey = null;
            this.isConfigured = false;
            return true;
        } catch (error) {
            console.error('Failed to clear configuration:', error);
            return false;
        }
    }
}

// Create global instance
window.llmService = new LLMService();
console.log('✅ LLM Service initialized');
