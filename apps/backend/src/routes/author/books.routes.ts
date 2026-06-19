import type { FastifyInstance } from 'fastify';
import * as controller from '../../controllers/author-books.controller.js';

export async function authorBooksRoutes(app: FastifyInstance) {
  app.get('/api/author/books', {
    preHandler: [app.authenticate, app.requireAuthor],
  }, controller.listBooks);

  app.get('/api/author/books/:bookId', {
    preHandler: [app.authenticate, app.requireAuthor],
  }, controller.getBook);
}
