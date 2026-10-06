"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is there a free version?",
    a: "Yes, and it is genuinely free. You make the card, we give you the link, you share it however you like. The card carries a small pandamessages.com line at the bottom. If you ever want that gone, plus the delivery and the songs and the photos, that is the $4.99 card.",
  },
  {
    q: "Does the person I send it to need an account?",
    a: "No. They never even see a signup screen. They get an email that looks like a delivery, tap it, and the envelope opens. That is the entire experience from their side.",
  },
  {
    q: "Can I schedule it in advance?",
    a: "That is the main move. Pick the day, any day, months out, and Panda lands it in their inbox that morning. You can edit or cancel any time before it sends, with a full refund. Set it at 2am in a burst of competence, then forget about it guilt-free.",
  },
  {
    q: "Will they know it's from me?",
    a: "Yes, if you want them to. Your name goes on the card and in the delivery. If you would rather stay mysterious, leave the sender name as something cryptic and enjoy the chaos.",
  },
  {
    q: "What if I make a mistake?",
    a: "Until the moment it sends, the card is fully editable from your dashboard. After it sends, the link is live, but a quick email to support and we will usually sort you out. We are nice about it.",
  },
  {
    q: "What if it doesn't arrive?",
    a: "Then we refund you immediately, no forms, no interrogation. Deliveries are tracked on your dashboard, so you will see the moment it lands anyway. But if the internet eats one, it is on us.",
  },
  {
    q: "Can I send it myself instead?",
    a: "Absolutely. The free card is exactly that: you share the link by text, WhatsApp, carrier pigeon. The paid version is for when you want it to arrive on its own, on the day, like a proper surprise.",
  },
  {
    q: "Is there a subscription?",
    a: "No. $4.99 per card, once, when you want it. The only recurring thing anywhere is Panda Remembers, the optional birthday service, and that is $19 a year with cancel any time.",
  },
  {
    q: "How long does it take to make one?",
    a: "About a minute if you know what you want to say. About four minutes if you browse the message ideas, which people mostly do, and which we fully endorse.",
  },
  {
    q: "How do reactions and replies work?",
    a: "When they open the card, they can tap a heart, or write a little reply back. Your dashboard updates live. It is the closest thing to watching their face while they read it.",
  },
];

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
