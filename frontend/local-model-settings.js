/**
 * Local Model Settings UI Handlers
 * Manages the local model configuration interface
 */

class LocalModelSettings {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize local model settings UI
     */
    async initialize() {
        console.log('⚙️ Initializing Local Model Settings...');

        // Wait for local model manager to be available
        if (!window.localModelManager) {
            console.warn('⚠️ Local Model Manager not loaded yet, retrying...');
            setTimeout(() => this.initialize(), 500);
            return;
        }

        // Setup event listeners
        this.setupEventListeners();

        // Initialize local model manager
        await window.localModelManager.initialize();

        // Update UI with current status
        await this.updateStatus();

        // Load saved configuration
        this.loadConfiguration();

        this.initialized = true;
        console.log('✅ Local Model Settings initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Provider switcher
        const providerSelect = document.getElementById('localModelProvider');
        if (providerSelect) {
            providerSelect.addEventListener('change', (e) => {
                this.switchProvider(e.target.value);
            });
        }

        // Temperature slider
        const tempSlider = document.getElementById('localModelTemperature');
        const tempValue = document.getElementById('localModelTemperatureValue');
        if (tempSlider && tempValue) {
            tempSlider.addEventListener('input', (e) => {
                tempValue.textContent = e.target.value;
            });
        }

        // Ollama generation model select
        const ollamaModelSelect = document.getElementById('ollamaGenerationModel');
        if (ollamaModelSelect) {
            ollamaModelSelect.addEventListener('change', (e) => {
                if (window.localOllamaService) {
                    window.localOllamaService.updateConfig({
                        generationModel: e.target.value
                    });
                }
            });
        }

        // Save configuration button
        const saveBtn = document.getElementById('saveLocalModelConfig');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveConfiguration());
        }

        // Test local model button
        const testBtn = document.getElementById('testLocalModel');
        if (testBtn) {
            testBtn.addEventListener('click', () => this.testLocalModel());
        }

        // Reset statistics button
        const resetStatsBtn = document.getElementById('resetLocalModelStats');
        if (resetStatsBtn) {
            resetStatsBtn.addEventListener('click', () => this.resetStatistics());
        }

        console.log('✅ Event listeners setup complete');
    }

    /**
     * Switch between Ollama and Transformers.js
     */
    async switchProvider(provider) {
        console.log(`🔄 Switching to ${provider}...`);

        // Toggle UI
        const ollamaConfig = document.getElementById('ollamaConfig');
        const transformersConfig = document.getElementById('transformersConfig');

        if (ollamaConfig && transformersConfig) {
            if (provider === 'ollama') {
                ollamaConfig.style.display = 'block';
                transformersConfig.style.display = 'none';
            } else {
                ollamaConfig.style.display = 'none';
                transformersConfig.style.display = 'block';
            }
        }

        // Switch provider in local model manager
        try {
            await window.localModelManager.switchProvider(provider);
            console.log(`✅ Switched to ${provider}`);
        } catch (error) {
            console.error(`❌ Failed to switch to ${provider}:`, error);
            alert(`Failed to switch to ${provider}: ${error.message}`);
        }

        // Update status
        await this.updateStatus();
    }

    /**
     * Update status displays
     */
    async updateStatus() {
        // Update Ollama status
        if (window.localOllamaService) {
            const ollamaAvailable = window.localOllamaService.isAvailable();
            const ollamaStatusEl = document.getElementById('ollamaStatus');

            if (ollamaStatusEl) {
                if (ollamaAvailable) {
                    const models = window.localOllamaService.getAvailableModels();
                    ollamaStatusEl.innerHTML = `<i class="fas fa-check-circle" style="color: #10b981;"></i> Running - ${models.length} models available`;
                } else {
                    ollamaStatusEl.innerHTML = `<i class="fas fa-times-circle" style="color: #ef4444;"></i> Not running - Install from <a href="https://ollama.com" target="_blank">ollama.com</a>`;
                }
            }
        }

        // Update Transformers.js status
        if (window.localTransformersService) {
            const transformersAvailable = window.localTransformersService.isAvailable();
            const transformersStatusEl = document.getElementById('transformersStatus');

            if (transformersStatusEl) {
                if (transformersAvailable) {
                    transformersStatusEl.innerHTML = `<i class="fas fa-check-circle" style="color: #10b981;"></i> Ready - Models will load on first use`;
                } else {
                    transformersStatusEl.innerHTML = `<i class="fas fa-times-circle" style="color: #ef4444;"></i> Not available - Transformers.js library not loaded`;
                }
            }

            // Update model loading status
            const loadingStatus = window.localTransformersService.getLoadingStatus();
            const embedderStatusEl = document.getElementById('transformersEmbedderStatus');
            const generatorStatusEl = document.getElementById('transformersGeneratorStatus');

            if (embedderStatusEl) {
                embedderStatusEl.textContent = this.formatLoadingStatus(loadingStatus.embedder);
            }
            if (generatorStatusEl) {
                generatorStatusEl.textContent = this.formatLoadingStatus(loadingStatus.generator);
            }
        }

        // Update statistics
        this.updateStatistics();
    }

    /**
     * Format loading status
     */
    formatLoadingStatus(status) {
        const statusMap = {
            'not-loaded': 'Not Loaded',
            'loading': 'Loading...',
            'loaded': 'Loaded ✓',
            'error': 'Error ❌'
        };
        return statusMap[status] || status;
    }

    /**
     * Update statistics display
     */
    updateStatistics() {
        if (!window.localModelManager) return;

        const stats = window.localModelManager.getStatistics();

        // Update UI elements
        const requestsEl = document.getElementById('localModelRequests');
        const providerEl = document.getElementById('localModelActiveProvider');
        const cacheHitsEl = document.getElementById('localModelCacheHits');

        if (requestsEl) {
            requestsEl.textContent = stats.totalRequests || 0;
        }

        if (providerEl) {
            providerEl.textContent = stats.activeProvider || 'None';
        }

        if (cacheHitsEl) {
            cacheHitsEl.textContent = stats.cacheHits || 0;
        }
    }

    /**
     * Save configuration to localStorage
     */
    saveConfiguration() {
        try {
            const config = {
                provider: document.getElementById('localModelProvider')?.value || 'ollama',
                temperature: parseFloat(document.getElementById('localModelTemperature')?.value || 0.7),
                ollamaGenerationModel: document.getElementById('ollamaGenerationModel')?.value || 'llama3.2:latest',
                savedAt: new Date().toISOString()
            };

            localStorage.setItem('local_model_config', JSON.stringify(config));

            // Apply to services
            if (window.localOllamaService) {
                window.localOllamaService.updateConfig({
                    generationModel: config.ollamaGenerationModel,
                    temperature: config.temperature
                });
            }

            if (window.localTransformersService) {
                window.localTransformersService.updateConfig({
                    temperature: config.temperature
                });
            }

            if (window.localModelManager) {
                window.localModelManager.updateConfig({
                    preferOllama: config.provider === 'ollama'
                });
            }

            this.showMessage('localModelTestStatus', '✅ Configuration saved successfully', 'success');
            console.log('✅ Local model configuration saved');

        } catch (error) {
            console.error('❌ Failed to save configuration:', error);
            this.showMessage('localModelTestStatus', '❌ Failed to save configuration', 'error');
        }
    }

    /**
     * Load configuration from localStorage
     */
    loadConfiguration() {
        try {
            const saved = localStorage.getItem('local_model_config');
            if (!saved) return;

            const config = JSON.parse(saved);

            // Apply to UI
            const providerSelect = document.getElementById('localModelProvider');
            if (providerSelect && config.provider) {
                providerSelect.value = config.provider;
                this.switchProvider(config.provider);
            }

            const tempSlider = document.getElementById('localModelTemperature');
            const tempValue = document.getElementById('localModelTemperatureValue');
            if (tempSlider && config.temperature !== undefined) {
                tempSlider.value = config.temperature;
                if (tempValue) {
                    tempValue.textContent = config.temperature;
                }
            }

            const modelSelect = document.getElementById('ollamaGenerationModel');
            if (modelSelect && config.ollamaGenerationModel) {
                modelSelect.value = config.ollamaGenerationModel;
            }

            console.log('✅ Loaded saved configuration');

        } catch (error) {
            console.warn('Failed to load configuration:', error);
        }
    }

    /**
     * Test local model
     */
    async testLocalModel() {
        const statusEl = document.getElementById('localModelTestStatus');
        const testBtn = document.getElementById('testLocalModel');

        if (!window.localModelManager || !window.localModelManager.isInitialized()) {
            this.showMessage('localModelTestStatus', '❌ Local model manager not initialized', 'error');
            return;
        }

        try {
            // Disable button during test
            if (testBtn) {
                testBtn.disabled = true;
                testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
            }

            this.showMessage('localModelTestStatus', '🧪 Testing local model...', 'info');

            // Test embedding generation
            console.log('Testing embedding generation...');
            const testText = "This is a test to verify local model functionality.";
            const embedding = await window.localModelManager.generateEmbedding(testText);

            if (!embedding || embedding.length === 0) {
                throw new Error('Failed to generate embedding');
            }

            console.log(`✅ Embedding generated: ${embedding.length} dimensions`);

            // Test text generation
            console.log('Testing text generation...');
            const prompt = "Say 'Hello, I am working!' (just that, nothing else)";
            const response = await window.localModelManager.generateText(prompt, {
                maxTokens: 50,
                temperature: 0.3
            });

            if (!response || !response.content) {
                throw new Error('Failed to generate text');
            }

            console.log(`✅ Text generated: "${response.content.substring(0, 50)}..."`);

            // Show success message
            this.showMessage('localModelTestStatus',
                `✅ Test successful!<br>
                - Embedding: ${embedding.length} dimensions<br>
                - Generation: ${response.model}<br>
                - Provider: ${response.provider}`,
                'success'
            );

        } catch (error) {
            console.error('❌ Test failed:', error);
            this.showMessage('localModelTestStatus',
                `❌ Test failed: ${error.message}<br>
                Make sure Ollama is running or Transformers.js is loaded.`,
                'error'
            );
        } finally {
            // Re-enable button
            if (testBtn) {
                testBtn.disabled = false;
                testBtn.innerHTML = '<i class="fas fa-vial"></i> Test Local Model';
            }
        }
    }

    /**
     * Reset statistics
     */
    resetStatistics() {
        if (!confirm('Reset all local model statistics?')) {
            return;
        }

        if (window.localModelManager) {
            window.localModelManager.resetStatistics();
        }

        this.updateStatistics();
        this.showMessage('localModelTestStatus', '✅ Statistics reset', 'success');
    }

    /**
     * Show message in status area
     */
    showMessage(elementId, message, type = 'info') {
        const el = document.getElementById(elementId);
        if (!el) return;

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };

        el.innerHTML = message;
        el.style.color = colors[type] || colors.info;
        el.style.padding = '0.75rem';
        el.style.background = `${colors[type]}15`;
        el.style.borderRadius = 'var(--radius)';
        el.style.borderLeft = `3px solid ${colors[type]}`;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    window.localModelSettings = new LocalModelSettings();
    // Small delay to ensure all services are loaded
    setTimeout(() => {
        window.localModelSettings.initialize();
    }, 1000);
});

// Also initialize after full page load as backup
window.addEventListener('load', () => {
    if (!window.localModelSettings || !window.localModelSettings.initialized) {
        window.localModelSettings = new LocalModelSettings();
        window.localModelSettings.initialize();
    }
});

console.log('⚙️ Local Model Settings UI loaded');
