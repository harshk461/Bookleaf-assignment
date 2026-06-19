import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { UnauthorizedError } from '../utils/errors.js';
import type { JwtUser } from '../types/api.types.js';

async function authPlugin(app: FastifyInstance) {
  app.decorate('authenticate', async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        await request.jwtVerify();
        return;
      }

      const query = request.query as { token?: string };
      if (query.token) {
        const decoded = await app.jwt.verify<JwtUser>(query.token);
        request.user = decoded;
        return;
      }

      await request.jwtVerify();
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  });
}

export default fp(authPlugin);

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
