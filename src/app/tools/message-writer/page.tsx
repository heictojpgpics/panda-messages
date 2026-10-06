"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { PandaMoodFace } from "@/components/brand/PandaMood";
import { OCCASIONS } from "@/data/occasions";
import { writeDrafts, pandaSay, type Tone, type Relationship } from "@/data/writer";
import { cn } from "@/lib/utils";
import { RefreshCw, Copy, Check, Sparkles, ArrowRight, Wand2 } from "lucide-react";

const TONES: { id: Tone; label: string; emoji: string }[] = [
  { id: "sweet", label: "Sweet", emoji: "💗" },
  { id: "funny", label: "Funny", emoji: "😄" },
  { id: "poetic", label: "Poetic", emoji: "🌙" },
  { id: "simple", label: "Plain and short", emoji: "✂️" },
];

const RELATIONSHIPS: { id: Relationship; label: string }[] = [
  { id: "partner", label: "Partner" },
  { id: "friend", label: "Friend" },
  { id: "parent", label: "Parent" },
  { id: "family", label: "Family" },
  { id: "colleague", label: "Colleague" },
  { id: "anyone", label: "Anyone" },
];

export default function MessageWriterPage() {
  const router = useRouter();
  const [occasion, setOccasion] = useState("birthday");
  const [tone, setTone] = useState<Tone>("sweet");
  const [relationship, setRelationship] = useState<Relationship>("partner");
  const [theirName, setTheirName] = useState("");
  const [yourName, setYourName] = useState("");
  const [seed, setSeed] = useState(1);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [pandaMode, setPandaMode] = useState(false);

  const drafts = useMemo(() => {
    const input = { occasion, tone, relationship, theirName, yourName };
    return pandaMode
      ? pandaSay(occasion, theirName || "you", seed)
      : writeDrafts(input, seed);
  }, [occasion, tone, relationship, theirName, yourName, seed, pandaMode]);

  const copy = async (text: string, i: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Nav />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-32 pb-20">
          <div className="text-center max-w-xl mx-auto">
            <h1 className="font-display font-semibold text-ink text-[clamp(1.8rem,4vw,2.5rem)] text-balance">
              The message writer
            </h1>
            <p className="mt-4 text-ink-soft leading-relaxed">
              Answer four little questions and Panda drafts three messages. Keep the one that
              sounds like you, or steal a phrase and make it yours. Works offline, no waiting.
            </p>
          </div>

          {/* Controls */}
          <div className="mt-10 glass-card rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ink/45">
                  Who is it for
                </label>
                <input
                  value={theirName}
                  onChange={(e) => setTheirName(e.target.value)}
                  placeholder="Their name"
                  maxLength={40}
                  className="w-full rounded-full border border-ink/12 bg-paper px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-jade/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ink/45">
                  From
                </label>
                <input
                  value={yourName}
                  onChange={(e) => setYourName(e.target.value)}
                  placeholder="Your name"
                  maxLength={40}
                  className="w-full rounded-full border border-ink/12 bg-paper px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-jade/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ink/45">
                The occasion
              </label>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.filter((o) =>
                  [
                    "birthday",
                    "love-you",
                    "i-miss-you",
                    "thank-you",
                    "good-morning",
                    "good-night",
                    "thinking-of-you",
                    "congratulations",
                    "get-well",
                    "just-because",
                  ].includes(o.id)
                ).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setOccasion(o.id)}
                    className={cn(
                      "rounded-full border px-3.5 py-2 text-[12.5px] font-medium transition-all",
                      occasion === o.id
                        ? "border-jade bg-jade text-white"
                        : "border-ink/12 bg-paper text-ink/70 hover:border-jade/40"
                    )}
                    aria-pressed={occasion === o.id}
                  >
                    {o.emoji} {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ink/45">
                Tone of voice
              </label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={cn(
                      "rounded-full border px-3.5 py-2 text-[12.5px] font-medium transition-all",
                      tone === t.id && !pandaMode
                        ? "border-jade bg-jade text-white"
                        : "border-ink/12 bg-paper text-ink/70 hover:border-jade/40"
                    )}
                    aria-pressed={tone === t.id && !pandaMode}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ink/45">
                Your relationship
              </label>
              <div className="flex flex-wrap gap-2">
                {RELATIONSHIPS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRelationship(r.id)}
                    className={cn(
                      "rounded-full border px-3.5 py-2 text-[12.5px] font-medium transition-all",
                      relationship === r.id && !pandaMode
                        ? "border-jade bg-jade text-white"
                        : "border-ink/12 bg-paper text-ink/70 hover:border-jade/40"
                    )}
                    aria-pressed={relationship === r.id && !pandaMode}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSeed((s) => s + 11);
                }}
                className="sheen inline-flex items-center gap-2 rounded-full bg-jade text-white text-[14px] font-semibold px-5 py-3 hover:bg-jade-deep transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Write three drafts
              </button>
              <button
                onClick={() => setPandaMode((v) => !v)}
                id="panda-voice"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border-2 text-[14px] font-semibold px-5 py-2.5 transition-all",
                  pandaMode
                    ? "border-gold bg-gold-soft text-[#8C6D10]"
                    : "border-ink/12 text-ink/70 hover:border-gold/50"
                )}
                aria-pressed={pandaMode}
              >
                <Wand2 className="h-4 w-4" />
                What would your panda say
              </button>
            </div>
          </div>

          {/* Drafts */}
          <div className="mt-8 space-y-4" aria-live="polite">
            <AnimatePresence mode="pop-layout">
              {drafts.map((d, i) => (
                <motion.div
                  key={d}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: i * 0.07, duration: 0.35 }}
                  className="group relative rounded-3xl bg-paper border border-ink/8 p-6 pr-16 card-lift"
                >
                  {pandaMode && (
                    <PandaMoodFace mood="wink" size={38} className="absolute -top-4 left-6" />
                  )}
                  <p className="font-display text-[15px] leading-[1.75] text-ink/90">{d}</p>
                  <div className="mt-3.5 flex items-center gap-2">
                    <button
                      onClick={() => copy(d, i)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 px-3.5 py-1.5 text-[12px] font-medium text-ink/60 hover:text-jade hover:border-jade/40 transition-all"
                    >
                      {copiedIdx === i ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-jade" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy
                        </>
                      )}
                    </button>
                    <button
                      onClick={() =>
                        router.push(
                          `/create?occasion=${occasion}${theirName ? `&custom=` : ""}`
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 px-3.5 py-1.5 text-[12px] font-medium text-ink/60 hover:text-jade hover:border-jade/40 transition-all"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Put it on a card
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <p className="mt-6 text-center text-[12.5px] text-ink/40 max-w-md mx-auto leading-relaxed">
            Every draft is assembled by hand from pieces a person wrote. No model runs, no
            waiting, nothing identical twice. When one makes you feel something, that is the one.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
