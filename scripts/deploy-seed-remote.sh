#!/usr/bin/env bash
# Run migrations + seed against a remote DATABASE_URL (e.g. Railway Postgres)
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Usage: DATABASE_URL=postgresql://... bash scripts/deploy-seed-remote.sh"
  echo ""
  echo "Railway public URL example (add ?sslmode=require):"
  echo '  DATABASE_URL="postgresql://postgres:PASS@HOST:PORT/railway?sslmode=require" bash scripts/deploy-seed-remote.sh'
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Target: ${DATABASE_URL%%@*}@***"
echo "Migrating remote database..."
bash scripts/migrate.sh

echo "Seeding remote database..."
bash scripts/seed.sh

echo "Remote database ready."
