import { NextRequest, NextResponse } from "next/server";
import { createSession, findUserByEmail, isValidEmail, normalizeEmail, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");

    if (!isValidEmail(email) || !password) {
      return NextResponse.json({ error: "Email and password, please." }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: "Panda looked everywhere and found no matching account." },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "That password does not match. Try again?" }, { status: 401 });
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true, email: user.email, name: user.name });
  } catch (err) {
    console.error("signin failed", err);
    return NextResponse.json({ error: "Could not sign you in just now." }, { status: 500 });
  }
}
