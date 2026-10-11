"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles, Users } from "lucide-react";
import { PandaMoodFace } from "@/components/brand/PandaMood";
import { PACKS } from "@/lib/config";

/** What every paid card carries, whatever pack it came from. */
const EVERY_CARD = [
  "Delivered to their inbox on the morning you pick",
  "No pandamessages.com mark on their card",
  "All fourteen themes",
  "Their song plays as they read it",
  "Up to 5 photos tucked inside",
  "Reactions and replies come back to you, live",
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
            One price, once. No subscription anywhere.
          </h2>
          <p className="mt-3 text-ink-soft">
            Making a card and previewing the whole moment is free. When you are
            ready to send it, pick a pack: every card is a full card, and the
            ones you do not use stay yours.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-5 max-w-5xl mx-auto items-stretch">
          {PACKS.map((pack, i) => {
            const loved = pack.id === "pack5";
            const best = pack.id === "pack15";
            return (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                className={
                  loved
                    ? "relative rounded-3xl p-[1.5px] overflow-hidden md:-my-3 shadow-[0_24px_60px_-30px_rgba(21,122,85,0.45)]"
                    : "relative rounded-3xl border border-ink/10 bg-paper p-8 flex flex-col"
                }
                style={
                  loved
                    ? {
                        background:
                          "linear-gradient(150deg, rgba(201,162,39,0.7), rgba(21,122,85,0.6) 45%, rgba(201,162,39,0.55))",
                      }
                    : undefined
                }
              >
                {loved && (
                  <span className="absolute -top-3 right-6 z-10 inline-flex items-center gap-1.5 rounded-full bg-gold text-ink text-[10.5px] font-bold uppercase tracking-wider px-3.5 py-1.5 shadow-lg">
                    <Sparkles className="h-3 w-3" />
                    Most loved
                  </span>
                )}
                {best && (
                  <span className="absolute -top-3 right-6 z-10 inline-flex items-center gap-1.5 rounded-full bg-ink text-white text-[10.5px] font-bold uppercase tracking-wider px-3.5 py-1.5 shadow-lg">
                    Best value
                  </span>
                )}

                <div
                  className={
                    loved
                      ? "h-full rounded-[calc(1.5rem-1.5px)] bg-paper p-8 flex flex-col relative overflow-hidden"
                      : "flex flex-col h-full"
                  }
                >
                  {loved && (
                    <div
                      className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-2xl pointer-events-none"
                      style={{ background: "radial-gradient(closest-side, rgba(201,162,39,0.18), transparent)" }}
                      aria-hidden
                    />
                  )}
                  <p className={loved ? "text-[11px] font-bold uppercase tracking-[0.22em] text-gold" : "text-[11px] font-bold uppercase tracking-[0.22em] text-ink/45"}>
                    {pack.label}
                  </p>
                  <div className="mt-3 flex items-end gap-2">
                    <p className="font-display font-semibold text-ink text-[44px] leading-none">
                      ${pack.price}
                    </p>
                    <p className="text-[13px] text-ink/45 mb-1">{pack.perCardLabel}</p>
                  </div>
                  <p className="mt-2.5 text-[14px] text-ink-soft leading-relaxed">{pack.blurb}</p>

                  <ul className="mt-6 space-y-3 flex-1">
                    {[`All ${pack.cards} cards fully unlocked`, ...EVERY_CARD.slice(0, 4)].map((f) => (
                      <li key={f} className="flex gap-3 items-start text-[13.5px] text-ink/85">
                        <span className={`shrink-0 mt-0.5 grid h-5 w-5 place-items-center rounded-full ${loved ? "bg-gold-soft" : "bg-jade-soft"}`}>
                          <Check className={`h-3 w-3 ${loved ? "text-[#8C6D10]" : "text-jade"}`} strokeWidth={3} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/create"
                    className={
                      loved
                        ? "sheen mt-8 inline-flex justify-center items-center gap-2 rounded-full bg-jade text-white font-semibold px-6 py-3.5 shadow-[0_14px_30px_-10px_rgba(21,122,85,0.65)] hover:bg-jade-deep transition-all active:scale-[0.99]"
                        : "mt-8 inline-flex justify-center rounded-full border-2 border-ink/15 bg-transparent text-ink font-semibold px-6 py-3.5 hover:border-ink/40 transition-all active:scale-[0.99]"
                    }
                  >
                    {pack.id === "single" ? "Send one card" : `Get ${pack.cards} cards`}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* The full list of what a card carries, once, under the packs */}
        <div className="mt-10 max-w-3xl mx-auto rounded-3xl bg-paper border border-ink/8 px-6 sm:px-8 py-6">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-ink/40">
            Every card, from every pack
          </p>
          <ul className="mt-4 grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
            {EVERY_CARD.map((f) => (
              <li key={f} className="flex gap-2.5 items-start text-[13px] text-ink/75">
                <Check className="h-4 w-4 text-jade shrink-0 mt-0.5" strokeWidth={2.5} />
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-center text-[12.5px] text-ink/50">
            Cancel any card before it sends for a full refund. Credits never expire.
          </p>
        </div>

        {/* Bulk teaser */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 max-w-3xl mx-auto rounded-3xl bg-jade-soft/50 border border-jade/20 p-6 sm:p-7 flex flex-col sm:flex-row items-center gap-5"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-jade/15">
            <Users className="h-5 w-5 text-jade" />
          </span>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-display font-semibold text-ink text-[17px]">
              A whole list of people who matter
            </p>
            <p className="text-[13px] text-ink-soft mt-1 leading-relaxed">
              Paste up to 15 emails at checkout and everyone gets their own envelope,
              with their own name on it. One payment, fifteen small moments.
              Perfect for New Year, Christmas, the whole team.
            </p>
          </div>
          <Link
            href="/create"
            className="shrink-0 rounded-full bg-jade text-white px-5 py-3 text-[13.5px] font-semibold shadow-[0_10px_24px_-10px_rgba(21,122,85,0.6)] hover:bg-jade-deep transition-colors"
          >
            Try it
          </Link>
        </motion.div>

        {/* Reminder upsell */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 max-w-5xl mx-auto rounded-3xl bg-ink text-white/90 p-6 sm:p-7 flex flex-col sm:flex-row items-center gap-5 grain relative overflow-hidden"
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
