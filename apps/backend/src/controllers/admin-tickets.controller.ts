import type { FastifyRequest } from 'fastify';
import * as ticketsService from '../services/tickets.service.js';
import * as notesService from '../services/internal-notes.service.js';
import { generateDraft } from '../services/ai-client.service.js';

export async function listTickets(request: FastifyRequest) {
  const query = request.query as { status?: string; category?: string; priority?: string };
  return ticketsService.listAdminTickets(query);
}

export async function getTicket(request: FastifyRequest) {
  const { id } = request.params as { id: string };
  const ticket = await ticketsService.getAdminTicket(id);
  const draft = await generateDraft({
    subject: String(ticket.subject),
    description: String(ticket.description),
    category: ticket.category ? String(ticket.category) : null,
    bookTitle: ticket.bookTitle ? String(ticket.bookTitle) : null,
    authorName: ticket.authorName ? String(ticket.authorName) : null,
  });
  return { ...ticket, aiDraft: draft.content, aiDraftFailed: draft.failed };
}

export async function patchTicket(request: FastifyRequest) {
  const { id } = request.params as { id: string };
  return ticketsService.patchAdminTicket(id, request.body as Record<string, unknown>);
}

export async function respond(request: FastifyRequest) {
  const { id } = request.params as { id: string };
  const { content } = request.body as { content: string };
  return ticketsService.addAdminResponse(id, request.user.sub, content);
}

export async function listNotes(request: FastifyRequest) {
  const { id } = request.params as { id: string };
  return notesService.listNotes(id);
}

export async function addNote(request: FastifyRequest) {
  const { id } = request.params as { id: string };
  const { content } = request.body as { content: string };
  return notesService.addNote(id, request.user.sub, content);
}
