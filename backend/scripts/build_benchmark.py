"""
Build the evaluation query benchmark for Paper 1.

Generates 800-1000 curriculum-grounded questions from the NCERT corpus through
three complementary sources:
  - Source A: Questions extracted from past-paper chunks in the corpus
  - Source B: Questions synthesized by an LLM from textbook chunks
  - Source C: Manually specified seed questions (expandable)

Each question is labeled with:
  - subject, grade, bloom_level
  - expected_doc_ids (gold-standard chapter IDs)
  - expected_answer (if available)

Usage:
    conda activate edullm
    cd ~/edullm
    python backend/scripts/build_benchmark.py

    # Use Groq (free) for LLM synthesis:
    python backend/scripts/build_benchmark.py --generator groq

    # Use Google Gemini (free tier):
    python backend/scripts/build_benchmark.py --generator gemini

Outputs:
    data/benchmark/queries.jsonl
    data/benchmark/benchmark_report.json
"""
from __future__ import annotations

import json
import re
import sys
import random
import argparse
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "backend" / "src"))

from edullm_pacer.schemas import Query, BloomLevel, GradeLevel
from edullm_pacer.utils.io import read_jsonl_as, write_jsonl
from edullm_pacer.utils.logging import get_logger

logger = get_logger(__name__)

DATA_DIR = ROOT / "data"
PROCESSED_DIR = DATA_DIR / "processed"
BENCHMARK_DIR = DATA_DIR / "benchmark"
BENCHMARK_DIR.mkdir(parents=True, exist_ok=True)

# Target distribution across Bloom's levels
BLOOM_TARGETS = {
    BloomLevel.REMEMBER:   0.20,
    BloomLevel.UNDERSTAND: 0.30,
    BloomLevel.APPLY:      0.25,
    BloomLevel.ANALYZE:    0.15,
    BloomLevel.EVALUATE:   0.07,
    BloomLevel.CREATE:     0.03,
}

# LLM prompt for question synthesis
SYNTHESIS_PROMPT = """You are building an evaluation benchmark for an educational AI system.
Given the following passage from an NCERT textbook, generate {n} questions that a student might ask.

Subject: {subject}
Grade: {grade}
Bloom's level: {bloom_level}

PASSAGE:
{passage}

Requirements:
- Questions must be answerable from the passage above
- Questions should be at the {bloom_level} cognitive level
- Questions should be clear and specific
- For REMEMBER level: ask to recall facts, definitions, or lists
- For UNDERSTAND level: ask to explain, describe, or summarize
- For APPLY level: ask to solve a problem or use a concept in a new context
- For ANALYZE level: ask to compare, differentiate, or examine relationships
- For EVALUATE level: ask to judge, assess, or argue a position
- For CREATE level: ask to design, propose, or construct something

Respond with ONLY a JSON array of question strings:
["question 1", "question 2", ...]"""


def _get_env(key: str) -> str | None:
    import os
    val = os.environ.get(key)
    if val:
        return val
    env_file = ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if line.startswith(key + "="):
                return line.split("=", 1)[1].strip()
    return None


def _enum_val(v) -> str:
    return v.value if hasattr(v, "value") else str(v)


# ============================================================
# SOURCE A: Extract from past-paper chunks
# ============================================================

def extract_from_past_papers(chunks_path: Path) -> list[dict]:
    """Extract questions from past-paper type chunks in the corpus."""
    from edullm_pacer.schemas import Document
    documents = list(read_jsonl_as(chunks_path, Document))

    questions = []
    past_paper_docs = [d for d in documents
                       if _enum_val(d.metadata.doc_type) in ("past_paper", "worked_example")]

    logger.info(f"Found {len(past_paper_docs)} past-paper/worked-example documents")

    # Regex patterns for extracting questions
    q_patterns = [
        r"Q\.?\s*\d+[.:]\s*(.+?)(?=Q\.?\s*\d+[.:]|\Z)",
        r"Question\s+\d+[.:]\s*(.+?)(?=Question\s+\d+[.:]|\Z)",
        r"^\d+\.\s+(.+?)(?=^\d+\.|\Z)",
    ]

    for doc in past_paper_docs:
        for pat in q_patterns:
            matches = re.findall(pat, doc.text, re.MULTILINE | re.DOTALL)
            for match in matches[:3]:  # max 3 per doc
                q_text = match.strip()[:300]
                if len(q_text) > 20 and "?" in q_text or len(q_text) > 50:
                    questions.append({
                        "text": q_text,
                        "source": "past_paper",
                        "doc_id": doc.doc_id,
                        "subject": doc.metadata.subject,
                        "grade": _enum_val(doc.metadata.grade),
                        "bloom_level": _enum_val(BloomLevel.REMEMBER),
                    })

    logger.info(f"Extracted {len(questions)} questions from past papers")
    return questions


# ============================================================
# SOURCE B: LLM synthesis from textbook chunks
# ============================================================

def synthesize_from_chunks(chunks_path: Path, generator: str = "groq", target_n: int = 600) -> list[dict]:
    """Synthesize questions using an LLM from textbook passages."""
    from edullm_pacer.schemas import Document
    documents = list(read_jsonl_as(chunks_path, Document))

    # Sample textbook chapters only
    textbook_docs = [d for d in documents
                     if _enum_val(d.metadata.doc_type) == "textbook_chapter"]

    if not textbook_docs:
        textbook_docs = documents  # fallback

    logger.info(f"Synthesizing from {len(textbook_docs)} textbook documents")

    # Sample balanced subset
    random.seed(42)
    sample_size = min(len(textbook_docs), target_n // 3)
    sampled = random.sample(textbook_docs, sample_size)

    # Get LLM function
    llm_fn = _get_llm_function(generator)
    if llm_fn is None:
        logger.warning(f"No LLM available for synthesis. Using template questions.")
        return _template_questions(sampled, target_n)

    questions = []
    bloom_levels = list(BLOOM_TARGETS.keys())

    for doc in sampled:
        # Pick 2-3 Bloom levels per document for variety
        selected_blooms = random.sample(bloom_levels, min(3, len(bloom_levels)))
        passage = doc.text[:800]  # truncate to keep prompts short

        for bloom in selected_blooms:
            if len(questions) >= target_n:
                break
            prompt = SYNTHESIS_PROMPT.format(
                n=2,
                subject=doc.metadata.subject or "general",
                grade=_enum_val(doc.metadata.grade),
                bloom_level=_enum_val(bloom),
                passage=passage,
            )
            try:
                response = llm_fn(prompt)
                parsed = _parse_question_list(response)
                for q_text in parsed:
                    questions.append({
                        "text": q_text,
                        "source": "llm_synthesis",
                        "doc_id": doc.doc_id,
                        "subject": doc.metadata.subject,
                        "grade": _enum_val(doc.metadata.grade),
                        "bloom_level": _enum_val(bloom),
                    })
            except Exception as e:
                logger.warning(f"LLM synthesis failed: {e}")

    logger.info(f"Synthesized {len(questions)} questions via LLM")
    return questions


def _get_llm_function(generator: str):
    """Return a callable(prompt) -> str for the specified generator."""
    if generator == "groq":
        api_key = _get_env("GROQ_API_KEY")
        if not api_key:
            logger.warning("GROQ_API_KEY not set")
            return None
        try:
            from groq import Groq
            client = Groq(api_key=api_key)
            def groq_fn(prompt):
                resp = client.chat.completions.create(
                    model="llama-3.1-8b-instant",  # fast, free tier
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=400, temperature=0.7,
                )
                return resp.choices[0].message.content
            return groq_fn
        except ImportError:
            logger.warning("groq not installed. pip install groq")
            return None

    elif generator == "gemini":
        api_key = _get_env("GOOGLE_API_KEY")
        if not api_key:
            logger.warning("GOOGLE_API_KEY not set")
            return None
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.0-flash")
            def gemini_fn(prompt):
                resp = model.generate_content(prompt)
                return resp.text
            return gemini_fn
        except ImportError:
            logger.warning("google-generativeai not installed")
            return None

    return None


def _parse_question_list(response: str) -> list[str]:
    """Parse LLM response to extract list of question strings."""
    try:
        clean = response.strip()
        match = re.search(r'\[.*?\]', clean, re.DOTALL)
        if match:
            items = json.loads(match.group())
            return [str(i).strip() for i in items if i and len(str(i)) > 10]
    except Exception:
        pass
    # Fallback: extract lines that look like questions
    lines = [l.strip() for l in response.splitlines() if "?" in l and len(l) > 15]
    return lines[:3]


def _template_questions(docs: list, target_n: int) -> list[dict]:
    """Generate template-based questions when no LLM is available."""
    templates_by_bloom = {
        BloomLevel.REMEMBER: [
            "What is {topic}?",
            "Define {topic}.",
            "List the main components of {topic}.",
        ],
        BloomLevel.UNDERSTAND: [
            "Explain how {topic} works.",
            "Describe the relationship between {topic} and its context.",
            "Summarize the key points about {topic}.",
        ],
        BloomLevel.APPLY: [
            "How would you use {topic} to solve a real-world problem?",
            "Apply the concept of {topic} to a new situation.",
        ],
        BloomLevel.ANALYZE: [
            "Compare {topic} with a related concept.",
            "What are the causes and effects of {topic}?",
        ],
    }

    questions = []
    for doc in docs:
        # Crude topic extraction: first noun phrase in the document
        words = doc.text.split()[:10]
        topic = " ".join(w for w in words if len(w) > 4)[:40]
        if not topic:
            topic = doc.metadata.subject or "this concept"

        for bloom, templates in templates_by_bloom.items():
            for tmpl in templates[:1]:
                if len(questions) >= target_n:
                    return questions
                questions.append({
                    "text": tmpl.format(topic=topic),
                    "source": "template",
                    "doc_id": doc.doc_id,
                    "subject": doc.metadata.subject,
                    "grade": _enum_val(doc.metadata.grade),
                    "bloom_level": _enum_val(bloom),
                })

    return questions


# ============================================================
# BUILD FINAL BENCHMARK
# ============================================================

def build_benchmark(chunks_path: Path, generator: str, target_n: int = 800) -> list[Query]:
    """Combine all sources and produce the final query benchmark."""

    all_raw: list[dict] = []

    # Source A: past papers
    if chunks_path.exists():
        all_raw.extend(extract_from_past_papers(chunks_path))

    # Source B: LLM synthesis
    synth_target = max(0, target_n - len(all_raw))
    if chunks_path.exists():
        all_raw.extend(synthesize_from_chunks(chunks_path, generator, synth_target))

    # Deduplicate and sample to target
    seen = set()
    unique = []
    for q in all_raw:
        key = q["text"][:80].lower()
        if key not in seen:
            seen.add(key)
            unique.append(q)

    random.seed(42)
    if len(unique) > target_n:
        unique = random.sample(unique, target_n)

    # Convert to Query objects
    queries = []
    for i, raw in enumerate(unique):
        try:
            grade = GradeLevel(raw.get("grade", "unknown"))
        except ValueError:
            grade = GradeLevel.UNKNOWN

        try:
            bloom = BloomLevel(raw.get("bloom_level", "unknown"))
        except ValueError:
            bloom = BloomLevel.UNKNOWN

        q = Query(
            query_id=f"q_{i:05d}",
            text=raw["text"],
            subject=raw.get("subject"),
            grade=grade,
            bloom_level=bloom,
            expected_doc_ids=[raw["doc_id"]] if raw.get("doc_id") else [],
        )
        queries.append(q)

    # Save
    out_path = BENCHMARK_DIR / "queries.jsonl"
    write_jsonl(out_path, queries)
    logger.info(f"Saved {len(queries)} queries to {out_path}")

    # Report
    report = {
        "total_queries": len(queries),
        "by_subject": dict(Counter(q.subject for q in queries)),
        "by_grade": dict(Counter(_enum_val(q.grade) for q in queries)),
        "by_bloom": dict(Counter(_enum_val(q.bloom_level) for q in queries)),
        "sources": dict(Counter(r.get("source", "unknown") for r in unique)),
    }
    report_path = BENCHMARK_DIR / "benchmark_report.json"
    report_path.write_text(json.dumps(report, indent=2))
    logger.info(f"Benchmark report → {report_path}")
    logger.info(f"Distribution: {report}")

    return queries


# ============================================================
# MAIN
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Build Paper 1 evaluation benchmark")
    parser.add_argument("--generator", default="groq",
                        choices=["groq", "gemini", "none"],
                        help="LLM generator for question synthesis")
    parser.add_argument("--target-n", type=int, default=800,
                        help="Target number of queries (default: 800)")
    parser.add_argument("--chunks", type=Path,
                        default=PROCESSED_DIR / "documents_reconstructed.jsonl",
                        help="Path to reconstructed documents")
    args = parser.parse_args()

    logger.info(f"Building benchmark with {args.generator} generator, target {args.target_n} queries")

    if not args.chunks.exists():
        logger.error(
            f"Documents not found at {args.chunks}\n"
            "Run: python scripts/export_sqlite_to_pacer.py --mode reconstructed"
        )
        sys.exit(1)

    queries = build_benchmark(args.chunks, args.generator, args.target_n)
    logger.info(f"Done. {len(queries)} queries ready for experiments.")


if __name__ == "__main__":
    main()
