import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { loadEnv } from './config/env.js';
import authPlugin from './plugins/auth.plugin.js';
import rbacPlugin from './plugins/rbac.plugin.js';
import errorHandlerPlugin from './plugins/error-handler.plugin.js';
import { registerRoutes } from './routes/index.js';
import { registerLivenessRoute } from './routes/admin/health.routes.js';
import { getMaxUploadBytes } from './services/attachments.service.js';

export async function registerAppFeatures(app: FastifyInstance) {
  const env = loadEnv();

  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  await app.register(jwt, { secret: env.JWT_SECRET });
  await app.register(multipart, { limits: { fileSize: getMaxUploadBytes() } });
  await app.register(errorHandlerPlugin);
  await app.register(authPlugin);
  await app.register(rbacPlugin);
  await registerRoutes(app);
}

export async function buildApp() {
  const app = Fastify({ logger: true, ignoreTrailingSlash: true });
  registerLivenessRoute(app);
  await registerAppFeatures(app);
  return app;
}
