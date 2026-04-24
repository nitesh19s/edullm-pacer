"""Local HuggingFace transformers generator.

Runs Llama-3.1-8B / Qwen2.5-7B / Phi-3.5-mini / any chat-tuned HF model locally.
Uses 4-bit quantization (bitsandbytes) on GPU so 7-8B models fit on a free
Colab T4. Falls back to fp16 on CPU (slow but works).

Lazy-imports torch/transformers so the package still loads without them.

Example:
    gen = HFLocalGenerator(model_name="microsoft/Phi-3.5-mini-instruct")
    out = gen.generate("What is photosynthesis?")
"""
from __future__ import annotations

import time
from typing import TYPE_CHECKING

from edullm_pacer.generation.base import GenerationOutput, Generator, register_generator
from edullm_pacer.utils.logging import get_logger

if TYPE_CHECKING:
    import torch  # noqa: F401
    from transformers import PreTrainedModel, PreTrainedTokenizerBase

logger = get_logger(__name__)


@register_generator("hf-local")
class HFLocalGenerator(Generator):
    """Local HuggingFace transformers generator with optional 4-bit quantization.

    Args:
        model_name: HF model id.
        device: "cuda", "cpu", or None for auto-detect.
        load_in_4bit: enable bitsandbytes 4-bit quantization. Needs GPU.
        torch_dtype: torch dtype when not quantized. Default fp16.
        max_model_len: truncate prompts longer than this (tokens).
    """

    def __init__(
        self,
        model_name: str = "microsoft/Phi-3.5-mini-instruct",
        device: str | None = None,
        load_in_4bit: bool = True,
        torch_dtype: str = "float16",
        max_model_len: int = 4096,
    ) -> None:
        self.name = model_name
        self._device = device
        self._load_in_4bit = load_in_4bit
        self._torch_dtype = torch_dtype
        self._max_model_len = max_model_len
        self._model: PreTrainedModel | None = None
        self._tokenizer: PreTrainedTokenizerBase | None = None

    def _load(self) -> None:
        if self._model is not None:
            return
        try:
            import torch
            from transformers import AutoModelForCausalLM, AutoTokenizer
        except ImportError as e:
            raise ImportError(
                "HFLocalGenerator requires torch + transformers. "
                "Install: pip install torch transformers accelerate"
            ) from e

        # Resolve device.
        if self._device is None:
            self._device = "cuda" if torch.cuda.is_available() else "cpu"

        quant_config = None
        if self._load_in_4bit and self._device == "cuda":
            try:
                from transformers import BitsAndBytesConfig
                quant_config = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_compute_dtype=torch.float16,
                    bnb_4bit_use_double_quant=True,
                    bnb_4bit_quant_type="nf4",
                )
                logger.info("Using 4-bit quantization (bitsandbytes)")
            except ImportError:
                logger.warning("bitsandbytes unavailable - loading in fp16")

        dtype = getattr(torch, self._torch_dtype)
        self._tokenizer = AutoTokenizer.from_pretrained(self.name)
        if self._tokenizer.pad_token_id is None:
            self._tokenizer.pad_token_id = self._tokenizer.eos_token_id

        kwargs = {"torch_dtype": dtype}
        if quant_config is not None:
            kwargs["quantization_config"] = quant_config
            kwargs["device_map"] = "auto"
        else:
            kwargs["device_map"] = self._device

        self._model = AutoModelForCausalLM.from_pretrained(self.name, **kwargs)
        self._model.eval()
        logger.info(f"Loaded {self.name} on {self._device}")

    def generate(
        self,
        prompt: str,
        max_tokens: int = 512,
        temperature: float = 0.2,
        stop: list[str] | None = None,
    ) -> GenerationOutput:
        self._load()
        assert self._model is not None and self._tokenizer is not None

        import torch  # local import after _load confirms availability

        # Use chat template if the model has one.
        if hasattr(self._tokenizer, "apply_chat_template") and getattr(
            self._tokenizer, "chat_template", None,
        ):
            messages = [{"role": "user", "content": prompt}]
            input_ids = self._tokenizer.apply_chat_template(
                messages,
                add_generation_prompt=True,
                return_tensors="pt",
                truncation=True,
                max_length=self._max_model_len,
            )
        else:
            enc = self._tokenizer(
                prompt,
                return_tensors="pt",
                truncation=True,
                max_length=self._max_model_len,
            )
            input_ids = enc["input_ids"]

        input_ids = input_ids.to(self._model.device)
        prompt_len = input_ids.shape[1]

        start = time.perf_counter()
        with torch.no_grad():
            output_ids = self._model.generate(
                input_ids,
                max_new_tokens=max_tokens,
                do_sample=temperature > 0.0,
                temperature=max(temperature, 0.01),
                top_p=0.95,
                pad_token_id=self._tokenizer.pad_token_id,
            )
        elapsed_ms = (time.perf_counter() - start) * 1000.0

        completion_ids = output_ids[0, prompt_len:]
        text = self._tokenizer.decode(completion_ids, skip_special_tokens=True).strip()

        if stop:
            for s in stop:
                if s in text:
                    text = text.split(s)[0].strip()

        return GenerationOutput(
            text=text,
            model_name=self.name,
            prompt_tokens=int(prompt_len),
            completion_tokens=int(completion_ids.shape[0]),
            latency_ms=elapsed_ms,
        )
