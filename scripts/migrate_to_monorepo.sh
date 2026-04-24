#!/bin/bash
# ============================================================
# migrate_to_monorepo.sh
#
# Combines:
#   /Users/nitesh/edullm-platform   (JS frontend + data)
#   edullm-pacer.zip                (Python backend, from Claude)
#
# Into:
#   /Users/nitesh/edullm/           (monorepo)
#
# Usage:
#   cd /Users/nitesh
#   chmod +x migrate_to_monorepo.sh
#   ./migrate_to_monorepo.sh
#
# After running, verify with:
#   cd edullm
#   cd backend && pip install -e ".[dev,viz]" && PYTHONPATH=src pytest tests/ -v
# ============================================================

set -euo pipefail

PLATFORM_DIR="$HOME/edullm-platform"
MONOREPO="$HOME/edullm"

echo "=== EduLLM Monorepo Migration ==="
echo "Source (JS):     $PLATFORM_DIR"
echo "Target:          $MONOREPO"
echo ""

# Safety check
if [ ! -d "$PLATFORM_DIR" ]; then
    echo "ERROR: $PLATFORM_DIR not found"
    exit 1
fi

if [ -d "$MONOREPO" ]; then
    echo "WARNING: $MONOREPO already exists."
    read -p "Delete and recreate? (y/N) " confirm
    if [ "$confirm" != "y" ]; then
        echo "Aborted."
        exit 0
    fi
    rm -rf "$MONOREPO"
fi

# ============================================================
# 1. Create directory structure
# ============================================================
echo ">>> Creating directory structure..."
mkdir -p "$MONOREPO"/{backend,frontend,data/{raw,processed,db,benchmark,labels},experiments/{configs,results,logs},paper/{sections,figures,tables,refs},scripts,notebooks}

# ============================================================
# 2. Copy the Python backend (from the extracted zip)
# ============================================================
echo ">>> Setting up Python backend..."

# Check if pacer zip has been extracted
PACER_SRC=""
if [ -d "$HOME/edullm-pacer" ]; then
    PACER_SRC="$HOME/edullm-pacer"
elif [ -f "$HOME/Downloads/edullm-pacer.zip" ]; then
    echo "    Extracting edullm-pacer.zip..."
    cd "$HOME" && unzip -qo "$HOME/Downloads/edullm-pacer.zip"
    PACER_SRC="$HOME/edullm-pacer"
else
    echo "WARNING: edullm-pacer not found at ~/edullm-pacer or ~/Downloads/edullm-pacer.zip"
    echo "         Download it from the Claude conversation and extract it first."
    echo "         Continuing with empty backend..."
    mkdir -p "$MONOREPO/backend/src/edullm_pacer"
fi

if [ -n "$PACER_SRC" ]; then
    # Copy Python source
    cp -r "$PACER_SRC/src" "$MONOREPO/backend/"
    cp -r "$PACER_SRC/tests" "$MONOREPO/backend/"
    cp "$PACER_SRC/pyproject.toml" "$MONOREPO/backend/"

    # Copy config files to monorepo root
    cp "$PACER_SRC/.gitignore" "$MONOREPO/"
    cp "$PACER_SRC/.env.example" "$MONOREPO/"
    cp "$PACER_SRC/LICENSE" "$MONOREPO/"
    [ -f "$PACER_SRC/.pre-commit-config.yaml" ] && cp "$PACER_SRC/.pre-commit-config.yaml" "$MONOREPO/"

    # Copy CI
    mkdir -p "$MONOREPO/.github/workflows"
    [ -f "$PACER_SRC/.github/workflows/ci.yml" ] && cp "$PACER_SRC/.github/workflows/ci.yml" "$MONOREPO/.github/workflows/"
fi

# ============================================================
# 3. Copy the JS frontend
# ============================================================
echo ">>> Copying JS frontend..."

# Core app files
for f in index.html rag-orchestrator.js database.js database-init.js \
         curriculum-gap-analyzer.js progression-tracker.js \
         gap-cross-subject-visualizations.js performance-monitor.js \
         error-logger.js translations.js enhanced-pdf-processor.js \
         contrast.css database-management.css; do
    [ -f "$PLATFORM_DIR/$f" ] && cp "$PLATFORM_DIR/$f" "$MONOREPO/frontend/"
done

# Test/debug files
for f in debug-phase2.html test-local-rag.js test-upgrades.js \
         mobile-features-test.html check-upload-history.html \
         fix-and-index-now.js; do
    [ -f "$PLATFORM_DIR/$f" ] && cp "$PLATFORM_DIR/$f" "$MONOREPO/frontend/"
done

# ============================================================
# 4. Copy data
# ============================================================
echo ">>> Copying data..."

# NCERT PDFs
if [ -d "$PLATFORM_DIR/ncert-pdfs" ]; then
    cp -r "$PLATFORM_DIR/ncert-pdfs" "$MONOREPO/data/raw/"
    echo "    Copied NCERT PDFs"
fi

# SQLite database
for db_file in edullm-database.db edullm-database.db-wal edullm-database.db-shm; do
    [ -f "$PLATFORM_DIR/$db_file" ] && cp "$PLATFORM_DIR/$db_file" "$MONOREPO/data/db/"
done
echo "    Copied SQLite database"

# ============================================================
# 5. Copy documentation
# ============================================================
echo ">>> Copying documentation..."
mkdir -p "$MONOREPO/docs/platform-guides"
for f in "$PLATFORM_DIR"/*.md; do
    [ -f "$f" ] && cp "$f" "$MONOREPO/docs/platform-guides/"
done

# ============================================================
# 6. Copy CLAUDE.md to root
# ============================================================
echo ">>> Writing CLAUDE.md..."
# This will be overwritten by the CLAUDE.md from the Claude conversation.
# For now, create a placeholder if the real one isn't available.
if [ ! -f "$MONOREPO/CLAUDE.md" ]; then
    echo "# See the Claude conversation for the full CLAUDE.md" > "$MONOREPO/CLAUDE.md"
fi

# ============================================================
# 7. Create root README
# ============================================================
echo ">>> Writing root README..."
cat > "$MONOREPO/README.md" << 'READMEEOF'
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
READMEEOF

# ============================================================
# 8. Initialize git
# ============================================================
echo ">>> Initializing git..."
cd "$MONOREPO"
git init -q
git add .
git commit -q -m "Monorepo: combine edullm-platform + edullm-pacer

- backend/: Python PACER pipeline (5 chunkers, FAISS+BM25 retrieval, FastAPI)
- frontend/: JS web app (chat, gap analyzer, progression tracker)
- data/: 8,661 NCERT chunks in SQLite + 59 raw PDFs
- CLAUDE.md: full context for Claude Code continuation"

echo ""
echo "=== Migration complete ==="
echo ""
echo "Next steps:"
echo "  1. cd $MONOREPO"
echo "  2. Download CLAUDE.md from the Claude conversation and replace the placeholder"
echo "  3. cd backend && python -m venv .venv && source .venv/bin/activate"
echo "  4. pip install -e '.[dev,viz]'"
echo "  5. PYTHONPATH=src pytest tests/ -v"
echo "  6. Start Claude Code: claude"
echo ""
echo "File count:"
find . -type f -not -path '*/.git/*' | wc -l
echo ""
echo "Directory size:"
du -sh . --exclude=.git 2>/dev/null || du -sh .
