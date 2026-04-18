# Phase 2: Fine-tuning - Quick Start Guide ✅

**Status:** ✅ Setup Complete - Ready to Collect Data
**Date:** February 6, 2026

---

## 🎉 What's Been Built

### 1. ✅ Complete Implementation Plan
- **File:** `PHASE2_FINETUNING_PLAN.md`
- Comprehensive 8-week roadmap
- Technical specifications
- Cost analysis ($0 total)
- Evaluation metrics

### 2. ✅ Data Collection Tools
- **Python Script:** `ncert-data-collector.py`
- **Web Interface:** `data-entry.html`
- **CSV Template:** `ncert_qa_template.csv`
- **Examples:** `ncert_qa_examples.json` (5 sample entries)

### 3. ✅ Infrastructure Ready
- Ollama running with CORS enabled
- Web server on port 8000
- Local RAG pipeline verified (Phase 1 complete)

---

## 🚀 Start Collecting Data NOW

### Method 1: Web Interface (Easiest)

**1. Open the data entry page:**
```bash
# Open in browser:
http://localhost:8000/data-entry.html
```

**2. Fill in the form:**
- Select subject, grade, chapter
- Enter question and answer
- Click "Save Entry"
- Repeat!

**3. Download dataset when done:**
- Click "Download Dataset" button
- Saves as `ncert_qa_dataset.json`

**Features:**
- ✅ Real-time character count
- ✅ Live preview before saving
- ✅ Progress tracking (target: 300 entries)
- ✅ Form validation
- ✅ Auto-saves to browser localStorage

---

### Method 2: CSV Bulk Entry

**1. Open the template:**
```bash
open ncert_qa_template.csv
```

**2. Add rows in Excel/Google Sheets:**
```csv
subject,grade,chapter,topic,difficulty,language,question,answer,instruction
Science,10,Life Processes,...
Mathematics,9,Polynomials,...
```

**3. Import to JSON:**
```bash
python3 ncert-data-collector.py import ncert_qa_template.csv
```

---

### Method 3: Command Line (Manual)

**Add entries via terminal:**
```bash
python3 ncert-data-collector.py add
# Follow the interactive prompts
```

---

## 📊 Check Progress

**View statistics:**
```bash
python3 ncert-data-collector.py stats
```

**Output:**
```
📊 Dataset Statistics
==================================================
Total entries: 5

By Subject:
  Science               :   3 ( 60.0%)
  Mathematics           :   1 ( 20.0%)
  Social Science        :   1 ( 20.0%)

By Grade:
  Class  8              :   1 ( 20.0%)
  Class  9              :   1 ( 20.0%)
  Class 10              :   2 ( 40.0%)
  Class 11              :   1 ( 20.0%)
==================================================
```

---

## ✅ Validate Dataset

**Before training, validate quality:**
```bash
python3 ncert-data-collector.py validate
```

**Creates train/test split:**
```bash
python3 ncert-data-collector.py split
# Output: ncert_qa_dataset_train.json (80%)
#         ncert_qa_dataset_test.json (20%)
```

---

## 🎯 Data Collection Guidelines

### Quality Checklist

**Questions:**
- [ ] Clear and unambiguous
- [ ] Appropriate for grade level
- [ ] From NCERT curriculum
- [ ] Has definitive answer
- [ ] 10+ characters

**Answers:**
- [ ] Accurate and complete
- [ ] Uses curriculum terminology
- [ ] Step-by-step for math/science
- [ ] Student-friendly language
- [ ] 20-300 words
- [ ] Includes formulas/definitions when relevant

### Subject Distribution (Target: 300 entries)

- **Science** (Physics/Chemistry/Biology): 120 entries (40%)
- **Mathematics**: 90 entries (30%)
- **Social Science**: 60 entries (20%)
- **Languages**: 30 entries (10%)

### Grade Distribution

- **Classes 6-8**: 60 entries (20%)
- **Classes 9-10**: 120 entries (40%)
- **Classes 11-12**: 120 entries (40%)

---

## 📚 Example Entries Provided

5 high-quality examples in `ncert_qa_examples.json`:

1. **Class 10 Science** - Photosynthesis (medium)
2. **Class 9 Math** - Quadratic equations (easy)
3. **Class 8 Social Science** - 1857 Revolt (hard)
4. **Class 11 Physics** - Newton's Second Law (medium)
5. **Class 12 Chemistry** - SN1/SN2 mechanisms (hard)

**View examples:**
```bash
cat ncert_qa_examples.json | python3 -m json.tool
```

---

## 🎓 Tips for Efficient Data Collection

### Week 1-2: Manual Entry (300 entries)

**Day 1-2: Science (40 entries)**
- Focus on one chapter (e.g., "Life Processes")
- Extract all exercise questions
- Add exemplar problems
- Include diagram-based questions

**Day 3-4: Mathematics (30 entries)**
- Focus on one topic (e.g., "Polynomials")
- Include solved examples
- Add exercise problems
- Cover different difficulty levels

**Day 5-6: Social Science (20 entries)**
- Focus on one chapter
- Include dates, events, causes
- Add map-based questions
- Include "Why" and "How" questions

**Day 7: Review & Quality Check**
- Validate all entries
- Fix formatting issues
- Balance subject distribution
- Aim for 100+ entries this week

### Week 2: Continue to 300 entries

**Strategies:**
1. **Team approach:** Multiple people entering data
2. **Focus sessions:** 2-3 hours daily = 20-30 entries
3. **Use exemplar books:** Ready-made Q&A pairs
4. **Previous year papers:** Board exam questions

---

## 🔄 After Reaching 300 Entries

### 1. Validate Dataset
```bash
python3 ncert-data-collector.py validate
python3 ncert-data-collector.py split
```

### 2. Upload to Google Colab
- Create Google Colab account (free)
- Open Unsloth notebook template
- Upload `ncert_qa_dataset_train.json`

### 3. Start Fine-tuning
- Run Colab notebook cells
- Training time: ~2-4 hours on free T4 GPU
- Cost: $0

### 4. Export Model
- Download GGUF file from Colab
- Import to Ollama:
```bash
ollama create ncert-edu:latest -f Modelfile
```

### 5. Test in Platform
- Update Settings → Local AI Models
- Select "ncert-edu:latest"
- Test with NCERT questions
- Compare with base model

---

## 💰 Cost Breakdown

| Component | Cost |
|-----------|------|
| Data collection tools | $0 (built) |
| Web server | $0 (local) |
| Google Colab GPU | $0 (free tier) |
| Ollama inference | $0 (local) |
| Storage (~5GB) | $0 |
| **Total** | **$0.00** |

**Time Investment:**
- Data collection: 20-30 hours (300 entries)
- Fine-tuning: 2-4 hours (automated)
- Testing: 2-3 hours
- **Total: ~25-35 hours**

---

## 📞 Support & Resources

**Documentation:**
- Main plan: `PHASE2_FINETUNING_PLAN.md`
- Examples: `ncert_qa_examples.json`
- Template: `ncert_qa_template.csv`

**Tools:**
- Data collector: `ncert-data-collector.py`
- Web interface: http://localhost:8000/data-entry.html

**Commands Reference:**
```bash
# Statistics
python3 ncert-data-collector.py stats

# Validate
python3 ncert-data-collector.py validate

# Split dataset
python3 ncert-data-collector.py split

# Import CSV
python3 ncert-data-collector.py import file.csv

# Export CSV
python3 ncert-data-collector.py export_csv

# Interactive add
python3 ncert-data-collector.py add
```

---

## 🎯 Milestones

- [x] ✅ Phase 1: Local RAG system operational
- [x] ✅ Phase 2 Setup: Tools and infrastructure ready
- [ ] 🔄 Week 1-2: Collect 300 Q&A pairs (IN PROGRESS)
- [ ] ⏳ Week 3-4: Automated data collection (700+ entries)
- [ ] ⏳ Week 5: Fine-tune model on Google Colab
- [ ] ⏳ Week 6: Test and deploy to production
- [ ] ⏳ Week 7-8: Iterate and improve (target 85% accuracy)

---

## 🚀 Ready to Start!

**Next Action:** Open the data entry page and add your first Q&A!

```bash
# Open in browser:
open http://localhost:8000/data-entry.html
```

**Target for today:** 10-20 entries
**Target for this week:** 100+ entries
**Final target:** 300 entries (Phase 2a)

Let's build an AI that understands NCERT curriculum! 🎓
