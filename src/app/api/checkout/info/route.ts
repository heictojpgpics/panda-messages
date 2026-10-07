import { NextRequest, NextResponse } from "next/server";
import { getCardById } from "@/lib/cards";
import { cardOwnedBy } from "@/lib/cards";
import { getCurrentUser } from "@/lib/auth";

/** Checkout page needs the order summary. Card ids are unguessable. */
export async function GET(req: NextRequest) {
  const cardId = req.nextUrl.searchParams.get("cardId");
  if (!cardId) return NextResponse.json({ error: "Which card?" }, { status: 400 });

  const card = await getCardById(cardId);
  if (!card) return NextResponse.json({ error: "not found" }, { status: 404 });

  const user = await getCurrentUser();
  const owns = await cardOwnedBy(card, {
    user,
    editToken: req.nextUrl.searchParams.get("editToken"),
  });
  if (!owns) return NextResponse.json({ error: "This checkout is not yours." }, { status: 403 });

  return NextResponse.json({
    card: {
      id: card.id,
      slug: card.slug,
      recipientName: card.recipientName,
      senderName: card.senderName,
      occasion: card.occasion,
      deliverAt: card.deliverAt,
      recipientEmail: card.recipientEmail,
      message: card.message,
      theme: card.theme,
      songId: card.songId,
      photoCount: card.photos ? JSON.parse(card.photos).length : 0,
      plan: card.plan,
    },
  });
}
