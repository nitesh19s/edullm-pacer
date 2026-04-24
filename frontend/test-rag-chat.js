/**
 * RAG Chat Testing Script
 * Complete test suite for RAG Chat functionality
 */

(async function testRAGChat() {
    console.log('🧪 TESTING RAG CHAT - COMPLETE FUNCTIONALITY');
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
    test('RAG Chat Manager exists', typeof window.ragChatManager === 'object');
    test('RAG Chat Manager initialized', window.ragChatManager.initialized === true);

    // Test 2: Core Properties
    console.log('\n🔧 Test 2: Core Properties');
    test('Chat history exists', Array.isArray(window.ragChatManager.chatHistory));
    test('Current filters exist', window.ragChatManager.currentFilters !== undefined);
    test('Settings exist', window.ragChatManager.settings !== undefined);
    test('isProcessing flag exists', typeof window.ragChatManager.isProcessing === 'boolean');

    // Test 3: Settings
    console.log('\n⚙️  Test 3: Settings');
    test('topK setting exists', typeof window.ragChatManager.settings.topK === 'number');
    test('temperature setting exists', typeof window.ragChatManager.settings.temperature === 'number');
    test('maxTokens setting exists', typeof window.ragChatManager.settings.maxTokens === 'number');
    test('includeExamples setting exists', typeof window.ragChatManager.settings.includeExamples === 'boolean');
    test('includeCitations setting exists', typeof window.ragChatManager.settings.includeCitations === 'boolean');

    // Test 4: UI Elements
    console.log('\n🖥️  Test 4: UI Integration');
    test('Chat messages container exists', document.getElementById('chatMessages') !== null);
    test('Chat input exists', document.getElementById('chatInput') !== null);
    test('Send button exists', document.getElementById('sendButton') !== null);
    test('Typing indicator exists', document.getElementById('typingIndicator') !== null);
    test('Subject filter exists', document.getElementById('subjectFilter') !== null);
    test('Grade filter exists', document.getElementById('gradeFilter') !== null);
    test('Source filter exists', document.getElementById('sourceFilter') !== null);

    // Test 5: Core Methods
    console.log('\n🔨 Test 5: Core Methods');
    test('preprocessQuery method exists', typeof window.ragChatManager.preprocessQuery === 'function');
    test('checkDataAvailability method exists', typeof window.ragChatManager.checkDataAvailability === 'function');
    test('retrieveContext method exists', typeof window.ragChatManager.retrieveContext === 'function');
    test('addUserMessage method exists', typeof window.ragChatManager.addUserMessage === 'function');
    test('addAssistantMessage method exists', typeof window.ragChatManager.addAssistantMessage === 'function');
    test('formatMessageContent method exists', typeof window.ragChatManager.formatMessageContent === 'function');

    // Test 6: Data Availability Check
    console.log('\n💾 Test 6: Data Availability');
    const hasData = window.ragChatManager.checkDataAvailability();
    test('Can check data availability', typeof hasData === 'boolean');
    console.log(`   Current data available: ${hasData ? 'Yes' : 'No'}`);

    // Test 7: Query Pre-processing
    console.log('\n✨ Test 7: Query Processing');
    const testQuery = "What is Pythagoras Theorem?";
    const cleanQuery = window.ragChatManager.preprocessQuery(testQuery);
    test('Can preprocess query', typeof cleanQuery === 'string');
    test('Query is cleaned', cleanQuery === cleanQuery.toLowerCase().trim());
    console.log(`   Original: "${testQuery}"`);
    console.log(`   Cleaned:  "${cleanQuery}"`);

    // Test 8: Message Formatting
    console.log('\n🎨 Test 8: Message Formatting');
    const boldText = window.ragChatManager.formatMessageContent('This is **bold** text');
    test('Bold formatting works', boldText.includes('<strong>bold</strong>'));

    const italicText = window.ragChatManager.formatMessageContent('This is *italic* text');
    test('Italic formatting works', italicText.includes('<em>italic</em>'));

    const lineBreak = window.ragChatManager.formatMessageContent('Line 1\nLine 2');
    test('Line breaks work', lineBreak.includes('<br>'));

    // Test 9: Filters
    console.log('\n🔍 Test 9: Filters');
    test('Subject filter initialized', window.ragChatManager.currentFilters.subject === 'all');
    test('Grade filter initialized', window.ragChatManager.currentFilters.grade === 'all');
    test('Source filter initialized', window.ragChatManager.currentFilters.source === 'all');

    // Update filters
    window.ragChatManager.currentFilters.subject = 'mathematics';
    test('Can update subject filter', window.ragChatManager.currentFilters.subject === 'mathematics');

    // Test 10: Chat History Management
    console.log('\n📝 Test 10: Chat History');
    const initialCount = window.ragChatManager.chatHistory.length;

    // Add test message
    window.ragChatManager.addSystemMessage('Test message for testing');
    test('Can add system message', window.ragChatManager.chatHistory.length === initialCount + 1);
    test('Message has correct role', window.ragChatManager.chatHistory[window.ragChatManager.chatHistory.length - 1].role === 'system');
    test('Message has timestamp', window.ragChatManager.chatHistory[window.ragChatManager.chatHistory.length - 1].timestamp !== undefined);

    // Test 11: Statistics
    console.log('\n📊 Test 11: Statistics');
    const stats = window.ragChatManager.getStatistics();
    test('Can get statistics', stats !== undefined);
    test('Statistics has totalMessages', typeof stats.totalMessages === 'number');
    test('Statistics has userMessages', typeof stats.userMessages === 'number');
    test('Statistics has assistantMessages', typeof stats.assistantMessages === 'number');
    console.log(`   Total messages: ${stats.totalMessages}`);
    console.log(`   User messages: ${stats.userMessages}`);
    console.log(`   Assistant messages: ${stats.assistantMessages}`);

    // Test 12: Storage
    console.log('\n💾 Test 12: Storage');
    try {
        window.ragChatManager.saveChatHistory();
        test('Can save chat history', true);

        const saved = localStorage.getItem('rag_chat_history');
        test('Chat history saved to localStorage', saved !== null);
    } catch (error) {
        test('Can save chat history', false);
    }

    // Test 13: Context Retrieval (if data available)
    console.log('\n🔎 Test 13: Context Retrieval');
    if (hasData) {
        try {
            const results = await window.ragChatManager.retrieveContext('test query');
            test('Can retrieve context', Array.isArray(results));
            if (results.length > 0) {
                test('Results have text', results[0].text !== undefined);
                test('Results have score', results[0].score !== undefined);
                test('Results have metadata', results[0].metadata !== undefined);
                console.log(`   Retrieved ${results.length} chunks`);
            } else {
                console.log('   No results found (may need more data)');
            }
        } catch (error) {
            test('Can retrieve context', false);
            console.log(`   Error: ${error.message}`);
        }
    } else {
        console.log('   ⚠️  Skipped - no data available');
        console.log('   Load sample data with: demo-rag.js or integrate data');
    }

    // Test 14: Time Formatting
    console.log('\n⏰ Test 14: Time Formatting');
    const formattedTime = window.ragChatManager.formatTime(Date.now());
    test('Can format time', typeof formattedTime === 'string');
    test('Time format is valid', formattedTime.includes(':'));
    console.log(`   Formatted time: ${formattedTime}`);

    // Test Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

    if (testsFailed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! RAG Chat is fully functional!');
    } else {
        console.log('\n⚠️  Some tests failed. Review errors above.');
    }

    // Demo Section
    console.log('\n' + '='.repeat(70));
    console.log('🎬 RAG CHAT DEMO');
    console.log('='.repeat(70));

    // Check if we have sample data
    if (!hasData) {
        console.log('\n⚠️  No data available. Setting up sample data...');

        // Create simple sample system
        if (!window.ragSystem) {
            window.ragSystem = {
                data: [
                    {
                        id: 0,
                        text: 'Pythagoras theorem states that in a right-angled triangle, the square of the hypotenuse equals the sum of squares of the other two sides. Formula: a² + b² = c²',
                        info: { source: 'NCERT Math Grade 10', chapter: 'Chapter 6' }
                    },
                    {
                        id: 1,
                        text: 'A polynomial is an algebraic expression with variables and coefficients. The degree is the highest power. Examples: linear (x), quadratic (x²), cubic (x³).',
                        info: { source: 'NCERT Math Grade 10', chapter: 'Chapter 2' }
                    },
                    {
                        id: 2,
                        text: 'Newton\'s first law states that an object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force.',
                        info: { source: 'NCERT Physics Grade 11', chapter: 'Chapter 5' }
                    }
                ],
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
            console.log('✅ Sample data created with 3 chunks');
        }
    }

    console.log('\n📝 Test Chat Interaction:');
    console.log('');
    console.log('1️⃣  Try these sample questions in the chat:');
    console.log('   • "What is Pythagoras theorem?"');
    console.log('   • "Explain polynomials"');
    console.log('   • "What is Newton\'s first law?"');
    console.log('');
    console.log('2️⃣  Or test programmatically:');
    console.log('');
    console.log('   // Send a test query');
    console.log('   window.ragChatManager.addUserMessage("What is Pythagoras theorem?");');
    console.log('   await window.ragChatManager.processRAGQuery("What is Pythagoras theorem?");');
    console.log('');
    console.log('3️⃣  View chat statistics:');
    console.log('');
    console.log('   window.ragChatManager.getStatistics();');
    console.log('');
    console.log('4️⃣  Clear chat:');
    console.log('');
    console.log('   window.ragChatManager.clearChat();');
    console.log('');
    console.log('5️⃣  Export chat:');
    console.log('');
    console.log('   window.ragChatManager.exportChat();');

    console.log('\n' + '='.repeat(70));
    console.log('✅ RAG CHAT TEST COMPLETE!');
    console.log('='.repeat(70));

    console.log('\n🎯 Next Steps:');
    console.log('   1. Navigate to "RAG Chat" tab');
    console.log('   2. Try asking questions in the chat interface');
    console.log('   3. Check filters (Subject, Grade, Source)');
    console.log('   4. Verify responses with citations');
    console.log('');
    console.log('💡 Pro Tips:');
    console.log('   • Upload NCERT PDFs for better responses');
    console.log('   • Add OpenAI API key in Settings for LLM responses');
    console.log('   • Use filters to narrow down search scope');
    console.log('   • Export chat history for documentation');

    return {
        passed: testsPassed,
        failed: testsFailed,
        success: testsFailed === 0,
        stats: stats
    };
})();
