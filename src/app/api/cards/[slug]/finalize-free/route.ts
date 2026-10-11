import { NextRequest, NextResponse } from "next/server";
/** Preview remains free. Publishing without checkout is intentionally closed. */
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: "Panda now sends every card through checkout. Your preview is still free." },
    { status: 410 }
  );
}
