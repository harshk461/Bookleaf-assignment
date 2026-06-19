import type { FastifyInstance } from 'fastify';
import * as controller from '../../controllers/admin-tickets.controller.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import {
  adminTicketsQuerySchema,
  messageBodySchema,
  patchTicketBodySchema,
  ticketIdParamsSchema,
} from '../../schemas/tickets.schema.js';

export async function adminTicketsRoutes(app: FastifyInstance) {
  app.get('/api/admin/tickets', {
    preHandler: [app.authenticate, app.requireAdmin, validateQuery(adminTicketsQuerySchema)],
  }, controller.listTickets);

  app.get('/api/admin/tickets/stream', {
    preHandler: [app.authenticate, app.requireAdmin, validateQuery(adminTicketsQuerySchema)],
  }, controller.streamTickets);

  app.get('/api/admin/tickets/:id', {
    preHandler: [app.authenticate, app.requireAdmin, validateParams(ticketIdParamsSchema)],
  }, controller.getTicket);

  app.patch('/api/admin/tickets/:id', {
    preHandler: [
      app.authenticate,
      app.requireAdmin,
      validateParams(ticketIdParamsSchema),
      validateBody(patchTicketBodySchema),
    ],
  }, controller.patchTicket);

  app.post('/api/admin/tickets/:id/draft', {
    preHandler: [app.authenticate, app.requireAdmin, validateParams(ticketIdParamsSchema)],
  }, controller.generateDraft);

  app.post('/api/admin/tickets/:id/responses', {
    preHandler: [
      app.authenticate,
      app.requireAdmin,
      validateParams(ticketIdParamsSchema),
      validateBody(messageBodySchema),
    ],
  }, controller.respond);

  app.get('/api/admin/tickets/:id/notes', {
    preHandler: [app.authenticate, app.requireAdmin, validateParams(ticketIdParamsSchema)],
  }, controller.listNotes);

  app.post('/api/admin/tickets/:id/notes', {
    preHandler: [
      app.authenticate,
      app.requireAdmin,
      validateParams(ticketIdParamsSchema),
      validateBody(messageBodySchema),
    ],
  }, controller.addNote);

  app.get('/api/admin/tickets/:id/attachments/:attachmentId', {
    preHandler: [app.authenticate, app.requireAdmin],
  }, controller.downloadAttachment);
}
