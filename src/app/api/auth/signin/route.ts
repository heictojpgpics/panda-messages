import { NextRequest, NextResponse } from "next/server";
import { createSession, findUserByEmail, isValidEmail, normalizeEmail, verifyPassword } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  try {
    // Ten attempts per IP per ten minutes. Enough to mistype a password
    // a few times, not enough to brute force one.
    const verdict = await rateLimit(`signin:${clientIp(req)}`, 10, 10 * 60 * 1000);
    if (!verdict.ok) {
      return NextResponse.json(
        { error: "Too many tries just now. Give it a moment, then try again." },
        { status: 429, headers: { "Retry-After": String(verdict.retryAfterSec) } }
      );
    }

    const body = await req.json();
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");

    if (!isValidEmail(email) || !password) {
      return NextResponse.json({ error: "Email and password, please." }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    // One message for both wrong-password and no-account, so nobody can
    // map which emails exist here.
    const vague = "Panda looked everywhere and found no match for that email and password.";

    if (!user?.passwordHash) {
      return NextResponse.json({ error: vague }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: vague }, { status: 401 });
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true, email: user.email, name: user.name });
  } catch (err) {
    console.error("signin failed", err);
    return NextResponse.json({ error: "Could not sign you in just now." }, { status: 500 });
  }
}
