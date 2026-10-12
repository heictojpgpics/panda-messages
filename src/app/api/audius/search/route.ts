import { NextResponse } from "next/server";
import { searchAudiusTracks } from "@/lib/audius";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * Song search for the card wizard. Public and cached server-side, but
 * rate-limited so a runaway client cannot push us toward Audius limits.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").slice(0, 80);
  const limit = Number(url.searchParams.get("limit")) || 24;
  const offset = Number(url.searchParams.get("offset")) || 0;

  if (q.trim().length < 2) {
    return NextResponse.json({ tracks: [] });
  }

  const verdict = await rateLimit(`audius-search:${clientIp(req)}`, 60, 60_000);
  if (!verdict.ok) {
    return NextResponse.json(
      { error: "Too many searches. Give it a breath." },
      { status: 429, headers: { "Retry-After": String(verdict.retryAfterSec) } }
    );
  }

  try {
    const tracks = await searchAudiusTracks(q, { limit, offset });
    return NextResponse.json({ tracks });
  } catch {
    return NextResponse.json(
      { error: "The music library did not answer. Try again in a moment." },
      { status: 502 }
    );
  }
}
