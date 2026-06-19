import type { FastifyReply, FastifyRequest } from 'fastify';
import * as ticketsService from '../services/tickets.service.js';
import { requireAuthorScope } from '../middleware/scope-author.js';
import { initSse, sendSseEvent } from '../utils/sse.js';

export async function listTickets(request: FastifyRequest) {
  const authorRef = requireAuthorScope(request);
  return ticketsService.listAuthorTickets(authorRef);
}

export async function getTicket(request: FastifyRequest) {
  const authorRef = requireAuthorScope(request);
  const { id } = request.params as { id: string };
  return ticketsService.getAuthorTicket(authorRef, id);
}

export async function createTicket(request: FastifyRequest) {
  const authorRef = requireAuthorScope(request);
  const { bookId, subject, description } = request.body as {
    bookId: string | null;
    subject: string;
    description: string;
  };
  return ticketsService.createTicket({
    authorRef,
    userId: request.user.sub,
    bookId,
    subject,
    description,
  });
}

export async function streamTickets(request: FastifyRequest, reply: FastifyReply) {
  const authorRef = requireAuthorScope(request);
  initSse(reply);

  const send = async () => {
    const tickets = await ticketsService.listAuthorTickets(authorRef);
    sendSseEvent(reply, 'tickets', tickets);
  };

  await send();
  const interval = setInterval(send, 5000);
  request.raw.on('close', () => clearInterval(interval));
}
