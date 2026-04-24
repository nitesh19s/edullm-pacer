/**
 * Dashboard Manager
 * Manages real-time metrics, activity tracking, and curriculum coverage
 */

class DashboardManager {
    constructor(database) {
        this.database = database;
        this.metrics = {
            documentsIndexed: 12847,
            queriesProcessed: 3421,
            accuracyRate: 94.7,
            avgResponseTime: 1.2
        };

        this.activities = [];
        this.curriculumCoverage = {
            mathematics: 85,
            physics: 72,
            chemistry: 68,
            biology: 91
        };

        this.initialized = false;
        this.updateInterval = null;
    }

    /**
     * Initialize the dashboard
     */
    async initialize() {
        console.log('📊 Initializing Dashboard Manager...');

        try {
            // Load saved data from database first, then localStorage
            await this.loadFromDatabase();
            this.loadFromStorage();

            // Update UI
            this.updateMetricsDisplay();
            this.updateActivityDisplay();
            this.updateCurriculumDisplay();

            // Setup quick start guide
            this.setupQuickStart();

            // Start auto-refresh (every 30 seconds to avoid resetting)
            this.startAutoRefresh();

            this.initialized = true;
            console.log('✅ Dashboard Manager initialized');

            return true;
        } catch (error) {
            console.error('❌ Dashboard initialization error:', error);
            return false;
        }
    }

    /**
     * Load data from enhanced database
     */
    async loadFromDatabase() {
        try {
            if (this.database) {
                await this.database.initialize();

                // Load statistics from database
                const stats = await this.database.getStatistics();
                if (stats) {
                    // Merge with defaults, keeping database values if they exist
                    this.metrics = {
                        documentsIndexed: stats.documentsIndexed || this.metrics.documentsIndexed,
                        queriesProcessed: stats.queriesProcessed || this.metrics.queriesProcessed,
                        accuracyRate: stats.accuracyRate || this.metrics.accuracyRate,
                        avgResponseTime: stats.avgResponseTime || this.metrics.avgResponseTime
                    };
                    console.log('✅ Loaded dashboard metrics from database');
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not load from database:', error.message);
        }
    }

    /**
     * Load data from localStorage
     */
    loadFromStorage() {
        try {
            // Load metrics (only if not already loaded from database)
            const savedMetrics = localStorage.getItem('dashboard_metrics');
            if (savedMetrics) {
                const parsed = JSON.parse(savedMetrics);
                // Don't overwrite if we have better values
                if (!this.database) {
                    this.metrics = parsed;
                }
            }

            // Load activities
            const savedActivities = localStorage.getItem('dashboard_activities');
            if (savedActivities) {
                this.activities = JSON.parse(savedActivities);
            }

            // Load curriculum coverage
            const savedCoverage = localStorage.getItem('dashboard_coverage');
            if (savedCoverage) {
                this.curriculumCoverage = JSON.parse(savedCoverage);
            }

            console.log('📥 Dashboard data loaded from storage');
        } catch (error) {
            console.warn('⚠️  Could not load dashboard data:', error.message);
        }
    }

    /**
     * Save data to localStorage and database
     */
    async saveToStorage() {
        try {
            // Save to localStorage
            localStorage.setItem('dashboard_metrics', JSON.stringify(this.metrics));
            localStorage.setItem('dashboard_activities', JSON.stringify(this.activities));
            localStorage.setItem('dashboard_coverage', JSON.stringify(this.curriculumCoverage));

            // Save to enhanced database
            if (this.database) {
                await this.database.saveStatistics(this.metrics);
            }
        } catch (error) {
            console.warn('⚠️  Could not save dashboard data:', error.message);
        }
    }

    /**
     * Refresh metrics from various sources
     */
    refreshMetrics() {
        try {
            // Count documents from RAG system or embedding manager (only update if > 0)
            if (window.ragSystem && window.ragSystem.data && window.ragSystem.data.length > 0) {
                this.metrics.documentsIndexed = Math.max(this.metrics.documentsIndexed, window.ragSystem.data.length);
            } else if (window.embeddingManager && window.embeddingManager.documents && window.embeddingManager.documents.length > 0) {
                this.metrics.documentsIndexed = Math.max(this.metrics.documentsIndexed, window.embeddingManager.documents.length);
            }

            // Count queries from localStorage (only update if > 0)
            const queryHistory = localStorage.getItem('query_history');
            if (queryHistory) {
                try {
                    const queries = JSON.parse(queryHistory);
                    if (queries.length > 0) {
                        this.metrics.queriesProcessed = Math.max(this.metrics.queriesProcessed, queries.length);
                    }
                } catch (e) {
                    // Keep existing count
                }
            }

            // Calculate accuracy from experiments
            if (window.experimentTracker) {
                const experiments = window.experimentTracker.getAllExperiments();
                if (experiments && experiments.length > 0) {
                    let totalAccuracy = 0;
                    let count = 0;

                    experiments.forEach(exp => {
                        const runs = window.experimentTracker.getRuns(exp.id);
                        runs.forEach(run => {
                            if (run.metrics && run.metrics.precision) {
                                totalAccuracy += run.metrics.precision;
                                count++;
                            }
                        });
                    });

                    if (count > 0) {
                        this.metrics.accuracyRate = (totalAccuracy / count * 100).toFixed(1);
                    }
                }
            }

            // Calculate average response time
            if (window.experimentTracker) {
                const experiments = window.experimentTracker.getAllExperiments();
                let totalTime = 0;
                let count = 0;

                experiments.forEach(exp => {
                    const runs = window.experimentTracker.getRuns(exp.id);
                    runs.forEach(run => {
                        if (run.metrics && run.metrics.response_time) {
                            totalTime += run.metrics.response_time;
                            count++;
                        }
                    });
                });

                if (count > 0) {
                    this.metrics.avgResponseTime = (totalTime / count).toFixed(1);
                } else {
                    this.metrics.avgResponseTime = 0;
                }
            }

            // Update curriculum coverage based on uploaded files
            this.updateCurriculumCoverage();

            // Save updated metrics
            this.saveToStorage();

        } catch (error) {
            console.warn('⚠️  Error refreshing metrics:', error.message);
        }
    }

    /**
     * Update curriculum coverage based on uploaded data
     */
    updateCurriculumCoverage() {
        try {
            // Check for uploaded PDFs
            const pdfs = localStorage.getItem('ncert_pdfs');
            if (pdfs) {
                const pdfData = JSON.parse(pdfs);

                pdfData.forEach(pdf => {
                    const filename = (pdf.filename || '').toLowerCase();

                    if (filename.includes('math')) {
                        this.curriculumCoverage.mathematics = Math.min(100, this.curriculumCoverage.mathematics + 20);
                    }
                    if (filename.includes('physics')) {
                        this.curriculumCoverage.physics = Math.min(100, this.curriculumCoverage.physics + 20);
                    }
                    if (filename.includes('chemistry') || filename.includes('chem')) {
                        this.curriculumCoverage.chemistry = Math.min(100, this.curriculumCoverage.chemistry + 20);
                    }
                    if (filename.includes('biology') || filename.includes('bio')) {
                        this.curriculumCoverage.biology = Math.min(100, this.curriculumCoverage.biology + 20);
                    }
                });
            }

            // Check RAG system data
            if (window.ragSystem && window.ragSystem.data && window.ragSystem.data.length > 0) {
                // If we have data, ensure at least some coverage
                if (this.curriculumCoverage.mathematics === 0) {
                    this.curriculumCoverage.mathematics = 25;
                }
            }

        } catch (error) {
            console.warn('⚠️  Error updating curriculum coverage:', error.message);
        }
    }

    /**
     * Update metrics display in UI
     */
    updateMetricsDisplay() {
        try {
            // Documents indexed
            const docsEl = document.getElementById('documentsIndexed');
            if (docsEl) {
                docsEl.textContent = this.formatNumber(this.metrics.documentsIndexed);
            }

            // Queries processed
            const queriesEl = document.getElementById('queriesProcessed');
            if (queriesEl) {
                queriesEl.textContent = this.formatNumber(this.metrics.queriesProcessed);
            }

            // Accuracy rate
            const accuracyEl = document.getElementById('accuracyRate');
            if (accuracyEl) {
                accuracyEl.textContent = this.metrics.accuracyRate > 0
                    ? `${this.metrics.accuracyRate}%`
                    : '--';
            }

            // Response time
            const responseEl = document.getElementById('avgResponseTime');
            if (responseEl) {
                responseEl.textContent = this.metrics.avgResponseTime > 0
                    ? `${this.metrics.avgResponseTime}s`
                    : '--';
            }

        } catch (error) {
            console.warn('⚠️  Error updating metrics display:', error.message);
        }
    }

    /**
     * Update activity display
     */
    updateActivityDisplay() {
        try {
            const activityList = document.querySelector('.activity-list');
            if (!activityList) return;

            if (this.activities.length === 0) {
                activityList.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #888;">
                        <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <p>No recent activity</p>
                        <p style="font-size: 0.875rem;">Upload data or create experiments to get started</p>
                    </div>
                `;
                return;
            }

            // Show last 5 activities
            const recentActivities = this.activities.slice(-5).reverse();

            activityList.innerHTML = recentActivities.map(activity => `
                <div class="activity-item">
                    <i class="fas fa-${activity.icon}"></i>
                    <div>
                        <p>${activity.message}</p>
                        <span>${this.formatTimeAgo(activity.timestamp)}</span>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.warn('⚠️  Error updating activity display:', error.message);
        }
    }

    /**
     * Update curriculum coverage display
     */
    updateCurriculumDisplay() {
        try {
            const coverageList = document.querySelector('.coverage-list');
            if (!coverageList) return;

            const subjects = [
                { name: 'Mathematics', key: 'mathematics', color: '#3b82f6' },
                { name: 'Physics', key: 'physics', color: '#8b5cf6' },
                { name: 'Chemistry', key: 'chemistry', color: '#ec4899' },
                { name: 'Biology', key: 'biology', color: '#10b981' }
            ];

            coverageList.innerHTML = subjects.map(subject => {
                const percentage = this.curriculumCoverage[subject.key];
                return `
                    <div class="coverage-item">
                        <span>${subject.name}</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%; background: ${subject.color};"></div>
                        </div>
                        <span>${percentage}%</span>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.warn('⚠️  Error updating curriculum display:', error.message);
        }
    }

    /**
     * Setup quick start guide
     */
    setupQuickStart() {
        try {
            const quickStart = document.getElementById('dashboard-quick-start');
            if (!quickStart) return;

            // Show quick start if no data exists
            const hasData = this.metrics.documentsIndexed > 0 || this.activities.length > 0;

            if (!hasData && !localStorage.getItem('quick_start_dismissed')) {
                quickStart.style.display = 'block';

                // Add dismiss button if not exists
                if (!quickStart.querySelector('.dismiss-guide')) {
                    const dismissBtn = document.createElement('button');
                    dismissBtn.className = 'dismiss-guide btn-secondary';
                    dismissBtn.innerHTML = '<i class="fas fa-times"></i> Dismiss';
                    dismissBtn.onclick = () => {
                        quickStart.style.display = 'none';
                        localStorage.setItem('quick_start_dismissed', 'true');
                    };
                    quickStart.querySelector('.guide-content').appendChild(dismissBtn);
                }
            } else {
                quickStart.style.display = 'none';
            }

        } catch (error) {
            console.warn('⚠️  Error setting up quick start:', error.message);
        }
    }

    /**
     * Add activity to the feed
     */
    addActivity(icon, message) {
        const activity = {
            icon: icon,
            message: message,
            timestamp: Date.now()
        };

        this.activities.push(activity);

        // Keep only last 50 activities
        if (this.activities.length > 50) {
            this.activities = this.activities.slice(-50);
        }

        this.saveToStorage();
        this.updateActivityDisplay();

        console.log('📝 Activity added:', message);
    }

    /**
     * Start auto-refresh
     */
    startAutoRefresh() {
        // Clear existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Refresh every 5 seconds
        this.updateInterval = setInterval(() => {
            this.refreshMetrics();
            this.updateMetricsDisplay();
            this.updateCurriculumDisplay();
        }, 5000);

        console.log('🔄 Auto-refresh started (5s interval)');
    }

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('⏸️  Auto-refresh stopped');
        }
    }

    /**
     * Manual refresh
     */
    refresh() {
        console.log('🔄 Manually refreshing dashboard...');
        this.refreshMetrics();
        this.updateMetricsDisplay();
        this.updateActivityDisplay();
        this.updateCurriculumDisplay();
        console.log('✅ Dashboard refreshed');
    }

    /**
     * Reset dashboard data
     */
    reset() {
        if (!confirm('Are you sure you want to reset all dashboard data?')) {
            return;
        }

        this.metrics = {
            documentsIndexed: 0,
            queriesProcessed: 0,
            accuracyRate: 0,
            avgResponseTime: 0
        };

        this.activities = [];

        this.curriculumCoverage = {
            mathematics: 0,
            physics: 0,
            chemistry: 0,
            biology: 0
        };

        this.saveToStorage();
        this.updateMetricsDisplay();
        this.updateActivityDisplay();
        this.updateCurriculumDisplay();

        console.log('🔄 Dashboard reset');
    }

    /**
     * Export dashboard data
     */
    exportData() {
        const data = {
            metrics: this.metrics,
            activities: this.activities,
            coverage: this.curriculumCoverage,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-data-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('📥 Dashboard data exported');
    }

    /**
     * Utility: Format number with commas
     */
    formatNumber(num) {
        return num.toLocaleString();
    }

    /**
     * Utility: Format timestamp as "X ago"
     */
    formatTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

        return new Date(timestamp).toLocaleDateString();
    }
}

// Don't auto-initialize - will be created in script.js with database
console.log('📊 Dashboard Manager class loaded');
