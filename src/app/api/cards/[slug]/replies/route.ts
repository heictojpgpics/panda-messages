import { NextRequest, NextResponse } from "next/server";
import { addReply, getCardBySlug, getRepliesForCard } from "@/lib/cards";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const card = await getCardBySlug(slug);
    if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });
    if (card.status !== "sent" && card.status !== "opened") {
      return NextResponse.json({ error: "This card is not ready for a reply yet." }, { status: 409 });
    }

    const verdict = await rateLimit(`reply:${clientIp(req)}`, 10, 10 * 60 * 1000);
    if (!verdict.ok) {
      return NextResponse.json({ error: "Panda is holding the pen for a moment. Try again shortly." }, { status: 429 });
    }

    const body = await req.json();
    const message = String(body.message ?? "").trim();
    if (!message || message.length > 400) {
      return NextResponse.json({ error: "Write a little reply, under 400 characters." }, { status: 400 });
    }

    // The reveal page belongs to the named recipient. Asking them to type
    // their own name again breaks the moment and lets a forwarded link
    // misrepresent the reply, so the card's recipient remains the author.
    await addReply(card.id, card.recipientName, message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("reply failed", err);
    return NextResponse.json({ error: "Could not send the reply." }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = await getCardBySlug(slug);
  if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });
  if (card.status !== "sent" && card.status !== "opened") {
    return NextResponse.json({ error: "This card is not ready for replies yet." }, { status: 409 });
  }
  const list = await getRepliesForCard(card.id);
  return NextResponse.json({ replies: list });
}
