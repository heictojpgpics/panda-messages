import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "Terms",
  description: "The plain-language terms for using Panda Messages.",
};

const SECTIONS: { h: string; body: string[] }[] = [
  {
    h: "What this is",
    body: [
      "Panda Messages lets you make and send personalized digital cards. By using the site you agree to these terms, which we have tried to write like a person would.",
    ],
  },
  {
    h: "Your account",
    body: [
      "You can make cards without an account, but free cards are kept for you when you create one, and paid cards are always attached to the email you pay from.",
      "Keep your password to yourself. You can close your account any time by writing to support, and we will remove your data from our active systems.",
    ],
  },
  {
    h: "What you send",
    body: [
      "The words, photos and song links you put in a card are yours. You are responsible for having the right to send them, especially photos of other people. Be kind. Do not use Panda to harass, threaten or spam anyone.",
      "We do screen for abuse signals, but we do not read your cards. See the privacy page for exactly what is stored.",
    ],
  },
  {
    h: "Paying",
    body: [
      "The full card costs $4.99, once, at the moment of checkout. Prices may change one day, but never for a card you already paid for.",
      "Payments are processed by our payment provider. We never see or store your card details.",
    ],
  },
  {
    h: "Delivery",
    body: [
      "Panda sends scheduled cards on the morning of the day you pick, to the email address you give us. If a card fails to arrive for a reason on our side, you get a refund, no questions.",
    ],
  },
  {
    h: "Liability, gently",
    body: [
      "We aim for a service that just works, but no service is perfect. Our liability for anything that goes wrong is limited to what you paid us, which for a $4.99 card is exactly that.",
    ],
  },
  {
    h: "Changes",
    body: [
      "If these terms change materially, we will say so on the site before the change takes effect. The rest is common sense. Be good to each other.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Nav />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-32 pb-20">
          <h1 className="font-display font-semibold text-ink text-3xl">Terms</h1>
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
            Questions about any of this?{" "}
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
