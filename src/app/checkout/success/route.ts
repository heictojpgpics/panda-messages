import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCardById } from "@/lib/cards";

export const dynamic = "force-dynamic";

/**
 * Stripe redirects here on success. The webhook is the source of truth for
 * payment; we give it a moment so the user lands on a dashboard that
 * already shows their card as paid and scheduled.
 */
export async function GET(req: NextRequest) {
  const cardId = req.nextUrl.searchParams.get("card");
  if (!cardId) return NextResponse.redirect(new URL("/create", req.url));

  const first = await getCardById(cardId);
  if (!first) return NextResponse.redirect(new URL("/create", req.url));

  // The webhook usually lands in under a second. Poll politely.
  let card = first;
  for (let i = 0; i < 3 && card.plan !== "paid"; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const refreshed = await getCardById(cardId);
    if (refreshed) card = refreshed;
  }

  return NextResponse.redirect(
    new URL(`/dashboard?watch=${card.slug}&paid=1`, req.url)
  );
}
