"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Envelope, WaxShatter } from "@/components/brand/Envelope";
import { PandaMoodFace, pandaMoodForCard } from "@/components/brand/PandaMood";
import { getTheme, type Theme } from "@/data/themes";
import { REACTION_KINDS } from "@/data/signoffs";
import { cn } from "@/lib/utils";
import { cardPhotoUrl, type CardPhotoValue } from "@/lib/card-photos";
import { AmbientDrift, OpeningBurst, motifsFor } from "./AmbientParticles";
import { Play, RotateCcw, Music, Send, Heart, Check } from "lucide-react";

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

/**
 * The recipient's moment, played as one continuous movement:
 *
 *   arrived    the sealed envelope breathes, waiting
 *   pressing   the tap lands; the whole prop gives a little
 *   cracking   the wax tears: halves and debris, a puff of dust
 *   unfolding  the flap resists, then flops back past its crease
 *   rising     the letter climbs out with weight, then settles
 *   lifted     a breath with the letter held up in the air
 *   card       the letter becomes the card; the weather moves in
 *
 * Every duration is one number, scaled once for people who prefer
 * reduced motion, so the pacing stays a single decision.
 */
type Phase = "arrived" | "pressing" | "cracking" | "unfolding" | "rising" | "lifted" | "card";

const STAGE_MS: Record<Exclude<Phase, "arrived">, number> = {
  pressing: 230,
  cracking: 550,
  unfolding: 880,
  rising: 1060,
  lifted: 240,
  /** zero: the handoff rides on the tail of the lifted hold */
  card: 0,
};

/** Envelope size that fits the viewport, measured after mount so SSR and
 * hydration agree on the first frame. */
function useEnvelopeWidth(): number {
  const [width, setWidth] = useState(340);
  useEffect(() => {
    const update = () => setWidth(Math.min(360, Math.max(225, window.innerWidth - 72)));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return width;
}

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
  const timers = useRef<number[]>([]);
  const motif = motifsFor(data.occasionId, theme);
  const inEnvelopeScene = phase !== "card";

  const open = () => {
    if (phase !== "arrived") return;
    onOpened?.();
    const pace = reduce ? 0.22 : 1;
    timers.current.forEach(window.clearTimeout);

    // Chain the stages, each after the last, so the moment reads as one
    // gesture rather than a stack of effects.
    let at = 0;
    const chain: Phase[] = ["pressing", "cracking", "unfolding", "rising", "lifted", "card"];
    timers.current = chain.map((stage) => {
      const hold = STAGE_MS[stage] ?? 0;
      at += Number.isFinite(hold) ? hold * pace : 0;
      return window.setTimeout(() => setPhase(stage), at);
    });
  };

  const replay = () => {
    timers.current.forEach(window.clearTimeout);
    setPhase("arrived");
  };

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const envelopeStage =
    phase === "arrived"
      ? "sealed"
      : phase === "card"
        ? "lifted"
        : phase;

  const sealSize = Math.max(30, envelopeWidth * 0.128);
  // matches the Envelope: the wax bonds the flap's tip to the pocket
  const sealOrigin = {
    x: envelopeWidth / 2,
    y: envelopeWidth * 0.625 * 0.525 + sealSize / 2,
  };

  return (
    <div
      className="relative w-full min-h-[calc(100vh-2rem)] flex items-center justify-center overflow-hidden select-none rounded-3xl"
      style={{
        background: `radial-gradient(1200px 800px at 50% -10%, ${theme.colors.page}, ${theme.colors.paper} 60%)`,
      }}
    >
      {/* The weather. Present from the start (very sparse), settling in
          fully once the card is out. Masked away from the header. */}
      <AmbientDrift motif={motif} reduce={Boolean(reduce)} count={phase === "card" ? undefined : 7} />

      {/* The celebration, timed to the letter clearing the pocket. */}
      <AnimatePresence>
        {phase === "rising" && (
          <OpeningBurst key="burst" motif={motif} theme={theme} reduce={Boolean(reduce)} />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {inEnvelopeScene ? (
          <motion.div
            key="envelope-moment"
            className="group/moment relative z-10 flex flex-col items-center"
            initial={{ opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -26, scale: 0.95 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative">
              <motion.button
                onClick={open}
                disabled={phase !== "arrived"}
                className={cn(
                  "group relative block cursor-pointer rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade/45 focus-visible:ring-offset-4",
                  phase !== "arrived" && "cursor-default",
                )}
                aria-label={`Open the envelope for ${data.recipientName}`}
                whileHover={phase === "arrived" && !reduce ? { y: -6 } : undefined}
                whileTap={phase === "arrived" ? { scale: 0.985 } : undefined}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
              >
                {/* the idle breath, only while it waits */}
                <motion.div
                  animate={
                    phase === "arrived" && !reduce
                      ? { y: [0, -7, 0], rotate: [-0.7, 0.7, -0.7] }
                      : { y: 0, rotate: 0 }
                  }
                  transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Envelope
                    theme={theme}
                    open={false}
                    stage={envelopeStage}
                    width={envelopeWidth}
                    recipientName={data.recipientName}
                  />
                </motion.div>

                {/* wax debris, layered above the prop so it can fly past it */}
                <AnimatePresence>
                  {phase === "cracking" && (
                    <WaxShatter key="shatter" theme={theme} size={sealSize} origin={sealOrigin} />
                  )}
                </AnimatePresence>
              </motion.button>

              {/* stage whisper, only while the wax gives way */}
              <div className="pointer-events-none absolute inset-x-0 -bottom-9 flex justify-center">
                <AnimatePresence>
                  {phase === "cracking" && (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.3 }}
                      className="text-[12.5px] font-medium tracking-wide"
                      style={{ color: `${theme.colors.heading}B3` }}
                    >
                      the wax gives way
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* the invitation, only while the envelope waits */}
            <AnimatePresence>
              {phase === "arrived" && (
                <motion.div
                  key="invite"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: 0.45, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-12 px-6 text-center"
                >
                  <p className="font-display text-ink/85 text-[18px] leading-snug">
                    Panda has a little something
                    <br className="sm:hidden" /> for <strong>{data.recipientName}</strong>
                  </p>
                  <p className="mt-2 text-[13px] text-ink/55">
                    from {data.senderName} · tap the envelope to open it
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink/90 text-white/90 text-[12.5px] font-medium px-5 py-2.5 shadow-[0_10px_24px_-10px_rgba(22,36,28,0.6)] opacity-100 sm:opacity-40 sm:group-hover/moment:opacity-100 transition-opacity duration-300">
                    open it <Heart className="h-3.5 w-3.5 text-blush fill-blush" />
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* peeking panda */}
            <motion.div
              initial={{ y: 22, opacity: 0 }}
              animate={{ y: 0, opacity: phase === "arrived" ? 1 : 0 }}
              transition={{ delay: 0.65, duration: 0.5 }}
              className="pointer-events-none absolute -bottom-3 right-1 sm:right-8 rotate-6"
              aria-hidden
            >
              <PandaMoodFace mood="wink" size={68} className="drop-shadow-lg" />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 64, scale: 0.92, rotate: -1.5 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 84, damping: 15 }}
            className="relative z-10 w-full max-w-[440px] px-3 sm:px-0 py-8"
          >
            <TheCard data={data} theme={theme} mode={mode} />
            {mode === "view" && <AfterCard data={data} slug={slug ?? ""} onReplay={replay} />}
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

/* ---------------- The card itself ---------------- */

function TheCard({ data, theme, mode }: { data: CardSceneData; theme: Theme; mode: "view" | "demo" }) {
  const [songOn, setSongOn] = useState(false);
  const showExtras = data.plan === "paid" || mode === "demo";

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  });

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
        {...rise(0.12)}
        className="relative uppercase tracking-[0.3em] font-semibold text-[11px]"
        style={{ color: theme.colors.heading }}
      >
        {data.occasionLabel}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.82 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.22, type: "spring", stiffness: 130, damping: 12 }}
        className="relative"
      >
        <PandaMoodFace mood={pandaMoodForCard(theme.id, data.occasionId)} size={110} className="drop-shadow-md" />
      </motion.div>

      <motion.div
        {...rise(0.34)}
        className="relative inline-flex items-center rounded-full px-4 py-1.5 text-[13.5px] font-semibold"
        style={{ background: theme.colors.page, color: theme.colors.heading }}
      >
        Dear {data.recipientName}
      </motion.div>

      <motion.p
        {...rise(0.46)}
        className="relative font-display text-[15.5px] leading-[1.75] text-ink/90 text-balance"
      >
        {data.message}
      </motion.p>

      {/* Photos */}
      {showExtras && data.photos && data.photos.length > 0 && (
        <motion.div {...rise(0.58)} className="relative w-full">
          <div className={cn(
            "mx-auto grid w-full max-w-[340px] gap-2.5",
            data.photos.length === 1 ? "grid-cols-1" : data.photos.length === 2 ? "grid-cols-2" : "grid-cols-3"
          )}>
            {data.photos.slice(0, 5).map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9, rotate: i % 2 ? 2 : -2 }}
                animate={{ opacity: 1, scale: 1, rotate: i % 2 ? 1.5 : -1.5 }}
                transition={{ delay: 0.66 + i * 0.08, type: "spring", stiffness: 200, damping: 18 }}
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
        <motion.div {...rise(0.72)} className="relative w-full">
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
        {...rise(0.84)}
        className="relative font-display italic text-[14.5px] text-ink/75"
      >
        {data.signoff}
      </motion.p>

      {data.watermark ? (
        <motion.p {...rise(0.94)} className="relative text-[10px] text-ink/35 pt-1">
          a little message from{" "}
          <a href="/" className="link-pretty text-ink/50">
            pandamessages.com
          </a>
        </motion.p>
      ) : (
        <span className="relative h-2" />
      )}
    </motion.div>
  );
}

/* ---------------- Reactions + reply, view mode only ---------------- */

/** Where a tap happened, in viewport coordinates, so the burst can rise
 * out of the button itself rather than the middle of the screen. */
function useBurstLayer() {
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);
  const nextId = useRef(0);
  const pop = useCallback((x: number, y: number, emoji: string) => {
    const id = nextId.current++;
    setBursts((b) => [...b, { id, x, y, emoji }]);
    window.setTimeout(() => setBursts((b) => b.filter((p) => p.id !== id)), 1500);
  }, []);
  return { bursts, pop };
}

function ReactionBursts({ bursts }: { bursts: { id: number; x: number; y: number; emoji: string }[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50" aria-hidden>
      <AnimatePresence>
        {bursts.map((b) => (
          <span key={b.id} className="absolute" style={{ left: b.x, top: b.y }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                className="absolute select-none"
                style={{ fontSize: i === 0 ? 26 : 15 + (i % 3) * 4 }}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.4, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  x: [0, (i - 2) * 26, (i - 2) * 44],
                  y: [0, -70 - i * 18, -130 - i * 24],
                  scale: [0.4, i === 0 ? 1.25 : 1, 1, 0.9],
                  rotate: (i % 2 ? 1 : -1) * (10 + i * 6),
                }}
                transition={{ duration: 1.25, ease: [0.14, 0.8, 0.3, 1], delay: i * 0.045 }}
              >
                {i === 0 ? b.emoji : i % 2 ? b.emoji : "✨"}
              </motion.span>
            ))}
          </span>
        ))}
      </AnimatePresence>
    </div>
  );
}

function AfterCard({ data, slug, onReplay }: { data: CardSceneData; slug: string; onReplay: () => void }) {
  const [reacted, setReacted] = useState<Record<string, number>>({});
  const [sentKinds, setSentKinds] = useState<Set<string>>(() => new Set());
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySent, setReplySent] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [reactionError, setReactionError] = useState<string | null>(null);
  const [justPopped, setJustPopped] = useState<string | null>(null);
  const { bursts, pop } = useBurstLayer();

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

  const react = async (kind: string, emoji: string, x: number, y: number) => {
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
      pop(x, y, emoji);
      setJustPopped(kind);
      window.setTimeout(() => setJustPopped((k) => (k === kind ? null : k)), 700);
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
      transition={{ delay: 1.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mt-6 relative"
    >
      <ReactionBursts bursts={bursts} />

      <div className="rounded-[26px] border border-ink/[0.08] bg-paper/85 p-4 shadow-[0_18px_45px_-34px_rgba(22,36,28,0.65)] backdrop-blur-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13.5px] font-semibold text-ink">Leave a little feeling behind</p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink/50">
              {data.senderName} will see these on the card.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-jade/10 px-2.5 py-1 text-[10.5px] font-semibold text-jade">
            private link
          </span>
        </div>

        {/* Reactions: three across on a phone, six on a desk. Labels are
            never truncated, they wrap to a second line and every button
            keeps the same height. */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {REACTION_KINDS.map((r) => {
            const count = reacted[r.id] ?? 0;
            const sent = sentKinds.has(r.id);
            const popped = justPopped === r.id;
            return (
              <motion.button
                key={r.id}
                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  react(r.id, r.emoji, rect.left + rect.width / 2, rect.top + rect.height / 2);
                }}
                aria-pressed={sent}
                aria-label={`${r.label}${count ? `, ${count} received` : ""}`}
                whileTap={{ scale: 0.93 }}
                animate={popped ? { y: [0, -3, 0] } : { y: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                className={cn(
                  "group relative flex min-h-[74px] flex-col items-center justify-center gap-1 rounded-2xl border px-1 py-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade/45",
                  sent
                    ? "border-jade/35 bg-jade/[0.09] text-jade"
                    : "border-ink/[0.09] bg-white/75 text-ink/70 hover:-translate-y-0.5 hover:border-blush/40 hover:shadow-[0_8px_18px_-12px_rgba(22,36,28,0.5)] active:translate-y-0"
                )}
              >
                <motion.span
                  className="text-[22px] leading-none"
                  aria-hidden
                  animate={popped ? { scale: [1, 1.35, 1], rotate: [0, -8, 8, 0] } : { scale: 1 }}
                  transition={{ duration: 0.55 }}
                >
                  {r.emoji}
                </motion.span>
                <span className="flex min-h-[26px] items-center px-0.5 text-center text-[10.5px] font-semibold leading-[1.2] sm:text-[11px]">
                  {r.label}
                </span>
                <AnimatePresence>
                  {count > 0 && (
                    <motion.span
                      key={count}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-jade px-1 text-[10px] font-bold text-white shadow-[0_4px_10px_-3px_rgba(21,122,85,0.7)]"
                    >
                      {count}
                    </motion.span>
                  )}
                </AnimatePresence>
                {sent && (
                  <span className="absolute right-1.5 top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-jade text-white" aria-hidden>
                    <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
        {reactionError && <p className="mt-3 text-center text-[12.5px] text-blush" role="alert">{reactionError}</p>}

        {/* The write-back */}
        <div className="mt-5 border-t border-ink/[0.08] pt-4">
          {!replySent ? (
            replyOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
                aria-label={`Reply to ${data.senderName}`}
              >
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
                    className="w-full rounded-2xl border border-ink/12 bg-white px-4 py-3 text-[13.5px] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-jade/30"
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
                    className="sheen inline-flex items-center gap-1.5 rounded-full bg-jade px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(21,122,85,0.7)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade/35 focus-visible:ring-offset-2 transition-shadow"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {sending ? "Sending..." : "Send it back"}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  onClick={() => setReplyOpen(true)}
                  className="sheen inline-flex items-center justify-center gap-2 rounded-2xl bg-jade px-4 py-3.5 text-[13px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(21,122,85,0.65)] hover:bg-jade-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade/35 focus-visible:ring-offset-2"
                >
                  <span aria-hidden>✍️</span>
                  <span>Write {data.senderName} back</span>
                </button>
                <a
                  href={`/create?replyTo=${slug}&to=${encodeURIComponent(data.senderName)}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-ink/12 bg-white px-4 py-3.5 text-[13px] font-semibold text-ink/75 hover:border-jade/40 hover:text-jade transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade/35 focus-visible:ring-offset-2"
                >
                  <span aria-hidden>🐼</span>
                  <span>Send a card back</span>
                </a>
              </div>
            )
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3.5 rounded-2xl bg-jade/[0.08] px-4 py-3.5"
            >
              <PandaMoodFace mood="delighted" size={44} />
              <p className="text-[13px] font-medium leading-relaxed text-jade">
                Sent. {data.senderName} will find your note with this card.
              </p>
            </motion.div>
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
