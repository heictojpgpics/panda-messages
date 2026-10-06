import { NextRequest, NextResponse } from "next/server";
import {
  attachCardToUser,
  getCardById,
  logEvent,
  markPaid,
} from "@/lib/cards";
import {
  createPasswordClaim,
  createSession,
  createUser,
  findUserByEmail,
  getCurrentUser,
  isValidEmail,
  normalizeEmail,
} from "@/lib/auth";
import { sendEmail, claimEmail } from "@/lib/email";
import { deliverCard } from "@/lib/delivery";

/**
 * Complete the simulated checkout. Everything downstream of this moment is
 * exactly what happens with a real payment: the card goes premium, the
 * delivery is scheduled, the account is provisioned.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cardId = String(body.cardId ?? "");
    const buyerEmail = body.email ? normalizeEmail(String(body.email)) : "";

    const card = await getCardById(cardId);
    if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });
    if (card.plan === "paid") {
      return NextResponse.json({ ok: true, alreadyPaid: true, slug: card.slug });
    }
    if (!isValidEmail(buyerEmail)) {
      return NextResponse.json({ error: "Your email is needed for the receipt." }, { status: 400 });
    }
    if (card.status !== "draft" && card.status !== "awaiting_payment") {
      return NextResponse.json({ error: "This card already left." }, { status: 409 });
    }

    // The moment of payment.
    const ref = `mock_${Date.now().toString(36)}`;
    const deliverAt = card.deliverAt; // set during the send step
    await markPaid(card.id, {
      paymentRef: ref,
      provider: "mock",
      deliverAt,
      recipientEmail: card.recipientEmail,
    });

    // Attach to an account: existing session, existing email, or new one.
    let claimUrl: string | null = null;
    let accountEmail: string | null = null;
    const user = await getCurrentUser();
    if (user) {
      await attachCardToUser(card.id, user.id);
      accountEmail = user.email;
    } else {
      let account = await findUserByEmail(buyerEmail);
      if (!account) {
        account = await createUser(buyerEmail, null, card.senderName);
        const token = await createPasswordClaim(account.id);
        claimUrl = `/set-password?token=${token}`;
      }
      await attachCardToUser(card.id, account.id);
      accountEmail = account.email;
      // Sign the buyer straight in. They just paid; the watching begins now.
      await createSession(account.id);
      if (claimUrl) {
        const origin = req.nextUrl.origin;
        const mail = claimEmail({
          email: account.email,
          claimUrl: `${origin}${claimUrl}`,
        });
        mail.to = account.email;
        await sendEmail(mail);
      }
    }

    // Send right away when no day was picked.
    if (!deliverAt) {
      await deliverCard({ ...card, plan: "paid", status: "scheduled", recipientEmail: card.recipientEmail, deliverAt: null });
    }

    const fresh = await getCardById(card.id);
    return NextResponse.json({
      ok: true,
      slug: fresh.slug,
      status: fresh.status,
      deliverAt: fresh.deliverAt,
      claimUrl,
      accountEmail,
    });
  } catch (err) {
    console.error("mock checkout failed", err);
    return NextResponse.json({ error: "The checkout did not go through." }, { status: 500 });
  }
}
