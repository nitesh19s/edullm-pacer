// Experiment Tracker for EduLLM Platform
// Research experiment management and comparison system
// Enhanced to use Database v2

class ExperimentTracker {
    constructor(database) {
        this.database = database;
        this.currentExperiment = null;
        this.currentRun = null;
        this.experiments = new Map();
        this.runs = new Map();
        this.initialized = false;

        // Initialize asynchronously
        this.initPromise = this.initialize();
    }

    /**
     * Initialize tracker and load data from database
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Ensure database is initialized
            if (this.database) {
                await this.database.initialize();

                // Load experiments from enhanced database
                const experiments = await this.database.getExperiments({}, { limit: 1000 });
                for (const exp of experiments) {
                    this.experiments.set(exp.id, exp);
                }
                console.log(`✅ Loaded ${experiments.length} experiments from database`);

                // Load runs from enhanced database
                // Get all runs for all experiments
                for (const exp of experiments) {
                    const runs = await this.database.getExperimentRuns(exp.id);
                    for (const run of runs) {
                        this.runs.set(run.id, run);
                    }
                }
                console.log(`✅ Loaded ${this.runs.size} experiment runs from database`);
            } else {
                // Fallback to localStorage
                this.loadFromLocalStorage();
            }

            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize experiment tracker:', error);
            // Fallback to localStorage
            this.loadFromLocalStorage();
            this.initialized = true;
        }
    }

    /**
     * Ensure initialization is complete before operations
     */
    async ensureInitialized() {
        if (!this.initialized) {
            await this.initPromise;
        }
    }

    /**
     * Create a new experiment with reproducibility metadata
     *
     * @param {string} name
     * @param {string} description
     * @param {array} tags
     * @param {object} options - {seed, parameters}
     */
    async createExperiment(name, description = '', tags = [], options = {}) {
        await this.ensureInitialized();

        // Generate reproducibility metadata
        const seed = options.seed || (typeof SeededRandom !== 'undefined'
            ? SeededRandom.seedFromString(name + Date.now())
            : Date.now());

        const configSnapshot = window.configManager
            ? await window.configManager.createSnapshot(window.CONFIG || {}, `Experiment: ${name}`)
            : null;

        // Use database v2 format
        const experimentData = {
            name: name,
            description: description,
            parameters: options.parameters || {},
            tags: tags,
            status: 'created',
            metadata: {
                runCount: 0,
                seed,
                configVersion: configSnapshot?.version || null,
                configHash: configSnapshot?.hash || null,
                environment: {
                    platform: navigator.platform,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    platformVersion: (typeof CONFIG !== 'undefined' && CONFIG?.version) || 'unknown'
                },
                reproducibility: {
                    seeded: true,
                    configVersioned: !!configSnapshot,
                    deterministicIds: true,
                    jstatLoaded: typeof jStat !== 'undefined'
                }
            }
        };

        // Record in audit trail
        if (window.auditTrail) {
            window.auditTrail.record('CREATE', 'experiment', name, {
                summary: `Created experiment "${name}" (seed: ${seed})`,
                seed,
                configHash: configSnapshot?.hash
            });
        }

        try {
            // Save to enhanced database
            if (this.database) {
                const id = await this.database.saveExperiment(experimentData);
                const experiment = await this.database.getExperimentById(id);
                this.experiments.set(experiment.id, experiment);
                console.log(`✅ Created experiment: ${name} (ID: ${id})`);
                return experiment;
            } else {
                // Fallback to localStorage
                const experiment = {
                    id: this.generateId('exp'),
                    ...experimentData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                this.experiments.set(experiment.id, experiment);
                await this.saveToLocalStorage();
                console.log(`✅ Created experiment: ${name} (${experiment.id})`);
                return experiment;
            }
        } catch (error) {
            console.error('Failed to create experiment:', error);
            throw error;
        }
    }

    /**
     * Start a new experimental run
     */
    async startRun(experimentId, runName = '', parameters = {}) {
        await this.ensureInitialized();

        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            throw new Error(`Experiment ${experimentId} not found`);
        }

        const runCount = (experiment.metadata?.runCount || 0) + 1;
        const timestamp = new Date().toISOString();

        // Use database v2 format with reproducibility metadata
        const runData = {
            experimentId: experimentId,
            timestamp: timestamp,
            parameters: parameters,
            metrics: {},
            results: {},
            status: 'running',
            duration: 0,
            logs: [],
            metadata: {
                name: runName || `Run ${runCount}`,
                startTime: Date.now(),
                configHash: window.configManager?.currentVersion?.hash || null,
                experimentSeed: experiment.metadata?.seed || null,
                dependencies: {
                    jstat: typeof jStat !== 'undefined' ? 'loaded' : 'missing',
                    nlpMetrics: typeof window.nlpMetrics !== 'undefined' ? 'loaded' : 'missing',
                    ragasEvaluator: typeof window.ragasEvaluator !== 'undefined' ? 'loaded' : 'missing'
                }
            }
        };

        // Record in audit trail
        if (window.auditTrail) {
            window.auditTrail.record('CREATE', 'run', experimentId, {
                summary: `Started run "${runName || `Run ${runCount}`}" for experiment "${experiment.name}"`
            });
        }

        try {
            // Save to enhanced database
            if (this.database) {
                const id = await this.database.saveExperimentRun(runData);
                // Get the saved run
                const runs = await this.database.getExperimentRuns(experimentId);
                const run = runs.find(r => r.id === id);
                if (run) {
                    this.runs.set(run.id, run);
                    this.currentRun = run.id;

                    // Update experiment metadata
                    experiment.metadata = experiment.metadata || {};
                    experiment.metadata.runCount = runCount;
                    experiment.updatedAt = timestamp;
                    await this.database.saveExperiment(experiment);

                    console.log(`🚀 Started run: ${runData.metadata.name} (ID: ${id})`);
                    return run;
                }
            } else {
                // Fallback to localStorage
                const run = {
                    id: this.generateId('run'),
                    ...runData
                };
                this.runs.set(run.id, run);
                this.currentRun = run.id;
                await this.saveToLocalStorage();
                console.log(`🚀 Started run: ${runData.metadata.name} (${run.id})`);
                return run;
            }
        } catch (error) {
            console.error('Failed to start run:', error);
            throw error;
        }
    }

    /**
     * Log a parameter
     */
    async logParameter(key, value) {
        if (!this.currentRun) {
            console.warn('⚠️ No active experiment run');
            return;
        }

        const run = this.runs.get(this.currentRun);
        if (run) {
            run.parameters[key] = value;
            if (this.database) {
                await this.database.saveExperimentRun(run);
            } else {
                await this.saveToLocalStorage();
            }
        }
    }

    /**
     * Log multiple parameters
     */
    logParameters(params) {
        for (const [key, value] of Object.entries(params)) {
            this.logParameter(key, value);
        }
    }

    /**
     * Log a metric
     */
    async logMetric(key, value, step = null) {
        if (!this.currentRun) {
            console.warn('⚠️ No active experiment run');
            return;
        }

        const run = this.runs.get(this.currentRun);
        if (run) {
            if (!run.metrics[key]) {
                run.metrics[key] = [];
            }

            run.metrics[key].push({
                value: value,
                step: step,
                timestamp: Date.now()
            });

            if (this.database) {
                await this.database.saveExperimentRun(run);
            } else {
                await this.saveToLocalStorage();
            }
        }
    }

    /**
     * Log multiple metrics
     */
    logMetrics(metrics, step = null) {
        for (const [key, value] of Object.entries(metrics)) {
            this.logMetric(key, value, step);
        }
    }

    /**
     * Log an artifact (file, data, etc.)
     */
    async logArtifact(name, data, type = 'json') {
        if (!this.currentRun) {
            console.warn('⚠️ No active experiment run');
            return;
        }

        const run = this.runs.get(this.currentRun);
        if (run) {
            run.metadata = run.metadata || {};
            run.metadata.artifacts = run.metadata.artifacts || [];
            run.metadata.artifacts.push({
                name: name,
                data: data,
                type: type,
                size: JSON.stringify(data).length,
                timestamp: Date.now()
            });

            if (this.database) {
                await this.database.saveExperimentRun(run);
            } else {
                await this.saveToLocalStorage();
            }
        }
    }

    /**
     * Log a message
     */
    async log(message, level = 'info') {
        if (!this.currentRun) {
            console.warn('⚠️ No active experiment run');
            return;
        }

        const run = this.runs.get(this.currentRun);
        if (run) {
            run.logs.push({
                message: message,
                level: level,
                timestamp: Date.now()
            });

            if (this.database) {
                await this.database.saveExperimentRun(run);
            } else {
                await this.saveToLocalStorage();
            }
        }
    }

    /**
     * End the current run
     */
    async endRun(status = 'completed') {
        if (!this.currentRun) {
            console.warn('⚠️ No active experiment run');
            return;
        }

        const run = this.runs.get(this.currentRun);
        if (run) {
            const endTime = Date.now();
            const startTime = run.metadata?.startTime || Date.now();
            run.duration = endTime - startTime;
            run.status = status;
            run.metadata = run.metadata || {};
            run.metadata.endTime = endTime;

            if (this.database) {
                await this.database.saveExperimentRun(run);
            } else {
                await this.saveToLocalStorage();
            }

            const name = run.metadata?.name || 'Run';
            console.log(`✅ Ended run: ${name} (${this.formatDuration(run.duration)})`);

            this.currentRun = null;
        }
    }

    /**
     * Get experiment by ID
     */
    getExperiment(experimentId) {
        return this.experiments.get(experimentId);
    }

    /**
     * Get all experiments
     */
    getAllExperiments() {
        return Array.from(this.experiments.values()).sort(
            (a, b) => b.createdAt - a.createdAt
        );
    }

    /**
     * Get runs for an experiment
     */
    getExperimentRuns(experimentId) {
        return Array.from(this.runs.values())
            .filter(run => run.experimentId === experimentId)
            .sort((a, b) => b.startTime - a.startTime);
    }

    /**
     * Get run by ID
     */
    getRun(runId) {
        return this.runs.get(runId);
    }

    /**
     * Compare multiple runs
     */
    compareRuns(runIds) {
        const runs = runIds.map(id => this.runs.get(id)).filter(r => r);

        if (runs.length === 0) {
            return null;
        }

        // Collect all parameter and metric keys
        const allParams = new Set();
        const allMetrics = new Set();

        for (const run of runs) {
            Object.keys(run.parameters).forEach(k => allParams.add(k));
            Object.keys(run.metrics).forEach(k => allMetrics.add(k));
        }

        // Build comparison table
        const comparison = {
            runs: runs.map(run => ({
                id: run.id,
                name: run.name,
                status: run.status,
                duration: run.duration,
                startTime: run.startTime
            })),
            parameters: {},
            metrics: {}
        };

        // Compare parameters
        for (const param of allParams) {
            comparison.parameters[param] = runs.map(run => run.parameters[param] || null);
        }

        // Compare metrics (use final value)
        for (const metric of allMetrics) {
            comparison.metrics[metric] = runs.map(run => {
                const values = run.metrics[metric];
                return values && values.length > 0 ? values[values.length - 1].value : null;
            });
        }

        return comparison;
    }

    /**
     * Get best run based on metric
     */
    getBestRun(experimentId, metricKey, maximize = true) {
        const runs = this.getExperimentRuns(experimentId);

        if (runs.length === 0) {
            return null;
        }

        let bestRun = null;
        let bestValue = maximize ? -Infinity : Infinity;

        for (const run of runs) {
            if (run.metrics[metricKey] && run.metrics[metricKey].length > 0) {
                const values = run.metrics[metricKey];
                const finalValue = values[values.length - 1].value;

                const isBetter = maximize ? finalValue > bestValue : finalValue < bestValue;

                if (isBetter) {
                    bestValue = finalValue;
                    bestRun = run;
                }
            }
        }

        return bestRun;
    }

    /**
     * Search experiments by tags or name
     */
    searchExperiments(query) {
        const lowerQuery = query.toLowerCase();

        return Array.from(this.experiments.values()).filter(exp => {
            return exp.name.toLowerCase().includes(lowerQuery) ||
                   exp.description.toLowerCase().includes(lowerQuery) ||
                   exp.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
        });
    }

    /**
     * Delete experiment and its runs
     */
    async deleteExperiment(experimentId) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            return false;
        }

        // Delete all runs
        const runs = this.getExperimentRuns(experimentId);
        for (const run of runs) {
            this.runs.delete(run.id);
        }

        // Delete experiment
        this.experiments.delete(experimentId);

        await this.saveExperiments();
        await this.saveRuns();

        console.log(`🗑️ Deleted experiment: ${experiment.name}`);
        return true;
    }

    /**
     * Export experiment data
     */
    exportExperiment(experimentId) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            return null;
        }

        const runs = this.getExperimentRuns(experimentId);

        return {
            experiment: experiment,
            runs: runs,
            exportedAt: new Date().toISOString(),
            platform: 'EduLLM'
        };
    }

    /**
     * Export all experiments
     */
    exportAll() {
        return {
            experiments: Array.from(this.experiments.values()),
            runs: Array.from(this.runs.values()),
            exportedAt: new Date().toISOString(),
            platform: 'EduLLM',
            version: '1.0'
        };
    }

    /**
     * Import experiments
     */
    async importExperiments(data) {
        if (!data.experiments || !data.runs) {
            throw new Error('Invalid import data format');
        }

        let imported = 0;

        for (const exp of data.experiments) {
            this.experiments.set(exp.id, exp);
            imported++;
        }

        for (const run of data.runs) {
            this.runs.set(run.id, run);
        }

        await this.saveExperiments();
        await this.saveRuns();

        console.log(`✅ Imported ${imported} experiments`);
        return imported;
    }

    /**
     * Get statistics
     */
    getStatistics() {
        const activeExperiments = Array.from(this.experiments.values())
            .filter(exp => exp.status === 'active').length;

        const runningRuns = Array.from(this.runs.values())
            .filter(run => run.status === 'running').length;

        const completedRuns = Array.from(this.runs.values())
            .filter(run => run.status === 'completed').length;

        return {
            totalExperiments: this.experiments.size,
            activeExperiments: activeExperiments,
            totalRuns: this.runs.size,
            runningRuns: runningRuns,
            completedRuns: completedRuns,
            currentExperiment: this.currentExperiment
        };
    }

    /**
     * Generate unique ID
     */
    generateId(prefix) {
        return `${prefix}_${crypto.randomUUID()}`;
    }

    /**
     * Format duration
     */
    formatDuration(ms) {
        if (!ms) return 'N/A';

        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Save to localStorage (fallback)
     */
    async saveToLocalStorage() {
        try {
            const expData = Array.from(this.experiments.entries());
            localStorage.setItem('experiments', JSON.stringify(expData));

            const runData = Array.from(this.runs.entries());
            localStorage.setItem('experimentRuns', JSON.stringify(runData));

            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }

    /**
     * Load from localStorage (fallback)
     */
    loadFromLocalStorage() {
        try {
            // Load experiments
            const expData = localStorage.getItem('experiments');
            if (expData) {
                const entries = JSON.parse(expData);
                this.experiments = new Map(entries);
                console.log(`✅ Loaded ${this.experiments.size} experiments from localStorage`);
            }

            // Load runs
            const runData = localStorage.getItem('experimentRuns');
            if (runData) {
                const entries = JSON.parse(runData);
                this.runs = new Map(entries);
                console.log(`✅ Loaded ${this.runs.size} runs from localStorage`);
            }

            return true;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return false;
        }
    }

    /**
     * Sync all data to database
     */
    async syncToDatabase() {
        if (!this.database) {
            console.warn('⚠️ No database available for sync');
            return false;
        }

        try {
            // Sync experiments
            for (const experiment of this.experiments.values()) {
                await this.database.saveExperiment(experiment);
            }

            // Sync runs
            for (const run of this.runs.values()) {
                await this.database.saveExperimentRun(run);
            }

            console.log(`✅ Synced ${this.experiments.size} experiments and ${this.runs.size} runs to database`);
            return true;
        } catch (error) {
            console.error('Failed to sync to database:', error);
            return false;
        }
    }
}

// Helper class for quick experiment context
class ExperimentContext {
    constructor(tracker, experimentId, runName, parameters = {}) {
        this.tracker = tracker;
        this.experimentId = experimentId;
        this.runName = runName;
        this.parameters = parameters;
        this.runId = null;
    }

    async __enter__() {
        const run = await this.tracker.startRun(
            this.experimentId,
            this.runName,
            this.parameters
        );
        this.runId = run.id;
        return this;
    }

    async __exit__(error = null) {
        const status = error ? 'failed' : 'completed';
        if (error) {
            this.tracker.log(`Error: ${error.message}`, 'error');
        }
        await this.tracker.endRun(status);
    }

    log(key, value, step = null) {
        this.tracker.logMetric(key, value, step);
    }

    logParams(params) {
        this.tracker.logParameters(params);
    }
}

// Create global instance
if (window.database) {
    window.experimentTracker = new ExperimentTracker(window.database);
    console.log('✅ Experiment Tracker initialized');
} else {
    console.warn('⚠️ Database not available, experiment tracker will use localStorage only');
    window.experimentTracker = new ExperimentTracker(null);
}
