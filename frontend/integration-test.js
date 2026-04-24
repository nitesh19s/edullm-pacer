// Comprehensive Integration Testing Script for EduLLM Platform
console.log('🚀 Starting EduLLM Platform Integration Tests...\n');

// Wait for platform to initialize
setTimeout(async () => {
    if (!window.eduLLM || !window.testSuite) {
        console.error('❌ Platform not initialized. Please refresh and try again.');
        return;
    }

    console.log('🧪 Running Comprehensive Integration Tests...\n');

    try {
        // 1. Run All Platform Tests
        console.log('📋 Phase 1: Core Platform Tests');
        const allTestResults = await window.testSuite.runAllTests();
        
        // 2. Run Performance Tests
        console.log('\n⚡ Phase 2: Performance Tests');
        const perfResults = await window.testSuite.runPerformanceTests();
        
        // 3. Run Custom Integration Tests
        console.log('\n🔄 Phase 3: Integration Flow Tests');
        const integrationResults = await runIntegrationFlowTests();
        
        // 4. Generate Final Report
        console.log('\n📊 Phase 4: Generating Final Report');
        generateFinalIntegrationReport(allTestResults, perfResults, integrationResults);
        
        // 5. Export Results
        console.log('\n💾 Phase 5: Exporting Test Results');
        window.testSuite.exportTestResults();
        
        console.log('\n✅ Integration Testing Complete!');
        console.log('📄 Test report exported and saved to localStorage');
        
    } catch (error) {
        console.error('❌ Integration testing failed:', error);
    }
}, 3000);

// Custom integration flow tests
async function runIntegrationFlowTests() {
    console.log('  Running custom integration flows...');
    
    const results = {};
    
    // Test 1: Complete RAG workflow
    try {
        console.log('  🔍 Testing complete RAG workflow...');
        
        // Switch to RAG section
        window.eduLLM.switchSection('rag');
        await delay(500);
        
        // Set filters
        document.getElementById('subjectFilter').value = 'mathematics';
        document.getElementById('gradeFilter').value = '10';
        await delay(200);
        
        // Send test query
        const chatInput = document.getElementById('chatInput');
        chatInput.value = 'What are quadratic equations and how do you solve them?';
        
        // Simulate message sending
        await window.eduLLM.sendMessage();
        await delay(2000);
        
        // Check if response was generated
        const messages = document.querySelectorAll('.message');
        const hasResponse = messages.length > 1; // Initial + user + AI response
        
        results.ragWorkflow = { passed: hasResponse, details: `Messages count: ${messages.length}` };
        console.log(`    ${hasResponse ? '✅' : '❌'} RAG workflow test`);
        
    } catch (error) {
        results.ragWorkflow = { passed: false, error: error.message };
        console.log(`    ❌ RAG workflow test failed: ${error.message}`);
    }
    
    // Test 2: Upload system workflow
    try {
        console.log('  📤 Testing upload system workflow...');
        
        window.eduLLM.switchSection('upload');
        await delay(500);
        
        // Check upload area
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const browseBtn = document.getElementById('browseBtn');
        
        const uploadSystemWorking = uploadArea && fileInput && browseBtn;
        
        // Test file validation
        const testFile = { name: 'NCERT_Math_Class_10.pdf', type: 'application/pdf', size: 1024000 };
        const validationResult = window.eduLLM.pdfProcessor.validateFile(testFile);
        
        results.uploadWorkflow = { 
            passed: uploadSystemWorking && validationResult.isValid,
            details: `Upload elements present: ${uploadSystemWorking}, File validation: ${validationResult.isValid}`
        };
        console.log(`    ${results.uploadWorkflow.passed ? '✅' : '❌'} Upload system workflow test`);
        
    } catch (error) {
        results.uploadWorkflow = { passed: false, error: error.message };
        console.log(`    ❌ Upload workflow test failed: ${error.message}`);
    }
    
    // Test 3: Knowledge graph interactivity
    try {
        console.log('  🕸️ Testing knowledge graph interactivity...');
        
        window.eduLLM.switchSection('knowledge');
        await delay(500);
        
        // Test graph rendering
        window.eduLLM.renderKnowledgeGraph();
        await delay(1000);
        
        const svg = document.querySelector('#knowledgeGraph svg');
        const hasNodes = svg && svg.children.length > 0;
        
        // Test topic switching
        const focusTopic = document.getElementById('focusTopic');
        if (focusTopic) {
            focusTopic.value = 'physics';
            focusTopic.dispatchEvent(new Event('change'));
            await delay(500);
        }
        
        results.knowledgeGraphWorkflow = { 
            passed: hasNodes,
            details: `SVG elements: ${svg ? svg.children.length : 0}`
        };
        console.log(`    ${hasNodes ? '✅' : '❌'} Knowledge graph workflow test`);
        
    } catch (error) {
        results.knowledgeGraphWorkflow = { passed: false, error: error.message };
        console.log(`    ❌ Knowledge graph workflow test failed: ${error.message}`);
    }
    
    // Test 4: Settings persistence
    try {
        console.log('  ⚙️ Testing settings persistence...');
        
        window.eduLLM.switchSection('settings');
        await delay(500);
        
        // Test settings save
        const tempValue = document.getElementById('temperature').value;
        document.getElementById('temperature').value = '0.8';
        
        window.eduLLM.saveSettings();
        
        // Check if saved to localStorage
        const savedSettings = localStorage.getItem('eduLLMSettings');
        const settingsSaved = savedSettings !== null;
        
        results.settingsWorkflow = { 
            passed: settingsSaved,
            details: `Settings saved: ${settingsSaved}`
        };
        console.log(`    ${settingsSaved ? '✅' : '❌'} Settings persistence test`);
        
    } catch (error) {
        results.settingsWorkflow = { passed: false, error: error.message };
        console.log(`    ❌ Settings workflow test failed: ${error.message}`);
    }
    
    // Test 5: Data quality validation
    try {
        console.log('  🔍 Testing data quality validation...');
        
        const sampleData = {
            mathematics: {
                10: {
                    chapters: {
                        'Real Numbers': { content: 'Sample content about real numbers...' },
                        'Polynomials': { content: 'Sample content about polynomials...' }
                    }
                }
            }
        };
        
        const validationResult = await window.eduLLM.dataValidator.validateNCERTData(sampleData);
        const isValidData = validationResult.isValid && validationResult.qualityScore > 0;
        
        results.dataValidationWorkflow = { 
            passed: isValidData,
            details: `Quality score: ${validationResult.qualityScore}%, Valid: ${validationResult.isValid}`
        };
        console.log(`    ${isValidData ? '✅' : '❌'} Data validation workflow test`);
        
    } catch (error) {
        results.dataValidationWorkflow = { passed: false, error: error.message };
        console.log(`    ❌ Data validation workflow test failed: ${error.message}`);
    }
    
    return results;
}

function generateFinalIntegrationReport(allTests, perfTests, integrationTests) {
    console.log('\n🎯 FINAL INTEGRATION TEST REPORT');
    console.log('=====================================');
    
    // Calculate overall statistics
    let totalTests = 0;
    let passedTests = 0;
    
    // Count core platform tests
    for (const [suiteName, suiteResults] of Object.entries(allTests)) {
        if (!suiteResults.error) {
            const suiteTestCount = Object.keys(suiteResults).length;
            const suitePassedCount = Object.values(suiteResults).filter(r => r.passed).length;
            totalTests += suiteTestCount;
            passedTests += suitePassedCount;
        }
    }
    
    // Count performance tests
    if (perfTests && !perfTests.error) {
        const perfTestCount = Object.keys(perfTests).length;
        const perfPassedCount = Object.values(perfTests).filter(r => r.passed).length;
        totalTests += perfTestCount;
        passedTests += perfPassedCount;
    }
    
    // Count integration tests
    if (integrationTests) {
        const integrationTestCount = Object.keys(integrationTests).length;
        const integrationPassedCount = Object.values(integrationTests).filter(r => r.passed).length;
        totalTests += integrationTestCount;
        passedTests += integrationPassedCount;
    }
    
    const overallPassRate = Math.round((passedTests / totalTests) * 100);
    
    console.log(`📊 Overall Results: ${passedTests}/${totalTests} tests passed (${overallPassRate}%)`);
    console.log('');
    
    // Integration flow results
    console.log('🔄 Integration Flow Results:');
    for (const [testName, result] of Object.entries(integrationTests || {})) {
        const status = result.passed ? '✅' : '❌';
        console.log(`  ${status} ${testName}: ${result.details || result.error || 'No details'}`);
    }
    console.log('');
    
    // Platform readiness assessment
    console.log('🚀 Platform Readiness Assessment:');
    if (overallPassRate >= 95) {
        console.log('  ✅ EXCELLENT - Platform is production-ready');
        console.log('  ✅ All critical systems functioning optimally');
        console.log('  ✅ Ready for PhD research and educational use');
    } else if (overallPassRate >= 85) {
        console.log('  ✅ GOOD - Platform is ready with minor issues');
        console.log('  ⚠️  Some non-critical features may need attention');
        console.log('  ✅ Suitable for research use with monitoring');
    } else if (overallPassRate >= 70) {
        console.log('  ⚠️  FAIR - Platform needs improvement');
        console.log('  ⚠️  Address failing tests before production use');
        console.log('  ⚠️  Limited research use recommended');
    } else {
        console.log('  ❌ POOR - Platform requires significant fixes');
        console.log('  ❌ Not recommended for production or research use');
        console.log('  ❌ Major system failures detected');
    }
    
    console.log('');
    console.log('📋 Next Steps:');
    console.log('  1. Review any failing tests in detail');
    console.log('  2. Test with real NCERT PDF uploads');
    console.log('  3. Validate responses with domain experts');
    console.log('  4. Monitor performance with large datasets');
    console.log('  5. Document any limitations for research use');
    
    // Save comprehensive report
    const comprehensiveReport = {
        timestamp: new Date().toISOString(),
        summary: {
            totalTests,
            passedTests,
            overallPassRate,
            status: overallPassRate >= 95 ? 'EXCELLENT' : overallPassRate >= 85 ? 'GOOD' : overallPassRate >= 70 ? 'FAIR' : 'POOR'
        },
        coreTests: allTests,
        performanceTests: perfTests,
        integrationTests: integrationTests
    };
    
    localStorage.setItem('eduLLMComprehensiveReport', JSON.stringify(comprehensiveReport));
    console.log('💾 Comprehensive report saved to localStorage');
}

// Utility function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Export comprehensive report function
window.exportComprehensiveReport = function() {
    const report = localStorage.getItem('eduLLMComprehensiveReport');
    if (report) {
        const blob = new Blob([report], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `edullm-comprehensive-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('✅ Comprehensive report exported successfully');
    } else {
        console.log('❌ No comprehensive report found. Run integration tests first.');
    }
};

console.log('Integration test script loaded. Tests will run automatically...');