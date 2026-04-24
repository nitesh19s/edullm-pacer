/**
 * ChromaDB Setup Assistant
 *
 * Interactive UI for setting up and managing ChromaDB integration
 */

class ChromaDBSetupAssistant {
    constructor(vectorServiceManager, database) {
        this.vectorService = vectorServiceManager;
        this.database = database;
        this.setupModal = null;
    }

    /**
     * Show setup assistant modal
     */
    async showSetupAssistant() {
        // Create modal if it doesn't exist
        if (!this.setupModal) {
            this.createSetupModal();
        }

        // Update status
        await this.updateStatus();

        // Show modal
        this.setupModal.style.display = 'flex';
    }

    /**
     * Create setup modal
     */
    createSetupModal() {
        const modalHTML = `
            <div id="chromadbSetupModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2><i class="fas fa-database"></i> ChromaDB Setup Assistant</h2>
                        <button class="modal-close" onclick="window.chromadbSetup.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <!-- Status Section -->
                        <div class="setup-section">
                            <h3>Current Status</h3>
                            <div id="chromadbStatus" class="status-panel">
                                <div class="status-item">
                                    <span class="label">Backend:</span>
                                    <span id="currentBackend" class="value">Unknown</span>
                                </div>
                                <div class="status-item">
                                    <span class="label">ChromaDB Server:</span>
                                    <span id="chromadbConnection" class="value">Unknown</span>
                                </div>
                                <div class="status-item">
                                    <span class="label">Collections:</span>
                                    <span id="collectionCount" class="value">0</span>
                                </div>
                                <div class="status-item">
                                    <span class="label">Total Vectors:</span>
                                    <span id="totalVectors" class="value">0</span>
                                </div>
                            </div>
                        </div>

                        <!-- Configuration Section -->
                        <div class="setup-section">
                            <h3>ChromaDB Configuration</h3>
                            <div class="form-group">
                                <label for="chromadbServerUrl">ChromaDB Server URL</label>
                                <input type="text" id="chromadbServerUrl" class="form-input"
                                       value="http://localhost:8000"
                                       placeholder="http://localhost:8000">
                                <p class="help-text">Default: http://localhost:8000 (requires ChromaDB server running)</p>
                            </div>
                            <div class="form-group">
                                <button class="btn-primary" onclick="window.chromadbSetup.testConnection()">
                                    <i class="fas fa-plug"></i> Test Connection
                                </button>
                                <button class="btn-secondary" onclick="window.chromadbSetup.reconnect()">
                                    <i class="fas fa-sync"></i> Reconnect
                                </button>
                            </div>
                        </div>

                        <!-- Migration Section -->
                        <div class="setup-section">
                            <h3>Data Migration</h3>
                            <div id="migrationInfo" class="info-panel">
                                <p>No migration needed.</p>
                            </div>
                            <div class="form-group">
                                <button class="btn-primary" id="migrateToChromaBtn" onclick="window.chromadbSetup.migrateToChromaDB()" disabled>
                                    <i class="fas fa-database"></i> Migrate to ChromaDB
                                </button>
                                <button class="btn-secondary" id="migrateToMemoryBtn" onclick="window.chromadbSetup.migrateToInMemory()" disabled>
                                    <i class="fas fa-memory"></i> Switch to In-Memory
                                </button>
                            </div>
                        </div>

                        <!-- Server Setup Instructions -->
                        <div class="setup-section">
                            <h3>ChromaDB Server Setup</h3>
                            <div class="instructions-panel">
                                <p><strong>Don't have ChromaDB server running?</strong></p>
                                <ol>
                                    <li>Install ChromaDB: <code>pip install chromadb</code></li>
                                    <li>Start server: <code>chroma run --host localhost --port 8000</code></li>
                                    <li>Click "Test Connection" above</li>
                                </ol>
                                <p class="help-text">
                                    Or use Docker: <code>docker run -p 8000:8000 chromadb/chroma</code>
                                </p>
                            </div>
                        </div>

                        <!-- Collections Management -->
                        <div class="setup-section">
                            <h3>Collections</h3>
                            <div id="collectionsList" class="collections-list">
                                <p class="text-muted">Loading...</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="window.chromadbSetup.closeModal()">Close</button>
                    </div>
                </div>
            </div>
        `;

        // Add to document
        const container = document.createElement('div');
        container.innerHTML = modalHTML;
        document.body.appendChild(container.firstElementChild);

        this.setupModal = document.getElementById('chromadbSetupModal');

        // Add styles
        this.addStyles();
    }

    /**
     * Add custom styles
     */
    addStyles() {
        const styles = `
            <style>
                .setup-section {
                    margin-bottom: 24px;
                    padding-bottom: 24px;
                    border-bottom: 1px solid var(--border-color, #e0e0e0);
                }

                .setup-section:last-child {
                    border-bottom: none;
                }

                .status-panel {
                    background: var(--secondary-bg, #f5f5f5);
                    padding: 16px;
                    border-radius: 8px;
                }

                .status-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                }

                .status-item .label {
                    font-weight: 600;
                }

                .status-item .value {
                    color: var(--primary-color, #3b82f6);
                }

                .status-connected {
                    color: var(--success-color, #10b981) !important;
                }

                .status-disconnected {
                    color: var(--danger-color, #ef4444) !important;
                }

                .info-panel, .instructions-panel {
                    background: var(--info-bg, #eff6ff);
                    border-left: 4px solid var(--primary-color, #3b82f6);
                    padding: 16px;
                    margin: 16px 0;
                }

                .instructions-panel code {
                    background: rgba(0, 0, 0, 0.05);
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                }

                .collections-list {
                    max-height: 200px;
                    overflow-y: auto;
                }

                .collection-item {
                    padding: 12px;
                    background: var(--secondary-bg, #f9fafb);
                    margin: 8px 0;
                    border-radius: 6px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .collection-name {
                    font-weight: 600;
                }

                .collection-count {
                    color: var(--text-muted, #6b7280);
                    font-size: 0.9em;
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Update status panel
     */
    async updateStatus() {
        try {
            const status = this.vectorService.getStatus();

            // Update backend
            document.getElementById('currentBackend').textContent =
                status.activeBackend.toUpperCase();

            // Update connection status
            const connElement = document.getElementById('chromadbConnection');
            if (status.chromadbConnected) {
                connElement.textContent = 'Connected';
                connElement.className = 'value status-connected';
            } else {
                connElement.textContent = 'Not Connected';
                connElement.className = 'value status-disconnected';
            }

            // Update collections
            await this.updateCollectionsList();

            // Update migration info
            this.updateMigrationInfo(status);

        } catch (error) {
            console.error('Failed to update status:', error);
        }
    }

    /**
     * Update collections list
     */
    async updateCollectionsList() {
        try {
            const collections = await this.vectorService.listCollections();

            let totalVectors = 0;
            const collectionStats = [];

            for (const collectionName of collections) {
                const stats = await this.vectorService.getCollectionStats(collectionName);
                collectionStats.push(stats);
                totalVectors += stats.count;
            }

            // Update counts
            document.getElementById('collectionCount').textContent = collections.length;
            document.getElementById('totalVectors').textContent = totalVectors;

            // Update list
            const listContainer = document.getElementById('collectionsList');
            if (collectionStats.length === 0) {
                listContainer.innerHTML = '<p class="text-muted">No collections found</p>';
            } else {
                listContainer.innerHTML = collectionStats.map(stats => `
                    <div class="collection-item">
                        <span class="collection-name">${stats.name}</span>
                        <span class="collection-count">${stats.count} vectors</span>
                    </div>
                `).join('');
            }

        } catch (error) {
            console.error('Failed to update collections:', error);
        }
    }

    /**
     * Update migration info
     */
    updateMigrationInfo(status) {
        const migrationInfo = document.getElementById('migrationInfo');
        const migrateToChromaBtn = document.getElementById('migrateToChromaBtn');
        const migrateToMemoryBtn = document.getElementById('migrateToMemoryBtn');

        if (status.activeBackend === 'chromadb') {
            migrationInfo.innerHTML = '<p>Currently using ChromaDB. You can switch to in-memory mode if needed.</p>';
            migrateToChromaBtn.disabled = true;
            migrateToMemoryBtn.disabled = false;
        } else {
            migrationInfo.innerHTML = '<p>Currently using in-memory storage. Migrate to ChromaDB for persistence and better performance.</p>';
            migrateToChromaBtn.disabled = false;
            migrateToMemoryBtn.disabled = true;
        }
    }

    /**
     * Test connection to ChromaDB server
     */
    async testConnection() {
        const serverUrl = document.getElementById('chromadbServerUrl').value;

        try {
            const testClient = new ChromaDBClient({
                serverUrl,
                enableFallback: false
            });

            await testClient.initialize();

            if (testClient.isChromaDBConnected()) {
                alert('✅ Connection successful!\n\nChromaDB server is reachable at ' + serverUrl);
            } else {
                alert('❌ Connection failed\n\nCould not connect to ChromaDB server at ' + serverUrl);
            }

        } catch (error) {
            alert('❌ Connection failed\n\n' + error.message);
        }
    }

    /**
     * Reconnect to ChromaDB
     */
    async reconnect() {
        const serverUrl = document.getElementById('chromadbServerUrl').value;

        try {
            this.vectorService.config.chromadbUrl = serverUrl;
            await this.vectorService.switchBackend('chromadb', false);
            await this.updateStatus();
            alert('✅ Reconnected to ChromaDB successfully!');
        } catch (error) {
            alert('❌ Reconnection failed\n\n' + error.message);
        }
    }

    /**
     * Migrate to ChromaDB
     */
    async migrateToChromaDB() {
        const confirm = window.confirm(
            'This will migrate all embeddings from in-memory storage to ChromaDB.\n\n' +
            'Make sure ChromaDB server is running before proceeding.\n\n' +
            'Continue?'
        );

        if (!confirm) return;

        try {
            const progressDiv = document.createElement('div');
            progressDiv.id = 'migrationProgress';
            progressDiv.innerHTML = '<p>Migration in progress...</p>';
            document.getElementById('migrationInfo').appendChild(progressDiv);

            await this.vectorService.switchBackend('chromadb', true);

            progressDiv.innerHTML = '<p style="color: var(--success-color)">✅ Migration completed successfully!</p>';

            await this.updateStatus();

        } catch (error) {
            alert('❌ Migration failed\n\n' + error.message);
            document.getElementById('migrationProgress')?.remove();
        }
    }

    /**
     * Migrate to in-memory
     */
    async migrateToInMemory() {
        const confirm = window.confirm(
            'This will switch to in-memory storage.\n\n' +
            'Data will be migrated but not persisted between sessions.\n\n' +
            'Continue?'
        );

        if (!confirm) return;

        try {
            await this.vectorService.switchBackend('inmemory', true);
            await this.updateStatus();
            alert('✅ Switched to in-memory storage successfully!');
        } catch (error) {
            alert('❌ Switch failed\n\n' + error.message);
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        if (this.setupModal) {
            this.setupModal.style.display = 'none';
        }
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.ChromaDBSetupAssistant = ChromaDBSetupAssistant;
}
