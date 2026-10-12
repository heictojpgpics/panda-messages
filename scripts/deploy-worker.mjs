#!/usr/bin/env node
/**
 * Deploy the already-built OpenNext Worker.
 *
 * Cloudflare applies the Worker version before it applies Cron Trigger
 * changes. A temporary 5xx from the schedules endpoint therefore leaves a
 * healthy new Worker online while making the CI deployment look failed. Retry
 * only that narrow control-plane failure so real deploy errors still fail
 * immediately and visibly.
 */
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wrangler = path.join(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "wrangler.cmd" : "wrangler"
);
const extraArgs = process.argv.slice(2);
const attempts = Number.parseInt(process.env.CF_DEPLOY_ATTEMPTS ?? "3", 10);

if (!Number.isInteger(attempts) || attempts < 1) {
  console.error("CF_DEPLOY_ATTEMPTS must be a positive integer.");
  process.exit(1);
}

function runWrangler() {
  return new Promise((resolve, reject) => {
    const child = spawn(wrangler, ["deploy", ...extraArgs], {
      cwd: root,
      env: {
        ...process.env,
        WRANGLER_LOG_PATH: path.join(os.tmpdir(), "panda-messages-wrangler-logs"),
      },
      stdio: ["inherit", "pipe", "pipe"],
    });

    let output = "";
    for (const [stream, destination] of [
      [child.stdout, process.stdout],
      [child.stderr, process.stderr],
    ]) {
      stream.on("data", (chunk) => {
        output += chunk;
        destination.write(chunk);
      });
    }
    child.once("error", reject);
    child.once("close", (code) => resolve({ code: code ?? 1, output }));
  });
}

function isTransientScheduleFailure(output) {
  return /\/schedules\s*->\s*5\d{2}|cron schedules:[\s\S]{0,1200}\b5\d{2}\b/i.test(output);
}

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  const { code, output } = await runWrangler();
  if (code === 0) process.exit(0);

  if (!isTransientScheduleFailure(output) || attempt === attempts) {
    process.exit(code);
  }

  const waitSeconds = attempt * 10;
  console.warn(
    `Cloudflare's Cron Trigger API returned a transient 5xx. Retrying deploy ${attempt + 1}/${attempts} in ${waitSeconds}s…`
  );
  await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1_000));
}
