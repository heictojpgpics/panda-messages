"use client";

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
  {
    data: {
      occasion: "christmas",
      recipientName: "Noah",
      senderName: "Grandma June",
      message: "The tree went up late this year because someone insisted every light be checked twice. It was the best evening of December so far. Save me a seat by the fire.",
      signoff: "love, Grandma June",
      theme: "winter-wonderland",
      watermark: false,
    },
    caption: "Christmas · example",
  },
];

export function ExamplesSection() {
  return (
    <section id="examples" className="relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display font-semibold text-ink text-balance text-[clamp(1.6rem,3.5vw,2.3rem)]">
            Every card is made just for them
          </h2>
          <p className="mt-3 text-ink-soft">
            Their name on the envelope, your words in the letter, a theme you picked
            because it is so them. Here are a few, exactly as they arrive.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 min-[560px]:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5">
          {EXAMPLES.map((ex, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-3"
            >
              <div style={{ transform: `rotate(${[-1.5, 1.5, -1, 1][i % 4]}deg)` }}>
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
