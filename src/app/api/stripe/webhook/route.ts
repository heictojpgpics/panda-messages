import { NextRequest, NextResponse } from "next/server";
import { verifyStripeSignature } from "@/lib/payments";
import { attachCardToUser, getCardById, markPaid } from "@/lib/cards";
import {
  createPasswordClaim,
  createUser,
  findUserByEmail,
} from "@/lib/auth";
import { sendEmail, claimEmail, receiptEmail } from "@/lib/email";
import { deliverCard, siteUrl } from "@/lib/delivery";

export const dynamic = "force-dynamic";

/** Stripe webhook: the real money path. Verify, then run the same pipeline. */
export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  if (!(await verifyStripeSignature(payload, signature))) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Record<string, unknown>;
  const metadata = (session.metadata ?? {}) as Record<string, unknown>;
  const cardId = String(metadata.cardId ?? session.client_reference_id ?? "");
  if (!cardId) return NextResponse.json({ received: true });

  const card = await getCardById(cardId);
  if (!card || card.plan === "paid") {
    return NextResponse.json({ received: true });
  }

  const customerDetails = (session.customer_details ?? {}) as Record<string, unknown>;
  const customerEmail = String(customerDetails.email ?? session.customer_email ?? "");
  const ref = String(session.id ?? "");

  // markPaid is the only gate: one webhook (or ten retries) pays a card
  // exactly once.
  const won = await markPaid(card.id, {
    paymentRef: ref,
    provider: "stripe",
    deliverAt: card.deliverAt,
    recipientEmail: card.recipientEmail,
  });
  if (!won) return NextResponse.json({ received: true });

  // Provision the account the card now belongs to.
  if (customerEmail) {
    let account = await findUserByEmail(customerEmail);
    let claimUrl: string | null = null;
    if (!account) {
      account = await createUser(customerEmail, null, card.senderName);
      const token = await createPasswordClaim(account.id);
      claimUrl = `/set-password?token=${token}`;
    }
    await attachCardToUser(card.id, account.id);
    if (claimUrl) {
      const origin = process.env.NEXT_PUBLIC_SITE_URL ?? siteUrl();
      const mail = claimEmail({
        email: account.email,
        claimUrl: `${origin}${claimUrl}`,
        occasionId: card.occasion,
        customOccasion: card.customOccasion,
        themeId: card.theme,
      });
      mail.to = account.email;
      await sendEmail(mail);
    }
    const receipt = receiptEmail({
      buyerEmail: account.email,
      recipientName: card.recipientName,
      dashboardUrl: `${siteUrl()}/dashboard?watch=${card.slug}`,
      refundNoteUrl: `${siteUrl()}/refund-policy`,
      scheduledFor: card.deliverAt ?? null,
      occasionId: card.occasion,
      customOccasion: card.customOccasion,
      themeId: card.theme,
    });
    receipt.to = account.email;
    receipt.cardId = card.id;
    await sendEmail(receipt);
  }

  if (!card.deliverAt) {
    await deliverCard(card.id);
  }

  return NextResponse.json({ received: true });
}
