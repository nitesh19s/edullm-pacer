/**
 * Quick Fix: Index Data for RAG Chat
 *
 * USAGE:
 * 1. Open index.html in browser
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire file
 * 4. Press Enter
 *
 * This will:
 * - Check if data is uploaded
 * - Check if data is in vector store
 * - Manually trigger indexing if needed
 * - Test RAG search
 */

(async function fixAndIndexNow() {
    console.clear();
    console.log('🔧 FIX & INDEX NOW - Quick RAG Fix');
    console.log('====================================\n');

    // Step 1: Check upload history
    console.log('Step 1: Checking uploads...');
    const historyStr = localStorage.getItem('upload_history');

    if (!historyStr) {
        console.error('❌ FAIL: No uploads found');
        console.log('\n🎯 NEXT STEP: Upload your Chemistry Grade 10 PDF');
        console.log('   1. Go to Data Upload');
        console.log('   2. Select file');
        console.log('   3. Click "Integrate Data"');
        return;
    }

    const history = JSON.parse(historyStr);
    const successful = history.filter(h => h.status === 'success');

    console.log(`✅ Found ${successful.length} uploaded files`);
    successful.forEach((h, i) => {
        console.log(`   ${i + 1}. ${h.fileName} - ${h.subject} Grade ${h.grade}`);
    });

    console.log('\n');

    // Step 2: Check vector store
    console.log('Step 2: Checking vector store...');

    if (!window.vectorStore) {
        console.error('❌ FAIL: Vector store not loaded');
        console.log('💡 Make sure you opened index.html (not this diagnostic page)');
        return;
    }

    const items = window.vectorStore.items || [];
    console.log(`Vector store has ${items.length} items`);

    if (items.length === 0) {
        console.warn('⚠️ WARNING: Vector store is EMPTY!');
        console.log('\n🔧 ATTEMPTING TO FIX...\n');

        // Try to index data now
        if (window.eduLLM && window.eduLLM.indexDataForRAG) {
            console.log('🚀 Triggering manual indexing...');
            try {
                const result = await window.eduLLM.indexDataForRAG();

                if (result && result.indexed > 0) {
                    console.log(`\n✅ SUCCESS! Indexed ${result.indexed} chunks in ${result.timeTaken.toFixed(2)}s`);
                    console.log('\n🎯 NEXT STEP: Try RAG chat now!');
                } else {
                    console.error('❌ Indexing failed or returned 0 chunks');
                    console.log('\n🔍 Checking why...');

                    // Check if data processor has data
                    if (window.eduLLM.dataProcessor) {
                        const processedData = window.eduLLM.dataProcessor.getAllProcessedData();
                        const grades = Object.keys(processedData || {});
                        console.log(`   Data processor has data for ${grades.length} grades: ${grades.join(', ')}`);

                        if (grades.length === 0) {
                            console.error('   ❌ No data in processor!');
                            console.log('\n🎯 SOLUTION: Click "Integrate Data" button again');
                        }
                    } else {
                        console.error('   ❌ Data processor not available');
                    }
                }
            } catch (error) {
                console.error('❌ Indexing error:', error.message);
                console.error(error);
            }
        } else {
            console.error('❌ indexDataForRAG function not found');
            console.log('\n🎯 SOLUTION: Refresh page and try "Integrate Data" button');
        }

        return;
    }

    console.log('✅ Vector store has data');

    // Analyze what's in the vector store
    const subjects = [...new Set(items.map(i => i.metadata?.subject).filter(Boolean))];
    const grades = [...new Set(items.map(i => i.metadata?.grade).filter(Boolean))];

    console.log(`   Subjects: ${subjects.join(', ')}`);
    console.log(`   Grades: ${grades.join(', ')}`);

    console.log('\n');

    // Step 3: Test RAG search
    console.log('Step 3: Testing RAG search...');

    if (!window.ragChatManager) {
        console.error('❌ RAG Chat Manager not loaded');
        console.log('💡 Go to RAG Chat section first');
        return;
    }

    // Set filters to first available subject/grade
    if (subjects.length > 0 && grades.length > 0) {
        window.ragChatManager.currentFilters = {
            subject: subjects[0].toLowerCase(),
            grade: String(grades[0]),
            source: 'all'
        };

        console.log(`   Testing with: ${subjects[0]} Grade ${grades[0]}`);

        try {
            const results = await window.ragChatManager.retrieveContext('What is this about?');

            console.log(`   Retrieved ${results.length} results`);

            if (results.length > 0) {
                console.log('\n✅ RAG SEARCH IS WORKING!');
                console.log('\n📊 Sample results:');
                results.slice(0, 2).forEach((r, i) => {
                    console.log(`\n   Result ${i + 1}:`);
                    console.log(`      Subject: ${r.metadata?.subject}`);
                    console.log(`      Grade: ${r.metadata?.grade}`);
                    console.log(`      Chapter: ${r.metadata?.chapter}`);
                    console.log(`      Score: ${r.score.toFixed(3)}`);
                    console.log(`      Text: ${r.text.substring(0, 100)}...`);
                });

                console.log('\n🎯 RAG CHAT IS READY!');
                console.log('\nNext steps:');
                console.log('   1. Go to RAG Chat section');
                console.log('   2. Set your desired filters');
                console.log('   3. Ask questions!');

            } else {
                console.warn('⚠️ Search returned 0 results');
                console.log('\n🔍 Possible reasons:');
                console.log('   1. Query doesn\'t match any content');
                console.log('   2. Filters too restrictive');
                console.log('   3. Try broader query or "all" filters');
            }

        } catch (error) {
            console.error('❌ Search failed:', error.message);
            console.error(error);
        }
    }

    console.log('\n====================================');
    console.log('✅ Diagnostic complete!');
    console.log('====================================\n');

    // Final summary
    console.log('📊 SUMMARY:');
    console.log(`   Uploads: ${successful.length} files`);
    console.log(`   Vector store: ${items.length} items`);
    console.log(`   Subjects available: ${subjects.join(', ') || 'None'}`);
    console.log(`   Grades available: ${grades.join(', ') || 'None'}`);

    if (items.length > 0 && subjects.length > 0) {
        console.log('\n✅ System appears to be working!');
        console.log('\n💡 If chat still says "no information found":');
        console.log('   1. Check you set the correct filters');
        console.log('   2. Try a different question');
        console.log('   3. Try "all" subjects to test');
    }

})();
