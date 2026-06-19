# BookLeaf Assignment — Write-up

> One-page summary of priorities, trade-offs, and production evolution.

## Priorities (5-day scope)

1. **Data correctness** — Seed 10 authors / 18 books from provided JSON; author data isolation via JWT-scoped API
2. **Core flows** — Login, My Books, Submit Ticket, My Tickets, Admin queue + AI draft
3. **AI isolation** — OpenAI key only in internal FastAPI service; graceful fallbacks
4. **Deployability** — Docker Compose + Railway-ready monorepo

## Trade-offs

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend | Next.js 15 App Router | User preference; file-based routing maps cleanly to author/admin portals |
| Real-time | SSE + 5s polling fallback | Simpler than WebSockets on free tiers |
| ORM | Raw SQL + `pg` | Transparent queries for assignment evaluators |
| UI | Functional Tailwind | Assignment allows non-pixel-perfect UI |

## Production Next Steps

- Move SSE auth to httpOnly cookies (EventSource cannot send `Authorization` header)
- Add rate limiting and request validation on all endpoints
- Persist AI drafts to `ai_draft_responses` table with versioning
- Add integration tests for RBAC and author scope
- Redis pub/sub for ticket updates instead of polling
