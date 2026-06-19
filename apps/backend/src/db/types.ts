/**
 * Provider-agnostic database contract.
 * Repositories depend on this interface — not on pg, Drizzle, Prisma, etc.
 */
export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

export interface DatabaseConnection {
  /** Run a SELECT (or any query returning rows). */
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<T[]>;

  /** Run a SELECT expecting zero or one row. */
  queryOne<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<T | null>;

  /** Run INSERT/UPDATE/DELETE without returning rows. */
  execute(sql: string, params?: readonly unknown[]): Promise<void>;

  /** Run work inside a transaction. */
  transaction<T>(work: (tx: DatabaseConnection) => Promise<T>): Promise<T>;

  /** Release pool / close connections. */
  close(): Promise<void>;
}

export type DbProvider = 'pg' | 'drizzle';

export interface DatabaseConfig {
  connectionString: string;
  provider: DbProvider;
  maxPoolSize?: number;
}
