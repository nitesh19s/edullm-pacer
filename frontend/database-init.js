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
        console.log('📊 Seeding PACER benchmark experiments...');

        const BASE = new Date('2026-04-27T00:00:00Z').getTime();
        const DAY  = 86400000;
        const EMB  = { bge: 'BAAI/bge-large-en-v1.5', mini: 'all-MiniLM-L6-v2' };

        const DEFS = [
            { slug: 'pacer',         name: 'PACER (Adaptive)',        desc: 'Pedagogy-aware adaptive chunking — routes each document to its optimal strategy.',            tags: ['pacer','adaptive'],    params: { chunker:'educational', chunk_size:2000 }, bge:{mrr:0.9241,ndcg:0.9208,cas:0.651,latency:87, chunks:16369}, mini:{mrr:0.8845,ndcg:0.8887,cas:0.644,latency:77, chunks:16369} },
            { slug: 'recursive512',  name: 'Recursive-512 (Baseline)', desc: 'LangChain RecursiveCharacterTextSplitter, 512-token chunks. Best single baseline by MRR.', tags: ['baseline','recursive'], params: { chunker:'recursive',   chunk_size:512  }, bge:{mrr:0.9354,ndcg:0.8971,cas:0.677,latency:214,chunks:36981}, mini:{mrr:0.9242,ndcg:0.8864,cas:0.672,latency:177,chunks:36981} },
            { slug: 'recursive1024', name: 'Recursive-1024',           desc: 'RecursiveCharacterTextSplitter at 1024 tokens.',                                            tags: ['baseline','recursive'], params: { chunker:'recursive',   chunk_size:1024 }, bge:{mrr:0.9234,ndcg:0.9024,cas:0.669,latency:114,chunks:18389}, mini:{mrr:0.8958,ndcg:0.8811,cas:0.665,latency:null,chunks:18389} },
            { slug: 'semantic1024',  name: 'Semantic-1024',             desc: 'Semantic chunking with 1024-token budget, sentence-boundary aware.',                       tags: ['semantic'],             params: { chunker:'semantic',    chunk_size:1024 }, bge:{mrr:0.9188,ndcg:0.9129,cas:0.663,latency:85, chunks:12987}, mini:{mrr:0.8979,ndcg:0.8948,cas:0.661,latency:null,chunks:12987} },
            { slug: 'fixed1024',     name: 'Fixed-1024',                desc: 'Fixed-size chunking, 1024-token windows, no overlap.',                                     tags: ['baseline','fixed'],     params: { chunker:'fixed',       chunk_size:1024 }, bge:{mrr:0.9187,ndcg:0.9308,cas:0.659,latency:80, chunks:8581 }, mini:{mrr:0.8932,ndcg:0.9097,cas:0.655,latency:49, chunks:8581 } },
            { slug: 'fixed512',      name: 'Fixed-512',                 desc: 'Fixed-size chunking, 512-token windows.',                                                  tags: ['baseline','fixed'],     params: { chunker:'fixed',       chunk_size:512  }, bge:{mrr:0.9185,ndcg:0.9253,cas:0.658,latency:null,chunks:9749 }, mini:{mrr:0.8926,ndcg:0.9046,cas:0.655,latency:53, chunks:9749 } },
            { slug: 'hybrid2000',    name: 'Hybrid-2000',               desc: 'Hybrid chunker combining sentence and semantic boundaries at 2000-token budget.',          tags: ['hybrid'],               params: { chunker:'hybrid',      chunk_size:2000 }, bge:{mrr:0.9241,ndcg:0.9208,cas:0.651,latency:103,chunks:16375}, mini:{mrr:0.8845,ndcg:0.8887,cas:0.644,latency:null,chunks:16375} },
            { slug: 'educational',   name: 'Educational-2000',          desc: 'Educational chunker preserving pedagogical units (definition–example, Q&A pairs).',        tags: ['pacer','educational'],  params: { chunker:'educational', chunk_size:2000 }, bge:{mrr:0.9241,ndcg:0.9208,cas:0.651,latency:null,chunks:16369}, mini:{mrr:0.8845,ndcg:0.8887,cas:0.644,latency:null,chunks:16369} },
        ];

        for (let i = 0; i < DEFS.length; i++) {
            const def = DEFS[i];
            const t = BASE - (7 - i) * DAY;

            const expId = await this.database.saveExperiment({
                name: def.name,
                description: def.desc,
                parameters: { ...def.params, overlap: 200, top_k: 10, corpus: 'NCERT 900-query benchmark' },
                tags: def.tags,
                status: 'completed',
                runCount: 2,
                metadata: { runCount: 2, seed: 42, corpus: 'NCERT', evaluated_queries: 798, corpus_size: 900 },
                createdAt: new Date(t).toISOString(),
                updatedAt: new Date(BASE).toISOString(),
            });

            const embKeys = ['bge', 'mini'];
            for (let j = 0; j < embKeys.length; j++) {
                const emb = embKeys[j];
                const m = def[emb];
                await this.database.saveExperimentRun({
                    experimentId: expId,
                    name: `Run ${j + 1} — ${EMB[emb]}`,
                    timestamp: new Date(t + j * 3600000).toISOString(),
                    parameters: { embedding: EMB[emb], evaluated_queries: 798, corpus_size: 900, corpus: 'NCERT' },
                    metrics: { mrr: m.mrr, ndcg: m.ndcg, cas: m.cas, latency_ms: m.latency, chunks: m.chunks },
                    metadata: { name: `Run ${j + 1}` },
                    status: 'completed',
                    duration: 3600000,
                });
            }

            console.log(`✅ Seeded: ${def.name}`);
        }
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
