import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cardOwnedBy, getCardBySlug, logEvent, updateCard } from "@/lib/cards";
import {
  dataUrlToPhotoBytes,
  getCardPhotoBucket,
  isStoredCardPhoto,
  newPhotoKey,
  parseCardPhotos,
  type CardPhotoValue,
  type StoredCardPhoto,
} from "@/lib/card-photos";

const MAX_PHOTOS = 5;
const MAX_BYTES = 260_000;

/** Move compressed browser photos into private R2 storage. R2 stays private:
 * the reveal page serves every image through its capability URL, never a
 * public bucket domain. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const card = await getCardBySlug(slug);
    if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });
    if (!["draft", "awaiting_payment", "scheduled"].includes(card.status)) {
      return NextResponse.json({ error: "This card has already left. Its photos are sealed." }, { status: 409 });
    }

    const body = await req.json();
    const user = await getCurrentUser();
    const owns = await cardOwnedBy(card, { user, editToken: body.editToken ? String(body.editToken) : null });
    if (!owns) return NextResponse.json({ error: "This card is not yours to edit." }, { status: 403 });

    const proposed = Array.isArray(body.photos) ? body.photos : [];
    if (proposed.length > MAX_PHOTOS) return NextResponse.json({ error: "Up to 5 photos fit inside a card." }, { status: 400 });

    const bucket = getCardPhotoBucket();
    if (!bucket) {
      return NextResponse.json({ error: "Private photo storage is not ready yet. Please try again shortly." }, { status: 503 });
    }

    const existing = parseCardPhotos(card.photos).filter(isStoredCardPhoto);
    const existingById = new Map(existing.map((photo) => [photo.id, photo]));
    const next: StoredCardPhoto[] = [];

    for (const photo of proposed as CardPhotoValue[]) {
      if (isStoredCardPhoto(photo)) {
        const owned = existingById.get(photo.id);
        if (!owned) return NextResponse.json({ error: "One of those photos is no longer part of this card." }, { status: 400 });
        next.push(owned);
        continue;
      }
      if (typeof photo !== "string") return NextResponse.json({ error: "One of those photos is not valid." }, { status: 400 });
      const { bytes, contentType } = dataUrlToPhotoBytes(photo);
      if (bytes.byteLength > MAX_BYTES) return NextResponse.json({ error: "One photo is too large after compression." }, { status: 413 });
      const id = crypto.randomUUID();
      const stored: StoredCardPhoto = { id, key: newPhotoKey(card.id, contentType), contentType };
      await bucket.put(stored.key, bytes, {
        httpMetadata: { contentType, cacheControl: "private, no-store" },
      });
      next.push(stored);
    }

    const keep = new Set(next.map((photo) => photo.id));
    const removed = existing.filter((photo) => !keep.has(photo.id));
    if (removed.length) await bucket.delete(removed.map((photo) => photo.key));

    await updateCard(card.id, { photos: next });
    await logEvent(card.id, "photos_saved", { count: next.length });
    return NextResponse.json({ photos: next });
  } catch (error) {
    console.error("photo upload failed", error);
    return NextResponse.json({ error: "Panda could not tuck those photos away. Try again?" }, { status: 500 });
  }
}
