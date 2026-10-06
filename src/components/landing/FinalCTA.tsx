"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PandaMoodFace } from "@/components/brand/PandaMood";
import { Send } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 hero-forest" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-20 sm:py-28 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="float-soft">
            <PandaMoodFace mood="heart" size={130} />
          </div>
          <h2 className="mt-6 font-display font-semibold text-ink text-balance text-[clamp(1.8rem,4vw,2.6rem)] leading-[1.12]">
            There&rsquo;s a day coming up, isn&rsquo;t there?
          </h2>
          <p className="mt-4 text-ink-soft text-[15.5px]">
            Set it up now. Panda takes care of the rest, right down to the morning.
          </p>
          <Link
            href="/create"
            className="sheen mt-8 inline-flex items-center gap-2 rounded-full bg-jade text-white font-semibold px-8 py-4 text-[16px] shadow-[0_18px_40px_-12px_rgba(21,122,85,0.7)] hover:bg-jade-deep transition-all active:scale-[0.98]"
          >
            <Send className="h-4.5 w-4.5" />
            Send a Panda card
          </Link>
          <p className="mt-3.5 text-[12.5px] text-ink/45">
            Free to make · about a minute · they will tell people about it
          </p>
        </motion.div>
      </div>
    </section>
  );
}
