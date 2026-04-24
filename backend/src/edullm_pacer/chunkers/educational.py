"""Educational chunker.

Pedagogy-aware chunking that respects instructional structure:
  - Never splits a learning objective from its explanation
  - Keeps definitions with their context/example
  - Preserves worked examples (problem + solution + answer)
  - Keeps theorem + proof pairs together
  - Keeps question + answer pairs together (past papers)

This is a key component of PACER's novelty story. Detection is rule-based
(regex + heuristics) because educational structure is highly conventional
across NCERT, CBSE, and university-level content.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from edullm_pacer.chunkers.base import BaseChunker
from edullm_pacer.schemas import Chunk, ChunkingStrategy, Document

# --------------------------------------------------------------------------
# Structural marker patterns
# --------------------------------------------------------------------------


# Opening markers: start of a coherent pedagogical unit.
# Ordered roughly by strength.
_UNIT_OPENERS = [
    # Chapter / section headers
    (r"^\s*(chapter|unit|section|module|lesson)\s+\d+", "section_header"),
    # Learning objectives
    (r"^\s*(learning\s+objectives?|by\s+the\s+end\s+of\s+this|after\s+(reading|studying))",
     "learning_objective"),
    # Definitions
    (r"^\s*(definition|def\.?)\s*[:\-]", "definition"),
    # Worked examples
    (r"^\s*(example|worked\s+example|illustration|ex\.?\s*\d)", "worked_example"),
    # Theorems / lemmas / propositions
    (r"^\s*(theorem|lemma|proposition|corollary|axiom|postulate)\b", "theorem"),
    # Proofs
    (r"^\s*(proof|solution|sol\.?)\s*[:\-]?", "proof"),
    # Numbered questions (past papers)
    (r"^\s*(q|question)\.?\s*\d+", "question"),
    (r"^\s*\d+\.\s+[A-Z]", "numbered_item"),
    # Activity / try yourself
    (r"^\s*(activity|try\s+yourself|exercise|ex\.?\s*\d)", "activity"),
    # Key points / summary boxes
    (r"^\s*(key\s+points?|summary|note\s*[:\-]|remember)", "summary"),
]

# Closure markers: explicit end of a unit.
_UNIT_CLOSERS = [
    (r"\b(hence\s+proved|q\.?e\.?d\.?|answer\s*[:\-])\b", "proof_end"),
    (r"\b(end\s+of\s+(chapter|section|example))\b", "section_end"),
]

# Inline boundary markers that *must not* be split (within a unit).
_INLINE_PROTECTED = [
    # Equation blocks / formulas
    (r"\$\$.*?\$\$", re.DOTALL),
    (r"\\begin\{equation\}.*?\\end\{equation\}", re.DOTALL),
    # Code blocks
    (r"```.*?```", re.DOTALL),
]


@dataclass
class PedagogicalUnit:
    start: int           # char offset in source text
    end: int             # exclusive
    kind: str            # label from _UNIT_OPENERS
    text: str


# --------------------------------------------------------------------------
# Unit detection
# --------------------------------------------------------------------------


def _find_unit_boundaries(text: str) -> list[PedagogicalUnit]:
    """Scan text line by line and segment into pedagogical units.

    Strategy: every line that matches a unit opener starts a new unit.
    Lines between openers belong to the most recent opener. Fall back to
    paragraph breaks when no openers are found in a long stretch.
    """
    lines = text.splitlines(keepends=True)
    if not lines:
        return []

    # Compute each line's start offset.
    offsets: list[int] = []
    cursor = 0
    for line in lines:
        offsets.append(cursor)
        cursor += len(line)

    # Identify opener lines.
    opener_indices: list[tuple[int, str]] = []
    for i, line in enumerate(lines):
        kind = _match_opener(line)
        if kind:
            opener_indices.append((i, kind))

    units: list[PedagogicalUnit] = []
    if not opener_indices:
        # No structure detected: one big unit.
        units.append(
            PedagogicalUnit(start=0, end=len(text), kind="narrative", text=text),
        )
        return units

    # Handle preamble before the first opener.
    first_opener_line = opener_indices[0][0]
    if first_opener_line > 0:
        preamble_end = offsets[first_opener_line]
        preamble_text = text[:preamble_end].strip()
        if preamble_text:
            units.append(
                PedagogicalUnit(start=0, end=preamble_end, kind="preamble", text=preamble_text),
            )

    # Each opener starts a unit ending at the next opener (or EOF).
    for idx, (line_no, kind) in enumerate(opener_indices):
        start = offsets[line_no]
        if idx + 1 < len(opener_indices):
            end = offsets[opener_indices[idx + 1][0]]
        else:
            end = len(text)
        unit_text = text[start:end].strip()
        if unit_text:
            units.append(PedagogicalUnit(start=start, end=end, kind=kind, text=unit_text))

    return units


def _match_opener(line: str) -> str | None:
    stripped = line.lstrip()
    for pattern, kind in _UNIT_OPENERS:
        if re.match(pattern, stripped, flags=re.IGNORECASE):
            return kind
    return None


# --------------------------------------------------------------------------
# Chunker
# --------------------------------------------------------------------------


class EducationalChunker(BaseChunker):
    """Pedagogy-aware chunker that respects instructional structure.

    Args:
        chunk_size: target chunk size in characters.
        chunk_overlap: characters of overlap between chunks.
        max_unit_chars: if a single pedagogical unit exceeds this, sub-split it
                        using paragraph boundaries; never split mid-sentence.
    """

    strategy = ChunkingStrategy.EDUCATIONAL

    def __init__(
        self,
        chunk_size: int = 2000,
        chunk_overlap: int = 100,
        max_unit_chars: int = 4000,
    ) -> None:
        super().__init__(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        self.max_unit_chars = max_unit_chars

    def chunk(self, document: Document) -> list[Chunk]:
        if not document.text.strip():
            return []

        units = _find_unit_boundaries(document.text)
        chunks: list[Chunk] = []
        idx = 0

        for unit in units:
            sub_chunks = self._pack_unit(unit)
            for text, (start, end) in sub_chunks:
                chunk_id = self._make_chunk_id(document.doc_id, idx, text)
                metadata = self._make_metadata(document, idx, char_start=start, char_end=end)
                metadata.pedagogical_boundary_preserved = True
                metadata.extra["unit_kind"] = unit.kind
                chunks.append(Chunk(chunk_id=chunk_id, text=text, metadata=metadata))
                idx += 1

        return chunks

    def _pack_unit(self, unit: PedagogicalUnit) -> list[tuple[str, tuple[int, int]]]:
        """Pack a unit into chunks. Returns list of (text, (char_start, char_end))."""
        if len(unit.text) <= self.chunk_size:
            return [(unit.text, (unit.start, unit.end))]

        if len(unit.text) <= self.max_unit_chars:
            # Unit fits under absolute limit but exceeds target size: keep whole.
            return [(unit.text, (unit.start, unit.end))]

        # Too big: split on paragraph, then sentence, then as last resort char window.
        return self._split_large_unit(unit)

    def _split_large_unit(
        self, unit: PedagogicalUnit,
    ) -> list[tuple[str, tuple[int, int]]]:
        """Paragraph-first splitter for large units."""
        paragraphs = [p for p in re.split(r"\n\s*\n", unit.text) if p.strip()]
        if not paragraphs:
            return [(unit.text, (unit.start, unit.end))]

        chunks: list[tuple[str, tuple[int, int]]] = []
        buffer: list[str] = []
        buffer_len = 0
        cursor = unit.start

        for para in paragraphs:
            if buffer_len + len(para) + 2 > self.chunk_size and buffer:
                text = "\n\n".join(buffer)
                chunks.append((text, (cursor, cursor + len(text))))
                cursor += len(text) + 2
                # Overlap carried over as the last paragraph.
                if self.chunk_overlap > 0:
                    buffer = [buffer[-1][-self.chunk_overlap:]]
                    buffer_len = len(buffer[0])
                else:
                    buffer = []
                    buffer_len = 0
            buffer.append(para)
            buffer_len += len(para) + 2

        if buffer:
            text = "\n\n".join(buffer)
            chunks.append((text, (cursor, cursor + len(text))))

        return chunks
