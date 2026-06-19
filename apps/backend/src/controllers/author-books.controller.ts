import type { FastifyRequest } from 'fastify';
import * as booksService from '../services/books.service.js';
import { requireAuthorScope } from '../middleware/scope-author.js';

export async function listBooks(request: FastifyRequest) {
  const authorRef = requireAuthorScope(request);
  return booksService.getBooks(authorRef);
}

export async function getBook(request: FastifyRequest) {
  const authorRef = requireAuthorScope(request);
  const { bookId } = request.params as { bookId: string };
  return booksService.getBook(authorRef, bookId);
}
