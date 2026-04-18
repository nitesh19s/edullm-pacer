# Phase 2: Fine-tuning Plan - NCERT Educational Model

**Status:** Planning Complete - Ready to Execute
**Target Model:** llama3.2:3b (currently installed)
**Goal:** Create specialized educational AI for Indian curriculum (NCERT)
**Cost:** $0 (using free Google Colab GPU)

---

## 🎯 Objectives

1. **Collect 1000+ NCERT Q&A pairs** from Classes 6-12
2. **Fine-tune llama3.2** on educational content
3. **Deploy locally via Ollama** with zero API costs
4. **Achieve 85%+ accuracy** on NCERT questions
5. **Support Hindi + English** (multilingual)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Phase 2 Architecture                      │
└─────────────────────────────────────────────────────────────┘

1. Data Collection
   ├── Manual: NCERT textbook Q&A extraction
   ├── Automated: PDF parsing + OCR
   └── Format: Alpaca (instruction, input, output)

2. Data Preparation
   ├── Validation & cleaning
   ├── Format conversion to JSON
   ├── Train/test split (80/20)
   └── Quality checks

3. Fine-tuning (Google Colab)
   ├── Tool: Unsloth (2x faster, 70% less memory)
   ├── Base model: meta-llama/Llama-3.2-3B-Instruct
   ├── Method: LoRA (Low-Rank Adaptation)
   ├── Hardware: Free T4 GPU (16GB VRAM)
   └── Duration: ~2-4 hours for 1000 samples

4. Evaluation
   ├── Test on held-out NCERT questions
   ├── Compare with base model
   ├── Measure: accuracy, relevance, clarity
   └── Human review for quality

5. Deployment
   ├── Export: GGUF format (Q8_0 quantization)
   ├── Import: ollama create ncert-model -f Modelfile
   ├── Integration: Update platform to use ncert-model
   └── Testing: End-to-end RAG pipeline validation
```

---

## 📊 Data Collection Strategy

### Phase 2a: Manual Data Collection (Week 1-2)

**Target: 300 Q&A pairs (starter dataset)**

**Sources:**
- NCERT exemplar problems with solutions
- Board exam previous year papers
- NCERT exercise questions

**Format (Alpaca):**
```json
{
  "instruction": "Answer the following question based on NCERT Class 10 Science curriculum.",
  "input": "What is photosynthesis? Explain the process.",
  "output": "Photosynthesis is the process by which green plants convert light energy into chemical energy. The process occurs in chloroplasts and involves:\n\n1. Light Reaction: Light energy is absorbed by chlorophyll, producing ATP and NADPH.\n2. Dark Reaction (Calvin Cycle): CO₂ is fixed using ATP and NADPH to produce glucose.\n\nOverall equation: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂",
  "metadata": {
    "subject": "Science",
    "grade": 10,
    "chapter": "Life Processes",
    "topic": "Nutrition in Plants",
    "language": "English",
    "difficulty": "medium"
  }
}
```

**Subjects Priority:**
1. Science (Physics, Chemistry, Biology) - 40%
2. Mathematics - 30%
3. Social Science - 20%
4. Languages (Hindi, English) - 10%

**Grade Distribution:**
- Classes 6-8: 20%
- Classes 9-10: 40%
- Classes 11-12: 40%

### Phase 2b: Automated Data Collection (Week 3-4)

**Target: 700+ additional Q&A pairs**

**Methods:**
1. **PDF Parsing:** Extract from NCERT PDFs
2. **OCR:** For image-based content
3. **Web Scraping:** From official NCERT website
4. **Augmentation:** Paraphrase existing questions

**Tools:**
- PyPDF2 / pdfplumber for PDF parsing
- Tesseract OCR for images
- BeautifulSoup for web scraping

---

## 🔧 Technical Implementation

### Step 1: Data Collection Tool

**Create data collection interface:**

```python
# ncert-data-collector.py
class NCERTDataCollector:
    def __init__(self):
        self.data = []
        self.schema = {
            "instruction": str,
            "input": str,
            "output": str,
            "metadata": dict
        }

    def add_entry(self, instruction, input_text, output_text, metadata):
        """Add a Q&A pair with validation"""
        pass

    def validate_entry(self, entry):
        """Validate format and quality"""
        pass

    def export_alpaca(self, filename):
        """Export to Alpaca JSON format"""
        pass

    def import_from_csv(self, csv_file):
        """Import from CSV (manual entry)"""
        pass
```

**Web Interface:**
- Simple HTML form for manual data entry
- Fields: Subject, Grade, Chapter, Question, Answer
- Validation and preview before saving
- Export to JSON

### Step 2: Fine-tuning Setup (Google Colab)

**Notebook structure:**

```python
# 1. Install Unsloth
!pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"

# 2. Load model
from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/Llama-3.2-3B-Instruct",
    max_seq_length = 2048,
    dtype = None,
    load_in_4bit = True,
)

# 3. Add LoRA adapters
model = FastLanguageModel.get_peft_model(
    model,
    r = 16,  # LoRA rank
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj"],
    lora_alpha = 16,
    lora_dropout = 0,
    bias = "none",
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
)

# 4. Load dataset
from datasets import load_dataset

dataset = load_dataset("json", data_files="ncert_qa_dataset.json")

# 5. Format data
alpaca_prompt = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
{}

### Input:
{}

### Response:
{}"""

def formatting_prompts_func(examples):
    instructions = examples["instruction"]
    inputs = examples["input"]
    outputs = examples["output"]
    texts = []
    for instruction, input, output in zip(instructions, inputs, outputs):
        text = alpaca_prompt.format(instruction, input, output)
        texts.append(text)
    return {"text": texts}

dataset = dataset.map(formatting_prompts_func, batched=True)

# 6. Training configuration
from trl import SFTTrainer
from transformers import TrainingArguments

trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = 2048,
    args = TrainingArguments(
        per_device_train_batch_size = 2,
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        max_steps = 60,  # Adjust based on dataset size
        learning_rate = 2e-4,
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs",
    ),
)

# 7. Train
trainer.train()

# 8. Save LoRA adapter
model.save_pretrained("ncert_model_lora")
tokenizer.save_pretrained("ncert_model_lora")

# 9. Export to GGUF
model.save_pretrained_gguf("ncert_model", tokenizer, quantization_method="q8_0")

# 10. Export to Ollama
model.save_pretrained_gguf(
    "ncert_model",
    tokenizer,
    quantization_method = "q8_0",
    export_to_ollama = True,
)
```

### Step 3: Deployment to Ollama

**After training in Colab:**

```bash
# Download the GGUF file from Colab
# Upload to your local machine

# Create Modelfile
cat > Modelfile <<EOF
FROM ./ncert-model-q8_0.gguf
TEMPLATE """{{ if .System }}<|start_header_id|>system<|end_header_id|>

{{ .System }}<|eot_id|>{{ end }}{{ if .Prompt }}<|start_header_id|>user<|end_header_id|>

{{ .Prompt }}<|eot_id|>{{ end }}<|start_header_id|>assistant<|end_header_id|>

{{ .Response }}<|eot_id|>"""
PARAMETER stop "<|start_header_id|>"
PARAMETER stop "<|end_header_id|>"
PARAMETER stop "<|eot_id|>"
SYSTEM You are a helpful AI assistant specializing in Indian education (NCERT curriculum). Provide clear, accurate, and curriculum-aligned answers to student questions.
EOF

# Create model in Ollama
ollama create ncert-edu:latest -f Modelfile

# Test
ollama run ncert-edu:latest "What is photosynthesis?"
```

### Step 4: Integration with Platform

**Update local-ollama-service.js:**

```javascript
// Add NCERT model as default for educational queries
this.config = {
    embeddingModel: 'nomic-embed-text',
    generationModel: 'ncert-edu:latest',  // Changed from llama3.2
    temperature: 0.7,
    maxTokens: 512
};
```

**Add model selector in Settings UI:**

```html
<select id="ollamaEducationModel">
    <option value="llama3.2:latest">General (llama3.2)</option>
    <option value="ncert-edu:latest" selected>NCERT Specialized</option>
    <option value="llama3:latest">Advanced (llama3)</option>
</select>
```

---

## 📈 Evaluation Metrics

### 1. Quantitative Metrics

- **Accuracy:** % of correct answers on test set
- **BLEU Score:** Similarity to reference answers
- **F1 Score:** Precision and recall for key concepts
- **Response Time:** Inference speed (tokens/sec)

### 2. Qualitative Metrics

- **Curriculum Alignment:** Does it follow NCERT guidelines?
- **Clarity:** Is the explanation clear for students?
- **Completeness:** Does it cover all required points?
- **Language Quality:** Grammar, terminology correctness

### 3. Comparison Baseline

| Metric | Base llama3.2 | Fine-tuned NCERT | Target |
|--------|---------------|------------------|--------|
| NCERT Q&A Accuracy | ~60% | TBD | 85%+ |
| Response Time | 70 tokens/s | TBD | 50+ tokens/s |
| Curriculum Alignment | Low | TBD | High |
| Student Clarity | Medium | TBD | High |

---

## 🗓️ Timeline & Milestones

### Week 1-2: Data Collection (Manual)
- [ ] Set up data collection tool
- [ ] Create data entry web interface
- [ ] Collect 300 Q&A pairs manually
- [ ] Validate and clean dataset
- **Milestone:** 300 quality Q&A pairs ready

### Week 3-4: Automated Data Collection
- [ ] Build PDF parser for NCERT textbooks
- [ ] Implement OCR for diagrams/images
- [ ] Add 700+ Q&A pairs
- [ ] Final dataset validation
- **Milestone:** 1000+ Q&A pairs dataset complete

### Week 5: Fine-tuning
- [ ] Prepare Google Colab notebook
- [ ] Upload dataset to Colab
- [ ] Run fine-tuning (2-4 hours)
- [ ] Export to GGUF format
- **Milestone:** Fine-tuned model ready

### Week 6: Testing & Deployment
- [ ] Import to Ollama
- [ ] Run evaluation tests
- [ ] Compare with base model
- [ ] Deploy to production
- **Milestone:** NCERT model live in platform

### Week 7-8: Iteration & Improvement
- [ ] Collect user feedback
- [ ] Identify weak areas
- [ ] Add more training data
- [ ] Re-train and update
- **Milestone:** Model accuracy >85%

---

## 💰 Cost Analysis

**Total Cost: $0**

| Component | Cost |
|-----------|------|
| Google Colab (T4 GPU) | Free tier |
| Ollama (local inference) | Free |
| Storage (models + data) | ~5GB disk space |
| Development time | 40-60 hours |
| **Total** | **$0.00** |

**Comparison with API approach:**
- OpenAI fine-tuning: $8-20 per 1M tokens
- Inference costs: $0.50-2.00 per 1K queries
- **Estimated annual savings: $1000-5000**

---

## 🚀 Quick Start Commands

**1. Set up data collection:**
```bash
cd /Users/nitesh/edullm-platform
python3 ncert-data-collector.py --setup
python3 -m http.server 8001  # Data entry interface at http://localhost:8001/data-entry.html
```

**2. Start collecting data:**
- Open http://localhost:8001/data-entry.html
- Fill in Q&A pairs from NCERT textbooks
- Export to ncert_qa_dataset.json

**3. Prepare for training:**
```bash
python3 prepare-training-data.py --input ncert_qa_dataset.json --output ncert_train.json --validate
```

**4. Upload to Google Colab:**
- Open Unsloth Colab notebook
- Upload ncert_train.json
- Run all cells

**5. Deploy trained model:**
```bash
# After downloading GGUF from Colab
ollama create ncert-edu:latest -f Modelfile
ollama run ncert-edu:latest "Test question"
```

---

## 📚 Data Entry Guidelines

### Question Quality Checklist

- [ ] Clearly worded, no ambiguity
- [ ] Appropriate for grade level
- [ ] Aligned with NCERT curriculum
- [ ] Has definitive correct answer
- [ ] Includes context if needed

### Answer Quality Checklist

- [ ] Accurate and complete
- [ ] Uses curriculum terminology
- [ ] Step-by-step for problem-solving
- [ ] Cites formulas/definitions when relevant
- [ ] Student-friendly language
- [ ] 50-300 words (concise but thorough)

### Subject-Specific Guidelines

**Science:**
- Include definitions, processes, diagrams
- Explain cause-effect relationships
- Use scientific terminology correctly

**Mathematics:**
- Show step-by-step solutions
- Include formulas used
- Explain reasoning

**Social Science:**
- Provide historical context
- Include dates, names, events
- Explain significance

---

## 🔍 Next Steps

**Immediate Actions:**
1. ✅ Read and approve this plan
2. 🔄 Create data collection tools
3. 🔄 Start manual data entry
4. 🔄 Set up Google Colab account

**Questions to Address:**
- Which subjects to prioritize first?
- Do you have NCERT PDFs ready?
- Should we include diagrams/images in training?
- Target dataset size (1000 or 2000 samples)?

---

**Ready to proceed?** Let's start with creating the data collection tool and web interface!
