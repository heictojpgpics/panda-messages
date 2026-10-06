import Link from "next/link";
import { PandaMoodFace } from "@/components/brand/PandaMood";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ivory grid place-items-center px-4 text-center relative overflow-hidden">
      <div className="absolute inset-0 hero-forest grain" aria-hidden />
      <div className="relative flex flex-col items-center gap-5">
        <PandaMoodFace mood="dizzy" size={110} className="float-soft" />
        <h1 className="font-display font-semibold text-ink text-2xl">
          Panda looked everywhere for this page
        </h1>
        <p className="text-[14px] text-ink-soft max-w-sm leading-relaxed">
          It is not here. Maybe the link got nibbled. The rest of the site is perfectly intact,
          including the part where you make someone&rsquo;s day.
        </p>
        <div className="flex flex-wrap justify-center gap-2.5 mt-2">
          <Link
            href="/"
            className="rounded-full bg-jade text-white text-[14px] font-semibold px-6 py-3 shadow-[0_12px_26px_-10px_rgba(21,122,85,0.6)]"
          >
            Back home
          </Link>
          <Link
            href="/create"
            className="rounded-full border-2 border-ink/12 text-ink text-[14px] font-semibold px-6 py-3 hover:border-ink/30"
          >
            Make a card
          </Link>
        </div>
      </div>
    </div>
  );
}
