/**
 * Enhanced Multi-Provider LLM Service
 *
 * Supports:
 * - OpenAI (GPT-4, GPT-3.5)
 * - Anthropic (Claude 3 family)
 * - Google (Gemini Pro)
 *
 * @version 2.0.0
 * @author EduLLM Platform
 */

class EnhancedLLMService {
    constructor() {
        this.providers = {
            openai: {
                name: 'OpenAI',
                baseUrl: 'https://api.openai.com/v1',
                models: [
                    { id: 'gpt-4o', name: 'GPT-4o (Latest)', maxTokens: 4096, costPer1M: 15 },
                    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fastest)', maxTokens: 4096, costPer1M: 0.60 },
                    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 4096, costPer1M: 20 },
                    { id: 'gpt-4', name: 'GPT-4', maxTokens: 8192, costPer1M: 60 },
                    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 4096, costPer1M: 1.5 }
                ],
                embeddings: [
                    { id: 'text-embedding-3-small', name: 'Small (1536 dim)', costPer1M: 0.02 },
                    { id: 'text-embedding-3-large', name: 'Large (3072 dim)', costPer1M: 0.13 }
                ]
            },
            anthropic: {
                name: 'Anthropic',
                baseUrl: 'https://api.anthropic.com/v1',
                models: [
                    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', maxTokens: 4096, costPer1M: 75 },
                    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', maxTokens: 4096, costPer1M: 15 },
                    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', maxTokens: 4096, costPer1M: 1.25 }
                ]
            },
            gemini: {
                name: 'Google Gemini',
                baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
                models: [
                    { id: 'gemini-pro', name: 'Gemini Pro', maxTokens: 2048, costPer1M: 0.5 },
                    { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', maxTokens: 2048, costPer1M: 0.5 }
                ]
            }
        };

        this.config = {
            provider: 'openai',
            apiKeys: {},
            selectedModels: {},
            temperature: 0.7,
            maxTokens: 1000
        };

        this.statistics = {
            requests: 0,
            tokens: 0,
            errors: 0,
            byProvider: {}
        };

        this.rateLimiter = {
            requests: [],
            maxPerMinute: 60
        };

        this.loadConfiguration();
    }

    /**
     * Load configuration from localStorage
     */
    loadConfiguration() {
        try {
            const saved = localStorage.getItem('llm_config_enhanced');
            if (saved) {
                const config = JSON.parse(saved);
                this.config = { ...this.config, ...config };
            }

            // Backward compatibility with old llm_config
            const oldConfig = localStorage.getItem('llm_config');
            if (oldConfig && !saved) {
                const old = JSON.parse(oldConfig);
                if (old.apiKey) {
                    this.config.apiKeys.openai = old.apiKey;
                    this.config.selectedModels.openai = old.model || 'gpt-4o-mini';
                    this.saveConfiguration();
                }
            }
        } catch (error) {
            console.error('Failed to load LLM configuration:', error);
        }
    }

    /**
     * Save configuration to localStorage
     */
    saveConfiguration() {
        try {
            localStorage.setItem('llm_config_enhanced', JSON.stringify(this.config));
            return true;
        } catch (error) {
            console.error('Failed to save LLM configuration:', error);
            return false;
        }
    }

    /**
     * Configure provider
     */
    configureProvider(provider, apiKey, model) {
        if (!this.providers[provider]) {
            throw new Error(`Unknown provider: ${provider}`);
        }

        this.config.apiKeys[provider] = apiKey;
        this.config.selectedModels[provider] = model || this.providers[provider].models[0].id;
        this.config.provider = provider;

        return this.saveConfiguration();
    }

    /**
     * Check if provider is configured
     */
    isProviderConfigured(provider) {
        return !!this.config.apiKeys[provider];
    }

    /**
     * Get current provider
     */
    getCurrentProvider() {
        return this.config.provider;
    }

    /**
     * Switch provider
     */
    switchProvider(provider) {
        if (!this.providers[provider]) {
            throw new Error(`Unknown provider: ${provider}`);
        }

        if (!this.isProviderConfigured(provider)) {
            throw new Error(`Provider ${provider} is not configured`);
        }

        this.config.provider = provider;
        this.saveConfiguration();
    }

    /**
     * Rate limiting check
     */
    async checkRateLimit() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        // Remove old requests
        this.rateLimiter.requests = this.rateLimiter.requests.filter(t => t > oneMinuteAgo);

        // Check limit
        if (this.rateLimiter.requests.length >= this.rateLimiter.maxPerMinute) {
            const oldestRequest = this.rateLimiter.requests[0];
            const waitTime = 60000 - (now - oldestRequest);

            if (waitTime > 0) {
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        // Add current request
        this.rateLimiter.requests.push(now);
    }

    /**
     * Generate chat completion (unified interface)
     */
    async generateResponse(userMessage, context = [], options = {}) {
        const provider = options.provider || this.config.provider;

        if (!this.isProviderConfigured(provider)) {
            throw new Error(`Provider ${provider} is not configured. Please add your API key in Settings.`);
        }

        await this.checkRateLimit();

        // Route to provider-specific implementation
        switch (provider) {
            case 'openai':
                return await this.generateOpenAIResponse(userMessage, context, options);
            case 'anthropic':
                return await this.generateAnthropicResponse(userMessage, context, options);
            case 'gemini':
                return await this.generateGeminiResponse(userMessage, context, options);
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    /**
     * OpenAI implementation
     */
    async generateOpenAIResponse(userMessage, context, options) {
        const model = options.model || this.config.selectedModels.openai || 'gpt-4o-mini';
        const apiKey = this.config.apiKeys.openai;

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
            const response = await fetch(`${this.providers.openai.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: options.temperature ?? this.config.temperature,
                    max_tokens: options.maxTokens ?? this.config.maxTokens,
                    stream: false
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'OpenAI API request failed');
            }

            const data = await response.json();

            // Update statistics
            this.updateStatistics('openai', data.usage?.total_tokens || 0);

            return {
                content: data.choices[0].message.content,
                model: data.model,
                provider: 'openai',
                usage: data.usage,
                finishReason: data.choices[0].finish_reason
            };
        } catch (error) {
            this.updateStatistics('openai', 0, true);
            console.error('OpenAI generation failed:', error);
            throw error;
        }
    }

    /**
     * Anthropic Claude implementation
     */
    async generateAnthropicResponse(userMessage, context, options) {
        const model = options.model || this.config.selectedModels.anthropic || 'claude-3-sonnet-20240229';
        const apiKey = this.config.apiKeys.anthropic;

        const systemPrompt = this.buildSystemPrompt(options.subject, options.grade);

        // Anthropic uses a different message format
        const messages = [
            ...context.filter(msg => msg.role !== 'system').map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            })),
            {
                role: 'user',
                content: userMessage
            }
        ];

        try {
            const response = await fetch(`${this.providers.anthropic.baseUrl}/messages`, {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    system: systemPrompt,
                    messages: messages,
                    temperature: options.temperature ?? this.config.temperature,
                    max_tokens: options.maxTokens ?? this.config.maxTokens
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Anthropic API request failed');
            }

            const data = await response.json();

            // Calculate tokens (Anthropic returns token counts)
            const totalTokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
            this.updateStatistics('anthropic', totalTokens);

            return {
                content: data.content[0].text,
                model: data.model,
                provider: 'anthropic',
                usage: {
                    prompt_tokens: data.usage?.input_tokens || 0,
                    completion_tokens: data.usage?.output_tokens || 0,
                    total_tokens: totalTokens
                },
                finishReason: data.stop_reason
            };
        } catch (error) {
            this.updateStatistics('anthropic', 0, true);
            console.error('Anthropic generation failed:', error);
            throw error;
        }
    }

    /**
     * Google Gemini implementation
     */
    async generateGeminiResponse(userMessage, context, options) {
        const model = options.model || this.config.selectedModels.gemini || 'gemini-pro';
        const apiKey = this.config.apiKeys.gemini;

        const systemPrompt = this.buildSystemPrompt(options.subject, options.grade);

        // Gemini uses parts format
        const contents = [
            {
                role: 'user',
                parts: [{ text: systemPrompt + '\n\n' + userMessage }]
            }
        ];

        // Add context if exists
        if (context.length > 0) {
            const contextParts = context.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));
            contents.unshift(...contextParts);
        }

        try {
            const response = await fetch(
                `${this.providers.gemini.baseUrl}/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: contents,
                        generationConfig: {
                            temperature: options.temperature ?? this.config.temperature,
                            maxOutputTokens: options.maxTokens ?? this.config.maxTokens
                        }
                    })
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Gemini API request failed');
            }

            const data = await response.json();

            // Gemini token counting is different
            const totalTokens = (data.usageMetadata?.promptTokenCount || 0) +
                              (data.usageMetadata?.candidatesTokenCount || 0);

            this.updateStatistics('gemini', totalTokens);

            return {
                content: data.candidates[0].content.parts[0].text,
                model: model,
                provider: 'gemini',
                usage: {
                    prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
                    completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
                    total_tokens: totalTokens
                },
                finishReason: data.candidates[0].finishReason
            };
        } catch (error) {
            this.updateStatistics('gemini', 0, true);
            console.error('Gemini generation failed:', error);
            throw error;
        }
    }

    /**
     * Generate embeddings (OpenAI only for now)
     */
    async generateEmbedding(text, model = 'text-embedding-3-small') {
        if (!this.isProviderConfigured('openai')) {
            throw new Error('OpenAI is required for embeddings. Please configure your API key.');
        }

        await this.checkRateLimit();

        try {
            const response = await fetch(`${this.providers.openai.baseUrl}/embeddings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKeys.openai}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    input: text
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Embedding generation failed');
            }

            const data = await response.json();

            return {
                embedding: data.data[0].embedding,
                model: data.model,
                usage: data.usage,
                dimensions: data.data[0].embedding.length
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
        if (!this.isProviderConfigured('openai')) {
            throw new Error('OpenAI is required for embeddings.');
        }

        await this.checkRateLimit();

        try {
            const response = await fetch(`${this.providers.openai.baseUrl}/embeddings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKeys.openai}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    input: texts
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Batch embedding generation failed');
            }

            const data = await response.json();

            return {
                embeddings: data.data.map(item => item.embedding),
                model: data.model,
                usage: data.usage,
                dimensions: data.data[0].embedding.length
            };
        } catch (error) {
            console.error('Batch embedding generation failed:', error);
            throw error;
        }
    }

    /**
     * Build educational system prompt
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
     * Test connection for a provider
     */
    async testConnection(provider) {
        provider = provider || this.config.provider;

        if (!this.isProviderConfigured(provider)) {
            throw new Error(`Provider ${provider} is not configured`);
        }

        try {
            // Send a simple test request
            const response = await this.generateResponse(
                'Hello! This is a test message.',
                [],
                {
                    provider: provider,
                    maxTokens: 50
                }
            );

            return {
                success: true,
                message: `Successfully connected to ${this.providers[provider].name}!`,
                model: response.model,
                provider: provider
            };
        } catch (error) {
            throw new Error(`Connection test failed: ${error.message}`);
        }
    }

    /**
     * Update statistics
     */
    updateStatistics(provider, tokens, isError = false) {
        this.statistics.requests++;
        this.statistics.tokens += tokens;

        if (isError) {
            this.statistics.errors++;
        }

        if (!this.statistics.byProvider[provider]) {
            this.statistics.byProvider[provider] = {
                requests: 0,
                tokens: 0,
                errors: 0
            };
        }

        this.statistics.byProvider[provider].requests++;
        this.statistics.byProvider[provider].tokens += tokens;

        if (isError) {
            this.statistics.byProvider[provider].errors++;
        }
    }

    /**
     * Get statistics
     */
    getStatistics() {
        const currentProvider = this.config.provider;
        const modelInfo = this.providers[currentProvider]?.models.find(
            m => m.id === this.config.selectedModels[currentProvider]
        );

        return {
            ...this.statistics,
            currentProvider: currentProvider,
            currentModel: this.config.selectedModels[currentProvider],
            estimatedCost: this.calculateTotalCost(),
            isConfigured: this.isProviderConfigured(currentProvider),
            configuredProviders: Object.keys(this.config.apiKeys).filter(p => this.config.apiKeys[p])
        };
    }

    /**
     * Calculate total cost across all providers
     */
    calculateTotalCost() {
        let totalCost = 0;

        for (const [provider, stats] of Object.entries(this.statistics.byProvider)) {
            const providerInfo = this.providers[provider];
            if (!providerInfo) continue;

            const model = this.config.selectedModels[provider];
            const modelInfo = providerInfo.models.find(m => m.id === model);

            if (modelInfo && modelInfo.costPer1M) {
                totalCost += (stats.tokens / 1000000) * modelInfo.costPer1M;
            }
        }

        return totalCost;
    }

    /**
     * Reset statistics
     */
    resetStatistics() {
        this.statistics = {
            requests: 0,
            tokens: 0,
            errors: 0,
            byProvider: {}
        };
    }

    /**
     * Get available models for provider
     */
    getModelsForProvider(provider) {
        return this.providers[provider]?.models || [];
    }

    /**
     * Get all available providers
     */
    getAllProviders() {
        return Object.entries(this.providers).map(([id, info]) => ({
            id,
            name: info.name,
            isConfigured: this.isProviderConfigured(id),
            models: info.models
        }));
    }

    /**
     * Clear configuration for a provider
     */
    clearProviderConfiguration(provider) {
        delete this.config.apiKeys[provider];
        delete this.config.selectedModels[provider];

        // If clearing current provider, switch to another configured one
        if (this.config.provider === provider) {
            const configured = Object.keys(this.config.apiKeys).find(p => this.config.apiKeys[p]);
            if (configured) {
                this.config.provider = configured;
            }
        }

        this.saveConfiguration();
    }
}

// Create global instance and maintain backward compatibility
window.enhancedLLMService = new EnhancedLLMService();

// Alias for backward compatibility
if (!window.llmService) {
    window.llmService = window.enhancedLLMService;
}

console.log('✅ Enhanced Multi-Provider LLM Service initialized');
