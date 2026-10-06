import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listCardsForUser, listEventsForUser } from "@/lib/cards";
import { listOutboxForUser } from "@/lib/email";

export const dynamic = "force-dynamic";

/** Everything the dashboard needs in one round trip. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  const cards = await listCardsForUser(user.id);
  const cardIds = cards.map((c) => c.id);
  const [events, outbox] = await Promise.all([
    listEventsForUser(user.id),
    listOutboxForUser(cardIds, 25),
  ]);

  return NextResponse.json({
    user,
    cards: cards.map((c) => ({
      id: c.id,
      slug: c.slug,
      status: c.status,
      plan: c.plan,
      occasion: c.occasion,
      recipientName: c.recipientName,
      senderName: c.senderName,
      deliverAt: c.deliverAt,
      deliveredAt: c.deliveredAt,
      openedAt: c.openedAt,
      viewCount: c.viewCount,
      createdAt: c.createdAt,
      theme: c.theme,
      hasSong: Boolean(c.songId),
      photoCount: c.photos ? JSON.parse(c.photos).length : 0,
    })),
    events: events.map((e) => ({
      id: e.id,
      cardId: e.cardId,
      type: e.type,
      meta: e.meta ? JSON.parse(e.meta) : null,
      at: e.createdAt,
    })),
    outbox: outbox.map((m) => ({
      id: m.id,
      cardId: m.cardId,
      to: m.toEmail,
      subject: m.subject,
      status: m.status,
      provider: m.provider,
      html: m.html,
      text: m.text,
      kind: m.kind,
      at: m.createdAt,
    })),
  });
}
