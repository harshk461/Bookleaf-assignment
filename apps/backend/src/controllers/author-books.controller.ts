import type { FastifyRequest } from 'fastify';
import type { z } from 'zod';
import * as booksService from '../services/books.service.js';
import * as salesService from '../services/sales.service.js';
import { requireAuthorScope } from '../middleware/scope-author.js';
import type { bookIdParamsSchema } from '../schemas/books.schema.js';

type BookIdParams = z.infer<typeof bookIdParamsSchema>;

export async function listBooks(request: FastifyRequest) {
  const authorRef = requireAuthorScope(request);
  return booksService.getBooks(authorRef);
}

export async function getBook(request: FastifyRequest) {
  const authorRef = requireAuthorScope(request);
  const { bookId } = request.validatedParams as BookIdParams;
  return booksService.getBook(authorRef, bookId);
}

export async function getBookSales(request: FastifyRequest) {
  const authorRef = requireAuthorScope(request);
  const { bookId } = request.validatedParams as BookIdParams;
  return salesService.getBookSales(authorRef, bookId);
}
