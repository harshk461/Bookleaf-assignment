#!/usr/bin/env bash
# Set Gemini env vars on the linked Railway ai-service.
# Usage:
#   GEMINI_API_KEY=AIza... bash scripts/railway-set-ai-env.sh
# Or link first:  cd apps/ai-service && npx @railway/cli link
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RAILWAY="npx --yes @railway/cli@latest"

if ! $RAILWAY whoami >/dev/null 2>&1; then
  echo "Not logged in. Run: npx @railway/cli login"
  exit 1
fi

if [ -z "${GEMINI_API_KEY:-}" ]; then
  echo "Error: GEMINI_API_KEY is not set."
  echo "Usage: GEMINI_API_KEY=AIza... bash scripts/railway-set-ai-env.sh"
  exit 1
fi

GEMINI_MODEL="${GEMINI_MODEL:-gemini-flash-latest}"
MAX_DAILY_SPEND_USD="${MAX_DAILY_SPEND_USD:-5.00}"
AI_SPEND_TRACKER_PATH="${AI_SPEND_TRACKER_PATH:-/tmp/ai_daily_spend.json}"

echo "Setting ai-service variables on Railway..."
$RAILWAY variables --service ai-service \
  --set "PORT=8000" \
  --set "GEMINI_API_KEY=${GEMINI_API_KEY}" \
  --set "GEMINI_MODEL=${GEMINI_MODEL}" \
  --set "MAX_DAILY_SPEND_USD=${MAX_DAILY_SPEND_USD}" \
  --set "AI_SPEND_TRACKER_PATH=${AI_SPEND_TRACKER_PATH}"

echo ""
echo "Done. Remove legacy OPENAI_API_KEY / OPENAI_MODEL from ai-service if still present:"
echo "  Railway dashboard → ai-service → Variables → delete OPENAI_*"
echo ""
echo "Redeploy ai-service after variables are staged."
