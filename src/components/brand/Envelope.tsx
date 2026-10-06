"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Theme } from "@/data/themes";

/**
 * The envelope. The single most important object in the product.
 * Closed, cracking open, or fully flown, it appears everywhere:
 * the landing demo, theme swatches, the card page itself.
 */

export function EnvelopeSeal({ theme, size = 34 }: { theme: Theme; size?: number }) {
  return (
    <span
      className="grid place-items-center rounded-full shadow-md"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 30%, ${theme.colors.seal}F2, ${theme.colors.seal})`,
        border: "2px solid rgba(255,255,255,0.35)",
      }}
      aria-hidden
    >
      <img src="/panda/d-center.png" alt="" width={size * 0.62} height={size * 0.62} className="object-contain" draggable={false} />
    </span>
  );
}

interface EnvelopeProps {
  theme: Theme;
  /** 0 = closed, 1 = flap open, card peeking. Progress is animated. */
  open: boolean;
  className?: string;
  width?: number;
  children?: React.ReactNode;
}

export function Envelope({ theme, open, className, width = 320, children }: EnvelopeProps) {
  const height = width * 0.62;
  return (
    <div
      className={cn("relative select-none", className)}
      style={{ width, height, perspective: width * 2 }}
      aria-hidden
    >
      {/* Envelope back */}
      <div
        className="absolute inset-0 rounded-xl shadow-[0_18px_50px_-18px_rgba(22,36,28,0.45)]"
        style={{
          background: `linear-gradient(160deg, ${theme.colors.envelope}, ${theme.colors.flap})`,
          border: "1px solid rgba(255,255,255,0.5)",
        }}
      />
      {/* Inner shadow pocket */}
      <div
        className="absolute inset-0 rounded-xl overflow-hidden"
        style={{ boxShadow: `inset 0 -22px 44px -22px ${theme.colors.flap}` }}
      />
      {/* Address lines, faint */}
      <div className="absolute right-[10%] bottom-[18%] flex flex-col gap-1.5" style={{ width: width * 0.34 }}>
        <span className="block h-[2px] rounded-full" style={{ background: "rgba(22,36,28,0.16)" }} />
        <span className="block h-[2px] rounded-full w-3/4" style={{ background: "rgba(22,36,28,0.12)" }} />
        <span className="block h-[2px] rounded-full w-1/2" style={{ background: "rgba(22,36,28,0.08)" }} />
      </div>
      {/* Stamp */}
      <div
        className="absolute left-[8%] top-[16%] rounded-[4px] grid place-items-center opacity-80"
        style={{
          width: width * 0.13,
          height: width * 0.13,
          background: "rgba(255,255,255,0.65)",
          border: `1px dashed rgba(22,36,28,0.25)`,
        }}
      >
        <span className="text-[9px]">💌</span>
      </div>

      {/* Bottom folds */}
      <svg viewBox="0 0 320 200" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <path d="M0 200 L160 96 L320 200 L320 200 L0 200 Z" fill={theme.colors.flap} opacity="0.55" />
        <path d="M0 0 L160 104 L320 0" fill="none" />
      </svg>

      {/* The card tucked inside, visible when open */}
      <motion.div
        className="absolute left-1/2 z-10"
        style={{ width: width * 0.86, height: height * 1.35, x: "-50%", bottom: "10%", background: theme.colors.paper, borderRadius: 10, boxShadow: "0 -8px 30px -10px rgba(22,36,28,0.35)" }}
        animate={open ? { y: -height * 0.72, rotate: -2 } : { y: 4, rotate: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 16, delay: open ? 0.18 : 0 }}
      >
        <div className="h-full w-full rounded-[10px] border border-black/5 flex flex-col items-center justify-start pt-3 gap-1.5" style={{ background: theme.colors.paper }}>
          <span className="h-1.5 w-8 rounded-full" style={{ background: theme.colors.heading, opacity: 0.5 }} />
          <span className="h-1.5 w-14 rounded-full" style={{ background: "#16241C", opacity: 0.14 }} />
          <span className="h-1.5 w-11 rounded-full" style={{ background: "#16241C", opacity: 0.1 }} />
          {children}
        </div>
      </motion.div>

      {/* The flap */}
      <motion.div
        className="absolute inset-x-0 top-0 origin-top z-20"
        style={{ height: height * 0.62, transformStyle: "preserve-3d" }}
        animate={open ? { rotateX: 178 } : { rotateX: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 15 }}
      >
        <svg viewBox="0 0 320 124" className="w-full h-full" preserveAspectRatio="none" style={{ filter: "drop-shadow(0 6px 10px rgba(22,36,28,0.18))" }}>
          <path
            d="M0 0 H320 V8 Q320 100 268 112 L160 124 L52 112 Q0 100 0 8 Z"
            fill={theme.colors.flap}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1"
          />
        </svg>
        <div style={{ transformStyle: "preserve-3d" }} />
      </motion.div>

      {/* Wax seal, pops when opening */}
      <motion.div
        className="absolute left-1/2 z-30"
        style={{ top: height * 0.5, x: "-50%" }}
        animate={open ? { scale: [1, 1.35, 0.9, 0], opacity: [1, 1, 1, 0], rotate: [0, -14, 8, 20] } : { scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.55, times: [0, 0.3, 0.6, 1] }}
      >
        <EnvelopeSeal theme={theme} size={Math.max(26, width * 0.105)} />
      </motion.div>
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
        background: `linear-gradient(150deg, ${theme.colors.envelope}, ${theme.colors.flap})`,
        border: "1px solid rgba(255,255,255,0.6)",
      }}
      aria-hidden
    >
      <svg viewBox="0 0 64 44" className="absolute inset-0 w-full h-full">
        <path d="M0 44 L32 20 L64 44 Z" fill={theme.colors.flap} opacity="0.7" />
        <path d="M0 0 L32 24 L64 0 Z" fill={theme.colors.flap} opacity="0.9" />
      </svg>
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: size * 0.2,
          height: size * 0.2,
          background: theme.colors.seal,
          border: "1.5px solid rgba(255,255,255,0.5)",
        }}
      />
    </div>
  );
}
