import { NextRequest, NextResponse } from "next/server";
import { addReaction, getCardBySlug, getReactionsForCard } from "@/lib/cards";
import { REACTION_KINDS } from "@/data/signoffs";

const KINDS = new Set(REACTION_KINDS.map((k) => k.id as string));
const MAX_PER_VISITOR = 30;

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

    const visitorId = req.cookies.get("pm_visitor")?.value ?? "anon";
    const res = NextResponse.json({ ok: true });
    if (visitorId === "anon") {
      res.cookies.set("pm_visitor", crypto.randomUUID(), {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }

    await addReaction(card.id, kind, visitorId);
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
