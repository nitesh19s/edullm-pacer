#!/bin/bash
# EduLLM Platform — start backend + frontend
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Load environment variables
if [ -f "$ROOT/.env" ]; then
    export $(grep -v '^#' "$ROOT/.env" | grep -v '^$' | xargs)
    echo "✅ Loaded .env"
else
    echo "⚠️  No .env file found at $ROOT/.env"
fi

# Kill any existing processes on our ports
echo "🔄 Clearing ports 3000 and 8000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

# Start backend
echo "🚀 Starting backend on http://localhost:8000 ..."
cd "$ROOT/backend"
# Note: to rebuild index use: ./backend/.venv/bin/python scripts/build_index.py --model BAAI/bge-large-en-v1.5
.venv/bin/uvicorn edullm_pacer.api.server:app \
    --host 0.0.0.0 --port 8000 \
    > /tmp/edullm_backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to be ready
echo "⏳ Waiting for backend..."
for i in $(seq 1 30); do
    if curl -s http://localhost:8000/ > /dev/null 2>&1; then
        echo "✅ Backend ready"
        break
    fi
    sleep 1
done

# Start frontend
echo "🌐 Starting frontend on http://localhost:3000 ..."
cd "$ROOT/frontend"
python3 serve.py > /tmp/edullm_frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

sleep 1

# Open browser
open http://localhost:3000

echo ""
echo "======================================"
echo "  EduLLM Platform is running!"
echo "  Frontend : http://localhost:3000"
echo "  Backend  : http://localhost:8000"
echo "======================================"
echo ""
echo "Logs:"
echo "  Backend  → /tmp/edullm_backend.log"
echo "  Frontend → /tmp/edullm_frontend.log"
echo ""
echo "Press Ctrl+C to stop both servers."

# Keep running and forward Ctrl+C to both processes
trap "echo ''; echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
