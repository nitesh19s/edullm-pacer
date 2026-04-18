# Google Colab Fine-tuning Guide

## Quick Start: Fine-tune NCERT Model in 3 Hours

Your dataset is ready! This guide will help you fine-tune a llama3.2 model on Google Colab's free T4 GPU using Unsloth (2x faster training).

**What you have:**
- ✅ 56 training Q&A pairs (ncert_qa_train.json)
- ✅ 14 test Q&A pairs (ncert_qa_test.json)
- ✅ Alpaca format (instruction/input/output)

**What you'll get:**
- 🎯 Fine-tuned "ncert-edu" model
- 📦 GGUF format for Ollama
- 🚀 Ready to deploy locally

---

## Step 1: Open Google Colab

1. Go to: https://colab.research.google.com/
2. Sign in with Google account
3. File → New Notebook
4. Runtime → Change runtime type → **T4 GPU** → Save

---

## Step 2: Install Required Libraries

Copy and run this in the first cell (RECOMMENDED - Most Reliable):

```python
%%capture
# Install core fine-tuning libraries (stable and tested for Colab)
!pip install -q transformers datasets accelerate peft bitsandbytes trl torch
```

**Expected time:** 2-3 minutes

**Alternative: With Unsloth for faster training (if above works, try this for 2x speed):**

```python
%%capture
# Install Unsloth with dependencies
!pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
```

**Note:** If you get dependency errors with Unsloth, use the first method (standard transformers). It's slightly slower but 100% reliable.

---

## Step 3: Upload Your Dataset

Click the folder icon 📁 on the left sidebar, then upload:
- `ncert_qa_train.json`
- `ncert_qa_test.json`

Or use this code to upload:

```python
from google.colab import files
print("Upload ncert_qa_train.json:")
uploaded_train = files.upload()
print("\nUpload ncert_qa_test.json:")
uploaded_test = files.upload()
```

---

## Step 4: Load Model and Dataset

**Option A: Using Standard Transformers (RECOMMENDED - 100% Reliable)**

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
import torch

# Model configuration - using Mistral 7B Instruct (no auth required)
# Alternative: "TinyLlama/TinyLlama-1.1B-Chat-v1.0" for faster training
model_name = "mistralai/Mistral-7B-Instruct-v0.2"

# 4-bit quantization for memory efficiency
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
)

print(f"Loading model: {model_name}")
print("⏳ This may take 2-3 minutes...")

# Load model and tokenizer
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)

tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"

# Prepare model for training
model = prepare_model_for_kbit_training(model)

# Add LoRA adapters
lora_config = LoraConfig(
    r=16,
    lora_alpha=16,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

print("✅ Model loaded with LoRA adapters!")
print(f"📊 Trainable parameters: {model.print_trainable_parameters()}")
```

**Why Mistral 7B?**
- ✅ No authentication required (public model)
- ✅ Better quality than Llama 3.2 1B
- ✅ Fits in free T4 GPU with 4-bit quantization
- ✅ Excellent for educational content

**Alternative for faster training (30 min vs 60 min):**
Change `model_name` to `"TinyLlama/TinyLlama-1.1B-Chat-v1.0"` - smaller but still good quality.

**Option B: Using Unsloth (FASTER - If installation succeeded)**

```python
from unsloth import FastLanguageModel
import torch

# Model configuration
max_seq_length = 2048
dtype = None
load_in_4bit = True

# Load base model (Llama 3.2 1B)
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/Llama-3.2-1B-Instruct",
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
)

# Add LoRA adapters
model = FastLanguageModel.get_peft_model(
    model,
    r = 16,
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj"],
    lora_alpha = 16,
    lora_dropout = 0,
    bias = "none",
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
)

print("✅ Model loaded with Unsloth!")
```

**Use Option A if you installed standard transformers in Step 2.**

---

## Step 5: Prepare and Tokenize Training Data

```python
from datasets import load_dataset

# Load your NCERT dataset
dataset = load_dataset("json", data_files={
    "train": "ncert_qa_train.json",
    "test": "ncert_qa_test.json"
})

print(f"Training examples: {len(dataset['train'])}")
print(f"Test examples: {len(dataset['test'])}")

# Format function for Alpaca-style prompts
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
        text = alpaca_prompt.format(instruction, input, output) + tokenizer.eos_token
        texts.append(text)
    return {"text": texts}

# Apply formatting
dataset = dataset.map(formatting_prompts_func, batched=True)

# Tokenize the dataset
def tokenize_function(examples):
    return tokenizer(examples["text"], truncation=True, max_length=2048)

tokenized_dataset = dataset.map(
    tokenize_function,
    batched=True,
    remove_columns=["instruction", "input", "output", "metadata", "text"]
)

print("✅ Dataset formatted and tokenized!")
print(f"Training examples: {len(tokenized_dataset['train'])}")
print(f"Test examples: {len(tokenized_dataset['test'])}")
```

---

## Step 6: Configure Training with Custom Data Collator

```python
from transformers import Trainer, TrainingArguments
from dataclasses import dataclass
from typing import Any, Dict, List
import torch

# Custom data collator that handles padding and creates labels
@dataclass
class DataCollatorForCompletionOnlyLM:
    tokenizer: Any

    def __call__(self, features: List[Dict[str, Any]]) -> Dict[str, Any]:
        # Pad sequences to the same length
        batch = self.tokenizer.pad(
            features,
            padding=True,
            max_length=2048,
            return_tensors="pt"
        )
        # Create labels (same as input_ids for causal LM)
        batch["labels"] = batch["input_ids"].clone()
        return batch

# Create training arguments
training_args = TrainingArguments(
    per_device_train_batch_size=2,
    gradient_accumulation_steps=4,
    warmup_steps=10,
    num_train_epochs=2,
    learning_rate=2e-4,
    fp16=not torch.cuda.is_bf16_supported(),
    bf16=torch.cuda.is_bf16_supported(),
    logging_steps=10,
    eval_strategy="steps",
    eval_steps=30,
    save_steps=30,
    save_strategy="steps",
    output_dir="outputs",
    optim="adamw_8bit",
    weight_decay=0.01,
    lr_scheduler_type="linear",
    seed=3407,
    report_to="none",
)

# Create custom data collator
data_collator = DataCollatorForCompletionOnlyLM(tokenizer=tokenizer)

# Create trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset["train"],
    eval_dataset=tokenized_dataset["test"],
    data_collator=data_collator,
)

print("✅ Trainer configured!")
print(f"📊 Training: {len(tokenized_dataset['train'])} examples, {len(tokenized_dataset['test'])} test examples")
print(f"📊 Will train for 2 epochs")
print(f"⏱️  Estimated time: 60-75 minutes on T4 GPU (Mistral 7B)")
```

---

## Step 7: Start Training

```python
# Show GPU memory before training
gpu_stats = torch.cuda.get_device_properties(0)
start_gpu_memory = round(torch.cuda.max_memory_reserved() / 1024 / 1024 / 1024, 3)
max_memory = round(gpu_stats.total_memory / 1024 / 1024 / 1024, 3)
print(f"💾 GPU memory: {start_gpu_memory} GB / {max_memory} GB")

# Start training
print("🚀 Starting training...")
print(f"📊 Training for 2 epochs on {len(tokenized_dataset['train'])} examples")
print(f"⏱️  Estimated time: 60-75 minutes\n")

trainer_stats = trainer.train()

# Show final stats
used_memory = round(torch.cuda.max_memory_reserved() / 1024 / 1024 / 1024, 3)
used_memory_for_training = round(used_memory - start_gpu_memory, 3)
used_percentage = round(used_memory / max_memory * 100, 3)

print(f"\n✅ Training complete!")
print(f"⏱️  Time: {trainer_stats.metrics['train_runtime']:.0f} seconds ({trainer_stats.metrics['train_runtime']/60:.1f} minutes)")
print(f"💾 GPU memory used: {used_memory_for_training} GB ({used_percentage}%)")
print(f"🎯 Final training loss: {trainer_stats.metrics['train_loss']:.4f}")
```

**What you should see:**
- Progress bars showing training steps
- Loss decreasing over time (start ~2.0, end ~0.5-1.0)
- GPU memory usage ~12-13 GB
- Training time: 60-75 minutes for Mistral 7B

---

## Step 8: Test the Model

```python
# Prepare model for inference
# For Unsloth: FastLanguageModel.for_inference(model)
# For standard transformers: model.eval() is already done by trainer

test_question = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
Answer based on NCERT Class 9 Social Science

### Input:
What is democracy? Why is democracy considered the best form of government?

### Response:
"""

model.eval()
inputs = tokenizer([test_question], return_tensors="pt").to("cuda")
with torch.no_grad():
    outputs = model.generate(**inputs, max_new_tokens=256, use_cache=True, temperature=0.7)

generated_text = tokenizer.batch_decode(outputs, skip_special_tokens=False)

print("🧪 Model output:")
print(generated_text[0])
```

---

## Step 9: Save and Export Model

**Option A: Export with Unsloth (If you used Unsloth)**

```python
# Save in GGUF format (Q8_0 quantization)
model.save_pretrained_gguf("ncert_edu_model", tokenizer, quantization_method="q8_0")
print("✅ Model saved as GGUF!")

from google.colab import files
files.download("ncert_edu_model-Q8_0.gguf")
```

**Option B: Save with Standard Transformers (If you used standard transformers)**

```python
# Merge LoRA weights with base model
from peft import PeftModel

# Save the fine-tuned model
model.save_pretrained("ncert_edu_finetuned")
tokenizer.save_pretrained("ncert_edu_finetuned")

# Zip the model for download
!zip -r ncert_edu_model.zip ncert_edu_finetuned/

from google.colab import files
files.download("ncert_edu_model.zip")

print("✅ Model saved! Download the zip file and extract it on your Mac.")
print("📝 You'll convert it to GGUF format locally using llama.cpp")
```

---

## Step 10: Create Modelfile for Ollama

```python
# Create Modelfile for Ollama
modelfile_content = """FROM ./ncert_edu_model-Q8_0.gguf

TEMPLATE \"\"\"{{- if .System }}
<|start_header_id|>system<|end_header_id|>
{{ .System }}<|eot_id|>
{{- end }}
<|start_header_id|>user<|end_header_id|>
{{ .Prompt }}<|eot_id|>
<|start_header_id|>assistant<|end_header_id|>
{{ .Response }}<|eot_id|>\"\"\"

PARAMETER stop "<|start_header_id|>"
PARAMETER stop "<|end_header_id|>"
PARAMETER stop "<|eot_id|>"

SYSTEM \"\"\"You are an expert NCERT teacher for Indian students. Provide clear, curriculum-aligned answers to questions from NCERT textbooks for Classes 9-10. Focus on Science, Mathematics, and Social Science subjects.\"\"\"
"""

with open("Modelfile", "w") as f:
    f.write(modelfile_content)

from google.colab import files
files.download("Modelfile")

print("✅ Modelfile created and downloaded!")
```

**Files to download:**
- **If using Unsloth:** `ncert_edu_model-Q8_0.gguf` (~1.3 GB) + `Modelfile`
- **If using standard transformers:** `ncert_edu_model.zip` (~2.5 GB) + `Modelfile`

---

## Step 11: Import to Local Ollama

**Method A: If you have GGUF file (from Unsloth)**

After downloading the files to your Mac:

```bash
# 1. Move files to a workspace folder
cd /Users/nitesh/edullm-platform
mkdir -p fine-tuned-models
mv ~/Downloads/ncert_edu_model-Q8_0.gguf fine-tuned-models/
mv ~/Downloads/Modelfile fine-tuned-models/

# 2. Create Ollama model
cd fine-tuned-models
ollama create ncert-edu -f Modelfile

# 3. Test the model
ollama run ncert-edu "What is photosynthesis?"
```

**Method B: If you have HuggingFace model (from standard transformers)**

```bash
# 1. Extract the downloaded model
cd /Users/nitesh/edullm-platform
mkdir -p fine-tuned-models
cd fine-tuned-models
unzip ~/Downloads/ncert_edu_model.zip

# 2. Install llama.cpp for conversion (if not already installed)
# Skip if you already have it
brew install llama.cpp

# 3. Convert HuggingFace model to GGUF
python3 -m llama_cpp.convert ncert_edu_finetuned/ --outfile ncert_edu_model-Q8_0.gguf --outtype q8_0

# 4. Create Ollama model
mv ~/Downloads/Modelfile .
ollama create ncert-edu -f Modelfile

# 5. Test the model
ollama run ncert-edu "What is photosynthesis?"
```

**Alternative if llama.cpp conversion fails:**
You can use Ollama directly with HuggingFace models (experimental):
```bash
ollama run hf.co/ncert_edu_finetuned
```

---

## Step 12: Integrate with RAG System

Update your `rag-chat-manager.js` to use the fine-tuned model:

```javascript
// In initializeOllama method
this.ollamaGenerationModel = 'ncert-edu';  // Changed from llama3.2

// Test it works
const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        model: 'ncert-edu',  // Your fine-tuned model
        prompt: 'What is democracy?',
        stream: false
    })
});
```

---

## Troubleshooting

### Unsloth Installation Error: "No matching distribution found for unsloth_zoo"
**Error message you might see:**
```
ERROR: Could not find a version that satisfies the requirement unsloth_zoo>=2026.2.1
```

**Solution 1 (Recommended):** Use stable release version:
```python
%%capture
!pip install unsloth
!pip install --no-deps xformers trl peft accelerate bitsandbytes
```

**Solution 2:** Use PyTorch-native fine-tuning (without Unsloth):
```python
%%capture
!pip install transformers datasets accelerate peft bitsandbytes trl
```
Then skip to Step 4 and use standard transformers training (slightly slower but stable).

### Out of Memory Error
**Solution:** Reduce batch size in TrainingArguments:
```python
per_device_train_batch_size = 1,  # Changed from 2
gradient_accumulation_steps = 8,  # Changed from 4
```

### Training too slow
**Current setup:** ~30-45 minutes for 56 examples
**If slower:** Check GPU is enabled (Runtime → Change runtime type)

### Model quality not good enough
**Try:**
1. Increase `max_steps` to 240 (4 epochs)
2. Generate more training data (aim for 200-300 examples)
3. Review and improve answer quality in dataset

### Download fails in Colab
**Alternative:** Mount Google Drive first:
```python
from google.colab import drive
drive.mount('/content/drive')

# Save model there
model.save_pretrained_gguf(
    "/content/drive/MyDrive/ncert_edu_model",
    tokenizer,
    quantization_method="q8_0"
)
```

---

## Next Steps After Fine-tuning

1. **Compare performance:** Test base llama3.2 vs ncert-edu on same questions
2. **Evaluate on test set:** Run all 14 test questions through both models
3. **Measure improvement:** Check answer quality, accuracy, curriculum alignment
4. **Iterate:** Based on results, adjust training or add more data

---

## Expected Results

**Training metrics you should see:**
- Initial loss: ~2.5-3.0
- Final loss: ~0.5-1.0 (good convergence)
- Training time: 30-45 minutes

**Model behavior changes:**
- ✅ More curriculum-aligned answers
- ✅ Better structured responses
- ✅ NCERT-specific terminology
- ✅ Class 9-10 appropriate explanations

**If loss doesn't decrease:**
- Check dataset quality (review some examples)
- Increase max_steps to 240
- Verify answers are high quality

---

## Cost Breakdown

- Google Colab T4 GPU: **$0** (free tier)
- Unsloth library: **$0** (open source)
- Training time: **30-45 minutes**
- Total cost: **$0** ✅

---

## Quick Reference Commands

```bash
# On your Mac - check Ollama models
ollama list

# Test fine-tuned model
ollama run ncert-edu "Explain photosynthesis"

# Compare with base model
ollama run llama3.2 "Explain photosynthesis"

# Remove old model if needed
ollama rm ncert-edu

# Recreate from updated GGUF
ollama create ncert-edu -f Modelfile
```

---

## Support Links

- Unsloth Documentation: https://github.com/unslothai/unsloth
- Ollama Model Import: https://github.com/ollama/ollama/blob/main/docs/import.md
- GGUF Format: https://github.com/ggerganov/llama.cpp

---

Ready to start? Open Google Colab and begin with Step 1! 🚀
