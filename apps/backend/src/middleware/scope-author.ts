import type { FastifyRequest } from 'fastify';
import { ForbiddenError } from '../utils/errors.js';

export function requireAuthorScope(request: FastifyRequest) {
  if (request.user.role !== 'author' || !request.user.authorRef) {
    throw new ForbiddenError('Author scope required');
  }
  return request.user.authorRef;
}
