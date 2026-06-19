import type { FastifyInstance } from 'fastify';
import * as controller from '../../controllers/admin-tickets.controller.js';

export async function adminTicketsRoutes(app: FastifyInstance) {
  app.get('/api/admin/tickets', {
    preHandler: [app.authenticate, app.requireAdmin],
  }, controller.listTickets);

  app.get('/api/admin/tickets/:id', {
    preHandler: [app.authenticate, app.requireAdmin],
  }, controller.getTicket);

  app.patch('/api/admin/tickets/:id', {
    preHandler: [app.authenticate, app.requireAdmin],
  }, controller.patchTicket);

  app.post('/api/admin/tickets/:id/responses', {
    preHandler: [app.authenticate, app.requireAdmin],
  }, controller.respond);

  app.get('/api/admin/tickets/:id/notes', {
    preHandler: [app.authenticate, app.requireAdmin],
  }, controller.listNotes);

  app.post('/api/admin/tickets/:id/notes', {
    preHandler: [app.authenticate, app.requireAdmin],
  }, controller.addNote);
}
