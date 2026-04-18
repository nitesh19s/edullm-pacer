/**
 * Curriculum Gap & Cross-Subject Visualizations
 *
 * Creates interactive charts for gap analysis and cross-subject analytics
 */

class GapCrossSubjectVisualizations {
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
        console.log('Gap & Cross-Subject Visualizations initialized');
    }

    // ==================== CURRICULUM GAP VISUALIZATIONS ====================

    /**
     * Create coverage overview chart
     * @param {string} canvasId - Canvas ID
     * @param {Object} coverage - Coverage metrics
     */
    createCoverageChart(canvasId, coverage) {
        const data = {
            labels: ['Mastered', 'Learning', 'Not Covered'],
            values: [
                coverage.mastered || 0,
                coverage.covered - (coverage.mastered || 0),
                coverage.notCovered || 0
            ],
            colors: ['#10b981', '#3b82f6', '#ef4444']
        };

        return this.chartManager.createDoughnutChart(canvasId, data, {
            title: 'Curriculum Coverage',
            showLegend: true,
            legendPosition: 'bottom',
            tooltipCallbacks: {
                label: (context) => {
                    const label = context.label || '';
                    const value = context.parsed;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return `${label}: ${value} (${percentage}%)`;
                }
            }
        });
    }

    /**
     * Create gap severity distribution chart
     * @param {string} canvasId - Canvas ID
     * @param {Array} gaps - Gap data
     */
    createGapSeverityChart(canvasId, gaps) {
        if (!gaps || gaps.length === 0) return null;

        // Group by severity range
        const ranges = {
            'Critical (80-100)': 0,
            'High (60-80)': 0,
            'Medium (40-60)': 0,
            'Low (0-40)': 0
        };

        gaps.forEach(gap => {
            const severity = gap.severity || 0;
            if (severity >= 80) ranges['Critical (80-100)']++;
            else if (severity >= 60) ranges['High (60-80)']++;
            else if (severity >= 40) ranges['Medium (40-60)']++;
            else ranges['Low (0-40)']++;
        });

        const data = {
            labels: Object.keys(ranges),
            datasets: [{
                label: 'Number of Gaps',
                data: Object.values(ranges),
                colors: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981']
            }]
        };

        return this.chartManager.createBarChart(canvasId, data, {
            title: 'Gap Severity Distribution',
            yAxis: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of Gaps'
                }
            }
        });
    }

    /**
     * Create gaps by subject chart
     * @param {string} canvasId - Canvas ID
     * @param {Object} gapsBySubject - Gaps grouped by subject
     */
    createGapsBySubjectChart(canvasId, gapsBySubject) {
        if (!gapsBySubject) return null;

        const subjects = Object.keys(gapsBySubject);
        const gapCounts = subjects.map(s => gapsBySubject[s].length);

        const data = {
            labels: subjects,
            datasets: [{
                label: 'Number of Gaps',
                data: gapCounts,
                colors: this.chartManager.getColors().palette
            }]
        };

        return this.chartManager.createBarChart(canvasId, data, {
            title: 'Gaps by Subject',
            yAxis: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of Gaps'
                }
            }
        });
    }

    /**
     * Create gaps by difficulty chart
     * @param {string} canvasId - Canvas ID
     * @param {Array} gaps - Gap data
     */
    createGapsByDifficultyChart(canvasId, gaps) {
        if (!gaps || gaps.length === 0) return null;

        // Group by difficulty
        const difficultyGroups = {
            'Easy (1-3)': 0,
            'Medium (4-7)': 0,
            'Hard (8-10)': 0
        };

        gaps.forEach(gap => {
            const diff = gap.difficulty || 5;
            if (diff <= 3) difficultyGroups['Easy (1-3)']++;
            else if (diff <= 7) difficultyGroups['Medium (4-7)']++;
            else difficultyGroups['Hard (8-10)']++;
        });

        const data = {
            labels: Object.keys(difficultyGroups),
            values: Object.values(difficultyGroups),
            colors: ['#10b981', '#f59e0b', '#ef4444']
        };

        return this.chartManager.createDoughnutChart(canvasId, data, {
            title: 'Gaps by Difficulty Level'
        });
    }

    // ==================== CROSS-SUBJECT ANALYTICS VISUALIZATIONS ====================

    /**
     * Create subject performance comparison radar chart
     * @param {string} canvasId - Canvas ID
     * @param {Object} subjectPerformance - Subject-wise performance
     */
    createSubjectRadarChart(canvasId, subjectPerformance) {
        const subjects = Object.values(subjectPerformance);
        if (subjects.length === 0) return null;

        const data = {
            labels: subjects.map(s => s.subject),
            datasets: [
                {
                    label: 'Average Mastery',
                    data: subjects.map(s => s.averageMastery),
                    color: '#3b82f6'
                },
                {
                    label: 'Success Rate',
                    data: subjects.map(s => (s.averageSuccessRate * 100)),
                    color: '#10b981'
                }
            ]
        };

        return this.chartManager.createRadarChart(canvasId, data, {
            title: 'Subject Performance Comparison',
            maxValue: 100
        });
    }

    /**
     * Create subject mastery comparison bar chart
     * @param {string} canvasId - Canvas ID
     * @param {Object} subjectPerformance - Subject-wise performance
     */
    createSubjectComparisonChart(canvasId, subjectPerformance) {
        const subjects = Object.values(subjectPerformance);
        if (subjects.length === 0) return null;

        const data = {
            labels: subjects.map(s => s.subject),
            datasets: [
                {
                    label: 'Mastered',
                    data: subjects.map(s => s.masteredConcepts),
                    color: '#10b981'
                },
                {
                    label: 'Learning',
                    data: subjects.map(s => s.learningConcepts),
                    color: '#3b82f6'
                },
                {
                    label: 'Struggling',
                    data: subjects.map(s => s.strugglingConcepts),
                    color: '#ef4444'
                }
            ]
        };

        return this.chartManager.createBarChart(canvasId, data, {
            title: 'Concept Status by Subject',
            yAxis: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of Concepts'
                }
            }
        });
    }

    /**
     * Create correlation heatmap (as scatter plot)
     * @param {string} canvasId - Canvas ID
     * @param {Array} correlations - Correlation data
     */
    createCorrelationChart(canvasId, correlations) {
        if (!correlations || correlations.length === 0) return null;

        const datasets = correlations.map((corr, index) => ({
            label: `${corr.subject1} vs ${corr.subject2}`,
            data: [{
                x: index,
                y: Math.abs(corr.correlation)
            }],
            color: this.chartManager.getColors().palette[index % 8]
        }));

        const data = { datasets };

        return this.chartManager.createBarChart(canvasId, {
            labels: correlations.map(c => `${c.subject1}-${c.subject2}`),
            datasets: [{
                label: 'Correlation Strength',
                data: correlations.map(c => Math.abs(c.correlation)),
                colors: correlations.map(c =>
                    Math.abs(c.correlation) > 0.6 ? '#10b981' :
                    Math.abs(c.correlation) > 0.4 ? '#3b82f6' :
                    '#f59e0b'
                )
            }]
        }, {
            title: 'Subject Correlations',
            yAxis: {
                min: 0,
                max: 1,
                title: {
                    display: true,
                    text: 'Correlation Strength'
                }
            }
        });
    }

    /**
     * Create interdisciplinary connections chart
     * @param {string} canvasId - Canvas ID
     * @param {Object} interdisciplinaryData - Interdisciplinary insights
     */
    createInterdisciplinaryChart(canvasId, interdisciplinaryData) {
        if (!interdisciplinaryData.byConnectionType) return null;

        const types = Object.keys(interdisciplinaryData.byConnectionType);
        const counts = types.map(t =>
            interdisciplinaryData.byConnectionType[t].length
        );

        const data = {
            labels: types.map(t => this.formatConnectionType(t)),
            values: counts,
            colors: this.chartManager.getColors().palette
        };

        return this.chartManager.createDoughnutChart(canvasId, data, {
            title: 'Interdisciplinary Connection Types',
            showLegend: true,
            legendPosition: 'right'
        });
    }

    /**
     * Create transfer learning opportunities chart
     * @param {string} canvasId - Canvas ID
     * @param {Array} opportunities - Transfer opportunities
     */
    createTransferOpportunitiesChart(canvasId, opportunities) {
        if (!opportunities || opportunities.length === 0) return null;

        const topOpportunities = opportunities.slice(0, 5);

        const data = {
            labels: topOpportunities.map(o =>
                `${o.fromSubject} → ${o.toSubject}`
            ),
            datasets: [{
                label: 'Priority Score',
                data: topOpportunities.map(o => o.priority),
                colors: this.chartManager.getColors().palette
            }]
        };

        return this.chartManager.createBarChart(canvasId, data, {
            title: 'Top Transfer Learning Opportunities',
            yAxis: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Priority Score'
                }
            },
            indexAxis: 'y' // Horizontal bars
        });
    }

    /**
     * Create improvement trends chart
     * @param {string} canvasId - Canvas ID
     * @param {Array} trends - Improvement trends by subject
     */
    createImprovementTrendsChart(canvasId, trends) {
        if (!trends || trends.length === 0) return null;

        const improving = trends.filter(t => t.trend === 'improving').length;
        const stable = trends.filter(t => t.trend === 'stable').length;
        const declining = trends.filter(t => t.trend === 'declining').length;

        const data = {
            labels: ['Improving', 'Stable', 'Declining'],
            values: [improving, stable, declining],
            colors: ['#10b981', '#3b82f6', '#ef4444']
        };

        return this.chartManager.createDoughnutChart(canvasId, data, {
            title: 'Subject Improvement Trends'
        });
    }

    /**
     * Helper: Format connection type
     */
    formatConnectionType(type) {
        return type.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Render all gap visualizations
     * @param {Object} gapReport - Gap analysis report
     * @param {Object} canvasIds - Canvas IDs for each chart
     */
    renderGapCharts(gapReport, canvasIds = {}) {
        const charts = {};

        if (canvasIds.coverage) {
            charts.coverage = this.createCoverageChart(
                canvasIds.coverage,
                gapReport.coverage
            );
        }

        if (canvasIds.gapSeverity) {
            charts.gapSeverity = this.createGapSeverityChart(
                canvasIds.gapSeverity,
                gapReport.gaps.concepts
            );
        }

        if (canvasIds.gapsBySubject && gapReport.gaps.bySubject) {
            charts.gapsBySubject = this.createGapsBySubjectChart(
                canvasIds.gapsBySubject,
                gapReport.gaps.bySubject
            );
        }

        if (canvasIds.gapsByDifficulty) {
            charts.gapsByDifficulty = this.createGapsByDifficultyChart(
                canvasIds.gapsByDifficulty,
                gapReport.gaps.concepts
            );
        }

        return charts;
    }

    /**
     * Render all cross-subject visualizations
     * @param {Object} analysisData - Cross-subject analysis data
     * @param {Object} canvasIds - Canvas IDs for each chart
     */
    renderCrossSubjectCharts(analysisData, canvasIds = {}) {
        const charts = {};

        if (canvasIds.subjectRadar) {
            charts.subjectRadar = this.createSubjectRadarChart(
                canvasIds.subjectRadar,
                analysisData.subjectPerformance
            );
        }

        if (canvasIds.subjectComparison) {
            charts.subjectComparison = this.createSubjectComparisonChart(
                canvasIds.subjectComparison,
                analysisData.subjectPerformance
            );
        }

        if (canvasIds.correlations && analysisData.correlations) {
            charts.correlations = this.createCorrelationChart(
                canvasIds.correlations,
                analysisData.correlations
            );
        }

        if (canvasIds.interdisciplinary && analysisData.interdisciplinaryInsights) {
            charts.interdisciplinary = this.createInterdisciplinaryChart(
                canvasIds.interdisciplinary,
                analysisData.interdisciplinaryInsights
            );
        }

        if (canvasIds.transferOpportunities && analysisData.transferOpportunities) {
            charts.transferOpportunities = this.createTransferOpportunitiesChart(
                canvasIds.transferOpportunities,
                analysisData.transferOpportunities
            );
        }

        if (canvasIds.improvementTrends && analysisData.patterns?.improvementTrends) {
            charts.improvementTrends = this.createImprovementTrendsChart(
                canvasIds.improvementTrends,
                analysisData.patterns.improvementTrends
            );
        }

        return charts;
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.GapCrossSubjectVisualizations = GapCrossSubjectVisualizations;
}
