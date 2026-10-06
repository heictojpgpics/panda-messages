"use client";

import { motion } from "framer-motion";
import { PandaMoodFace } from "@/components/brand/PandaMood";
import Link from "next/link";
import { Send } from "lucide-react";

const STEPS = [
  {
    n: 1,
    title: "Tell Panda who it's for",
    body: "Their name and your words. Panda has lovely ones ready if you get stuck, in every tone from poetic to ridiculous.",
    panda: "center",
  },
  {
    n: 2,
    title: "Watch their card appear",
    body: "Panda draws it as you type, with their name on the envelope. Free to make, always. The watching part is genuinely fun.",
    panda: "sparkle",
  },
  {
    n: 3,
    title: "Share it, or let Panda deliver it",
    body: "Send the link yourself, or have it land in their inbox on the exact morning you pick. Either way, they open an envelope.",
    panda: "delighted",
  },
];

export function HowItWorks() {
  return (
    <section className="relative bg-mist/60">
      <div className="absolute inset-0 bamboo-bg opacity-50" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <div className="text-center">
          <h2 className="font-display font-semibold text-ink text-[clamp(1.6rem,3.5vw,2.3rem)]">
            How it works
          </h2>
          <p className="mt-3 text-ink-soft">A minute, give or take. Start to sent.</p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.1, duration: 0.55 }}
              className="relative card-lift rounded-3xl bg-paper border border-ink/8 p-7 text-center flex flex-col items-center"
            >
              <span
                className="grid h-11 w-11 place-items-center rounded-full bg-jade-soft text-jade font-display font-bold text-lg ring-1 ring-jade/15"
                aria-hidden
              >
                {s.n}
              </span>
              <h3 className="mt-4 font-display font-semibold text-ink text-[17.5px]">{s.title}</h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-soft">{s.body}</p>
              <PandaMoodFace mood={s.panda as "center"} size={64} className="mt-5 float-soft" />
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/create"
            className="sheen inline-flex items-center gap-2 rounded-full bg-jade text-white font-semibold px-6 py-3.5 shadow-[0_14px_30px_-10px_rgba(21,122,85,0.6)] hover:bg-jade-deep transition-all active:scale-[0.99]"
          >
            <Send className="h-4 w-4" />
            Start a card
          </Link>
        </div>
      </div>
    </section>
  );
}
