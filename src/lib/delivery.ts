import { getDb } from "./db";
import { cards } from "./db/schema";
import { and, eq, lte, ne, sql } from "drizzle-orm";
import { logEvent } from "./cards";
import { cardDeliveryEmail, sendEmail } from "./email";
import { siteUrl } from "./config";

export { siteUrl };

/**
 * Delivery engine. Finds cards whose moment has come and sends them.
 *
 * The scheduled -> sent transition is claimed atomically before the email
 * goes out, so two overlapping cron runs, a page-load tick and a webhook
 * landing at the same instant can never double-send. A definitive email
 * failure (a 4xx from the provider, the address rejected) puts the card
 * back to scheduled for the next tick and logs the attempt. An ambiguous
 * failure (network, 5xx) keeps the claim: better one late email than two.
 *
 * Triggers:
 *  - any page load (opportunistic tick, debounced)
 *  - POST/GET /api/cron/deliveries (Cloudflare Cron Trigger or any
 *    external scheduler, protected by CRON_SECRET when set)
 */

let lastTick = 0;
const TICK_DEBOUNCE_MS = 15_000;

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
  const db = await getDb();
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
    const outcome = await deliverCard(card.id);
    if (outcome === "sent") sent++;
    else if (outcome === "failed") failed++;
    // "claimed" means another runner won this one; not a failure.
  }

  return { sent, failed };
}

/**
 * Deliver one card by id. The claim happens inside, so callers never need
 * to trust the status they read a moment ago.
 */
export async function deliverCard(
  cardId: string
): Promise<"sent" | "failed" | "claimed" | "not-ready"> {
  const db = await getDb();

  // Claim: only a scheduled card can flip to sent, and only one caller
  // succeeds even under concurrency.
  const claimed = await db
    .update(cards)
    .set({ status: "sent", updatedAt: new Date().toISOString() })
    .where(and(eq(cards.id, cardId), eq(cards.status, "scheduled")))
    .returning({
      id: cards.id,
      slug: cards.slug,
      recipientEmail: cards.recipientEmail,
      senderName: cards.senderName,
      recipientName: cards.recipientName,
      occasion: cards.occasion,
      customOccasion: cards.customOccasion,
      theme: cards.theme,
    });

  if (claimed.length === 0) return "claimed";
  const card = claimed[0];

  const email = card.recipientEmail;
  const url = `${siteUrl()}/c/${card.slug}`;
  if (email) {
    const mail = cardDeliveryEmail({
      recipientName: card.recipientName,
      senderName: card.senderName,
      cardUrl: url,
      occasionId: card.occasion,
      customOccasion: card.customOccasion,
      themeId: card.theme,
    });
    mail.to = email;
    mail.cardId = cardId;
    try {
      const result = await sendEmail(mail);
      if (result.status === "failed") {
        if (result.definitive) {
          // The address is wrong or rejected. Release the claim so the
          // sender sees the failure and can fix the address.
          await db
            .update(cards)
            .set({ status: "scheduled", updatedAt: new Date().toISOString() })
            .where(and(eq(cards.id, cardId), eq(cards.status, "sent")));
          await logEvent(cardId, "delivery_failed", { reason: result.error ?? "rejected" });
          return "failed";
        }
        // Ambiguous (network, 5xx): the email may have gone out. Keep the
        // claim, log it, and let a human or retry sort it out.
        await logEvent(cardId, "delivery_uncertain", { reason: result.error ?? "unknown" });
      }
    } catch (err) {
      await logEvent(cardId, "delivery_uncertain", {
        reason: err instanceof Error ? err.message.slice(0, 120) : "unknown",
      });
    }
  }

  const nowIso = new Date().toISOString();
  await db
    .update(cards)
    .set({ deliveredAt: nowIso, updatedAt: nowIso })
    .where(eq(cards.id, cardId));
  await logEvent(cardId, "delivered", {});
  return "sent";
}
