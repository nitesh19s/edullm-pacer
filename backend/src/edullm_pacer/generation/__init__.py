"""Generation layer.

Public API:
    Generator / GenerationOutput  - abstract interface
    get_generator(backend)        - factory
    build_rag_prompt(...)         - prompt assembly for RAG
    DummyGenerator                - offline test-only
    HFLocalGenerator              - local HuggingFace models
"""
from edullm_pacer.generation.base import (
    GenerationOutput,
    Generator,
    available_generator_backends,
    get_generator,
    register_generator,
)
from edullm_pacer.generation.dummy import DummyGenerator
from edullm_pacer.generation.hf_local import HFLocalGenerator
from edullm_pacer.generation.prompt import DEFAULT_SYSTEM, build_rag_prompt

__all__ = [
    "DEFAULT_SYSTEM",
    "DummyGenerator",
    "GenerationOutput",
    "Generator",
    "HFLocalGenerator",
    "available_generator_backends",
    "build_rag_prompt",
    "get_generator",
    "register_generator",
]
