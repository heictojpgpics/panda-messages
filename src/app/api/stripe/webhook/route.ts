import { NextRequest, NextResponse } from "next/server";
import { verifyStripeSignature } from "@/lib/payments";
import { attachCardToUser, getCardById, logEvent, markPaid } from "@/lib/cards";
import {
  createPasswordClaim,
  createUser,
  findUserByEmail,
} from "@/lib/auth";
import { sendEmail, claimEmail } from "@/lib/email";
import { deliverCard } from "@/lib/delivery";

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

  const session = event.data.object;
  const cardId = String(session.metadata?.cardId ?? session.client_reference_id ?? "");
  if (!cardId) return NextResponse.json({ received: true });

  const card = await getCardById(cardId);
  if (!card || card.plan === "paid") {
    return NextResponse.json({ received: true });
  }

  const customerEmail = String(session.customer_details?.email ?? session.customer_email ?? "");
  const ref = String(session.id ?? "");

  await markPaid(card.id, {
    paymentRef: ref,
    provider: "stripe",
    deliverAt: card.deliverAt,
    recipientEmail: card.recipientEmail,
  });

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
      const origin = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
      const mail = claimEmail({ email: account.email, claimUrl: `${origin}${claimUrl}` });
      mail.to = account.email;
      await sendEmail(mail);
    }
  }

  if (!card.deliverAt) {
    await deliverCard({ ...card, plan: "paid", status: "scheduled", deliverAt: null });
  }

  return NextResponse.json({ received: true });
}
