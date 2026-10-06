import { getDb } from "./db";
import { cards } from "./db/schema";
import { and, eq, lte, sql } from "drizzle-orm";
import { logEvent } from "./cards";
import { cardDeliveryEmail, sendEmail } from "./email";
import { getOccasion } from "@/data/occasions";

/**
 * Delivery engine. Finds cards whose moment has come and sends them.
 * Idempotent: a card only ever transitions scheduled -> sent once.
 *
 * Triggers:
 *  - any page load (opportunistic tick, keeps the demo alive)
 *  - POST/GET /api/cron/deliveries (Cloudflare Cron Trigger or any
 *    external scheduler, protected by CRON_SECRET when set)
 */

let lastTick = 0;
const TICK_DEBOUNCE_MS = 15_000;

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** Cheap opportunistic run, debounced, safe to call on every request. */
export async function opportunisticTick(): Promise<void> {
  const now = Date.now();
  if (now - lastTick < TICK_DEBOUNCE_MS) return;
  lastTick = now;
  try {
    await processDueDeliveries();
  } catch {
    // Never let delivery churn break a page render.
  }
}

export async function processDueDeliveries(): Promise<{ sent: number; failed: number }> {
  const db = getDb();
  const nowIso = new Date().toISOString();

  const due = await db
    .select()
    .from(cards)
    .where(
      and(
        eq(cards.status, "scheduled"),
        sql`${cards.deliverAt} IS NOT NULL`,
        lte(cards.deliverAt, nowIso)
      )
    )
    .limit(25);

  let sent = 0;
  let failed = 0;

  for (const card of due) {
    try {
      await deliverCard(card);
      sent++;
    } catch {
      failed++;
      await logEvent(card.id, "delivery_failed", {});
    }
  }

  return { sent, failed };
}

export async function deliverCard(card: typeof cards.$inferSelect): Promise<void> {
  const db = getDb();
  if (card.status !== "scheduled" && card.status !== "awaiting_payment") {
    // Already handled.
    return;
  }

  const email = card.recipientEmail;
  const url = `${siteUrl()}/c/${card.slug}`;
  const occasionLabel = getOccasion(card.occasion)?.label ?? "just because";

  if (email) {
    const mail = cardDeliveryEmail({
      recipientName: card.recipientName,
      senderName: card.senderName,
      cardUrl: url,
      occasionLabel,
    });
    mail.to = email;
    mail.cardId = card.id;
    const result = await sendEmail(mail);
    if (result.status === "failed") {
      throw new Error("email failed");
    }
  }

  const nowIso = new Date().toISOString();
  await db
    .update(cards)
    .set({ status: "sent", deliveredAt: nowIso, updatedAt: nowIso })
    .where(eq(cards.id, card.id));
  await logEvent(card.id, "delivered", {});
}
