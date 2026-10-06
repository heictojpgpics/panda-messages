#!/usr/bin/env node
/**
 * Create the Panda Messages tables on a remote Cloudflare D1 database
 * over the REST API. Uses the exact same DDL as the local driver.
 *
 * Requires: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, D1_DATABASE_ID
 * Run once after `wrangler d1 create`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function extractDdl() {
  // Read the DDL from the TS source and pull out the template strings.
  const src = readFileSync(path.join(__dirname, "../src/lib/db/ddl.ts"), "utf8");
  const matches = [...src.matchAll(/`((?:\\.|[^`\\])*)`/g)].map((m) => m[1]);
  return matches.map((s) => s.replace(/\\`/g, "`")).filter((s) => s.trim().toUpperCase().startsWith("CREATE"));
}

/** Column migrations: [table, column, DDL], applied only when missing. */
function extractMigrations() {
  const src = readFileSync(path.join(__dirname, "../src/lib/db/ddl.ts"), "utf8");
  const block = src.split("COLUMN_MIGRATIONS")[1] ?? "";
  const rows = [...block.matchAll(/\["([a-z_]+)", "([a-z_]+)", "([^"]+)"\]/g)];
  return rows.map((m) => ({ table: m[1], column: m[2], sql: m[3] }));
}

async function main() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const databaseId = process.env.D1_DATABASE_ID;
  if (!accountId || !apiToken || !databaseId) {
    console.error(
      "Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN and D1_DATABASE_ID first.\n" +
        "Create the database with: npx wrangler d1 create panda-messages"
    );
    process.exit(1);
  }

  const statements = extractDdl();
  console.log(`Applying ${statements.length} DDL statements to database ${databaseId}...`);

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
  for (const sql of statements) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params: [] }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
      process.exit(1);
    }
    const json = await res.json();
    if (!json.success) {
      console.error("D1 error:", JSON.stringify(json.errors).slice(0, 300));
      process.exit(1);
    }
  }
  // Column migrations, guarded by the actual table shape so re-running
  // this script is always safe.
  const migrations = extractMigrations();
  for (const m of migrations) {
    const info = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql: `PRAGMA table_info(${m.table})`, params: [] }),
    }).then((r) => r.json());
    const cols = (info?.result?.[0]?.results ?? []).map((c) => c.name);
    if (!cols.includes(m.column)) {
      console.log(`+ cards.${m.column} is missing, adding it`);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql: m.sql, params: [] }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
        process.exit(1);
      }
    } else {
      console.log(`= cards.${m.column} already present`);
    }
  }

  console.log("Done. The remote D1 schema is ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
