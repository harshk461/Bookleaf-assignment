# BookLeaf Assignment — Write-up

> One-page summary of priorities, trade-offs, and production evolution.

## Priorities (5-day scope)

1. **Data correctness** — Seed 10 authors / 18 books from provided JSON; author data isolation via JWT-scoped API
2. **Core flows** — Login, My Books, Submit Ticket (with attachments), My Tickets, Admin queue + AI draft
3. **AI isolation** — OpenAI key only in internal FastAPI service; graceful fallbacks + cost logging
4. **Deployability** — Docker Compose + Railway-ready monorepo

## Trade-offs

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend | Next.js 15 App Router | File-based routing maps cleanly to author/admin portals |
| Real-time | SSE with query-token auth + 5s poll | EventSource cannot send Authorization header; acceptable for assignment |
| Validation | Zod schemas → runtime + OpenAPI generate | Single source of truth; `npm run openapi:generate` |
| ORM | Raw SQL + `pg` | Transparent queries for assignment evaluators |
| AI drafts | On-demand generation + DB cache | Avoids OpenAI cost on every admin page view |
| Attachments | Local filesystem (`uploads/`) | Simple for dev; S3/volume mount for production |
| UI | Functional Tailwind | Assignment allows non-pixel-perfect UI |

## AI design notes

- **gpt-4o-mini:** cheapest capable model with JSON mode; ~$0.00015/classify, ~$0.0006/draft
- **Combined classify+prioritize:** one call returns both fields; trade-off is slightly less granular prompts
- **KB sections:** injected by ticket category, not full knowledge base paste
- **Cost cap:** in-memory daily tracker in AI service; production would persist to Redis/DB

## Production Next Steps

- Move SSE auth to httpOnly cookies
- S3 or persistent volume for attachment storage
- Redis pub/sub for ticket updates instead of SSE polling
- Rate limiting on all endpoints
- Expand integration tests for RBAC, attachments, and AI fallbacks
