"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getTheme } from "@/data/themes";
import { occasionLabel } from "@/data/occasions";
import { PandaHalo } from "./PandaMood";

/**
 * The card face. One visual language everywhere it appears: the landing
 * hero examples, the wizard preview, and the actual delivered card.
 */

export interface MiniCardData {
  occasion: string;
  recipientName: string;
  senderName: string;
  message: string;
  signoff?: string;
  theme: string;
  watermark?: boolean;
}

export function MiniCard({
  data,
  className,
  compact = false,
}: {
  data: MiniCardData;
  className?: string;
  compact?: boolean;
}) {
  const theme = getTheme(data.theme);
  const signoff = data.signoff?.trim() || "with love, Panda 💚";

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-black/5 w-full text-center flex flex-col items-center",
        !compact && "px-6 pt-7 pb-6 gap-3",
        compact && "px-4 pt-5 pb-4 gap-2",
        className
      )}
      style={{
        background: theme.colors.paper,
        boxShadow:
          "0 1px 2px rgba(22,36,28,0.05), 0 10px 34px -14px rgba(22,36,28,0.35)",
      }}
    >
      {/* Header */}
      <p
        className={cn("uppercase tracking-[0.28em] font-semibold", compact ? "text-[9px]" : "text-[10.5px]")}
        style={{ color: theme.colors.heading, opacity: 0.85 }}
      >
        {occasionLabel(data.occasion)}
      </p>

      {/* Panda */}
      <PandaHalo mood="center" size={compact ? 64 : 84} />

      {/* Dear name */}
      <div
        className={cn("inline-flex items-center rounded-full px-3 py-1", compact ? "text-[11px]" : "text-[13px]")}
        style={{ background: `${theme.colors.page}`, color: theme.colors.heading, fontWeight: 600 }}
      >
        Dear {data.recipientName}
      </div>

      {/* Message */}
      <p
        className={cn(
          "font-display leading-relaxed text-ink/90 text-balance",
          compact ? "text-[11.5px] line-clamp-3 px-1" : "text-[13.5px] px-2"
        )}
      >
        {data.message}
      </p>

      {/* Signoff */}
      <p className={cn("text-ink/70", compact ? "text-[10.5px]" : "text-xs")}>{signoff}</p>

      {data.watermark && (
        <p className="text-[9.5px] text-ink/35 mt-1">a little message from pandamessages.com</p>
      )}
      {!data.watermark && <span className="h-1" />}
    </div>
  );
}

/** Phone frame used for landing demos and previews. */
export function PhoneMock({
  children,
  className,
  tilt = 0,
  scale = 1,
}: {
  children: React.ReactNode;
  className?: string;
  tilt?: number;
  scale?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: tilt }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative mx-auto", className)}
      style={{ width: 300 * scale }}
    >
      <div
        className="rounded-[2.6rem] bg-white border-[10px] border-white shadow-[0_30px_80px_-30px_rgba(22,36,28,0.5)] overflow-hidden"
        style={{ transform: `rotate(${tilt}deg)` }}
      >
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-5 w-24 rounded-b-2xl bg-black/85 z-20" />
        <div className="overflow-hidden" style={{ aspectRatio: "9/17.5" }}>
          {children}
        </div>
      </div>
    </motion.div>
  );
}
