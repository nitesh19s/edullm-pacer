"""Anthropic Claude generator backend.

Uses the Anthropic API to generate answers. Requires ANTHROPIC_API_KEY env var.

Models (cheapest to most capable):
    claude-haiku-4-5-20251001     — fastest, cheapest
    claude-sonnet-4-6             — best balance (default)
    claude-opus-4-6               — most capable
"""
from __future__ import annotations

import os
import time

from edullm_pacer.generation.base import GenerationOutput, Generator, register_generator
from edullm_pacer.utils.logging import get_logger

logger = get_logger(__name__)


@register_generator("anthropic")
class AnthropicGenerator(Generator):
    """Generator backed by the Anthropic Claude API.

    Args:
        model_name: Claude model ID.
        api_key: Anthropic API key. Defaults to ANTHROPIC_API_KEY env var.
        system_prompt: Optional system message prepended to every request.
    """

    def __init__(
        self,
        model_name: str = "claude-haiku-4-5-20251001",
        api_key: str | None = None,
        system_prompt: str | None = None,
    ) -> None:
        self.name = model_name
        self._api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self._api_key:
            raise ValueError(
                "Anthropic API key not found. Set the ANTHROPIC_API_KEY environment variable."
            )
        self._system = system_prompt or (
            "You are an expert educational assistant for Indian school students. "
            "Answer questions based only on the provided NCERT context. "
            "Be clear, concise, and accurate. Cite source numbers inline as [Source N]."
        )
        self._client = None

    def _get_client(self):  # type: ignore[no-untyped-def]
        if self._client is None:
            import anthropic
            self._client = anthropic.Anthropic(api_key=self._api_key)
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

        message = client.messages.create(
            model=self.name,
            max_tokens=max_tokens,
            temperature=temperature,
            system=self._system,
            messages=[{"role": "user", "content": prompt}],
        )

        elapsed = (time.perf_counter() - start) * 1000.0
        text = message.content[0].text

        return GenerationOutput(
            text=text,
            model_name=self.name,
            prompt_tokens=message.usage.input_tokens,
            completion_tokens=message.usage.output_tokens,
            latency_ms=elapsed,
        )
