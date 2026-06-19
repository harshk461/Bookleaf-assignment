import type { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.routes.js';
import { authorBooksRoutes } from './author/books.routes.js';
import { authorTicketsRoutes } from './author/tickets.routes.js';
import { adminTicketsRoutes } from './admin/tickets.routes.js';
import { healthRoutes } from './admin/health.routes.js';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(authorBooksRoutes);
  await app.register(authorTicketsRoutes);
  await app.register(adminTicketsRoutes);
}
