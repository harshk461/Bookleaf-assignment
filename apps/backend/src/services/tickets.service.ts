import * as messagesRepo from '../repositories/messages.repository.js';
import * as ticketsRepo from '../repositories/tickets.repository.js';
import * as booksRepo from '../repositories/books.repository.js';
import * as attachmentsRepo from '../repositories/attachments.repository.js';
import * as aiLogsRepo from '../repositories/ai-logs.repository.js';
import * as authorsRepo from '../repositories/authors.repository.js';
import { classifyAndPrioritize, generateDraft } from './ai-client.service.js';
import { enqueueAcknowledgement } from '../queues/acknowledgement.queue.js';
import {
  getMaxUploadBytes,
  saveTicketFile,
  validateMimeType,
} from './attachments.service.js';
import { NotFoundError } from '../utils/errors.js';
import { AppError } from '../utils/errors.js';

function mapTicket(row: Record<string, unknown>) {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    bookId: row.book_id ?? null,
    bookTitle: row.book_title ?? null,
    subject: row.subject,
    description: row.description,
    status: row.status,
    category: row.category,
    priority: row.priority,
    aiCategory: row.ai_category ?? null,
    aiPriority: row.ai_priority ?? null,
    categoryOverridden: row.category_overridden ?? false,
    priorityOverridden: row.priority_overridden ?? false,
    aiClassificationFailed: row.ai_classification_failed,
    assignedAdminName: row.assigned_admin_name ?? null,
    authorName: row.author_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function mapAttachments(ticketId: string) {
  const rows = await attachmentsRepo.listAttachments(ticketId);
  return rows.map(attachmentsRepo.mapAttachment);
}

export async function listAuthorTickets(authorRef: string) {
  const rows = await ticketsRepo.listAuthorTickets(authorRef);
  return rows.map(mapTicket);
}

export async function getAuthorTicket(authorRef: string, ticketId: string) {
  const row = await ticketsRepo.getTicketForAuthor(authorRef, ticketId);
  if (!row) throw new NotFoundError('Ticket not found');
  const messages = await messagesRepo.listMessages(ticketId);
  const attachments = await mapAttachments(ticketId);
  return {
    ...mapTicket(row),
    messages: messages.map((m) => ({
      id: m.id,
      senderType: m.sender_type,
      content: m.content,
      isInitial: m.is_initial,
      createdAt: m.created_at,
    })),
    attachments,
  };
}

export async function createTicket(input: {
  authorRef: string;
  userId: string;
  bookId: string | null;
  subject: string;
  description: string;
  file?: { fileName: string; mimeType: string; buffer: Buffer } | null;
}) {
  const bookRef = await ticketsRepo.resolveBookRef(input.bookId, input.authorRef);
  if (input.bookId && !bookRef) throw new NotFoundError('Book not found');

  const ticketNumber = await ticketsRepo.nextTicketNumber();
  const ticket = await ticketsRepo.insertTicket({
    ticketNumber,
    authorRef: input.authorRef,
    bookRef,
    subject: input.subject,
    description: input.description,
  });
  if (!ticket) throw new Error('Failed to create ticket');

  const ticketId = ticket.id as string;

  await messagesRepo.insertMessage({
    ticketRef: ticketId,
    senderType: 'author',
    senderRef: input.userId,
    content: input.description,
    isInitial: true,
  });

  if (input.file) {
    if (input.file.buffer.length > getMaxUploadBytes()) {
      throw new AppError(400, 'File exceeds 5 MB limit');
    }
    validateMimeType(input.file.mimeType);
    const storageKey = await saveTicketFile(ticketId, input.file.fileName, input.file.buffer);
    await attachmentsRepo.insertAttachment({
      ticketRef: ticketId,
      fileName: input.file.fileName,
      mimeType: input.file.mimeType,
      sizeBytes: input.file.buffer.length,
      storageKey,
      uploadedBy: input.userId,
    });
  }

  const row = await ticketsRepo.getTicketForAuthor(input.authorRef, ticketId);
  const bookTitle = row?.book_title ? String(row.book_title) : null;

  const ai = await classifyAndPrioritize({
    subject: input.subject,
    description: input.description,
    bookTitle,
  });

  await ticketsRepo.updateTicketAiMetadata(ticketId, {
    category: ai.category,
    priority: ai.priority,
    aiCategory: ai.category,
    aiPriority: ai.priority,
    failed: ai.failed,
  });

  await aiLogsRepo.insertAiLog({
    ticketRef: ticketId,
    taskType: 'classify_prioritize',
    status: ai.failed ? 'fallback' : 'success',
    model: ai.model,
    inputTokens: ai.inputTokens,
    outputTokens: ai.outputTokens,
    estimatedCostUsd: ai.estimatedCostUsd,
    latencyMs: ai.latencyMs,
    requestPayload: { subject: input.subject, bookTitle },
    responsePayload: { category: ai.category, priority: ai.priority },
  });

  const authorUser = await authorsRepo.findUserById(input.userId);
  await enqueueAcknowledgement({
    ticketId,
    ticketNumber: String(ticket.ticket_number ?? ticketNumber),
    subject: input.subject,
    description: input.description,
    category: ai.category,
    priority: ai.priority,
    bookTitle,
    authorName: authorUser?.name ? String(authorUser.name) : null,
  });

  return getAuthorTicket(input.authorRef, ticketId);
}

export async function listAdminTickets(filters: {
  status?: string;
  category?: string;
  priority?: string;
  from?: string;
  to?: string;
}) {
  const rows = await ticketsRepo.listAdminTickets(filters);
  return rows.map(mapTicket);
}

export async function getAdminTicket(ticketId: string) {
  const row = await ticketsRepo.getTicketById(ticketId);
  if (!row) throw new NotFoundError('Ticket not found');
  const messages = await messagesRepo.listMessages(ticketId);
  const attachments = await mapAttachments(ticketId);
  return {
    ...mapTicket(row),
    messages: messages.map((m) => ({
      id: m.id,
      senderType: m.sender_type,
      content: m.content,
      isInitial: m.is_initial,
      createdAt: m.created_at,
    })),
    attachments,
  };
}

export async function getAdminTicketWithDraft(ticketId: string) {
  const ticket = await getAdminTicket(ticketId);
  const cached = await aiLogsRepo.getCurrentDraft(ticketId);
  return {
    ...ticket,
    aiDraft: cached?.content ?? null,
    aiDraftFailed: false,
  };
}

export async function generateAdminDraft(ticketId: string, adminId: string) {
  const row = await ticketsRepo.getTicketById(ticketId);
  if (!row) throw new NotFoundError('Ticket not found');
  const ticket = await getAdminTicket(ticketId);

  let bookContext: Record<string, unknown> | null = null;
  if (row.book_ref) {
    const ctx = await booksRepo.getBookDraftContext(String(row.book_ref));
    if (ctx) {
      bookContext = {
        status: ctx.status,
        royalty_pending: Number(ctx.royalty_pending),
        royalty_paid: Number(ctx.royalty_paid),
        last_royalty_payout_date: ctx.last_royalty_payout_date,
        total_copies_sold: ctx.total_copies_sold,
      };
    }
  }

  const draft = await generateDraft({
    subject: String(ticket.subject),
    description: String(ticket.description),
    category: ticket.category ? String(ticket.category) : null,
    bookTitle: ticket.bookTitle ? String(ticket.bookTitle) : null,
    authorName: ticket.authorName ? String(ticket.authorName) : null,
    bookContext,
  });

  await aiLogsRepo.saveDraft({
    ticketRef: ticketId,
    content: draft.content,
    model: draft.model,
    promptTokens: draft.inputTokens,
    completionTokens: draft.outputTokens,
    generatedBy: adminId,
  });

  await aiLogsRepo.insertAiLog({
    ticketRef: ticketId,
    taskType: 'draft_response',
    status: draft.failed ? 'fallback' : 'success',
    model: draft.model,
    inputTokens: draft.inputTokens,
    outputTokens: draft.outputTokens,
    estimatedCostUsd: draft.estimatedCostUsd,
    latencyMs: draft.latencyMs,
    requestPayload: { subject: ticket.subject, category: ticket.category },
    responsePayload: { contentLength: draft.content.length },
  });

  return {
    aiDraft: draft.content,
    aiDraftFailed: draft.failed,
    estimatedCostUsd: draft.estimatedCostUsd,
  };
}

export async function patchAdminTicket(ticketId: string, body: Record<string, unknown>) {
  const existing = await ticketsRepo.getTicketById(ticketId);
  if (!existing) throw new NotFoundError('Ticket not found');

  const patch: Record<string, unknown> = { ...body };
  if (body.category !== undefined && body.category !== existing.category) {
    patch.category_overridden = true;
  }
  if (body.priority !== undefined && body.priority !== existing.priority) {
    patch.priority_overridden = true;
  }

  const updated = await ticketsRepo.patchTicket(ticketId, patch);
  if (!updated) throw new NotFoundError('Ticket not found');
  return getAdminTicket(ticketId);
}

export async function addAdminResponse(ticketId: string, adminId: string, content: string) {
  const ticket = await ticketsRepo.getTicketById(ticketId);
  if (!ticket) throw new NotFoundError('Ticket not found');
  await messagesRepo.insertMessage({
    ticketRef: ticketId,
    senderType: 'admin',
    senderRef: adminId,
    content,
  });
  return getAdminTicket(ticketId);
}

export async function addAuthorMessage(
  authorRef: string,
  userId: string,
  ticketId: string,
  content: string,
) {
  const ticket = await ticketsRepo.getTicketForAuthor(authorRef, ticketId);
  if (!ticket) throw new NotFoundError('Ticket not found');
  if (ticket.status === 'closed') {
    throw new AppError(400, 'Cannot send messages on a closed ticket');
  }

  await messagesRepo.insertMessage({
    ticketRef: ticketId,
    senderType: 'author',
    senderRef: userId,
    content,
  });

  if (ticket.status === 'resolved') {
    await ticketsRepo.patchTicket(ticketId, { status: 'open' });
  }

  return getAuthorTicket(authorRef, ticketId);
}

export async function getAttachmentForAuthor(
  authorRef: string,
  ticketId: string,
  attachmentId: string,
) {
  const ticket = await ticketsRepo.getTicketForAuthor(authorRef, ticketId);
  if (!ticket) throw new NotFoundError('Ticket not found');
  const attachment = await attachmentsRepo.getAttachment(ticketId, attachmentId);
  if (!attachment) throw new NotFoundError('Attachment not found');
  return attachment;
}

export async function getAttachmentForAdmin(ticketId: string, attachmentId: string) {
  const ticket = await ticketsRepo.getTicketById(ticketId);
  if (!ticket) throw new NotFoundError('Ticket not found');
  const attachment = await attachmentsRepo.getAttachment(ticketId, attachmentId);
  if (!attachment) throw new NotFoundError('Attachment not found');
  return attachment;
}
