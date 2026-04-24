"""Generator abstraction.

All generation backends implement Generator.generate(prompt, max_tokens, ...)
so the RAG pipeline stays backend-agnostic. Backends fall into two families:

  1. Local HuggingFace models (Llama-3.1-8B, Qwen2.5, Phi-3.5) - free, slow
  2. API-backed (OpenAI, Anthropic, Google, Groq) - fast, requires keys

The DummyGenerator in this file is for offline tests. Real backends live
in sibling modules.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class Generator(ABC):
    """Abstract text generator."""

    name: str

    @abstractmethod
    def generate(
        self,
        prompt: str,
        max_tokens: int = 512,
        temperature: float = 0.2,
        stop: list[str] | None = None,
    ) -> GenerationOutput:
        """Generate a response for a prompt. Implementations must be synchronous."""
        ...

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(name={self.name!r})"


class GenerationOutput:
    """Lightweight container for generation result + stats."""

    def __init__(
        self,
        text: str,
        model_name: str,
        prompt_tokens: int | None = None,
        completion_tokens: int | None = None,
        latency_ms: float | None = None,
        extra: dict[str, Any] | None = None,
    ) -> None:
        self.text = text
        self.model_name = model_name
        self.prompt_tokens = prompt_tokens
        self.completion_tokens = completion_tokens
        self.latency_ms = latency_ms
        self.extra = extra or {}

    def to_dict(self) -> dict[str, Any]:
        return {
            "text": self.text,
            "model_name": self.model_name,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "latency_ms": self.latency_ms,
            "extra": self.extra,
        }


# --------------------------------------------------------------------------
# Registry
# --------------------------------------------------------------------------


_GENERATOR_REGISTRY: dict[str, type[Generator]] = {}


def register_generator(backend: str):  # type: ignore[no-untyped-def]
    def deco(cls: type[Generator]) -> type[Generator]:
        _GENERATOR_REGISTRY[backend] = cls
        return cls

    return deco


def get_generator(backend: str, **kwargs: Any) -> Generator:
    if backend not in _GENERATOR_REGISTRY:
        available = ", ".join(_GENERATOR_REGISTRY)
        raise KeyError(
            f"Generator backend '{backend}' not registered. Available: {available}"
        )
    return _GENERATOR_REGISTRY[backend](**kwargs)


def available_generator_backends() -> list[str]:
    return list(_GENERATOR_REGISTRY.keys())
