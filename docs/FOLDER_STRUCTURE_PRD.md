# BookLeaf Author Support Portal — Folder Structure PRD

> **Document type:** Product Requirements Document (Folder Structure)  
> **Project:** Author Support & Communication Portal (Assignment 1 of 2)  
> **Related docs:** [ASSIGNMENT_FINDINGS.md](./ASSIGNMENT_FINDINGS.md) · [DB_DESIGN.md](./DB_DESIGN.md) · [DEPLOYMENT.md](./DEPLOYMENT.md)  
> **Status:** Implemented — matches current monorepo layout  
> **Implementation note:** Built with **Next.js 15** (`apps/frontend/src/views/`) rather than Vite (`src/pages/`) described in early drafts below. Backend, AI service, and DB paths match this PRD.

---

## 1. Purpose

This PRD defines the **repository folder structure** for the BookLeaf assignment. It answers:

- What folders and files to create
- What each directory is responsible for
- How the structure maps to assignment requirements
- Where code for each feature should live

**Goals:**

| Goal | Detail |
|------|--------|
| Clear separation of concerns | Frontend, API, AI, and DB are isolated |
| Evaluator-friendly | Easy to navigate; mirrors architecture in README |
| Assignment-aligned | Every required feature has a named home |
| Deployable | Monorepo layout works with Railway / Docker Compose |

**Non-goals:**

- Pixel-perfect UI component library structure
- Enterprise-scale microservices beyond assignment scope
- Public repo or shared package publishing

---

## 2. Architecture → Folder Mapping

```
┌─────────────────┐     REST/SSE      ┌─────────────────┐     HTTP (internal)   ┌─────────────────┐
│  apps/frontend  │ ◄──────────────► │  apps/backend   │ ◄──────────────────► │ apps/ai-service │
│  Author + Admin │                   │  Fastify API    │                      │  FastAPI + LLM  │
└─────────────────┘                   └────────┬────────┘                      └─────────────────┘
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │   db/           │
                                      │ migrations+seed │
                                      └─────────────────┘
```

| Layer | Folder | Assignment responsibility |
|-------|--------|---------------------------|
| Author Portal | `apps/frontend/src/author/` | My Books, Submit Ticket, My Tickets |
| Admin Portal | `apps/frontend/src/admin/` | Ticket queue, AI tools, ticket management |
| REST API | `apps/backend/src/` | Auth, RBAC, tickets, books, real-time |
| AI | `apps/ai-service/app/` | Classification, priority, draft responses |
| Database | `db/` | Schema, migrations, seed from JSON |
| Shared contracts | `packages/shared/` | Types, enums, API constants (optional) |

---

## 3. Root Repository Structure

```
bookleaf-assignment/
│
├── apps/                              # Deployable applications
│   ├── frontend/                      # Next.js 15 — Author & Admin portals
│   ├── backend/                       # Node.js + Fastify — REST API + SSE
│   └── ai-service/                    # Python + FastAPI — LLM integration (internal only)
│
├── packages/                          # Shared code (optional but recommended)
│   └── shared/                        # TypeScript types, enums, API paths
│
├── db/                                # Database source of truth
│   ├── migrations/                    # Versioned schema changes
│   ├── seed/                          # Seed scripts + raw JSON
│   └── views/                         # SQL views (e.g. author_books_view)
│
├── docs/                              # Assignment & design documentation
│   ├── ASSIGNMENT_FINDINGS.md
│   ├── DB_DESIGN.md
│   ├── DEPLOYMENT.md
│   └── FOLDER_STRUCTURE_PRD.md        # this file
│
├── scripts/                           # Dev & ops helpers
│   ├── setup.sh                       # First-time local setup
│   └── dev.sh                         # Start all services locally
│
├── .github/                           # CI (optional)
│   └── workflows/
│       └── ci.yml
│
├── bookleaf_sample_data (full stack) (1) (1).json   # Provided dataset (do not modify)
├── docker-compose.yml                 # Local: Postgres + all apps
├── .env.example                       # Template for all env vars
├── .gitignore
├── package.json                       # Root workspace scripts (optional)
├── railway.toml                       # Railway monorepo service config (optional)
├── README.md                          # Setup, architecture, credentials, API overview
└── WRITEUP.md                         # 1-page assignment write-up (max 1 page)
```

### 3.1 Root-level file responsibilities

| File | Purpose |
|------|---------|
| `README.md` | Local setup, test logins, architecture summary, AI strategy, API link |
| `WRITEUP.md` | Priorities, trade-offs, production evolution (deliverable) |
| `.env.example` | All env vars for backend, AI service, frontend — no secrets |
| `docker-compose.yml` | One-command local dev: Postgres + backend + AI + frontend |
| `package.json` | Workspace root: `dev`, `build`, `seed`, `migrate` scripts |

---

## 4. Frontend — `apps/frontend/`

**Stack:** React + Vite + TypeScript (or Next.js if preferred)  
**Serves:** Author Portal + Admin Portal (role-based routing after login)

```
apps/frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx                       # App entry
│   ├── App.tsx                        # Router shell
│   │
│   ├── routes/                        # Route definitions
│   │   ├── index.tsx
│   │   ├── author.routes.tsx          # /author/*
│   │   └── admin.routes.tsx           # /admin/*
│   │
│   ├── pages/                         # Page-level components (one per screen)
│   │   ├── auth/
│   │   │   └── LoginPage.tsx          # Shared login (redirects by role)
│   │   ├── author/
│   │   │   ├── MyBooksPage.tsx        # REQ: My Books
│   │   │   ├── SubmitTicketPage.tsx   # REQ: Submit Support Query
│   │   │   └── MyTicketsPage.tsx      # REQ: My Tickets + real-time
│   │   └── admin/
│   │       ├── TicketQueuePage.tsx    # REQ: Ticket queue + filters
│   │       └── TicketDetailPage.tsx   # REQ: AI draft, respond, notes, status
│   │
│   ├── components/                    # Reusable UI (functional, not pixel-perfect)
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── AuthorLayout.tsx
│   │   │   └── AdminLayout.tsx
│   │   ├── books/
│   │   │   ├── BookCard.tsx
│   │   │   └── BookStatusBadge.tsx    # Handles in-production nulls
│   │   ├── tickets/
│   │   │   ├── TicketList.tsx
│   │   │   ├── TicketStatusBadge.tsx
│   │   │   ├── TicketForm.tsx         # Book dropdown + subject + description
│   │   │   ├── TicketThread.tsx       # Query + admin responses
│   │   │   ├── PriorityBadge.tsx
│   │   │   └── CategoryBadge.tsx
│   │   ├── admin/
│   │   │   ├── TicketFilters.tsx      # status, category, priority, date
│   │   │   ├── AiDraftEditor.tsx      # Editable AI draft before send
│   │   │   ├── InternalNotesPanel.tsx # Admin-only notes
│   │   │   └── AssigneeSelect.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorAlert.tsx
│   │
│   ├── hooks/                         # Data + real-time hooks
│   │   ├── useAuth.ts
│   │   ├── useBooks.ts
│   │   ├── useTickets.ts
│   │   └── useTicketStream.ts         # SSE or polling for real-time updates
│   │
│   ├── services/                      # API client layer (no direct LLM calls)
│   │   ├── api.ts                     # Axios/fetch wrapper + auth header
│   │   ├── auth.service.ts
│   │   ├── books.service.ts
│   │   └── tickets.service.ts
│   │
│   ├── context/
│   │   └── AuthContext.tsx            # JWT + role + user profile
│   │
│   ├── types/                         # Frontend types (or import from packages/shared)
│   │   ├── auth.types.ts
│   │   ├── book.types.ts
│   │   └── ticket.types.ts
│   │
│   ├── utils/
│   │   ├── formatCurrency.ts          # ₹ formatting
│   │   ├── formatDate.ts              # IST display
│   │   └── constants.ts               # Status labels, category display names
│   │
│   └── styles/
│       └── global.css                 # Minimal global styles
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── Dockerfile                         # Optional — Railway/Nixpacks alternative
└── .env.example                       # VITE_API_URL only — no OpenAI key
```

### 4.1 Frontend feature → folder mapping

| Assignment requirement | Location |
|------------------------|----------|
| Email/password login | `pages/auth/LoginPage.tsx` + `services/auth.service.ts` |
| My Books (all fields, null handling) | `pages/author/MyBooksPage.tsx` + `components/books/` |
| Submit ticket form | `pages/author/SubmitTicketPage.tsx` + `components/tickets/TicketForm.tsx` |
| File attachment UI (bonus) | `components/tickets/TicketForm.tsx` — UI only |
| My Tickets + real-time | `pages/author/MyTicketsPage.tsx` + `hooks/useTicketStream.ts` |
| Admin ticket queue + filters | `pages/admin/TicketQueuePage.tsx` + `components/admin/TicketFilters.tsx` |
| AI draft edit + send | `pages/admin/TicketDetailPage.tsx` + `components/admin/AiDraftEditor.tsx` |
| Internal notes | `components/admin/InternalNotesPanel.tsx` |
| Data isolation (author sees own data) | Enforced by API; frontend uses `/api/author/*` only |

---

## 5. Backend — `apps/backend/`

**Stack:** Node.js + Fastify + TypeScript  
**Serves:** REST API, JWT auth, RBAC, SSE/polling endpoints  
**Rule:** Backend calls AI service — never exposes `OPENAI_API_KEY`

```
apps/backend/
├── src/
│   ├── index.ts                       # Server bootstrap
│   ├── app.ts                         # Fastify instance + plugin registration
│   │
│   ├── config/
│   │   ├── env.ts                     # Validated env vars (zod/envalid)
│   │   └── constants.ts               # Ticket enums, defaults
│   │
│   ├── plugins/                       # Fastify plugins
│   │   ├── auth.plugin.ts             # JWT verify middleware
│   │   ├── rbac.plugin.ts             # author vs admin guards
│   │   └── error-handler.plugin.ts    # Meaningful 4xx/5xx responses
│   │
│   ├── routes/
│   │   ├── index.ts                   # Route aggregator
│   │   ├── auth.routes.ts             # POST /api/auth/login, GET /me
│   │   ├── author/
│   │   │   ├── books.routes.ts        # GET /api/author/books
│   │   │   └── tickets.routes.ts      # CRUD + SSE stream
│   │   └── admin/
│   │       ├── tickets.routes.ts      # List, detail, patch, respond, notes
│   │       └── health.routes.ts       # GET /health (optional)
│   │
│   ├── controllers/                   # Thin — parse request, call service, respond
│   │   ├── auth.controller.ts
│   │   ├── author-books.controller.ts
│   │   ├── author-tickets.controller.ts
│   │   └── admin-tickets.controller.ts
│   │
│   ├── services/                      # Business logic
│   │   ├── auth.service.ts
│   │   ├── books.service.ts
│   │   ├── tickets.service.ts
│   │   ├── ticket-messages.service.ts
│   │   ├── internal-notes.service.ts
│   │   └── ai-client.service.ts       # HTTP client to apps/ai-service
│   │
│   ├── repositories/                  # DB access (Prisma/Drizzle/raw SQL)
│   │   ├── authors.repository.ts
│   │   ├── books.repository.ts
│   │   ├── tickets.repository.ts
│   │   ├── messages.repository.ts
│   │   └── notes.repository.ts
│   │
│   ├── db/
│   │   ├── client.ts                  # DB connection pool
│   │   └── schema/                    # If using Drizzle/Prisma — schema lives here
│   │
│   ├── middleware/
│   │   ├── validate.ts                # Request body/query validation
│   │   └── scope-author.ts            # Inject author_id filter from JWT
│   │
│   ├── types/
│   │   ├── express.d.ts               # Augment request with user
│   │   └── api.types.ts
│   │
│   └── utils/
│       ├── errors.ts                  # AppError, NotFound, Forbidden
│       └── sse.ts                     # Server-Sent Events helpers
│
├── tests/                             # Optional — integration tests
│   ├── auth.test.ts
│   └── rbac.test.ts
│
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env.example                       # DATABASE_URL, JWT_SECRET, AI_SERVICE_URL
```

### 5.1 Backend API route → file mapping

| Endpoint group | File |
|----------------|------|
| `POST /api/auth/login` | `routes/auth.routes.ts` |
| `GET /api/author/books` | `routes/author/books.routes.ts` |
| `POST /api/author/tickets` | `routes/author/tickets.routes.ts` → triggers AI classify |
| `GET /api/author/tickets/stream` | `routes/author/tickets.routes.ts` + `utils/sse.ts` |
| `GET /api/admin/tickets` | `routes/admin/tickets.routes.ts` |
| `GET /api/admin/tickets/:id` | `routes/admin/tickets.routes.ts` → triggers AI draft |
| `PATCH /api/admin/tickets/:id` | Status, category override, priority override, assignee |
| `POST /api/admin/tickets/:id/responses` | Public message to author |
| `POST /api/admin/tickets/:id/notes` | Internal note |

### 5.2 Ticket creation flow (backend)

```
author-tickets.controller.ts
  → tickets.service.create()
      → tickets.repository.insert()          # status: open
      → ai-client.service.classifyAndPrioritize()
          → POST apps/ai-service/classify     # on failure: default category/priority
      → tickets.repository.updateAiMetadata()
      → (optional) emit SSE event
```

---

## 6. AI Service — `apps/ai-service/`

**Stack:** Python + FastAPI  
**Access:** Internal only — not public URL  
**Holds:** `OPENAI_API_KEY` (env var only)

```
apps/ai-service/
├── app/
│   ├── main.py                        # FastAPI app entry
│   │
│   ├── config/
│   │   ├── settings.py                # pydantic-settings: API key, model, caps
│   │   └── constants.py               # Categories, priorities, token limits
│   │
│   ├── routers/
│   │   ├── health.py                  # GET /health
│   │   ├── classify.py                # POST /classify — category + priority
│   │   └── draft.py                   # POST /draft — response draft
│   │
│   ├── services/
│   │   ├── openai_client.py           # LLM API wrapper + retry
│   │   ├── classify_service.py        # Structured JSON output
│   │   ├── draft_service.py           # Draft with KB + book/author context
│   │   └── cost_tracker.py            # Token logging, daily spend cap
│   │
│   ├── prompts/
│   │   ├── system_base.py             # BookLeaf tone guidelines
│   │   ├── classify_prompt.py         # 6 categories + 4 priorities
│   │   ├── draft_prompt.py            # Response drafting template
│   │   └── kb_sections/               # Selective KB injection (not full paste)
│   │       ├── royalty.py
│   │       ├── isbn.py
│   │       ├── printing.py
│   │       ├── distribution.py
│   │       ├── production.py
│   │       └── company.py
│   │
│   ├── models/
│   │   ├── requests.py                # Pydantic request schemas
│   │   └── responses.py               # Pydantic response schemas
│   │
│   └── utils/
│       ├── fallback.py                # Default category/priority on failure
│       └── token_budget.py            # Truncate description, cap max_tokens
│
├── tests/                             # Optional
│   └── test_classify.py
│
├── requirements.txt                   # or pyproject.toml
├── Dockerfile
└── .env.example                       # OPENAI_API_KEY, MODEL, MAX_DAILY_SPEND_USD
```

### 6.1 AI task → file mapping

| AI task | Trigger | File |
|---------|---------|------|
| Classify + prioritize | Ticket created (backend calls) | `routers/classify.py` + `services/classify_service.py` |
| Draft response | Admin opens ticket | `routers/draft.py` + `services/draft_service.py` |
| KB context | Both tasks | `prompts/kb_sections/*.py` |
| Graceful degradation | LLM down / rate limit | `utils/fallback.py` |
| Cost awareness | Every call | `services/cost_tracker.py` |

---

## 7. Database — `db/`

**Stack:** PostgreSQL  
**Source:** [DB_DESIGN.md](./DB_DESIGN.md) — 13 tables

```
db/
├── migrations/
│   ├── 001_create_enums.sql
│   ├── 002_create_authors_users.sql
│   ├── 003_create_books_platforms.sql
│   ├── 004_create_tickets_messages.sql
│   ├── 005_create_ai_tables.sql
│   └── 006_create_indexes_views.sql
│
├── seed/
│   ├── seed.ts                        # or seed.py / seed.sql — orchestrator
│   ├── data/
│   │   └── bookleaf_sample_data.json  # Symlink or copy of provided JSON
│   ├── 01_print_partners.ts
│   ├── 02_platforms.ts
│   ├── 03_authors.ts
│   ├── 04_users.ts                    # Author passwords + admin@bookleaf.com
│   ├── 05_books.ts
│   ├── 06_book_platforms.ts
│   └── 07_demo_tickets.ts             # Optional sample tickets for demo
│
└── views/
    └── author_books_view.sql          # Denormalized read model for author portal
```

### 7.1 Seed order (FK dependencies)

```
print_partners → platforms → authors → users → books → book_platforms → (optional sales/payouts) → (optional demo tickets)
```

### 7.2 Table → migration file mapping

| Tables | Migration |
|--------|-----------|
| `authors`, `users` | `002_create_authors_users.sql` |
| `print_partners`, `platforms`, `books`, `book_platforms` | `003_create_books_platforms.sql` |
| `tickets`, `ticket_messages`, `internal_notes` | `004_create_tickets_messages.sql` |
| `ai_draft_responses`, `ticket_ai_logs` | `005_create_ai_tables.sql` |

---

## 8. Shared Package — `packages/shared/` (optional)

Use when frontend and backend both need the same enums and types.

```
packages/shared/
├── src/
│   ├── index.ts
│   ├── enums/
│   │   ├── ticket-status.ts           # open | in_progress | resolved | closed
│   │   ├── ticket-category.ts         # 6 AI categories
│   │   └── ticket-priority.ts         # critical | high | medium | low
│   ├── types/
│   │   ├── book.ts
│   │   ├── ticket.ts
│   │   └── user.ts
│   └── api/
│       └── paths.ts                     # /api/author/tickets, etc.
├── package.json
└── tsconfig.json
```

---

## 9. Documentation — `docs/`

Move or keep assignment docs here for a cleaner root. Current files can stay at root or be mirrored.

```
docs/
├── ASSIGNMENT_FINDINGS.md
├── DB_DESIGN.md
├── DEPLOYMENT.md
├── FOLDER_STRUCTURE_PRD.md
└── api/
    └── openapi.yaml                   # Swagger spec (deliverable)
```

| Deliverable | File |
|-------------|------|
| Architecture decisions | `README.md` |
| API documentation | `docs/api/openapi.yaml` or Postman collection |
| 1-page write-up | `WRITEUP.md` |
| Test credentials | `README.md` → "Test Accounts" section |

---

## 10. Scripts — `scripts/`

```
scripts/
├── setup.sh                           # npm install, copy .env.example, migrate, seed
├── dev.sh                             # docker-compose up OR parallel app starts
├── migrate.sh                         # Run pending migrations
└── seed.sh                            # Run seed only
```

---

## 11. Environment Variables by Service

| Variable | Service | Required |
|----------|---------|----------|
| `DATABASE_URL` | backend | Yes |
| `JWT_SECRET` | backend | Yes |
| `AI_SERVICE_URL` | backend | Yes (internal URL) |
| `OPENAI_API_KEY` | ai-service | Yes |
| `OPENAI_MODEL` | ai-service | Yes (e.g. `gpt-4o-mini`) |
| `MAX_DAILY_SPEND_USD` | ai-service | Recommended |
| `VITE_API_URL` | frontend | Yes |
| `PORT` | all apps | Yes (per service) |

**Security rule:** `OPENAI_API_KEY` exists only in `apps/ai-service/.env` — never in frontend or backend env exposed to client.

---

## 12. Assignment Requirements → Folder Checklist

Use this to verify the structure covers every deliverable.

### Author Portal

| Requirement | Folder / file |
|-------------|---------------|
| Login (email/password) | `frontend/src/pages/auth/` + `backend/src/routes/auth.routes.ts` |
| My Books | `frontend/src/pages/author/MyBooksPage.tsx` |
| Submit ticket | `frontend/src/pages/author/SubmitTicketPage.tsx` |
| My Tickets + real-time | `frontend/src/pages/author/MyTicketsPage.tsx` + `hooks/useTicketStream.ts` |
| Data isolation | `backend/src/middleware/scope-author.ts` |

### Admin Portal

| Requirement | Folder / file |
|-------------|---------------|
| Ticket queue + filters | `frontend/src/pages/admin/TicketQueuePage.tsx` |
| AI classification | `ai-service/app/routers/classify.py` |
| AI priority | `ai-service/app/routers/classify.py` (combined call) |
| AI draft response | `ai-service/app/routers/draft.py` |
| Override category/priority | `backend/src/routes/admin/tickets.routes.ts` (PATCH) |
| Internal notes | `backend/src/services/internal-notes.service.ts` |
| Self-assign | `backend/src/routes/admin/tickets.routes.ts` (PATCH) |

### API & Infrastructure

| Requirement | Folder / file |
|-------------|---------------|
| REST API + RBAC | `backend/src/routes/`, `plugins/rbac.plugin.ts` |
| Input validation | `backend/src/middleware/validate.ts` |
| API docs | `docs/api/openapi.yaml` |
| Seed 10 authors, 18 books | `db/seed/` |
| Live deployment | `docker-compose.yml`, `DEPLOYMENT.md`, Railway config |
| README + write-up | `README.md`, `WRITEUP.md` |

---

## 13. Implementation Phases (folder creation order)

### Phase 1 — Scaffold (Day 1)

```
bookleaf-assignment/
├── apps/backend/          # minimal health route
├── apps/frontend/         # Vite + login shell
├── apps/ai-service/       # health + classify stub
├── db/migrations/         # initial schema
├── db/seed/               # JSON seed script
├── docker-compose.yml
├── .env.example
└── README.md
```

### Phase 2 — Core features (Day 2–3)

- Fill `frontend/src/pages/author/` and `admin/`
- Complete `backend/src/routes/` and `services/`
- Wire `ai-service/app/prompts/` with real KB sections

### Phase 3 — Polish & deploy (Day 4–5)

- `docs/api/openapi.yaml`
- `WRITEUP.md`
- `scripts/setup.sh`, `scripts/dev.sh`
- Railway / deployment config

---

## 14. Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Folders | kebab-case | `ai-service`, `ticket-messages` |
| React components | PascalCase file | `TicketForm.tsx` |
| Backend services | kebab-case file | `tickets.service.ts` |
| Python modules | snake_case | `classify_service.py` |
| API routes | kebab-case path | `/api/admin/tickets` |
| DB tables | snake_case | `ticket_messages` |
| Enums (code) | SCREAMING_SNAKE | `ROYALTY_PAYMENTS` |
| Env vars | SCREAMING_SNAKE | `OPENAI_API_KEY` |

---

## 15. What NOT to put in the repo

| Item | Reason |
|------|--------|
| `.env` with real secrets | Git leak risk — use `.env.example` only |
| `OPENAI_API_KEY` in frontend | Evaluators check for this |
| `node_modules/`, `__pycache__/`, `dist/` | Gitignored build artifacts |
| Modified sample JSON | Evaluators test against exact records |
| Public GitHub repo | Assignment is confidential |

---

## 16. Success Criteria

The folder structure is complete when:

- [x] Evaluator can clone repo and run `scripts/setup.sh` (or README steps) successfully
- [x] Author and admin flows are findable within 2 clicks in `apps/frontend/src/views/`
- [x] All API routes map to files under `apps/backend/src/routes/`
- [x] AI logic is isolated in `apps/ai-service/` with no key in frontend bundle
- [x] DB seed reproduces 10 authors + 18 books from provided JSON
- [x] `README.md`, `WRITEUP.md`, and API docs exist at documented paths
- [x] `docker-compose.yml` starts full stack locally

---

## Quick Reference

```
PRODUCT:     Author Support & Communication Portal
STRUCTURE:   Monorepo — apps/frontend + apps/backend + apps/ai-service + db/
DATA:        db/seed/ from bookleaf_sample_data.json
AI KEY:      apps/ai-service only
REAL-TIME:   backend SSE or polling — frontend/src/hooks/useTicketStream.ts
DOCS:        README.md + WRITEUP.md + docs/api/openapi.yaml
DEPLOY:      See DEPLOYMENT.md
```

---

*PRD derived from ASSIGNMENT_FINDINGS.md, DB_DESIGN.md, and DEPLOYMENT.md.*
