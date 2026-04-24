/**
 * Smart Chunking Manager
 * Visualize and optimize document segmentation for better RAG retrieval
 */

class ChunkingManager {
    constructor() {
        this.documents = [];
        this.currentDocument = null;
        this.chunks = [];
        this.settings = {
            chunkSize: 500,        // tokens
            overlap: 50,           // tokens
            method: 'fixed',       // 'fixed', 'semantic', 'sentence'
            minChunkSize: 100,
            maxChunkSize: 1000
        };
        this.statistics = {
            totalChunks: 0,
            avgChunkSize: 0,
            semanticScore: 0,
            totalTokens: 0
        };
        this.initialized = false;
    }

    /**
     * Initialize Chunking Manager
     */
    async initialize() {
        console.log('✂️  Initializing Chunking Manager...');

        try {
            // Load documents
            this.loadDocuments();

            // Setup UI controls
            this.setupControls();

            // Load saved settings
            this.loadSettings();

            // If we have documents, load the first one
            if (this.documents.length > 0) {
                await this.loadDocument(this.documents[0].id);
            } else {
                // Create sample documents
                this.createSampleDocuments();
                if (this.documents.length > 0) {
                    await this.loadDocument(this.documents[0].id);
                }
            }

            this.initialized = true;
            console.log('✅ Chunking Manager initialized');

            return true;
        } catch (error) {
            console.error('❌ Chunking initialization error:', error);
            return false;
        }
    }

    /**
     * Setup UI controls
     */
    setupControls() {
        // Document selector
        const docSelect = document.getElementById('documentSelect');
        if (docSelect) {
            docSelect.addEventListener('change', (e) => {
                this.loadDocument(e.target.value);
            });
        }

        // Chunk size slider
        const chunkSizeSlider = document.getElementById('chunkSize');
        const chunkSizeValue = document.getElementById('chunkSizeValue');
        if (chunkSizeSlider && chunkSizeValue) {
            chunkSizeSlider.addEventListener('input', (e) => {
                this.settings.chunkSize = parseInt(e.target.value);
                chunkSizeValue.textContent = this.settings.chunkSize;
                this.rechunk();
            });
        }

        // Overlap slider
        const overlapSlider = document.getElementById('chunkOverlap');
        const overlapValue = document.getElementById('chunkOverlapValue');
        if (overlapSlider && overlapValue) {
            overlapSlider.addEventListener('input', (e) => {
                this.settings.overlap = parseInt(e.target.value);
                overlapValue.textContent = this.settings.overlap;
                this.rechunk();
            });
        }

        console.log('✅ Controls setup complete');
    }

    /**
     * Load documents from storage or create samples
     */
    loadDocuments() {
        // Try to load from ragSystem or embeddingManager
        if (window.ragSystem && window.ragSystem.data) {
            this.documents = window.ragSystem.data.map((item, i) => ({
                id: `doc_${i}`,
                name: item.info?.source || `Document ${i + 1}`,
                content: item.text,
                metadata: item.info || {}
            }));
        } else if (window.embeddingManager && window.embeddingManager.documents) {
            this.documents = window.embeddingManager.documents.map((doc, i) => ({
                id: doc.id || `doc_${i}`,
                name: doc.metadata?.source || `Document ${i + 1}`,
                content: doc.text,
                metadata: doc.metadata || {}
            }));
        }

        // Check localStorage for uploaded PDFs
        const pdfs = localStorage.getItem('ncert_pdfs');
        if (pdfs) {
            try {
                const pdfData = JSON.parse(pdfs);
                pdfData.forEach((pdf, i) => {
                    if (pdf.content) {
                        this.documents.push({
                            id: `pdf_${i}`,
                            name: pdf.filename || `PDF ${i + 1}`,
                            content: pdf.content,
                            metadata: { type: 'pdf', ...pdf }
                        });
                    }
                });
            } catch (e) {
                console.warn('Could not load PDFs:', e);
            }
        }

        console.log(`📚 Loaded ${this.documents.length} documents`);

        // Update document selector dropdown
        this.updateDocumentSelector();
    }

    /**
     * Create sample documents for demo
     */
    createSampleDocuments() {
        console.log('📝 Creating sample documents...');

        const samples = [
            {
                id: 'sample_math',
                name: 'NCERT Mathematics Grade 10 - Chapter 6',
                content: `Chapter 6: Triangles

Section 6.1: Introduction to Triangles
Triangles are fundamental shapes in geometry. They have three sides, three angles, and three vertices. The sum of all angles in a triangle is always 180 degrees. Triangles can be classified based on their sides (equilateral, isosceles, scalene) or their angles (acute, right, obtuse).

Section 6.2: Similarity of Triangles
Two triangles are said to be similar if their corresponding angles are equal and their corresponding sides are in proportion. This property is very useful in solving geometric problems. The symbol for similarity is ∼. If triangle ABC is similar to triangle DEF, we write: ABC ∼ DEF.

Section 6.3: Pythagoras Theorem
In a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides. This is one of the most important theorems in mathematics. If a triangle ABC is right-angled at B, then: AC² = AB² + BC².

Example 1: Find the hypotenuse if the other two sides are 3 cm and 4 cm.
Solution: Using Pythagoras theorem: c² = 3² + 4² = 9 + 16 = 25. Therefore, c = 5 cm.

Section 6.4: Converse of Pythagoras Theorem
If in a triangle, the square of one side is equal to the sum of squares of the other two sides, then the triangle is right-angled. This helps us verify if a triangle is right-angled without measuring angles directly.

Section 6.5: Applications of Pythagoras Theorem
The Pythagoras theorem has numerous applications in real life, including construction, navigation, computer graphics, and physics. It helps in calculating distances, heights, and diagonal measurements.`,
                metadata: { subject: 'mathematics', grade: '10', chapter: '6' }
            },
            {
                id: 'sample_physics',
                name: 'NCERT Physics Grade 11 - Newton\'s Laws',
                content: `Chapter 5: Laws of Motion

Section 5.1: Introduction to Force
Force is a push or pull that can change the state of motion of an object. It is a vector quantity, meaning it has both magnitude and direction. The SI unit of force is Newton (N). One newton is the force required to give a mass of 1 kg an acceleration of 1 m/s².

Section 5.2: Newton's First Law
An object at rest stays at rest, and an object in motion stays in motion with constant velocity, unless acted upon by an external force. This law is also called the law of inertia. Inertia is the tendency of an object to resist changes in its state of motion.

Section 5.3: Newton's Second Law
The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass. Mathematically: F = ma, where F is force, m is mass, and a is acceleration.

Example: If a force of 10 N acts on a mass of 2 kg, the acceleration is: a = F/m = 10/2 = 5 m/s².

Section 5.4: Newton's Third Law
For every action, there is an equal and opposite reaction. When object A exerts a force on object B, object B simultaneously exerts a force of equal magnitude but opposite direction on object A.`,
                metadata: { subject: 'physics', grade: '11', chapter: '5' }
            }
        ];

        this.documents = samples;
        this.updateDocumentSelector();

        console.log(`✅ Created ${samples.length} sample documents`);
    }

    /**
     * Update document selector dropdown
     */
    updateDocumentSelector() {
        const selector = document.getElementById('documentSelect');
        if (!selector) return;

        selector.innerHTML = '';

        if (this.documents.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No documents available';
            selector.appendChild(option);
            return;
        }

        this.documents.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = doc.name;
            selector.appendChild(option);
        });
    }

    /**
     * Load a document and chunk it
     */
    async loadDocument(docId) {
        console.log('📄 Loading document:', docId);

        const doc = this.documents.find(d => d.id === docId);
        if (!doc) {
            console.error('Document not found:', docId);
            return;
        }

        this.currentDocument = doc;

        // Chunk the document
        await this.chunkDocument();

        // Update displays
        this.updateStatistics();
        this.displayChunks();

        console.log('✅ Document loaded and chunked');
    }

    /**
     * Chunk the current document based on settings
     */
    async chunkDocument() {
        if (!this.currentDocument) return;

        console.log('✂️  Chunking document with settings:', this.settings);

        const startTime = Date.now();

        switch (this.settings.method) {
            case 'semantic':
                this.chunks = this.semanticChunking(this.currentDocument.content);
                break;
            case 'sentence':
                this.chunks = this.sentenceChunking(this.currentDocument.content);
                break;
            case 'fixed':
            default:
                this.chunks = this.fixedSizeChunking(this.currentDocument.content);
                break;
        }

        const duration = Date.now() - startTime;
        console.log(`✅ Created ${this.chunks.length} chunks in ${duration}ms`);

        return this.chunks;
    }

    /**
     * Fixed-size chunking with overlap
     */
    fixedSizeChunking(text) {
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const chunks = [];
        const chunkSize = this.settings.chunkSize;
        const overlap = this.settings.overlap;

        for (let i = 0; i < words.length; i += chunkSize - overlap) {
            const chunkWords = words.slice(i, i + chunkSize);
            if (chunkWords.length > 0) {
                const chunkText = chunkWords.join(' ');
                chunks.push({
                    id: `chunk_${chunks.length}`,
                    text: chunkText,
                    startIndex: i,
                    endIndex: i + chunkWords.length,
                    wordCount: chunkWords.length,
                    charCount: chunkText.length,
                    method: 'fixed'
                });
            }
        }

        return chunks;
    }

    /**
     * Sentence-based chunking
     */
    sentenceChunking(text) {
        // Split by sentence boundaries
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const chunks = [];
        let currentChunk = [];
        let currentSize = 0;

        sentences.forEach(sentence => {
            const words = sentence.trim().split(/\s+/);
            const sentenceSize = words.length;

            if (currentSize + sentenceSize > this.settings.chunkSize && currentChunk.length > 0) {
                // Create chunk
                const chunkText = currentChunk.join('. ') + '.';
                chunks.push({
                    id: `chunk_${chunks.length}`,
                    text: chunkText,
                    sentenceCount: currentChunk.length,
                    wordCount: currentSize,
                    charCount: chunkText.length,
                    method: 'sentence'
                });

                // Start new chunk
                currentChunk = [sentence.trim()];
                currentSize = sentenceSize;
            } else {
                currentChunk.push(sentence.trim());
                currentSize += sentenceSize;
            }
        });

        // Add remaining chunk
        if (currentChunk.length > 0) {
            const chunkText = currentChunk.join('. ') + '.';
            chunks.push({
                id: `chunk_${chunks.length}`,
                text: chunkText,
                sentenceCount: currentChunk.length,
                wordCount: currentSize,
                charCount: chunkText.length,
                method: 'sentence'
            });
        }

        return chunks;
    }

    /**
     * Semantic chunking (basic implementation)
     */
    semanticChunking(text) {
        // Split by paragraphs and headings
        const sections = text.split(/\n\n+/);
        const chunks = [];

        sections.forEach(section => {
            const trimmed = section.trim();
            if (trimmed.length === 0) return;

            const words = trimmed.split(/\s+/);

            if (words.length <= this.settings.chunkSize) {
                // Section fits in one chunk
                chunks.push({
                    id: `chunk_${chunks.length}`,
                    text: trimmed,
                    wordCount: words.length,
                    charCount: trimmed.length,
                    method: 'semantic',
                    semantic: true
                });
            } else {
                // Split large section with fixed-size
                for (let i = 0; i < words.length; i += this.settings.chunkSize) {
                    const chunkWords = words.slice(i, i + this.settings.chunkSize);
                    const chunkText = chunkWords.join(' ');
                    chunks.push({
                        id: `chunk_${chunks.length}`,
                        text: chunkText,
                        wordCount: chunkWords.length,
                        charCount: chunkText.length,
                        method: 'semantic'
                    });
                }
            }
        });

        return chunks;
    }

    /**
     * Rechunk current document
     */
    async rechunk() {
        if (!this.currentDocument) return;

        await this.chunkDocument();
        this.updateStatistics();
        this.displayChunks();

        // Add to dashboard activity
        if (window.dashboardManager) {
            window.dashboardManager.addActivity(
                'layer-group',
                `Document re-chunked: ${this.chunks.length} chunks created`
            );
        }
    }

    /**
     * Update statistics display
     */
    updateStatistics() {
        // Calculate statistics
        this.statistics.totalChunks = this.chunks.length;

        if (this.chunks.length > 0) {
            const totalWords = this.chunks.reduce((sum, c) => sum + c.wordCount, 0);
            this.statistics.avgChunkSize = Math.round(totalWords / this.chunks.length);
            this.statistics.totalTokens = totalWords;

            // Calculate semantic score (0-10)
            // Higher score for more consistent chunk sizes
            const sizes = this.chunks.map(c => c.wordCount);
            const mean = this.statistics.avgChunkSize;
            const variance = sizes.reduce((sum, size) => sum + Math.pow(size - mean, 2), 0) / sizes.length;
            const stdDev = Math.sqrt(variance);
            const consistencyScore = Math.max(0, 10 - (stdDev / mean * 10));
            this.statistics.semanticScore = consistencyScore.toFixed(1);
        } else {
            this.statistics.avgChunkSize = 0;
            this.statistics.totalTokens = 0;
            this.statistics.semanticScore = 0;
        }

        // Update UI
        this.updateStatisticsDisplay();
    }

    /**
     * Update statistics display in UI
     */
    updateStatisticsDisplay() {
        const totalChunksEl = document.getElementById('totalChunks');
        if (totalChunksEl) {
            totalChunksEl.textContent = this.statistics.totalChunks;
        }

        const avgChunkSizeEl = document.getElementById('avgChunkSize');
        if (avgChunkSizeEl) {
            avgChunkSizeEl.textContent = this.statistics.avgChunkSize;
        }

        const semanticScoreEl = document.getElementById('semanticScore');
        if (semanticScoreEl) {
            semanticScoreEl.textContent = this.statistics.semanticScore;
        }
    }

    /**
     * Display chunks in UI
     */
    displayChunks() {
        const container = document.getElementById('chunksDisplay');
        if (!container) return;

        container.innerHTML = '';

        if (this.chunks.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #888;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No chunks to display</p>
                    <p style="font-size: 0.875rem;">Select a document and adjust chunking settings</p>
                </div>
            `;
            return;
        }

        // Display chunks
        this.chunks.forEach((chunk, index) => {
            const chunkDiv = document.createElement('div');
            chunkDiv.className = 'chunk-item';
            chunkDiv.innerHTML = `
                <div class="chunk-header">
                    <span class="chunk-number">Chunk ${index + 1}</span>
                    <span class="chunk-meta">${chunk.wordCount} words | ${chunk.charCount} chars</span>
                </div>
                <div class="chunk-content">
                    ${this.highlightChunk(chunk.text)}
                </div>
            `;
            container.appendChild(chunkDiv);
        });

        console.log('✅ Displayed', this.chunks.length, 'chunks');
    }

    /**
     * Highlight chunk text (basic implementation)
     */
    highlightChunk(text) {
        // Highlight keywords, numbers, etc.
        return text
            .replace(/\b(\d+)\b/g, '<span class="highlight-number">$1</span>')
            .replace(/\b([A-Z][a-z]+)\b/g, '<span class="highlight-word">$1</span>');
    }

    /**
     * Export chunks
     */
    exportChunks() {
        if (this.chunks.length === 0) {
            alert('No chunks to export');
            return;
        }

        const data = {
            document: {
                id: this.currentDocument.id,
                name: this.currentDocument.name,
                metadata: this.currentDocument.metadata
            },
            settings: this.settings,
            statistics: this.statistics,
            chunks: this.chunks,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chunks-${this.currentDocument.id}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('📥 Chunks exported');
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('chunking_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.settings = { ...this.settings, ...settings };

                // Update UI controls
                const chunkSizeSlider = document.getElementById('chunkSize');
                const chunkSizeValue = document.getElementById('chunkSizeValue');
                if (chunkSizeSlider && chunkSizeValue) {
                    chunkSizeSlider.value = this.settings.chunkSize;
                    chunkSizeValue.textContent = this.settings.chunkSize;
                }

                const overlapSlider = document.getElementById('chunkOverlap');
                const overlapValue = document.getElementById('chunkOverlapValue');
                if (overlapSlider && overlapValue) {
                    overlapSlider.value = this.settings.overlap;
                    overlapValue.textContent = this.settings.overlap;
                }

                console.log('📥 Settings loaded');
            }
        } catch (error) {
            console.warn('Could not load settings:', error);
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('chunking_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Could not save settings:', error);
        }
    }

    /**
     * Get chunking statistics
     */
    getStatistics() {
        return {
            ...this.statistics,
            documentsAvailable: this.documents.length,
            currentDocument: this.currentDocument?.name || null,
            settings: { ...this.settings }
        };
    }
}

// Initialize global instance
window.chunkingManager = new ChunkingManager();

console.log('✂️  Chunking Manager loaded');
