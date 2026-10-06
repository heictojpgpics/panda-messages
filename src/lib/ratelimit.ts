import { getDb } from "./db";
import { eq, sql } from "drizzle-orm";
import { rateLimits } from "./db/schema";

/**
 * Rate limiting. DB-backed so it holds across serverless isolates and works
 * identically on local SQLite and Cloudflare D1. One atomic upsert per check.
 *
 * Keys look like "signin:<ip>" or "card:<ip>". The IP is best-effort: the
 * platform puts the client address in x-forwarded-for or cf-connecting-ip.
 */

export function clientIp(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "local";
}

export interface RateVerdict {
  ok: boolean;
  retryAfterSec: number;
}

/**
 * Returns true and increments when the action is allowed. Returns false
 * without incrementing once the limit is exhausted.
 */
export async function rateLimit(key: string, max: number, windowMs: number): Promise<RateVerdict> {
  const db = await getDb();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const cutoffIso = new Date(now - windowMs).toISOString();

  const rows = await db
    .update(rateLimits)
    .set({
      count: sql`CASE WHEN ${rateLimits.windowStart} < ${cutoffIso} THEN 1 ELSE ${rateLimits.count} + 1 END`,
      windowStart: sql`CASE WHEN ${rateLimits.windowStart} < ${cutoffIso} THEN ${nowIso} ELSE ${rateLimits.windowStart} END`,
    })
    .where(eq(rateLimits.key, key))
    .returning({ count: rateLimits.count, windowStart: rateLimits.windowStart });

  if (rows.length === 0) {
    // First hit in a fresh window for this key. The insert may lose a
    // race with another isolate; onConflictDoNothing keeps their row and
    // the read-back below settles it either way.
    await db
      .insert(rateLimits)
      .values({ key, count: 1, windowStart: nowIso })
      .onConflictDoNothing();
    const back = await db
      .select({ count: rateLimits.count, windowStart: rateLimits.windowStart })
      .from(rateLimits)
      .where(eq(rateLimits.key, key))
      .limit(1);
    const row = back[0];
    if (!row) return { ok: true, retryAfterSec: 0 };
    const elapsed = now - Date.parse(row.windowStart);
    if (row.count > max) {
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil((windowMs - elapsed) / 1000)) };
    }
    return { ok: true, retryAfterSec: 0 };
  }

  const row = rows[0];
  const elapsed = now - Date.parse(row.windowStart);
  if (row.count > max) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((windowMs - elapsed) / 1000)) };
  }
  return { ok: true, retryAfterSec: 0 };
}

/** Convenience for route handlers: the common verdict shape. */
export function tooMany(verdict: RateVerdict): boolean {
  return !verdict.ok;
}
