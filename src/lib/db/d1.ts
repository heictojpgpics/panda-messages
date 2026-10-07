import { drizzle } from "drizzle-orm/sqlite-proxy";
import type { AsyncBatchRemoteCallback, RemoteCallback } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";
import type { PandaDatabase } from "./types";

/**
 * Cloudflare D1 driver over the public REST API. Same drizzle queries as
 * the local driver; the statements travel as HTTPS calls instead.
 *
 * Why two endpoints:
 *  - `/raw` returns rows as positional arrays together with their column
 *    names, which is exactly the row shape drizzle's proxy session maps
 *    (it reads results by index, not by name). Single statements use it.
 *  - `/query` accepts an array of statements and runs them inside one
 *    transaction: all of it lands or none of it does. Batches use it and
 *    convert the object rows to positional rows via the key order, which
 *    the API emits in query-column order.
 *
 * Requires: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, D1_DATABASE_ID.
 * The token needs D1 edit permission (Account > API Tokens > a role that
 * includes D1).
 */

let cached: PandaDatabase | null = null;

interface D1Statement {
  sql: string;
  params: unknown[];
}

/** D1 binds integers, not booleans. */
function toParam(p: unknown): unknown {
  return typeof p === "boolean" ? (p ? 1 : 0) : p;
}

function requireEnv(): { accountId: string; apiToken: string; databaseId: string } {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const databaseId = process.env.D1_DATABASE_ID;
  if (!accountId || !apiToken || !databaseId) {
    throw new Error(
      "D1 mode needs CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN and D1_DATABASE_ID."
    );
  }
  return { accountId, apiToken, databaseId };
}

async function post(path: string, body: unknown): Promise<Record<string, unknown>> {
  const { accountId, apiToken, databaseId } = requireEnv();
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`D1 HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as Record<string, unknown>;
  if (json.success !== true) {
    const errors = (json.errors as { message?: string }[] | undefined) ?? [];
    const detail = errors.map((e) => e.message).join("; ") || "unknown error";
    throw new Error(`D1 error: ${String(detail).slice(0, 300)}`);
  }
  return json;
}

/** One statement over /raw: positional rows, in query-column order. */
async function rawRows(stmt: D1Statement): Promise<unknown[][]> {
  const json = await post("raw", { sql: stmt.sql, params: stmt.params.map(toParam) });
  const result = json.result as { results?: { rows?: unknown[][] } }[] | undefined;
  return result?.[0]?.results?.rows ?? [];
}

/** A transactional array of statements over /query. */
async function batchRows(stmts: D1Statement[]): Promise<unknown[][][]> {
  const body = stmts.map((s) => ({ sql: s.sql, params: s.params.map(toParam) }));
  const json = await post("query", body);
  const result = json.result as { results?: Record<string, unknown>[] }[] | undefined;
  return (result ?? []).map((r) =>
    (r.results ?? []).map((row) => Object.values(row))
  );
}

const execute: RemoteCallback = async (sql, params, method) => {
  const rows = await rawRows({ sql, params });
  if (method === "get") {
    // The proxy session maps `get` from a single positional row.
    return { rows: rows[0] ?? null };
  }
  return { rows };
};

const executeBatch: AsyncBatchRemoteCallback = async (batch) => {
  const results = await batchRows(
    batch.map((b) => ({ sql: b.sql, params: b.params }))
  );
  return results.map((rows) => ({ rows }));
};

export async function getD1Db(): Promise<PandaDatabase> {
  if (cached) return cached;
  requireEnv();
  const db = drizzle(execute, executeBatch, { schema });
  cached = db;
  return cached;
}
