/**
 * Progression Tracking Visualizations
 *
 * Creates interactive charts for progression tracking data
 */

class ProgressionVisualizations {
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
        console.log('Progression Visualizations initialized');
    }

    /**
     * Create mastery over time chart
     * @param {string} canvasId - Canvas ID
     * @param {Object} progressionData - Progression analytics data
     */
    createMasteryOverTimeChart(canvasId, progressionData) {
        if (!progressionData.learningPath || progressionData.learningPath.length === 0) {
            return null;
        }

        // Group by date and calculate average mastery
        const dailyMastery = this.groupByDate(progressionData.learningPath);

        const data = {
            labels: Object.keys(dailyMastery),
            datasets: [{
                label: 'Average Mastery Level',
                data: Object.values(dailyMastery).map(d => d.avgMastery),
                color: '#3b82f6'
            }]
        };

        return this.chartManager.createLineChart(canvasId, data, {
            title: 'Mastery Progress Over Time',
            yAxis: {
                min: 0,
                max: 100,
                title: {
                    display: true,
                    text: 'Mastery Level (%)'
                }
            },
            tooltipCallbacks: {
                label: (context) => {
                    return `Mastery: ${context.parsed.y.toFixed(1)}%`;
                }
            }
        });
    }

    /**
     * Create learning velocity chart
     * @param {string} canvasId - Canvas ID
     * @param {Object} progressionData - Progression analytics data
     */
    createLearningVelocityChart(canvasId, progressionData) {
        if (!progressionData.learningPath || progressionData.learningPath.length === 0) {
            return null;
        }

        const dailyData = this.groupByDate(progressionData.learningPath);
        const dates = Object.keys(dailyData);
        const velocities = [];

        // Calculate daily velocity (mastery points gained)
        for (let i = 1; i < dates.length; i++) {
            const prev = dailyData[dates[i - 1]].avgMastery;
            const curr = dailyData[dates[i]].avgMastery;
            velocities.push(Math.max(0, curr - prev));
        }

        const data = {
            labels: dates.slice(1),
            datasets: [{
                label: 'Learning Velocity',
                data: velocities,
                color: '#10b981'
            }]
        };

        return this.chartManager.createBarChart(canvasId, data, {
            title: 'Learning Velocity (Daily Mastery Gain)',
            yAxis: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Mastery Points Gained'
                }
            }
        });
    }

    /**
     * Create concept mastery distribution chart
     * @param {string} canvasId - Canvas ID
     * @param {Object} masteryData - Mastery data from analytics
     */
    createMasteryDistributionChart(canvasId, masteryData) {
        const mastered = masteryData.mastered?.length || 0;
        const learning = masteryData.learning?.length || 0;
        const struggling = masteryData.struggling?.length || 0;

        const data = {
            labels: ['Mastered', 'Learning', 'Struggling'],
            values: [mastered, learning, struggling],
            colors: ['#10b981', '#3b82f6', '#ef4444']
        };

        return this.chartManager.createDoughnutChart(canvasId, data, {
            title: 'Concept Mastery Distribution',
            showLegend: true,
            legendPosition: 'bottom'
        });
    }

    /**
     * Create success rate by subject chart
     * @param {string} canvasId - Canvas ID
     * @param {Object} progressionData - Progression analytics data
     */
    createSuccessRateBySubjectChart(canvasId, progressionData) {
        if (!progressionData.learningPath) return null;

        const subjectStats = {};

        progressionData.learningPath.forEach(entry => {
            const subject = entry.subject || 'Unknown';
            if (!subjectStats[subject]) {
                subjectStats[subject] = { total: 0, success: 0 };
            }
            subjectStats[subject].total++;
            if (entry.success) {
                subjectStats[subject].success++;
            }
        });

        const subjects = Object.keys(subjectStats);
        const successRates = subjects.map(s =>
            (subjectStats[s].success / subjectStats[s].total) * 100
        );

        const data = {
            labels: subjects,
            datasets: [{
                label: 'Success Rate (%)',
                data: successRates,
                colors: this.chartManager.getColors().palette
            }]
        };

        return this.chartManager.createBarChart(canvasId, data, {
            title: 'Success Rate by Subject',
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

    /**
     * Create concept progress heatmap (as bar chart)
     * @param {string} canvasId - Canvas ID
     * @param {Array} concepts - Top concepts with mastery levels
     */
    createConceptProgressChart(canvasId, concepts) {
        if (!concepts || concepts.length === 0) return null;

        // Sort by mastery level
        const sorted = concepts.sort((a, b) => a.masteryLevel - b.masteryLevel);
        const topConcepts = sorted.slice(0, 10);

        const data = {
            labels: topConcepts.map(c => this.truncateLabel(c.conceptName, 20)),
            datasets: [{
                label: 'Mastery Level',
                data: topConcepts.map(c => c.masteryLevel),
                colors: topConcepts.map(c => this.getMasteryColor(c.masteryLevel))
            }]
        };

        return this.chartManager.createBarChart(canvasId, data, {
            title: 'Concept Mastery Levels',
            yAxis: {
                min: 0,
                max: 100,
                title: {
                    display: true,
                    text: 'Mastery (%)'
                }
            },
            indexAxis: 'y' // Horizontal bars
        });
    }

    /**
     * Create retention rate over time chart
     * @param {string} canvasId - Canvas ID
     * @param {Object} progressionData - Progression data
     */
    createRetentionChart(canvasId, progressionData) {
        if (!progressionData.learningPath) return null;

        const weeklyRetention = this.calculateWeeklyRetention(progressionData);

        const data = {
            labels: weeklyRetention.labels,
            datasets: [{
                label: 'Retention Rate',
                data: weeklyRetention.values,
                color: '#8b5cf6'
            }]
        };

        return this.chartManager.createLineChart(canvasId, data, {
            title: 'Retention Rate Over Time',
            yAxis: {
                min: 0,
                max: 100,
                title: {
                    display: true,
                    text: 'Retention Rate (%)'
                }
            }
        });
    }

    /**
     * Create milestones timeline chart
     * @param {string} canvasId - Canvas ID
     * @param {Array} milestones - Milestone data
     */
    createMilestonesChart(canvasId, milestones) {
        if (!milestones || milestones.length === 0) return null;

        const data = {
            labels: milestones.map(m => m.name),
            datasets: [{
                label: 'Achievement Date',
                data: milestones.map((m, i) => i + 1),
                colors: this.chartManager.getColors().palette
            }]
        };

        return this.chartManager.createBarChart(canvasId, data, {
            title: 'Milestones Achieved',
            yAxis: {
                display: false
            },
            showLegend: false
        });
    }

    /**
     * Helper: Group learning path by date
     */
    groupByDate(learningPath) {
        const grouped = {};

        learningPath.forEach(entry => {
            const date = new Date(entry.timestamp).toLocaleDateString();
            if (!grouped[date]) {
                grouped[date] = { count: 0, totalMastery: 0, avgMastery: 0 };
            }
            grouped[date].count++;
            grouped[date].totalMastery += entry.masteryLevel || 0;
        });

        // Calculate averages
        Object.keys(grouped).forEach(date => {
            grouped[date].avgMastery = grouped[date].totalMastery / grouped[date].count;
        });

        return grouped;
    }

    /**
     * Helper: Calculate weekly retention
     */
    calculateWeeklyRetention(progressionData) {
        // Simplified: Use mastery data over time
        const concepts = Object.values(progressionData.conceptMastery || {});
        const weeks = [];
        const retentionRates = [];

        // Group by weeks
        const now = Date.now();
        for (let i = 4; i >= 0; i--) {
            const weekStart = now - (i * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = weekStart + (7 * 24 * 60 * 60 * 1000);

            const conceptsInWeek = concepts.filter(c =>
                c.lastSeen >= weekStart && c.lastSeen < weekEnd
            );

            const retained = conceptsInWeek.filter(c => c.masteryLevel >= 60).length;
            const rate = conceptsInWeek.length > 0
                ? (retained / conceptsInWeek.length) * 100
                : 0;

            weeks.push(`Week ${5 - i}`);
            retentionRates.push(rate);
        }

        return { labels: weeks, values: retentionRates };
    }

    /**
     * Helper: Get color based on mastery level
     */
    getMasteryColor(level) {
        if (level >= 80) return '#10b981'; // Green
        if (level >= 50) return '#3b82f6'; // Blue
        if (level >= 30) return '#f59e0b'; // Orange
        return '#ef4444'; // Red
    }

    /**
     * Helper: Truncate label
     */
    truncateLabel(label, maxLength) {
        return label.length > maxLength
            ? label.substring(0, maxLength) + '...'
            : label;
    }

    /**
     * Render all progression visualizations
     * @param {Object} progressionData - Complete progression analytics
     * @param {Object} canvasIds - Map of chart types to canvas IDs
     */
    renderAllCharts(progressionData, canvasIds = {}) {
        const charts = {};

        if (canvasIds.masteryOverTime) {
            charts.masteryOverTime = this.createMasteryOverTimeChart(
                canvasIds.masteryOverTime,
                progressionData
            );
        }

        if (canvasIds.learningVelocity) {
            charts.learningVelocity = this.createLearningVelocityChart(
                canvasIds.learningVelocity,
                progressionData
            );
        }

        if (canvasIds.masteryDistribution) {
            charts.masteryDistribution = this.createMasteryDistributionChart(
                canvasIds.masteryDistribution,
                progressionData.mastery
            );
        }

        if (canvasIds.successBySubject) {
            charts.successBySubject = this.createSuccessRateBySubjectChart(
                canvasIds.successBySubject,
                progressionData
            );
        }

        if (canvasIds.conceptProgress && progressionData.mastery) {
            const allConcepts = [
                ...(progressionData.mastery.mastered || []),
                ...(progressionData.mastery.learning || []),
                ...(progressionData.mastery.struggling || [])
            ];
            charts.conceptProgress = this.createConceptProgressChart(
                canvasIds.conceptProgress,
                allConcepts
            );
        }

        if (canvasIds.retention) {
            charts.retention = this.createRetentionChart(
                canvasIds.retention,
                progressionData
            );
        }

        if (canvasIds.milestones && progressionData.milestones) {
            charts.milestones = this.createMilestonesChart(
                canvasIds.milestones,
                progressionData.milestones
            );
        }

        return charts;
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.ProgressionVisualizations = ProgressionVisualizations;
}
