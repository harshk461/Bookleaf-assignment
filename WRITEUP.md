# BookLeaf Assignment — Write-up

> One-page summary of priorities, trade-offs, and production evolution.

**Live demo:** [https://bookleaf.up.railway.app](https://bookleaf.up.railway.app) · See [docs/USER_GUIDE.md](./docs/USER_GUIDE.md) for a guided walkthrough.

## Priorities (5-day scope)

1. **Data correctness** — Seed 10 authors / 18 books from provided JSON; author data isolation via JWT-scoped API
2. **Core flows** — Login, My Books, Submit Ticket (with attachments), My Tickets, Admin queue + AI draft
3. **AI isolation** — Gemini API key only in internal FastAPI service; graceful fallbacks + cost logging
4. **Deployability** — Docker Compose + Railway-ready monorepo

## Trade-offs

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend | Next.js 15 App Router | File-based routing maps cleanly to author/admin portals |
| Real-time | SSE with query-token auth + 5s poll | EventSource cannot send Authorization header; acceptable for assignment |
| Validation | Zod schemas → runtime + OpenAPI generate | Single source of truth; `npm run openapi:generate` |
| ORM | Raw SQL + `pg` | Transparent queries for assignment evaluators |
| AI drafts | On-demand generation + DB cache | Assignment suggests draft on ticket open; Generate-on-click avoids API cost on every page view while still giving admins an editable KB-grounded draft |
| Attachments | Local filesystem (`uploads/`) | Simple for dev; S3/volume mount for production |
| UI | Functional Tailwind | Assignment allows non-pixel-perfect UI |

## AI design notes

> **Provider choice:** Assignment allows OpenAI, Anthropic, or any LLM. This build uses **Google Gemini** because OpenAI billing credits could not be added during development. Gemini’s free tier is sufficient for classify/draft demos; swapping providers would only require changes in `apps/ai-service`.

- **gemini-flash-latest:** low-cost model with JSON output mode; ~$0.0001/classify, ~$0.0004/draft at list pricing (often $0 on free tier)
- **Combined classify+prioritize:** one call returns both fields; trade-off is slightly less granular prompts
- **KB sections:** injected by ticket category, not full knowledge base paste
- **Cost cap:** in-memory daily tracker in AI service; production would persist to Redis/DB
- **Auto-acknowledgement:** bonus UX — async BullMQ job posts a short support message after ticket create (not required by assignment)

## Assignment coverage

All required flows are implemented: author/admin portals, ticket lifecycle, AI classify + prioritize + draft, RBAC, real-time updates (SSE + polling), OpenAPI docs, seeded sample dataset (10 authors / 18 books), and Railway deployment. File attachments and author follow-up replies are implemented as extras beyond the minimum spec.

## Production Next Steps

- Move SSE auth to httpOnly cookies
- S3 or persistent volume for attachment storage
- Redis pub/sub for ticket updates instead of SSE polling
- Rate limiting on all endpoints
- Expand integration tests for RBAC, attachments, and AI fallbacks
