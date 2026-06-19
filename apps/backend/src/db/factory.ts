import type { DatabaseConfig, DatabaseConnection } from './types.js';
import { PgPoolConnection, createPgPool } from './providers/pg.provider.js';
import { DrizzleDatabaseConnection } from './providers/drizzle.provider.js';

export function createDatabaseConnection(config: DatabaseConfig): DatabaseConnection {
  switch (config.provider) {
    case 'pg': {
      const pool = createPgPool(config.connectionString, config.maxPoolSize);
      return new PgPoolConnection(pool);
    }
    case 'drizzle':
      return new DrizzleDatabaseConnection(config.connectionString, config.maxPoolSize);
    default: {
      const exhaustive: never = config.provider;
      throw new Error(`Unsupported database provider: ${exhaustive}`);
    }
  }
}

export function getDrizzleOrm(connection: DatabaseConnection) {
  if (connection instanceof DrizzleDatabaseConnection) {
    return connection.getOrm();
  }
  throw new Error('Drizzle ORM is only available when DB_PROVIDER=drizzle');
}
