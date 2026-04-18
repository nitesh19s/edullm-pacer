# EduLLM

**Educational Localized Language Model Platform with PACER**

Combined repository for the EduLLM research and demo platform.

## Structure

```
edullm/
├── backend/          # Python research pipeline (PACER)
├── frontend/         # JavaScript web application
├── data/             # NCERT corpus, SQLite DB, benchmarks
├── experiments/      # Reproducible experiment configs + results
├── paper/            # Paper 1 manuscript
├── CLAUDE.md         # Instructions for Claude Code
└── README.md         # This file
```

## Quick start

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev,viz]"
PYTHONPATH=src pytest tests/ -v
PYTHONPATH=src uvicorn edullm_pacer.api.server:app --port 8000

# Then open http://localhost:8000/ui
```

## Research

PhD research by Nitesh Sharma, Shoolini University.
Supervisor: Prof. Pankaj Vaidya.
