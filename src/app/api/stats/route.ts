import { NextResponse } from "next/server";
import { stats } from "@/lib/cards";

export const dynamic = "force-dynamic";

export async function GET() {
  const counts = await stats();
  return NextResponse.json(counts);
}
