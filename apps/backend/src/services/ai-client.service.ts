import { loadEnv } from '../config/env.js';
import dns from 'node:dns';
import { DEFAULT_TICKET_CATEGORY, DEFAULT_TICKET_PRIORITY } from '../config/constants.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { TicketCategory, TicketPriority } from '@bookleaf/shared';

// Prefer IPv4 when .railway.internal resolves to both A and AAAA records.
dns.setDefaultResultOrder('ipv4first');

let loggedAiUrlNormalization = false;

function isPrivateAiHost(hostname: string): boolean {
  return (
    hostname.endsWith('.railway.internal') ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  );
}

function isRailwayPublicHost(hostname: string): boolean {
  return hostname.endsWith('.up.railway.app') || hostname.endsWith('.railway.app');
}

function normalizeAiBaseUrl(raw: string): string {
  const env = loadEnv();
  let url = raw.trim().replace(/\/+$/, '');

  if (url.includes('${{')) {
    logger.warn(
      { aiServiceUrl: url },
      'AI service URL contains an unresolved Railway template — redeploy after setting the variable reference',
    );
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);

    if (isPrivateAiHost(parsed.hostname)) {
      // Private mesh: HTTP only, explicit container port (e.g. 8000).
      if (parsed.protocol === 'https:') {
        parsed.protocol = 'http:';
      }
      if (!parsed.port) {
        parsed.port = String(env.AI_SERVICE_PORT);
        if (!loggedAiUrlNormalization) {
          logger.info(
            { aiServiceUrl: parsed.toString().replace(/\/$/, ''), aiServicePort: env.AI_SERVICE_PORT },
            'Private AI URL had no port — appended from AI_SERVICE_PORT',
          );
          loggedAiUrlNormalization = true;
        }
      }
      return parsed.toString().replace(/\/$/, '');
    }

    if (isRailwayPublicHost(parsed.hostname)) {
      // Public Railway domain: HTTPS on 443 — never use container port :8000.
      parsed.protocol = 'https:';
      parsed.port = '';
      const normalized = parsed.toString().replace(/\/$/, '');
      if (url !== normalized && !loggedAiUrlNormalization) {
        logger.info(
          { from: url, to: normalized },
          'Public Railway AI URL normalized — removed :8000; edge proxy uses HTTPS port 443',
        );
        loggedAiUrlNormalization = true;
      }
      return normalized;
    }

    return parsed.toString().replace(/\/$/, '');
  } catch {
    logger.warn({ aiServiceUrl: url }, 'AI service URL is not a valid URL');
    return url;
  }
}

function normalizeAiServiceUrl(): string {
  return normalizeAiBaseUrl(loadEnv().AI_SERVICE_URL);
}

function aiServiceUrl(): string {
  return normalizeAiServiceUrl();
}

export function getAiServiceBaseUrl(): string {
  return aiServiceUrl();
}

function getAiServiceCandidateUrls(): string[] {
  const env = loadEnv();
  const primary = normalizeAiBaseUrl(env.AI_SERVICE_URL);
  const urls = [primary];

  if (env.AI_SERVICE_PUBLIC_URL?.trim()) {
    const publicUrl = normalizeAiBaseUrl(env.AI_SERVICE_PUBLIC_URL);
    if (!urls.includes(publicUrl)) {
      urls.push(publicUrl);
    }
  }

  return urls;
}

export async function probeAiServiceHealth(): Promise<{
  ok: boolean;
  url: string | null;
  geminiConfigured?: boolean;
  triedUrls: string[];
}> {
  const triedUrls = getAiServiceCandidateUrls();
  for (const base of triedUrls) {
    try {
      const res = await fetch(`${base}/health`, {
        signal: AbortSignal.timeout(5000),
        redirect: 'manual',
      });
      if (res.ok) {
        const body = (await res.json().catch(() => ({}))) as { geminiConfigured?: boolean };
        if (base !== triedUrls[0]) {
          logger.warn(
            { privateUrl: triedUrls[0], publicUrl: base },
            'AI service reachable only via AI_SERVICE_PUBLIC_URL — fix private networking or keep public fallback',
          );
        }
        return { ok: true, url: base, geminiConfigured: body.geminiConfigured, triedUrls };
      }
      logger.warn({ url: base, status: res.status }, 'AI service health check returned non-OK status');
    } catch (err) {
      logger.warn({ err, url: base }, 'AI service candidate unreachable');
    }
  }
  return { ok: false, url: triedUrls[0] ?? null, triedUrls };
}

const AI_FETCH_TIMEOUT_MS = 30_000;

async function aiPost(path: string, body: Record<string, unknown>): Promise<Response> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const candidates = getAiServiceCandidateUrls();
  let lastError: unknown;

  for (let i = 0; i < candidates.length; i += 1) {
    const base = candidates[i];
    const url = `${base}${normalizedPath}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
        redirect: 'manual',
        signal: AbortSignal.timeout(AI_FETCH_TIMEOUT_MS),
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location') ?? 'unknown';
        throw new Error(
          `AI service redirected POST ${url} → ${location} (${res.status}); use http:// for private URLs`,
        );
      }

      if (res.status === 405) {
        logger.warn({ url, method: 'POST', path }, 'AI service returned 405 Method Not Allowed');
      }

      if (i > 0 && res.ok) {
        logger.info({ url: base }, 'AI request succeeded via AI_SERVICE_PUBLIC_URL fallback');
      }

      return res;
    } catch (err) {
      lastError = err;
      if (i < candidates.length - 1) {
        logger.warn({ err, url: base, path }, 'AI private URL failed — trying public fallback');
      }
    }
  }

  throw lastError ?? new Error('AI service unreachable');
}

export interface AiUsageMeta {
  inputTokens?: number | null;
  outputTokens?: number | null;
  estimatedCostUsd?: number | null;
  latencyMs?: number | null;
  model?: string | null;
}

export interface ClassifyResult extends AiUsageMeta {
  category: TicketCategory;
  priority: TicketPriority;
  failed: boolean;
}

export interface DraftResult extends AiUsageMeta {
  content: string;
  failed: boolean;
}

export interface AcknowledgeResult extends AiUsageMeta {
  content: string;
  failed: boolean;
}

interface AiClassifyResponse {
  category: TicketCategory;
  priority: TicketPriority;
  input_tokens?: number;
  output_tokens?: number;
  estimated_cost_usd?: number;
  latency_ms?: number;
  model?: string;
}

interface AiDraftResponse {
  content: string;
  input_tokens?: number;
  output_tokens?: number;
  estimated_cost_usd?: number;
  latency_ms?: number;
  model?: string;
}

interface AiAcknowledgeResponse {
  content: string;
  input_tokens?: number;
  output_tokens?: number;
  estimated_cost_usd?: number;
  latency_ms?: number;
  model?: string;
}

export async function classifyAndPrioritize(input: {
  subject: string;
  description: string;
  bookTitle?: string | null;
}): Promise<ClassifyResult> {
  try {
    const res = await aiPost('/classify', {
      subject: input.subject,
      description: input.description,
      book_title: input.bookTitle ?? null,
    });
    if (!res.ok) throw new Error(`AI service returned ${res.status}`);
    const data = (await res.json()) as AiClassifyResponse;
    return {
      category: data.category,
      priority: data.priority,
      failed: false,
      inputTokens: data.input_tokens,
      outputTokens: data.output_tokens,
      estimatedCostUsd: data.estimated_cost_usd,
      latencyMs: data.latency_ms,
      model: data.model,
    };
  } catch (err) {
    logger.warn(
      { err, subject: input.subject, endpoint: 'classify', aiServiceUrl: aiServiceUrl() },
      'AI classify failed — using fallback category/priority',
    );
    return {
      category: DEFAULT_TICKET_CATEGORY,
      priority: DEFAULT_TICKET_PRIORITY,
      failed: true,
    };
  }
}

export async function generateDraft(input: {
  subject: string;
  description: string;
  category?: string | null;
  bookTitle?: string | null;
  authorName?: string | null;
  bookContext?: Record<string, unknown> | null;
}): Promise<DraftResult> {
  try {
    const res = await aiPost('/draft', {
      subject: input.subject,
      description: input.description,
      category: input.category,
      book_title: input.bookTitle,
      author_name: input.authorName,
      book_context: input.bookContext ?? null,
    });
    if (res.status === 503) throw new AppError(503, 'AI daily budget exceeded');
    if (!res.ok) throw new Error(`AI service returned ${res.status}`);
    const data = (await res.json()) as AiDraftResponse;
    return {
      content: data.content,
      failed: false,
      inputTokens: data.input_tokens,
      outputTokens: data.output_tokens,
      estimatedCostUsd: data.estimated_cost_usd,
      latencyMs: data.latency_ms,
      model: data.model,
    };
  } catch (err) {
    if (err instanceof AppError) {
      logger.warn({ err, subject: input.subject, endpoint: 'draft', aiServiceUrl: aiServiceUrl() }, 'AI draft budget exceeded');
      throw err;
    }
    logger.warn(
      { err, subject: input.subject, endpoint: 'draft', aiServiceUrl: aiServiceUrl() },
      'AI draft failed — using fallback response',
    );
    return {
      content:
        'Thank you for reaching out to BookLeaf support. We are reviewing your query and will respond shortly.',
      failed: true,
    };
  }
}

export async function generateAcknowledgement(input: {
  ticketNumber: string;
  subject: string;
  description: string;
  category?: string | null;
  priority?: string | null;
  bookTitle?: string | null;
  authorName?: string | null;
}): Promise<AcknowledgeResult> {
  const fallbackContent =
    `Thank you for contacting BookLeaf Support. We have received your ticket (${input.ticketNumber}) and our team will follow up within 24-48 business hours.`;

  try {
    const res = await aiPost('/acknowledge', {
      ticket_number: input.ticketNumber,
      subject: input.subject,
      description: input.description,
      category: input.category,
      priority: input.priority,
      book_title: input.bookTitle,
      author_name: input.authorName,
    });
    if (res.status === 503) {
      logger.warn(
        { ticketNumber: input.ticketNumber, endpoint: 'acknowledge' },
        'AI acknowledge budget exceeded — using fallback',
      );
      return { content: fallbackContent, failed: true };
    }
    if (!res.ok) throw new Error(`AI service returned ${res.status}`);
    const data = (await res.json()) as AiAcknowledgeResponse;
    logger.info(
      {
        ticketNumber: input.ticketNumber,
        endpoint: 'acknowledge',
        model: data.model,
        latencyMs: data.latency_ms,
      },
      'AI acknowledgement generated',
    );
    return {
      content: data.content,
      failed: false,
      inputTokens: data.input_tokens,
      outputTokens: data.output_tokens,
      estimatedCostUsd: data.estimated_cost_usd,
      latencyMs: data.latency_ms,
      model: data.model,
    };
  } catch (err) {
    logger.warn(
      { err, ticketNumber: input.ticketNumber, endpoint: 'acknowledge', aiServiceUrl: aiServiceUrl() },
      'AI acknowledge failed — using fallback response',
    );
    return { content: fallbackContent, failed: true };
  }
}
