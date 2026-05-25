FROM python:3.11-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/src/ ./backend/src/
COPY backend/pyproject.toml ./backend/

# Copy frontend static files into the API static directory
COPY frontend/ ./backend/src/edullm_pacer/api/static/

# Copy corpus data (pre-built JSONL — committed to repo or downloaded at build time)
COPY data/processed/ ./data/processed/

# Copy entrypoint
COPY app.py .

# HuggingFace Spaces uses port 7860
ENV PORT=7860
ENV EDULLM_INDEX_DIR=/app/data/index
ENV EDULLM_CORPUS_JSONL=/app/data/processed/documents_reconstructed.jsonl
ENV EDULLM_EMBEDDER_MODEL=BAAI/bge-large-en-v1.5

EXPOSE 7860

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
