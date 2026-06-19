import 'dotenv/config';
import { buildApp } from './app.js';
import { loadEnv } from './config/env.js';
import { closeDb } from './db/index.js';

async function main() {
  const env = loadEnv();
  const app = await buildApp();

  const shutdown = async () => {
    await app.close();
    await closeDb();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await app.listen({ port: env.PORT, host: '0.0.0.0' });
}

main().catch(async (err) => {
  console.error(err);
  await closeDb();
  process.exit(1);
});
