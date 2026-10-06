import { NextRequest, NextResponse } from "next/server";
import { getCardBySlug, recordView } from "@/lib/cards";
import { newVisitorId } from "@/lib/ids";

/** The moment the envelope opens. Fires the event the sender watches for. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = await getCardBySlug(slug);
  if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });

  // Unique visitor cookie so one person counts once.
  const res = NextResponse.json({ ok: true });
  let visitorId = req.cookies.get("pm_visitor")?.value;
  if (!visitorId) {
    visitorId = newVisitorId();
    res.cookies.set("pm_visitor", visitorId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  await recordView(card.id);
  return res;
}
