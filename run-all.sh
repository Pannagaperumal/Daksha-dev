#!/usr/bin/env bash
# Start Chroma, the Django backend, the rag-backend app-server (+ LangGraph
# dev server for Studio) and the frontend together. Ctrl+C stops them all.
set -euo pipefail
set -m   # each background job gets its own process group, so we can kill whole trees

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAG_PORT="${RAG_PORT:-2100}"          # app-server; must match NEXT_PUBLIC_RAG_URL / RAG_APP_SERVER_URL
LANGGRAPH_PORT="${LANGGRAPH_PORT:-2024}"  # langgraph dev server, only used by LangGraph Studio
CHROMA_CONTAINER="${CHROMA_CONTAINER:-daksha-chroma}"

pids=()
cleanup() {
  echo -e "\nStopping services..."
  for pid in "${pids[@]}"; do
    kill -TERM -- -"$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup EXIT
trap "exit 130" INT TERM

# Prefix each line of a service's output with its name.
start() {
  local name="$1" dir="$2"; shift 2
  (cd "$dir" && "$@" 2>&1 | sed -u "s/^/[$name] /") &
  pids+=("$!")
}

# --- Django backend setup ---
if [ ! -x "$ROOT/backend/.venv/bin/python" ]; then
  echo "[backend] creating virtualenv..."
  python3 -m venv "$ROOT/backend/.venv"
fi
"$ROOT/backend/.venv/bin/pip" install -q -r "$ROOT/backend/requirements.txt"
"$ROOT/backend/.venv/bin/python" "$ROOT/backend/manage.py" migrate --noinput

# --- Node dependencies ---
[ -d "$ROOT/rag-backend/node_modules" ] || (cd "$ROOT/rag-backend" && npm install --legacy-peer-deps)
[ -d "$ROOT/frontend/node_modules" ]    || (cd "$ROOT/frontend" && npm install)

[ -f "$ROOT/rag-backend/.env" ] || echo "[rag] warning: rag-backend/.env missing (copy .env.example and fill in keys)"
[ -f "$ROOT/frontend/.env.local" ] || cp "$ROOT/frontend/.env.local.example" "$ROOT/frontend/.env.local"

# --- Chroma vector store (localhost:8200) ---
if docker inspect "$CHROMA_CONTAINER" >/dev/null 2>&1; then
  docker start "$CHROMA_CONTAINER" >/dev/null
else
  docker run -d --name "$CHROMA_CONTAINER" -p 8200:8000 chromadb/chroma:latest >/dev/null
fi
echo "[chroma] running ($CHROMA_CONTAINER on :8200)"

# --- Launch ---
start backend  "$ROOT/backend"     .venv/bin/python manage.py runserver 0.0.0.0:8000
start rag      "$ROOT/rag-backend" env APP_SERVER_PORT="$RAG_PORT" npx tsx src/app-server.ts
start langgraph "$ROOT/rag-backend" npx @langchain/langgraph-cli dev --port "$LANGGRAPH_PORT" --no-browser
start frontend "$ROOT/frontend"    npm run dev

echo
echo "  Backend:  http://localhost:8000/swagger/"
echo "  RAG:      http://localhost:$RAG_PORT/health"
echo "  Studio:   https://smith.langchain.com/studio?baseUrl=http://localhost:$LANGGRAPH_PORT"
echo "  Frontend: http://localhost:3000"
echo "  Press Ctrl+C to stop everything."
echo

wait -n "${pids[@]}"
echo "A service exited; shutting down the rest."
