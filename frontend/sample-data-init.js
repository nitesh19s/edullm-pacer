/**
 * Sample Data Initializer
 * Populates the entire platform with realistic demo data
 */

class SampleDataInitializer {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize all sample data for the platform
     */
    async initializeAllSampleData() {
        console.log('🎬 Initializing platform with sample data...');
        console.log('='.repeat(70));

        try {
            // 1. Initialize dashboard with sample activities
            await this.initializeDashboardData();

            // 2. Initialize RAG system with sample documents
            await this.initializeRAGData();

            // 3. Initialize chunking with sample chunks
            await this.initializeChunkingData();

            // 4. Initialize knowledge graph with sample concepts
            await this.initializeKnowledgeGraphData();

            // 5. Initialize chat history with sample conversations
            await this.initializeChatHistory();

            // 6. Initialize database with experiments (using existing initializer)
            if (window.databaseInitializer) {
                const status = await window.databaseInitializer.getInitializationStatus();
                if (!status.isInitialized) {
                    await window.databaseInitializer.initializeWithSampleData();
                }
            }

            // 7. Add sample uploaded files metadata
            await this.initializeUploadedFiles();

            this.initialized = true;

            console.log('='.repeat(70));
            console.log('✅ Platform initialized with complete sample data!');
            console.log('='.repeat(70));

            return true;
        } catch (error) {
            console.error('❌ Failed to initialize sample data:', error);
            return false;
        }
    }

    /**
     * Initialize dashboard with sample activities
     */
    async initializeDashboardData() {
        console.log('\n📊 Initializing Dashboard Data...');

        if (!window.dashboardManager) {
            console.log('⚠️ Dashboard Manager not available');
            return;
        }

        const sampleActivities = [
            { icon: 'upload', message: 'Uploaded NCERT Mathematics Grade 10 textbook', time: Date.now() - 3600000 },
            { icon: 'brain', message: 'Processed 245 new chunks from Physics Grade 11', time: Date.now() - 7200000 },
            { icon: 'check-circle', message: 'RAG Chat: Answered question about Pythagoras theorem', time: Date.now() - 10800000 },
            { icon: 'chart-line', message: 'Experiment run completed with 87% accuracy', time: Date.now() - 14400000 },
            { icon: 'upload', message: 'Uploaded NCERT Chemistry Grade 12 textbook', time: Date.now() - 18000000 },
            { icon: 'graph', message: 'Built knowledge graph with 156 concepts', time: Date.now() - 21600000 },
            { icon: 'check-circle', message: 'RAG Chat: Answered question about Newton\'s laws', time: Date.now() - 25200000 },
            { icon: 'brain', message: 'Semantic chunking completed for Biology Grade 9', time: Date.now() - 28800000 },
            { icon: 'chart-line', message: 'Baseline comparison completed', time: Date.now() - 32400000 },
            { icon: 'upload', message: 'Uploaded NCERT History Grade 8 textbook', time: Date.now() - 36000000 }
        ];

        // Clear existing activities
        window.dashboardManager.activities = [];

        // Add sample activities
        for (const activity of sampleActivities) {
            window.dashboardManager.activities.push({
                icon: activity.icon,
                message: activity.message,
                timestamp: activity.time
            });
        }

        await window.dashboardManager.saveToStorage();
        window.dashboardManager.updateActivityDisplay();

        console.log(`✅ Added ${sampleActivities.length} sample activities`);
    }

    /**
     * Initialize RAG system with sample documents
     */
    async initializeRAGData() {
        console.log('\n📚 Initializing RAG System Data...');

        if (!window.ragSystem) {
            console.log('⚠️ RAG System not available');
            return;
        }

        const sampleDocuments = [
            {
                id: 1,
                text: "The Pythagorean theorem states that in a right-angled triangle, the square of the hypotenuse is equal to the sum of squares of the other two sides. Mathematically: a² + b² = c², where c is the hypotenuse.",
                info: { source: 'NCERT Mathematics Grade 10', subject: 'mathematics', grade: 10, chapter: 'Triangles' }
            },
            {
                id: 2,
                text: "Newton's First Law of Motion states that an object at rest stays at rest and an object in motion stays in motion with the same speed and direction unless acted upon by an unbalanced force. This is also known as the law of inertia.",
                info: { source: 'NCERT Physics Grade 11', subject: 'physics', grade: 11, chapter: 'Laws of Motion' }
            },
            {
                id: 3,
                text: "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water. Photosynthesis in plants generally involves the green pigment chlorophyll and generates oxygen as a by-product.",
                info: { source: 'NCERT Biology Grade 9', subject: 'biology', grade: 9, chapter: 'Life Processes' }
            },
            {
                id: 4,
                text: "A quadratic equation is a second-degree polynomial equation in a single variable x, with a ≠ 0. The general form is ax² + bx + c = 0. The solutions can be found using the quadratic formula: x = (-b ± √(b²-4ac)) / 2a",
                info: { source: 'NCERT Mathematics Grade 10', subject: 'mathematics', grade: 10, chapter: 'Quadratic Equations' }
            },
            {
                id: 5,
                text: "An acid is a molecule or ion capable of donating a proton (hydrogen ion H+), or forming a covalent bond with an electron pair. A base is a substance that can accept hydrogen ions. The pH scale measures how acidic or basic a substance is, ranging from 0 to 14.",
                info: { source: 'NCERT Chemistry Grade 10', subject: 'chemistry', grade: 10, chapter: 'Acids, Bases and Salts' }
            },
            {
                id: 6,
                text: "The periodic table is a tabular arrangement of chemical elements, organized by atomic number, electron configuration, and recurring chemical properties. Elements are presented in order of increasing atomic number. The table has rows called periods and columns called groups.",
                info: { source: 'NCERT Chemistry Grade 11', subject: 'chemistry', grade: 11, chapter: 'Classification of Elements' }
            },
            {
                id: 7,
                text: "Velocity is the rate of change of displacement. It is a vector quantity with both magnitude and direction. Speed is the rate of change of distance and is a scalar quantity. Average velocity = displacement / time taken.",
                info: { source: 'NCERT Physics Grade 9', subject: 'physics', grade: 9, chapter: 'Motion' }
            },
            {
                id: 8,
                text: "Cell is the structural and functional unit of life. All living organisms are composed of cells. Some organisms are made of only one cell (unicellular) while others are made of many cells (multicellular). Cells were discovered by Robert Hooke in 1665.",
                info: { source: 'NCERT Biology Grade 9', subject: 'biology', grade: 9, chapter: 'The Fundamental Unit of Life' }
            },
            {
                id: 9,
                text: "Arithmetic Progression (AP) is a sequence of numbers in which the difference between consecutive terms is constant. This constant difference is called the common difference, denoted by 'd'. The nth term is given by: an = a + (n-1)d",
                info: { source: 'NCERT Mathematics Grade 10', subject: 'mathematics', grade: 10, chapter: 'Arithmetic Progressions' }
            },
            {
                id: 10,
                text: "Electricity is the flow of electric charge. Current electricity is the flow of electrons through a conductor. Voltage is the potential difference that drives the current. Resistance is the opposition to current flow. Ohm's Law: V = IR",
                info: { source: 'NCERT Physics Grade 10', subject: 'physics', grade: 10, chapter: 'Electricity' }
            }
        ];

        window.ragSystem.data = sampleDocuments;

        console.log(`✅ Added ${sampleDocuments.length} sample documents to RAG system`);
    }

    /**
     * Initialize chunking manager with sample chunks
     */
    async initializeChunkingData() {
        console.log('\n✂️  Initializing Chunking Data...');

        if (!window.chunkingManager) {
            console.log('⚠️ Chunking Manager not available');
            return;
        }

        const sampleDocuments = [
            {
                id: 'ncert-math-10',
                name: 'NCERT Mathematics Grade 10',
                subject: 'Mathematics',
                grade: 10,
                chapters: 15,
                content: 'Full mathematics curriculum for grade 10...'
            },
            {
                id: 'ncert-physics-11',
                name: 'NCERT Physics Grade 11',
                subject: 'Physics',
                grade: 11,
                chapters: 15,
                content: 'Full physics curriculum for grade 11...'
            },
            {
                id: 'ncert-chemistry-12',
                name: 'NCERT Chemistry Grade 12',
                subject: 'Chemistry',
                grade: 12,
                chapters: 16,
                content: 'Full chemistry curriculum for grade 12...'
            }
        ];

        const sampleChunks = [
            {
                id: 1,
                text: 'The Pythagorean theorem states that in a right-angled triangle, the square of the hypotenuse is equal to the sum of squares of the other two sides.',
                source: 'NCERT Mathematics Grade 10',
                subject: 'mathematics',
                grade: 10,
                chapter: 'Triangles',
                size: 145,
                position: 0
            },
            {
                id: 2,
                text: "Newton's First Law of Motion states that an object at rest stays at rest and an object in motion stays in motion unless acted upon by an unbalanced force.",
                source: 'NCERT Physics Grade 11',
                subject: 'physics',
                grade: 11,
                chapter: 'Laws of Motion',
                size: 138,
                position: 1
            },
            {
                id: 3,
                text: 'Photosynthesis is the process by which green plants use sunlight to synthesize nutrients from carbon dioxide and water, generating oxygen as a by-product.',
                source: 'NCERT Biology Grade 9',
                subject: 'biology',
                grade: 9,
                chapter: 'Life Processes',
                size: 142,
                position: 2
            }
        ];

        window.chunkingManager.documents = sampleDocuments;
        window.chunkingManager.chunks = sampleChunks;
        window.chunkingManager.initialized = true;

        console.log(`✅ Added ${sampleDocuments.length} documents and ${sampleChunks.length} chunks`);
    }

    /**
     * Initialize knowledge graph with sample concepts
     */
    async initializeKnowledgeGraphData() {
        console.log('\n🔬 Initializing Knowledge Graph Data...');

        if (!window.knowledgeGraphManager) {
            console.log('⚠️ Knowledge Graph Manager not available');
            return;
        }

        const sampleGraph = {
            nodes: [
                { id: 1, label: 'Pythagoras Theorem', subject: 'mathematics', grade: 10, weight: 5, chapter: 'Triangles' },
                { id: 2, label: 'Right Triangle', subject: 'mathematics', grade: 10, weight: 4, chapter: 'Triangles' },
                { id: 3, label: 'Hypotenuse', subject: 'mathematics', grade: 10, weight: 3, chapter: 'Triangles' },
                { id: 4, label: "Newton's Laws", subject: 'physics', grade: 11, weight: 5, chapter: 'Laws of Motion' },
                { id: 5, label: 'Inertia', subject: 'physics', grade: 11, weight: 4, chapter: 'Laws of Motion' },
                { id: 6, label: 'Force', subject: 'physics', grade: 11, weight: 5, chapter: 'Laws of Motion' },
                { id: 7, label: 'Photosynthesis', subject: 'biology', grade: 9, weight: 5, chapter: 'Life Processes' },
                { id: 8, label: 'Chlorophyll', subject: 'biology', grade: 9, weight: 3, chapter: 'Life Processes' },
                { id: 9, label: 'Quadratic Equation', subject: 'mathematics', grade: 10, weight: 5, chapter: 'Quadratic Equations' },
                { id: 10, label: 'Polynomial', subject: 'mathematics', grade: 10, weight: 4, chapter: 'Polynomials' },
                { id: 11, label: 'Acid-Base', subject: 'chemistry', grade: 10, weight: 5, chapter: 'Acids and Bases' },
                { id: 12, label: 'pH Scale', subject: 'chemistry', grade: 10, weight: 4, chapter: 'Acids and Bases' },
                { id: 13, label: 'Velocity', subject: 'physics', grade: 9, weight: 4, chapter: 'Motion' },
                { id: 14, label: 'Acceleration', subject: 'physics', grade: 9, weight: 4, chapter: 'Motion' },
                { id: 15, label: 'Cell', subject: 'biology', grade: 9, weight: 5, chapter: 'Cell Structure' }
            ],
            edges: [
                { source: 1, target: 2, type: 'applies_to', weight: 5 },
                { source: 1, target: 3, type: 'defines', weight: 4 },
                { source: 2, target: 3, type: 'contains', weight: 3 },
                { source: 4, target: 5, type: 'explains', weight: 5 },
                { source: 4, target: 6, type: 'involves', weight: 4 },
                { source: 7, target: 8, type: 'requires', weight: 4 },
                { source: 9, target: 10, type: 'is_type_of', weight: 3 },
                { source: 11, target: 12, type: 'measured_by', weight: 4 },
                { source: 13, target: 14, type: 'related_to', weight: 3 },
                { source: 6, target: 13, type: 'causes', weight: 3 }
            ]
        };

        window.knowledgeGraphManager.graph = sampleGraph;
        window.knowledgeGraphManager.initialized = true;

        // Render the graph if on the knowledge graph page
        if (window.eduLLM && window.eduLLM.currentSection === 'knowledge') {
            window.knowledgeGraphManager.renderGraph();
        }

        console.log(`✅ Added ${sampleGraph.nodes.length} concepts and ${sampleGraph.edges.length} relationships`);
    }

    /**
     * Initialize chat history with sample conversations
     */
    async initializeChatHistory() {
        console.log('\n💬 Initializing Chat History...');

        if (!window.ragChatManager) {
            console.log('⚠️ RAG Chat Manager not available');
            return;
        }

        const sampleMessages = [
            // Conversation 1: Mathematics - Pythagorean Theorem
            {
                role: 'user',
                content: 'What is the Pythagorean theorem?',
                timestamp: Date.now() - 7200000 // 2 hours ago
            },
            {
                role: 'assistant',
                content: 'The Pythagorean theorem states that in a right-angled triangle, the square of the hypotenuse is equal to the sum of squares of the other two sides. Mathematically: **a² + b² = c²**, where c is the hypotenuse.\n\nFor example, if a triangle has sides of length 3 and 4, the hypotenuse will be √(3² + 4²) = √(9 + 16) = √25 = 5 units.',
                sources: [
                    { title: 'NCERT Mathematics Grade 10 - Chapter 6: Triangles' },
                    { title: 'NCERT Mathematics Grade 10 - Theorem 6.8' }
                ],
                timestamp: Date.now() - 7199000
            },

            // Conversation 2: Physics - Newton's Laws
            {
                role: 'user',
                content: "Can you explain Newton's first law of motion?",
                timestamp: Date.now() - 5400000 // 1.5 hours ago
            },
            {
                role: 'assistant',
                content: "**Newton's First Law of Motion** (Law of Inertia) states that an object at rest stays at rest and an object in motion stays in motion with the same speed and direction unless acted upon by an unbalanced force.\n\nThis means:\n- A ball on the ground won't move unless someone kicks it\n- A moving car continues moving unless brakes are applied\n- Passengers jerk forward when a bus suddenly stops\n\nInertia is the tendency of objects to resist changes in their state of motion.",
                sources: [
                    { title: 'NCERT Physics Grade 11 - Chapter 5: Laws of Motion' },
                    { title: 'NCERT Physics Grade 9 - Force and Motion' }
                ],
                timestamp: Date.now() - 5399000
            },

            // Conversation 3: Biology - Photosynthesis
            {
                role: 'user',
                content: 'How does photosynthesis work?',
                timestamp: Date.now() - 3600000 // 1 hour ago
            },
            {
                role: 'assistant',
                content: '**Photosynthesis** is the process by which green plants make their own food using sunlight, water, and carbon dioxide.\n\n**Process:**\n1. Chlorophyll in leaves absorbs sunlight\n2. Water is absorbed from roots\n3. Carbon dioxide enters through stomata\n4. Light energy converts CO₂ and H₂O into glucose\n5. Oxygen is released as a by-product\n\n**Equation:** 6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂\n\nThis process occurs mainly in the leaves and is essential for all life on Earth.',
                sources: [
                    { title: 'NCERT Biology Grade 9 - Chapter 13: Life Processes' },
                    { title: 'NCERT Biology Grade 10 - Nutrition in Plants' }
                ],
                timestamp: Date.now() - 3599000
            },

            // Conversation 4: Mathematics - Quadratic Equations
            {
                role: 'user',
                content: 'What is the quadratic formula?',
                timestamp: Date.now() - 1800000 // 30 minutes ago
            },
            {
                role: 'assistant',
                content: 'The **quadratic formula** is used to find the roots of a quadratic equation of the form ax² + bx + c = 0.\n\n**Formula:** x = (-b ± √(b² - 4ac)) / 2a\n\nWhere:\n- a, b, c are coefficients\n- The expression (b² - 4ac) is called the discriminant\n\n**Discriminant determines:**\n- If > 0: Two distinct real roots\n- If = 0: Two equal real roots\n- If < 0: No real roots (complex roots)',
                sources: [
                    { title: 'NCERT Mathematics Grade 10 - Chapter 4: Quadratic Equations' }
                ],
                timestamp: Date.now() - 1799000
            },

            // Conversation 5: Chemistry - Acids and Bases
            {
                role: 'user',
                content: 'What is the difference between acids and bases?',
                timestamp: Date.now() - 900000 // 15 minutes ago
            },
            {
                role: 'assistant',
                content: '**Acids and Bases** are two important classes of chemical compounds:\n\n**Acids:**\n- Taste sour\n- Turn blue litmus paper red\n- pH < 7\n- Release H⁺ ions in water\n- Examples: HCl, H₂SO₄, lemon juice, vinegar\n\n**Bases:**\n- Taste bitter\n- Turn red litmus paper blue\n- pH > 7\n- Release OH⁻ ions in water\n- Examples: NaOH, KOH, soap, baking soda\n\n**pH Scale:** Measures acidity/basicity from 0-14, where 7 is neutral.',
                sources: [
                    { title: 'NCERT Chemistry Grade 10 - Chapter 2: Acids, Bases and Salts' },
                    { title: 'NCERT Chemistry Grade 7 - Acids and Bases' }
                ],
                timestamp: Date.now() - 899000
            },

            // Conversation 6: Physics - Electricity
            {
                role: 'user',
                content: 'Can you explain Ohm\'s Law?',
                timestamp: Date.now() - 300000 // 5 minutes ago
            },
            {
                role: 'assistant',
                content: '**Ohm\'s Law** states that the current flowing through a conductor is directly proportional to the voltage across it, provided the temperature remains constant.\n\n**Formula:** V = IR\n\nWhere:\n- V = Voltage (in volts)\n- I = Current (in amperes)\n- R = Resistance (in ohms)\n\n**Applications:**\n- Calculate unknown values (if you know any two, you can find the third)\n- Design electrical circuits\n- Understand power consumption\n\n**Example:** If a 12V battery is connected to a 4Ω resistor, the current I = V/R = 12/4 = 3A',
                sources: [
                    { title: 'NCERT Physics Grade 10 - Chapter 12: Electricity' },
                    { title: 'NCERT Physics Grade 12 - Current Electricity' }
                ],
                timestamp: Date.now() - 299000
            },

            // Conversation 7: Biology - Cell Structure
            {
                role: 'user',
                content: 'What are the main parts of a cell?',
                timestamp: Date.now() - 120000 // 2 minutes ago
            },
            {
                role: 'assistant',
                content: 'A **cell** is the basic structural and functional unit of life. Main parts include:\n\n**1. Cell Membrane:** Outer boundary that controls what enters/exits\n\n**2. Cytoplasm:** Jelly-like substance where cell activities occur\n\n**3. Nucleus:** Control center containing DNA and genetic information\n\n**4. Mitochondria:** Powerhouse of the cell, produces energy (ATP)\n\n**5. Ribosomes:** Protein synthesis factories\n\n**6. Endoplasmic Reticulum:** Transportation system\n\n**7. Golgi Apparatus:** Packaging and distribution center\n\n**Plant cells also have:** Cell wall, chloroplasts, and large vacuole.',
                sources: [
                    { title: 'NCERT Biology Grade 9 - Chapter 5: The Fundamental Unit of Life' },
                    { title: 'NCERT Biology Grade 11 - Cell Structure' }
                ],
                timestamp: Date.now() - 119000
            }
        ];

        // Store in localStorage in the format expected by RAG Chat Manager
        localStorage.setItem('rag_chat_history', JSON.stringify(sampleMessages));

        console.log(`✅ Added ${sampleMessages.length} sample chat messages (${Math.floor(sampleMessages.length/2)} Q&A pairs)`);
    }

    /**
     * Initialize uploaded files metadata
     */
    async initializeUploadedFiles() {
        console.log('\n📁 Initializing Uploaded Files...');

        const sampleFiles = [
            {
                id: 1,
                filename: 'NCERT_Mathematics_Grade_10.pdf',
                subject: 'mathematics',
                grade: 10,
                size: 5242880, // 5MB
                uploadedAt: Date.now() - 86400000,
                processed: true,
                chunks: 245,
                pages: 156
            },
            {
                id: 2,
                filename: 'NCERT_Physics_Grade_11.pdf',
                subject: 'physics',
                grade: 11,
                size: 6291456, // 6MB
                uploadedAt: Date.now() - 172800000,
                processed: true,
                chunks: 312,
                pages: 198
            },
            {
                id: 3,
                filename: 'NCERT_Chemistry_Grade_12.pdf',
                subject: 'chemistry',
                grade: 12,
                size: 7340032, // 7MB
                uploadedAt: Date.now() - 259200000,
                processed: true,
                chunks: 389,
                pages: 234
            },
            {
                id: 4,
                filename: 'NCERT_Biology_Grade_9.pdf',
                subject: 'biology',
                grade: 9,
                size: 4194304, // 4MB
                uploadedAt: Date.now() - 345600000,
                processed: true,
                chunks: 198,
                pages: 142
            }
        ];

        localStorage.setItem('uploaded_files', JSON.stringify(sampleFiles));

        if (window.eduLLM) {
            window.eduLLM.uploadedFiles = sampleFiles;
        }

        console.log(`✅ Added ${sampleFiles.length} sample uploaded files`);
    }

    /**
     * Quick command to populate everything
     */
    async populateAll() {
        return await this.initializeAllSampleData();
    }

    /**
     * Clear all sample data
     */
    async clearAllSampleData() {
        console.log('🗑️  Clearing all sample data...');

        // Clear localStorage
        localStorage.removeItem('dashboard_activities');
        localStorage.removeItem('rag_chat_history');
        localStorage.removeItem('uploaded_files');
        localStorage.removeItem('query_history');

        // Clear managers
        if (window.dashboardManager) {
            window.dashboardManager.activities = [];
            window.dashboardManager.updateActivityDisplay();
        }

        if (window.ragSystem) {
            window.ragSystem.data = [];
        }

        if (window.chunkingManager) {
            window.chunkingManager.chunks = [];
            window.chunkingManager.documents = [];
        }

        console.log('✅ All sample data cleared');
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.SampleDataInitializer = SampleDataInitializer;
    window.sampleDataInit = new SampleDataInitializer();

    console.log('📦 Sample Data Initializer loaded');
    console.log('💡 Use: await sampleDataInit.populateAll() to load demo data');
}
