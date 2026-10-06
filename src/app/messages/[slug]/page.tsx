import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { LIBRARY, getLibraryPage } from "@/data/library";
import { MiniCard } from "@/components/brand/MiniCard";
import { MessageCopy } from "./MessageCopy";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

export function generateStaticParams() {
  return LIBRARY.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getLibraryPage(slug);
  if (!page) return { title: "Message ideas" };
  return {
    title: `${page.title}: ${page.messages.length}+ to copy`,
    description: page.intro.slice(0, 155),
  };
}

export default async function LibraryDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getLibraryPage(slug);
  if (!page) notFound();

  const related = LIBRARY.filter((p) => p.category === page.category && p.slug !== page.slug).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Nav />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 sm:px-6 pt-32 pb-16">
          <Link
            href="/messages"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink/50 hover:text-jade transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All message ideas
          </Link>

          <h1 className="mt-5 font-display font-semibold text-ink text-[clamp(1.8rem,4vw,2.5rem)] text-balance leading-[1.15]">
            {page.heading}
          </h1>
          <p className="mt-4 text-[15px] text-ink-soft leading-relaxed">{page.intro}</p>

          <section className="mt-10">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-jade">
              Short ones, ready to send
            </h2>
            <ul className="mt-5 space-y-3">
              {page.messages.map((m) => (
                <MessageCopy key={m} text={m} />
              ))}
            </ul>
          </section>

          <section className="mt-12">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-jade">
              When a text is not enough
            </h2>
            <p className="mt-2.5 text-[13px] text-ink/50">
              These longer notes work beautifully on a card. Panda delivers them like a gift.
            </p>
            <ul className="mt-5 space-y-4">
              {page.longer.map((m) => (
                <MessageCopy key={m} text={m} long />
              ))}
            </ul>
          </section>

          {/* Card upsell */}
          <aside className="mt-14 rounded-3xl bg-mist/70 border border-jade/15 p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full blur-2xl bg-jade/10" aria-hidden />
            <div className="relative grid sm:grid-cols-[1fr_260px] gap-8 items-center">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-jade">
                  Put it on a card instead
                </p>
                <h3 className="mt-2.5 font-display font-semibold text-ink text-xl leading-snug">
                  Words this good deserve an envelope
                </h3>
                <p className="mt-3 text-[13.5px] text-ink-soft leading-relaxed">
                  Pick any line above, make it theirs in about a minute, and Panda delivers it on
                  the morning you choose. They open it like a gift, and it stays theirs forever.
                </p>
                <Link
                  href={`/create?occasion=${guessOccasion(page.category)}`}
                  className="sheen mt-6 inline-flex items-center gap-2 rounded-full bg-jade text-white text-[14.5px] font-semibold px-6 py-3.5 shadow-[0_14px_30px_-10px_rgba(21,122,85,0.6)] hover:bg-jade-deep transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  Make the card
                </Link>
                <p className="mt-2.5 text-[11.5px] text-ink/40">Free to make · $4.99 to deliver it</p>
              </div>
              <div className="hidden sm:block">
                <MiniCard
                  data={{
                    occasion: guessOccasion(page.category),
                    recipientName: "them",
                    senderName: "you",
                    message: page.messages[0],
                    theme: "bamboo-grove",
                    watermark: true,
                  }}
                  compact
                />
              </div>
            </div>
          </aside>

          {/* Tips */}
          <section className="mt-12">
            <h2 className="font-display font-semibold text-ink text-lg">
              Small tricks for writing these
            </h2>
            <ul className="mt-4 space-y-2.5">
              {page.tips.map((t) => (
                <li key={t} className="flex gap-2.5 items-start text-[13.5px] text-ink-soft leading-relaxed">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </section>

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display font-semibold text-ink text-lg">More like this</h2>
              <div className="mt-4 grid sm:grid-cols-3 gap-3.5">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/messages/${r.slug}`}
                    className="card-lift rounded-2xl bg-paper border border-ink/8 p-4"
                  >
                    <p className="text-[14px] font-medium text-ink/85">{r.title}</p>
                    <p className="text-[11.5px] text-ink/40 mt-1">{r.messages.length} ideas</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <nav className="mt-12 pt-8 border-t border-ink/8 flex items-center justify-between text-[13.5px]">
            <Link href="/messages" className="font-medium text-ink/60 hover:text-jade link-pretty">
              All message ideas
            </Link>
            <Link href="/create" className="font-semibold text-jade link-pretty inline-flex items-center gap-1">
              Make a card <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </article>
      </main>
      <Footer />
    </div>
  );
}

function guessOccasion(category: string): string {
  switch (category) {
    case "birthday":
      return "birthday";
    case "love":
      return "love-you";
    case "morning-night":
      return "good-morning";
    case "miss-you":
      return "i-miss-you";
    case "thanks":
      return "thank-you";
    case "occasion":
      return "anniversary";
    default:
      return "just-because";
  }
}
