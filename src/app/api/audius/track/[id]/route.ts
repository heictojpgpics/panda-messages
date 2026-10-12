import { NextResponse } from "next/server";
import { getAudiusTrack } from "@/lib/audius";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * Resolve one track: fresh metadata for a stored song, so the letter can
 * fall back to live data if a card predates a metadata snapshot.
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const verdict = await rateLimit(`audius-track:${clientIp(req)}`, 30, 60_000);
  if (!verdict.ok) {
    return NextResponse.json(
      { error: "Too many requests. Give it a breath." },
      { status: 429, headers: { "Retry-After": String(verdict.retryAfterSec) } }
    );
  }

  try {
    const track = await getAudiusTrack(id);
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }
    return NextResponse.json({ track });
  } catch {
    return NextResponse.json(
      { error: "The music library did not answer." },
      { status: 502 }
    );
  }
}
