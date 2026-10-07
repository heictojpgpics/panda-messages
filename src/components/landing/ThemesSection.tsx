"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { THEMES } from "@/data/themes";
import { EnvelopeChip } from "@/components/brand/Envelope";
import { getTheme } from "@/data/themes";
import { MiniCard } from "@/components/brand/MiniCard";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function ThemesSection() {
  const [selected, setSelected] = useState("bamboo-grove");
  const theme = getTheme(selected);

  return (
    <section className="relative overflow-hidden bg-mist/60">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-jade">
            Choose the wrapping
          </p>
          <h2 className="mt-3 font-display font-semibold text-ink text-[clamp(1.6rem,3.5vw,2.3rem)]">
            Try a theme
          </h2>
          <p className="mt-3 text-ink-soft">Tap one. This is exactly what lands in their inbox.</p>
        </div>

        <div className="mt-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t.id)}
                  aria-pressed={selected === t.id}
                  className={cn(
                    "group card-lift rounded-2xl border-2 bg-paper p-3 flex flex-col items-center gap-2 transition-all",
                    selected === t.id
                      ? "border-jade shadow-[0_10px_28px_-12px_rgba(21,122,85,0.4)]"
                      : "border-transparent hover:border-ink/10"
                  )}
                >
                  <EnvelopeChip theme={t} size={62} className="group-hover:scale-105 transition-transform" />
                  <span className="text-[11.5px] font-medium text-ink/75 leading-tight text-center">
                    {t.name}
                  </span>
                  {selected === t.id && (
                    <motion.span
                      layoutId="theme-check"
                      className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-jade text-white"
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </motion.span>
                  )}
                </button>
              ))}
            </div>
            <p className="mt-4 text-center text-[12.5px] text-ink/55">
              <strong className="text-ink">{theme.name}.</strong> {theme.blurb}
            </p>
            <p className="mt-1 text-center text-[11.5px] text-ink/40">
              Bamboo Grove comes free. The other thirteen arrive with the full card.
            </p>
          </div>

          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 16, rotate: 1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-[300px]"
          >
            <MiniCard
              data={{
                occasion: "thinking-of-you",
                recipientName: "Sarah",
                senderName: "Sam",
                message: "Panda doesn't need a reason to think of you. You come up all the time, actually. This little card is just proof.",
                signoff: "with love, Panda 💚",
                theme: selected,
                watermark: false,
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
