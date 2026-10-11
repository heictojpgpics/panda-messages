import { NextRequest, NextResponse } from "next/server";
import { sameOrigin } from "@/lib/origin";
import { getCurrentUser, isValidEmail } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getCardBySlug, cardsInBatch, cardOwnedBy, logEvent } from "@/lib/cards";
import { createStripeCheckout, paymentMode } from "@/lib/payments";
import { packById } from "@/lib/config";
import { clientIp, rateLimit } from "@/lib/ratelimit";

/**
 * Start a paid checkout for one card or a whole batch. The pack and its
 * price are resolved server-side from the pack table; the client only
 * sends a pack id, so a tampered request can never buy 15 cards for $5.
 */
export async function POST(req: NextRequest) {
  // Cross-site guard: a POST from anywhere but this site is turned away
  // before it reaches any logic.
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: "Not from here." }, { status: 403 });
  }

  try {
    const verdict = await rateLimit(`checkout:${clientIp(req)}`, 20, 60 * 60 * 1000);
    if (!verdict.ok) {
      return NextResponse.json({ error: "Give it a moment and try again." }, { status: 429 });
    }

    const body = await req.json();
    const batchId = body.batchId ? String(body.batchId) : null;
    const slug = body.slug ? String(body.slug) : null;
    const packId = String(body.packId ?? "single");
    const deliverAt = body.deliverAt ? String(body.deliverAt) : null;
    const editToken = body.editToken ? String(body.editToken) : null;

    const pack = packById(packId);
    if (!pack) {
      return NextResponse.json({ error: "That pack is not on the shelf." }, { status: 400 });
    }

    // Resolve the batch: an explicit batch id, or the single card's own row.
    let batch;
    if (batchId) {
      batch = await cardsInBatch(batchId);
    } else if (slug) {
      const card = await getCardBySlug(slug);
      batch = card ? [card] : [];
    } else {
      return NextResponse.json({ error: "Which card?" }, { status: 400 });
    }
    if (batch.length === 0) return NextResponse.json({ error: "Card not found." }, { status: 404 });
    if (batch.length > 15) {
      return NextResponse.json({ error: "Up to 15 cards at a time." }, { status: 400 });
    }

    const user = await getCurrentUser();
    // Ownership: signed in as the maker, or holding the edit token. For a
    // bulk batch every card has its own token, but the batch was minted by
    // one request, so owning the first card means owning the batch: the
    // batch id is an unguessable uuid minted server-side at creation.
    const owns = await cardOwnedBy(batch[0], { user, editToken });
    if (!owns) return NextResponse.json({ error: "This card is not yours." }, { status: 403 });

    // A card that already sent, or was cancelled, cannot be re-sold.
    const sendable = batch.filter((c) => c.status === "draft" || c.status === "awaiting_payment");
    if (sendable.length !== batch.length) {
      return NextResponse.json(
        { error: "One of these cards already left. Make a new one, they are quick." },
        { status: 409 }
      );
    }

    if (deliverAt && Number.isNaN(Date.parse(deliverAt))) {
      return NextResponse.json({ error: "Pick a valid day." }, { status: 400 });
    }

    // One recipient email per batch only makes sense when the batch is one
    // card; bulk cards carry their own recipient emails from creation.
    let recipientEmail: string | null = null;
    if (batch.length === 1 && body.recipientEmail) {
      recipientEmail = String(body.recipientEmail).trim().toLowerCase();
      if (!isValidEmail(recipientEmail)) {
        return NextResponse.json({ error: "Their email does not look right." }, { status: 400 });
      }
    }

    // Persist the delivery plan before payment so the pipeline downstream
    // (webhook or mock completion) reads it off the card rows themselves.
    const db = await getDb();
    await db
      .update(cards)
      .set({
        ...(batch.length === 1 && recipientEmail ? { recipientEmail } : {}),
        deliverAt,
        packId: pack.id,
        status: "awaiting_payment",
        updatedAt: new Date().toISOString(),
      })
      .where(inArray(cards.id, batch.map((c) => c.id)));
    await logEvent(batch[0].id, "checkout_started", { provider: paymentMode(), packId, cards: batch.length });

    const realBatchId = batchId ?? batch[0].id;

    if (paymentMode() === "stripe") {
      const origin = req.nextUrl.origin;
      const session = await createStripeCheckout({
        batchId: realBatchId,
        cardCount: batch.length,
        pack,
        customerEmail: user?.email ?? null,
        successUrl: `${origin}/checkout/success?card=${batch[0].id}`,
        cancelUrl: `${origin}/checkout/${batch[0].id}?cancelled=1`,
      });
      return NextResponse.json({ url: session.url, provider: "stripe", batchId: realBatchId });
    }

    // Simulated checkout: full flow, no card charged.
    return NextResponse.json({ url: `/checkout/${batch[0].id}`, provider: "mock", batchId: realBatchId });
  } catch (err) {
    console.error("checkout failed", err);
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
