# BookLeaf Author Support Portal

Monorepo for the BookLeaf Author Support & Communication Portal assignment.

## Architecture

```
apps/frontend  →  Next.js 15 (Author + Admin portals)
apps/backend   →  Fastify REST API + SSE
apps/ai-service → FastAPI + OpenAI (internal only)
db/            → PostgreSQL migrations + seed
packages/shared → Shared TypeScript types & API paths
```

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16 (or Docker)
- Python 3.12+ (for AI service)
- Docker (recommended for local Postgres)

### Setup

```bash
cp .env.example .env
# Edit .env — set OPENAI_API_KEY in ai-service usage only

# Start Postgres (Docker)
docker compose up postgres -d

# Install & seed
bash scripts/setup.sh

# Run all services
bash scripts/dev.sh
```

### Manual dev (without Docker for apps)

```bash
# Terminal 1 — AI service
cd apps/ai-service && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000

# Terminal 2 — Backend
npm run dev:backend

# Terminal 3 — Frontend
npm run dev:frontend
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- AI service (internal): http://localhost:8000

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Author | `priya.sharma@email.com` (any seeded author email) | `Password123!` |
| Admin | `admin@bookleaf.com` | `Password123!` |

## Folder Structure

See [FOLDER_STRUCTURE_PRD.md](./FOLDER_STRUCTURE_PRD.md) and [docs/FOLDER_STRUCTURE_PRD.md](./docs/FOLDER_STRUCTURE_PRD.md).

### Frontend (Next.js 15 App Router)

| Route | View component (`src/views/`) |
|-------|-------------------------------|
| `/login` | `src/views/auth/LoginPage.tsx` |
| `/author/books` | `src/views/author/MyBooksPage.tsx` |
| `/author/tickets/new` | `src/views/author/SubmitTicketPage.tsx` |
| `/author/tickets` | `src/views/author/MyTicketsPage.tsx` |
| `/admin/tickets` | `src/views/admin/TicketQueuePage.tsx` |
| `/admin/tickets/[id]` | `src/views/admin/TicketDetailPage.tsx` |

> **Note:** PRD uses `src/pages/` for Vite; with Next.js 15, screen components live in `src/views/` to avoid conflicting with the Pages Router.

## API Overview

Base URL: `http://localhost:4000`

| Method | Endpoint | Role |
|--------|----------|------|
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Auth |
| GET | `/api/author/books` | Author |
| GET/POST | `/api/author/tickets` | Author |
| GET | `/api/author/tickets/stream` | Author (SSE) |
| GET/PATCH | `/api/admin/tickets/:id` | Admin |
| POST | `/api/admin/tickets/:id/responses` | Admin |
| POST | `/api/admin/tickets/:id/notes` | Admin |

Full spec: [docs/api/openapi.yaml](./docs/api/openapi.yaml)

## AI Strategy

- `OPENAI_API_KEY` lives **only** in `apps/ai-service`
- Backend proxies classify/draft requests to AI service
- Fallback defaults on AI failure: `general_inquiry` / `medium`
- Model: `gpt-4o-mini` with daily spend cap

## Deployment (Railway)

Production configs are in `apps/*/railway.toml` and `deploy/railway.env.example`.

```bash
# 1. Log in once (opens browser)
npx @railway/cli login

# 2. Follow the guided checklist
bash scripts/deploy-railway.sh

# 3. After Postgres is up, seed the remote DB from your machine
DATABASE_URL="postgresql://..." bash scripts/deploy-seed-remote.sh
```

**Important for this monorepo:** backend and frontend Dockerfiles need the **repo root** as the Railway service root directory (not `apps/backend`). Set `RAILWAY_DOCKERFILE_PATH=apps/backend/Dockerfile` if not using the per-app `railway.toml`.

**Live demo URLs** — add after deploy:

| | URL |
|---|-----|
| App | _pending_ |
| API | _pending_ |

Full guide: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## Related Docs

- [ASSIGNMENT_FINDINGS.md](./ASSIGNMENT_FINDINGS.md)
- [DB_DESIGN.md](./DB_DESIGN.md)
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- [WRITEUP.md](./WRITEUP.md)
