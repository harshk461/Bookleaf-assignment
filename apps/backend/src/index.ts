import 'dotenv/config';
import Fastify from 'fastify';
import { buildApp } from './app.js';
import { closeDb } from './db/index.js';
import { closeAckWorker, startAckWorker } from './queues/acknowledgement.queue.js';
import { getAiServiceBaseUrl, probeAiServiceHealth } from './services/ai-client.service.js';
import { logger } from './utils/logger.js';

async function checkAiServiceReachable(): Promise<void> {
  const result = await probeAiServiceHealth();
  if (result.ok) {
    logger.info(
      { aiServiceUrl: result.url, geminiConfigured: result.geminiConfigured },
      'AI service reachable',
    );
    return;
  }
  logger.warn(
    {
      aiServiceUrl: getAiServiceBaseUrl(),
      triedUrls: result.triedUrls,
    },
    'AI service unreachable — set AI_SERVICE_PUBLIC_URL on backend or fix private networking',
  );
}

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
  void checkAiServiceReachable();
}

main().catch(async (err) => {
  logger.error({ err }, 'Backend failed to start');
  await closeAckWorker();
  await closeDb();
  process.exit(1);
});
