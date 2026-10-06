import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isValidEmail, normalizeEmail } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCardBySlug, logEvent } from "@/lib/cards";
import { createStripeCheckout, paymentMode } from "@/lib/payments";

/** Start a paid checkout for a card. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slug = String(body.slug ?? "");
    const recipientEmail = body.recipientEmail ? normalizeEmail(String(body.recipientEmail)) : null;
    const deliverAt = body.deliverAt ? String(body.deliverAt) : null;
    const editToken = body.editToken ? String(body.editToken) : null;

    const card = await getCardBySlug(slug);
    if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });

    const user = await getCurrentUser();
    const owns =
      (user && card.userId && card.userId === user.id) ||
      (editToken && editToken === card.editToken);
    if (!owns) return NextResponse.json({ error: "This card is not yours." }, { status: 403 });

    if (recipientEmail && !isValidEmail(recipientEmail)) {
      return NextResponse.json({ error: "Their email does not look right." }, { status: 400 });
    }
    if (deliverAt && Number.isNaN(Date.parse(deliverAt))) {
      return NextResponse.json({ error: "Pick a valid day." }, { status: 400 });
    }

    // Persist the delivery plan before payment so the pipeline downstream
    // (webhook or mock completion) reads it off the card itself.
    const db = getDb();
    await db
      .update(cards)
      .set({
        recipientEmail,
        deliverAt,
        status: "awaiting_payment",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(cards.id, card.id));
    await logEvent(card.id, "checkout_started", { provider: paymentMode() });

    if (paymentMode() === "stripe") {
      const origin = req.nextUrl.origin;
      const session = await createStripeCheckout({
        cardId: card.id,
        slug: card.slug,
        customerEmail: user?.email ?? null,
        successUrl: `${origin}/checkout/success?card=${card.id}`,
        cancelUrl: `${origin}/checkout/${card.id}?cancelled=1`,
      });
      return NextResponse.json({ url: session.url, provider: "stripe" });
    }

    // Simulated checkout: full flow, no card charged.
    return NextResponse.json({ url: `/checkout/${card.id}`, provider: "mock" });
  } catch (err) {
    console.error("checkout failed", err);
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
