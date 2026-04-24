/**
 * Smart Chunking Testing Script
 * Complete test suite for Chunking functionality
 */

(async function testChunking() {
    console.log('🧪 TESTING SMART CHUNKING - COMPLETE FUNCTIONALITY');
    console.log('='.repeat(70));

    let testsPassed = 0;
    let testsFailed = 0;

    // Helper function for tests
    function test(name, condition) {
        if (condition) {
            console.log(`✅ ${name}`);
            testsPassed++;
            return true;
        } else {
            console.error(`❌ ${name}`);
            testsFailed++;
            return false;
        }
    }

    // Test 1: Module Loading
    console.log('\n📦 Test 1: Module Loading');
    test('Chunking Manager exists', typeof window.chunkingManager === 'object');
    test('Chunking Manager initialized', window.chunkingManager.initialized === true);

    // Test 2: Core Properties
    console.log('\n🔧 Test 2: Core Properties');
    test('Documents array exists', Array.isArray(window.chunkingManager.documents));
    test('Chunks array exists', Array.isArray(window.chunkingManager.chunks));
    test('Settings exist', window.chunkingManager.settings !== undefined);
    test('Statistics exist', window.chunkingManager.statistics !== undefined);
    test('Current document tracking exists', window.chunkingManager.currentDocument !== undefined);

    // Test 3: Settings
    console.log('\n⚙️  Test 3: Settings');
    test('chunkSize setting exists', typeof window.chunkingManager.settings.chunkSize === 'number');
    test('overlap setting exists', typeof window.chunkingManager.settings.overlap === 'number');
    test('method setting exists', typeof window.chunkingManager.settings.method === 'string');
    test('minChunkSize setting exists', typeof window.chunkingManager.settings.minChunkSize === 'number');
    test('maxChunkSize setting exists', typeof window.chunkingManager.settings.maxChunkSize === 'number');

    console.log('   Current settings:');
    console.log(`   - Chunk Size: ${window.chunkingManager.settings.chunkSize}`);
    console.log(`   - Overlap: ${window.chunkingManager.settings.overlap}`);
    console.log(`   - Method: ${window.chunkingManager.settings.method}`);

    // Test 4: UI Elements
    console.log('\n🖥️  Test 4: UI Integration');
    test('Document selector exists', document.getElementById('documentSelect') !== null);
    test('Chunk size slider exists', document.getElementById('chunkSize') !== null);
    test('Chunk overlap slider exists', document.getElementById('chunkOverlap') !== null);
    test('Chunks display container exists', document.getElementById('chunksDisplay') !== null);
    test('Total chunks display exists', document.getElementById('totalChunks') !== null);
    test('Average size display exists', document.getElementById('avgChunkSize') !== null);
    test('Semantic score display exists', document.getElementById('semanticScore') !== null);

    // Test 5: Documents
    console.log('\n📚 Test 5: Documents');
    test('Has documents loaded', window.chunkingManager.documents.length > 0);
    test('Current document is set', window.chunkingManager.currentDocument !== null);

    if (window.chunkingManager.documents.length > 0) {
        const firstDoc = window.chunkingManager.documents[0];
        test('Document has id', firstDoc.id !== undefined);
        test('Document has name', firstDoc.name !== undefined);
        test('Document has content', firstDoc.content !== undefined);
        console.log(`   Loaded ${window.chunkingManager.documents.length} documents`);
        console.log(`   Current: ${window.chunkingManager.currentDocument?.name}`);
    }

    // Test 6: Chunking Methods
    console.log('\n✂️  Test 6: Chunking Methods');
    test('fixedSizeChunking method exists', typeof window.chunkingManager.fixedSizeChunking === 'function');
    test('sentenceChunking method exists', typeof window.chunkingManager.sentenceChunking === 'function');
    test('semanticChunking method exists', typeof window.chunkingManager.semanticChunking === 'function');
    test('chunkDocument method exists', typeof window.chunkingManager.chunkDocument === 'function');
    test('rechunk method exists', typeof window.chunkingManager.rechunk === 'function');

    // Test 7: Fixed-Size Chunking
    console.log('\n🔢 Test 7: Fixed-Size Chunking');
    const sampleText = 'This is a test document with multiple words. It contains several sentences for testing purposes. We will chunk this text using different methods to verify the functionality works correctly.';

    const fixedChunks = window.chunkingManager.fixedSizeChunking(sampleText);
    test('Fixed chunking returns array', Array.isArray(fixedChunks));
    test('Fixed chunks created', fixedChunks.length > 0);

    if (fixedChunks.length > 0) {
        test('Chunk has id', fixedChunks[0].id !== undefined);
        test('Chunk has text', fixedChunks[0].text !== undefined);
        test('Chunk has wordCount', typeof fixedChunks[0].wordCount === 'number');
        test('Chunk has charCount', typeof fixedChunks[0].charCount === 'number');
        console.log(`   Created ${fixedChunks.length} fixed-size chunks`);
        console.log(`   First chunk: ${fixedChunks[0].wordCount} words`);
    }

    // Test 8: Sentence Chunking
    console.log('\n📝 Test 8: Sentence Chunking');
    const sentenceChunks = window.chunkingManager.sentenceChunking(sampleText);
    test('Sentence chunking returns array', Array.isArray(sentenceChunks));
    test('Sentence chunks created', sentenceChunks.length > 0);

    if (sentenceChunks.length > 0) {
        test('Sentence chunk has correct method', sentenceChunks[0].method === 'sentence');
        console.log(`   Created ${sentenceChunks.length} sentence-based chunks`);
    }

    // Test 9: Semantic Chunking
    console.log('\n🧠 Test 9: Semantic Chunking');
    const semanticText = `Section 1: Introduction\nThis is the first section.\n\nSection 2: Main Content\nThis is the second section with more content.`;
    const semanticChunks = window.chunkingManager.semanticChunking(semanticText);
    test('Semantic chunking returns array', Array.isArray(semanticChunks));
    test('Semantic chunks created', semanticChunks.length > 0);

    if (semanticChunks.length > 0) {
        test('Semantic chunk has correct method', semanticChunks[0].method === 'semantic');
        console.log(`   Created ${semanticChunks.length} semantic chunks`);
    }

    // Test 10: Current Document Chunks
    console.log('\n📄 Test 10: Current Document Chunks');
    test('Has chunks from current document', window.chunkingManager.chunks.length > 0);

    if (window.chunkingManager.chunks.length > 0) {
        console.log(`   Current document has ${window.chunkingManager.chunks.length} chunks`);
        const avgSize = window.chunkingManager.chunks.reduce((sum, c) => sum + c.wordCount, 0) / window.chunkingManager.chunks.length;
        console.log(`   Average chunk size: ${avgSize.toFixed(0)} words`);
    }

    // Test 11: Statistics
    console.log('\n📊 Test 11: Statistics');
    const stats = window.chunkingManager.statistics;
    test('Statistics has totalChunks', typeof stats.totalChunks === 'number');
    test('Statistics has avgChunkSize', typeof stats.avgChunkSize === 'number');
    test('Statistics has semanticScore', typeof stats.semanticScore !== 'undefined');
    test('Statistics has totalTokens', typeof stats.totalTokens === 'number');

    console.log('   Statistics:');
    console.log(`   - Total Chunks: ${stats.totalChunks}`);
    console.log(`   - Avg Size: ${stats.avgChunkSize} words`);
    console.log(`   - Semantic Score: ${stats.semanticScore}/10`);
    console.log(`   - Total Tokens: ${stats.totalTokens}`);

    // Test 12: Settings Persistence
    console.log('\n💾 Test 12: Settings Persistence');
    try {
        window.chunkingManager.saveSettings();
        test('Can save settings', true);

        const saved = localStorage.getItem('chunking_settings');
        test('Settings saved to localStorage', saved !== null);
    } catch (error) {
        test('Can save settings', false);
    }

    // Test 13: Export Functionality
    console.log('\n📥 Test 13: Export Functionality');
    test('Export method exists', typeof window.chunkingManager.exportChunks === 'function');

    // Test 14: Statistics Method
    console.log('\n📈 Test 14: Get Statistics');
    try {
        const fullStats = window.chunkingManager.getStatistics();
        test('Can get statistics', fullStats !== undefined);
        test('Statistics includes documentsAvailable', typeof fullStats.documentsAvailable === 'number');
        test('Statistics includes currentDocument', fullStats.currentDocument !== undefined);
        test('Statistics includes settings', fullStats.settings !== undefined);
    } catch (error) {
        test('Can get statistics', false);
    }

    // Test 15: Dynamic Rechunking
    console.log('\n🔄 Test 15: Dynamic Rechunking');
    const oldChunkCount = window.chunkingManager.chunks.length;
    const oldChunkSize = window.chunkingManager.settings.chunkSize;

    // Change chunk size
    window.chunkingManager.settings.chunkSize = 300;
    await window.chunkingManager.rechunk();

    const newChunkCount = window.chunkingManager.chunks.length;
    test('Rechunking changes chunk count', newChunkCount !== oldChunkCount || oldChunkSize === 300);
    console.log(`   Old: ${oldChunkCount} chunks (size: ${oldChunkSize})`);
    console.log(`   New: ${newChunkCount} chunks (size: 300)`);

    // Restore original size
    window.chunkingManager.settings.chunkSize = oldChunkSize;
    await window.chunkingManager.rechunk();

    // Test Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

    if (testsFailed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Smart Chunking is fully functional!');
    } else {
        console.log('\n⚠️  Some tests failed. Review errors above.');
    }

    // Demo Section
    console.log('\n' + '='.repeat(70));
    console.log('🎬 SMART CHUNKING DEMO');
    console.log('='.repeat(70));

    console.log('\n📝 Try these actions:');
    console.log('');
    console.log('1️⃣  Adjust chunk size:');
    console.log('   • Use the slider in the UI');
    console.log('   • Or: window.chunkingManager.settings.chunkSize = 600');
    console.log('   • Then: window.chunkingManager.rechunk()');
    console.log('');
    console.log('2️⃣  Change overlap:');
    console.log('   • Use the slider in the UI');
    console.log('   • Or: window.chunkingManager.settings.overlap = 100');
    console.log('   • Then: window.chunkingManager.rechunk()');
    console.log('');
    console.log('3️⃣  Try different documents:');
    console.log('   • Use the document selector dropdown');
    console.log('   • Or: window.chunkingManager.loadDocument("doc_id")');
    console.log('');
    console.log('4️⃣  View chunks:');
    console.log('   • console.log(window.chunkingManager.chunks)');
    console.log('');
    console.log('5️⃣  Export chunks:');
    console.log('   • window.chunkingManager.exportChunks()');
    console.log('');
    console.log('6️⃣  Compare chunking methods:');
    console.log('');
    console.log('   const text = "Your sample text here...";');
    console.log('   const fixed = window.chunkingManager.fixedSizeChunking(text);');
    console.log('   const sentence = window.chunkingManager.sentenceChunking(text);');
    console.log('   const semantic = window.chunkingManager.semanticChunking(text);');
    console.log('   console.log("Fixed:", fixed.length);');
    console.log('   console.log("Sentence:", sentence.length);');
    console.log('   console.log("Semantic:", semantic.length);');

    console.log('\n' + '='.repeat(70));
    console.log('✅ SMART CHUNKING TEST COMPLETE!');
    console.log('='.repeat(70));

    console.log('\n🎯 Next Steps:');
    console.log('   1. Navigate to "Smart Chunking" tab');
    console.log('   2. Select a document from dropdown');
    console.log('   3. Adjust chunk size slider');
    console.log('   4. Adjust overlap slider');
    console.log('   5. Watch chunks update in real-time');
    console.log('   6. Export chunks for use in RAG');
    console.log('');
    console.log('💡 Pro Tips:');
    console.log('   • Smaller chunks: Better precision, more chunks');
    console.log('   • Larger chunks: More context, fewer chunks');
    console.log('   • More overlap: Better continuity, more storage');
    console.log('   • Less overlap: Less redundancy, faster search');
    console.log('   • Optimal for RAG: 300-500 words, 50-100 overlap');

    return {
        passed: testsPassed,
        failed: testsFailed,
        success: testsFailed === 0,
        stats: window.chunkingManager.getStatistics()
    };
})();
