import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { DatabaseConnection } from '../types.js';
import { createPgPool, PgPoolConnection } from './pg.provider.js';
import * as schema from '../schema/index.js';

export type DrizzleDb = NodePgDatabase<typeof schema>;

/**
 * Drizzle-backed provider: exposes Drizzle ORM for typed queries while
 * implementing the same DatabaseConnection contract for raw SQL repositories.
 */
export class DrizzleDatabaseConnection implements DatabaseConnection {
  private readonly poolConnection: PgPoolConnection;
  private readonly orm: DrizzleDb;

  constructor(connectionString: string, maxPoolSize = 10) {
    const pool = createPgPool(connectionString, maxPoolSize);
    this.orm = drizzle(pool, { schema });
    this.poolConnection = new PgPoolConnection(pool);
  }

  /** Access the Drizzle ORM instance for type-safe query builder usage. */
  getOrm(): DrizzleDb {
    return this.orm;
  }

  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<T[]> {
    return this.poolConnection.query<T>(sql, params);
  }

  queryOne<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<T | null> {
    return this.poolConnection.queryOne<T>(sql, params);
  }

  execute(sql: string, params?: readonly unknown[]): Promise<void> {
    return this.poolConnection.execute(sql, params);
  }

  transaction<T>(work: (tx: DatabaseConnection) => Promise<T>): Promise<T> {
    return this.poolConnection.transaction(work);
  }

  close(): Promise<void> {
    return this.poolConnection.close();
  }
}
