import { NextResponse } from "next/server";
import { getAudiusTrending, PICKER_GENRES } from "@/lib/audius";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * This week's trending tracks, optionally scoped to one of the picker's
 * curated genres. Powers the picker's opening grid.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const genre = url.searchParams.get("genre");
  const limit = Number(url.searchParams.get("limit")) || 18;

  const verdict = await rateLimit(`audius-trending:${clientIp(req)}`, 30, 60_000);
  if (!verdict.ok) {
    return NextResponse.json(
      { error: "Too many requests. Give it a breath." },
      { status: 429, headers: { "Retry-After": String(verdict.retryAfterSec) } }
    );
  }

  try {
    const tracks = await getAudiusTrending(genre, { limit });
    return NextResponse.json({ tracks, genres: PICKER_GENRES });
  } catch {
    return NextResponse.json(
      { error: "The music library did not answer. Try again in a moment." },
      { status: 502 }
    );
  }
}
