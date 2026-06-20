import 'dotenv/config';
import { buildApp } from './app.js';
import { closeDb } from './db/index.js';
import { closeAckWorker, startAckWorker } from './queues/acknowledgement.queue.js';
import { probeAiServiceHealth } from './services/ai-client.service.js';
import { logger } from './utils/logger.js';

async function main() {
  const port = Number(process.env.PORT) || 4000;
  const app = await buildApp();

  await app.listen({ port, host: '0.0.0.0' });
  logger.info({ port, redis: Boolean(process.env.REDIS_URL) }, 'Backend listening');

  if (process.env.REDIS_URL) {
    try {
      startAckWorker();
    } catch (err) {
      logger.warn({ err }, 'Acknowledgement worker failed to start — API will run without queue');
    }
  } else {
    logger.warn('REDIS_URL not set — acknowledgement worker disabled');
  }

  void probeAiServiceHealth().then((result) => {
    if (result.ok) {
      logger.info(
        { aiServiceUrl: result.url, geminiConfigured: result.geminiConfigured },
        'AI service reachable',
      );
    } else {
      logger.warn(
        { triedUrls: result.triedUrls },
        'AI service unreachable — set AI_SERVICE_URL to the public https:// domain if private networking fails',
      );
    }
  });

  const shutdown = async () => {
    logger.info('Shutting down backend');
    await closeAckWorker();
    await app.close();
    await closeDb();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(async (err) => {
  logger.error({ err }, 'Backend failed to start');
  await closeAckWorker();
  await closeDb();
  process.exit(1);
});
