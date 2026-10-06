"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQS } from "@/data/faq";

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="relative">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-20 sm:py-24">
        <div className="text-center">
          <h2 className="font-display font-semibold text-ink text-[clamp(1.6rem,3.5vw,2.3rem)]">
            Questions? Panda has answers
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className={cn(
                  "rounded-2xl border bg-paper transition-all duration-300",
                  isOpen ? "border-jade/30 shadow-[0_10px_30px_-14px_rgba(21,122,85,0.25)]" : "border-ink/10"
                )}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4.5 text-left"
                >
                  <span className="font-medium text-[14.5px] text-ink/90">{f.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "shrink-0 grid h-7 w-7 place-items-center rounded-full transition-colors",
                      isOpen ? "bg-jade text-white" : "bg-ink/5 text-ink/50"
                    )}
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 sm:px-6 pb-5 text-[13.5px] leading-relaxed text-ink-soft">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
