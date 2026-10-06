import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cancelCard, getCardBySlug, cardOwnedBy, logEvent } from "@/lib/cards";
import { stripeRefund } from "@/lib/payments";

/** Cancel a scheduled card. Paid cards get an automatic full refund. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const card = await getCardBySlug(slug);
    if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });

    const user = await getCurrentUser();
    const body = await req.json().catch(() => ({}));
    const editToken = body.editToken ? String(body.editToken) : null;
    const owns = await cardOwnedBy(card, { user, editToken });
    if (!owns) return NextResponse.json({ error: "This card is not yours." }, { status: 403 });

    if (card.status === "cancelled") {
      return NextResponse.json({ ok: true, already: true });
    }
    if (card.status !== "scheduled" && card.status !== "awaiting_payment") {
      return NextResponse.json(
        { error: "This card already reached them, so it cannot be taken back." },
        { status: 409 }
      );
    }

    // Cancel first: the card must stop being deliverable no matter what
    // the refund call does. A failed refund can be retried; a sent card
    // cannot be unsent.
    await cancelCard(card.id, false);

    let refunded = false;
    if (card.plan === "paid") {
      refunded = card.checkoutProvider === "stripe" ? await stripeRefund(card.paymentRef ?? "") : true;
      if (card.checkoutProvider === "mock") refunded = true;
      if (refunded) {
        await logEvent(card.id, "refund", {});
      }
    }
    return NextResponse.json({ ok: true, refunded });
  } catch (err) {
    console.error("cancel failed", err);
    return NextResponse.json({ error: "Could not cancel that card." }, { status: 500 });
  }
}
