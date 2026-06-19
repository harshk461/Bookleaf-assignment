import * as messagesRepo from '../repositories/messages.repository.js';
import * as ticketsRepo from '../repositories/tickets.repository.js';
import { classifyAndPrioritize } from './ai-client.service.js';
import { NotFoundError } from '../utils/errors.js';

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
    aiClassificationFailed: row.ai_classification_failed,
    assignedAdminName: row.assigned_admin_name ?? null,
    authorName: row.author_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAuthorTickets(authorRef: string) {
  const rows = await ticketsRepo.listAuthorTickets(authorRef);
  return rows.map(mapTicket);
}

export async function getAuthorTicket(authorRef: string, ticketId: string) {
  const row = await ticketsRepo.getTicketForAuthor(authorRef, ticketId);
  if (!row) throw new NotFoundError('Ticket not found');
  const messages = await messagesRepo.listMessages(ticketId);
  return {
    ...mapTicket(row),
    messages: messages.map((m) => ({
      id: m.id,
      senderType: m.sender_type,
      content: m.content,
      isInitial: m.is_initial,
      createdAt: m.created_at,
    })),
  };
}

export async function createTicket(input: {
  authorRef: string;
  userId: string;
  bookId: string | null;
  subject: string;
  description: string;
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

  await messagesRepo.insertMessage({
    ticketRef: ticket.id as string,
    senderType: 'author',
    senderRef: input.userId,
    content: input.description,
    isInitial: true,
  });

  const ai = await classifyAndPrioritize({
    subject: input.subject,
    description: input.description,
    bookTitle: null,
  });

  await ticketsRepo.updateTicketAiMetadata(ticket.id as string, {
    category: ai.category,
    priority: ai.priority,
    aiCategory: ai.category,
    aiPriority: ai.priority,
    failed: ai.failed,
  });

  return getAuthorTicket(input.authorRef, ticket.id as string);
}

export async function listAdminTickets(filters: {
  status?: string;
  category?: string;
  priority?: string;
}) {
  const rows = await ticketsRepo.listAdminTickets(filters);
  return rows.map(mapTicket);
}

export async function getAdminTicket(ticketId: string) {
  const row = await ticketsRepo.getTicketById(ticketId);
  if (!row) throw new NotFoundError('Ticket not found');
  const messages = await messagesRepo.listMessages(ticketId);
  return {
    ...mapTicket(row),
    messages: messages.map((m) => ({
      id: m.id,
      senderType: m.sender_type,
      content: m.content,
      isInitial: m.is_initial,
      createdAt: m.created_at,
    })),
  };
}

export async function patchAdminTicket(ticketId: string, body: Record<string, unknown>) {
  const updated = await ticketsRepo.patchTicket(ticketId, body);
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
