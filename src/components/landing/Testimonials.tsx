"use client";

import { motion } from "framer-motion";

const QUOTES = [
  {
    text: "sent one to my long distance boyfriend at 6am his time and watched the opened notification hit while I was making coffee. cried a little. not embarrassed.",
    tag: "💌 Long distance",
    emoji: "😍",
  },
  {
    text: "my grandma called me to say a panda hand-delivered her birthday card. HAND DELIVERED. she has told the entire bridge club.",
    tag: "🎂 Birthday",
    emoji: "🥰",
  },
  {
    text: "I used the sorry one after a fight. it worked better than the flowers. the flowers are now also expected but that's on me",
    tag: "😔 Sorry",
    emoji: "😅",
  },
  {
    text: "the song started playing right when the card opened and I watched her face do a thing I will never recover from",
    tag: "💘 Love you",
    emoji: "😭",
  },
  {
    text: "been sending my sister a good morning card every monday for 3 months. it's our thing now. do NOT tell her it costs less than a coffee",
    tag: "☀️ Good morning",
    emoji: "🥹",
  },
];

export function Testimonials() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <div className="text-center">
          <h2 className="font-display font-semibold text-ink text-[clamp(1.6rem,3.5vw,2.3rem)]">
            People love their Panda cards 😍
          </h2>
          <p className="mt-3 text-ink-soft text-[14.5px]">
            From the early flock. Slightly edited for length, unedited for feelings.
          </p>
        </div>

        <div className="mt-12 flex gap-5 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {QUOTES.map((q, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
              className={`card-lift shrink-0 rounded-3xl bg-paper border border-ink/8 p-6 flex flex-col gap-4 snap-start ${
                i === 0 ? "w-[320px] sm:w-[380px]" : "w-[280px]"
              }`}
            >
              <span className="text-3xl" aria-hidden>{q.emoji}</span>
              <blockquote className="font-display text-ink/90 leading-relaxed text-[15px]">
                &ldquo;{q.text}&rdquo;
              </blockquote>
              <figcaption className="mt-auto">
                <span className="inline-flex items-center rounded-full bg-jade-soft text-jade text-[11.5px] font-semibold px-3 py-1.5">
                  {q.tag}
                </span>
              </figcaption>
            </motion.figure>
          ))}
          <div className="shrink-0 w-2" aria-hidden />
        </div>
      </div>
    </section>
  );
}
