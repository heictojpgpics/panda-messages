import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { PandaMoodFace } from "@/components/brand/PandaMood";
import { Send } from "lucide-react";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Little cards, made personal, that make someone's day. What Panda Messages is and what we care about.",
};

const PRINCIPLES = [
  {
    title: "Written by people",
    body: "Every message idea on this site is written by us, by hand. No generated filler. If a line made us feel something, it made the cut.",
  },
  {
    title: "Private by default",
    body: "A card is only seen by someone with its link, and so are its photos. We never read them, sell them, or train anything on them.",
  },
  {
    title: "Fair pricing",
    body: "Free to make, one price for the full card, and a full refund if you cancel before it sends. No subscription, no dark patterns, no surprises.",
  },
  {
    title: "Small is the point",
    body: "A card takes a minute to make and lands forever. We are not building a social network. We are building the nicest minute on the internet.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Nav />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-32 pb-20">
          <Link href="/" className="text-[13px] font-medium text-ink/50 hover:text-jade transition-colors">
            ← Panda Messages
          </Link>

          <div className="flex justify-center mt-8">
            <PandaMoodFace mood="center" size={96} className="float-soft" />
          </div>

          <h1 className="mt-6 text-center font-display font-semibold text-ink text-[clamp(1.9rem,4vw,2.6rem)]">
            About Panda Messages
          </h1>
          <p className="mt-4 text-center text-[15.5px] text-ink-soft leading-relaxed max-w-xl mx-auto">
            Little cards, made personal, that make someone&rsquo;s day.
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              href="/create"
              className="sheen inline-flex items-center gap-2 rounded-full bg-jade text-white text-[15px] font-semibold px-6 py-3.5 shadow-[0_14px_30px_-10px_rgba(21,122,85,0.6)] hover:bg-jade-deep"
            >
              <Send className="h-4 w-4" />
              Create a card
            </Link>
          </div>

          <section className="mt-14">
            <h2 className="font-display font-semibold text-ink text-xl">What we make</h2>
            <p className="mt-4 text-[14.5px] text-ink-soft leading-[1.8]">
              A Panda card is a keepsake page made for one person. They open an envelope, the
              card rises out of it, and everything you put inside is there: your words, a song
              to play while they read, photos of the two of you. They can send love back with a
              tap, and write a card back to you.
            </p>
            <p className="mt-4 text-[14.5px] text-ink-soft leading-[1.8]">
              Making one is free, with a small pandamessages.com line on the card. The full card
              is $4.99, once, with no subscription: no mark on the card, all eleven themes, up
              to five photos, their song, and Panda can deliver it to their inbox on the morning
              of the day you pick. You watch the moment it is opened, and they can replay it
              forever.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="font-display font-semibold text-ink text-xl">How it works</h2>
            <ol className="mt-5 space-y-5">
              {[
                {
                  n: 1,
                  t: "Tell Panda who it is for",
                  d: "Their name, the occasion, and a few words from you. Stuck? There are hundreds of messages to start from.",
                },
                {
                  n: 2,
                  t: "Make it yours",
                  d: "Add a song from YouTube and a couple of photos. Pick a theme that is so them.",
                },
                {
                  n: 3,
                  t: "Send it",
                  d: "Share the link yourself, or let Panda deliver it to their inbox on the day.",
                },
              ].map((s) => (
                <li key={s.n} className="flex gap-4 items-start">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-jade-soft text-jade font-display font-bold">
                    {s.n}
                  </span>
                  <div>
                    <p className="font-semibold text-ink text-[15px]">{s.t}</p>
                    <p className="mt-1 text-[13.5px] text-ink-soft leading-relaxed">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-12">
            <h2 className="font-display font-semibold text-ink text-xl">What we care about</h2>
            <div className="mt-5 grid sm:grid-cols-2 gap-4">
              {PRINCIPLES.map((p) => (
                <div key={p.title} className="rounded-2xl bg-paper border border-ink/8 p-5">
                  <p className="font-semibold text-ink text-[14.5px]">{p.title}</p>
                  <p className="mt-2 text-[13px] text-ink-soft leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </section>

          <p className="mt-14 text-center text-[13px] text-ink/45">
            Privacy · Terms · Refunds, all linked below. Built with love and a slightly
            overweight panda.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
