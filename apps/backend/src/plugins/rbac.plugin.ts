import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { ForbiddenError } from '../utils/errors.js';

function requireRole(...roles: Array<'author' | 'admin'>) {
  return async (request: FastifyRequest) => {
    if (!request.user || !roles.includes(request.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
  };
}

async function rbacPlugin(app: FastifyInstance) {
  app.decorate('requireAuthor', requireRole('author'));
  app.decorate('requireAdmin', requireRole('admin'));
}

export default fp(rbacPlugin);

declare module 'fastify' {
  interface FastifyInstance {
    requireAuthor: (request: FastifyRequest) => Promise<void>;
    requireAdmin: (request: FastifyRequest) => Promise<void>;
  }
}
