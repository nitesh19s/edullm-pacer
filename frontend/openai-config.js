/**
 * OpenAI API Configuration & Testing Utilities
 *
 * Comprehensive OpenAI integration with testing and validation
 */

class OpenAIConfig {
    constructor() {
        this.apiKey = this.loadApiKey();
        this.baseURL = 'https://api.openai.com/v1';
        this.models = {
            chat: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'],
            embeddings: ['text-embedding-ada-002', 'text-embedding-3-small', 'text-embedding-3-large'],
            default: 'gpt-4o-mini'  // Updated default (but local models preferred)
        };
        this.initialized = false;
    }

    /**
     * Load API key from localStorage or environment
     */
    loadApiKey() {
        // Try localStorage first
        let key = localStorage.getItem('openai_api_key');

        // Try window.OPENAI_API_KEY (can be set in config)
        if (!key && typeof window !== 'undefined' && window.OPENAI_API_KEY) {
            key = window.OPENAI_API_KEY;
        }

        return key || '';
    }

    /**
     * Set API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('openai_api_key', apiKey);
        this.initialized = false;
        console.log('✅ OpenAI API key updated');
    }

    /**
     * Get API key
     */
    getApiKey() {
        return this.apiKey;
    }

    /**
     * Check if API key is configured
     */
    isConfigured() {
        return !!this.apiKey && this.apiKey.length > 0;
    }

    /**
     * Validate API key format
     */
    validateKeyFormat(key = this.apiKey) {
        // OpenAI keys start with 'sk-'
        if (!key) return { valid: false, error: 'API key is empty' };
        if (!key.startsWith('sk-')) return { valid: false, error: 'API key should start with "sk-"' };
        if (key.length < 20) return { valid: false, error: 'API key is too short' };

        return { valid: true, error: null };
    }

    /**
     * Test API key by making a simple request
     */
    async testApiKey(key = this.apiKey) {
        const validation = this.validateKeyFormat(key);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error,
                details: 'Invalid API key format'
            };
        }

        try {
            const response = await fetch(`${this.baseURL}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                return {
                    success: false,
                    error: error.error?.message || 'API request failed',
                    statusCode: response.status,
                    details: error
                };
            }

            const data = await response.json();

            return {
                success: true,
                message: 'API key is valid',
                modelsAvailable: data.data?.length || 0,
                details: data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                details: 'Network error or CORS issue'
            };
        }
    }

    /**
     * Initialize and validate configuration
     */
    async initialize() {
        if (this.initialized) return true;

        console.log('🔧 Initializing OpenAI configuration...');

        if (!this.isConfigured()) {
            console.warn('⚠️  OpenAI API key not configured');
            console.log('Set it using: openaiConfig.setApiKey("sk-your-key")');
            return false;
        }

        const validation = this.validateKeyFormat();
        if (!validation.valid) {
            console.error('❌ Invalid API key format:', validation.error);
            return false;
        }

        console.log('✅ OpenAI API key configured');
        this.initialized = true;
        return true;
    }

    /**
     * Create chat completion request
     */
    async createChatCompletion(messages, options = {}) {
        if (!this.isConfigured()) {
            throw new Error('OpenAI API key not configured');
        }

        const requestBody = {
            model: options.model || this.models.default,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens || 1000,
            top_p: options.topP ?? 1,
            frequency_penalty: options.frequencyPenalty ?? 0,
            presence_penalty: options.presencePenalty ?? 0
        };

        if (options.stream) {
            requestBody.stream = true;
        }

        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('OpenAI API Error:', error);
            throw error;
        }
    }

    /**
     * Create embeddings
     */
    async createEmbeddings(input, model = 'text-embedding-ada-002') {
        if (!this.isConfigured()) {
            throw new Error('OpenAI API key not configured');
        }

        const requestBody = {
            model,
            input: Array.isArray(input) ? input : [input]
        };

        try {
            const response = await fetch(`${this.baseURL}/embeddings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('OpenAI Embeddings Error:', error);
            throw error;
        }
    }

    /**
     * List available models
     */
    async listModels() {
        if (!this.isConfigured()) {
            throw new Error('OpenAI API key not configured');
        }

        try {
            const response = await fetch(`${this.baseURL}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('OpenAI List Models Error:', error);
            throw error;
        }
    }

    /**
     * Get configuration summary
     */
    getConfigSummary() {
        return {
            configured: this.isConfigured(),
            initialized: this.initialized,
            keySet: !!this.apiKey,
            keyLength: this.apiKey?.length || 0,
            baseURL: this.baseURL,
            availableModels: this.models,
            defaultModel: this.models.default
        };
    }

    /**
     * Clear API key
     */
    clearApiKey() {
        this.apiKey = '';
        localStorage.removeItem('openai_api_key');
        this.initialized = false;
        console.log('🗑️  OpenAI API key cleared');
    }
}

/**
 * OpenAI Testing Utilities
 */
class OpenAITester {
    constructor(config) {
        this.config = config;
        this.testResults = [];
    }

    /**
     * Run comprehensive tests
     */
    async runAllTests() {
        console.log('🧪 Starting OpenAI API Tests');
        console.log('==============================\n');

        this.testResults = [];

        await this.testConfiguration();
        await this.testChatCompletion();
        await this.testEmbeddings();
        await this.testModelsList();
        await this.testRAGWorkflow();

        this.printTestSummary();

        return this.testResults;
    }

    /**
     * Test configuration
     */
    async testConfiguration() {
        console.log('📋 Test 1: Configuration');
        console.log('------------------------');

        const summary = this.config.getConfigSummary();
        console.log('Configured:', summary.configured ? '✅' : '❌');
        console.log('API Key Set:', summary.keySet ? '✅' : '❌');
        console.log('Default Model:', summary.defaultModel);

        if (!summary.configured) {
            console.log('⚠️  Skipping API tests - not configured\n');
            this.testResults.push({ test: 'Configuration', status: 'skipped', reason: 'Not configured' });
            return;
        }

        // Validate API key
        const validation = await this.config.testApiKey();
        if (validation.success) {
            console.log('✅ API Key Valid');
            console.log(`   Models Available: ${validation.modelsAvailable}\n`);
            this.testResults.push({ test: 'Configuration', status: 'passed', details: validation });
        } else {
            console.error('❌ API Key Invalid');
            console.error(`   Error: ${validation.error}\n`);
            this.testResults.push({ test: 'Configuration', status: 'failed', error: validation.error });
        }
    }

    /**
     * Test chat completion
     */
    async testChatCompletion() {
        console.log('💬 Test 2: Chat Completion');
        console.log('--------------------------');

        if (!this.config.isConfigured()) {
            console.log('⚠️  Skipped - not configured\n');
            this.testResults.push({ test: 'Chat Completion', status: 'skipped' });
            return;
        }

        try {
            const startTime = Date.now();

            const response = await this.config.createChatCompletion([
                { role: 'system', content: 'You are a helpful educational assistant.' },
                { role: 'user', content: 'Explain photosynthesis in one sentence.' }
            ], {
                model: 'gpt-3.5-turbo',
                maxTokens: 100
            });

            const duration = Date.now() - startTime;

            console.log('✅ Chat Completion Successful');
            console.log(`   Model: ${response.model}`);
            console.log(`   Response: "${response.choices[0].message.content}"`);
            console.log(`   Tokens Used: ${response.usage.total_tokens}`);
            console.log(`   Duration: ${duration}ms\n`);

            this.testResults.push({
                test: 'Chat Completion',
                status: 'passed',
                duration,
                tokens: response.usage.total_tokens
            });
        } catch (error) {
            console.error('❌ Chat Completion Failed');
            console.error(`   Error: ${error.message}\n`);
            this.testResults.push({ test: 'Chat Completion', status: 'failed', error: error.message });
        }
    }

    /**
     * Test embeddings
     */
    async testEmbeddings() {
        console.log('🔢 Test 3: Embeddings');
        console.log('---------------------');

        if (!this.config.isConfigured()) {
            console.log('⚠️  Skipped - not configured\n');
            this.testResults.push({ test: 'Embeddings', status: 'skipped' });
            return;
        }

        try {
            const startTime = Date.now();

            const response = await this.config.createEmbeddings(
                'Photosynthesis is the process by which plants make food.',
                'text-embedding-ada-002'
            );

            const duration = Date.now() - startTime;

            console.log('✅ Embeddings Successful');
            console.log(`   Model: ${response.model}`);
            console.log(`   Dimensions: ${response.data[0].embedding.length}`);
            console.log(`   Tokens Used: ${response.usage.total_tokens}`);
            console.log(`   Duration: ${duration}ms\n`);

            this.testResults.push({
                test: 'Embeddings',
                status: 'passed',
                duration,
                dimensions: response.data[0].embedding.length
            });
        } catch (error) {
            console.error('❌ Embeddings Failed');
            console.error(`   Error: ${error.message}\n`);
            this.testResults.push({ test: 'Embeddings', status: 'failed', error: error.message });
        }
    }

    /**
     * Test models list
     */
    async testModelsList() {
        console.log('📚 Test 4: List Models');
        console.log('----------------------');

        if (!this.config.isConfigured()) {
            console.log('⚠️  Skipped - not configured\n');
            this.testResults.push({ test: 'List Models', status: 'skipped' });
            return;
        }

        try {
            const response = await this.config.listModels();
            const gptModels = response.data.filter(m => m.id.includes('gpt'));

            console.log('✅ List Models Successful');
            console.log(`   Total Models: ${response.data.length}`);
            console.log(`   GPT Models: ${gptModels.length}`);
            console.log(`   Available GPT Models: ${gptModels.slice(0, 5).map(m => m.id).join(', ')}...\n`);

            this.testResults.push({
                test: 'List Models',
                status: 'passed',
                totalModels: response.data.length,
                gptModels: gptModels.length
            });
        } catch (error) {
            console.error('❌ List Models Failed');
            console.error(`   Error: ${error.message}\n`);
            this.testResults.push({ test: 'List Models', status: 'failed', error: error.message });
        }
    }

    /**
     * Test RAG workflow
     */
    async testRAGWorkflow() {
        console.log('🔍 Test 5: RAG Workflow');
        console.log('-----------------------');

        if (!this.config.isConfigured()) {
            console.log('⚠️  Skipped - not configured\n');
            this.testResults.push({ test: 'RAG Workflow', status: 'skipped' });
            return;
        }

        try {
            // Step 1: Create embeddings for context
            const context = [
                'Photosynthesis is the process by which plants convert light energy into chemical energy.',
                'The formula for photosynthesis is: 6CO2 + 6H2O + light → C6H12O6 + 6O2.',
                'Chlorophyll is the green pigment that captures light energy in plants.'
            ];

            const embeddingsResponse = await this.config.createEmbeddings(context);

            // Step 2: Create embedding for query
            const query = 'What is the formula for photosynthesis?';
            const queryEmbedding = await this.config.createEmbeddings(query);

            // Step 3: Use context in chat completion
            const chatResponse = await this.config.createChatCompletion([
                { role: 'system', content: 'You are a helpful educational assistant. Use the provided context to answer questions.' },
                { role: 'user', content: `Context:\n${context.join('\n')}\n\nQuestion: ${query}` }
            ], {
                model: 'gpt-3.5-turbo',
                maxTokens: 150
            });

            console.log('✅ RAG Workflow Successful');
            console.log(`   Context Embeddings: ${embeddingsResponse.data.length}`);
            console.log(`   Query Embedding: Created`);
            console.log(`   RAG Response: "${chatResponse.choices[0].message.content}"`);
            console.log(`   Total Tokens: ${chatResponse.usage.total_tokens}\n`);

            this.testResults.push({
                test: 'RAG Workflow',
                status: 'passed',
                embeddings: embeddingsResponse.data.length,
                tokens: chatResponse.usage.total_tokens
            });
        } catch (error) {
            console.error('❌ RAG Workflow Failed');
            console.error(`   Error: ${error.message}\n`);
            this.testResults.push({ test: 'RAG Workflow', status: 'failed', error: error.message });
        }
    }

    /**
     * Print test summary
     */
    printTestSummary() {
        console.log('==============================');
        console.log('📊 Test Summary');
        console.log('==============================');

        const passed = this.testResults.filter(r => r.status === 'passed').length;
        const failed = this.testResults.filter(r => r.status === 'failed').length;
        const skipped = this.testResults.filter(r => r.status === 'skipped').length;

        console.log(`Total Tests: ${this.testResults.length}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⊘ Skipped: ${skipped}`);
        console.log('==============================\n');

        if (failed === 0 && passed > 0) {
            console.log('🎉 All tests passed!');
        }
    }

    /**
     * Get test results
     */
    getResults() {
        return this.testResults;
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.OpenAIConfig = OpenAIConfig;
    window.OpenAITester = OpenAITester;

    // Create global instance
    window.openaiConfig = new OpenAIConfig();
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OpenAIConfig, OpenAITester };
}
