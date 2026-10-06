"use client";

import Link from "next/link";
import { LIBRARY, LIBRARY_CATEGORIES } from "@/data/library";
import { motion } from "framer-motion";
import { ArrowRight, Copy } from "lucide-react";

const CATEGORY_COPY: Record<string, string> = {
  birthday: "For the people whose days you keep in your head",
  love: "For the one who is both the chaos and the calm",
  "morning-night": "Bookends for their day, from you",
  "miss-you": "For the miles that should not feel this long",
  thanks: "For favors, support, and showing up",
  occasion: "For the days marked in pen",
};

export function LibraryPreview() {
  return (
    <section className="relative bg-mist/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display font-semibold text-ink text-[clamp(1.6rem,3.5vw,2.3rem)]">
            Stuck on what to write?
          </h2>
          <p className="mt-3 text-ink-soft">
            Hundreds of messages to borrow, written by a person, for the person you are
            thinking of. Copy one straight into a text, or let Panda put it on a card.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {LIBRARY_CATEGORIES.map((cat, i) => {
            const pages = LIBRARY.filter((p) => p.category === cat.id).slice(0, 3);
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                className="card-lift rounded-3xl bg-paper border border-ink/8 p-6"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl" aria-hidden>{cat.emoji}</span>
                  <h3 className="font-display font-semibold text-ink text-[16.5px]">{cat.label}</h3>
                </div>
                <p className="mt-1.5 text-[12.5px] text-ink/50 leading-snug">{CATEGORY_COPY[cat.id]}</p>
                <ul className="mt-4 space-y-2.5">
                  {pages.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/messages/${p.slug}`}
                        className="group flex items-center justify-between gap-2 text-[13.5px] text-ink/75 hover:text-jade transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                          {p.title}
                        </span>
                        <span className="text-[11px] text-ink/35">{p.messages.length}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-9 text-center">
          <Link
            href="/messages"
            className="inline-flex items-center gap-1.5 text-jade font-semibold link-pretty text-[15px]"
          >
            See every message idea <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 text-[12px] text-ink/40 max-w-md mx-auto">
            Looking for a gift? Long distance gifts, digital surprise cards and
            personalized greeting cards, all start with the right words.
          </p>
        </div>
      </div>
    </section>
  );
}
