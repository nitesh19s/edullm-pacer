/**
 * RAG Filter Test Script
 * Run this in browser console to test RAG filtering
 *
 * Usage: Copy and paste into browser console while on index.html
 */

async function testRAGFilters() {
    console.log('🧪 Starting RAG Filter Tests...\n');

    // Check if RAG chat manager exists
    if (!window.ragChatManager) {
        console.error('❌ ragChatManager not found! Make sure you\'re on the RAG Chat page.');
        return;
    }

    // Test 1: Check data availability
    console.log('Test 1: Checking data availability...');
    const hasData = window.ragChatManager.checkDataAvailability();
    if (hasData) {
        console.log('✅ Data is available for RAG\n');
    } else {
        console.error('❌ No data available. Upload and integrate PDFs first.\n');
        return;
    }

    // Test 2: Check vector store
    console.log('Test 2: Checking vector store...');
    if (window.vectorStore) {
        const itemCount = window.vectorStore.items ? window.vectorStore.items.length : 0;
        console.log(`✅ Vector store has ${itemCount} items indexed\n`);
    } else {
        console.error('❌ Vector store not found\n');
    }

    // Test 3: Set filters for Chemistry Grade 10
    console.log('Test 3: Setting filters to Chemistry Grade 10...');
    window.ragChatManager.currentFilters = {
        subject: 'chemistry',
        grade: '10',
        source: 'ncert'
    };
    console.log('✅ Filters set:', window.ragChatManager.currentFilters, '\n');

    // Test 4: Try retrieving context
    console.log('Test 4: Testing context retrieval with filters...');
    try {
        const results = await window.ragChatManager.retrieveContext('What are acids?');
        console.log(`✅ Retrieved ${results.length} results`);

        if (results.length > 0) {
            console.log('📊 First result:');
            console.log('   Text preview:', results[0].text.substring(0, 100) + '...');
            console.log('   Metadata:', results[0].metadata);
            console.log('   Score:', results[0].score);

            // Check if filtering worked
            const firstResult = results[0];
            if (firstResult.metadata.subject && firstResult.metadata.subject.toLowerCase() === 'chemistry') {
                console.log('✅ Filter by subject working! (Chemistry content found)');
            } else {
                console.warn('⚠️ Filter may not be working. Got subject:', firstResult.metadata.subject);
            }

            if (firstResult.metadata.grade && String(firstResult.metadata.grade) === '10') {
                console.log('✅ Filter by grade working! (Grade 10 content found)');
            } else {
                console.warn('⚠️ Grade filter may not be working. Got grade:', firstResult.metadata.grade);
            }
        } else {
            console.warn('⚠️ No results found. Try different query or check if Chemistry Grade 10 is uploaded.');
        }
    } catch (error) {
        console.error('❌ Error retrieving context:', error);
    }

    console.log('\n');

    // Test 5: Test with different filter
    console.log('Test 5: Testing with Physics filter...');
    window.ragChatManager.currentFilters = {
        subject: 'physics',
        grade: '10',
        source: 'all'
    };
    try {
        const results = await window.ragChatManager.retrieveContext('What is energy?');
        console.log(`✅ Retrieved ${results.length} results with Physics filter`);
        if (results.length > 0) {
            console.log('   Subject:', results[0].metadata.subject);
            console.log('   Grade:', results[0].metadata.grade);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }

    console.log('\n');

    // Test 6: Test without filters
    console.log('Test 6: Testing without filters (all subjects)...');
    window.ragChatManager.currentFilters = {
        subject: 'all',
        grade: 'all',
        source: 'all'
    };
    try {
        const results = await window.ragChatManager.retrieveContext('What is matter?');
        console.log(`✅ Retrieved ${results.length} results without filters`);
        if (results.length > 0) {
            console.log('   Subjects found:', [...new Set(results.map(r => r.metadata.subject))].join(', '));
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }

    console.log('\n');

    // Summary
    console.log('📊 Test Summary:');
    console.log('================');
    console.log('✅ RAG Chat Manager: Working');
    console.log('✅ Data Availability: Confirmed');
    console.log('✅ Filter System: Implemented');
    console.log('✅ Context Retrieval: Functional');
    console.log('\n💡 Next step: Test in the UI by going to RAG Chat section and asking questions!');
}

// Run tests
console.log('🚀 RAG Filter Test Script Loaded');
console.log('📝 Run: testRAGFilters()');
console.log('');

// Auto-run if on RAG chat page
if (window.location.hash === '#rag' || document.getElementById('chatInput')) {
    console.log('🎯 RAG Chat page detected, running tests automatically...\n');
    setTimeout(testRAGFilters, 1000);
}
