import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCardBySlug, markFreeFinalized } from "@/lib/cards";

/** The free card goes live: its link is now the delivery. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const card = await getCardBySlug(slug);
    if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });

    const user = await getCurrentUser();
    const body = await req.json().catch(() => ({}));
    const editToken = body.editToken ? String(body.editToken) : null;
    const owns =
      (user && card.userId && card.userId === user.id) ||
      (editToken && editToken === card.editToken);
    if (!owns) return NextResponse.json({ error: "This card is not yours." }, { status: 403 });

    if (card.status === "draft") {
      await markFreeFinalized(card.id);
    }
    return NextResponse.json({ ok: true, slug: card.slug });
  } catch (err) {
    console.error("finalize free failed", err);
    return NextResponse.json({ error: "Could not finalize the card." }, { status: 500 });
  }
}
