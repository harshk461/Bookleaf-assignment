import { loadEnv } from '../config/env.js';
import { createDatabaseConnection } from './factory.js';
import type { DatabaseConnection } from './types.js';

let connection: DatabaseConnection | null = null;

export function getDb(): DatabaseConnection {
  if (!connection) {
    const env = loadEnv();
    connection = createDatabaseConnection({
      connectionString: env.DATABASE_URL,
      provider: env.DB_PROVIDER,
      maxPoolSize: env.DB_POOL_SIZE,
    });
  }
  return connection;
}

/** Replace the singleton — useful in tests. */
export function setDb(db: DatabaseConnection): void {
  connection = db;
}

export async function closeDb(): Promise<void> {
  if (connection) {
    await connection.close();
    connection = null;
  }
}

export type { DatabaseConnection, DbProvider, QueryResult } from './types.js';
export { createDatabaseConnection, getDrizzleOrm } from './factory.js';
export { DrizzleDatabaseConnection } from './providers/drizzle.provider.js';
