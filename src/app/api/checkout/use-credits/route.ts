import { NextRequest, NextResponse } from "next/server";
import { sameOrigin } from "@/lib/origin";
import { getCurrentUser } from "@/lib/auth";
import { cardsInBatch, cardOwnedBy, getUserCredits } from "@/lib/cards";
import { fulfillWithCredits } from "@/lib/fulfillment";
import { clientIp, rateLimit } from "@/lib/ratelimit";

/**
 * Send on credits already owned: no payment provider, just the same
 * pay-and-schedule pipeline spending one credit per card. Requires a
 * signed-in account, because credits live on the account.
 */
export async function POST(req: NextRequest) {
  // Cross-site guard: a POST from anywhere but this site is turned away
  // before it reaches any logic.
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: "Not from here." }, { status: 403 });
  }

  try {
    const verdict = await rateLimit(`creditsend:${clientIp(req)}`, 20, 60 * 60 * 1000);
    if (!verdict.ok) {
      return NextResponse.json({ error: "Give it a moment and try again." }, { status: 429 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in first, so your credits are yours." }, { status: 401 });
    }

    const body = await req.json();
    const batchId = String(body.batchId ?? "");
    const batch = await cardsInBatch(batchId);
    if (batch.length === 0) return NextResponse.json({ error: "Card not found." }, { status: 404 });

    // Every card in the batch must belong to this sender.
    for (const card of batch) {
      const owns = await cardOwnedBy(card, { user });
      if (!owns) return NextResponse.json({ error: "This card is not yours." }, { status: 403 });
    }

    const sendable = batch.filter((c) => c.status === "draft" || c.status === "awaiting_payment");
    if (sendable.length === 0) {
      return NextResponse.json({ ok: true, alreadySent: true, sent: 0, slug: batch[0].slug });
    }

    const credits = await getUserCredits(user.id);
    if (credits < sendable.length) {
      return NextResponse.json(
        { error: `This needs ${sendable.length} credits and you have ${credits}. Pick a pack below and the difference is covered.` },
        { status: 402 }
      );
    }

    const result = await fulfillWithCredits(batchId, user.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason === "not enough credits" ? "Not enough credits after all." : "The send did not go through." }, { status: 409 });
    }

    return NextResponse.json({
      ok: true,
      sent: result.sent,
      slug: batch[0].slug,
      creditsLeft: Math.max(0, credits - result.sent),
    });
  } catch (err) {
    console.error("credit send failed", err);
    return NextResponse.json({ error: "The send did not go through." }, { status: 500 });
  }
}
