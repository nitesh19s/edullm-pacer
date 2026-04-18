# EduLLM Platform - Deployment Guide

**Complete Guide for Deploying the Platform**

---

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Environment Configuration](#environment-configuration)
3. [Local Development](#local-development)
4. [Production Deployment](#production-deployment)
5. [Security Hardening](#security-hardening)
6. [Error Logging](#error-logging)
7. [Analytics Tracking](#analytics-tracking)
8. [Performance Monitoring](#performance-monitoring)
9. [Maintenance](#maintenance)

---

## Deployment Overview

### Platform Characteristics

**Client-Side Application**
- Pure HTML/CSS/JavaScript
- No backend server required
- Can be hosted on any static hosting service

**Dependencies**
- External: TensorFlow.js (CDN)
- External: Font Awesome (CDN)
- All other code is self-contained

**Browser Requirements**
- Modern browser with ES6+ support
- IndexedDB support
- WebGL support (for embeddings)
- Minimum 500MB available storage

---

## Environment Configuration

### Configuration File

Create `config.js` for environment-specific settings:

```javascript
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
        enableSampleData: false, // Disable in production
        enableExperiments: true,
        enableKnowledgeGraph: true
    },

    // Performance
    performance: {
        enableCaching: true,
        cacheTimeout: 3600000, // 1 hour
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
        backupInterval: 86400000 // 24 hours
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
        trackingId: 'UA-XXXXX-X', // Replace with your tracking ID
        sendInterval: 60000, // 1 minute
        batchEvents: true
    },

    // Error Logging
    errorLogging: {
        enabled: true,
        endpoint: 'https://your-logging-service.com/api/logs',
        apiKey: 'your-api-key',
        includeStackTrace: true,
        maxLogSize: 1000
    },

    // Security
    security: {
        contentSecurityPolicy: true,
        sanitizeInputs: true,
        encryptStorage: false, // Set true if sensitive data
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

// Freeze to prevent modifications
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
```

### Environment Detection

Add to `script.js`:

```javascript
/**
 * Detect environment
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

// Override config based on detected environment
CONFIG.environment = detectEnvironment()

if (CONFIG.environment === 'development') {
    CONFIG.features.enableDebugMode = true
    CONFIG.features.enableSampleData = true
    CONFIG.ui.debugPanel = true
}
```

### Feature Flags

```javascript
/**
 * Feature flag system
 */
class FeatureFlags {
    constructor(config) {
        this.flags = config.features
    }

    isEnabled(feature) {
        return this.flags[feature] === true
    }

    enable(feature) {
        if (CONFIG.environment !== 'production') {
            this.flags[feature] = true
        }
    }

    disable(feature) {
        if (CONFIG.environment !== 'production') {
            this.flags[feature] = false
        }
    }
}

window.featureFlags = new FeatureFlags(CONFIG)

// Usage
if (featureFlags.isEnabled('enableAnalytics')) {
    initializeAnalytics()
}
```

---

## Local Development

### Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd edullm-platform
   ```

2. **Configure Environment**
   ```bash
   cp config.example.js config.js
   # Edit config.js with your settings
   ```

3. **Start Local Server**
   ```bash
   # Python 3
   python -m http.server 8000

   # Or Node.js
   npx http-server -p 8000

   # Or PHP
   php -S localhost:8000
   ```

4. **Open in Browser**
   ```
   http://localhost:8000
   ```

### Development Tools

**Browser DevTools**:
- Console: All logs with emoji prefixes
- Application: Inspect IndexedDB
- Network: Monitor API calls
- Performance: Profile execution

**Hot Reload** (optional):
```bash
# Install live-server
npm install -g live-server

# Run with auto-reload
live-server --port=8000
```

---

## Production Deployment

### Option 1: GitHub Pages

**Steps**:

1. **Prepare Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/username/edullm-platform.git
   git branch -M main
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to repository Settings
   - Navigate to Pages section
   - Select branch: `main`
   - Select folder: `/ (root)`
   - Click Save

4. **Access Deployed Site**
   ```
   https://username.github.io/edullm-platform/
   ```

**Configuration**:
```javascript
// config.js for GitHub Pages
const CONFIG = {
    environment: 'production',
    basePath: '/edullm-platform/', // Repository name
    // ... other settings
}
```

### Option 2: Netlify

**Steps**:

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**
   ```bash
   netlify login
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

4. **Configure** (netlify.toml)
   ```toml
   [build]
     publish = "."

   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-Content-Type-Options = "nosniff"
       Referrer-Policy = "strict-origin-when-cross-origin"
       Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data:;"
   ```

### Option 3: Vercel

**Steps**:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Configure** (vercel.json)
   ```json
   {
     "version": 2,
     "public": true,
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "X-Frame-Options",
             "value": "DENY"
           },
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           },
           {
             "key": "Referrer-Policy",
             "value": "strict-origin-when-cross-origin"
           }
         ]
       }
     ]
   }
   ```

### Option 4: AWS S3 + CloudFront

**Steps**:

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://edullm-platform
   ```

2. **Upload Files**
   ```bash
   aws s3 sync . s3://edullm-platform --exclude ".git/*"
   ```

3. **Enable Static Website Hosting**
   ```bash
   aws s3 website s3://edullm-platform --index-document index.html
   ```

4. **Create CloudFront Distribution**
   - Origin: S3 bucket
   - Default root object: index.html
   - Viewer protocol policy: Redirect HTTP to HTTPS

5. **Configure DNS**
   - Point custom domain to CloudFront distribution
   - Add CNAME record

---

## Security Hardening

### Content Security Policy

Add to `index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com;
    img-src 'self' data:;
    connect-src 'self' https://api.openai.com;
">
```

### Input Sanitization

```javascript
/**
 * Security utilities
 */
const SecurityUtils = {
    /**
     * Sanitize HTML input
     */
    sanitizeHTML(input) {
        const div = document.createElement('div')
        div.textContent = input
        return div.innerHTML
    },

    /**
     * Sanitize query string
     */
    sanitizeQuery(query) {
        return query
            .trim()
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, '')
            .replace(/[^\w\s\-_.?!]/g, '')
            .substring(0, 5000)
    },

    /**
     * Validate file type
     */
    validateFileType(file, allowedTypes) {
        return allowedTypes.includes(file.type)
    },

    /**
     * Validate file size
     */
    validateFileSize(file, maxSize) {
        return file.size <= maxSize
    },

    /**
     * Encode API key for storage
     */
    encodeAPIKey(key) {
        return btoa(key)
    },

    /**
     * Decode API key from storage
     */
    decodeAPIKey(encoded) {
        try {
            return atob(encoded)
        } catch {
            return null
        }
    }
}

window.SecurityUtils = SecurityUtils
```

### HTTPS Enforcement

```javascript
/**
 * Redirect to HTTPS if on HTTP
 */
if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
    window.location.href = window.location.href.replace('http:', 'https:')
}
```

### Rate Limiting

```javascript
/**
 * Rate limiter for API calls
 */
class RateLimiter {
    constructor(maxRequests, timeWindow) {
        this.maxRequests = maxRequests
        this.timeWindow = timeWindow
        this.requests = []
    }

    canMakeRequest() {
        const now = Date.now()
        this.requests = this.requests.filter(time => now - time < this.timeWindow)

        if (this.requests.length < this.maxRequests) {
            this.requests.push(now)
            return true
        }

        return false
    }

    getRemainingTime() {
        if (this.requests.length === 0) return 0

        const oldestRequest = Math.min(...this.requests)
        const timeElapsed = Date.now() - oldestRequest

        return Math.max(0, this.timeWindow - timeElapsed)
    }
}

// Usage: 10 requests per minute
const apiRateLimiter = new RateLimiter(10, 60000)
```

---

## Error Logging

### Error Logger Service

Create `error-logger.js`:

```javascript
/**
 * Error Logging Service
 * Captures and reports application errors
 */

class ErrorLogger {
    constructor(config) {
        this.config = config
        this.errorQueue = []
        this.flushInterval = null

        if (this.config.enabled) {
            this.initialize()
        }
    }

    /**
     * Initialize error logging
     */
    initialize() {
        // Capture global errors
        window.addEventListener('error', (event) => {
            this.logError({
                type: 'global_error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            })
        })

        // Capture unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                type: 'unhandled_rejection',
                message: event.reason?.message || String(event.reason),
                stack: event.reason?.stack
            })
        })

        // Start flush interval
        this.startFlushInterval()

        console.log('🔍 Error logging initialized')
    }

    /**
     * Log error
     */
    logError(error) {
        const errorEntry = {
            ...error,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            version: CONFIG.version,
            environment: CONFIG.environment
        }

        // Log to console in development
        if (CONFIG.environment === 'development') {
            console.error('❌ Error logged:', errorEntry)
        }

        // Add to queue
        this.errorQueue.push(errorEntry)

        // Flush if queue is full
        if (this.errorQueue.length >= this.config.maxLogSize) {
            this.flush()
        }

        // Save to localStorage for persistence
        this.saveToLocalStorage()
    }

    /**
     * Log custom error
     */
    log(message, context = {}) {
        this.logError({
            type: 'custom',
            message: message,
            context: context,
            stack: new Error().stack
        })
    }

    /**
     * Flush errors to remote endpoint
     */
    async flush() {
        if (this.errorQueue.length === 0) return

        const errors = [...this.errorQueue]
        this.errorQueue = []

        try {
            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.config.apiKey
                },
                body: JSON.stringify({ errors })
            })

            if (!response.ok) {
                // Put errors back in queue
                this.errorQueue.unshift(...errors)
            } else {
                // Clear from localStorage
                localStorage.removeItem('error_log_queue')
            }
        } catch (error) {
            // Network error - keep in queue
            this.errorQueue.unshift(...errors)
            console.warn('Failed to send error logs:', error)
        }
    }

    /**
     * Save to localStorage
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem('error_log_queue', JSON.stringify(this.errorQueue))
        } catch (error) {
            console.warn('Failed to save error log to localStorage:', error)
        }
    }

    /**
     * Load from localStorage
     */
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('error_log_queue')
            if (saved) {
                this.errorQueue = JSON.parse(saved)
            }
        } catch (error) {
            console.warn('Failed to load error log from localStorage:', error)
        }
    }

    /**
     * Start flush interval
     */
    startFlushInterval() {
        this.flushInterval = setInterval(() => {
            this.flush()
        }, 60000) // Flush every minute
    }

    /**
     * Stop flush interval
     */
    stopFlushInterval() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval)
            this.flushInterval = null
        }
    }

    /**
     * Get error statistics
     */
    getStatistics() {
        return {
            queuedErrors: this.errorQueue.length,
            errorTypes: this.groupBy(this.errorQueue, 'type'),
            recentErrors: this.errorQueue.slice(-10)
        }
    }

    groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = item[key] || 'unknown'
            result[group] = (result[group] || 0) + 1
            return result
        }, {})
    }
}

// Initialize global error logger
window.errorLogger = new ErrorLogger(CONFIG.errorLogging)
```

### Usage

```javascript
// Automatic (global errors)
throw new Error('Something went wrong')

// Manual logging
window.errorLogger.log('Failed to process document', {
    documentId: 123,
    operation: 'chunking',
    details: 'Invalid format'
})

// In try-catch blocks
try {
    await riskyOperation()
} catch (error) {
    window.errorLogger.log('Operation failed', {
        operation: 'riskyOperation',
        error: error.message
    })
}
```

---

## Analytics Tracking

### Analytics Service

Create `analytics.js`:

```javascript
/**
 * Analytics Service
 * Tracks user interactions and system metrics
 */

class Analytics {
    constructor(config) {
        this.config = config
        this.eventQueue = []
        this.sessionId = this.generateSessionId()
        this.flushInterval = null

        if (this.config.enabled) {
            this.initialize()
        }
    }

    /**
     * Initialize analytics
     */
    initialize() {
        // Load Google Analytics (optional)
        if (this.config.trackingId) {
            this.loadGoogleAnalytics()
        }

        // Track page views
        this.trackPageView()

        // Start flush interval
        if (this.config.batchEvents) {
            this.startFlushInterval()
        }

        console.log('📊 Analytics initialized')
    }

    /**
     * Load Google Analytics
     */
    loadGoogleAnalytics() {
        const script = document.createElement('script')
        script.async = true
        script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.trackingId}`
        document.head.appendChild(script)

        window.dataLayer = window.dataLayer || []
        function gtag() { dataLayer.push(arguments) }
        window.gtag = gtag
        gtag('js', new Date())
        gtag('config', this.config.trackingId)
    }

    /**
     * Track page view
     */
    trackPageView() {
        this.trackEvent('page_view', {
            page_path: window.location.pathname,
            page_title: document.title
        })
    }

    /**
     * Track event
     */
    trackEvent(eventName, properties = {}) {
        const event = {
            event: eventName,
            ...properties,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId,
            version: CONFIG.version
        }

        // Send to Google Analytics
        if (window.gtag) {
            gtag('event', eventName, properties)
        }

        // Add to custom queue
        this.eventQueue.push(event)

        // Flush immediately if not batching
        if (!this.config.batchEvents) {
            this.flush()
        }

        // Log in development
        if (CONFIG.environment === 'development') {
            console.log('📊 Event tracked:', event)
        }
    }

    /**
     * Track user interaction
     */
    trackInteraction(category, action, label = '', value = 0) {
        this.trackEvent('user_interaction', {
            category,
            action,
            label,
            value
        })
    }

    /**
     * Track RAG query
     */
    trackRAGQuery(query, responseTime, accuracy) {
        this.trackEvent('rag_query', {
            query_length: query.length,
            response_time: responseTime,
            accuracy: accuracy
        })
    }

    /**
     * Track file upload
     */
    trackFileUpload(filename, fileSize, processingTime) {
        this.trackEvent('file_upload', {
            filename,
            file_size: fileSize,
            processing_time: processingTime
        })
    }

    /**
     * Track experiment
     */
    trackExperiment(experimentName, variant, outcome) {
        this.trackEvent('experiment', {
            experiment_name: experimentName,
            variant,
            outcome
        })
    }

    /**
     * Track error
     */
    trackError(errorType, errorMessage) {
        this.trackEvent('error', {
            error_type: errorType,
            error_message: errorMessage
        })
    }

    /**
     * Flush events to endpoint
     */
    async flush() {
        if (this.eventQueue.length === 0) return

        const events = [...this.eventQueue]
        this.eventQueue = []

        // Send to custom endpoint (optional)
        if (this.config.endpoint) {
            try {
                await fetch(this.config.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ events })
                })
            } catch (error) {
                console.warn('Failed to send analytics:', error)
            }
        }
    }

    /**
     * Start flush interval
     */
    startFlushInterval() {
        this.flushInterval = setInterval(() => {
            this.flush()
        }, this.config.sendInterval)
    }

    /**
     * Generate session ID
     */
    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Get analytics summary
     */
    getSummary() {
        return {
            totalEvents: this.eventQueue.length,
            sessionId: this.sessionId,
            eventTypes: this.groupBy(this.eventQueue, 'event')
        }
    }

    groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = item[key] || 'unknown'
            result[group] = (result[group] || 0) + 1
            return result
        }, {})
    }
}

// Initialize global analytics
window.analytics = new Analytics(CONFIG.analytics)
```

### Usage Examples

```javascript
// Track section navigation
function switchSection(sectionId) {
    analytics.trackInteraction('navigation', 'switch_section', sectionId)
    // ... show section
}

// Track RAG query
async function processQuery(query) {
    const startTime = Date.now()
    const result = await ragSystem.query(query)
    const duration = (Date.now() - startTime) / 1000

    analytics.trackRAGQuery(query, duration, result.confidence)
}

// Track file upload
async function uploadFile(file) {
    const startTime = Date.now()
    await processFile(file)
    const duration = (Date.now() - startTime) / 1000

    analytics.trackFileUpload(file.name, file.size, duration)
}
```

---

## Performance Monitoring

### Performance Monitor

Create `performance-monitor.js`:

```javascript
/**
 * Performance Monitoring Service
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {}
        this.marks = {}
    }

    /**
     * Start timing
     */
    startTimer(label) {
        this.marks[label] = performance.now()
    }

    /**
     * End timing
     */
    endTimer(label) {
        if (!this.marks[label]) return null

        const duration = performance.now() - this.marks[label]
        delete this.marks[label]

        if (!this.metrics[label]) {
            this.metrics[label] = []
        }

        this.metrics[label].push(duration)

        return duration
    }

    /**
     * Get metric statistics
     */
    getStats(label) {
        const values = this.metrics[label] || []
        if (values.length === 0) return null

        return {
            count: values.length,
            average: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            median: this.median(values)
        }
    }

    /**
     * Get all metrics
     */
    getAllMetrics() {
        const result = {}
        for (const label in this.metrics) {
            result[label] = this.getStats(label)
        }
        return result
    }

    /**
     * Calculate median
     */
    median(values) {
        const sorted = [...values].sort((a, b) => a - b)
        const mid = Math.floor(sorted.length / 2)
        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid]
    }

    /**
     * Log metrics to console
     */
    logMetrics() {
        console.table(this.getAllMetrics())
    }
}

// Initialize global performance monitor
window.performanceMonitor = new PerformanceMonitor()
```

### Usage

```javascript
// Time RAG queries
performanceMonitor.startTimer('rag_query')
await processRAGQuery(query)
const duration = performanceMonitor.endTimer('rag_query')
console.log(`Query took ${duration.toFixed(2)}ms`)

// Time embeddings
performanceMonitor.startTimer('embedding')
await embeddingManager.encode(text)
performanceMonitor.endTimer('embedding')

// View all metrics
performanceMonitor.logMetrics()
```

---

## Maintenance

### Backup and Restore

```javascript
/**
 * Backup all platform data
 */
async function backupAllData() {
    const backup = {
        version: CONFIG.version,
        timestamp: new Date().toISOString(),
        database: await exportDatabase(),
        localStorage: exportLocalStorage(),
        settings: await exportSettings()
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `edullm-backup-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    console.log('💾 Backup created')
}

/**
 * Restore from backup
 */
async function restoreFromBackup(backupFile) {
    const reader = new FileReader()

    reader.onload = async (event) => {
        try {
            const backup = JSON.parse(event.target.result)

            // Verify version compatibility
            if (backup.version !== CONFIG.version) {
                console.warn('⚠️ Backup version mismatch')
            }

            // Restore database
            await importDatabase(backup.database)

            // Restore localStorage
            importLocalStorage(backup.localStorage)

            // Restore settings
            await importSettings(backup.settings)

            console.log('✅ Backup restored')
            location.reload()

        } catch (error) {
            console.error('❌ Backup restore failed:', error)
        }
    }

    reader.readAsText(backupFile)
}
```

### Health Check

```javascript
/**
 * System health check
 */
async function systemHealthCheck() {
    const health = {
        timestamp: new Date().toISOString(),
        checks: {}
    }

    // Check database
    health.checks.database = {
        status: window.database && window.database.db ? 'ok' : 'error',
        stores: window.database ? 17 : 0
    }

    // Check managers
    health.checks.managers = {
        dashboard: window.dashboardManager?.initialized || false,
        ragChat: window.ragChatManager?.initialized || false,
        embeddings: window.embeddingManager?.model !== null || false
    }

    // Check storage
    if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate()
        health.checks.storage = {
            used: estimate.usage,
            quota: estimate.quota,
            percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2)
        }
    }

    // Check performance
    health.checks.performance = performanceMonitor.getAllMetrics()

    console.log('🏥 Health Check:', health)
    return health
}
```

### Update Mechanism

```javascript
/**
 * Check for updates
 */
async function checkForUpdates() {
    try {
        const response = await fetch('/version.json')
        const data = await response.json()

        if (data.version !== CONFIG.version) {
            console.log('🔄 Update available:', data.version)

            // Show update notification
            showUpdateNotification(data.version, data.changes)
        }
    } catch (error) {
        console.warn('Failed to check for updates:', error)
    }
}

// Check on startup
window.addEventListener('load', checkForUpdates)

// Check periodically (every hour)
setInterval(checkForUpdates, 3600000)
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Update version number in config.js
- [ ] Set environment to 'production'
- [ ] Disable debug mode and sample data
- [ ] Configure analytics tracking ID
- [ ] Configure error logging endpoint
- [ ] Test all features thoroughly
- [ ] Run performance benchmarks
- [ ] Check browser compatibility
- [ ] Verify security headers
- [ ] Test backup and restore

### Deployment

- [ ] Minify JavaScript (optional)
- [ ] Optimize images
- [ ] Configure CDN for static assets
- [ ] Set up SSL/TLS certificate
- [ ] Configure Content Security Policy
- [ ] Deploy to hosting service
- [ ] Configure custom domain (if applicable)
- [ ] Test deployed version
- [ ] Monitor for errors
- [ ] Verify analytics tracking

### Post-Deployment

- [ ] Monitor error logs
- [ ] Check analytics data
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Plan maintenance window
- [ ] Document deployment
- [ ] Update README with live URL
- [ ] Announce release

---

**Platform is now ready for production deployment!**

**For user documentation, see USER_GUIDE.md**

**For technical details, see DEVELOPER_GUIDE.md**
