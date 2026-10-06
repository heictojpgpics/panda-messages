import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { feedback } from "@/lib/db/schema";
import { isValidEmail, normalizeEmail } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message ?? "").trim();
    const email = body.email ? normalizeEmail(String(body.email)) : null;
    if (message.length < 3 || message.length > 2000) {
      return NextResponse.json({ error: "Write a few words (under 2000 characters)." }, { status: 400 });
    }
    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: "That email does not look right." }, { status: 400 });
    }
    const db = getDb();
    await db.insert(feedback).values({
      email,
      message,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("feedback failed", err);
    return NextResponse.json({ error: "Could not send that." }, { status: 500 });
  }
}
