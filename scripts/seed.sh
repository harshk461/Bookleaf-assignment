#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

export DATABASE_URL="${DATABASE_URL:-postgresql://bookleaf:bookleaf@localhost:5432/bookleaf}"
export SEED_PASSWORD="${SEED_PASSWORD:-Password123!}"

npx tsx "$ROOT/db/seed/seed.ts"
echo "Seed complete."
