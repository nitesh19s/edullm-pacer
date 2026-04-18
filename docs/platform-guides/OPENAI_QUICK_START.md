# OpenAI Integration - Quick Start

## 5-Minute Setup & Testing

### Step 1: Open the Platform

```bash
# From project root
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser and open the console (F12).

### Step 2: Configure API Key

```javascript
// Set your OpenAI API key
window.openaiConfig.setApiKey('sk-your-openai-api-key-here');

// Verify it's set
window.openaiConfig.getConfigSummary();
```

Expected output:
```javascript
{
  configured: true,
  initialized: false,
  keySet: true,
  keyLength: 51,
  baseURL: 'https://api.openai.com/v1',
  availableModels: {...},
  defaultModel: 'gpt-3.5-turbo'
}
```

### Step 3: Test API Key

```javascript
// Validate with actual API call
const result = await window.openaiConfig.testApiKey();
console.log(result);
```

Expected output:
```javascript
{
  success: true,
  message: 'API key is valid',
  modelsAvailable: 50,
  details: {...}
}
```

### Step 4: Run Tests

```javascript
// Run all automated tests
const tester = new OpenAITester(window.openaiConfig);
await tester.runAllTests();
```

Expected: All 5 tests pass ✅

### Step 5: Try Chat Completion

```javascript
// Simple chat
const response = await window.openaiConfig.createChatCompletion([
    { role: 'user', content: 'Explain the Pythagorean theorem in one sentence.' }
]);

console.log(response.choices[0].message.content);
console.log(`Tokens used: ${response.usage.total_tokens}`);
```

### Step 6: Try Embeddings

```javascript
// Create embedding
const embedding = await window.openaiConfig.createEmbeddings(
    'The Pythagorean theorem states that a² + b² = c²'
);

console.log(`Dimensions: ${embedding.data[0].embedding.length}`);
console.log(`Tokens used: ${embedding.usage.total_tokens}`);
```

### Step 7: Test RAG Workflow

```javascript
// Complete RAG pipeline test
const tester = new OpenAITester(window.openaiConfig);
await tester.testRAGWorkflow();
```

Expected: RAG workflow completes with context embeddings + chat response ✅

## Common Commands

```javascript
// Configuration
window.openaiConfig.setApiKey('sk-...')
window.openaiConfig.getApiKey()
window.openaiConfig.isConfigured()
window.openaiConfig.getConfigSummary()
await window.openaiConfig.testApiKey()
await window.openaiConfig.initialize()

// Chat
await window.openaiConfig.createChatCompletion([
    { role: 'system', content: 'You are a helpful tutor.' },
    { role: 'user', content: 'Explain photosynthesis.' }
], {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 200
})

// Embeddings
await window.openaiConfig.createEmbeddings('Sample text')
await window.openaiConfig.createEmbeddings(['text1', 'text2', 'text3'])

// Models
await window.openaiConfig.listModels()

// Testing
const tester = new OpenAITester(window.openaiConfig)
await tester.runAllTests()
await tester.testConfiguration()
await tester.testChatCompletion()
await tester.testEmbeddings()
await tester.testModelsList()
await tester.testRAGWorkflow()

// Cleanup
window.openaiConfig.clearApiKey()
```

## Educational Examples

### Example 1: Concept Explanation

```javascript
const response = await window.openaiConfig.createChatCompletion([
    {
        role: 'system',
        content: 'You are a biology teacher explaining to a 10th grade student.'
    },
    {
        role: 'user',
        content: 'What is photosynthesis? Keep it under 100 words.'
    }
], {
    temperature: 0.5,
    maxTokens: 150
});

console.log(response.choices[0].message.content);
```

### Example 2: Problem Solving

```javascript
const response = await window.openaiConfig.createChatCompletion([
    {
        role: 'system',
        content: 'You are a patient math tutor. Show step-by-step solutions.'
    },
    {
        role: 'user',
        content: 'Solve the equation: 3x + 7 = 22'
    }
], {
    temperature: 0.3,
    maxTokens: 200
});

console.log(response.choices[0].message.content);
```

### Example 3: Question Generation

```javascript
const response = await window.openaiConfig.createChatCompletion([
    {
        role: 'system',
        content: 'Generate 3 multiple choice questions for testing understanding.'
    },
    {
        role: 'user',
        content: 'Topic: Newton\'s Laws of Motion, Grade: 9, Difficulty: Medium'
    }
], {
    temperature: 0.8,
    maxTokens: 400
});

console.log(response.choices[0].message.content);
```

### Example 4: RAG Chat (With Context)

```javascript
// Knowledge base
const context = [
    'Linear equations have the form ax + b = c.',
    'To solve, isolate the variable using inverse operations.',
    'Example: 2x + 5 = 15. Subtract 5: 2x = 10. Divide by 2: x = 5'
];

// Create embeddings for context
const contextEmbeddings = await window.openaiConfig.createEmbeddings(context);
console.log(`Created ${contextEmbeddings.data.length} embeddings`);

// User question
const question = 'How do I solve a linear equation? Give me an example.';

// Generate answer with context
const response = await window.openaiConfig.createChatCompletion([
    {
        role: 'system',
        content: 'You are a helpful math tutor. Use the provided context to answer questions.'
    },
    {
        role: 'user',
        content: `Context:\n${context.join('\n')}\n\nQuestion: ${question}`
    }
], {
    temperature: 0.7,
    maxTokens: 300
});

console.log('Answer:', response.choices[0].message.content);
console.log(`Tokens used: ${response.usage.total_tokens}`);
```

### Example 5: Batch Embeddings for Vector DB

```javascript
// Educational content to embed
const documents = [
    'Photosynthesis converts light energy to chemical energy in plants.',
    'The chemical equation is: 6CO2 + 6H2O + light → C6H12O6 + 6O2',
    'Chlorophyll is the green pigment that captures light energy.',
    'Photosynthesis occurs in the chloroplasts of plant cells.',
    'The process has two stages: light-dependent and light-independent reactions.'
];

// Create embeddings for all documents
const embeddings = await window.openaiConfig.createEmbeddings(documents);

console.log(`Created ${embeddings.data.length} embeddings`);
embeddings.data.forEach((item, index) => {
    console.log(`Document ${index + 1}: ${item.embedding.length} dimensions`);
});

console.log(`Total tokens used: ${embeddings.usage.total_tokens}`);
```

## Integration with EduLLM Backend

### Using with Backend API

If you have the backend running:

```javascript
// 1. Set OpenAI key for frontend testing
window.openaiConfig.setApiKey('sk-...');

// 2. Also configure backend API
window.integrationManager.setApiKey('your-backend-api-key');

// 3. Test both connections
await window.openaiConfig.testApiKey(); // OpenAI
await window.integrationManager.testConnection(); // Backend

// 4. Use backend for RAG chat (backend handles OpenAI)
const api = window.integrationManager.getAPIClient();
const response = await api.sendMessage({
    message: 'Explain photosynthesis',
    context: { subject: 'Biology', grade: 10 }
});

console.log(response.data.response);
```

### Complete RAG Pipeline with Backend

```javascript
// 1. Create collection in vector database
const api = window.integrationManager.getAPIClient();

const collection = await api.createCollection({
    name: 'Biology Grade 10',
    description: 'Photosynthesis study material'
});

const collectionId = collection.data.id;

// 2. Create documents with embeddings
const documents = [
    { text: 'Photosynthesis converts light to chemical energy.', metadata: { topic: 'overview' } },
    { text: 'Chlorophyll captures light energy in chloroplasts.', metadata: { topic: 'mechanism' } },
    { text: 'The formula: 6CO2 + 6H2O + light → C6H12O6 + 6O2', metadata: { topic: 'formula' } }
];

// Generate embeddings with OpenAI
for (const doc of documents) {
    const embedding = await window.openaiConfig.createEmbeddings(doc.text);
    doc.embedding = embedding.data[0].embedding;
}

// Add to vector database
await api.addDocuments(collectionId, documents);
console.log('✅ Added documents to vector database');

// 3. Query with user question
const userQuestion = 'What is the formula for photosynthesis?';

// Get embedding for question
const questionEmbedding = await window.openaiConfig.createEmbeddings(userQuestion);

// Query vector database
const results = await api.queryCollection(collectionId, userQuestion, 3);
console.log(`Found ${results.data.results.length} relevant documents`);

// 4. Generate answer with retrieved context
const context = results.data.results.map(r => r.text).join('\n');

const answer = await window.openaiConfig.createChatCompletion([
    {
        role: 'system',
        content: 'You are a helpful biology tutor. Use the provided context to answer accurately.'
    },
    {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${userQuestion}`
    }
]);

console.log('Answer:', answer.choices[0].message.content);
console.log(`Tokens used: ${answer.usage.total_tokens}`);
```

## Model Selection Guide

### Chat Models

```javascript
// GPT-3.5 Turbo (Fast, cost-effective)
// Best for: Simple Q&A, basic explanations, quick responses
await window.openaiConfig.createChatCompletion([...], {
    model: 'gpt-3.5-turbo'
});

// GPT-3.5 Turbo 16K (Longer context)
// Best for: Long documents, detailed context
await window.openaiConfig.createChatCompletion([...], {
    model: 'gpt-3.5-turbo-16k'
});

// GPT-4 (Advanced reasoning)
// Best for: Complex problems, deep explanations, creative content
await window.openaiConfig.createChatCompletion([...], {
    model: 'gpt-4'
});

// GPT-4 Turbo (Latest, larger context)
// Best for: Most advanced tasks, longest context windows
await window.openaiConfig.createChatCompletion([...], {
    model: 'gpt-4-turbo-preview'
});
```

### Embedding Models

```javascript
// Ada 002 (Most popular, cost-effective)
// 1536 dimensions, best for most use cases
await window.openaiConfig.createEmbeddings(text, 'text-embedding-ada-002');

// v3 Small (Cheaper, faster)
// 1536 dimensions, good performance
await window.openaiConfig.createEmbeddings(text, 'text-embedding-3-small');

// v3 Large (Highest quality)
// 3072 dimensions, best accuracy
await window.openaiConfig.createEmbeddings(text, 'text-embedding-3-large');
```

## Troubleshooting

### Error: "API key is required"

```javascript
// Set your API key first
window.openaiConfig.setApiKey('sk-your-key-here');
```

### Error: "API key should start with 'sk-'"

```javascript
// Check your API key format
const validation = window.openaiConfig.validateKeyFormat('your-key');
console.log(validation);

// Get a valid key from: https://platform.openai.com/api-keys
```

### Error: "Invalid API key"

```javascript
// Test your API key
const result = await window.openaiConfig.testApiKey();
console.log(result);

// If invalid, get a new key from OpenAI dashboard
```

### Error: Rate limit exceeded

```javascript
// Wait and retry
// Or check your OpenAI account limits
// Free tier: Lower limits
// Paid tier: Higher limits
```

### Error: Quota exceeded

```javascript
// Add credits to your OpenAI account
// Or check usage at: https://platform.openai.com/usage
```

### Checking Configuration

```javascript
// Full status check
console.log(window.openaiConfig.getConfigSummary());

// Is configured?
console.log(window.openaiConfig.isConfigured());

// Test API key
const test = await window.openaiConfig.testApiKey();
console.log(test);
```

## Cost Estimates (Approximate)

### Chat Completions

- GPT-3.5 Turbo: $0.0015 per 1K input tokens, $0.002 per 1K output tokens
- GPT-4: $0.03 per 1K input tokens, $0.06 per 1K output tokens
- GPT-4 Turbo: $0.01 per 1K input tokens, $0.03 per 1K output tokens

### Embeddings

- Ada 002: $0.0001 per 1K tokens
- v3 Small: $0.00002 per 1K tokens
- v3 Large: $0.00013 per 1K tokens

### Example Costs

```javascript
// Simple Q&A (~100 tokens)
// GPT-3.5: ~$0.0002
// GPT-4: ~$0.006

// RAG Query (500 tokens context + 200 token response)
// GPT-3.5: ~$0.0015
// GPT-4: ~$0.03

// Embedding 1000 documents (avg 100 tokens each)
// Ada 002: ~$0.01
// v3 Small: ~$0.002
```

## Next Steps

1. **Configure your API key** ✅
2. **Run tests** ✅
3. **Try examples** ✅
4. **Integrate with your app**
5. **Monitor usage and costs**

## Resources

- **Full Guide**: `OPENAI_INTEGRATION_GUIDE.md`
- **OpenAI Docs**: https://platform.openai.com/docs
- **API Keys**: https://platform.openai.com/api-keys
- **Usage Dashboard**: https://platform.openai.com/usage
- **Pricing**: https://openai.com/pricing

## Summary

You now have:

- ✅ Complete OpenAI API integration
- ✅ Configuration management
- ✅ Comprehensive testing suite
- ✅ Chat completion support
- ✅ Embeddings generation
- ✅ RAG workflow implementation
- ✅ Error handling
- ✅ Usage examples

Start testing with: `await new OpenAITester(window.openaiConfig).runAllTests()`
