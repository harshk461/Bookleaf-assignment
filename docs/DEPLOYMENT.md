# BookLeaf Author Support Portal — Deployment & Infrastructure

> **Project:** Author Support & Communication Portal  
> **Related docs:** [ASSIGNMENT_FINDINGS.md](./ASSIGNMENT_FINDINGS.md) · [DB_DESIGN.md](./DB_DESIGN.md)  
> **Stack:** Monorepo — React frontend · Fastify API · FastAPI AI service · PostgreSQL  
> **Budget constraint:** ~$0 for LLM (Google Gemini free tier); infrastructure should cost $0–$5/month  
> **LLM note:** Assignment suggests OpenAI; this deployment uses **Google Gemini** because OpenAI billing could not be enabled. Get a free key at [Google AI Studio](https://aistudio.google.com/apikey).

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Platform Comparison](#4-platform-comparison)
5. [Recommended Setup](#5-recommended-setup)
6. [Cost Budget](#6-cost-budget)
7. [Gemini / LLM Budget Strategy](#7-gemini--llm-budget-strategy)
8. [Environment Variables](#8-environment-variables)
9. [Railway Deployment Guide](#9-railway-deployment-guide)
10. [Alternative: Split Hosting (Zero Infra Cost)](#10-alternative-split-hosting-zero-infra-cost)
11. [Service Configuration](#11-service-configuration)
12. [Database & Migrations](#12-database--migrations)
13. [Networking & Security](#13-networking--security)
14. [Real-Time Updates](#14-real-time-updates)
15. [Health Checks & Observability](#15-health-checks--observability)
16. [CI/CD (Optional)](#16-cicd-optional)
17. [Demo-Day Checklist](#17-demo-day-checklist)
18. [Known Limitations & Production Next Steps](#18-known-limitations--production-next-steps)

---

## 1. Executive Summary

**Goal:** Deploy a working live demo for evaluators with three app services and one shared PostgreSQL database, while keeping infrastructure spend near zero. LLM calls use **Google Gemini** (free tier) instead of OpenAI.

**Recommended approach:**

| Layer | Choice | Why |
|-------|--------|-----|
| **Hosting** | Railway (Hobby plan) | One monorepo, multiple services, managed Postgres, private networking — simplest ops for a 5-day assignment |
| **AI model** | `gemini-2.0-flash` | Free-tier Gemini API; JSON output for classification; sufficient for support drafting |
| **Real-time** | SSE or 5s polling | Avoids WebSocket infra complexity on free tiers |

**Net infra cost (typical):** $0–$5/month if you stay within Railway Hobby's included $5 usage credit. Gemini free tier covers demo traffic; `MAX_DAILY_SPEND_USD` guards against runaway usage.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Railway Project (monorepo)                       │
│                                                                          │
│  ┌──────────────┐    REST/SSE     ┌──────────────┐    HTTP (internal)  │
│  │   Frontend   │ ◄──────────────►│   Backend    │◄──────────────────┐ │
│  │  (React/Vite)│                 │  (Fastify)   │                   │ │
│  │  Port: 3000  │                 │  Port: 4000  │                   │ │
│  └──────────────┘                 └──────┬───────┘                   │ │
│         ▲                                │                           │ │
│         │ public URL                     │ SQL                       ▼ │
│         │                                ▼                  ┌──────────────┐
│         │                         ┌──────────────┐          │  AI Service  │
│         │                         │  PostgreSQL  │          │  (FastAPI)   │
│         │                         │  (Railway)   │          │  Port: 8000  │
│         │                         └──────────────┘          └──────┬───────┘
│         │                                                          │
└─────────┼──────────────────────────────────────────────────────────┼───┘
          │                                                          │
          │                                                          ▼
          │                                               ┌─────────────────┐
          └───────────────────────────────────────────────│  Google Gemini  │
                                                          │ gemini-2.0-flash│
                                                          │  (env key only) │
                                                          └─────────────────┘
```

**Request flow:**

1. Author/Admin uses frontend → calls Fastify API (`/api/*`)
2. On ticket create → Fastify calls AI service internally → classify + prioritize → writes to `tickets` + `ticket_ai_logs`
3. Admin opens ticket → Fastify calls AI service → draft response → stores in `ai_draft_responses`
4. Frontend polls or uses SSE for ticket list updates

**Key rule:** Only the **AI service** holds `GEMINI_API_KEY`. Frontend never talks to AI service directly.

---

## 3. Monorepo Structure

```
bookleaf-assignment/
├── apps/
│   ├── frontend/                 # React + Vite (or Next.js static export)
│   │   ├── package.json
│   │   ├── Dockerfile            # optional — Railway can use Nixpacks
│   │   └── src/
│   ├── backend/                  # Node.js + Fastify
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── src/
│   └── ai-service/               # Python + FastAPI
│       ├── pyproject.toml        # or requirements.txt
│       ├── Dockerfile
│       └── app/
├── packages/
│   └── shared/                   # optional: shared types, API contracts
├── db/
│   ├── migrations/               # SQL or Prisma/Drizzle migrations
│   └── seed/                     # seed from bookleaf_sample_data.json
├── railway.toml                  # Railway monorepo config (optional)
├── docker-compose.yml            # local dev: all services + Postgres
├── .env.example
├── DB_DESIGN.md
├── DEPLOYMENT.md                 # this file
└── README.md
```

**Why monorepo for this assignment:**

- Single PR / commit history for evaluators
- Shared DB schema and seed data in one place
- Railway deploys each `apps/*` folder as a separate service from one Git repo
- Local dev mirrors production with `docker-compose up`

---

## 4. Platform Comparison

All options below can host this stack. Pick based on how much ops time you want to spend vs. cold-start tolerance.

| Platform | Monthly cost (this stack) | Free tier? | Pros | Cons |
|----------|---------------------------|------------|------|------|
| **Railway** | **$0–$5** (Hobby: $5/mo includes $5 usage credit) | $5 one-time trial for new accounts | Monorepo multi-service, managed Postgres, private networking, no cold starts | No permanent free tier; card required after trial |
| **Render** | **$0** (free web) or **$21+** (always-on) | Free web services sleep after 15 min | No card for free tier; simple Git deploy | Cold starts (30–50s) kill demo UX; Postgres is $7/mo |
| **Fly.io** | **~$15–25/mo** (3 apps + Postgres + IPv4) | 2-hour trial only | Global edge, scale-to-zero | Expensive for 3 services + DB; complex for assignment scope |
| **Vercel + Railway** | **$0–$5** | Vercel frontend free; Railway backend | Best frontend CDN; cheap API hosting | Split across two dashboards |
| **Hetzner + Coolify** | **~€4/mo** (~$5) | No | Cheapest always-on VPS; full control | You manage Docker, SSL, backups — high ops burden for 5 days |
| **Neon + Render/Vercel** | **$0** | Neon 0.5 GB Postgres free | DB always reachable; frontend on Vercel free | Free Neon suspends after 5 days inactivity; Render cold starts |

**Verdict for BookLeaf assignment:**

| Priority | Recommendation |
|----------|----------------|
| **Best overall** | **Railway** — one project, three services, one Postgres, predictable for evaluators |
| **Zero infra spend** | Vercel (frontend) + Render free (backend + AI) + Neon free (DB) — accept cold starts |
| **Avoid** | Fly.io for this stack — IPv4 + Postgres costs add up fast for 3 services |

---

## 5. Recommended Setup

### Railway monorepo (primary recommendation)

| Service | Root directory | Builder | Public? |
|---------|----------------|---------|---------|
| `frontend` | `apps/frontend` | Nixpacks or Dockerfile | Yes — `https://bookleaf.up.railway.app` |
| `backend` | `apps/backend` | Nixpacks or Dockerfile | Yes — API + SSE |
| `ai-service` | `apps/ai-service` | Dockerfile (Python) | **No** — internal only |
| `postgres` | Railway plugin | Managed | **No** — private `DATABASE_URL` |

**Resource sizing (stay under $5 credit):**

| Service | vCPU | RAM | Notes |
|---------|------|-----|-------|
| frontend | 0.25 | 256 MB | Static build served by `serve` or nginx |
| backend | 0.25 | 512 MB | Main API + auth |
| ai-service | 0.25 | 512 MB | Spiky during AI calls; can scale to 0 if Railway supports sleep |
| postgres | shared | 256 MB | Sufficient for 10 authors, 18 books, demo tickets |

---

## 6. Cost Budget

### Infrastructure (target: $0 out of pocket)

| Item | Estimated monthly | Paid from |
|------|-------------------|-----------|
| Railway Hobby plan | $5 subscription | Includes $5 usage credit → net $0 if usage ≤ $5 |
| Railway Postgres | ~$1–2 of usage credit | Included in above |
| 3 app services | ~$2–3 of usage credit | Included in above |
| Domain (optional) | $0 | Use Railway subdomain |
| **Infra total** | **$0–$5** | |

### Google Gemini API (free tier)

| Item | Cost |
|------|------|
| Model: `gemini-2.0-flash` | $0.10 / 1M input · $0.40 / 1M output (often $0 on free tier) |
| Assignment demo usage (optimized) | **~$0–$0.10** total |
| Buffer for evaluator testing | Free tier rate limits apply |

See [Section 7](#7-gemini--llm-budget-strategy) for token math.

---

## 7. Gemini / LLM Budget Strategy

> **Honest note:** The assignment mentions OpenAI. This project uses **Google Gemini** because OpenAI billing could not be enabled. Gemini’s free tier covers demo usage; `MAX_DAILY_SPEND_USD` still guards runaway spend.

Evaluators care about **cost awareness** (25% of AI score). Document these choices in README.

### Estimated token usage per AI call

| Task | When | Input tokens | Output tokens | Est. cost (Gemini list price) |
|------|------|--------------|---------------|-------------------------------|
| Classify + prioritize | Ticket created | ~800 | ~50 (JSON) | ~$0.0001 |
| Draft response | Admin opens ticket | ~2,500 | ~400 | ~$0.0004 |
| Regenerate draft | Admin clicks regenerate | ~2,500 | ~400 | ~$0.0004 |

### Demo session estimate

| Scenario | AI calls | Est. cost |
|----------|----------|-----------|
| You testing locally (50 tickets + 30 drafts) | ~80 calls | ~$0.05 |
| Evaluator demo (20 tickets + 15 drafts) | ~35 calls | ~$0.02 |
| Heavy evaluator exploration (100 tickets + 50 drafts) | ~150 calls | ~$0.10 |
| **Worst case — no optimization** | 500+ calls | ~$0.50–$1.00 |

**$5 is more than enough** if you follow the rules below.

### Cost-control rules (implement in AI service)

```
1. Single combined call for classify + prioritize (one JSON response, not two calls)
2. Draft only on admin request — never auto-generate on ticket create
3. Inject KB by section (royalty / ISBN / printing), not full 8-page paste
4. Cap ticket description at 2,000 chars before sending to LLM
5. Cap draft output at 500 tokens (max_tokens=500)
6. Log every call to ticket_ai_logs with input_tokens, output_tokens, estimated_cost_usd
7. Hard daily cap in AI service: e.g. MAX_DAILY_SPEND_USD=1.00 → return 503 gracefully
8. Use structured outputs / JSON mode for classification (fewer retries)
```

### Graceful degradation (required by assignment)

When Gemini is down, rate-limited, or budget exceeded:

| Feature | Fallback |
|---------|----------|
| Ticket creation | Always works |
| Classification | `general_inquiry` |
| Priority | `medium` |
| `ai_classification_failed` | `true` |
| Draft generation | 503 + admin writes manually |

---

## 8. Environment Variables

### `apps/backend` (Fastify)

```bash
# Server
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

# Database (Railway injects this when you link Postgres)
DATABASE_URL=postgresql://user:pass@host:5432/bookleaf

# Auth
JWT_SECRET=<random-64-char-string>
JWT_EXPIRES_IN=7d

# CORS — frontend public URL
CORS_ORIGIN=https://your-frontend.up.railway.app

# AI service — internal Railway URL (private networking)
AI_SERVICE_URL=http://ai-service.railway.internal:8000
AI_SERVICE_TIMEOUT_MS=30000

# Ticket attachments — mount Railway volume at /data/uploads
UPLOAD_DIR=/data/uploads
MAX_UPLOAD_BYTES=5242880

# Optional
LOG_LEVEL=info
```

### `apps/ai-service` (FastAPI)

```bash
# Server
PORT=8000
HOST=0.0.0.0

# Google Gemini — ONLY place this key exists (free tier: https://aistudio.google.com/apikey)
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-flash

# Cost controls
MAX_DAILY_SPEND_USD=1.00
MAX_TOKENS_DRAFT=500

# Optional — shared secret so only backend can call AI service
AI_SERVICE_API_KEY=<random-string>
```

### `apps/frontend` (React/Vite)

```bash
# Build-time (Vite)
VITE_API_URL=https://your-backend.up.railway.app

# Or runtime config via window.__ENV__ if needed
```

### `.env.example` (root — for local docker-compose)

```bash
DATABASE_URL=postgresql://bookleaf:bookleaf@localhost:5432/bookleaf
JWT_SECRET=dev-secret-change-in-production
GEMINI_API_KEY=AIza...
AI_SERVICE_URL=http://localhost:8000
VITE_API_URL=http://localhost:4000
```

---

## 9. Railway Deployment Guide

### Prerequisites

- GitHub/GitLab private repo with monorepo pushed
- Railway account (use $5 trial credit first)
- Gemini API key (free) from [Google AI Studio](https://aistudio.google.com/apikey)

### Step 1 — Create project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your private `bookleaf-assignment` repo

### Step 2 — Add PostgreSQL

1. In project canvas → **+ New** → **Database** → **PostgreSQL**
2. Railway auto-creates `DATABASE_URL`
3. Copy connection string for local reference

### Step 3 — Deploy backend

1. **+ New** → **GitHub Repo** → same repo
2. Settings → **Root Directory** → `apps/backend`
3. Variables → add all from [Section 8](#appsbackend-fastify)
4. Link `DATABASE_URL` from Postgres service (reference variable)
5. Set `AI_SERVICE_URL` after AI service is deployed (use internal URL)
6. Generate domain: **Settings → Networking → Generate Domain**

### Step 4 — Deploy AI service

1. **+ New** → same repo → root `apps/ai-service`
2. Variables → `GEMINI_API_KEY`, `GEMINI_MODEL`, `AI_SERVICE_API_KEY`
3. **Do not generate a public domain** — use private networking only
4. Copy internal hostname: `ai-service.railway.internal`

### Step 5 — Deploy frontend

1. **+ New** → same repo → root `apps/frontend`
2. Build command (Vite example): `npm run build`
3. Start command: `npx serve -s dist -l $PORT`
4. Variables → `VITE_API_URL=https://<backend-domain>`
5. Generate public domain — this is your **demo URL**

### Step 6 — Run migrations & seed

**Option A — Railway one-off command (backend service):**

```bash
# In Railway backend service → Settings → Deploy → Custom start command (one-time)
npm run db:migrate && npm run db:seed && npm start
```

**Option B — run locally against Railway Postgres:**

```bash
DATABASE_URL="<railway-postgres-url>" npm run db:migrate
DATABASE_URL="<railway-postgres-url>" npm run db:seed
```

Seed must load `bookleaf_sample_data.json` and create admin + author passwords (document in README).

### Step 7 — Verify

```bash
# Health checks
curl https://<backend>/health
curl https://<backend>/api/health

# Login
curl -X POST https://<backend>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"priya.sharma@email.com","password":"<seed-password>"}'
```

### `railway.toml` (optional monorepo config)

```toml
[build]
builder = "NIXPACKS"

[[services]]
name = "backend"
source = "apps/backend"

[[services]]
name = "ai-service"
source = "apps/ai-service"

[[services]]
name = "frontend"
source = "apps/frontend"
```

---

## 10. Alternative: Split Hosting (Zero Infra Cost)

If you cannot use a credit card on Railway:

```
Frontend  →  Vercel (free, always fast)
Backend   →  Render free tier (cold starts OK if you warn evaluators)
AI        →  Render free tier (same repo, different root directory)
Database  →  Neon free tier (external Postgres)
```

| Service | Platform | Config |
|---------|----------|--------|
| `apps/frontend` | Vercel | Framework: Vite; `VITE_API_URL` → Render backend URL |
| `apps/backend` | Render | Root: `apps/backend`; env: `DATABASE_URL` from Neon |
| `apps/ai-service` | Render | Root: `apps/ai-service`; **no public URL** — use Render private service or restrict by `AI_SERVICE_API_KEY` |
| PostgreSQL | Neon | Free project; connection string in both backend env |

**Trade-off:** Render free services sleep after 15 min idle. First request takes 30–50s. Mitigation:

- Add a note in README: "Free tier — first load may take ~30 seconds"
- Use [UptimeRobot](https://uptimerobot.com) free ping every 14 min to keep warm (acceptable for demo)
- Or upgrade Render web service to $7/mo for one always-on backend (skip AI on separate Render — call OpenAI from backend directly to save a service)

**Ultra-cheap simplification:** Merge AI service into Fastify backend as a module for deployment only (keep separate folder in monorepo for clean architecture). One Render service instead of two → fewer cold starts.

---

## 11. Service Configuration

### Backend (Fastify) — production essentials

```typescript
// Plugins to register
- @fastify/cors        → CORS_ORIGIN only
- @fastify/helmet      → security headers
- @fastify/rate-limit  → 100 req/min per IP (protect demo)
- @fastify/jwt         → auth
- @fastify/sensible    → HTTP errors

// Routes
- /health              → { status: 'ok' } — no DB required
- /api/*               → all business routes per DB_DESIGN.md
```

**AI client pattern:**

```typescript
// backend calls ai-service, never OpenAI directly
const response = await fetch(`${AI_SERVICE_URL}/v1/classify`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.AI_SERVICE_API_KEY,
  },
  body: JSON.stringify({ subject, description }),
  signal: AbortSignal.timeout(AI_SERVICE_TIMEOUT_MS),
});
```

### AI service (FastAPI) — endpoints

| Method | Path | Called by | Purpose |
|--------|------|-----------|---------|
| `GET` | `/health` | Railway | Liveness probe |
| `POST` | `/v1/classify-prioritize` | Backend | Returns `{ category, priority }` |
| `POST` | `/v1/draft-response` | Backend | Returns `{ draft_text, tokens_used, cost_usd }` |

Protect all `/v1/*` routes with `X-API-Key` header check.

### Frontend — build output

| Framework | Build | Serve |
|-----------|-------|-------|
| Vite + React | `npm run build` → `dist/` | `serve -s dist` or nginx |
| Next.js (static) | `next build && next export` | same |

Point all API calls to `VITE_API_URL` — never embed OpenAI key.

---

## 12. Database & Migrations

- **One PostgreSQL instance** shared by backend only (AI service is stateless)
- Schema per [DB_DESIGN.md](./DB_DESIGN.md) — 13 tables
- Run migrations before first deploy; re-run on schema changes
- Seed from `bookleaf_sample_data (full stack) (1) (1).json`

**Migration tooling options:**

| Tool | Fits |
|------|------|
| Drizzle ORM | TypeScript backend — good DX |
| Prisma | TypeScript — fast setup |
| Raw SQL (`db/migrations/*.sql`) | Simplest, no ORM lock-in |

**Production notes:**

- Enable SSL: append `?sslmode=require` to `DATABASE_URL` on Neon/Railway
- Connection pooling: use Railway/Neon pooler URL if available (PgBouncer)
- Backup: Railway/Neon auto-backup on paid tiers; for demo, re-seed is acceptable

---

## 13. Networking & Security

| Rule | Implementation |
|------|----------------|
| Gemini key server-side only | Key in `ai-service` env only |
| AI service not public | Railway private networking; or API key + firewall |
| JWT on all `/api/*` except `/api/auth/login` | Fastify `onRequest` hook |
| RBAC | `author` vs `admin` middleware per DB_DESIGN.md |
| CORS | Allow frontend origin only |
| HTTPS | Railway/Vercel provide TLS automatically |
| Secrets | Never commit `.env`; use platform secret managers |

**Internal service auth:**

```
Backend ──X-API-Key──► AI Service
Frontend ──JWT────────► Backend
Frontend ──✗──────────► AI Service (blocked)
Frontend ──✗──────────► Gemini (blocked)
```

---

## 14. Real-Time Updates

Assignment requires ticket list updates without manual refresh. On free/low-cost infra:

| Option | Complexity | Cost | Recommendation |
|--------|------------|------|----------------|
| **Polling (5s)** | Low | Free | ✅ Default for assignment |
| **SSE** | Medium | Free | ✅ Good upgrade — Fastify `@fastify/sse` |
| **WebSockets** | High | Free but sticky sessions | Skip for demo |

SSE endpoint example: `GET /api/author/tickets/stream` — backend pushes on ticket status change.

---

## 15. Health Checks & Observability

Configure Railway health check path on each service:

| Service | Path | Expected |
|---------|------|----------|
| backend | `/health` | `200 { "status": "ok" }` |
| ai-service | `/health` | `200 { "status": "ok" }` |
| frontend | `/` | `200` HTML |

**Logging (free):**

- Railway built-in logs per service
- Log AI calls with token counts to `ticket_ai_logs` table
- `console.error` on AI failures with ticket ID

**Gemini usage:** Monitor at [Google AI Studio](https://aistudio.google.com/); set `MAX_DAILY_SPEND_USD` in AI service env.
- Check usage daily during demo week

---

## 16. CI/CD (Optional)

Minimal GitHub Actions — run on PR, deploy via Railway auto-deploy on `main`:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npm test
        working-directory: apps/backend
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -r requirements.txt && pytest
        working-directory: apps/ai-service
```

Railway auto-deploys on push to `main` — no extra CD config needed.

---

## 17. Demo-Day Checklist

Before sharing URL with evaluators:

- [ ] Live URL loads frontend without errors
- [ ] Author login works (`priya.sharma@email.com` + seed password)
- [ ] Admin login works
- [ ] Author sees only own books (data isolation)
- [ ] Ticket create → AI classification appears within ~5s
- [ ] Admin sees AI draft on ticket open
- [ ] AI failure path tested (invalid key / budget cap → ticket still created)
- [ ] In-production books (BK013, BK015) display correctly
- [ ] README has: local setup, architecture, AI strategy, test credentials
- [ ] Gemini key set; AI classify + draft working with fallbacks
- [ ] Private repo + evaluator added as collaborator

---

## 18. Known Limitations & Production Next Steps

**Acceptable for assignment demo:**

- Single-region deployment (India/US authors — latency OK for demo)
- No Redis queue (AI calls synchronous with timeout)
- Attachment uploads stored at `UPLOAD_DIR` (default `/data/uploads` in Docker/Railway); **attach a persistent volume** in Railway dashboard so files survive redeploys
- Polling instead of WebSockets
- Railway sleep if usage exceeds credits (monitor dashboard)

**Production evolution (for 1-page write-up):**

| Area | Next step |
|------|-----------|
| AI | Async job queue (BullMQ + Redis); retry with exponential backoff |
| Scale | Separate read replica; cache author book list |
| Security | Refresh tokens, audit logs, WAF |
| Cost | Prompt caching, embedding-based KB retrieval instead of full injection |
| Infra | Kubernetes or managed ECS when traffic grows; keep AI service isolated |
| Observability | OpenTelemetry, Sentry, structured logging |

---

## Quick Reference — URLs to Document in README

```markdown
## Live Demo
- **App URL:** https://<frontend>.up.railway.app
- **API URL:** https://<backend>.up.railway.app

## Test Credentials
| Role | Email | Password |
|------|-------|----------|
| Author | priya.sharma@email.com | (see seed) |
| Admin | admin@bookleaf.com | (see seed) |

## Architecture
- Monorepo: frontend (React) + backend (Fastify) + ai-service (FastAPI)
- Database: PostgreSQL (single instance)
- AI: gemini-2.0-flash via isolated Python service
- Deployment: Railway Hobby (~$0/month within usage credits)
```

---

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-06-19 | Initial deployment guide — monorepo, Railway primary, $5 OpenAI budget strategy |
