# RAG Chat User Guide

**EduLLM Platform - RAG Chat Feature Complete Guide**

---

## 💬 Overview

The RAG Chat is an intelligent chatbot that answers questions based on your NCERT curriculum using Retrieval-Augmented Generation (RAG) technology.

**Key Features:**
- 🔍 Searches your curriculum data
- 🤖 Generates accurate, contextual answers
- 📚 Provides source citations
- 🎯 Supports filters (Subject, Grade, Source)
- 💾 Saves chat history
- 📥 Export conversations

---

## 🚀 Quick Start

### Step 1: Navigate to RAG Chat

Click **"RAG Chat"** in the sidebar (second item under Features)

### Step 2: Ask a Question

Type your question in the input box at the bottom and press Enter or click the send button.

**Example Questions:**
- "What is Pythagoras theorem?"
- "Explain quadratic equations"
- "How do you calculate area of a circle?"

### Step 3: View Response

The AI assistant will:
1. Search relevant content from your curriculum
2. Generate a comprehensive answer
3. Include source citations

---

## 🎯 Using Filters

Narrow down your search scope with filters at the top:

### Subject Filter
- **All Subjects** - Search across all content
- **Mathematics** - Only math content
- **Physics** - Only physics content
- **Chemistry** - Only chemistry content
- **Biology** - Only biology content

### Grade Level Filter
- **All Grades** - Search all grade levels
- **Grade 9** - Only Grade 9 content
- **Grade 10** - Only Grade 10 content
- **Grade 11** - Only Grade 11 content
- **Grade 12** - Only Grade 12 content

### Source Filter
- **All Sources** - All available content
- **NCERT** - Official NCERT textbooks
- **CBSE** - CBSE materials
- **Lectures** - Lecture notes
- **Assignments** - Assignment content

---

## 💬 Chat Interface

### Message Types

**1. Your Messages (Blue, Right-aligned)**
- Questions you ask
- Appear on the right side
- Blue background

**2. Assistant Messages (White, Left-aligned)**
- AI-generated responses
- Appear on the left side
- White background with border
- Include source citations

**3. System Messages (Gray, Centered)**
- Welcome messages
- Status updates
- Appear in the center
- Gray background

### Message Features

**Bold Text:** `**text**` → **text**
**Italic Text:** `*text*` → *text*
**Line Breaks:** Automatic

---

## 🔧 Settings & Configuration

Access settings by clicking the gear icon or through the Settings page.

### RAG Settings

```javascript
window.ragChatManager.settings = {
    topK: 3,              // Number of chunks to retrieve (1-10)
    temperature: 0.7,      // Response creativity (0-1)
    maxTokens: 500,        // Max response length
    includeExamples: true, // Include examples in responses
    includeCitations: true // Show source citations
};
```

### Adjust Settings

```javascript
// Retrieve more context
window.ragChatManager.settings.topK = 5;

// More creative responses
window.ragChatManager.settings.temperature = 0.9;

// Longer responses
window.ragChatManager.settings.maxTokens = 800;

// Hide citations
window.ragChatManager.settings.includeCitations = false;
```

---

## 📊 Chat Management

### View Statistics

```javascript
const stats = window.ragChatManager.getStatistics();
console.log(stats);
```

**Returns:**
```javascript
{
    totalMessages: 25,
    userMessages: 12,
    assistantMessages: 12,
    oldestMessage: 1699123456789,
    newestMessage: 1699999999999
}
```

### Clear Chat History

```javascript
window.ragChatManager.clearChat();
```

Or use the UI (if clear button is added).

### Export Chat

```javascript
window.ragChatManager.exportChat();
```

Downloads JSON file with complete chat history.

---

## 🎨 Advanced Usage

### Programmatic Queries

```javascript
// Send a query programmatically
await window.ragChatManager.processRAGQuery("What is photosynthesis?");
```

### Add Custom Messages

```javascript
// Add user message
window.ragChatManager.addUserMessage("Custom question");

// Add assistant message with sources
window.ragChatManager.addAssistantMessage(
    "Custom response",
    [{ title: "NCERT Bio", section: "Chapter 5" }]
);

// Add system message
window.ragChatManager.addSystemMessage("System update");
```

### Access Chat History

```javascript
// View all messages
console.log(window.ragChatManager.chatHistory);

// Filter user messages
const userQueries = window.ragChatManager.chatHistory
    .filter(m => m.role === 'user')
    .map(m => m.content);

console.log(userQueries);
```

---

## 🔍 How RAG Works (Behind the Scenes)

When you ask a question:

1. **Query Processing** - Your question is cleaned and prepared
2. **Vector Search** - System searches for relevant content
3. **Context Retrieval** - Top 3-5 most relevant chunks retrieved
4. **Response Generation** - AI generates answer using context
5. **Source Citation** - Sources are added to response
6. **Display** - Formatted response shown in chat

**Example Flow:**

```
You: "What is Pythagoras theorem?"
    ↓
[System searches curriculum]
    ↓
[Found: NCERT Math Ch 6, Section 6.3]
    ↓
[AI generates response using content]
    ↓
Response: "According to NCERT Math Grade 10...
          Pythagoras theorem states..."
          📚 Source: NCERT Math Ch 6, Sec 6.3
```

---

## ⚙️ Two Modes of Operation

### Mode 1: With LLM API (Recommended)

**Setup:**
1. Get OpenAI API key
2. Add in Settings page
3. Select model (GPT-4 recommended)

**Benefits:**
- Natural, fluent responses
- Better understanding of questions
- More comprehensive answers
- Handles complex queries

### Mode 2: Without LLM (Template-based)

**No API Required**

**How it works:**
- Returns relevant content directly
- Template-based formatting
- No AI generation

**Benefits:**
- 100% free
- Privacy preserved
- Instant responses
- Good for factual queries

---

## 📚 Best Practices

### 1. Ask Clear Questions

❌ **Bad:** "tell me"
✅ **Good:** "What is Newton's first law?"

❌ **Bad:** "that thing"
✅ **Good:** "Explain the Pythagorean theorem"

### 2. Use Specific Terms

❌ **Bad:** "the formula"
✅ **Good:** "quadratic formula"

❌ **Bad:** "the chapter about triangles"
✅ **Good:** "properties of similar triangles"

### 3. Use Filters Effectively

- Studying specific subject? → Set Subject filter
- Working on specific grade? → Set Grade filter
- Need official content only? → Set Source to NCERT

### 4. Follow-up Questions

Ask follow-up questions for deeper understanding:

```
You: "What is photosynthesis?"
Bot: [Explains photosynthesis]

You: "What are the products of photosynthesis?"
Bot: [Explains products]

You: "Can you give an example?"
Bot: [Provides example]
```

### 5. Verify Information

Always check source citations to verify information accuracy.

---

## 🐛 Troubleshooting

### Issue: "No curriculum data loaded"

**Solution:**
1. Go to Data Upload page
2. Upload NCERT PDFs
3. Click "Integrate Data"
4. Return to RAG Chat

### Issue: "No relevant information found"

**Possible Causes:**
- Question outside curriculum scope
- Filters too restrictive
- Typos in query

**Solutions:**
- Rephrase question
- Check filters (set to "All")
- Fix spelling
- Try related keywords

### Issue: Generic/Template Responses

**Cause:** LLM API not configured

**Solution:**
1. Go to Settings
2. Add OpenAI API key
3. Test connection
4. Retry query

### Issue: Slow Responses

**Causes:**
- Large dataset
- LLM API latency
- Network issues

**Solutions:**
- Reduce topK setting
- Use faster model (GPT-3.5)
- Check internet connection

### Issue: Chat History Lost

**Cause:** localStorage cleared

**Solution:**
- Export chat regularly
- Check browser settings
- Re-upload if needed

---

## 📊 Performance Tips

### Optimize for Speed

```javascript
// Use fewer chunks
window.ragChatManager.settings.topK = 2;

// Shorter responses
window.ragChatManager.settings.maxTokens = 300;
```

### Optimize for Quality

```javascript
// More context
window.ragChatManager.settings.topK = 5;

// More detailed responses
window.ragChatManager.settings.maxTokens = 800;

// Include examples
window.ragChatManager.settings.includeExamples = true;
```

### Balance Both

```javascript
// Good default settings
window.ragChatManager.settings = {
    topK: 3,
    temperature: 0.7,
    maxTokens: 500,
    includeExamples: true,
    includeCitations: true
};
```

---

## 🎓 Example Conversations

### Example 1: Mathematics

```
You: What is the quadratic formula?