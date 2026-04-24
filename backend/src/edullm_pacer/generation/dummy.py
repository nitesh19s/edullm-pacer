"""Dummy generator for offline tests.

Produces a deterministic response. Used to validate the end-to-end RAG
pipeline (retrieval + prompt assembly + generation interface) without any
model download.
"""
from __future__ import annotations

import time

from edullm_pacer.generation.base import GenerationOutput, Generator, register_generator


@register_generator("dummy")
class DummyGenerator(Generator):
    """Echoes the first line of the prompt as the 'answer'. For tests only."""

    def __init__(self, name: str = "dummy") -> None:
        self.name = name

    def generate(
        self,
        prompt: str,
        max_tokens: int = 512,  # noqa: ARG002
        temperature: float = 0.2,  # noqa: ARG002
        stop: list[str] | None = None,  # noqa: ARG002
    ) -> GenerationOutput:
        start = time.perf_counter()
        # Extract the query line if the prompt uses our standard template.
        lines = [line for line in prompt.splitlines() if line.strip()]
        first = lines[-1] if lines else ""
        text = f"[dummy] You asked: {first[:120]}"
        elapsed = (time.perf_counter() - start) * 1000.0
        return GenerationOutput(
            text=text,
            model_name=self.name,
            prompt_tokens=len(prompt.split()),
            completion_tokens=len(text.split()),
            latency_ms=elapsed,
        )
