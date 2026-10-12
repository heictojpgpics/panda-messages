import { NextResponse } from "next/server";
import { getAudiusLucky } from "@/lib/audius";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * "Surprise me": a shuffled slice of the network's feeling-lucky pool.
 * One request per tap, kept cheap.
 */
export async function GET(req: Request) {
  const verdict = await rateLimit(`audius-lucky:${clientIp(req)}`, 20, 60_000);
  if (!verdict.ok) {
    return NextResponse.json(
      { error: "Too many shuffles. Give it a breath." },
      { status: 429, headers: { "Retry-After": String(verdict.retryAfterSec) } }
    );
  }

  try {
    const tracks = await getAudiusLucky();
    return NextResponse.json({ tracks });
  } catch {
    return NextResponse.json(
      { error: "Panda could not reach the crate of records. Try again in a moment." },
      { status: 502 }
    );
  }
}
