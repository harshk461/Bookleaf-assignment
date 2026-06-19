# BookLeaf Technical Assignment 1 — Deep Analysis & Findings

> **Source:** `BookLeaf_Technical_Assignment_1 (full stack) (1) (1).pdf`  
> **Assignment:** Author Support & Communication Portal (Assignment 1 of 2)  
> **Position:** Full-Stack Developer  
> **Duration:** 5 days from date of receipt  
> **Confidentiality:** Do not share publicly or upload to public repos

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Context & Problem Statement](#2-business-context--problem-statement)
3. [What You Are Building](#3-what-you-are-building)
4. [Author Portal Requirements](#4-author-portal-requirements)
5. [Admin Portal Requirements](#5-admin-portal-requirements)
6. [API Layer Requirements](#6-api-layer-requirements)
7. [AI Integration — Critical Evaluation Area](#7-ai-integration--critical-evaluation-area)
8. [BookLeaf Knowledge Base](#8-bookleaf-knowledge-base)
9. [Sample Query → Response Calibration](#9-sample-query--response-calibration)
10. [Sample Dataset Analysis](#10-sample-dataset-analysis)
11. [Technology Guidelines](#11-technology-guidelines)
12. [Deliverables Checklist](#12-deliverables-checklist)
13. [Evaluation Criteria & Scoring](#13-evaluation-criteria--scoring)
14. [Timeline, Process & Follow-Up](#14-timeline-process--follow-up)
15. [Important Notes & Constraints](#15-important-notes--constraints)
16. [Implementation Implications](#16-implementation-implications)
17. [Suggested Data Model](#17-suggested-data-model)
18. [Suggested API Surface](#18-suggested-api-surface)
19. [Edge Cases & Test Scenarios](#19-edge-cases--test-scenarios)
20. [Prioritization Guidance](#20-prioritization-guidance)
21. [Open Questions / Ambiguities](#21-open-questions--ambiguities)

---

## 1. Executive Summary

BookLeaf Publishing needs a **dual-portal web application** (author-facing + admin-facing) to scale author support operations. The core value proposition is **AI-assisted ticket handling**: auto-classification, auto-prioritization, and AI-drafted responses grounded in a provided knowledge base.

**What matters most to evaluators (by weight):**

| Priority | Area | Weight |
|----------|------|--------|
| 1 | AI Integration Quality | 25% |
| 1 | Architecture & Code Quality | 25% |
| 2 | API Design | 15% |
| 2 | Functionality & Completeness | 15% |
| 3 | Product Thinking | 10% |
| 3 | Documentation & Communication | 10% |

**Explicit non-goals:** Pixel-perfect UI. Evaluators want architecture, code quality, AI integration, and product thinking — not design polish.

---

## 2. Business Context & Problem Statement

### Company Profile

- **BookLeaf Publishing** — self-publishing company
- **Scale:** 1,200+ books processed monthly; 22,000+ titles in catalog
- **Geography:** Authors across **India** and the **US**
- **Operations:** Thousands of active authors

### Operational Pain Point

Authors frequently contact BookLeaf about:

- Royalties
- Book status
- ISBN issues
- Printing quality

**Current state:** Manual handling → delayed responses, inconsistent communication, growing backlog (especially during high-volume periods).

### Your Mission

Build a solution that helps BookLeaf's team handle author support queries **faster**, **more consistently**, and with **less manual effort**.

---

## 3. What You Are Building

**Product name:** Author Support & Communication Portal

**Architecture (conceptual):**

```
┌─────────────────┐     REST API      ┌─────────────────┐
│  Author Portal  │ ◄──────────────► │                 │
│  (React/etc.)   │                   │    Backend      │
└─────────────────┘                   │  + Database     │
                                      │  + AI Service   │
┌─────────────────┐     REST API      │  + Real-time    │
│  Admin Portal   │ ◄──────────────► │                 │
│  (React/etc.)   │                   └────────┬────────┘
└─────────────────┘                            │
                                               ▼
                                    ┌─────────────────┐
                                    │  LLM API        │
                                    │  (server-side)  │
                                    └─────────────────┘
```

**Two distinct user roles:**

| Role | Access |
|------|--------|
| **Author** | Own data only — books, tickets, responses |
| **Admin** | All authors, all tickets, AI tools, internal notes |

---

## 4. Author Portal Requirements

A simple dashboard where an author logs in and interacts with their BookLeaf account.

### 4.1 Authentication

| Requirement | Detail |
|-------------|--------|
| Method | Email + password (simple) |
| Excluded | OTP, social login |
| Data isolation | Each author sees **only their own data** |

### 4.2 My Books Page

Display the author's published books with these fields:

| Field | Notes |
|-------|-------|
| Title | |
| ISBN | |
| Genre | |
| Publication date | May be `null` for in-production books |
| Status | e.g. `Published & Live`, `In Production - Cover Design` |
| MRP | May be `null` for in-production books |
| Total copies sold | |
| Total royalty earned | |
| Royalty paid | |
| Royalty pending | |

**Implication:** UI must handle books still in production (null/missing financial fields, zero sales).

### 4.3 Submit a Support Query

Form fields:

| Field | Type | Required |
|-------|------|----------|
| Book selection | Dropdown — author's books OR "General / Account Level" | Yes |
| Subject | Text | Yes |
| Description | Detailed text area | Yes |
| File attachment | Optional | UI only — **actual upload is bonus, not required** |

**On submit:** Creates a ticket that flows into admin queue and triggers AI classification + priority scoring.

### 4.4 My Tickets Page

| Requirement | Detail |
|-------------|--------|
| List | All tickets submitted by the logged-in author |
| Status values | `Open`, `In Progress`, `Resolved`, `Closed` |
| Content shown | Original query + admin team responses |
| Real-time | Updates when admin responds — **without page refresh** |

**Real-time options (your choice):** WebSockets, SSE, or polling — must feel responsive.

---

## 5. Admin Portal Requirements

Internal dashboard for BookLeaf operations team.

### 5.1 Ticket Queue

| Feature | Detail |
|---------|--------|
| Scope | All tickets across all authors |
| Filters | Status, category, priority, date |
| UX goal | Urgent + oldest unresolved tickets should be **easy to spot** |

**Sorting/priority UX implication:** Default sort should surface Critical/High priority and/or oldest Open tickets first.

### 5.2 AI-Powered Auto-Classification

On new ticket creation, automatically classify into **exactly one** of:

1. Royalty & Payments
2. ISBN & Metadata Issues
3. Printing & Quality
4. Distribution & Availability
5. Book Status & Production Updates
6. General Inquiry

| Override | Admin can override AI classification if wrong |

### 5.3 AI-Generated Priority Score

Automatic priority based on ticket content:

| Levels | Critical / High / Medium / Low |
|--------|-------------------------------|

**Examples from spec:**

- *"I haven't received any royalty for 6 months"* → **higher** priority
- *"Can I update my author bio?"* → **lower** priority

| Override | Admin can override AI priority |

### 5.4 AI-Drafted Response

When admin **opens** a ticket:

1. System presents AI-generated draft response
2. Draft uses: query content + **BookLeaf Knowledge Base**
3. Admin can **edit** draft before sending
4. Sent response appears on author's ticket view (real-time)

### 5.5 Ticket Management

Admins can:

| Action | Visibility |
|--------|------------|
| Update ticket status | Author-visible |
| Add internal notes | **Not visible to author** |
| Assign ticket to themselves | Admin-only metadata |

---

## 6. API Layer Requirements

Frontend and backend communicate via **clean REST API**.

| Requirement | Detail |
|-------------|--------|
| Endpoint structure | Consistent naming conventions |
| Auth middleware | Protects **all** routes |
| RBAC | Authors → own data only; Admins → everything |
| Validation | Input validation + meaningful error responses (not generic 500s) |
| Documentation | Swagger/OpenAPI, Postman collection, OR well-structured README |

---

## 7. AI Integration — Critical Evaluation Area

This is the **highest-weighted criterion (25%)**. Evaluators want production-minded AI integration, not a bare API call.

### 7.1 Prompt Engineering

- Well-structured prompts
- Use provided Knowledge Base as context
- Responses must sound like a **real BookLeaf support rep** — not generic AI fluff
- Match communication tone guidelines (see Section 8)

### 7.2 API Key Security

- Store API keys in **environment variables**
- **Never** hardcode or expose to frontend
- **Evaluators will check for this**

### 7.3 Error Handling / Graceful Degradation

When AI API is down or rate-limited:

| Must still work | |
|-----------------|---|
| Ticket creation | Yes |
| Manual admin responses | Yes |
| Classification/priority | Should fail gracefully (manual fallback or default values) |
| Draft generation | Admin writes response manually |

### 7.4 Cost Awareness

Demonstrate thoughtful token usage:

- Don't send entire ticket history + full knowledge base on every call if unnecessary
- Consider: summarization, selective context injection, caching KB snippets, separate smaller prompts for classification vs. drafting

### 7.5 Model Choice

- OpenAI, Anthropic, or any LLM API
- **Justify choice briefly in documentation**
- Suggested cost-effective options: `gpt-4o-mini`, Claude Haiku

### 7.6 Three Distinct AI Tasks

| Task | Trigger | Output |
|------|---------|--------|
| Classification | New ticket created | One of 6 categories |
| Priority scoring | New ticket created | Critical / High / Medium / Low |
| Response drafting | Admin opens ticket | Editable draft text |

**Design decision:** Classification + priority can share one LLM call (structured JSON output) or be separate — document the trade-off.

---

## 8. BookLeaf Knowledge Base

This content must be provided to the AI system as context. AI responses must reflect these policies accurately.

### 8.1 Company Overview

- Self-publishing company in **India** and **US**
- **Packages:**
  - **Standard Free** — no upfront cost
  - **Bestseller Breakthrough** — premium paid package with marketing/distribution add-ons
- Services: cover design, typesetting, ISBN assignment, printing, distribution, royalty management
- **Printing:** In-house facility + warehouse in **Delhi**
- **Print partners:** Repro India, Epitome Books

### 8.2 Royalty Policy

| Rule | Detail |
|------|--------|
| Split | **80/20** — 80% net profit to author, 20% to BookLeaf |
| Net profit formula | MRP − printing cost − platform commission (Amazon/Flipkart) − shipping |
| Calculation cycle | **Quarterly** |
| Payout timing | Within **45 days** of quarter end |
| Minimum threshold | **₹1,000** — below this rolls over to next quarter |
| Payout method | Bank transfer to account linked in author dashboard |
| Transparency | Authors can view detailed royalty breakdown per platform in dashboard |

### 8.3 ISBN Policy

| Rule | Detail |
|------|--------|
| Assignment | Every BookLeaf-published book gets unique ISBN from BookLeaf |
| Imprint | Registered under BookLeaf's publisher imprint |
| Own imprint | Author must obtain ISBN independently |
| Errors | Duplicate/wrong book linked → **high-priority**, escalate to production team |

### 8.4 Printing & Quality

| Rule | Detail |
|------|--------|
| Primary | In-house printing for most orders |
| Overflow | Repro India or Epitome Books for overflow/specific formats |
| Turnaround | **5–7 business days** from order confirmation |
| Quality issues | Free reprint after verification; author may need to share photos of defective copy |

### 8.5 Distribution & Availability

| Platform | |
|----------|---|
| Channels | Amazon India, Flipkart, Amazon US, Amazon UK, BookLeaf Store |
| New listings | Live within **7–10 business days** after publication complete |
| Unavailable status | Usually stock sync issue — re-sync within **24–48 hours** |

### 8.6 Production Stages

Pipeline order:

```
Manuscript Received
  → Editing (if opted)
  → Cover Design
  → Typesetting
  → Proofreading
  → ISBN Assignment
  → Printing
  → Distribution Setup
  → Published & Live
```

- Authors updated at each stage via email
- Common delay points: **Cover Design** (author approval), **Proofreading** (revision rounds)

### 8.7 Communication Tone Guidelines

AI responses must:

| Guideline | |
|-----------|---|
| Tone | Empathetic, professional — authors are **partners**, not customers to manage |
| Structure | Acknowledge concern **before** solutions |
| Specificity | Use actual numbers, dates, statuses — not vague reassurances |
| Accountability | Own BookLeaf's mistakes directly (delayed royalties, ISBN errors) |
| Escalation | Give clear timelines ("within 48 hours") not open-ended promises |
| Closing | Always end with clear next step for author and/or BookLeaf team |

---

## 9. Sample Query → Response Calibration

Use these examples to calibrate AI output:

| Category | Sample Query | Expected Response Approach |
|----------|--------------|---------------------------|
| **Royalty & Payments** | Published 4 months ago, no royalty received | Acknowledge frustration; explain quarterly cycle + 45-day payout; check bank details; give specific next payout date; if overdue → escalate with 48-hour timeline |
| **Royalty & Payments** | Sold 200 copies, only ₹3,000 royalty | Explain net profit calc (MRP − printing − commission − shipping); offer line-by-line breakdown; be transparent, not defensive |
| **ISBN & Metadata** | Different ISBN on Amazon vs physical copy | **High priority**; acknowledge serious data issue; escalate to production immediately; 48-hour resolution timeline |
| **Printing & Quality** | Author copies terrible — blurry images, misaligned pages | Sincere apology; ask for photos; confirm free reprint after verification; 5–7 business day reprint timeline |
| **Distribution** | Published but "Currently Unavailable" on Amazon | Explain stock sync issue; trigger re-sync; 24–48 hour expectation |
| **Production Updates** | 3 weeks in typesetting, when done? | Check actual status; be honest about delays (e.g. waiting on author proof approval); specific updated timeline; collaborative framing |
| **General** | Update book description on Amazon after live? | Yes — via dashboard or email; reflects in 3–5 business days |

---

## 10. Sample Dataset Analysis

**File:** `bookleaf_sample_data (full stack) (1) (1).json`

### 10.1 Summary Statistics

| Metric | Value |
|--------|-------|
| Authors | 10 |
| Books | 18 |
| Avg books/author | 1.8 |

**Evaluators will test using these exact records** — seed DB must match.

### 10.2 Author Roster

| ID | Name | Email | City | Joined |
|----|------|-------|------|--------|
| AUTH001 | Priya Sharma | priya.sharma@email.com | Mumbai | 2023-03-15 |
| AUTH002 | Rohit Kapoor | rohit.kapoor@email.com | Delhi | 2022-11-08 |
| AUTH003 | Ananya Reddy | ananya.reddy@email.com | Hyderabad | 2024-02-20 |
| AUTH004 | Vikram Joshi | vikram.joshi@email.com | Pune | 2023-07-12 |
| AUTH005 | Meera Nair | meera.nair@email.com | Kochi | 2023-01-05 |
| AUTH006 | Arjun Malhotra | arjun.malhotra@email.com | Chandigarh | 2024-06-01 |
| AUTH007 | Sneha Kulkarni | sneha.kulkarni@email.com | Bangalore | 2022-09-18 |
| AUTH008 | Farhan Sheikh | farhan.sheikh@email.com | Lucknow | 2023-10-01 |
| AUTH009 | Kavita Deshmukh | kavita.deshmukh@email.com | Nagpur | 2024-04-10 |
| AUTH010 | Diya Chatterjee | diya.chatterjee@email.com | Kolkata | 2023-05-22 |

### 10.3 Book Inventory

| Book ID | Title | Author | Status | Copies Sold | Royalty Pending |
|---------|-------|--------|--------|-------------|-----------------|
| BK001 | Whispers of the Ganges | Priya Sharma | Published & Live | 342 | ₹3,570 |
| BK002 | The Saffron Diaries | Priya Sharma | Published & Live | 189 | ₹0 |
| BK003 | Code & Karma | Rohit Kapoor | Published & Live | 876 | ₹5,280 |
| BK004 | Startup Sutra | Rohit Kapoor | Published & Live | 1,203 | ₹7,744 |
| BK005 | Between Two Temples | Ananya Reddy | Published & Live | 67 | ₹2,546 |
| BK006 | Debugging Life | Vikram Joshi | Published & Live | 534 | ₹3,350 |
| BK007 | The Last Monsoon | Vikram Joshi | Published & Live | 123 | ₹0 |
| BK008 | Cardamom & Chaos | Meera Nair | Published & Live | 445 | ₹0 |
| BK009 | Letters from Lakshadweep | Meera Nair | Published & Live | 201 | ₹3,055 |
| BK010 | Turban Tales | Arjun Malhotra | Published & Live | 88 | ₹2,464 |
| BK011 | The Algorithm of Love | Sneha Kulkarni | Published & Live | 1,567 | ₹4,175 |
| BK012 | Ctrl+Alt+Delete My Ex | Sneha Kulkarni | Published & Live | 723 | ₹3,690 |
| BK013 | Midnight in Mysore | Sneha Kulkarni | **In Production - Cover Design** | 0 | ₹0 |
| BK014 | Ghazal of the Forgotten | Farhan Sheikh | Published & Live | 156 | ₹0 |
| BK015 | Raising Roots | Kavita Deshmukh | **In Production - Typesetting** | 0 | ₹0 |
| BK016 | The Nagpur Notebooks | Kavita Deshmukh | Published & Live | 34 | ₹850 |
| BK017 | Durga's Daughters | Diya Chatterjee | Published & Live | 612 | ₹2,540 |
| BK018 | Howrah Nights | Diya Chatterjee | Published & Live | 45 | ₹1,575 |

### 10.4 Intentional Edge Cases in Dataset

The variety is **deliberate** — system must handle all gracefully:

| Edge Case | Examples in Data |
|-----------|------------------|
| **Books in production** | BK013 (Cover Design), BK015 (Typesetting) — `publication_date: null`, `mrp: null`, empty `available_on` |
| **Zero royalty paid** | BK005, BK010, BK016, BK018 — `royalty_paid: 0`, pending amounts exist |
| **Never paid out** | `last_royalty_payout_date: null` on BK005, BK010, BK016, BK018 |
| **Fully paid out** | BK002, BK007, BK008, BK014 — `royalty_pending: 0` |
| **Below minimum payout threshold** | BK016 (₹850 pending), BK018 (₹1,575 pending) — under ₹1,000 rollover rule |
| **High-volume sellers** | BK004 (1,203 copies), BK011 (1,567 copies) |
| **Multi-platform distribution** | BK004 on 5 platforms; BK013/BK015 on 0 platforms |
| **Different print partners** | In-House, Repro India, Epitome Books |
| **Recent publication** | BK018 published 2025-01-20 |
| **Null financial fields** | In-production books have null MRP and `author_royalty_per_copy` |

### 10.5 Dataset Schema

**Author object:**

```
author_id, name, email, phone, city, joined_date, books[]
```

**Book object:**

```
book_id, title, isbn, genre, publication_date, status, mrp,
author_royalty_per_copy, total_copies_sold, total_royalty_earned,
royalty_paid, royalty_pending, last_royalty_payout_date,
print_partner, available_on[]
```

**Note:** Dataset does not include passwords — you must generate seed credentials for test logins (document in README).

**Note:** Dataset does not include admin users — you must create at least one admin account for demo.

---

## 11. Technology Guidelines

All choices are **yours** — evaluators care about decisions and justification, not specific stacks.

| Layer | Options (examples) |
|-------|-------------------|
| **Frontend** | React, Next.js, Vue, or any modern JS framework |
| **Backend** | Node.js (Express/Fastify), Python (FastAPI/Django), etc. |
| **Database** | PostgreSQL, MongoDB, etc. — **schema design matters** |
| **AI/LLM** | OpenAI, Anthropic, etc. — use your own API key for dev |
| **Real-time** | WebSockets, SSE, or polling |
| **Deployment** | Vercel, Railway, Render, VPS — **live URL required** |

**Cost-conscious model suggestions:** `gpt-4o-mini`, Claude Haiku

---

## 12. Deliverables Checklist

### 12.1 Source Code

- [ ] Private GitHub/GitLab repository
- [ ] Add evaluator email as collaborator (provided separately)
- [ ] Clean commit history showing progression (plus)

### 12.2 Live Demo

- [ ] Deployed, accessible URL
- [ ] Both author and admin portals working
- [ ] Pre-seeded with provided dataset
- [ ] Test login credentials in README

### 12.3 README Documentation

Must cover:

- [ ] Local setup and run instructions
- [ ] Architecture decisions and rationale
- [ ] AI integration: prompt strategy, error handling, cost management
- [ ] API documentation or link to it
- [ ] Known limitations and future improvements

### 12.4 Brief Write-Up (max 1 page)

- [ ] What you prioritized
- [ ] Trade-offs made
- [ ] How you'd evolve this into a production system

---

## 13. Evaluation Criteria & Scoring

| Criteria | Weight | What They're Looking For |
|----------|--------|--------------------------|
| **AI Integration Quality** | **25%** | Prompt design, KB usage, response quality, classification accuracy, graceful degradation, cost-consciousness |
| **Architecture & Code Quality** | **25%** | Clean structure, separation of concerns, meaningful abstractions, readable code, proper error handling — no spaghetti |
| **API Design** | **15%** | RESTful conventions, auth, RBAC, validation, error responses, documentation |
| **Functionality & Completeness** | **15%** | Both portals work; full ticket lifecycle; real-time updates; edge cases (empty states, in-production books, zero royalties) |
| **Product Thinking** | **10%** | Feels usable by real authors and ops team; thoughtful UX; sensible defaults; practical workflows |
| **Documentation & Communication** | **10%** | README quality, architecture explanation, write-up clarity, commit messages, inline comments where needed |

---

## 14. Timeline, Process & Follow-Up

| Item | Detail |
|------|--------|
| **Deadline** | 5 days from receipt |
| **Extensions** | Ask before deadline for legitimate reasons — they're reasonable |
| **Post-submission** | If you pass → 45–60 min technical discussion |
| **Discussion format** | Walk through code, architecture, AI approach — conversation, not interrogation |
| **Requirement** | Must be able to explain every line of code (even if you used AI tools during dev) |

---

## 15. Important Notes & Constraints

| Note | Implication |
|------|-------------|
| **Confidential** | No public repos, no sharing assignment publicly |
| **AI tools allowed** | Copilot, ChatGPT, etc. — but you must own/explain the code |
| **Ask questions** | Email if unclear — good questions are a **positive signal** |
| **Working > perfect** | If short on time: prioritize **core ticket flow + AI integration** over nice-to-haves |
| **UI bar** | Clean and functional is sufficient — not pixel-perfect |

---

## 16. Implementation Implications

### 16.1 Core User Flows

**Author flow:**

```
Login → View Books → Submit Ticket → View Tickets (real-time updates)
```

**Admin flow:**

```
Login → View Queue (filtered/sorted) → Open Ticket
  → See AI classification + priority (override if needed)
  → See AI draft response → Edit → Send
  → Update status / Add internal note / Self-assign
```

**System flow (on ticket creation):**

```
Author submits ticket
  → Persist ticket (status: Open)
  → AI: classify category
  → AI: assign priority
  → Notify admin queue (real-time optional)
  → On AI failure: ticket still created with defaults/manual flags
```

### 16.2 Ticket Lifecycle

```
Open → In Progress → Resolved → Closed
```

- Admin drives status transitions
- Author sees status + public responses only (not internal notes)

### 16.3 Security Model

| Concern | Approach |
|---------|----------|
| Authentication | JWT/session — all API routes protected |
| Authorization | Role middleware: `author` vs `admin` |
| Data scoping | Author queries filtered by `author_id` from token |
| AI keys | Server-side only, env vars |
| File upload | Bonus only — can skip backend implementation |

### 16.4 Real-Time Strategy Options

| Approach | Pros | Cons |
|----------|------|------|
| WebSockets | True push, best UX | More infra complexity |
| SSE | Simpler than WS, one-way push | One-direction only |
| Polling (3–5s) | Easiest to implement | Higher load, slight delay |

For a 5-day assignment, **SSE or short-interval polling** is often sufficient if implemented cleanly.

### 16.5 AI Architecture Pattern

Recommended separation:

```
┌──────────────────────────────────────────┐
│           AI Service Module              │
├──────────────────────────────────────────┤
│  classifyAndPrioritize(ticket) → JSON    │
│  draftResponse(ticket, author, book,   │
│                kbContext) → text         │
├──────────────────────────────────────────┤
│  - Structured output (JSON mode)         │
│  - KB injected as system prompt chunk    │
│  - Author/book context from DB           │
│  - Retry + fallback on failure           │
│  - Token budgeting / logging               │
└──────────────────────────────────────────┘
```

---

## 17. Suggested Data Model

Entities beyond the provided JSON:

### Users

```
User: id, email, password_hash, role (author|admin), author_id (nullable)
```

### Tickets

```
Ticket:
  id, author_id, book_id (nullable for general queries),
  subject, description,
  status (open|in_progress|resolved|closed),
  category (enum — 6 values),
  priority (critical|high|medium|low),
  ai_category (original AI classification),
  ai_priority (original AI priority),
  category_overridden (bool),
  priority_overridden (bool),
  assigned_admin_id (nullable),
  created_at, updated_at
```

### Ticket Messages (public responses)

```
TicketMessage:
  id, ticket_id, sender_type (author|admin),
  sender_id, content, created_at
```

### Internal Notes

```
InternalNote:
  id, ticket_id, admin_id, content, created_at
```

### Books & Authors

Seed directly from JSON; add password hashes for authors + create admin user(s).

---

## 18. Suggested API Surface

Illustrative — naming should be consistent and RESTful:

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (returns token) |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user profile |

### Author — Books

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/author/books` | List own books |

### Author — Tickets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/author/tickets` | List own tickets |
| POST | `/api/author/tickets` | Create ticket |
| GET | `/api/author/tickets/:id` | Ticket detail + messages |
| GET | `/api/author/tickets/stream` | SSE for real-time updates (optional) |

### Admin — Tickets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/tickets` | List all (with filters) |
| GET | `/api/admin/tickets/:id` | Detail + messages + notes + AI draft |
| PATCH | `/api/admin/tickets/:id` | Update status, category, priority, assignee |
| POST | `/api/admin/tickets/:id/responses` | Send response to author |
| POST | `/api/admin/tickets/:id/notes` | Add internal note |
| POST | `/api/admin/tickets/:id/ai-draft` | Regenerate AI draft (optional) |

### Query params for admin ticket list

```
?status=open&category=royalty_payments&priority=high&from=2025-01-01&sort=priority,created_at
```

---

## 19. Edge Cases & Test Scenarios

### Author Portal

- [ ] Author with 1 book vs 3 books — dropdown populates correctly
- [ ] "General / Account Level" ticket — no book_id
- [ ] In-production book in dropdown (BK013, BK015) — still selectable for production-status queries
- [ ] Book with null MRP / publication date displays gracefully
- [ ] Book with ₹0 royalty pending shows correctly
- [ ] Book below ₹1,000 threshold (BK016) — relevant for royalty ticket AI responses
- [ ] Empty ticket list state for new author (if you add one)
- [ ] Real-time: admin response appears without refresh

### Admin Portal

- [ ] Queue shows tickets from all 10 authors
- [ ] Filter by each status, category, priority, date range
- [ ] Critical/High + old Open tickets visually prominent
- [ ] AI misclassifies → admin overrides category/priority
- [ ] AI API down → ticket created, manual response works
- [ ] Internal notes never leak to author API/view
- [ ] Self-assignment persists

### AI Quality Spot Checks

| Input | Expected Category | Expected Priority |
|-------|-------------------|-------------------|
| "No royalty for 6 months" | Royalty & Payments | High/Critical |
| "ISBN mismatch on Amazon" | ISBN & Metadata Issues | High/Critical |
| "Blurry print on author copies" | Printing & Quality | High |
| "Unavailable on Amazon" | Distribution & Availability | Medium/High |
| "Stuck in typesetting 3 weeks" | Book Status & Production Updates | Medium |
| "Update author bio" | General Inquiry | Low |

### Security

- [ ] Author A cannot access Author B's books or tickets (403)
- [ ] Author cannot access `/api/admin/*` routes
- [ ] Unauthenticated requests rejected
- [ ] LLM API key not in frontend bundle or git history

---

## 20. Prioritization Guidance

If time is tight, build in this order:

### Must Have (Day 1–3)

1. Project scaffold + DB schema + seed script from JSON
2. Auth (author + admin) with RBAC
3. Author: My Books, Submit Ticket, My Tickets
4. Admin: Ticket queue with filters
5. AI: classification + priority on ticket create
6. AI: draft response on ticket open
7. Admin: send response, update status
8. Real-time ticket updates (even simple polling)

### Should Have (Day 4)

9. Internal notes + self-assignment
10. AI override for category/priority
11. Graceful AI degradation
12. API docs (Swagger or README)
13. Deployment + live demo

### Nice to Have (Day 5 / if time)

14. File attachment UI
15. Actual file upload
16. WebSockets instead of polling
17. AI draft regeneration button
18. Email notifications (not required)

---

## 21. Open Questions / Ambiguities

Items not fully specified — reasonable defaults or ask BookLeaf:

| Question | Suggested Default |
|----------|-------------------|
| Can authors reply to tickets (thread) or only view admin responses? | Read-only for author after submit; admin sends responses |
| Password for seed authors? | Generate uniform test password (e.g. `Password123!`) — document in README |
| How many admin users? | One shared admin account for demo |
| Ticket categories stored as slug or display name? | Use enum/slug internally, display friendly name in UI |
| Should AI draft include author-specific data (royalty figures from DB)? | **Yes** — spec says "specific numbers, dates, statuses" |
| Currency display? | INR (₹) — all sample data uses rupees |
| Timezone for dates? | IST reasonable given India focus |
| Can authors reopen closed tickets? | Not specified — skip unless time permits |

---

## Quick Reference Card

```
PRODUCT:     Author Support & Communication Portal
ROLES:       Author (own data) | Admin (all data)
TICKET STATUS: Open → In Progress → Resolved → Closed
AI CATEGORIES (6): Royalty & Payments | ISBN & Metadata | Printing & Quality |
                   Distribution & Availability | Book Status & Production | General
AI PRIORITY (4): Critical | High | Medium | Low
DATA:        10 authors, 18 books (seed exactly)
DEADLINE:    5 days
TOP WEIGHT:  AI Integration (25%) + Architecture (25%)
SKIP:        Pixel-perfect UI, file upload backend
MUST:        Live URL, private repo, README, 1-page write-up, test credentials
```

---

*Generated from deep analysis of BookLeaf Technical Assignment 1 PDF and accompanying sample dataset.*
