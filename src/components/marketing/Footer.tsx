import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Heart } from "lucide-react";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Message ideas",
    links: [
      { href: "/messages/birthday-wishes-for-mom", label: "Birthday wishes for Mom" },
      { href: "/messages/birthday-wishes-for-dad", label: "Birthday wishes for Dad" },
      { href: "/messages/love-messages-for-her", label: "Love messages for her" },
      { href: "/messages/love-messages-for-him", label: "Love messages for him" },
      { href: "/messages/i-miss-you-messages", label: "I miss you messages" },
      { href: "/messages", label: "All message ideas" },
    ],
  },
  {
    title: "Panda cards",
    links: [
      { href: "/create", label: "Make a card" },
      { href: "/create?occasion=birthday", label: "Birthday cards" },
      { href: "/create?occasion=love-you", label: "Love cards" },
      { href: "/create?occasion=i-miss-you", label: "I miss you cards" },
      { href: "/messages/christmas-card-messages", label: "Christmas cards" },
      { href: "/remember", label: "Panda Remembers" },
    ],
  },
  {
    title: "Gifts",
    links: [
      { href: "/create", label: "Personalized greeting cards" },
      { href: "/create?occasion=i-miss-you", label: "Long distance gifts" },
      { href: "/create", label: "Digital surprise cards" },
      { href: "/create?occasion=anniversary", label: "Anniversary gifts" },
      { href: "/tools/message-writer", label: "Last minute gifts" },
    ],
  },
  {
    title: "Tools",
    links: [
      { href: "/tools/message-writer", label: "Message writer" },
      { href: "/tools/message-writer#panda-voice", label: "What would your panda say" },
      { href: "/remember", label: "Birthday reminders" },
      { href: "/feedback", label: "Share your thoughts" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-24 bg-ink text-white/85 overflow-hidden grain">
      <div className="absolute inset-0 bamboo-bg opacity-30" aria-hidden />
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[560px] h-[240px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(21,122,85,0.5), transparent)" }}
        aria-hidden
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-10">
        <div className="flex flex-col items-center text-center gap-3">
          <span className="rounded-2xl bg-white/10 p-2.5 ring-1 ring-white/15">
            <Logo className="[&_span]:text-white [&_span:last-child]:!text-white" size={34} />
          </span>
          <p className="font-display text-lg text-white">Little cards, big feelings.</p>
          <p className="text-sm text-white/60 max-w-md">
            Need help? We are here.
            <Heart className="inline h-3 w-3 mx-1 text-blush fill-blush" />
            <a href="mailto:support@pandamessages.com" className="link-pretty text-white/85">
              Contact support
            </a>
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[11px] uppercase tracking-[0.18em] text-gold/90 font-semibold mb-3">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="text-white/70 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-white/50">
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/about" className="hover:text-white/80">About</Link>
            <Link href="/terms" className="hover:text-white/80">Terms</Link>
            <Link href="/refund-policy" className="hover:text-white/80">Refund policy</Link>
            <Link href="/privacy" className="hover:text-white/80">Privacy</Link>
            <Link href="/feedback" className="hover:text-white/80">Share your thoughts</Link>
          </nav>
          <p>© {new Date().getFullYear()} Panda Messages</p>
        </div>
      </div>
    </footer>
  );
}
