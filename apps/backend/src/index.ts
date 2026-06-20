import 'dotenv/config';
import Fastify from 'fastify';
import { buildApp } from './app.js';
import { closeDb } from './db/index.js';
import { closeAckWorker, startAckWorker } from './queues/acknowledgement.queue.js';

async function main() {
  const port = Number(process.env.PORT) || 4000;
  let app;

  try {
    app = await buildApp();
    if (process.env.REDIS_URL) {
      startAckWorker();
    }
  } catch (err) {
    console.error('Full app failed to start — running health-only mode:', err);
    app = Fastify({ logger: true });
    app.get('/health', async () => ({
      status: 'degraded',
      service: 'backend',
      message: 'Missing or invalid environment variables',
    }));
  }

  const shutdown = async () => {
    await closeAckWorker();
    await app.close();
    await closeDb();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await app.listen({ port, host: '0.0.0.0' });
}

main().catch(async (err) => {
  console.error(err);
  await closeAckWorker();
  await closeDb();
  process.exit(1);
});
