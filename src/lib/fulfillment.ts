import { getDb } from "./db";
import { cards } from "./db/schema";
import { eq } from "drizzle-orm";
import {
  attachCardToUser,
  cardsInBatch,
  consumeCredit,
  getCardById,
  grantCredits,
  logEvent,
  markPaid,
  recordPurchase,
} from "./cards";
import { createPasswordClaim, createUser, findUserByEmail } from "./auth";
import { sendEmail, claimEmail, receiptEmail } from "./email";
import { deliverCard, siteUrl } from "./delivery";
import { packById } from "./config";

/**
 * One fulfillment pipeline behind every payment, real or simulated.
 *
 * A completed checkout does three things, in order, all idempotent:
 *   1. the pack lands on the buyer's account as credits (recorded as a
 *      purchase row),
 *   2. every card in the batch is paid for with one credit each and
 *      scheduled for its morning,
 *   3. receipts (and a claim link for brand-new accounts) go out, and
 *      cards without a picked day are delivered immediately.
 *
 * Retries are safe: credits are only consumed after a card wins the
 * free -> paid flip, and that flip happens exactly once per card.
 */

export interface FulfillResult {
  ok: boolean;
  alreadyPaid: boolean;
  slugs: string[];
  count: number;
  packId: string;
  creditsLeft: number | null;
  claimUrl: string | null;
  accountEmail: string | null;
}

export async function fulfillBatch(opts: {
  batchId: string;
  packId: string;
  paymentRef: string;
  provider: "stripe" | "mock";
  buyerEmail: string | null;
}): Promise<FulfillResult> {
  const pack = packById(opts.packId) ?? packById("single")!;
  const batch = await cardsInBatch(opts.batchId);
  const first = batch[0] ?? null;
  if (!first) {
    return { ok: false, alreadyPaid: false, slugs: [], count: 0, packId: pack.id, creditsLeft: null, claimUrl: null, accountEmail: null };
  }

  // Every card already paid? Nothing to do (webhook retry or refresh).
  const unpaid = batch.filter((c) => c.plan !== "paid");
  if (unpaid.length === 0) {
    return { ok: true, alreadyPaid: true, slugs: batch.map((c) => c.slug), count: batch.length, packId: pack.id, creditsLeft: null, claimUrl: null, accountEmail: opts.buyerEmail };
  }

  // Resolve the account this purchase belongs to: an attached user, the
  // current buyer email, or a freshly provisioned one.
  let userId = first.userId;
  let claimUrl: string | null = null;
  let accountEmail: string | null = opts.buyerEmail;
  if (!userId && opts.buyerEmail) {
    let account = await findUserByEmail(opts.buyerEmail);
    if (!account) {
      account = await createUser(opts.buyerEmail, null, first.senderName);
      const token = await createPasswordClaim(account.id);
      claimUrl = `/set-password?token=${token}`;
    }
    userId = account.id;
    accountEmail = account.email;
  }
  if (!userId) {
    // No account to hold credits: pay the cards directly. This should not
    // happen in practice (checkout always collects an email), but a paid
    // card must never be lost to a missing account.
    await payBatch(batch, opts, pack.id);
    return { ok: true, alreadyPaid: false, slugs: batch.map((c) => c.slug), count: batch.length, packId: pack.id, creditsLeft: null, claimUrl: null, accountEmail: null };
  }

  // 1. The pack lands whole.
  await grantCredits(userId, pack.cards);
  await recordPurchase({
    userId,
    packId: pack.id,
    cardsIncluded: pack.cards,
    priceCents: Math.round(pack.price * 100),
    paymentRef: opts.paymentRef,
    provider: opts.provider,
  });

  // 2. One credit per card, paid and scheduled.
  for (const card of batch) {
    const won = await markPaid(card.id, {
      paymentRef: opts.paymentRef,
      provider: opts.provider,
      deliverAt: card.deliverAt,
      recipientEmail: card.recipientEmail,
      packId: pack.id,
    });
    if (won) await consumeCredit(userId);
    await attachCardToUser(card.id, userId);
  }

  // 3. The letters: claim link for a fresh account, receipt for the buyer,
  //    and immediate delivery for cards with no picked day.
  if (claimUrl && accountEmail) {
    const mail = claimEmail({
      email: accountEmail,
      claimUrl: `${siteUrl()}${claimUrl}`,
      occasionId: first.occasion,
      customOccasion: first.customOccasion,
      themeId: first.theme,
    });
    mail.to = accountEmail;
    await sendEmail(mail).catch(() => {});
  }

  if (accountEmail) {
    const receipt = receiptEmail({
      buyerEmail: accountEmail,
      recipientName: batch.length === 1 ? first.recipientName : `${batch.length} people`,
      dashboardUrl: `${siteUrl()}/dashboard?watch=${first.slug}`,
      refundNoteUrl: `${siteUrl()}/refund-policy`,
      scheduledFor: first.deliverAt ?? null,
      occasionId: first.occasion,
      customOccasion: first.customOccasion,
      themeId: first.theme,
      packLabel: pack.id === "single" ? null : pack.label,
    });
    receipt.to = accountEmail;
    receipt.cardId = first.id;
    await sendEmail(receipt).catch(() => {});
  }

  for (const card of batch) {
    if (!card.deliverAt) {
      await deliverCard(card.id).catch(() => {});
    }
  }

  return {
    ok: true,
    alreadyPaid: false,
    slugs: batch.map((c) => c.slug),
    count: batch.length,
    packId: pack.id,
    creditsLeft: null,
    claimUrl,
    accountEmail,
  };
}

/** No account path: flip the cards paid without credit accounting. */
async function payBatch(
  batch: Awaited<ReturnType<typeof cardsInBatch>>,
  opts: { paymentRef: string; provider: "stripe" | "mock" },
  packId: string
): Promise<void> {
  for (const card of batch) {
    await markPaid(card.id, {
      paymentRef: opts.paymentRef,
      provider: opts.provider,
      deliverAt: card.deliverAt,
      recipientEmail: card.recipientEmail,
      packId,
    });
    if (!card.deliverAt) await deliverCard(card.id).catch(() => {});
  }
}

/**
 * The no-payment path: spend credits the buyer already owns. One credit
 * per card, atomically consumed only when the card actually flips paid.
 */
export async function fulfillWithCredits(batchId: string, userId: string): Promise<{ ok: boolean; sent: number; reason?: string }> {
  const batch = await cardsInBatch(batchId);
  if (batch.length === 0) return { ok: false, sent: 0, reason: "not found" };
  const unpaid = batch.filter((c) => c.plan !== "paid");
  if (unpaid.length === 0) return { ok: true, sent: 0 };

  let sent = 0;
  for (const card of unpaid) {
    const won = await markPaid(card.id, {
      paymentRef: `credits:${userId.slice(0, 8)}`,
      provider: "credits",
      deliverAt: card.deliverAt,
      recipientEmail: card.recipientEmail,
      packId: null,
    });
    if (!won) continue;
    const spent = await consumeCredit(userId);
    if (!spent) {
      // Out of credits mid-batch: put this card back to draft so nothing
      // is paid for that was not covered.
      const db = await getDb();
      await db.update(cards).set({ plan: "free", status: "draft", paidAt: null, updatedAt: new Date().toISOString() }).where(eq(cards.id, card.id));
      await logEvent(card.id, "credit_shortage", {});
      return { ok: false, sent, reason: "not enough credits" };
    }
    await attachCardToUser(card.id, userId);
    if (!card.deliverAt) await deliverCard(card.id).catch(() => {});
    sent++;
  }
  return { ok: true, sent };
}

/** Used by mock-complete to find a batch from its first card id. */
export async function batchOfCard(cardId: string): Promise<string | null> {
  const card = await getCardById(cardId);
  return card?.batchId ?? card?.id ?? null;
}
