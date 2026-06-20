import { loadEnv } from '../config/env.js';
import { DEFAULT_TICKET_CATEGORY, DEFAULT_TICKET_PRIORITY } from '../config/constants.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { TicketCategory, TicketPriority } from '@bookleaf/shared';

function aiServiceUrl(): string {
  return loadEnv().AI_SERVICE_URL;
}

const AI_FETCH_TIMEOUT_MS = 30_000;

function aiFetch(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(AI_FETCH_TIMEOUT_MS) });
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
    const res = await aiFetch(`${aiServiceUrl()}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: input.subject,
        description: input.description,
        book_title: input.bookTitle ?? null,
      }),
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
      { err, subject: input.subject, endpoint: 'classify' },
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
    const res = await aiFetch(`${aiServiceUrl()}/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: input.subject,
        description: input.description,
        category: input.category,
        book_title: input.bookTitle,
        author_name: input.authorName,
        book_context: input.bookContext ?? null,
      }),
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
      logger.warn({ err, subject: input.subject, endpoint: 'draft' }, 'AI draft budget exceeded');
      throw err;
    }
    logger.warn(
      { err, subject: input.subject, endpoint: 'draft' },
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
    const res = await aiFetch(`${aiServiceUrl()}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket_number: input.ticketNumber,
        subject: input.subject,
        description: input.description,
        category: input.category,
        priority: input.priority,
        book_title: input.bookTitle,
        author_name: input.authorName,
      }),
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
      { err, ticketNumber: input.ticketNumber, endpoint: 'acknowledge' },
      'AI acknowledge failed — using fallback response',
    );
    return { content: fallbackContent, failed: true };
  }
}
