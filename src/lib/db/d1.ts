import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import type { AsyncBatchRemoteCallback, RemoteCallback } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";
import type { PandaDatabase } from "./types";

/**
 * Cloudflare D1 driver through the Worker binding. Same drizzle queries as
 * the local driver, but no management API request or account-wide token is
 * present in the deployed application.
 *
 * The DB binding is declared in wrangler.toml. Cloudflare gives the Worker
 * that one capability directly, so production never needs a Cloudflare API
 * token, account ID or database ID at runtime.
 */

let cached: PandaDatabase | null = null;

type BoundStatement = {
  raw: () => Promise<unknown[][]>;
};

type D1Binding = {
  prepare: (sql: string) => { bind: (...params: unknown[]) => BoundStatement };
  batch: (statements: BoundStatement[]) => Promise<{ results?: Record<string, unknown>[] }[]>;
};

/** D1 stores booleans as integers. */
function toParam(p: unknown): unknown {
  return typeof p === "boolean" ? (p ? 1 : 0) : p;
}

async function getBinding(): Promise<D1Binding> {
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as unknown as { DB?: D1Binding }).DB;
  if (!db) {
    throw new Error(
      "The Cloudflare DB binding is unavailable. Run through OpenNext/Wrangler locally, or configure the DB binding before deploying."
    );
  }
  return db;
}

const execute: RemoteCallback = async (sql, params, method) => {
  const db = await getBinding();
  const rows = await db.prepare(sql).bind(...params.map(toParam)).raw();
  if (method === "get") {
    // The proxy session maps `get` from a single positional row.
    return { rows: rows[0] ?? null };
  }
  return { rows };
};

const executeBatch: AsyncBatchRemoteCallback = async (batch) => {
  const db = await getBinding();
  const results = await db.batch(
    batch.map((statement) => db.prepare(statement.sql).bind(...statement.params.map(toParam)))
  );
  return results.map((result) => ({
    rows: (result.results ?? []).map((row) => Object.values(row)),
  }));
};

export async function getD1Db(): Promise<PandaDatabase> {
  if (cached) return cached;
  await getBinding();
  const db = drizzle(execute, executeBatch, { schema });
  cached = db;
  return cached;
}
