/**
 * Research Features Manager
 * Integrates progression tracking, curriculum gap analysis, and cross-subject analytics
 */

class ResearchFeaturesManager {
    constructor(database) {
        this.database = database;
        this.progressionTracker = null;
        this.gapAnalyzer = null;
        this.crossSubjectAnalyzer = null;
        this.chartManager = null;
        this.progressionViz = null;
        this.gapCrossSubjectViz = null;
        this.initialized = false;
    }

    /**
     * Initialize all research feature modules
     */
    async initialize() {
        if (this.initialized) return;

        console.log('Initializing Research Features Manager...');

        try {
            // Initialize progression tracker
            this.progressionTracker = new ProgressionTracker(this.database);
            await this.progressionTracker.initialize();

            // Initialize curriculum gap analyzer
            this.gapAnalyzer = new CurriculumGapAnalyzer(this.database);
            await this.gapAnalyzer.initialize();

            // Initialize cross-subject analyzer
            this.crossSubjectAnalyzer = new CrossSubjectAnalyzer(this.database);
            await this.crossSubjectAnalyzer.initialize();

            // Initialize visualization modules
            if (typeof ChartVisualizationManager !== 'undefined') {
                this.chartManager = new ChartVisualizationManager({
                    theme: 'light',
                    enableAnimations: true,
                    enableExport: true
                });

                this.progressionViz = new ProgressionVisualizations(this.chartManager);
                await this.progressionViz.initialize();

                this.gapCrossSubjectViz = new GapCrossSubjectVisualizations(this.chartManager);
                await this.gapCrossSubjectViz.initialize();

                console.log('✅ Visualization modules initialized');
            }

            // Set up event listeners
            this.setupEventListeners();

            this.initialized = true;
            console.log('Research Features Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Research Features Manager:', error);
            throw error;
        }
    }

    /**
     * Set up event listeners for UI interactions
     */
    setupEventListeners() {
        // Progression Tracking Events
        const viewProgressionBtn = document.getElementById('viewProgressionBtn');
        if (viewProgressionBtn) {
            viewProgressionBtn.addEventListener('click', () => this.viewProgression());
        }

        const exportProgressionBtn = document.getElementById('exportProgressionBtn');
        if (exportProgressionBtn) {
            exportProgressionBtn.addEventListener('click', () => this.exportProgression());
        }

        const refreshProgressionBtn = document.getElementById('refreshProgressionBtn');
        if (refreshProgressionBtn) {
            refreshProgressionBtn.addEventListener('click', () => this.refreshProgression());
        }

        // Curriculum Gap Analysis Events
        const analyzeGapsBtn = document.getElementById('analyzeGapsBtn');
        if (analyzeGapsBtn) {
            analyzeGapsBtn.addEventListener('click', () => this.analyzeGaps());
        }

        const exportGapReportBtn = document.getElementById('exportGapReportBtn');
        if (exportGapReportBtn) {
            exportGapReportBtn.addEventListener('click', () => this.exportGapReport());
        }

        // Cross-Subject Analytics Events
        const analyzeCrossSubjectBtn = document.getElementById('analyzeCrossSubjectBtn');
        if (analyzeCrossSubjectBtn) {
            analyzeCrossSubjectBtn.addEventListener('click', () => this.analyzeCrossSubject());
        }

        const exportCrossSubjectBtn = document.getElementById('exportCrossSubjectBtn');
        if (exportCrossSubjectBtn) {
            exportCrossSubjectBtn.addEventListener('click', () => this.exportCrossSubject());
        }

        const refreshCrossSubjectBtn = document.getElementById('refreshCrossSubjectBtn');
        if (refreshCrossSubjectBtn) {
            refreshCrossSubjectBtn.addEventListener('click', () => this.analyzeCrossSubject());
        }
    }

    /**
     * Track a learning interaction (called when student interacts with content)
     * @param {Object} interaction - Interaction data
     */
    async trackLearningInteraction(interaction) {
        try {
            await this.progressionTracker.trackInteraction(interaction);
        } catch (error) {
            console.error('Failed to track interaction:', error);
        }
    }

    /**
     * View detailed progression
     */
    async viewProgression() {
        try {
            const analytics = await this.progressionTracker.getProgressionAnalytics('default_student');

            // Update UI with progression data
            this.updateProgressionUI(analytics);
        } catch (error) {
            console.error('Failed to view progression:', error);
            this.showError('Failed to load progression data');
        }
    }

    /**
     * Update progression UI with analytics data
     */
    updateProgressionUI(analytics) {
        // Update metric cards
        document.getElementById('currentLevel').textContent =
            this.capitalizeFirstLetter(analytics.overview.currentLevel);
        document.getElementById('masteredConcepts').textContent =
            analytics.mastery.mastered.length;
        document.getElementById('learningVelocity').textContent =
            analytics.overview.learningVelocity.toFixed(1);
        document.getElementById('retentionRate').textContent =
            (analytics.overview.retentionRate * 100).toFixed(0) + '%';

        // Update mastery overview
        const masteryContainer = document.getElementById('masteryOverviewContainer');
        masteryContainer.innerHTML = this.renderMasteryOverview(analytics.mastery);

        // Update learning path
        const pathContainer = document.getElementById('learningPathContainer');
        pathContainer.innerHTML = this.renderLearningPath(analytics.learningPath);

        // Update recommendations
        const recsContainer = document.getElementById('progressionRecommendationsContainer');
        recsContainer.innerHTML = this.renderRecommendations(analytics.recommendations);

        // Render visualizations
        if (this.progressionViz) {
            try {
                this.progressionViz.renderAllCharts(analytics, {
                    masteryOverTime: 'masteryOverTimeChart',
                    learningVelocity: 'learningVelocityChart',
                    masteryDistribution: 'masteryDistributionChart',
                    successBySubject: 'successBySubjectChart'
                });
            } catch (error) {
                console.error('Failed to render progression charts:', error);
            }
        }
    }

    /**
     * Render mastery overview
     */
    renderMasteryOverview(mastery) {
        let html = '<div class="mastery-grid">';

        // Mastered concepts
        html += '<div class="mastery-section">';
        html += '<h4><i class="fas fa-check-circle" style="color: var(--success-color)"></i> Mastered</h4>';
        if (mastery.mastered.length > 0) {
            mastery.mastered.slice(0, 5).forEach(concept => {
                html += `<div class="concept-item mastered">
                    <span class="concept-name">${concept.conceptName}</span>
                    <span class="mastery-badge">${concept.masteryLevel}%</span>
                </div>`;
            });
            if (mastery.mastered.length > 5) {
                html += `<p class="text-muted">And ${mastery.mastered.length - 5} more...</p>`;
            }
        } else {
            html += '<p class="text-muted">No concepts mastered yet</p>';
        }
        html += '</div>';

        // Learning concepts
        html += '<div class="mastery-section">';
        html += '<h4><i class="fas fa-graduation-cap" style="color: var(--primary-color)"></i> Learning</h4>';
        if (mastery.learning.length > 0) {
            mastery.learning.slice(0, 5).forEach(concept => {
                html += `<div class="concept-item learning">
                    <span class="concept-name">${concept.conceptName}</span>
                    <span class="mastery-badge">${concept.masteryLevel}%</span>
                </div>`;
            });
            if (mastery.learning.length > 5) {
                html += `<p class="text-muted">And ${mastery.learning.length - 5} more...</p>`;
            }
        } else {
            html += '<p class="text-muted">No concepts currently learning</p>';
        }
        html += '</div>';

        // Struggling concepts
        html += '<div class="mastery-section">';
        html += '<h4><i class="fas fa-exclamation-circle" style="color: var(--danger-color)"></i> Needs Attention</h4>';
        if (mastery.struggling.length > 0) {
            mastery.struggling.slice(0, 5).forEach(concept => {
                html += `<div class="concept-item struggling">
                    <span class="concept-name">${concept.conceptName}</span>
                    <span class="mastery-badge">${concept.masteryLevel}%</span>
                </div>`;
            });
        } else {
            html += '<p class="text-muted">No struggling areas identified</p>';
        }
        html += '</div>';

        html += '</div>';
        return html;
    }

    /**
     * Render learning path
     */
    renderLearningPath(learningPath) {
        if (learningPath.length === 0) {
            return '<div class="empty-state"><i class="fas fa-route"></i><p>Your learning journey will appear here</p></div>';
        }

        let html = '<div class="learning-path-timeline">';
        learningPath.forEach((entry, index) => {
            const date = new Date(entry.timestamp).toLocaleDateString();
            const statusIcon = entry.success ?
                '<i class="fas fa-check-circle" style="color: var(--success-color)"></i>' :
                '<i class="fas fa-times-circle" style="color: var(--danger-color)"></i>';

            html += `<div class="path-entry">
                <div class="path-marker">${statusIcon}</div>
                <div class="path-content">
                    <h5>${entry.conceptName}</h5>
                    <p class="text-muted">${entry.subject} - Grade ${entry.grade}</p>
                    <p class="text-muted">${date} • Mastery: ${entry.masteryLevel}%</p>
                </div>
            </div>`;
        });
        html += '</div>';
        return html;
    }

    /**
     * Render recommendations
     */
    renderRecommendations(recommendations) {
        if (recommendations.length === 0) {
            return '<div class="empty-state"><i class="fas fa-lightbulb"></i><p>No recommendations at this time</p></div>';
        }

        let html = '<div class="recommendations-list">';
        recommendations.forEach(rec => {
            const priorityClass = rec.priority === 'high' ? 'priority-high' :
                                 rec.priority === 'medium' ? 'priority-medium' : 'priority-low';

            html += `<div class="recommendation-card ${priorityClass}">
                <h4><i class="fas fa-lightbulb"></i> ${rec.title}</h4>
                <p>${rec.description}</p>
                <p class="recommendation-action"><strong>Action:</strong> ${rec.action}</p>
                ${rec.estimatedTime ? `<p class="text-muted">Estimated time: ${rec.estimatedTime}</p>` : ''}
            </div>`;
        });
        html += '</div>';
        return html;
    }

    /**
     * Export progression data
     */
    async exportProgression() {
        try {
            const data = await this.progressionTracker.exportProgressionData('default_student', 'json');
            this.downloadFile(data, 'progression-data.json', 'application/json');
        } catch (error) {
            console.error('Failed to export progression:', error);
            this.showError('Failed to export progression data');
        }
    }

    /**
     * Refresh progression data
     */
    async refreshProgression() {
        await this.viewProgression();
    }

    /**
     * Analyze curriculum gaps
     */
    async analyzeGaps() {
        try {
            const targetGrade = parseInt(document.getElementById('targetGrade').value);
            const targetSubject = document.getElementById('targetSubject').value;
            const targetSubjectValue = targetSubject === 'all' ? null : targetSubject;

            // Get student progression
            const progression = await this.progressionTracker.getStudentProgression('default_student');

            // Analyze gaps
            const gapReport = await this.gapAnalyzer.analyzeCurriculumGaps(progression, {
                targetGrade,
                targetSubject: targetSubjectValue,
                includePrerequisites: true,
                includeRecommendations: true
            });

            // Update UI
            this.updateGapAnalysisUI(gapReport);
        } catch (error) {
            console.error('Failed to analyze gaps:', error);
            this.showError('Failed to analyze curriculum gaps');
        }
    }

    /**
     * Update gap analysis UI
     */
    updateGapAnalysisUI(report) {
        // Update coverage metrics
        document.getElementById('totalConcepts').textContent = report.coverage.total;
        document.getElementById('coveredConcepts').textContent = report.coverage.covered;
        document.getElementById('masteredConceptsGap').textContent = report.coverage.mastered;
        document.getElementById('coveragePercentage').textContent =
            report.coverage.coveragePercentage.toFixed(1) + '%';

        // Update gaps list
        const gapsContainer = document.getElementById('identifiedGapsContainer');
        gapsContainer.innerHTML = this.renderGapsList(report.gaps.concepts);

        // Update recommendations
        const recsContainer = document.getElementById('gapRecommendationsContainer');
        recsContainer.innerHTML = this.renderGapRecommendations(report.recommendations);

        // Render visualizations
        if (this.gapCrossSubjectViz) {
            try {
                this.gapCrossSubjectViz.renderGapCharts(report, {
                    coverage: 'coverageChart',
                    gapSeverity: 'gapSeverityChart',
                    gapsBySubject: 'gapsBySubjectChart',
                    gapsByDifficulty: 'gapsByDifficultyChart'
                });
            } catch (error) {
                console.error('Failed to render gap charts:', error);
            }
        }

        // Store report for export
        this.currentGapReport = report;
    }

    /**
     * Render gaps list
     */
    renderGapsList(gaps) {
        if (gaps.length === 0) {
            return '<div class="empty-state"><i class="fas fa-check-circle"></i><p>No gaps found!</p></div>';
        }

        let html = '<div class="gaps-list">';
        gaps.forEach(gap => {
            const criticalBadge = gap.isCritical ?
                '<span class="badge badge-danger">Critical</span>' : '';
            const severityClass = gap.severity > 70 ? 'high-severity' :
                                 gap.severity > 40 ? 'medium-severity' : 'low-severity';

            html += `<div class="gap-card ${severityClass}">
                <h5>${gap.conceptName} ${criticalBadge}</h5>
                <p class="text-muted">${gap.subject} - Grade ${gap.grade}</p>
                <div class="gap-details">
                    <span>Type: ${gap.gapType.replace('_', ' ')}</span>
                    <span>Difficulty: ${gap.difficulty}/10</span>
                    <span>Severity: ${gap.severity}/100</span>
                </div>
            </div>`;
        });
        html += '</div>';
        return html;
    }

    /**
     * Render gap recommendations
     */
    renderGapRecommendations(recommendations) {
        if (recommendations.length === 0) {
            return '<div class="empty-state"><i class="fas fa-route"></i><p>No specific recommendations</p></div>';
        }

        let html = '<div class="recommendations-list">';
        recommendations.forEach((rec, index) => {
            html += `<div class="recommendation-card priority-${rec.priority}">
                <h4>${index + 1}. ${rec.title}</h4>
                <p>${rec.description}</p>
                <p class="recommendation-action"><strong>Action:</strong> ${rec.action}</p>
                ${rec.estimatedTime ? `<p class="text-muted">Estimated time: ${rec.estimatedTime}</p>` : ''}
            </div>`;
        });
        html += '</div>';
        return html;
    }

    /**
     * Export gap report
     */
    async exportGapReport() {
        if (!this.currentGapReport) {
            this.showError('Please analyze gaps first');
            return;
        }

        try {
            const markdown = await this.gapAnalyzer.exportGapReport(this.currentGapReport, 'markdown');
            this.downloadFile(markdown, 'curriculum-gap-report.md', 'text/markdown');
        } catch (error) {
            console.error('Failed to export gap report:', error);
            this.showError('Failed to export gap report');
        }
    }

    /**
     * Analyze cross-subject performance
     */
    async analyzeCrossSubject() {
        try {
            // Get student progression
            const progression = await this.progressionTracker.getStudentProgression('default_student');

            // Analyze cross-subject performance
            const analysis = await this.crossSubjectAnalyzer.analyzeCrossSubjectPerformance(progression);

            // Update UI
            this.updateCrossSubjectUI(analysis);

            // Store for export
            this.currentCrossSubjectAnalysis = analysis;
        } catch (error) {
            console.error('Failed to analyze cross-subject performance:', error);
            this.showError('Failed to analyze cross-subject performance');
        }
    }

    /**
     * Update cross-subject UI
     */
    updateCrossSubjectUI(analysis) {
        // Update subject performance
        const perfContainer = document.getElementById('subjectPerformanceContainer');
        perfContainer.innerHTML = this.renderSubjectPerformance(analysis.subjectPerformance);

        // Update patterns
        const strengthsList = document.getElementById('strengthsList');
        strengthsList.innerHTML = this.renderStrengths(analysis.patterns.strengths);

        const weaknessesList = document.getElementById('weaknessesList');
        weaknessesList.innerHTML = this.renderWeaknesses(analysis.patterns.weaknesses);

        // Update correlations
        const corrContainer = document.getElementById('subjectCorrelationsContainer');
        corrContainer.innerHTML = this.renderCorrelations(analysis.correlations);

        // Update interdisciplinary insights
        const interContainer = document.getElementById('interdisciplinaryInsightsContainer');
        interContainer.innerHTML = this.renderInterdisciplinaryInsights(analysis.interdisciplinaryInsights);

        // Update transfer opportunities
        const transferContainer = document.getElementById('transferOpportunitiesContainer');
        transferContainer.innerHTML = this.renderTransferOpportunities(analysis.transferOpportunities);

        // Render visualizations
        if (this.gapCrossSubjectViz) {
            try {
                this.gapCrossSubjectViz.renderCrossSubjectCharts(analysis, {
                    subjectRadar: 'subjectRadarChart',
                    subjectComparison: 'subjectComparisonChart',
                    correlations: 'correlationsChart',
                    transferOpportunities: 'transferOpportunitiesChart'
                });
            } catch (error) {
                console.error('Failed to render cross-subject charts:', error);
            }
        }
    }

    /**
     * Render subject performance
     */
    renderSubjectPerformance(subjectPerformance) {
        const subjects = Object.values(subjectPerformance);
        if (subjects.length === 0) {
            return '<div class="empty-state"><i class="fas fa-chart-bar"></i><p>No data available</p></div>';
        }

        let html = '<div class="subject-performance-grid">';
        subjects.forEach(subject => {
            html += `<div class="subject-card">
                <h4>${subject.subject}</h4>
                <div class="performance-metrics">
                    <div class="metric">
                        <span class="label">Avg Mastery:</span>
                        <span class="value">${subject.averageMastery.toFixed(1)}%</span>
                    </div>
                    <div class="metric">
                        <span class="label">Mastered:</span>
                        <span class="value">${subject.masteredConcepts}/${subject.totalConcepts}</span>
                    </div>
                    <div class="metric">
                        <span class="label">Success Rate:</span>
                        <span class="value">${(subject.averageSuccessRate * 100).toFixed(1)}%</span>
                    </div>
                </div>
            </div>`;
        });
        html += '</div>';
        return html;
    }

    /**
     * Render strengths
     */
    renderStrengths(strengths) {
        if (strengths.length === 0) {
            return '<p class="text-muted">No strengths identified yet</p>';
        }

        let html = '<ul class="strengths-list">';
        strengths.forEach(strength => {
            html += `<li>
                <strong>${strength.subject}</strong>: ${strength.averageMastery.toFixed(1)}% mastery
            </li>`;
        });
        html += '</ul>';
        return html;
    }

    /**
     * Render weaknesses
     */
    renderWeaknesses(weaknesses) {
        if (weaknesses.length === 0) {
            return '<p class="text-muted">No weaknesses identified</p>';
        }

        let html = '<ul class="weaknesses-list">';
        weaknesses.forEach(weakness => {
            html += `<li>
                <strong>${weakness.subject}</strong>: ${weakness.averageMastery.toFixed(1)}% mastery
            </li>`;
        });
        html += '</ul>';
        return html;
    }

    /**
     * Render correlations
     */
    renderCorrelations(correlations) {
        if (correlations.length === 0) {
            return '<div class="empty-state"><i class="fas fa-link"></i><p>Insufficient data for correlations</p></div>';
        }

        let html = '<div class="correlations-list">';
        correlations.slice(0, 5).forEach(corr => {
            html += `<div class="correlation-item">
                <p><strong>${corr.subject1}</strong> ↔ <strong>${corr.subject2}</strong></p>
                <p>Strength: ${this.capitalizeFirstLetter(corr.strength.replace('_', ' '))}</p>
            </div>`;
        });
        html += '</div>';
        return html;
    }

    /**
     * Render interdisciplinary insights
     */
    renderInterdisciplinaryInsights(insights) {
        if (insights.totalInterdisciplinary === 0) {
            return '<div class="empty-state"><i class="fas fa-project-diagram"></i><p>No interdisciplinary connections found</p></div>';
        }

        let html = `<p>Found ${insights.totalInterdisciplinary} interdisciplinary concept(s)</p>`;
        html += '<div class="interdisciplinary-list">';
        insights.concepts.slice(0, 5).forEach(concept => {
            html += `<div class="interdisciplinary-item">
                <h5>${concept.conceptName}</h5>
                <p class="text-muted">${concept.primarySubject} • Mastery: ${concept.masteryLevel}%</p>
            </div>`;
        });
        html += '</div>';
        return html;
    }

    /**
     * Render transfer opportunities
     */
    renderTransferOpportunities(opportunities) {
        if (opportunities.length === 0) {
            return '<div class="empty-state"><i class="fas fa-exchange-alt"></i><p>No transfer opportunities available</p></div>';
        }

        let html = '<div class="transfer-list">';
        opportunities.slice(0, 5).forEach(opp => {
            html += `<div class="transfer-item">
                <p>Use <strong>${opp.fromSubject}</strong> skills to improve <strong>${opp.toSubject}</strong></p>
                <p class="text-muted">Gap: ${opp.gap.toFixed(1)}% • Priority: ${opp.priority.toFixed(0)}</p>
            </div>`;
        });
        html += '</div>';
        return html;
    }

    /**
     * Export cross-subject analysis
     */
    async exportCrossSubject() {
        if (!this.currentCrossSubjectAnalysis) {
            this.showError('Please analyze cross-subject performance first');
            return;
        }

        try {
            const markdown = await this.crossSubjectAnalyzer.exportAnalysis(
                this.currentCrossSubjectAnalysis,
                'markdown'
            );
            this.downloadFile(markdown, 'cross-subject-analysis.md', 'text/markdown');
        } catch (error) {
            console.error('Failed to export analysis:', error);
            this.showError('Failed to export analysis');
        }
    }

    /**
     * Utility: Download file
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Utility: Show error message
     */
    showError(message) {
        alert(message); // Replace with your actual error notification system
    }

    /**
     * Utility: Capitalize first letter
     */
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.ResearchFeaturesManager = ResearchFeaturesManager;
}
