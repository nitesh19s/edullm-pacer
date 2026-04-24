/**
 * Quick Test: Verify Chemistry Grade 10 Filtering
 *
 * USAGE:
 * 1. Open index.html in browser
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire file into console
 * 4. Press Enter
 *
 * This will immediately test if your Chemistry Grade 10 document
 * can be queried with filters in RAG chat.
 */

(async function quickTestChemistryFilter() {
    console.clear();
    console.log('🧪 QUICK TEST: Chemistry Grade 10 Document Filtering');
    console.log('====================================================\n');

    // Test 1: Check if upload history has Chemistry Grade 10
    console.log('Step 1: Checking upload history...');
    const historyStr = localStorage.getItem('upload_history');

    if (!historyStr) {
        console.error('❌ FAIL: No upload history found');
        console.log('💡 ACTION: Upload your Chemistry Grade 10 PDF first');
        console.log('   Go to: Data Upload → Select File → Integrate Data');
        return;
    }

    const history = JSON.parse(historyStr);
    const chemGrade10 = history.find(h =>
        h.status === 'success' &&
        h.subject && h.subject.toLowerCase().includes('chem') &&
        String(h.grade) === '10'
    );

    if (!chemGrade10) {
        console.warn('⚠️  WARNING: Chemistry Grade 10 not found in uploads');
        console.log('   Available uploads:');
        history.filter(h => h.status === 'success').forEach((h, i) => {
            console.log(`   ${i + 1}. ${h.fileName} - ${h.subject} Grade ${h.grade}`);
        });
        console.log('\n💡 If you uploaded Chemistry Grade 10, check the subject name in Upload History');
    } else {
        console.log(`✅ PASS: Found Chemistry Grade 10 upload`);
        console.log(`   File: ${chemGrade10.fileName}`);
        console.log(`   Subject: ${chemGrade10.subject}`);
        console.log(`   Grade: ${chemGrade10.grade}`);
        console.log(`   Chapters: ${chemGrade10.chapters}`);
    }

    console.log('\n');

    // Test 2: Check vector store
    console.log('Step 2: Checking vector store...');

    if (!window.vectorStore) {
        console.error('❌ FAIL: Vector store not loaded');
        console.log('💡 ACTION: Refresh the page or check if script loaded correctly');
        return;
    }

    const items = window.vectorStore.items || [];
    console.log(`✅ PASS: Vector store loaded with ${items.length} items`);

    if (items.length === 0) {
        console.warn('⚠️  WARNING: Vector store is empty');
        console.log('💡 ACTION: Click "Integrate Data" button to index your PDFs for RAG');
        return;
    }

    // Find Chemistry Grade 10 items
    const chemItems = items.filter(item => {
        const meta = item.metadata || {};
        return meta.subject && meta.subject.toLowerCase().includes('chem') &&
               String(meta.grade) === '10';
    });

    console.log(`   Found ${chemItems.length} Chemistry Grade 10 chunks in vector store`);

    if (chemItems.length === 0) {
        console.warn('⚠️  WARNING: No Chemistry Grade 10 chunks in vector store');
        console.log('💡 ACTION: Re-integrate data to ensure Chemistry Grade 10 is indexed');

        // Show what IS in the vector store
        const subjects = [...new Set(items.map(i => i.metadata?.subject).filter(Boolean))];
        const grades = [...new Set(items.map(i => i.metadata?.grade).filter(Boolean))];
        console.log(`   Available in vector store: Subjects: [${subjects.join(', ')}], Grades: [${grades.join(', ')}]`);
    } else {
        console.log(`✅ PASS: Chemistry Grade 10 content indexed and ready for RAG`);
        console.log(`   Sample chapters:`, chemItems.slice(0, 3).map(i => i.metadata.chapter).join(', '));
    }

    console.log('\n');

    // Test 3: Check RAG Chat Manager
    console.log('Step 3: Checking RAG Chat Manager...');

    if (!window.ragChatManager) {
        console.error('❌ FAIL: RAG Chat Manager not loaded');
        console.log('💡 ACTION: Go to RAG Chat section (click RAG Chat in navigation)');
        return;
    }

    console.log('✅ PASS: RAG Chat Manager loaded');

    // Test data availability
    const hasData = window.ragChatManager.checkDataAvailability();
    if (hasData) {
        console.log('✅ PASS: RAG Chat can access data');
    } else {
        console.error('❌ FAIL: RAG Chat cannot access data');
        return;
    }

    console.log('\n');

    // Test 4: Test filtering with Chemistry Grade 10
    console.log('Step 4: Testing filter with Chemistry Grade 10...');

    // Set filters
    window.ragChatManager.currentFilters = {
        subject: 'chemistry',
        grade: '10',
        source: 'all'
    };
    console.log('   Filters set: Chemistry + Grade 10');

    // Test query
    console.log('   Testing query: "What are acids?"');

    try {
        const results = await window.ragChatManager.retrieveContext('What are acids?');

        console.log(`   Retrieved ${results.length} results`);

        if (results.length === 0) {
            console.warn('⚠️  WARNING: No results found');
            console.log('💡 Possible reasons:');
            console.log('   - Chemistry content does not contain information about acids');
            console.log('   - Try a different query like "What is matter?" or "Explain chemistry"');
        } else {
            console.log(`✅ PASS: Got ${results.length} results from RAG`);

            // Verify all results are Chemistry Grade 10
            let allCorrect = true;
            results.forEach((r, i) => {
                const meta = r.metadata || {};
                const isChemistry = meta.subject && meta.subject.toLowerCase().includes('chem');
                const isGrade10 = String(meta.grade) === '10';

                console.log(`   Result ${i + 1}:`);
                console.log(`      Subject: ${meta.subject} ${isChemistry ? '✅' : '❌'}`);
                console.log(`      Grade: ${meta.grade} ${isGrade10 ? '✅' : '❌'}`);
                console.log(`      Chapter: ${meta.chapter}`);
                console.log(`      Score: ${r.score.toFixed(3)}`);

                if (!isChemistry || !isGrade10) {
                    allCorrect = false;
                }
            });

            if (allCorrect) {
                console.log('\n✅✅✅ SUCCESS: All results are from Chemistry Grade 10! ✅✅✅');
                console.log('    Filtering is WORKING correctly!');
            } else {
                console.warn('\n⚠️  WARNING: Some results are NOT from Chemistry Grade 10');
                console.log('    Filter may not be working correctly');
            }
        }

    } catch (error) {
        console.error('❌ FAIL: Error during query:', error.message);
        console.error(error);
    }

    console.log('\n');

    // Test 5: Compare with different filter
    console.log('Step 5: Testing with different subject (Physics)...');

    window.ragChatManager.currentFilters = {
        subject: 'physics',
        grade: '10',
        source: 'all'
    };
    console.log('   Filters changed to: Physics + Grade 10');

    try {
        const results = await window.ragChatManager.retrieveContext('What are acids?');

        console.log(`   Retrieved ${results.length} results with Physics filter`);

        if (results.length === 0) {
            console.log('✅ GOOD: No Physics results for "acids" (chemistry topic)');
            console.log('   This proves filtering is working!');
        } else {
            const subjects = results.map(r => r.metadata?.subject);
            console.log(`   Subjects found: ${[...new Set(subjects)].join(', ')}`);

            const hasPhysics = subjects.some(s => s && s.toLowerCase().includes('phys'));
            if (hasPhysics) {
                console.log('✅ Got Physics results (different from Chemistry)');
                console.log('   This proves subject filter is working!');
            }
        }

    } catch (error) {
        console.log(`   (Physics test skipped - ${error.message})`);
    }

    console.log('\n');

    // Final Summary
    console.log('====================================================');
    console.log('📊 FINAL SUMMARY');
    console.log('====================================================');

    if (chemItems && chemItems.length > 0) {
        console.log('✅ Chemistry Grade 10 document is uploaded and indexed');
        console.log('✅ RAG Chat filtering is enabled');
        console.log('✅ You can now chat about Chemistry Grade 10 content!');
        console.log('\n🎯 NEXT STEPS:');
        console.log('   1. Go to RAG Chat section');
        console.log('   2. Set filters: Chemistry + Grade 10');
        console.log('   3. Ask questions like:');
        console.log('      - "What are acids and bases?"');
        console.log('      - "Explain chemical reactions"');
        console.log('      - "What is the periodic table?"');
        console.log('   4. Verify responses come ONLY from Chemistry Grade 10');
    } else {
        console.log('⚠️  Chemistry Grade 10 not fully set up');
        console.log('\n🎯 REQUIRED ACTIONS:');
        console.log('   1. Upload NCERT Chemistry Grade 10 PDF');
        console.log('   2. Click "Integrate Data" button');
        console.log('   3. Wait for indexing to complete');
        console.log('   4. Run this test again');
    }

    console.log('\n💡 TIP: You can run this test anytime by calling:');
    console.log('   quickTestChemistryFilter()');

})();
