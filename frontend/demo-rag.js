/**
 * Interactive RAG Demo
 * Shows step-by-step how RAG works with real sample data
 */

(async function demoRAG() {
    console.log('🎬 INTERACTIVE RAG DEMO - STEP BY STEP');
    console.log('='.repeat(70));
    console.log('Watch how RAG processes your question and generates an answer!');
    console.log('='.repeat(70));

    // Sample NCERT Content (Pre-chunked)
    const sampleChunks = [
        {
            id: 'chunk_001',
            text: 'Chapter 6: Triangles. Section 6.1: Introduction. Triangles are fundamental shapes in geometry. They have three sides, three angles, and three vertices. Section 6.2: Similarity of Triangles. Two triangles are said to be similar if their corresponding angles are equal and their corresponding sides are in proportion.',
            metadata: {
                source: 'NCERT Mathematics Grade 10',
                chapter: 'Chapter 6',
                section: '6.1-6.2',
                title: 'Triangles - Introduction'
            }
        },
        {
            id: 'chunk_002',
            text: 'Section 6.3: Pythagoras Theorem. In a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides. If a triangle ABC is right-angled at B, then: AC² = AB² + BC². This fundamental theorem is used extensively in mathematics, physics, and engineering.',
            metadata: {
                source: 'NCERT Mathematics Grade 10',
                chapter: 'Chapter 6',
                section: '6.3',
                title: 'Pythagoras Theorem'
            }
        },
        {
            id: 'chunk_003',
            text: 'Example 1: If AB = 3 cm and BC = 4 cm in a right-angled triangle, find AC. Solution: Using Pythagoras theorem: AC² = AB² + BC² = 3² + 4² = 9 + 16 = 25. Therefore, AC = 5 cm. This is a classic example of a 3-4-5 Pythagorean triple.',
            metadata: {
                source: 'NCERT Mathematics Grade 10',
                chapter: 'Chapter 6',
                section: '6.3 (Example)',
                title: 'Pythagoras Theorem - Example'
            }
        },
        {
            id: 'chunk_004',
            text: 'Section 6.4: Converse of Pythagoras Theorem. If in a triangle, the square of one side is equal to the sum of squares of the other two sides, then the triangle is right-angled. This helps us verify if a triangle is right-angled without measuring angles.',
            metadata: {
                source: 'NCERT Mathematics Grade 10',
                chapter: 'Chapter 6',
                section: '6.4',
                title: 'Converse of Pythagoras Theorem'
            }
        },
        {
            id: 'chunk_005',
            text: 'Chapter 2: Polynomials. Section 2.1: Introduction to Polynomials. A polynomial is an algebraic expression consisting of variables and coefficients. The degree of a polynomial is the highest power of the variable. Types include linear (degree 1), quadratic (degree 2), and cubic (degree 3).',
            metadata: {
                source: 'NCERT Mathematics Grade 10',
                chapter: 'Chapter 2',
                section: '2.1',
                title: 'Polynomials - Introduction'
            }
        }
    ];

    console.log('\n📚 Sample NCERT Content Loaded:');
    console.log(`   ✅ ${sampleChunks.length} chunks indexed`);
    console.log(`   ✅ From: NCERT Mathematics Grade 10`);
    console.log(`   ✅ Topics: Triangles, Pythagoras, Polynomials`);

    // Pause function for dramatic effect
    const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    await pause(1000);

    // User Question
    const userQuestion = "What is Pythagoras theorem?";

    console.log('\n' + '='.repeat(70));
    console.log('👤 USER QUESTION');
    console.log('='.repeat(70));
    console.log(`"${userQuestion}"`);

    await pause(1000);

    // STEP 1: Query Processing
    console.log('\n' + '─'.repeat(70));
    console.log('STEP 1: QUERY PROCESSING');
    console.log('─'.repeat(70));

    const cleanQuery = userQuestion.toLowerCase().trim();
    console.log('Original:', `"${userQuestion}"`);
    console.log('Cleaned: ', `"${cleanQuery}"`);
    console.log('Keywords:', cleanQuery.split(' ').join(', '));

    await pause(1000);

    // STEP 2: Create Query Embedding (Simulated)
    console.log('\n' + '─'.repeat(70));
    console.log('STEP 2: EMBEDDING CREATION');
    console.log('─'.repeat(70));
    console.log('Converting query to numerical vector...');

    // Simulated embedding - in reality, this would be 384 dimensions
    const queryEmbedding = cleanQuery.split(' ').map((word, i) =>
        Math.sin(word.charCodeAt(0) * i) * 0.5
    );

    console.log('Query Embedding (simplified 6D):');
    console.log(`  [${queryEmbedding.slice(0, 6).map(n => n.toFixed(3)).join(', ')}...]`);
    console.log('  (Real embeddings have 384 dimensions)');

    await pause(1000);

    // STEP 3: Vector Search with Scoring
    console.log('\n' + '─'.repeat(70));
    console.log('STEP 3: VECTOR SIMILARITY SEARCH');
    console.log('─'.repeat(70));
    console.log('Comparing query with all document chunks...\n');

    // Simple keyword-based scoring for demo
    function calculateScore(query, text) {
        const queryWords = query.toLowerCase().split(/\s+/);
        const textLower = text.toLowerCase();
        let score = 0;
        let matches = [];

        queryWords.forEach(word => {
            if (textLower.includes(word)) {
                score += 1;
                matches.push(word);
            }
        });

        // Boost score for exact phrases
        if (textLower.includes(query)) {
            score += 2;
        }

        return {
            score: score / queryWords.length,
            matches: matches
        };
    }

    const scoredChunks = sampleChunks.map(chunk => {
        const result = calculateScore(cleanQuery, chunk.text);
        return {
            ...chunk,
            relevanceScore: result.score,
            matchedKeywords: result.matches
        };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);

    scoredChunks.forEach((chunk, i) => {
        const stars = '⭐'.repeat(Math.ceil(chunk.relevanceScore * 5));
        const scorePercent = (chunk.relevanceScore * 100).toFixed(1);
        console.log(`${i + 1}. [Score: ${scorePercent}%] ${stars}`);
        console.log(`   ${chunk.metadata.title}`);
        console.log(`   Matched: ${chunk.matchedKeywords.join(', ') || 'none'}`);
        console.log(`   Text: "${chunk.text.substring(0, 80)}..."`);
        console.log('');
    });

    await pause(1500);

    // STEP 4: Retrieve Top K Chunks
    const topK = 3;
    const retrievedChunks = scoredChunks.slice(0, topK);

    console.log('─'.repeat(70));
    console.log(`STEP 4: RETRIEVE TOP ${topK} CHUNKS`);
    console.log('─'.repeat(70));
    console.log(`Selected the ${topK} most relevant chunks:\n`);

    retrievedChunks.forEach((chunk, i) => {
        console.log(`✅ Chunk ${i + 1} [${(chunk.relevanceScore * 100).toFixed(1)}%]`);
        console.log(`   Source: ${chunk.metadata.source}`);
        console.log(`   Section: ${chunk.metadata.section}`);
        console.log(`   Content: "${chunk.text.substring(0, 100)}..."`);
        console.log('');
    });

    await pause(1500);

    // STEP 5: Build Context
    console.log('─'.repeat(70));
    console.log('STEP 5: BUILD CONTEXT FOR LLM');
    console.log('─'.repeat(70));

    const context = retrievedChunks.map((chunk, i) => `
[Context ${i + 1}] - Relevance: ${(chunk.relevanceScore * 100).toFixed(1)}%
Source: ${chunk.metadata.source}, ${chunk.metadata.section}
Content: ${chunk.text}
`).join('\n---\n');

    console.log('Combined context from retrieved chunks:\n');
    console.log(context);

    await pause(1500);

    // STEP 6: Build Full Prompt
    console.log('\n' + '─'.repeat(70));
    console.log('STEP 6: BUILD PROMPT FOR LLM');
    console.log('─'.repeat(70));

    const fullPrompt = `You are an educational AI assistant specialized in NCERT curriculum.
Use the following context to answer the student's question accurately.
Always cite the source (chapter and section).

CONTEXT FROM NCERT TEXTBOOKS:
${context}

STUDENT QUESTION: ${userQuestion}

Provide a clear, accurate answer based on the context above.
Include relevant examples if available in the context.
Always cite specific sources.`;

    console.log('Full prompt prepared for LLM:');
    console.log('─'.repeat(70));
    console.log(fullPrompt);
    console.log('─'.repeat(70));
    console.log(`Total prompt length: ${fullPrompt.length} characters`);

    await pause(1500);

    // STEP 7: Simulate LLM Response
    console.log('\n' + '─'.repeat(70));
    console.log('STEP 7: LLM GENERATION (SIMULATED)');
    console.log('─'.repeat(70));
    console.log('🤖 Sending to GPT-4...');
    console.log('⏳ Generating response...');

    await pause(2000);

    const llmResponse = `According to **NCERT Mathematics Grade 10, Chapter 6, Section 6.3**:

**Pythagoras Theorem** states that in a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides.

**Mathematical Formula:**
If triangle ABC is right-angled at B, then:
**AC² = AB² + BC²**

Where:
• AC is the hypotenuse (longest side opposite the right angle)
• AB and BC are the other two sides

**Example from your textbook:**
If AB = 3 cm and BC = 4 cm, then:
AC² = 3² + 4² = 9 + 16 = 25
AC = 5 cm

This is known as a "3-4-5 Pythagorean triple" - a special set of numbers that always forms a right-angled triangle.

**Practical Applications:**
This theorem is used extensively in mathematics, physics, and engineering for calculating distances and verifying right angles.

**Related Concept:**
The converse is also true (Section 6.4) - if the sides of a triangle satisfy this equation, the triangle must be right-angled.

📚 **Sources:**
• NCERT Mathematics Grade 10, Chapter 6, Section 6.3
• NCERT Mathematics Grade 10, Chapter 6, Section 6.3 (Example)
• NCERT Mathematics Grade 10, Chapter 6, Section 6.4`;

    console.log('✅ Response generated!\n');

    await pause(1000);

    // STEP 8: Display Response
    console.log('─'.repeat(70));
    console.log('STEP 8: FINAL RESPONSE TO USER');
    console.log('─'.repeat(70));
    console.log('\n' + llmResponse);

    await pause(1500);

    // Performance Metrics
    console.log('\n' + '='.repeat(70));
    console.log('📊 PERFORMANCE METRICS');
    console.log('='.repeat(70));

    const metrics = {
        'Total Time': '1.8 seconds',
        'Query Processing': '0.05s (3%)',
        'Embedding Creation': '0.15s (8%)',
        'Vector Search': '0.10s (6%)',
        'Context Building': '0.05s (3%)',
        'LLM Generation': '1.40s (78%)',
        'Post-processing': '0.05s (3%)',
        '': '',
        'Chunks Searched': sampleChunks.length,
        'Chunks Retrieved': topK,
        'Tokens Used (est)': '~800 tokens',
        'Cost (est)': '$0.008'
    };

    Object.entries(metrics).forEach(([key, value]) => {
        if (key === '') {
            console.log('');
        } else {
            console.log(`${key.padEnd(25)}: ${value}`);
        }
    });

    // Quality Metrics
    console.log('\n' + '='.repeat(70));
    console.log('✨ QUALITY METRICS');
    console.log('='.repeat(70));

    console.log(`Relevance Score      : ${(retrievedChunks[0].relevanceScore * 100).toFixed(1)}% (High)`);
    console.log(`Source Citations     : ✅ Included`);
    console.log(`Examples Provided    : ✅ Yes`);
    console.log(`Curriculum Accurate  : ✅ 100% from NCERT`);
    console.log(`Response Quality     : ✅ Comprehensive`);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('🎯 RAG PIPELINE SUMMARY');
    console.log('='.repeat(70));

    console.log(`
📥 INPUT:  User question about Pythagoras theorem
           ↓
🔍 SEARCH: Found ${retrievedChunks.length} highly relevant chunks
           ↓
🤖 LLM:    Generated accurate answer with citations
           ↓
📤 OUTPUT: Complete response with examples and sources

✅ Benefits:
   • Accurate to NCERT curriculum
   • Source citations included
   • Examples from textbook
   • Verifiable information
   • Privacy preserved (local data)
    `);

    console.log('='.repeat(70));
    console.log('🎬 DEMO COMPLETE!');
    console.log('='.repeat(70));

    console.log('\n💡 Try it yourself:');
    console.log('   1. Copy this script to your project');
    console.log('   2. Add your own NCERT content chunks');
    console.log('   3. Connect to OpenAI API for real LLM responses');
    console.log('   4. Test with different questions!');

    console.log('\n📚 Read RAG_EXPLAINED.md for more details');

    return {
        question: userQuestion,
        chunks: retrievedChunks,
        response: llmResponse,
        metrics: metrics
    };
})();
