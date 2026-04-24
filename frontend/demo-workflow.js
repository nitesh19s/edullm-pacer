/**
 * EduLLM Platform - End-to-End Demo Workflow
 *
 * Demonstrates complete platform functionality with realistic scenarios
 */

class DemoWorkflow {
    constructor(integrationManager, testDataGenerator) {
        this.integration = integrationManager;
        this.apiClient = integrationManager.getAPIClient();
        this.dataGenerator = testDataGenerator;
        this.demoData = {
            experiments: [],
            students: [],
            collections: [],
            sessions: [],
            reports: []
        };
    }

    /**
     * Run complete demo workflow
     */
    async runCompleteDemo() {
        console.log('🎬 Starting EduLLM Platform Demo');
        console.log('==================================\n');

        try {
            // Check connection
            await this.checkSetup();

            // Run demo scenarios
            await this.demoExperimentWorkflow();
            await this.demoResearchFeaturesWorkflow();
            await this.demoVectorDatabaseWorkflow();
            await this.demoRAGChatWorkflow();
            await this.demoAnalyticsWorkflow();

            // Print summary
            this.printDemoSummary();

            console.log('\n✅ Demo completed successfully!');
            return true;
        } catch (error) {
            console.error('\n❌ Demo failed:', error.message);
            return false;
        }
    }

    /**
     * Check setup and connection
     */
    async checkSetup() {
        console.log('📋 Checking Setup');
        console.log('-----------------');

        const status = this.integration.getConnectionStatus();
        console.log(`Backend API: ${status.connected ? '✅ Connected' : '❌ Disconnected'}`);
        console.log(`API URL: ${status.apiURL}`);
        console.log(`Mode: ${status.mode}`);
        console.log(`API Key: ${status.hasApiKey ? '✅ Configured' : '⚠️  Not configured'}\n`);

        if (!status.connected) {
            throw new Error('Backend API not connected. Please start the backend server.');
        }
    }

    // ==================== EXPERIMENT WORKFLOW ====================

    async demoExperimentWorkflow() {
        console.log('🔬 Demo 1: Experiment Management');
        console.log('--------------------------------');

        // Create experiment
        console.log('Creating experiment...');
        const expData = this.dataGenerator.generateExperiment(1);
        const expResult = await this.apiClient.createExperiment(expData);
        const experimentId = expResult.data.id;
        this.demoData.experiments.push(expResult.data);
        console.log(`✅ Created experiment: ${expResult.data.name} (${experimentId})`);

        // Create experiment run
        console.log('Starting experiment run...');
        const runData = this.dataGenerator.generateExperimentRun(experimentId);
        const runResult = await this.apiClient.createExperimentRun(experimentId, runData);
        console.log(`✅ Created run with ${runData.testCases.length} test cases`);

        // Get statistics
        const stats = await this.apiClient.getExperimentStats(experimentId);
        console.log(`✅ Retrieved statistics: ${stats.data.statistics.totalRuns} runs`);

        console.log('');
    }

    // ==================== RESEARCH FEATURES WORKFLOW ====================

    async demoResearchFeaturesWorkflow() {
        console.log('📚 Demo 2: Research Features');
        console.log('----------------------------');

        const studentId = this.dataGenerator.generateStudentId(1);
        this.demoData.students.push(studentId);

        // Track multiple interactions
        console.log(`Tracking learning for student: ${studentId}...`);
        const interactions = this.dataGenerator.generateStudentInteractions(studentId, 10);

        for (let i = 0; i < 10; i++) {
            await this.apiClient.trackInteraction(interactions[i]);
            if ((i + 1) % 5 === 0) {
                console.log(`  Tracked ${i + 1}/10 interactions`);
            }
        }
        console.log(`✅ Tracked 10 learning interactions`);

        // Get progression analytics
        console.log('Generating progression analytics...');
        const progression = await this.apiClient.getProgressionAnalytics(studentId);
        const mastery = progression.data.mastery;
        console.log(`✅ Mastery: ${mastery.mastered.length} mastered, ${mastery.learning.length} learning, ${mastery.struggling.length} struggling`);

        // Analyze curriculum gaps
        console.log('Analyzing curriculum gaps...');
        const gapRequest = this.dataGenerator.generateGapAnalysisRequest(studentId);
        const gapAnalysis = await this.apiClient.analyzeCurriculumGaps(gapRequest);
        console.log(`✅ Found ${gapAnalysis.data.gaps.total} curriculum gaps`);

        // Analyze cross-subject performance
        console.log('Analyzing cross-subject performance...');
        const crossSubject = await this.apiClient.analyzeCrossSubject({ studentId });
        const subjects = Object.keys(crossSubject.data.subjectPerformance);
        console.log(`✅ Analyzed performance across ${subjects.length} subjects`);

        console.log('');
    }

    // ==================== VECTOR DATABASE WORKFLOW ====================

    async demoVectorDatabaseWorkflow() {
        console.log('🔍 Demo 3: Vector Database');
        console.log('--------------------------');

        // Create collection
        console.log('Creating vector collection...');
        const collectionData = this.dataGenerator.generateCollection(1);
        const collection = await this.apiClient.createCollection(collectionData);
        const collectionId = collection.data.id;
        this.demoData.collections.push(collection.data);
        console.log(`✅ Created collection: ${collection.data.name} (${collectionId})`);

        // Add documents
        console.log('Adding documents to collection...');
        const documents = this.dataGenerator.generateDocuments(20);
        const addResult = await this.apiClient.addDocuments(collectionId, documents);
        console.log(`✅ Added ${addResult.data.added} documents`);

        // Query collection
        console.log('Querying collection...');
        const query = this.dataGenerator.generateQuery();
        const queryResult = await this.apiClient.queryCollection(collectionId, query, 5);
        console.log(`✅ Query: "${query}"`);
        console.log(`   Retrieved ${queryResult.data.results.length} results`);

        // Get stats
        const vectorStats = await this.apiClient.getVectorStats();
        console.log(`✅ Vector DB stats: ${vectorStats.data.totalCollections} collections, ${vectorStats.data.totalDocuments} documents`);

        console.log('');
    }

    // ==================== RAG CHAT WORKFLOW ====================

    async demoRAGChatWorkflow() {
        console.log('💬 Demo 4: RAG Chat');
        console.log('-------------------');

        // Send multiple messages to create conversation
        console.log('Starting RAG chat conversation...');
        const messages = this.dataGenerator.generateConversation(5);

        let sessionId = null;

        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            if (sessionId) {
                message.sessionId = sessionId;
            }

            const response = await this.apiClient.sendMessage(message);
            sessionId = response.data.sessionId;

            console.log(`  Message ${i + 1}: "${message.message}"`);
            console.log(`  Response: Retrieved ${response.data.retrievedContext.length} context items`);
        }

        this.demoData.sessions.push(sessionId);
        console.log(`✅ Created conversation with ${messages.length} messages (Session: ${sessionId})`);

        // Get session history
        const session = await this.apiClient.getChatSession(sessionId);
        console.log(`✅ Retrieved session history: ${session.data.history.length} total messages`);

        // Get RAG stats
        const ragStats = await this.apiClient.getRagStats();
        console.log(`✅ RAG stats: ${ragStats.data.totalSessions} sessions, ${ragStats.data.totalMessages} messages`);

        console.log('');
    }

    // ==================== ANALYTICS WORKFLOW ====================

    async demoAnalyticsWorkflow() {
        console.log('📈 Demo 5: Analytics & Reporting');
        console.log('--------------------------------');

        // Generate report
        console.log('Generating analytics report...');
        const reportRequest = this.dataGenerator.generateReportRequest();
        const report = await this.apiClient.generateReport(reportRequest);
        this.demoData.reports.push(report.data);
        console.log(`✅ Generated ${report.data.type} report`);
        console.log(`   Insights: ${report.data.insights.length} key findings`);

        // Create baseline
        console.log('Creating performance baseline...');
        const baselineData = this.dataGenerator.generateBaseline(1);
        const baseline = await this.apiClient.createBaseline(baselineData);
        console.log(`✅ Created baseline: ${baseline.data.name}`);

        // Compare to baseline
        console.log('Comparing current performance to baseline...');
        const currentMetrics = {
            precision: 0.88,
            recall: 0.82,
            f1Score: 0.85,
            avgResponseTime: 1100
        };
        const comparison = await this.apiClient.compareToBaseline(baseline.data.id, currentMetrics);
        const improvement = comparison.data.results.improvement;
        console.log(`✅ Performance comparison:`);
        console.log(`   Precision: ${improvement.precision > 0 ? '+' : ''}${improvement.precision.toFixed(1)}%`);
        console.log(`   Recall: ${improvement.recall > 0 ? '+' : ''}${improvement.recall.toFixed(1)}%`);

        // Create A/B test
        console.log('Creating A/B test...');
        const abTestData = this.dataGenerator.generateABTest(1);
        const abTest = await this.apiClient.createABTest(abTestData);
        console.log(`✅ Created A/B test: ${abTest.data.name}`);
        console.log(`   Variant A: ${abTestData.variantA.model}`);
        console.log(`   Variant B: ${abTestData.variantB.model}`);

        // Get dashboard
        const dashboard = await this.apiClient.getAnalyticsDashboard();
        console.log(`✅ Dashboard summary: ${dashboard.data.summary.totalReports} reports, ${dashboard.data.summary.totalABTests} A/B tests`);

        console.log('');
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Print demo summary
     */
    printDemoSummary() {
        console.log('==================================');
        console.log('📊 Demo Summary');
        console.log('==================================');
        console.log(`Experiments Created: ${this.demoData.experiments.length}`);
        console.log(`Students Tracked: ${this.demoData.students.length}`);
        console.log(`Vector Collections: ${this.demoData.collections.length}`);
        console.log(`Chat Sessions: ${this.demoData.sessions.length}`);
        console.log(`Reports Generated: ${this.demoData.reports.length}`);
        console.log('==================================');
    }

    /**
     * Get demo data
     */
    getDemoData() {
        return this.demoData;
    }

    /**
     * Clear demo data
     */
    async clearDemoData() {
        console.log('🧹 Cleaning up demo data...');

        // Delete experiments
        for (const exp of this.demoData.experiments) {
            try {
                await this.apiClient.deleteExperiment(exp.id);
            } catch (error) {
                console.warn(`Failed to delete experiment ${exp.id}:`, error.message);
            }
        }

        // Delete collections
        for (const coll of this.demoData.collections) {
            try {
                await this.apiClient.deleteCollection(coll.id);
            } catch (error) {
                console.warn(`Failed to delete collection ${coll.id}:`, error.message);
            }
        }

        // Delete chat sessions
        for (const sessionId of this.demoData.sessions) {
            try {
                await this.apiClient.deleteChatSession(sessionId);
            } catch (error) {
                console.warn(`Failed to delete session ${sessionId}:`, error.message);
            }
        }

        console.log('✅ Demo data cleaned up');
        this.demoData = {
            experiments: [],
            students: [],
            collections: [],
            sessions: [],
            reports: []
        };
    }

    /**
     * Export demo results
     */
    exportDemoResults() {
        return {
            timestamp: new Date().toISOString(),
            connectionStatus: this.integration.getConnectionStatus(),
            demoData: this.demoData,
            summary: {
                experimentsCreated: this.demoData.experiments.length,
                studentsTracked: this.demoData.students.length,
                collectionsCreated: this.demoData.collections.length,
                chatSessionsCreated: this.demoData.sessions.length,
                reportsGenerated: this.demoData.reports.length
            }
        };
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.DemoWorkflow = DemoWorkflow;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DemoWorkflow;
}
