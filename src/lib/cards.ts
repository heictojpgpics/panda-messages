import { getDb } from "./db";
import { cards, cardEvents, reactions, replies } from "./db/schema";
import { and, asc, desc, eq, gt, inArray, lte, ne, sql } from "drizzle-orm";
import { newId, newSlug, newToken, sha256Hex, timingSafeEqualStr } from "./ids";
import { getTheme, FREE_THEMES } from "@/data/themes";
import type { SessionUser } from "./auth";

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
  const db = await getDb();
  await db.insert(cardEvents).values({
    cardId,
    type,
    meta: meta === undefined ? null : JSON.stringify(meta),
    createdAt: new Date().toISOString(),
  });
}

/** Hash an edit token the way it is stored. */
export async function hashEditToken(token: string): Promise<string> {
  return sha256Hex(`edit:${token}`);
}

export async function createCard(draft: CardDraft, userId: string | null) {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = newId();
  const slug = newSlug(10);
  const editToken = newToken(18);
  const theme = getTheme(draft.theme);

  await db.insert(cards).values({
    id,
    slug,
    userId,
    editToken: await hashEditToken(editToken),
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
  return { card: rows[0], editToken };
}

export async function getCardBySlug(slug: string) {
  const db = await getDb();
  const rows = await db.select().from(cards).where(eq(cards.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getCardById(id: string) {
  const db = await getDb();
  const rows = await db.select().from(cards).where(eq(cards.id, id)).limit(1);
  return rows[0] ?? null;
}

/**
 * The maker of a card is the signed-in owner or the holder of the edit
 * token from creation time. Tokens are compared against their stored hash.
 */
export async function cardOwnedBy(
  card: { userId: string | null; editToken: string },
  opts: { user?: SessionUser | null; editToken?: string | null }
): Promise<boolean> {
  if (opts.user && card.userId && card.userId === opts.user.id) return true;
  if (opts.editToken) {
    const hashed = await hashEditToken(opts.editToken);
    return timingSafeEqualStr(hashed, card.editToken);
  }
  return false;
}

export async function updateCard(id: string, patch: Partial<CardDraft> & { recipientEmail?: string | null }) {
  const db = await getDb();
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
  const db = await getDb();
  return db
    .select()
    .from(cards)
    .where(eq(cards.userId, userId))
    .orderBy(desc(cards.createdAt))
    .limit(200);
}

export async function listEventsForCard(cardId: string, afterId = 0, limit = 40) {
  const db = await getDb();
  return db
    .select()
    .from(cardEvents)
    .where(and(eq(cardEvents.cardId, cardId), gt(cardEvents.id, afterId)))
    .orderBy(asc(cardEvents.id))
    .limit(limit);
}

export async function listEventsForUser(userId: string, limit = 30) {
  const db = await getDb();
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
  const db = await getDb();
  return db
    .select({ kind: reactions.kind, count: sql<number>`count(*)` })
    .from(reactions)
    .where(eq(reactions.cardId, cardId))
    .groupBy(reactions.kind);
}

export async function getRepliesForCard(cardId: string) {
  const db = await getDb();
  return db
    .select()
    .from(replies)
    .where(eq(replies.cardId, cardId))
    .orderBy(desc(replies.createdAt))
    .limit(50);
}

/**
 * The payment took hold. Idempotent under retries and races: only the
 * caller that flips plan free -> paid wins, and only that caller logs the
 * events and schedules delivery. A second webhook for the same purchase
 * changes nothing.
 */
export async function markPaid(
  id: string,
  opts: { paymentRef: string; provider: string; deliverAt: string | null; recipientEmail: string | null }
): Promise<boolean> {
  const db = await getDb();
  const now = new Date().toISOString();
  const rows = await db
    .update(cards)
    .set({
      plan: "paid",
      watermark: false,
      status: "scheduled",
      paidAt: now,
      paymentRef: opts.paymentRef,
      checkoutProvider: opts.provider,
      deliverAt: opts.deliverAt,
      deliveredAt: null,
      recipientEmail: opts.recipientEmail,
      updatedAt: now,
    })
    .where(and(eq(cards.id, id), ne(cards.plan, "paid")))
    .returning({ id: cards.id });

  if (rows.length === 0) return false; // someone else already paid this card

  await logEvent(id, "paid", { provider: opts.provider });
  await logEvent(id, "scheduled", { deliverAt: opts.deliverAt ?? "right away" });
  return true;
}

export async function markFreeFinalized(id: string) {
  const db = await getDb();
  const now = new Date().toISOString();
  // The free card stays honest to its own description: watermark, classic
  // theme. If a paid theme was picked during writing, it gently comes home.
  const rows = await db.select().from(cards).where(eq(cards.id, id)).limit(1);
  const card = rows[0];
  if (!card) return;
  const keepTheme = FREE_THEMES.includes(card.theme) ? card.theme : "bamboo-grove";
  await db
    .update(cards)
    .set({ status: "sent", theme: keepTheme, deliveredAt: now, updatedAt: now })
    .where(eq(cards.id, id));
  await logEvent(id, "delivered", { mode: "self-share" });
}

export async function cancelCard(id: string, refund: boolean) {
  const db = await getDb();
  const now = new Date().toISOString();
  await db
    .update(cards)
    .set({ status: "cancelled", deliverAt: null, updatedAt: now })
    .where(eq(cards.id, id));
  await logEvent(id, "cancelled", { refund });
}

export async function attachCardToUser(id: string, userId: string) {
  const db = await getDb();
  await db
    .update(cards)
    .set({ userId, updatedAt: new Date().toISOString() })
    .where(and(eq(cards.id, id), sql`${cards.userId} IS NULL`));
}

/**
 * Called when a recipient opens the envelope. One view per open, and the
 * opened event fires exactly once, on the first one.
 */
export async function recordView(id: string): Promise<boolean> {
  const db = await getDb();
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

/**
 * One of each reaction kind per visitor. The unique index on
 * (card, kind, visitor) makes this atomic even under a double-tap, and the
 * burst stays honest on the sender's live feed instead of turning into a
 * spam machine.
 */
export async function addReaction(cardId: string, kind: string, visitorId: string): Promise<boolean> {
  const db = await getDb();
  const rows = await db
    .insert(reactions)
    .values({
      cardId,
      kind,
      visitorId,
      createdAt: new Date().toISOString(),
    })
    .onConflictDoNothing()
    .returning({ id: reactions.id });
  if (rows.length === 0) return false;
  await logEvent(cardId, "reacted", { kind });
  return true;
}

export async function addReply(cardId: string, authorName: string, message: string) {
  const db = await getDb();
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
  const db = await getDb();
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
