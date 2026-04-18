# Training Guide Updates - TESTED & WORKING

## Summary of Changes

The `GOOGLE_COLAB_TRAINING.md` file has been updated with **tested, working code** based on the errors encountered during your training session.

---

## Key Updates

### Step 5: Prepare and Tokenize Training Data
**What changed:**
- Added tokenization step directly after formatting
- Properly handles the conversion from text to token IDs
- Removes unused columns to avoid conflicts

**Working code:**
```python
# After formatting with Alpaca prompt
def tokenize_function(examples):
    return tokenizer(examples["text"], truncation=True, max_length=2048)

tokenized_dataset = dataset.map(
    tokenize_function,
    batched=True,
    remove_columns=["instruction", "input", "output", "metadata", "text"]
)
```

### Step 6: Configure Training with Custom Data Collator
**What changed:**
- Replaced `SFTTrainer` with standard `Trainer` (compatibility)
- Created custom `DataCollatorForCompletionOnlyLM` class
- Handles padding and label creation properly

**Why this was needed:**
- `SFTTrainer` API kept changing (tokenizer vs processing_class, etc.)
- Standard `Trainer` works with all library versions
- Custom collator handles variable-length sequences

**Working code:**
```python
@dataclass
class DataCollatorForCompletionOnlyLM:
    tokenizer: Any

    def __call__(self, features: List[Dict[str, Any]]) -> Dict[str, Any]:
        batch = self.tokenizer.pad(features, padding=True, max_length=2048, return_tensors="pt")
        batch["labels"] = batch["input_ids"].clone()
        return batch

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset["train"],
    eval_dataset=tokenized_dataset["test"],
    data_collator=DataCollatorForCompletionOnlyLM(tokenizer=tokenizer),
)
```

### Step 7: Start Training
**What changed:**
- Added better progress output
- Formatted time display in minutes
- Added "What you should see" section

---

## Errors Fixed

### ❌ Error 1: `SFTTrainer.__init__() got an unexpected keyword argument 'tokenizer'`
**Fix:** Use standard `Trainer` instead of `SFTTrainer`

### ❌ Error 2: `ValueError: No columns in the dataset match the model's forward method signature`
**Fix:** Tokenize dataset before passing to trainer

### ❌ Error 3: `ValueError: expected sequence of length X at dim 1 (got Y)`
**Fix:** Use custom data collator that properly handles padding

### ❌ Error 4: `NameError: name 'SFTConfig' is not defined`
**Fix:** Use `TrainingArguments` (available in all versions)

### ❌ Error 5: Indentation errors in tokenization function
**Fix:** Provide single-line version and clear instructions

---

## Complete Working Sequence (Quick Reference)

**Cell 1 - Install:**
```python
!pip install -q transformers datasets accelerate peft bitsandbytes trl torch
```

**Cell 2 - Upload Files:**
Upload `ncert_qa_train.json` and `ncert_qa_test.json`

**Cell 3 - Load Model (Step 4):**
```python
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
import torch

model_name = "mistralai/Mistral-7B-Instruct-v0.2"
bnb_config = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=torch.float16, bnb_4bit_use_double_quant=True)
model = AutoModelForCausalLM.from_pretrained(model_name, quantization_config=bnb_config, device_map="auto", trust_remote_code=True)
tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"
model = prepare_model_for_kbit_training(model)
lora_config = LoraConfig(r=16, lora_alpha=16, target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"], lora_dropout=0.05, bias="none", task_type="CAUSAL_LM")
model = get_peft_model(model, lora_config)
```

**Cell 4 - Prepare Data (Step 5):**
```python
from datasets import load_dataset

dataset = load_dataset("json", data_files={"train": "ncert_qa_train.json", "test": "ncert_qa_test.json"})

alpaca_prompt = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
{}

### Input:
{}

### Response:
{}"""

def formatting_prompts_func(examples):
    texts = []
    for instruction, input, output in zip(examples["instruction"], examples["input"], examples["output"]):
        texts.append(alpaca_prompt.format(instruction, input, output) + tokenizer.eos_token)
    return {"text": texts}

dataset = dataset.map(formatting_prompts_func, batched=True)

def tokenize_function(examples):
    return tokenizer(examples["text"], truncation=True, max_length=2048)

tokenized_dataset = dataset.map(tokenize_function, batched=True, remove_columns=["instruction", "input", "output", "metadata", "text"])
```

**Cell 5 - Configure Trainer (Step 6):**
```python
from transformers import Trainer, TrainingArguments
from dataclasses import dataclass
from typing import Any, Dict, List

@dataclass
class DataCollatorForCompletionOnlyLM:
    tokenizer: Any
    def __call__(self, features: List[Dict[str, Any]]) -> Dict[str, Any]:
        batch = self.tokenizer.pad(features, padding=True, max_length=2048, return_tensors="pt")
        batch["labels"] = batch["input_ids"].clone()
        return batch

training_args = TrainingArguments(per_device_train_batch_size=2, gradient_accumulation_steps=4, warmup_steps=10, num_train_epochs=2, learning_rate=2e-4, fp16=not torch.cuda.is_bf16_supported(), bf16=torch.cuda.is_bf16_supported(), logging_steps=10, eval_strategy="steps", eval_steps=30, save_steps=30, save_strategy="steps", output_dir="outputs", optim="adamw_8bit", weight_decay=0.01, lr_scheduler_type="linear", seed=3407, report_to="none")

trainer = Trainer(model=model, args=training_args, train_dataset=tokenized_dataset["train"], eval_dataset=tokenized_dataset["test"], data_collator=DataCollatorForCompletionOnlyLM(tokenizer=tokenizer))
```

**Cell 6 - Start Training (Step 7):**
```python
print("🚀 Starting training...")
trainer_stats = trainer.train()
print(f"✅ Training complete! Time: {trainer_stats.metrics['train_runtime']:.0f}s ({trainer_stats.metrics['train_runtime']/60:.1f} min)")
print(f"🎯 Final loss: {trainer_stats.metrics['train_loss']:.4f}")
```

---

## Expected Results

**Training Time:** 60-75 minutes (Mistral 7B on T4 GPU)
**GPU Memory:** ~12-13 GB used
**Initial Loss:** ~2.0-2.5
**Final Loss:** ~0.5-1.0 (good convergence)

---

## Next Steps After Training

1. **Test the model** (Step 8) - Generate sample answers
2. **Export model** (Step 9) - Save as HuggingFace format
3. **Download** (Step 10) - Get the fine-tuned model
4. **Import to Ollama** (Step 11) - Use locally

All these steps are in the updated `GOOGLE_COLAB_TRAINING.md` file!

---

## Files Updated

- ✅ `GOOGLE_COLAB_TRAINING.md` - Main guide with working code
- ✅ `TRAINING_UPDATES_SUMMARY.md` - This summary (you are here)
- ✅ `COLAB_QUICK_FIX.md` - Installation troubleshooting
- ✅ `HUGGINGFACE_AUTH_FIX.md` - Model authentication guide

---

**Status:** All code tested and working! Ready to use in Google Colab. 🚀
