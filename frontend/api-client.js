/**
 * EduLLM Platform - API Client
 *
 * Unified API client for connecting frontend to REST API backend
 * Provides type-safe methods for all API endpoints
 */

class EduLLMAPIClient {
    constructor(config = {}) {
        this.baseURL = config.baseURL || 'http://localhost:3000/api/v1';
        this.apiKey = config.apiKey || localStorage.getItem('edullm_api_key') || '';
        this.timeout = config.timeout || 30000;
        this.retries = config.retries || 3;
        this.connected = false;
        this.lastError = null;

        // Request interceptors
        this.requestInterceptors = [];
        this.responseInterceptors = [];

        // Initialize connection check
        this.checkConnection();
    }

    /**
     * Set API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('edullm_api_key', apiKey);
    }

    /**
     * Get API key
     */
    getApiKey() {
        return this.apiKey;
    }

    /**
     * Check backend connection
     */
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseURL.replace('/api/v1', '')}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });

            this.connected = response.ok;
            this.lastError = null;
            return this.connected;
        } catch (error) {
            this.connected = false;
            this.lastError = error.message;
            console.warn('Backend API not connected:', error.message);
            return false;
        }
    }

    /**
     * Make API request
     */
    async request(endpoint, options = {}) {
        const {
            method = 'GET',
            body,
            headers = {},
            retries = this.retries,
            currentRetry = 0
        } = options;

        const url = `${this.baseURL}${endpoint}`;

        const requestOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            signal: AbortSignal.timeout(this.timeout)
        };

        // Add API key if available
        if (this.apiKey) {
            requestOptions.headers['X-API-Key'] = this.apiKey;
        }

        // Add body for POST/PUT/PATCH
        if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
            requestOptions.body = JSON.stringify(body);
        }

        // Run request interceptors
        for (const interceptor of this.requestInterceptors) {
            await interceptor(requestOptions);
        }

        try {
            const response = await fetch(url, requestOptions);
            const data = await response.json();

            // Run response interceptors
            for (const interceptor of this.responseInterceptors) {
                await interceptor(response, data);
            }

            if (!response.ok) {
                throw new APIError(
                    data.error?.message || 'Request failed',
                    response.status,
                    data.error?.details
                );
            }

            return data;
        } catch (error) {
            // Retry on network errors
            if (currentRetry < retries && error.name === 'TypeError') {
                console.warn(`Request failed, retrying... (${currentRetry + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (currentRetry + 1)));
                return this.request(endpoint, { ...options, currentRetry: currentRetry + 1 });
            }

            throw error;
        }
    }

    // ==================== EXPERIMENTS API ====================

    /**
     * Get all experiments
     */
    async getExperiments(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/experiments${queryString ? '?' + queryString : ''}`;
        return this.request(endpoint);
    }

    /**
     * Get experiment by ID
     */
    async getExperiment(id) {
        return this.request(`/experiments/${id}`);
    }

    /**
     * Create experiment
     */
    async createExperiment(data) {
        return this.request('/experiments', {
            method: 'POST',
            body: data
        });
    }

    /**
     * Update experiment
     */
    async updateExperiment(id, data) {
        return this.request(`/experiments/${id}`, {
            method: 'PUT',
            body: data
        });
    }

    /**
     * Delete experiment
     */
    async deleteExperiment(id) {
        return this.request(`/experiments/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Create experiment run
     */
    async createExperimentRun(experimentId, data) {
        return this.request(`/experiments/${experimentId}/runs`, {
            method: 'POST',
            body: data
        });
    }

    /**
     * Get experiment runs
     */
    async getExperimentRuns(experimentId) {
        return this.request(`/experiments/${experimentId}/runs`);
    }

    /**
     * Get experiment statistics
     */
    async getExperimentStats(experimentId) {
        return this.request(`/experiments/${experimentId}/stats`);
    }

    // ==================== RESEARCH FEATURES API ====================

    /**
     * Track learning interaction
     */
    async trackInteraction(data) {
        return this.request('/research/progression/track', {
            method: 'POST',
            body: data
        });
    }

    /**
     * Get student progression
     */
    async getProgression(studentId) {
        return this.request(`/research/progression/${studentId}`);
    }

    /**
     * Get progression analytics
     */
    async getProgressionAnalytics(studentId) {
        return this.request(`/research/progression/${studentId}/analytics`);
    }

    /**
     * Analyze curriculum gaps
     */
    async analyzeCurriculumGaps(data) {
        return this.request('/research/gaps/analyze', {
            method: 'POST',
            body: data
        });
    }

    /**
     * Get gap analysis history
     */
    async getGapAnalyses(studentId) {
        return this.request(`/research/gaps/${studentId}`);
    }

    /**
     * Analyze cross-subject performance
     */
    async analyzeCrossSubject(data) {
        return this.request('/research/cross-subject/analyze', {
            method: 'POST',
            body: data
        });
    }

    /**
     * Get cross-subject analysis history
     */
    async getCrossSubjectAnalyses(studentId) {
        return this.request(`/research/cross-subject/${studentId}`);
    }

    /**
     * Get all students
     */
    async getStudents() {
        return this.request('/research/students');
    }

    // ==================== VECTOR DATABASE API ====================

    /**
     * Get all collections
     */
    async getCollections() {
        return this.request('/vector/collections');
    }

    /**
     * Create collection
     */
    async createCollection(data) {
        return this.request('/vector/collections', {
            method: 'POST',
            body: data
        });
    }

    /**
     * Delete collection
     */
    async deleteCollection(id) {
        return this.request(`/vector/collections/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Add documents to collection
     */
    async addDocuments(collectionId, documents) {
        return this.request(`/vector/collections/${collectionId}/documents`, {
            method: 'POST',
            body: { documents }
        });
    }

    /**
     * Get documents in collection
     */
    async getDocuments(collectionId, limit = 50) {
        return this.request(`/vector/collections/${collectionId}/documents?limit=${limit}`);
    }

    /**
     * Query collection
     */
    async queryCollection(collectionId, query, topK = 5) {
        return this.request(`/vector/collections/${collectionId}/query`, {
            method: 'POST',
            body: { query, topK }
        });
    }

    /**
     * Get vector database statistics
     */
    async getVectorStats() {
        return this.request('/vector/stats');
    }

    // ==================== RAG CHAT API ====================

    /**
     * Send chat message
     */
    async sendMessage(data) {
        return this.request('/rag/chat', {
            method: 'POST',
            body: data
        });
    }

    /**
     * Get chat sessions
     */
    async getChatSessions() {
        return this.request('/rag/sessions');
    }

    /**
     * Get chat session
     */
    async getChatSession(sessionId) {
        return this.request(`/rag/sessions/${sessionId}`);
    }

    /**
     * Delete chat session
     */
    async deleteChatSession(sessionId) {
        return this.request(`/rag/sessions/${sessionId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Retrieve context
     */
    async retrieveContext(query, topK = 5) {
        return this.request('/rag/retrieve', {
            method: 'POST',
            body: { query, topK }
        });
    }

    /**
     * Get RAG statistics
     */
    async getRagStats() {
        return this.request('/rag/stats');
    }

    // ==================== ANALYTICS API ====================

    /**
     * Get all reports
     */
    async getReports(type = null) {
        const endpoint = type ? `/analytics/reports?type=${type}` : '/analytics/reports';
        return this.request(endpoint);
    }

    /**
     * Generate report
     */
    async generateReport(data = {}) {
        return this.request('/analytics/reports/generate', {
            method: 'POST',
            body: data
        });
    }

    /**
     * Get report by ID
     */
    async getReport(id) {
        return this.request(`/analytics/reports/${id}`);
    }

    /**
     * Create baseline
     */
    async createBaseline(data) {
        return this.request('/analytics/baseline/create', {
            method: 'POST',
            body: data
        });
    }

    /**
     * Compare to baseline
     */
    async compareToBaseline(baselineId, currentMetrics) {
        return this.request('/analytics/baseline/compare', {
            method: 'POST',
            body: { baselineId, currentMetrics }
        });
    }

    /**
     * Get all baselines
     */
    async getBaselines() {
        return this.request('/analytics/baseline');
    }

    /**
     * Create A/B test
     */
    async createABTest(data) {
        return this.request('/analytics/ab-tests', {
            method: 'POST',
            body: data
        });
    }

    /**
     * Run A/B test
     */
    async runABTest(id) {
        return this.request(`/analytics/ab-tests/${id}/run`, {
            method: 'POST'
        });
    }

    /**
     * Get all A/B tests
     */
    async getABTests() {
        return this.request('/analytics/ab-tests');
    }

    /**
     * Get A/B test by ID
     */
    async getABTest(id) {
        return this.request(`/analytics/ab-tests/${id}`);
    }

    /**
     * Get analytics dashboard
     */
    async getAnalyticsDashboard() {
        return this.request('/analytics/dashboard');
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Add request interceptor
     */
    addRequestInterceptor(fn) {
        this.requestInterceptors.push(fn);
    }

    /**
     * Add response interceptor
     */
    addResponseInterceptor(fn) {
        this.responseInterceptors.push(fn);
    }

    /**
     * Get connection status
     */
    isConnected() {
        return this.connected;
    }

    /**
     * Get last error
     */
    getLastError() {
        return this.lastError;
    }
}

/**
 * API Error class
 */
class APIError extends Error {
    constructor(message, statusCode, details = null) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
        this.details = details;
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.EduLLMAPIClient = EduLLMAPIClient;
    window.APIError = APIError;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EduLLMAPIClient, APIError };
}
