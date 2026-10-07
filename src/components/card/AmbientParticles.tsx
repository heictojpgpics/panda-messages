"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Theme } from "@/data/themes";

/**
 * The air around the moment.
 *
 * Two systems live here:
 *
 *  OpeningBurst  the one-shot celebration when the letter rises, a mix of
 *                theme-colored confetti, hand-picked occasion glyphs and
 *                tiny stars, in three choreographed waves.
 *
 *  AmbientDrift  the slow weather of the card view: theme motifs falling
 *                in three depth layers, swaying like real paper, masked
 *                away from the page header so nothing ever crowds the
 *                brand bar.
 *
 * Both are deterministic: seeded values, identical on server and client,
 * no hydration flicker, no Math.random in render.
 */

const prand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Quantize to 2 decimals. Server-side rendering rounds inline style
 * floats at 6 significant digits; without this, values like
 * 49.546173509414075% hydrate against 49.5462% and React cries. */
const q = (v: number) => Math.round(v * 100) / 100;

/* ------------------------------------------------------------------ */
/* Motifs                                                              */
/* ------------------------------------------------------------------ */

/** Occasion first, wrapping second: Panda dresses for what the card is
 * saying, and the wrapping fills in when the occasion is quiet. */
export const OCCASION_MOTIFS: Record<string, string[]> = {
  birthday: ["🎂", "🎈", "🎉"],
  anniversary: ["💍", "❤️", "🥂"],
  valentines: ["💘", "🌹", "❤️"],
  "love-you": ["❤️", "🌹", "💗"],
  christmas: ["🎄", "❄️", "✨"],
  "new-baby": ["🍼", "🌙", "☁️"],
  graduation: ["🎓", "⭐", "🎉"],
  congratulations: ["🎉", "🥂", "⭐"],
  "proud-of-you": ["🌟", "🎉", "💚"],
  "new-home": ["🏡", "🗝️", "🌿"],
  "thank-you": ["🌼", "💛", "🙌"],
  "get-well": ["🌼", "💚", "☀️"],
  "good-morning": ["☀️", "💛", "🍃"],
  "good-night": ["🌙", "⭐", "✨"],
  "i-miss-you": ["💌", "🌙", "💚"],
  "sending-hug": ["🫂", "💗", "💛"],
  "sending-kiss": ["😘", "💗", "✨"],
  "forgive-me": ["🥺", "💚", "🌱"],
  sorry: ["🕊️", "💚", "🌱"],
  "thinking-of-you": ["💭", "💗", "✨"],
  "mothers-day": ["🌷", "💗", "✨"],
  "fathers-day": ["🧡", "🍃", "✨"],
};

const TEXTURE_MOTIFS: Record<Theme["colors"]["texture"], string[]> = {
  bamboo: ["🍃", "💚", "🌿"],
  petals: ["🌸", "🌼", "🌷"],
  roses: ["🌹", "❤️", "💗"],
  stars: ["✨", "⭐", "💫"],
  moon: ["🌙", "✨", "⭐"],
  velvet: ["✨", "🥂", "⭐"],
  sun: ["☀️", "✨", "🧡"],
  snow: ["❄️", "✨", "🤍"],
  leaves: ["🍁", "🍂", "🧡"],
  candles: ["🕯️", "✨", "🎂"],
  confetti: ["🎉", "✨", "💚"],
};

/** Seasons Panda quietly dresses for. Only when the card itself doesn't
 * have a strong occasion identity: a birthday card doesn't need autumn
 * leaves, and a Christmas card opened early keeps its own weather. */
function seasonalMotifs(now: Date, occasionId?: string): string[] {
  const m = now.getMonth();
  const d = now.getDate();
  const winter = m === 11 || (m === 0 && d <= 6); // late Dec into Twelfth Night
  const strongOccasion = Boolean(occasionId && OCCASION_MOTIFS[occasionId]);
  if (strongOccasion) {
    // the occasion agrees with the season, let them mix
    if (winter && occasionId === "christmas") return ["❄️"];
    if (m === 1 && occasionId === "valentines") return ["💗"];
    return [];
  }
  if (m === 1) return ["❤️", "💘"]; // February
  if (winter) return ["❄️", "⛄"];
  if (m === 9) return ["🍁", "🎃"]; // October
  if (m === 4 && d >= 24 && d <= 31) return ["🎉", "🥳"]; // graduation season, roughly
  return [];
}

export function motifsFor(occasionId: string | undefined, theme: Theme, now = new Date()): string[] {
  const primary = OCCASION_MOTIFS[occasionId ?? ""] ?? TEXTURE_MOTIFS[theme.colors.texture];
  const extra = seasonalMotifs(now, occasionId);
  return extra ? [...primary.slice(0, 2), ...extra] : primary;
}

/* ------------------------------------------------------------------ */
/* Opening burst                                                       */
/* ------------------------------------------------------------------ */

interface BurstPiece {
  key: string;
  kind: "confetti" | "glyph" | "star";
  x: number; // end offset from center, px
  y: number;
  rotate: number;
  scale: number;
  delay: number;
  duration: number;
  color?: string;
  glyph?: string;
  size: number;
}

/**
 * Three waves: confetti flies, the occasion's glyphs pop, then a few
 * slow pieces drift down like the ceiling gave up its decorations.
 */
export function OpeningBurst({
  motif,
  theme,
  reduce,
  origin = { x: "50%", y: "46%" },
}: {
  motif: string[];
  theme: Theme;
  reduce: boolean;
  origin?: { x: string; y: string };
}) {
  // Seeded values, computed in place: identical on server and client, so
  // there is nothing to synchronize and no hydration flicker. Cheap too,
  // a few dozen small objects.
  const palette = [theme.colors.seal, theme.colors.heading, theme.colors.flap, "#C9A227"];
  const pieces: BurstPiece[] = (() => {
    const wave1: BurstPiece[] = Array.from({ length: 16 }, (_, i) => {
      const angle = prand(i * 11 + 3) * Math.PI * 2;
      const dist = 90 + prand(i * 7 + 1) * 150;
      return {
        key: `c${i}`,
        kind: "confetti",
        x: q(Math.cos(angle) * dist),
        y: q(Math.sin(angle) * dist * 0.82 + 60 + prand(i * 5) * 70),
        rotate: q((prand(i * 13 + 9) - 0.5) * 720),
        scale: q(0.7 + prand(i * 17 + 4) * 0.7),
        delay: q(0.22 + prand(i * 3 + 6) * 0.08),
        duration: q(1.05 + prand(i * 19 + 2) * 0.35),
        color: palette[i % palette.length],
        size: q(5 + prand(i * 23 + 8) * 5),
      };
    });
    const wave2: BurstPiece[] = motif.slice(0, 3).map((glyph, i) => ({
      key: `g${i}`,
      kind: "glyph",
      x: q((i - 1) * 118 + (prand(i * 31 + 5) - 0.5) * 60),
      y: q(-90 - prand(i * 37 + 1) * 70),
      rotate: q((prand(i * 41 + 2) - 0.5) * 40),
      scale: 1,
      delay: q(0.42 + i * 0.09),
      duration: 1.5,
      glyph,
      size: q(21 + prand(i * 43) * 7),
    }));
    const wave3: BurstPiece[] = Array.from({ length: 7 }, (_, i) => ({
      key: `s${i}`,
      kind: "star",
      x: q((prand(i * 53 + 4) - 0.5) * 300),
      y: q(-160 - prand(i * 59 + 2) * 120),
      rotate: q((prand(i * 61 + 7) - 0.5) * 90),
      scale: q(0.6 + prand(i * 67 + 3) * 0.8),
      delay: q(0.68 + prand(i * 71 + 1) * 0.3),
      duration: q(1.3 + prand(i * 73 + 5) * 0.4),
      size: q(9 + prand(i * 79 + 6) * 7),
      color: palette[(i + 1) % palette.length],
    }));
    return [...wave1, ...wave2, ...wave3];
  })();

  if (reduce || !pieces) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden>
      <div className="absolute" style={{ left: origin.x, top: origin.y }}>
        {pieces.map((p) =>
          p.kind === "confetti" ? (
            <motion.span
              key={p.key}
              className="absolute block"
              style={{
                width: p.size,
                height: p.size * 0.62,
                borderRadius: 1.6,
                background: p.color,
                left: -p.size / 2,
                top: -p.size / 2,
              }}
              initial={{ opacity: 0, x: 0, y: 0, rotate: 0, rotateY: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: p.x,
                y: [0, p.y * 0.72, p.y],
                rotate: p.rotate,
                rotateY: [0, 180, 360, 540],
                scale: p.scale,
              }}
              transition={{ duration: p.duration, delay: p.delay, times: [0, 0.16, 0.62, 1], ease: [0.1, 0.74, 0.24, 1] }}
            />
          ) : p.kind === "glyph" ? (
            <motion.span
              key={p.key}
              className="absolute block select-none"
              style={{ fontSize: p.size, left: -p.size / 2, top: -p.size / 2, filter: "drop-shadow(0 4px 8px rgba(22,36,28,0.18))" }}
              initial={{ opacity: 0, scale: 0.3, y: 0, rotate: 0 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.22, 1, 0.94], y: [0, p.y * 0.4, p.y], rotate: p.rotate }}
              transition={{ duration: p.duration, delay: p.delay, times: [0, 0.3, 0.62, 1], ease: [0.34, 1.56, 0.64, 1] }}
            >
              {p.glyph}
            </motion.span>
          ) : (
            <motion.svg
              key={p.key}
              viewBox="0 0 24 24"
              className="absolute"
              style={{ width: p.size, height: p.size, left: -p.size / 2, top: -p.size / 2 }}
              initial={{ opacity: 0, scale: 0.4, y: 0, rotate: 0 }}
              animate={{ opacity: [0, 0.95, 0.85, 0], scale: [0.4, p.scale * 1.2, p.scale], y: [0, p.y * 0.8, p.y], rotate: p.rotate }}
              transition={{ duration: p.duration, delay: p.delay, times: [0, 0.28, 0.7, 1], ease: [0.12, 0.8, 0.3, 1] }}
            >
              <path
                d="M12 0 C13.2 8.2 15.8 10.8 24 12 C15.8 13.2 13.2 15.8 12 24 C10.8 15.8 8.2 13.2 0 12 C8.2 10.8 10.8 8.2 12 0 Z"
                fill={p.color}
              />
            </motion.svg>
          )
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ambient drift                                                       */
/* ------------------------------------------------------------------ */

interface DriftPiece {
  key: string;
  glyph: string;
  left: number; // %
  size: number; // px
  depth: 0 | 1 | 2; // far, mid, near
  duration: number; // s
  delay: number; // s (negative to distribute mid-flight)
  sway: number; // px amplitude
  swayDuration: number;
  rotate: number; // deg
}

/**
 * Falling motifs in three depths. The whole layer is masked top and
 * bottom: pieces materialize well below the page header and dissolve
 * before the fold, so the brand pill always sits in clean air. Mobile
 * density is handled by CSS (fewer pieces shown), not JS.
 */
export function AmbientDrift({
  motif,
  reduce,
  count,
}: {
  motif: string[];
  reduce: boolean;
  count?: number;
}) {
  const total = count ?? 16;
  const pieces: DriftPiece[] = Array.from({ length: total }, (_, i) => {
    const depth = (i % 3) as 0 | 1 | 2;
    const size = [13, 17, 24][depth] + prand(i * 29 + 2) * [5, 6, 8][depth];
    return {
      key: `d${i}`,
      glyph: motif[i % motif.length],
      left: q(prand(i * 31 + 7) * 92 + 2),
      depth,
      size: q(size),
      duration: q([26, 20, 15][depth] + prand(i * 37 + 3) * 8),
      delay: q(-prand(i * 41 + 1) * 22),
      sway: q(14 + prand(i * 43 + 5) * 26),
      swayDuration: q(3.4 + prand(i * 47 + 2) * 2.8),
      rotate: q((prand(i * 53 + 4) - 0.5) * 70),
    };
  });

  if (reduce || !pieces) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[5] overflow-hidden drift-mask"
      aria-hidden
    >
      {pieces.map((p, i) => (
        <span
          key={p.key}
          className={cn("drift-fall absolute top-0 will-change-transform", i >= 11 && "max-sm:hidden")}
          style={
            {
              left: `${p.left}%`,
              fontSize: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              // depth: farther pieces are dimmer, the nearest ones softly out of focus
              opacity: [0.16, 0.3, 0.44][p.depth],
              filter: p.depth === 2 ? "blur(1.1px)" : p.depth === 0 ? "blur(0.4px)" : undefined,
            } as React.CSSProperties
          }
        >
          <span
            className="drift-sway inline-block will-change-transform"
            style={
              {
                "--sway": `${p.sway}px`,
                "--sway-duration": `${p.swayDuration}s`,
                "--rotate": `${p.rotate}deg`,
                animationDelay: `${q(-prand(p.duration * 13) * 4)}s`,
              } as React.CSSProperties
            }
          >
            {p.glyph}
          </span>
        </span>
      ))}
    </div>
  );
}
