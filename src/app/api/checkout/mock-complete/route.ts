import { NextRequest, NextResponse } from "next/server";
import { sameOrigin } from "@/lib/origin";
import { getCardById, cardOwnedBy } from "@/lib/cards";
import { getCurrentUser, isValidEmail, normalizeEmail } from "@/lib/auth";
import { batchOfCard, fulfillBatch } from "@/lib/fulfillment";
import { paymentMode } from "@/lib/payments";
import { clientIp, rateLimit } from "@/lib/ratelimit";

/**
 * Complete the simulated checkout. Everything downstream of this moment is
 * exactly what happens with a real payment: the pack lands as credits, the
 * cards are paid and scheduled, the account is provisioned, the receipt
 * goes out, right-away cards are delivered.
 *
 * Guardrails:
 *  - Only exists when mock payments are the active mode. With Stripe keys
 *    configured this endpoint refuses to do anything, so nobody can mark
 *    a card paid without paying for it.
 *  - The caller must own the cards (session or edit token).
 *  - Fulfilment is idempotent: a double submit only pays once.
 */
export async function POST(req: NextRequest) {
  // Cross-site guard: a POST from anywhere but this site is turned away
  // before it reaches any logic.
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: "Not from here." }, { status: 403 });
  }

  try {
    if (paymentMode() !== "mock") {
      return NextResponse.json({ error: "Not available." }, { status: 403 });
    }

    const verdict = await rateLimit(`mockpay:${clientIp(req)}`, 10, 60 * 60 * 1000);
    if (!verdict.ok) {
      return NextResponse.json({ error: "Give it a moment and try again." }, { status: 429 });
    }

    const body = await req.json();
    const cardId = String(body.cardId ?? "");
    const buyerEmail = body.email ? normalizeEmail(String(body.email)) : "";
    const editToken = body.editToken ? String(body.editToken) : null;
    const packId = String(body.packId ?? "single");

    const card = await getCardById(cardId);
    if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });

    const user = await getCurrentUser();
    const owns = await cardOwnedBy(card, { user, editToken });
    if (!owns) return NextResponse.json({ error: "This card is not yours." }, { status: 403 });

    if (!isValidEmail(buyerEmail)) {
      return NextResponse.json({ error: "Your email is needed for the receipt." }, { status: 400 });
    }

    const batchId = await batchOfCard(card.id);
    if (!batchId) return NextResponse.json({ error: "Card not found." }, { status: 404 });

    const result = await fulfillBatch({
      batchId,
      packId,
      paymentRef: `mock_${Date.now().toString(36)}`,
      provider: "mock",
      buyerEmail,
    });

    if (!result.ok) {
      return NextResponse.json({ error: "The checkout did not go through." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      alreadyPaid: result.alreadyPaid,
      slug: result.slugs[0] ?? card.slug,
      slugs: result.slugs,
      count: result.count,
      status: "scheduled",
      claimUrl: result.claimUrl,
      accountEmail: result.accountEmail,
      signedIn: Boolean(user),
    });
  } catch (err) {
    console.error("mock checkout failed", err);
    return NextResponse.json({ error: "The checkout did not go through." }, { status: 500 });
  }
}
