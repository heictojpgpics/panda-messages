#!/usr/bin/env node
/**
 * Sanity check the database locally or through the configured D1 binding.
 *
 * Remote checks use Wrangler, never a hand-rolled Cloudflare management API
 * request. That keeps the operational path aligned with cf:provision.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const configPath = path.join(root, "wrangler.toml");
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
  return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN);
}

function wranglerPath() {
  const bin = process.platform === "win32" ? "wrangler.cmd" : "wrangler";
  return path.join(root, "node_modules", ".bin", bin);
}

function runWrangler(args) {
  const result = spawnSync(wranglerPath(), [...args, "--config", configPath], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      WRANGLER_LOG_PATH: path.join(os.tmpdir(), "panda-messages-wrangler-logs"),
    },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || `wrangler exited ${result.status}`).trim());
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

function parseJson(output) {
  const first = output.indexOf("[");
  const last = output.lastIndexOf("]");
  if (first < 0 || last < first) throw new Error("Wrangler did not return JSON.");
  return JSON.parse(output.slice(first, last + 1));
}

function remoteCount(table) {
  const output = runWrangler([
    "d1",
    "execute",
    "DB",
    "--remote",
    "--command",
    `SELECT COUNT(*) AS n FROM ${table}`,
    "--json",
  ]);
  return parseJson(output)?.[0]?.results?.[0]?.n;
}

async function main() {
  if (d1Mode()) {
    console.log("Storage: Cloudflare D1 (the DB binding in wrangler.toml)\n");
    for (const table of TABLES) {
      try {
        const count = remoteCount(table);
        console.log(`  ${table.padEnd(16)} ${count} rows`);
      } catch (error) {
        console.log(`  ${table.padEnd(16)} MISSING or unreadable (${String(error).split("\n")[0]})`);
        console.log("  -> run: npm run cf:provision");
        return;
      }
    }
    console.log("\nRemote D1 is ready.");
    return;
  }

  const dbPath = process.env.SQLITE_PATH ?? path.join(root, "db", "panda.db");
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
  for (const table of TABLES) {
    const row = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get();
    console.log(`  ${table.padEnd(16)} ${row.n} rows`);
  }
  db.close();
  console.log("\nLocal database is ready.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
