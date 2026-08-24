# Mistral 7B QLoRA Fine-tuning on Kaggle

Fine-tune `Mistral-7B-v0.1` on 7,794 NCERT Q&A pairs using QLoRA (4-bit quantization + LoRA).
Runs on a single T4 GPU (15 GB VRAM) within Kaggle's free 12-hour session.

---

## One-time Setup

### 1. Accept Mistral license on HuggingFace
Go to https://huggingface.co/mistralai/Mistral-7B-v0.1 → click **"Access repository"** → accept terms.

### 2. Create a HuggingFace token
Go to https://huggingface.co/settings/tokens → **New token** → role: `read` → copy it.

### 3. Upload the training dataset to Kaggle
1. Go to https://kaggle.com/datasets → **New Dataset**
2. Name it `ncert-qa-dataset`
3. Upload `/Users/nitesh/edullm-platform/ncert_qa_train.json`
4. Set visibility to **Private** → Create

### 4. Create a new Kaggle notebook
1. Go to https://kaggle.com/code → **New Notebook**
2. Settings (right panel):
   - Accelerator: **GPU T4 x1**
   - Persistence: **Files only**
3. Add dataset: **+ Add Data** → search `ncert-qa-dataset` → Add
4. Add secret: **+ Add-ons → Secrets** → name `HF_TOKEN` → paste your token

---

## Notebook Cells

### Cell 1 — Install dependencies
```python
!pip install -q transformers peft trl bitsandbytes accelerate datasets
```

### Cell 2 — Login to HuggingFace
```python
import os
from huggingface_hub import login

login(token=os.environ["HF_TOKEN"])
print("HuggingFace login OK")
```

### Cell 3 — Load dataset
```python
import json

with open("/kaggle/input/ncert-qa-dataset/ncert_qa_train.json") as f:
    train_data = json.load(f)

print(f"Training pairs: {len(train_data)}")
print("Sample:", train_data[0]["instruction"][:80])
```

### Cell 4 — Load Mistral 7B in 4-bit (QLoRA)
```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

MODEL_ID = "mistralai/Mistral-7B-v0.1"

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
)

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"

model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    quantization_config=bnb_config,
    device_map="auto",
)

print(f"Model loaded | dtype: {model.dtype} | device: {next(model.parameters()).device}")
```

### Cell 5 — Apply LoRA adapters
```python
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

model = prepare_model_for_kbit_training(model)

lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# Expected: ~85M trainable / 7.2B total (~1.2%)
```

### Cell 6 — Format dataset
```python
from datasets import Dataset

ALPACA_TEMPLATE = (
    "Below is an instruction that describes a task, paired with an input that provides "
    "further context. Write a response that appropriately completes the request.\n\n"
    "### Instruction:\n{instruction}\n\n"
    "### Input:\n{input}\n\n"
    "### Response:\n{output}"
)

def format_example(example):
    return {"text": ALPACA_TEMPLATE.format(
        instruction=example["instruction"],
        input=example["input"],
        output=example["output"],
    )}

dataset = Dataset.from_list(train_data)
dataset = dataset.map(format_example, remove_columns=dataset.column_names)

print(f"Dataset size: {len(dataset)}")
print("\nSample (first 400 chars):\n", dataset[0]["text"][:400])
```

### Cell 7 — Train (checkpoints saved to /kaggle/working)
```python
from transformers import TrainingArguments
from trl import SFTTrainer

OUTPUT_DIR = "/kaggle/working/mistral-ncert-checkpoints"

training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=1,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=8,       # effective batch = 8
    gradient_checkpointing=True,
    optim="paged_adamw_32bit",
    learning_rate=2e-4,
    lr_scheduler_type="cosine",
    warmup_ratio=0.03,
    max_grad_norm=0.3,
    fp16=True,
    bf16=False,
    logging_steps=50,
    save_steps=200,
    save_total_limit=3,
    evaluation_strategy="no",
    report_to="none",
)

trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    args=training_args,
    tokenizer=tokenizer,
    dataset_text_field="text",
    max_seq_length=512,
    packing=False,
)

print("🚀 Starting training — checkpoints every 200 steps to /kaggle/working/")
trainer.train()
print("✅ Training complete")
```

### Cell 8 — Save final adapter
```python
ADAPTER_DIR = "/kaggle/working/mistral-ncert-adapter"

model.save_pretrained(ADAPTER_DIR)
tokenizer.save_pretrained(ADAPTER_DIR)
print(f"Adapter saved to {ADAPTER_DIR}")

# List saved files
import os
for f in os.listdir(ADAPTER_DIR):
    size = os.path.getsize(f"{ADAPTER_DIR}/{f}") / 1e6
    print(f"  {f}  ({size:.1f} MB)")
```

---

## After Training — Download & Import into Ollama

### Step 1: Download the adapter
In Kaggle → notebook → **Output** tab → download `mistral-ncert-adapter/` folder.
Extract to `/Users/nitesh/edullm-platform/fine-tuned-models/mistral_ncert_adapter/`.

### Step 2: Merge LoRA weights into base model (local)
```bash
cd /Users/nitesh/edullm-platform
python3 - <<'EOF'
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import torch

base    = "mistralai/Mistral-7B-v0.1"
adapter = "fine-tuned-models/mistral_ncert_adapter"
output  = "fine-tuned-models/mistral_ncert_merged"

print("Loading base model...")
model = AutoModelForCausalLM.from_pretrained(base, torch_dtype=torch.float16, device_map="cpu")
tokenizer = AutoTokenizer.from_pretrained(adapter)

print("Merging LoRA...")
model = PeftModel.from_pretrained(model, adapter)
model = model.merge_and_unload()

print("Saving merged model...")
model.save_pretrained(output)
tokenizer.save_pretrained(output)
print("Done →", output)
EOF
```

### Step 3: Convert to GGUF
```bash
python3 /tmp/llama_cpp_repo/convert_hf_to_gguf.py \
  fine-tuned-models/mistral_ncert_merged \
  --outfile fine-tuned-models/mistral_ncert.gguf \
  --outtype q8_0
```

### Step 4: Create Modelfile and import
```bash
cat > fine-tuned-models/Modelfile.mistral <<'EOF'
FROM ./mistral_ncert.gguf
SYSTEM """You are an expert NCERT teacher. Answer questions clearly and accurately based on the Indian school curriculum."""
PARAMETER temperature 0.7
PARAMETER stop "[INST]"
PARAMETER stop "[/INST]"
PARAMETER stop "</s>"
EOF

ollama create mistral-ncert -f fine-tuned-models/Modelfile.mistral
ollama run mistral-ncert "What is photosynthesis?"
```

### Step 5: Run 3-way evaluation
Edit `eval-models.py` — change the MODELS line:
```python
MODELS = ["ncert-edu:latest", "mistral-ncert:latest", "llama3:latest"]
```
Then run:
```bash
python3 eval-models.py --n 100 --seed 99
```

---

## Expected Timeline
| Step | Time |
|---|---|
| Dataset upload to Kaggle | 2 min |
| Cell 4 (model download) | 5–8 min |
| Cell 7 (training, 1 epoch) | 3–4 hours |
| Download + merge + GGUF | 30 min |
| 3-way eval (100 pairs) | 35 min |

## Quick Reference
- Training pairs: 7,794
- Test pairs: 867 (in `ncert_qa_test.json`)
- Base model: `mistralai/Mistral-7B-v0.1`
- Technique: QLoRA (NF4 4-bit + LoRA r=16)
- Effective batch size: 8 (batch=1 × grad_accum=8)
- Max sequence length: 512 tokens
- Checkpoints: every 200 steps → `/kaggle/working/`
