"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Theme } from "@/data/themes";

/**
 * The envelope. The single most important object in the product.
 *
 * Built like a physical prop, in true layer order:
 *
 *   back        the pocket's inside back
 *   interior    the dark mouth band at the top
 *   letter      rests fully inside; climbs out through the mouth
 *   front       the addressed face, from the mouth's lower lip down
 *   flap        sealed over the mouth, then FOLDS back around the top
 *               crease inside a true perspective viewport, coming to
 *               rest against the back panel, liner showing
 *   lip         the back panel's top edge, always painted over the
 *               crease so the flap reads as attached behind it
 *   seal        hand-poured wax bonding the flap tip to the pocket
 *
 * The letter is only ever visible above the mouth line or inside the
 * dark slit: it never pokes through a sealed envelope. The whole stack
 * is clipped at the bottom edge (paper does not exist below the
 * envelope) but free above, where the flap stands up and the letter
 * rises. Z order is explicit: while the flap covers the face it lives
 * above it; once it rests behind, the letter climbs past in front.
 *
 * Stages: sealed → pressing → cracking → unfolding → rising → lifted.
 * Legacy callers may keep passing `open` or the old `unsealing` /
 * `opening` stages; they map onto the sequence automatically.
 */

/** Deterministic pseudo-random in [0, 1). Same on server and client, so
 * hydration never flickers, and every render is identical. */
const prand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Quantize to 2 decimals. SSR rounds inline style floats at 6 significant
 * digits; quantized values are identical on both sides, so hydration
 * stays quiet. */
const q = (v: number) => Math.round(v * 100) / 100;

/** Lighten (amount > 0) or darken (amount < 0) a hex color. */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const f = (c: number) =>
    Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));
  const to = (v: number) => v.toString(16).padStart(2, "0");
  return `#${to(f(r))}${to(f(g))}${to(f(b))}`;
}

/** Fine paper grain, the single cheapest way to make flat color read as
 * material. Inset overlay, never affects layout. */
function PaperGrain({ strength = 0.5, className }: { strength?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        opacity: strength,
        mixBlendMode: "multiply",
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.16'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* The wax seal                                                        */
/* ------------------------------------------------------------------ */

/** The hand-poured blob. Slightly irregular on purpose: perfect circles
 * read as stickers, wobble reads as wax. */
const WAX_BLOB =
  "M50 4.5 C66.5 3.5 84.5 13 91.5 30.5 C97.5 45 95.5 62.5 86 74.5 C92.5 77.5 94 82.5 92.5 85.5 C90.5 89 84 89 79.5 86.5 C70.5 94.5 57 98.5 44 95.5 C40.5 99 34.5 99.5 31.5 96 C28.5 92.5 30 87.5 33.5 84.5 C20.5 77.5 10 64 8.5 47.5 C7 31.5 15 15.5 29 8.5 C35.5 5.2 42.8 5 50 4.5 Z";

export function EnvelopeSeal({ theme, size = 34 }: { theme: Theme; size?: number }) {
  const base = theme.colors.seal;
  return (
    <span
      className="relative block"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" className="h-full w-full" style={{ filter: `drop-shadow(0 ${q(size * 0.05)}px ${q(size * 0.09)}px rgba(22,36,28,0.38))` }}>
        <defs>
          <radialGradient id={`waxbody-${theme.id}`} cx="36%" cy="30%" r="80%">
            <stop offset="0%" stopColor={shade(base, 0.3)} />
            <stop offset="55%" stopColor={base} />
            <stop offset="100%" stopColor={shade(base, -0.32)} />
          </radialGradient>
          <radialGradient id={`waxgloss-${theme.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d={WAX_BLOB} fill={`url(#waxbody-${theme.id})`} />
        {/* pressed rim: dark where wax piles, light on the far lip */}
        <path d={WAX_BLOB} fill="none" stroke={shade(base, -0.42)} strokeWidth="2.4" opacity="0.55" />
        <path d={WAX_BLOB} fill="none" stroke={shade(base, 0.35)} strokeWidth="1.1" opacity="0.5" transform="translate(0.6,0.9)" />
        {/* embossed ring, pressed into the wax */}
        <circle cx="50" cy="49" r="31.5" fill="none" stroke={shade(base, -0.4)} strokeWidth="1.6" opacity="0.5" />
        <path d="M22 46 A28.5 28.5 0 0 1 50 20.5" fill="none" stroke={shade(base, 0.42)} strokeWidth="1.8" opacity="0.7" strokeLinecap="round" />
        {/* the panda, stamped in rather than printed on */}
        <clipPath id={`pandaclip-${theme.id}`}>
          <circle cx="50" cy="49" r="27" />
        </clipPath>
        <g clipPath={`url(#pandaclip-${theme.id})`}>
          <image href="/panda/d-center.png" x="25" y="24" width="50" height="50" preserveAspectRatio="xMidYMid meet" style={{ mixBlendMode: "multiply" }} />
        </g>
        <circle cx="50" cy="49" r="27" fill="none" stroke={shade(base, -0.45)} strokeWidth="1.4" opacity="0.35" />
        {/* wet highlight */}
        <ellipse cx="37" cy="27" rx="15" ry="8.5" transform="rotate(-24 37 27)" fill={`url(#waxgloss-${theme.id})`} />
      </svg>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* The stamp and postmark                                              */
/* ------------------------------------------------------------------ */

function Stamp({ theme, size }: { theme: Theme; size: number }) {
  return (
    <div
      className="absolute grid place-items-center"
      style={{
        width: size,
        height: q(size * 1.18),
        right: "8%",
        top: "3%",
        background: `linear-gradient(155deg, ${shade(theme.colors.paper, 0.05)}, ${shade(theme.colors.paper, -0.06)})`,
        borderRadius: q(size * 0.08),
        boxShadow:
          "inset 0 0 0 1.5px rgba(22,36,28,0.08), 0 1px 3px rgba(22,36,28,0.12)",
        backgroundImage:
          "radial-gradient(circle at 50% 50%, transparent 62%, rgba(255,255,255,0.9) 64%), radial-gradient(rgba(22,36,28,0.16) 0.9px, transparent 1px)",
        backgroundSize: "100% 100%, 5px 5px",
      }}
      aria-hidden
    >
      <div
        className="grid place-items-center rounded-[3px]"
        style={{
          width: "78%",
          height: "80%",
          background: `linear-gradient(160deg, ${shade(theme.colors.envelope, 0.14)}, ${theme.colors.envelope})`,
          border: `1px solid rgba(255,255,255,0.5)`,
        }}
      >
        <img
          src="/panda/d-center.png"
          alt=""
          width={q(size * 0.42)}
          height={q(size * 0.42)}
          className="object-contain"
          draggable={false}
          style={{ filter: "saturate(0.92) contrast(1.04)" }}
        />
      </div>
      <span
        className="absolute -bottom-[3px] -right-[3px] rounded-[2px] text-[6.5px] font-bold leading-none tracking-wide"
        style={{
          background: theme.colors.seal,
          color: shade(theme.colors.seal, 0.75),
          padding: "1.5px 2.5px",
        }}
      >
        1st
      </span>
    </div>
  );
}

/** The cancellation mark, laid across the stamp corner like real mail. */
function Postmark({ theme, size }: { theme: Theme; size: number }) {
  return (
    <svg
      viewBox="0 0 90 54"
      className="absolute"
      style={{ width: q(size * 1.9), right: "5.5%", top: "0%", opacity: 0.4 }}
      aria-hidden
    >
      <circle cx="26" cy="27" r="21" fill="none" stroke={theme.colors.heading} strokeWidth="1.6" />
      <circle cx="26" cy="27" r="17.5" fill="none" stroke={theme.colors.heading} strokeWidth="0.8" />
      <path
        d="M48 14 C56 10, 62 20, 70 15 M48 27 C56 23, 62 33, 70 28 M48 40 C56 36, 62 46, 70 41"
        fill="none"
        stroke={theme.colors.heading}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* The letter                                                          */
/* ------------------------------------------------------------------ */

function LetterFace({
  theme,
  width,
  recipientName,
  children,
}: {
  theme: Theme;
  width: number;
  recipientName?: string;
  children?: React.ReactNode;
}) {
  // A gently irregular top edge, like paper torn from a pad. Deterministic
  // so the tear is identical between server and client.
  const teeth = Array.from({ length: 16 }, (_, i) => {
    const x = (i / 15) * 100;
    const y = 1.4 + prand(i * 3 + 1) * 2.2;
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  const deckle = `polygon(0 2.6%, ${teeth.join(", ")}, 100 2.4%, 100% 100%, 0% 100%)`;

  return (
    <div
      className="relative flex h-full w-full flex-col items-center"
      style={{
        background: `linear-gradient(178deg, ${shade(theme.colors.paper, 0.03)}, ${theme.colors.paper} 30%, ${shade(theme.colors.paper, -0.015)})`,
        borderRadius: 7,
        clipPath: deckle,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 2px rgba(22,36,28,0.06)`,
      }}
    >
      <PaperGrain strength={0.35} />
      <div
        className="relative flex h-full w-full flex-col items-center justify-start gap-[3%] pt-[7%]"
        style={{ paddingInline: "12%" }}
      >
        {recipientName ? (
          <>
            <span
              className="font-display italic leading-none"
              style={{
                color: shade(theme.colors.heading, -0.1),
                fontSize: q(Math.max(11, width * 0.05)),
                opacity: 0.85,
              }}
            >
              Dear {recipientName},
            </span>
            <span className="h-[2px] rounded-full" style={{ width: "64%", background: "rgba(22,36,28,0.10)" }} />
            <span className="h-[2px] rounded-full" style={{ width: "82%", background: "rgba(22,36,28,0.075)" }} />
            <span className="h-[2px] rounded-full" style={{ width: "52%", background: "rgba(22,36,28,0.06)" }} />
            <svg viewBox="0 0 24 22" className="mt-auto mb-[8%]" style={{ width: q(width * 0.05), opacity: 0.75 }} aria-hidden>
              <path
                d="M12 20 C6 15, 2 11.5, 2 7.5 C2 4.4, 4.4 2, 7.2 2 C9.3 2, 11 3.2, 12 5 C13 3.2, 14.7 2, 16.8 2 C19.6 2, 22 4.4, 22 7.5 C22 11.5, 18 15, 12 20 Z"
                fill={theme.colors.seal}
                opacity="0.8"
              />
            </svg>
          </>
        ) : (
          <>
            <span className="h-[3px] w-[26%] rounded-full" style={{ background: shade(theme.colors.heading, -0.1), opacity: 0.42 }} />
            <span className="h-[2px] w-[64%] rounded-full" style={{ background: "#16241C", opacity: 0.10 }} />
            <span className="h-[2px] w-[82%] rounded-full" style={{ background: "#16241C", opacity: 0.08 }} />
            <span className="h-[2px] w-[52%] rounded-full" style={{ background: "#16241C", opacity: 0.06 }} />
          </>
        )}
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The envelope                                                        */
/* ------------------------------------------------------------------ */

export type EnvelopeStage =
  | "sealed"
  | "pressing"
  | "cracking"
  | "unfolding"
  | "rising"
  | "lifted"
  /** legacy: the seal gives way */
  | "unsealing"
  /** legacy: flap open + letter on its way out */
  | "opening";

interface EnvelopeProps {
  theme: Theme;
  /** 0 = closed, 1 = flap open, card peeking. Kept for the landing demo. */
  open: boolean;
  /** Finer control than `open`. When given, `open` is ignored. */
  stage?: EnvelopeStage;
  className?: string;
  width?: number;
  /** Personalizes the address block and the letter peeking out. */
  recipientName?: string;
  children?: React.ReactNode;
}

export function Envelope({
  theme,
  open,
  stage,
  className,
  width = 320,
  recipientName,
  children,
}: EnvelopeProps) {
  const reduce = useReducedMotion();
  const height = width * 0.625;

  // Callers that only pass `open` (landing demo, wizard preview) get the
  // same choreography as the staged sequence, driven internally: the
  // flap folds first, and only when it has settled does the letter climb.
  // A sealed envelope can't push paper past a flap still covering the
  // mouth, so the order is physical, not stylistic.
  const legacy = stage === undefined;
  // Seeded from the mount-time `open`: a caller that renders already open
  // (the wizard's rehearsal preview) shows the settled state at once, with
  // no fold to wait for; a caller that opens later (the landing demo)
  // plays the whole chain. Framer does not fire animation completion for
  // values skipped by initial={false}, so the chain must know this up front.
  const [risen, setRisen] = useState(open);

  const given = stage ?? (open ? "opening" : "sealed");
  // Legacy stages fold into the new sequence.
  const phase: EnvelopeStage = legacy
    ? open
      ? risen
        ? "rising"
        : "unfolding"
      : "sealed"
    : given === "unsealing"
      ? "cracking"
      : given === "opening"
        ? "rising"
        : given;

  const pressing = phase === "pressing";
  const cracking = phase === "cracking";
  const unfolding = phase === "unfolding";
  const rising = phase === "rising" || phase === "lifted";
  const lifted = phase === "lifted";
  const opened = unfolding || rising;

  // The letter always waits for the flap to clear the mouth: in the
  // staged path the scene holds "unfolding" until the fold is done, and
  // in the legacy path the fold's own completion advances the phase.
  const letterDelay = 0.05;

  const pace = reduce ? 0.3 : 1;
  // The release curve: the fold springs open, decelerates as the panel
  // stands up, flexes a few degrees past flat against the back panel,
  // then settles, the way stiff paper does.
  const flapRelease: [number, number, number, number] = [0.2, 0.85, 0.3, 1.03];

  const sealSize = q(Math.max(30, width * 0.128));
  // geometry of the pocket
  const mouthTop = 0; // the mouth slit spans the top of the body
  const mouthDepth = q(height * 0.19); // dark interior band
  const letterTopRest = q(height * 0.14); // where the sheet waits, inside
  const flapH = q(height * 0.66); // crease to tip, the fold's radius
  // 186 degrees: just past flat, so the panel rests against the back
  // panel with its tip a few pixels behind the envelope's plane.
  const openAngle = 186;
  // While the flap swings it lives in front of the face; once it rests
  // behind, the letter must be able to pass in front of it.
  const flapZ = rising ? 3 : 20;
  // The wax bonds the flap's tip to the pocket front, so it sits at the
  // tip, straddling the join, not floating mid-flap.
  const sealTop = q(height * 0.525);

  return (
    <div
      className={cn("relative select-none", className)}
      style={{ width, height, perspective: width * 2.4 }}
      aria-hidden
    >
      {/* Ambient breath behind the envelope. Grows through the sequence,
          like light gathering around the moment. */}
      <motion.div
        className="absolute -inset-[16%] rounded-full blur-3xl"
        initial={false}
        animate={{
          opacity: lifted ? 0.55 : opened ? 0.42 : cracking ? 0.3 : pressing ? 0.2 : 0.14,
          scale: opened ? 1.06 : 0.94,
        }}
        transition={{ duration: 0.7 * pace, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: `radial-gradient(circle, ${theme.colors.seal}52, transparent 66%)`,
        }}
      />

      {/* The whole prop: presses on tap, leans back as the letter climbs,
          and dips a hair when the flap's mass lands on the back panel */}
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        initial={false}
        animate={{
          scale: pressing ? 0.968 : 1,
          y: pressing ? 3 : rising ? [0, 1.7, 0] : 0,
          rotateX: rising ? 7 : 0,
        }}
        transition={{
          scale: { duration: 0.22 * pace, ease: "easeOut" },
          y: { duration: 0.24 * pace, ease: "easeOut" },
          rotateX: { duration: 0.95 * pace, ease: [0.22, 1, 0.36, 1], delay: 0.08 * pace },
        }}
      >
        {/* ---------- the stack: everything clipped at the bottom edge,
                         free to rise above the top, where the flap stands
                         up and the letter climbs ---------- */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: "polygon(-30% -175%, 130% -175%, 130% 100%, -30% 100%)",
          }}
        >
          {/* inside back of the pocket */}
          <div
            className="absolute inset-0 rounded-[10px]"
            style={{
              background: `linear-gradient(180deg, ${shade(theme.colors.flap, -0.42)}, ${shade(theme.colors.flap, -0.28)} 30%, ${theme.colors.envelope})`,
            }}
          >
            <PaperGrain strength={0.5} />
          </div>

          {/* pocket interior shadow, deepest just under the upper lip,
              where almost no light gets in */}
          <div
            className="absolute inset-x-[2%] rounded-t-[10px]"
            style={{
              top: mouthTop,
              height: q(mouthDepth + height * 0.06),
              background:
                "linear-gradient(180deg, rgba(10,16,12,0.85), rgba(10,16,12,0.7) 6%, rgba(10,16,12,0.32) 62%, transparent)",
            }}
          />

          {/* glow rising out of the pocket once the flap is back */}
          <AnimatePresence>
            {opened && (
              <motion.div
                className="absolute left-1/2 top-[-24%] -translate-x-1/2 rounded-full blur-2xl"
                style={{
                  width: q(width * 0.62),
                  height: q(height * 0.9),
                  zIndex: 4,
                  background: `radial-gradient(closest-side, ${theme.colors.seal}59, transparent)`,
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: [0, 0.85, 0.4], y: [16, -6, -12] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.6 * pace, times: [0, 0.4, 1], ease: "easeOut" }}
              />
            )}
          </AnimatePresence>

          {/* ---------- the letter ---------- */}
          {/* Rests fully inside, its top edge just visible in the dark
              mouth. Climbs with friction, overshoots a hair, settles. */}
          <motion.div
            className="absolute left-1/2"
            style={{
              width: q(width * 0.88),
              height: q(height * 1.34),
              x: "-50%",
              top: letterTopRest,
              zIndex: 6,
            }}
            initial={false}
            animate={
              rising
                ? {
                    y: [0, -height * 0.5, -height * 0.92, -height * 0.885],
                    rotate: [0, -1.6, -1.1],
                    scale: [0.99, 1.018, 1.012],
                    boxShadow: [
                      "0 1px 3px -1px rgba(22,36,28,0.3)",
                      "0 4px 12px -4px rgba(22,36,28,0.34)",
                      `0 ${q(width * 0.06)}px ${q(width * 0.14)}px -${q(width * 0.05)}px rgba(22,36,28,0.38)`,
                      `0 ${q(width * 0.05)}px ${q(width * 0.12)}px -${q(width * 0.04)}px rgba(22,36,28,0.3)`,
                    ],
                  }
                : {
                    y: 0,
                    rotate: 0,
                    scale: 0.99,
                    boxShadow: "0 1px 3px -1px rgba(22,36,28,0.3)",
                  }
            }
            transition={
              rising
                ? {
                    duration: 1.01 * pace,
                    times: [0, 0.5, 0.84, 1],
                    ease: ["easeIn", "easeOut", [0.22, 1, 0.36, 1]] as const,
                    delay: letterDelay * pace,
                  }
                : { duration: 0.3 * pace, ease: "easeOut" }
            }
          >
            <LetterFace theme={theme} width={width} recipientName={recipientName}>
              {children}
            </LetterFace>
            {/* soft float once fully out, waiting for the handoff */}
            <AnimatePresence>
              {lifted && !reduce && (
                <motion.div
                  className="absolute -inset-x-2 -bottom-3 top-4 -z-10 rounded-[14px] blur-md"
                  style={{ background: "rgba(22,36,28,0.16)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 0.34, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </AnimatePresence>
          </motion.div>

          {/* ---------- the front: the addressed face ---------- */}
          {/* From the mouth's lower lip down. The letter climbs out from
              behind this panel, exactly like real mail. The front of a
              real envelope is clean paper; the construction seams stay
              quiet so they never read as a second flap. */}
          <div
            className="absolute inset-x-0"
            style={{
              top: q(mouthDepth * 0.86),
              bottom: 0,
              zIndex: 10,
              background: `linear-gradient(168deg, ${shade(theme.colors.envelope, 0.1)}, ${theme.colors.envelope} 38%, ${shade(theme.colors.envelope, -0.05)})`,
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.55), 0 1px 2px rgba(22,36,28,0.06)",
            }}
          >
            <PaperGrain strength={0.4} />
            {/* the lower lip of the mouth, catching light */}
            <div
              className="absolute inset-x-0 top-0 h-[5px]"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.5), transparent)" }}
            />
            {/* the pocket's bottom fold, a shallow quiet seam */}
            <svg viewBox="0 0 320 172" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`fold-${theme.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={shade(theme.colors.flap, 0.05)} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={shade(theme.colors.flap, -0.02)} stopOpacity="0.46" />
                </linearGradient>
              </defs>
              <path d="M0 172 L160 118 L320 172 Z" fill={`url(#fold-${theme.id})`} />
              <path d="M2 171 L160 120 L318 171" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" opacity="0.55" />
              <path d="M1 171 L160 122 L319 171" fill="none" stroke="rgba(22,36,28,0.12)" strokeWidth="1.2" opacity="0.5" />
            </svg>
          </div>

          {/* stamp + postmark, riding the front face, hidden by the flap
              until it opens */}
          <div
            className="absolute inset-x-0"
            style={{ top: q(mouthDepth * 0.86), bottom: 0, zIndex: 12 }}
          >
            <Stamp theme={theme} size={q(width * 0.135)} />
            <Postmark theme={theme} size={q(width * 0.135)} />
          </div>

          {/* address block, always in the clear below the flap */}
          <div
            className="absolute flex flex-col items-start"
            style={{
              right: "10%",
              bottom: "12%",
              width: q(width * 0.4),
              zIndex: 12,
            }}
          >
            <span
              className="uppercase tracking-[0.22em] font-semibold"
              style={{ fontSize: q(Math.max(6.5, width * 0.026)), color: "rgba(22,36,28,0.4)" }}
            >
              to
            </span>
            <span
              className="font-display italic leading-tight"
              style={{
                fontSize: q(Math.max(12, width * 0.058)),
                color: shade(theme.colors.heading, -0.05),
                textShadow: "0 1px 0 rgba(255,255,255,0.5)",
              }}
            >
              {recipientName ?? "you"}
            </span>
            <span className="mt-[3px] h-[1.5px] w-3/5 rounded-full" style={{ background: "rgba(22,36,28,0.13)" }} />
            <span className="mt-[2px] h-[1.5px] w-2/5 rounded-full" style={{ background: "rgba(22,36,28,0.09)" }} />
          </div>

          {/* return corner card */}
          <div
            className="absolute flex items-center gap-1"
            style={{ left: "7%", bottom: "7%", fontSize: q(Math.max(6.5, width * 0.026)), zIndex: 12 }}
          >
            <span style={{ fontSize: q(Math.max(8, width * 0.036)) }}>🐼</span>
            <span className="uppercase tracking-[0.16em] font-medium" style={{ color: "rgba(22,36,28,0.34)" }}>
              panda post
            </span>
          </div>

          {/* flap shadow on the front while it still covers the face */}
          <motion.div
            className="absolute inset-0 rounded-[10px]"
            initial={false}
            animate={{ opacity: opened ? 0 : 1 }}
            transition={{ duration: 0.5 * pace, ease: "easeOut" }}
            style={{
              zIndex: 14,
              background: "linear-gradient(180deg, rgba(22,36,28,0.16), transparent 64%)",
            }}
          />

          {/* the fold's traveling shade: as the panel stands edge-on it
              shades the face just below the crease, then the shade lifts
              as the paper swings past */}
          <motion.div
            className="absolute inset-x-0 top-0"
            initial={false}
            animate={{
              opacity: cracking ? 0.22 : unfolding ? [0.22, 0.5, 0] : 0,
            }}
            transition={
              unfolding
                ? { duration: 0.88 * pace, times: [0, 0.45, 1], ease: "easeOut" }
                : { duration: 0.3 * pace, ease: "easeOut" }
            }
            style={{
              height: q(height * 0.13),
              zIndex: 15,
              background: "linear-gradient(180deg, rgba(22,36,28,0.5), transparent)",
            }}
          />

          {/* ---------- the flap: a real fold ---------- */}
          {/* The panel is hinged along the crease, a couple of pixels
              below the lip so its base tucks behind the envelope's top
              edge. It rotates back inside a true perspective viewport:
              the crease edge never leaves the hinge, the panel
              foreshortens as it lifts, passes edge-on, and unfolds on
              the other side with its liner showing, coming to rest
              against the back panel. */}
          <div
            className="absolute inset-0"
            style={{
              perspective: q(width * 1.8),
              perspectiveOrigin: "50% 56%",
              zIndex: flapZ,
            }}
          >
            <motion.div
              className="absolute inset-x-0"
              style={{
                top: q(height * 0.011),
                height: flapH,
                transformOrigin: "50% 0%",
                transformStyle: "preserve-3d",
              }}
              initial={false}
              animate={
                unfolding
                  ? { rotateX: [9, 13, openAngle] }
                  : opened
                    ? { rotateX: openAngle }
                    : cracking
                      ? { rotateX: 9 }
                      : pressing
                        ? { rotateX: [0, -3.5, 0] }
                        : { rotateX: 0 }
              }
              transition={
                unfolding
                  ? {
                      duration: 0.88 * pace,
                      times: [0, 0.16, 1],
                      ease: ["easeOut", flapRelease] as const,
                    }
                  : opened
                    ? { duration: 0.4 * pace, ease: "easeOut" }
                    : cracking
                      ? { duration: 0.48 * pace, ease: "easeOut" }
                      : { duration: 0.4 * pace, ease: "easeOut" }
              }
              onAnimationComplete={() => {
                // The legacy path advances itself: once the fold has
                // settled behind the pocket, the letter may climb.
                if (!legacy) return;
                if (open && !risen) setRisen(true);
                else if (!open && risen) setRisen(false);
              }}
            >
              {/* outer face: the envelope's paper, crease edge at the hinge */}
              <svg
                viewBox="0 0 320 132"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="none"
                style={{ backfaceVisibility: "hidden" }}
              >
                <defs>
                  <linearGradient id={`flap-${theme.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={shade(theme.colors.flap, 0.1)} />
                    <stop offset="100%" stopColor={shade(theme.colors.flap, -0.04)} />
                  </linearGradient>
                  {/* soft silhouette shadow, kept inside the svg so the
                      css 3d pipeline stays untouched */}
                  <filter id={`flapdrop-${theme.id}`} x="-15%" y="-15%" width="130%" height="130%">
                    <feDropShadow dx="0" dy="2.6" stdDeviation="2.6" floodColor="rgba(22,36,28,0.3)" />
                  </filter>
                </defs>
                <g filter={`url(#flapdrop-${theme.id})`}>
                  <path
                    d="M0 0 H320 V10 C320 58 250 94 163 126 C161 127.4 159 127.4 157 126 C70 94 0 58 0 10 Z"
                    fill={`url(#flap-${theme.id})`}
                    stroke="rgba(255,255,255,0.42)"
                    strokeWidth="1"
                  />
                </g>
                {/* crease light along the fold */}
                <path d="M2 8 C120 20 200 20 318 8" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" opacity="0.7" />
                {/* the free edge catching light, the glint the eye reads as
                    paper when the panel stands edge-on */}
                <path d="M96 112 C128 122 192 122 224 112" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              {/* liner face, drawn mirrored so that once the panel has
                  folded back, its crease edge lands at the hinge and the
                  rounded tip points up */}
              <svg
                viewBox="0 0 320 132"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="none"
                style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
              >
                <defs>
                  <pattern id={`liner-${theme.id}`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="14" height="14" fill={shade(theme.colors.flap, -0.16)} />
                    <circle cx="7" cy="7" r="1.6" fill="rgba(255,255,255,0.16)" />
                  </pattern>
                  {/* the pocket's top edge casts shade down onto the liner
                      right where the two meet; drawn at the crease end */}
                  <linearGradient id={`linershade-${theme.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(10,16,12,0)" />
                    <stop offset="62%" stopColor="rgba(10,16,12,0.22)" />
                    <stop offset="100%" stopColor="rgba(10,16,12,0.55)" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 132 H320 V122 C320 74 250 38 163 6 C161 4.6 159 4.6 157 6 C70 38 0 74 0 122 Z"
                  fill={`url(#liner-${theme.id})`}
                />
                <path
                  d="M0 132 H320 V122 C320 74 250 38 163 6 C161 4.6 159 4.6 157 6 C70 38 0 74 0 122 Z"
                  fill={`url(#linershade-${theme.id})`}
                />
                <path
                  d="M0 132 H320 V122 C320 74 250 38 163 6 C161 4.6 159 4.6 157 6 C70 38 0 74 0 122 Z"
                  fill="none"
                  stroke={theme.colors.seal}
                  strokeWidth="2.5"
                  opacity="0.35"
                />
                {/* a quiet curve printed near the tip of the liner */}
                <path d="M14 108 C110 80 210 80 306 108" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
                {/* the free edge of the liner, catching the same light */}
                <path d="M96 20 C128 10 192 10 224 20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              {/* rotating light, outer side: as the panel swings up it
                  turns away from the light and falls into shade, darkest
                  just before it passes edge-on. This overlay is culled
                  with its face, so it only ever darkens the paper. */}
              <motion.svg
                viewBox="0 0 320 132"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="none"
                style={{ backfaceVisibility: "hidden" }}
                initial={false}
                animate={{
                  opacity: unfolding ? [0, 0.46, 0.46, 0] : cracking ? 0.08 : 0,
                }}
                transition={
                  unfolding
                    ? { duration: 0.88 * pace, times: [0, 0.5, 0.62, 1], ease: "easeOut" }
                    : { duration: 0.3 * pace, ease: "easeOut" }
                }
              >
                <defs>
                  <linearGradient id={`shout-${theme.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(10,16,12,0.16)" />
                    <stop offset="100%" stopColor="rgba(10,16,12,0.82)" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 0 H320 V10 C320 58 250 94 163 126 C161 127.4 159 127.4 157 126 C70 94 0 58 0 10 Z"
                  fill={`url(#shout-${theme.id})`}
                />
              </motion.svg>
              {/* rotating light, liner side: the freshly revealed face
                  starts deep in the pocket's shadow and comes back into
                  the light as the panel settles against the back */}
              <motion.svg
                viewBox="0 0 320 132"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="none"
                style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
                initial={false}
                animate={{
                  opacity: unfolding ? [0.52, 0.52, 0.14, 0] : 0,
                }}
                transition={
                  unfolding
                    ? { duration: 0.88 * pace, times: [0, 0.55, 0.82, 1], ease: "easeOut" }
                    : { duration: 0.3 * pace, ease: "easeOut" }
                }
              >
                <defs>
                  <linearGradient id={`shin-${theme.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(10,16,12,0.82)" />
                    <stop offset="100%" stopColor="rgba(10,16,12,0.16)" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 132 H320 V122 C320 74 250 38 163 6 C161 4.6 159 4.6 157 6 C70 38 0 74 0 122 Z"
                  fill={`url(#shin-${theme.id})`}
                />
              </motion.svg>
            </motion.div>
          </div>

          {/* ---------- the upper lip ---------- */}
          {/* The back panel's top edge. It sits over the crease at every
              moment, closed or open, so the flap always reads as attached
              behind the envelope rather than floating above it. */}
          <div
            className="absolute inset-x-0 top-0"
            style={{
              height: q(Math.max(3, height * 0.022)),
              zIndex: 22,
              borderRadius: `${q(width * 0.031)}px ${q(width * 0.031)}px 0 0`,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.08) 38%, rgba(22,36,28,0.2))",
            }}
          />
        </div>

        {/* ---------- the wax seal ---------- */}
        {/* Sits at the flap's tip, straddling the join between flap and
            pocket front, the way a wax seal actually bonds paper. */}
        <AnimatePresence>
          {!cracking && !opened && (
            <motion.div
              className="absolute left-1/2"
              style={{ top: sealTop, x: "-50%", zIndex: 30 }}
              initial={false}
              animate={
                pressing
                  ? { scale: 1.06, scaleY: 0.9, rotate: 0 }
                  : { scale: 1, scaleY: 1, rotate: 0 }
              }
              exit={{
                // a 70ms handoff: the WaxShatter layer takes over the
                // seal's departure, so the swap must be invisible
                opacity: [1, 1, 0],
                scale: [1, 1.05, 1.05],
                transition: { duration: 0.07, times: [0, 0.6, 1] },
              }}
            >
              <EnvelopeSeal theme={theme} size={sealSize} />
              {/* a glint that sweeps the wax while it waits */}
              {!reduce && !pressing && (
                <motion.span
                  className="pointer-events-none absolute -inset-1 rounded-full"
                  style={{
                    background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.5) 46%, transparent 60%)",
                  }}
                  initial={{ opacity: 0, x: "-60%" }}
                  animate={{ opacity: [0, 0.7, 0], x: ["-60%", "60%"] }}
                  transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 3.4, ease: "easeInOut" }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Wax shards: the debris of the crack. Rendered by the sequence on    */
/* top of the envelope, in its own layer, so the shards can fly past   */
/* the prop's bounds.                                                  */
/* ------------------------------------------------------------------ */

export function WaxShatter({
  theme,
  size,
  origin,
}: {
  theme: Theme;
  /** seal diameter in px */
  size: number;
  /** {x, y} center of the seal in px, relative to this layer */
  origin: { x: number; y: number };
}) {
  const shards = Array.from({ length: 11 }, (_, i) => {
    const spread = prand(i * 7 + 2);
    const angle = -Math.PI / 2 + (spread - 0.5) * 2.4; // mostly upward fan
    const power = 0.55 + prand(i * 13 + 5) * 0.75;
    return {
      i,
      dx: Math.cos(angle) * size * (1.4 + power * 2.6),
      dy: Math.sin(angle) * size * (1.2 + power * 1.8) + size * 1.5, // gravity wins eventually
      rotate: (prand(i * 17 + 3) - 0.5) * 520,
      scale: 0.5 + prand(i * 23 + 7) * 0.9,
    };
  });

  return (
    <div className="pointer-events-none absolute inset-0 z-40" aria-hidden>
      {/* the two seal halves tearing apart */}
      {[0, 1].map((half) => (
        <motion.span
          key={half}
          className="absolute"
          style={{
            left: origin.x - size / 2,
            top: origin.y - size / 2,
            width: size,
            height: size,
            clipPath:
              half === 0
                ? "polygon(0% 0%, 54% 0%, 44% 30%, 58% 62%, 46% 100%, 0% 100%)"
                : "polygon(54% 0%, 100% 0%, 100% 100%, 46% 100%, 58% 62%, 44% 30%)",
          }}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          animate={{
            opacity: [1, 1, 0],
            x: (half === 0 ? -1 : 1) * size * (0.5 + half * 0.1),
            y: [0, -size * 0.22, size * 0.85],
            rotate: (half === 0 ? -1 : 1) * 46,
            scale: 0.94,
          }}
          transition={{ duration: 0.72, times: [0, 0.55, 1], ease: [0.12, 0.8, 0.32, 1] }}
        >
          <EnvelopeSeal theme={theme} size={size} />
        </motion.span>
      ))}

      {/* wax debris */}
      {shards.map((s) => (
        <motion.svg
          key={`shard-${s.i}`}
          viewBox="0 0 20 20"
          className="absolute"
          style={{ left: origin.x - 6, top: origin.y - 6, width: 12, height: 12 }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.4, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: s.dx,
            y: [0, s.dy * 0.45, s.dy],
            scale: s.scale,
            rotate: s.rotate,
          }}
          transition={{
            duration: 0.66 + prand(s.i * 5) * 0.3,
            times: [0, 0.12, 0.6, 1],
            ease: [0.05, 0.7, 0.3, 1],
            delay: 0.03 + s.i * 0.012,
          }}
        >
          <path
            d={
              [
                "M10 1 L18 8 L12 19 L3 14 Z",
                "M3 3 L17 2 L14 17 L6 12 Z",
                "M6 2 L15 6 L11 18 L2 10 Z",
              ][s.i % 3]
            }
            fill={theme.colors.seal}
            opacity="0.95"
          />
          <path
            d={
              [
                "M10 1 L18 8 L12 19 L3 14 Z",
                "M3 3 L17 2 L14 17 L6 12 Z",
                "M6 2 L15 6 L11 18 L2 10 Z",
              ][s.i % 3]
            }
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="0.8"
          />
        </motion.svg>
      ))}

      {/* the soft puff of dust as the wax gives */}
      <motion.span
        className="absolute rounded-full"
        style={{
          left: origin.x - size * 0.85,
          top: origin.y - size * 0.85,
          width: size * 1.7,
          height: size * 1.7,
          background: `radial-gradient(closest-side, ${shade(theme.colors.seal, 0.55)}, transparent 70%)`,
          filter: "blur(7px)",
        }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: [0, 0.55, 0], scale: [0.3, 1.5, 1.9] }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

/** Tiny envelope chip used for theme swatches. */
export function EnvelopeChip({ theme, size = 64, className }: { theme: Theme; size?: number; className?: string }) {
  return (
    <div
      className={cn("relative rounded-md overflow-hidden shadow-sm", className)}
      style={{
        width: size,
        height: size * 0.68,
        background: `linear-gradient(150deg, ${shade(theme.colors.envelope, 0.08)}, ${theme.colors.envelope} 55%, ${theme.colors.flap})`,
        border: "1px solid rgba(255,255,255,0.6)",
      }}
      aria-hidden
    >
      <svg viewBox="0 0 64 44" className="absolute inset-0 h-full w-full">
        <path d="M0 44 L32 20 L64 44 Z" fill={theme.colors.flap} opacity="0.75" />
        <path d="M0 0 L32 24 L64 0 Z" fill={theme.colors.flap} opacity="0.92" />
        <path d="M0 0 L32 24 L64 0" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
      </svg>
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: size * 0.22,
          height: size * 0.22,
          background: `radial-gradient(circle at 36% 30%, ${shade(theme.colors.seal, 0.28)}, ${theme.colors.seal} 60%, ${shade(theme.colors.seal, -0.3)})`,
          border: "1.5px solid rgba(255,255,255,0.45)",
          boxShadow: "0 1px 2px rgba(22,36,28,0.3)",
        }}
      />
    </div>
  );
}
