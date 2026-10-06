"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { PandaMoodFace } from "@/components/brand/PandaMood";

const FREE_FEATURES = [
  "A personalized card, made in a minute",
  "The Bamboo Grove theme, always",
  "Share by text, WhatsApp, or email",
  "Reactions and replies come back to you",
];

const PAID_FEATURES = [
  "No pandamessages.com mark on their card",
  "All 11 themes for the page they open",
  "Their song plays as they read it",
  "Up to 5 photos tucked inside",
  "Panda delivers it to their inbox, on the morning you pick",
  "Schedule months ahead. Edit or cancel before it sends, full refund",
  "The link is theirs forever, replayable any time",
];

export function Pricing() {
  return (
    <section id="pricing" className="relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ink/15 to-transparent"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display font-semibold text-ink text-balance text-[clamp(1.6rem,3.5vw,2.3rem)]">
            Two ways to send a little love
          </h2>
          <p className="mt-3 text-ink-soft">
            Make one yourself for free, or let Panda deliver it on the day. One price,
            once, and no subscription in sight.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55 }}
            className="rounded-3xl bg-paper border border-ink/10 p-8 flex flex-col"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ink/45">
              Make it yourself
            </p>
            <p className="mt-3 font-display font-semibold text-ink text-5xl">Free</p>
            <p className="mt-2 text-[14px] text-ink-soft">You share the link yourself.</p>

            <ul className="mt-7 space-y-3.5 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex gap-3 items-start text-[14px] text-ink/80">
                  <Check className="h-4.5 w-4.5 text-jade shrink-0 mt-0.5" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/create"
              className="mt-8 inline-flex justify-center rounded-full border-2 border-ink/15 bg-transparent text-ink font-semibold px-6 py-3.5 hover:border-ink/40 transition-all active:scale-[0.99]"
            >
              Make one free
            </Link>
          </motion.div>

          {/* Paid */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="relative rounded-3xl p-[1.5px] overflow-hidden"
            style={{
              background:
                "linear-gradient(150deg, rgba(201,162,39,0.65), rgba(21,122,85,0.55) 45%, rgba(201,162,39,0.5))",
            }}
          >
            <span className="absolute -top-3 right-6 z-10 inline-flex items-center gap-1.5 rounded-full bg-gold text-ink text-[10.5px] font-bold uppercase tracking-wider px-3.5 py-1.5 shadow-lg">
              <Sparkles className="h-3 w-3" />
              Most loved
            </span>
            <div className="h-full rounded-[calc(1.5rem-1.5px)] bg-paper p-8 flex flex-col relative overflow-hidden">
              <div
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-2xl pointer-events-none"
                style={{ background: "radial-gradient(closest-side, rgba(201,162,39,0.18), transparent)" }}
                aria-hidden
              />
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
                  Surprise them with Panda
                </p>
              </div>
              <div className="mt-3 flex items-end gap-2">
                <p className="font-display font-semibold text-ink text-5xl">$4.99</p>
                <p className="text-[13px] text-ink/45 mb-1.5">once, per card</p>
              </div>
              <p className="mt-2 text-[14px] text-ink-soft">
                Panda brings it to their inbox on the morning you pick, and they open it
                like a gift they never saw coming.
              </p>

              <ul className="mt-7 space-y-3.5 flex-1">
                {PAID_FEATURES.map((f) => (
                  <li key={f} className="flex gap-3 items-start text-[14px] text-ink/85">
                    <span className="shrink-0 mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-gold-soft">
                      <Check className="h-3 w-3 text-[#8C6D10]" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/create"
                className="sheen mt-8 inline-flex justify-center items-center gap-2 rounded-full bg-jade text-white font-semibold px-6 py-3.5 shadow-[0_14px_30px_-10px_rgba(21,122,85,0.65)] hover:bg-jade-deep transition-all active:scale-[0.99]"
              >
                Surprise them with Panda
              </Link>
              <p className="mt-3 text-center text-[11.5px] text-ink/40">
                Secure checkout. If anything goes wrong, we make it right.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Reminder upsell */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 max-w-4xl mx-auto rounded-3xl bg-ink text-white/90 p-6 sm:p-7 flex flex-col sm:flex-row items-center gap-5 grain relative overflow-hidden"
        >
          <div className="absolute inset-0 bamboo-bg opacity-25" aria-hidden />
          <PandaMoodFace mood="sleepy" size={62} className="shrink-0 relative" />
          <div className="relative flex-1 text-center sm:text-left">
            <p className="font-display font-semibold text-white text-[17px]">
              Bad at remembering the days? Panda Remembers.
            </p>
            <p className="text-[13px] text-white/60 mt-1">
              Give Panda your special days once. A card goes out on every one, checked
              with you a few days before. $19 a year. Coming soon.
            </p>
          </div>
          <Link
            href="/remember"
            className="relative shrink-0 rounded-full bg-white/10 ring-1 ring-white/20 px-5 py-3 text-[13.5px] font-semibold text-white hover:bg-white/20 transition-colors"
          >
            Get notified
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
