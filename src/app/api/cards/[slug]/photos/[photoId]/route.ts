import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cardOwnedBy, getCardBySlug } from "@/lib/cards";
import { getCardPhotoBucket, isStoredCardPhoto, parseCardPhotos } from "@/lib/card-photos";

/** A private image proxy. Objects have no public R2 URL and are only read
 * through a live card link, or by the authenticated maker while editing. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; photoId: string }> }
) {
  const { slug, photoId } = await params;
  const card = await getCardBySlug(slug);
  if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });

  const live = card.status === "sent" || card.status === "opened";
  const editToken = req.nextUrl.searchParams.get("editToken");
  const user = await getCurrentUser();
  const owns = await cardOwnedBy(card, { user, editToken });
  if (!live && !owns) return NextResponse.json({ error: "This photo is still sealed." }, { status: 403 });

  const photo = parseCardPhotos(card.photos).find((item) => isStoredCardPhoto(item) && item.id === photoId);
  if (!photo || !isStoredCardPhoto(photo)) return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  const bucket = getCardPhotoBucket();
  if (!bucket) return NextResponse.json({ error: "Photo storage is unavailable." }, { status: 503 });
  const object = await bucket.get(photo.key);
  if (!object) return NextResponse.json({ error: "Photo not found." }, { status: 404 });

  return new NextResponse(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? photo.contentType,
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
