/**
 * Database Initialization Script
 * Populates the enhanced database with sample data
 */

class DatabaseInitializer {
    constructor(database) {
        this.database = database;
    }

    /**
     * Initialize database with sample data
     */
    async initializeWithSampleData() {
        console.log('🔄 Initializing database with sample data...');

        try {
            await this.database.initialize();

            // Check if already initialized
            const existingExperiments = await this.database.getExperiments();
            if (existingExperiments.length > 0) {
                console.log('⚠️ Database already contains data. Skipping initialization.');
                return false;
            }

            // Initialize all data
            await this.createSampleExperiments();
            await this.createSampleBaselines();
            await this.createSampleABTests();
            await this.createSampleAnalytics();

            console.log('✅ Database initialized with sample data!');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize database:', error);
            return false;
        }
    }

    /**
     * Create sample experiments and runs
     */
    async createSampleExperiments() {
        console.log('📊 Creating sample experiments...');

        // Experiment 1: RAG Baseline
        const exp1Id = await this.database.saveExperiment({
            name: 'RAG System Baseline',
            description: 'Baseline performance test for RAG system with fixed-size chunking',
            parameters: {
                chunkSize: 500,
                overlap: 50,
                embeddingModel: 'text-embedding-ada-002',
                retrievalMethod: 'cosine-similarity'
            },
            tags: ['baseline', 'rag', 'chunking'],
            status: 'completed',
            metadata: {
                category: 'performance',
                priority: 'high'
            }
        });

        // Add runs for experiment 1
        for (let i = 1; i <= 3; i++) {
            await this.database.saveExperimentRun({
                experimentId: exp1Id,
                timestamp: new Date(Date.now() - (3 - i) * 24 * 60 * 60 * 1000).toISOString(),
                parameters: {
                    iteration: i,
                    temperature: 0.7,
                    topK: 5
                },
                metrics: {
                    precision: [
                        { step: 1, value: 0.72 + Math.random() * 0.08 },
                        { step: 2, value: 0.75 + Math.random() * 0.08 },
                        { step: 3, value: 0.78 + Math.random() * 0.08 }
                    ],
                    recall: [
                        { step: 1, value: 0.68 + Math.random() * 0.08 },
                        { step: 2, value: 0.71 + Math.random() * 0.08 },
                        { step: 3, value: 0.74 + Math.random() * 0.08 }
                    ],
                    f1Score: [
                        { step: 1, value: 0.70 + Math.random() * 0.08 },
                        { step: 2, value: 0.73 + Math.random() * 0.08 },
                        { step: 3, value: 0.76 + Math.random() * 0.08 }
                    ]
                },
                results: {
                    accuracy: 0.75 + Math.random() * 0.1,
                    avgResponseTime: 450 + Math.random() * 100,
                    queriesProcessed: 100
                },
                status: 'completed',
                duration: 3500 + Math.random() * 1000,
                logs: [
                    { message: 'Starting RAG evaluation', level: 'info', timestamp: Date.now() },
                    { message: 'Processing 100 queries', level: 'info', timestamp: Date.now() },
                    { message: 'Evaluation complete', level: 'info', timestamp: Date.now() }
                ]
            });
        }

        console.log(`✅ Created experiment: RAG System Baseline (${exp1Id})`);

        // Experiment 2: Semantic Chunking
        const exp2Id = await this.database.saveExperiment({
            name: 'Semantic Chunking Strategy',
            description: 'Testing semantic chunking approach vs fixed-size chunking',
            parameters: {
                chunkingMethod: 'semantic',
                minChunkSize: 300,
                maxChunkSize: 700,
                embeddingModel: 'text-embedding-ada-002'
            },
            tags: ['semantic', 'chunking', 'optimization'],
            status: 'running',
            metadata: {
                category: 'optimization',
                priority: 'high'
            }
        });

        // Add runs for experiment 2
        for (let i = 1; i <= 2; i++) {
            await this.database.saveExperimentRun({
                experimentId: exp2Id,
                timestamp: new Date(Date.now() - (2 - i) * 12 * 60 * 60 * 1000).toISOString(),
                parameters: {
                    iteration: i,
                    temperature: 0.8,
                    topK: 7
                },
                metrics: {
                    precision: [
                        { step: 1, value: 0.78 + Math.random() * 0.08 },
                        { step: 2, value: 0.81 + Math.random() * 0.08 }
                    ],
                    recall: [
                        { step: 1, value: 0.75 + Math.random() * 0.08 },
                        { step: 2, value: 0.78 + Math.random() * 0.08 }
                    ],
                    f1Score: [
                        { step: 1, value: 0.76 + Math.random() * 0.08 },
                        { step: 2, value: 0.79 + Math.random() * 0.08 }
                    ]
                },
                results: {
                    accuracy: 0.80 + Math.random() * 0.1,
                    avgResponseTime: 420 + Math.random() * 80,
                    queriesProcessed: 100
                },
                status: 'completed',
                duration: 3200 + Math.random() * 800
            });
        }

        console.log(`✅ Created experiment: Semantic Chunking Strategy (${exp2Id})`);

        // Experiment 3: Hybrid Retrieval
        const exp3Id = await this.database.saveExperiment({
            name: 'Hybrid Retrieval Method',
            description: 'Combining keyword-based and semantic search',
            parameters: {
                hybridWeight: 0.6,
                semanticWeight: 0.4,
                rerankingEnabled: true
            },
            tags: ['hybrid', 'retrieval', 'reranking'],
            status: 'created',
            metadata: {
                category: 'experimental',
                priority: 'medium'
            }
        });

        console.log(`✅ Created experiment: Hybrid Retrieval Method (${exp3Id})`);
    }

    /**
     * Create sample baselines
     */
    async createSampleBaselines() {
        console.log('📏 Creating sample baselines...');

        // RAG Baseline
        await this.database.saveBaseline({
            name: 'RAG System v1.0 Baseline',
            category: 'rag',
            metrics: {
                precision: 0.75,
                recall: 0.70,
                f1Score: 0.725,
                avgResponseTime: 480,
                accuracy: 0.78
            },
            description: 'Initial RAG system baseline with fixed-size chunking (500 words, 50 overlap)'
        });

        // Chunking Baseline
        await this.database.saveBaseline({
            name: 'Fixed Chunking Baseline',
            category: 'chunking',
            metrics: {
                avgChunkSize: 500,
                overlap: 50,
                totalChunks: 1200,
                avgProcessingTime: 150
            },
            description: 'Baseline metrics for fixed-size chunking strategy'
        });

        // Query Processing Baseline
        await this.database.saveBaseline({
            name: 'Query Processing Baseline',
            category: 'query',
            metrics: {
                avgLatency: 450,
                throughput: 120,
                cacheHitRate: 0.35
            },
            description: 'Baseline query processing performance'
        });

        console.log('✅ Created 3 baseline records');
    }

    /**
     * Create sample A/B tests
     */
    async createSampleABTests() {
        console.log('🔀 Creating sample A/B tests...');

        // Test 1: Chunking Methods
        await this.database.saveABTest({
            name: 'Fixed vs Semantic Chunking',
            description: 'Compare user satisfaction between fixed-size and semantic chunking methods',
            variants: [
                {
                    id: 'A',
                    name: 'Fixed Size (500 words)',
                    allocation: 0.5,
                    parameters: { method: 'fixed', size: 500, overlap: 50 }
                },
                {
                    id: 'B',
                    name: 'Semantic Chunking',
                    allocation: 0.5,
                    parameters: { method: 'semantic', minSize: 300, maxSize: 700 }
                }
            ],
            status: 'running',
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: null,
            trafficAllocation: { A: 0.5, B: 0.5 },
            results: {
                A: {
                    participants: 245,
                    avgAccuracy: 0.76,
                    avgSatisfaction: 7.2,
                    avgResponseTime: 480
                },
                B: {
                    participants: 238,
                    avgAccuracy: 0.82,
                    avgSatisfaction: 8.1,
                    avgResponseTime: 450
                }
            },
            metadata: {
                significance: 0.05,
                power: 0.8
            }
        });

        // Test 2: Embedding Models
        await this.database.saveABTest({
            name: 'Embedding Model Comparison',
            description: 'Compare different embedding models for semantic search',
            variants: [
                {
                    id: 'A',
                    name: 'Ada-002',
                    allocation: 0.5,
                    parameters: { model: 'text-embedding-ada-002', dimensions: 1536 }
                },
                {
                    id: 'B',
                    name: 'Custom Fine-tuned',
                    allocation: 0.5,
                    parameters: { model: 'custom-ncert-v1', dimensions: 768 }
                }
            ],
            status: 'draft',
            startDate: null,
            endDate: null,
            trafficAllocation: { A: 0.5, B: 0.5 },
            results: {},
            metadata: {}
        });

        console.log('✅ Created 2 A/B tests');
    }

    /**
     * Create sample analytics
     */
    async createSampleAnalytics() {
        console.log('📊 Creating sample analytics...');

        // Weekly Performance Report
        await this.database.saveAnalytics({
            type: 'report',
            data: {
                title: 'Weekly Performance Summary',
                period: 'Week 1',
                metrics: {
                    totalQueries: 1250,
                    avgAccuracy: 0.78,
                    avgResponseTime: 465,
                    userSatisfaction: 7.8,
                    cacheHitRate: 0.38
                },
                trends: {
                    accuracyChange: +0.05,
                    responseTimeChange: -35,
                    satisfactionChange: +0.6
                },
                topPerformingDocuments: [
                    'NCERT Math Class 10 - Chapter 3',
                    'NCERT Science Class 9 - Chapter 5',
                    'NCERT History Class 8 - Chapter 2'
                ]
            },
            metadata: {
                generatedAt: new Date().toISOString(),
                version: '1.0'
            }
        });

        // System Metrics
        await this.database.saveAnalytics({
            type: 'metric',
            data: {
                name: 'system_health',
                value: 0.95,
                unit: 'percentage',
                components: {
                    database: 0.98,
                    vectorStore: 0.94,
                    llm: 0.93,
                    cache: 0.97
                }
            },
            metadata: {
                timestamp: new Date().toISOString()
            }
        });

        // Usage Statistics
        await this.database.saveAnalytics({
            type: 'visualization',
            data: {
                chartType: 'line',
                title: 'Daily Query Volume',
                data: [
                    { date: '2024-01-01', queries: 180 },
                    { date: '2024-01-02', queries: 195 },
                    { date: '2024-01-03', queries: 210 },
                    { date: '2024-01-04', queries: 185 },
                    { date: '2024-01-05', queries: 220 },
                    { date: '2024-01-06', queries: 165 },
                    { date: '2024-01-07', queries: 155 }
                ]
            },
            metadata: {}
        });

        console.log('✅ Created 3 analytics records');
    }

    /**
     * Get initialization status
     */
    async getInitializationStatus() {
        const metrics = await this.database.getPerformanceMetrics();

        return {
            experiments: metrics.experiments || 0,
            experimentRuns: metrics.experimentRuns || 0,
            baselines: metrics.baselines || 0,
            abTests: metrics.abTests || 0,
            analytics: metrics.analytics || 0,
            embeddings: metrics.embeddings || 0,
            isInitialized: (metrics.experiments || 0) > 0
        };
    }

    /**
     * Reset database to sample data
     */
    async resetToSampleData() {
        console.log('🔄 Resetting database to sample data...');

        try {
            // Clear database but keep settings
            await this.database.clearDatabase({
                excludeSettings: true,
                excludeBackups: true
            });

            // Reinitialize with sample data
            await this.initializeWithSampleData();

            console.log('✅ Database reset complete!');
            return true;
        } catch (error) {
            console.error('❌ Failed to reset database:', error);
            return false;
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.DatabaseInitializer = DatabaseInitializer;
}
