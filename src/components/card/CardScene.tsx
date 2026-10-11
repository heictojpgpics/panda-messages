"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Envelope, WaxShatter } from "@/components/brand/Envelope";
import { PandaMoodFace, pandaMoodForCard } from "@/components/brand/PandaMood";
import { getTheme, type Theme } from "@/data/themes";
import { REACTION_KINDS } from "@/data/signoffs";
import { cn } from "@/lib/utils";
import { cardPhotoUrl, type CardPhotoValue } from "@/lib/card-photos";
import { ThemeScene, worldKindFor, shade } from "./ThemeScene";
import { OpeningBurst, LetterFloatAccents, motifsFor } from "./AmbientParticles";
import { Play, RotateCcw, Music, Send, Heart, Check, Link2 } from "lucide-react";

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
 *   arrived    the sealed envelope breathes, waiting in the themed world
 *   pressing   the tap lands; the whole prop gives a little
 *   cracking   the wax tears: halves and debris, a puff of dust
 *   unfolding  the flap resists, then flops back past its crease
 *   rising     the letter climbs out with weight, then settles
 *   presented  the letter is taken up and held in the air above the
 *              sinking envelope; "For you" typography arrives beneath it
 *   letter     the letter opens for reading: photos fan out, the song
 *              leans out of its sleeve, and the feelings wait below
 *
 * Every duration is one number, scaled once for people who prefer
 * reduced motion, so the pacing stays a single decision.
 */
type Phase = "arrived" | "pressing" | "cracking" | "unfolding" | "rising" | "presented" | "letter";

const STAGE_MS: Record<Exclude<Phase, "arrived">, number> = {
  /** delay before each stage fires = the hold of the one before it */
  pressing: 230,
  cracking: 550,
  unfolding: 880,
  rising: 1060,
  /** the letter clearing the pocket takes as long as the climb */
  presented: 1060,
  /** the hold while the letter floats and the name arrives */
  letter: 2450,
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
  const inEnvelopeScene = phase !== "letter" && phase !== "presented";
  const isNight = worldKindFor(theme.id) === "night";

  const open = () => {
    if (phase !== "arrived") return;
    onOpened?.();
    const pace = reduce ? 0.22 : 1;
    timers.current.forEach(window.clearTimeout);

    // Chain the stages, each after the last, so the moment reads as one
    // gesture rather than a stack of effects.
    let at = 0;
    const chain: Phase[] = ["pressing", "cracking", "unfolding", "rising", "presented", "letter"];
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
      : phase === "letter" || phase === "presented"
        ? "lifted"
        : phase;

  const sealSize = Math.max(30, envelopeWidth * 0.128);
  // matches the Envelope: the wax bonds the flap's tip to the pocket
  const sealOrigin = {
    x: envelopeWidth / 2,
    y: envelopeWidth * 0.625 * 0.525 + sealSize / 2,
  };

  return (
    <div className="relative w-full min-h-svh select-none overflow-x-clip">
      {/* The world: full-bleed themed weather behind everything, from the
          first frame of the envelope to the last of the reactions. */}
      <div className="fixed inset-0 z-0" aria-hidden>
        <ThemeScene theme={theme} sparse={inEnvelopeScene} />
      </div>

      {/* The celebration, timed to the letter clearing the pocket. */}
      <AnimatePresence>
        {(phase === "rising" || phase === "presented") && (
          <OpeningBurst key="burst" motif={motif} theme={theme} reduce={Boolean(reduce)} />
        )}
      </AnimatePresence>

      {/* ---------------- the opening stage ----------------
          Absolutely positioned: while it plays it owns the viewport, and
          when the letter takes over it exits upward without ever pushing
          the reading flow below the fold. */}
      <AnimatePresence>
        {phase !== "letter" && (
          <motion.section
            key="opening"
            className="absolute inset-0 z-10 flex h-svh w-full flex-col items-center justify-center overflow-hidden px-3"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -46, scale: 0.985 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* the sender's line, quiet at the top of the world */}
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: phase === "presented" ? 0 : 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className={cn(
                "absolute top-[max(4.5vh,2.4rem)] left-0 right-0 text-center font-display text-[15px] sm:text-[16px]",
                isNight ? "text-white/85" : "text-ink/75",
              )}
              style={{ textShadow: isNight ? "0 1px 12px rgba(7,10,18,0.6)" : undefined }}
            >
              from {data.senderName}, with love
            </motion.p>

            {inEnvelopeScene ? (
              /* ---------- the envelope, waiting then opening ---------- */
              <motion.div
                key="envelope-moment"
                className="group/moment relative flex flex-col items-center"
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
                          className={cn(
                            "text-[12.5px] font-medium tracking-wide",
                            isNight ? "text-white/75" : "text-ink/70",
                          )}
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
                      className="mt-9 px-6 text-center"
                    >
                      <p className={cn("font-display text-[18px] leading-snug", isNight ? "text-white/90" : "text-ink/85")}>
                        Panda has a little something
                        <br className="sm:hidden" /> for <strong>{data.recipientName}</strong>
                      </p>
                      <p className={cn("mt-2 text-[13px]", isNight ? "text-white/60" : "text-ink/55")}>
                        tap the envelope to open it
                      </p>
                      <span
                        className={cn(
                          "mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12.5px] font-medium shadow-[0_10px_24px_-10px_rgba(22,36,28,0.6)] transition-opacity duration-300",
                          isNight ? "bg-white/90 text-ink" : "bg-ink/90 text-white/90",
                          "opacity-100 sm:opacity-40 sm:group-hover/moment:opacity-100",
                        )}
                      >
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
                  className="pointer-events-none absolute -bottom-6 right-1 sm:right-10 rotate-6"
                  aria-hidden
                >
                  <PandaMoodFace mood="wink" size={62} className="drop-shadow-lg" />
                </motion.div>
              </motion.div>
            ) : (
              /* ---------- presented: the letter held in the air ---------- */
              <PresentedMoment
                data={data}
                theme={theme}
                envelopeWidth={envelopeWidth}
                reduce={Boolean(reduce)}
                onOpenLetter={() => setPhase("letter")}
              />
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* ---------------- the reading flow ---------------- */}
      <AnimatePresence>
        {phase === "letter" && (
          <motion.div
            key="reading"
            initial={{ opacity: 0, y: 54 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mx-auto w-full max-w-[480px] px-3 pb-10 pt-[max(6vh,2.5rem)] sm:px-4"
          >
            <TheLetter data={data} theme={theme} mode={mode} />

            {mode === "view" && <AfterCard data={data} slug={slug ?? ""} onReplay={replay} />}
            {mode === "demo" && (
              <button
                onClick={replay}
                className={cn(
                  "mx-auto mt-6 flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors",
                  isNight
                    ? "text-white/60 hover:text-white"
                    : "text-ink/50 hover:text-jade",
                )}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Watch the opening again
              </button>
            )}

            {/* the quiet brand close, after everything else */}
            {mode === "view" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.8 }}
                className={cn(
                  "mt-8 text-center text-[11px]",
                  isNight ? "text-white/40" : "text-ink/40",
                )}
              >
                sent with 🐼{" "}
                <a href="/" className={cn("link-pretty", isNight ? "text-white/60" : "text-ink/60")}>
                  Panda Messages
                </a>
                {" · "}
                <a href="/" className={cn("link-pretty", isNight ? "text-white/60" : "text-ink/60")}>
                  make one of your own
                </a>
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Presented: the letter rises out, the envelope sinks away            */
/* ------------------------------------------------------------------ */

function PresentedMoment({
  data,
  theme,
  envelopeWidth,
  reduce,
  onOpenLetter,
}: {
  data: CardSceneData;
  theme: Theme;
  envelopeWidth: number;
  reduce: boolean;
  onOpenLetter: () => void;
}) {
  const isNight = worldKindFor(theme.id) === "night";
  return (
    <motion.div
      key="presented-moment"
      className="presented-fit relative flex w-full flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* the crown of little feelings above the letter */}
      <div className="relative w-full">
        <LetterFloatAccents theme={theme} reduce={reduce} />

        {/* the letter, taken up out of the pocket and held in the air */}
        <motion.div
          className="relative mx-auto w-full max-w-[400px]"
          initial={{ y: 90, scale: 0.9, opacity: 0, rotate: -1.4 }}
          animate={
            reduce
              ? { y: 0, scale: 1, opacity: 1, rotate: 0 }
              : { y: [90, -14, 0], scale: [0.9, 1.02, 1], opacity: [0, 1, 1], rotate: [-1.4, 0.6, 0] }
          }
          transition={
            reduce
              ? { duration: 0.4 }
              : { duration: 1.15, times: [0, 0.62, 1], ease: ["easeOut", [0.22, 1.4, 0.36, 1], [0.22, 1, 0.36, 1]] }
          }
        >
          <motion.div
            animate={reduce ? undefined : { y: [0, -7, 0], rotate: [-0.5, 0.5, -0.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          >
            <TheLetter data={data} theme={theme} mode="view" floating />
          </motion.div>
        </motion.div>
      </div>

      {/* the name, arriving beneath the held letter */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="mt-7 text-center"
      >
        <p
          className={cn(
            "font-display text-[30px] font-semibold leading-tight sm:text-[34px]",
            isNight ? "text-white" : "text-ink",
          )}
          style={{ textShadow: isNight ? "0 2px 18px rgba(7,10,18,0.55)" : undefined }}
        >
          For {data.recipientName}
        </p>
        <p className={cn("mt-1.5 text-[14px]", isNight ? "text-white/65" : "text-ink/55")}>
          with love from {data.senderName}
        </p>
        {/* a soft nudge that reading continues */}
        <motion.button
          onClick={onOpenLetter}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.45 }}
          className={cn(
            "mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-medium backdrop-blur-sm transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade/45",
            isNight
              ? "bg-white/12 text-white/85 border border-white/15"
              : "bg-white/60 text-ink/70 border border-ink/10",
          )}
        >
          read it
          <motion.span
            animate={reduce ? undefined : { y: [0, 3, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block"
          >
            ↓
          </motion.span>
        </motion.button>
      </motion.div>

      {/* the envelope, sinking out of attention below the letter */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-full -z-10"
        initial={false}
        animate={{ x: "-50%", y: 30, scale: 0.86, opacity: 0.4, filter: "blur(2.5px)" }}
        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden
      >
        <Envelope
          theme={theme}
          open={false}
          stage="lifted"
          width={envelopeWidth}
          recipientName={data.recipientName}
          letterHidden
        />
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Polaroids: real photos, fanned like they were dropped on the page   */
/* ------------------------------------------------------------------ */

function PolaroidStack({
  photos,
  photoSlug,
  theme,
  delayBase,
}: {
  photos: CardPhotoValue[];
  photoSlug: string;
  theme: Theme;
  delayBase: number;
}) {
  const [front, setFront] = useState(0);
  const count = photos.length;

  // One photo: a single proud polaroid. Two: leaning against each other.
  // Three or more: a fanned pile, tap to bring the next one forward.
  const layouts = {
    1: [{ x: 0, y: 0, r: -1.5, z: 0 }],
    2: [
      { x: -56, y: 10, r: -5, z: 0 },
      { x: 56, y: 4, r: 4.5, z: 1 },
    ],
  } as const;
  const layout =
    count === 1
      ? layouts[1]
      : count === 2
        ? layouts[2]
        : [
            { x: -74, y: 14, r: -7, z: 0 },
            { x: 0, y: -6, r: 1.5, z: 1 },
            { x: 74, y: 12, r: 7.5, z: 2 },
            { x: -38, y: 26, r: -3, z: 3 },
            { x: 40, y: 22, r: 4, z: 4 },
          ];

  return (
    <div className="relative mx-auto flex w-full items-center justify-center" style={{ minHeight: count === 1 ? 300 : 286, marginBottom: 8 }}>
      {photos.slice(0, 5).map((p, i) => {
        const spot = layout[Math.min(i, layout.length - 1)];
        const isFront =
          count === 1
            ? true
            : count === 2
              ? i === 1
              : i === front;
        return (
          <motion.button
            key={i}
            type="button"
            onClick={() => count > 2 && setFront((f) => (f + 1) % count)}
            aria-label={count > 2 ? "Bring the next photo to the front" : `Photo ${i + 1}`}
            className="absolute polaroid-paper block cursor-pointer rounded-[4px] bg-white p-[9px] pb-[34px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade/50 focus-visible:ring-offset-2"
            style={{
              width: count === 1 ? 205 : 164,
              boxShadow: isFront
                ? "0 18px 38px -14px rgba(22,36,28,0.42), 0 4px 10px -4px rgba(22,36,28,0.22)"
                : "0 8px 20px -10px rgba(22,36,28,0.32)",
              zIndex: isFront ? 20 : 10 + (spot as { z: number }).z,
            }}
            initial={{ opacity: 0, y: 46, rotate: (spot as { r: number }).r * 2.2, scale: 0.92 }}
            animate={{
              opacity: 1,
              y: (spot as { y: number }).y,
              x: (spot as { x: number }).x,
              rotate: (spot as { r: number }).r,
              scale: isFront ? 1.04 : 1,
            }}
            transition={{ delay: delayBase + i * 0.14, type: "spring", stiffness: 120, damping: 14 }}
            whileHover={{ scale: 1.07, rotate: 0, y: (spot as { y: number }).y - 8, zIndex: 30 }}
            whileTap={count > 2 ? { scale: 1.0 } : undefined}
          >
            <span className="block overflow-hidden bg-ink/5" style={{ aspectRatio: "4/4.6" }}>
              <img
                src={cardPhotoUrl(photoSlug ?? "", p) ?? ""}
                alt={`A photo of you two, number ${i + 1}`}
                className="h-full w-full object-cover"
                draggable={false}
              />
            </span>
            {/* the empty caption strip real polaroids keep */}
            <span
              className="mt-2 block text-center font-script text-[15px] leading-none"
              style={{ color: shade(theme.colors.heading, 0.05), opacity: 0.75 }}
            >
              {["you two", "that day", "so good", "us", "always"][i % 5]}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The song: a record leaning out of its sleeve                        */
/* ------------------------------------------------------------------ */

function SongSleeve({
  songId,
  theme,
  delay,
}: {
  songId: string;
  theme: Theme;
  delay: number;
}) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border border-ink/10 shadow-[0_18px_40px_-22px_rgba(22,36,28,0.55)]"
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${songId}?autoplay=1&rel=0`}
          title="Their song"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="w-full aspect-video"
        />
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={() => setOpen(true)}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="group relative mx-auto flex w-full max-w-[330px] cursor-pointer items-center gap-4 rounded-2xl border border-ink/10 bg-white/85 px-4 py-3.5 text-left shadow-[0_16px_36px_-20px_rgba(22,36,28,0.5)] backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-20px_rgba(22,36,28,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade/45"
      aria-label="Play their song"
    >
      {/* the sleeve, with the record leaning out of it */}
      <span className="relative block h-[52px] w-[86px] shrink-0" aria-hidden>
        <span
          className="absolute left-0 top-0 grid h-[52px] w-[52px] place-items-center rounded-[6px] shadow-[0_3px_8px_-3px_rgba(22,36,28,0.4)]"
          style={{ background: `linear-gradient(150deg, ${shade(theme.colors.seal, 0.12)}, ${theme.colors.seal})` }}
        >
          <Music className="h-5 w-5 text-white/95" />
        </span>
        <span
          className="scene-vinyl absolute right-0 top-1/2 block h-[44px] w-[44px] -translate-y-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle at 50% 50%, #2a2a2a 0%, #111 58%, #000 100%)",
            boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.14), 0 3px 8px -2px rgba(22,36,28,0.45)",
          }}
        >
          <span
            className="absolute left-1/2 top-1/2 block h-[16px] w-[16px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: theme.colors.seal, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.3)" }}
          />
          <span className="absolute left-1/2 top-1/2 block h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
        </span>
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-ink/90">They picked a song for this</span>
        <span className="mt-0.5 block text-[12px] text-ink/50">Press play. It goes with the words.</span>
      </span>
      <span className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blush text-white shadow-[0_6px_16px_-6px_rgba(224,96,126,0.7)] transition-transform group-hover:scale-105">
        <Play className="h-3.5 w-3.5 fill-white" />
      </span>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* The letter itself                                                   */
/* ------------------------------------------------------------------ */

function TheLetter({
  data,
  theme,
  mode,
  floating = false,
}: {
  data: CardSceneData;
  theme: Theme;
  mode: "view" | "demo";
  floating?: boolean;
}) {
  const showExtras = (data.plan === "paid" || mode === "demo") && !floating;
  const hasPhotos = Boolean(data.photos && data.photos.length > 0);

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <motion.div
      layout={!floating}
      className="relative mx-auto flex w-full max-w-[440px] flex-col items-center gap-4 overflow-hidden rounded-[26px] border border-black/[0.06] px-6 pb-7 pt-8 text-center sm:px-8"
      style={{
        background: `linear-gradient(178deg, ${shade(theme.colors.paper, 0.04)}, ${theme.colors.paper} 34%, ${shade(theme.colors.paper, -0.02)})`,
        boxShadow:
          "0 1px 2px rgba(22,36,28,0.05), 0 22px 56px -20px rgba(22,36,28,0.42), 0 70px 110px -70px rgba(22,36,28,0.38)",
      }}
    >
      {/* inner page wash + corner motifs */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(700px 300px at 50% -8%, ${theme.colors.page}, transparent 70%)` }}
        aria-hidden
      />
      <CornerMotifs theme={theme} />

      <motion.p
        {...rise(0.1)}
        className="relative uppercase tracking-[0.32em] font-semibold text-[11px]"
        style={{ color: theme.colors.heading, opacity: 0.8 }}
      >
        {data.occasionLabel}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.82 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 130, damping: 12 }}
        className="relative"
      >
        <PandaMoodFace mood={pandaMoodForCard(theme.id, data.occasionId)} size={floating ? 96 : 112} className="drop-shadow-md" />
      </motion.div>

      <motion.div
        {...rise(0.3)}
        className="relative inline-flex items-center rounded-full px-4 py-1.5 text-[13.5px] font-semibold"
        style={{ background: theme.colors.page, color: theme.colors.heading }}
      >
        Dear {data.recipientName}
      </motion.div>

      <motion.p
        {...rise(0.42)}
        className={cn(
          "relative font-display text-balance text-ink/90",
          floating ? "line-clamp-5 px-1 text-[15px] leading-[1.75]" : "px-1 text-[16px] leading-[1.85]",
        )}
      >
        {data.message}
      </motion.p>

      {floating && (
        /* while held up, the letter continues below the fold of the moment */
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
          style={{ background: `linear-gradient(180deg, transparent, ${theme.colors.paper} 82%)` }}
          aria-hidden
        />
      )}

      {/* Photos, fanned like keepsakes */}
      {showExtras && hasPhotos && (
        <motion.div {...rise(0.54)} className="relative mt-2 w-full">
          <p className="mb-1 font-display text-[15px] font-semibold text-ink/80">
            Photos from {data.senderName}
          </p>
          <PolaroidStack photos={data.photos ?? []} photoSlug={data.photoSlug ?? ""} theme={theme} delayBase={0.62} />
        </motion.div>
      )}

      {/* The song, leaning out of its sleeve */}
      {showExtras && data.songId && (
        <div className="relative mt-3 w-full">
          <SongSleeve songId={data.songId} theme={theme} delay={0.78} />
        </div>
      )}

      {/* Signature, hand-inked */}
      <motion.p
        {...rise(floating ? 0.5 : 0.88)}
        className="relative mt-1 font-script text-[27px] leading-tight text-ink/85"
      >
        {data.signoff?.trim() || `with love, ${data.senderName}`}
        <Heart className="ml-1.5 inline h-4 w-4 fill-blush text-blush align-[-2px]" aria-hidden />
      </motion.p>

      {data.watermark && !floating ? (
        <motion.p {...rise(1)} className="relative pt-1 text-[10px] text-ink/35">
          a little message from{" "}
          <a href="/" className="link-pretty text-ink/50">
            pandamessages.com
          </a>
        </motion.p>
      ) : (
        !floating && <span className="relative h-2" />
      )}
    </motion.div>
  );
}

/** Faint pressed motifs tucked into the letter's corners. */
function CornerMotifs({ theme }: { theme: Theme }) {
  const color = `${theme.colors.heading}14`;
  return (
    <div className="pointer-events-none absolute inset-3" aria-hidden>
      <svg viewBox="0 0 24 22" className="absolute left-1 top-1 h-4 w-4" style={{ fill: color }}>
        <path d="M12 20 C6 15, 2 11.5, 2 7.5 C2 4.4, 4.4 2, 7.2 2 C9.3 2, 11 3.2, 12 5 C13 3.2, 14.7 2, 16.8 2 C19.6 2, 22 4.4, 22 7.5 C22 11.5, 18 15, 12 20 Z" />
      </svg>
      <svg viewBox="0 0 24 22" className="absolute right-1 top-1 h-4 w-4 -scale-x-100" style={{ fill: color }}>
        <path d="M12 20 C6 15, 2 11.5, 2 7.5 C2 4.4, 4.4 2, 7.2 2 C9.3 2, 11 3.2, 12 5 C13 3.2, 14.7 2, 16.8 2 C19.6 2, 22 4.4, 22 7.5 C22 11.5, 18 15, 12 20 Z" />
      </svg>
      <svg viewBox="0 0 24 22" className="absolute bottom-1 left-1 h-4 w-4 -scale-y-100" style={{ fill: color }}>
        <path d="M12 20 C6 15, 2 11.5, 2 7.5 C2 4.4, 4.4 2, 7.2 2 C9.3 2, 11 3.2, 12 5 C13 3.2, 14.7 2, 16.8 2 C19.6 2, 22 4.4, 22 7.5 C22 11.5, 18 15, 12 20 Z" />
      </svg>
      <svg viewBox="0 0 24 22" className="absolute bottom-1 right-1 h-4 w-4 -scale-100" style={{ fill: color }}>
        <path d="M12 20 C6 15, 2 11.5, 2 7.5 C2 4.4, 4.4 2, 7.2 2 C9.3 2, 11 3.2, 12 5 C13 3.2, 14.7 2, 16.8 2 C19.6 2, 22 4.4, 22 7.5 C22 11.5, 18 15, 12 20 Z" />
      </svg>
    </div>
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
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/c/${slug}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Older browsers: the address bar already holds this exact link.
    }
  };

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
      transition={{ delay: 0.95, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative mt-7"
    >
      <ReactionBursts bursts={bursts} />

      {/* The closing line, the quiet end of the moment */}
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span className="h-px w-16 bg-ink/15" aria-hidden />
        <p className="font-display text-[17px] italic text-ink/65">
          made with love from {data.senderName}
        </p>
      </div>

      <div className="rounded-[26px] border border-ink/[0.08] bg-paper/85 p-4 shadow-[0_24px_60px_-34px_rgba(22,36,28,0.7)] backdrop-blur-md sm:p-5">
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

        {/* Reactions: three across on a phone, six on a desk. Every button
            is the same height: one line for the glyph, two for the label. */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {REACTION_KINDS.map((r, idx) => {
            const count = reacted[r.id] ?? 0;
            const sent = sentKinds.has(r.id);
            const popped = justPopped === r.id;
            return (
              <motion.button
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={popped ? { opacity: 1, y: [0, -3, 0] } : { opacity: 1, y: 0 }}
                transition={{
                  y: { type: "spring", stiffness: 420, damping: 18 },
                  opacity: { delay: 1 + idx * 0.05, duration: 0.35 },
                }}
                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  react(r.id, r.emoji, rect.left + rect.width / 2, rect.top + rect.height / 2);
                }}
                aria-pressed={sent}
                aria-label={`${r.label}${count ? `, ${count} received` : ""}`}
                whileTap={{ scale: 0.93 }}
                className={cn(
                  "group relative flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border px-1 py-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade/45",
                  sent
                    ? "border-jade/35 bg-jade/[0.09] text-jade"
                    : "border-ink/[0.09] bg-white/75 text-ink/70 hover:-translate-y-0.5 hover:border-blush/40 hover:shadow-[0_8px_18px_-12px_rgba(22,36,28,0.5)] active:translate-y-0"
                )}
              >
                <motion.span
                  className="flex h-7 items-center text-[22px] leading-none"
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

        {/* Quiet utilities: replay, and keeping the link */}
        <div className="mt-4 flex items-center justify-center gap-1.5 border-t border-ink/[0.06] pt-3.5 sm:gap-3">
          <button
            onClick={onReplay}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-ink/45 hover:text-jade hover:bg-jade-soft/50 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Open it again
          </button>
          <span className="h-3.5 w-px bg-ink/10" aria-hidden />
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-ink/45 hover:text-jade hover:bg-jade-soft/50 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-jade" /> : <Link2 className="h-3.5 w-3.5" />}
            {copied ? "Link copied" : "Keep this link"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
