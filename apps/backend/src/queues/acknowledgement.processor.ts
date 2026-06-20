import * as aiLogsRepo from '../repositories/ai-logs.repository.js';
import * as authorsRepo from '../repositories/authors.repository.js';
import * as messagesRepo from '../repositories/messages.repository.js';
import { generateAcknowledgement } from '../services/ai-client.service.js';
import type { AcknowledgementJobPayload } from './acknowledgement.types.js';

export async function hasAcknowledgementBeenSent(ticketId: string): Promise<boolean> {
  const row = await aiLogsRepo.findAcknowledgementLog(ticketId);
  return row != null;
}

export async function processAcknowledgementJob(
  payload: AcknowledgementJobPayload,
): Promise<void> {
  if (await hasAcknowledgementBeenSent(payload.ticketId)) {
    return;
  }

  const ack = await generateAcknowledgement({
    ticketNumber: payload.ticketNumber,
    subject: payload.subject,
    description: payload.description,
    category: payload.category,
    priority: payload.priority,
    bookTitle: payload.bookTitle,
    authorName: payload.authorName,
  });

  await aiLogsRepo.insertAiLog({
    ticketRef: payload.ticketId,
    taskType: 'draft_response',
    status: ack.failed ? 'fallback' : 'success',
    model: ack.model,
    inputTokens: ack.inputTokens,
    outputTokens: ack.outputTokens,
    estimatedCostUsd: ack.estimatedCostUsd,
    latencyMs: ack.latencyMs,
    requestPayload: { type: 'acknowledgement', ticketNumber: payload.ticketNumber },
    responsePayload: { contentLength: ack.content.length },
  });

  const systemAdminId = await authorsRepo.findDefaultAdminUserId();
  if (!systemAdminId || !ack.content) {
    return;
  }

  await messagesRepo.insertMessage({
    ticketRef: payload.ticketId,
    senderType: 'admin',
    senderRef: systemAdminId,
    content: ack.content,
  });
}
