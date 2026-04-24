/**
 * A/B Testing Framework
 *
 * Provides comprehensive A/B testing capabilities for RAG system research.
 * Supports multi-variant testing, statistical significance testing,
 * and automated experiment management.
 *
 * @author EduLLM Research Platform
 * @version 1.0.0
 */

class ABTestingFramework {
    constructor(options = {}) {
        this.tests = new Map(); // test_id -> test config
        this.variants = new Map(); // variant_id -> variant config
        this.assignments = new Map(); // user/session_id -> variant_id
        this.results = new Map(); // test_id -> results
        this.initialized = false;
        this.rng = options.seed != null
            ? (typeof SeededRandom !== 'undefined' ? new SeededRandom(options.seed) : null)
            : null;

        this.testTypes = [
            'retrieval_strategy',
            'chunking_method',
            'embedding_model',
            'generation_prompt',
            'ranking_algorithm',
            'context_size',
            'temperature',
            'top_k'
        ];

        this.assignmentStrategies = {
            random: this.randomAssignment.bind(this),
            roundRobin: this.roundRobinAssignment.bind(this),
            weighted: this.weightedAssignment.bind(this),
            stratified: this.stratifiedAssignment.bind(this)
        };
    }

    /**
     * Initialize the framework
     */
    async initialize() {
        if (this.initialized) return;

        try {
            const savedData = localStorage.getItem('rag_ab_tests');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.tests = new Map(data.tests || []);
                this.variants = new Map(data.variants || []);
                this.assignments = new Map(data.assignments || []);
                this.results = new Map(data.results || []);
            }

            this.initialized = true;
            console.log('✅ A/B Testing Framework initialized');
        } catch (error) {
            console.error('Error initializing A/B testing:', error);
            throw error;
        }
    }

    /**
     * Create a new A/B test
     *
     * @param {string} name - Test name
     * @param {object} config - Test configuration
     * @returns {object} Test object
     */
    async createTest(name, config) {
        const test = {
            id: this.generateId('test'),
            name,
            description: config.description || '',
            testType: config.testType || 'retrieval_strategy',
            variants: [],
            status: 'draft',
            assignmentStrategy: config.assignmentStrategy || 'random',
            trafficAllocation: config.trafficAllocation || 1.0,
            minimumSampleSize: config.minimumSampleSize || 30,
            confidenceLevel: config.confidenceLevel || 0.95,
            primaryMetric: config.primaryMetric || 'f1_score',
            secondaryMetrics: config.secondaryMetrics || [
                'precision',
                'recall',
                'response_time'
            ],
            createdAt: Date.now(),
            startedAt: null,
            endedAt: null,
            tags: config.tags || []
        };

        this.tests.set(test.id, test);
        await this.save();

        console.log(`✅ Created A/B test: ${name}`);
        return test;
    }

    /**
     * Add variant to test
     *
     * @param {string} testId - Test ID
     * @param {string} name - Variant name
     * @param {object} config - Variant configuration
     * @returns {object} Variant object
     */
    async addVariant(testId, name, config) {
        const test = this.tests.get(testId);
        if (!test) {
            throw new Error(`Test ${testId} not found`);
        }

        if (test.status !== 'draft') {
            throw new Error('Can only add variants to draft tests');
        }

        const variant = {
            id: this.generateId('variant'),
            testId,
            name,
            description: config.description || '',
            config: config.parameters || {},
            weight: config.weight || 1.0,
            isControl: config.isControl || false,
            createdAt: Date.now(),
            sampleSize: 0,
            metrics: {}
        };

        this.variants.set(variant.id, variant);
        test.variants.push(variant.id);

        await this.save();

        console.log(`✅ Added variant ${name} to test ${test.name}`);
        return variant;
    }

    /**
     * Start A/B test
     *
     * @param {string} testId - Test ID
     * @returns {object} Started test
     */
    async startTest(testId) {
        const test = this.tests.get(testId);
        if (!test) {
            throw new Error(`Test ${testId} not found`);
        }

        if (test.variants.length < 2) {
            throw new Error('Test must have at least 2 variants');
        }

        test.status = 'running';
        test.startedAt = Date.now();

        // Initialize results
        this.results.set(testId, {
            testId,
            observations: [],
            currentStats: {},
            significanceTests: null,
            winner: null
        });

        await this.save();

        console.log(`✅ Started A/B test: ${test.name}`);
        return test;
    }

    /**
     * Stop A/B test
     *
     * @param {string} testId - Test ID
     * @returns {object} Test results
     */
    async stopTest(testId) {
        const test = this.tests.get(testId);
        if (!test) {
            throw new Error(`Test ${testId} not found`);
        }

        test.status = 'completed';
        test.endedAt = Date.now();

        // Calculate final results
        const finalResults = await this.calculateFinalResults(testId);

        await this.save();

        console.log(`✅ Stopped A/B test: ${test.name}`);
        return finalResults;
    }

    /**
     * Assign user to variant
     *
     * @param {string} testId - Test ID
     * @param {string} userId - User/session ID
     * @returns {object} Assigned variant
     */
    async assignVariant(testId, userId) {
        const test = this.tests.get(testId);
        if (!test || test.status !== 'running') {
            return null;
        }

        // Check if already assigned
        const existingAssignment = this.assignments.get(`${testId}_${userId}`);
        if (existingAssignment) {
            return this.variants.get(existingAssignment);
        }

        // Check traffic allocation
        const rand = this.rng ? this.rng.next() : Math.random();
        if (rand > test.trafficAllocation) {
            return null; // User not included in test
        }

        // Assign using strategy
        const assignmentFn = this.assignmentStrategies[test.assignmentStrategy];
        if (!assignmentFn) {
            throw new Error(`Unknown assignment strategy: ${test.assignmentStrategy}`);
        }

        const variantId = assignmentFn(test, userId);
        const variant = this.variants.get(variantId);

        if (!variant) {
            throw new Error(`Variant ${variantId} not found`);
        }

        // Store assignment
        this.assignments.set(`${testId}_${userId}`, variantId);
        variant.sampleSize++;

        await this.save();

        return variant;
    }

    /**
     * Record observation (result from variant)
     *
     * @param {string} testId - Test ID
     * @param {string} variantId - Variant ID
     * @param {object} metrics - Observed metrics
     * @param {object} metadata - Additional metadata
     */
    async recordObservation(testId, variantId, metrics, metadata = {}) {
        const test = this.tests.get(testId);
        const variant = this.variants.get(variantId);

        if (!test || !variant) {
            throw new Error('Test or variant not found');
        }

        const results = this.results.get(testId);
        if (!results) {
            throw new Error(`No results object for test ${testId}`);
        }

        // Record observation
        const observation = {
            id: this.generateId('obs'),
            testId,
            variantId,
            variantName: variant.name,
            metrics,
            metadata,
            timestamp: Date.now()
        };

        results.observations.push(observation);

        // Update variant metrics
        for (const [metric, value] of Object.entries(metrics)) {
            if (typeof value !== 'number') continue;

            if (!variant.metrics[metric]) {
                variant.metrics[metric] = {
                    values: [],
                    sum: 0,
                    count: 0,
                    mean: 0,
                    variance: 0
                };
            }

            const m = variant.metrics[metric];
            m.values.push(value);
            m.sum += value;
            m.count++;

            // Update running statistics
            this.updateRunningStats(m, value);
        }

        // Check if test should be concluded
        if (this.shouldConcludeTest(test)) {
            await this.analyzeResults(testId);
        }

        await this.save();
    }

    /**
     * Update running statistics
     */
    updateRunningStats(metricData, newValue) {
        const n = metricData.count;
        const oldMean = metricData.mean;
        const newMean = metricData.sum / n;

        metricData.mean = newMean;

        // Update variance using Welford's online algorithm
        if (n === 1) {
            metricData.variance = 0;
        } else {
            const oldVariance = metricData.variance;
            metricData.variance = oldVariance + (newValue - oldMean) * (newValue - newMean);
        }
    }

    /**
     * Check if test should be concluded
     */
    shouldConcludeTest(test) {
        // Check if all variants have minimum sample size
        for (const variantId of test.variants) {
            const variant = this.variants.get(variantId);
            if (variant.sampleSize < test.minimumSampleSize) {
                return false;
            }
        }

        return true;
    }

    /**
     * Analyze test results
     *
     * @param {string} testId - Test ID
     * @returns {object} Analysis results
     */
    async analyzeResults(testId) {
        const test = this.tests.get(testId);
        const results = this.results.get(testId);

        if (!test || !results) {
            throw new Error('Test or results not found');
        }

        console.log(`Analyzing results for test: ${test.name}`);

        // Get variants
        const variants = test.variants.map(id => this.variants.get(id));

        // Calculate statistics for each variant
        const variantStats = variants.map(v => ({
            variantId: v.id,
            variantName: v.name,
            isControl: v.isControl,
            sampleSize: v.sampleSize,
            metrics: this.calculateVariantStats(v, test.primaryMetric, test.secondaryMetrics)
        }));

        // Perform significance testing
        const significanceTests = await this.performSignificanceTests(
            variants,
            test.primaryMetric,
            test.confidenceLevel
        );

        // Determine winner
        const winner = this.determineWinner(variantStats, significanceTests, test.primaryMetric);

        // Calculate lift
        const lift = this.calculateLift(variantStats, test.primaryMetric);

        // Store results
        results.currentStats = {
            variantStats,
            significanceTests,
            winner,
            lift,
            analyzedAt: Date.now()
        };

        await this.save();

        return results.currentStats;
    }

    /**
     * Calculate variant statistics
     */
    calculateVariantStats(variant, primaryMetric, secondaryMetrics) {
        const stats = {};

        const allMetrics = [primaryMetric, ...secondaryMetrics];

        for (const metric of allMetrics) {
            const metricData = variant.metrics[metric];

            if (!metricData || metricData.count === 0) {
                stats[metric] = {
                    count: 0,
                    mean: 0,
                    stdDev: 0,
                    stderr: 0,
                    ci95: { lower: 0, upper: 0 }
                };
                continue;
            }

            const mean = metricData.mean;
            const variance = metricData.variance / (metricData.count - 1);
            const stdDev = Math.sqrt(variance);
            const stderr = stdDev / Math.sqrt(metricData.count);

            // 95% confidence interval using proper t-distribution
            const tCrit = typeof jStat !== 'undefined'
                ? jStat.studentt.inv(1 - 0.025, metricData.count - 1)
                : 1.96;
            const ci95 = {
                lower: mean - tCrit * stderr,
                upper: mean + tCrit * stderr
            };

            stats[metric] = {
                count: metricData.count,
                mean,
                stdDev,
                stderr,
                ci95
            };
        }

        return stats;
    }

    /**
     * Perform significance tests between variants
     */
    async performSignificanceTests(variants, primaryMetric, confidenceLevel) {
        const tests = [];

        // Find control variant
        const control = variants.find(v => v.isControl) || variants[0];

        // Test each variant against control
        for (const variant of variants) {
            if (variant.id === control.id) continue;

            const metricDataControl = control.metrics[primaryMetric];
            const metricDataVariant = variant.metrics[primaryMetric];

            if (!metricDataControl || !metricDataVariant) {
                continue;
            }

            // Perform t-test
            if (window.statisticalAnalyzer) {
                const testResult = window.statisticalAnalyzer.tTest(
                    metricDataControl.values,
                    metricDataVariant.values,
                    { confidenceLevel }
                );

                tests.push({
                    control: control.name,
                    variant: variant.name,
                    metric: primaryMetric,
                    ...testResult
                });
            } else {
                // Simplified test
                const simplifiedTest = this.simplifiedTTest(
                    metricDataControl,
                    metricDataVariant,
                    confidenceLevel
                );

                tests.push({
                    control: control.name,
                    variant: variant.name,
                    metric: primaryMetric,
                    ...simplifiedTest
                });
            }
        }

        return tests;
    }

    /**
     * Simplified t-test (Welch's t-test)
     */
    simplifiedTTest(data1, data2, confidenceLevel) {
        const mean1 = data1.mean;
        const mean2 = data2.mean;
        const var1 = data1.variance / (data1.count - 1);
        const var2 = data2.variance / (data2.count - 1);

        const se = Math.sqrt(var1 / data1.count + var2 / data2.count);
        const tStat = (mean1 - mean2) / se;

        // Welch-Satterthwaite degrees of freedom
        const num = Math.pow(var1 / data1.count + var2 / data2.count, 2);
        const den = Math.pow(var1 / data1.count, 2) / (data1.count - 1) +
                    Math.pow(var2 / data2.count, 2) / (data2.count - 1);
        const df = num / den;

        let pValue;
        if (typeof jStat !== 'undefined') {
            pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(tStat), df));
        } else {
            // Fallback normal approximation
            const absZ = Math.abs(tStat);
            const t = 1 / (1 + 0.2316419 * absZ);
            const d = 0.3989423 * Math.exp(-absZ * absZ / 2);
            const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
            pValue = 2 * prob;
        }

        // Effect size (Cohen's d)
        const pooledStd = Math.sqrt((var1 + var2) / 2);
        const cohensD = pooledStd > 0 ? (mean1 - mean2) / pooledStd : 0;

        return {
            tStatistic: tStat,
            degreesOfFreedom: df,
            pValue,
            significant: pValue < (1 - confidenceLevel),
            meanDifference: mean1 - mean2,
            effectSize: {
                cohensD,
                interpretation: Math.abs(cohensD) < 0.2 ? 'negligible' :
                    Math.abs(cohensD) < 0.5 ? 'small' :
                    Math.abs(cohensD) < 0.8 ? 'medium' : 'large'
            }
        };
    }

    /**
     * Determine test winner
     */
    determineWinner(variantStats, significanceTests, primaryMetric) {
        // Find variant with best performance
        const sorted = [...variantStats].sort((a, b) =>
            b.metrics[primaryMetric].mean - a.metrics[primaryMetric].mean
        );

        const best = sorted[0];
        const control = variantStats.find(v => v.isControl) || variantStats[0];

        // Check if significantly better than control
        const sigTest = significanceTests.find(t =>
            t.variant === best.variantName
        );

        return {
            variantId: best.variantId,
            variantName: best.variantName,
            performance: best.metrics[primaryMetric].mean,
            significant: sigTest ? sigTest.significant : false,
            confidence: sigTest ? (1 - sigTest.pValue) * 100 : 0,
            improvement: best.variantId !== control.variantId
                ? ((best.metrics[primaryMetric].mean - control.metrics[primaryMetric].mean) /
                   control.metrics[primaryMetric].mean * 100)
                : 0
        };
    }

    /**
     * Calculate lift for all variants
     */
    calculateLift(variantStats, primaryMetric) {
        const control = variantStats.find(v => v.isControl) || variantStats[0];
        const controlMean = control.metrics[primaryMetric].mean;

        return variantStats.map(v => ({
            variantName: v.variantName,
            absoluteLift: v.metrics[primaryMetric].mean - controlMean,
            relativeLift: controlMean > 0
                ? ((v.metrics[primaryMetric].mean - controlMean) / controlMean * 100)
                : 0
        }));
    }

    /**
     * Get current test results
     *
     * @param {string} testId - Test ID
     * @returns {object} Current results
     */
    getCurrentResults(testId) {
        const test = this.tests.get(testId);
        const results = this.results.get(testId);

        if (!test || !results) {
            return null;
        }

        const variants = test.variants.map(id => {
            const v = this.variants.get(id);
            return {
                id: v.id,
                name: v.name,
                isControl: v.isControl,
                sampleSize: v.sampleSize,
                metrics: v.metrics
            };
        });

        return {
            test: {
                id: test.id,
                name: test.name,
                status: test.status,
                primaryMetric: test.primaryMetric
            },
            variants,
            stats: results.currentStats,
            observations: results.observations.length
        };
    }

    /**
     * Calculate final results
     */
    async calculateFinalResults(testId) {
        const currentResults = await this.analyzeResults(testId);
        const test = this.tests.get(testId);

        return {
            testId,
            testName: test.name,
            duration: test.endedAt - test.startedAt,
            totalObservations: this.results.get(testId).observations.length,
            ...currentResults,
            recommendations: this.generateRecommendations(test, currentResults)
        };
    }

    /**
     * Generate recommendations based on results
     */
    generateRecommendations(test, results) {
        const recommendations = [];

        if (!results.winner) {
            return recommendations;
        }

        if (results.winner.significant) {
            recommendations.push({
                priority: 'high',
                title: 'Deploy Winning Variant',
                description: `${results.winner.variantName} showed ${results.winner.improvement.toFixed(1)}% improvement with ${results.winner.confidence.toFixed(1)}% confidence.`,
                action: 'deploy',
                variantId: results.winner.variantId
            });
        } else {
            recommendations.push({
                priority: 'medium',
                title: 'Inconclusive Results',
                description: 'No variant showed statistically significant improvement. Consider running longer or with larger sample size.',
                action: 'continue_or_stop'
            });
        }

        return recommendations;
    }

    // Assignment strategies

    randomAssignment(test, userId) {
        const variants = test.variants;
        const randomIndex = this.rng
            ? this.rng.nextInt(0, variants.length - 1)
            : Math.floor(Math.random() * variants.length);
        return variants[randomIndex];
    }

    roundRobinAssignment(test, userId) {
        // Assign based on current sample sizes (balance)
        const variants = test.variants.map(id => ({
            id,
            size: this.variants.get(id).sampleSize
        }));

        variants.sort((a, b) => a.size - b.size);
        return variants[0].id;
    }

    weightedAssignment(test, userId) {
        const variants = test.variants.map(id => this.variants.get(id));
        const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);

        const random = (this.rng ? this.rng.next() : Math.random()) * totalWeight;
        let cumulativeWeight = 0;

        for (const variant of variants) {
            cumulativeWeight += variant.weight;
            if (random <= cumulativeWeight) {
                return variant.id;
            }
        }

        return variants[0].id;
    }

    stratifiedAssignment(test, userId) {
        // For now, same as round-robin
        // Can be extended with user segments
        return this.roundRobinAssignment(test, userId);
    }

    /**
     * Export test results
     */
    exportResults(testId, format = 'json') {
        const results = this.getCurrentResults(testId);

        if (!results) {
            throw new Error(`Test ${testId} not found`);
        }

        switch (format) {
            case 'json':
                return JSON.stringify(results, null, 2);

            case 'csv':
                return this.exportToCSV(results);

            case 'markdown':
                return this.exportToMarkdown(results);

            case 'latex':
                if (window.latexExporter) {
                    const metric = results.test.primaryMetric;
                    return window.latexExporter.table({
                        headers: ['Variant', '$n$', 'Mean', 'Std Dev', '95\\% CI'],
                        rows: results.variants.map(v => {
                            const s = v.metrics[metric];
                            if (!s || s.count === 0) return [v.name, 0, '--', '--', '--'];
                            return [
                                v.name + (v.isControl ? ' (Control)' : ''),
                                v.sampleSize,
                                s.mean,
                                s.stdDev,
                                `[${s.ci95?.lower?.toFixed(4) || '--'}, ${s.ci95?.upper?.toFixed(4) || '--'}]`
                            ];
                        }),
                        caption: `A/B Test Results: ${results.test.name}`,
                        label: `ab_${results.test.id}`
                    });
                }
                throw new Error('LaTeX exporter not loaded');

            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    exportToCSV(results) {
        const rows = [['Variant', 'Sample Size', 'Mean', 'Std Dev', 'CI Lower', 'CI Upper']];

        for (const variant of results.variants) {
            const metric = results.test.primaryMetric;
            const stats = variant.metrics[metric];

            if (stats && stats.count > 0) {
                rows.push([
                    variant.name,
                    variant.sampleSize,
                    stats.mean.toFixed(4),
                    stats.stdDev.toFixed(4),
                    stats.ci95.lower.toFixed(4),
                    stats.ci95.upper.toFixed(4)
                ]);
            }
        }

        return rows.map(row => row.join(',')).join('\n');
    }

    exportToMarkdown(results) {
        let md = `# A/B Test Results: ${results.test.name}\n\n`;
        md += `**Status:** ${results.test.status}\n`;
        md += `**Primary Metric:** ${results.test.primaryMetric}\n\n`;

        md += `## Variants\n\n`;
        md += `| Variant | Sample Size | Mean | 95% CI |\n`;
        md += `|---------|-------------|------|--------|\n`;

        for (const variant of results.variants) {
            const metric = results.test.primaryMetric;
            const stats = variant.metrics[metric];

            if (stats && stats.count > 0) {
                md += `| ${variant.name}${variant.isControl ? ' (Control)' : ''} | ${variant.sampleSize} | ${stats.mean.toFixed(4)} | [${stats.ci95.lower.toFixed(4)}, ${stats.ci95.upper.toFixed(4)}] |\n`;
            }
        }

        if (results.stats && results.stats.winner) {
            md += `\n## Winner\n\n`;
            md += `**${results.stats.winner.variantName}**\n`;
            md += `- Improvement: ${results.stats.winner.improvement.toFixed(2)}%\n`;
            md += `- Confidence: ${results.stats.winner.confidence.toFixed(1)}%\n`;
            md += `- Significant: ${results.stats.winner.significant ? 'Yes' : 'No'}\n`;
        }

        return md;
    }

    // Utility functions
    generateId(prefix) {
        return `${prefix}_${crypto.randomUUID()}`;
    }

    async save() {
        try {
            const data = {
                tests: Array.from(this.tests.entries()),
                variants: Array.from(this.variants.entries()),
                assignments: Array.from(this.assignments.entries()),
                results: Array.from(this.results.entries())
            };
            localStorage.setItem('rag_ab_tests', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving A/B tests:', error);
        }
    }

    // Getters
    getTest(id) {
        return this.tests.get(id);
    }

    getAllTests() {
        return Array.from(this.tests.values());
    }

    getRunningTests() {
        return Array.from(this.tests.values()).filter(t => t.status === 'running');
    }

    getVariant(id) {
        return this.variants.get(id);
    }

    getTestVariants(testId) {
        const test = this.tests.get(testId);
        if (!test) return [];

        return test.variants.map(id => this.variants.get(id));
    }
}

// Initialize and export
window.abTestingFramework = new ABTestingFramework();
console.log('✅ A/B Testing Framework module loaded');
