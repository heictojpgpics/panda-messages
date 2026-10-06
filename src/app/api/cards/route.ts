import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isValidEmail } from "@/lib/auth";
import { createCard } from "@/lib/cards";

const MAX_MESSAGE = 300;
const MAX_SIGNOFF = 60;

export async function POST(req: NextRequest) {
  try {
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
    const replyToSlug = body.replyTo ? String(body.replyTo).trim() : null;

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
    if (photos && photos.length > 5) {
      return NextResponse.json({ error: "Up to 5 photos." }, { status: 400 });
    }
    if (photos && photos.some((p: string) => !p.startsWith("data:image/"))) {
      return NextResponse.json({ error: "Photos came through in a format we do not support." }, { status: 400 });
    }

    const user = await getCurrentUser();
    const card = await createCard(
      {
        senderName,
        recipientName,
        recipientEmail: null,
        occasion,
        message,
        signoff,
        theme,
        songId,
        songProvider,
        photos,
        replyToCardId: null,
      },
      user?.id ?? null
    );

    return NextResponse.json({ id: card.id, slug: card.slug, editToken: card.editToken });
  } catch (err) {
    console.error("create card failed", err);
    return NextResponse.json({ error: "Panda could not save that card. Try again?" }, { status: 500 });
  }
}
