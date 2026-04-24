"""Prompt templates for grounded generation.

Single source of truth for how we assemble (query + retrieved chunks) into
a prompt that the generator sees. Keeping this separate means we can iterate
on prompt wording without touching the retriever or generator.
"""
from __future__ import annotations

from edullm_pacer.schemas import Chunk, Query


DEFAULT_SYSTEM = (
    "You are an educational assistant. Answer the student's question using ONLY "
    "the information in the Context below. If the answer is not in the context, "
    "say \"I don't have enough information to answer this question from the "
    "provided materials.\" Cite sources inline as [Source N].\n"
)


def build_rag_prompt(
    query: Query,
    context_chunks: list[Chunk],
    system: str = DEFAULT_SYSTEM,
    include_metadata: bool = True,
) -> str:
    """Assemble the full prompt.

    Args:
        query: student question.
        context_chunks: retrieved chunks, in rank order.
        system: system instruction preamble.
        include_metadata: whether to show subject/grade/source with each chunk.

    Returns:
        a single string suitable for generator.generate().
    """
    parts: list[str] = [system.strip(), "\nContext:\n"]
    for i, chunk in enumerate(context_chunks, start=1):
        header = f"[Source {i}"
        if include_metadata:
            meta = chunk.metadata
            if meta.subject:
                header += f" | {meta.subject}"
            grade_val = meta.grade.value if hasattr(meta.grade, "value") else meta.grade
            if grade_val and grade_val != "unknown":
                header += f" | grade: {grade_val}"
        header += "]"
        parts.append(f"{header}\n{chunk.text.strip()}\n")

    parts.append("\nStudent question:")
    parts.append(query.text.strip())
    parts.append("\nAnswer (cite sources inline as [Source N]):")
    return "\n".join(parts)
