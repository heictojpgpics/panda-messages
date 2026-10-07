import type BetterSqlite3 from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { DDL, COLUMN_MIGRATIONS } from "./ddl";
import type { PandaDatabase } from "./types";

/**
 * Local driver: better-sqlite3 on a file in ./db (override with SQLITE_PATH).
 * Creates the schema on first boot and repairs missing columns, so a fresh
 * clone works with zero setup. Node-only modules are imported lazily so
 * this file never loads on a non-Node runtime.
 */

let cached: PandaDatabase | null = null;

export async function getSqliteDb(): Promise<PandaDatabase> {
  if (cached) return cached;

  const [{ default: Database }, fs, path] = await Promise.all([
    import("better-sqlite3"),
    import("node:fs"),
    import("node:path"),
  ]);

  const dbPath =
    process.env.SQLITE_PATH ?? path.join(process.cwd(), "db", "panda.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const client: BetterSqlite3.Database = new Database(dbPath);
  client.pragma("journal_mode = WAL");
  client.pragma("foreign_keys = ON");
  applyDdl(client);

  const db = drizzle(client, { schema });
  cached = db as unknown as PandaDatabase;
  return cached;
}

/** Idempotent: CREATE IF NOT EXISTS plus guarded column adds. */
function applyDdl(client: BetterSqlite3.Database): void {
  for (const stmt of DDL) {
    client.exec(stmt);
  }
  for (const [table, column, sql] of COLUMN_MIGRATIONS) {
    const columns = (
      client.pragma(`table_info(${table})`) as { name: string }[]
    ).map((c) => c.name);
    if (!columns.includes(column)) {
      client.exec(sql);
    }
  }
}
