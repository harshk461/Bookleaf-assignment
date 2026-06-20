# BookLeaf Author Support Portal — User Guide

**Live app:** [https://bookleaf.up.railway.app/](https://bookleaf.up.railway.app/)

This guide walks through the deployed demo as an **author** (published writer) or **admin** (BookLeaf support team).

---

## 1. Sign in

1. Open [https://bookleaf.up.railway.app/](https://bookleaf.up.railway.app/)
2. Enter email and password, then click **Sign in**

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| **Author** | `priya.sharma@email.com` | `Password123!` |
| **Admin** | `admin@bookleaf.com` | `Password123!` |

Other seeded authors (e.g. `rohit.kapoor@email.com`) use the same password if you want to test data isolation.

After login, authors land on **My Books**; admins land on the **Ticket Queue**.

> **Note:** The app runs on Railway’s hobby tier. If the service was idle, the first page load after a long pause may take 10–30 seconds.

---

## 2. Author workflow

### 2.1 View your books

1. From the sidebar, go to **My Books**
2. Browse your catalogue — title, status, copies sold, royalty earned/paid/pending
3. Open a book to see sales breakdown and royalty summary

Priya Sharma’s account includes books such as *Whispers of the Ganges* (BK001) with pending royalty — useful for testing royalty-related tickets.

### 2.2 Submit a support ticket

1. Go to **Submit Ticket** (or **My Tickets** → **New ticket**)
2. Fill in:
   - **Book** (optional) — link the ticket to a title
   - **Subject** — short summary
   - **Description** — full details of your issue
   - **Attachment** (optional) — PDF/image, max 5 MB
3. Click **Submit**

**What happens behind the scenes:**

- AI **classifies** the ticket (category + priority) within a few seconds
- An **automatic acknowledgement** from BookLeaf Support is queued and usually appears in the conversation within ~5–15 seconds
- You can keep the ticket detail page open — the thread **refreshes every 3 seconds**

### 2.3 Track and reply to tickets

1. Go to **My Tickets**
2. Click a ticket to open the **Conversation**
3. Read messages from **BookLeaf Support** (left) and your messages (right)
4. Type a reply in **Reply** and click **Send Message** to continue the thread  
   - You cannot reply on **closed** tickets

### 2.4 Example author scenarios to try

| Scenario | Suggested subject | Why |
|----------|-------------------|-----|
| Pending royalty | “Royalty payment overdue” | Triggers `royalty_payments` category; AI ack references your request |
| ISBN issue | “ISBN barcode not showing on Amazon” | Tests `isbn_metadata` classification |
| Print quality | “Misaligned pages in latest print run” | Tests `printing_quality` + KB-aware drafts (admin side) |

---

## 3. Admin workflow

Sign in as `admin@bookleaf.com` / `Password123!`.

### 3.1 Ticket queue

1. Open **Ticket Queue** from the sidebar
2. Use filters: **status**, **category**, **priority**, **date range**
3. The list updates live (SSE) as new tickets arrive
4. Click a row to open the ticket

Default sort prioritizes **critical/high** priority and open tickets first.

### 3.2 Handle a ticket

On the ticket detail page:

**Left column — Conversation**

- Read the author’s initial request and any follow-ups
- Author name appears on their bubbles; your replies show as **You**

**AI Draft Response**

1. Click **Generate Draft** — Gemini drafts a reply using the ticket text + category-specific knowledge base + book context (royalty figures, status, etc.)
2. Edit the text in the textarea
3. Click **Send Response** — message goes to the author’s thread

Drafts are **cached** — reopening the ticket does not call AI again until you regenerate.

**Right column — Ticket details**

- Change **status** (open → in progress → resolved → closed)
- Override **category** or **priority** if AI was wrong
- **Assign** the ticket to yourself or unassign
- Add **internal notes** — visible only to admins, not authors

### 3.3 Recommended admin demo flow

1. Log in as author → submit a royalty ticket for BK001  
2. Log in as admin → find the ticket in the queue (check priority badge)  
3. Open ticket → **Generate Draft** → tweak → **Send Response**  
4. Log back in as author → open ticket → see admin reply within ~3 seconds  
5. Reply as author → confirm admin sees it on refresh  

---

## 4. AI features you should notice

| Feature | Where you see it |
|---------|------------------|
| Auto category/priority | Ticket list badges after create |
| Auto acknowledgement | Second message in author conversation (“We received your ticket…”) |
| AI draft | Admin draft editor; click Generate |
| Fallback behavior | If AI is unavailable, ticket still creates; generic ack/draft text appears |

---

## 5. Roles & permissions

| Action | Author | Admin |
|--------|--------|-------|
| View own books | Yes | No |
| View all tickets | Own only | All |
| Create ticket | Yes | No |
| Reply in public thread | Yes | Yes |
| Internal notes | No | Yes |
| Change status / assign | No | Yes |
| Generate AI draft | No | Yes |

Authors cannot see other authors’ tickets or admin internal notes.

---

## 6. Troubleshooting

| Issue | What to do |
|-------|------------|
| Page loads slowly | Railway cold start — wait and refresh |
| No acknowledgement message | Wait 15s; refresh ticket detail; AI or Redis may be recovering |
| Generate Draft fails | Daily AI budget may be exceeded — write reply manually |
| Login fails | Check email/password; caps lock off |
| Attachment won’t upload | Max 5 MB; use PDF, PNG, or JPEG |

---

## 7. Local development (optional)

If you run the repo locally instead of the live URL:

```bash
docker compose up postgres redis -d
bash scripts/setup.sh
npm run dev
```

Open http://localhost:3000 with the same demo credentials. See [README.md](../README.md) for full setup.

---

## 8. Related documentation

- [USER_GUIDE.md](./USER_GUIDE.md) — this guide (live demo walkthrough)
- [AI_INFRA.md](./AI_INFRA.md) — how Gemini, queues, and fallbacks work  
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Railway, Redis, Postgres setup  
- [WRITEUP.md](../WRITEUP.md) — priorities, trade-offs, production evolution
- [README.md](../README.md) — architecture and API overview  
