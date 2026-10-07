#!/usr/bin/env node
/**
 * Sanity check for the database, local or remote.
 *
 *   npm run db:status
 *
 * With D1 env vars set it asks the remote database over REST, otherwise it
 * reads the local SQLite file. Prints one line per table so you can see at
 * a glance that db:init worked and the app is writing real rows.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TABLES = [
  "users",
  "sessions",
  "password_claims",
  "cards",
  "card_events",
  "reactions",
  "replies",
  "rate_limits",
  "outbox",
  "feedback",
  "waitlist",
];

function d1Mode() {
  return (
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.CLOUDFLARE_API_TOKEN &&
    process.env.D1_DATABASE_ID
  );
}

async function remoteCount(table) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.D1_DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql: `SELECT COUNT(*) AS n FROM ${table}`, params: [] }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  if (!json.success) {
    const detail = json.errors?.map((e) => e.message).join("; ") ?? "unknown";
    throw new Error(`D1: ${String(detail).slice(0, 200)}`);
  }
  return json.result[0].results[0].n;
}

async function main() {
  if (d1Mode()) {
    console.log(`Storage: Cloudflare D1 (${process.env.D1_DATABASE_ID})\n`);
    for (const t of TABLES) {
      try {
        const n = await remoteCount(t);
        console.log(`  ${t.padEnd(16)} ${n} rows`);
      } catch (err) {
        console.log(`  ${t.padEnd(16)} MISSING or unreadable (${err.message.split("\n")[0]})`);
        console.log(`  -> run: npm run db:init`);
        return;
      }
    }
    console.log("\nRemote D1 is ready.");
  } else {
    const dbPath =
      process.env.SQLITE_PATH ?? path.join(__dirname, "..", "db", "panda.db");
    let exists = true;
    try {
      readFileSync(dbPath);
    } catch {
      exists = false;
    }
    console.log(`Storage: local SQLite (${dbPath})\n`);
    if (!exists) {
      console.log("  File not there yet. It is created on the first `npm run dev`.");
      return;
    }
    const { default: Database } = await import("better-sqlite3");
    const db = new Database(dbPath, { readonly: true });
    for (const t of TABLES) {
      const row = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get();
      console.log(`  ${t.padEnd(16)} ${row.n} rows`);
    }
    db.close();
    console.log("\nLocal database is ready.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
