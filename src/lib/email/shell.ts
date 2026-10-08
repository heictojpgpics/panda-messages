import { siteUrl } from "@/lib/config";
import { SITE } from "@/lib/config";
import { emailPalette, shade, type EmailPalette } from "./palette";
import { emailArtwork, emailSeal } from "./artwork";
import type { ArtworkKey } from "./copy";

/**
 * The mail piece.
 *
 * An email from Panda is not a notification. It is a physical object that
 * arrived: a postal band like the back of an envelope, the carrier holding
 * the sealed card, an address block, and a wax seal over the fold. Every
 * rule here exists because some email client breaks without it: tables for
 * structure, inline styles for paint, VML for Outlook buttons, explicit
 * colors so dark mode cannot rewrite the palette.
 */

export function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const SANS = "Arial,Helvetica,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

/** The postmark date line, like "OCT 12". */
function postmarkLine(date?: Date): string {
  const d = date ?? new Date();
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export interface CtaSpec {
  href: string;
  label: string;
}

export interface ShellOptions {
  themeId?: string;
  art?: ArtworkKey;
  preheader: string;
  /** Built blocks from this module: address, copy, quote. */
  blocks: string;
  cta?: CtaSpec;
  /** Small line under the button. */
  micro?: string;
  /** The footer "why am I getting this" sentence. */
  footerWhy: string;
  /** Override the postmark date (tests). */
  date?: Date;
}

/* ---------- building blocks, each a table row of the card ---------- */

export function eyebrow(text: string, p: EmailPalette): string {
  return `<p class="pm-eyebrow" style="margin:0 0 10px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:2.2px;line-height:16px;text-transform:uppercase;color:${p.button};">${escapeHtml(text)}</p>`;
}

export function headline(text: string, p: EmailPalette): string {
  return `<h1 class="pm-headline" style="margin:0 0 15px;font-family:${SERIF};font-size:30px;font-weight:700;letter-spacing:-0.45px;line-height:38px;color:${p.heading};">${escapeHtml(text)}</h1>`;
}

export function paragraph(html: string, p: EmailPalette): string {
  return `<p style="margin:0 0 14px;font-family:${SANS};font-size:16px;line-height:26px;color:${p.ink};">${html}</p>`;
}

/** The address face, like the front of the envelope on the card page. */
export function addressBlock(recipientName: string, senderName: string, p: EmailPalette): string {
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border-collapse:collapse;">
  <tr><td style="padding:0 0 4px;font-family:${SANS};font-size:10.5px;font-weight:700;letter-spacing:2px;line-height:14px;text-transform:uppercase;color:${p.muted};">to</td></tr>
  <tr><td class="pm-name" style="padding:0 0 9px;font-family:${SERIF};font-style:italic;font-size:29px;line-height:36px;color:${p.heading};word-break:break-word;">${escapeHtml(recipientName)}</td></tr>
  <tr><td style="padding:0 0 8px;font-size:0;line-height:0;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>
      <td width="52" height="2" bgcolor="${p.line}" style="width:52px;height:2px;font-size:0;line-height:0;">&nbsp;</td>
      <td width="26" height="2" bgcolor="${p.paper}" style="width:26px;height:2px;font-size:0;line-height:0;">&nbsp;</td>
      <td width="18" height="2" bgcolor="${p.line}" style="width:18px;height:2px;font-size:0;line-height:0;">&nbsp;</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:0;font-family:${SANS};font-size:13px;line-height:19px;color:${p.muted};">from ${escapeHtml(senderName)}</td></tr>
</table>`;
}

/** A reply quoted on paper, for the note-back email. */
export function quoteCard(text: string, author: string, p: EmailPalette): string {
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" class="pm-quote" style="margin:4px 0 22px;width:100%;border-collapse:separate;background:#FFFFFF;border:1px solid ${p.line};border-radius:12px;">
  <tr><td style="padding:20px 22px 16px;">
    <p style="margin:0 0 12px;font-family:${SERIF};font-style:italic;font-size:17px;line-height:27px;color:${p.heading};word-break:break-word;">${escapeHtml(text.slice(0, 400))}</p>
    <p style="margin:0;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:1.8px;line-height:15px;text-transform:uppercase;color:${p.muted};">${escapeHtml(author)}</p>
  </td></tr>
</table>`;
}

/** Small key-value rows, for receipts. */
export function metaTable(rows: Array<[string, string]>, p: EmailPalette): string {
  const tr = rows
    .map(
      ([k, v]) => `<tr>
  <td width="38%" style="padding:7px 0;font-family:${SANS};font-size:13px;line-height:19px;color:${p.muted};">${escapeHtml(k)}</td>
  <td style="padding:7px 0;font-family:${SANS};font-size:13.5px;font-weight:700;line-height:19px;color:${p.ink};word-break:break-word;">${escapeHtml(v)}</td>
</tr>`
    )
    .join("");
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:2px 0 24px;width:100%;border-collapse:collapse;border-top:1px solid ${p.line};border-bottom:1px solid ${p.line};">${tr}</table>`;
}

/** The theme's wax seal between the words and the button. */
function sealDivider(themeId: string | undefined, p: EmailPalette): string {
  const seal = emailSeal(themeId);
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" class="pm-seal" style="margin:2px auto 18px;border-collapse:collapse;">
  <tr>
    <td width="86" style="width:86px;border-top:1px dashed ${p.line};font-size:0;line-height:0;">&nbsp;</td>
    <td width="72" style="width:72px;">
      <img src="${escapeHtml(seal.src)}" width="64" height="64" alt="${escapeHtml(seal.alt)}" border="0" style="display:block;width:64px;height:64px;max-width:64px;margin:0 auto;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;">
    </td>
    <td width="86" style="width:86px;border-top:1px dashed ${p.line};font-size:0;line-height:0;">&nbsp;</td>
  </tr>
</table>`;
}

/** A bulletproof button: VML for Outlook, a padded anchor for everyone else. */
function button(cta: CtaSpec, p: EmailPalette): string {
  const href = escapeHtml(cta.href);
  const label = escapeHtml(cta.label);
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" class="pm-btn" style="margin:0 auto;border-collapse:separate;">
  <tr><td align="center" bgcolor="${p.button}" style="border-radius:999px;">
    <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:52px;v-text-anchor:middle;width:264px;" arcsize="50%" stroke="f" fillcolor="${p.button}"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${label}</center></v:roundrect><![endif]-->
    <!--[if !mso]><!--><a class="pm-btn-a" href="${href}" style="background:${p.button};background-image:linear-gradient(180deg,${shade(p.button, 0.14)},${p.button});border-radius:999px;color:#ffffff;display:inline-block;font-family:${SANS};font-size:16px;font-weight:700;line-height:52px;text-align:center;text-decoration:none;width:264px;-webkit-text-size-adjust:none;box-shadow:0 6px 14px -6px rgba(22,36,28,0.45);">${label}</a><!--<![endif]-->
  </td></tr>
</table>`;
}

/* ---------- the shell ---------- */

export function renderPandaEmail(opts: ShellOptions): string {
  const p = emailPalette(opts.themeId);
  const art = opts.art ? emailArtwork(opts.art) : null;
  const preheader = escapeHtml(opts.preheader);
  const date = postmarkLine(opts.date);

  const heroRow = art
    ? `<tr><td class="pm-hero" align="center" bgcolor="${p.wash}" style="padding:28px 0 14px;background:${p.wash};">
      <img class="pm-art" src="${escapeHtml(art.src)}" width="228" alt="${escapeHtml(art.alt)}" border="0" style="display:block;width:228px;max-width:100%;height:auto;margin:0 auto;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;">
    </td></tr>
    <tr><td style="padding:0;font-size:0;line-height:0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;"><tr><td style="border-top:1px dashed ${p.line};font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>`
    : "";

  const sealRow = opts.cta ? sealDivider(opts.themeId, p) : "";
  const ctaRow = opts.cta ? button(opts.cta, p) : "";
  const microRow = opts.micro
    ? `<p class="pm-micro" style="margin:16px 0 0;font-family:${SANS};font-size:13px;line-height:20px;text-align:center;color:${p.muted};">${opts.micro}</p>`
    : "";

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(SITE.name)}</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style>
    :root { color-scheme: light; supported-color-schemes: light; }
    body { margin:0; padding:0; }
    table { border-collapse:collapse; }
    img { -ms-interpolation-mode:bicubic; }
    @media screen and (max-width:620px) {
      .pm-outer { padding:14px 10px !important; }
      .pm-card { width:100% !important; border-radius:14px !important; }
      .pm-band { padding:14px 18px !important; }
      .pm-hero { padding:24px 0 12px !important; }
      .pm-art { width:208px !important; }
      .pm-body { padding:26px 22px 30px !important; }
      .pm-name { font-size:25px !important; line-height:32px !important; }
      .pm-headline { font-size:25px !important; line-height:33px !important; }
      .pm-quote td { padding:16px 16px 13px !important; }
      .pm-btn, .pm-btn-a { width:100% !important; }
      .pm-footer { padding:20px 22px 24px !important; }
    }
    @media (prefers-color-scheme: dark) {
      .pm-keep { color: inherit; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${p.page};">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${p.page}" style="width:100%;background:${p.page};border-collapse:collapse;">
    <tr><td align="center" class="pm-outer" style="padding:28px 14px 36px;">
      <!--[if mso]><table role="presentation" width="600" align="center" border="0" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
      <table role="presentation" class="pm-card" width="600" border="0" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:${p.paper};border:1px solid ${p.line};border-radius:16px;border-collapse:separate;overflow:hidden;">

        <!-- postal band: the flap side of the envelope -->
        <tr><td class="pm-band" bgcolor="${p.band}" style="padding:16px 26px;background:${p.band};border-bottom:2px solid ${shade(p.band, -0.18)};">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
            <tr>
              <td align="left" style="font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:2.6px;line-height:16px;color:${p.bandText};white-space:nowrap;">PANDA POST</td>
              <td align="right" style="font-family:${SANS};font-size:0;line-height:0;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr><td style="padding:3px 9px;border:1px solid ${p.postmark};border-radius:4px;">
                    <span style="font-family:${SANS};font-size:9px;font-weight:700;letter-spacing:1.6px;line-height:12px;color:${p.postmark};">FIRST CLASS<br>${date}</span>
                  </td></tr>
                </table>
              </td>
            </tr>
          </table>
        </td></tr>

        ${heroRow}

        <!-- the letter -->
        <tr><td class="pm-body" bgcolor="${p.paper}" style="padding:32px 46px 36px;background:${p.paper};font-family:${SANS};color:${p.ink};">
          ${opts.blocks}
          ${sealRow}
          ${ctaRow}
          ${microRow}
        </td></tr>

        <!-- footer -->
        <tr><td class="pm-footer" bgcolor="${p.wash}" style="padding:22px 40px 26px;background:${p.wash};border-top:1px solid ${p.line};">
          <p style="margin:0 0 6px;font-family:${SANS};font-size:10.5px;font-weight:700;letter-spacing:2px;line-height:15px;text-align:center;text-transform:uppercase;color:${p.footer};">Carried by Panda Messages</p>
          <p style="margin:0 0 10px;font-family:${SANS};font-size:12px;line-height:19px;text-align:center;color:${p.footer};">${escapeHtml(opts.footerWhy)}</p>
          <p style="margin:0;font-family:${SANS};font-size:11px;line-height:17px;text-align:center;color:${p.footer};">
            <a href="${escapeHtml(siteUrl())}" style="color:${p.footer};text-decoration:underline;">${escapeHtml(SITE.domain)}</a>
            &nbsp;&middot;&nbsp;
            <a href="mailto:${escapeHtml(SITE.supportEmail)}" style="color:${p.footer};text-decoration:underline;">${escapeHtml(SITE.supportEmail)}</a>
            &nbsp;&middot;&nbsp;
            <a href="${escapeHtml(siteUrl())}/privacy" style="color:${p.footer};text-decoration:underline;">Privacy</a>
          </p>
        </td></tr>

      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>`;
}
