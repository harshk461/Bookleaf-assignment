# BookLeaf Author Support Portal

Monorepo for the BookLeaf Author Support & Communication Portal assignment.

## Architecture

```
apps/frontend  →  Next.js 15 (Author + Admin portals)
apps/backend   →  Fastify REST API + SSE
apps/ai-service → FastAPI + Google Gemini (internal only)
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
# Edit .env — set GEMINI_API_KEY (see AI Strategy below)

# Start Postgres (Docker)
docker compose up postgres -d

# Install & seed
bash scripts/setup.sh

# Run all services locally (hot reload — no Docker rebuilds)
npm run dev
```

Uses Docker **only for Postgres** if it is not already running. App code runs natively with hot reload.

### Docker full stack (production-like)

```bash
npm run dev:docker
```

Rebuilds images on start — use only when testing the Docker deployment, not for day-to-day coding.

### Run services individually

```bash
npm run dev:frontend
npm run dev:backend
npm run dev:ai
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
| POST | `/api/auth/logout` | Auth |
| GET | `/api/auth/me` | Auth |
| GET | `/api/author/books` | Author |
| GET/POST | `/api/author/tickets` | Author |
| GET | `/api/author/tickets/stream` | Author (SSE) |
| GET | `/api/author/tickets/:id/stream` | Author (SSE) |
| GET | `/api/author/tickets/:id/attachments/:attachmentId` | Author |
| GET | `/api/admin/tickets` | Admin (query: `status`, `category`, `priority`, `from`, `to`) |
| GET | `/api/admin/tickets/stream` | Admin (SSE, same filters) |
| GET/PATCH | `/api/admin/tickets/:id` | Admin |
| POST | `/api/admin/tickets/:id/draft` | Admin |
| POST | `/api/admin/tickets/:id/responses` | Admin |
| POST | `/api/admin/tickets/:id/notes` | Admin |
| GET | `/api/admin/tickets/:id/attachments/:attachmentId` | Admin |

Full spec: [docs/api/openapi.yaml](./docs/api/openapi.yaml)

## Known limitations

- **SSE auth:** EventSource uses `?token=` query param (httpOnly cookie auth deferred for production)
- **Uploads:** Local/Docker volume storage (`UPLOAD_DIR`), not S3
- **AI budget:** Daily spend cap tracked in AI service (file-backed); draft returns HTTP 503 when exceeded; classify falls back gracefully
- **Logout:** Stateless JWT — no server-side token invalidation
- **LLM provider:** Uses **Google Gemini** instead of OpenAI (assignment suggested OpenAI; switched because billing credits could not be added to OpenAI during development — Gemini free tier via [Google AI Studio](https://aistudio.google.com/apikey))

## AI Strategy

> **Why Gemini, not OpenAI?** The assignment allows any LLM API. This implementation uses **Google Gemini** (`gemini-2.0-flash`) because OpenAI billing could not be enabled for this project. Gemini offers a free API tier suitable for demo/development. Architecture is unchanged: only `apps/ai-service` holds the API key.

- `GEMINI_API_KEY` lives **only** in `apps/ai-service` (never exposed to frontend)
- Backend proxies classify/draft to the internal AI service
- **Model:** `gemini-2.0-flash` — cost-effective, supports JSON output for classification, sufficient for support drafting
- **Combined classify + prioritize** in one LLM call (halves API cost vs separate calls)
- **KB injection:** category-specific snippets only (not full 8-page paste)
- **Token caps:** description truncated to 2,000 chars; classify 256 / draft 512 max tokens
- **Draft on demand:** cached in `ai_draft_responses`; Gemini called only when admin clicks Generate
- **Audit:** every AI call logged to `ticket_ai_logs` with tokens, latency, cost estimate
- **Daily spend cap:** `MAX_DAILY_SPEND_USD` in AI service; draft returns HTTP 503 when exceeded; classify falls back gracefully
- **Fallbacks:** `general_inquiry` / `medium` for classification; generic draft text for manual edit

Regenerate API docs: `npm run openapi:generate`

Full cost breakdown: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) §7

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
