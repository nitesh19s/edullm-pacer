/**
 * Baseline Comparison Framework
 *
 * Provides comprehensive comparison tools for RAG system experiments.
 * Supports side-by-side comparison of different approaches, configurations,
 * and experiment runs with statistical analysis.
 *
 * @author EduLLM Research Platform
 * @version 1.0.0
 */

class BaselineComparator {
    constructor() {
        this.comparisons = new Map(); // comparison_id -> comparison object
        this.baselines = new Map(); // baseline_id -> baseline configuration
        this.comparisonResults = new Map(); // results cache
        this.initialized = false;

        this.metrics = {
            // Retrieval Metrics
            retrieval: [
                'precision', 'recall', 'f1_score',
                'mean_reciprocal_rank', 'ndcg',
                'retrieval_time_ms'
            ],
            // Generation Metrics
            generation: [
                'bleu_score', 'rouge_1', 'rouge_2', 'rouge_l',
                'perplexity', 'generation_time_ms'
            ],
            // Quality Metrics
            quality: [
                'relevance_score', 'coherence_score',
                'factual_accuracy', 'educational_value',
                'curriculum_alignment'
            ],
            // System Metrics
            system: [
                'total_latency_ms', 'memory_usage_mb',
                'tokens_used', 'api_cost_usd'
            ]
        };
    }

    /**
     * Initialize the comparator and load saved data
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Load saved comparisons
            const savedComparisons = localStorage.getItem('rag_comparisons');
            if (savedComparisons) {
                const data = JSON.parse(savedComparisons);
                this.comparisons = new Map(data.comparisons || []);
                this.baselines = new Map(data.baselines || []);
            }

            this.initialized = true;
            console.log('✅ Baseline Comparator initialized');
        } catch (error) {
            console.error('Error initializing comparator:', error);
            throw error;
        }
    }

    /**
     * Create a new baseline configuration
     *
     * @param {string} name - Baseline name
     * @param {object} config - Configuration parameters
     * @param {string} description - Description of the baseline
     * @returns {object} Created baseline
     */
    async createBaseline(name, config, description = '') {
        const baseline = {
            id: this.generateId('baseline'),
            name,
            description,
            config,
            createdAt: Date.now(),
            experimentCount: 0,
            avgMetrics: {},
            status: 'active'
        };

        this.baselines.set(baseline.id, baseline);
        await this.save();

        console.log(`✅ Created baseline: ${name}`);
        return baseline;
    }

    /**
     * Create a new comparison between experiments/baselines
     *
     * @param {string} name - Comparison name
     * @param {array} experimentIds - IDs of experiments to compare
     * @param {object} options - Comparison options
     * @returns {object} Comparison object
     */
    async createComparison(name, experimentIds, options = {}) {
        if (experimentIds.length < 2) {
            throw new Error('At least 2 experiments required for comparison');
        }

        const comparison = {
            id: this.generateId('comp'),
            name,
            experimentIds,
            options: {
                metrics: options.metrics || Object.values(this.metrics).flat(),
                statisticalTests: options.statisticalTests !== false,
                confidenceLevel: options.confidenceLevel || 0.95,
                visualizations: options.visualizations !== false,
                ...options
            },
            createdAt: Date.now(),
            status: 'pending',
            results: null
        };

        this.comparisons.set(comparison.id, comparison);

        // Perform comparison
        await this.performComparison(comparison.id);

        return comparison;
    }

    /**
     * Perform the actual comparison analysis
     *
     * @param {string} comparisonId - Comparison ID
     */
    async performComparison(comparisonId) {
        const comparison = this.comparisons.get(comparisonId);
        if (!comparison) {
            throw new Error(`Comparison ${comparisonId} not found`);
        }

        comparison.status = 'running';

        try {
            // Get experiment data
            const experiments = await this.getExperimentData(comparison.experimentIds);

            // Calculate comparison metrics
            const metricComparison = this.compareMetrics(experiments, comparison.options.metrics);

            // Perform statistical tests
            const statisticalResults = comparison.options.statisticalTests
                ? this.performStatisticalTests(experiments, comparison.options)
                : null;

            // Identify best performer
            const rankings = this.rankExperiments(experiments, comparison.options.metrics);

            // Generate insights
            const insights = this.generateInsights(experiments, metricComparison, rankings);

            // Store results
            comparison.results = {
                metricComparison,
                statisticalResults,
                rankings,
                insights,
                completedAt: Date.now()
            };

            comparison.status = 'completed';

            this.comparisonResults.set(comparisonId, comparison.results);
            await this.save();

            console.log(`✅ Comparison ${comparison.name} completed`);
            return comparison.results;

        } catch (error) {
            comparison.status = 'failed';
            comparison.error = error.message;
            console.error('Comparison failed:', error);
            throw error;
        }
    }

    /**
     * Get experiment data from the experiment tracker
     *
     * @param {array} experimentIds - Experiment IDs
     * @returns {array} Experiment data
     */
    async getExperimentData(experimentIds) {
        const experiments = [];

        for (const expId of experimentIds) {
            // Get from experiment tracker
            let experiment;

            if (window.experimentTracker) {
                experiment = window.experimentTracker.getExperiment(expId);
            }

            if (!experiment) {
                console.warn(`Experiment ${expId} not found, using mock data`);
                experiment = this.createMockExperiment(expId);
            }

            // Get all runs for this experiment
            const runs = window.experimentTracker
                ? window.experimentTracker.getRuns(expId)
                : [];

            experiments.push({
                ...experiment,
                runs
            });
        }

        return experiments;
    }

    /**
     * Compare metrics across experiments
     *
     * @param {array} experiments - Experiments to compare
     * @param {array} metrics - Metrics to compare
     * @returns {object} Comparison results
     */
    compareMetrics(experiments, metrics) {
        const comparison = {};

        for (const metric of metrics) {
            comparison[metric] = {
                name: metric,
                values: [],
                statistics: {}
            };

            for (const exp of experiments) {
                const values = this.extractMetricValues(exp, metric);

                comparison[metric].values.push({
                    experimentId: exp.id,
                    experimentName: exp.name,
                    mean: this.calculateMean(values),
                    median: this.calculateMedian(values),
                    std: this.calculateStd(values),
                    min: Math.min(...values),
                    max: Math.max(...values),
                    count: values.length,
                    rawValues: values
                });
            }

            // Calculate cross-experiment statistics
            comparison[metric].statistics = this.calculateCrossExperimentStats(
                comparison[metric].values
            );
        }

        return comparison;
    }

    /**
     * Extract metric values from experiment runs
     *
     * @param {object} experiment - Experiment object
     * @param {string} metric - Metric name
     * @returns {array} Metric values
     */
    extractMetricValues(experiment, metric) {
        const values = [];

        for (const run of experiment.runs || []) {
            if (run.metrics && run.metrics[metric]) {
                // Handle both single values and time series
                const metricData = run.metrics[metric];

                if (Array.isArray(metricData)) {
                    // Time series - get final value
                    if (metricData.length > 0) {
                        values.push(metricData[metricData.length - 1].value);
                    }
                } else if (typeof metricData === 'number') {
                    values.push(metricData);
                }
            }
        }

        return values;
    }

    /**
     * Perform statistical significance tests
     *
     * @param {array} experiments - Experiments to test
     * @param {object} options - Test options
     * @returns {object} Statistical test results
     */
    performStatisticalTests(experiments, options) {
        const results = {
            tests: [],
            significantDifferences: [],
            confidenceLevel: options.confidenceLevel
        };

        // Perform pairwise t-tests
        for (let i = 0; i < experiments.length; i++) {
            for (let j = i + 1; j < experiments.length; j++) {
                const test = this.performTTest(
                    experiments[i],
                    experiments[j],
                    options.metrics,
                    options.confidenceLevel
                );

                results.tests.push(test);

                if (test.significant) {
                    results.significantDifferences.push({
                        experiment1: experiments[i].name,
                        experiment2: experiments[j].name,
                        metric: test.metric,
                        pValue: test.pValue,
                        effectSize: test.effectSize
                    });
                }
            }
        }

        return results;
    }

    /**
     * Perform t-test between two experiments
     *
     * @param {object} exp1 - First experiment
     * @param {object} exp2 - Second experiment
     * @param {array} metrics - Metrics to test
     * @param {number} confidenceLevel - Confidence level
     * @returns {object} Test results
     */
    performTTest(exp1, exp2, metrics, confidenceLevel) {
        // Simplified t-test implementation
        const results = {
            experiment1: exp1.name,
            experiment2: exp2.name,
            metrics: []
        };

        for (const metric of metrics) {
            const values1 = this.extractMetricValues(exp1, metric);
            const values2 = this.extractMetricValues(exp2, metric);

            if (values1.length < 2 || values2.length < 2) continue;

            const mean1 = this.calculateMean(values1);
            const mean2 = this.calculateMean(values2);
            const std1 = this.calculateStd(values1);
            const std2 = this.calculateStd(values2);

            // Welch's t-test
            const tStat = (mean1 - mean2) / Math.sqrt(
                (std1 * std1 / values1.length) + (std2 * std2 / values2.length)
            );

            // Simplified p-value calculation (two-tailed)
            const df = Math.min(values1.length, values2.length) - 1;
            const pValue = this.calculatePValue(Math.abs(tStat), df);

            // Cohen's d effect size
            const pooledStd = Math.sqrt(
                ((values1.length - 1) * std1 * std1 + (values2.length - 1) * std2 * std2) /
                (values1.length + values2.length - 2)
            );
            const effectSize = (mean1 - mean2) / pooledStd;

            results.metrics.push({
                metric,
                mean1,
                mean2,
                difference: mean1 - mean2,
                tStatistic: tStat,
                pValue,
                significant: pValue < (1 - confidenceLevel),
                effectSize,
                interpretation: this.interpretEffectSize(effectSize)
            });
        }

        return results;
    }

    /**
     * Rank experiments based on metrics
     *
     * @param {array} experiments - Experiments to rank
     * @param {array} metrics - Metrics to consider
     * @returns {object} Rankings
     */
    rankExperiments(experiments, metrics) {
        const rankings = {
            overall: [],
            byMetric: {}
        };

        // Rank by each metric
        for (const metric of metrics) {
            const scores = experiments.map(exp => {
                const values = this.extractMetricValues(exp, metric);
                return {
                    experimentId: exp.id,
                    experimentName: exp.name,
                    score: this.calculateMean(values) || 0
                };
            });

            // Sort descending (higher is better)
            scores.sort((a, b) => b.score - a.score);

            rankings.byMetric[metric] = scores.map((s, idx) => ({
                ...s,
                rank: idx + 1
            }));
        }

        // Calculate overall ranking (average rank across metrics)
        const overallScores = experiments.map(exp => {
            const avgRank = metrics.reduce((sum, metric) => {
                const metricRanking = rankings.byMetric[metric].find(
                    r => r.experimentId === exp.id
                );
                return sum + (metricRanking ? metricRanking.rank : metrics.length);
            }, 0) / metrics.length;

            return {
                experimentId: exp.id,
                experimentName: exp.name,
                averageRank: avgRank,
                ranksByMetric: {}
            };
        });

        overallScores.sort((a, b) => a.averageRank - b.averageRank);
        rankings.overall = overallScores.map((s, idx) => ({
            ...s,
            rank: idx + 1
        }));

        return rankings;
    }

    /**
     * Generate insights from comparison results
     *
     * @param {array} experiments - Experiments
     * @param {object} metricComparison - Metric comparison results
     * @param {object} rankings - Rankings
     * @returns {array} Insights
     */
    generateInsights(experiments, metricComparison, rankings) {
        const insights = [];

        // Best overall performer
        if (rankings.overall.length > 0) {
            const best = rankings.overall[0];
            insights.push({
                type: 'winner',
                priority: 'high',
                title: 'Best Overall Performer',
                description: `${best.experimentName} achieved the best average ranking across all metrics (rank ${best.rank}).`,
                experimentId: best.experimentId
            });
        }

        // Largest improvements
        const improvements = this.identifyImprovements(metricComparison);
        if (improvements.length > 0) {
            insights.push({
                type: 'improvement',
                priority: 'high',
                title: 'Significant Improvements',
                description: `Found ${improvements.length} metrics with substantial improvements.`,
                details: improvements
            });
        }

        // Trade-offs
        const tradeoffs = this.identifyTradeoffs(rankings);
        if (tradeoffs.length > 0) {
            insights.push({
                type: 'tradeoff',
                priority: 'medium',
                title: 'Performance Trade-offs',
                description: 'Some experiments excel in certain metrics while underperforming in others.',
                details: tradeoffs
            });
        }

        // Consistency analysis
        const consistency = this.analyzeConsistency(metricComparison);
        insights.push({
            type: 'consistency',
            priority: 'medium',
            title: 'Result Consistency',
            description: consistency.description,
            mostConsistent: consistency.mostConsistent,
            leastConsistent: consistency.leastConsistent
        });

        return insights;
    }

    /**
     * Identify significant improvements between experiments
     */
    identifyImprovements(metricComparison) {
        const improvements = [];
        const threshold = 0.1; // 10% improvement threshold

        for (const [metric, data] of Object.entries(metricComparison)) {
            if (data.values.length < 2) continue;

            const sorted = [...data.values].sort((a, b) => b.mean - a.mean);
            const best = sorted[0];
            const worst = sorted[sorted.length - 1];

            const improvement = worst.mean > 0
                ? (best.mean - worst.mean) / worst.mean
                : 0;

            if (improvement > threshold) {
                improvements.push({
                    metric,
                    improvementPercent: (improvement * 100).toFixed(1),
                    bestExperiment: best.experimentName,
                    bestValue: best.mean.toFixed(3),
                    worstExperiment: worst.experimentName,
                    worstValue: worst.mean.toFixed(3)
                });
            }
        }

        return improvements.sort((a, b) =>
            parseFloat(b.improvementPercent) - parseFloat(a.improvementPercent)
        );
    }

    /**
     * Identify performance trade-offs
     */
    identifyTradeoffs(rankings) {
        const tradeoffs = [];

        for (const exp of rankings.overall) {
            const topMetrics = [];
            const bottomMetrics = [];

            for (const [metric, ranks] of Object.entries(rankings.byMetric)) {
                const rank = ranks.find(r => r.experimentId === exp.experimentId);
                if (!rank) continue;

                if (rank.rank === 1) topMetrics.push(metric);
                if (rank.rank === ranks.length) bottomMetrics.push(metric);
            }

            if (topMetrics.length > 0 && bottomMetrics.length > 0) {
                tradeoffs.push({
                    experiment: exp.experimentName,
                    strongIn: topMetrics,
                    weakIn: bottomMetrics
                });
            }
        }

        return tradeoffs;
    }

    /**
     * Analyze result consistency across runs
     */
    analyzeConsistency(metricComparison) {
        const consistencyScores = [];

        for (const data of Object.values(metricComparison)) {
            for (const expData of data.values) {
                if (expData.count < 2) continue;

                // Coefficient of variation (lower is more consistent)
                const cv = expData.mean > 0 ? expData.std / expData.mean : 0;

                consistencyScores.push({
                    experiment: expData.experimentName,
                    metric: data.name,
                    coefficientOfVariation: cv
                });
            }
        }

        // Calculate average CV per experiment
        const avgCV = {};
        for (const score of consistencyScores) {
            if (!avgCV[score.experiment]) {
                avgCV[score.experiment] = { total: 0, count: 0 };
            }
            avgCV[score.experiment].total += score.coefficientOfVariation;
            avgCV[score.experiment].count++;
        }

        const results = Object.entries(avgCV).map(([exp, data]) => ({
            experiment: exp,
            avgCV: data.total / data.count
        })).sort((a, b) => a.avgCV - b.avgCV);

        return {
            description: results.length > 0
                ? `${results[0].experiment} shows the most consistent results across runs.`
                : 'Not enough data to analyze consistency.',
            mostConsistent: results[0]?.experiment,
            leastConsistent: results[results.length - 1]?.experiment,
            scores: results
        };
    }

    /**
     * Export comparison results
     *
     * @param {string} comparisonId - Comparison ID
     * @param {string} format - Export format (json, csv, markdown)
     * @returns {string} Exported data
     */
    exportComparison(comparisonId, format = 'json') {
        const comparison = this.comparisons.get(comparisonId);
        if (!comparison || !comparison.results) {
            throw new Error('Comparison not found or not completed');
        }

        switch (format) {
            case 'json':
                return JSON.stringify(comparison, null, 2);

            case 'csv':
                return this.exportToCSV(comparison);

            case 'markdown':
                return this.exportToMarkdown(comparison);

            case 'latex':
                if (window.latexExporter) {
                    const mc = comparison.results.metricComparison;
                    const headers = ['Metric', 'Experiment', 'Mean', 'Std', '$n$'];
                    const rows = [];
                    for (const [metric, data] of Object.entries(mc)) {
                        for (const expData of data.values) {
                            rows.push([
                                metric, expData.experimentName,
                                expData.mean, expData.std, expData.count
                            ]);
                        }
                    }
                    return window.latexExporter.table({
                        headers, rows,
                        caption: `Baseline Comparison: ${comparison.name}`,
                        label: `comp_${comparison.id}`
                    });
                }
                throw new Error('LaTeX exporter not loaded');

            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Export comparison to CSV format
     */
    exportToCSV(comparison) {
        const rows = [['Metric', 'Experiment', 'Mean', 'Median', 'Std', 'Min', 'Max', 'Count']];

        for (const [metric, data] of Object.entries(comparison.results.metricComparison)) {
            for (const expData of data.values) {
                rows.push([
                    metric,
                    expData.experimentName,
                    expData.mean.toFixed(4),
                    expData.median.toFixed(4),
                    expData.std.toFixed(4),
                    expData.min.toFixed(4),
                    expData.max.toFixed(4),
                    expData.count
                ]);
            }
        }

        return rows.map(row => row.join(',')).join('\n');
    }

    /**
     * Export comparison to Markdown format
     */
    exportToMarkdown(comparison) {
        let md = `# Comparison: ${comparison.name}\n\n`;
        md += `**Created:** ${new Date(comparison.createdAt).toLocaleString()}\n`;
        md += `**Status:** ${comparison.status}\n\n`;

        // Rankings
        md += `## Overall Rankings\n\n`;
        md += `| Rank | Experiment | Avg Rank Score |\n`;
        md += `|------|------------|----------------|\n`;
        for (const rank of comparison.results.rankings.overall) {
            md += `| ${rank.rank} | ${rank.experimentName} | ${rank.averageRank.toFixed(2)} |\n`;
        }

        // Insights
        md += `\n## Key Insights\n\n`;
        for (const insight of comparison.results.insights) {
            md += `### ${insight.title}\n`;
            md += `${insight.description}\n\n`;
        }

        return md;
    }

    // Statistical utility functions
    calculateMean(values) {
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    calculateMedian(values) {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    }

    calculateStd(values) {
        if (values.length < 2) return 0;
        const mean = this.calculateMean(values);
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return Math.sqrt(this.calculateMean(squaredDiffs));
    }

    calculateCrossExperimentStats(values) {
        const allMeans = values.map(v => v.mean);
        return {
            overallMean: this.calculateMean(allMeans),
            overallStd: this.calculateStd(allMeans),
            range: Math.max(...allMeans) - Math.min(...allMeans),
            best: values.reduce((best, curr) =>
                curr.mean > best.mean ? curr : best
            )
        };
    }

    calculatePValue(tStat, df) {
        if (typeof jStat !== 'undefined') {
            return 2 * (1 - jStat.studentt.cdf(Math.abs(tStat), df));
        }
        // Fallback approximation (only used when jStat is unavailable)
        const x = df / (df + tStat * tStat);
        return 1 - Math.pow(x, df / 2) * 0.5;
    }

    interpretEffectSize(d) {
        const abs = Math.abs(d);
        if (abs < 0.2) return 'negligible';
        if (abs < 0.5) return 'small';
        if (abs < 0.8) return 'medium';
        return 'large';
    }

    // Mock data for testing (uses seeded random for reproducibility)
    createMockExperiment(id) {
        const rng = typeof SeededRandom !== 'undefined'
            ? new SeededRandom(SeededRandom.seedFromString(String(id)))
            : { next: () => Math.random() };

        return {
            id,
            name: `Experiment ${id}`,
            description: 'Mock experiment data',
            runs: Array(5).fill(null).map((_, i) => ({
                id: `run_${i}`,
                metrics: {
                    precision: rng.next() * 0.3 + 0.7,
                    recall: rng.next() * 0.3 + 0.65,
                    f1_score: rng.next() * 0.3 + 0.68,
                    retrieval_time_ms: rng.next() * 100 + 150,
                    relevance_score: rng.next() * 0.2 + 0.8
                }
            }))
        };
    }

    // Utility functions
    generateId(prefix) {
        return `${prefix}_${crypto.randomUUID()}`;
    }

    async save() {
        try {
            const data = {
                comparisons: Array.from(this.comparisons.entries()),
                baselines: Array.from(this.baselines.entries())
            };
            localStorage.setItem('rag_comparisons', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving comparisons:', error);
        }
    }

    // Getters
    getComparison(id) {
        return this.comparisons.get(id);
    }

    getAllComparisons() {
        return Array.from(this.comparisons.values());
    }

    getBaseline(id) {
        return this.baselines.get(id);
    }

    getAllBaselines() {
        return Array.from(this.baselines.values());
    }
}

// Initialize and export
window.baselineComparator = new BaselineComparator();
console.log('✅ Baseline Comparator module loaded');
