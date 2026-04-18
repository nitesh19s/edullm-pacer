#!/usr/bin/env node

/**
 * EduLLM Platform - Complete Upgrade Test Script
 * Tests all 4 major upgrades locally
 */

const http = require('http');
const https = require('https');

// ANSI colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function print(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function printHeader(title) {
    console.log('\n' + '='.repeat(60));
    print(title, 'cyan');
    console.log('='.repeat(60) + '\n');
}

function printSuccess(message) {
    print(`✓ ${message}`, 'green');
}

function printError(message) {
    print(`✗ ${message}`, 'red');
}

function printInfo(message) {
    print(`ℹ ${message}`, 'yellow');
}

// HTTP request helper
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        const req = protocol.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        data: data,
                        headers: res.headers
                    });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// Test results tracker
const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
};

function recordTest(name, passed, details = '') {
    results.total++;
    if (passed) {
        results.passed++;
        printSuccess(`${name}${details ? ': ' + details : ''}`);
    } else {
        results.failed++;
        printError(`${name}${details ? ': ' + details : ''}`);
    }
    results.tests.push({ name, passed, details });
}

// Test 1: Backend API Integration
async function testBackendAPI() {
    printHeader('TEST 1: Backend API Integration');

    try {
        // Health check
        const health = await makeRequest('http://localhost:3000/health');
        recordTest('Backend health endpoint', health.statusCode === 200, health.data);

        // API version
        const versionMatch = health.data.includes('v1') || health.data.includes('healthy');
        recordTest('Backend API version check', versionMatch);

        // Check CORS headers
        const hasCORS = health.headers['access-control-allow-origin'] !== undefined;
        recordTest('CORS headers present', hasCORS);

    } catch (error) {
        recordTest('Backend API connection', false, error.message);
    }
}

// Test 2: Frontend Server
async function testFrontendServer() {
    printHeader('TEST 2: Frontend Server');

    try {
        // Main page
        const index = await makeRequest('http://localhost:8000/');
        recordTest('Frontend index.html', index.statusCode === 200);

        // Check for OpenAI script
        const hasOpenAI = index.data.includes('openai-config.js');
        recordTest('OpenAI script included', hasOpenAI);

        // Check for integration scripts
        const hasIntegration = index.data.includes('integration-config.js') &&
                              index.data.includes('api-client.js');
        recordTest('Integration scripts included', hasIntegration);

        // Check for translations
        const hasTranslations = index.data.includes('translations.js');
        recordTest('Translations script included', hasTranslations);

    } catch (error) {
        recordTest('Frontend server connection', false, error.message);
    }
}

// Test 3: OpenAI Configuration File
async function testOpenAIFiles() {
    printHeader('TEST 3: OpenAI Integration Files');

    try {
        // Check openai-config.js
        const openai = await makeRequest('http://localhost:8000/openai-config.js');
        recordTest('openai-config.js accessible', openai.statusCode === 200);

        const hasOpenAIConfig = openai.data.includes('class OpenAIConfig');
        recordTest('OpenAIConfig class present', hasOpenAIConfig);

        const hasOpenAITester = openai.data.includes('class OpenAITester');
        recordTest('OpenAITester class present', hasOpenAITester);

        const hasChatCompletion = openai.data.includes('createChatCompletion');
        recordTest('Chat completion method present', hasChatCompletion);

        const hasEmbeddings = openai.data.includes('createEmbeddings');
        recordTest('Embeddings method present', hasEmbeddings);

    } catch (error) {
        recordTest('OpenAI files check', false, error.message);
    }
}

// Test 4: Translations (Hindi Support)
async function testTranslations() {
    printHeader('TEST 4: Hindi Multi-Language Support');

    try {
        // Check translations.js
        const trans = await makeRequest('http://localhost:8000/translations.js');
        recordTest('translations.js accessible', trans.statusCode === 200);

        const hasHindi = trans.data.includes('hi:') && trans.data.includes('डैशबोर्ड');
        recordTest('Hindi translations present', hasHindi);

        const hasOpenAITrans = trans.data.includes('openai:') && trans.data.includes('OpenAI कॉन्फ़िगरेशन');
        recordTest('OpenAI translations added', hasOpenAITrans);

        const hasAPIIntegration = trans.data.includes('apiIntegration:') && trans.data.includes('बैकएंड API एकीकरण');
        recordTest('API Integration translations added', hasAPIIntegration);

        const hasResearch = trans.data.includes('research:') && trans.data.includes('अनुसंधान सुविधाएँ');
        recordTest('Research features translations added', hasResearch);

        const hasVectorDB = trans.data.includes('vectorDB:') && trans.data.includes('वेक्टर डेटाबेस');
        recordTest('Vector DB translations added', hasVectorDB);

        const hasTesting = trans.data.includes('testing:') && trans.data.includes('परीक्षण और डेमो');
        recordTest('Testing translations added', hasTesting);

    } catch (error) {
        recordTest('Translations check', false, error.message);
    }
}

// Test 5: Integration Scripts
async function testIntegrationScripts() {
    printHeader('TEST 5: Integration & Testing Scripts');

    try {
        // API Client
        const apiClient = await makeRequest('http://localhost:8000/api-client.js');
        recordTest('api-client.js accessible', apiClient.statusCode === 200);

        const hasAPIClient = apiClient.data.includes('class EduLLMAPIClient');
        recordTest('EduLLMAPIClient class present', hasAPIClient);

        // Integration Manager
        const integrationConfig = await makeRequest('http://localhost:8000/integration-config.js');
        recordTest('integration-config.js accessible', integrationConfig.statusCode === 200);

        const hasIntegrationManager = integrationConfig.data.includes('class IntegrationManager');
        recordTest('IntegrationManager class present', hasIntegrationManager);

        // Test Suite
        const testSuite = await makeRequest('http://localhost:8000/integration-test-suite.js');
        recordTest('integration-test-suite.js accessible', testSuite.statusCode === 200);

        const hasTestSuite = testSuite.data.includes('class IntegrationTestSuite');
        recordTest('IntegrationTestSuite class present', hasTestSuite);

        // Demo Workflow
        const demo = await makeRequest('http://localhost:8000/demo-workflow.js');
        recordTest('demo-workflow.js accessible', demo.statusCode === 200);

        const hasDemoWorkflow = demo.data.includes('class DemoWorkflow');
        recordTest('DemoWorkflow class present', hasDemoWorkflow);

    } catch (error) {
        recordTest('Integration scripts check', false, error.message);
    }
}

// Test 6: Documentation
async function testDocumentation() {
    printHeader('TEST 6: Documentation Files');

    const fs = require('fs');
    const path = require('path');

    const docs = [
        'OPENAI_INTEGRATION_GUIDE.md',
        'OPENAI_QUICK_START.md',
        'docs/USER_GUIDE.md',
        'docs/DEPLOYMENT_GUIDE.md',
        'UPGRADE_COMPLETION_SUMMARY.md'
    ];

    for (const doc of docs) {
        const filePath = path.join('/Users/nitesh/edullm-platform', doc);
        const exists = fs.existsSync(filePath);
        recordTest(`${doc} exists`, exists);
    }
}

// Test 7: Deployment Files
async function testDeploymentFiles() {
    printHeader('TEST 7: Production Deployment Files');

    const fs = require('fs');
    const path = require('path');

    const deployFiles = [
        'deployment/nginx/edullm.conf',
        'deployment/scripts/setup-ssl.sh',
        'deployment/docker-compose.prod.yml',
        'deployment/monitoring/prometheus/prometheus.yml',
        'deployment/monitoring/grafana/datasources/prometheus.yml',
        'deployment/cloud/aws/deploy-aws.sh'
    ];

    for (const file of deployFiles) {
        const filePath = path.join('/Users/nitesh/edullm-platform', file);
        const exists = fs.existsSync(filePath);
        recordTest(`${file} exists`, exists);

        // Check if scripts are executable
        if (file.endsWith('.sh')) {
            try {
                const stats = fs.statSync(filePath);
                const isExecutable = (stats.mode & 0o111) !== 0;
                recordTest(`${file} is executable`, isExecutable);
            } catch (e) {
                recordTest(`${file} permissions check`, false, e.message);
            }
        }
    }
}

// Test 8: Backend API Endpoints
async function testBackendEndpoints() {
    printHeader('TEST 8: Backend API Endpoints');

    const endpoints = [
        '/health',
        '/health/ready',
        '/health/live'
    ];

    for (const endpoint of endpoints) {
        try {
            const result = await makeRequest(`http://localhost:3000${endpoint}`);
            recordTest(`Endpoint ${endpoint}`, result.statusCode === 200);
        } catch (error) {
            recordTest(`Endpoint ${endpoint}`, false, error.message);
        }
    }
}

// Print Summary
function printSummary() {
    printHeader('TEST RESULTS SUMMARY');

    console.log(`Total Tests:    ${results.total}`);
    printSuccess(`Passed:         ${results.passed} (${((results.passed/results.total)*100).toFixed(1)}%)`);

    if (results.failed > 0) {
        printError(`Failed:         ${results.failed} (${((results.failed/results.total)*100).toFixed(1)}%)`);
    } else {
        printSuccess(`Failed:         0 (0.0%)`);
    }

    console.log('\n' + '='.repeat(60));

    if (results.failed === 0) {
        printSuccess('🎉 ALL TESTS PASSED! Platform is ready to use.');
    } else {
        printError(`⚠️  ${results.failed} test(s) failed. Please review above.`);
    }

    console.log('='.repeat(60) + '\n');

    // Access instructions
    printHeader('ACCESS INFORMATION');
    printInfo('Frontend: http://localhost:8000');
    printInfo('Backend API: http://localhost:3000');
    printInfo('API Docs: http://localhost:3000/api/v1/docs');
    printInfo('Health Check: http://localhost:3000/health');
    console.log('\n' + '='.repeat(60) + '\n');

    // Quick start instructions
    printHeader('QUICK START - Test OpenAI Integration');
    console.log('1. Open http://localhost:8000 in your browser');
    console.log('2. Open browser console (F12)');
    console.log('3. Run these commands:\n');
    console.log('   // Set OpenAI API key');
    console.log('   window.openaiConfig.setApiKey(\'sk-your-openai-key\');\n');
    console.log('   // Test API key');
    console.log('   await window.openaiConfig.testApiKey();\n');
    console.log('   // Run all OpenAI tests');
    console.log('   const tester = new OpenAITester(window.openaiConfig);');
    console.log('   await tester.runAllTests();\n');
    console.log('   // Set backend API key');
    console.log('   window.integrationManager.setApiKey(\'test-api-key\');\n');
    console.log('   // Run integration tests');
    console.log('   const test = new IntegrationTestSuite(window.integrationManager);');
    console.log('   await test.runAllTests();\n');
    console.log('='.repeat(60) + '\n');
}

// Main test runner
async function runAllTests() {
    print('\n🎓 EduLLM Platform - Complete Upgrade Test Suite\n', 'cyan');
    print('Testing all 4 major upgrades locally...\n', 'yellow');

    await testBackendAPI();
    await testFrontendServer();
    await testOpenAIFiles();
    await testTranslations();
    await testIntegrationScripts();
    await testDocumentation();
    await testDeploymentFiles();
    await testBackendEndpoints();

    printSummary();
}

// Run tests
runAllTests().catch(error => {
    printError(`Fatal error: ${error.message}`);
    process.exit(1);
});
