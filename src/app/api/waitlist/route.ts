import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { eq } from "drizzle-orm";
import { waitlist } from "@/lib/db/schema";
import { isValidEmail, normalizeEmail } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  try {
    const verdict = await rateLimit(`waitlist:${clientIp(req)}`, 5, 60 * 60 * 1000);
    if (!verdict.ok) {
      return NextResponse.json({ error: "Noted, loud and clear. Give it a minute." }, { status: 429 });
    }
    const body = await req.json();
    const email = normalizeEmail(String(body.email ?? ""));
    const source = String(body.source ?? "remember").slice(0, 40);
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "That email does not look right." }, { status: 400 });
    }
    const db = await getDb();
    // One row per email per source. Duplicates do not add urgency.
    const existing = await db.select({ id: waitlist.id }).from(waitlist).where(eq(waitlist.email, email)).limit(1);
    if (existing.length > 0) return NextResponse.json({ ok: true, already: true });
    await db.insert(waitlist).values({
      email,
      source,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("waitlist failed", err);
    return NextResponse.json({ error: "Could not add you just now." }, { status: 500 });
  }
}
