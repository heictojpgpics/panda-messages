"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { getTheme } from "@/data/themes";
import { Envelope } from "@/components/brand/Envelope";
import { Play } from "lucide-react";

/**
 * "What they'll see" section: an envelope that opens itself as the visitor
 * scrolls to it. The demo of the exact moment we sell.
 */
export function EnvelopeDemo() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <section className="relative overflow-hidden bg-mist/60" id="what-they-see">
      <div className="absolute inset-0 bamboo-bg opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div className="order-2 md:order-1 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div
                className="absolute -inset-10 rounded-full blur-2xl pointer-events-none"
                style={{ background: "radial-gradient(closest-side, rgba(201,162,39,0.14), transparent)" }}
                aria-hidden
              />
              <EnvelopeOpenOnView theme="bamboo-grove" width={340} />
            </motion.div>
          </div>

          <div className="order-1 md:order-2 text-center md:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-jade">
              What they&rsquo;ll see
            </p>
            <h2 className="mt-3 font-display font-semibold text-ink text-balance text-[clamp(1.6rem,3.5vw,2.3rem)] leading-[1.15]">
              A card that arrives like a gift,
              <br />
              not like a link
            </h2>
            <p className="mt-4 text-ink-soft leading-relaxed max-w-md mx-auto md:mx-0">
              No login, no app, no awkward &ldquo;what is this link?&rdquo; They get a little envelope
              with their name on it. The seal cracks, the card rises out, and your words are
              the first thing they read. Some people open them twice.
            </p>
            <ul className="mt-6 space-y-2.5 text-[14px] text-ink/75 max-w-md mx-auto md:mx-0">
              {[
                "It lands on the morning you pick, not whenever you remember",
                "Your words, in Panda's handwriting, on their own private page",
                "They can send love back with one tap. You will know the moment they do",
              ].map((line) => (
                <li key={line} className="flex gap-2.5 items-start">
                  <span className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-jade" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
            <a
              href="/create"
              className="sheen mt-7 inline-flex items-center gap-2 rounded-full bg-jade text-white font-semibold px-6 py-3.5 shadow-[0_14px_30px_-10px_rgba(21,122,85,0.6)] hover:bg-jade-deep transition-all active:scale-[0.99]"
            >
              Make one for someone
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function EnvelopeOpenOnView({ theme: themeId, width }: { theme: string; width: number }) {
  const theme = getTheme(themeId);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-120px", amount: 0.4 });

  return (
    <div ref={ref} className="relative flex flex-col items-center gap-8">
      <Envelope theme={theme} open={inView} width={width} />
      <div className="flex items-center gap-3 text-ink/50 text-[13px]">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-md ring-1 ring-ink/10">
          <Play className="h-4 w-4 fill-jade text-jade" />
        </span>
        <div>
          <p className="font-medium text-ink/80">Panda got a new message for you</p>
          <p className="text-[11.5px]">tap to open · their device, their morning</p>
        </div>
      </div>
    </div>
  );
}
