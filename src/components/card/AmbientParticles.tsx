"use client";

import { motion } from "framer-motion";
import type { Theme } from "@/data/themes";
import { shade } from "./ThemeScene";

/**
 * The air around the moment.
 *
 *   OpeningBurst        the one-shot celebration when the letter rises:
 *                       theme-colored vector confetti with flutter,
 *                       hand-picked occasion glyphs, and little stars, in
 *                       three choreographed waves
 *
 *   LetterFloatAccents  the quiet crown above the presented letter: two
 *                       hearts, a sparkle and a tiny photo, bobbing
 *
 * Everything is deterministic: seeded values, identical on server and
 * client, no hydration flicker, no Math.random in render.
 */

const prand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

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
  kind: "confetti" | "heart" | "glyph" | "star";
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

/** A small paper heart for the burst waves. */
function BurstHeart({ color, size }: { color: string; size: number }) {
  return (
    <svg viewBox="0 0 24 22" width={size} height={size * 0.92} aria-hidden>
      <path
        d="M12 20.4 C6.2 15.6, 2.2 11.9, 2.2 7.6 C2.2 4.3, 4.8 2, 7.6 2 C9.5 2, 11.1 3, 12 4.7 C12.9 3, 14.5 2, 16.4 2 C19.2 2, 21.8 4.3, 21.8 7.6 C21.8 11.9, 17.8 15.6, 12 20.4 Z"
        fill={color}
      />
      <path
        d="M7 5.6 C8.6 5.2, 9.8 6.2, 10.2 7.4"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Three waves: confetti flies with a paper flutter, small hearts rise
 * like bubbles, the occasion's glyphs pop, then a few slow pieces drift
 * down like the ceiling gave up its decorations.
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
  const palette = [
    theme.colors.seal,
    shade(theme.colors.seal, 0.3),
    theme.colors.heading,
    shade(theme.colors.flap, 0.2),
  ];
  const pieces: BurstPiece[] = (() => {
    const wave1: BurstPiece[] = Array.from({ length: 18 }, (_, i) => {
      const angle = prand(i * 11 + 3) * Math.PI * 2;
      const dist = 100 + prand(i * 7 + 1) * 170;
      return {
        key: `c${i}`,
        kind: "confetti",
        x: q(Math.cos(angle) * dist),
        y: q(Math.sin(angle) * dist * 0.82 + 60 + prand(i * 5) * 80),
        rotate: q((prand(i * 13 + 9) - 0.5) * 760),
        scale: q(0.7 + prand(i * 17 + 4) * 0.7),
        delay: q(0.2 + prand(i * 3 + 6) * 0.1),
        duration: q(1.05 + prand(i * 19 + 2) * 0.35),
        color: palette[i % palette.length],
        size: q(6 + prand(i * 23 + 8) * 6),
      };
    });
    // a handful of hearts rising from the letter, like the reader's
    const waveHearts: BurstPiece[] = Array.from({ length: 6 }, (_, i) => ({
      key: `h${i}`,
      kind: "heart",
      x: q((prand(i * 29 + 13) - 0.5) * 240),
      y: q(-130 - prand(i * 31 + 7) * 130),
      rotate: q((prand(i * 37 + 3) - 0.5) * 36),
      scale: q(0.75 + prand(i * 41 + 5) * 0.55),
      delay: q(0.34 + prand(i * 43 + 1) * 0.28),
      duration: q(1.5 + prand(i * 47 + 2) * 0.5),
      color: palette[i % palette.length],
      size: q(13 + prand(i * 53 + 6) * 9),
    }));
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
    return [...wave1, ...waveHearts, ...wave2, ...wave3];
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
          ) : p.kind === "heart" ? (
            <motion.span
              key={p.key}
              className="absolute block"
              style={{ left: -p.size / 2, top: -p.size / 2, filter: "drop-shadow(0 3px 6px rgba(22,36,28,0.18))" }}
              initial={{ opacity: 0, y: 0, scale: 0.3 }}
              animate={{ opacity: [0, 0.95, 0.85, 0], y: [0, p.y * 0.55, p.y], scale: [0.3, p.scale, p.scale * 0.92], x: [0, p.x * 0.5, p.x], rotate: [0, p.rotate] }}
              transition={{ duration: p.duration, delay: p.delay, times: [0, 0.3, 0.72, 1], ease: [0.17, 0.84, 0.3, 1] }}
            >
              <BurstHeart color={p.color ?? theme.colors.seal} size={p.size} />
            </motion.span>
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
/* The crown of little things above the presented letter               */
/* ------------------------------------------------------------------ */

/**
 * While the letter is held up, a few soft glyphs bob above its top edge:
 * two hearts, a sparkle, a tiny photo. The reader's feelings, arriving
 * before they have words.
 */
export function LetterFloatAccents({ theme, reduce }: { theme: Theme; reduce: boolean }) {
  const accents = [
    { glyph: "💛", x: -86, y: -46, size: 19, delay: 0.1, dur: 3.4 },
    { glyph: "✨", x: -34, y: -78, size: 16, delay: 0.55, dur: 3.0 },
    { glyph: "📸", x: 40, y: -64, size: 18, delay: 0.32, dur: 3.8 },
    { glyph: "💚", x: 92, y: -36, size: 20, delay: 0.78, dur: 3.2 },
  ];
  return (
    <div className="pointer-events-none absolute inset-x-0 flex justify-center" aria-hidden>
      {accents.map((a, i) => (
        <motion.span
          key={i}
          className="absolute select-none"
          style={{
            fontSize: a.size,
            left: `calc(50% + ${a.x}px)`,
            top: a.y,
            filter: "drop-shadow(0 4px 8px rgba(22,36,28,0.16))",
          }}
          initial={{ opacity: 0, y: a.y + 14, scale: 0.4 }}
          animate={
            reduce
              ? { opacity: 0.9, y: a.y, scale: 1 }
              : { opacity: [0, 0.95, 0.95], y: [a.y + 14, a.y, a.y - 8, a.y], scale: [0.4, 1, 1] }
          }
          transition={{
            duration: reduce ? 0.4 : a.dur,
            delay: reduce ? 0 : a.delay,
            repeat: reduce ? 0 : Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        >
          {a.glyph}
        </motion.span>
      ))}
    </div>
  );
}
