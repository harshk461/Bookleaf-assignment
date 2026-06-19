#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Keep DATABASE_URL from caller (e.g. Railway remote seed) — .env must not override it
SAVED_DATABASE_URL="${DATABASE_URL:-}"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [ -n "$SAVED_DATABASE_URL" ]; then
  export DATABASE_URL="$SAVED_DATABASE_URL"
fi

export DATABASE_URL="${DATABASE_URL:-postgresql://bookleaf:bookleaf@localhost:5432/bookleaf}"
export SEED_PASSWORD="${SEED_PASSWORD:-Password123!}"

npx tsx "$ROOT/db/seed/seed.ts"
echo "Seed complete."
