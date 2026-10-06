"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Counts {
  cards: number;
  smiles: number;
  reactions: number;
  replies: number;
}

function formatN(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
  return `${n}+`;
}

const ITEMS: { key: keyof Counts; label: string; emoji: string; color: string }[] = [
  { key: "cards", label: "cards made with love", emoji: "🐾", color: "text-jade" },
  { key: "smiles", label: "smiles delivered", emoji: "🙂", color: "text-gold" },
  { key: "reactions", label: "hearts sent back", emoji: "💚", color: "text-blush" },
  { key: "replies", label: "replies written", emoji: "💬", color: "text-ink-soft" },
];

export function StatsBar() {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setCounts)
      .catch(() => {});
  }, []);

  return (
    <section aria-label="Panda by the numbers" className="relative border-y border-ink/8 bg-paper/70 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 text-center">
          {ITEMS.map((item, i) => (
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
                {counts ? formatN(counts[item.key]) : "..."}
              </span>
              <span className="text-[12px] text-ink/55">{item.label}</span>
            </motion.div>
          ))}
        </div>
        <p className="mt-5 text-center text-[11.5px] text-ink/40">
          Live from the bamboo forest. Every number is a real moment somebody caused.
        </p>
      </div>
    </section>
  );
}
