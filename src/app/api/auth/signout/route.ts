import { NextRequest, NextResponse } from "next/server";
import { sameOrigin } from "@/lib/origin";
import { destroySession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Cross-site guard: a POST from anywhere but this site is turned away
  // before it reaches any logic.
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: "Not from here." }, { status: 403 });
  }

  await destroySession();
  return NextResponse.json({ ok: true });
}
