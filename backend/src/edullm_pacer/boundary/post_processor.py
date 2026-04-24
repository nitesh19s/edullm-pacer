"""Pedagogical boundary post-processor.

Takes a list of Chunk objects produced by *any* chunker and:
1. Flags chunks that end mid-pedagogical-unit
   (sets ``pedagogical_boundary_preserved = False``).
2. Optionally merges violating adjacent pairs (controlled by ``merge``).

Usage::

    from edullm_pacer.boundary import BoundaryPostProcessor

    processor = BoundaryPostProcessor(merge=False)
    chunks = processor.process(chunks)   # returns updated list[Chunk]
"""
from __future__ import annotations

from edullm_pacer.schemas import Chunk

from .detector import detect_boundary_violations


class BoundaryPostProcessor:
    """Post-process chunks from any chunker to flag/repair boundary violations.

    Args:
        merge: if True, merge a violating chunk with its successor to restore
               the broken unit.  The merged chunk inherits the first chunk's
               metadata.  Default False (flag only).
        max_merge_chars: guard against producing enormous chunks; skip the
               merge if the combined length would exceed this limit.
    """

    def __init__(self, merge: bool = False, max_merge_chars: int = 8_000) -> None:
        self.merge = merge
        self.max_merge_chars = max_merge_chars

    def process(self, chunks: list[Chunk]) -> list[Chunk]:
        """Return a new list of chunks with boundary flags applied."""
        if not chunks:
            return []

        violation_indices = set(
            detect_boundary_violations([c.text for c in chunks])
        )

        if not self.merge:
            return self._flag_only(chunks, violation_indices)

        return self._flag_and_merge(chunks, violation_indices)

    # ------------------------------------------------------------------

    def _flag_only(self, chunks: list[Chunk], violations: set[int]) -> list[Chunk]:
        result: list[Chunk] = []
        for i, chunk in enumerate(chunks):
            if i in violations:
                updated = chunk.model_copy(deep=True)
                updated.metadata.pedagogical_boundary_preserved = False
                result.append(updated)
            else:
                result.append(chunk)
        return result

    def _flag_and_merge(self, chunks: list[Chunk], violations: set[int]) -> list[Chunk]:
        result: list[Chunk] = []
        skip_next = False

        for i, chunk in enumerate(chunks):
            if skip_next:
                skip_next = False
                continue

            if i in violations and i + 1 < len(chunks):
                successor = chunks[i + 1]
                merged_text = chunk.text.rstrip() + "\n" + successor.text.lstrip()

                if len(merged_text) <= self.max_merge_chars:
                    merged = chunk.model_copy(deep=True)
                    merged.text = merged_text
                    merged.metadata.pedagogical_boundary_preserved = True
                    if merged.metadata.char_end is None and successor.metadata.char_end is not None:
                        merged.metadata.char_end = successor.metadata.char_end
                    result.append(merged)
                    skip_next = True
                    continue
                else:
                    # Too big to merge — flag and move on.
                    flagged = chunk.model_copy(deep=True)
                    flagged.metadata.pedagogical_boundary_preserved = False
                    result.append(flagged)
            else:
                result.append(chunk)

        return result

    def violation_rate(self, chunks: list[Chunk]) -> float:
        """Fraction of chunks with boundary violations (before processing)."""
        if not chunks:
            return 0.0
        violations = detect_boundary_violations([c.text for c in chunks])
        return len(violations) / len(chunks)
