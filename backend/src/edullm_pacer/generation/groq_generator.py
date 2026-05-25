"""Groq API generator backend.

Uses the Groq API for fast, free LLM inference. Requires GROQ_API_KEY env var.
Sign up free at console.groq.com.

Default model: llama-3.1-70b-versatile (free tier, excellent quality)
"""
from __future__ import annotations

import os
import time

from edullm_pacer.generation.base import GenerationOutput, Generator, register_generator
from edullm_pacer.utils.logging import get_logger

logger = get_logger(__name__)


@register_generator("groq")
class GroqGenerator(Generator):
    """Generator backed by the Groq API (free tier).

    Args:
        model_name: Groq model ID.
        api_key: Groq API key. Defaults to GROQ_API_KEY env var.
    """

    def __init__(
        self,
        model_name: str = "llama-3.3-70b-versatile",
        api_key: str | None = None,
    ) -> None:
        self.name = model_name
        self._api_key = api_key or os.getenv("GROQ_API_KEY")
        if not self._api_key:
            raise ValueError(
                "Groq API key not found. Set the GROQ_API_KEY environment variable."
            )
        self._system = (
            "You are an expert educational assistant for Indian school students. "
            "Answer questions based only on the provided NCERT context. "
            "Be clear, concise, and accurate. Cite source numbers inline as [Source N]."
        )
        self._client = None

    def _get_client(self):  # type: ignore[no-untyped-def]
        if self._client is None:
            try:
                from groq import Groq
            except ImportError as e:
                raise ImportError(
                    "GroqGenerator requires the groq package. "
                    "Install: pip install groq"
                ) from e
            self._client = Groq(api_key=self._api_key)
        return self._client

    def generate(
        self,
        prompt: str,
        max_tokens: int = 512,
        temperature: float = 0.2,
        stop: list[str] | None = None,
    ) -> GenerationOutput:
        client = self._get_client()
        start = time.perf_counter()

        response = client.chat.completions.create(
            model=self.name,
            max_tokens=max_tokens,
            temperature=temperature,
            messages=[
                {"role": "system", "content": self._system},
                {"role": "user", "content": prompt},
            ],
        )

        elapsed = (time.perf_counter() - start) * 1000.0
        text = response.choices[0].message.content

        return GenerationOutput(
            text=text,
            model_name=self.name,
            prompt_tokens=response.usage.prompt_tokens,
            completion_tokens=response.usage.completion_tokens,
            latency_ms=elapsed,
        )
