// Render the full email verification matrix to standalone HTML files.
// Usage: npx tsx scripts/render-email-preview.ts <outdir> new
import { mkdirSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

async function main() {
  const outdir = process.argv[2] ?? "/home/z/my-project/email-previews/new";
  rmSync(outdir, { recursive: true, force: true });
  mkdirSync(outdir, { recursive: true });

  const mod = await import("../src/lib/email/index");
  const themes = (await import("../src/data/themes")).THEMES;
  const occasions = (await import("../src/data/occasions")).OCCASIONS;

  const BASE = "http://localhost:3000";
  const manifest: Array<{ file: string; desc: string; subject: string; preheader: string }> = [];

  function save(name: string, desc: string, mail: { subject: string; html: string; text: string }) {
    const file = `${name}.html`;
    writeFileSync(join(outdir, file), mail.html);
    writeFileSync(join(outdir, `${name}.txt`), mail.text);
    manifest.push({ file, desc, subject: mail.subject, preheader: "" });
  }

  // 1. Delivery across every theme (fixed occasion for comparison)
  for (const t of themes) {
    const mail = mod.cardDeliveryEmail({
      recipientName: "Maya",
      senderName: "Daniel",
      cardUrl: `${BASE}/c/bamboo-heart`,
      occasionId: "love-you",
      themeId: t.id,
    });
    save(`theme-${t.id}`, `delivery / ${t.name}`, mail);
  }

  // 2. Delivery across every occasion (+ custom fallback)
  for (const o of occasions) {
    const mail = mod.cardDeliveryEmail({
      recipientName: "Maya",
      senderName: "Daniel",
      cardUrl: `${BASE}/c/bamboo-heart`,
      occasionId: o.id,
      themeId: "bamboo-grove",
    });
    save(`occasion-${o.id}`, `delivery / ${o.label}`, mail);
  }
  {
    const mail = mod.cardDeliveryEmail({
      recipientName: "Maya",
      senderName: "Daniel",
      cardUrl: `${BASE}/c/bamboo-heart`,
      occasionId: "",
      customOccasion: "Half Marathon Finish",
      themeId: "bamboo-grove",
    });
    save("occasion-custom", "delivery / custom occasion", mail);
  }

  // 3. Receipt: scheduled + immediate
  {
    const sched = mod.receiptEmail({
      buyerEmail: "daniel@example.com",
      recipientName: "Maya",
      dashboardUrl: `${BASE}/dashboard`,
      refundNoteUrl: `${BASE}/refund-policy`,
      occasionId: "birthday",
      themeId: "birthday-bash",
      scheduledFor: "2026-10-21T08:00:00.000Z",
    });
    save("receipt-scheduled", "receipt / scheduled", sched);
    const now = mod.receiptEmail({
      buyerEmail: "daniel@example.com",
      recipientName: "Maya",
      dashboardUrl: `${BASE}/dashboard`,
      refundNoteUrl: `${BASE}/refund-policy`,
      occasionId: "birthday",
      themeId: "birthday-bash",
      scheduledFor: null,
    });
    save("receipt-now", "receipt / immediate", now);
  }

  // 4. Claim
  {
    const mail = mod.claimEmail({
      email: "daniel@example.com",
      claimUrl: `${BASE}/set-password?token=abc`,
      themeId: "bamboo-grove",
    });
    save("claim", "claim", mail);
  }

  // 5. Notifications: opened / replied / failed
  {
    const opened = mod.ownerNotificationEmail({
      email: "daniel@example.com",
      recipientName: "Maya",
      dashboardUrl: `${BASE}/dashboard`,
      cardUrl: `${BASE}/c/bamboo-heart`,
      notification: "opened",
      themeId: "rose-garden",
      occasionId: "valentines",
    });
    save("notify-opened", "notify / opened", opened);

    const replied = mod.ownerNotificationEmail({
      email: "daniel@example.com",
      recipientName: "Maya",
      dashboardUrl: `${BASE}/dashboard`,
      cardUrl: `${BASE}/c/bamboo-heart`,
      notification: "replied",
      replyAuthor: "Maya",
      replyText:
        "I opened it at my kitchen table with my coffee and cried the good kind. Thank you for putting it all in writing. Call you tonight.",
      themeId: "rose-garden",
      occasionId: "valentines",
    });
    save("notify-replied", "notify / replied", replied);

    const failed = mod.ownerNotificationEmail({
      email: "daniel@example.com",
      recipientName: "Maya",
      dashboardUrl: `${BASE}/dashboard`,
      notification: "delivery_failed",
      reason: "address does not exist",
      themeId: "bamboo-grove",
      occasionId: "just-because",
    });
    save("notify-failed", "notify / failed", failed);
  }

  writeFileSync(join(outdir, "manifest.json"), JSON.stringify(manifest, null, 1));
  const files = readdirSync(outdir).filter((f) => f.endsWith(".html"));
  console.log(`rendered ${files.length} emails to ${outdir}`);
  for (const f of files) {
    const size = readdirSync(outdir).length ? require("node:fs").statSync(join(outdir, f)).size : 0;
    if (size > 100 * 1024) console.log(`  WARN ${f} is ${(size / 1024).toFixed(0)} KB (Gmail clips over 1024 KB)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
