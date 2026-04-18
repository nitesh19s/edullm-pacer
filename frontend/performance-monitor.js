/**
 * Performance Monitoring Service
 * Tracks and analyzes application performance metrics
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {}
        this.marks = {}
        this.observers = []
        this.initialized = false
    }

    /**
     * Initialize performance monitoring
     */
    initialize() {
        // Observe long tasks (> 50ms)
        if ('PerformanceObserver' in window) {
            this.observeLongTasks()
            this.observeResourceTiming()
        }

        // Monitor memory usage if available
        if (performance.memory) {
            this.startMemoryMonitoring()
        }

        this.initialized = true
        console.log('⚡ Performance monitoring initialized')
    }

    /**
     * Start timing a metric
     */
    startTimer(label) {
        this.marks[label] = performance.now()
    }

    /**
     * End timing a metric
     */
    endTimer(label) {
        if (!this.marks[label]) {
            console.warn(`⚠️ No start mark found for: ${label}`)
            return null
        }

        const duration = performance.now() - this.marks[label]
        delete this.marks[label]

        // Store metric
        if (!this.metrics[label]) {
            this.metrics[label] = []
        }

        this.metrics[label].push(duration)

        // Keep only last 100 measurements
        if (this.metrics[label].length > 100) {
            this.metrics[label].shift()
        }

        // Track in analytics if available
        if (window.analytics) {
            window.analytics.trackPerformance(label, duration)
        }

        return duration
    }

    /**
     * Measure function execution time
     */
    async measure(label, fn) {
        this.startTimer(label)
        try {
            const result = await fn()
            const duration = this.endTimer(label)
            return { result, duration }
        } catch (error) {
            this.endTimer(label)
            throw error
        }
    }

    /**
     * Get statistics for a metric
     */
    getStats(label) {
        const values = this.metrics[label]
        if (!values || values.length === 0) return null

        const sorted = [...values].sort((a, b) => a - b)

        return {
            count: values.length,
            average: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            median: this.calculateMedian(sorted),
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)]
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
    calculateMedian(sortedValues) {
        const mid = Math.floor(sortedValues.length / 2)
        return sortedValues.length % 2 === 0
            ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
            : sortedValues[mid]
    }

    /**
     * Observe long tasks
     */
    observeLongTasks() {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) {
                        this.recordMetric('long_task', entry.duration)

                        // Log warning for very long tasks
                        if (entry.duration > 100) {
                            console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`)
                        }

                        // Track in analytics
                        if (window.analytics && typeof window.analytics.trackPerformance === 'function') {
                            window.analytics.trackPerformance('long_task', entry.duration)
                        }
                    }
                }
            })

            observer.observe({ entryTypes: ['longtask'] })
            this.observers.push(observer)
        } catch (error) {
            console.warn('⚠️ Long task observation not supported')
        }
    }

    /**
     * Observe resource timing
     */
    observeResourceTiming() {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordMetric(`resource_${entry.initiatorType}`, entry.duration)
                }
            })

            observer.observe({ entryTypes: ['resource'] })
            this.observers.push(observer)
        } catch (error) {
            console.warn('⚠️ Resource timing observation not supported')
        }
    }

    /**
     * Start memory monitoring
     */
    startMemoryMonitoring() {
        setInterval(() => {
            if (performance.memory) {
                const memory = {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                    usagePercent: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
                }

                this.recordMetric('memory_usage', memory.usagePercent)

                // Warn if memory usage is high
                if (memory.usagePercent > 80) {
                    console.warn(`⚠️ High memory usage: ${memory.usagePercent.toFixed(1)}%`)
                }
            }
        }, 30000) // Check every 30 seconds
    }

    /**
     * Record a metric value
     */
    recordMetric(label, value) {
        if (!this.metrics[label]) {
            this.metrics[label] = []
        }

        this.metrics[label].push(value)

        // Keep only last 100 measurements
        if (this.metrics[label].length > 100) {
            this.metrics[label].shift()
        }
    }

    /**
     * Get page load metrics
     */
    getPageLoadMetrics() {
        if (!performance.timing) return null

        const timing = performance.timing
        const navigation = performance.getEntriesByType('navigation')[0]

        return {
            // Core Web Vitals
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            pageLoad: timing.loadEventEnd - timing.navigationStart,

            // Detailed timing
            dns: timing.domainLookupEnd - timing.domainLookupStart,
            tcp: timing.connectEnd - timing.connectStart,
            request: timing.responseStart - timing.requestStart,
            response: timing.responseEnd - timing.responseStart,
            domProcessing: timing.domComplete - timing.domLoading,

            // Navigation API metrics
            firstPaint: navigation?.firstPaint || null,
            firstContentfulPaint: navigation?.firstContentfulPaint || null,
            domInteractive: timing.domInteractive - timing.navigationStart
        }
    }

    /**
     * Get current memory info
     */
    getMemoryInfo() {
        if (!performance.memory) return null

        return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            usagePercent: ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(2) + '%'
        }
    }

    /**
     * Log metrics to console
     */
    logMetrics() {
        console.log('\n📊 Performance Metrics:')
        console.table(this.getAllMetrics())

        const pageLoad = this.getPageLoadMetrics()
        if (pageLoad) {
            console.log('\n⚡ Page Load Metrics:')
            console.table(pageLoad)
        }

        const memory = this.getMemoryInfo()
        if (memory) {
            console.log('\n💾 Memory Usage:')
            console.table(memory)
        }
    }

    /**
     * Export metrics
     */
    exportMetrics() {
        const data = {
            metrics: this.getAllMetrics(),
            pageLoad: this.getPageLoadMetrics(),
            memory: this.getMemoryInfo(),
            exportDate: new Date().toISOString()
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        })

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `performance-metrics-${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)

        console.log('📥 Performance metrics exported')
    }

    /**
     * Clear metrics
     */
    clearMetrics() {
        this.metrics = {}
        this.marks = {}
        console.log('🗑️ Performance metrics cleared')
    }

    /**
     * Get performance summary
     */
    getSummary() {
        const allMetrics = this.getAllMetrics()
        const criticalMetrics = {}

        // Extract critical metrics
        for (const [key, stats] of Object.entries(allMetrics)) {
            if (key.includes('rag_query') || key.includes('embedding') ||
                key.includes('search') || key.includes('processing')) {
                criticalMetrics[key] = {
                    avg: stats.average.toFixed(2),
                    p95: stats.p95.toFixed(2)
                }
            }
        }

        return {
            criticalMetrics,
            pageLoad: this.getPageLoadMetrics(),
            memory: this.getMemoryInfo(),
            totalMetrics: Object.keys(allMetrics).length
        }
    }

    /**
     * Check performance health
     */
    checkHealth() {
        const issues = []

        // Check long tasks
        const longTaskStats = this.getStats('long_task')
        if (longTaskStats && longTaskStats.average > 100) {
            issues.push({
                type: 'long_tasks',
                severity: 'warning',
                message: `Average long task duration: ${longTaskStats.average.toFixed(2)}ms`
            })
        }

        // Check memory
        const memory = this.getMemoryInfo()
        if (memory) {
            const usagePercent = parseFloat(memory.usagePercent)
            if (usagePercent > 80) {
                issues.push({
                    type: 'memory',
                    severity: 'critical',
                    message: `High memory usage: ${memory.usagePercent}`
                })
            } else if (usagePercent > 60) {
                issues.push({
                    type: 'memory',
                    severity: 'warning',
                    message: `Elevated memory usage: ${memory.usagePercent}`
                })
            }
        }

        // Check critical operations
        const ragQueryStats = this.getStats('rag_query')
        if (ragQueryStats && ragQueryStats.average > 2000) {
            issues.push({
                type: 'rag_performance',
                severity: 'warning',
                message: `Slow RAG queries: ${ragQueryStats.average.toFixed(2)}ms average`
            })
        }

        return {
            healthy: issues.length === 0,
            issues,
            timestamp: new Date().toISOString()
        }
    }
}

// Initialize global performance monitor
window.performanceMonitor = new PerformanceMonitor()

// Auto-initialize if enabled in config
window.addEventListener('DOMContentLoaded', () => {
    if (window.CONFIG?.performance?.enableMonitoring !== false) {
        window.performanceMonitor.initialize()
    }
})

console.log('⚡ Performance Monitor loaded')
