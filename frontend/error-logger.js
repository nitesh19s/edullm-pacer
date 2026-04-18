/**
 * Error Logging Service
 * Captures and reports application errors
 */

class ErrorLogger {
    constructor(config) {
        this.config = config
        this.errorQueue = []
        this.flushInterval = null
        this.initialized = false

        // Load persisted errors
        this.loadFromLocalStorage()

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

        // Start periodic flush
        this.startFlushInterval()

        this.initialized = true
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
            version: window.CONFIG?.version || 'unknown',
            environment: window.CONFIG?.environment || 'unknown',
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        }

        // Log to console in development
        if (window.CONFIG?.environment === 'development') {
            console.error('❌ Error logged:', errorEntry)
        }

        // Add to queue
        this.errorQueue.push(errorEntry)

        // Keep only last N errors
        if (this.errorQueue.length > this.config.maxLogSize) {
            this.errorQueue.shift()
        }

        // Save to localStorage for persistence
        this.saveToLocalStorage()

        // Flush immediately for critical errors
        if (error.type === 'global_error' || error.type === 'unhandled_rejection') {
            this.flush()
        }
    }

    /**
     * Log custom error
     */
    log(message, context = {}) {
        this.logError({
            type: 'custom',
            message: message,
            context: context,
            stack: this.config.includeStackTrace ? new Error().stack : undefined
        })
    }

    /**
     * Log warning
     */
    warn(message, context = {}) {
        this.logError({
            type: 'warning',
            message: message,
            context: context
        })
    }

    /**
     * Flush errors to remote endpoint
     */
    async flush() {
        if (this.errorQueue.length === 0) return
        if (!this.config.endpoint) return

        const errors = [...this.errorQueue]
        this.errorQueue = []

        try {
            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.config.apiKey || ''
                },
                body: JSON.stringify({
                    errors: errors,
                    metadata: {
                        version: window.CONFIG?.version,
                        environment: window.CONFIG?.environment,
                        timestamp: new Date().toISOString()
                    }
                })
            })

            if (!response.ok) {
                // Put errors back in queue if sending failed
                this.errorQueue.unshift(...errors)
                console.warn('⚠️ Failed to send error logs:', response.statusText)
            } else {
                // Successfully sent - clear from localStorage
                localStorage.removeItem('error_log_queue')
                console.log('✅ Error logs sent successfully')
            }
        } catch (error) {
            // Network error - keep in queue for retry
            this.errorQueue.unshift(...errors)
            console.warn('⚠️ Network error sending logs:', error.message)
        }
    }

    /**
     * Save to localStorage
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem('error_log_queue', JSON.stringify(this.errorQueue))
        } catch (error) {
            console.warn('⚠️ Failed to save error log to localStorage:', error)
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
                console.log(`📥 Loaded ${this.errorQueue.length} persisted error logs`)
            }
        } catch (error) {
            console.warn('⚠️ Failed to load error log from localStorage:', error)
            this.errorQueue = []
        }
    }

    /**
     * Start flush interval
     */
    startFlushInterval() {
        this.flushInterval = setInterval(() => {
            if (this.errorQueue.length > 0) {
                this.flush()
            }
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
        const errorsByType = this.groupBy(this.errorQueue, 'type')
        const recentErrors = this.errorQueue.slice(-10)

        return {
            totalErrors: this.errorQueue.length,
            queuedErrors: this.errorQueue.length,
            errorTypes: errorsByType,
            recentErrors: recentErrors.map(e => ({
                type: e.type,
                message: e.message,
                timestamp: e.timestamp
            }))
        }
    }

    /**
     * Clear error queue
     */
    clearQueue() {
        this.errorQueue = []
        localStorage.removeItem('error_log_queue')
        console.log('🗑️ Error queue cleared')
    }

    /**
     * Export errors
     */
    exportErrors() {
        const data = {
            errors: this.errorQueue,
            exportDate: new Date().toISOString(),
            errorCount: this.errorQueue.length,
            statistics: this.getStatistics()
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        })

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `error-logs-${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)

        console.log('📥 Error logs exported')
    }

    /**
     * Group by helper
     */
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = item[key] || 'unknown'
            result[group] = (result[group] || 0) + 1
            return result
        }, {})
    }
}

// Initialize global error logger when CONFIG is available
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (window.CONFIG) {
            window.errorLogger = new ErrorLogger(window.CONFIG.errorLogging)
        }
    })
}

console.log('🔍 Error Logger loaded')
