/**
 * Analytics Service
 * Tracks user interactions and system metrics
 */

class Analytics {
    constructor(config) {
        this.config = config
        this.eventQueue = []
        this.sessionId = this.generateSessionId()
        this.sessionStartTime = Date.now()
        this.flushInterval = null
        this.initialized = false

        if (this.config.enabled) {
            this.initialize()
        }
    }

    /**
     * Initialize analytics
     */
    initialize() {
        // Load Google Analytics if tracking ID provided
        if (this.config.trackingId) {
            this.loadGoogleAnalytics()
        }

        // Track initial page view
        this.trackPageView()

        // Track session start
        this.trackEvent('session_start', {
            referrer: document.referrer,
            language: navigator.language,
            platform: navigator.platform
        })

        // Start batch flush interval if enabled
        if (this.config.batchEvents) {
            this.startFlushInterval()
        }

        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden')
            } else {
                this.trackEvent('page_visible')
            }
        })

        // Track before unload
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd()
            this.flush() // Final flush
        })

        this.initialized = true
        console.log('📊 Analytics initialized')
    }

    /**
     * Load Google Analytics
     */
    loadGoogleAnalytics() {
        if (document.querySelector(`script[src*="googletagmanager"]`)) {
            console.log('📊 Google Analytics already loaded')
            return
        }

        const script = document.createElement('script')
        script.async = true
        script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.trackingId}`
        document.head.appendChild(script)

        window.dataLayer = window.dataLayer || []
        function gtag() { dataLayer.push(arguments) }
        window.gtag = gtag
        gtag('js', new Date())
        gtag('config', this.config.trackingId, {
            send_page_view: false // We'll send manually
        })

        console.log('📊 Google Analytics loaded')
    }

    /**
     * Track page view
     */
    trackPageView(path = null, title = null) {
        this.trackEvent('page_view', {
            page_path: path || window.location.pathname,
            page_title: title || document.title,
            page_location: window.location.href
        })
    }

    /**
     * Track generic event
     */
    trackEvent(eventName, properties = {}) {
        const event = {
            event: eventName,
            ...properties,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId,
            version: window.CONFIG?.version || 'unknown',
            environment: window.CONFIG?.environment || 'unknown'
        }

        // Send to Google Analytics if available
        if (window.gtag) {
            gtag('event', eventName, properties)
        }

        // Add to custom queue
        this.eventQueue.push(event)

        // Keep queue size manageable
        if (this.eventQueue.length > 1000) {
            this.eventQueue.shift()
        }

        // Flush immediately if not batching
        if (!this.config.batchEvents) {
            this.flush()
        }

        // Log in development
        if (window.CONFIG?.environment === 'development') {
            console.log('📊 Event tracked:', eventName, properties)
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
     * Track section navigation
     */
    trackSectionChange(fromSection, toSection) {
        this.trackEvent('section_change', {
            from_section: fromSection,
            to_section: toSection
        })
    }

    /**
     * Track RAG query
     */
    trackRAGQuery(query, responseTime, chunksRetrieved, hasLLM) {
        this.trackEvent('rag_query', {
            query_length: query.length,
            response_time: responseTime,
            chunks_retrieved: chunksRetrieved,
            has_llm: hasLLM
        })
    }

    /**
     * Track file upload
     */
    trackFileUpload(filename, fileSize, fileType, processingTime, success) {
        this.trackEvent('file_upload', {
            filename,
            file_size: fileSize,
            file_type: fileType,
            processing_time: processingTime,
            success
        })
    }

    /**
     * Track experiment
     */
    trackExperiment(experimentName, experimentId, action) {
        this.trackEvent('experiment', {
            experiment_name: experimentName,
            experiment_id: experimentId,
            action // 'created' | 'run' | 'completed' | 'deleted'
        })
    }

    /**
     * Track chunking
     */
    trackChunking(strategy, documentId, chunksGenerated, processingTime) {
        this.trackEvent('chunking', {
            strategy,
            document_id: documentId,
            chunks_generated: chunksGenerated,
            processing_time: processingTime
        })
    }

    /**
     * Track knowledge graph interaction
     */
    trackGraphInteraction(action, nodeId, nodeType) {
        this.trackEvent('graph_interaction', {
            action, // 'view' | 'add' | 'edit' | 'delete' | 'search'
            node_id: nodeId,
            node_type: nodeType
        })
    }

    /**
     * Track settings change
     */
    trackSettingsChange(setting, oldValue, newValue) {
        this.trackEvent('settings_change', {
            setting,
            old_value: oldValue,
            new_value: newValue
        })
    }

    /**
     * Track error
     */
    trackError(errorType, errorMessage, fatal = false) {
        this.trackEvent('error', {
            error_type: errorType,
            error_message: errorMessage.substring(0, 200), // Limit length
            fatal
        })
    }

    /**
     * Track performance metric
     */
    trackPerformance(metricName, value, unit = 'ms') {
        this.trackEvent('performance', {
            metric_name: metricName,
            value,
            unit
        })
    }

    /**
     * Track feature usage
     */
    trackFeatureUsage(featureName, action) {
        this.trackEvent('feature_usage', {
            feature: featureName,
            action
        })
    }

    /**
     * Track session end
     */
    trackSessionEnd() {
        const sessionDuration = Date.now() - this.sessionStartTime

        this.trackEvent('session_end', {
            session_duration: sessionDuration,
            events_tracked: this.eventQueue.length
        })
    }

    /**
     * Flush events to custom endpoint
     */
    async flush() {
        if (this.eventQueue.length === 0) return
        if (!this.config.endpoint) return

        const events = [...this.eventQueue]
        this.eventQueue = []

        try {
            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    events: events,
                    metadata: {
                        session_id: this.sessionId,
                        version: window.CONFIG?.version,
                        environment: window.CONFIG?.environment,
                        timestamp: new Date().toISOString()
                    }
                })
            })

            if (!response.ok) {
                // Put events back in queue
                this.eventQueue.unshift(...events)
                console.warn('⚠️ Failed to send analytics:', response.statusText)
            } else {
                console.log('✅ Analytics sent successfully')
            }
        } catch (error) {
            // Network error - keep in queue
            this.eventQueue.unshift(...events)
            console.warn('⚠️ Network error sending analytics:', error.message)
        }
    }

    /**
     * Start flush interval
     */
    startFlushInterval() {
        this.flushInterval = setInterval(() => {
            if (this.eventQueue.length > 0) {
                this.flush()
            }
        }, this.config.sendInterval)
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
     * Generate session ID
     */
    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Get analytics summary
     */
    getSummary() {
        const eventTypes = this.groupBy(this.eventQueue, 'event')
        const sessionDuration = Date.now() - this.sessionStartTime

        return {
            sessionId: this.sessionId,
            sessionDuration: sessionDuration,
            totalEvents: this.eventQueue.length,
            eventTypes: eventTypes,
            recentEvents: this.eventQueue.slice(-10)
        }
    }

    /**
     * Get event statistics
     */
    getStatistics() {
        return {
            totalEvents: this.eventQueue.length,
            eventsByType: this.groupBy(this.eventQueue, 'event'),
            eventsLast24Hours: this.filterEventsByTime(86400000),
            eventsLastHour: this.filterEventsByTime(3600000)
        }
    }

    /**
     * Filter events by time
     */
    filterEventsByTime(milliseconds) {
        const cutoff = Date.now() - milliseconds
        return this.eventQueue.filter(event => {
            const eventTime = new Date(event.timestamp).getTime()
            return eventTime > cutoff
        }).length
    }

    /**
     * Export analytics data
     */
    exportAnalytics() {
        const data = {
            summary: this.getSummary(),
            statistics: this.getStatistics(),
            events: this.eventQueue,
            exportDate: new Date().toISOString()
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        })

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)

        console.log('📥 Analytics exported')
    }

    /**
     * Clear analytics data
     */
    clearAnalytics() {
        this.eventQueue = []
        console.log('🗑️ Analytics data cleared')
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

// Initialize global analytics when CONFIG is available
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (window.CONFIG) {
            window.analytics = new Analytics(window.CONFIG.analytics)
        }
    })
}

console.log('📊 Analytics loaded')
