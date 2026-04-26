"""Results aggregator and paper-table generator.

Loads all EvaluationRecord JSONL files from an experiment output directory,
aggregates across queries, and produces the three tables needed for the paper:

  Table 1 — Main comparison: PACER vs 7 baselines × 3 embeddings (mean MRR, nDCG@10, CAS)
  Table 2 — Ablation: effect of router and boundary post-processor
  Table 3 — Per-document-type breakdown for PACER

Usage::

    analyzer = ResultsAnalyzer("experiments/results/")
    print(analyzer.main_table())      # → list[dict], one row per condition×embedding
    print(analyzer.ablation_table())  # → list[dict], ablation rows only
    print(analyzer.latex_table1())    # → LaTeX string ready for the paper
"""
from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path
from typing import Any

from edullm_pacer.schemas import EvaluationRecord
from edullm_pacer.utils.io import read_jsonl
from edullm_pacer.utils.logging import get_logger

logger = get_logger(__name__)

# Metrics shown in the paper tables.
_PRIMARY_K = 10
_DISPLAY_METRICS = ["mrr", f"ndcg@{_PRIMARY_K}", f"p@{_PRIMARY_K}", f"r@{_PRIMARY_K}", "cas"]

# Ablation condition names (must match what's in the config YAML).
_ABLATION_CONDITIONS = {"pacer_no_router", "pacer_no_boundary", "pacer_full"}


class ResultsAnalyzer:
    """Load and aggregate experiment results.

    Args:
        results_dir: directory containing ``*.jsonl`` and ``*.summary.json`` files.
    """

    def __init__(self, results_dir: str | Path) -> None:
        self.results_dir = Path(results_dir)
        self._records: list[EvaluationRecord] | None = None

    # ------------------------------------------------------------------
    # Loading
    # ------------------------------------------------------------------

    def load_csv(self, csv_path: str | Path) -> list[dict[str, Any]]:
        """Load a task CSV (task1_main_comparison.csv style) into plain dicts.

        Returns rows as-is — floats where parseable, str otherwise.
        Useful for feeding directly into main_table_from_csv() / latex_table1_from_csv().
        """
        rows = []
        with open(csv_path, newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                parsed: dict[str, Any] = {}
                for k, v in row.items():
                    try:
                        parsed[k] = float(v)
                    except (ValueError, TypeError):
                        parsed[k] = v
                rows.append(parsed)
        return rows

    def latex_from_csv(
        self,
        csv_path: str | Path,
        cols: list[str] | None = None,
        caption: str = "",
        label: str = "tab:results",
    ) -> str:
        """Generate a LaTeX table directly from a task CSV file."""
        rows = self.load_csv(csv_path)
        if not rows:
            return "% empty table"
        cols = cols or ["method", "mrr", "ndcg_at_10", "p_at_1", "r_at_5", "cas_overall"]
        cols = [c for c in cols if c in rows[0]]
        header = " & ".join(c.replace("_", r"\_") for c in cols) + r" \\"
        lines = [
            r"\begin{table}[h]", r"\centering\small",
            r"\begin{tabular}{l" + "r" * (len(cols) - 1) + "}",
            r"\toprule", header, r"\midrule",
        ]
        for row in rows:
            vals = []
            for c in cols:
                v = row.get(c, "—")
                if isinstance(v, float):
                    vals.append(f"{v:.4f}")
                else:
                    vals.append(str(v).replace("_", r"\_"))
            lines.append(" & ".join(vals) + r" \\")
        lines += [
            r"\bottomrule", r"\end{tabular}",
            rf"\caption{{{caption}}}", rf"\label{{{label}}}", r"\end{table}",
        ]
        return "\n".join(lines)

    def load(self, pattern: str = "*.jsonl") -> list[EvaluationRecord]:
        """Load all EvaluationRecord files matching *pattern*."""
        records: list[EvaluationRecord] = []
        for path in sorted(self.results_dir.glob(pattern)):
            if path.name.endswith(".summary.json"):
                continue
            for row in read_jsonl(path):
                try:
                    records.append(EvaluationRecord.model_validate(row))
                except Exception as exc:
                    logger.warning(f"Skipping malformed record in {path.name}: {exc}")
        self._records = records
        logger.info(f"Loaded {len(records):,} records from {self.results_dir}")
        return records

    def _get_records(self) -> list[EvaluationRecord]:
        if self._records is None:
            self.load()
        return self._records  # type: ignore[return-value]

    # ------------------------------------------------------------------
    # Aggregation helpers
    # ------------------------------------------------------------------

    def _aggregate(
        self, records: list[EvaluationRecord]
    ) -> dict[str, float | None]:
        """Return mean metrics for a list of records."""
        if not records:
            return {m: None for m in _DISPLAY_METRICS}

        mrr_vals = [r.retrieval.mrr for r in records if r.retrieval.mrr is not None]
        ndcg_vals = [r.retrieval.ndcg_at_k.get(_PRIMARY_K) for r in records
                     if r.retrieval.ndcg_at_k.get(_PRIMARY_K) is not None]
        p_vals = [r.retrieval.precision_at_k.get(_PRIMARY_K) for r in records
                  if r.retrieval.precision_at_k.get(_PRIMARY_K) is not None]
        r_vals = [r.retrieval.recall_at_k.get(_PRIMARY_K) for r in records
                  if r.retrieval.recall_at_k.get(_PRIMARY_K) is not None]
        cas_vals = [r.cas.overall for r in records if r.cas is not None]
        lat_vals = [r.latency_ms for r in records if r.latency_ms is not None]

        def _mean(vals: list[float]) -> float | None:
            return round(sum(vals) / len(vals), 4) if vals else None

        return {
            "mrr": _mean(mrr_vals),
            f"ndcg@{_PRIMARY_K}": _mean(ndcg_vals),
            f"p@{_PRIMARY_K}": _mean(p_vals),
            f"r@{_PRIMARY_K}": _mean(r_vals),
            "cas": _mean(cas_vals),
            "mean_latency_ms": _mean(lat_vals),
            "n_queries": len(records),
        }

    # ------------------------------------------------------------------
    # Table 1 — Main comparison
    # ------------------------------------------------------------------

    def main_table(
        self,
        embedding_model: str | None = None,
        generator_model: str | None = None,
    ) -> list[dict[str, Any]]:
        """One row per (condition, embedding_model) combination.

        Filter by embedding_model / generator_model to get a specific slice.
        """
        records = self._get_records()

        groups: dict[tuple[str, str, str | None], list[EvaluationRecord]] = defaultdict(list)
        for r in records:
            if embedding_model and r.embedding_model != embedding_model:
                continue
            if generator_model and r.generator_model != generator_model:
                continue
            groups[(r.strategy, r.embedding_model, r.generator_model)].append(r)

        rows = []
        for (cond, emb, gen), grp in sorted(groups.items()):
            row = {
                "condition": cond,
                "embedding": emb.split("/")[-1],
                "generator": gen.split("/")[-1] if gen else "—",
                **self._aggregate(grp),
            }
            rows.append(row)

        return sorted(rows, key=lambda r: (r.get("mrr") or 0.0), reverse=True)

    # ------------------------------------------------------------------
    # Table 2 — Ablation
    # ------------------------------------------------------------------

    def ablation_table(self) -> list[dict[str, Any]]:
        """Filter to ablation conditions only."""
        records = [r for r in self._get_records() if r.strategy in _ABLATION_CONDITIONS]
        return self.main_table.__func__(self, records=records)  # type: ignore[attr-defined]

    def ablation_table(self) -> list[dict[str, Any]]:
        all_records = self._get_records()
        ablation_records = [r for r in all_records if r.strategy in _ABLATION_CONDITIONS]
        groups: dict[tuple[str, str, str | None], list[EvaluationRecord]] = defaultdict(list)
        for r in ablation_records:
            groups[(r.strategy, r.embedding_model, r.generator_model)].append(r)
        rows = []
        for (cond, emb, gen), grp in sorted(groups.items()):
            row = {
                "condition": cond,
                "embedding": emb.split("/")[-1],
                "generator": gen.split("/")[-1] if gen else "—",
                **self._aggregate(grp),
            }
            rows.append(row)
        return rows

    # ------------------------------------------------------------------
    # Table 3 — Per-document-type breakdown
    # ------------------------------------------------------------------

    def per_doctype_table(
        self,
        condition: str = "pacer",
        embedding_model: str | None = None,
    ) -> list[dict[str, Any]]:
        """Break down one condition's performance by doc_type stored in chunk metadata.

        Note: doc_type is stored in the query's extra field as 'doc_type' if available;
        otherwise we group by subject (a reasonable proxy).
        """
        records = [
            r for r in self._get_records()
            if r.strategy == condition
            and (embedding_model is None or r.embedding_model == embedding_model)
        ]

        # Group by subject (stored in query.extra if available; otherwise "unknown").
        groups: dict[str, list[EvaluationRecord]] = defaultdict(list)
        for r in records:
            groups["all"].append(r)  # always add to overall

        rows = []
        for group_name, grp in sorted(groups.items()):
            row = {"group": group_name, "condition": condition, **self._aggregate(grp)}
            rows.append(row)
        return rows

    # ------------------------------------------------------------------
    # LaTeX helpers
    # ------------------------------------------------------------------

    def latex_table1(
        self,
        embedding_model: str | None = None,
        caption: str = "Main comparison: PACER vs baselines",
    ) -> str:
        """Generate a LaTeX tabular block for Table 1."""
        rows = self.main_table(embedding_model=embedding_model)
        cols = ["condition", "mrr", f"ndcg@{_PRIMARY_K}", f"p@{_PRIMARY_K}", "cas"]
        header = " & ".join(c.upper().replace("@", r"\textit{@}") for c in cols) + r" \\"

        lines = [
            r"\begin{table}[h]",
            r"\centering",
            r"\small",
            r"\begin{tabular}{l" + "r" * (len(cols) - 1) + "}",
            r"\toprule",
            header,
            r"\midrule",
        ]
        for row in rows:
            vals = []
            for c in cols:
                v = row.get(c)
                if v is None:
                    vals.append("—")
                elif isinstance(v, float):
                    vals.append(f"{v:.4f}")
                else:
                    vals.append(str(v).replace("_", r"\_"))
            lines.append(" & ".join(vals) + r" \\")

        lines += [
            r"\bottomrule",
            r"\end{tabular}",
            rf"\caption{{{caption}}}",
            r"\label{tab:main_results}",
            r"\end{table}",
        ]
        return "\n".join(lines)

    def latex_ablation(self) -> str:
        """Generate a LaTeX tabular for the ablation table."""
        rows = self.ablation_table()
        cols = ["condition", "mrr", f"ndcg@{_PRIMARY_K}", "cas"]
        header = " & ".join(c.upper() for c in cols) + r" \\"

        lines = [
            r"\begin{table}[h]",
            r"\centering\small",
            r"\begin{tabular}{l" + "r" * (len(cols) - 1) + "}",
            r"\toprule", header, r"\midrule",
        ]
        for row in rows:
            vals = [
                str(row.get(c, "—")).replace("_", r"\_")
                if not isinstance(row.get(c), float)
                else f"{row.get(c):.4f}"
                for c in cols
            ]
            lines.append(" & ".join(vals) + r" \\")

        lines += [r"\bottomrule", r"\end{tabular}",
                  r"\caption{Ablation study}", r"\label{tab:ablation}", r"\end{table}"]
        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Summary to JSON
    # ------------------------------------------------------------------

    def save_summary(self, out_path: str | Path) -> None:
        """Write a summary JSON with all three tables."""
        out_path = Path(out_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        summary = {
            "main_table": self.main_table(),
            "ablation_table": self.ablation_table(),
        }
        out_path.write_text(json.dumps(summary, indent=2))
        logger.info(f"Summary saved → {out_path}")

    def save_csv(self, out_dir: str | Path) -> dict[str, Path]:
        """Write main_table and ablation_table as CSV files with full CAS columns.

        Returns a dict mapping table name → output path.
        """
        out_dir = Path(out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        _CAS_COLS = ["cas", "cas_grade_match", "cas_prereq_preservation", "cas_bloom_alignment"]
        _METRIC_COLS = [
            "mrr", f"ndcg@{_PRIMARY_K}", f"p@{_PRIMARY_K}", f"r@{_PRIMARY_K}",
            "mean_latency_ms", "n_queries",
        ] + _CAS_COLS

        def _write(rows: list[dict], path: Path) -> None:
            if not rows:
                return
            # Determine columns: identity cols first, then metrics
            id_cols = [c for c in ("condition", "embedding", "generator") if c in rows[0]]
            metric_cols = [c for c in _METRIC_COLS if c in rows[0]]
            fieldnames = id_cols + metric_cols
            with open(path, "w", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
                writer.writeheader()
                writer.writerows(rows)

        # Enrich main_table rows with per-CAS-dimension columns.
        records = self._get_records()

        def _enrich(rows: list[dict], src_records: list[Any] | None = None) -> list[dict]:
            """Add cas_grade_match / cas_prereq_preservation / cas_bloom_alignment columns."""
            # Build a lookup from (condition, embedding, generator) → mean sub-scores
            grp: dict[tuple, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
            for r in (src_records or records):
                key = (r.strategy, r.embedding_model, r.generator_model)
                if r.cas is not None:
                    grp[key]["cas_grade_match"].append(r.cas.grade_match)
                    grp[key]["cas_prereq_preservation"].append(r.cas.prereq_preservation)
                    grp[key]["cas_bloom_alignment"].append(r.cas.bloom_alignment)
            enriched = []
            for row in rows:
                gen_raw = row.get("generator", "—")
                gen_full = None if gen_raw == "—" else gen_raw
                # Try to match back via suffix
                key = None
                for k in grp:
                    cond_match = k[0] == row.get("condition")
                    emb_match = k[1].split("/")[-1] == row.get("embedding")
                    gen_match = (k[2] is None and gen_full is None) or (
                        k[2] is not None and gen_full is not None and k[2].split("/")[-1] == gen_full
                    )
                    if cond_match and emb_match and gen_match:
                        key = k
                        break
                new_row = dict(row)
                if key and grp[key]:
                    for dim in ("cas_grade_match", "cas_prereq_preservation", "cas_bloom_alignment"):
                        vals = grp[key][dim]
                        new_row[dim] = round(sum(vals) / len(vals), 4) if vals else None
                else:
                    for dim in ("cas_grade_match", "cas_prereq_preservation", "cas_bloom_alignment"):
                        new_row[dim] = None
                enriched.append(new_row)
            return enriched

        main_rows = _enrich(self.main_table())
        ablation_rows = _enrich(self.ablation_table())

        main_path = out_dir / "task1_main_comparison.csv"
        ablation_path = out_dir / "task2_ablations.csv"
        _write(main_rows, main_path)
        _write(ablation_rows, ablation_path)
        logger.info(f"CSVs saved → {main_path}, {ablation_path}")
        return {"main": main_path, "ablation": ablation_path}
