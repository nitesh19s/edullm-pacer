/**
 * Data Provenance and Audit Trail System
 *
 * Records every data mutation with full context for research reproducibility.
 * Provides queryable audit logs, provenance chains, and compliance reports.
 *
 * @author EduLLM Research Platform
 * @version 1.0.0
 */

class AuditTrail {
    constructor() {
        this.sessionId = crypto.randomUUID();
        this.buffer = [];
        this.flushInterval = 5000; // 5 seconds
        this.initialized = false;
        this.db = null;
        this.storeName = 'auditTrail';
    }

    async initialize() {
        if (this.initialized) return;

        // Try to use existing database
        if (window.database?.db) {
            this.db = window.database.db;
        }

        // Start periodic flush
        this._flushTimer = setInterval(() => this.flush(), this.flushInterval);

        this.initialized = true;
        console.log(`✅ Audit Trail initialized (session: ${this.sessionId.substring(0, 8)}...)`);
    }

    /**
     * Record an audit event
     *
     * @param {string} action - CREATE|UPDATE|DELETE|READ|COMPUTE|EXPORT
     * @param {string} entityType - experiment|run|dataset|metric|config|chunk|query
     * @param {string} entityId - ID of the affected entity
     * @param {object} details - Action-specific details
     */
    record(action, entityType, entityId, details = {}) {
        const event = {
            id: crypto.randomUUID(),
            sessionId: this.sessionId,
            action,
            entityType,
            entityId: entityId || 'unknown',
            details: {
                ...details,
                summary: details.summary || `${action} ${entityType}`
            },
            timestamp: new Date().toISOString(),
            timestampMs: Date.now(),
            context: {
                configHash: window.configManager?.currentVersion?.hash || null,
                experimentId: window.experimentTracker?.currentExperiment || null,
                runId: window.experimentTracker?.currentRun || null
            }
        };

        this.buffer.push(event);

        // Flush immediately for critical actions
        if (['DELETE', 'EXPORT', 'COMPUTE'].includes(action)) {
            this.flush();
        }
    }

    /**
     * Flush buffered events to storage
     */
    async flush() {
        if (this.buffer.length === 0) return;

        const events = [...this.buffer];
        this.buffer = [];

        // Store in IndexedDB if available
        if (this.db) {
            try {
                const storeNames = Array.from(this.db.objectStoreNames);
                if (storeNames.includes(this.storeName)) {
                    const tx = this.db.transaction([this.storeName], 'readwrite');
                    const store = tx.objectStore(this.storeName);
                    for (const event of events) {
                        store.add(event);
                    }
                    return;
                }
            } catch (error) {
                // Fall through to localStorage
            }
        }

        // Fallback to localStorage
        try {
            const existing = JSON.parse(localStorage.getItem('audit_trail') || '[]');
            existing.push(...events);
            // Keep last 10000 events
            const trimmed = existing.slice(-10000);
            localStorage.setItem('audit_trail', JSON.stringify(trimmed));
        } catch (error) {
            console.error('Audit trail flush error:', error);
        }
    }

    /**
     * Query audit trail with filters
     *
     * @param {object} filters - {entityType, entityId, action, sessionId, startDate, endDate}
     * @returns {Promise<array>} Matching events
     */
    async query(filters = {}) {
        let events = [];

        // Load from localStorage
        try {
            events = JSON.parse(localStorage.getItem('audit_trail') || '[]');
        } catch (e) {
            events = [];
        }

        // Include buffered events
        events = [...events, ...this.buffer];

        // Apply filters
        if (filters.entityType) {
            events = events.filter(e => e.entityType === filters.entityType);
        }
        if (filters.entityId) {
            events = events.filter(e => e.entityId === filters.entityId);
        }
        if (filters.action) {
            events = events.filter(e => e.action === filters.action);
        }
        if (filters.sessionId) {
            events = events.filter(e => e.sessionId === filters.sessionId);
        }
        if (filters.startDate) {
            const start = new Date(filters.startDate).getTime();
            events = events.filter(e => e.timestampMs >= start);
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate).getTime();
            events = events.filter(e => e.timestampMs <= end);
        }

        return events.sort((a, b) => a.timestampMs - b.timestampMs);
    }

    /**
     * Get all events for a specific experiment
     *
     * @param {string} experimentId
     * @returns {Promise<array>}
     */
    async exportForExperiment(experimentId) {
        const events = await this.query({});
        return events.filter(e =>
            e.context.experimentId === experimentId ||
            e.entityId === experimentId ||
            (e.entityType === 'experiment' && e.entityId === experimentId)
        );
    }

    /**
     * Generate provenance report for an experiment
     *
     * @param {string} experimentId
     * @returns {Promise<object>}
     */
    async generateProvenanceReport(experimentId) {
        const events = await this.exportForExperiment(experimentId);

        const actionCounts = {};
        for (const e of events) {
            actionCounts[e.action] = (actionCounts[e.action] || 0) + 1;
        }

        const entityTypes = {};
        for (const e of events) {
            entityTypes[e.entityType] = (entityTypes[e.entityType] || 0) + 1;
        }

        return {
            experimentId,
            reportGeneratedAt: new Date().toISOString(),
            eventCount: events.length,
            actionCounts,
            entityTypes,
            sessions: [...new Set(events.map(e => e.sessionId))],
            timeline: events.map(e => ({
                time: e.timestamp,
                action: e.action,
                entity: `${e.entityType}:${e.entityId}`,
                summary: e.details.summary
            })),
            dataLineage: this._buildLineage(events)
        };
    }

    /**
     * Build data lineage from events
     */
    _buildLineage(events) {
        const creates = events.filter(e => e.action === 'CREATE');
        const transforms = events.filter(e => ['UPDATE', 'COMPUTE'].includes(e.action));

        return {
            sources: creates.map(e => ({
                entityType: e.entityType,
                entityId: e.entityId,
                createdAt: e.timestamp
            })),
            transformations: transforms.map(e => ({
                entityType: e.entityType,
                entityId: e.entityId,
                action: e.action,
                at: e.timestamp,
                details: e.details.summary
            }))
        };
    }

    /**
     * Export full audit trail as JSON
     * @returns {string}
     */
    async exportAll() {
        const events = await this.query({});
        return JSON.stringify({
            exportedAt: new Date().toISOString(),
            sessionId: this.sessionId,
            eventCount: events.length,
            events
        }, null, 2);
    }

    /**
     * Get session summary
     */
    async getSessionSummary() {
        const events = await this.query({ sessionId: this.sessionId });
        return {
            sessionId: this.sessionId,
            eventCount: events.length,
            firstEvent: events[0]?.timestamp,
            lastEvent: events[events.length - 1]?.timestamp,
            actions: [...new Set(events.map(e => e.action))]
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this._flushTimer) {
            clearInterval(this._flushTimer);
        }
        this.flush();
    }
}

window.auditTrail = new AuditTrail();
console.log('✅ Audit Trail module loaded');
