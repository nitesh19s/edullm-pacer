# Visual Testing Guide - Step by Step

## 📺 Opening the Browser Console

### Google Chrome:

1. **Open the app:** http://localhost:8080
2. **Press:** `Cmd + Option + J` (Mac) or `Ctrl + Shift + J` (Windows)
3. **You'll see:** A panel open at the bottom or right side
4. **Look for:** A tab labeled "Console"
5. **You'll see:** A cursor blinking after `>` symbol

### Firefox:

1. **Open the app:** http://localhost:8080
2. **Press:** `Cmd + Option + K` (Mac) or `Ctrl + Shift + K` (Windows)
3. **Look for:** Console tab
4. **You'll see:** A cursor blinking

### Safari:

1. **First enable:** Safari → Preferences → Advanced → Show Develop menu
2. **Then press:** `Cmd + Option + C`
3. **Look for:** Console tab

---

## 🧪 Running Tests - Copy & Paste Method

### Test 1: Verify API Connection

**Step 1:** Click in the console where you see `>`

**Step 2:** Copy this ENTIRE line:
```javascript
await enhancedLLMService.generateResponse("What is 2+2?")
```

**Step 3:** Right-click in console → Paste (or Cmd+V / Ctrl+V)

**Step 4:** Press Enter

**Step 5:** Wait 2-3 seconds

**Step 6:** Look for the result

---

## ✅ What Success Looks Like

### If you see this:
```
{
  content: "2 + 2 equals 4.",
  model: "gpt-3.5-turbo",
  provider: "openai"
}
```

**This means:**
✅ OpenAI API is connected
✅ LLM service is working
✅ You can generate responses
✅ Ready to proceed!

---

### If you see this:
```
{
  embedding: Array(1536),
  dimensions: 1536,
  model: "text-embedding-3-small"
}
```

**This means:**
✅ Embeddings are working
✅ Can generate vectors
✅ Semantic search will work
✅ Ready for RAG!

---

## ❌ What Errors Look Like

### Error 1: Red text saying "API key not configured"
```
❌ Error: OpenAI is required. Please configure your API key.
```

**What to do:**
1. Click "Settings" (gear icon in sidebar)
2. Find "LLM Configuration"
3. Paste your OpenAI API key
4. Click "Save"
5. Try the test again

---

### Error 2: Red text saying "enhancedLLMService is not defined"
```
❌ ReferenceError: enhancedLLMService is not defined
```

**What to do:**
1. Refresh the page (Cmd+R or Ctrl+R)
2. Wait 5 seconds for everything to load
3. Try the test again

---

### Error 3: Red text saying "Incorrect API key"
```
❌ Error: Incorrect API key provided
```

**What to do:**
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy it (starts with sk-)
4. Paste in Settings → LLM Configuration
5. Try again

---

## 📝 Quick Test Checklist

Copy and run each test. Check the box when it works:

### Basic Tests:
- [ ] Test 1: `await enhancedLLMService.generateResponse("Test")`
- [ ] Test 2: `await enhancedLLMService.generateEmbedding("test")`
- [ ] Test 3: `enhancedVectorStore.getStatistics()`
- [ ] Test 4: `ragOrchestrator.getStatistics()`

### System Check:
- [ ] Test 5: Run the "Check All Systems" test

### If all 5 tests pass:
✅ You're ready to upload PDFs!
✅ Proceed to document upload

---

## 🎥 What Happens When You Run a Test

**Timeline:**

**Second 0:** You paste command and press Enter
```
> await enhancedLLMService.generateResponse("What is 2+2?")
```

**Second 1:** Console shows "Promise {<pending>}"
```
Promise {<pending>}
```

**Second 2-3:** API call happens (you might see network activity)

**Second 3-4:** Result appears!
```
{
  content: "2 + 2 equals 4.",
  model: "gpt-3.5-turbo",
  ...
}
```

**Total time:** 3-5 seconds

---

## 🎯 Next Steps After Tests Pass

Once all tests show ✅:

1. **Close console** (or keep it open to watch logs)
2. **Navigate to RAG Chat section** (in sidebar)
3. **Click "Upload Document"** button
4. **Select a PDF file**
5. **Watch it process in console**

---

## 💡 Pro Tips

**Tip 1: Keep Console Open**
- You can see what's happening behind the scenes
- Useful for debugging
- Watch API calls in real-time

**Tip 2: Use Up Arrow**
- Press ↑ in console to repeat last command
- Saves time when testing repeatedly

**Tip 3: Clear Console**
- Type `clear()` or `console.clear()`
- Or press Cmd+K (Mac) / Ctrl+L (Windows)

**Tip 4: Save Results**
- Right-click on result → Store as global variable
- Creates temp1, temp2, etc.
- Can inspect later

---

## 🆘 Still Stuck?

If tests don't work, share this info:

1. **Which test failed?** (1, 2, 3, 4, or 5)
2. **What error message?** (copy the red text)
3. **What browser?** (Chrome, Firefox, Safari)
4. **Screenshot?** (if possible)

Common issues:
- API key not added → Go to Settings
- Page not loaded → Refresh and wait 5 seconds
- Wrong URL → Make sure you're on localhost:8080
- Browser cache → Try Cmd+Shift+R (hard refresh)

---

## ✅ Success Criteria

**You're ready to proceed when:**
- ✅ Test 1 returns a text response
- ✅ Test 2 returns an array of 1536 numbers
- ✅ Test 3 shows statistics object
- ✅ Test 4 shows RAG statistics
- ✅ Test 5 shows all systems "Ready"

**Then you can:**
→ Upload your first PDF
→ Run your first RAG query
→ Create experiments
→ Start research!

---

**Total time:** 5-10 minutes for all tests
**Cost:** ~$0.001 for running all tests
**Next:** Upload PDF documents
