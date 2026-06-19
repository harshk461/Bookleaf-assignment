import type { FastifyInstance } from 'fastify';
import * as controller from '../../controllers/author-books.controller.js';
import { validateParams } from '../../middleware/validate.js';
import { bookIdParamsSchema } from '../../schemas/books.schema.js';

export async function authorBooksRoutes(app: FastifyInstance) {
  app.get('/api/author/books', {
    preHandler: [app.authenticate, app.requireAuthor],
  }, controller.listBooks);

  app.get('/api/author/books/:bookId', {
    preHandler: [app.authenticate, app.requireAuthor, validateParams(bookIdParamsSchema)],
  }, controller.getBook);

  app.get('/api/author/books/:bookId/sales', {
    preHandler: [app.authenticate, app.requireAuthor, validateParams(bookIdParamsSchema)],
  }, controller.getBookSales);
}
