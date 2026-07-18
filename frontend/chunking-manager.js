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
Triangles are one of the most fundamental geometric shapes, consisting of three sides, three angles, and three vertices. The sum of all interior angles of a triangle is always 180 degrees — a property that holds regardless of the size or shape of the triangle. Triangles are classified in two primary ways: by their sides and by their angles. Based on sides, a triangle is equilateral if all three sides are equal, isosceles if exactly two sides are equal, and scalene if all three sides are of different lengths. Based on angles, a triangle is acute if all angles are less than 90°, right-angled if one angle is exactly 90°, and obtuse if one angle is greater than 90°. Understanding these classifications is essential before studying more advanced properties such as congruence, similarity, and the Pythagorean theorem.

Section 6.2: Criteria for Similarity of Triangles
Two triangles are said to be similar if their corresponding angles are equal and their corresponding sides are proportional. The symbol used for similarity is ∼. If triangle ABC is similar to triangle DEF, we write ABC ∼ DEF. There are three main criteria to establish similarity without measuring all six elements. The Angle-Angle (AA) criterion states that if two angles of one triangle are respectively equal to two angles of another triangle, the triangles are similar. The Side-Angle-Side (SAS) criterion states that if one angle of a triangle is equal to one angle of another triangle and the sides including these angles are proportional, the triangles are similar. The Side-Side-Side (SSS) criterion states that if the corresponding sides of two triangles are in the same ratio, the triangles are similar. These criteria are used extensively in coordinate geometry, mensuration, and real-world applications such as shadow problems, map scaling, and indirect measurement.

Example 6.1: In triangles PQR and XYZ, angle P = angle X = 50° and angle Q = angle Y = 70°. Are the triangles similar?
Solution: Since two pairs of corresponding angles are equal (angle P = angle X and angle Q = angle Y), by the AA criterion, triangle PQR ∼ triangle XYZ. Therefore, their corresponding sides are proportional: PQ/XY = QR/YZ = PR/XZ.

Section 6.3: Pythagoras Theorem
The Pythagoras theorem is one of the most celebrated results in all of mathematics. It states that in a right-angled triangle, the square of the length of the hypotenuse (the side opposite the right angle) is equal to the sum of the squares of the lengths of the other two sides. If triangle ABC is right-angled at B, then AC² = AB² + BC². Here, AC is the hypotenuse, and AB and BC are called the legs of the right triangle. This theorem is named after the ancient Greek mathematician Pythagoras, although evidence of the result was known in Babylonian, Egyptian, and Indian mathematics long before his time. The theorem can be proved using area arguments, similar triangles, or algebraic manipulation.

Example 6.2: The two shorter sides of a right-angled triangle are 5 cm and 12 cm. Find the hypotenuse.
Solution: Let the hypotenuse be h. By Pythagoras theorem: h² = 5² + 12² = 25 + 144 = 169. Therefore, h = 13 cm. The sides 5, 12, 13 form a Pythagorean triple, a set of three positive integers that satisfy the theorem exactly.

Common Pythagorean Triples: (3, 4, 5), (5, 12, 13), (8, 15, 17), (7, 24, 25). These triples are useful in quickly identifying right triangles in examination problems. Multiples of these triples also satisfy the theorem: for example, (6, 8, 10) is a multiple of (3, 4, 5).

Section 6.4: Converse of Pythagoras Theorem
The converse of the Pythagoras theorem states that if in a triangle the square of one side is equal to the sum of the squares of the other two sides, then the angle opposite the longest side is a right angle. This result allows us to verify whether a given triangle is right-angled using only the lengths of its sides, without measuring any angle directly. For example, if a triangle has sides 9 cm, 40 cm, and 41 cm, we check: 9² + 40² = 81 + 1600 = 1681 = 41². Since the equation holds, the triangle is right-angled at the vertex opposite the 41 cm side.

Section 6.5: Applications of Pythagoras Theorem
The Pythagoras theorem has wide-ranging applications in both academic and real-world contexts. In construction and architecture, it is used to ensure that walls are perpendicular and foundations are square. In navigation, the theorem helps calculate the shortest distance between two points. In computer graphics, it underlies distance calculations between pixels. In physics, it appears in vector addition: when two forces are perpendicular, their resultant magnitude is found using the theorem. In day-to-day life, it can be used to find the length of a ladder needed to reach a certain height on a wall, or to determine the diagonal of a rectangular room.

Example 6.3: A ladder 10 m long leans against a vertical wall. The foot of the ladder is 6 m from the base of the wall. How high does the ladder reach on the wall?
Solution: Let the height on the wall be h. By Pythagoras theorem: h² + 6² = 10². So h² = 100 − 36 = 64, giving h = 8 m. The ladder reaches 8 m up the wall.`,
                metadata: { subject: 'mathematics', grade: '10', chapter: '6' }
            },
            {
                id: 'sample_physics',
                name: 'NCERT Physics Grade 11 - Newton\'s Laws',
                content: `Chapter 5: Laws of Motion

Section 5.1: Introduction to Force and Motion
Force is a physical quantity that can change the state of rest or motion of an object. It is a vector quantity, possessing both magnitude and direction. The SI unit of force is the Newton (N), defined as the force that gives a mass of one kilogram an acceleration of one metre per second squared. Forces can be classified as contact forces (friction, normal force, tension) and non-contact forces (gravitational, magnetic, electrostatic). The net force on an object is the vector sum of all forces acting on it. When the net force is zero, the object is said to be in equilibrium — either at rest or moving with constant velocity.

Section 5.2: Newton's First Law of Motion (Law of Inertia)
Newton's First Law states that an object at rest remains at rest, and an object in uniform motion continues to move in a straight line at constant speed, unless acted upon by an external net force. This law introduces the concept of inertia — the natural tendency of an object to resist any change in its state of motion. Inertia depends on the mass of the object: a heavier object has greater inertia and requires a larger force to change its state. Common examples include a passenger lurching forward when a bus suddenly brakes, or a coin placed on a card that falls into a glass when the card is flicked away rapidly. These demonstrations illustrate that objects tend to maintain their current state unless a net force compels them to change.

Section 5.3: Newton's Second Law of Motion
Newton's Second Law provides a quantitative relationship between force, mass, and acceleration. It states that the net force acting on an object is equal to the product of its mass and the acceleration it produces: F = ma. Here F is the net force in Newtons, m is the mass in kilograms, and a is the acceleration in m/s². This law implies that for a given force, a lighter object accelerates more than a heavier one. Conversely, to produce the same acceleration in objects of different masses, a larger force must be applied to the more massive object. The second law also tells us that force and acceleration are in the same direction.

Example 5.1: A net force of 15 N acts on an object of mass 3 kg. Calculate the acceleration.
Solution: Using F = ma: a = F/m = 15/3 = 5 m/s². The object accelerates at 5 m/s² in the direction of the applied force.

Section 5.4: Newton's Third Law of Motion
Newton's Third Law states that for every action there is an equal and opposite reaction. More precisely, when object A exerts a force on object B, object B simultaneously exerts a force of equal magnitude but opposite direction on object A. These forces are called action-reaction pairs. It is important to note that the two forces in an action-reaction pair act on different objects and therefore cannot cancel each other. Examples include a rocket expelling gases downward (action) and rising upward (reaction), a swimmer pushing water backward (action) and moving forward (reaction), and a gun recoiling backward when a bullet is fired forward.`,
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
        const totalChunksEl = document.getElementById('chunkingTotalChunks');
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
