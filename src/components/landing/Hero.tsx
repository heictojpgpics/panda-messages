"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Mascot } from "page-mascot";
import { OCCASIONS } from "@/data/occasions";
import { cn } from "@/lib/utils";
import { Sparkles, PencilLine, ChevronDown } from "lucide-react";
import { PhoneMock, MiniCard } from "@/components/brand/MiniCard";

const EXAMPLES = [
  {
    data: {
      occasion: "thinking-of-you",
      recipientName: "Sarah",
      senderName: "Sam",
      message: "You come up all the time, actually. This card is just proof.",
      signoff: "with love, Panda 💚",
      theme: "bamboo-grove",
      watermark: false,
    },
    caption: "Thinking of you · example",
  },
  {
    data: {
      occasion: "birthday",
      recipientName: "Mia",
      senderName: "Alex",
      message: "One year more of you existing. Someone planned this card long before today.",
      signoff: "happy birthday again, Panda 💚",
      theme: "birthday-bash",
      watermark: false,
    },
    caption: "Birthday · example",
  },
  {
    data: {
      occasion: "i-miss-you",
      recipientName: "Noor",
      senderName: "Jonas",
      message: "Someone has been missing you a little extra today. Come back soon, okay?",
      signoff: "waiting by the window, Panda 💚",
      theme: "long-distance",
      watermark: false,
    },
    caption: "I miss you · example",
  },
  {
    data: {
      occasion: "love-you",
      recipientName: "Adam",
      senderName: "Kira",
      message: "You are loved. Not for any occasion, not for anything you did. Just you.",
      signoff: "with love, Panda 💚",
      theme: "rose-garden",
      watermark: false,
    },
    caption: "Love you · example",
  },
  {
    data: {
      occasion: "just-because",
      recipientName: "Zoe",
      senderName: "Maya",
      message: "No special reason. Someone thinks you are pretty wonderful, that is all.",
      signoff: "with love, Panda 💚",
      theme: "pressed-flowers",
      watermark: false,
    },
    caption: "Just because · example",
  },
];

function ExampleCarousel() {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((v) => (v + 1) % EXAMPLES.length), 5200);
    return () => clearInterval(t);
  }, [reduce]);
  const ex = EXAMPLES[i];
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-mist/70 to-paper px-4 py-8">
      <div className="relative w-full max-w-[240px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 18, scale: 0.96, rotate: 1.5 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: -14, scale: 0.97 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <MiniCard data={ex.data} compact />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-1.5" aria-label="Example cards">
        {EXAMPLES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Show the ${EXAMPLES[idx].caption.split(" ·")[0]} card`}
            className={cn(
              "h-1.5 rounded-full transition-all",
              idx === i ? "w-5 bg-jade" : "w-1.5 bg-ink/20 hover:bg-ink/40"
            )}
          />
        ))}
      </div>
      <p className="text-[11px] text-ink/45">{ex.caption}</p>
    </div>
  );
}

export function Hero() {
  const router = useRouter();
  const [tab, setTab] = useState<"any" | "special">("any");
  const [expanded, setExpanded] = useState(false);
  const [custom, setCustom] = useState("");

  const list = useMemo(() => {
    const base = OCCASIONS.filter((o) => o.category === tab);
    return expanded ? base : base.slice(0, 12);
  }, [tab, expanded]);
  const hiddenCount = useMemo(() => {
    const base = OCCASIONS.filter((o) => o.category === tab);
    return Math.max(0, base.length - 12);
  }, [tab]);

  const go = (occasion: string) => router.push(`/create?occasion=${occasion}`);
  const surprise = () => {
    const pick = OCCASIONS[Math.floor(Math.random() * OCCASIONS.length)];
    router.push(`/create?occasion=${pick.id}&surprised=1`);
  };
  const goCustom = () => {
    const text = custom.trim().slice(0, 60);
    router.push(text ? `/create?custom=${encodeURIComponent(text)}` : "/create");
  };

  return (
    <section className="relative overflow-hidden hero-forest grain">
      {/* Ambient drifting leaves */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {[
          { l: "6%", d: "22s", e: "🍃", s: 15, o: 0.35, x: "40px" },
          { l: "18%", d: "28s", e: "💚", s: 12, o: 0.3, x: "-30px", delay: "3s" },
          { l: "42%", d: "24s", e: "🍃", s: 10, o: 0.25, x: "60px", delay: "8s" },
          { l: "64%", d: "30s", e: "✨", s: 9, o: 0.4, x: "-50px", delay: "5s" },
          { l: "82%", d: "26s", e: "💚", s: 11, o: 0.28, x: "30px", delay: "11s" },
          { l: "92%", d: "32s", e: "✨", s: 8, o: 0.3, x: "-40px", delay: "2s" },
        ].map((p, i) => (
          <span
            key={i}
            className="drift-piece absolute top-0"
            style={{
              left: p.l,
              "--drift-duration": p.d,
              "--drift-delay": p.delay,
              "--drift-x": p.x,
              "--drift-opacity": p.o,
              fontSize: p.s,
            } as React.CSSProperties}
          >
            {p.e}
          </span>
        ))}
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-28 sm:pt-32 pb-16">
        {/* Mascot, following the reader's cursor */}
        <div className="flex justify-center mb-2">
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Mascot
              directions="/mascots/panda-directions.webp"
              reactions="/mascots/panda-reactions.webp"
              size={126}
              label="Panda, your card deliverer"
              className="drop-shadow-[0_10px_24px_rgba(22,36,28,0.25)]"
            />
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-[1.05fr_0.85fr] gap-12 lg:gap-8 items-center">
          {/* Left: the pitch */}
          <div className="text-center lg:text-left">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-jade"
            >
              Personalized panda greeting cards & messages
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 font-display font-semibold text-ink text-balance leading-[1.12] tracking-tight text-[clamp(1.7rem,4.2vw,2.6rem)]"
            >
              It&rsquo;s somebody&rsquo;s birthday soon...
              <br />
              did you get them anything yet?
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.55 }}
              className="mt-4 text-ink-soft text-[15px] sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0"
            >
              ...You forgot? It happens. 💚 <strong className="text-ink">Panda</strong> will send them a
              little card for you, right on the day. They open it like a gift. There is
              usually a happy cry.
            </motion.p>

            {/* Occasion picker */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.55 }}
              className="mt-8 max-w-xl mx-auto lg:mx-0"
            >
              <p className="text-[13px] text-ink/60 mb-3">
                Tell Panda the occasion:{" "}
                <Link href="/#pricing" className="text-jade font-semibold link-pretty">
                  making a card is free
                </Link>{" "}
                💚
              </p>

              <div
                role="tablist"
                aria-label="Kind of occasion"
                className="inline-flex p-1 rounded-full bg-ink/[0.05] border border-ink/10"
              >
                {(
                  [
                    ["any", "Any day", "💗"],
                    ["special", "Special days", "🎂"],
                  ] as const
                ).map(([id, label, emoji]) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={tab === id}
                    onClick={() => {
                      setTab(id);
                      setExpanded(false);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-full text-[13px] font-semibold transition-all",
                      tab === id
                        ? "bg-jade text-white shadow-[0_6px_16px_-6px_rgba(21,122,85,0.6)]"
                        : "text-ink/70 hover:text-ink"
                    )}
                  >
                    {emoji} {label}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <AnimatePresence initial={false}>
                  {list.map((o) => (
                    <motion.button
                      layout
                      key={o.id}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ duration: 0.18 }}
                      onClick={() => go(o.id)}
                      className="relative group card-lift rounded-xl bg-paper border border-ink/8 px-3 py-3.5 text-center"
                    >
                      {o.badge && (
                        <span
                          className={cn(
                            "absolute -top-1.5 -right-1.5 text-[8.5px] font-bold tracking-wider px-1.5 py-0.5 rounded-full text-white",
                            o.badge === "HOT" ? "bg-blush" : "bg-gold"
                          )}
                        >
                          {o.badge}
                        </span>
                      )}
                      <span className="block text-xl mb-1 group-hover:scale-110 transition-transform" aria-hidden>
                        {o.emoji}
                      </span>
                      <span className="text-[12.5px] font-medium text-ink/85 leading-tight">{o.label}</span>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>

              {hiddenCount > 0 && (
                <button
                  onClick={() => setExpanded(true)}
                  className="mt-3 text-[12.5px] text-jade font-medium link-pretty inline-flex items-center gap-1"
                  aria-expanded={expanded}
                >
                  + See {hiddenCount} more occasions <ChevronDown className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Write your own */}
              <div className="mt-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <PencilLine className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/35" />
                  <input
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && goCustom()}
                    placeholder="Write your own occasion"
                    aria-label="Write your own occasion"
                    maxLength={60}
                    className="w-full rounded-full border border-ink/12 bg-paper pl-10 pr-4 py-3 text-[13.5px] placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-jade/40 focus:border-jade/50 transition-shadow"
                  />
                </div>
                <button
                  onClick={goCustom}
                  disabled={!custom.trim()}
                  className="shrink-0 rounded-full border border-ink/12 bg-paper px-5 py-3 text-[13px] font-semibold text-ink/75 disabled:opacity-40 hover:border-jade/40 hover:text-jade transition-all"
                >
                  Use it
                </button>
              </div>

              <div className="mt-3 flex items-center gap-3 text-[12px] text-ink/40">
                <span className="flex-1 h-px bg-ink/8" />
                or
                <span className="flex-1 h-px bg-ink/8" />
              </div>

              <button
                onClick={surprise}
                className="sheen mt-3 w-full inline-flex justify-center items-center gap-2 rounded-full bg-jade text-white font-semibold py-3.5 text-[15px] shadow-[0_14px_30px_-10px_rgba(21,122,85,0.65)] hover:bg-jade-deep active:scale-[0.99] transition-all"
              >
                <Sparkles className="h-4 w-4" />
                Surprise me
              </button>
              <p className="mt-2.5 text-center text-[11.5px] italic text-ink/40">
                Free to make · takes about a minute
              </p>
            </motion.div>
          </div>

          {/* Right: the card, as it arrives */}
          <div className="relative">
            <div
              className="absolute -inset-8 rounded-[3rem] pointer-events-none"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(21,122,85,0.10), transparent)",
              }}
              aria-hidden
            />
            <PhoneMock tilt={2}>
              <ExampleCarousel />
            </PhoneMock>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-5 text-center text-[12px] text-ink/45"
            >
              This lands in their inbox. <span className="text-jade font-semibold">They tap, it opens, they melt.</span>
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
