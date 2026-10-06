import { Suspense } from "react";
import type { Metadata } from "next";
import { Wizard } from "@/components/create/Wizard";

export const metadata: Metadata = {
  title: "Create a card",
  description:
    "Make a personal card in about a minute. Pick the occasion, add your words, choose a theme, and let Panda deliver it on the day you pick.",
};

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ivory grid place-items-center">
          <div className="flex flex-col items-center gap-4">
            <span className="h-10 w-10 rounded-full border-[3px] border-jade/30 border-t-jade animate-spin" />
            <p className="text-[13px] text-ink/50 font-medium">Waking Panda up...</p>
          </div>
        </div>
      }
    >
      <Wizard />
    </Suspense>
  );
}
