import pg from 'pg';
import type { DatabaseConnection } from '../types.js';

type Queryable = Pick<pg.Pool | pg.PoolClient, 'query'>;

function mapRows<T extends Record<string, unknown>>(result: pg.QueryResult<T>): T[] {
  return result.rows;
}

/** Shared SQL execution helpers used by pg and drizzle providers. */
export function createSqlExecutor(queryable: Queryable): Pick<
  DatabaseConnection,
  'query' | 'queryOne' | 'execute'
> {
  return {
    async query<T extends Record<string, unknown> = Record<string, unknown>>(
      sql: string,
      params: readonly unknown[] = [],
    ): Promise<T[]> {
      const result = await queryable.query<T>(sql, [...params]);
      return mapRows(result);
    },

    async queryOne<T extends Record<string, unknown> = Record<string, unknown>>(
      sql: string,
      params: readonly unknown[] = [],
    ): Promise<T | null> {
      const rows = await this.query<T>(sql, params);
      return rows[0] ?? null;
    },

    async execute(sql: string, params: readonly unknown[] = []): Promise<void> {
      await queryable.query(sql, [...params]);
    },
  };
}

export class PgPoolConnection implements DatabaseConnection {
  private readonly sql: Pick<DatabaseConnection, 'query' | 'queryOne' | 'execute'>;
  private readonly pool: pg.Pool;

  constructor(pool: pg.Pool) {
    this.pool = pool;
    this.sql = createSqlExecutor(pool);
  }

  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<T[]> {
    return this.sql.query<T>(sql, params);
  }

  queryOne<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<T | null> {
    return this.sql.queryOne<T>(sql, params);
  }

  execute(sql: string, params?: readonly unknown[]): Promise<void> {
    return this.sql.execute(sql, params);
  }

  async transaction<T>(work: (tx: DatabaseConnection) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const tx = new PgClientConnection(client);
      const result = await work(tx);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

class PgClientConnection implements DatabaseConnection {
  private readonly sql: Pick<DatabaseConnection, 'query' | 'queryOne' | 'execute'>;

  constructor(private readonly client: pg.PoolClient) {
    this.sql = createSqlExecutor(client);
  }

  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<T[]> {
    return this.sql.query<T>(sql, params);
  }

  queryOne<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<T | null> {
    return this.sql.queryOne<T>(sql, params);
  }

  execute(sql: string, params?: readonly unknown[]): Promise<void> {
    return this.sql.execute(sql, params);
  }

  async transaction<T>(work: (tx: DatabaseConnection) => Promise<T>): Promise<T> {
    return work(this);
  }

  async close(): Promise<void> {
    // Transaction client lifecycle is managed by PgPoolConnection.
  }
}

export function createPgPool(connectionString: string, maxPoolSize = 10): pg.Pool {
  return new pg.Pool({ connectionString, max: maxPoolSize });
}
