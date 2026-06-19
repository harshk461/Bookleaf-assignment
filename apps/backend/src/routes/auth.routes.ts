import type { FastifyInstance } from 'fastify';
import * as authController from '../controllers/auth.controller.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/login', authController.login);
  app.get('/api/auth/me', { preHandler: [app.authenticate] }, authController.me);
}
