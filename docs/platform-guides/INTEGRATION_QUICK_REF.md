# Integration & Testing - Quick Reference

## 🚀 5-Minute Quick Start

### 1. Start Services (2 terminals)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
python3 -m http.server 8000
```

### 2. Configure (Browser Console)

Open `http://localhost:8000` and in console:

```javascript
// Set API key
window.integrationManager.setApiKey('your-secure-api-key-123');

// Verify connection
await window.integrationManager.testConnection();
```

### 3. Run Tests

```javascript
const test = new IntegrationTestSuite(window.integrationManager);
await test.runAllTests();
```

**Expected**: 95%+ tests pass

### 4. Run Demo

```javascript
const demo = new DemoWorkflow(
    window.integrationManager,
    new TestDataGenerator()
);
await demo.runCompleteDemo();
```

**Expected**: All 5 demos complete successfully

## 📝 Essential Console Commands

### Status & Connection
```javascript
// Get status
window.integrationManager.getConnectionStatus()

// Test connection
await window.integrationManager.testConnection()

// Set API key
window.integrationManager.setApiKey('your-key')

// Set mode
window.integrationManager.setMode('auto') // 'api', 'local', 'auto'
```

### API Client Quick Access
```javascript
// Get API client
const api = window.integrationManager.getAPIClient()

// Create experiment
await api.createExperiment({
    name: 'Test',
    configuration: { provider: 'openai', model: 'gpt-4' }
})

// Track learning
await api.trackInteraction({
    studentId: 'student_001',
    conceptId: 'math_001',
    conceptName: 'Algebra',
    subject: 'Math',
    success: true
})

// Send chat message
await api.sendMessage({
    message: 'Explain quadratic equations',
    context: { subject: 'Math', grade: 10 }
})
```

### Testing
```javascript
// Run all tests
const test = new IntegrationTestSuite(window.integrationManager);
await test.runAllTests();

// Run specific category (modify test suite)
await test.testExperimentsAPI();
await test.testResearchFeaturesAPI();
await test.testVectorDatabaseAPI();
await test.testRAGChatAPI();
await test.testAnalyticsAPI();
```

### Generate Test Data
```javascript
// Create generator
const gen = new TestDataGenerator();

// Generate single items
gen.generateExperiment(1)
gen.generateInteraction('student_001')
gen.generateCollection(1)

// Generate bulk
const dataset = gen.generateCompleteDataset();
gen.saveToLocalStorage('test_data');
```

### Run Demo
```javascript
const demo = new DemoWorkflow(
    window.integrationManager,
    new TestDataGenerator()
);

await demo.runCompleteDemo();
await demo.clearDemoData(); // Cleanup
```

## 🔧 Common Tasks

### Task: Create & Run Experiment
```javascript
const api = window.integrationManager.getAPIClient();

// Create
const exp = await api.createExperiment({
    name: 'My Experiment',
    description: 'Testing GPT-4',
    configuration: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7
    }
});

const expId = exp.data.id;

// Run
await api.createExperimentRun(expId, {
    testCases: [
        { input: 'test 1', expected: 'result 1' },
        { input: 'test 2', expected: 'result 2' }
    ]
});

// Get stats
const stats = await api.getExperimentStats(expId);
console.log(stats.data);
```

### Task: Track Student Learning
```javascript
const api = window.integrationManager.getAPIClient();
const studentId = 'student_001';

// Track interaction
await api.trackInteraction({
    studentId,
    conceptId: 'math_001',
    conceptName: 'Linear Equations',
    subject: 'Mathematics',
    grade: 10,
    difficulty: 5,
    success: true,
    confidence: 0.85
});

// Get progression
const progression = await api.getProgressionAnalytics(studentId);
console.log('Mastered:', progression.data.mastery.mastered.length);

// Analyze gaps
const gaps = await api.analyzeCurriculumGaps({
    studentId,
    targetGrade: 10,
    targetSubject: 'Mathematics'
});
console.log('Gaps found:', gaps.data.gaps.total);
```

### Task: Query Vector Database
```javascript
const api = window.integrationManager.getAPIClient();

// Create collection
const coll = await api.createCollection({
    name: 'NCERT Grade 10',
    description: 'Math textbook'
});

const collId = coll.data.id;

// Add documents
await api.addDocuments(collId, [
    { text: 'Quadratic equations are...', metadata: {} },
    { text: 'Linear equations are...', metadata: {} }
]);

// Query
const results = await api.queryCollection(
    collId,
    'explain quadratic equations',
    5
);
console.log('Found:', results.data.results.length);
```

### Task: RAG Chat Session
```javascript
const api = window.integrationManager.getAPIClient();

// Send message
const response = await api.sendMessage({
    message: 'Explain photosynthesis',
    context: {
        subject: 'Biology',
        grade: 10,
        topic: 'Plant Science'
    }
});

console.log('Session:', response.data.sessionId);
console.log('Context items:', response.data.retrievedContext.length);

// Get history
const session = await api.getChatSession(response.data.sessionId);
console.log('Messages:', session.data.history.length);
```

## ⚡ Troubleshooting

### Issue: Backend Not Connected

**Check:**
```javascript
window.integrationManager.getConnectionStatus()
```

**Fix:**
1. Ensure backend is running: `cd backend && npm run dev`
2. Check port: `http://localhost:3000/health`
3. Verify no CORS errors in console

### Issue: API Key Error

**Check:**
```javascript
window.integrationManager.getConnectionStatus().hasApiKey
```

**Fix:**
```javascript
window.integrationManager.setApiKey('your-correct-key')
```

### Issue: Tests Failing

**Check:**
1. Backend fully started (wait 5-10 seconds after launch)
2. API key is set
3. No other tests running

**Debug:**
```javascript
// Test connection first
await window.integrationManager.testConnection()

// Run tests with detailed output
const test = new IntegrationTestSuite(window.integrationManager);
await test.runAllTests();
// Check console for specific error messages
```

### Issue: Demo Fails

**Check:**
1. Backend is responding
2. Enough memory/CPU available
3. No network throttling

**Fix:**
```javascript
// Clear existing data
const demo = new DemoWorkflow(...);
await demo.clearDemoData();

// Try again
await demo.runCompleteDemo();
```

## 📊 Test Results Interpretation

### Good Results
```
Total Tests:   41
✅ Passed:     39-41 (95-100%)
❌ Failed:     0-2 (0-5%)
⊘ Skipped:     0 (0%)
```

### Acceptable Results
```
Total Tests:   41
✅ Passed:     37-39 (90-95%)
❌ Failed:     2-4 (5-10%)
⊘ Skipped:     0 (0%)
```

### Investigate If
- < 90% pass rate
- > 10 seconds total time
- Repeated failures on same test
- Any connection timeout errors

## 🎯 Key Files

### Integration Code
- `api-client.js` - API endpoint methods
- `integration-config.js` - Connection management
- `integration-test-suite.js` - Automated tests
- `test-data-generator.js` - Test data creation
- `demo-workflow.js` - Demo scenarios

### Documentation
- `INTEGRATION_TESTING_GUIDE.md` - Full guide
- `E2E_INTEGRATION_SUMMARY.md` - Implementation summary
- `INTEGRATION_QUICK_REF.md` - This file

### Backend
- `backend/server.js` - Express server
- `backend/routes/` - API endpoints
- `backend/README.md` - Backend docs

## 💡 Pro Tips

1. **Always test connection first**
   ```javascript
   await window.integrationManager.testConnection()
   ```

2. **Use auto mode for development**
   ```javascript
   window.integrationManager.setMode('auto')
   ```

3. **Generate test data in bulk**
   ```javascript
   const gen = new TestDataGenerator();
   gen.saveToLocalStorage('demo_data');
   ```

4. **Export test results**
   ```javascript
   const test = new IntegrationTestSuite(...);
   await test.runAllTests();
   console.log(test.exportResults());
   ```

5. **Clean up after demos**
   ```javascript
   await demo.clearDemoData();
   ```

## 📞 Getting Help

**Check These First:**
1. Backend health: `http://localhost:3000/health`
2. Backend API docs: `http://localhost:3000/api/v1/docs`
3. Browser console for errors
4. Backend terminal for errors

**Documentation:**
- Full guide: `INTEGRATION_TESTING_GUIDE.md`
- Backend API: `backend/README.md`
- Quick start: `backend/QUICK_START.md`

**Common Commands:**
```javascript
// Status check
window.integrationManager.getConnectionStatus()

// Full test
new IntegrationTestSuite(window.integrationManager).runAllTests()

// Demo
new DemoWorkflow(window.integrationManager, new TestDataGenerator()).runCompleteDemo()
```

---

**Last Updated**: 2024
**Version**: 1.0
