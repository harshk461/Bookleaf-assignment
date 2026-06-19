import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import * as ticketsService from '../services/tickets.service.js';
import { readTicketFile } from '../services/attachments.service.js';
import * as notesService from '../services/internal-notes.service.js';
import { runSsePolling } from '../utils/sse-polling.js';
import type {
  adminTicketsQuerySchema,
  messageBodySchema,
  patchTicketBodySchema,
  ticketIdParamsSchema,
} from '../schemas/tickets.schema.js';

type AdminTicketsQuery = z.infer<typeof adminTicketsQuerySchema>;
type TicketIdParams = z.infer<typeof ticketIdParamsSchema>;
type PatchTicketBody = z.infer<typeof patchTicketBodySchema>;
type MessageBody = z.infer<typeof messageBodySchema>;

export async function listTickets(request: FastifyRequest) {
  const query = request.validatedQuery as AdminTicketsQuery;
  return ticketsService.listAdminTickets(query);
}

export async function streamTickets(request: FastifyRequest, reply: FastifyReply) {
  const query = (request.validatedQuery ?? {}) as AdminTicketsQuery;
  runSsePolling(request, reply, 'tickets', () =>
    ticketsService.listAdminTickets(query),
  );
}

export async function getTicket(request: FastifyRequest) {
  const { id } = request.validatedParams as TicketIdParams;
  return ticketsService.getAdminTicketWithDraft(id);
}

export async function generateDraft(request: FastifyRequest) {
  const { id } = request.validatedParams as TicketIdParams;
  return ticketsService.generateAdminDraft(id, request.user.sub);
}

export async function patchTicket(request: FastifyRequest) {
  const { id } = request.validatedParams as TicketIdParams;
  const body = request.validatedBody as PatchTicketBody;
  return ticketsService.patchAdminTicket(id, body);
}

export async function respond(request: FastifyRequest) {
  const { id } = request.validatedParams as TicketIdParams;
  const { content } = request.validatedBody as MessageBody;
  return ticketsService.addAdminResponse(id, request.user.sub, content);
}

export async function listNotes(request: FastifyRequest) {
  const { id } = request.validatedParams as TicketIdParams;
  return notesService.listNotes(id);
}

export async function addNote(request: FastifyRequest) {
  const { id } = request.validatedParams as TicketIdParams;
  const { content } = request.validatedBody as MessageBody;
  return notesService.addNote(id, request.user.sub, content);
}

export async function downloadAttachment(request: FastifyRequest, reply: FastifyReply) {
  const { id, attachmentId } = request.params as { id: string; attachmentId: string };
  const attachment = await ticketsService.getAttachmentForAdmin(id, attachmentId);
  const buffer = await readTicketFile(attachment.storage_key);
  return reply
    .header('Content-Type', attachment.mime_type)
    .header('Content-Disposition', `attachment; filename="${attachment.file_name}"`)
    .send(buffer);
}
