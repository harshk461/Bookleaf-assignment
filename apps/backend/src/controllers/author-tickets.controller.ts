import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import * as ticketsService from '../services/tickets.service.js';
import { readTicketFile } from '../services/attachments.service.js';
import { requireAuthorScope } from '../middleware/scope-author.js';
import { runSsePolling } from '../utils/sse-polling.js';
import { createTicketBodySchema, ticketIdParamsSchema } from '../schemas/tickets.schema.js';
import { AppError } from '../utils/errors.js';

type CreateTicketBody = z.infer<typeof createTicketBodySchema>;
type TicketIdParams = z.infer<typeof ticketIdParamsSchema>;

export async function listTickets(request: FastifyRequest) {
  const authorRef = requireAuthorScope(request);
  return ticketsService.listAuthorTickets(authorRef);
}

export async function getTicket(request: FastifyRequest) {
  const authorRef = requireAuthorScope(request);
  const { id } = request.validatedParams as TicketIdParams;
  return ticketsService.getAuthorTicket(authorRef, id);
}

export async function createTicket(request: FastifyRequest) {
  const authorRef = requireAuthorScope(request);
  const contentType = request.headers['content-type'] ?? '';

  if (contentType.includes('multipart/form-data')) {
    const parts = request.parts();
    let bookId: string | null = null;
    let subject = '';
    let description = '';
    let file: { fileName: string; mimeType: string; buffer: Buffer } | null = null;

    for await (const part of parts) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        file = {
          fileName: part.filename,
          mimeType: part.mimetype,
          buffer,
        };
      } else if (part.fieldname === 'bookId') {
        const val = String(part.value);
        bookId = val === '' || val === 'null' ? null : val;
      } else if (part.fieldname === 'subject') {
        subject = String(part.value);
      } else if (part.fieldname === 'description') {
        description = String(part.value);
      }
    }

    const parsed = createTicketBodySchema.safeParse({ bookId, subject, description });
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors[0]?.message ?? 'Invalid ticket data');
    }

    return ticketsService.createTicket({
      authorRef,
      userId: request.user.sub,
      ...parsed.data,
      file,
    });
  }

  const { bookId, subject, description } = request.validatedBody as CreateTicketBody;
  return ticketsService.createTicket({
    authorRef,
    userId: request.user.sub,
    bookId,
    subject,
    description,
  });
}

export async function downloadAttachment(request: FastifyRequest, reply: FastifyReply) {
  const authorRef = requireAuthorScope(request);
  const { id, attachmentId } = request.params as { id: string; attachmentId: string };
  const attachment = await ticketsService.getAttachmentForAuthor(authorRef, id, attachmentId);
  const buffer = await readTicketFile(attachment.storage_key);
  return reply
    .header('Content-Type', attachment.mime_type)
    .header('Content-Disposition', `attachment; filename="${attachment.file_name}"`)
    .send(buffer);
}

export async function streamTickets(request: FastifyRequest, reply: FastifyReply) {
  const authorRef = requireAuthorScope(request);
  runSsePolling(request, reply, 'tickets', () =>
    ticketsService.listAuthorTickets(authorRef),
  );
}

export async function streamTicketDetail(request: FastifyRequest, reply: FastifyReply) {
  const authorRef = requireAuthorScope(request);
  const { id } = request.validatedParams as TicketIdParams;
  runSsePolling(request, reply, 'ticket', () =>
    ticketsService.getAuthorTicket(authorRef, id),
  );
}
