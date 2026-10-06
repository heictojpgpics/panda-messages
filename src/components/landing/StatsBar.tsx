"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { OCCASIONS } from "@/data/occasions";
import { THEMES } from "@/data/themes";
import { LIBRARY } from "@/data/library";

interface Counts {
  cards: number;
  smiles: number;
  reactions: number;
  replies: number;
}

/**
 * The proof strip. Product facts are always true (computed from the real
 * catalog), and live usage counts join in once they are meaningful rather
 * than showing a sad "1+" on day one.
 */
const ALWAYS_TRUE = [
  { key: "occasions", label: "occasions to send for", emoji: "🐾", color: "text-jade" },
  { key: "themes", label: "themes for the page they open", emoji: "🎨", color: "text-gold" },
  { key: "messages", label: "message ideas, free to borrow", emoji: "✍️", color: "text-blush" },
  { key: "cards", label: "cards sent so far", emoji: "💌", color: "text-ink-soft" },
] as const;

const USAGE_THRESHOLD = 25;

function libraryMessageCount(): number {
  return LIBRARY.reduce((n, page) => n + page.messages.length, 0);
}

export function StatsBar() {
  const [live, setLive] = useState<Counts | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setLive)
      .catch(() => {});
  }, []);

  const usageReady = (live?.cards ?? 0) >= USAGE_THRESHOLD;
  const items = ALWAYS_TRUE.map((item) => {
    switch (item.key) {
      case "occasions":
        return { ...item, value: `${OCCASIONS.length}` };
      case "themes":
        return { ...item, value: `${THEMES.length}` };
      case "messages":
        return { ...item, value: `${libraryMessageCount()}+` };
      default:
        return {
          ...item,
          value: usageReady && live ? `${live.cards}+` : "yours next",
        };
    }
  });

  return (
    <section aria-label="Panda by the numbers" className="relative border-y border-ink/8 bg-paper/70 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 text-center">
          {items.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.45 }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-2xl sm:text-[26px]" aria-hidden>
                {item.emoji}
              </span>
              <span className={cn("font-display font-semibold text-[clamp(1.4rem,3vw,1.9rem)] tabular-nums", item.color)}>
                {item.value}
              </span>
              <span className="text-[12px] text-ink/55">{item.label}</span>
            </motion.div>
          ))}
        </div>
        <p className="mt-5 text-center text-[11.5px] text-ink/40">
          {usageReady && live
            ? "Live from the bamboo forest. Every number is a real moment somebody caused."
            : "The shelf is stocked and Panda is waiting. Someone has to go first."}
        </p>
      </div>
    </section>
  );
}
