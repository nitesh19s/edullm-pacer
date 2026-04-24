/**
 * EduLLM Platform Configuration
 * Environment-specific settings
 */

const CONFIG = {
    // Environment
    environment: 'production', // 'development' | 'staging' | 'production'

    // Version
    version: '1.0.0',
    buildDate: '2025-01-13',

    // Features
    features: {
        enableAnalytics: true,
        enableErrorLogging: true,
        enableDebugMode: false,
        enableSampleData: false, // Set to true for demo, false for production
        enableExperiments: true,
        enableKnowledgeGraph: true
    },

    // Performance
    performance: {
        enableCaching: true,
        cacheTimeout: 3600000, // 1 hour in milliseconds
        maxCacheSize: 100,
        batchSize: 10,
        maxConcurrentRequests: 5
    },

    // Storage
    storage: {
        dbName: 'edullm_platform',
        dbVersion: 2,
        maxStorageSize: 500 * 1024 * 1024, // 500 MB
        backupEnabled: true,
        backupInterval: 86400000 // 24 hours in milliseconds
    },

    // LLM Integration
    llm: {
        defaultProvider: 'openai',
        timeout: 30000, // 30 seconds
        maxRetries: 3,
        retryDelay: 1000
    },

    // Analytics
    analytics: {
        enabled: true,
        trackingId: '', // Add your Google Analytics ID here
        sendInterval: 60000, // 1 minute
        batchEvents: true,
        endpoint: '' // Optional: Custom analytics endpoint
    },

    // Error Logging
    errorLogging: {
        enabled: true,
        endpoint: '', // Add your logging service endpoint here
        apiKey: '', // Add your logging service API key here
        includeStackTrace: true,
        maxLogSize: 1000
    },

    // Security
    security: {
        contentSecurityPolicy: true,
        sanitizeInputs: true,
        encryptStorage: false,
        maxUploadSize: 50 * 1024 * 1024, // 50 MB
        allowedFileTypes: ['application/pdf']
    },

    // UI
    ui: {
        theme: 'light', // 'light' | 'dark' | 'auto'
        language: 'en',
        animations: true,
        debugPanel: false
    },

    // RAG Settings (defaults)
    rag: {
        topK: 3,
        temperature: 0.7,
        maxTokens: 500,
        embeddingModel: 'use', // 'use' | 'minilm'
        chunkingStrategy: 'sentence'
    }
}

/**
 * Detect environment based on hostname
 */
function detectEnvironment() {
    const hostname = window.location.hostname

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development'
    } else if (hostname.includes('staging')) {
        return 'staging'
    } else {
        return 'production'
    }
}

// Auto-detect environment (can be overridden manually)
CONFIG.environment = detectEnvironment()

// Apply environment-specific overrides
if (CONFIG.environment === 'development') {
    CONFIG.features.enableDebugMode = true
    CONFIG.features.enableSampleData = true
    CONFIG.ui.debugPanel = true
    CONFIG.errorLogging.enabled = false // Don't send logs in dev
}

if (CONFIG.environment === 'staging') {
    CONFIG.features.enableSampleData = true
}

// Freeze configuration to prevent runtime modifications
Object.freeze(CONFIG)
Object.freeze(CONFIG.features)
Object.freeze(CONFIG.performance)
Object.freeze(CONFIG.storage)
Object.freeze(CONFIG.llm)
Object.freeze(CONFIG.analytics)
Object.freeze(CONFIG.errorLogging)
Object.freeze(CONFIG.security)
Object.freeze(CONFIG.ui)
Object.freeze(CONFIG.rag)

console.log(`🚀 EduLLM Platform v${CONFIG.version} (${CONFIG.environment})`)
