#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — set GEMINI_API_KEY before using AI features."
fi

npm install
npm install -w apps/backend -w apps/frontend -w packages/shared 2>/dev/null || npm install

echo "Setting up AI service Python venv..."
AI_VENV="apps/ai-service/.venv"
PYTHON=""
for candidate in python3.12 python3.11 python3; do
  if command -v "$candidate" &>/dev/null; then
    PYTHON="$candidate"
    break
  fi
done
if [ -z "$PYTHON" ]; then
  echo "Warning: python3 not found — skip AI venv setup"
else
  if [ ! -d "$AI_VENV" ]; then
    "$PYTHON" -m venv "$AI_VENV"
  fi
  "$AI_VENV/bin/pip" install -q -r apps/ai-service/requirements.txt
  echo "AI service venv ready ($("$PYTHON" --version))."
fi

if ! docker compose ps postgres 2>/dev/null | grep -q "running"; then
  if command -v docker &>/dev/null; then
    echo "Starting Postgres via Docker..."
    docker compose up postgres -d
    sleep 3
  else
    echo "Note: ensure Postgres is running on localhost:5432 before migrations."
  fi
fi

echo "Running migrations..."
bash scripts/migrate.sh

echo "Seeding database..."
bash scripts/seed.sh

echo "Setup complete. Run: npm run dev"
