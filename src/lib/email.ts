import { getDb } from "./db";
import { outbox } from "./db/schema";
import { desc, eq } from "drizzle-orm";
import { SITE } from "./config";

/**
 * Email provider. With RESEND_API_KEY set, mail goes out for real.
 * Without it, everything lands in the demo outbox, which the dashboard
 * renders exactly as it would have arrived.
 */

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  cardId?: string | null;
  kind?: "card" | "receipt" | "claim";
}

export interface SendResult {
  status: "sent" | "failed";
  provider: "resend" | "mock";
  ref: string | null;
  error?: string;
  /**
   * True when the provider definitively refused the send (bad address,
   * validation error). False when the outcome is unknown. Delivery uses
   * this to decide between retry and hold.
   */
  definitive?: boolean;
}

export function emailMode(): "resend" | "mock" {
  return process.env.RESEND_API_KEY ? "resend" : "mock";
}

async function resendSend(email: OutgoingEmail): Promise<{ id: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? `Panda <panda@${SITE.domain}>`,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`Resend ${res.status}: ${body.slice(0, 200)}`);
    // 4xx: our request was rejected outright. 5xx or unknown: unclear.
    (err as Error & { definitive?: boolean }).definitive = res.status >= 400 && res.status < 500;
    throw err;
  }
  const json = (await res.json()) as { id: string };
  return json;
}

/** Queue + send. In mock mode the outbox row itself is the delivery. */
export async function sendEmail(email: OutgoingEmail): Promise<SendResult> {
  const db = await getDb();
  const provider = emailMode();
  const now = new Date().toISOString();

  const [row] = await db
    .insert(outbox)
    .values({
      cardId: email.cardId ?? null,
      toEmail: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      kind: email.kind ?? "card",
      status: "queued",
      provider,
      createdAt: now,
    })
    .returning({ id: outbox.id });

  try {
    if (provider === "resend") {
      const sent = await resendSend(email);
      await db
        .update(outbox)
        .set({ status: "sent", providerRef: sent.id, sentAt: new Date().toISOString() })
        .where(eq(outbox.id, row.id));
      return { status: "sent", provider, ref: sent.id };
    }
    // Mock: mark sent instantly. The dashboard outbox shows the full email.
    await db
      .update(outbox)
      .set({ status: "sent", sentAt: new Date().toISOString() })
      .where(eq(outbox.id, row.id));
    return { status: "sent", provider: "mock", ref: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "send failed";
    const definitive = (err as Error & { definitive?: boolean }).definitive ?? false;
    await db.update(outbox).set({ status: "failed", error: message }).where(eq(outbox.id, row.id));
    return { status: "failed", provider, ref: null, error: message, definitive };
  }
}

/** Outbox rows for cards owned by the given user. Nobody else's mail. */
export async function listOutboxForUser(userCardIds: string[], limit = 40) {
  const db = await getDb();
  if (userCardIds.length === 0) return [];
  const { inArray } = await import("drizzle-orm");
  return db
    .select()
    .from(outbox)
    .where(inArray(outbox.cardId, userCardIds))
    .orderBy(desc(outbox.id))
    .limit(limit);
}

/** The "Panda has something for you" delivery email for a card. */
export function cardDeliveryEmail(opts: {
  recipientName: string;
  senderName: string;
  cardUrl: string;
  occasionLabel: string;
}): OutgoingEmail {
  const { recipientName, senderName, cardUrl, occasionLabel } = opts;
  const subject = `🐼 Panda has a little something for you, ${recipientName}`;
  const text = `Hi ${recipientName},\n\nPanda has arrived with a card for you. It is from ${senderName}, and it opens like a little gift.\n\nOpen it here: ${cardUrl}\n\n(No account needed. It is just for you.)\n\nWith love,\nPanda 💚`;
  const html = renderPandaEmail({
    title: `A card for ${escapeHtml(recipientName)}`,
    preheader: `Panda has arrived with something from ${senderName}.`,
    bodyHtml: `
      <p style="margin:0 0 14px;">Panda has padded all this way with a small envelope, and it is addressed to <strong>${escapeHtml(recipientName)}</strong>.</p>
      <p style="margin:0 0 14px;">It is ${escapeHtml(occasionLabel.toLowerCase()) === "just because" ? "a just-because card" : `a ${escapeHtml(occasionLabel).toLowerCase()} card`} from <strong>${escapeHtml(senderName)}</strong>, and it opens like a little gift. There might even be a song inside.</p>
      <p style="margin:0 0 24px;color:#64716A;font-size:14px;">No account needed. It is just for you.</p>
      <a href="${cardUrl}" style="display:inline-block;background:#157A55;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:600;font-size:15px;">Open my card</a>
    `,
    footerNote: "Sent with love via Panda Messages.",
  });
  return { to: "", subject, html, text, kind: "card" };
}

/** The receipt after a payment, so the buyer has proof and a way back in. */
export function receiptEmail(opts: {
  buyerEmail: string;
  recipientName: string;
  dashboardUrl: string;
  refundNoteUrl: string;
}): OutgoingEmail {
  const text = `Thank you. Your card for ${opts.recipientName} is in Panda's care.\n\nWatch it, edit it, or cancel it any time before it sends: ${opts.dashboardUrl}\n\nCancel before it sends and the $4.99 comes straight back, no questions. Details: ${opts.refundNoteUrl}\n\nWith love,\nPanda 💚`;
  const html = renderPandaEmail({
    title: "Your card is in Panda's care",
    preheader: `The card for ${opts.recipientName} is set. Here is your receipt.`,
    bodyHtml: `
      <p style="margin:0 0 14px;">Thank you. The card for <strong>${escapeHtml(opts.recipientName)}</strong> is sealed and scheduled.</p>
      <p style="margin:0 0 18px;">Watch the moment it gets opened, edit the words, or take it back entirely, any time before it sends.</p>
      <a href="${opts.dashboardUrl}" style="display:inline-block;background:#157A55;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:600;font-size:15px;">Open my dashboard</a>
      <p style="margin:18px 0 0;color:#64716A;font-size:13px;">Cancel before it sends and the $4.99 returns in full. <a href="${opts.refundNoteUrl}" style="color:#157A55;">The details are here.</a></p>
    `,
    footerNote: "Panda Messages",
  });
  return { to: opts.buyerEmail, subject: "Your receipt, and one card in Panda's care", html, text, kind: "receipt" };
}

export function claimEmail(opts: { email: string; claimUrl: string; cardUrl?: string }): OutgoingEmail {
  const text = `Hello,\n\nYour Panda Messages account is ready. Set a password so you can keep your cards and watch the moments they get opened.\n\nSet your password: ${opts.claimUrl}\n\nWith love,\nPanda 💚`;
  const html = renderPandaEmail({
    title: "Your account is ready",
    preheader: "Set a password to keep your cards in one place.",
    bodyHtml: `
      <p style="margin:0 0 14px;">Your cards are saved and waiting. Set a password so they stay yours.</p>
      <a href="${opts.claimUrl}" style="display:inline-block;background:#157A55;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:600;font-size:15px;">Set my password</a>
      <p style="margin:20px 0 0;color:#64716A;font-size:13px;">This link is good for 48 hours.</p>
    `,
    footerNote: "Panda Messages",
  });
  return { to: opts.email, subject: "Your Panda Messages account", html, text, kind: "claim" };
}

export function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderPandaEmail(opts: { title: string; preheader: string; bodyHtml: string; footerNote: string }): string {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#FBF9F4;">
  <div style="display:none;max-height:0;overflow:hidden;">${opts.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF9F4;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFDF7;border-radius:20px;border:1px solid #E4E0D4;overflow:hidden;">
        <tr><td style="padding:36px 40px 8px;text-align:center;">
          <img src="${SITE.url}/panda/d-center.png" width="72" alt="Panda" style="width:72px;height:auto;">
          <h1 style="font-family:Georgia,serif;font-size:22px;color:#16241C;margin:14px 0 0;">${opts.title}</h1>
        </td></tr>
        <tr><td style="padding:12px 40px 36px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#16241C;">
          ${opts.bodyHtml}
        </td></tr>
        <tr><td style="padding:18px 40px;background:#EEF3E9;border-top:1px solid #E4E0D4;">
          <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#64716A;text-align:center;">${opts.footerNote} · ${SITE.domain}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
