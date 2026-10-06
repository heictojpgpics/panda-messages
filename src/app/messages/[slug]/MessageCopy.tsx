"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function MessageCopy({ text, long = false }: { text: string; long?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <li
      className={cn(
        "group relative rounded-2xl border border-ink/8 bg-paper transition-all hover:border-jade/30",
        long ? "p-5" : "pr-14 pl-5 py-3.5"
      )}
    >
      <p className={cn("text-ink/85 leading-relaxed", long ? "text-[14px] font-display leading-[1.7]" : "text-[14px]")}>
        {text}
      </p>
      <button
        onClick={copy}
        aria-label="Copy this message"
        className={cn(
          "absolute right-3 grid h-9 w-9 place-items-center rounded-full border transition-all",
          long && "top-4",
          copied
            ? "border-jade bg-jade text-white"
            : "border-ink/12 text-ink/40 opacity-0 group-hover:opacity-100 hover:text-jade hover:border-jade/40 focus:opacity-100"
        )}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </li>
  );
}
