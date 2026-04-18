# Next Steps: Fine-tune Your NCERT Model

## Current Status ✅

**Phase 1: Local RAG System** - COMPLETE
- ✅ Ollama running locally (llama3.2:latest)
- ✅ 768-dimensional embeddings (nomic-embed-text)
- ✅ Browser interface working
- ✅ Zero API costs

**Phase 2: Fine-tuning** - READY TO START
- ✅ Dataset prepared: 70 Q&A pairs
- ✅ Train/test split: 56 training + 14 test
- ✅ Alpaca format validated
- ✅ Google Colab guide created

---

## Your Files Ready for Training

1. **ncert_qa_train.json** (132.7 KB)
   - 56 Q&A pairs for training
   - Social Science Grade 9 content
   - AI-generated answers (needs review recommended but optional)

2. **ncert_qa_test.json** (29.4 KB)
   - 14 Q&A pairs for evaluation
   - Will measure model improvement

3. **GOOGLE_COLAB_TRAINING.md**
   - Complete step-by-step guide
   - Copy-paste code cells
   - Estimated time: 30-45 minutes training

---

## Quick Start (3 Actions)

### Action 1: Open Google Colab
1. Go to https://colab.research.google.com/
2. Sign in with Google account
3. File → New Notebook
4. Runtime → Change runtime type → **T4 GPU** → Save

### Action 2: Follow the Guide
Open `GOOGLE_COLAB_TRAINING.md` and execute cells in order:

**Step 2 - Install libraries:**
```python
!pip install -q transformers datasets accelerate peft bitsandbytes trl torch
```

**Step 3 - Upload files:**
- Upload `ncert_qa_train.json` and `ncert_qa_test.json`

**Step 4 - Load model (Option A):**
- Uses **Mistral 7B** (no authentication required)
- Alternative: TinyLlama for faster training

**Steps 5-7 - Train:**
- ~60 minutes for Mistral 7B
- ~35 minutes for TinyLlama

**Step 9 - Export:**
- Downloads as zip file with HuggingFace format

### Action 3: Import to Ollama
After downloading the model zip:
```bash
cd /Users/nitesh/edullm-platform
mkdir -p fine-tuned-models
cd fine-tuned-models
unzip ~/Downloads/ncert_edu_model.zip

# Optional: Convert to GGUF (if you have llama.cpp)
# Or use directly with Ollama's HuggingFace support

# For now, we'll use the model directly:
mv ~/Downloads/Modelfile .
ollama create ncert-edu -f Modelfile
```

Test it:
```bash
ollama run ncert-edu "What is democracy?"
```

---

## What You'll Get

**Before (base llama3.2):**
Generic answers, not curriculum-aligned

**After (fine-tuned ncert-edu):**
- ✅ NCERT curriculum-specific answers
- ✅ Class 9-10 appropriate explanations
- ✅ Indian education context
- ✅ Subject-specific terminology (Science, Math, Social Science)

---

## Timeline

- **Google Colab setup:** 5 minutes
- **Training:** 30-45 minutes
- **Download & import:** 10 minutes
- **Testing:** 5 minutes

**Total:** ~1 hour from start to finish

---

## Optional: Improve Dataset Quality

Before training, you can optionally review the AI-generated answers:

```bash
cd /Users/nitesh/edullm-platform
python3 ncert-data-collector.py review
```

Or open `extracted-qa/review_questions.html` in browser.

**Time:** 2-3 hours for 70 answers
**Impact:** Better fine-tuning results

**Recommendation:** Fine-tune first with current data, evaluate results, then decide if manual review is needed for second iteration.

---

## After Fine-tuning

### 1. Test Model Quality
Compare base vs fine-tuned on same questions:

```bash
# Base model
ollama run llama3.2 "What is photosynthesis according to NCERT?"

# Fine-tuned model
ollama run ncert-edu "What is photosynthesis according to NCERT?"
```

### 2. Integrate with RAG System
Update `rag-chat-manager.js`:

```javascript
// Line ~50 in initializeOllama method
this.ollamaGenerationModel = 'ncert-edu';  // Changed from llama3.2
```

Restart your application and test!

### 3. Evaluate Results
Run test set evaluation:
- Load 14 test questions
- Generate answers with ncert-edu
- Compare with expected answers
- Measure accuracy/quality

### 4. Iterate (Optional)
Based on results:
- Generate more Q&A pairs (aim for 200-300)
- Review and improve answer quality
- Add more subjects (currently only Social Science has answers)
- Re-train with larger dataset

---

## Troubleshooting

**Q: Colab says "Out of Memory"**
A: Reduce batch size in TrainingArguments (see guide Step 6)

**Q: Training loss not decreasing**
A: Increase max_steps to 240, or improve dataset quality

**Q: Model download fails from Colab**
A: Mount Google Drive first (see Troubleshooting in guide)

**Q: Ollama can't find the model**
A: Check file path in Modelfile matches actual .gguf location

---

## Resources Created

All guides in `/Users/nitesh/edullm-platform/`:

1. **GOOGLE_COLAB_TRAINING.md** - Main training guide (START HERE)
2. **PHASE2_FINETUNING_PLAN.md** - Complete technical plan
3. **PHASE2_QUICKSTART.md** - Dataset collection guide
4. **ADD_ANSWERS_GUIDE.md** - Answer generation methods
5. **NCERT_PDF_GUIDE.md** - PDF parsing documentation
6. **NEXT_STEPS.md** - This file

---

## Questions?

- Check the Troubleshooting section in GOOGLE_COLAB_TRAINING.md
- Review Unsloth docs: https://github.com/unslothai/unsloth
- Test locally first: `ollama run llama3.2` to ensure Ollama works

---

Ready to create your first fine-tuned NCERT model? 🚀

**Start here:** Open GOOGLE_COLAB_TRAINING.md and begin with Step 1!
