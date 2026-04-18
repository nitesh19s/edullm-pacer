# LLM Integration - Setup Guide

## 🎉 OpenAI Integration Complete!

The EduLLM Platform now has full OpenAI GPT integration for real RAG (Retrieval-Augmented Generation) capabilities!

---

## ✅ What's Been Implemented

### 1. LLM Service Module (`llm-service.js`)
- ✅ OpenAI API integration
- ✅ Configuration management with localStorage
- ✅ Chat completion with context
- ✅ Streaming response support (available)
- ✅ Embedding generation
- ✅ Error handling & fallbacks
- ✅ Usage statistics & cost tracking
- ✅ Connection testing

### 2. Settings UI
- ✅ API key input (secure password field)
- ✅ Model selection dropdown
- ✅ Max tokens configuration
- ✅ Test connection button
- ✅ Real-time usage statistics
- ✅ Cost tracking display

### 3. RAG Chat Integration
- ✅ Automatic LLM detection
- ✅ NCERT context retrieval
- ✅ Smart fallback system
- ✅ Source attribution
- ✅ Performance metrics
- ✅ Error handling

---

## 🚀 How to Use

### Step 1: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Copy your API key (starts with `sk-`)

**Pricing:** GPT-4 Turbo costs approximately:
- Input: $10 per 1M tokens
- Output: $30 per 1M tokens
- For research: ~$10-50/month

### Step 2: Configure the Platform

1. **Open the Platform**
   - Navigate to http://localhost:8080
   - Or refresh if already open

2. **Go to Settings**
   - Click on **Settings** in the sidebar
   - Scroll to **"LLM API Configuration"** section

3. **Enter Your API Key**
   - Paste your OpenAI API key in the field
   - Select your preferred model:
     - **GPT-4 Turbo** (Recommended) - Best quality
     - **GPT-4** - High quality
     - **GPT-3.5 Turbo** - Faster, cheaper
   - Set max tokens (default: 1000)

4. **Test Connection**
   - Click **"Test Connection"** button
   - Wait for confirmation
   - You should see: ✅ Connected!

### Step 3: Start Using RAG Chat

1. **Navigate to RAG Chat**
   - Click **"RAG Chat"** in the sidebar

2. **Ask Questions**
   - Type your question in the chat input
   - The system will:
     - Search NCERT data for relevant context
     - Send context + question to OpenAI
     - Generate intelligent response
     - Cite NCERT sources

3. **Filter Responses (Optional)**
   - Select specific **Subject** (Math, Physics, etc.)
   - Select specific **Grade** (9-12)
   - Choose **Source** (NCERT chapters)

---

## 🎯 Features & Capabilities

### Intelligent RAG System

**What Happens When You Ask a Question:**

1. **Context Retrieval**
   - Platform searches NCERT curriculum
   - Finds top 3 most relevant chapters
   - Extracts relevant content

2. **LLM Generation**
   - Sends question + context to GPT-4
   - Uses educational system prompt
   - Generates accurate, age-appropriate response

3. **Source Attribution**
   - Lists NCERT chapters used
   - Shows relevance scores
   - Maintains transparency

### Smart Fallback System

The platform intelligently handles different scenarios:

| Scenario | Behavior |
|----------|----------|
| **LLM + NCERT Data** | ✅ Full RAG with GPT-4 + curriculum context |
| **LLM Only** | ⚠️ GPT-4 without specific NCERT context |
| **NCERT Only** | ⚠️ Template responses with curriculum data |
| **Neither** | ℹ️ Helpful setup instructions |

### Usage Statistics

Monitor your LLM usage in real-time:
- **Request Count** - Total API calls made
- **Total Tokens** - Tokens consumed
- **Estimated Cost** - Approximate spend
- **Response Time** - Average speed

---

## 🔧 Configuration Options

### Available Models

1. **gpt-4-turbo-preview** (Recommended)
   - Best quality for educational content
   - Fast response times
   - Cost: ~$20 per 1M tokens (average)

2. **gpt-4**
   - High quality
   - Slower but thorough
   - Cost: ~$30 per 1M tokens (input)

3. **gpt-3.5-turbo**
   - Fast and economical
   - Good for simple queries
   - Cost: ~$0.50 per 1M tokens

### Parameters

- **Temperature** (0.0-1.0)
  - 0.7 default - Balanced creativity
  - Lower = More focused
  - Higher = More creative

- **Max Tokens** (100-4000)
  - 1000 default - Medium responses
  - Lower = Shorter answers
  - Higher = Detailed explanations

---

## 📊 Research Benefits

### For PhD Research

**Quantitative Metrics:**
- Response time tracking
- Token usage analysis
- Cost per query calculation
- Accuracy measurements

**Qualitative Analysis:**
- Real LLM responses vs templates
- Context effectiveness evaluation
- Source attribution quality
- Educational appropriateness

**Experimental Capabilities:**
- A/B testing different models
- Parameter optimization
- Context window experiments
- Prompt engineering studies

---

## 🐛 Troubleshooting

### Common Issues

**1. "LLM service not configured"**
- Solution: Add your OpenAI API key in Settings
- Test the connection

**2. "Invalid API key format"**
- Solution: Ensure key starts with `sk-`
- Copy directly from OpenAI platform
- No extra spaces

**3. "API connection failed"**
- Solutions:
  - Check internet connection
  - Verify API key is active
  - Check OpenAI account has credits
  - Try refreshing the page

**4. "Rate limit exceeded"**
- Solution: Wait a few seconds
- OpenAI has rate limits per minute
- Upgrade plan if needed

**5. Slow responses**
- Normal: GPT-4 takes 2-5 seconds
- Check: Internet speed
- Try: GPT-3.5 Turbo for faster responses

---

## 💡 Best Practices

### For Research Use

1. **Start with Small Tests**
   - Test with 5-10 queries first
   - Monitor token usage
   - Check response quality

2. **Use Filters Effectively**
   - Specify subject/grade for better context
   - Reduces token usage
   - Improves relevance

3. **Monitor Costs**
   - Check stats regularly
   - Set personal budget limits
   - Use GPT-3.5 for testing

4. **Document Everything**
   - Export chat history
   - Save usage statistics
   - Record experiment parameters

### Security

- ✅ API keys stored locally only
- ✅ Never committed to code
- ✅ Masked in UI after entry
- ✅ Can be cleared anytime

---

## 🔬 Next Steps for Research

### Phase 1 Complete ✅
- [x] LLM integration
- [x] RAG chat functionality
- [x] Settings UI
- [x] Usage tracking

### Phase 2 - Next (Recommended)
- [ ] Vector embeddings (OpenAI)
- [ ] ChromaDB integration
- [ ] Advanced semantic search
- [ ] Experiment tracking

### Phase 3 - Future
- [ ] Streaming responses UI
- [ ] Multi-turn conversations
- [ ] Advanced analytics
- [ ] A/B testing framework

---

## 📖 Example Usage

### Simple Question
```
User: "What is Pythagoras theorem?"

System:
1. Searches NCERT Math curriculum
2. Finds relevant chapters (Grade 10, Triangles)
3. Sends to GPT-4 with context
4. Returns: Clear explanation + NCERT source
```

### Complex Question
```
User: "Explain the relationship between kinetic and potential energy in a pendulum"

System:
1. Searches Physics curriculum
2. Finds chapters on Work & Energy
3. Contextualizes with NCERT content
4. GPT-4 generates comprehensive explanation
5. Cites specific chapters and concepts
```

### Filtered Question
```
Filters: Subject=Chemistry, Grade=12

User: "Explain Le Chatelier's principle"

System:
1. Limits search to Chemistry Grade 12
2. Higher relevance results
3. Age-appropriate explanation
4. Specific chapter citations
```

---

## 📞 Support

### Issues or Questions?

1. **Check Console**
   - Press F12 in browser
   - Look for errors in Console tab
   - Share error messages

2. **Verify Configuration**
   - Settings → LLM Configuration
   - Test connection
   - Check stats display

3. **Review Logs**
   - Console shows detailed logs
   - Look for 🤖, ✅, ❌ emojis
   - Debug information available

---

## 🎓 Ready for Research!

Your platform now has:
- ✅ Real OpenAI GPT-4 integration
- ✅ Full RAG capabilities
- ✅ NCERT curriculum context
- ✅ Usage tracking & analytics
- ✅ Research-grade implementation

**Next:** Configure your API key and start experimenting!

---

**Last Updated:** January 2025
**Version:** 1.0
**Status:** Production Ready
