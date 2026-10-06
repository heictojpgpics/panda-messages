"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { PandaMoodFace } from "@/components/brand/PandaMood";
import { Music, Camera, Video, Clock } from "lucide-react";

const FEATURES = [
  {
    icon: Music,
    title: "A song that plays as they read",
    body:
      "Pick a song from YouTube and it plays the moment they open your card. One specific song, attached to one specific person, forever associated now.",
    panda: "wink",
  },
  {
    icon: Camera,
    title: "Photos of the two of you",
    body:
      "Up to five, tucked inside the card like prints in an old envelope. Grandma has already decided this is the best feature on the internet.",
    panda: "bashful",
  },
  {
    icon: Clock,
    title: "Scheduled to the morning",
    body:
      "Set it today, land it on the day. Birthdays months away, anniversaries you would otherwise forget at 11:58pm. Edit or cancel any time before it sends.",
    panda: "sleepy",
  },
  {
    icon: Video,
    title: "Keepsake replay",
    body:
      "The card lives at its own link forever, and they can replay the whole opening any time they need it. People do use it that way. More than you would think.",
    panda: "delighted",
  },
];

export function Features() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-jade">
            Keep it forever
          </p>
          <h2 className="mt-3 font-display font-semibold text-ink text-balance text-[clamp(1.6rem,3.5vw,2.3rem)]">
            The whole moment, the way it happened
          </h2>
          <p className="mt-3 text-ink-soft">
            A text is read once and buried. A Panda card is a small place on the internet
            that belongs to two people.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="card-lift relative rounded-3xl bg-paper border border-ink/8 p-7 flex gap-5 items-start overflow-hidden"
            >
              <div
                className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full blur-2xl pointer-events-none"
                style={{ background: "radial-gradient(closest-side, rgba(21,122,85,0.08), transparent)" }}
                aria-hidden
              />
              <div className="shrink-0 flex flex-col items-center gap-1.5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-jade-soft text-jade ring-1 ring-jade/15">
                  <f.icon className="h-5 w-5" />
                </span>
                <PandaMoodFace mood={f.panda as "wink"} size={30} className="opacity-90" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-ink text-[17px]">{f.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{f.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-[13px] text-ink/55">
          Songs, photos and themes come with the full card.{" "}
          <Link href="/#pricing" className="text-jade font-semibold link-pretty">
            See what $4.99 gets you
          </Link>
        </p>
      </div>
    </section>
  );
}
