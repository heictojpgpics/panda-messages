import { NextRequest, NextResponse } from "next/server";
import { processDueDeliveries } from "@/lib/delivery";

export const dynamic = "force-dynamic";

/**
 * The delivery tick. Wire this to a Cloudflare Cron Trigger (or any
 * scheduler) every minute in production. Protect it with CRON_SECRET.
 * Idempotent, so calling it often is free.
 */
async function run(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided =
      req.headers.get("authorization")?.replace("Bearer ", "") ??
      req.nextUrl.searchParams.get("secret") ??
      "";
    if (provided !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  const result = await processDueDeliveries();
  return NextResponse.json({ ok: true, ...result, at: new Date().toISOString() });
}

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}
