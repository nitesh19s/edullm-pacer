"""Central configuration for the PACER project.

Loads settings from environment variables and .env file.
Access via `from edullm_pacer.config import settings`.
"""
from __future__ import annotations

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration. Values loaded from env vars or .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- API keys ---
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    google_api_key: str | None = None
    groq_api_key: str | None = None
    together_api_key: str | None = None
    hf_token: str | None = None

    # --- Experiment tracking ---
    wandb_api_key: str | None = None
    wandb_project: str = "edullm-pacer"
    wandb_entity: str | None = None

    # --- Paths ---
    data_dir: Path = Field(default=Path("./data"))
    cache_dir: Path = Field(default=Path("./.cache"))

    # --- Defaults ---
    default_embedding_model: str = "BAAI/bge-large-en-v1.5"
    default_generator: str = "meta-llama/Llama-3.1-8B-Instruct"
    log_level: str = "INFO"

    # --- Derived paths ---
    @property
    def raw_dir(self) -> Path:
        return self.data_dir / "raw"

    @property
    def processed_dir(self) -> Path:
        return self.data_dir / "processed"

    @property
    def benchmark_dir(self) -> Path:
        return self.data_dir / "benchmark"

    @property
    def labels_dir(self) -> Path:
        return self.data_dir / "labels"


settings = Settings()
