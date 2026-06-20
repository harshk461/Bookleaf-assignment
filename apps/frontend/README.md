# BookLeaf Frontend

Next.js 15 App Router — author and admin portals for the BookLeaf Author Support Portal.

## Development

From the **repo root**:

```bash
npm run dev:frontend
```

Or run all services together: `npm run dev` (see root [README.md](../../README.md)).

- Local app: http://localhost:3000
- API (backend): http://localhost:4000

## Routes

Screen components live in `src/views/` (not `src/pages/`) to avoid conflicting with the Pages Router.

| Route | Component |
|-------|-----------|
| `/login` | `src/views/auth/LoginPage.tsx` |
| `/author/books` | `src/views/author/MyBooksPage.tsx` |
| `/author/books/[id]` | `src/views/author/BookDetailPage.tsx` |
| `/author/tickets/new` | `src/views/author/SubmitTicketPage.tsx` |
| `/author/tickets` | `src/views/author/MyTicketsPage.tsx` |
| `/author/tickets/[id]` | `src/views/author/AuthorTicketDetailPage.tsx` |
| `/admin/tickets` | `src/views/admin/TicketQueuePage.tsx` |
| `/admin/tickets/[id]` | `src/views/admin/TicketDetailPage.tsx` |

## Environment

Copy `.env.example` to `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Docs

- [Root README](../../README.md) — setup, architecture, live demo
- [USER_GUIDE](../../docs/USER_GUIDE.md) — evaluator walkthrough
