import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCardBySlug, getCardById, updateCard, attachCardToUser } from "@/lib/cards";

/**
 * Update a card while it is still editable. A card belongs to its maker:
 * either the signed-in account or the edit token issued at creation.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const slug = String(body.slug ?? "").trim();
    const editToken = body.editToken ? String(body.editToken).trim() : null;
    if (!slug) return NextResponse.json({ error: "Which card?" }, { status: 400 });

    const card = await getCardBySlug(slug);
    if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });

    const user = await getCurrentUser();
    const ownsByUser = user && card.userId && card.userId === user.id;
    const ownsByToken = editToken && card.editToken === editToken;
    if (!ownsByUser && !ownsByToken) {
      return NextResponse.json({ error: "This card is not yours to edit." }, { status: 403 });
    }

    // Paid cards can only be edited before delivery.
    if (card.status !== "draft" && card.status !== "awaiting_payment") {
      return NextResponse.json(
        { error: "This card already left. Panda cannot change it mid-flight." },
        { status: 409 }
      );
    }

    const patch: Record<string, unknown> = {};
    if (body.message !== undefined) {
      const message = String(body.message).trim();
      if (!message || message.length > 300) {
        return NextResponse.json({ error: "Message needed, under 300 characters." }, { status: 400 });
      }
      patch.message = message;
    }
    if (body.signoff !== undefined) patch.signoff = String(body.signoff).trim().slice(0, 60);
    if (body.theme !== undefined && typeof body.theme === "string") patch.theme = body.theme;
    if (body.songId !== undefined) {
      patch.songId = body.songId ? String(body.songId).slice(0, 40) : null;
      patch.songProvider = body.songId ? "youtube" : null;
    }
    if (body.recipientEmail !== undefined) {
      const email = String(body.recipientEmail ?? "").trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        return NextResponse.json({ error: "That email does not look right." }, { status: 400 });
      }
      patch.recipientEmail = email || null;
    }
    if (body.photos !== undefined) {
      const photos = Array.isArray(body.photos)
        ? body.photos.filter((p: unknown) => typeof p === "string" && p.startsWith("data:image/"))
        : [];
      if (photos.length > 5) {
        return NextResponse.json({ error: "Up to 5 photos." }, { status: 400 });
      }
      patch.photos = photos;
    }

    if (Object.keys(patch).length > 0) {
      await updateCard(card.id, patch);
    }
    if (user && !card.userId) {
      await attachCardToUser(card.id, user.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("update card failed", err);
    return NextResponse.json({ error: "Could not save the change." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const id = req.nextUrl.searchParams.get("id");
  const editToken = req.nextUrl.searchParams.get("editToken");
  if (!slug && !id) return NextResponse.json({ error: "Which card?" }, { status: 400 });

  const card = slug ? await getCardBySlug(slug) : await getCardById(id!);
  if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });

  // Maker view: only with the right credentials.
  const user = await getCurrentUser();
  const ownsByUser = user && card.userId && card.userId === user.id;
  const ownsByToken = editToken && card.editToken === editToken;
  if (!ownsByUser && !ownsByToken) {
    return NextResponse.json({ error: "This card is not yours." }, { status: 403 });
  }

  return NextResponse.json({
    id: card.id,
    slug: card.slug,
    status: card.status,
    plan: card.plan,
    recipientEmail: card.recipientEmail,
    deliverAt: card.deliverAt,
    senderName: card.senderName,
    recipientName: card.recipientName,
    occasion: card.occasion,
    message: card.message,
    signoff: card.signoff,
    theme: card.theme,
    songId: card.songId,
    photos: card.photos ? JSON.parse(card.photos) : [],
  });
}
