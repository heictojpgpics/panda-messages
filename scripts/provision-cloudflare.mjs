#!/usr/bin/env node
/**
 * Provision Panda Messages' Cloudflare resources without ever making a
 * Cloudflare management credential part of the deployed application.
 *
 * This is deliberately an operator/CI tool. The running Next application
 * talks to D1 and R2 only through the DB and CARD_PHOTOS bindings in
 * wrangler.toml. It never reads CLOUDFLARE_API_TOKEN or ACCOUNT_ID.
 *
 * Usage:
 *   npm run cf:provision
 *   npm run cf:provision -- --dry-run
 *   npm run cf:provision -- --migrate-only
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(root, "wrangler.toml");
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const migrateOnly = args.has("--migrate-only");
const bootstrap = args.has("--bootstrap");
const help = args.has("--help") || args.has("-h");

if (help) {
  console.log("Usage: node scripts/provision-cloudflare.mjs [--dry-run] [--migrate-only] [--bootstrap]");
  process.exit(0);
}

for (const arg of args) {
  if (!["--dry-run", "--migrate-only", "--bootstrap"].includes(arg)) {
    console.error(`Unknown option: ${arg}`);
    process.exit(1);
  }
}

function section(source, name) {
  const match = source.match(new RegExp(`^\\[\\[${name}\\]\\]\\s*$([\\s\\S]*?)(?=^\\[|\\Z)`, "m"));
  if (!match) throw new Error(`wrangler.toml is missing [[${name}]].`);
  return match[1];
}

function field(source, name) {
  const match = source.match(new RegExp(`^${name}\\s*=\\s*"([^"]+)"\\s*$`, "m"));
  if (!match) throw new Error(`The ${name} setting is missing or not a quoted string.`);
  return match[1];
}

function readResources() {
  if (!existsSync(configPath)) throw new Error("wrangler.toml was not found.");
  const config = readFileSync(configPath, "utf8");
  const d1 = section(config, "d1_databases");
  const r2 = section(config, "r2_buckets");
  const binding = field(d1, "binding");
  const bucketBinding = field(r2, "binding");
  if (binding !== "DB" || bucketBinding !== "CARD_PHOTOS") {
    throw new Error("This tool expects the production bindings to be named DB and CARD_PHOTOS.");
  }
  return {
    databaseName: field(d1, "database_name"),
    databaseId: field(d1, "database_id"),
    bucketName: field(r2, "bucket_name"),
  };
}

function replaceD1DatabaseId(databaseId) {
  const config = readFileSync(configPath, "utf8");
  const d1 = section(config, "d1_databases");
  const updatedD1 = d1.replace(/^database_id\s*=\s*"[^"]+"\s*$/m, `database_id = "${databaseId}"`);
  if (updatedD1 === d1) throw new Error("Could not update the D1 database_id in wrangler.toml.");
  writeFileSync(configPath, config.replace(d1, updatedD1));
}

function requireManagementCredentials() {
  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error(
      "Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID for this provisioning command. " +
        "They are deployment credentials only. Do not add either value as a Worker or Pages runtime secret."
    );
  }
}

function wranglerPath() {
  const bin = process.platform === "win32" ? "wrangler.cmd" : "wrangler";
  return path.join(root, "node_modules", ".bin", bin);
}

function runWrangler(command, { allowFailure = false } = {}) {
  const result = spawnSync(wranglerPath(), [...command, "--config", configPath], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      // Keep Wrangler's operational logs out of a restricted HOME directory.
      WRANGLER_LOG_PATH: path.join(os.tmpdir(), "panda-messages-wrangler-logs"),
    },
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && !allowFailure) {
    throw new Error((result.stderr || result.stdout || `wrangler exited ${result.status}`).trim());
  }
  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

function parseJson(output, label) {
  const first = output.indexOf("[");
  const last = output.lastIndexOf("]");
  if (first < 0 || last < first) throw new Error(`Wrangler returned an unexpected ${label} response.`);
  return JSON.parse(output.slice(first, last + 1));
}

function ensureD1(resources) {
  const list = runWrangler(["d1", "list", "--json"]);
  const databases = parseJson(list.output, "D1 list");
  const existing = databases.find((database) => database.name === resources.databaseName);

  if (!existing) {
    if (!bootstrap) {
      // A configured UUID that cannot be found is a serious configuration error.
      // Creating a second empty database would silently disconnect production.
      throw new Error(
        `No D1 database named ${resources.databaseName} exists, while wrangler.toml is pinned to ${resources.databaseId}. ` +
          "Refusing to create a replacement automatically. If this is intentionally a new environment, rerun with --bootstrap."
      );
    }
    console.log(`Creating D1 database ${resources.databaseName}…`);
    const created = runWrangler(["d1", "create", resources.databaseName]);
    const id = created.output.match(/database_id\s*=\s*"([^"]+)"/)?.[1];
    if (!id) throw new Error("D1 was created but Wrangler did not return a database_id. Update wrangler.toml manually before deploying.");
    replaceD1DatabaseId(id);
    resources.databaseId = id;
    console.log("✓ wrangler.toml now points DB at the newly created database.");
    return;
  }
  if (existing.uuid !== resources.databaseId) {
    throw new Error(
      `D1 database ID mismatch: wrangler.toml has ${resources.databaseId}, but ${resources.databaseName} resolves to ${existing.uuid}. ` +
        "Refusing to point the application at a different database."
    );
  }
  console.log(`✓ D1 ${resources.databaseName} is bound to the expected database ID.`);
}

function ensurePrivateBucket(resources) {
  const info = runWrangler(["r2", "bucket", "info", resources.bucketName, "--json"], { allowFailure: true });
  if (!info.ok) {
    if (!/not found|does not exist|status\s*404/i.test(info.output)) {
      throw new Error(info.output.trim() || `Could not inspect R2 bucket ${resources.bucketName}.`);
    }
    console.log(`Creating private R2 bucket ${resources.bucketName}…`);
    runWrangler(["r2", "bucket", "create", resources.bucketName]);
  } else {
    console.log(`✓ R2 bucket ${resources.bucketName} exists.`);
  }

  // Explicitly close the easy-to-miss r2.dev public URL. The app serves all
  // images through its authorization-checked route instead.
  runWrangler(["r2", "bucket", "dev-url", "disable", resources.bucketName, "--force"]);
  console.log("✓ Public r2.dev access is disabled.");
}

function migrateD1(resources) {
  console.log("Applying committed D1 migrations…");
  runWrangler(["d1", "migrations", "apply", "DB", "--remote"]);
  // Releases before versioned migrations used CREATE IF NOT EXISTS plus
  // guarded columns. Preserve that upgrade path so an existing live D1
  // database cannot get marked migrated while those additive fields remain
  // absent.
  const columns = runWrangler([
    "d1",
    "execute",
    "DB",
    "--remote",
    "--command",
    "PRAGMA table_info(cards)",
    "--json",
  ]);
  const existingColumns = new Set(
    parseJson(columns.output, "D1 schema verification")?.[0]?.results?.map((column) => column.name) ?? []
  );
  const legacyColumns = [
    ["custom_occasion", "ALTER TABLE cards ADD COLUMN custom_occasion TEXT"],
    ["reply_to_card_id", "ALTER TABLE cards ADD COLUMN reply_to_card_id TEXT"],
  ];
  for (const [column, sql] of legacyColumns) {
    if (existingColumns.has(column)) continue;
    console.log(`Repairing legacy D1 schema: adding cards.${column}…`);
    runWrangler(["d1", "execute", "DB", "--remote", "--command", sql]);
  }
  const verification = runWrangler([
    "d1",
    "execute",
    "DB",
    "--remote",
    "--command",
    "SELECT COUNT(*) AS tables FROM sqlite_master WHERE type = 'table' AND name IN ('users', 'cards', 'outbox', 'rate_limits')",
    "--json",
  ]);
  const result = parseJson(verification.output, "D1 verification");
  const count = result?.[0]?.results?.[0]?.tables;
  if (count !== 4) throw new Error("D1 migration verification failed: core tables are missing.");
  console.log(`✓ D1 migration verified for ${resources.databaseName}.`);
}

function main() {
  const resources = readResources();
  console.log(`Cloudflare configuration: DB=${resources.databaseName}, CARD_PHOTOS=${resources.bucketName}`);

  if (dryRun) {
    console.log("Dry run only. No Cloudflare resource was contacted or changed.");
    const d1Action = bootstrap ? "create D1 when it is absent and update wrangler.toml" : "verify the configured D1 binding";
    console.log(migrateOnly ? `Would ${d1Action}, then apply and verify D1 migrations.` : `Would ${d1Action}, ensure a private R2 bucket, disable r2.dev, then migrate D1.`);
    return;
  }

  requireManagementCredentials();
  ensureD1(resources);
  if (!migrateOnly) ensurePrivateBucket(resources);
  migrateD1(resources);
  console.log("Cloudflare resources are ready. Deploy with npm run cf:deploy.");
}

try {
  main();
} catch (error) {
  console.error(`Provisioning stopped: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
