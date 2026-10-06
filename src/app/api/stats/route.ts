import { NextResponse } from "next/server";
import { stats } from "@/lib/cards";
import { opportunisticTick } from "@/lib/delivery";

export const dynamic = "force-dynamic";

export async function GET() {
  // Landing views keep the delivery engine breathing between cron ticks.
  opportunisticTick().catch(() => {});
  const counts = await stats();
  return NextResponse.json(counts);
}
