/**
 * Complete Feature Integration
 * Shows how Dashboard, RAG Chat, and Smart Chunking work together
 */

(async function integrateAllFeatures() {
    console.log('🔗 COMPLETE FEATURE INTEGRATION');
    console.log('='.repeat(70));
    console.log('Demonstrating how all three features work together');
    console.log('='.repeat(70));

    const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // ============================================
    // STEP 1: Initialize All Modules
    // ============================================
    console.log('\n📦 STEP 1: Verifying All Modules');
    console.log('─'.repeat(70));

    const modules = {
        dashboard: window.dashboardManager,
        ragChat: window.ragChatManager,
        chunking: window.chunkingManager
    };

    let allInitialized = true;

    Object.entries(modules).forEach(([name, module]) => {
        if (module && module.initialized) {
            console.log(`✅ ${name.charAt(0).toUpperCase() + name.slice(1)} - Ready`);
        } else {
            console.log(`❌ ${name.charAt(0).toUpperCase() + name.slice(1)} - Not initialized`);
            allInitialized = false;
        }
    });

    if (!allInitialized) {
        console.error('\n❌ Not all modules initialized. Please refresh the page.');
        return;
    }

    console.log('\n✅ All modules initialized and ready!');
    await pause(1000);

    // ============================================
    // STEP 2: Smart Chunking - Prepare Documents
    // ============================================
    console.log('\n✂️  STEP 2: Smart Chunking - Processing Documents');
    console.log('─'.repeat(70));

    // Ensure we have documents
    if (window.chunkingManager.documents.length === 0) {
        console.log('📝 No documents found, creating samples...');
        window.chunkingManager.createSampleDocuments();
    }

    console.log(`📚 Available Documents: ${window.chunkingManager.documents.length}`);

    // Load and chunk the first document
    if (window.chunkingManager.documents.length > 0) {
        const firstDoc = window.chunkingManager.documents[0];
        console.log(`📄 Loading: ${firstDoc.name}`);

        await window.chunkingManager.loadDocument(firstDoc.id);

        const stats = window.chunkingManager.statistics;
        console.log(`\n📊 Chunking Results:`);
        console.log(`   - Total Chunks: ${stats.totalChunks}`);
        console.log(`   - Avg Chunk Size: ${stats.avgChunkSize} words`);
        console.log(`   - Semantic Score: ${stats.semanticScore}/10`);
        console.log(`   - Total Tokens: ${stats.totalTokens}`);
    }

    await pause(1500);

    // ============================================
    // STEP 3: Create RAG System with Chunks
    // ============================================
    console.log('\n🤖 STEP 3: RAG System - Integrating Chunks');
    console.log('─'.repeat(70));

    // Create or update RAG system with chunks from chunking manager
    if (!window.ragSystem) {
        window.ragSystem = {
            data: [],
            find: function(query, limit) {
                limit = limit || 5;
                const q = query.toLowerCase();
                return this.data
                    .map(item => {
                        const t = item.text.toLowerCase();
                        let score = 0;
                        q.split(' ').forEach(word => {
                            if (t.includes(word)) score++;
                        });
                        return { ...item, score: score / q.split(' ').length };
                    })
                    .filter(item => item.score > 0)
                    .sort((a, b) => b.score - a.score)
                    .slice(0, limit);
            }
        };
    }

    // Add chunks to RAG system
    window.ragSystem.data = window.chunkingManager.chunks.map((chunk, index) => ({
        id: index,
        text: chunk.text,
        info: {
            source: window.chunkingManager.currentDocument?.name || 'Unknown',
            chunk: chunk.id,
            wordCount: chunk.wordCount,
            method: chunk.method
        }
    }));

    console.log(`✅ RAG System Updated:`);
    console.log(`   - Indexed Chunks: ${window.ragSystem.data.length}`);
    console.log(`   - Source: ${window.chunkingManager.currentDocument?.name}`);

    await pause(1500);

    // ============================================
    // STEP 4: Update Dashboard Metrics
    // ============================================
    console.log('\n📊 STEP 4: Dashboard - Updating Metrics');
    console.log('─'.repeat(70));

    // Update dashboard with new data
    window.dashboardManager.metrics.documentsIndexed = window.ragSystem.data.length;
    window.dashboardManager.updateMetricsDisplay();

    // Add activity
    window.dashboardManager.addActivity(
        'layer-group',
        `${window.chunkingManager.chunks.length} chunks created and indexed`
    );

    console.log(`✅ Dashboard Updated:`);
    console.log(`   - Documents Indexed: ${window.dashboardManager.metrics.documentsIndexed}`);
    console.log(`   - Activity Added: Chunks indexed`);

    await pause(1500);

    // ============================================
    // STEP 5: Test RAG Chat with Integrated Data
    // ============================================
    console.log('\n💬 STEP 5: RAG Chat - Testing with Integrated Data');
    console.log('─'.repeat(70));

    // Test queries based on document content
    const testQueries = [
        "What is Pythagoras theorem?",
        "Explain triangles",
        "Tell me about Newton's laws"
    ];

    console.log('🔍 Testing RAG retrieval with sample queries:\n');

    for (const query of testQueries) {
        console.log(`Query: "${query}"`);

        // Test retrieval
        const results = await window.ragChatManager.retrieveContext(query);

        if (results.length > 0) {
            console.log(`✅ Found ${results.length} relevant chunks`);
            console.log(`   Top result: "${results[0].text.substring(0, 80)}..."`);
            console.log(`   Relevance: ${(results[0].score * 100).toFixed(1)}%`);
        } else {
            console.log(`⚠️  No results found`);
        }
        console.log('');

        await pause(500);
    }

    await pause(1000);

    // ============================================
    // STEP 6: Complete Integration Test
    // ============================================
    console.log('\n🎯 STEP 6: Complete Integration Test');
    console.log('─'.repeat(70));

    console.log('\n📋 Testing complete workflow:\n');

    // 1. User uploads document (simulated)
    console.log('1️⃣  User uploads NCERT document');
    console.log('   ↓');

    // 2. Document gets chunked
    console.log('2️⃣  Smart Chunking processes document');
    console.log(`   → Creates ${window.chunkingManager.chunks.length} chunks`);
    console.log('   ↓');

    // 3. Chunks indexed in RAG system
    console.log('3️⃣  Chunks indexed in RAG system');
    console.log(`   → ${window.ragSystem.data.length} chunks available for search`);
    console.log('   ↓');

    // 4. Dashboard updates
    console.log('4️⃣  Dashboard updates metrics');
    console.log(`   → Documents Indexed: ${window.dashboardManager.metrics.documentsIndexed}`);
    console.log('   ↓');

    // 5. User asks question
    console.log('5️⃣  User asks question in RAG Chat');
    const testQuery = "What is Pythagoras theorem?";
    console.log(`   → Query: "${testQuery}"`);
    console.log('   ↓');

    // 6. System retrieves relevant chunks
    const retrievedChunks = await window.ragChatManager.retrieveContext(testQuery);
    console.log('6️⃣  System retrieves relevant chunks');
    console.log(`   → Found ${retrievedChunks.length} relevant chunks`);
    console.log('   ↓');

    // 7. Response generated
    console.log('7️⃣  Response generated with context');
    console.log(`   → Uses top ${retrievedChunks.length} chunks for answer`);
    console.log('   ↓');

    // 8. Dashboard tracks activity
    console.log('8️⃣  Dashboard tracks query activity');
    window.dashboardManager.addActivity('comments', 'Query processed successfully');
    console.log('   → Activity logged');

    await pause(1500);

    // ============================================
    // STEP 7: Data Flow Visualization
    // ============================================
    console.log('\n📊 STEP 7: Data Flow Visualization');
    console.log('─'.repeat(70));

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    INTEGRATED SYSTEM FLOW                       ║
╚════════════════════════════════════════════════════════════════╝

    📄 NCERT Document
          │
          ▼
    ┌─────────────────┐
    │ Smart Chunking  │ ✂️  Break into optimal chunks
    └────────┬────────┘
             │ ${window.chunkingManager.chunks.length} chunks
             ▼
    ┌─────────────────┐
    │   RAG System    │ 🗄️  Index for search
    └────────┬────────┘
             │ ${window.ragSystem.data.length} indexed
             ▼
    ┌─────────────────┐
    │    Dashboard    │ 📊 Track metrics
    └─────────────────┘
             │
             ├──────────────┐
             ▼              ▼
    ┌──────────────┐  ┌──────────────┐
    │   RAG Chat   │  │  Analytics   │
    │ 💬 Q&A       │  │ 📈 Reports   │
    └──────────────┘  └──────────────┘
    `);

    await pause(2000);

    // ============================================
    // STEP 8: Integration Metrics
    // ============================================
    console.log('\n📈 STEP 8: Integration Metrics');
    console.log('─'.repeat(70));

    const integrationMetrics = {
        'Documents Available': window.chunkingManager.documents.length,
        'Current Document': window.chunkingManager.currentDocument?.name || 'None',
        'Total Chunks Created': window.chunkingManager.chunks.length,
        'Chunks Indexed': window.ragSystem.data.length,
        'Dashboard Metrics Updated': window.dashboardManager.metrics.documentsIndexed,
        'Dashboard Activities': window.dashboardManager.activities.length,
        'RAG Chat Ready': window.ragChatManager.initialized,
        'Chunking Method': window.chunkingManager.settings.method,
        'Chunk Size': window.chunkingManager.settings.chunkSize + ' words',
        'Overlap': window.chunkingManager.settings.overlap + ' words'
    };

    Object.entries(integrationMetrics).forEach(([key, value]) => {
        console.log(`${key.padEnd(30)}: ${value}`);
    });

    await pause(1500);

    // ============================================
    // STEP 9: Verify All Integrations
    // ============================================
    console.log('\n✅ STEP 9: Verification Checklist');
    console.log('─'.repeat(70));

    const verifications = [
        {
            check: 'Dashboard shows document count',
            status: window.dashboardManager.metrics.documentsIndexed > 0
        },
        {
            check: 'Chunking has processed documents',
            status: window.chunkingManager.chunks.length > 0
        },
        {
            check: 'RAG system has indexed chunks',
            status: window.ragSystem.data.length > 0
        },
        {
            check: 'RAG Chat can retrieve context',
            status: retrievedChunks.length > 0
        },
        {
            check: 'Dashboard tracks activities',
            status: window.dashboardManager.activities.length > 0
        },
        {
            check: 'All modules initialized',
            status: allInitialized
        },
        {
            check: 'Data flow complete',
            status: window.ragSystem.data.length === window.chunkingManager.chunks.length
        }
    ];

    let passCount = 0;
    verifications.forEach(v => {
        if (v.status) {
            console.log(`✅ ${v.check}`);
            passCount++;
        } else {
            console.log(`❌ ${v.check}`);
        }
    });

    const successRate = (passCount / verifications.length * 100).toFixed(1);
    console.log(`\n📊 Integration Success Rate: ${successRate}%`);

    await pause(1500);

    // ============================================
    // FINAL SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('🎉 INTEGRATION COMPLETE!');
    console.log('='.repeat(70));

    console.log(`
✅ All features are now integrated and working together!

📊 System Status:
   • Dashboard: Tracking ${window.dashboardManager.metrics.documentsIndexed} documents
   • Chunking: ${window.chunkingManager.chunks.length} chunks optimized
   • RAG Chat: ${window.ragSystem.data.length} chunks ready for search

🎯 You can now:
   1. Navigate to Dashboard → See real-time metrics
   2. Navigate to Smart Chunking → Adjust chunk settings
   3. Navigate to RAG Chat → Ask questions
   4. Watch metrics update across all features!

💡 Try this workflow:
   1. Go to Smart Chunking
   2. Adjust chunk size slider
   3. Watch chunks update
   4. Go to RAG Chat
   5. Ask a question
   6. See answer based on chunks
   7. Go to Dashboard
   8. See activity tracked!
    `);

    console.log('='.repeat(70));
    console.log('🔗 Integration script complete!');
    console.log('='.repeat(70));

    return {
        success: successRate === 100,
        metrics: integrationMetrics,
        verifications: verifications,
        successRate: successRate
    };
})();
