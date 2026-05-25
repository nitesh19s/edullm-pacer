"""HuggingFace Spaces entry point for EduLLM-PACER.

Serves the FastAPI backend. The frontend static files are mounted at /static
and the main UI is at /.

HF Spaces sets port 7860 by default; uvicorn picks this up via --port $PORT.
"""
import os
import sys

# Add backend src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend", "src"))

from edullm_pacer.api.server import app  # noqa: F401 — re-exported for uvicorn
