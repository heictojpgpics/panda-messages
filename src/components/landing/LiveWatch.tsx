"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { PandaMoodFace } from "@/components/brand/PandaMood";
import { cn } from "@/lib/utils";

/**
 * The differentiator section: you watch the exact moment your card is
 * opened. A simulated live timeline, because the real thing is on the
 * dashboard of whoever has a card in flight.
 *
 * The sequence plays once, when the section scrolls into view, and then
 * rests on the opened moment — no endless restart loop. A quiet replay
 * control lets anyone who wants to see it again run it once more.
 */

type Phase = "scheduled" | "delivered" | "opened";

const STEPS: { id: Phase; label: string; detail: string; emoji: string }[] = [
  { id: "scheduled", label: "Scheduled", detail: "Panda sets out on the morning you picked", emoji: "🗓️" },
  { id: "delivered", label: "Delivered", detail: "It lands in their inbox, waiting", emoji: "📬" },
  { id: "opened", label: "Opened", detail: "They tap. The seal cracks. You know instantly", emoji: "💌" },
];

export function LiveWatch() {
  const [phase, setPhase] = useState<Phase>("scheduled");
  const [finished, setFinished] = useState(false);
  const timersRef = useRef<number[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  // The sequence starts when the card actually enters the viewport, so
  // nobody scrolls down to find it already over.
  const inView = useInView(cardRef, { once: true, margin: "-120px" });

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);

  // The beats of the sequence: delivered, then opened. Pure timers, so the
  // first run can start straight from an effect without touching state.
  const schedule = useCallback(() => {
    timersRef.current.push(window.setTimeout(() => setPhase("delivered"), 1800));
    timersRef.current.push(
      window.setTimeout(() => {
        setPhase("opened");
        setFinished(true);
      }, 3400)
    );
  }, []);

  const runSequence = useCallback(() => {
    clearTimers();
    setFinished(false);
    setPhase("scheduled");
    schedule();
  }, [clearTimers, schedule]);

  // First play: begin the moment the card enters the viewport.
  useEffect(() => {
    if (!inView) return;
    schedule();
    return clearTimers;
  }, [inView, schedule, clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  const activeIndex = STEPS.findIndex((s) => s.id === phase);
  const opened = phase === "opened";

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
              ref={cardRef}
              className="glass-card rounded-3xl p-6 sm:p-8 max-w-sm mx-auto"
            >
              <div className="flex items-center gap-3 pb-5 border-b border-ink/8">
                <PandaMoodFace mood={opened ? "delighted" : phase === "delivered" ? "wink" : "sleepy"} size={58} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink text-[15px]">For Sarah</p>
                  <p className="text-[12px] leading-snug line-clamp-2 text-ink/50">thinking of you · from Sam</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
                    opened
                      ? "bg-blush-soft text-blush"
                      : phase === "delivered"
                        ? "bg-gold-soft text-[#8C6D10]"
                        : "bg-jade-soft text-jade"
                  )}
                >
                  {phase === "scheduled" ? "sealed" : phase}
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
                      {current && opened && (
                        <motion.span
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="absolute right-0 top-2 text-lg leading-none text-blush"
                          aria-hidden
                        >
                          💗
                        </motion.span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/*
                The reaction row keeps its seat at all times: the reaction
                box alone sizes the row (its content never changes — the
                replay control always holds its place), and the waiting
                state simply overlays it. The card never changes height,
                so nothing around it shifts when the reaction arrives.
              */}
              <div className="relative mt-5">
                <motion.div
                  animate={{ opacity: opened ? 0 : 1 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0 rounded-2xl border border-dashed border-blush/30 px-4 py-3.5 flex items-center gap-3"
                  aria-hidden={opened}
                  style={{ pointerEvents: opened ? "none" : "auto" }}
                >
                  <span className="text-lg opacity-40 grayscale" aria-hidden>💗</span>
                  <p className="text-[12.5px] text-ink/45 leading-snug">
                    When Sarah opens it, her reaction lands here — live.
                  </p>
                </motion.div>
                <motion.div
                  animate={{ opacity: opened ? 1 : 0, scale: opened ? 1 : 0.97 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="relative rounded-2xl bg-blush-soft/70 border border-blush/20 px-4 py-3.5 flex items-center gap-3"
                  aria-hidden={!opened}
                  style={{ pointerEvents: opened ? "auto" : "none" }}
                >
                  <span className="text-lg" aria-hidden>💗</span>
                  <p className="flex-1 text-[13px] text-ink/75">
                    Sarah reacted <strong className="text-blush">just now</strong> and wrote
                    back: <em className="text-ink/80">&ldquo;ok this made my whole week&rdquo;</em>
                  </p>
                  <button
                    type="button"
                    onClick={runSequence}
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full text-blush/70 transition duration-200 hover:bg-blush/10 hover:text-blush focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush/40",
                      finished ? "opacity-100" : "pointer-events-none opacity-0"
                    )}
                    aria-hidden={!finished}
                    tabIndex={finished ? 0 : -1}
                    aria-label="Replay the moment"
                    title="Replay"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
