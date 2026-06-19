import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '../utils/errors.js';

async function errorHandlerPlugin(app: FastifyInstance) {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.message });
    }
    app.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  });
}

export default fp(errorHandlerPlugin);
