import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { isValidEmail, normalizeEmail } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = normalizeEmail(String(body.email ?? ""));
    const source = String(body.source ?? "remember").slice(0, 40);
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "That email does not look right." }, { status: 400 });
    }
    const db = getDb();
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
