import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  cancelCard,
  cardOwnedBy,
  getCardBySlug,
  grantCredits,
  getCardById,
  logEvent,
} from "@/lib/cards";
import { stripeRefund } from "@/lib/payments";
import { sameOrigin } from "@/lib/origin";

/**
 * Cancel a scheduled card.
 *
 * How the money comes back depends on how the card was paid for:
 *  - bought as a single $5 card: a real refund of that payment.
 *  - bought inside a pack, or sent on a credit: the card's value returns
 *    to the account as one credit, ready for the next send. The pack
 *    purchase itself stays untouched, which is what a person cancelling
 *    one of five cards actually wants.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    // Cross-site guard: a POST from anywhere but this site is turned away
    // before it reaches any logic.
    if (!sameOrigin(req)) {
      return NextResponse.json({ error: "Not from here." }, { status: 403 });
    }

    const { slug } = await params;
    const card = (await getCardById(slug)) ?? (await getCardBySlug(slug));
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
    let creditBack = false;
    const fromPack = card.packId === "pack5" || card.packId === "pack15";
    const onCredit = card.checkoutProvider === "credits";

    if (onCredit || fromPack) {
      // The value returns where it came from: the pack.
      if (card.userId) {
        await grantCredits(card.userId, 1);
        creditBack = true;
        await logEvent(card.id, "credit_returned", {});
      }
      refunded = true;
    } else if (card.plan === "paid") {
      refunded =
        card.checkoutProvider === "stripe"
          ? await stripeRefund(card.paymentRef ?? "")
          : card.checkoutProvider === "mock";
      if (refunded) {
        await logEvent(card.id, "refund", {});
      }
    }
    return NextResponse.json({ ok: true, refunded, creditBack });
  } catch (err) {
    console.error("cancel failed", err);
    return NextResponse.json({ error: "Could not cancel that card." }, { status: 500 });
  }
}
