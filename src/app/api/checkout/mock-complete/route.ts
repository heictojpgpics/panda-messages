import { NextRequest, NextResponse } from "next/server";
import {
  attachCardToUser,
  getCardById,
  logEvent,
  markPaid,
  cardOwnedBy,
} from "@/lib/cards";
import {
  createPasswordClaim,
  createUser,
  findUserByEmail,
  getCurrentUser,
  isValidEmail,
  normalizeEmail,
} from "@/lib/auth";
import { sendEmail, claimEmail, receiptEmail } from "@/lib/email";
import { deliverCard, siteUrl } from "@/lib/delivery";
import { paymentMode } from "@/lib/payments";
import { SITE } from "@/lib/config";
import { clientIp, rateLimit } from "@/lib/ratelimit";

/**
 * Complete the simulated checkout. Everything downstream of this moment is
 * exactly what happens with a real payment: the card goes premium, the
 * delivery is scheduled, the account is provisioned.
 *
 * Guardrails:
 *  - Only exists when mock payments are the active mode. With Stripe keys
 *    configured this endpoint refuses to do anything, so nobody can mark
 *    a card paid without paying for it.
 *  - The caller must own the card (session or edit token).
 *  - An existing account is never signed into from here. Only a freshly
 *    created account gets a session; everyone else signs in the normal
 *    way, with a password.
 */
export async function POST(req: NextRequest) {
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

    const card = await getCardById(cardId);
    if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });

    const user = await getCurrentUser();
    const owns = await cardOwnedBy(card, { user, editToken });
    if (!owns) return NextResponse.json({ error: "This card is not yours." }, { status: 403 });

    if (!isValidEmail(buyerEmail)) {
      return NextResponse.json({ error: "Your email is needed for the receipt." }, { status: 400 });
    }
    if (card.status !== "draft" && card.status !== "awaiting_payment") {
      return NextResponse.json({ error: "This card already left." }, { status: 409 });
    }

    // The moment of payment. Idempotent: a double submit only pays once.
    const ref = `mock_${Date.now().toString(36)}`;
    const won = await markPaid(card.id, {
      paymentRef: ref,
      provider: "mock",
      deliverAt: card.deliverAt,
      recipientEmail: card.recipientEmail,
    });
    if (!won) {
      return NextResponse.json({ ok: true, alreadyPaid: true, slug: card.slug });
    }

    // Attach to an account: current session, or the buyer's email.
    let claimUrl: string | null = null;
    let accountEmail: string | null = null;
    let signedIn = Boolean(user);
    if (user) {
      await attachCardToUser(card.id, user.id);
      accountEmail = user.email;
    } else {
      let account = await findUserByEmail(buyerEmail);
      if (!account) {
        // Fresh account: provision it, sign straight in, email a claim
        // link so they can set a password.
        account = await createUser(buyerEmail, null, card.senderName);
        const token = await createPasswordClaim(account.id);
        claimUrl = `/set-password?token=${token}`;
        const origin = req.nextUrl.origin;
        const mail = claimEmail({ email: account.email, claimUrl: `${origin}${claimUrl}` });
        mail.to = account.email;
        await sendEmail(mail);
        // Intentionally not creating a session here either: the password
        // claim flow signs them in the moment they set a password.
      }
      await attachCardToUser(card.id, account.id);
      accountEmail = account.email;
    }

    // Receipt, same as a real payment would send.
    const receipt = receiptEmail({
      buyerEmail: accountEmail ?? buyerEmail,
      recipientName: card.recipientName,
      dashboardUrl: `${siteUrl()}/dashboard?watch=${card.slug}`,
      refundNoteUrl: `${siteUrl()}/refund-policy`,
    });
    receipt.to = accountEmail ?? buyerEmail;
    receipt.cardId = card.id;
    await sendEmail(receipt);

    // Send right away when no day was picked.
    if (!card.deliverAt) {
      await deliverCard(card.id);
    }

    const fresh = await getCardById(card.id);
    return NextResponse.json({
      ok: true,
      slug: fresh.slug,
      status: fresh.status,
      deliverAt: fresh.deliverAt,
      claimUrl,
      accountEmail,
      signedIn,
    });
  } catch (err) {
    console.error("mock checkout failed", err);
    return NextResponse.json({ error: "The checkout did not go through." }, { status: 500 });
  }
}
