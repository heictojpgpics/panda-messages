import { NextRequest, NextResponse } from "next/server";
import { createSession, createUser, findUserByEmail, isValidEmail, normalizeEmail } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/ratelimit";

const MAX_PASSWORD = 200;

export async function POST(req: NextRequest) {
  try {
    // Five sign-ups per IP per hour is plenty for humans and sad for bots.
    const verdict = await rateLimit(`signup:${clientIp(req)}`, 5, 60 * 60 * 1000);
    if (!verdict.ok) {
      return NextResponse.json(
        { error: "A few too many from this address. Give it an hour." },
        { status: 429, headers: { "Retry-After": String(verdict.retryAfterSec) } }
      );
    }

    const body = await req.json();
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");
    const name = body.name ? String(body.name).trim().slice(0, 60) : null;

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "That email does not look right." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Passwords need at least 8 characters." }, { status: 400 });
    }
    if (password.length > MAX_PASSWORD) {
      return NextResponse.json({ error: "That password is a little too epic. 200 characters max." }, { status: 400 });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Sign in instead?" },
        { status: 409 }
      );
    }

    const user = await createUser(email, password, name ?? undefined);
    await createSession(user.id);
    return NextResponse.json({ ok: true, email: user.email, name: user.name });
  } catch (err) {
    console.error("signup failed", err);
    return NextResponse.json({ error: "Could not create the account. Try again?" }, { status: 500 });
  }
}
