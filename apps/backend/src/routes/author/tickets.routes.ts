import type { FastifyInstance } from 'fastify';
import * as controller from '../../controllers/author-tickets.controller.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import {
  createTicketBodySchema,
  messageBodySchema,
  ticketIdParamsSchema,
} from '../../schemas/tickets.schema.js';

export async function authorTicketsRoutes(app: FastifyInstance) {
  app.get('/api/author/tickets', {
    preHandler: [app.authenticate, app.requireAuthor],
  }, controller.listTickets);

  app.get('/api/author/tickets/stream', {
    preHandler: [app.authenticate, app.requireAuthor],
  }, controller.streamTickets);

  app.get('/api/author/tickets/:id/stream', {
    preHandler: [app.authenticate, app.requireAuthor, validateParams(ticketIdParamsSchema)],
  }, controller.streamTicketDetail);

  app.get('/api/author/tickets/:id', {
    preHandler: [app.authenticate, app.requireAuthor, validateParams(ticketIdParamsSchema)],
  }, controller.getTicket);

  app.post('/api/author/tickets/:id/messages', {
    preHandler: [
      app.authenticate,
      app.requireAuthor,
      validateParams(ticketIdParamsSchema),
      validateBody(messageBodySchema),
    ],
  }, controller.addAuthorMessage);

  app.get('/api/author/tickets/:id/attachments/:attachmentId', {
    preHandler: [app.authenticate, app.requireAuthor],
  }, controller.downloadAttachment);

  app.post('/api/author/tickets', {
    preHandler: [
      app.authenticate,
      app.requireAuthor,
      async (request, reply) => {
        const contentType = request.headers['content-type'] ?? '';
        if (!contentType.includes('multipart/form-data')) {
          await validateBody(createTicketBodySchema)(request, reply);
        }
      },
    ],
  }, controller.createTicket);
}
