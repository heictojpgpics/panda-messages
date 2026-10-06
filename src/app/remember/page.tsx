"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { PandaMoodFace } from "@/components/brand/PandaMood";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Check, Bell } from "lucide-react";

export default function RememberPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const join = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      toast("That email does not look right.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "remember" }),
      });
      if (res.ok) setDone(true);
      else toast("Could not add you just now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Nav />
      <main className="flex-1">
        <div className="relative mx-auto max-w-2xl px-4 sm:px-6 pt-32 pb-20 text-center">
          <div className="absolute inset-0 hero-forest grain rounded-[3rem] pointer-events-none" aria-hidden />
          <div className="relative">
            <div className="float-soft inline-block">
              <PandaMoodFace mood="sleepy" size={120} />
            </div>
            <h1 className="mt-6 font-display font-semibold text-ink text-[clamp(1.8rem,4vw,2.5rem)] text-balance">
              Panda remembers, so you never forget
            </h1>
            <p className="mt-5 text-[15px] text-ink-soft leading-relaxed max-w-lg mx-auto">
              Give Panda your special days once. Panda sends a beautiful card on every one, and
              checks with you a few days before so you can add a personal line. $19 a year,
              cancel any time.
            </p>

            <div className="mt-8 glass-card rounded-3xl p-7 max-w-md mx-auto">
              {done ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3 py-3"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-jade text-white">
                    <Check className="h-6 w-6" strokeWidth={2.5} />
                  </span>
                  <p className="font-display font-semibold text-ink text-lg">You are on the list</p>
                  <p className="text-[13px] text-ink-soft">
                    The moment Panda Remembers wakes up, you hear it first.
                  </p>
                </motion.div>
              ) : (
                <>
                  <p className="text-[13px] font-semibold text-ink/75 mb-3">
                    Coming very soon. Be first to know:
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && join()}
                      placeholder="you@email.com"
                      className="rounded-full bg-paper"
                    />
                    <Button onClick={join} disabled={busy} className="rounded-full px-5">
                      <Bell className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-3 text-[11.5px] text-ink/40">
                    One email when it launches. Nothing else, ever.
                  </p>
                </>
              )}
            </div>

            <p className="mt-7 text-[13.5px] text-ink-55">
              In the meantime, Panda can already send a card on any day you pick.
            </p>
            <a
              href="/create"
              className="mt-4 sheen inline-flex items-center gap-2 rounded-full bg-jade text-white text-[15px] font-semibold px-6 py-3.5 shadow-[0_14px_30px_-10px_rgba(21,122,85,0.6)] hover:bg-jade-deep"
            >
              Schedule a card
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
