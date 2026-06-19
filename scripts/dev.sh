#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

start_postgres() {
  if command -v docker &>/dev/null && [ -f docker-compose.yml ]; then
    if ! docker compose ps postgres 2>/dev/null | grep -q "running"; then
      echo "Starting Postgres via Docker..."
      docker compose up postgres -d
      sleep 2
    fi
  else
    echo "Note: ensure Postgres is running on localhost:5432"
  fi
}

load_env() {
  if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
  fi
}

run_local() {
  echo "Starting services locally with hot reload (Ctrl+C to stop all)..."
  start_postgres
  load_env
  trap 'kill 0' EXIT
  npm run dev:ai &
  npm run dev:backend &
  npm run dev:frontend &
  wait
}

run_docker() {
  echo "Starting full stack in Docker (rebuilds images on change)..."
  docker compose up --build
}

case "${1:-local}" in
  local|--local)
    run_local
    ;;
  docker|--docker)
    run_docker
    ;;
  *)
    echo "Usage: dev.sh [local|docker] (default: local)"
    exit 1
    ;;
esac
