/**
 * Local RAG System Test Suite
 * Comprehensive tests for Phase 1 implementation
 *
 * USAGE:
 * 1. Open index.html in browser
 * 2. Open browser console (F12 or Cmd+Option+I)
 * 3. Copy and paste this entire file into the console
 * 4. Run: await runAllTests()
 */

console.log('🧪 Local RAG Test Suite Loaded');
console.log('Run: await runAllTests()');

/**
 * Test 1: Check if services are loaded
 */
async function testServicesLoaded() {
    console.log('\n📦 TEST 1: Services Loaded Check');
    console.log('='.repeat(50));

    const services = {
        'Ollama Service': window.localOllamaService,
        'Transformers Service': window.localTransformersService,
        'Model Manager': window.localModelManager,
        'Model Settings': window.localModelSettings,
        'RAG Orchestrator': window.ragOrchestrator,
        'Vector Store': window.enhancedVectorStore
    };

    let passed = 0;
    let failed = 0;

    for (const [name, service] of Object.entries(services)) {
        if (service) {
            console.log(`✅ ${name}: Loaded`);
            passed++;
        } else {
            console.log(`❌ ${name}: NOT LOADED`);
            failed++;
        }
    }

    console.log(`\nResult: ${passed} passed, ${failed} failed`);
    return failed === 0;
}

/**
 * Test 2: Initialize services
 */
async function testInitialization() {
    console.log('\n🚀 TEST 2: Service Initialization');
    console.log('='.repeat(50));

    try {
        // Initialize Ollama
        console.log('Initializing Ollama...');
        const ollamaReady = await window.localOllamaService.initialize();
        console.log(ollamaReady ? '✅ Ollama initialized' : '⚠️ Ollama not available');

        // Initialize Transformers.js
        console.log('Initializing Transformers.js...');
        const transformersReady = await window.localTransformersService.initialize();
        console.log(transformersReady ? '✅ Transformers.js initialized' : '⚠️ Transformers.js not available');

        // Initialize Model Manager
        console.log('Initializing Model Manager...');
        const managerReady = await window.localModelManager.initialize();
        console.log(managerReady ? '✅ Model Manager initialized' : '❌ Model Manager failed');

        if (managerReady) {
            const provider = window.localModelManager.getActiveProvider();
            console.log(`📍 Active Provider: ${provider}`);
        }

        // Initialize RAG Orchestrator
        console.log('Initializing RAG Orchestrator...');
        const ragReady = await window.ragOrchestrator.initialize();
        console.log(ragReady ? '✅ RAG Orchestrator initialized' : '❌ RAG Orchestrator failed');

        return managerReady && ragReady;

    } catch (error) {
        console.error('❌ Initialization error:', error);
        return false;
    }
}

/**
 * Test 3: Text Generation
 */
async function testTextGeneration() {
    console.log('\n💬 TEST 3: Text Generation');
    console.log('='.repeat(50));

    try {
        console.log('Generating text...');
        const startTime = Date.now();

        const response = await window.localModelManager.generateText(
            "What is 2+2? Answer in one short sentence.",
            { maxTokens: 50, temperature: 0.1 }
        );

        const duration = Date.now() - startTime;

        console.log('✅ Text generated successfully');
        console.log(`📝 Response: "${response.content}"`);
        console.log(`🏭 Provider: ${response.provider}`);
        console.log(`🤖 Model: ${response.model}`);
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log(`🔢 Tokens: ${response.usage.total_tokens}`);

        return true;

    } catch (error) {
        console.error('❌ Text generation failed:', error);
        return false;
    }
}

/**
 * Test 4: Embedding Generation
 */
async function testEmbeddings() {
    console.log('\n📐 TEST 4: Embedding Generation');
    console.log('='.repeat(50));

    try {
        console.log('Generating embeddings...');
        const startTime = Date.now();

        const testTexts = [
            "Photosynthesis is the process plants use to make food.",
            "The mitochondria is the powerhouse of the cell.",
            "Water is composed of hydrogen and oxygen."
        ];

        const embeddings = await window.localModelManager.generateEmbeddings(testTexts);

        const duration = Date.now() - startTime;

        console.log('✅ Embeddings generated successfully');
        console.log(`📊 Count: ${embeddings.length} embeddings`);
        console.log(`📏 Dimensions: ${embeddings[0].length}`);
        console.log(`⏱️  Duration: ${duration}ms (${Math.round(duration/testTexts.length)}ms per embedding)`);

        // Check if they're different
        const similar = embeddings[0].slice(0, 5).every((val, idx) => val === embeddings[1][idx]);
        console.log(`🔍 Are embeddings different? ${!similar ? 'Yes ✅' : 'No (WARNING)'}`);

        return embeddings.length === testTexts.length;

    } catch (error) {
        console.error('❌ Embedding generation failed:', error);
        return false;
    }
}

/**
 * Test 5: Vector Store
 */
async function testVectorStore() {
    console.log('\n🗄️  TEST 5: Vector Store Operations');
    console.log('='.repeat(50));

    try {
        console.log('Adding test document...');

        const testDoc = `Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy.
This chemical energy is stored in carbohydrate molecules, such as sugars and starches.
Photosynthesis occurs in the chloroplasts of plant cells and requires light, water, and carbon dioxide.
The process produces glucose and oxygen as byproducts.`;

        const result = await window.enhancedVectorStore.addDocument(testDoc, {
            title: 'Photosynthesis Test Document',
            subject: 'Biology',
            grade: 10,
            collection: 'test'
        });

        console.log('✅ Document added successfully');
        console.log(`📄 Chunks created: ${result.chunkCount}`);
        console.log(`🆔 Document ID: ${result.documentId}`);

        // Test search
        console.log('\nSearching for: "How do plants make food?"');
        const searchResults = await window.enhancedVectorStore.search(
            "How do plants make food?",
            { topK: 3, collection: 'test' }
        );

        console.log('✅ Search completed');
        console.log(`🔍 Results found: ${searchResults.length}`);

        if (searchResults.length > 0) {
            console.log(`📊 Top result score: ${searchResults[0].score.toFixed(3)}`);
            console.log(`📝 Top result preview: "${searchResults[0].content.substring(0, 100)}..."`);
        }

        return searchResults.length > 0;

    } catch (error) {
        console.error('❌ Vector store test failed:', error);
        return false;
    }
}

/**
 * Test 6: Full RAG Pipeline
 */
async function testRAGPipeline() {
    console.log('\n🎯 TEST 6: Full RAG Pipeline');
    console.log('='.repeat(50));

    try {
        console.log('Running complete RAG query...');

        const query = "What is photosynthesis and what does it produce?";
        console.log(`❓ Question: "${query}"`);

        const startTime = Date.now();

        const result = await window.ragOrchestrator.generateAnswer(query, {
            subject: 'Biology',
            grade: 10,
            collection: 'test'
        });

        const duration = Date.now() - startTime;

        console.log('\n✅ RAG Pipeline completed successfully!');
        console.log('='.repeat(50));
        console.log(`\n📝 ANSWER:\n${result.answer}\n`);
        console.log('='.repeat(50));
        console.log(`\n📊 METADATA:`);
        console.log(`   Confidence: ${result.confidence}`);
        console.log(`   Sources used: ${result.sources.length}`);
        console.log(`   Chunks retrieved: ${result.metadata.chunksUsed}`);
        console.log(`   Model: ${result.metadata.model}`);
        console.log(`   Provider: ${result.metadata.provider}`);
        console.log(`   Retrieval time: ${result.metadata.retrievalTime}ms`);
        console.log(`   Generation time: ${result.metadata.generationTime}ms`);
        console.log(`   Total time: ${duration}ms`);

        if (result.metadata.tokens) {
            console.log(`   Tokens used: ${result.metadata.tokens.total_tokens}`);
        }

        return result.answer && result.answer.length > 0;

    } catch (error) {
        console.error('❌ RAG pipeline failed:', error);
        console.error('Error details:', error.message);
        return false;
    }
}

/**
 * Test 7: Statistics
 */
async function testStatistics() {
    console.log('\n📈 TEST 7: Statistics Check');
    console.log('='.repeat(50));

    try {
        const stats = window.localModelManager.getStatistics();

        console.log('Local Model Manager Stats:');
        console.log(`   Total requests: ${stats.totalRequests}`);
        console.log(`   Ollama requests: ${stats.ollamaRequests}`);
        console.log(`   Transformers requests: ${stats.transformersRequests}`);
        console.log(`   Cache hits: ${stats.cacheHits}`);
        console.log(`   Cache size: ${stats.cacheSize}`);
        console.log(`   Active provider: ${stats.activeProvider}`);

        if (stats.ollama) {
            console.log('\nOllama Service Stats:');
            console.log(`   Total requests: ${stats.ollama.totalRequests}`);
            console.log(`   Total embeddings: ${stats.ollama.totalEmbeddings}`);
            console.log(`   Total generations: ${stats.ollama.totalGenerations}`);
            console.log(`   Available: ${stats.ollama.available}`);
        }

        return true;

    } catch (error) {
        console.error('❌ Statistics check failed:', error);
        return false;
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.clear();
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║   LOCAL RAG SYSTEM - COMPREHENSIVE TEST SUITE  ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('\nStarting tests...\n');

    const results = {
        'Services Loaded': await testServicesLoaded(),
        'Initialization': await testInitialization(),
        'Text Generation': await testTextGeneration(),
        'Embeddings': await testEmbeddings(),
        'Vector Store': await testVectorStore(),
        'RAG Pipeline': await testRAGPipeline(),
        'Statistics': await testStatistics()
    };

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║              TEST SUMMARY                       ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    let passed = 0;
    let failed = 0;

    for (const [test, result] of Object.entries(results)) {
        const status = result ? '✅ PASSED' : '❌ FAILED';
        console.log(`${status} - ${test}`);
        if (result) passed++; else failed++;
    }

    console.log('\n' + '='.repeat(50));
    console.log(`Total: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(50));

    if (failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! 🎉');
        console.log('Your local RAG system is fully functional!');
        console.log('\nNext steps:');
        console.log('1. Upload NCERT PDFs from the Data Upload section');
        console.log('2. Try the RAG Chat interface');
        console.log('3. Compare performance with API models');
    } else {
        console.log('\n⚠️ Some tests failed. Check the details above.');
        console.log('Common issues:');
        console.log('- Ollama not running: Run "ollama serve" in terminal');
        console.log('- Models not installed: Run "ollama pull llama3.2"');
        console.log('- Browser compatibility: Try Chrome or Firefox');
    }

    return results;
}

// Quick individual tests
window.testLocal = {
    all: runAllTests,
    services: testServicesLoaded,
    init: testInitialization,
    text: testTextGeneration,
    embeddings: testEmbeddings,
    vectorStore: testVectorStore,
    rag: testRAGPipeline,
    stats: testStatistics
};

console.log('\n📚 Quick commands:');
console.log('  await testLocal.all()        - Run all tests');
console.log('  await testLocal.text()       - Test text generation only');
console.log('  await testLocal.embeddings() - Test embeddings only');
console.log('  await testLocal.rag()        - Test RAG pipeline only');
console.log('  await testLocal.stats()      - View statistics');
