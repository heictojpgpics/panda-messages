import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { LIBRARY, LIBRARY_CATEGORIES } from "@/data/library";
import { LibraryGrid } from "./LibraryGrid";

export const metadata: Metadata = {
  title: "Message ideas for every occasion",
  description:
    "Free, heartfelt message ideas you can copy for texts and cards. Birthday wishes, love messages, good morning and good night lines, all written by hand.",
};

export default function MessagesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Nav />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-32 pb-20">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="font-display font-semibold text-ink text-[clamp(1.8rem,4vw,2.6rem)] text-balance">
              What to write, for every occasion
            </h1>
            <p className="mt-4 text-ink-soft leading-relaxed">
              Free, heartfelt message ideas you can copy for texts and cards. And when you want
              the words to arrive looking as lovely as they sound, Panda will put them on a
              beautiful personalized card for you.
            </p>
          </div>

          {LIBRARY_CATEGORIES.map((cat) => {
            const pages = LIBRARY.filter((p) => p.category === cat.id);
            if (pages.length === 0) return null;
            return (
              <section key={cat.id} className="mt-14">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl" aria-hidden>{cat.emoji}</span>
                  <h2 className="font-display font-semibold text-ink text-xl">{cat.label}</h2>
                </div>
                <LibraryGrid pages={pages} />
              </section>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
