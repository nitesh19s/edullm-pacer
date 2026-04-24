/**
 * EduLLM Platform - Integration Test Suite
 *
 * Comprehensive end-to-end testing of frontend-backend integration
 */

class IntegrationTestSuite {
    constructor(integrationManager) {
        this.integration = integrationManager;
        this.apiClient = integrationManager.getAPIClient();
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            tests: []
        };
    }

    /**
     * Run all integration tests
     */
    async runAllTests() {
        console.log('🧪 Starting Integration Test Suite');
        console.log('===================================\n');

        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            tests: []
        };

        // Test categories
        await this.testConnectionAndHealth();
        await this.testExperimentsAPI();
        await this.testResearchFeaturesAPI();
        await this.testVectorDatabaseAPI();
        await this.testRAGChatAPI();
        await this.testAnalyticsAPI();

        // Print summary
        this.printSummary();

        return this.results;
    }

    /**
     * Run single test
     */
    async runTest(name, testFn) {
        this.results.total++;
        const startTime = Date.now();

        try {
            console.log(`📝 ${name}...`);
            await testFn();
            const duration = Date.now() - startTime;

            this.results.passed++;
            this.results.tests.push({
                name,
                status: 'passed',
                duration,
                error: null
            });

            console.log(`  ✅ PASSED (${duration}ms)\n`);
            return true;
        } catch (error) {
            const duration = Date.now() - startTime;

            this.results.failed++;
            this.results.tests.push({
                name,
                status: 'failed',
                duration,
                error: error.message
            });

            console.error(`  ❌ FAILED (${duration}ms)`);
            console.error(`     Error: ${error.message}\n`);
            return false;
        }
    }

    /**
     * Skip test
     */
    skipTest(name, reason) {
        this.results.total++;
        this.results.skipped++;
        this.results.tests.push({
            name,
            status: 'skipped',
            duration: 0,
            error: reason
        });

        console.log(`  ⊘ SKIPPED: ${reason}\n`);
    }

    // ==================== CONNECTION & HEALTH TESTS ====================

    async testConnectionAndHealth() {
        console.log('\n🔌 Connection & Health Tests');
        console.log('----------------------------');

        await this.runTest('Backend API Connection', async () => {
            const connected = await this.integration.checkConnection();
            if (!connected) {
                throw new Error('Failed to connect to backend API');
            }
        });

        await this.runTest('Health Check Endpoint', async () => {
            const response = await fetch(`${this.apiClient.baseURL.replace('/api/v1', '')}/health`);
            const data = await response.json();

            if (data.status !== 'healthy') {
                throw new Error(`Health check failed: ${data.status}`);
            }
        });

        await this.runTest('Detailed Health Endpoint', async () => {
            const response = await fetch(`${this.apiClient.baseURL.replace('/api/v1', '')}/health/detailed`);
            const data = await response.json();

            if (!data.system || !data.process) {
                throw new Error('Detailed health check missing required fields');
            }
        });
    }

    // ==================== EXPERIMENTS API TESTS ====================

    async testExperimentsAPI() {
        console.log('\n🔬 Experiments API Tests');
        console.log('------------------------');

        let createdExperimentId = null;

        await this.runTest('Create Experiment', async () => {
            const result = await this.apiClient.createExperiment({
                name: 'Integration Test Experiment',
                description: 'Test experiment created by integration tests',
                configuration: {
                    provider: 'openai',
                    model: 'gpt-3.5-turbo',
                    temperature: 0.7,
                    maxTokens: 1000
                }
            });

            if (!result.success || !result.data.id) {
                throw new Error('Failed to create experiment');
            }

            createdExperimentId = result.data.id;
        });

        await this.runTest('List Experiments', async () => {
            const result = await this.apiClient.getExperiments();

            if (!result.success || !Array.isArray(result.data)) {
                throw new Error('Failed to list experiments');
            }
        });

        if (createdExperimentId) {
            await this.runTest('Get Experiment by ID', async () => {
                const result = await this.apiClient.getExperiment(createdExperimentId);

                if (!result.success || result.data.id !== createdExperimentId) {
                    throw new Error('Failed to get experiment by ID');
                }
            });

            await this.runTest('Update Experiment', async () => {
                const result = await this.apiClient.updateExperiment(createdExperimentId, {
                    name: 'Updated Test Experiment',
                    description: 'Updated description',
                    configuration: {
                        provider: 'openai',
                        model: 'gpt-4',
                        temperature: 0.5
                    }
                });

                if (!result.success || result.data.name !== 'Updated Test Experiment') {
                    throw new Error('Failed to update experiment');
                }
            });

            await this.runTest('Create Experiment Run', async () => {
                const result = await this.apiClient.createExperimentRun(createdExperimentId, {
                    testCases: [
                        { input: 'test input', expected: 'test output' }
                    ]
                });

                if (!result.success || !result.data.id) {
                    throw new Error('Failed to create experiment run');
                }
            });

            await this.runTest('Get Experiment Stats', async () => {
                const result = await this.apiClient.getExperimentStats(createdExperimentId);

                if (!result.success || !result.data.statistics) {
                    throw new Error('Failed to get experiment stats');
                }
            });

            await this.runTest('Delete Experiment', async () => {
                const result = await this.apiClient.deleteExperiment(createdExperimentId);

                if (!result.success) {
                    throw new Error('Failed to delete experiment');
                }
            });
        }
    }

    // ==================== RESEARCH FEATURES API TESTS ====================

    async testResearchFeaturesAPI() {
        console.log('\n📚 Research Features API Tests');
        console.log('------------------------------');

        const testStudentId = 'integration_test_student';

        await this.runTest('Track Learning Interaction', async () => {
            const result = await this.apiClient.trackInteraction({
                studentId: testStudentId,
                conceptId: 'test_concept_001',
                conceptName: 'Integration Test Concept',
                subject: 'Mathematics',
                grade: 10,
                difficulty: 5,
                success: true,
                responseTime: 1200,
                confidence: 0.85
            });

            if (!result.success) {
                throw new Error('Failed to track interaction');
            }
        });

        await this.runTest('Get Student Progression', async () => {
            const result = await this.apiClient.getProgression(testStudentId);

            if (!result.success || result.data.studentId !== testStudentId) {
                throw new Error('Failed to get student progression');
            }
        });

        await this.runTest('Get Progression Analytics', async () => {
            const result = await this.apiClient.getProgressionAnalytics(testStudentId);

            if (!result.success || !result.data.mastery) {
                throw new Error('Failed to get progression analytics');
            }
        });

        await this.runTest('Analyze Curriculum Gaps', async () => {
            const result = await this.apiClient.analyzeCurriculumGaps({
                studentId: testStudentId,
                targetGrade: 10,
                targetSubject: 'Mathematics'
            });

            if (!result.success || !result.data.gaps) {
                throw new Error('Failed to analyze curriculum gaps');
            }
        });

        await this.runTest('Analyze Cross-Subject Performance', async () => {
            const result = await this.apiClient.analyzeCrossSubject({
                studentId: testStudentId
            });

            if (!result.success || !result.data.subjectPerformance) {
                throw new Error('Failed to analyze cross-subject performance');
            }
        });

        await this.runTest('List All Students', async () => {
            const result = await this.apiClient.getStudents();

            if (!result.success || !Array.isArray(result.data)) {
                throw new Error('Failed to list students');
            }
        });
    }

    // ==================== VECTOR DATABASE API TESTS ====================

    async testVectorDatabaseAPI() {
        console.log('\n🔍 Vector Database API Tests');
        console.log('----------------------------');

        let createdCollectionId = null;

        await this.runTest('Create Vector Collection', async () => {
            const result = await this.apiClient.createCollection({
                name: 'Integration Test Collection',
                description: 'Test collection for integration tests'
            });

            if (!result.success || !result.data.id) {
                throw new Error('Failed to create collection');
            }

            createdCollectionId = result.data.id;
        });

        await this.runTest('List Vector Collections', async () => {
            const result = await this.apiClient.getCollections();

            if (!result.success || !Array.isArray(result.data)) {
                throw new Error('Failed to list collections');
            }
        });

        if (createdCollectionId) {
            await this.runTest('Add Documents to Collection', async () => {
                const result = await this.apiClient.addDocuments(createdCollectionId, [
                    {
                        text: 'Test document 1',
                        metadata: { source: 'integration_test' }
                    },
                    {
                        text: 'Test document 2',
                        metadata: { source: 'integration_test' }
                    }
                ]);

                if (!result.success || result.data.added !== 2) {
                    throw new Error('Failed to add documents');
                }
            });

            await this.runTest('Query Vector Collection', async () => {
                const result = await this.apiClient.queryCollection(
                    createdCollectionId,
                    'test query',
                    5
                );

                if (!result.success || !Array.isArray(result.data.results)) {
                    throw new Error('Failed to query collection');
                }
            });

            await this.runTest('Get Vector Database Stats', async () => {
                const result = await this.apiClient.getVectorStats();

                if (!result.success || !result.data.totalCollections) {
                    throw new Error('Failed to get vector stats');
                }
            });

            await this.runTest('Delete Vector Collection', async () => {
                const result = await this.apiClient.deleteCollection(createdCollectionId);

                if (!result.success) {
                    throw new Error('Failed to delete collection');
                }
            });
        }
    }

    // ==================== RAG CHAT API TESTS ====================

    async testRAGChatAPI() {
        console.log('\n💬 RAG Chat API Tests');
        console.log('---------------------');

        let createdSessionId = null;

        await this.runTest('Send Chat Message', async () => {
            const result = await this.apiClient.sendMessage({
                message: 'Integration test question',
                context: {
                    subject: 'Mathematics',
                    grade: 10
                }
            });

            if (!result.success || !result.data.sessionId) {
                throw new Error('Failed to send chat message');
            }

            createdSessionId = result.data.sessionId;
        });

        if (createdSessionId) {
            await this.runTest('Get Chat Session', async () => {
                const result = await this.apiClient.getChatSession(createdSessionId);

                if (!result.success || !result.data.session) {
                    throw new Error('Failed to get chat session');
                }
            });
        }

        await this.runTest('List Chat Sessions', async () => {
            const result = await this.apiClient.getChatSessions();

            if (!result.success || !Array.isArray(result.data)) {
                throw new Error('Failed to list chat sessions');
            }
        });

        await this.runTest('Retrieve Context', async () => {
            const result = await this.apiClient.retrieveContext('test query', 5);

            if (!result.success || !Array.isArray(result.data.results)) {
                throw new Error('Failed to retrieve context');
            }
        });

        await this.runTest('Get RAG Statistics', async () => {
            const result = await this.apiClient.getRagStats();

            if (!result.success || typeof result.data.totalSessions !== 'number') {
                throw new Error('Failed to get RAG stats');
            }
        });

        if (createdSessionId) {
            await this.runTest('Delete Chat Session', async () => {
                const result = await this.apiClient.deleteChatSession(createdSessionId);

                if (!result.success) {
                    throw new Error('Failed to delete chat session');
                }
            });
        }
    }

    // ==================== ANALYTICS API TESTS ====================

    async testAnalyticsAPI() {
        console.log('\n📈 Analytics API Tests');
        console.log('----------------------');

        let createdReportId = null;
        let createdBaselineId = null;
        let createdABTestId = null;

        await this.runTest('Generate Analytics Report', async () => {
            const result = await this.apiClient.generateReport({
                type: 'summary'
            });

            if (!result.success || !result.data.id) {
                throw new Error('Failed to generate report');
            }

            createdReportId = result.data.id;
        });

        await this.runTest('List Analytics Reports', async () => {
            const result = await this.apiClient.getReports();

            if (!result.success || !Array.isArray(result.data)) {
                throw new Error('Failed to list reports');
            }
        });

        if (createdReportId) {
            await this.runTest('Get Report by ID', async () => {
                const result = await this.apiClient.getReport(createdReportId);

                if (!result.success || result.data.id !== createdReportId) {
                    throw new Error('Failed to get report');
                }
            });
        }

        await this.runTest('Create Baseline', async () => {
            const result = await this.apiClient.createBaseline({
                name: 'Integration Test Baseline',
                metrics: {
                    precision: 0.85,
                    recall: 0.80,
                    f1Score: 0.825,
                    avgResponseTime: 1200
                }
            });

            if (!result.success || !result.data.id) {
                throw new Error('Failed to create baseline');
            }

            createdBaselineId = result.data.id;
        });

        await this.runTest('List Baselines', async () => {
            const result = await this.apiClient.getBaselines();

            if (!result.success || !Array.isArray(result.data)) {
                throw new Error('Failed to list baselines');
            }
        });

        if (createdBaselineId) {
            await this.runTest('Compare to Baseline', async () => {
                const result = await this.apiClient.compareToBaseline(createdBaselineId, {
                    precision: 0.88,
                    recall: 0.82,
                    f1Score: 0.85,
                    avgResponseTime: 1100
                });

                if (!result.success || !result.data.results) {
                    throw new Error('Failed to compare to baseline');
                }
            });
        }

        await this.runTest('Create A/B Test', async () => {
            const result = await this.apiClient.createABTest({
                name: 'Integration Test A/B',
                variantA: { model: 'gpt-3.5-turbo' },
                variantB: { model: 'gpt-4' }
            });

            if (!result.success || !result.data.id) {
                throw new Error('Failed to create A/B test');
            }

            createdABTestId = result.data.id;
        });

        await this.runTest('List A/B Tests', async () => {
            const result = await this.apiClient.getABTests();

            if (!result.success || !Array.isArray(result.data)) {
                throw new Error('Failed to list A/B tests');
            }
        });

        if (createdABTestId) {
            await this.runTest('Get A/B Test by ID', async () => {
                const result = await this.apiClient.getABTest(createdABTestId);

                if (!result.success || result.data.id !== createdABTestId) {
                    throw new Error('Failed to get A/B test');
                }
            });
        }

        await this.runTest('Get Analytics Dashboard', async () => {
            const result = await this.apiClient.getAnalyticsDashboard();

            if (!result.success || !result.data.summary) {
                throw new Error('Failed to get analytics dashboard');
            }
        });
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Print test summary
     */
    printSummary() {
        console.log('\n===================================');
        console.log('📊 Test Summary');
        console.log('===================================');
        console.log(`Total Tests:   ${this.results.total}`);
        console.log(`✅ Passed:     ${this.results.passed} (${((this.results.passed / this.results.total) * 100).toFixed(1)}%)`);
        console.log(`❌ Failed:     ${this.results.failed} (${((this.results.failed / this.results.total) * 100).toFixed(1)}%)`);
        console.log(`⊘ Skipped:     ${this.results.skipped} (${((this.results.skipped / this.results.total) * 100).toFixed(1)}%)`);
        console.log('===================================\n');

        if (this.results.failed > 0) {
            console.log('Failed Tests:');
            this.results.tests
                .filter(t => t.status === 'failed')
                .forEach(t => {
                    console.log(`  ❌ ${t.name}: ${t.error}`);
                });
            console.log('');
        }

        if (this.results.passed === this.results.total) {
            console.log('🎉 All tests passed!');
        } else {
            console.log(`⚠️  ${this.results.failed} test(s) failed`);
        }
    }

    /**
     * Get test results
     */
    getResults() {
        return this.results;
    }

    /**
     * Export test results
     */
    exportResults() {
        return JSON.stringify(this.results, null, 2);
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.IntegrationTestSuite = IntegrationTestSuite;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntegrationTestSuite;
}
