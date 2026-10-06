import { NextRequest, NextResponse } from "next/server";
import {
  consumePasswordClaim,
  createSession,
  setPassword,
} from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  try {
    const verdict = await rateLimit(`setpw:${clientIp(req)}`, 10, 60 * 60 * 1000);
    if (!verdict.ok) {
      return NextResponse.json({ error: "Too many tries just now." }, { status: 429 });
    }
    const body = await req.json();
    const token = String(body.token ?? "").slice(0, 200);
    const password = String(body.password ?? "");
    if (!token || password.length < 8 || password.length > 200) {
      return NextResponse.json(
        { error: "A valid link and a password of 8+ characters, please." },
        { status: 400 }
      );
    }
    const user = await consumePasswordClaim(token);
    if (!user) {
      return NextResponse.json(
        { error: "This link has expired or was already used. Reset from sign-in." },
        { status: 400 }
      );
    }
    await setPassword(user.id, password);
    await createSession(user.id);
    return NextResponse.json({ ok: true, email: user.email });
  } catch (err) {
    console.error("set password failed", err);
    return NextResponse.json({ error: "Could not set the password." }, { status: 500 });
  }
}
