import { NextRequest, NextResponse } from "next/server";
import { addReaction, getCardBySlug, getReactionsForCard } from "@/lib/cards";
import { REACTION_KINDS } from "@/data/signoffs";
import { newVisitorId } from "@/lib/ids";
import { clientIp, rateLimit } from "@/lib/ratelimit";

const KINDS = new Set(REACTION_KINDS.map((k) => k.id as string));

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const card = await getCardBySlug(slug);
    if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });

    const body = await req.json();
    const kind = String(body.kind ?? "");
    if (!KINDS.has(kind)) {
      return NextResponse.json({ error: "Unknown reaction." }, { status: 400 });
    }

    const verdict = await rateLimit(`react:${clientIp(req)}`, 60, 10 * 60 * 1000);
    if (!verdict.ok) {
      return NextResponse.json({ error: "Easy on the hearts, they are landing." }, { status: 429 });
    }

    // One visitor, one of each kind. The cookie is set on first open; if
    // it is somehow missing, mint one now and use it for real.
    let visitorId = req.cookies.get("pm_visitor")?.value;
    if (!visitorId) {
      visitorId = newVisitorId();
    }

    const fresh = await addReaction(card.id, kind, visitorId);
    const res = NextResponse.json({ ok: true, fresh });
    if (req.cookies.get("pm_visitor")?.value !== visitorId) {
      res.cookies.set("pm_visitor", visitorId, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }
    return res;
  } catch (err) {
    console.error("reaction failed", err);
    return NextResponse.json({ error: "Could not send that reaction." }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = await getCardBySlug(slug);
  if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });
  const counts = await getReactionsForCard(card.id);
  return NextResponse.json({ counts });
}
