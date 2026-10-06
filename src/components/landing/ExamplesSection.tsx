"use client";

import { useRef } from "react";
import { MiniCard } from "@/components/brand/MiniCard";

const EXAMPLES = [
  {
    data: {
      occasion: "i-miss-you",
      recipientName: "Mia",
      senderName: "Jonas",
      message: "Panda has a tiny confession. Someone has been missing you a little extra today. Actually, more than a little. Come back soon, okay?",
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
      message: "Panda was asked to say something, and it turned out to be very simple. You are loved. Not for any occasion, not for anything you did. Just you.",
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
      message: "No special reason for this card. Panda just wanted you to know that someone thinks you're pretty wonderful. Today and most days, actually.",
      signoff: "with love, Panda 💚",
      theme: "pressed-flowers",
      watermark: false,
    },
    caption: "Just because · example",
  },
];

export function ExamplesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section id="examples" className="relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display font-semibold text-ink text-balance text-[clamp(1.6rem,3.5vw,2.3rem)]">
            Every card is made just for them
          </h2>
          <p className="mt-3 text-ink-soft">
            Their name on the envelope, your words in the letter, a theme you picked
            because it is so them. Here are three, exactly as they arrive.
          </p>
        </div>

        <div
          ref={scrollRef}
          className="mt-12 flex gap-6 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {EXAMPLES.map((ex, i) => (
            <div
              key={i}
              className="snap-center shrink-0 w-[280px] sm:w-[300px] flex flex-col items-center gap-3"
            >
              <div style={{ transform: `rotate(${i === 1 ? 0 : i === 0 ? -1.5 : 1.5}deg)` }}>
                <MiniCard data={ex.data} />
              </div>
              <p className="text-[12px] text-ink/45">{ex.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
