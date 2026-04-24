/**
 * EduLLM Platform - Integration Configuration
 *
 * Manages integration between frontend and backend API
 * Handles connection monitoring and automatic fallback
 */

class IntegrationManager {
    constructor() {
        this.apiClient = null;
        this.mode = 'auto'; // 'api', 'local', 'auto'
        this.connectionStatus = 'unknown';
        this.statusListeners = [];
        this.config = this.loadConfig();

        this.initialize();
    }

    /**
     * Load configuration from localStorage
     */
    loadConfig() {
        const defaultConfig = {
            apiBaseURL: 'http://localhost:3000/api/v1',
            apiKey: '',
            mode: 'auto',
            checkInterval: 30000, // Check connection every 30s
            retryAttempts: 3,
            timeout: 30000
        };

        const saved = localStorage.getItem('edullm_integration_config');
        return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
    }

    /**
     * Save configuration to localStorage
     */
    saveConfig() {
        localStorage.setItem('edullm_integration_config', JSON.stringify(this.config));
    }

    /**
     * Initialize integration
     */
    async initialize() {
        console.log('🔌 Initializing integration manager...');

        // Create API client
        this.apiClient = new EduLLMAPIClient({
            baseURL: this.config.apiBaseURL,
            apiKey: this.config.apiKey,
            timeout: this.config.timeout,
            retries: this.config.retryAttempts
        });

        // Check initial connection
        await this.checkConnection();

        // Set up periodic connection checks
        setInterval(() => this.checkConnection(), this.config.checkInterval);

        // Set up API client interceptors
        this.setupInterceptors();

        console.log(`✅ Integration initialized (Mode: ${this.mode}, Connected: ${this.connectionStatus === 'connected'})`);
    }

    /**
     * Set up API client interceptors
     */
    setupInterceptors() {
        // Request interceptor - log requests in development
        this.apiClient.addRequestInterceptor((options) => {
            if (this.config.debug) {
                console.log('📤 API Request:', options);
            }
        });

        // Response interceptor - log responses in development
        this.apiClient.addResponseInterceptor((response, data) => {
            if (this.config.debug) {
                console.log('📥 API Response:', response.status, data);
            }
        });
    }

    /**
     * Check backend API connection
     */
    async checkConnection() {
        const wasConnected = this.connectionStatus === 'connected';
        const isConnected = await this.apiClient.checkConnection();

        const newStatus = isConnected ? 'connected' : 'disconnected';

        // Update status if changed
        if (newStatus !== this.connectionStatus) {
            this.connectionStatus = newStatus;
            this.notifyStatusChange(newStatus);

            if (isConnected && !wasConnected) {
                console.log('✅ Backend API connected');
            } else if (!isConnected && wasConnected) {
                console.warn('⚠️  Backend API disconnected - falling back to local mode');
            }
        }

        // Update mode based on connection status
        if (this.config.mode === 'auto') {
            this.mode = isConnected ? 'api' : 'local';
        } else {
            this.mode = this.config.mode;
        }

        return isConnected;
    }

    /**
     * Add status change listener
     */
    onStatusChange(callback) {
        this.statusListeners.push(callback);
    }

    /**
     * Notify all status listeners
     */
    notifyStatusChange(status) {
        this.statusListeners.forEach(listener => {
            try {
                listener(status, this.mode);
            } catch (error) {
                console.error('Error in status listener:', error);
            }
        });
    }

    /**
     * Set API key
     */
    setApiKey(apiKey) {
        this.config.apiKey = apiKey;
        this.apiClient.setApiKey(apiKey);
        this.saveConfig();
    }

    /**
     * Set API base URL
     */
    setApiBaseURL(baseURL) {
        this.config.apiBaseURL = baseURL;
        this.saveConfig();
        // Reinitialize with new URL
        this.initialize();
    }

    /**
     * Set integration mode
     */
    setMode(mode) {
        if (['api', 'local', 'auto'].includes(mode)) {
            this.config.mode = mode;
            this.mode = mode;
            this.saveConfig();
            this.checkConnection();
        } else {
            throw new Error('Invalid mode. Must be "api", "local", or "auto"');
        }
    }

    /**
     * Get current mode
     */
    getMode() {
        return this.mode;
    }

    /**
     * Check if using API mode
     */
    isAPIMode() {
        return this.mode === 'api';
    }

    /**
     * Check if using local mode
     */
    isLocalMode() {
        return this.mode === 'local';
    }

    /**
     * Get API client
     */
    getAPIClient() {
        return this.apiClient;
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            status: this.connectionStatus,
            mode: this.mode,
            connected: this.connectionStatus === 'connected',
            apiURL: this.config.apiBaseURL,
            hasApiKey: !!this.config.apiKey
        };
    }

    /**
     * Test API connection
     */
    async testConnection() {
        console.log('🧪 Testing API connection...');

        try {
            const response = await this.apiClient.request('/../../health');

            if (response.status === 'healthy') {
                console.log('✅ API connection test successful');
                return {
                    success: true,
                    message: 'API connection successful',
                    data: response
                };
            } else {
                console.warn('⚠️  API responded but status is not healthy');
                return {
                    success: false,
                    message: 'API responded but not healthy',
                    data: response
                };
            }
        } catch (error) {
            console.error('❌ API connection test failed:', error);
            return {
                success: false,
                message: error.message,
                error
            };
        }
    }

    /**
     * Execute operation with automatic fallback
     */
    async executeWithFallback(apiOperation, localOperation) {
        if (this.isAPIMode()) {
            try {
                return await apiOperation(this.apiClient);
            } catch (error) {
                console.warn('API operation failed, falling back to local:', error);

                if (this.config.mode === 'auto') {
                    // Auto mode - fall back to local
                    return await localOperation();
                } else {
                    // API mode forced - throw error
                    throw error;
                }
            }
        } else {
            // Local mode
            return await localOperation();
        }
    }

    /**
     * Get configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Update configuration
     */
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        this.saveConfig();

        // Reinitialize if critical settings changed
        if (updates.apiBaseURL || updates.apiKey) {
            this.initialize();
        }
    }

    /**
     * Reset to defaults
     */
    resetConfig() {
        localStorage.removeItem('edullm_integration_config');
        this.config = this.loadConfig();
        this.initialize();
    }

    /**
     * Get integration status summary
     */
    getStatusSummary() {
        return {
            mode: this.mode,
            connectionStatus: this.connectionStatus,
            connected: this.connectionStatus === 'connected',
            apiURL: this.config.apiBaseURL,
            hasApiKey: !!this.config.apiKey,
            lastError: this.apiClient?.getLastError(),
            config: {
                mode: this.config.mode,
                checkInterval: this.config.checkInterval,
                timeout: this.config.timeout,
                retryAttempts: this.config.retryAttempts
            }
        };
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.IntegrationManager = IntegrationManager;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntegrationManager;
}
