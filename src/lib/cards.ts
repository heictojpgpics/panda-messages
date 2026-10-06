import { getDb } from "./db";
import { cards, cardEvents, reactions, replies } from "./db/schema";
import { and, asc, desc, eq, gt, inArray, isNotNull, lte, ne, or, sql } from "drizzle-orm";
import { newId, newSlug, newToken } from "./ids";
import { getTheme } from "@/data/themes";

export interface CardDraft {
  senderName: string;
  recipientName: string;
  recipientEmail?: string | null;
  occasion: string;
  message: string;
  signoff: string;
  theme: string;
  songId?: string | null;
  songProvider?: string | null;
  photos?: string[] | null;
  replyToCardId?: string | null;
}

export async function logEvent(cardId: string, type: string, meta?: unknown): Promise<void> {
  const db = getDb();
  await db.insert(cardEvents).values({
    cardId,
    type,
    meta: meta === undefined ? null : JSON.stringify(meta),
    createdAt: new Date().toISOString(),
  });
}

export async function createCard(draft: CardDraft, userId: string | null) {
  const db = getDb();
  const now = new Date().toISOString();
  const id = newId();
  const slug = newSlug(10);
  const editToken = newToken(18);
  const theme = getTheme(draft.theme);

  await db.insert(cards).values({
    id,
    slug,
    userId,
    editToken,
    senderName: draft.senderName.trim(),
    recipientName: draft.recipientName.trim(),
    recipientEmail: draft.recipientEmail?.trim() || null,
    occasion: draft.occasion,
    message: draft.message.trim(),
    signoff: draft.signoff.trim() || "with love, Panda 💚",
    theme: theme.id,
    songId: draft.songId || null,
    songProvider: draft.songProvider || null,
    photos: draft.photos?.length ? JSON.stringify(draft.photos) : null,
    plan: "free",
    status: "draft",
    watermark: true,
    replyToCardId: draft.replyToCardId || null,
    createdAt: now,
    updatedAt: now,
  });

  await logEvent(id, "created", { slug });
  const rows = await db.select().from(cards).where(eq(cards.id, id)).limit(1);
  return rows[0];
}

export async function getCardBySlug(slug: string) {
  const db = getDb();
  const rows = await db.select().from(cards).where(eq(cards.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getCardById(id: string) {
  const db = getDb();
  const rows = await db.select().from(cards).where(eq(cards.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateCard(id: string, patch: Partial<CardDraft> & { recipientEmail?: string | null }) {
  const db = getDb();
  const values: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (patch.senderName !== undefined) values.senderName = patch.senderName.trim();
  if (patch.recipientName !== undefined) values.recipientName = patch.recipientName.trim();
  if (patch.recipientEmail !== undefined) values.recipientEmail = patch.recipientEmail?.trim() || null;
  if (patch.occasion !== undefined) values.occasion = patch.occasion;
  if (patch.message !== undefined) values.message = patch.message.trim();
  if (patch.signoff !== undefined) values.signoff = patch.signoff.trim();
  if (patch.theme !== undefined) values.theme = getTheme(patch.theme).id;
  if (patch.songId !== undefined) values.songId = patch.songId || null;
  if (patch.songProvider !== undefined) values.songProvider = patch.songProvider || null;
  if (patch.photos !== undefined) values.photos = patch.photos?.length ? JSON.stringify(patch.photos) : null;
  await db.update(cards).set(values).where(eq(cards.id, id));
}

export async function listCardsForUser(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(cards)
    .where(eq(cards.userId, userId))
    .orderBy(desc(cards.createdAt))
    .limit(200);
}

export async function listEventsForCard(cardId: string, afterId = 0, limit = 40) {
  const db = getDb();
  return db
    .select()
    .from(cardEvents)
    .where(and(eq(cardEvents.cardId, cardId), gt(cardEvents.id, afterId)))
    .orderBy(asc(cardEvents.id))
    .limit(limit);
}

export async function listEventsForUser(userId: string, limit = 30) {
  const db = getDb();
  const userCards = await db
    .select({ id: cards.id })
    .from(cards)
    .where(eq(cards.userId, userId))
    .orderBy(desc(cards.createdAt))
    .limit(50);
  if (userCards.length === 0) return [];
  return db
    .select()
    .from(cardEvents)
    .where(
      inArray(
        cardEvents.cardId,
        userCards.map((c) => c.id)
      )
    )
    .orderBy(desc(cardEvents.id))
    .limit(limit);
}

export async function getReactionsForCard(cardId: string) {
  const db = getDb();
  return db
    .select({ kind: reactions.kind, count: sql<number>`count(*)` })
    .from(reactions)
    .where(eq(reactions.cardId, cardId))
    .groupBy(reactions.kind);
}

export async function getRepliesForCard(cardId: string) {
  const db = getDb();
  return db
    .select()
    .from(replies)
    .where(eq(replies.cardId, cardId))
    .orderBy(desc(replies.createdAt))
    .limit(50);
}

export async function markPaid(
  id: string,
  opts: { paymentRef: string; provider: string; deliverAt: string | null; recipientEmail: string | null }
) {
  const db = getDb();
  const now = new Date().toISOString();
  const status = opts.deliverAt ? "scheduled" : "sent";
  await db
    .update(cards)
    .set({
      plan: "paid",
      watermark: false,
      status,
      paidAt: now,
      paymentRef: opts.paymentRef,
      checkoutProvider: opts.provider,
      deliverAt: opts.deliverAt,
      deliveredAt: opts.deliverAt ? null : now,
      recipientEmail: opts.recipientEmail,
      updatedAt: now,
    })
    .where(eq(cards.id, id));
  await logEvent(id, "paid", { provider: opts.provider });
  if (status === "scheduled") {
    await logEvent(id, "scheduled", { deliverAt: opts.deliverAt });
  }
  // The 'delivered' event belongs to the delivery path, so immediate sends
  // log it exactly once, when deliverCard runs.
}

export async function markFreeFinalized(id: string) {
  const db = getDb();
  const now = new Date().toISOString();
  await db
    .update(cards)
    .set({ status: "sent", deliveredAt: now, updatedAt: now })
    .where(eq(cards.id, id));
  await logEvent(id, "delivered", { mode: "self-share" });
}

export async function cancelCard(id: string, refund: boolean) {
  const db = getDb();
  const now = new Date().toISOString();
  await db
    .update(cards)
    .set({ status: "cancelled", deliverAt: null, updatedAt: now })
    .where(eq(cards.id, id));
  await logEvent(id, "cancelled", { refund });
}

export async function attachCardToUser(id: string, userId: string) {
  const db = getDb();
  await db
    .update(cards)
    .set({ userId, updatedAt: new Date().toISOString() })
    .where(and(eq(cards.id, id), sql`${cards.userId} IS NULL`));
}

/** Called when a recipient lands on the card. */
export async function recordView(id: string): Promise<boolean> {
  const db = getDb();
  const now = new Date().toISOString();
  const rows = await db
    .update(cards)
    .set({
      viewCount: sql`${cards.viewCount} + 1`,
      openedAt: sql`COALESCE(${cards.openedAt}, ${now})`,
      status: sql`CASE WHEN ${cards.status} = 'sent' THEN 'opened' ELSE ${cards.status} END`,
      updatedAt: now,
    })
    .where(eq(cards.id, id))
    .returning({ id: cards.id, openedAt: cards.openedAt });
  if (rows[0]?.openedAt === now) {
    // First open: fire the event the sender has been waiting for.
    await logEvent(id, "opened", {});
    return true;
  }
  return false;
}

export async function addReaction(cardId: string, kind: string, visitorId: string) {
  const db = getDb();
  await db.insert(reactions).values({
    cardId,
    kind,
    visitorId,
    createdAt: new Date().toISOString(),
  });
  await logEvent(cardId, "reacted", { kind });
}

export async function addReply(cardId: string, authorName: string, message: string) {
  const db = getDb();
  const now = new Date().toISOString();
  await db.insert(replies).values({
    cardId,
    authorName: authorName.trim() || "a friend",
    message: message.trim(),
    createdAt: now,
  });
  await logEvent(cardId, "replied", { authorName: authorName.trim() });
}

export async function stats() {
  const db = getDb();
  const [cardsRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(cards)
    .where(ne(cards.status, "draft"));
  const [reactRow] = await db.select({ count: sql<number>`count(*)` }).from(reactions);
  const [replyRow] = await db.select({ count: sql<number>`count(*)` }).from(replies);
  const [smileRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(cards)
    .where(inArray(cards.status, ["sent", "opened"]));
  return {
    cards: cardsRow?.count ?? 0,
    smiles: smileRow?.count ?? 0,
    reactions: reactRow?.count ?? 0,
    replies: replyRow?.count ?? 0,
  };
}
