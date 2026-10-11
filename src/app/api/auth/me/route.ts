import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserCredits } from "@/lib/cards";

export async function GET() {
  const user = await getCurrentUser();
  const credits = user ? await getUserCredits(user.id) : 0;
  return NextResponse.json({ user, credits });
}
