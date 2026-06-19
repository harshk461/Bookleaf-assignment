import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { loadEnv } from './config/env.js';
import authPlugin from './plugins/auth.plugin.js';
import rbacPlugin from './plugins/rbac.plugin.js';
import errorHandlerPlugin from './plugins/error-handler.plugin.js';
import { registerRoutes } from './routes/index.js';

export async function buildApp() {
  const env = loadEnv();
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  await app.register(jwt, { secret: env.JWT_SECRET });
  await app.register(errorHandlerPlugin);
  await app.register(authPlugin);
  await app.register(rbacPlugin);
  await registerRoutes(app);

  return app;
}
