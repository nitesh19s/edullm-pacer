/**
 * Database Management Controller
 * Handles all database management UI interactions
 */

class DatabaseManager {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.healthCheckInterval = null;
    }

    /**
     * Initialize database and UI
     */
    async initialize() {
        try {
            console.log('Initializing database manager...');

            // Create database instance
            this.db = new EduLLMDatabaseV3({
                enableCache: true,
                enableLogging: true,
                enablePerformanceMonitoring: true
            });

            // Initialize connection
            await this.db.initialize();
            this.isInitialized = true;

            console.log('Database manager initialized successfully');

            // Load initial data
            await this.refreshHealth();
            await this.refreshStats();
            await this.refreshBackups();
            await this.loadExportStores();

            // Start auto-refresh (every 30 seconds)
            this.startAutoRefresh();

            this.showToast('Database connected successfully', 'success');

        } catch (error) {
            console.error('Failed to initialize database manager:', error);
            this.showToast('Failed to connect to database', 'error');
        }
    }

    /**
     * Start auto-refresh for health and stats
     */
    startAutoRefresh() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        this.healthCheckInterval = setInterval(async () => {
            await this.refreshHealth();
            await this.refreshStats();
        }, 30000); // 30 seconds
    }

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    // ==================== HEALTH MANAGEMENT ====================

    /**
     * Refresh database health
     */
    async refreshHealth() {
        if (!this.isInitialized) return;

        try {
            const health = await this.db.healthCheck();

            // Update status card
            const statusCard = document.getElementById('healthStatus');
            statusCard.className = 'health-card ' + health.status;
            statusCard.querySelector('.health-icon i').className = this.getStatusIcon(health.status);
            statusCard.querySelector('.health-value').textContent = health.status.toUpperCase();
            statusCard.querySelector('.health-time').textContent = new Date(health.timestamp).toLocaleTimeString();

            // Update connection card
            const connCard = document.getElementById('healthConnection');
            connCard.className = 'health-card ' + (health.checks.connection ? 'healthy' : 'critical');
            connCard.querySelector('.health-value').textContent = health.checks.connection ? 'Connected' : 'Disconnected';
            connCard.querySelector('.health-time').textContent = health.checks.connection ? 'Active' : 'Inactive';

            // Update storage card
            const storageCard = document.getElementById('healthStorage');
            if (health.checks.storage) {
                const percentUsed = parseFloat(health.checks.storage.percentUsed);
                storageCard.className = 'health-card ' + (percentUsed > 80 ? 'warning' : 'healthy');
                storageCard.querySelector('.health-value').textContent = health.checks.storage.usedMB + ' MB';
                storageCard.querySelector('.health-time').textContent = `${health.checks.storage.usedMB} / ${health.checks.storage.quotaMB} MB (${health.checks.storage.percentUsed}%)`;
            }

            // Update performance card
            const perfCard = document.getElementById('healthPerformance');
            const avgTime = health.checks.performance.avgQueryTime;
            perfCard.className = 'health-card ' + (avgTime > 100 ? 'warning' : 'healthy');
            perfCard.querySelector('.health-value').textContent = avgTime.toFixed(2) + ' ms';
            perfCard.querySelector('.health-time').textContent = `${health.checks.performance.totalQueries} queries`;

            // Show issues/warnings if any
            const healthDetails = document.getElementById('healthDetails');
            const healthAlert = document.getElementById('healthAlert');

            if (health.issues.length > 0 || health.warnings.length > 0) {
                healthDetails.style.display = 'block';
                let alertClass = 'alert ';
                let alertContent = '';

                if (health.issues.length > 0) {
                    alertClass += 'alert-danger';
                    alertContent += '<strong>Issues:</strong><ul>';
                    health.issues.forEach(issue => {
                        alertContent += `<li>${issue}</li>`;
                    });
                    alertContent += '</ul>';
                }

                if (health.warnings.length > 0) {
                    if (health.issues.length === 0) alertClass += 'alert-warning';
                    alertContent += '<strong>Warnings:</strong><ul>';
                    health.warnings.forEach(warning => {
                        alertContent += `<li>${warning}</li>`;
                    });
                    alertContent += '</ul>';
                }

                healthAlert.className = alertClass;
                healthAlert.innerHTML = alertContent;
            } else {
                healthDetails.style.display = 'none';
            }

        } catch (error) {
            console.error('Failed to refresh health:', error);
        }
    }

    /**
     * Get status icon class
     */
    getStatusIcon(status) {
        switch (status) {
            case 'healthy':
                return 'fas fa-check-circle';
            case 'warning':
                return 'fas fa-exclamation-triangle';
            case 'critical':
                return 'fas fa-times-circle';
            default:
                return 'fas fa-circle-notch fa-spin';
        }
    }

    // ==================== STATISTICS MANAGEMENT ====================

    /**
     * Refresh database statistics
     */
    async refreshStats() {
        if (!this.isInitialized) return;

        try {
            const stats = await this.db.generateStatisticsReport();

            // Update stat cards
            document.getElementById('statStores').textContent = stats.totals.storeCount.toLocaleString();
            document.getElementById('statRecords').textContent = stats.totals.recordCount.toLocaleString();
            document.getElementById('statCacheRate').textContent = (stats.cache.hitRate * 100).toFixed(1) + '%';
            document.getElementById('statQueries').textContent = stats.performance.totalQueries.toLocaleString();

            // Update stores table
            this.updateStoresTable(stats.stores);

        } catch (error) {
            console.error('Failed to refresh stats:', error);
        }
    }

    /**
     * Update stores table
     */
    updateStoresTable(stores) {
        const tbody = document.getElementById('storesTableBody');

        if (stores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading-cell">No stores found</td></tr>';
            return;
        }

        let html = '';
        stores.forEach(store => {
            html += `
                <tr>
                    <td data-label="Store Name"><span class="store-name">${store.name}</span></td>
                    <td data-label="Records">${store.count.toLocaleString()}</td>
                    <td data-label="Indexes"><span class="index-count">${store.indexCount} indexes</span></td>
                    <td data-label="Actions">
                        <button class="btn btn-sm btn-secondary" onclick="dbManager.validateStore('${store.name}')">
                            <i class="fas fa-check"></i> Validate
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    // ==================== BACKUP MANAGEMENT ====================

    /**
     * Create new backup
     */
    async createBackup() {
        if (!this.isInitialized) return;

        const name = prompt('Enter backup name (optional):');
        if (name === null) return; // Cancelled

        const backupName = name || `Manual Backup - ${new Date().toLocaleString()}`;

        try {
            this.showToast('Creating backup...', 'info');

            const backup = await this.db.createBackup(backupName, {
                saveToIndexedDB: true
            });

            this.showToast('Backup created successfully', 'success');

            // Refresh backups list
            await this.refreshBackups();

        } catch (error) {
            console.error('Failed to create backup:', error);
            this.showToast('Failed to create backup', 'error');
        }
    }

    /**
     * Refresh backups list
     */
    async refreshBackups() {
        if (!this.isInitialized) return;

        try {
            const backups = await this.db.listBackups();
            const container = document.getElementById('backupsList');

            if (backups.length === 0) {
                container.innerHTML = '<div class="loading-message">No backups found. Create your first backup above.</div>';
                return;
            }

            let html = '';
            backups.forEach(backup => {
                const date = new Date(backup.timestamp);
                const sizeMB = (backup.size / 1024 / 1024).toFixed(2);

                html += `
                    <div class="backup-item">
                        <div class="backup-info">
                            <div class="backup-name">${backup.name}</div>
                            <div class="backup-meta">
                                <span><i class="fas fa-calendar"></i> ${date.toLocaleString()}</span>
                                <span><i class="fas fa-database"></i> ${backup.storeCount} stores</span>
                                <span><i class="fas fa-file-alt"></i> ${backup.recordCount.toLocaleString()} records</span>
                                <span><i class="fas fa-save"></i> ${sizeMB} MB</span>
                                <span><i class="fas fa-tag"></i> ${backup.type}</span>
                            </div>
                        </div>
                        <div class="backup-actions">
                            <button class="btn btn-sm btn-success" onclick="dbManager.restoreBackup(${backup.id})">
                                <i class="fas fa-undo"></i> Restore
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="dbManager.downloadBackup(${backup.id})">
                                <i class="fas fa-download"></i> Download
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="dbManager.deleteBackup(${backup.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;

        } catch (error) {
            console.error('Failed to refresh backups:', error);
        }
    }

    /**
     * Restore from backup
     */
    async restoreBackup(backupId) {
        if (!this.isInitialized) return;

        if (!confirm('Are you sure you want to restore from this backup? This will replace all current data.')) {
            return;
        }

        try {
            this.showToast('Restoring from backup...', 'info');

            const result = await this.db.restoreFromBackup(backupId, {
                clearBeforeRestore: true,
                createBackupBeforeRestore: true
            });

            this.showToast(`Restored ${result.recordsImported} records successfully`, 'success');

            // Refresh all data
            await this.refreshHealth();
            await this.refreshStats();

        } catch (error) {
            console.error('Failed to restore backup:', error);
            this.showToast('Failed to restore backup', 'error');
        }
    }

    /**
     * Download backup
     */
    async downloadBackup(backupId) {
        if (!this.isInitialized) return;

        try {
            this.showToast('Downloading backup...', 'info');
            await this.db.downloadBackup(backupId);
            this.showToast('Backup downloaded', 'success');
        } catch (error) {
            console.error('Failed to download backup:', error);
            this.showToast('Failed to download backup', 'error');
        }
    }

    /**
     * Delete backup
     */
    async deleteBackup(backupId) {
        if (!this.isInitialized) return;

        if (!confirm('Are you sure you want to delete this backup?')) {
            return;
        }

        try {
            await this.db.deleteBackup(backupId);
            this.showToast('Backup deleted', 'success');
            await this.refreshBackups();
        } catch (error) {
            console.error('Failed to delete backup:', error);
            this.showToast('Failed to delete backup', 'error');
        }
    }

    /**
     * Cleanup old backups
     */
    async cleanupBackups() {
        if (!this.isInitialized) return;

        const keepCount = prompt('How many recent backups to keep?', '10');
        if (keepCount === null) return;

        const count = parseInt(keepCount);
        if (isNaN(count) || count < 1) {
            alert('Please enter a valid number');
            return;
        }

        try {
            this.showToast('Cleaning up old backups...', 'info');

            const result = await this.db.cleanupBackups({ keepCount: count });

            this.showToast(`Deleted ${result.deleted} old backups`, 'success');

            await this.refreshBackups();

        } catch (error) {
            console.error('Failed to cleanup backups:', error);
            this.showToast('Failed to cleanup backups', 'error');
        }
    }

    // ==================== EXPORT/IMPORT ====================

    /**
     * Load export stores list
     */
    async loadExportStores() {
        if (!this.isInitialized) return;

        try {
            const info = await this.db.getDatabaseInfo();
            const container = document.getElementById('exportStoresList');

            let html = '<div class="store-checkbox"><label><input type="checkbox" id="selectAllStores" onchange="dbManager.toggleAllStores()"> <strong>Select All</strong></label></div><hr>';

            info.stores.forEach(store => {
                html += `
                    <div class="store-checkbox">
                        <input type="checkbox" id="store_${store.name}" value="${store.name}" class="export-store-checkbox">
                        <label for="store_${store.name}">${store.name} (${store.count} records)</label>
                    </div>
                `;
            });

            container.innerHTML = html;

        } catch (error) {
            console.error('Failed to load stores:', error);
        }
    }

    /**
     * Toggle all stores selection
     */
    toggleAllStores() {
        const selectAll = document.getElementById('selectAllStores').checked;
        const checkboxes = document.querySelectorAll('.export-store-checkbox');

        checkboxes.forEach(cb => {
            cb.checked = selectAll;
        });
    }

    /**
     * Export database
     */
    async exportDatabase() {
        if (!this.isInitialized) return;

        try {
            // Get selected stores
            const checkboxes = document.querySelectorAll('.export-store-checkbox:checked');
            const selectedStores = Array.from(checkboxes).map(cb => cb.value);

            if (selectedStores.length === 0) {
                // Export all if none selected
                this.showToast('Exporting entire database...', 'info');
                await this.db.exportToFile();
            } else {
                this.showToast(`Exporting ${selectedStores.length} stores...`, 'info');
                await this.db.exportToFile(null, selectedStores);
            }

            this.showToast('Database exported successfully', 'success');

        } catch (error) {
            console.error('Failed to export database:', error);
            this.showToast('Failed to export database', 'error');
        }
    }

    /**
     * Import database
     */
    async importDatabase() {
        if (!this.isInitialized) return;

        const fileInput = document.getElementById('importFileInput');
        const file = fileInput.files[0];

        if (!file) {
            alert('Please select a file to import');
            return;
        }

        const clearBefore = document.getElementById('clearBeforeImport').checked;
        const skipErrors = document.getElementById('skipErrors').checked;

        if (clearBefore) {
            if (!confirm('This will clear all existing data before import. Are you sure?')) {
                return;
            }
        }

        try {
            // Show progress
            const progressContainer = document.getElementById('importProgress');
            const progressBar = document.getElementById('importProgressBar');
            const progressText = document.getElementById('importProgressText');

            progressContainer.style.display = 'block';
            progressBar.style.width = '0%';
            progressText.textContent = 'Starting import...';

            const result = await this.db.importFromFile(file, {
                clearBeforeImport: clearBefore,
                skipErrors: skipErrors,
                onProgress: (progress) => {
                    const percent = (progress.current / progress.total) * 100;
                    progressBar.style.width = percent + '%';
                    progressText.textContent = `Importing ${progress.storeName}: ${progress.current}/${progress.total}`;
                }
            });

            progressBar.style.width = '100%';
            progressText.textContent = 'Import complete!';

            setTimeout(() => {
                progressContainer.style.display = 'none';
            }, 2000);

            this.showToast(`Imported ${result.recordsImported} records successfully`, 'success');

            // Refresh all data
            await this.refreshHealth();
            await this.refreshStats();

            // Clear file input
            fileInput.value = '';

        } catch (error) {
            console.error('Failed to import database:', error);
            this.showToast('Failed to import database', 'error');

            document.getElementById('importProgress').style.display = 'none';
        }
    }

    // ==================== ADVANCED OPERATIONS ====================

    /**
     * Run performance benchmark
     */
    async runBenchmark() {
        if (!this.isInitialized) return;

        if (!confirm('This will create test records. Continue?')) {
            return;
        }

        try {
            this.showToast('Running benchmark...', 'info');

            const results = await this.db.runBenchmark({
                iterations: 100,
                storeName: 'curriculum'
            });

            let html = '<h4>Benchmark Results (100 iterations)</h4>';
            html += '<div class="result-item"><strong>Create:</strong> ' + results.operations.create.avg.toFixed(2) + ' ms avg</div>';
            html += '<div class="result-item"><strong>Read:</strong> ' + results.operations.read.avg.toFixed(2) + ' ms avg</div>';
            html += '<div class="result-item"><strong>Update:</strong> ' + results.operations.update.avg.toFixed(2) + ' ms avg</div>';
            html += '<div class="result-item"><strong>Delete:</strong> ' + results.operations.delete.avg.toFixed(2) + ' ms avg</div>';
            html += '<div class="result-item"><strong>Query:</strong> ' + results.operations.query.total.toFixed(2) + ' ms total</div>';

            this.showModal('Benchmark Results', html);

        } catch (error) {
            console.error('Failed to run benchmark:', error);
            this.showToast('Failed to run benchmark', 'error');
        }
    }

    /**
     * Validate data
     */
    async validateData() {
        if (!this.isInitialized) return;

        try {
            this.showToast('Validating data integrity...', 'info');

            const integrity = await this.db.checkDataIntegrity();

            let html = '<h4>Data Integrity Check</h4>';
            html += `<div class="result-item"><strong>Status:</strong> ${integrity.valid ? 'Valid ✓' : 'Issues Found ✗'}</div>`;
            html += `<div class="result-item"><strong>Checks Run:</strong> ${integrity.checksRun}</div>`;

            if (integrity.issues.length > 0) {
                html += '<h4 style="margin-top: 1rem;">Issues Found:</h4>';
                integrity.issues.forEach(issue => {
                    html += `<div class="result-item">${JSON.stringify(issue)}</div>`;
                });
            }

            this.showModal('Data Validation', html);

            if (integrity.valid) {
                this.showToast('Data validation passed', 'success');
            } else {
                this.showToast(`Found ${integrity.issues.length} issues`, 'warning');
            }

        } catch (error) {
            console.error('Failed to validate data:', error);
            this.showToast('Failed to validate data', 'error');
        }
    }

    /**
     * Validate specific store
     */
    async validateStore(storeName) {
        if (!this.isInitialized) return;

        try {
            this.showToast(`Validating ${storeName}...`, 'info');

            const results = await this.db.validateStore(storeName, {
                fix: false
            });

            let html = `<h4>Store Validation: ${storeName}</h4>`;
            html += `<div class="result-item"><strong>Total Records:</strong> ${results.total}</div>`;
            html += `<div class="result-item"><strong>Valid:</strong> ${results.valid}</div>`;
            html += `<div class="result-item"><strong>Invalid:</strong> ${results.invalid}</div>`;
            html += `<div class="result-item"><strong>Warnings:</strong> ${results.warnings}</div>`;

            if (results.issues.length > 0) {
                html += '<h4 style="margin-top: 1rem;">Issues (first 10):</h4>';
                results.issues.slice(0, 10).forEach(issue => {
                    html += `<div class="result-item">ID ${issue.id}: ${issue.errors.join(', ')}</div>`;
                });
            }

            this.showModal('Store Validation', html);

        } catch (error) {
            console.error('Failed to validate store:', error);
            this.showToast('Failed to validate store', 'error');
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        if (!this.isInitialized) return;

        try {
            this.db.clearCache();
            this.showToast('Cache cleared successfully', 'success');
        } catch (error) {
            console.error('Failed to clear cache:', error);
            this.showToast('Failed to clear cache', 'error');
        }
    }

    /**
     * Show database info
     */
    async showDatabaseInfo() {
        if (!this.isInitialized) return;

        try {
            const info = await this.db.getDatabaseInfo();
            const cacheStats = this.db.getCacheStats();
            const perfMetrics = this.db.getPerformanceMetrics();

            let html = '<h4>Database Information</h4>';
            html += `<div class="result-item"><strong>Name:</strong> ${info.name}</div>`;
            html += `<div class="result-item"><strong>Version:</strong> ${info.version}</div>`;
            html += `<div class="result-item"><strong>Total Stores:</strong> ${info.stores.length}</div>`;

            html += '<h4 style="margin-top: 1rem;">Cache Statistics</h4>';
            html += `<div class="result-item"><strong>Size:</strong> ${cacheStats.size}</div>`;
            html += `<div class="result-item"><strong>Hits:</strong> ${cacheStats.hits}</div>`;
            html += `<div class="result-item"><strong>Misses:</strong> ${cacheStats.misses}</div>`;
            html += `<div class="result-item"><strong>Hit Rate:</strong> ${(cacheStats.hitRate * 100).toFixed(2)}%</div>`;

            html += '<h4 style="margin-top: 1rem;">Performance</h4>';
            html += `<div class="result-item"><strong>Avg Query Time:</strong> ${perfMetrics.avgQueryTime.toFixed(2)} ms</div>`;
            html += `<div class="result-item"><strong>Total Queries:</strong> ${perfMetrics.totalQueries}</div>`;

            this.showModal('Database Information', html);

        } catch (error) {
            console.error('Failed to get database info:', error);
            this.showToast('Failed to get database info', 'error');
        }
    }

    // ==================== DANGER ZONE ====================

    /**
     * Clear all stores
     */
    async clearAllStores() {
        if (!this.isInitialized) return;

        if (!confirm('Are you ABSOLUTELY SURE you want to clear ALL data? This cannot be undone!')) {
            return;
        }

        const confirmation = prompt('Type "DELETE ALL" to confirm:');
        if (confirmation !== 'DELETE ALL') {
            alert('Confirmation failed. Operation cancelled.');
            return;
        }

        try {
            this.showToast('Clearing all data...', 'info');

            const info = await this.db.getDatabaseInfo();

            for (const store of info.stores) {
                await this.db.clear(store.name);
            }

            this.showToast('All data cleared', 'success');

            // Refresh all
            await this.refreshHealth();
            await this.refreshStats();

        } catch (error) {
            console.error('Failed to clear all stores:', error);
            this.showToast('Failed to clear all stores', 'error');
        }
    }

    /**
     * Delete entire database
     */
    async deleteDatabase() {
        if (!this.isInitialized) return;

        if (!confirm('Are you ABSOLUTELY SURE you want to DELETE the entire database? This cannot be undone!')) {
            return;
        }

        const confirmation = prompt('Type "DELETE DATABASE" to confirm:');
        if (confirmation !== 'DELETE DATABASE') {
            alert('Confirmation failed. Operation cancelled.');
            return;
        }

        try {
            this.showToast('Deleting database...', 'info');

            this.stopAutoRefresh();
            this.db.close();

            await EduLLMDatabaseV3.deleteDatabase('EduLLMPlatform');

            this.showToast('Database deleted. Please refresh the page.', 'success');

            // Redirect to main page after 3 seconds
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);

        } catch (error) {
            console.error('Failed to delete database:', error);
            this.showToast('Failed to delete database', 'error');
        }
    }

    // ==================== UI HELPERS ====================

    /**
     * Show modal
     */
    showModal(title, content) {
        const modal = document.getElementById('resultModal');
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;
        modal.classList.add('active');
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('resultModal');
        modal.classList.remove('active');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);

        // Could implement a proper toast notification system here
        // For now, we'll just log to console
    }
}

// Create global instance
const dbManager = new DatabaseManager();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (dbManager.isInitialized) {
        dbManager.stopAutoRefresh();
    }
});
