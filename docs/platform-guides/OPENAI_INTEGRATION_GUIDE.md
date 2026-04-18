# OpenAI Integration Guide

## Overview

Complete OpenAI API integration for the EduLLM platform with configuration management, comprehensive testing, and RAG pipeline support.

## Quick Start

### 1. Set Your OpenAI API Key

Open your browser console and configure:

```javascript
// Set API key (stored in localStorage)
window.openaiConfig.setApiKey('sk-your-openai-api-key-here');

// Verify configuration
console.log(window.openaiConfig.getConfigSummary());
```

### 2. Test Your API Key

```javascript
// Test API key validity
const result = await window.openaiConfig.testApiKey();

if (result.success) {
    console.log('✅ API Key Valid!');
    console.log(`Available models: ${result.modelsAvailable}`);
} else {
    console.error('❌ API Key Invalid:', result.error);
}
```

### 3. Run Comprehensive Tests

```javascript
// Initialize tester
const tester = new OpenAITester(window.openaiConfig);

// Run all tests (5 automated tests)
await tester.runAllTests();
```

Expected output:
```
🧪 Starting OpenAI API Tests
==============================

📋 Test 1: Configuration
------------------------
Configured: ✅
API Key Set: ✅
Default Model: gpt-3.5-turbo
✅ API Key Valid
   Models Available: 50

💬 Test 2: Chat Completion
--------------------------
✅ Chat Completion Successful
   Model: gpt-3.5-turbo
   Response: "Photosynthesis is the process..."
   Tokens Used: 45
   Duration: 1234ms

🔢 Test 3: Embeddings
---------------------
✅ Embeddings Successful
   Model: text-embedding-ada-002
   Dimensions: 1536
   Tokens Used: 15
   Duration: 456ms

📚 Test 4: List Models
----------------------
✅ List Models Successful
   Total Models: 50
   GPT Models: 8
   Available GPT Models: gpt-4, gpt-4-turbo-preview, gpt-3.5-turbo...

🔍 Test 5: RAG Workflow
-----------------------
✅ RAG Workflow Successful
   Context Embeddings: 3
   Query Embedding: Created
   RAG Response: "The formula for photosynthesis is..."
   Total Tokens: 125

==============================
📊 Test Summary
==============================
Total Tests: 5
✅ Passed: 5
❌ Failed: 0
⊘ Skipped: 0
==============================

🎉 All tests passed!
```

## Configuration

### OpenAI Config Class

The `OpenAIConfig` class manages all OpenAI API interactions.

#### Initialization

```javascript
// Global instance automatically created
const config = window.openaiConfig;

// Or create custom instance
const customConfig = new OpenAIConfig();
```

#### Available Models

```javascript
const models = window.openaiConfig.models;

console.log(models);
// {
//   chat: ['gpt-4', 'gpt-4-turbo-preview', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'],
//   embeddings: ['text-embedding-ada-002', 'text-embedding-3-small', 'text-embedding-3-large'],
//   default: 'gpt-3.5-turbo'
// }
```

#### Configuration Methods

```javascript
// Set API key
window.openaiConfig.setApiKey('sk-your-key');

// Get API key
const key = window.openaiConfig.getApiKey();

// Check if configured
const isConfigured = window.openaiConfig.isConfigured();

// Validate API key format
const validation = window.openaiConfig.validateKeyFormat('sk-test-key');
console.log(validation);
// { valid: true/false, error: 'error message or null' }

// Test API key with actual API call
const test = await window.openaiConfig.testApiKey();
console.log(test);
// {
//   success: true/false,
//   message: 'API key is valid',
//   modelsAvailable: 50,
//   details: {...}
// }

// Initialize (validates and sets up)
const initialized = await window.openaiConfig.initialize();

// Get configuration summary
const summary = window.openaiConfig.getConfigSummary();
console.log(summary);
// {
//   configured: true,
//   initialized: true,
//   keySet: true,
//   keyLength: 51,
//   baseURL: 'https://api.openai.com/v1',
//   availableModels: {...},
//   defaultModel: 'gpt-3.5-turbo'
// }

// Clear API key
window.openaiConfig.clearApiKey();
```

## API Operations

### 1. Chat Completions

Create chat completions with GPT models:

```javascript
// Basic chat completion
const response = await window.openaiConfig.createChatCompletion([
    { role: 'system', content: 'You are a helpful educational assistant.' },
    { role: 'user', content: 'Explain quantum mechanics in simple terms.' }
]);

console.log(response.choices[0].message.content);
console.log(`Tokens used: ${response.usage.total_tokens}`);
```

#### With Options

```javascript
const response = await window.openaiConfig.createChatCompletion([
    { role: 'system', content: 'You are a math tutor.' },
    { role: 'user', content: 'Solve: 2x + 5 = 15' }
], {
    model: 'gpt-4',              // Model to use
    temperature: 0.7,             // Creativity (0-2)
    maxTokens: 500,               // Maximum response length
    topP: 0.9,                    // Nucleus sampling
    frequencyPenalty: 0,          // Reduce repetition
    presencePenalty: 0,           // Encourage new topics
    stream: false                 // Streaming response
});
```

#### Educational Examples

```javascript
// Concept Explanation
const explanation = await window.openaiConfig.createChatCompletion([
    { role: 'system', content: 'You are a biology teacher explaining to a 10th grade student.' },
    { role: 'user', content: 'What is photosynthesis?' }
], { temperature: 0.5, maxTokens: 200 });

// Problem Solving
const solution = await window.openaiConfig.createChatCompletion([
    { role: 'system', content: 'You are a patient math tutor. Show step-by-step solutions.' },
    { role: 'user', content: 'Solve the quadratic equation: x² - 5x + 6 = 0' }
], { temperature: 0.3, maxTokens: 300 });

// Question Generation
const questions = await window.openaiConfig.createChatCompletion([
    { role: 'system', content: 'Generate 3 multiple choice questions for testing understanding.' },
    { role: 'user', content: 'Topic: The French Revolution, Grade: 9' }
], { temperature: 0.8, maxTokens: 400 });
```

### 2. Embeddings

Create vector embeddings for text:

```javascript
// Single text embedding
const response = await window.openaiConfig.createEmbeddings(
    'Photosynthesis is the process by which plants make food.',
    'text-embedding-ada-002'
);

const embedding = response.data[0].embedding;
console.log(`Embedding dimensions: ${embedding.length}`); // 1536
console.log(`Tokens used: ${response.usage.total_tokens}`);
```

#### Batch Embeddings

```javascript
// Multiple texts at once
const texts = [
    'Photosynthesis converts light energy to chemical energy.',
    'Plants use chlorophyll to capture sunlight.',
    'The formula is: 6CO2 + 6H2O + light → C6H12O6 + 6O2'
];

const response = await window.openaiConfig.createEmbeddings(texts);

response.data.forEach((item, index) => {
    console.log(`Text ${index + 1}: ${item.embedding.length} dimensions`);
});
```

#### Using Different Embedding Models

```javascript
// Ada-002 (most cost-effective, 1536 dimensions)
const ada = await window.openaiConfig.createEmbeddings(
    'Sample text',
    'text-embedding-ada-002'
);

// Small (cheaper, faster, 1536 dimensions)
const small = await window.openaiConfig.createEmbeddings(
    'Sample text',
    'text-embedding-3-small'
);

// Large (higher quality, 3072 dimensions)
const large = await window.openaiConfig.createEmbeddings(
    'Sample text',
    'text-embedding-3-large'
);
```

### 3. List Available Models

```javascript
// Get all available models
const response = await window.openaiConfig.listModels();

console.log(`Total models: ${response.data.length}`);

// Filter for GPT models
const gptModels = response.data.filter(m => m.id.includes('gpt'));
console.log('GPT Models:', gptModels.map(m => m.id));

// Filter for embedding models
const embeddingModels = response.data.filter(m => m.id.includes('embedding'));
console.log('Embedding Models:', embeddingModels.map(m => m.id));
```

## RAG Pipeline Integration

### Complete RAG Workflow

The OpenAI integration includes a complete RAG (Retrieval-Augmented Generation) workflow:

```javascript
// Step 1: Create embeddings for your knowledge base
const knowledgeBase = [
    'Linear equations have the form ax + b = c.',
    'To solve linear equations, isolate the variable.',
    'Example: 2x + 5 = 15, subtract 5 from both sides: 2x = 10',
    'Divide both sides by 2: x = 5'
];

const kbEmbeddings = await window.openaiConfig.createEmbeddings(knowledgeBase);
console.log(`Created ${kbEmbeddings.data.length} knowledge base embeddings`);

// Step 2: Create embedding for user query
const userQuery = 'How do I solve a linear equation?';
const queryEmbedding = await window.openaiConfig.createEmbeddings(userQuery);

// Step 3: Retrieve relevant context (similarity search)
// In production, use vector database for this
// For demo, we'll use all context
const relevantContext = knowledgeBase;

// Step 4: Generate response with context
const response = await window.openaiConfig.createChatCompletion([
    {
        role: 'system',
        content: 'You are a helpful math tutor. Use the provided context to answer questions accurately.'
    },
    {
        role: 'user',
        content: `Context:\n${relevantContext.join('\n')}\n\nQuestion: ${userQuery}`
    }
], {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 300
});

console.log('RAG Response:', response.choices[0].message.content);
console.log(`Total tokens: ${response.usage.total_tokens}`);
```

### RAG with Vector Database

Integration with EduLLM's vector database:

```javascript
// Assuming you have the integration manager set up
const api = window.integrationManager.getAPIClient();

// 1. Create a collection
const collection = await api.createCollection({
    name: 'Math Grade 10',
    description: 'Linear equations study material'
});

const collectionId = collection.data.id;

// 2. Add documents with embeddings
const documents = [
    { text: 'Linear equations have the form ax + b = c.', metadata: { topic: 'basics' } },
    { text: 'To solve, isolate the variable by inverse operations.', metadata: { topic: 'solving' } },
    { text: 'Example: 3x - 7 = 14. Add 7: 3x = 21. Divide by 3: x = 7', metadata: { topic: 'example' } }
];

// Create embeddings for documents
for (const doc of documents) {
    const embedding = await window.openaiConfig.createEmbeddings(doc.text);
    doc.embedding = embedding.data[0].embedding;
}

// Add to vector database
await api.addDocuments(collectionId, documents);

// 3. Query with user question
const userQuestion = 'Show me an example of solving a linear equation';

// Get embedding for question
const questionEmbedding = await window.openaiConfig.createEmbeddings(userQuestion);

// Query vector database for similar documents
const results = await api.queryCollection(
    collectionId,
    userQuestion,
    3  // Top 3 results
);

// 4. Generate response with retrieved context
const context = results.data.results.map(r => r.text).join('\n');

const answer = await window.openaiConfig.createChatCompletion([
    {
        role: 'system',
        content: 'You are a helpful math tutor. Use the provided examples to help explain concepts.'
    },
    {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${userQuestion}`
    }
]);

console.log('Answer:', answer.choices[0].message.content);
```

## Testing Suite

### OpenAITester Class

Comprehensive automated testing:

```javascript
const tester = new OpenAITester(window.openaiConfig);

// Run all tests
const results = await tester.runAllTests();

// Get test results
const testResults = tester.getResults();
console.log(testResults);
// [
//   { test: 'Configuration', status: 'passed', details: {...} },
//   { test: 'Chat Completion', status: 'passed', duration: 1234, tokens: 45 },
//   { test: 'Embeddings', status: 'passed', duration: 456, dimensions: 1536 },
//   { test: 'List Models', status: 'passed', totalModels: 50, gptModels: 8 },
//   { test: 'RAG Workflow', status: 'passed', embeddings: 3, tokens: 125 }
// ]
```

### Individual Test Methods

```javascript
const tester = new OpenAITester(window.openaiConfig);

// Test configuration only
await tester.testConfiguration();

// Test chat completion
await tester.testChatCompletion();

// Test embeddings
await tester.testEmbeddings();

// Test models list
await tester.testModelsList();

// Test RAG workflow
await tester.testRAGWorkflow();
```

## Integration with EduLLM Platform

### Using with Experiment Manager

```javascript
// Create an experiment with OpenAI configuration
const experiment = {
    name: 'GPT-4 RAG Performance Test',
    description: 'Testing GPT-4 with vector database retrieval',
    configuration: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000
    }
};

// Using backend API
const api = window.integrationManager.getAPIClient();
const created = await api.createExperiment(experiment);

// Run experiment with OpenAI
const testCases = [
    {
        input: 'Explain photosynthesis',
        expected: 'Should mention light, chlorophyll, CO2, H2O'
    },
    {
        input: 'Solve: 2x + 5 = 15',
        expected: 'x = 5'
    }
];

// Execute test cases
for (const testCase of testCases) {
    const response = await window.openaiConfig.createChatCompletion([
        { role: 'user', content: testCase.input }
    ], {
        model: experiment.configuration.model,
        temperature: experiment.configuration.temperature,
        maxTokens: experiment.configuration.maxTokens
    });

    console.log('Input:', testCase.input);
    console.log('Response:', response.choices[0].message.content);
    console.log('Expected:', testCase.expected);
    console.log('---');
}
```

### Using with RAG Chat

```javascript
// Enhanced chat with OpenAI + Vector DB
async function ragChat(userMessage, subject = 'General') {
    // 1. Get relevant context from vector database
    const api = window.integrationManager.getAPIClient();
    const contextResults = await api.retrieveContext(userMessage, 5);

    const context = contextResults.data.context
        .map(c => c.text)
        .join('\n\n');

    // 2. Generate response with OpenAI
    const response = await window.openaiConfig.createChatCompletion([
        {
            role: 'system',
            content: `You are an expert ${subject} tutor. Use the provided context to give accurate, educational responses.`
        },
        {
            role: 'user',
            content: `Context:\n${context}\n\nStudent Question: ${userMessage}`
        }
    ], {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 500
    });

    return {
        answer: response.choices[0].message.content,
        tokensUsed: response.usage.total_tokens,
        contextSources: contextResults.data.context.length
    };
}

// Use it
const result = await ragChat('What is the Pythagorean theorem?', 'Mathematics');
console.log('Answer:', result.answer);
console.log('Used', result.tokensUsed, 'tokens');
console.log('Retrieved', result.contextSources, 'context sources');
```

### Using with Research Features

```javascript
// Generate personalized learning content based on student progression
async function generatePersonalizedContent(studentId, conceptId) {
    // Get student's learning progression
    const api = window.integrationManager.getAPIClient();
    const progression = await api.getProgressionAnalytics(studentId);

    // Find concept mastery
    const concept = progression.data.mastery.all.find(c => c.conceptId === conceptId);

    // Generate appropriate content based on mastery level
    let difficulty, approach;
    if (concept.masteryLevel < 50) {
        difficulty = 'beginner';
        approach = 'very simple explanations with lots of examples';
    } else if (concept.masteryLevel < 80) {
        difficulty = 'intermediate';
        approach = 'more detailed explanations with practice problems';
    } else {
        difficulty = 'advanced';
        approach = 'challenging problems and deeper exploration';
    }

    // Generate content with OpenAI
    const response = await window.openaiConfig.createChatCompletion([
        {
            role: 'system',
            content: `You are an adaptive learning system. Create ${difficulty} level content for ${concept.conceptName}.`
        },
        {
            role: 'user',
            content: `Student mastery level: ${concept.masteryLevel.toFixed(1)}%
Success rate: ${concept.successRate.toFixed(1)}%
Attempts: ${concept.attempts}

Generate a ${difficulty} difficulty lesson with ${approach}.`
        }
    ], {
        model: 'gpt-4',
        temperature: 0.8,
        maxTokens: 800
    });

    return response.choices[0].message.content;
}

// Use it
const lesson = await generatePersonalizedContent('student_001', 'math_linear_equations');
console.log(lesson);
```

## Error Handling

### Handling API Errors

```javascript
try {
    const response = await window.openaiConfig.createChatCompletion([
        { role: 'user', content: 'Hello' }
    ]);
    console.log(response.choices[0].message.content);
} catch (error) {
    console.error('OpenAI API Error:', error);

    if (error.message.includes('API key')) {
        console.log('Please set your API key: window.openaiConfig.setApiKey("sk-...")');
    } else if (error.message.includes('rate limit')) {
        console.log('Rate limit exceeded. Please wait and try again.');
    } else if (error.message.includes('quota')) {
        console.log('API quota exceeded. Check your OpenAI account.');
    } else {
        console.log('Unknown error. Check your configuration and network connection.');
    }
}
```

### Validation Before API Calls

```javascript
// Check configuration before making calls
if (!window.openaiConfig.isConfigured()) {
    console.error('OpenAI not configured!');
    console.log('Set API key: window.openaiConfig.setApiKey("sk-...")');
} else {
    // Test API key validity
    const test = await window.openaiConfig.testApiKey();

    if (test.success) {
        // Proceed with API calls
        const response = await window.openaiConfig.createChatCompletion([...]);
    } else {
        console.error('Invalid API key:', test.error);
    }
}
```

## Best Practices

### 1. API Key Security

```javascript
// ✅ Good: Store in localStorage (client-side only)
window.openaiConfig.setApiKey('sk-...');

// ❌ Bad: Hardcode in source code
const apiKey = 'sk-...'; // Never do this!

// ✅ Good: Use environment variables in production
// Set via backend API or environment configuration

// ✅ Good: Clear API key when done
window.openaiConfig.clearApiKey();
```

### 2. Cost Optimization

```javascript
// Use appropriate models for tasks
// GPT-3.5-turbo: Faster, cheaper, good for simple tasks
// GPT-4: Slower, more expensive, better for complex reasoning

// Simple tasks: use GPT-3.5-turbo
const simple = await window.openaiConfig.createChatCompletion([...], {
    model: 'gpt-3.5-turbo'
});

// Complex reasoning: use GPT-4
const complex = await window.openaiConfig.createChatCompletion([...], {
    model: 'gpt-4'
});

// Limit max tokens to control costs
const response = await window.openaiConfig.createChatCompletion([...], {
    maxTokens: 150  // Shorter responses = lower cost
});
```

### 3. Temperature Settings

```javascript
// Deterministic responses (factual content): low temperature
const factual = await window.openaiConfig.createChatCompletion([...], {
    temperature: 0.3  // More focused, consistent
});

// Creative content: higher temperature
const creative = await window.openaiConfig.createChatCompletion([...], {
    temperature: 0.9  // More varied, creative
});

// Balanced (default): moderate temperature
const balanced = await window.openaiConfig.createChatCompletion([...], {
    temperature: 0.7
});
```

### 4. Caching Embeddings

```javascript
// Cache embeddings to avoid redundant API calls
const embeddingCache = new Map();

async function getCachedEmbedding(text) {
    if (embeddingCache.has(text)) {
        console.log('Using cached embedding');
        return embeddingCache.get(text);
    }

    const response = await window.openaiConfig.createEmbeddings(text);
    const embedding = response.data[0].embedding;

    embeddingCache.set(text, embedding);
    return embedding;
}

// Use it
const embedding1 = await getCachedEmbedding('Photosynthesis is...');
const embedding2 = await getCachedEmbedding('Photosynthesis is...'); // Uses cache
```

## Troubleshooting

### Issue: API Key Not Working

```javascript
// Check API key format
const validation = window.openaiConfig.validateKeyFormat();
console.log(validation);

// Test with actual API call
const test = await window.openaiConfig.testApiKey();
console.log(test);

// Re-set API key
window.openaiConfig.setApiKey('sk-correct-key');
```

### Issue: Rate Limit Errors

```javascript
// Implement retry with exponential backoff
async function callWithRetry(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (error.message.includes('rate limit') && i < maxRetries - 1) {
                const delay = Math.pow(2, i) * 1000; // Exponential backoff
                console.log(`Rate limited. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
}

// Use it
const response = await callWithRetry(() =>
    window.openaiConfig.createChatCompletion([...])
);
```

### Issue: Timeout Errors

```javascript
// Increase timeout for long-running requests
// Note: This requires modifying the fetch call
// For now, use reasonable max_tokens to keep responses quick

const response = await window.openaiConfig.createChatCompletion([...], {
    maxTokens: 500  // Shorter = faster
});
```

## Console Quick Reference

```javascript
// Setup
window.openaiConfig.setApiKey('sk-...')
await window.openaiConfig.testApiKey()

// Chat
await window.openaiConfig.createChatCompletion([
    { role: 'user', content: 'Your question' }
])

// Embeddings
await window.openaiConfig.createEmbeddings('Your text')

// Testing
const tester = new OpenAITester(window.openaiConfig)
await tester.runAllTests()

// Status
window.openaiConfig.getConfigSummary()
window.openaiConfig.isConfigured()

// Models
await window.openaiConfig.listModels()
```

## Production Deployment

### Security Considerations

1. **Never expose API keys in client-side code**
   - Use backend proxy for production
   - Implement rate limiting
   - Monitor usage

2. **Backend Proxy Pattern** (Recommended)

```javascript
// Instead of direct OpenAI calls from browser:
// Browser → Your Backend API → OpenAI API

// Your backend handles:
// - API key storage
// - Rate limiting
// - Usage tracking
// - Cost control
```

3. **Use Backend Integration**

```javascript
// Use the EduLLM backend API instead of direct OpenAI calls
const api = window.integrationManager.getAPIClient();

// Backend handles OpenAI integration securely
const response = await api.sendMessage({
    message: 'Your question',
    context: { subject: 'Math' }
});
```

## Summary

The OpenAI integration provides:

- ✅ Complete API configuration management
- ✅ Chat completions with GPT-3.5/GPT-4
- ✅ Embeddings generation for RAG
- ✅ Model listing and discovery
- ✅ Comprehensive automated testing
- ✅ RAG workflow implementation
- ✅ Error handling and validation
- ✅ Integration with EduLLM features
- ✅ Console-based testing interface
- ✅ Production-ready patterns

All features are immediately available via browser console for testing and development.

For production use, implement the backend proxy pattern to keep API keys secure and monitor usage.
