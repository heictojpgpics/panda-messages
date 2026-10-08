import { siteUrl } from "@/lib/config";
import { SITE } from "@/lib/config";
import { emailPalette } from "./palette";
import { occasionVoice, occasionLabel, type ArtworkKey } from "./copy";
import {
  renderPandaEmail,
  escapeHtml,
  eyebrow,
  headline,
  paragraph,
  addressBlock,
  quoteCard,
  metaTable,
  type ShellOptions,
} from "./shell";
import type { OutgoingEmail } from "./provider";

/**
 * The five letters Panda sends. Each one is written for the person reading
 * it, not for the system sending it: the delivery builds anticipation, the
 * receipt calms a buyer's second thoughts, the notifications pay off the
 * wait. Plain text versions carry the same words for the plain text
 * readers, and the subject lines are written to be read next to a name.
 */

/** "the morning of October 12" style date, for the receipt. */
function friendlyDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function firstSentenceLower(label: string): string {
  return label.charAt(0).toLowerCase() + label.slice(1);
}

/* ------------------------------------------------------------------ */
/* 1. The delivery: the email that hands over the envelope            */
/* ------------------------------------------------------------------ */

export function cardDeliveryEmail(opts: {
  recipientName: string;
  senderName: string;
  cardUrl: string;
  occasionId?: string;
  customOccasion?: string | null;
  themeId?: string;
}): OutgoingEmail {
  const voice = occasionVoice(opts.occasionId, opts.customOccasion);
  const recipient = opts.recipientName.trim() || "you";
  const sender = opts.senderName.trim() || "someone";

  const subject = `${recipient}, a sealed envelope from ${sender}`;
  const preheader = "It takes one quiet minute, and it's yours alone.";
  const text = [
    `Hi ${recipient},`,
    ``,
    `${escapeOff(voice.body).replace("{sender}", sender)}`,
    ``,
    `Open your envelope: ${opts.cardUrl}`,
    ``,
    `No account is needed. It stays between you and ${sender}.`,
    ``,
    `Carried by ${SITE.name}`,
  ].join("\n");

  const html = renderPandaEmail({
    themeId: opts.themeId,
    art: voice.art,
    preheader,
    blocks: [
      addressBlock(recipient, sender, emailPalette(opts.themeId)),
      eyebrow(voice.eyebrow, emailPalette(opts.themeId)),
      headline(voice.headline, emailPalette(opts.themeId)),
      paragraph(
        escapeHtml(voice.body).replace(
          "{sender}",
          `<strong>${escapeHtml(sender)}</strong>`
        ),
        emailPalette(opts.themeId)
      ),
    ].join(""),
    cta: { href: opts.cardUrl, label: "Open the envelope" },
    micro: `No account needed. It stays between you and ${escapeHtml(sender)}.`,
    footerWhy: `${escapeHtml(sender)} sent this card with ${SITE.name}, where a card arrives like a gift, not a link.`,
  });

  return { to: "", subject, html, text, kind: "card" };
}

/* ------------------------------------------------------------------ */
/* 2. The receipt: proof and control, right after payment             */
/* ------------------------------------------------------------------ */

export function receiptEmail(opts: {
  buyerEmail: string;
  recipientName: string;
  dashboardUrl: string;
  refundNoteUrl: string;
  occasionId?: string;
  customOccasion?: string | null;
  themeId?: string;
  /** ISO date the card is scheduled to send, when a day was picked. */
  scheduledFor?: string | null;
}): OutgoingEmail {
  const p = emailPalette(opts.themeId);
  const recipient = opts.recipientName.trim() || "your recipient";
  const label = occasionLabel(opts.occasionId, opts.customOccasion);
  const when = opts.scheduledFor ? friendlyDate(opts.scheduledFor) : "";
  const sendLine = when
    ? `Panda will carry it to ${recipient} on ${when}.`
    : `Panda is carrying it to ${recipient} right away.`;

  const subject = `Your card for ${recipient} is in Panda's care`;
  const preheader = when ? `Panda will carry it on ${when}.` : "Sealed, safe, and on its way.";
  const text = [
    `Thank you.`,
    ``,
    `Your ${firstSentenceLower(label)} card for ${recipient} is sealed and in Panda's care. ${sendLine}`,
    ``,
    `Review or edit it any time: ${opts.dashboardUrl}`,
    ``,
    `Cancel before it sends and the ${SITE.cardPriceLabel} returns in full. Details: ${opts.refundNoteUrl}`,
    ``,
    `${SITE.name}`,
  ].join("\n");

  const html = renderPandaEmail({
    themeId: opts.themeId,
    art: occasionVoice(opts.occasionId, opts.customOccasion).art,
    preheader,
    blocks: [
      eyebrow(`${label} card`, p),
      headline("Your card is in Panda's care", p),
      paragraph(
        `It is sealed, scheduled, and safe. ${escapeHtml(sendLine)} You can change the words or the day any time before it leaves.`,
        p
      ),
      metaTable(
        [
          ["For", recipient],
          ["Occasion", label],
          ["Send date", when || "Right away"],
        ],
        p
      ),
    ].join(""),
    cta: { href: opts.dashboardUrl, label: "Open your dashboard" },
    micro: `Cancel before it sends and the ${SITE.cardPriceLabel} returns in full. <a href="${escapeHtml(opts.refundNoteUrl)}" style="color:${p.button};font-weight:700;text-decoration:underline;">Read the details</a>.`,
    footerWhy: `You made this card. It is safe with ${SITE.name} until the moment it sends.`,
  });

  return { to: opts.buyerEmail, subject, html, text, kind: "receipt" };
}

/* ------------------------------------------------------------------ */
/* 3. The claim: one password, cards in one place                     */
/* ------------------------------------------------------------------ */

export function claimEmail(opts: {
  email: string;
  claimUrl: string;
  cardUrl?: string;
  themeId?: string;
  occasionId?: string;
  customOccasion?: string | null;
}): OutgoingEmail {
  const p = emailPalette(opts.themeId);
  const text = [
    `Hello,`,
    ``,
    `Your ${SITE.name} account is ready. Set a password to keep your cards together and follow the moments they are opened.`,
    ``,
    `Set your password: ${opts.claimUrl}`,
    ``,
    `This link is valid for 48 hours.`,
    ``,
    `${SITE.name}`,
  ].join("\n");

  const html = renderPandaEmail({
    themeId: opts.themeId,
    preheader: "One password and your cards stay together.",
    blocks: [
      eyebrow("Your cards, together", p),
      headline("Your account is ready", p),
      paragraph(
        `Your cards are saved and waiting. Set a password and they stay together, under your name, with the moments they were opened.`,
        p
      ),
    ].join(""),
    cta: { href: opts.claimUrl, label: "Set your password" },
    micro: "For your security, this link is valid for 48 hours.",
    footerWhy: `You created this account when you sent a card with ${SITE.name}.`,
  });

  return { to: opts.email, subject: `Your ${SITE.name} account is ready`, html, text, kind: "claim" };
}

/* ------------------------------------------------------------------ */
/* 4. Owner notifications: the payoff moments                         */
/* ------------------------------------------------------------------ */

export function ownerNotificationEmail(opts: {
  email: string;
  recipientName: string;
  dashboardUrl: string;
  /** Direct link to the card page, when known. */
  cardUrl?: string;
  notification: "opened" | "replied" | "delivery_failed";
  replyAuthor?: string;
  replyText?: string;
  reason?: string;
  themeId?: string;
  occasionId?: string;
}): OutgoingEmail {
  const p = emailPalette(opts.themeId);
  const recipient = opts.recipientName.trim() || "your recipient";
  const voice = occasionVoice(opts.occasionId);
  const art: ArtworkKey | undefined = voice.art;
  const quiet = opts.notification === "delivery_failed" ? true : false;

  let subject: string;
  let preheader: string;
  let blocks: string;
  let cta: { href: string; label: string };
  let micro: string | undefined;
  let textBody: string;

  if (opts.notification === "opened") {
    subject = `${recipient} opened your card`;
    preheader = "The envelope is open. Your words are with them now.";
    blocks = [
      eyebrow("Your card was opened", p),
      headline("They opened it", p),
      paragraph(
        `${escapeHtml(recipient)} opened your envelope. Whatever you wrote is with them now. This is the moment you were waiting for.`,
        p
      ),
    ].join("");
    cta = { href: opts.dashboardUrl, label: "Open your dashboard" };
    textBody = `${recipient} opened your card. Your words are with them now.\n\nOpen your dashboard: ${opts.dashboardUrl}`;
  } else if (opts.notification === "replied") {
    const author = opts.replyAuthor?.trim() || recipient;
    subject = `${author} wrote back`;
    preheader = "You wrote a card. They wrote back.";
    const quote = opts.replyText?.trim()
      ? quoteCard(opts.replyText, author, p)
      : "";
    blocks = [
      eyebrow("A note came back", p),
      headline("They wrote back", p),
      paragraph(`${escapeHtml(author)} read your card and left a note on it.`, p),
      quote,
    ].join("");
    cta = {
      href: opts.cardUrl ?? opts.dashboardUrl,
      label: opts.cardUrl ? "Read the whole card" : "Open your dashboard",
    };
    textBody = `${author} wrote back to your card.${opts.replyText?.trim() ? `\n\n"${opts.replyText.trim().slice(0, 280)}"` : ""}\n\n${opts.cardUrl ? `Read the whole card: ${opts.cardUrl}` : `Open your dashboard: ${opts.dashboardUrl}`}`;
  } else {
    subject = `A card for ${recipient} needs a new address`;
    preheader = "The address did not work. The card is safe.";
    const detail = opts.reason ? ` The mail service said: ${escapeHtml(opts.reason.slice(0, 100))}` : "";
    blocks = [
      eyebrow("Delivery needs a hand", p),
      headline("The address needs one more look", p),
      paragraph(
        `The card for ${escapeHtml(recipient)} could not be delivered.${detail} Nothing is lost. Check the address and it goes out on the next try.`,
        p
      ),
    ].join("");
    cta = { href: opts.dashboardUrl, label: "Fix the address" };
    textBody = `The card for ${recipient} could not be delivered.${opts.reason ? ` (${opts.reason.slice(0, 100)})` : ""}\n\nCheck the address in your dashboard: ${opts.dashboardUrl}`;
  }

  const html = renderPandaEmail({
    themeId: opts.themeId,
    art: quiet ? undefined : art,
    preheader,
    blocks,
    cta,
    micro,
    footerWhy: `Updates about your own card, from ${SITE.name}.`,
  });

  return { to: opts.email, subject, html, text: textBody, kind: "notify" };
}

/** Plain text cannot carry HTML entities. */
function escapeOff(s: string): string {
  return s.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&#39;", "'");
}

export { siteUrl };
