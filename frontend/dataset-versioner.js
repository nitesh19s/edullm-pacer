/**
 * Dataset Versioning System
 *
 * Provides content-addressable versioning of evaluation datasets
 * for reproducible research. Each version is identified by SHA-256 hash.
 *
 * @author EduLLM Research Platform
 * @version 1.0.0
 */

class DatasetVersioner {
    constructor() {
        this.datasets = new Map(); // datasetId -> {name, versions: []}
        this.versions = new Map(); // versionId -> version record
        this.initialized = false;
    }

    async initialize() {
        try {
            const saved = localStorage.getItem('dataset_versions');
            if (saved) {
                const data = JSON.parse(saved);
                this.datasets = new Map(data.datasets || []);
                this.versions = new Map(data.versions || []);
            }
            this.initialized = true;
            console.log('✅ Dataset Versioner initialized');
        } catch (error) {
            console.error('DatasetVersioner init error:', error);
        }
    }

    /**
     * Create a versioned dataset snapshot
     *
     * @param {string} name - Dataset name
     * @param {array} data - Dataset records
     * @param {object} metadata - Schema info, source, description
     * @returns {Promise<object>} Version record with hash
     */
    async createVersion(name, data, metadata = {}) {
        const hash = await this._hashData(data);

        // Check for duplicate by hash
        for (const [, ver] of this.versions) {
            if (ver.hash === hash) {
                return { ...ver, alreadyExists: true };
            }
        }

        // Find or create dataset
        let datasetId = metadata.datasetId;
        if (!datasetId) {
            // Look up by name
            for (const [id, ds] of this.datasets) {
                if (ds.name === name) {
                    datasetId = id;
                    break;
                }
            }
        }
        if (!datasetId) {
            datasetId = crypto.randomUUID();
        }

        // Ensure dataset entry exists
        if (!this.datasets.has(datasetId)) {
            this.datasets.set(datasetId, {
                id: datasetId,
                name,
                createdAt: new Date().toISOString(),
                versionIds: []
            });
        }

        const dataset = this.datasets.get(datasetId);
        const versionNumber = dataset.versionIds.length + 1;

        const version = {
            id: crypto.randomUUID(),
            datasetId,
            datasetName: name,
            version: versionNumber,
            hash,
            recordCount: data.length,
            schema: this._inferSchema(data),
            metadata: {
                ...metadata,
                createdAt: new Date().toISOString(),
                source: metadata.source || 'manual'
            },
            data: structuredClone(data)
        };

        this.versions.set(version.id, version);
        dataset.versionIds.push(version.id);

        // Record in audit trail
        if (window.auditTrail) {
            window.auditTrail.record('CREATE', 'dataset', version.id, {
                summary: `Created v${versionNumber} of "${name}" (${data.length} records, hash: ${hash.substring(0, 12)}...)`,
                hash,
                recordCount: data.length,
                datasetId
            });
        }

        this._save();
        return version;
    }

    /**
     * Get a specific version
     *
     * @param {string} versionId
     * @returns {object|null}
     */
    getVersion(versionId) {
        return this.versions.get(versionId) || null;
    }

    /**
     * Get dataset by name with all versions
     *
     * @param {string} name
     * @returns {object|null}
     */
    getDatasetByName(name) {
        for (const [, ds] of this.datasets) {
            if (ds.name === name) {
                return {
                    ...ds,
                    versions: ds.versionIds.map(id => {
                        const v = this.versions.get(id);
                        return v ? { id: v.id, version: v.version, hash: v.hash, recordCount: v.recordCount, createdAt: v.metadata.createdAt } : null;
                    }).filter(Boolean)
                };
            }
        }
        return null;
    }

    /**
     * Get latest version of a dataset
     *
     * @param {string} datasetId
     * @returns {object|null}
     */
    getLatestVersion(datasetId) {
        const dataset = this.datasets.get(datasetId);
        if (!dataset || dataset.versionIds.length === 0) return null;
        return this.versions.get(dataset.versionIds[dataset.versionIds.length - 1]);
    }

    /**
     * Compare two dataset versions
     *
     * @param {string} versionId1
     * @param {string} versionId2
     * @returns {object} Comparison results
     */
    compareVersions(versionId1, versionId2) {
        const v1 = this.versions.get(versionId1);
        const v2 = this.versions.get(versionId2);

        if (!v1 || !v2) return null;

        return {
            version1: { id: v1.id, version: v1.version, hash: v1.hash, recordCount: v1.recordCount },
            version2: { id: v2.id, version: v2.version, hash: v2.hash, recordCount: v2.recordCount },
            sameData: v1.hash === v2.hash,
            recordCountDiff: v2.recordCount - v1.recordCount,
            schemaChanges: this._diffSchemas(v1.schema, v2.schema)
        };
    }

    /**
     * Verify dataset integrity
     *
     * @param {string} versionId
     * @returns {Promise<object>}
     */
    async verifyIntegrity(versionId) {
        const version = this.versions.get(versionId);
        if (!version) return { valid: false, error: 'Version not found' };

        const currentHash = await this._hashData(version.data);
        return {
            valid: currentHash === version.hash,
            expectedHash: version.hash,
            currentHash,
            recordCount: version.data.length
        };
    }

    /**
     * List all datasets
     * @returns {array}
     */
    listDatasets() {
        return Array.from(this.datasets.values()).map(ds => ({
            id: ds.id,
            name: ds.name,
            versionCount: ds.versionIds.length,
            createdAt: ds.createdAt
        }));
    }

    /**
     * Infer schema from data
     */
    _inferSchema(data) {
        if (!data || data.length === 0) return { fields: [], sampleSize: 0 };

        const sample = data[0];
        const fields = Object.entries(sample).map(([key, value]) => ({
            name: key,
            type: Array.isArray(value) ? 'array' : typeof value,
            nullable: data.some(r => r[key] === null || r[key] === undefined)
        }));

        return { fields, sampleSize: data.length };
    }

    _diffSchemas(s1, s2) {
        const f1 = new Set((s1?.fields || []).map(f => f.name));
        const f2 = new Set((s2?.fields || []).map(f => f.name));

        return {
            added: [...f2].filter(f => !f1.has(f)),
            removed: [...f1].filter(f => !f2.has(f)),
            common: [...f1].filter(f => f2.has(f))
        };
    }

    async _hashData(data) {
        const text = JSON.stringify(data);
        const buffer = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0')).join('');
    }

    _save() {
        try {
            const data = {
                datasets: Array.from(this.datasets.entries()),
                versions: Array.from(this.versions.entries())
            };
            localStorage.setItem('dataset_versions', JSON.stringify(data));
        } catch (error) {
            console.error('DatasetVersioner save error:', error);
        }
    }
}

window.datasetVersioner = new DatasetVersioner();
console.log('✅ Dataset Versioner module loaded');
