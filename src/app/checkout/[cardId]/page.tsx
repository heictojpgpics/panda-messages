"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { PandaMoodFace } from "@/components/brand/PandaMood";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { occasionLabel } from "@/data/occasions";
import { SITE } from "@/lib/config";
import { toast } from "sonner";
import { readEditToken } from "@/stores/card-memory";
import { Lock, CreditCard, Calendar, Sparkles, ArrowRight, Check, Mail } from "lucide-react";

interface CardInfo {
  id: string;
  slug: string;
  recipientName: string;
  senderName: string;
  occasion: string;
  deliverAt: string | null;
  recipientEmail: string | null;
  message: string;
  theme: string;
  songId: string | null;
  photoCount: number;
}

type Phase = "pay" | "processing" | "done";

export default function CheckoutPage() {
  const { cardId } = useParams<{ cardId: string }>();
  const router = useRouter();
  const [card, setCard] = useState<CardInfo | null>(null);
  const [notFoundCard, setNotFoundCard] = useState(false);
  const [phase, setPhase] = useState<Phase>("pay");
  const [claimUrl, setClaimUrl] = useState<string | null>(null);
  const [editToken, setEditToken] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const token = readEditToken(cardId);
    fetch(`/api/checkout/info?cardId=${encodeURIComponent(cardId)}${token ? `&editToken=${encodeURIComponent(token)}` : ""}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((d) => {
        setCard(d.card);
        // The edit token lives client-side, keyed by slug. Without it the
        // completion endpoint cannot know this checkout belongs to us.
        setEditToken(token ?? null);
        fetch("/api/auth/me")
          .then((r) => (r.ok ? r.json() : { user: null }))
          .then((me) => {
            if (me.user?.email) setEmail(me.user.email);
          })
          .catch(() => {});
      })
      .catch(() => setNotFoundCard(true));
  }, [cardId]);

  const formatCard = (raw: string) =>
    raw
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, "$1 ");

  const formatExpiry = (raw: string) => {
    const d = raw.replace(/\D/g, "").slice(0, 4);
    if (d.length >= 3) return `${d.slice(0, 2)}/${d.slice(2)}`;
    return d;
  };

  const canPay =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) &&
    cardNumber.replace(/\s/g, "").length >= 16 &&
    expiry.length === 5 &&
    cvc.length >= 3;

  const pay = async () => {
    if (!canPay || phase !== "pay") return;
    setPhase("processing");
    // Simulated latency, because a payment page that snaps feels fake.
    await new Promise((r) => setTimeout(r, 1400));
    try {
      const res = await fetch("/api/checkout/mock-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, email, name, editToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "The checkout did not go through.");
        setPhase("pay");
        return;
      }
      if (data.claimUrl) setClaimUrl(data.claimUrl);
      setPhase("done");
    } catch {
      toast("The connection hiccuped. Nothing was charged.");
      setPhase("pay");
    }
  };

  if (notFoundCard) {
    return (
      <Centered>
        <PandaMoodFace mood="sleepy" size={80} />
        <h1 className="mt-5 font-display font-semibold text-ink text-xl">This checkout is not here</h1>
        <p className="mt-2 text-[13.5px] text-ink-soft">It may have already completed. Check your dashboard.</p>
        <Button onClick={() => router.push("/dashboard")} className="mt-6 rounded-full">
          My dashboard
        </Button>
      </Centered>
    );
  }

  return (
    <div className="min-h-screen bg-ivory relative overflow-hidden">
      <div className="absolute inset-0 hero-forest grain" aria-hidden />
      <div className="relative mx-auto max-w-lg px-4 py-10">
        <div className="flex justify-center">
          <Logo />
        </div>

        <AnimatePresence mode="wait">
          {phase === "done" ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
              className="mt-8 glass-card rounded-3xl p-8 text-center relative overflow-hidden"
            >
              <Confetti />
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.25, type: "spring", stiffness: 200, damping: 12 }}
                className="flex justify-center"
              >
                <PandaMoodFace mood="delighted" size={110} className="float-soft" />
              </motion.div>
              <h1 className="mt-5 font-display font-semibold text-ink text-[1.55rem]">
                It&rsquo;s on its way to {card?.recipientName}
              </h1>
              <p className="mt-3 text-[14px] text-ink-soft leading-relaxed">
                {card?.deliverAt
                  ? `Panda will deliver it on the morning of ${new Date(card.deliverAt).toLocaleDateString(undefined, { month: "long", day: "numeric" })}. You will know the moment it is opened.`
                  : "Panda padded off with it immediately. Watch below, the open is coming."}
              </p>

              {claimUrl && (
                <div className="mt-6 rounded-2xl bg-gold-soft/60 border border-gold/25 p-4 text-left">
                  <p className="text-[13px] font-semibold text-ink/85 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#8C6D10]" />
                    Keep your cards, {email}
                  </p>
                  <p className="mt-1 text-[12.5px] text-ink/60 leading-relaxed">
                    Your account is ready. Set a password (the link also went to your inbox) and
                    every card you send will be waiting there.
                  </p>
                  <a href={claimUrl} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-jade link-pretty">
                    Set my password <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}

              <div className="mt-7 flex flex-col gap-2.5">
                <Button
                  onClick={() => router.push(`/dashboard?watch=${card?.slug ?? ""}`)}
                  className="sheen h-12 rounded-full text-[15px] font-semibold"
                  size="lg"
                >
                  Watch for the moment it opens
                </Button>
                <button
                  onClick={() => router.push("/create")}
                  className="text-[13.5px] font-medium text-ink/55 hover:text-jade py-2"
                >
                  Make another card
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="pay"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              className="mt-8 glass-card rounded-3xl overflow-hidden"
            >
              {/* Order summary */}
              <div className="px-6 sm:px-7 pt-6 pb-5 border-b border-ink/8">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-jade">
                  The full card
                </p>
                <div className="mt-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display font-semibold text-ink text-[17px]">
                      For {card?.recipientName ?? "..."}, from {card?.senderName ?? "..."}
                    </p>
                    <p className="text-[12.5px] text-ink/55 mt-1">
                      {card ? occasionLabel(card.occasion) : ""} · no watermark · all themes
                      {card?.songId ? " · their song" : ""}
                      {card?.photoCount ? ` · ${card.photoCount} photos` : ""}
                    </p>
                    {card?.deliverAt && (
                      <p className="text-[12.5px] text-ink/55">
                        Delivers{" "}
                        {new Date(card.deliverAt).toLocaleDateString(undefined, {
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        in the morning
                      </p>
                    )}
                    {card?.recipientEmail && (
                      <p className="text-[12.5px] text-ink/55">to {card.recipientEmail}</p>
                    )}
                  </div>
                  <p className="font-display font-semibold text-ink text-[22px] whitespace-nowrap">{SITE.cardPriceLabel}</p>
                </div>
              </div>

              {/* Payment form */}
              <div className="px-6 sm:px-7 py-6 space-y-4">
                <div className="flex items-center gap-2 justify-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft text-[#8C6D10] text-[10.5px] font-bold uppercase tracking-wider px-3 py-1">
                    <Sparkles className="h-3 w-3" />
                    Demo checkout
                  </span>
                  <span className="text-[11.5px] text-ink/40">nothing is actually charged</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="co-email" className="text-[12.5px]">Your email, for the receipt</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30" />
                    <Input
                      id="co-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="rounded-full h-11 pl-11 bg-paper"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="co-card" className="text-[12.5px]">Card number</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30" />
                    <Input
                      id="co-card"
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCard(e.target.value))}
                      placeholder="4242 4242 4242 4242"
                      className="rounded-full h-11 pl-11 bg-paper font-mono tracking-wider"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="co-exp" className="text-[12.5px]">Expiry</Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30" />
                      <Input
                        id="co-exp"
                        inputMode="numeric"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        placeholder="12/28"
                        className="rounded-full h-11 pl-11 bg-paper font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="co-cvc" className="text-[12.5px]">CVC</Label>
                    <Input
                      id="co-cvc"
                      inputMode="numeric"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                      className="rounded-full h-11 bg-paper font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="co-name" className="text-[12.5px]">Name on card (optional)</Label>
                  <Input
                    id="co-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="As printed"
                    className="rounded-full h-11 bg-paper"
                  />
                </div>

                <Button
                  onClick={pay}
                  disabled={!canPay || phase === "processing"}
                  className="sheen w-full h-12 rounded-full text-[15px] font-semibold mt-1"
                  size="lg"
                >
                  {phase === "processing" ? (
                    <span className="flex items-center gap-2.5">
                      <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Sealing the envelope...
                    </span>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Pay $4.99
                    </>
                  )}
                </Button>

                <p className="text-center text-[11.5px] text-ink/40 leading-relaxed">
                  Secure checkout · edit or cancel any time before it sends, full refund.
                  <br />
                  Wire Stripe keys and this exact page becomes a real payment, nothing else changes.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory grid place-items-center px-4 text-center">
      <div className="flex flex-col items-center">{children}</div>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 26 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {pieces.map((_, i) => (
        <motion.span
          key={i}
          initial={{ y: -30, x: `${(i * 37) % 100}%`, opacity: 0, rotate: 0 }}
          animate={{
            y: 460,
            x: `${((i * 37) % 100) + ((i % 5) - 2) * 6}%`,
            opacity: [0, 1, 1, 0],
            rotate: (i % 2 ? 1 : -1) * (180 + i * 20),
          }}
          transition={{ duration: 2.4 + (i % 5) * 0.4, delay: (i % 9) * 0.12, ease: "easeIn" }}
          className="absolute top-0 text-sm"
          style={{ left: 0 }}
        >
          {["🎉", "💚", "✨", "🎊", "🐼"][i % 5]}
        </motion.span>
      ))}
    </div>
  );
}
