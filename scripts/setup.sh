#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — update OPENAI_API_KEY before using AI features."
fi

npm install
npm install -w apps/backend -w apps/frontend -w packages/shared 2>/dev/null || npm install

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
