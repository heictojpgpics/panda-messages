"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { PandaMoodFace } from "@/components/brand/PandaMood";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, Send } from "lucide-react";

export default function FeedbackPage() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (message.trim().length < 3) {
      toast("Write a few words at least.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, email: email || null }),
      });
      if (res.ok) setDone(true);
      else toast("Could not send that. Try again in a moment?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Nav />
      <main className="flex-1 grid place-items-center">
        <div className="mx-auto max-w-md w-full px-4 py-32">
          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-3xl p-8 text-center flex flex-col items-center gap-4"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-jade text-white">
                <Check className="h-6 w-6" strokeWidth={2.5} />
              </span>
              <h1 className="font-display font-semibold text-ink text-xl">Got it. Thank you.</h1>
              <p className="text-[13.5px] text-ink-soft leading-relaxed">
                A person reads every one of these. The good ones make our week, the critical
                ones make the product better. Both get replies if you left an email.
              </p>
            </motion.div>
          ) : (
            <div className="glass-card rounded-3xl p-7 sm:p-8">
              <div className="flex justify-center">
                <PandaMoodFace mood="surprised" size={72} />
              </div>
              <h1 className="mt-4 text-center font-display font-semibold text-ink text-2xl">
                Share your thoughts
              </h1>
              <p className="mt-2 text-center text-[13.5px] text-ink-soft">
                A story about a card you sent, a thing that bugged you, an idea you cannot stop
                thinking about. All welcome.
              </p>
              <div className="mt-6 space-y-4">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                  placeholder="Say it like you would to a friend..."
                  rows={5}
                  className="rounded-2xl bg-paper resize-none"
                  autoFocus
                />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email, if you want a reply (optional)"
                  className="rounded-full bg-paper"
                />
                <Button
                  onClick={submit}
                  disabled={busy}
                  className="sheen w-full h-12 rounded-full font-semibold"
                  size="lg"
                >
                  <Send className="h-4 w-4" />
                  {busy ? "Sending..." : "Send it"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
