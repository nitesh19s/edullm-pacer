#!/usr/bin/env python3
"""
Parallel answer generator — multiple workers, file-locked coordination.

Each worker:
  1. Acquires exclusive lock
  2. Claims the next unanswered, unclaimed question
  3. Releases lock
  4. Generates answer (slow, outside lock — workers run truly in parallel)
  5. Acquires exclusive lock
  6. Re-reads file, writes answer, releases claim
  7. Releases lock

Usage:
  python3 parallel-answers.py          # 4 workers (default)
  python3 parallel-answers.py 2        # 2 workers
  python3 parallel-answers.py report   # show progress
  python3 parallel-answers.py stop     # kill all workers
"""

import json
import sys
import subprocess
import fcntl
import os
import time
import threading
from pathlib import Path

PROGRESS_FILE = Path("ncert_qa_with_answers.json")
SOURCE_FILE   = Path("extracted-qa/all_extracted_questions.json")
LOCK_FILE     = Path(".answers.lock")    # file-system mutex
CLAIM_FILE    = Path(".answers.claims")  # {str(idx): pid}
FAIL_FILE     = Path(".answers.failed")  # {str(idx): fail_count}
MAX_RETRIES   = 3                        # mark question failed after this many timeouts
MODEL         = "llama3:latest"
TIMEOUT       = 90  # seconds per question

# In-process mutex (protects against same-process thread races before flock)
_thread_lock = threading.Lock()


# ── file-system helpers ──────────────────────────────────────────────────────

def _flock_acquire():
    """Open and exclusively lock LOCK_FILE. Returns the open fd."""
    fd = open(LOCK_FILE, "w")
    fcntl.flock(fd, fcntl.LOCK_EX)
    return fd

def _flock_release(fd):
    fcntl.flock(fd, fcntl.LOCK_UN)
    fd.close()


# ── data helpers ─────────────────────────────────────────────────────────────

def load_progress():
    target = PROGRESS_FILE if PROGRESS_FILE.exists() else SOURCE_FILE
    with open(target, "r", encoding="utf-8") as f:
        return json.load(f)

def save_progress(questions):
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)

def load_claims():
    if CLAIM_FILE.exists():
        with open(CLAIM_FILE, "r") as f:
            return json.load(f)
    return {}

def save_claims(claims):
    with open(CLAIM_FILE, "w") as f:
        json.dump(claims, f)

def load_fails():
    if FAIL_FILE.exists():
        with open(FAIL_FILE, "r") as f:
            return json.load(f)
    return {}

def save_fails(fails):
    with open(FAIL_FILE, "w") as f:
        json.dump(fails, f)

def _prune_dead_claims(claims):
    """Remove claims whose process no longer exists."""
    live = {}
    for idx_str, pid in claims.items():
        try:
            os.kill(int(pid), 0)
            live[idx_str] = pid
        except (OSError, ProcessLookupError):
            pass
    return live


# ── coordination ─────────────────────────────────────────────────────────────

def claim_next(worker_pid: int) -> int:
    """
    Atomically find and claim the next unanswered, unclaimed question.
    Returns question index, or -1 if nothing left.
    """
    with _thread_lock:
        fd = _flock_acquire()
        try:
            questions = load_progress()
            claims    = _prune_dead_claims(load_claims())
            claimed   = set(int(k) for k in claims)

            fails = load_fails()
            failed_indices = set(int(k) for k, v in fails.items() if v >= MAX_RETRIES)

            for i, q in enumerate(questions):
                if q.get("output") and len(q["output"]) > 20:
                    continue
                if i in claimed:
                    continue
                if i in failed_indices:
                    continue
                claims[str(i)] = worker_pid
                save_claims(claims)
                return i
            return -1
        finally:
            _flock_release(fd)


def save_answer(idx: int, answer: str, worker_pid: int):
    """
    Atomically: re-read file → write answer → release claim.
    Safe even if other workers saved between our claim and now.
    """
    with _thread_lock:
        fd = _flock_acquire()
        try:
            questions = load_progress()
            questions[idx]["output"] = answer
            questions[idx]["metadata"]["answer_source"] = f"ai_{MODEL}"
            questions[idx]["metadata"]["needs_manual_review"] = True
            save_progress(questions)

            claims = load_claims()
            claims.pop(str(idx), None)
            save_claims(claims)
        finally:
            _flock_release(fd)


def release_claim(idx: int):
    """Release a claim without saving; increment fail counter."""
    with _thread_lock:
        fd = _flock_acquire()
        try:
            claims = load_claims()
            claims.pop(str(idx), None)
            save_claims(claims)

            fails = load_fails()
            fails[str(idx)] = fails.get(str(idx), 0) + 1
            save_fails(fails)
        finally:
            _flock_release(fd)


# ── answer generation ────────────────────────────────────────────────────────

def generate_answer(question: str, subject: str, grade: int, context: str = "") -> str:
    prompt = (
        f"You are an expert NCERT teacher for Indian students.\n\n"
        f"Subject: {subject}\nGrade/Class: {grade}\nQuestion: {question}\n\n"
        f"{f'Context from textbook: {context[:500]}' if context else ''}\n\n"
        f"Provide a clear, detailed, curriculum-aligned answer for NCERT Class {grade} "
        f"students.\nAnswer in 100-300 words, student-friendly language:"
    )
    try:
        result = subprocess.run(
            ["ollama", "run", MODEL, prompt],
            capture_output=True, text=True, timeout=TIMEOUT,
        )
        if result.returncode == 0:
            answer = result.stdout.strip()
            if answer.startswith(("I ", "As an AI")):
                parts = answer.split(". ", 1)
                answer = parts[1] if len(parts) > 1 else answer
            return answer
    except subprocess.TimeoutExpired:
        pass
    except Exception:
        pass
    return ""


# ── worker ───────────────────────────────────────────────────────────────────

def worker(worker_id: int, counters: dict, counter_lock: threading.Lock):
    pid = os.getpid()
    label = f"[W{worker_id}]"

    while True:
        idx = claim_next(pid)
        if idx == -1:
            print(f"{label} No more questions — exiting.", flush=True)
            break

        # Read question details (no lock needed — read-only snapshot)
        questions = load_progress()
        q = questions[idx]
        total = len(questions)

        print(f"{label} Q{idx+1}/{total}: {q['input'][:65]}...", flush=True)

        answer = generate_answer(
            question=q["input"],
            subject=q["metadata"]["subject"],
            grade=q["metadata"]["grade"],
            context=q["metadata"].get("context", ""),
        )

        if answer:
            save_answer(idx, answer, pid)
            with counter_lock:
                counters["done"] += 1
                total_done = counters["done"]
            print(f"{label} ✓ Q{idx+1} saved ({len(answer)} chars) — session total: {total_done}", flush=True)
        else:
            release_claim(idx)
            fails = load_fails()
            count = fails.get(str(idx), 0)
            if count >= MAX_RETRIES:
                print(f"{label} ✗ Q{idx+1} permanently skipped (failed {count}x)", flush=True)
            else:
                print(f"{label} ✗ Q{idx+1} skipped (attempt {count}/{MAX_RETRIES})", flush=True)


# ── report ───────────────────────────────────────────────────────────────────

def report():
    questions = load_progress()
    total     = len(questions)
    answered  = sum(1 for q in questions if q.get("output") and len(q["output"]) > 20)
    by_subj   = {}
    for q in questions:
        s = q["metadata"]["subject"]
        by_subj.setdefault(s, {"total": 0, "done": 0})
        by_subj[s]["total"] += 1
        if q.get("output") and len(q["output"]) > 20:
            by_subj[s]["done"] += 1

    fails   = load_fails()
    failed  = sum(1 for v in fails.values() if v >= MAX_RETRIES)

    print(f"\n📊 Answer Generation Progress")
    print("=" * 50)
    print(f"Total    : {total}")
    print(f"Answered : {answered}  ({answered/total*100:.1f}%)")
    print(f"Failed   : {failed}  (gave up after {MAX_RETRIES} timeouts)")
    print(f"Remaining: {total - answered - failed}")
    print("\nBy Subject:")
    for s, v in by_subj.items():
        pct = v["done"] / v["total"] * 100 if v["total"] else 0
        bar = "█" * int(pct / 5) + "░" * (20 - int(pct / 5))
        print(f"  {s:20s}: {v['done']:4d}/{v['total']}  [{bar}] {pct:.1f}%")
    print()


# ── main ─────────────────────────────────────────────────────────────────────

def run(num_workers: int):
    LOCK_FILE.touch(exist_ok=True)

    questions = load_progress()
    total     = len(questions)
    answered  = sum(1 for q in questions if q.get("output") and len(q["output"]) > 20)

    print(f"📚 {total} questions | {answered} answered | {total - answered} remaining")
    print(f"🚀 Launching {num_workers} parallel workers (model: {MODEL})\n")

    counters     = {"done": 0}
    counter_lock = threading.Lock()

    threads = [
        threading.Thread(target=worker, args=(i + 1, counters, counter_lock), daemon=True)
        for i in range(num_workers)
    ]

    try:
        for t in threads:
            t.start()
        for t in threads:
            t.join()
    except KeyboardInterrupt:
        print(f"\n⚠️  Interrupted — {counters['done']} answers saved this session.")
        sys.exit(0)

    print(f"\n🎉 Done! Generated {counters['done']} new answers this session.")


if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else ""

    if arg == "report":
        report()
    elif arg == "stop":
        os.system("pkill -f parallel-answers.py")
    elif arg.isdigit():
        run(int(arg))
    else:
        run(4)
