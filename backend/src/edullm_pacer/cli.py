"""Top-level CLI. Exposes every major operation under `edullm <command>`.

Install the package (`pip install -e .`) and then run:
    edullm --help
    edullm manifest --raw-dir data/raw
    edullm chunk --strategy fixed --doc data/processed/sample.json
"""
from __future__ import annotations

from pathlib import Path

import typer
from rich.console import Console
from rich.table import Table

from edullm_pacer import __version__
from edullm_pacer.chunkers import available_strategies, get_chunker
from edullm_pacer.data.build_manifest import build_manifest
from edullm_pacer.data.ingest import ingest as run_ingest
from edullm_pacer.schemas import ChunkingStrategy, Document, DocumentMetadata
from edullm_pacer.utils.logging import get_logger

app = typer.Typer(
    help="EduLLM-PACER command-line interface.",
    add_completion=False,
    no_args_is_help=True,
)
console = Console()
logger = get_logger(__name__)


@app.command()
def version() -> None:
    """Print the installed version."""
    console.print(f"edullm-pacer [bold cyan]{__version__}[/]")


@app.command()
def manifest(
    raw_dir: Path = typer.Option(Path("data/raw"), "--raw-dir"),
    out_dir: Path = typer.Option(Path("data/processed"), "--out-dir"),
) -> None:
    """Build the manifest CSV/JSONL over raw documents."""
    build_manifest(raw_dir, out_dir)


@app.command()
def ingest(
    raw_dir: Path = typer.Option(Path("data/raw"), "--raw-dir"),
    out_dir: Path = typer.Option(Path("data/processed"), "--out-dir"),
) -> None:
    """Convert raw files into canonical documents.jsonl using the manifest."""
    run_ingest(raw_dir, out_dir)


@app.command()
def chunkers() -> None:
    """List all registered chunking strategies."""
    table = Table(title="Registered chunking strategies")
    table.add_column("Name", style="cyan")
    table.add_column("Enum value")
    for s in available_strategies():
        table.add_row(s.name, s.value)
    console.print(table)


@app.command()
def chunk(
    strategy: str = typer.Option("fixed", "--strategy", "-s"),
    text: str = typer.Option(..., "--text", "-t", help="Text to chunk"),
    chunk_size: int = typer.Option(512, "--size"),
    chunk_overlap: int = typer.Option(64, "--overlap"),
) -> None:
    """Quick smoke-test: chunk an ad-hoc string with the given strategy."""
    try:
        chunker = get_chunker(
            ChunkingStrategy(strategy), chunk_size=chunk_size, chunk_overlap=chunk_overlap,
        )
    except KeyError as e:
        console.print(f"[red]Error:[/] {e}")
        raise typer.Exit(code=1) from e

    doc = Document(doc_id="cli_demo", text=text, metadata=DocumentMetadata())
    chunks = chunker.chunk(doc)

    console.print(f"[bold green]{len(chunks)}[/] chunks produced by {chunker}")
    for c in chunks[:5]:
        preview = c.text.replace("\n", " ")[:120]
        console.print(f"  [cyan]{c.chunk_id}[/]  tokens={c.metadata.token_count}  {preview!r}")
    if len(chunks) > 5:
        console.print(f"  ... and {len(chunks) - 5} more")


@app.command()
def benchmark(
    db_path: Path = typer.Option(Path("data/db/edullm-database.db"), "--db"),
    out_path: Path = typer.Option(Path("data/processed/benchmark.jsonl"), "--out"),
    target_n: int = typer.Option(900, "--n", help="Target number of queries"),
    seed: int = typer.Option(42, "--seed"),
) -> None:
    """Build the evaluation benchmark from the NCERT SQLite corpus."""
    from edullm_pacer.benchmark import BenchmarkDatasetBuilder
    import json

    builder = BenchmarkDatasetBuilder(db_path=db_path, seed=seed)
    queries = builder.build(target_n=target_n)
    builder.save(queries, out_path)

    stats = builder.stats(queries)
    table = Table(title=f"Benchmark — {stats['total']} queries → {out_path}")
    table.add_column("Axis")
    table.add_column("Breakdown")
    table.add_row("Subject", json.dumps(stats["by_subject"], indent=None))
    table.add_row("Grade level", json.dumps(stats["by_grade_level"], indent=None))
    table.add_row("Bloom level", json.dumps(stats["by_bloom_level"], indent=None))
    console.print(table)


if __name__ == "__main__":
    app()
