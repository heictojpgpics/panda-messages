import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createCard, getCardBySlug } from "@/lib/cards";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { OCCASIONS } from "@/data/occasions";
import { getTheme } from "@/data/themes";

const MAX_MESSAGE = 300;
const MAX_SIGNOFF = 60;
const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 260_000; // ~200KB of image, base64 overhead included
const MAX_BODY_BYTES = 1_600_000; // 5 photos plus change, hard ceiling

export async function POST(req: NextRequest) {
  try {
    // Card spam guard: 20 cards per IP per hour.
    const verdict = await rateLimit(`card:${clientIp(req)}`, 20, 60 * 60 * 1000);
    if (!verdict.ok) {
      return NextResponse.json(
        { error: "That is a lot of cards in one hour. Give Panda a moment." },
        { status: 429, headers: { "Retry-After": String(verdict.retryAfterSec) } }
      );
    }

    const body = await req.json();
    const senderName = String(body.senderName ?? "").trim();
    const recipientName = String(body.recipientName ?? "").trim();
    const occasion = String(body.occasion ?? "just-because").trim();
    const message = String(body.message ?? "").trim();
    const signoff = String(body.signoff ?? "").trim();
    const theme = String(body.theme ?? "bamboo-grove").trim();
    const songId = body.songId ? String(body.songId).trim().slice(0, 40) : null;
    const songProvider = body.songId ? String(body.songProvider ?? "youtube") : null;
    const photos = Array.isArray(body.photos) ? body.photos.filter((p: unknown) => typeof p === "string") : null;
    const replyTo = body.replyTo ? String(body.replyTo).trim().slice(0, 20) : null;

    if (!senderName || senderName.length > 40) {
      return NextResponse.json({ error: "Your name is needed (max 40 characters)." }, { status: 400 });
    }
    if (!recipientName || recipientName.length > 40) {
      return NextResponse.json({ error: "Their name is needed (max 40 characters)." }, { status: 400 });
    }
    if (!message || message.length > MAX_MESSAGE) {
      return NextResponse.json({ error: `A message is needed, under ${MAX_MESSAGE} characters.` }, { status: 400 });
    }
    if (signoff.length > MAX_SIGNOFF) {
      return NextResponse.json({ error: "Sign-off is a bit long." }, { status: 400 });
    }
    if (photos && photos.length > MAX_PHOTOS) {
      return NextResponse.json({ error: "Up to 5 photos." }, { status: 400 });
    }
    if (photos) {
      let total = 0;
      for (const p of photos) {
        if (!p.startsWith("data:image/")) {
          return NextResponse.json({ error: "Photos came through in a format we do not support." }, { status: 400 });
        }
        // data URLs are ~4/3 the raw bytes.
        total += Math.round(p.length * 0.75);
        if (total > MAX_BODY_BYTES) {
          return NextResponse.json({ error: "Those photos are too heavy together. Fewer, or smaller ones." }, { status: 413 });
        }
        if (Math.round(p.length * 0.75) > MAX_PHOTO_BYTES) {
          return NextResponse.json({ error: "One of those photos is too large." }, { status: 413 });
        }
      }
    }

    const user = await getCurrentUser();
    // A reply card links back to the card it answers, by slug from the
    // query, resolved to the id the schema keeps.
    let replyToCardId: string | null = null;
    if (replyTo) {
      const parent = await getCardBySlug(replyTo);
      replyToCardId = parent?.id ?? null;
    }
    const { card, editToken } = await createCard(
      {
        senderName,
        recipientName,
        recipientEmail: null,
        occasion: OCCASIONS.some((o) => o.id === occasion) ? occasion : "just-because",
        message,
        signoff,
        theme: getTheme(theme).id,
        songId,
        songProvider,
        photos,
        replyToCardId,
      },
      user?.id ?? null
    );

    return NextResponse.json({ id: card.id, slug: card.slug, editToken });
  } catch (err) {
    console.error("create card failed", err);
    return NextResponse.json({ error: "Panda could not save that card. Try again?" }, { status: 500 });
  }
}
