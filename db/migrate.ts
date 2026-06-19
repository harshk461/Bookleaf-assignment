import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type pg from "pg";
import { createPgPool } from "./create-pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "migrations");
const VIEWS_DIR = path.join(__dirname, "views");

async function isApplied(client: pg.PoolClient, filename: string): Promise<boolean> {
  try {
    const { rows } = await client.query(
      "SELECT 1 FROM schema_migrations WHERE filename = $1",
      [filename],
    );
    return rows.length > 0;
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "42P01") return false; // undefined_table
    throw err;
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const pool = createPgPool(databaseUrl);
  const client = await pool.connect();

  try {
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const filename of files) {
      if (await isApplied(client, filename)) {
        console.log(`Skip: ${filename}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), "utf-8");
      console.log(`Apply: ${filename}`);
      await client.query(sql);

      try {
        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING",
          [filename],
        );
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code !== "42P01") throw err;
      }
    }

    const viewFile = path.join(VIEWS_DIR, "author_books_view.sql");
    if (fs.existsSync(viewFile)) {
      console.log("Apply: author_books_view.sql");
      await client.query(fs.readFileSync(viewFile, "utf-8"));
    }

    console.log("Migrations complete.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Migration failed:", message);
    if (message.includes("ECONNREFUSED") || message.includes("connect")) {
      console.error("\nStart Postgres first:");
      console.error("  docker compose up postgres -d");
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
