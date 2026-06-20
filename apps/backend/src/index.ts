import 'dotenv/config';
import Fastify from 'fastify';
import { buildApp } from './app.js';
import { closeDb } from './db/index.js';
import { closeAckWorker, startAckWorker } from './queues/acknowledgement.queue.js';
import { logger } from './utils/logger.js';

async function main() {
  const port = Number(process.env.PORT) || 4000;
  let app;

  try {
    app = await buildApp();
    if (process.env.REDIS_URL) {
      startAckWorker();
    } else {
      logger.warn('REDIS_URL not set — acknowledgement worker disabled');
    }
  } catch (err) {
    logger.error({ err }, 'Full app failed to start — running health-only mode');
    app = Fastify({ logger: true });
    app.get('/health', async () => ({
      status: 'degraded',
      service: 'backend',
      message: 'Missing or invalid environment variables',
    }));
  }

  const shutdown = async () => {
    logger.info('Shutting down backend');
    await closeAckWorker();
    await app.close();
    await closeDb();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await app.listen({ port, host: '0.0.0.0' });
  logger.info({ port, redis: Boolean(process.env.REDIS_URL) }, 'Backend listening');
}

main().catch(async (err) => {
  logger.error({ err }, 'Backend failed to start');
  await closeAckWorker();
  await closeDb();
  process.exit(1);
});
