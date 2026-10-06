"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PandaMoodFace } from "@/components/brand/PandaMood";
import { cn } from "@/lib/utils";

/**
 * The differentiator section: you watch the exact moment your card is
 * opened. A simulated live timeline, because the real thing is on the
 * dashboard of whoever has a card in flight.
 */

type Phase = "scheduled" | "delivered" | "opened";

const STEPS: { id: Phase; label: string; detail: string; emoji: string }[] = [
  { id: "scheduled", label: "Scheduled", detail: "Panda sets out on the morning you picked", emoji: "🗓️" },
  { id: "delivered", label: "Delivered", detail: "It lands in their inbox, waiting", emoji: "📬" },
  { id: "opened", label: "Opened", detail: "They tap. The seal cracks. You know instantly", emoji: "💌" },
];

export function LiveWatch() {
  const [phase, setPhase] = useState<Phase>("scheduled");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("delivered"), 1800);
    const t2 = setTimeout(() => setPhase("opened"), 3400);
    const reset = setInterval(() => {
      setPhase("scheduled");
      setTimeout(() => setPhase("delivered"), 1800);
      setTimeout(() => setPhase("opened"), 3400);
    }, 8000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(reset);
    };
  }, []);

  const activeIndex = STEPS.findIndex((s) => s.id === phase);

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div className="text-center md:text-left order-2 md:order-1">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-jade">
              <span className="live-dot h-2 w-2 rounded-full bg-jade" aria-hidden />
              Live, just for you
            </p>
            <h2 className="mt-3 font-display font-semibold text-ink text-balance text-[clamp(1.6rem,3.5vw,2.3rem)] leading-[1.15]">
              Watch the moment it lands
            </h2>
            <p className="mt-4 text-ink-soft leading-relaxed max-w-md mx-auto md:mx-0">
              Most cards disappear into the void and you never know. Panda Messages tells
              you the moment your card is delivered, the moment they open it, and every
              heart they send back. Your dashboard updates as it happens.
            </p>
            <p className="mt-5 text-[14px] text-ink/70 max-w-md mx-auto md:mx-0">
              It is the closest thing to watching their face when they read it. Ask anyone
              who has sent one: the waiting is half the fun.
            </p>
          </div>

          {/* The live card tracker mock */}
          <div className="order-1 md:order-2">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card rounded-3xl p-6 sm:p-8 max-w-sm mx-auto"
            >
              <div className="flex items-center gap-4 pb-5 border-b border-ink/8">
                <PandaMoodFace mood={phase === "opened" ? "delighted" : phase === "delivered" ? "wink" : "sleepy"} size={58} />
                <div className="flex-1">
                  <p className="font-semibold text-ink text-[15px]">For Sarah</p>
                  <p className="text-[12px] text-ink/50">thinking of you · from Sam</p>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
                    phase === "opened"
                      ? "bg-blush-soft text-blush"
                      : phase === "delivered"
                        ? "bg-gold-soft text-[#8C6D10]"
                        : "bg-jade-soft text-jade"
                  )}
                >
                  {phase === "scheduled" ? "on its way" : phase}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {STEPS.map((step, i) => {
                  const done = i <= activeIndex;
                  const current = i === activeIndex;
                  return (
                    <div key={step.id} className="flex gap-4 items-start relative">
                      {i < STEPS.length - 1 && (
                        <span
                          className={cn(
                            "absolute left-[17px] top-9 h-[calc(100%-16px)] w-[2px] rounded-full transition-colors duration-700",
                            done ? "bg-jade/50" : "bg-ink/10"
                          )}
                          aria-hidden
                        />
                      )}
                      <span
                        className={cn(
                          "relative z-10 grid h-9 w-9 place-items-center rounded-full text-[15px] transition-all duration-500",
                          done
                            ? "bg-jade text-white shadow-[0_6px_14px_-6px_rgba(21,122,85,0.7)] scale-100"
                            : "bg-ink/5 scale-90"
                        )}
                        aria-hidden
                      >
                        {done ? step.emoji : "·"}
                      </span>
                      <div className="pt-1">
                        <p
                          className={cn(
                            "text-[14px] font-semibold transition-colors duration-500",
                            done ? "text-ink" : "text-ink/40"
                          )}
                        >
                          {step.label}
                        </p>
                        <p className="text-[12px] text-ink/50 leading-snug">{step.detail}</p>
                      </div>
                      {current && phase === "opened" && (
                        <motion.span
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="ml-auto pt-1.5 text-blush text-lg"
                          aria-hidden
                        >
                          💗
                        </motion.span>
                      )}
                    </div>
                  );
                })}
              </div>

              <AnimatePresence>
                {phase === "opened" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 rounded-2xl bg-blush-soft/70 border border-blush/20 px-4 py-3.5 flex items-center gap-3">
                      <span className="text-lg" aria-hidden>💗</span>
                      <p className="text-[13px] text-ink/75">
                        Sarah reacted <strong className="text-blush">just now</strong> and wrote
                        back: <em className="text-ink/80">&ldquo;ok this made my whole week&rdquo;</em>
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
