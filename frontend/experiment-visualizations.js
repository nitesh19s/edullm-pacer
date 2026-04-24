/**
 * Experiment Results Visualizations
 *
 * Creates interactive charts for experiment analytics, A/B tests, and baseline comparisons
 */

class ExperimentVisualizations {
    constructor(chartManager) {
        this.chartManager = chartManager;
        this.initialized = false;
    }

    /**
     * Initialize visualizations
     */
    async initialize() {
        if (this.initialized) return;
        this.initialized = true;
        console.log('Experiment Visualizations initialized');
    }

    // ==================== EXPERIMENT PERFORMANCE VISUALIZATIONS ====================

    /**
     * Create experiments over time chart
     * @param {string} canvasId - Canvas ID
     * @param {Array} experiments - Experiment data
     */
    createExperimentsOverTimeChart(canvasId, experiments) {
        if (!experiments || experiments.length === 0) return null;

        // Group by date
        const dailyData = this.groupByDate(experiments);
        const dates = Object.keys(dailyData).sort();

        const data = {
            labels: dates,
            datasets: [{
                label: 'Experiments Created',
                data: dates.map(date => dailyData[date].count),
                color: '#3b82f6'
            }]
        };

        return this.chartManager.createLineChart(canvasId, data, {
            title: 'Experiments Over Time',
            yAxis: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of Experiments'
                }
            }
        });
    }

    /**
     * Create precision/recall comparison chart
     * @param {string} canvasId - Canvas ID
     * @param {Array} experimentRuns - Experiment run data
     */
    createPrecisionRecallChart(canvasId, experimentRuns) {
        if (!experimentRuns || experimentRuns.length === 0) return null;

        const experiments = this.aggregateByExperiment(experimentRuns);
        const topExperiments = experiments.slice(0, 10);

        const data = {
            labels: topExperiments.map(e => this.truncateLabel(e.name, 15)),
            datasets: [
                {
                    label: 'Precision',
                    data: topExperiments.map(e => (e.precision * 100).toFixed(1)),
                    color: '#10b981'
                },
                {
                    label: 'Recall',
                    data: topExperiments.map(e => (e.recall * 100).toFixed(1)),
                    color: '#3b82f6'
                }
            ]
        };

        return this.chartManager.createBarChart(canvasId, data, {
            title: 'Precision vs Recall by Experiment',
            yAxis: {
                min: 0,
                max: 100,
                title: {
                    display: true,
                    text: 'Percentage (%)'
                }
            }
        });
    }

    /**
     * Create response time distribution chart
     * @param {string} canvasId - Canvas ID
     * @param {Array} experimentRuns - Experiment run data
     */
    createResponseTimeDistributionChart(canvasId, experimentRuns) {
        if (!experimentRuns || experimentRuns.length === 0) return null;

        // Group by response time ranges
        const ranges = {
            '0-500ms': 0,
            '500ms-1s': 0,
            '1s-2s': 0,
            '2s-5s': 0,
            '5s+': 0
        };

        experimentRuns.forEach(run => {
            const rt = run.responseTime || 0;
            if (rt < 500) ranges['0-500ms']++;
            else if (rt < 1000) ranges['500ms-1s']++;
            else if (rt < 2000) ranges['1s-2s']++;
            else if (rt < 5000) ranges['2s-5s']++;
            else ranges['5s+']++;
        });

        const data = {
            labels: Object.keys(ranges),
            values: Object.values(ranges),
            colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#7c3aed']
        };

        return this.chartManager.createDoughnutChart(canvasId, data, {
            title: 'Response Time Distribution',
            showLegend: true,
            legendPosition: 'right'
        });
    }

    /**
     * Create experiment status overview chart
     * @param {string} canvasId - Canvas ID
     * @param {Array} experiments - Experiment data
     */
    createExperimentStatusChart(canvasId, experiments) {
        if (!experiments || experiments.length === 0) return null;

        const statusCounts = {
            'Completed': 0,
            'Running': 0,
            'Pending': 0,
            'Failed': 0
        };

        experiments.forEach(exp => {
            const status = exp.status || 'Pending';
            if (statusCounts[status] !== undefined) {
                statusCounts[status]++;
            }
        });

        const data = {
            labels: Object.keys(statusCounts),
            values: Object.values(statusCounts),
            colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
        };

        return this.chartManager.createDoughnutChart(canvasId, data, {
            title: 'Experiment Status Overview'
        });
    }

    // ==================== A/B TEST VISUALIZATIONS ====================

    /**
     * Create A/B test comparison chart
     * @param {string} canvasId - Canvas ID
     * @param {Object} abTest - A/B test results
     */
    createABTestComparisonChart(canvasId, abTest) {
        if (!abTest || !abTest.results) return null;

        const variantA = abTest.results.variantA || {};
        const variantB = abTest.results.variantB || {};

        const data = {
            labels: ['Success Rate', 'Avg Response Time', 'Avg Precision'],
            datasets: [
                {
                    label: 'Variant A',
                    data: [
                        (variantA.successRate * 100) || 0,
                        variantA.avgResponseTime || 0,
                        (variantA.avgPrecision * 100) || 0
                    ],
                    color: '#3b82f6'
                },
                {
                    label: 'Variant B',
                    data: [
                        (variantB.successRate * 100) || 0,
                        variantB.avgResponseTime || 0,
                        (variantB.avgPrecision * 100) || 0
                    ],
                    color: '#10b981'
                }
            ]
        };

        return this.chartManager.createRadarChart(canvasId, data, {
            title: 'A/B Test Comparison',
            maxValue: 100
        });
    }

    /**
     * Create conversion funnel chart
     * @param {string} canvasId - Canvas ID
     * @param {Object} abTest - A/B test data
     */
    createConversionFunnelChart(canvasId, abTest) {
        if (!abTest || !abTest.results) return null;

        const variantA = abTest.results.variantA || {};
        const variantB = abTest.results.variantB || {};

        const data = {
            labels: ['Variant A', 'Variant B'],
            datasets: [{
                label: 'Conversion Rate',
                data: [
                    (variantA.successRate * 100) || 0,
                    (variantB.successRate * 100) || 0
                ],
                colors: ['#3b82f6', '#10b981']
            }]
        };

        return this.chartManager.createBarChart(canvasId, data, {
            title: 'Conversion Comparison',
            yAxis: {
                min: 0,
                max: 100,
                title: {
                    display: true,
                    text: 'Success Rate (%)'
                }
            }
        });
    }

    // ==================== BASELINE COMPARISON VISUALIZATIONS ====================

    /**
     * Create baseline comparison chart
     * @param {string} canvasId - Canvas ID
     * @param {Object} comparison - Baseline comparison data
     */
    createBaselineComparisonChart(canvasId, comparison) {
        if (!comparison || !comparison.results) return null;

        const baseline = comparison.results.baseline || {};
        const current = comparison.results.current || {};

        const data = {
            labels: ['Precision', 'Recall', 'F1 Score', 'Response Time'],
            datasets: [
                {
                    label: 'Baseline',
                    data: [
                        (baseline.precision * 100) || 0,
                        (baseline.recall * 100) || 0,
                        (baseline.f1Score * 100) || 0,
                        baseline.avgResponseTime || 0
                    ],
                    color: '#6b7280'
                },
                {
                    label: 'Current',
                    data: [
                        (current.precision * 100) || 0,
                        (current.recall * 100) || 0,
                        (current.f1Score * 100) || 0,
                        current.avgResponseTime || 0
                    ],
                    color: '#3b82f6'
                }
            ]
        };

        return this.chartManager.createBarChart(canvasId, data, {
            title: 'Baseline vs Current Performance',
            yAxis: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Value'
                }
            }
        });
    }

    /**
     * Create improvement trend chart
     * @param {string} canvasId - Canvas ID
     * @param {Array} comparisons - Historical baseline comparisons
     */
    createImprovementTrendChart(canvasId, comparisons) {
        if (!comparisons || comparisons.length === 0) return null;

        const sorted = comparisons.sort((a, b) =>
            new Date(a.timestamp) - new Date(b.timestamp)
        );

        const data = {
            labels: sorted.map(c => new Date(c.timestamp).toLocaleDateString()),
            datasets: [{
                label: 'Improvement Over Baseline (%)',
                data: sorted.map(c => c.results?.improvement || 0),
                color: '#10b981'
            }]
        };

        return this.chartManager.createLineChart(canvasId, data, {
            title: 'Performance Improvement Trend',
            yAxis: {
                title: {
                    display: true,
                    text: 'Improvement (%)'
                }
            }
        });
    }

    // ==================== HELPER METHODS ====================

    /**
     * Group experiments by date
     */
    groupByDate(experiments) {
        const grouped = {};

        experiments.forEach(exp => {
            const date = new Date(exp.createdAt || exp.timestamp).toLocaleDateString();
            if (!grouped[date]) {
                grouped[date] = { count: 0 };
            }
            grouped[date].count++;
        });

        return grouped;
    }

    /**
     * Aggregate experiment runs by experiment
     */
    aggregateByExperiment(runs) {
        const byExperiment = {};

        runs.forEach(run => {
            const expId = run.experimentId;
            if (!byExperiment[expId]) {
                byExperiment[expId] = {
                    name: run.experimentName || `Experiment ${expId}`,
                    runs: [],
                    totalPrecision: 0,
                    totalRecall: 0
                };
            }
            byExperiment[expId].runs.push(run);
            byExperiment[expId].totalPrecision += run.precision || 0;
            byExperiment[expId].totalRecall += run.recall || 0;
        });

        return Object.values(byExperiment).map(exp => ({
            name: exp.name,
            precision: exp.totalPrecision / exp.runs.length,
            recall: exp.totalRecall / exp.runs.length,
            runCount: exp.runs.length
        }));
    }

    /**
     * Truncate label
     */
    truncateLabel(label, maxLength) {
        return label.length > maxLength
            ? label.substring(0, maxLength) + '...'
            : label;
    }

    /**
     * Render all experiment visualizations
     * @param {Object} analyticsData - Complete analytics data
     * @param {Object} canvasIds - Canvas IDs for each chart
     */
    renderAllCharts(analyticsData, canvasIds = {}) {
        const charts = {};

        if (canvasIds.experimentsOverTime && analyticsData.experiments) {
            charts.experimentsOverTime = this.createExperimentsOverTimeChart(
                canvasIds.experimentsOverTime,
                analyticsData.experiments
            );
        }

        if (canvasIds.precisionRecall && analyticsData.experimentRuns) {
            charts.precisionRecall = this.createPrecisionRecallChart(
                canvasIds.precisionRecall,
                analyticsData.experimentRuns
            );
        }

        if (canvasIds.responseTimeDistribution && analyticsData.experimentRuns) {
            charts.responseTimeDistribution = this.createResponseTimeDistributionChart(
                canvasIds.responseTimeDistribution,
                analyticsData.experimentRuns
            );
        }

        if (canvasIds.experimentStatus && analyticsData.experiments) {
            charts.experimentStatus = this.createExperimentStatusChart(
                canvasIds.experimentStatus,
                analyticsData.experiments
            );
        }

        if (canvasIds.abTestComparison && analyticsData.currentABTest) {
            charts.abTestComparison = this.createABTestComparisonChart(
                canvasIds.abTestComparison,
                analyticsData.currentABTest
            );
        }

        if (canvasIds.baselineComparison && analyticsData.currentComparison) {
            charts.baselineComparison = this.createBaselineComparisonChart(
                canvasIds.baselineComparison,
                analyticsData.currentComparison
            );
        }

        if (canvasIds.improvementTrend && analyticsData.historicalComparisons) {
            charts.improvementTrend = this.createImprovementTrendChart(
                canvasIds.improvementTrend,
                analyticsData.historicalComparisons
            );
        }

        return charts;
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.ExperimentVisualizations = ExperimentVisualizations;
}
