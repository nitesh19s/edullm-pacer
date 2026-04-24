"""Lightweight I/O helpers. JSONL is the canonical format for the project."""
from __future__ import annotations

import json
from collections.abc import Iterable, Iterator
from pathlib import Path
from typing import TypeVar

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


def read_jsonl(path: str | Path) -> Iterator[dict]:
    """Yield one dict per line. Skips blank lines."""
    path = Path(path)
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                yield json.loads(line)


def read_jsonl_as(path: str | Path, model: type[T]) -> Iterator[T]:
    """Yield one Pydantic instance per line."""
    for obj in read_jsonl(path):
        yield model.model_validate(obj)


def write_jsonl(path: str | Path, items: Iterable[dict | BaseModel]) -> int:
    """Write an iterable of dicts or Pydantic models as JSONL. Returns count written."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with path.open("w", encoding="utf-8") as f:
        for item in items:
            payload = item.model_dump(mode="json") if isinstance(item, BaseModel) else item
            f.write(json.dumps(payload, ensure_ascii=False) + "\n")
            count += 1
    return count


def append_jsonl(path: str | Path, item: dict | BaseModel) -> None:
    """Append a single record. Creates the file if missing."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = item.model_dump(mode="json") if isinstance(item, BaseModel) else item
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")
