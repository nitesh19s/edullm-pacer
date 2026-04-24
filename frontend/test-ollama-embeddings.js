#!/usr/bin/env node

/**
 * Quick test for Ollama embeddings
 */

async function testEmbeddings() {
    console.log('🧪 Testing Ollama Embeddings...\n');

    try {
        const response = await fetch('http://localhost:11434/api/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'nomic-embed-text',
                prompt: 'Photosynthesis is how plants make food.'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        console.log('✅ EMBEDDING TEST PASSED');
        console.log(`📏 Dimensions: ${data.embedding.length}`);
        console.log(`📊 First 5 values: [${data.embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
        console.log(`🤖 Model: nomic-embed-text\n`);

        return true;
    } catch (error) {
        console.error('❌ EMBEDDING TEST FAILED:', error.message);
        return false;
    }
}

testEmbeddings();
