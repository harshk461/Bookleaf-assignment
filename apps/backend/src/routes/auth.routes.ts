import type { FastifyInstance } from 'fastify';
import * as authController from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.js';
import { loginBodySchema } from '../schemas/auth.schema.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/login', {
    preHandler: [validateBody(loginBodySchema)],
  }, authController.login);
  app.get('/api/auth/me', { preHandler: [app.authenticate] }, authController.me);
  app.post('/api/auth/logout', { preHandler: [app.authenticate] }, authController.logout);
}
