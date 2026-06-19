import type { FastifyInstance } from 'fastify';
import * as controller from '../../controllers/author-tickets.controller.js';

export async function authorTicketsRoutes(app: FastifyInstance) {
  app.get('/api/author/tickets', {
    preHandler: [app.authenticate, app.requireAuthor],
  }, controller.listTickets);

  app.get('/api/author/tickets/stream', {
    preHandler: [app.authenticate, app.requireAuthor],
  }, controller.streamTickets);

  app.get('/api/author/tickets/:id', {
    preHandler: [app.authenticate, app.requireAuthor],
  }, controller.getTicket);

  app.post('/api/author/tickets', {
    preHandler: [app.authenticate, app.requireAuthor],
  }, controller.createTicket);
}
