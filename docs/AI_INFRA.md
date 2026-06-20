# BookLeaf — AI Infrastructure & Provider Choice

> How AI is wired in this project, what each model call does, and why **Google Gemini** was chosen over OpenAI GPT or Anthropic Claude.

---

## 1. Architecture at a glance

```
┌─────────────┐     REST      ┌─────────────┐     HTTP (internal)   ┌──────────────┐
│  Frontend   │ ────────────► │   Backend   │ ────────────────────► │  AI Service  │
│  (Next.js)  │               │  (Fastify)  │                       │  (FastAPI)   │
└─────────────┘               └──────┬──────┘                       └──────┬───────┘
                                     │                                      │
                              ┌──────┴──────┐                               │
                              │    Redis    │  BullMQ ack queue              │
                              │  (BullMQ)   │                               ▼
                              └─────────────┘                      ┌─────────────────┐
                                     │                             │  Google Gemini  │
                              ┌──────┴──────┐                     │ gemini-flash-*  │
                              │ PostgreSQL  │                     └─────────────────┘
                              └─────────────┘
```

**Security rule:** `GEMINI_API_KEY` exists **only** in `apps/ai-service`. The browser and backend never hold or expose it. The backend calls the AI service over private networking on Railway.

| Layer | Responsibility |
|-------|----------------|
| **Frontend** | UI only — no LLM calls |
| **Backend** | Auth, tickets, queues; proxies AI via `AI_SERVICE_URL` |
| **Redis + BullMQ** | Async acknowledgement jobs with retries |
| **AI service** | Prompts, token limits, cost cap, Gemini client |
| **PostgreSQL** | Tickets, messages, `ticket_ai_logs`, cached drafts |

---

## 2. What AI does in this product

| Task | Trigger | Endpoint | Sync / async | Output |
|------|---------|----------|--------------|--------|
| **Classify + prioritize** | Author submits ticket | `POST /classify` | Sync (blocks create until done or fallback) | JSON: `category`, `priority` |
| **Auto-acknowledgement** | After ticket create | `POST /acknowledge` | **Async** via Redis queue | Short admin-thread message to author |
| **Draft response** | Admin clicks *Generate Draft* | `POST /draft` | On demand | Longer support reply grounded in KB |

### Prompt design

- **System base + task prompt** per endpoint (`classify`, `draft`, `acknowledge`)
- **Knowledge base injection** — only the section relevant to the ticket category (royalty, ISBN, printing, etc.), not the full 8-page policy doc
- **Token budgets** — description truncated to 2,000 chars; output caps: classify 256, draft 512, acknowledge 192 tokens
- **Thinking disabled** for short JSON/text tasks (`thinking_budget=0`) so tokens go to the actual reply, not internal reasoning

### Reliability & cost controls

- **Fallbacks** — if Gemini is down or returns invalid JSON: `general_inquiry` / `medium` for classify; canned text for draft/ack
- **Daily spend cap** — `MAX_DAILY_SPEND_USD` in AI service; draft/ack return 503 when exceeded; classify still falls back
- **Audit trail** — every call logged in `ticket_ai_logs` (tokens, latency, estimated USD, model version)
- **Ack queue** — BullMQ job `ticket-ack:{ticketId}`, 5 attempts, exponential backoff (2s base), idempotent processor

---

## 3. Why Gemini over OpenAI (GPT) or Anthropic (Claude)

The assignment allows any LLM provider. This build uses **Google Gemini** (`gemini-flash-latest`). The choice is both **practical** and **technical**.

### 3.1 Practical constraint (honest)

During development, **OpenAI billing could not be enabled** on the project account, so GPT-4o / GPT-4o mini could not be used in production for this demo. [Google AI Studio](https://aistudio.google.com/apikey) provides a **free API tier** that was sufficient to ship classify, acknowledge, and draft flows on a student/assignment budget (~$0 LLM spend target in [DEPLOYMENT.md](./DEPLOYMENT.md)).

That alone would justify *any* working provider. Gemini was the fastest path to a live, evaluable demo on [Railway](https://bookleaf.up.railway.app/).

### 3.2 Technical fit for BookLeaf support AI

Even comparing on merits (not only cost), Gemini Flash is a strong match for **classification, short acknowledgements, and policy-grounded drafts**:

| Criterion | Gemini Flash (this project) | OpenAI GPT-4o mini | Anthropic Claude Haiku / Sonnet |
|-----------|---------------------------|--------------------|----------------------------------|
| **Structured JSON output** | Native `response_mime_type: application/json` for classify | JSON mode supported | Tool/schema patterns; slightly more setup |
| **Reasoning for support triage** | Gemini 2.5 Flash family includes configurable [thinking models](https://developers.googleblog.com/en/gemini-2-5-thinking-model-updates/); strong science/reasoning benchmarks (e.g. GPQA) for its tier ([comparison data](https://www.neura.market/models/compare/google-gemini-2-5-flash-vs-openai-gpt-4o-mini)) | Solid general reasoning; higher list input price | Excellent prose/reasoning; higher $/token for Sonnet |
| **Long context** | Up to **1M tokens** — headroom if KB retrieval expands | 128K typical | 200K+ on newer Claude; overkill for current prompts |
| **Latency profile** | Flash line optimized as a “workhorse” for chat, extraction, classification ([Google positioning](https://developers.googleblog.com/en/gemini-2-5-thinking-model-updates/)) | Low latency mini tier | Haiku fast; Sonnet slower/costlier |
| **Free / low-cost demo tier** | Google AI Studio free tier for dev | Pay-as-you-go from first token | No comparable free tier for API |
| **Provider swap cost** | Isolated in `apps/ai-service` — backend unchanged | Would require new client + prompts | Same |

**Why not GPT for this codebase?**

- GPT-4o mini is often **cheaper per token** at list price ([e.g. ~$0.15/M input vs ~$0.30/M for Gemini 2.5 Flash](https://aicostcheck.com/compare/gemini-2-5-flash-vs-gpt-4o-mini)) — so the decision here is **not** “Gemini is cheaper.”
- GPT would have been a fine choice **if billing were available**. We would swap only `gemini_client.py` + env vars; queue and backend contracts stay the same.

**Why not Anthropic?**

- Claude excels at long-form, nuanced writing and safety-heavy reasoning — valuable for complex editorial support.
- For this assignment’s scope (JSON classify, 2–4 sentence ack, structured draft with KB snippets), **Flash-class models** are enough; Claude Sonnet’s quality premium does not justify the cost for high-volume auto-ack + classify on a $0–5/month infra budget.
- Claude Haiku is closer in price/latency, but still lacked the frictionless free-tier path Gemini offered for this timeline.

### 3.3 Reasoning in production (how we use it)

Gemini’s newer Flash models can spend tokens on internal “thinking.” For BookLeaf:

- **Classify / acknowledge / draft** disable thinking (`thinking_budget=0`) — we need fast, deterministic JSON or short text, not chain-of-thought.
- If we later add **complex royalty dispute analysis** (multi-book, multi-quarter), enabling a small thinking budget on a Pro/Flash thinking variant would be the first upgrade — still within the same Gemini API.

This matches Google’s split between **Flash** (throughput + everyday reasoning) and **Pro** (harder agentic tasks), documented in their [Gemini 2.5 thinking updates](https://developers.googleblog.com/en/gemini-2-5-thinking-model-updates/).

---

## 4. Request flow examples

### Ticket create (author)

1. Backend saves ticket + initial author message  
2. **Sync:** `POST /classify` → updates `category`, `priority`, `ticket_ai_logs`  
3. **Async:** enqueue BullMQ job → worker calls `POST /acknowledge` → admin message in thread  
4. Author sees ack within a few seconds (3s detail polling)

### Admin draft

1. Admin opens ticket → cached draft loaded from DB if exists (no Gemini call)  
2. Admin clicks **Generate Draft** → `POST /draft` with book context + KB section  
3. Draft stored in `ai_draft_responses`; admin edits and sends manually  

---

## 5. Observability & failure modes

| Failure | User-visible behavior |
|---------|------------------------|
| Gemini timeout / 5xx | Classify → fallback category; ack/draft → canned text |
| Daily budget exceeded | Draft/ack 503; classify fallback; ticket still created |
| Redis down | Ack runs inline in dev (`setImmediate`); production should have Redis |
| Invalid JSON from model | Classify/ack fall back; job retries via BullMQ |

Logs: backend structured logs + `ticket_ai_logs` table for token/cost forensics.

---

## 6. Swapping providers later

To move to OpenAI or Anthropic:

1. Replace `apps/ai-service/app/services/gemini_client.py` with provider client  
2. Map JSON schema / text endpoints in `classify_service`, `draft_service`, `acknowledge_service`  
3. Update `MODEL_PRICING` in `cost_tracker.py`  
4. Rotate env: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` — **no frontend changes**

The queue, backend proxy, and audit schema are provider-agnostic by design.

---

## 7. References

- **Live demo:** [https://bookleaf.up.railway.app](https://bookleaf.up.railway.app) · [USER_GUIDE.md](./USER_GUIDE.md)
- [Google AI Studio](https://aistudio.google.com/apikey) — API keys & usage  
- [Gemini 2.5 thinking model updates](https://developers.googleblog.com/en/gemini-2-5-thinking-model-updates/) — Flash vs Pro, pricing  
- [Gemini 2.5 Flash vs GPT-4o mini comparison](https://www.neura.market/models/compare/google-gemini-2-5-flash-vs-openai-gpt-4o-mini) — specs & benchmarks  
- Internal: [DEPLOYMENT.md](./DEPLOYMENT.md) §7 (budget math), [README.md](../README.md) (AI strategy summary)
