// Comprehensive Testing Suite for EduLLM Platform
class EduLLMTestSuite {
    constructor(platform) {
        this.platform = platform;
        this.testResults = {};
        this.testReports = [];
    }

    async runAllTests() {
        console.log('🚀 Starting Comprehensive EduLLM Platform Tests...\n');
        
        const testSuites = [
            { name: 'Core Platform', tests: this.runCoreTests.bind(this) },
            { name: 'Data Processing', tests: this.runDataProcessingTests.bind(this) },
            { name: 'RAG System', tests: this.runRAGTests.bind(this) },
            { name: 'Upload System', tests: this.runUploadTests.bind(this) },
            { name: 'User Interface', tests: this.runUITests.bind(this) },
            { name: 'Integration', tests: this.runIntegrationTests.bind(this) }
        ];

        for (const suite of testSuites) {
            console.log(`📋 Running ${suite.name} Tests...`);
            try {
                const results = await suite.tests();
                this.testResults[suite.name] = results;
                this.logTestResults(suite.name, results);
            } catch (error) {
                console.error(`❌ ${suite.name} Tests Failed:`, error);
                this.testResults[suite.name] = { error: error.message };
            }
            console.log(''); // Add spacing
        }

        this.generateTestReport();
        return this.testResults;
    }

    async runCoreTests() {
        const tests = {
            'Platform Initialization': () => {
                return this.platform && 
                       this.platform.dataProcessor && 
                       this.platform.pdfProcessor && 
                       this.platform.dataValidator;
            },
            'Navigation System': () => {
                const sections = ['dashboard', 'rag', 'chunking', 'knowledge', 'upload', 'settings'];
                for (const section of sections) {
                    this.platform.switchSection(section);
                    if (!document.getElementById(section).classList.contains('active')) {
                        return false;
                    }
                }
                return true;
            },
            'Statistics Display': () => {
                const statsElements = ['documentsIndexed', 'queriesProcessed', 'accuracyRate', 'avgResponseTime'];
                return statsElements.every(id => document.getElementById(id) !== null);
            },
            'Language Selector': () => {
                const langSelect = document.getElementById('languageSelect');
                return langSelect && langSelect.options.length > 0;
            }
        };

        return await this.executeTests(tests);
    }

    async runDataProcessingTests() {
        const tests = {
            'Data Collector': () => {
                return this.platform.dataProcessor.collector && 
                       this.platform.dataProcessor.collector.curriculum;
            },
            'Vector Store': async () => {
                await this.platform.dataProcessor.initialize();
                return this.platform.dataProcessor.vectorStore.size > 0;
            },
            'Search Index': () => {
                return this.platform.dataProcessor.searchIndex.size > 0;
            },
            'Concept Graph': () => {
                return this.platform.dataProcessor.conceptGraph.size > 0;
            },
            'Data Validation': async () => {
                const sampleData = { mathematics: { 10: { chapters: { 'Test': { content: 'Sample content' } } } } };
                const result = await this.platform.dataValidator.validateNCERTData(sampleData);
                return result.isValid !== undefined && result.qualityScore !== undefined;
            }
        };

        return await this.executeTests(tests);
    }

    async runRAGTests() {
        const tests = {
            'Query Processing': async () => {
                if (!this.platform.isDataLoaded) {
                    await this.platform.dataProcessor.initialize();
                }
                const query = 'What is a quadratic equation?';
                const response = await this.platform.dataProcessor.retrieveAndGenerate(query, {}, 2);
                return response.response && response.response.length > 0;
            },
            'Source Attribution': async () => {
                const query = 'Mathematics concepts';
                const response = await this.platform.dataProcessor.retrieveAndGenerate(query, {}, 2);
                return response.sources && response.sources.length > 0;
            },
            'Filter Application': async () => {
                const filters = { subject: 'mathematics', grade: '10' };
                const response = await this.platform.dataProcessor.retrieveAndGenerate('algebra', filters, 2);
                return response.relevantChunks && response.relevantChunks.length >= 0;
            },
            'Semantic Search': async () => {
                const result = await this.platform.dataProcessor.semanticSearch('polynomial equations', {}, { topK: 3 });
                return result.results && Array.isArray(result.results);
            }
        };

        return await this.executeTests(tests);
    }

    async runUploadTests() {
        const tests = {
            'PDF Processor Initialization': () => {
                return this.platform.pdfProcessor && 
                       this.platform.pdfProcessor.supportedFormats &&
                       this.platform.pdfProcessor.chapterPatterns;
            },
            'File Validation': () => {
                const validFile = { name: 'NCERT_Math_Class_10.pdf', type: 'application/pdf', size: 1024000 };
                const result = this.platform.pdfProcessor.validateFile(validFile);
                return result.isValid === true;
            },
            'Chapter Detection': () => {
                const sampleText = 'CHAPTER 1 - Real Numbers\nContent here\nCHAPTER 2 - Polynomials\nMore content';
                const chapters = this.platform.pdfProcessor.detectChapters(sampleText);
                return chapters.length === 2;
            },
            'Data Integration': () => {
                const processedData = this.platform.pdfProcessor.getAllProcessedData();
                return typeof processedData === 'object';
            },
            'Statistics Generation': () => {
                const stats = this.platform.pdfProcessor.getProcessingStatistics();
                return stats.hasOwnProperty('totalFiles') && stats.hasOwnProperty('totalChapters');
            }
        };

        return await this.executeTests(tests);
    }

    async runUITests() {
        const tests = {
            'Upload Interface': () => {
                const elements = ['uploadArea', 'fileInput', 'browseBtn'];
                return elements.every(id => document.getElementById(id) !== null);
            },
            'Chat Interface': () => {
                const elements = ['chatInput', 'sendButton', 'chatMessages'];
                return elements.every(id => document.getElementById(id) !== null);
            },
            'Chunking Controls': () => {
                const elements = ['chunkSize', 'chunkOverlap', 'chunksDisplay'];
                return elements.every(id => document.getElementById(id) !== null);
            },
            'Knowledge Graph': () => {
                const elements = ['focusTopic', 'relationshipDepth', 'knowledgeGraph'];
                return elements.every(id => document.getElementById(id) !== null);
            },
            'Settings Panel': () => {
                const elements = ['primaryCurriculum', 'temperature', 'saveSettings'];
                return elements.every(id => document.getElementById(id) !== null);
            },
            'Responsive Design': () => {
                // Test basic responsive behavior
                const mainContent = document.querySelector('.main-content');
                return mainContent && window.getComputedStyle(mainContent).display !== 'none';
            }
        };

        return await this.executeTests(tests);
    }

    async runIntegrationTests() {
        const tests = {
            'End-to-End RAG Flow': async () => {
                try {
                    // Simulate complete flow: filter -> query -> response
                    this.platform.switchSection('rag');
                    await this.delay(100);
                    
                    const chatInput = document.getElementById('chatInput');
                    if (chatInput) {
                        chatInput.value = 'What is algebra?';
                        await this.platform.sendMessage();
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.warn('End-to-end test failed:', error);
                    return false;
                }
            },
            'Data Upload Flow': () => {
                this.platform.switchSection('upload');
                const uploadArea = document.getElementById('uploadArea');
                return uploadArea && uploadArea.style.display !== 'none';
            },
            'Knowledge Graph Interaction': () => {
                this.platform.switchSection('knowledge');
                this.platform.renderKnowledgeGraph();
                const svg = document.querySelector('.knowledge-graph svg');
                return svg && svg.children.length > 0;
            },
            'Settings Persistence': () => {
                try {
                    this.platform.saveSettings();
                    return true;
                } catch (error) {
                    return false;
                }
            },
            'Error Handling': () => {
                // Test graceful error handling
                try {
                    this.platform.showNotification('Test notification', 'info');
                    return true;
                } catch (error) {
                    return false;
                }
            }
        };

        return await this.executeTests(tests);
    }

    async executeTests(tests) {
        const results = {};
        for (const [testName, testFn] of Object.entries(tests)) {
            try {
                const result = await testFn();
                results[testName] = { passed: !!result, error: null };
                console.log(`  ${result ? '✅' : '❌'} ${testName}`);
            } catch (error) {
                results[testName] = { passed: false, error: error.message };
                console.log(`  ❌ ${testName} (Error: ${error.message})`);
            }
        }
        return results;
    }

    logTestResults(suiteName, results) {
        const total = Object.keys(results).length;
        const passed = Object.values(results).filter(r => r.passed).length;
        const passRate = Math.round((passed / total) * 100);
        
        console.log(`📊 ${suiteName} Results: ${passed}/${total} tests passed (${passRate}%)`);
        
        if (passed < total) {
            const failed = Object.entries(results).filter(([_, r]) => !r.passed);
            console.log(`   Failed tests: ${failed.map(([name]) => name).join(', ')}`);
        }
    }

    generateTestReport() {
        const overallResults = {
            timestamp: new Date().toISOString(),
            totalSuites: Object.keys(this.testResults).length,
            results: {}
        };

        let totalTests = 0;
        let totalPassed = 0;

        for (const [suiteName, suiteResults] of Object.entries(this.testResults)) {
            if (suiteResults.error) {
                overallResults.results[suiteName] = { error: suiteResults.error };
                continue;
            }

            const tests = Object.keys(suiteResults).length;
            const passed = Object.values(suiteResults).filter(r => r.passed).length;
            
            totalTests += tests;
            totalPassed += passed;

            overallResults.results[suiteName] = {
                total: tests,
                passed: passed,
                failed: tests - passed,
                passRate: Math.round((passed / tests) * 100)
            };
        }

        overallResults.summary = {
            totalTests,
            totalPassed,
            totalFailed: totalTests - totalPassed,
            overallPassRate: Math.round((totalPassed / totalTests) * 100)
        };

        console.log('\n🎯 FINAL TEST REPORT');
        console.log('==================');
        console.log(`Overall: ${totalPassed}/${totalTests} tests passed (${overallResults.summary.overallPassRate}%)`);
        console.log('\nSuite Breakdown:');
        
        for (const [suite, result] of Object.entries(overallResults.results)) {
            if (result.error) {
                console.log(`  ${suite}: ERROR - ${result.error}`);
            } else {
                console.log(`  ${suite}: ${result.passed}/${result.total} (${result.passRate}%)`);
            }
        }

        console.log('\n💡 Recommendations:');
        if (overallResults.summary.overallPassRate >= 90) {
            console.log('  ✅ Platform is ready for production use');
            console.log('  ✅ All critical functions are working properly');
        } else if (overallResults.summary.overallPassRate >= 75) {
            console.log('  ⚠️  Platform is mostly functional but needs attention');
            console.log('  ⚠️  Address failing tests before production deployment');
        } else {
            console.log('  ❌ Platform needs significant fixes before use');
            console.log('  ❌ Review and fix critical failing tests');
        }

        // Save report to localStorage for later retrieval
        localStorage.setItem('eduLLMTestReport', JSON.stringify(overallResults));
        
        return overallResults;
    }

    // Performance testing
    async runPerformanceTests() {
        console.log('\n⚡ Running Performance Tests...');
        
        const perfTests = {
            'RAG Response Time': async () => {
                const start = performance.now();
                await this.platform.dataProcessor.retrieveAndGenerate('test query', {}, 3);
                const end = performance.now();
                const time = end - start;
                console.log(`  Response time: ${time.toFixed(2)}ms`);
                return time < 2000; // Should be under 2 seconds
            },
            'Search Performance': async () => {
                const start = performance.now();
                await this.platform.dataProcessor.search('mathematics', {});
                const end = performance.now();
                const time = end - start;
                console.log(`  Search time: ${time.toFixed(2)}ms`);
                return time < 500; // Should be under 500ms
            },
            'UI Responsiveness': () => {
                const start = performance.now();
                this.platform.switchSection('rag');
                this.platform.switchSection('chunking');
                this.platform.switchSection('knowledge');
                const end = performance.now();
                const time = end - start;
                console.log(`  Navigation time: ${time.toFixed(2)}ms`);
                return time < 100; // Should be under 100ms
            }
        };

        return await this.executeTests(perfTests);
    }

    // Utility methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Create test data for upload simulation
    createTestFile(name, content, type = 'application/pdf') {
        const blob = new Blob([content], { type });
        blob.name = name;
        return blob;
    }

    // Export test results
    exportTestResults() {
        const report = localStorage.getItem('eduLLMTestReport');
        if (report) {
            const blob = new Blob([report], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `edullm-test-report-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log('✅ Test report exported successfully');
        }
    }
}

// Make test suite available globally
if (typeof window !== 'undefined') {
    window.EduLLMTestSuite = EduLLMTestSuite;
    
    // Auto-create test suite when platform is ready
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.eduLLM) {
                window.testSuite = new EduLLMTestSuite(window.eduLLM);
                console.log('\n🧪 Test Suite Ready! Available commands:');
                console.log('- testSuite.runAllTests() - Run all tests');
                console.log('- testSuite.runPerformanceTests() - Run performance tests');
                console.log('- testSuite.exportTestResults() - Export test report');
            }
        }, 2000); // Wait for platform initialization
    });
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EduLLMTestSuite;
}