#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if command -v docker &>/dev/null && [ -f docker-compose.yml ]; then
  docker compose up --build
else
  echo "Starting services locally (requires Postgres on :5432)..."
  trap 'kill 0' EXIT
  npm run dev:ai &
  npm run dev:backend &
  npm run dev:frontend &
  wait
fi
