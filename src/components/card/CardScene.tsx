"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Envelope } from "@/components/brand/Envelope";
import { PandaMoodFace, pandaMoodForCard } from "@/components/brand/PandaMood";
import { getTheme, type Theme } from "@/data/themes";
import { REACTION_KINDS } from "@/data/signoffs";
import { cn } from "@/lib/utils";
import { cardPhotoUrl, type CardPhotoValue } from "@/lib/card-photos";
import { Play, RotateCcw, Music, Send, Heart } from "lucide-react";

export interface CardSceneData {
  occasionLabel: string;
  occasionId?: string;
  recipientName: string;
  senderName: string;
  message: string;
  signoff: string;
  theme: string;
  songId?: string | null;
  photos?: CardPhotoValue[];
  photoSlug?: string;
  watermark: boolean;
  plan: "free" | "paid";
}

type Phase = "arrived" | "unsealing" | "opening" | "card";

/** Envelope size that fits the viewport, measured after mount so SSR and
 * hydration agree on the first frame. */
function useEnvelopeWidth(): number {
  const [width, setWidth] = useState(340);
  useEffect(() => {
    const update = () => setWidth(Math.min(340, Math.max(220, window.innerWidth - 80)));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return width;
}

/** Which texture drifts down during the card view, per theme. */
const DRIFT: Record<Theme["colors"]["texture"], { emoji: string; opacity: number }[]> = {
  bamboo: [{ emoji: "🍃", opacity: 0.35 }, { emoji: "💚", opacity: 0.3 }],
  petals: [{ emoji: "🌸", opacity: 0.4 }, { emoji: "🌼", opacity: 0.3 }],
  roses: [{ emoji: "🌹", opacity: 0.4 }, { emoji: "❤️", opacity: 0.25 }],
  stars: [{ emoji: "✨", opacity: 0.5 }, { emoji: "⭐", opacity: 0.3 }],
  moon: [{ emoji: "✨", opacity: 0.35 }, { emoji: "🌙", opacity: 0.4 }],
  velvet: [{ emoji: "✨", opacity: 0.3 }, { emoji: "🥂", opacity: 0.15 }],
  sun: [{ emoji: "✨", opacity: 0.4 }, { emoji: "🌅", opacity: 0.25 }],
  snow: [{ emoji: "❄️", opacity: 0.5 }, { emoji: "✨", opacity: 0.3 }],
  leaves: [{ emoji: "🍁", opacity: 0.45 }, { emoji: "🍂", opacity: 0.4 }],
  candles: [{ emoji: "✨", opacity: 0.35 }, { emoji: "🎉", opacity: 0.3 }],
  confetti: [{ emoji: "🎉", opacity: 0.4 }, { emoji: "✨", opacity: 0.45 }],
};

const REVEAL_MOTIFS: Record<Theme["colors"]["texture"], string[]> = {
  bamboo: ["💚", "🍃", "✨"],
  petals: ["🌸", "🌼", "✨"],
  roses: ["❤️", "🌹", "✨"],
  stars: ["✨", "⭐", "💫"],
  moon: ["🌙", "✨", "💌"],
  velvet: ["✨", "🥂", "⭐"],
  sun: ["☀️", "✨", "🧡"],
  snow: ["❄️", "✨", "🤍"],
  leaves: ["🍁", "✨", "🧡"],
  candles: ["🎉", "✨", "🎂"],
  confetti: ["🎉", "✨", "💚"],
};

const OCCASION_MOTIFS: Record<string, string[]> = {
  birthday: ["🎂", "🎉", "✨"],
  anniversary: ["💍", "❤️", "✨"],
  valentines: ["💘", "🌹", "✨"],
  christmas: ["🎄", "❄️", "✨"],
  "new-baby": ["🍼", "🌙", "✨"],
  graduation: ["🎓", "⭐", "✨"],
  congratulations: ["🎉", "🥂", "✨"],
  "new-home": ["🏡", "🗝️", "✨"],
  "thank-you": ["🌼", "💛", "✨"],
  "get-well": ["🌼", "💚", "✨"],
  "good-morning": ["☀️", "✨", "🍃"],
  "good-night": ["🌙", "⭐", "✨"],
  "i-miss-you": ["💌", "🌙", "✨"],
};

export function CardScene({
  data,
  mode = "view",
  slug,
  onOpened,
}: {
  data: CardSceneData;
  mode?: "view" | "demo";
  slug?: string;
  onOpened?: () => void;
}) {
  const theme = getTheme(data.theme);
  const [phase, setPhase] = useState<Phase>("arrived");
  const reduce = useReducedMotion();
  const envelopeWidth = useEnvelopeWidth();
  const openingTimers = useRef<number[]>([]);

  const open = useCallback(() => {
    if (phase !== "arrived") return;
    onOpened?.();
    setPhase("unsealing");
    const pace = reduce ? 0.35 : 1;
    openingTimers.current.forEach(window.clearTimeout);
    openingTimers.current = [
      window.setTimeout(() => setPhase("opening"), 420 * pace),
      window.setTimeout(() => setPhase("card"), 1520 * pace),
    ];
  }, [phase, onOpened, reduce]);

  const replay = () => {
    openingTimers.current.forEach(window.clearTimeout);
    setPhase("arrived");
  };

  useEffect(() => () => openingTimers.current.forEach(window.clearTimeout), []);

  const drift = DRIFT[theme.colors.texture];

  return (
    <div
      className="relative w-full min-h-[calc(100vh-2rem)] flex items-center justify-center overflow-hidden select-none rounded-3xl"
      style={{
        background: `radial-gradient(1200px 800px at 50% -10%, ${theme.colors.page}, ${theme.colors.paper} 60%)`,
      }}
    >
      {/* Ambient texture drift while the card is out */}
      <AnimatePresence>
        {phase === "card" && (
          <motion.div
            key="drift"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
            aria-hidden
          >
            {Array.from({ length: 14 }).map((_, i) => {
              const set = drift[i % drift.length];
              return (
                <span
                  key={i}
                  className="drift-piece absolute top-0"
                  style={
                    {
                      left: `${(i * 7 + 5) % 96}%`,
                      fontSize: 10 + ((i * 3) % 12),
                      "--drift-duration": `${13 + (i % 7) * 3}s`,
                      "--drift-delay": `${-(i % 9) * 2.2}s`,
                      "--drift-x": `${((i % 5) - 2) * 28}px`,
                      "--drift-opacity": set.opacity,
                    } as React.CSSProperties
                  }
                >
                  {set.emoji}
                </span>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <CelebrateReveal
        active={phase === "opening"}
        motif={OCCASION_MOTIFS[data.occasionId ?? ""] ?? REVEAL_MOTIFS[theme.colors.texture]}
        reduce={Boolean(reduce)}
      />

      <AnimatePresence mode="wait">
        {phase === "arrived" && (
          <motion.button
            key="arrived"
            onClick={open}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30, scale: 0.92 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex flex-col items-center gap-8 p-8 group cursor-pointer"
            aria-label={`Open the envelope for ${data.recipientName}`}
          >
            <motion.div
              animate={reduce ? {} : { y: [0, -8, 0], rotate: [-1, 1, -1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Envelope theme={theme} open={false} width={envelopeWidth} />
            </motion.div>

            <div className="text-center">
              <p className="font-display text-ink/80 text-[17px]">
                Panda has a little something for <strong>{data.recipientName}</strong>
              </p>
              <p className="mt-1.5 text-[13px] text-ink/50">
                from {data.senderName} · tap the envelope to open
              </p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink/90 text-white/90 text-[12.5px] font-medium px-5 py-2.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                open it <Heart className="h-3.5 w-3.5 text-blush fill-blush" />
              </span>
            </div>

            {/* peeking panda */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="absolute -bottom-2 right-4 sm:right-10 rotate-6"
              aria-hidden
            >
              <PandaMoodFace mood="wink" size={64} className="drop-shadow-lg" />
            </motion.div>
          </motion.button>
        )}

        {(phase === "unsealing" || phase === "opening") && (
          <motion.div
            key="opening"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94, y: -18 }}
            transition={{ duration: reduce ? 0.16 : 0.32 }}
            className="relative z-10"
          >
            <Envelope
              theme={theme}
              open={phase === "opening"}
              stage={phase === "unsealing" ? "unsealing" : "opening"}
              width={envelopeWidth}
            />
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: phase === "unsealing" ? 1 : 0, y: 0 }}
              className="mt-7 text-center text-[12.5px] font-medium text-ink/55"
            >
              breaking the seal...
            </motion.p>
          </motion.div>
        )}

        {phase === "card" && (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 60, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 90, damping: 16 }}
            className="relative z-10 w-full max-w-[440px] px-3 sm:px-0 py-8"
          >
            <TheCard data={data} theme={theme} mode={mode} />
            {mode === "view" && (
              <AfterCard data={data} slug={slug ?? ""} onReplay={replay} />
            )}
            {mode === "demo" && (
              <button
                onClick={replay}
                className="mt-5 mx-auto flex items-center gap-2 text-[12.5px] font-medium text-ink/50 hover:text-jade transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Watch the opening again
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CelebrateReveal({ active, motif, reduce }: { active: boolean; motif: string[]; reduce: boolean }) {
  return (
    <AnimatePresence>
      {active && !reduce && (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden>
          {Array.from({ length: 18 }).map((_, index) => {
            const angle = (index / 18) * Math.PI * 2;
            const distance = 120 + (index % 4) * 34;
            return (
              <motion.span
                key={index}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.55, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance - 72,
                  scale: [0.55, 1.15, 0.9],
                  rotate: index % 2 ? 24 : -24,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.25 + (index % 3) * 0.12, ease: [0.16, 0.84, 0.32, 1], delay: index * 0.018 }}
                className="absolute left-1/2 top-[48%] text-[18px] sm:text-[22px]"
              >
                {motif[index % motif.length]}
              </motion.span>
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- The card itself ---------------- */

function TheCard({ data, theme, mode }: { data: CardSceneData; theme: Theme; mode: "view" | "demo" }) {
  const [songOn, setSongOn] = useState(false);
  const showExtras = data.plan === "paid" || mode === "demo";

  return (
    <motion.div
      layout
      className="relative rounded-[26px] border border-black/5 text-center flex flex-col items-center px-6 sm:px-8 pt-8 pb-7 gap-4 overflow-hidden"
      style={{
        background: theme.colors.paper,
        boxShadow:
          "0 2px 4px rgba(22,36,28,0.05), 0 18px 50px -18px rgba(22,36,28,0.4), 0 60px 90px -60px rgba(22,36,28,0.35)",
      }}
    >
      {/* inner page wash */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(700px 300px at 50% -8%, ${theme.colors.page}, transparent 70%)` }} aria-hidden />

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="relative uppercase tracking-[0.3em] font-semibold text-[11px]"
        style={{ color: theme.colors.heading }}
      >
        {data.occasionLabel}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35, type: "spring", stiffness: 120, damping: 12 }}
        className="relative"
      >
        <PandaMoodFace mood={pandaMoodForCard(theme.id, data.occasionId)} size={110} className="drop-shadow-md" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative inline-flex items-center rounded-full px-4 py-1.5 text-[13.5px] font-semibold"
        style={{ background: theme.colors.page, color: theme.colors.heading }}
      >
        Dear {data.recipientName}
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="relative font-display text-[15.5px] leading-[1.75] text-ink/90 text-balance"
      >
        {data.message}
      </motion.p>

      {/* Photos */}
      {showExtras && data.photos && data.photos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="relative w-full"
        >
          <div className={cn(
            "mx-auto grid w-full max-w-[340px] gap-2.5",
            data.photos.length === 1 ? "grid-cols-1" : data.photos.length === 2 ? "grid-cols-2" : "grid-cols-3"
          )}>
            {data.photos.slice(0, 5).map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9, rotate: i % 2 ? 2 : -2 }}
                animate={{ opacity: 1, scale: 1, rotate: i % 2 ? 1.5 : -1.5 }}
                transition={{ delay: 0.8 + i * 0.08 }}
                whileHover={{ scale: 1.06, rotate: 0, zIndex: 5 }}
                className={cn(
                  "overflow-hidden rounded-2xl border-2 border-white bg-ink/5 shadow-[0_12px_24px_-16px_rgba(22,36,28,0.7)]",
                  data.photos?.length === 1 ? "aspect-[4/3]" : "aspect-square"
                )}
              >
                <img
                  src={cardPhotoUrl(data.photoSlug ?? "", p) ?? ""}
                  alt={`A photo of you two, number ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Song */}
      {showExtras && data.songId && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="relative w-full"
        >
          {songOn ? (
            <div className="rounded-2xl overflow-hidden border border-ink/10 bg-black/5">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${data.songId}?autoplay=1&rel=0`}
                title="Their song"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="w-full aspect-video"
              />
            </div>
          ) : (
            <button
              onClick={() => setSongOn(true)}
              className="w-full flex items-center gap-3.5 rounded-2xl border border-ink/10 bg-white/60 px-4 py-3 hover:border-blush/40 transition-all group"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-blush text-white shadow-[0_6px_16px_-6px_rgba(224,96,126,0.7)] group-hover:scale-105 transition-transform">
                <Play className="h-4 w-4 fill-white" />
              </span>
              <span className="text-left">
                <span className="block text-[13.5px] font-semibold text-ink/85">Play their song</span>
                <span className="block text-[11.5px] text-ink/45">It goes with the words. Trust us.</span>
              </span>
              <Music className="ml-auto h-4 w-4 text-ink/30" />
            </button>
          )}
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.95 }}
        className="relative text-[13px] text-ink/70"
      >
        {data.signoff}
      </motion.p>

      {data.watermark ? (
        <p className="relative text-[10px] text-ink/35 pt-1">
          a little message from{" "}
          <a href="/" className="link-pretty text-ink/50">
            pandamessages.com
          </a>
        </p>
      ) : (
        <span className="relative h-2" />
      )}
    </motion.div>
  );
}

/* ---------------- Reactions + reply, view mode only ---------------- */

function AfterCard({ data, slug, onReplay }: { data: CardSceneData; slug: string; onReplay: () => void }) {
  const [reacted, setReacted] = useState<Record<string, number>>({});
  const [sentKinds, setSentKinds] = useState<Set<string>>(() => new Set());
  const [burst, setBurst] = useState<{ id: number; emoji: string }[]>([]);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySent, setReplySent] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [reactionError, setReactionError] = useState<string | null>(null);
  const burstId = useRef(0);

  useEffect(() => {
    let live = true;
    fetch(`/api/cards/${slug}/reactions`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!live || !body?.counts) return;
        setReacted(Object.fromEntries(body.counts.map((item: { kind: string; count: number }) => [item.kind, item.count])));
      })
      .catch(() => {});
    return () => { live = false; };
  }, [slug]);

  const react = async (kind: string, emoji: string) => {
    if (sentKinds.has(kind)) return;
    setReactionError(null);
    try {
      const res = await fetch(`/api/cards/${slug}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReactionError(body.error ?? "That reaction did not make it through. Try again.");
        return;
      }
      if (!body.fresh) {
        setSentKinds((kinds) => new Set(kinds).add(kind));
        setReactionError("That one is already tucked into the envelope.");
        return;
      }
      setReacted((r) => ({ ...r, [kind]: (r[kind] ?? 0) + 1 }));
      setSentKinds((kinds) => new Set(kinds).add(kind));
      const id = burstId.current++;
      setBurst((b) => [...b, { id, emoji }]);
      setTimeout(() => setBurst((b) => b.filter((x) => x.id !== id)), 2400);
    } catch {
      setReactionError("The connection hiccuped. Try once more?");
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/cards/${slug}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText }),
      });
      if (res.ok) {
        setReplySent(true);
        setReplyText("");
      } else {
        const body = await res.json().catch(() => ({}));
        setReplyError(body.error ?? "The reply did not go through. Try once more?");
      }
    } catch {
      setReplyError("The connection hiccuped. Try once more?");
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1 }}
      className="mt-6 relative"
    >
      {/* Burst layer */}
      <div className="pointer-events-none fixed inset-0 z-40" aria-hidden>
        <AnimatePresence>
          {burst.map((b) => (
            <motion.span
              key={b.id}
              initial={{ opacity: 0, y: 40, scale: 0.6, x: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: [40, -140 - Math.random() * 80],
                x: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 220],
                scale: [0.6, 1.15, 1],
                rotate: (Math.random() - 0.5) * 120,
              }}
              transition={{ duration: 2.2, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 text-4xl"
            >
              {b.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <div className="rounded-[26px] border border-ink/[0.08] bg-paper/80 p-4 shadow-[0_18px_45px_-34px_rgba(22,36,28,0.65)] backdrop-blur-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13.5px] font-semibold text-ink">Leave a little feeling behind</p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink/50">
              {data.senderName} will see the reactions on this card.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-jade/10 px-2.5 py-1 text-[10.5px] font-semibold text-jade">
            private link
          </span>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {REACTION_KINDS.map((r) => {
            const count = reacted[r.id] ?? 0;
            const sent = sentKinds.has(r.id);
            return (
              <button
                key={r.id}
                onClick={() => react(r.id, r.emoji)}
                aria-pressed={sent}
                aria-label={`${r.label}${count ? `, ${count} received` : ""}`}
                className={cn(
                  "relative flex min-h-[72px] flex-col items-center justify-center gap-0.5 rounded-2xl border px-1.5 py-2 text-[10px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade/45 sm:min-h-[78px] sm:text-[11px]",
                  sent
                    ? "border-jade/35 bg-jade/10 text-jade"
                    : "border-ink/[0.09] bg-white/70 text-ink/70 hover:-translate-y-0.5 hover:border-blush/40 hover:shadow-[0_8px_18px_-12px_rgba(22,36,28,0.5)] active:translate-y-0"
                )}
              >
                <span className="text-xl leading-none sm:text-[22px]" aria-hidden>{r.emoji}</span>
                <span className="max-w-full truncate px-1">{r.label}</span>
                {count > 0 && (
                  <span className="absolute right-1.5 top-1.5 grid min-w-4 h-4 place-items-center rounded-full bg-ink/[0.08] px-1 text-[9px] font-bold text-ink/60">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {reactionError && <p className="mt-3 text-center text-[12.5px] text-blush" role="alert">{reactionError}</p>}

        <div className="mt-5 border-t border-ink/[0.08] pt-4">
          {!replySent ? (
            replyOpen ? (
              <div className="space-y-3" aria-label={`Reply to ${data.senderName}`}>
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-blush/10 text-sm" aria-hidden>✍️</span>
                  <div>
                    <p className="text-[13px] font-semibold text-ink">A note from {data.recipientName}</p>
                    <p className="text-[11px] text-ink/45">It goes straight back to {data.senderName}.</p>
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value.slice(0, 400))}
                    placeholder={`Say something back to ${data.senderName}...`}
                    aria-label={`Say something back to ${data.senderName}`}
                    rows={3}
                    className="w-full rounded-2xl border border-ink/12 bg-white px-4 py-3 text-[13.5px] resize-none focus:outline-none focus:ring-2 focus:ring-jade/30"
                  />
                  {replyText.length > 300 && (
                    <span className="absolute bottom-2 right-3 text-[10.5px] tabular-nums text-ink/35">
                      {400 - replyText.length} left
                    </span>
                  )}
                </div>
                {replyError && (
                  <p className="text-[12.5px] text-blush" role="alert">{replyError}</p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setReplyOpen(false)}
                    className="rounded-full px-3 py-2 text-[13px] text-ink/50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade/35"
                  >
                    Not now
                  </button>
                  <button
                    onClick={sendReply}
                    disabled={!replyText.trim() || sending}
                    className="sheen inline-flex items-center gap-1.5 rounded-full bg-jade px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade/35 focus-visible:ring-offset-2"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {sending ? "Sending..." : "Send it back"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setReplyOpen(true)}
                  className="inline-flex min-w-0 justify-center items-center gap-1.5 rounded-2xl border border-ink/12 bg-white px-3 py-3 text-[12px] font-semibold text-ink/75 hover:border-jade/40 hover:text-jade transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade/35 sm:text-[13px]"
                >
                  <span aria-hidden>✍️</span><span className="truncate">Write back</span>
                </button>
                <a
                  href={`/create?replyTo=${slug}&to=${encodeURIComponent(data.senderName)}`}
                  className="inline-flex min-w-0 justify-center items-center gap-1.5 rounded-2xl bg-ink px-3 py-3 text-[12px] font-semibold text-white hover:bg-ink/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/35 focus-visible:ring-offset-2 sm:text-[13px]"
                >
                  <span aria-hidden>🐼</span><span className="truncate">Send one back</span>
                </a>
              </div>
            )
          ) : (
            <motion.p
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl bg-jade/[0.08] px-4 py-3 text-center text-[13px] font-medium text-jade"
            >
              Sent. {data.senderName} will find your note with this card.
            </motion.p>
          )}
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={onReplay}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink/45 hover:text-jade transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Open it again (some people do)
          </button>
        </div>
      </div>
    </motion.div>
  );
}
