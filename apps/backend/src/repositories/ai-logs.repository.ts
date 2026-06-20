import { getDb } from '../db/index.js';

export interface AiLogInput {
  ticketRef: string;
  taskType: 'classify_prioritize' | 'draft_response';
  status: 'success' | 'failed' | 'fallback';
  model?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  estimatedCostUsd?: number | null;
  latencyMs?: number | null;
  requestPayload?: unknown;
  responsePayload?: unknown;
  errorMessage?: string | null;
}

export async function insertAiLog(input: AiLogInput) {
  const responsePayload =
    input.responsePayload && typeof input.responsePayload === 'object'
      ? {
          ...(input.responsePayload as Record<string, unknown>),
          ...(input.estimatedCostUsd != null
            ? { estimated_cost_usd: input.estimatedCostUsd }
            : {}),
        }
      : input.responsePayload;

  await getDb().execute(
    `INSERT INTO ticket_ai_logs
      (ticket_ref, task_type, status, model, input_tokens, output_tokens,
       estimated_cost_usd, latency_ms, request_payload, response_payload, error_message)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      input.ticketRef,
      input.taskType,
      input.status,
      input.model ?? null,
      input.inputTokens ?? null,
      input.outputTokens ?? null,
      input.estimatedCostUsd ?? null,
      input.latencyMs ?? null,
      input.requestPayload ? JSON.stringify(input.requestPayload) : null,
      responsePayload ? JSON.stringify(responsePayload) : null,
      input.errorMessage ?? null,
    ],
  );
}

export async function getCurrentDraft(ticketId: string) {
  return getDb().queryOne<{ content: string; model: string | null }>(
    `SELECT content, model FROM ai_draft_responses
     WHERE ticket_ref = $1 AND is_current = TRUE
     ORDER BY created_at DESC LIMIT 1`,
    [ticketId],
  );
}

export async function saveDraft(input: {
  ticketRef: string;
  content: string;
  model?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  generatedBy?: string | null;
}) {
  await getDb().execute(
    `UPDATE ai_draft_responses SET is_current = FALSE WHERE ticket_ref = $1`,
    [input.ticketRef],
  );
  return getDb().queryOne(
    `INSERT INTO ai_draft_responses
      (ticket_ref, content, model, prompt_tokens, completion_tokens, generated_by, is_current)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING *`,
    [
      input.ticketRef,
      input.content,
      input.model ?? null,
      input.promptTokens ?? null,
      input.completionTokens ?? null,
      input.generatedBy ?? null,
    ],
  );
}

export async function findAcknowledgementLog(ticketId: string) {
  return getDb().queryOne(
    `SELECT id FROM ticket_ai_logs
     WHERE ticket_ref = $1
       AND task_type = 'draft_response'
       AND request_payload->>'type' = 'acknowledgement'
       AND status IN ('success', 'fallback')
     LIMIT 1`,
    [ticketId],
  );
}
