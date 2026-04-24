/**
 * Knowledge Graph Manager
 * Visualizes concepts and relationships from educational content
 * Integrates with RAG Chat and Smart Chunking
 */

class KnowledgeGraphManager {
    constructor() {
        this.initialized = false;

        // Graph data structure
        this.graph = {
            nodes: [],  // Concepts
            edges: []   // Relationships
        };

        // Settings
        this.settings = {
            maxNodes: 50,
            minRelationshipStrength: 0.3,
            visualizationMode: 'force',  // 'force', 'hierarchy', 'circular'
            showLabels: true,
            nodeSize: 'connections',  // 'connections', 'importance', 'uniform'
            colorScheme: 'subject',  // 'subject', 'importance', 'type'
            depthLevel: 2,  // How many relationship levels to show
            autoLayout: true
        };

        // Visualization state
        this.visualization = {
            svg: null,
            width: 800,
            height: 600,
            zoom: 1,
            pan: { x: 0, y: 0 },
            selectedNode: null,
            hoveredNode: null,
            draggedNode: null,
            isDraggingNode: false
        };

        // Custom node positions (for manual adjustments)
        this.customPositions = new Map();

        // Concept categories (for NCERT curriculum)
        this.categories = {
            mathematics: ['theorem', 'formula', 'equation', 'proof', 'polynomial', 'triangle', 'circle', 'algebra', 'geometry', 'calculus'],
            physics: ['force', 'energy', 'motion', 'velocity', 'acceleration', 'mass', 'momentum', 'law', 'wave', 'light'],
            chemistry: ['element', 'compound', 'reaction', 'atom', 'molecule', 'bond', 'acid', 'base', 'solution', 'periodic'],
            biology: ['cell', 'tissue', 'organ', 'species', 'evolution', 'dna', 'gene', 'organism', 'ecology', 'photosynthesis']
        };

        // Statistics
        this.statistics = {
            totalConcepts: 0,
            totalRelationships: 0,
            avgConnectionsPerNode: 0,
            mostConnectedConcept: null,
            subjectDistribution: {
                mathematics: 0,
                physics: 0,
                chemistry: 0,
                biology: 0,
                general: 0
            },
            graphDensity: 0,
            clusterCount: 0
        };

        // Cache for performance
        this.cache = {
            extractedConcepts: new Map(),
            relationshipScores: new Map()
        };
    }

    /**
     * Initialize the Knowledge Graph Manager
     */
    async initialize() {
        console.log('🔬 Initializing Knowledge Graph Manager...');

        try {
            // Load saved graph if exists
            this.loadFromStorage();

            // Initialize UI elements
            this.initializeUI();

            // Set up event listeners
            this.setupEventListeners();

            // Build initial graph from existing data
            if (window.chunkingManager && window.chunkingManager.chunks.length > 0) {
                await this.buildGraphFromChunks(window.chunkingManager.chunks);
            }

            // Render visualization
            this.renderGraph();

            // Update statistics display
            this.updateStatisticsDisplay();

            this.initialized = true;
            console.log('✅ Knowledge Graph Manager initialized successfully!');

            // Notify dashboard
            if (window.dashboardManager) {
                window.dashboardManager.addActivity('project-diagram', 'Knowledge Graph initialized');
            }

            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Knowledge Graph Manager:', error);
            return false;
        }
    }

    /**
     * Initialize UI elements
     */
    initializeUI() {
        // Get main containers
        this.graphContainer = document.getElementById('graphVisualization');
        this.conceptPanel = document.getElementById('conceptDetails');
        this.statsContainer = document.getElementById('graphStats');

        // Create SVG if doesn't exist
        if (this.graphContainer && !this.visualization.svg) {
            this.createSVG();
        }
    }

    /**
     * Create SVG element for graph visualization
     */
    createSVG() {
        const container = this.graphContainer;
        const rect = container.getBoundingClientRect();

        this.visualization.width = rect.width || 800;
        this.visualization.height = rect.height || 600;

        // Clear existing content
        container.innerHTML = '';

        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${this.visualization.width} ${this.visualization.height}`);
        svg.style.border = '1px solid #e0e0e0';
        svg.style.borderRadius = '8px';
        svg.style.background = '#fafafa';

        // Add groups for layering
        const defsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.appendChild(defsGroup);

        const edgesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        edgesGroup.setAttribute('id', 'edges-group');
        svg.appendChild(edgesGroup);

        const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        nodesGroup.setAttribute('id', 'nodes-group');
        svg.appendChild(nodesGroup);

        container.appendChild(svg);
        this.visualization.svg = svg;

        // Add zoom and pan handlers
        this.addInteractionHandlers(svg);
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Visualization mode selector
        const modeSelect = document.getElementById('graphMode');
        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => {
                this.settings.visualizationMode = e.target.value;

                // Clear custom positions when changing layout
                // This allows the new layout algorithm to position all nodes
                this.customPositions.clear();
                this.saveToStorage();

                this.renderGraph();

                console.log(`📐 Layout changed to: ${e.target.value}`);

                // Notify dashboard
                if (window.dashboardManager) {
                    const layoutNames = {
                        'force': 'Force-Directed',
                        'circular': 'Circular',
                        'hierarchy': 'Hierarchical'
                    };
                    window.dashboardManager.addActivity(
                        'project-diagram',
                        `Layout changed to ${layoutNames[e.target.value]}`
                    );
                }
            });
        }

        // Depth level slider
        const depthSlider = document.getElementById('graphDepth');
        if (depthSlider) {
            depthSlider.addEventListener('input', (e) => {
                this.settings.depthLevel = parseInt(e.target.value);
                document.getElementById('depthValue').textContent = e.target.value;
                this.renderGraph();
            });
        }

        // Show labels toggle
        const labelsToggle = document.getElementById('showLabels');
        if (labelsToggle) {
            labelsToggle.addEventListener('change', (e) => {
                this.settings.showLabels = e.target.checked;
                this.renderGraph();
            });
        }

        // Subject filter
        const subjectFilters = document.querySelectorAll('.subject-filter');
        subjectFilters.forEach(filter => {
            filter.addEventListener('change', () => {
                this.renderGraph();
            });
        });

        // Rebuild graph button
        const rebuildBtn = document.getElementById('rebuildGraph');
        if (rebuildBtn) {
            rebuildBtn.addEventListener('click', async () => {
                await this.rebuildGraph();
            });
        }

        // Reset positions button
        const resetPositionsBtn = document.getElementById('resetPositions');
        if (resetPositionsBtn) {
            resetPositionsBtn.addEventListener('click', () => {
                if (confirm('Reset all node positions to default layout?')) {
                    this.resetNodePositions();
                }
            });
        }

        // Export graph button
        const exportBtn = document.getElementById('exportGraph');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportGraph();
            });
        }

        // Zoom controls
        const zoomInBtn = document.getElementById('zoomIn');
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.zoom(1.2);
            });
        }

        const zoomOutBtn = document.getElementById('zoomOut');
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.zoom(0.8);
            });
        }

        const resetViewBtn = document.getElementById('resetView');
        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => {
                this.resetView();
            });
        }

        const fitToScreenBtn = document.getElementById('fitToScreen');
        if (fitToScreenBtn) {
            fitToScreenBtn.addEventListener('click', () => {
                this.fitToScreen();
            });
        }

        const fullscreenBtn = document.getElementById('fullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }

        // Sidebar toggle buttons
        const toggleLeftSidebarBtn = document.getElementById('toggleLeftSidebarBtn');
        const toggleLeftSidebar = document.getElementById('toggleLeftSidebar');
        const leftSidebar = document.getElementById('kgSidebarLeft');

        if (toggleLeftSidebarBtn && leftSidebar) {
            toggleLeftSidebarBtn.addEventListener('click', () => {
                leftSidebar.classList.toggle('collapsed');
            });
        }

        if (toggleLeftSidebar && leftSidebar) {
            toggleLeftSidebar.addEventListener('click', () => {
                leftSidebar.classList.toggle('collapsed');
            });
        }

        // Right sidebar close button
        const closeRightSidebar = document.getElementById('closeRightSidebar');
        const rightSidebar = document.getElementById('kgSidebarRight');

        if (closeRightSidebar && rightSidebar) {
            closeRightSidebar.addEventListener('click', () => {
                rightSidebar.classList.remove('active');
            });
        }

        // Search functionality
        const searchInput = document.getElementById('graphSearch');
        const clearSearch = document.getElementById('clearSearch');
        const searchResults = document.getElementById('searchResults');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
                if (clearSearch) {
                    clearSearch.style.display = e.target.value ? 'block' : 'none';
                }
            });
        }

        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    this.handleSearch('');
                    clearSearch.style.display = 'none';
                }
            });
        }

        // Zoom speed control
        const zoomSpeedSlider = document.getElementById('zoomSpeed');
        if (zoomSpeedSlider) {
            zoomSpeedSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                const speedLabel = document.getElementById('zoomSpeedValue');
                const speeds = ['Slow', 'Normal', 'Fast'];
                if (speedLabel) speedLabel.textContent = speeds[value - 1];

                // Store zoom speed multiplier
                this.settings.zoomSpeed = value === 1 ? 0.05 : value === 2 ? 0.1 : 0.15;
            });
        }

        // Smooth zoom toggle
        const smoothZoomToggle = document.getElementById('smoothZoom');
        if (smoothZoomToggle) {
            smoothZoomToggle.addEventListener('change', (e) => {
                this.settings.smoothZoom = e.target.checked;
            });
        }

        // Export as image button
        const exportImageBtn = document.getElementById('exportGraphImage');
        if (exportImageBtn) {
            exportImageBtn.addEventListener('click', () => {
                this.exportAsImage();
            });
        }

        // Show shortcuts modal
        const showShortcutsBtn = document.getElementById('showShortcuts');
        const shortcutsModal = document.getElementById('shortcutsModal');
        const closeShortcuts = document.getElementById('closeShortcuts');
        const shortcutsOverlay = document.getElementById('shortcutsModalOverlay');

        if (showShortcutsBtn && shortcutsModal) {
            showShortcutsBtn.addEventListener('click', () => {
                shortcutsModal.style.display = 'flex';
            });
        }

        if (closeShortcuts && shortcutsModal) {
            closeShortcuts.addEventListener('click', () => {
                shortcutsModal.style.display = 'none';
            });
        }

        if (shortcutsOverlay && shortcutsModal) {
            shortcutsOverlay.addEventListener('click', () => {
                shortcutsModal.style.display = 'none';
            });
        }
    }

    /**
     * Handle search input
     */
    handleSearch(query) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        if (!query || query.trim() === '') {
            searchResults.style.display = 'none';
            // Clear any highlights
            this.clearSearchHighlights();
            return;
        }

        const results = this.searchNodes(query);

        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">No concepts found</div>';
            searchResults.style.display = 'block';
            return;
        }

        const resultsHTML = results.map(node => {
            const color = this.getNodeColor(node);
            return `
                <div class="search-result-item" data-node-id="${node.id}">
                    <span class="search-result-icon" style="background: ${color}"></span>
                    <span class="search-result-text">${node.label}</span>
                    <span class="search-result-badge">${node.subject}</span>
                </div>
            `;
        }).join('');

        searchResults.innerHTML = resultsHTML;
        searchResults.style.display = 'block';

        // Add click handlers
        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const nodeId = parseInt(item.dataset.nodeId);
                const node = this.graph.nodes.find(n => n.id === nodeId);
                if (node) {
                    this.focusOnNode(node);
                }
            });
        });
    }

    /**
     * Search for nodes by label
     */
    searchNodes(query) {
        const lowerQuery = query.toLowerCase();
        return this.graph.nodes
            .filter(node => node.label.toLowerCase().includes(lowerQuery))
            .slice(0, 10);
    }

    /**
     * Focus on a specific node
     */
    focusOnNode(node) {
        // Calculate node position
        const positions = this.calculateNodePositions([node]);
        const pos = positions.get(node.id);

        if (!pos) return;

        // Center the node in viewport
        const centerX = this.visualization.width / 2;
        const centerY = this.visualization.height / 2;

        this.visualization.pan.x = centerX - pos.x * this.visualization.zoom;
        this.visualization.pan.y = centerY - pos.y * this.visualization.zoom;

        // Zoom in a bit
        if (this.visualization.zoom < 1.5) {
            this.visualization.zoom = 1.5;
        }

        this.applyTransform();
        this.updateZoomIndicator();

        // Show node details
        this.showConceptDetails(node);

        // Highlight the node
        this.highlightNode(node.id);
    }

    /**
     * Highlight a specific node
     */
    highlightNode(nodeId) {
        const allNodes = this.visualization.svg.querySelectorAll('.graph-node');
        allNodes.forEach(nodeEl => {
            const id = parseInt(nodeEl.dataset.nodeId);
            if (id === nodeId) {
                nodeEl.style.filter = 'brightness(1.3)';
                nodeEl.style.transform = 'scale(1.2)';
            } else {
                nodeEl.style.opacity = '0.3';
            }
        });

        // Clear highlight after 2 seconds
        setTimeout(() => {
            this.clearSearchHighlights();
        }, 2000);
    }

    /**
     * Clear search highlights
     */
    clearSearchHighlights() {
        const allNodes = this.visualization.svg.querySelectorAll('.graph-node');
        allNodes.forEach(nodeEl => {
            nodeEl.style.filter = '';
            nodeEl.style.transform = '';
            nodeEl.style.opacity = '';
        });
    }

    /**
     * Export graph as image (PNG)
     */
    async exportAsImage() {
        try {
            const svg = this.visualization.svg;
            if (!svg) {
                console.error('No SVG to export');
                return;
            }

            // Clone the SVG
            const svgClone = svg.cloneNode(true);

            // Get SVG string
            const svgString = new XMLSerializer().serializeToString(svgClone);

            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = this.visualization.width * 2; // 2x for better quality
            canvas.height = this.visualization.height * 2;
            const ctx = canvas.getContext('2d');

            // Create image from SVG
            const img = new Image();
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            img.onload = () => {
                // Draw white background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw image
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Convert to PNG
                canvas.toBlob((blob) => {
                    const downloadUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = `knowledge-graph-${Date.now()}.png`;
                    a.click();

                    URL.revokeObjectURL(downloadUrl);
                    URL.revokeObjectURL(url);

                    // Notify user
                    if (window.dashboardManager) {
                        window.dashboardManager.addActivity('image', 'Graph exported as image');
                    }
                });
            };

            img.src = url;

        } catch (error) {
            console.error('Failed to export graph as image:', error);
            alert('Failed to export graph as image. Please try again.');
        }
    }

    /**
     * Zoom the graph
     */
    zoom(factor) {
        this.visualization.zoom *= factor;
        this.visualization.zoom = Math.max(0.1, Math.min(5, this.visualization.zoom));
        this.applyTransform();
        this.updateZoomIndicator();
    }

    /**
     * Reset view to default
     */
    resetView() {
        this.visualization.zoom = 1;
        this.visualization.pan = { x: 0, y: 0 };
        this.applyTransform();
        this.updateZoomIndicator();
    }

    /**
     * Fit graph to screen
     */
    fitToScreen() {
        // Calculate bounding box of all nodes
        if (this.graph.nodes.length === 0) return;

        const positions = this.calculateNodePositions(this.graph.nodes);
        const posArray = Array.from(positions.values());

        if (posArray.length === 0) return;

        const minX = Math.min(...posArray.map(p => p.x));
        const maxX = Math.max(...posArray.map(p => p.x));
        const minY = Math.min(...posArray.map(p => p.y));
        const maxY = Math.max(...posArray.map(p => p.y));

        const padding = 50;
        const graphWidth = maxX - minX + 2 * padding;
        const graphHeight = maxY - minY + 2 * padding;

        const scaleX = this.visualization.width / graphWidth;
        const scaleY = this.visualization.height / graphHeight;

        this.visualization.zoom = Math.min(scaleX, scaleY, 1);
        this.visualization.pan = {
            x: (this.visualization.width - (minX + maxX) * this.visualization.zoom) / 2,
            y: (this.visualization.height - (minY + maxY) * this.visualization.zoom) / 2
        };

        this.applyTransform();
        this.updateZoomIndicator();
    }

    /**
     * Update zoom indicator display
     */
    updateZoomIndicator() {
        const zoomIndicator = document.getElementById('zoomIndicator');
        if (zoomIndicator) {
            const percentage = Math.round(this.visualization.zoom * 100);
            zoomIndicator.textContent = `${percentage}%`;
        }
    }

    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        const graphCanvas = document.getElementById('graphVisualization');
        if (!graphCanvas) return;

        if (!document.fullscreenElement) {
            graphCanvas.requestFullscreen().catch(err => {
                console.error('Error entering fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * Apply zoom and pan transform
     */
    applyTransform() {
        if (!this.visualization.svg) return;

        const nodesGroup = this.visualization.svg.querySelector('#nodes-group');
        const edgesGroup = this.visualization.svg.querySelector('#edges-group');

        const transform = `translate(${this.visualization.pan.x}, ${this.visualization.pan.y}) scale(${this.visualization.zoom})`;

        if (nodesGroup) nodesGroup.setAttribute('transform', transform);
        if (edgesGroup) edgesGroup.setAttribute('transform', transform);
    }

    /**
     * Build graph from chunks
     */
    async buildGraphFromChunks(chunks) {
        console.log(`🔨 Building knowledge graph from ${chunks.length} chunks...`);

        // Reset graph
        this.graph.nodes = [];
        this.graph.edges = [];

        // Extract concepts from all chunks
        const allConcepts = [];

        for (const chunk of chunks) {
            const concepts = this.extractConcepts(chunk.text);
            concepts.forEach(concept => {
                concept.source = chunk.id;
                concept.sourceText = chunk.text.substring(0, 200);
                allConcepts.push(concept);
            });
        }

        // Deduplicate and merge concepts
        const conceptMap = new Map();

        for (const concept of allConcepts) {
            const key = concept.text.toLowerCase();

            if (conceptMap.has(key)) {
                const existing = conceptMap.get(key);
                existing.frequency += concept.frequency;
                existing.sources = existing.sources || [];
                existing.sources.push(concept.source);
            } else {
                concept.sources = [concept.source];
                conceptMap.set(key, concept);
            }
        }

        // Convert to nodes
        let nodeId = 0;
        for (const [key, concept] of conceptMap.entries()) {
            this.graph.nodes.push({
                id: nodeId++,
                label: concept.text,
                type: concept.type,
                subject: concept.subject,
                frequency: concept.frequency,
                importance: this.calculateImportance(concept),
                sources: concept.sources,
                sourceText: concept.sourceText
            });
        }

        // Limit nodes if too many
        if (this.graph.nodes.length > this.settings.maxNodes) {
            this.graph.nodes.sort((a, b) => b.importance - a.importance);
            this.graph.nodes = this.graph.nodes.slice(0, this.settings.maxNodes);
        }

        // Build relationships
        this.buildRelationships(chunks);

        // Calculate statistics
        this.calculateStatistics();

        // Save to storage
        this.saveToStorage();

        console.log(`✅ Built graph with ${this.graph.nodes.length} nodes and ${this.graph.edges.length} edges`);
    }

    /**
     * Extract concepts from text
     */
    extractConcepts(text) {
        const concepts = [];
        const words = text.toLowerCase().split(/\s+/);

        // Check cache
        const cacheKey = text.substring(0, 100);
        if (this.cache.extractedConcepts.has(cacheKey)) {
            return this.cache.extractedConcepts.get(cacheKey);
        }

        // Extract concepts from each category
        for (const [subject, keywords] of Object.entries(this.categories)) {
            for (const keyword of keywords) {
                const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
                const matches = text.match(regex);

                if (matches) {
                    concepts.push({
                        text: matches[0],
                        type: 'concept',
                        subject: subject,
                        frequency: matches.length
                    });
                }
            }
        }

        // Extract capitalized terms (potential proper nouns/concepts)
        const capitalizedRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
        const capitalizedMatches = text.match(capitalizedRegex);

        if (capitalizedMatches) {
            for (const match of capitalizedMatches) {
                if (match.length > 3 && !this.isCommonWord(match)) {
                    concepts.push({
                        text: match,
                        type: 'entity',
                        subject: this.inferSubject(match),
                        frequency: 1
                    });
                }
            }
        }

        // Cache results
        this.cache.extractedConcepts.set(cacheKey, concepts);

        return concepts;
    }

    /**
     * Build relationships between concepts
     */
    buildRelationships(chunks) {
        const edges = [];

        // Build co-occurrence matrix
        for (const chunk of chunks) {
            const chunkNodes = this.graph.nodes.filter(node =>
                chunk.text.toLowerCase().includes(node.label.toLowerCase())
            );

            // Create edges between co-occurring concepts
            for (let i = 0; i < chunkNodes.length; i++) {
                for (let j = i + 1; j < chunkNodes.length; j++) {
                    const node1 = chunkNodes[i];
                    const node2 = chunkNodes[j];

                    // Calculate relationship strength
                    const strength = this.calculateRelationshipStrength(
                        node1, node2, chunk.text
                    );

                    if (strength >= this.settings.minRelationshipStrength) {
                        // Check if edge already exists
                        const existingEdge = edges.find(e =>
                            (e.source === node1.id && e.target === node2.id) ||
                            (e.source === node2.id && e.target === node1.id)
                        );

                        if (existingEdge) {
                            existingEdge.strength += strength;
                            existingEdge.cooccurrences++;
                        } else {
                            edges.push({
                                source: node1.id,
                                target: node2.id,
                                strength: strength,
                                type: 'cooccurrence',
                                cooccurrences: 1
                            });
                        }
                    }
                }
            }
        }

        this.graph.edges = edges;
    }

    /**
     * Calculate relationship strength between two concepts
     */
    calculateRelationshipStrength(node1, node2, context) {
        let strength = 0;

        // Base strength from co-occurrence
        strength += 0.3;

        // Bonus if same subject
        if (node1.subject === node2.subject) {
            strength += 0.2;
        }

        // Bonus based on proximity in text
        const text = context.toLowerCase();
        const pos1 = text.indexOf(node1.label.toLowerCase());
        const pos2 = text.indexOf(node2.label.toLowerCase());

        if (pos1 !== -1 && pos2 !== -1) {
            const distance = Math.abs(pos1 - pos2);
            if (distance < 50) strength += 0.3;
            else if (distance < 100) strength += 0.2;
            else if (distance < 200) strength += 0.1;
        }

        return Math.min(strength, 1.0);
    }

    /**
     * Calculate importance score for a concept
     */
    calculateImportance(concept) {
        let score = 0;

        // Frequency contributes to importance
        score += Math.min(concept.frequency * 0.2, 0.5);

        // Concept type weight
        if (concept.type === 'concept') score += 0.3;
        else if (concept.type === 'entity') score += 0.2;

        // Subject-specific keywords are more important
        score += 0.2;

        return Math.min(score, 1.0);
    }

    /**
     * Render the graph visualization
     */
    renderGraph() {
        if (!this.visualization.svg || this.graph.nodes.length === 0) {
            this.showEmptyState();
            return;
        }

        console.log('🎨 Rendering knowledge graph...');

        // Clear previous render
        const nodesGroup = this.visualization.svg.querySelector('#nodes-group');
        const edgesGroup = this.visualization.svg.querySelector('#edges-group');

        nodesGroup.innerHTML = '';
        edgesGroup.innerHTML = '';

        // Apply subject filters
        const activeSubjects = this.getActiveSubjectFilters();
        const filteredNodes = this.graph.nodes.filter(node =>
            activeSubjects.includes(node.subject)
        );

        // Calculate positions based on visualization mode
        const positions = this.calculateNodePositions(filteredNodes);

        // Draw edges first (so they appear under nodes)
        this.drawEdges(edgesGroup, filteredNodes, positions);

        // Draw nodes
        this.drawNodes(nodesGroup, filteredNodes, positions);

        console.log('✅ Graph rendered successfully');
    }

    /**
     * Calculate node positions based on visualization mode
     */
    calculateNodePositions(nodes) {
        const positions = new Map();
        const width = this.visualization.width;
        const height = this.visualization.height;
        const padding = 50;

        // Get base layout
        let basePositions;
        switch (this.settings.visualizationMode) {
            case 'force':
                basePositions = this.forceDirectedLayout(nodes, width, height, padding);
                break;

            case 'circular':
                basePositions = this.circularLayout(nodes, width, height, padding);
                break;

            case 'hierarchy':
                basePositions = this.hierarchicalLayout(nodes, width, height, padding);
                break;

            default:
                basePositions = this.forceDirectedLayout(nodes, width, height, padding);
        }

        // Override with custom positions if available
        nodes.forEach(node => {
            if (this.customPositions.has(node.id)) {
                basePositions.set(node.id, this.customPositions.get(node.id));
            }
        });

        return basePositions;
    }

    /**
     * Force-directed layout algorithm (simplified)
     */
    forceDirectedLayout(nodes, width, height, padding) {
        const positions = new Map();

        // Initialize random positions
        nodes.forEach(node => {
            positions.set(node.id, {
                x: padding + Math.random() * (width - 2 * padding),
                y: padding + Math.random() * (height - 2 * padding)
            });
        });

        // Simulate force-directed placement (simplified)
        const iterations = 50;
        const repulsionStrength = 100;
        const attractionStrength = 0.1;

        for (let iter = 0; iter < iterations; iter++) {
            const forces = new Map();

            // Initialize forces
            nodes.forEach(node => {
                forces.set(node.id, { x: 0, y: 0 });
            });

            // Repulsion between all nodes
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const node1 = nodes[i];
                    const node2 = nodes[j];

                    const pos1 = positions.get(node1.id);
                    const pos2 = positions.get(node2.id);

                    const dx = pos2.x - pos1.x;
                    const dy = pos2.y - pos1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;

                    const force = repulsionStrength / (distance * distance);

                    const fx = (dx / distance) * force;
                    const fy = (dy / distance) * force;

                    forces.get(node1.id).x -= fx;
                    forces.get(node1.id).y -= fy;
                    forces.get(node2.id).x += fx;
                    forces.get(node2.id).y += fy;
                }
            }

            // Attraction along edges
            this.graph.edges.forEach(edge => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);

                if (sourceNode && targetNode) {
                    const pos1 = positions.get(edge.source);
                    const pos2 = positions.get(edge.target);

                    const dx = pos2.x - pos1.x;
                    const dy = pos2.y - pos1.y;

                    const fx = dx * attractionStrength * edge.strength;
                    const fy = dy * attractionStrength * edge.strength;

                    forces.get(edge.source).x += fx;
                    forces.get(edge.source).y += fy;
                    forces.get(edge.target).x -= fx;
                    forces.get(edge.target).y -= fy;
                }
            });

            // Apply forces
            nodes.forEach(node => {
                const pos = positions.get(node.id);
                const force = forces.get(node.id);

                pos.x += force.x;
                pos.y += force.y;

                // Keep within bounds
                pos.x = Math.max(padding, Math.min(width - padding, pos.x));
                pos.y = Math.max(padding, Math.min(height - padding, pos.y));
            });
        }

        return positions;
    }

    /**
     * Circular layout
     */
    circularLayout(nodes, width, height, padding) {
        const positions = new Map();
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - padding;

        nodes.forEach((node, index) => {
            const angle = (2 * Math.PI * index) / nodes.length;
            positions.set(node.id, {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            });
        });

        return positions;
    }

    /**
     * Hierarchical layout
     */
    hierarchicalLayout(nodes, width, height, padding) {
        const positions = new Map();

        // Group by subject
        const subjectGroups = {};
        nodes.forEach(node => {
            if (!subjectGroups[node.subject]) {
                subjectGroups[node.subject] = [];
            }
            subjectGroups[node.subject].push(node);
        });

        const subjects = Object.keys(subjectGroups);
        const levelHeight = (height - 2 * padding) / subjects.length;

        subjects.forEach((subject, levelIndex) => {
            const levelNodes = subjectGroups[subject];
            const levelWidth = (width - 2 * padding) / (levelNodes.length + 1);

            levelNodes.forEach((node, nodeIndex) => {
                positions.set(node.id, {
                    x: padding + levelWidth * (nodeIndex + 1),
                    y: padding + levelHeight * (levelIndex + 0.5)
                });
            });
        });

        return positions;
    }

    /**
     * Draw edges
     */
    drawEdges(group, nodes, positions) {
        const nodeIds = new Set(nodes.map(n => n.id));

        this.graph.edges.forEach((edge, index) => {
            // Only draw if both nodes are visible
            if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
                return;
            }

            const pos1 = positions.get(edge.source);
            const pos2 = positions.get(edge.target);

            if (!pos1 || !pos2) return;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', pos1.x);
            line.setAttribute('y1', pos1.y);
            line.setAttribute('x2', pos2.x);
            line.setAttribute('y2', pos2.y);
            line.setAttribute('stroke', '#ccc');
            line.setAttribute('stroke-width', Math.max(0.5, edge.strength * 3));
            line.setAttribute('stroke-opacity', 0.6);

            // Add data attributes for edge identification
            line.setAttribute('data-edge-index', index);
            line.setAttribute('data-source-id', edge.source);
            line.setAttribute('data-target-id', edge.target);
            line.setAttribute('class', 'graph-edge');

            group.appendChild(line);
        });
    }

    /**
     * Draw nodes
     */
    drawNodes(group, nodes, positions) {
        nodes.forEach(node => {
            const pos = positions.get(node.id);
            if (!pos) return;

            // Calculate node size
            const connections = this.getNodeConnections(node.id);
            let radius = 5;

            if (this.settings.nodeSize === 'connections') {
                radius = 5 + Math.min(connections * 2, 20);
            } else if (this.settings.nodeSize === 'importance') {
                radius = 5 + node.importance * 20;
            }

            // Get node color
            const color = this.getNodeColor(node);

            // Create node group
            const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            nodeGroup.setAttribute('class', 'graph-node');
            nodeGroup.setAttribute('data-node-id', node.id);

            // Draw circle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', pos.x);
            circle.setAttribute('cy', pos.y);
            circle.setAttribute('r', radius);
            circle.setAttribute('fill', color);
            circle.setAttribute('stroke', '#fff');
            circle.setAttribute('stroke-width', 2);
            circle.style.cursor = 'pointer';

            nodeGroup.appendChild(circle);

            // Draw label if enabled
            if (this.settings.showLabels) {
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('x', pos.x);
                label.setAttribute('y', pos.y + radius + 15);
                label.setAttribute('text-anchor', 'middle');
                label.setAttribute('font-size', '12px');
                label.setAttribute('fill', '#333');
                label.textContent = node.label;

                nodeGroup.appendChild(label);
            }

            // Add event listeners
            nodeGroup.addEventListener('mouseenter', () => this.onNodeHover(node, nodeGroup));
            nodeGroup.addEventListener('mouseleave', () => this.onNodeLeave(node, nodeGroup));

            // Add drag handlers
            this.addNodeDragHandlers(nodeGroup, node, circle, positions);

            group.appendChild(nodeGroup);
        });

        // Store current positions for dragging
        this.currentNodePositions = positions;
    }

    /**
     * Add drag handlers to node
     */
    addNodeDragHandlers(nodeGroup, node, circle, positions) {
        let isDragging = false;
        let startX, startY;
        let originalX, originalY;
        let animationFrameId = null;

        const onMouseDown = (e) => {
            e.stopPropagation(); // Prevent canvas panning
            isDragging = true;
            this.visualization.isDraggingNode = true;
            this.visualization.draggedNode = node;

            // Get current position
            const pos = positions.get(node.id);
            originalX = pos.x;
            originalY = pos.y;

            // Get mouse position in graph coordinates (accounting for zoom and pan)
            const rect = this.graphContainer.getBoundingClientRect();
            startX = (e.clientX - rect.left - this.visualization.pan.x) / this.visualization.zoom;
            startY = (e.clientY - rect.top - this.visualization.pan.y) / this.visualization.zoom;

            // Change cursor
            nodeGroup.style.cursor = 'grabbing';
            circle.setAttribute('stroke-width', 3);

            // Add highlight class to connected edges
            this.highlightConnectedEdges(node.id, true);
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;
            e.stopPropagation();

            // Cancel previous animation frame if exists
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }

            // Use requestAnimationFrame for smooth updates
            animationFrameId = requestAnimationFrame(() => {
                // Calculate new position in graph coordinates
                const rect = this.graphContainer.getBoundingClientRect();
                const mouseX = (e.clientX - rect.left - this.visualization.pan.x) / this.visualization.zoom;
                const mouseY = (e.clientY - rect.top - this.visualization.pan.y) / this.visualization.zoom;

                const deltaX = mouseX - startX;
                const deltaY = mouseY - startY;

                const newX = originalX + deltaX;
                const newY = originalY + deltaY;

                // Update position
                positions.set(node.id, { x: newX, y: newY });
                this.currentNodePositions.set(node.id, { x: newX, y: newY });

                // Update node visual position
                circle.setAttribute('cx', newX);
                circle.setAttribute('cy', newY);

                // Update label if exists
                const label = nodeGroup.querySelector('text');
                if (label) {
                    const radius = parseFloat(circle.getAttribute('r'));
                    label.setAttribute('x', newX);
                    label.setAttribute('y', newY + radius + 15);
                }

                // Update connected edges
                this.updateEdgesForNode(node.id);
            });
        };

        const onMouseUp = (e) => {
            if (!isDragging) return;
            e.stopPropagation();

            // Cancel any pending animation frame
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }

            isDragging = false;
            this.visualization.isDraggingNode = false;

            // Store custom position
            const pos = positions.get(node.id);
            this.customPositions.set(node.id, { x: pos.x, y: pos.y });

            // Save to storage
            this.saveToStorage();

            // Reset cursor
            nodeGroup.style.cursor = 'pointer';
            circle.setAttribute('stroke-width', 2);

            // Remove highlight from connected edges
            this.highlightConnectedEdges(node.id, false);

            // Click event (if not moved much)
            const pos2 = positions.get(node.id);
            const distance = Math.sqrt(
                Math.pow(pos2.x - originalX, 2) +
                Math.pow(pos2.y - originalY, 2)
            );

            if (distance < 5) {
                // Was a click, not a drag
                this.onNodeClick(node);
            }

            this.visualization.draggedNode = null;
        };

        // Add event listeners
        nodeGroup.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    /**
     * Update edges connected to a specific node
     */
    updateEdgesForNode(nodeId) {
        const edgesGroup = this.visualization.svg.querySelector('#edges-group');
        if (!edgesGroup) return;

        // Find all edges connected to this node using data attributes
        const lines = edgesGroup.querySelectorAll('.graph-edge');

        lines.forEach(line => {
            const sourceId = parseInt(line.getAttribute('data-source-id'));
            const targetId = parseInt(line.getAttribute('data-target-id'));

            // Check if this edge is connected to the dragged node
            if (sourceId === nodeId || targetId === nodeId) {
                const sourcePos = this.currentNodePositions.get(sourceId);
                const targetPos = this.currentNodePositions.get(targetId);

                if (sourcePos && targetPos) {
                    // Update edge endpoints
                    line.setAttribute('x1', sourcePos.x);
                    line.setAttribute('y1', sourcePos.y);
                    line.setAttribute('x2', targetPos.x);
                    line.setAttribute('y2', targetPos.y);
                }
            }
        });
    }

    /**
     * Highlight edges connected to a node during drag
     */
    highlightConnectedEdges(nodeId, highlight) {
        const edgesGroup = this.visualization.svg.querySelector('#edges-group');
        if (!edgesGroup) return;

        const lines = edgesGroup.querySelectorAll('.graph-edge');

        lines.forEach(line => {
            const sourceId = parseInt(line.getAttribute('data-source-id'));
            const targetId = parseInt(line.getAttribute('data-target-id'));

            // Check if this edge is connected to the dragged node
            if (sourceId === nodeId || targetId === nodeId) {
                if (highlight) {
                    line.setAttribute('stroke', '#3b82f6');
                    line.setAttribute('stroke-opacity', 0.8);
                    const currentWidth = parseFloat(line.getAttribute('stroke-width'));
                    line.setAttribute('stroke-width', currentWidth * 1.5);
                    line.setAttribute('data-was-highlighted', 'true');
                } else {
                    line.setAttribute('stroke', '#ccc');
                    line.setAttribute('stroke-opacity', 0.6);
                    if (line.getAttribute('data-was-highlighted') === 'true') {
                        const currentWidth = parseFloat(line.getAttribute('stroke-width'));
                        line.setAttribute('stroke-width', currentWidth / 1.5);
                        line.removeAttribute('data-was-highlighted');
                    }
                }
            }
        });
    }

    /**
     * Get node color based on color scheme
     */
    getNodeColor(node) {
        if (this.settings.colorScheme === 'subject') {
            const colors = {
                mathematics: '#3b82f6',
                physics: '#10b981',
                chemistry: '#f59e0b',
                biology: '#8b5cf6',
                general: '#6b7280'
            };
            return colors[node.subject] || colors.general;
        } else if (this.settings.colorScheme === 'importance') {
            const intensity = Math.floor(node.importance * 255);
            return `rgb(${255 - intensity}, ${intensity}, 100)`;
        }

        return '#3b82f6';
    }

    /**
     * Get number of connections for a node
     */
    getNodeConnections(nodeId) {
        return this.graph.edges.filter(edge =>
            edge.source === nodeId || edge.target === nodeId
        ).length;
    }

    /**
     * Handle node click
     */
    onNodeClick(node) {
        this.visualization.selectedNode = node;
        this.showConceptDetails(node);

        // Highlight connected nodes
        this.highlightConnections(node);
    }

    /**
     * Handle node hover
     */
    onNodeHover(node, element) {
        this.visualization.hoveredNode = node;

        // Show tooltip
        element.style.opacity = '0.8';
    }

    /**
     * Handle node leave
     */
    onNodeLeave(node, element) {
        this.visualization.hoveredNode = null;
        element.style.opacity = '1';
    }

    /**
     * Show concept details in side panel
     */
    showConceptDetails(node) {
        if (!this.conceptPanel) return;

        // Show the right sidebar
        const rightSidebar = document.getElementById('kgSidebarRight');
        if (rightSidebar) {
            rightSidebar.classList.add('active');
        }

        const connections = this.getNodeConnections(node.id);
        const connectedNodes = this.getConnectedNodes(node.id);

        this.conceptPanel.innerHTML = `
            <div class="concept-header">
                <h3>${node.label}</h3>
                <span class="concept-badge ${node.subject}">${node.subject}</span>
            </div>

            <div class="concept-stats">
                <div class="stat-item">
                    <span class="stat-label">Connections:</span>
                    <span class="stat-value">${connections}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Importance:</span>
                    <span class="stat-value">${(node.importance * 100).toFixed(0)}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Frequency:</span>
                    <span class="stat-value">${node.frequency}</span>
                </div>
            </div>

            <div class="connected-concepts">
                <h4>Connected Concepts:</h4>
                <ul>
                    ${connectedNodes.map(n => `
                        <li class="connected-item" data-node-id="${n.id}">
                            <span class="concept-dot" style="background: ${this.getNodeColor(n)}"></span>
                            ${n.label}
                        </li>
                    `).join('')}
                </ul>
            </div>

            <div class="concept-actions">
                <button onclick="window.knowledgeGraphManager.exploreInRAG('${node.label}')" class="btn-secondary">
                    <i class="fas fa-search"></i> Explore in RAG Chat
                </button>
            </div>
        `;

        // Add click handlers for connected concepts
        this.conceptPanel.querySelectorAll('.connected-item').forEach(item => {
            item.addEventListener('click', () => {
                const nodeId = parseInt(item.dataset.nodeId);
                const connectedNode = this.graph.nodes.find(n => n.id === nodeId);
                if (connectedNode) {
                    this.onNodeClick(connectedNode);
                }
            });
        });
    }

    /**
     * Get connected nodes
     */
    getConnectedNodes(nodeId) {
        const connectedIds = new Set();

        this.graph.edges.forEach(edge => {
            if (edge.source === nodeId) connectedIds.add(edge.target);
            if (edge.target === nodeId) connectedIds.add(edge.source);
        });

        return this.graph.nodes.filter(n => connectedIds.has(n.id));
    }

    /**
     * Highlight node connections
     */
    highlightConnections(node) {
        const connectedIds = this.getConnectedNodes(node.id).map(n => n.id);

        // Fade out non-connected nodes
        const allNodes = this.visualization.svg.querySelectorAll('.graph-node');
        allNodes.forEach(nodeEl => {
            const nodeId = parseInt(nodeEl.dataset.nodeId);
            if (nodeId !== node.id && !connectedIds.includes(nodeId)) {
                nodeEl.style.opacity = '0.2';
            } else {
                nodeEl.style.opacity = '1';
            }
        });
    }

    /**
     * Explore concept in RAG Chat
     */
    exploreInRAG(concept) {
        if (window.ragChatManager) {
            // Switch to RAG Chat tab
            const ragTab = document.querySelector('[data-tab="rag-chat"]');
            if (ragTab) ragTab.click();

            // Fill in query
            const queryInput = document.getElementById('userQuery');
            if (queryInput) {
                queryInput.value = `Explain ${concept}`;

                // Trigger query
                setTimeout(() => {
                    const sendBtn = document.getElementById('sendQuery');
                    if (sendBtn) sendBtn.click();
                }, 300);
            }
        }
    }

    /**
     * Get active subject filters
     */
    getActiveSubjectFilters() {
        const filters = document.querySelectorAll('.subject-filter:checked');
        if (filters.length === 0) {
            return ['mathematics', 'physics', 'chemistry', 'biology', 'general'];
        }
        return Array.from(filters).map(f => f.value);
    }

    /**
     * Calculate statistics
     */
    calculateStatistics() {
        this.statistics.totalConcepts = this.graph.nodes.length;
        this.statistics.totalRelationships = this.graph.edges.length;

        // Average connections
        if (this.graph.nodes.length > 0) {
            const totalConnections = this.graph.nodes.reduce((sum, node) =>
                sum + this.getNodeConnections(node.id), 0
            );
            this.statistics.avgConnectionsPerNode = totalConnections / this.graph.nodes.length;
        }

        // Most connected concept
        let maxConnections = 0;
        let mostConnected = null;

        this.graph.nodes.forEach(node => {
            const connections = this.getNodeConnections(node.id);
            if (connections > maxConnections) {
                maxConnections = connections;
                mostConnected = node;
            }
        });

        this.statistics.mostConnectedConcept = mostConnected;

        // Subject distribution
        const distribution = {
            mathematics: 0,
            physics: 0,
            chemistry: 0,
            biology: 0,
            general: 0
        };

        this.graph.nodes.forEach(node => {
            distribution[node.subject] = (distribution[node.subject] || 0) + 1;
        });

        this.statistics.subjectDistribution = distribution;

        // Graph density
        const maxEdges = (this.graph.nodes.length * (this.graph.nodes.length - 1)) / 2;
        this.statistics.graphDensity = maxEdges > 0 ? this.graph.edges.length / maxEdges : 0;
    }

    /**
     * Update statistics display
     */
    updateStatisticsDisplay() {
        // Total concepts
        const totalConceptsEl = document.getElementById('totalConcepts');
        if (totalConceptsEl) {
            totalConceptsEl.textContent = this.statistics.totalConcepts;
        }

        // Total relationships
        const totalRelationshipsEl = document.getElementById('totalRelationships');
        if (totalRelationshipsEl) {
            totalRelationshipsEl.textContent = this.statistics.totalRelationships;
        }

        // Average connections
        const avgConnectionsEl = document.getElementById('avgConnections');
        if (avgConnectionsEl) {
            avgConnectionsEl.textContent = this.statistics.avgConnectionsPerNode.toFixed(1);
        }

        // Graph density
        const graphDensityEl = document.getElementById('graphDensity');
        if (graphDensityEl) {
            graphDensityEl.textContent = (this.statistics.graphDensity * 100).toFixed(1) + '%';
        }
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        if (!this.graphContainer) return;

        this.graphContainer.innerHTML = `
            <div class="empty-state" style="height: 100%;">
                <i class="fas fa-project-diagram"></i>
                <p style="font-size: 16px; margin-bottom: 8px; font-weight: 500;">No knowledge graph available</p>
                <p style="font-size: 14px; opacity: 0.7;">Build a graph from your chunked documents</p>
                <button onclick="window.knowledgeGraphManager.rebuildGraph()" class="btn-primary" style="margin-top: 20px;">
                    <i class="fas fa-sync-alt"></i> Build Graph
                </button>
            </div>
        `;
    }

    /**
     * Rebuild graph from current chunks
     */
    async rebuildGraph() {
        if (!window.chunkingManager || window.chunkingManager.chunks.length === 0) {
            alert('No chunks available. Please chunk some documents first in the Smart Chunking tab.');
            return;
        }

        console.log('🔄 Rebuilding knowledge graph...');

        await this.buildGraphFromChunks(window.chunkingManager.chunks);
        this.renderGraph();
        this.updateStatisticsDisplay();

        // Notify dashboard
        if (window.dashboardManager) {
            window.dashboardManager.addActivity('sync', 'Knowledge graph rebuilt');
        }

        console.log('✅ Knowledge graph rebuilt successfully!');
    }

    /**
     * Add interaction handlers for zoom and pan
     */
    addInteractionHandlers(svg) {
        let isPanning = false;
        let startX, startY;
        const graphCanvas = document.getElementById('graphVisualization');

        // Mouse down - start panning
        const onMouseDown = (e) => {
            if (e.button !== 0) return; // Only left mouse button
            if (this.visualization.isDraggingNode) return; // Don't pan when dragging node
            isPanning = true;
            startX = e.clientX - this.visualization.pan.x;
            startY = e.clientY - this.visualization.pan.y;
            if (graphCanvas) graphCanvas.style.cursor = 'grabbing';
        };

        // Mouse move - pan
        const onMouseMove = (e) => {
            if (isPanning && !this.visualization.isDraggingNode) {
                this.visualization.pan.x = e.clientX - startX;
                this.visualization.pan.y = e.clientY - startY;
                this.applyTransform();
            }
        };

        // Mouse up - stop panning
        const onMouseUp = () => {
            isPanning = false;
            if (graphCanvas) graphCanvas.style.cursor = 'grab';
        };

        // Mouse wheel - zoom to cursor position
        const onWheel = (e) => {
            e.preventDefault();

            // Get mouse position relative to graph canvas
            const rect = graphCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Calculate zoom factor (smooth zooming)
            const zoomSpeed = 0.1;
            const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
            const newZoom = this.visualization.zoom * (1 + delta);

            // Clamp zoom level
            const clampedZoom = Math.max(0.1, Math.min(5, newZoom));

            // Calculate new pan to zoom to cursor position
            const zoomRatio = clampedZoom / this.visualization.zoom;
            this.visualization.pan.x = mouseX - (mouseX - this.visualization.pan.x) * zoomRatio;
            this.visualization.pan.y = mouseY - (mouseY - this.visualization.pan.y) * zoomRatio;

            this.visualization.zoom = clampedZoom;
            this.applyTransform();
            this.updateZoomIndicator();
        };

        // Add event listeners
        graphCanvas.addEventListener('mousedown', onMouseDown);
        graphCanvas.addEventListener('mousemove', onMouseMove);
        graphCanvas.addEventListener('mouseup', onMouseUp);
        graphCanvas.addEventListener('mouseleave', onMouseUp);
        graphCanvas.addEventListener('wheel', onWheel, { passive: false });

        // Touch support for mobile
        let lastTouchDistance = 0;

        const onTouchStart = (e) => {
            if (e.touches.length === 1) {
                // Single touch - pan
                isPanning = true;
                startX = e.touches[0].clientX - this.visualization.pan.x;
                startY = e.touches[0].clientY - this.visualization.pan.y;
            } else if (e.touches.length === 2) {
                // Two touches - pinch zoom
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
            }
        };

        const onTouchMove = (e) => {
            e.preventDefault();

            if (e.touches.length === 1 && isPanning) {
                // Pan
                this.visualization.pan.x = e.touches[0].clientX - startX;
                this.visualization.pan.y = e.touches[0].clientY - startY;
                this.applyTransform();
            } else if (e.touches.length === 2) {
                // Pinch zoom
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (lastTouchDistance > 0) {
                    const zoomRatio = distance / lastTouchDistance;
                    this.zoom(zoomRatio);
                }

                lastTouchDistance = distance;
            }
        };

        const onTouchEnd = () => {
            isPanning = false;
            lastTouchDistance = 0;
        };

        graphCanvas.addEventListener('touchstart', onTouchStart, { passive: false });
        graphCanvas.addEventListener('touchmove', onTouchMove, { passive: false });
        graphCanvas.addEventListener('touchend', onTouchEnd);
        graphCanvas.addEventListener('touchcancel', onTouchEnd);

        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when graph is visible
            const graphSection = document.getElementById('knowledge');
            if (!graphSection || !graphSection.classList.contains('active')) return;

            switch(e.key) {
                case '+':
                case '=':
                    e.preventDefault();
                    this.zoom(1.2);
                    break;
                case '-':
                case '_':
                    e.preventDefault();
                    this.zoom(0.8);
                    break;
                case '0':
                    e.preventDefault();
                    this.resetView();
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    this.fitToScreen();
                    break;
                case 'Escape':
                    // Close right sidebar if open
                    const rightSidebar = document.getElementById('kgSidebarRight');
                    if (rightSidebar) {
                        rightSidebar.classList.remove('active');
                    }
                    break;
                case '/':
                    e.preventDefault();
                    // Focus search if available
                    const searchInput = document.getElementById('graphSearch');
                    if (searchInput) searchInput.focus();
                    break;
            }
        });
    }

    /**
     * Export graph data
     */
    exportGraph() {
        const data = {
            nodes: this.graph.nodes,
            edges: this.graph.edges,
            statistics: this.statistics,
            settings: this.settings,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `knowledge-graph-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);

        console.log('📥 Knowledge graph exported');

        // Notify dashboard
        if (window.dashboardManager) {
            window.dashboardManager.addActivity('download', 'Knowledge graph exported');
        }
    }

    /**
     * Helper: Check if word is common
     */
    isCommonWord(word) {
        const common = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        return common.includes(word.toLowerCase());
    }

    /**
     * Helper: Infer subject from concept
     */
    inferSubject(concept) {
        const lower = concept.toLowerCase();

        for (const [subject, keywords] of Object.entries(this.categories)) {
            for (const keyword of keywords) {
                if (lower.includes(keyword)) {
                    return subject;
                }
            }
        }

        return 'general';
    }

    /**
     * Save to localStorage
     */
    saveToStorage() {
        try {
            // Convert Map to array for JSON serialization
            const customPositionsArray = Array.from(this.customPositions.entries());

            const data = {
                graph: this.graph,
                settings: this.settings,
                statistics: this.statistics,
                customPositions: customPositionsArray
            };
            localStorage.setItem('knowledge_graph', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save knowledge graph:', error);
        }
    }

    /**
     * Load from localStorage
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('knowledge_graph');
            if (saved) {
                const data = JSON.parse(saved);
                this.graph = data.graph || this.graph;
                this.settings = { ...this.settings, ...data.settings };
                this.statistics = { ...this.statistics, ...data.statistics };

                // Restore custom positions
                if (data.customPositions) {
                    this.customPositions = new Map(data.customPositions);
                }

                console.log('✅ Loaded knowledge graph from storage');
            }
        } catch (error) {
            console.error('Failed to load knowledge graph:', error);
        }
    }

    /**
     * Reset all custom node positions
     */
    resetNodePositions() {
        this.customPositions.clear();
        this.saveToStorage();
        this.renderGraph();

        console.log('🔄 Node positions reset to default layout');

        // Notify dashboard
        if (window.dashboardManager) {
            window.dashboardManager.addActivity('sync', 'Node positions reset');
        }
    }

    /**
     * Get full statistics
     */
    getStatistics() {
        return {
            ...this.statistics,
            initialized: this.initialized,
            settings: this.settings,
            nodeCount: this.graph.nodes.length,
            edgeCount: this.graph.edges.length
        };
    }
}

// Create global instance
window.knowledgeGraphManager = new KnowledgeGraphManager();

console.log('✅ Knowledge Graph Manager loaded');
