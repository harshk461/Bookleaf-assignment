#!/usr/bin/env bash
# Deploy BookLeaf to Railway (interactive — requires `railway login` once)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RAILWAY="npx --yes @railway/cli@latest"

echo "==> BookLeaf Railway Deploy"
echo ""

if ! $RAILWAY whoami >/dev/null 2>&1; then
  echo "Not logged in to Railway. Run:"
  echo "  npx @railway/cli login"
  echo "Then re-run: bash scripts/deploy-railway.sh"
  exit 1
fi

echo "Logged in as: $($RAILWAY whoami)"
echo ""
echo "This script guides deployment. Railway multi-service monorepos are"
echo "configured in the dashboard (one service per app + Postgres)."
echo ""
echo "Follow these steps in Railway (https://railway.app):"
echo ""
echo "1. New Project → Deploy from GitHub → harshk461/Bookleaf-assignment"
echo ""
echo "2. Add PostgreSQL (Database → PostgreSQL)"
echo ""
echo "3. Add service: ai-service"
echo "   - Root Directory: / (repo root)"
echo "   - Config file: apps/ai-service/railway.toml"
echo "   - NO public domain (internal only)"
echo "   - Variables (IMPORTANT — Railway does NOT auto-read .env.example):"
echo "       Option A: Dashboard → ai-service → Variables → RAW Editor"
echo "                 Paste contents of deploy/railway.ai-service.env"
echo "                 Replace GEMINI_API_KEY, then Deploy"
echo "       Option B: GEMINI_API_KEY=AIza... bash scripts/railway-set-ai-env.sh"
echo "       Delete old OPENAI_API_KEY / OPENAI_MODEL if still on this service"
echo ""
echo "4. Add service: backend"
echo "   - Root Directory: / (repo root)"
echo "   - Config file: apps/backend/railway.toml"
echo "   - OR set variable: RAILWAY_DOCKERFILE_PATH=apps/backend/Dockerfile"
echo "   - Generate public domain"
echo "   - Variables: DATABASE_URL=\${{Postgres.DATABASE_URL}}, etc."
echo ""
echo "5. Add service: frontend"
echo "   - Root Directory: / (repo root)"
echo "   - Config file: apps/frontend/railway.toml"
echo "   - Variable (build-time): NEXT_PUBLIC_API_URL=https://<backend-domain>"
echo "   - Generate public domain → this is your demo URL"
echo ""
echo "6. Seed production database (from your laptop):"
echo "   export DATABASE_URL=\"<railway-postgres-url>\""
echo "   bash scripts/migrate.sh && bash scripts/seed.sh"
echo ""
echo "7. Verify:"
echo "   curl https://<backend-domain>/health"
echo "   open https://<frontend-domain>/login"
echo ""

read -r -p "Push latest code to GitHub before deploy? [y/N] " PUSH
if [[ "${PUSH,,}" == "y" ]]; then
  git push origin main
  echo "Pushed. Railway will auto-deploy if GitHub integration is connected."
fi

echo ""
echo "Done. See deploy/railway.env.example for all environment variables."
