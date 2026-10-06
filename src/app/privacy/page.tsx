import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Panda Messages stores, what it never touches, and how to get your data out.",
};

const SECTIONS: { h: string; body: string[] }[] = [
  {
    h: "The short version",
    body: [
      "A card is private. Only people with its exact link can see it. We do not read your messages, we do not sell anything, and we do not run ads or trackers beyond the basics of keeping the site working.",
    ],
  },
  {
    h: "What we store",
    body: [
      "Account: your email, an optional name, and a salted, hashed password. Never the password itself.",
      "Cards: the words you write, the theme, the song link, and any photos you attach, plus the recipient name and the delivery email you choose. This is the minimum needed to make delivery work and to let you manage your cards.",
      "Events: anonymous moments like 'opened' and 'heart sent', so your dashboard can show them. No content, no identities.",
      "Technical bits: standard server logs (IP, timestamps) kept briefly for security and debugging.",
    ],
  },
  {
    h: "What we never do",
    body: [
      "We never sell or share your data with marketers. We never use your cards, photos or messages for training anything. Recipients are never added to any list of ours, and their email is used exactly once, to deliver your card.",
    ],
  },
  {
    h: "Where it lives",
    body: [
      "Cards and account data are stored in our database (Cloudflare D1 in production). Photos travel inside the card data, encrypted in transit. If you ask us to delete a card, it is deleted for real.",
    ],
  },
  {
    h: "Cookies",
    body: [
      "One session cookie so you stay signed in, and one anonymous visitor cookie so we can count a card's opens and reactions honestly. No ad cookies, no cross-site tracking, no pixel soup.",
    ],
  },
  {
    h: "Your moves",
    body: [
      "You can ask for a copy of everything we hold about you, or ask us to delete it. One email to support@pandamessages.com and a human takes care of it, usually the same day.",
    ],
  },
  {
    h: "Children",
    body: [
      "Panda is for everyone but payments require an adult. If you believe a child has created an account, write to us and we will remove it.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Nav />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-32 pb-20">
          <h1 className="font-display font-semibold text-ink text-3xl">Privacy</h1>
          <p className="mt-2 text-[13px] text-ink/45">Last updated: October 2026</p>
          <div className="mt-10 space-y-9">
            {SECTIONS.map((s) => (
              <section key={s.h}>
                <h2 className="font-display font-semibold text-ink text-lg">{s.h}</h2>
                {s.body.map((p, i) => (
                  <p key={i} className="mt-3 text-[14px] text-ink-soft leading-[1.75]">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
          <p className="mt-12 text-[13px] text-ink/45">
            Anything unclear?{" "}
            <a href="mailto:support@pandamessages.com" className="text-jade font-medium link-pretty">
              support@pandamessages.com
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
