/**
 * Advanced Analytics Dashboard
 *
 * Provides comprehensive analytics and visualization capabilities
 * for RAG system research. Integrates experiment tracking, statistical
 * analysis, and baseline comparisons into unified insights.
 *
 * @author EduLLM Research Platform
 * @version 1.0.0
 */

class AnalyticsDashboard {
    constructor() {
        this.dashboards = new Map(); // dashboard_id -> dashboard config
        this.widgets = new Map(); // widget_id -> widget
        this.reports = new Map(); // report_id -> report
        this.initialized = false;

        this.widgetTypes = {
            chart: ['line', 'bar', 'scatter', 'histogram', 'box', 'heatmap'],
            metric: ['single', 'comparison', 'trend', 'distribution'],
            table: ['data', 'comparison', 'ranking'],
            insight: ['summary', 'recommendation', 'alert']
        };

        this.chartColors = [
            '#3b82f6', // blue
            '#10b981', // green
            '#f59e0b', // amber
            '#ef4444', // red
            '#8b5cf6', // purple
            '#ec4899', // pink
            '#06b6d4', // cyan
            '#f97316'  // orange
        ];
    }

    /**
     * Initialize the dashboard
     */
    async initialize() {
        if (this.initialized) return;

        try {
            const savedData = localStorage.getItem('rag_analytics_dashboards');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.dashboards = new Map(data.dashboards || []);
                this.widgets = new Map(data.widgets || []);
                this.reports = new Map(data.reports || []);
            }

            // Create default dashboard if none exists
            if (this.dashboards.size === 0) {
                await this.createDefaultDashboard();
            }

            this.initialized = true;
            console.log('✅ Analytics Dashboard initialized');
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            throw error;
        }
    }

    /**
     * Create default research dashboard
     */
    async createDefaultDashboard() {
        const dashboard = {
            id: 'default_dashboard',
            name: 'Research Overview',
            description: 'Comprehensive view of RAG system experiments',
            layout: {
                type: 'grid',
                columns: 3,
                rows: 'auto'
            },
            widgets: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        // Add default widgets
        dashboard.widgets = [
            this.createWidget('metric', {
                title: 'Total Experiments',
                metric: 'experiment_count',
                position: { col: 0, row: 0 }
            }),
            this.createWidget('metric', {
                title: 'Avg Precision',
                metric: 'avg_precision',
                position: { col: 1, row: 0 }
            }),
            this.createWidget('metric', {
                title: 'Avg Response Time',
                metric: 'avg_response_time',
                position: { col: 2, row: 0 }
            }),
            this.createWidget('chart', {
                title: 'Experiment Performance Trends',
                chartType: 'line',
                metrics: ['precision', 'recall', 'f1_score'],
                position: { col: 0, row: 1, colSpan: 2 }
            }),
            this.createWidget('chart', {
                title: 'Metric Distribution',
                chartType: 'box',
                metric: 'precision',
                position: { col: 2, row: 1 }
            }),
            this.createWidget('table', {
                title: 'Top Experiments',
                tableType: 'ranking',
                sortBy: 'f1_score',
                limit: 10,
                position: { col: 0, row: 2, colSpan: 3 }
            })
        ];

        this.dashboards.set(dashboard.id, dashboard);
        await this.save();

        return dashboard;
    }

    /**
     * Create a custom dashboard
     *
     * @param {string} name - Dashboard name
     * @param {object} config - Dashboard configuration
     * @returns {object} Dashboard object
     */
    async createDashboard(name, config = {}) {
        const dashboard = {
            id: this.generateId('dash'),
            name,
            description: config.description || '',
            layout: config.layout || { type: 'grid', columns: 3, rows: 'auto' },
            widgets: config.widgets || [],
            filters: config.filters || {},
            refreshInterval: config.refreshInterval || null,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        this.dashboards.set(dashboard.id, dashboard);
        await this.save();

        console.log(`✅ Created dashboard: ${name}`);
        return dashboard;
    }

    /**
     * Create a widget
     *
     * @param {string} type - Widget type
     * @param {object} config - Widget configuration
     * @returns {object} Widget object
     */
    createWidget(type, config) {
        const widget = {
            id: this.generateId('widget'),
            type,
            title: config.title || 'Untitled Widget',
            config,
            data: null,
            lastUpdated: null
        };

        this.widgets.set(widget.id, widget);
        return widget;
    }

    /**
     * Generate dashboard analytics report
     *
     * @param {string} dashboardId - Dashboard ID
     * @param {object} options - Report options
     * @returns {object} Analytics report
     */
    async generateReport(dashboardId = 'default_dashboard', options = {}) {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) {
            throw new Error(`Dashboard ${dashboardId} not found`);
        }

        const report = {
            id: this.generateId('report'),
            dashboardId,
            name: options.name || `Report - ${new Date().toLocaleDateString()}`,
            generatedAt: Date.now(),
            timeRange: options.timeRange || { start: 0, end: Date.now() },
            sections: []
        };

        // Section 1: Executive Summary
        report.sections.push(await this.generateExecutiveSummary());

        // Section 2: Experiment Overview
        report.sections.push(await this.generateExperimentOverview(options));

        // Section 3: Performance Metrics
        report.sections.push(await this.generatePerformanceMetrics(options));

        // Section 4: Statistical Analysis
        report.sections.push(await this.generateStatisticalSection(options));

        // Section 5: Comparisons
        report.sections.push(await this.generateComparisonSection(options));

        // Section 6: Insights & Recommendations
        report.sections.push(await this.generateInsightsSection(options));

        this.reports.set(report.id, report);
        await this.save();

        console.log(`✅ Generated report: ${report.name}`);
        return report;
    }

    /**
     * Generate executive summary section
     */
    async generateExecutiveSummary() {
        const experiments = window.experimentTracker
            ? window.experimentTracker.getAllExperiments()
            : [];

        const runs = experiments.flatMap(exp =>
            window.experimentTracker.getRuns(exp.id)
        );

        const activeExperiments = experiments.filter(e => e.status === 'active').length;
        const completedRuns = runs.filter(r => r.status === 'completed').length;

        // Calculate average metrics
        const avgMetrics = this.calculateAverageMetrics(runs);

        return {
            title: 'Executive Summary',
            type: 'summary',
            data: {
                overview: {
                    totalExperiments: experiments.length,
                    activeExperiments,
                    totalRuns: runs.length,
                    completedRuns
                },
                keyMetrics: avgMetrics,
                highlights: this.generateHighlights(experiments, runs),
                period: {
                    start: Math.min(...experiments.map(e => e.createdAt)),
                    end: Date.now()
                }
            }
        };
    }

    /**
     * Generate experiment overview section
     */
    async generateExperimentOverview(options) {
        const experiments = window.experimentTracker
            ? window.experimentTracker.getAllExperiments()
            : [];

        const experimentStats = experiments.map(exp => {
            const runs = window.experimentTracker.getRuns(exp.id);
            const completedRuns = runs.filter(r => r.status === 'completed');

            return {
                id: exp.id,
                name: exp.name,
                status: exp.status,
                runCount: runs.length,
                completedRunCount: completedRuns.length,
                avgMetrics: this.calculateAverageMetrics(completedRuns),
                createdAt: exp.createdAt,
                tags: exp.tags || []
            };
        });

        // Sort by creation date
        experimentStats.sort((a, b) => b.createdAt - a.createdAt);

        return {
            title: 'Experiment Overview',
            type: 'overview',
            data: {
                experiments: experimentStats,
                summary: {
                    total: experiments.length,
                    byStatus: this.groupByStatus(experiments),
                    byTag: this.groupByTag(experiments)
                },
                timeline: this.generateTimeline(experiments)
            }
        };
    }

    /**
     * Generate performance metrics section
     */
    async generatePerformanceMetrics(options) {
        const experiments = window.experimentTracker
            ? window.experimentTracker.getAllExperiments()
            : [];

        const allRuns = experiments.flatMap(exp =>
            window.experimentTracker.getRuns(exp.id).filter(r => r.status === 'completed')
        );

        // Extract metrics across all runs
        const metricsData = this.extractAllMetrics(allRuns);

        // Calculate statistics for each metric
        const metricStats = {};
        for (const [metric, values] of Object.entries(metricsData)) {
            if (values.length === 0) continue;

            metricStats[metric] = window.statisticalAnalyzer
                ? window.statisticalAnalyzer.calculateDescriptiveStats(values)
                : this.calculateBasicStats(values);
        }

        // Generate charts data
        const charts = {
            trends: this.generateTrendData(allRuns),
            distributions: this.generateDistributionData(metricsData),
            correlations: this.generateCorrelationData(metricsData)
        };

        return {
            title: 'Performance Metrics',
            type: 'metrics',
            data: {
                statistics: metricStats,
                charts,
                topPerformers: this.identifyTopPerformers(allRuns),
                bottlenecks: this.identifyBottlenecks(metricStats)
            }
        };
    }

    /**
     * Generate statistical analysis section
     */
    async generateStatisticalSection(options) {
        const experiments = window.experimentTracker
            ? window.experimentTracker.getAllExperiments()
            : [];

        if (experiments.length < 2) {
            return {
                title: 'Statistical Analysis',
                type: 'statistical',
                data: {
                    message: 'Need at least 2 experiments for statistical analysis'
                }
            };
        }

        const analyses = [];

        // Normality tests
        if (window.statisticalAnalyzer) {
            const allRuns = experiments.flatMap(exp =>
                window.experimentTracker.getRuns(exp.id)
            );
            const metricsData = this.extractAllMetrics(allRuns);

            for (const [metric, values] of Object.entries(metricsData)) {
                if (values.length >= 3) {
                    const normalityTest = window.statisticalAnalyzer.normalityTest(values);
                    analyses.push({
                        type: 'normality',
                        metric,
                        result: normalityTest
                    });
                }
            }

            // Outlier detection
            for (const [metric, values] of Object.entries(metricsData)) {
                if (values.length >= 10) {
                    const outliers = window.statisticalAnalyzer.detectOutliers(values);
                    analyses.push({
                        type: 'outliers',
                        metric,
                        result: outliers
                    });
                }
            }
        }

        return {
            title: 'Statistical Analysis',
            type: 'statistical',
            data: {
                analyses,
                summary: this.summarizeStatisticalTests(analyses),
                recommendations: this.generateStatisticalRecommendations(analyses)
            }
        };
    }

    /**
     * Generate comparison section
     */
    async generateComparisonSection(options) {
        const comparisons = window.baselineComparator
            ? window.baselineComparator.getAllComparisons()
            : [];

        if (comparisons.length === 0) {
            return {
                title: 'Baseline Comparisons',
                type: 'comparison',
                data: {
                    message: 'No comparisons available. Create comparisons to see analysis here.'
                }
            };
        }

        // Get completed comparisons
        const completed = comparisons.filter(c => c.status === 'completed');

        const comparisonSummaries = completed.map(comp => ({
            id: comp.id,
            name: comp.name,
            experimentCount: comp.experimentIds.length,
            winner: comp.results?.rankings?.overall[0],
            insights: comp.results?.insights || [],
            significantDifferences: comp.results?.statisticalResults?.significantDifferences || []
        }));

        return {
            title: 'Baseline Comparisons',
            type: 'comparison',
            data: {
                comparisons: comparisonSummaries,
                summary: {
                    total: comparisons.length,
                    completed: completed.length,
                    pending: comparisons.filter(c => c.status === 'pending').length
                },
                bestPractices: this.identifyBestPractices(comparisonSummaries)
            }
        };
    }

    /**
     * Generate insights and recommendations section
     */
    async generateInsightsSection(options) {
        const insights = [];

        // Collect insights from various sources
        if (window.baselineComparator) {
            const comparisons = window.baselineComparator.getAllComparisons();
            for (const comp of comparisons) {
                if (comp.results && comp.results.insights) {
                    insights.push(...comp.results.insights.map(i => ({
                        ...i,
                        source: 'baseline_comparison',
                        comparisonId: comp.id
                    })));
                }
            }
        }

        // Add performance insights
        const performanceInsights = await this.generatePerformanceInsights();
        insights.push(...performanceInsights);

        // Add data quality insights
        const qualityInsights = await this.generateQualityInsights();
        insights.push(...qualityInsights);

        // Prioritize insights
        const prioritized = this.prioritizeInsights(insights);

        // Generate recommendations
        const recommendations = this.generateRecommendations(insights);

        return {
            title: 'Insights & Recommendations',
            type: 'insights',
            data: {
                insights: prioritized,
                recommendations,
                actionItems: this.generateActionItems(recommendations),
                nextSteps: this.suggestNextSteps(insights)
            }
        };
    }

    /**
     * Calculate average metrics across runs
     */
    calculateAverageMetrics(runs) {
        const metrics = {};
        const metricCounts = {};

        for (const run of runs) {
            if (!run.metrics) continue;

            for (const [key, value] of Object.entries(run.metrics)) {
                // Handle both single values and arrays
                const val = Array.isArray(value)
                    ? value[value.length - 1]?.value
                    : value;

                if (typeof val === 'number') {
                    metrics[key] = (metrics[key] || 0) + val;
                    metricCounts[key] = (metricCounts[key] || 0) + 1;
                }
            }
        }

        // Calculate averages
        const avgMetrics = {};
        for (const [key, sum] of Object.entries(metrics)) {
            avgMetrics[key] = sum / metricCounts[key];
        }

        return avgMetrics;
    }

    /**
     * Extract all metric values from runs
     */
    extractAllMetrics(runs) {
        const metricsData = {};

        for (const run of runs) {
            if (!run.metrics) continue;

            for (const [key, value] of Object.entries(run.metrics)) {
                if (!metricsData[key]) {
                    metricsData[key] = [];
                }

                const val = Array.isArray(value)
                    ? value[value.length - 1]?.value
                    : value;

                if (typeof val === 'number') {
                    metricsData[key].push(val);
                }
            }
        }

        return metricsData;
    }

    /**
     * Calculate basic statistics
     */
    calculateBasicStats(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const n = values.length;
        const mean = values.reduce((a, b) => a + b, 0) / n;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);

        return {
            n,
            mean,
            median: sorted[Math.floor(n / 2)],
            stdDev: Math.sqrt(variance),
            min: sorted[0],
            max: sorted[n - 1]
        };
    }

    /**
     * Generate highlights
     */
    generateHighlights(experiments, runs) {
        const highlights = [];

        // Best performing experiment
        if (runs.length > 0) {
            const runsByExp = {};
            for (const run of runs) {
                if (!runsByExp[run.experimentId]) {
                    runsByExp[run.experimentId] = [];
                }
                runsByExp[run.experimentId].push(run);
            }

            let bestExp = null;
            let bestScore = -Infinity;

            for (const [expId, expRuns] of Object.entries(runsByExp)) {
                const avgMetrics = this.calculateAverageMetrics(expRuns);
                const score = avgMetrics.f1_score || avgMetrics.precision || 0;

                if (score > bestScore) {
                    bestScore = score;
                    bestExp = experiments.find(e => e.id === expId);
                }
            }

            if (bestExp) {
                highlights.push({
                    type: 'achievement',
                    title: 'Best Performer',
                    description: `${bestExp.name} achieved the highest average performance (${(bestScore * 100).toFixed(1)}%)`,
                    experimentId: bestExp.id
                });
            }
        }

        // Recent activity
        const recentExps = experiments.filter(e =>
            Date.now() - e.createdAt < 7 * 24 * 60 * 60 * 1000
        );
        if (recentExps.length > 0) {
            highlights.push({
                type: 'activity',
                title: 'Recent Activity',
                description: `${recentExps.length} experiments created in the last 7 days`
            });
        }

        return highlights;
    }

    /**
     * Group experiments by status
     */
    groupByStatus(experiments) {
        const groups = {};
        for (const exp of experiments) {
            const status = exp.status || 'unknown';
            groups[status] = (groups[status] || 0) + 1;
        }
        return groups;
    }

    /**
     * Group experiments by tag
     */
    groupByTag(experiments) {
        const groups = {};
        for (const exp of experiments) {
            for (const tag of exp.tags || []) {
                groups[tag] = (groups[tag] || 0) + 1;
            }
        }
        return groups;
    }

    /**
     * Generate timeline of experiments
     */
    generateTimeline(experiments) {
        return experiments
            .map(exp => ({
                date: exp.createdAt,
                event: 'experiment_created',
                experimentName: exp.name
            }))
            .sort((a, b) => a.date - b.date);
    }

    /**
     * Generate trend data for charts
     */
    generateTrendData(runs) {
        const trends = {};
        const sortedRuns = [...runs].sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

        for (const run of sortedRuns) {
            if (!run.metrics) continue;

            for (const [metric, value] of Object.entries(run.metrics)) {
                if (!trends[metric]) {
                    trends[metric] = [];
                }

                const val = Array.isArray(value)
                    ? value[value.length - 1]?.value
                    : value;

                if (typeof val === 'number') {
                    trends[metric].push({
                        timestamp: run.startTime || Date.now(),
                        value: val,
                        runId: run.id
                    });
                }
            }
        }

        return trends;
    }

    /**
     * Generate distribution data
     */
    generateDistributionData(metricsData) {
        const distributions = {};

        for (const [metric, values] of Object.entries(metricsData)) {
            if (values.length < 5) continue;

            // Create histogram bins
            const sorted = [...values].sort((a, b) => a - b);
            const min = sorted[0];
            const max = sorted[sorted.length - 1];
            const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)));
            const binWidth = (max - min) / binCount;

            const bins = Array(binCount).fill(0).map((_, i) => ({
                start: min + i * binWidth,
                end: min + (i + 1) * binWidth,
                count: 0
            }));

            for (const val of values) {
                const binIndex = Math.min(
                    Math.floor((val - min) / binWidth),
                    binCount - 1
                );
                bins[binIndex].count++;
            }

            distributions[metric] = {
                bins,
                stats: this.calculateBasicStats(values)
            };
        }

        return distributions;
    }

    /**
     * Generate correlation data
     */
    generateCorrelationData(metricsData) {
        const correlations = [];
        const metrics = Object.keys(metricsData);

        for (let i = 0; i < metrics.length; i++) {
            for (let j = i + 1; j < metrics.length; j++) {
                const metric1 = metrics[i];
                const metric2 = metrics[j];

                const values1 = metricsData[metric1];
                const values2 = metricsData[metric2];

                if (values1.length < 3 || values2.length < 3) continue;

                // Calculate Pearson correlation (simplified)
                const minLen = Math.min(values1.length, values2.length);
                const v1 = values1.slice(0, minLen);
                const v2 = values2.slice(0, minLen);

                const mean1 = v1.reduce((a, b) => a + b, 0) / minLen;
                const mean2 = v2.reduce((a, b) => a + b, 0) / minLen;

                const cov = v1.reduce((sum, val, idx) =>
                    sum + (val - mean1) * (v2[idx] - mean2), 0
                ) / minLen;

                const std1 = Math.sqrt(
                    v1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / minLen
                );
                const std2 = Math.sqrt(
                    v2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / minLen
                );

                const correlation = cov / (std1 * std2);

                if (!isNaN(correlation)) {
                    correlations.push({
                        metric1,
                        metric2,
                        correlation,
                        strength: Math.abs(correlation) > 0.7 ? 'strong' :
                                Math.abs(correlation) > 0.4 ? 'moderate' : 'weak'
                    });
                }
            }
        }

        return correlations.sort((a, b) =>
            Math.abs(b.correlation) - Math.abs(a.correlation)
        );
    }

    /**
     * Identify top performers
     */
    identifyTopPerformers(runs, limit = 5) {
        const scored = runs
            .filter(r => r.metrics)
            .map(r => {
                const metrics = r.metrics;
                // Calculate composite score
                const score = (
                    (metrics.precision || 0) * 0.3 +
                    (metrics.recall || 0) * 0.3 +
                    (metrics.f1_score || 0) * 0.4
                );

                return { run: r, score };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return scored;
    }

    /**
     * Identify bottlenecks
     */
    identifyBottlenecks(metricStats) {
        const bottlenecks = [];

        for (const [metric, stats] of Object.entries(metricStats)) {
            // Check for high variance
            if (stats.coefficientOfVariation > 20) {
                bottlenecks.push({
                    type: 'high_variance',
                    metric,
                    cv: stats.coefficientOfVariation,
                    description: `High variability in ${metric} (CV: ${stats.coefficientOfVariation.toFixed(1)}%)`
                });
            }

            // Check for low performance
            if (metric.includes('score') || metric.includes('precision') || metric.includes('recall')) {
                if (stats.mean < 0.7) {
                    bottlenecks.push({
                        type: 'low_performance',
                        metric,
                        mean: stats.mean,
                        description: `${metric} below target (${(stats.mean * 100).toFixed(1)}%)`
                    });
                }
            }
        }

        return bottlenecks;
    }

    /**
     * Summarize statistical tests
     */
    summarizeStatisticalTests(analyses) {
        const normalityTests = analyses.filter(a => a.type === 'normality');
        const outlierTests = analyses.filter(a => a.type === 'outliers');

        return {
            normalityTests: {
                total: normalityTests.length,
                normal: normalityTests.filter(a => a.result.isNormal).length,
                nonNormal: normalityTests.filter(a => !a.result.isNormal).length
            },
            outlierTests: {
                total: outlierTests.length,
                metricsWithOutliers: outlierTests.filter(a =>
                    a.result.summary.iqrOutlierCount > 0
                ).length
            }
        };
    }

    /**
     * Generate statistical recommendations
     */
    generateStatisticalRecommendations(analyses) {
        const recommendations = [];

        const nonNormalMetrics = analyses
            .filter(a => a.type === 'normality' && !a.result.isNormal)
            .map(a => a.metric);

        if (nonNormalMetrics.length > 0) {
            recommendations.push({
                priority: 'medium',
                title: 'Use Non-parametric Tests',
                description: `Metrics ${nonNormalMetrics.join(', ')} show non-normal distribution. Consider using non-parametric statistical tests.`
            });
        }

        const metricsWithOutliers = analyses
            .filter(a => a.type === 'outliers' && a.result.summary.iqrOutlierCount > 0)
            .map(a => a.metric);

        if (metricsWithOutliers.length > 0) {
            recommendations.push({
                priority: 'high',
                title: 'Investigate Outliers',
                description: `Found outliers in ${metricsWithOutliers.join(', ')}. Review these data points for errors or interesting edge cases.`
            });
        }

        return recommendations;
    }

    /**
     * Identify best practices from comparisons
     */
    identifyBestPractices(comparisonSummaries) {
        const practices = [];

        // Find consistently winning approaches
        const winners = {};
        for (const comp of comparisonSummaries) {
            if (comp.winner) {
                const winnerName = comp.winner.experimentName;
                winners[winnerName] = (winners[winnerName] || 0) + 1;
            }
        }

        const topWinner = Object.entries(winners).sort((a, b) => b[1] - a[1])[0];
        if (topWinner) {
            practices.push({
                practice: 'Consistent Top Performer',
                experiment: topWinner[0],
                wins: topWinner[1],
                description: `${topWinner[0]} won ${topWinner[1]} comparisons`
            });
        }

        return practices;
    }

    /**
     * Generate performance insights
     */
    async generatePerformanceInsights() {
        const insights = [];
        const experiments = window.experimentTracker?.getAllExperiments() || [];

        if (experiments.length === 0) {
            return insights;
        }

        const allRuns = experiments.flatMap(exp =>
            window.experimentTracker.getRuns(exp.id)
        );

        const avgMetrics = this.calculateAverageMetrics(allRuns);

        // Check if meeting targets
        if (avgMetrics.precision && avgMetrics.precision < 0.8) {
            insights.push({
                type: 'performance',
                priority: 'high',
                title: 'Precision Below Target',
                description: `Average precision is ${(avgMetrics.precision * 100).toFixed(1)}%, below the 80% target.`
            });
        }

        return insights;
    }

    /**
     * Generate data quality insights
     */
    async generateQualityInsights() {
        const insights = [];

        // Check for sufficient data
        const experiments = window.experimentTracker?.getAllExperiments() || [];
        const totalRuns = experiments.reduce((sum, exp) =>
            sum + window.experimentTracker.getRuns(exp.id).length, 0
        );

        if (totalRuns < 10) {
            insights.push({
                type: 'data_quality',
                priority: 'medium',
                title: 'Limited Experiment Data',
                description: `Only ${totalRuns} runs recorded. Consider running more experiments for reliable statistics.`
            });
        }

        return insights;
    }

    /**
     * Prioritize insights
     */
    prioritizeInsights(insights) {
        const priority = { high: 3, medium: 2, low: 1 };
        return insights.sort((a, b) =>
            priority[b.priority] - priority[a.priority]
        );
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(insights) {
        const recommendations = [];

        const highPriorityInsights = insights.filter(i => i.priority === 'high');

        if (highPriorityInsights.length > 0) {
            recommendations.push({
                category: 'Critical Actions',
                items: highPriorityInsights.map(i => ({
                    title: i.title,
                    action: this.suggestAction(i)
                }))
            });
        }

        return recommendations;
    }

    /**
     * Suggest action based on insight
     */
    suggestAction(insight) {
        if (insight.type === 'performance') {
            return 'Review and optimize retrieval parameters';
        }
        if (insight.type === 'data_quality') {
            return 'Run additional experiments to increase sample size';
        }
        return 'Review and address this issue';
    }

    /**
     * Generate action items
     */
    generateActionItems(recommendations) {
        return recommendations.flatMap(rec =>
            rec.items.map(item => ({
                title: item.title,
                action: item.action,
                status: 'pending'
            }))
        );
    }

    /**
     * Suggest next steps
     */
    suggestNextSteps(insights) {
        const steps = [
            'Continue running experiments to build statistical confidence',
            'Compare top performers to identify optimal configurations',
            'Document successful approaches for reproducibility'
        ];

        const highPriorityCount = insights.filter(i => i.priority === 'high').length;
        if (highPriorityCount > 0) {
            steps.unshift(`Address ${highPriorityCount} high-priority issues`);
        }

        return steps;
    }

    /**
     * Export report
     *
     * @param {string} reportId - Report ID
     * @param {string} format - Export format
     * @returns {string} Exported report
     */
    exportReport(reportId, format = 'json') {
        const report = this.reports.get(reportId);
        if (!report) {
            throw new Error(`Report ${reportId} not found`);
        }

        switch (format) {
            case 'json':
                return JSON.stringify(report, null, 2);

            case 'markdown':
                return this.exportToMarkdown(report);

            case 'html':
                return this.exportToHTML(report);

            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    /**
     * Export report to Markdown
     */
    exportToMarkdown(report) {
        let md = `# ${report.name}\n\n`;
        md += `**Generated:** ${new Date(report.generatedAt).toLocaleString()}\n\n`;
        md += `---\n\n`;

        for (const section of report.sections) {
            md += `## ${section.title}\n\n`;

            if (section.data.message) {
                md += `${section.data.message}\n\n`;
                continue;
            }

            // Format based on section type
            if (section.type === 'summary') {
                md += this.formatSummaryMarkdown(section.data);
            } else if (section.type === 'metrics') {
                md += this.formatMetricsMarkdown(section.data);
            }

            md += `\n`;
        }

        return md;
    }

    formatSummaryMarkdown(data) {
        let md = '### Overview\n\n';
        md += `- Total Experiments: ${data.overview.totalExperiments}\n`;
        md += `- Active Experiments: ${data.overview.activeExperiments}\n`;
        md += `- Total Runs: ${data.overview.totalRuns}\n`;
        md += `- Completed Runs: ${data.overview.completedRuns}\n\n`;

        if (data.highlights.length > 0) {
            md += '### Highlights\n\n';
            for (const highlight of data.highlights) {
                md += `- **${highlight.title}:** ${highlight.description}\n`;
            }
            md += '\n';
        }

        return md;
    }

    formatMetricsMarkdown(data) {
        let md = '### Key Statistics\n\n';
        md += '| Metric | Mean | Std Dev | Min | Max |\n';
        md += '|--------|------|---------|-----|-----|\n';

        for (const [metric, stats] of Object.entries(data.statistics)) {
            md += `| ${metric} | ${stats.mean.toFixed(3)} | ${stats.stdDev.toFixed(3)} | ${stats.min.toFixed(3)} | ${stats.max.toFixed(3)} |\n`;
        }

        return md;
    }

    exportToHTML(report) {
        // Simplified HTML export
        return `
<!DOCTYPE html>
<html>
<head>
    <title>${report.name}</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1, h2 { color: #1e293b; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; }
    </style>
</head>
<body>
    <h1>${report.name}</h1>
    <p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
    ${this.exportToMarkdown(report).replace(/\n/g, '<br>')}
</body>
</html>`;
    }

    // Utility functions
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async save() {
        try {
            const data = {
                dashboards: Array.from(this.dashboards.entries()),
                widgets: Array.from(this.widgets.entries()),
                reports: Array.from(this.reports.entries())
            };
            localStorage.setItem('rag_analytics_dashboards', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving dashboards:', error);
        }
    }

    // Getters
    getDashboard(id) {
        return this.dashboards.get(id);
    }

    getAllDashboards() {
        return Array.from(this.dashboards.values());
    }

    getReport(id) {
        return this.reports.get(id);
    }

    getAllReports() {
        return Array.from(this.reports.values());
    }
}

// Initialize and export
window.analyticsDashboard = new AnalyticsDashboard();
console.log('✅ Analytics Dashboard module loaded');
