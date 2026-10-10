#!/usr/bin/env node
/**
 * Backwards-compatible schema command.
 *
 * Kept for existing runbooks, but now delegates to the Wrangler-based
 * provisioner rather than calling Cloudflare's management API directly.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const result = spawnSync(process.execPath, ["scripts/provision-cloudflare.mjs", "--migrate-only", ...process.argv.slice(2)], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
