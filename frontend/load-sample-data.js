/**
 * Sample Data Loader for EduLLM Platform
 * Loads realistic educational content for testing without API calls
 */

class SampleDataLoader {
    constructor() {
        this.sampleDocuments = [
            {
                id: 'ncert_physics_ch1',
                title: 'Motion in a Straight Line',
                subject: 'Physics',
                grade: 11,
                chapter: 1,
                content: `Motion in a Straight Line

Introduction:
Motion is one of the most fundamental concepts in physics. When we observe the world around us, we see objects in constant motion - cars on roads, birds in the sky, planets orbiting the sun.

Position and Displacement:
The position of an object is defined with respect to a reference point, usually called the origin. Displacement is the change in position of an object. It is a vector quantity with both magnitude and direction.

Speed and Velocity:
Speed is the rate of change of distance with time. It is a scalar quantity. Velocity, on the other hand, is the rate of change of displacement with time and is a vector quantity.

Average velocity = Total displacement / Total time
Instantaneous velocity = Limit of average velocity as time interval approaches zero

Acceleration:
Acceleration is the rate of change of velocity with time. It is also a vector quantity.

Average acceleration = Change in velocity / Time interval

Equations of Motion:
For uniformly accelerated motion in a straight line, we have three fundamental equations:
1. v = u + at
2. s = ut + (1/2)at²
3. v² = u² + 2as

Where:
- u = initial velocity
- v = final velocity
- a = acceleration
- t = time
- s = displacement

These equations are fundamental to understanding motion and are used extensively in solving physics problems.`
            },
            {
                id: 'ncert_chemistry_ch1',
                title: 'Some Basic Concepts of Chemistry',
                subject: 'Chemistry',
                grade: 11,
                chapter: 1,
                content: `Some Basic Concepts of Chemistry

Matter and Its Nature:
Chemistry is the science of molecules and their transformations. It is the study of matter and the changes it undergoes. Matter is anything that has mass and occupies space.

States of Matter:
Matter exists in three principal states: solid, liquid, and gas. These states differ in their physical properties.

Atoms and Molecules:
An atom is the smallest particle of an element that can exist independently. A molecule is formed when two or more atoms join together chemically.

Dalton's Atomic Theory:
1. All matter is made of atoms
2. Atoms of a given element are identical
3. Atoms cannot be created or destroyed
4. Atoms of different elements combine in simple whole number ratios to form compounds

Mole Concept:
A mole is the amount of substance that contains as many elementary entities as there are atoms in exactly 12g of carbon-12.

Avogadro's Number = 6.022 × 10²³

Molar mass is the mass of one mole of a substance expressed in grams.

Number of moles = Given mass / Molar mass

Stoichiometry:
Stoichiometry deals with the calculation of masses (or volumes) of reactants and products involved in a chemical reaction.`
            },
            {
                id: 'ncert_biology_ch1',
                title: 'The Living World',
                subject: 'Biology',
                grade: 11,
                chapter: 1,
                content: `The Living World

What is Living?:
Living organisms show certain distinguishing characteristics such as growth, reproduction, metabolism, and response to stimuli.

Characteristics of Living Organisms:
1. Growth - Living organisms grow by increasing cell number and cell size
2. Reproduction - Ability to produce offspring of their own kind
3. Metabolism - Sum of all chemical reactions occurring in the body
4. Cellular Organization - All living organisms are made of cells
5. Consciousness - Ability to sense and respond to environmental stimuli

Biodiversity:
Earth has enormous diversity of living organisms. Biodiversity refers to the variety of life forms found in a particular region.

Classification:
The process of grouping living organisms into convenient categories based on easily observable characters is called classification.

Taxonomic Categories:
The hierarchical arrangement of taxonomic categories in descending order is:
Kingdom → Phylum/Division → Class → Order → Family → Genus → Species

Binomial Nomenclature:
Every organism is given a scientific name consisting of two parts:
1. Generic name (Genus)
2. Specific epithet (Species)

For example: Homo sapiens (Human), Mangifera indica (Mango)

Rules of nomenclature were proposed by Carolus Linnaeus.`
            },
            {
                id: 'ncert_math_ch1',
                title: 'Sets',
                subject: 'Mathematics',
                grade: 11,
                chapter: 1,
                content: `Sets

Introduction to Sets:
A set is a well-defined collection of distinct objects. The objects in a set are called elements or members of the set.

Representation of Sets:
Sets can be represented in two ways:
1. Roster Form: Listing all elements, e.g., A = {1, 2, 3, 4, 5}
2. Set-builder Form: Describing property of elements, e.g., A = {x : x is a natural number less than 6}

Types of Sets:
1. Empty Set (∅): A set with no elements
2. Finite Set: A set with finite number of elements
3. Infinite Set: A set with infinite number of elements
4. Universal Set: The set containing all objects under consideration
5. Subset: A ⊆ B if every element of A is in B
6. Power Set: Set of all subsets of a given set

Operations on Sets:
1. Union (A ∪ B): Set of all elements in A or B or both
2. Intersection (A ∩ B): Set of all elements common to both A and B
3. Difference (A - B): Set of elements in A but not in B
4. Complement (A'): Set of all elements in universal set but not in A

Properties of Set Operations:
1. Commutative Law: A ∪ B = B ∪ A, A ∩ B = B ∩ A
2. Associative Law: (A ∪ B) ∪ C = A ∪ (B ∪ C)
3. Distributive Law: A ∪ (B ∩ C) = (A ∪ B) ∩ (A ∪ C)

De Morgan's Laws:
1. (A ∪ B)' = A' ∩ B'
2. (A ∩ B)' = A' ∪ B'`
            },
            {
                id: 'ncert_physics_ch2',
                title: 'Units and Measurements',
                subject: 'Physics',
                grade: 11,
                chapter: 2,
                content: `Units and Measurements

The International System of Units (SI):
The SI system has seven base units:
1. Length - metre (m)
2. Mass - kilogram (kg)
3. Time - second (s)
4. Electric current - ampere (A)
5. Temperature - kelvin (K)
6. Amount of substance - mole (mol)
7. Luminous intensity - candela (cd)

Dimensional Analysis:
The dimensions of a physical quantity are the powers to which the base quantities are raised to represent that quantity.

For example:
- Velocity: [LT⁻¹]
- Acceleration: [LT⁻²]
- Force: [MLT⁻²]

Uses of Dimensional Analysis:
1. To check the correctness of equations
2. To derive relations between physical quantities
3. To convert units from one system to another

Significant Figures:
The significant figures in a measurement are all the digits that are known reliably plus the first digit that is uncertain.

Rules:
1. All non-zero digits are significant
2. Zeros between non-zero digits are significant
3. Leading zeros are not significant
4. Trailing zeros in a decimal number are significant

Errors in Measurement:
1. Systematic Errors - Errors that tend to be in one direction
2. Random Errors - Errors that occur irregularly
3. Least Count Error - Error due to limitation of measuring instrument`
            }
        ];

        this.sampleQueries = [
            {
                query: "What is Newton's first law of motion?",
                subject: 'Physics',
                grade: 11,
                expectedAnswer: "Newton's first law states that an object at rest stays at rest and an object in motion stays in motion with the same speed and direction unless acted upon by an external force."
            },
            {
                query: "Define the mole concept",
                subject: 'Chemistry',
                grade: 11,
                expectedAnswer: "A mole is the amount of substance that contains 6.022 × 10²³ elementary entities (Avogadro's number). It is the SI unit for amount of substance."
            },
            {
                query: "What are the characteristics of living organisms?",
                subject: 'Biology',
                grade: 11,
                expectedAnswer: "Living organisms show growth, reproduction, metabolism, cellular organization, and consciousness (ability to respond to stimuli)."
            },
            {
                query: "Explain De Morgan's Laws in sets",
                subject: 'Mathematics',
                grade: 11,
                expectedAnswer: "De Morgan's Laws state: (A ∪ B)' = A' ∩ B' and (A ∩ B)' = A' ∪ B'. They describe how complements distribute over union and intersection."
            },
            {
                query: "What are the equations of motion?",
                subject: 'Physics',
                grade: 11,
                expectedAnswer: "The three equations of motion are: v = u + at, s = ut + (1/2)at², and v² = u² + 2as, where u is initial velocity, v is final velocity, a is acceleration, t is time, and s is displacement."
            }
        ];
    }

    /**
     * Generate simulated embedding vector
     */
    generateSimulatedEmbedding(text, dimension = 1536) {
        // Create a deterministic "hash" from text
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = ((hash << 5) - hash) + text.charCodeAt(i);
            hash = hash & hash;
        }

        // Generate pseudo-random but consistent vector
        const embedding = [];
        let seed = Math.abs(hash);

        for (let i = 0; i < dimension; i++) {
            // Linear congruential generator for deterministic randomness
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            const value = (seed / 0x7fffffff) * 2 - 1; // Range: -1 to 1
            embedding.push(parseFloat(value.toFixed(6)));
        }

        // Normalize the vector
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return embedding.map(val => val / magnitude);
    }

    /**
     * Chunk text into segments
     */
    chunkText(text, chunkSize = 512, overlap = 50) {
        const words = text.split(/\s+/);
        const chunks = [];

        for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
            const chunk = words.slice(i, i + chunkSize).join(' ');
            if (chunk.trim().length > 0) {
                chunks.push(chunk);
            }
        }

        return chunks;
    }

    /**
     * Load sample documents
     */
    async loadDocuments() {
        console.log('📚 Loading sample documents...');

        for (const doc of this.sampleDocuments) {
            console.log(`   Processing: ${doc.title} (${doc.subject})`);

            // Chunk the document
            const chunks = this.chunkText(doc.content);
            console.log(`   Created ${chunks.length} chunks`);

            // Generate embeddings and add to vector store
            const chunkIds = [];
            for (let i = 0; i < chunks.length; i++) {
                const chunkId = `${doc.id}_chunk_${i}`;
                const embedding = this.generateSimulatedEmbedding(chunks[i]);

                // Add to vector store
                await window.enhancedVectorStore.addVector(
                    chunkId,
                    embedding,
                    {
                        documentId: doc.id,
                        title: doc.title,
                        subject: doc.subject,
                        grade: doc.grade,
                        chapter: doc.chapter,
                        chunkIndex: i
                    },
                    chunks[i]
                );

                chunkIds.push(chunkId);
            }

            // Add document to registry
            window.enhancedVectorStore.documents.set(doc.id, {
                chunks: chunkIds,
                metadata: {
                    title: doc.title,
                    subject: doc.subject,
                    grade: doc.grade,
                    chapter: doc.chapter
                },
                addedAt: Date.now()
            });

            window.enhancedVectorStore.stats.totalDocuments++;
            window.enhancedVectorStore.stats.totalChunks += chunks.length;

            console.log(`   ✅ Added ${doc.title}: ${chunks.length} chunks`);
        }

        window.enhancedVectorStore.stats.lastUpdated = Date.now();
        console.log(`✅ Loaded ${this.sampleDocuments.length} documents`);
        console.log(`   Total chunks: ${window.enhancedVectorStore.stats.totalChunks}`);
    }

    /**
     * Create sample experiments
     */
    async loadExperiments() {
        console.log('🧪 Creating sample experiments...');

        const experiments = [
            {
                name: 'Baseline RAG Performance',
                type: 'rag_evaluation',
                description: 'Testing default configuration with NCERT content',
                parameters: {
                    chunkSize: 512,
                    chunkOverlap: 50,
                    topK: 5,
                    temperature: 0.7,
                    model: 'gpt-3.5-turbo'
                },
                metrics: {
                    precision: 0.92,
                    recall: 0.88,
                    f1Score: 0.90,
                    accuracy: 0.91,
                    avgResponseTime: 1.2,
                    avgRetrievalTime: 0.3
                },
                status: 'completed'
            },
            {
                name: 'Small Chunk Size Test',
                type: 'rag_evaluation',
                description: 'Testing with 256 token chunks',
                parameters: {
                    chunkSize: 256,
                    chunkOverlap: 50,
                    topK: 5,
                    temperature: 0.7,
                    model: 'gpt-3.5-turbo'
                },
                metrics: {
                    precision: 0.89,
                    recall: 0.91,
                    f1Score: 0.90,
                    accuracy: 0.89,
                    avgResponseTime: 1.1,
                    avgRetrievalTime: 0.25
                },
                status: 'completed'
            },
            {
                name: 'Large Chunk Size Test',
                type: 'rag_evaluation',
                description: 'Testing with 1024 token chunks',
                parameters: {
                    chunkSize: 1024,
                    chunkOverlap: 100,
                    topK: 5,
                    temperature: 0.7,
                    model: 'gpt-3.5-turbo'
                },
                metrics: {
                    precision: 0.94,
                    recall: 0.85,
                    f1Score: 0.89,
                    accuracy: 0.92,
                    avgResponseTime: 1.5,
                    avgRetrievalTime: 0.4
                },
                status: 'completed'
            },
            {
                name: 'High Temperature Test',
                type: 'generation_quality',
                description: 'Testing creative responses with temperature 1.2',
                parameters: {
                    chunkSize: 512,
                    chunkOverlap: 50,
                    topK: 5,
                    temperature: 1.2,
                    model: 'gpt-3.5-turbo'
                },
                metrics: {
                    precision: 0.85,
                    recall: 0.89,
                    f1Score: 0.87,
                    accuracy: 0.86,
                    avgResponseTime: 1.3,
                    avgRetrievalTime: 0.3
                },
                status: 'completed'
            }
        ];

        for (const exp of experiments) {
            const expId = window.experimentTracker.createExperiment({
                name: exp.name,
                type: exp.type,
                description: exp.description,
                parameters: exp.parameters
            });

            window.experimentTracker.startExperiment(expId);
            window.experimentTracker.recordMetrics(expId, exp.metrics);

            if (exp.status === 'completed') {
                window.experimentTracker.completeExperiment(expId);
            }

            console.log(`   ✅ Created: ${exp.name}`);
        }

        console.log(`✅ Created ${experiments.length} sample experiments`);
    }

    /**
     * Create sample baselines
     */
    async loadBaselines() {
        console.log('📊 Creating sample baselines...');

        const baselines = [
            {
                name: 'Default Configuration',
                config: {
                    chunkSize: 512,
                    chunkOverlap: 50,
                    topK: 5,
                    temperature: 0.7,
                    embeddingModel: 'text-embedding-3-small'
                },
                description: 'Standard RAG settings for NCERT content'
            },
            {
                name: 'High Precision Config',
                config: {
                    chunkSize: 1024,
                    chunkOverlap: 100,
                    topK: 3,
                    temperature: 0.3,
                    embeddingModel: 'text-embedding-3-large'
                },
                description: 'Optimized for precision and accuracy'
            },
            {
                name: 'Fast Response Config',
                config: {
                    chunkSize: 256,
                    chunkOverlap: 25,
                    topK: 3,
                    temperature: 0.7,
                    embeddingModel: 'text-embedding-3-small'
                },
                description: 'Optimized for speed'
            }
        ];

        for (const baseline of baselines) {
            window.baselineComparator.createBaseline(
                baseline.name,
                baseline.config,
                baseline.description
            );
            console.log(`   ✅ Created: ${baseline.name}`);
        }

        console.log(`✅ Created ${baselines.length} sample baselines`);
    }

    /**
     * Create sample A/B tests
     */
    async loadABTests() {
        console.log('🧬 Creating sample A/B tests...');

        const tests = [
            {
                name: 'Chunk Size Optimization',
                config: {
                    testType: 'chunking_method',
                    description: 'Testing different chunk sizes for optimal retrieval',
                    primaryMetric: 'f1_score',
                    secondaryMetrics: ['precision', 'recall'],
                    assignmentStrategy: 'random',
                    minimumSampleSize: 100,
                    confidenceLevel: 0.95,
                    tags: ['chunking', 'optimization']
                },
                status: 'draft'
            },
            {
                name: 'Temperature vs Accuracy',
                config: {
                    testType: 'temperature',
                    description: 'Finding optimal temperature for educational content',
                    primaryMetric: 'accuracy',
                    secondaryMetrics: ['f1_score'],
                    assignmentStrategy: 'random',
                    minimumSampleSize: 50,
                    confidenceLevel: 0.95,
                    tags: ['generation', 'quality']
                },
                status: 'running'
            }
        ];

        for (const test of tests) {
            const testId = window.abTesting.createTest(test.name, test.config);

            if (test.status === 'running') {
                window.abTesting.startTest(testId);
            }

            console.log(`   ✅ Created: ${test.name} (${test.status})`);
        }

        console.log(`✅ Created ${tests.length} sample A/B tests`);
    }

    /**
     * Populate dashboard metrics
     */
    async loadDashboardMetrics() {
        console.log('📈 Populating dashboard metrics...');

        if (window.dashboardManager) {
            // Update metrics
            window.dashboardManager.metrics = {
                documentsIndexed: this.sampleDocuments.length,
                queriesProcessed: 150,
                accuracyRate: 91.5,
                avgResponseTime: 1.2
            };

            // Add sample activities
            const activities = [
                { icon: '📚', message: 'Loaded 5 NCERT sample documents' },
                { icon: '🧪', message: 'Created 4 baseline experiments' },
                { icon: '📊', message: 'Created 3 baseline configurations' },
                { icon: '🧬', message: 'Set up 2 A/B tests' },
                { icon: '✅', message: 'Platform ready for testing' }
            ];

            activities.forEach(activity => {
                window.dashboardManager.addActivity(activity.icon, activity.message);
            });

            // Update curriculum coverage
            window.dashboardManager.curriculumCoverage = {
                mathematics: 20,
                physics: 40,
                chemistry: 20,
                biology: 20
            };

            window.dashboardManager.updateMetricsDisplay();
            window.dashboardManager.updateActivityDisplay();
            window.dashboardManager.updateCurriculumDisplay();

            console.log('✅ Dashboard metrics populated');
        }
    }

    /**
     * Load all sample data
     */
    async loadAll() {
        console.log('🚀 Loading all sample data...');
        console.log('═══════════════════════════════════════');

        try {
            await this.loadDocuments();
            await this.loadExperiments();
            await this.loadBaselines();
            await this.loadABTests();
            await this.loadDashboardMetrics();

            console.log('═══════════════════════════════════════');
            console.log('✅ ALL SAMPLE DATA LOADED SUCCESSFULLY!');
            console.log('');
            console.log('📊 Summary:');
            console.log(`   Documents: ${this.sampleDocuments.length}`);
            console.log(`   Chunks: ${window.enhancedVectorStore.stats.totalChunks}`);
            console.log(`   Experiments: 4`);
            console.log(`   Baselines: 3`);
            console.log(`   A/B Tests: 2`);
            console.log('');
            console.log('🎯 You can now:');
            console.log('   1. Test semantic search');
            console.log('   2. Run sample queries');
            console.log('   3. View experiments');
            console.log('   4. Create comparisons');
            console.log('   5. Explore the dashboard');
            console.log('');
            console.log('Try this: sampleDataLoader.testSearch("What is motion?")');

        } catch (error) {
            console.error('❌ Error loading sample data:', error);
            throw error;
        }
    }

    /**
     * Test semantic search with sample data
     */
    async testSearch(query) {
        console.log(`🔍 Testing search: "${query}"`);

        const queryEmbedding = this.generateSimulatedEmbedding(query);
        const results = await window.enhancedVectorStore.search(query, { topK: 3 });

        console.log(`✅ Found ${results.length} results:`);
        results.forEach((result, i) => {
            console.log(`\n${i + 1}. ${result.metadata.title} (${result.metadata.subject})`);
            console.log(`   Score: ${result.score.toFixed(4)}`);
            console.log(`   Snippet: ${result.content.substring(0, 150)}...`);
        });

        return results;
    }

    /**
     * Run sample query with simulated RAG response
     */
    async testRAGQuery(query) {
        console.log(`💬 Testing RAG query: "${query}"`);

        const results = await this.testSearch(query);

        // Find matching sample query
        const sampleQuery = this.sampleQueries.find(q =>
            q.query.toLowerCase().includes(query.toLowerCase()) ||
            query.toLowerCase().includes(q.query.toLowerCase().split(' ').slice(0, 3).join(' '))
        );

        const simulatedResponse = {
            answer: sampleQuery ? sampleQuery.expectedAnswer :
                   `Based on the retrieved context, here's what I found about "${query}":\n\n` +
                   results[0].content.substring(0, 200) + '...',
            sources: results.map((r, i) => ({
                index: i + 1,
                title: r.metadata.title,
                subject: r.metadata.subject,
                chapter: r.metadata.chapter,
                score: r.score
            })),
            metadata: {
                retrievalTime: 45 + Math.random() * 10,
                generationTime: 800 + Math.random() * 400,
                totalTime: 850 + Math.random() * 400,
                chunksUsed: results.length,
                model: 'simulated-gpt-3.5-turbo',
                provider: 'simulated'
            },
            confidence: results[0].score > 0.7 ? 'high' : results[0].score > 0.5 ? 'medium' : 'low'
        };

        console.log('\n📝 Simulated Answer:');
        console.log(simulatedResponse.answer);
        console.log('\n📚 Sources:', simulatedResponse.sources.length);
        console.log('⚡ Retrieval:', simulatedResponse.metadata.retrievalTime.toFixed(0) + 'ms');
        console.log('🤖 Generation:', simulatedResponse.metadata.generationTime.toFixed(0) + 'ms');
        console.log('🎯 Confidence:', simulatedResponse.confidence);

        return simulatedResponse;
    }

    /**
     * Clear all sample data
     */
    clearAll() {
        console.log('🗑️ Clearing all sample data...');

        if (window.enhancedVectorStore) {
            window.enhancedVectorStore.clear();
        }

        if (window.experimentTracker) {
            window.experimentTracker.experiments.clear();
        }

        if (window.baselineComparator) {
            window.baselineComparator.baselines = [];
        }

        if (window.abTesting) {
            window.abTesting.tests.clear();
        }

        console.log('✅ All sample data cleared');
    }
}

// Create global instance
window.sampleDataLoader = new SampleDataLoader();

console.log('✅ Sample Data Loader ready!');
console.log('');
console.log('📚 To load sample data, run:');
console.log('   sampleDataLoader.loadAll()');
console.log('');
console.log('🧪 To test search:');
console.log('   sampleDataLoader.testSearch("What is motion?")');
console.log('');
console.log('💬 To test RAG query:');
console.log('   sampleDataLoader.testRAGQuery("What is Newton\'s first law?")');
console.log('');
console.log('🗑️ To clear all data:');
console.log('   sampleDataLoader.clearAll()');
