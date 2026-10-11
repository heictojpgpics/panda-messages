"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Theme } from "@/data/themes";

/**
 * The world the card lives in.
 *
 * A full-screen scene painted from the theme: a layered dusk wash, soft
 * bokeh light breathing behind everything, a slow field of little paper
 * pieces (hearts, crosses, rings, dots) drifting down like the room is
 * full of celebrations past, and — for the night wrappings – a moon,
 * twinkling stars and the occasional shooting star.
 *
 * Everything is deterministic (seeded), so server and client paint the
 * same first frame and hydration stays quiet.
 */

const prand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const q = (v: number) => Math.round(v * 100) / 100;

/** Lighten (amount > 0) or darken (amount < 0) a hex color. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const f = (c: number) =>
    Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));
  const to = (v: number) => v.toString(16).padStart(2, "0");
  return `#${to(f(r))}${to(f(g))}${to(f(b))}`;
}

/** Mix two hex colors, t = 0 keeps a, t = 1 is all b. */
export function mix(a: string, b: string, t: number): string {
  const na = parseInt(a.slice(1), 16);
  const nb = parseInt(b.slice(1), 16);
  const f = (sh: number) => {
    const ca = (na >> sh) & 255;
    const cb = (nb >> sh) & 255;
    return Math.round(ca + (cb - ca) * t);
  };
  const to = (v: number) => v.toString(16).padStart(2, "0");
  return `#${to(f(16))}${to(f(8))}${to(f(0))}`;
}

/* ------------------------------------------------------------------ */
/* World classification                                                */
/* ------------------------------------------------------------------ */

type WorldKind = "warm" | "night" | "garden";

const NIGHT_THEMES = new Set([
  "long-distance",
  "moonlit-garden",
  "midnight-velvet",
  "night-market",
]);
const WARM_THEMES = new Set([
  "golden-hour",
  "birthday-bash",
  "confetti-pop",
  "autumn-leaves",
]);

export function worldKindFor(themeId: string): WorldKind {
  if (NIGHT_THEMES.has(themeId)) return "night";
  if (WARM_THEMES.has(themeId)) return "warm";
  return "garden";
}

/* ------------------------------------------------------------------ */
/* Confetti pieces: little vector papers, not emoji                    */
/* ------------------------------------------------------------------ */

type ConfettiShape = "heart" | "cross" | "ring" | "dot" | "star" | "flutter";

interface ConfettiPiece {
  key: string;
  shape: ConfettiShape;
  left: number; // %
  size: number; // px
  depth: 0 | 1 | 2;
  duration: number; // s per full fall
  phase: number; // 0..1, stratified so frame one is already mid-weather
  sway: number; // px
  swayDuration: number;
  rotate: number; // deg
  color: string;
  opacity: number;
}

const CONFETTI_SHAPES: ConfettiShape[] = ["heart", "cross", "ring", "dot", "star", "flutter"];

function ConfettiGlyph({ shape, size, color }: { shape: ConfettiShape; size: number; color: string }) {
  switch (shape) {
    case "heart":
      return (
        <svg viewBox="0 0 24 22" width={size} height={size * 0.92}>
          <path
            d="M12 20.4 C6.2 15.6, 2.2 11.9, 2.2 7.6 C2.2 4.3, 4.8 2, 7.6 2 C9.5 2, 11.1 3, 12 4.7 C12.9 3, 14.5 2, 16.4 2 C19.2 2, 21.8 4.3, 21.8 7.6 C21.8 11.9, 17.8 15.6, 12 20.4 Z"
            fill={color}
          />
        </svg>
      );
    case "cross":
      return (
        <svg viewBox="0 0 20 20" width={size} height={size}>
          <path
            d="M4.2 4.2 L15.8 15.8 M15.8 4.2 L4.2 15.8"
            stroke={color}
            strokeWidth={Math.max(1.6, size * 0.16)}
            strokeLinecap="round"
          />
        </svg>
      );
    case "ring":
      return (
        <svg viewBox="0 0 20 20" width={size} height={size}>
          <circle
            cx="10"
            cy="10"
            r="6.4"
            fill="none"
            stroke={color}
            strokeWidth={Math.max(1.5, size * 0.15)}
          />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size}>
          <path
            d="M12 1 C13 8, 16 11, 23 12 C16 13, 13 16, 12 23 C11 16, 8 13, 1 12 C8 11, 11 8, 12 1 Z"
            fill={color}
          />
        </svg>
      );
    case "flutter":
      // a tiny paper butterfly: two triangles that read as wings at 12px
      return (
        <svg viewBox="0 0 24 18" width={size} height={size * 0.75}>
          <path d="M11.4 9 C7 2.4, 1.6 2.8, 2.6 7.6 C3.4 11.4, 8.2 11.6, 11.4 9 Z" fill={color} />
          <path d="M12.6 9 C17 2.4, 22.4 2.8, 21.4 7.6 C20.6 11.4, 15.8 11.6, 12.6 9 Z" fill={color} />
          <rect x="11.5" y="4.4" width="1.2" height="10" rx="0.6" fill={color} opacity="0.7" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 12 12" width={size} height={size}>
          <circle cx="6" cy="6" r="4.4" fill={color} />
        </svg>
      );
  }
}

/**
 * The confetti weather. Stratified phases (slot + jitter per piece) so the
 * very first painted frame already shows pieces at every height — the room
 * is full from the start, nothing pours in from the top edge.
 */
export function ConfettiField({
  theme,
  kind,
  reduce,
  count,
}: {
  theme: Theme;
  kind: WorldKind;
  reduce: boolean;
  count?: number;
}) {
  const total = count ?? 26;
  const palette = [
    theme.colors.seal,
    shade(theme.colors.seal, 0.28),
    theme.colors.heading,
    shade(theme.colors.flap, 0.18),
  ];
  const pieces: ConfettiPiece[] = Array.from({ length: total }, (_, i) => {
    const depth = (i % 3) as 0 | 1 | 2;
    const size = [8, 11, 15][depth] + prand(i * 29 + 2) * [3, 4, 6][depth];
    const duration = [30, 24, 18][depth] + prand(i * 37 + 3) * 9;
    const phase = i / total + prand(i * 41 + 1) * (0.6 / total);
    return {
      key: `cf${i}`,
      shape: CONFETTI_SHAPES[i % CONFETTI_SHAPES.length],
      left: q((((i * 61) % 97) / 97) * 94 + 1.5 + prand(i * 43 + 9) * 3),
      depth,
      size: q(size),
      duration: q(duration),
      phase: q(phase),
      sway: q(12 + prand(i * 47 + 5) * 22),
      swayDuration: q(3.6 + prand(i * 53 + 2) * 3.2),
      rotate: q((prand(i * 59 + 4) - 0.5) * 60),
      color: palette[i % palette.length],
      opacity: [0.5, 0.66, 0.85][depth],
    };
  });

  if (reduce) {
    // Still air: the pieces hang where they are, so the world keeps its
    // decoration without motion.
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {pieces.slice(0, 14).map((p) => (
          <span
            key={p.key}
            className="absolute"
            style={{
              left: `${p.left}%`,
              top: `${q((p.phase * 130) % 100)}%`,
              opacity: p.opacity * 0.8,
              transform: `rotate(${p.rotate}deg)`,
            }}
          >
            <ConfettiGlyph shape={p.shape} size={p.size} color={p.color} />
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={p.key}
          className="scene-confetti-fall absolute top-0 will-change-transform"
          style={
            {
              left: `${p.left}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${q(-p.phase * p.duration)}s`,
              opacity: p.opacity,
              filter: p.depth === 2 ? "blur(0.8px)" : p.depth === 0 ? "blur(0.5px)" : undefined,
              ...(i >= 18 ? { ["--hide-mobile" as string]: "1" } : {}),
            } as React.CSSProperties
          }
        >
          <span
            className="scene-confetti-sway inline-block will-change-transform"
            style={
              {
                "--sway": `${p.sway}px`,
                "--sway-duration": `${p.swayDuration}s`,
                "--rotate": `${p.rotate}deg`,
                animationDelay: `${q(-prand(p.duration * 13) * 4)}s`,
              } as React.CSSProperties
            }
          >
            <ConfettiGlyph shape={p.shape} size={p.size} color={p.color} />
          </span>
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bokeh: the soft lights behind everything                            */
/* ------------------------------------------------------------------ */

interface BokehOrb {
  key: string;
  left: number; // %
  top: number; // %
  size: number; // px
  color: string;
  opacity: number;
  driftX: number; // px, gentle wander
  driftY: number;
  duration: number; // s per breathe
  delay: number;
}

/**
 * Six to nine huge, heavily blurred light circles that breathe and wander
 * a few pixels — the glow of a room full of candles, out of focus. In the
 * night worlds they read as distant lanterns.
 */
function BokehLights({ theme, kind, reduce }: { theme: Theme; kind: WorldKind; reduce: boolean }) {
  const total = 8;
  const palette =
    kind === "night"
      ? [shade(theme.colors.seal, 0.1), shade(theme.colors.flap, 0.35), theme.colors.seal]
      : [shade(theme.colors.seal, 0.22), shade(theme.colors.flap, 0.35), shade(theme.colors.envelope, 0.3)];
  const orbs: BokehOrb[] = Array.from({ length: total }, (_, i) => {
    const size = 190 + prand(i * 31 + 7) * 300;
    return {
      key: `bo${i}`,
      left: q(prand(i * 17 + 3) * 88 - 4),
      top: q(prand(i * 23 + 11) * 78 - 6),
      size: q(size),
      color: palette[i % palette.length],
      opacity: q((kind === "night" ? 0.22 : 0.24) + prand(i * 13 + 5) * (kind === "night" ? 0.16 : 0.14)),
      driftX: q((prand(i * 41 + 2) - 0.5) * 46),
      driftY: q((prand(i * 43 + 8) - 0.5) * 38),
      duration: q(9 + prand(i * 47 + 1) * 7),
      delay: q(-prand(i * 53 + 4) * 8),
    };
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {orbs.map((o) => (
        <motion.span
          key={o.key}
          className="absolute rounded-full"
          style={{
            left: `${o.left}%`,
            top: `${o.top}%`,
            width: o.size,
            height: o.size,
            background: `radial-gradient(closest-side, ${mix(o.color, "#FFFFFF", 0.25)}, ${o.color} 52%, transparent 74%)`,
            opacity: 0.8,
            filter: "blur(26px)",
          }}
          initial={false}
          animate={
            reduce
              ? undefined
              : {
                  x: [0, o.driftX, 0],
                  y: [0, o.driftY, 0],
                  scale: [1, 1.14, 1],
                  opacity: [0.85, 1, 0.85],
                }
          }
          transition={{
            duration: o.duration,
            delay: o.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Night sky: moon, stars, one shooting star                           */
/* ------------------------------------------------------------------ */

function MoonAndStars({ theme, reduce }: { theme: Theme; reduce: boolean }) {
  const stars = Array.from({ length: 34 }, (_, i) => ({
    key: `st${i}`,
    left: q(prand(i * 19 + 3) * 98),
    top: q(prand(i * 29 + 7) * 72),
    size: q(1.4 + prand(i * 31 + 2) * 2.2),
    twinkleDuration: q(2.6 + prand(i * 37 + 5) * 3.4),
    twinkleDelay: q(-prand(i * 41 + 1) * 4),
    opacity: q(0.4 + prand(i * 43 + 9) * 0.5),
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* the moon, with its craters, high and to the right */}
      <motion.div
        className="absolute"
        style={{ right: "11%", top: "7%" }}
        initial={false}
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 100 100" width={86} height={86} style={{ filter: "drop-shadow(0 0 26px rgba(250,240,200,0.4))" }}>
          <defs>
            <radialGradient id="scene-moon" cx="38%" cy="34%" r="80%">
              <stop offset="0%" stopColor="#FFF9E3" />
              <stop offset="70%" stopColor="#F6E7B8" />
              <stop offset="100%" stopColor="#E8D190" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="40" fill="url(#scene-moon)" />
          <circle cx="38" cy="40" r="7.5" fill="#E3CE96" opacity="0.55" />
          <circle cx="60" cy="58" r="5.5" fill="#E3CE96" opacity="0.45" />
          <circle cx="52" cy="34" r="3.6" fill="#E3CE96" opacity="0.4" />
          <circle cx="33" cy="60" r="3" fill="#E3CE96" opacity="0.35" />
        </svg>
      </motion.div>

      {/* twinkling stars */}
      {stars.map((s) => (
        <span
          key={s.key}
          className="scene-star absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animationDuration: `${s.twinkleDuration}s`,
            animationDelay: `${s.twinkleDelay}s`,
            boxShadow: "0 0 6px rgba(255,255,255,0.8)",
          }}
        />
      ))}

      {/* one shooting star every little while */}
      {!reduce && (
        <motion.span
          className="absolute"
          style={{
            left: "62%",
            top: "16%",
            width: 120,
            height: 2,
            borderRadius: 2,
            background: "linear-gradient(90deg, rgba(255,255,255,0.95), transparent)",
            rotate: -24,
          }}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 0.9, 0],
            x: [0, -180],
            y: [0, 84],
          }}
          transition={{
            duration: 1.1,
            delay: 4.5,
            repeat: Infinity,
            repeatDelay: 9,
            ease: "easeOut",
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The scene                                                           */
/* ------------------------------------------------------------------ */

/**
 * The full-screen world. Layer order: base washes, night sky, bokeh,
 * confetti. Content renders above it. Sits behind the whole experience.
 */
export function ThemeScene({
  theme,
  reduce: reduceProp,
  sparse,
}: {
  theme: Theme;
  reduce?: boolean;
  /** While the envelope waits: fewer pieces, softer lights. The weather
   * settles in fully once the card is out. */
  sparse?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const reduce = reduceProp ?? Boolean(reduceMotion);
  const kind = worldKindFor(theme.id);

  // Night worlds get their own deep ink; warm and garden worlds take a
  // real tint of the wrapping (a peach room, a rose room), not a white one.
  const isNight = kind === "night";
  const baseTop = isNight
    ? shade(theme.colors.flap, -0.28)
    : mix(theme.colors.page, theme.colors.flap, 0.34);
  const baseMid = isNight ? theme.colors.flap : mix(theme.colors.page, theme.colors.flap, 0.16);
  const baseLow = isNight
    ? shade(theme.colors.envelope, -0.12)
    : mix(theme.colors.page, theme.colors.envelope, 0.22);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* base wash */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${baseTop} 0%, ${baseMid} 46%, ${baseLow} 100%)`,
        }}
      />
      {/* the warm pool of light the subject sits in */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 80% at 50% 32%, ${mix(
            isNight ? shade(theme.colors.seal, 0.06) : shade(theme.colors.seal, 0.24),
            theme.colors.envelope,
            0.45,
          )} 0%, transparent 58%)`,
          opacity: isNight ? 0.35 : 0.5,
        }}
      />
      {/* a second glow low on the page, like light off paper */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(90% 48% at 50% 110%, ${mix(theme.colors.flap, theme.colors.envelope, 0.5)} 0%, transparent 68%)`,
          opacity: isNight ? 0.5 : 0.4,
        }}
      />

      {isNight && <MoonAndStars theme={theme} reduce={reduce} />}
      <BokehLights theme={theme} kind={kind} reduce={reduce} />
      <ConfettiField theme={theme} kind={kind} reduce={reduce} count={sparse ? 12 : undefined} />
    </div>
  );
}
