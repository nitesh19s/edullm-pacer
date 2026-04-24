/**
 * Configuration Manager with Versioning
 *
 * Provides immutable config snapshots for experiment reproducibility.
 * Each snapshot is content-addressed via SHA-256 hash.
 *
 * @author EduLLM Research Platform
 * @version 1.0.0
 */

class ConfigManager {
    constructor() {
        this.versions = [];
        this.currentVersion = null;
        this.initialized = false;
    }

    async initialize() {
        try {
            const saved = localStorage.getItem('config_versions');
            if (saved) {
                this.versions = JSON.parse(saved);
                this.currentVersion = this.versions[this.versions.length - 1] || null;
            }
            this.initialized = true;
            console.log('✅ ConfigManager initialized');
        } catch (error) {
            console.error('ConfigManager init error:', error);
        }
    }

    /**
     * Create an immutable config snapshot
     * @param {object} config - Configuration to snapshot
     * @param {string} label - Human-readable label
     * @returns {object} Versioned snapshot with hash
     */
    async createSnapshot(config, label = '') {
        const frozen = structuredClone(config);
        const hash = await this.hashConfig(frozen);

        // Check for duplicate
        const existing = this.versions.find(v => v.hash === hash);
        if (existing) {
            return { ...existing, alreadyExists: true };
        }

        const snapshot = {
            id: crypto.randomUUID(),
            version: this.versions.length + 1,
            label,
            config: frozen,
            hash,
            timestamp: new Date().toISOString(),
            platform: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                url: window.location.href
            }
        };

        this.versions.push(snapshot);
        this.currentVersion = snapshot;
        this._save();
        return snapshot;
    }

    /**
     * Get a snapshot by version number or hash
     * @param {number|string} versionOrHash
     * @returns {object|null}
     */
    getSnapshot(versionOrHash) {
        if (typeof versionOrHash === 'number') {
            return this.versions.find(v => v.version === versionOrHash) || null;
        }
        return this.versions.find(v => v.hash === versionOrHash) || null;
    }

    /**
     * Deep diff two config snapshots
     * @param {number} v1 - Version number
     * @param {number} v2 - Version number
     * @returns {object} Diff results
     */
    diffSnapshots(v1, v2) {
        const snap1 = this.getSnapshot(v1);
        const snap2 = this.getSnapshot(v2);
        if (!snap1 || !snap2) return null;

        const changes = [];
        this._deepDiff(snap1.config, snap2.config, '', changes);

        return {
            version1: v1,
            version2: v2,
            changeCount: changes.length,
            changes
        };
    }

    _deepDiff(obj1, obj2, path, changes) {
        const keys = new Set([
            ...Object.keys(obj1 || {}),
            ...Object.keys(obj2 || {})
        ]);

        for (const key of keys) {
            const currentPath = path ? `${path}.${key}` : key;
            const val1 = obj1?.[key];
            const val2 = obj2?.[key];

            if (val1 === undefined) {
                changes.push({ path: currentPath, type: 'added', newValue: val2 });
            } else if (val2 === undefined) {
                changes.push({ path: currentPath, type: 'removed', oldValue: val1 });
            } else if (typeof val1 === 'object' && typeof val2 === 'object' &&
                       val1 !== null && val2 !== null && !Array.isArray(val1)) {
                this._deepDiff(val1, val2, currentPath, changes);
            } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
                changes.push({ path: currentPath, type: 'changed', oldValue: val1, newValue: val2 });
            }
        }
    }

    /**
     * Verify config integrity
     * @param {object} snapshot
     * @returns {Promise<boolean>}
     */
    async verifyIntegrity(snapshot) {
        const currentHash = await this.hashConfig(snapshot.config);
        return currentHash === snapshot.hash;
    }

    /**
     * SHA-256 hash of config
     * @param {object} config
     * @returns {Promise<string>}
     */
    async hashConfig(config) {
        const text = JSON.stringify(config, Object.keys(config).sort());
        const buffer = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Export all versions as JSON
     * @returns {string}
     */
    exportAll() {
        return JSON.stringify({
            exportedAt: new Date().toISOString(),
            versionCount: this.versions.length,
            versions: this.versions
        }, null, 2);
    }

    /**
     * Get version history summary
     * @returns {array}
     */
    getHistory() {
        return this.versions.map(v => ({
            version: v.version,
            label: v.label,
            hash: v.hash.substring(0, 12) + '...',
            timestamp: v.timestamp
        }));
    }

    _save() {
        try {
            localStorage.setItem('config_versions', JSON.stringify(this.versions));
        } catch (error) {
            console.error('ConfigManager save error:', error);
        }
    }
}

window.configManager = new ConfigManager();
console.log('✅ ConfigManager module loaded');
