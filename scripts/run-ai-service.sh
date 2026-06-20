#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AI_DIR="$ROOT/apps/ai-service"
VENV="$AI_DIR/.venv"

pick_python() {
  for candidate in python3.12 python3.11 python3; do
    if command -v "$candidate" &>/dev/null; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

if ! PYTHON=$(pick_python); then
  echo "python3 is required for the AI service. Install Python 3.11+ and retry."
  exit 1
fi

if [ ! -d "$VENV" ]; then
  echo "Creating Python venv at apps/ai-service/.venv ($($PYTHON --version))..."
  "$PYTHON" -m venv "$VENV"
fi

if [ ! -x "$VENV/bin/uvicorn" ]; then
  echo "Installing AI service dependencies..."
  "$VENV/bin/pip" install -q -r "$AI_DIR/requirements.txt"
fi

load_env() {
  if [ -f "$ROOT/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    source "$ROOT/.env"
    set +a
  fi
  if [ -f "$AI_DIR/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    source "$AI_DIR/.env"
    set +a
  fi
}

load_env
cd "$AI_DIR"

# Root .env sets PORT=4000 for backend — never bind AI service to that port.
export PORT="${AI_SERVICE_PORT:-8000}"

echo "Starting AI service on http://localhost:${PORT}"
exec "$VENV/bin/uvicorn" app.main:app --reload --host 0.0.0.0 --port "$PORT"
