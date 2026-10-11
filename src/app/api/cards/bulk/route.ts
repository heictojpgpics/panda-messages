import { NextRequest, NextResponse } from "next/server";
import { sameOrigin } from "@/lib/origin";
import { getCurrentUser, isValidEmail, normalizeEmail } from "@/lib/auth";
import { createCard } from "@/lib/cards";
import { guessNameFromEmail } from "@/lib/name-from-email";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { OCCASIONS } from "@/data/occasions";
import { getTheme } from "@/data/themes";
import { newId } from "@/lib/ids";

const MAX_MESSAGE = 300;
const MAX_SIGNOFF = 60;
const MAX_RECIPIENTS = 15;

/**
 * Bulk send: one card per pasted email, one shared batch. Every recipient
 * still gets their own envelope with their own name on it; that personal
 * touch is the whole point of sending cards this way instead of a group
 * email. The sender writes once, pays once (a pack), and Panda does the
 * rest.
 */
export async function POST(req: NextRequest) {
  // Cross-site guard: a POST from anywhere but this site is turned away
  // before it reaches any logic.
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: "Not from here." }, { status: 403 });
  }

  try {
    // Bulk is a heavier operation than a single card: tighter limit.
    const verdict = await rateLimit(`bulk:${clientIp(req)}`, 8, 60 * 60 * 1000);
    if (!verdict.ok) {
      return NextResponse.json(
        { error: "That is a few batches in one hour. Give Panda a moment." },
        { status: 429, headers: { "Retry-After": String(verdict.retryAfterSec) } }
      );
    }

    const body = await req.json();
    const base = body.base ?? {};
    const recipients = Array.isArray(body.recipients) ? body.recipients : [];

    const senderName = String(base.senderName ?? "").trim();
    const occasion = String(base.occasion ?? "just-because").trim();
    const message = String(base.message ?? "").trim();
    const signoff = String(base.signoff ?? "").trim();
    const theme = String(base.theme ?? "bamboo-grove").trim();
    const songId = base.songId ? String(base.songId).trim().slice(0, 40) : null;
    const songProvider = base.songId ? String(base.songProvider ?? "youtube") : null;
    const customOccasion = base.customOccasion ? String(base.customOccasion).trim().slice(0, 60) : null;
    const replyTo = base.replyTo ? String(base.replyTo).trim().slice(0, 20) : null;

    if (!senderName || senderName.length > 40) {
      return NextResponse.json({ error: "Your name is needed (max 40 characters)." }, { status: 400 });
    }
    if (!message || message.length > MAX_MESSAGE) {
      return NextResponse.json({ error: `A message is needed, under ${MAX_MESSAGE} characters.` }, { status: 400 });
    }
    if (signoff.length > MAX_SIGNOFF) {
      return NextResponse.json({ error: "Sign-off is a bit long." }, { status: 400 });
    }

    if (recipients.length < 2 || recipients.length > MAX_RECIPIENTS) {
      return NextResponse.json({ error: `Between 2 and ${MAX_RECIPIENTS} recipients for a batch.` }, { status: 400 });
    }

    // Normalize, validate, dedupe. Duplicates collapse silently: pasting a
    // list twice must not send the same person two envelopes.
    const seen = new Set<string>();
    const clean: { email: string; name: string }[] = [];
    for (const r of recipients) {
      const email = normalizeEmail(String(r?.email ?? ""));
      if (!isValidEmail(email)) {
        return NextResponse.json({ error: `${email || "One of those addresses"} does not look right.` }, { status: 400 });
      }
      if (seen.has(email)) continue;
      seen.add(email);
      const name = String(r?.name ?? "").trim().slice(0, 40) || guessNameFromEmail(email);
      if (!name) {
        return NextResponse.json(
          { error: `Panda could not guess a name for ${email}. Add one and try again.` },
          { status: 400 }
        );
      }
      clean.push({ email, name });
    }
    if (clean.length < 2 || clean.length > MAX_RECIPIENTS) {
      return NextResponse.json({ error: `Between 2 and ${MAX_RECIPIENTS} distinct recipients for a batch.` }, { status: 400 });
    }

    const user = await getCurrentUser();
    const batchId = newId();
    const made: { id: string; slug: string; editToken: string }[] = [];

    for (const r of clean) {
      const { card, editToken } = await createCard(
        {
          senderName,
          recipientName: r.name,
          recipientEmail: r.email,
          occasion: OCCASIONS.some((o) => o.id === occasion) ? occasion : "just-because",
          customOccasion,
          message,
          signoff,
          theme: getTheme(theme).id,
          songId,
          songProvider,
          photos: [],
          replyToCardId: null,
        },
        user?.id ?? null,
        batchId
      );
      made.push({ id: card.id, slug: card.slug, editToken });
    }

    return NextResponse.json({ batchId, cards: made, count: made.length });
  } catch (err) {
    console.error("bulk create failed", err);
    return NextResponse.json({ error: "Panda could not save that batch. Try again?" }, { status: 500 });
  }
}
