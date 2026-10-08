import { getDb } from "./db";
import { outbox } from "./db/schema";
import { desc, eq } from "drizzle-orm";
import { SITE, siteUrl } from "./config";
import { getOccasion } from "@/data/occasions";
import { getTheme } from "@/data/themes";

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
  kind?: "card" | "receipt" | "claim" | "notify";
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

type EmailArtwork = "post" | "celebrate" | "love" | "moon";

const LOVE_OCCASIONS = new Set(["love-you", "sending-kiss", "i-miss-you", "sending-hug", "anniversary", "valentines", "forgive-me", "sorry"]);
const CELEBRATION_OCCASIONS = new Set(["birthday", "graduation", "congratulations", "proud-of-you", "new-baby", "new-home"]);
const MOON_OCCASIONS = new Set(["good-morning", "good-night", "long-distance", "christmas"]);

function artworkFor(occasionId?: string): EmailArtwork {
  if (occasionId && LOVE_OCCASIONS.has(occasionId)) return "love";
  if (occasionId && CELEBRATION_OCCASIONS.has(occasionId)) return "celebrate";
  if (occasionId && MOON_OCCASIONS.has(occasionId)) return "moon";
  return "post";
}

function emailArtwork(artwork: EmailArtwork) {
  const files: Record<EmailArtwork, string> = {
    post: "email-panda-post.png",
    celebrate: "email-panda-celebrate.png",
    love: "email-panda-love.png",
    moon: "email-panda-moon.png",
  };
  const alt: Record<EmailArtwork, string> = {
    post: "Panda carrying a sealed envelope",
    celebrate: "Panda holding a celebratory envelope",
    love: "Panda holding a rose and sealed envelope",
    moon: "Panda with a moonlit envelope",
  };
  return { src: `${siteUrl()}/panda/email/${files[artwork]}`, alt: alt[artwork] };
}

function emailPalette(themeId?: string) {
  const theme = getTheme(themeId ?? "bamboo-grove");
  return {
    name: theme.name,
    page: theme.colors.page,
    paper: theme.colors.paper,
    ink: "#1E2B23",
    muted: "#5D6A63",
    line: theme.colors.flap,
    accent: theme.colors.seal,
    wash: theme.colors.envelope,
  };
}

function cardMoment(occasionId?: string, customOccasion?: string) {
  const custom = customOccasion?.trim();
  if (custom) return custom;
  return getOccasion(occasionId ?? "")?.label ?? "Just because";
}

function emailButton(href: string, label: string, accent: string) {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td align="center" bgcolor="${accent}" style="border-radius:999px;">
<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${safeHref}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="50%" stroke="f" fillcolor="${accent}"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${safeLabel}</center></v:roundrect><![endif]-->
<!--[if !mso]><!--><a href="${safeHref}" style="background:${accent};border:1px solid ${accent};border-radius:999px;color:#ffffff;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;line-height:48px;text-align:center;text-decoration:none;width:220px;-webkit-text-size-adjust:none;">${safeLabel}</a><!--<![endif]-->
</td></tr></table>`;
}

/** The private card delivery. Themes change the paper palette and occasion changes the Panda portrait. */
export function cardDeliveryEmail(opts: {
  recipientName: string;
  senderName: string;
  cardUrl: string;
  occasionId?: string;
  customOccasion?: string | null;
  themeId?: string;
}): OutgoingEmail {
  const moment = cardMoment(opts.occasionId, opts.customOccasion ?? undefined);
  const subject = `${opts.senderName} sent you a Panda card`;
  const preheader = `A ${moment.toLowerCase()} envelope is waiting for ${opts.recipientName}.`;
  const text = `Hi ${opts.recipientName},\n\nA ${moment.toLowerCase()} card from ${opts.senderName} is waiting for you. Panda brought it in a sealed envelope, and it opens on a private page.\n\nOpen your card: ${opts.cardUrl}\n\nNo account is needed to view it.\n\nPanda Messages`;
  const html = renderPandaEmail({
    title: `An envelope for ${escapeHtml(opts.recipientName)}`,
    eyebrow: moment,
    preheader,
    artwork: artworkFor(opts.occasionId),
    themeId: opts.themeId,
    bodyHtml: `<p style="margin:0 0 14px;">A small ${escapeHtml(moment.toLowerCase())} envelope from <strong>${escapeHtml(opts.senderName)}</strong> has arrived for you.</p>
      <p style="margin:0 0 24px;">There is a proper card inside. Open it when you have a quiet moment.</p>
      ${emailButton(opts.cardUrl, "Open your card", emailPalette(opts.themeId).accent)}
      <p style="margin:22px 0 0;font-size:13px;line-height:20px;color:${emailPalette(opts.themeId).muted};">No account needed. This private link is the only way in.</p>`,
    footerNote: "A private card from Panda Messages",
  });
  return { to: "", subject, html, text, kind: "card" };
}

/** The receipt after a payment, so the buyer has proof and a way back in. */
export function receiptEmail(opts: {
  buyerEmail: string;
  recipientName: string;
  dashboardUrl: string;
  refundNoteUrl: string;
  occasionId?: string;
  customOccasion?: string | null;
  themeId?: string;
}): OutgoingEmail {
  const moment = cardMoment(opts.occasionId, opts.customOccasion ?? undefined);
  const text = `Thank you. Your ${moment.toLowerCase()} card for ${opts.recipientName} is in Panda's care.\n\nReview it, edit it, or cancel it before it sends: ${opts.dashboardUrl}\n\nCancel before it sends and the $4.99 returns in full. Details: ${opts.refundNoteUrl}\n\nPanda Messages`;
  const html = renderPandaEmail({
    title: "Your card is in Panda's care",
    eyebrow: moment,
    preheader: `The card for ${opts.recipientName} is sealed and scheduled.`,
    artwork: artworkFor(opts.occasionId),
    themeId: opts.themeId,
    bodyHtml: `<p style="margin:0 0 14px;">The card for <strong>${escapeHtml(opts.recipientName)}</strong> is sealed and scheduled.</p>
      <p style="margin:0 0 24px;">You can review the words, change the plan, or cancel before it leaves Panda's care.</p>
      ${emailButton(opts.dashboardUrl, "Open your dashboard", emailPalette(opts.themeId).accent)}
      <p style="margin:22px 0 0;font-size:13px;line-height:20px;color:${emailPalette(opts.themeId).muted};">Cancel before it sends and the $4.99 returns in full. <a href="${escapeHtml(opts.refundNoteUrl)}" style="color:${emailPalette(opts.themeId).accent};font-weight:700;">Read the details</a>.</p>`,
    footerNote: "Your Panda Messages receipt",
  });
  return { to: opts.buyerEmail, subject: "Your card is in Panda's care", html, text, kind: "receipt" };
}

export function claimEmail(opts: { email: string; claimUrl: string; cardUrl?: string; themeId?: string; occasionId?: string; customOccasion?: string | null }): OutgoingEmail {
  const text = `Hello,\n\nYour Panda Messages account is ready. Set a password to keep your cards together and follow the moments they are opened.\n\nSet your password: ${opts.claimUrl}\n\nThis link is valid for 48 hours.\n\nPanda Messages`;
  const html = renderPandaEmail({
    title: "Your account is ready",
    eyebrow: "Your cards, together",
    preheader: "Set a password to keep your cards in one place.",
    artwork: artworkFor(opts.occasionId),
    themeId: opts.themeId,
    bodyHtml: `<p style="margin:0 0 24px;">Your cards are saved and waiting. Set a password so they stay together, under your account.</p>
      ${emailButton(opts.claimUrl, "Set your password", emailPalette(opts.themeId).accent)}
      <p style="margin:22px 0 0;font-size:13px;line-height:20px;color:${emailPalette(opts.themeId).muted};">For your security, this link is valid for 48 hours.</p>`,
    footerNote: "Panda Messages",
  });
  return { to: opts.email, subject: "Your Panda Messages account is ready", html, text, kind: "claim" };
}

export function ownerNotificationEmail(opts: {
  email: string;
  recipientName: string;
  dashboardUrl: string;
  notification: "opened" | "replied" | "delivery_failed";
  replyAuthor?: string;
  replyText?: string;
  reason?: string;
  themeId?: string;
  occasionId?: string;
}): OutgoingEmail {
  const palette = emailPalette(opts.themeId);
  const recipient = escapeHtml(opts.recipientName);
  let subject: string;
  let title: string;
  let body: string;

  if (opts.notification === "opened") {
    subject = `${opts.recipientName} opened your Panda card`;
    title = "They opened it";
    body = `<p style="margin:0 0 24px;">${recipient} opened your card. Your words are with them now.</p>`;
  } else if (opts.notification === "replied") {
    const author = escapeHtml(opts.replyAuthor?.trim() || opts.recipientName);
    subject = `${opts.replyAuthor?.trim() || opts.recipientName} wrote back`;
    title = "A note came back";
    const quote = opts.replyText?.trim()
      ? `<blockquote style="margin:0 0 22px;padding:14px 16px;border-left:3px solid ${palette.accent};background:${palette.wash};font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:24px;color:${palette.ink};">${escapeHtml(opts.replyText.slice(0, 280))}</blockquote>`
      : "";
    body = `<p style="margin:0 0 14px;">${author} left a note on your card.</p>${quote}`;
  } else {
    subject = "A Panda card needs your attention";
    title = "A delivery needs a hand";
    const detail = opts.reason ? ` ${escapeHtml(opts.reason.slice(0, 120))}` : "";
    body = `<p style="margin:0 0 24px;">The card for ${recipient} could not be delivered.${detail} Check the address in your dashboard, then try again.</p>`;
  }

  const html = renderPandaEmail({
    title,
    eyebrow: opts.notification === "opened" ? "Your card was opened" : "Your card update",
    preheader: subject,
    artwork: artworkFor(opts.occasionId),
    themeId: opts.themeId,
    bodyHtml: `${body}${emailButton(opts.dashboardUrl, "Open your dashboard", palette.accent)}`,
    footerNote: "Updates for your own Panda card",
  });
  return {
    to: opts.email,
    subject,
    html,
    text: `${subject}\n\nOpen your dashboard: ${opts.dashboardUrl}`,
    kind: "notify",
  };
}

export function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderPandaEmail(opts: {
  title: string;
  eyebrow?: string;
  preheader: string;
  bodyHtml: string;
  footerNote: string;
  themeId?: string;
  artwork?: EmailArtwork;
}): string {
  const palette = emailPalette(opts.themeId);
  const art = emailArtwork(opts.artwork ?? "post");
  const title = opts.title;
  const eyebrow = opts.eyebrow ? escapeHtml(opts.eyebrow) : "Panda Messages";
  const preheader = escapeHtml(opts.preheader);

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style>
    @media screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .email-padding { padding-left: 24px !important; padding-right: 24px !important; }
      .email-hero { padding: 30px 24px 12px !important; }
      .email-art { width: 184px !important; }
      .email-title { font-size: 28px !important; line-height: 34px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${palette.page};">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${palette.page}" style="width:100%;background:${palette.page};border-collapse:collapse;">
    <tr><td align="center" style="padding:32px 16px 40px;">
      <!--[if mso]><table role="presentation" width="600" align="center" border="0" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
      <table role="presentation" class="email-shell" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${palette.paper};border:1px solid ${palette.line};border-radius:24px;border-collapse:separate;overflow:hidden;">
        <tr><td class="email-hero" align="center" bgcolor="${palette.wash}" style="padding:38px 40px 14px;background:${palette.wash};border-bottom:1px solid ${palette.line};">
          <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.6px;line-height:16px;text-transform:uppercase;color:${palette.accent};">${eyebrow}</p>
          <img class="email-art" src="${escapeHtml(art.src)}" width="220" alt="${escapeHtml(art.alt)}" border="0" style="display:block;width:220px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;">
        </td></tr>
        <tr><td class="email-padding" style="padding:28px 48px 34px;font-family:Arial,Helvetica,sans-serif;color:${palette.ink};">
          <h1 class="email-title" style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:700;letter-spacing:-0.35px;line-height:37px;text-align:center;color:${palette.ink};">${title}</h1>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:${palette.ink};">${opts.bodyHtml}</div>
        </td></tr>
        <tr><td class="email-padding" bgcolor="${palette.wash}" style="padding:20px 40px;background:${palette.wash};border-top:1px solid ${palette.line};">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;text-align:center;color:${palette.muted};">${escapeHtml(opts.footerNote)}<br><a href="${escapeHtml(siteUrl())}" style="color:${palette.muted};text-decoration:underline;">${escapeHtml(SITE.domain)}</a></p>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>`;
}
