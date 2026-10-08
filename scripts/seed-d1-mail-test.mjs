// Seed one card into the LOCAL D1 simulation (the dev database) for the
// email E2E: draft -> mock checkout -> receipt + scheduled delivery.
import { execSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { writeFileSync, unlinkSync } from "node:fs";

const id = randomBytes(12).toString("hex");
const token = createHash("sha256").update("mailtest").digest("hex");
const now = new Date().toISOString();
const deliverAt = new Date(Date.now() + 60_000).toISOString();

const sql = `INSERT INTO cards (id, slug, user_id, edit_token, sender_name, recipient_name, recipient_email,
  occasion, custom_occasion, message, signoff, theme, plan, status, watermark, deliver_at, created_at, updated_at)
VALUES ('${id}', 'mail-test-envelope', NULL, '${token}', 'Daniel', 'Maya', 'maya@example.com',
  'birthday', NULL, 'Happy birthday Maya. You make ordinary days feel like the good ones.', 'Your Daniel',
  'birthday-bash', 'paid', 'draft', 0, '${deliverAt}', '${now}', '${now}');\n`;

const tmp = `/tmp/seed-mail-${id}.sql`;
writeFileSync(tmp, sql);
try {
  execSync(`npx wrangler d1 execute panda-messages --local --file ${tmp}`, { stdio: "inherit" });
} finally {
  unlinkSync(tmp);
}
console.log("seeded mail-test-envelope into local D1, id:", id);
console.log("EDIT_TOKEN_SHA:", token);
