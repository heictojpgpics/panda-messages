"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { OCCASIONS, getOccasion, occasionLabel } from "@/data/occasions";
import { THEMES, FREE_THEMES } from "@/data/themes";
import { MESSAGE_SEEDS } from "@/data/messages";
import { defaultSignoff } from "@/data/signoffs";
import { MiniCard } from "@/components/brand/MiniCard";
import { cn } from "@/lib/utils";
import { compressPhoto, extractYouTubeId, PHOTO_LIMITS } from "@/lib/photo";
import {
  ArrowLeft, ArrowRight, Shuffle, Music, Camera, Lock, X, Sparkles,
  Calendar, Mail, Link2, PartyPopper, Check, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OpenPreview } from "./OpenPreview";
import { Envelope } from "@/components/brand/Envelope";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { getTheme } from "@/data/themes";
import { toast } from "sonner";

const DRAFT_KEY = "panda-draft-v2";
const TOKENS_KEY = "panda-edit-tokens";

interface Draft {
  occasion: string;
  customOccasion?: string;
  recipientName: string;
  senderName: string;
  message: string;
  signoff: string;
  theme: string;
  songInput: string;
  photos: string[];
  step?: number;
}

const STEP_TITLES = ["What's the occasion?", "Who is it for?", "What would you like to say?", "Their card is ready"];

export function Wizard() {
  const router = useRouter();
  const params = useSearchParams();
  const editSlug = params.get("edit");

  const initial = useMemo<Draft>(() => {
    // A refresh mid-flow should never cost anyone their words.
    let saved: Partial<Draft> = {};
    try {
      saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}");
    } catch {}
    const occasion = params.get("occasion") ?? saved.occasion ?? "";
    const custom = params.get("custom") ?? saved.customOccasion ?? "";
    const replyTo = params.get("replyTo");
    const to = params.get("to") ?? saved.recipientName ?? "";
    const valid = OCCASIONS.some((o) => o.id === occasion);
    const draft: Draft = {
      occasion: valid ? occasion : custom ? "custom" : "",
      customOccasion: custom,
      recipientName: to,
      senderName: saved.senderName ?? "",
      message: saved.message ?? "",
      signoff: saved.signoff ?? "",
      theme: saved.theme ?? "bamboo-grove",
      songInput: saved.songInput ?? "",
      photos: Array.isArray(saved.photos) ? saved.photos : [],
      step: typeof saved.step === "number" ? saved.step : undefined,
    };
    return draft;
  }, [params]);

  const [step, setStep] = useState(() => {
    if (editSlug) return 3;
    if (initial.occasion && initial.recipientName && initial.message) return 2;
    if (initial.occasion && initial.recipientName) return 1;
    return 0;
  });
  const [draft, setDraft] = useState<Draft>(initial);
  const [seedIdx, setSeedIdx] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  // A card already saved server-side this session: reused on retry instead
  // of creating a twin every time checkout hiccups.
  const [madeCard, setMadeCard] = useState<{ id: string; slug: string; editToken?: string } | null>(null);
  const [editingCard, setEditingCard] = useState<{ slug: string; editToken?: string } | null>(
    editSlug ? { slug: editSlug } : null
  );

  // Delivery state (step 4)
  const [delivery, setDelivery] = useState<"panda" | "self">("panda");
  const [when, setWhen] = useState<"now" | "day">("now");
  const [date, setDate] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [freeAuthed, setFreeAuthed] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [freeCardSlug, setFreeCardSlug] = useState<string | null>(null);
  const [freeShare, setFreeShare] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => {
      const next = { ...d, [key]: value, step: key === "step" ? (value as number) : d.step };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const setStepTracked = (n: number) => {
    setStep(n);
    set("step", n);
  };

  // Loading an existing card into the wizard (edit mode from the dashboard).
  useEffect(() => {
    if (!editingCard) return;
    const tokens = (() => {
      try {
        return JSON.parse(localStorage.getItem(TOKENS_KEY) ?? "{}");
      } catch {
        return {};
      }
    })();
    const editToken = tokens[editingCard.slug];
    fetch(`/api/cards?slug=${editingCard.slug}${editToken ? `&editToken=${encodeURIComponent(editToken)}` : ""}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("not yours");
        return r.json();
      })
      .then((c) => {
        setEditingCard({ slug: c.slug, editToken: editToken ?? undefined });
        setDraft((d) => ({
          ...d,
          occasion: OCCASIONS.some((o) => o.id === c.occasion) ? c.occasion : "custom",
          customOccasion: c.customOccasion ?? "",
          recipientName: c.recipientName ?? "",
          senderName: c.senderName ?? "",
          message: c.message ?? "",
          signoff: c.signoff ?? "",
          theme: c.theme ?? "bamboo-grove",
          songInput: c.songId ? `https://youtu.be/${c.songId}` : "",
          photos: Array.isArray(c.photos) ? c.photos : [],
        }));
      })
      .catch(() => {
        toast("That card could not be loaded. It may not be yours.");
        router.replace("/dashboard");
      });
  }, [editingCard, router]);

  const occasion = draft.occasion;
  const seeds = MESSAGE_SEEDS[occasion] ?? MESSAGE_SEEDS["just-because"];
  const effectiveOccasionLabel =
    draft.occasion === "custom" && draft.customOccasion ? draft.customOccasion : occasionLabel(occasion);
  const songId = useMemo(() => extractYouTubeId(draft.songInput), [draft.songInput]);
  const signoff = draft.signoff.trim() || defaultSignoff(occasion);

  const fillSeed = () => {
    const seed = seeds[seedIdx % seeds.length];
    const msg = seed.replaceAll("{name}", draft.recipientName || "you");
    set("message", msg);
    setSeedIdx((i) => i + 1);
  };

  // ---------- persistence helpers ----------
  const saveEditToken = (slug: string, token: string) => {
    try {
      const map = JSON.parse(localStorage.getItem(TOKENS_KEY) ?? "{}");
      map[slug] = token;
      localStorage.setItem(TOKENS_KEY, JSON.stringify(map));
    } catch {}
  };

  // ---------- actions ----------
  const saveEdits = async (): Promise<boolean> => {
    if (!editingCard) return false;
    setBusy(true);
    try {
      const res = await fetch(`/api/cards/${editingCard.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editToken: editingCard.editToken,
          senderName: draft.senderName,
          recipientName: draft.recipientName,
          message: draft.message,
          signoff,
          theme: draft.theme,
          songId,
          photos: draft.photos,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error ?? "The save did not go through.");
        return false;
      }
      toast("Saved. Panda resealed the envelope.");
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      router.push(`/dashboard?watch=${editingCard.slug}`);
      return true;
    } catch {
      toast("The connection hiccuped. Nothing was lost.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const createCard = async (): Promise<{ id: string; slug: string; editToken?: string } | null> => {
    // Reuse the card already made this session instead of minting twins
    // when checkout fails and the user tries again.
    if (madeCard) {
      await fetch(`/api/cards/${madeCard.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editToken: madeCard.editToken,
          senderName: draft.senderName,
          recipientName: draft.recipientName,
          message: draft.message,
          signoff,
          theme: draft.theme,
          songId,
          photos: draft.photos,
        }),
      }).catch(() => {});
      return madeCard;
    }
    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderName: draft.senderName,
        recipientName: draft.recipientName,
        occasion: draft.occasion === "custom" ? "just-because" : draft.occasion,
        customOccasion: draft.occasion === "custom" ? draft.customOccasion ?? "" : null,
        message: draft.message,
        signoff,
        theme: draft.theme,
        songId,
        songProvider: songId ? "youtube" : null,
        photos: draft.photos,
        replyTo: params.get("replyTo"),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error ?? "Something went wrong");
      return null;
    }
    setMadeCard(data);
    return data;
  };

  const startCheckout = async (cardId: string, slug: string, editToken?: string) => {
    setBusy(true);
    try {
      const deliverAt = when === "day" && date ? new Date(date + "T09:00:00").toISOString() : null;
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          cardId,
          editToken,
          recipientEmail: delivery === "panda" ? recipientEmail : null,
          deliverAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Checkout could not start");
        return;
      }
      window.location.href = data.url;
    } finally {
      setBusy(false);
    }
  };

  const sendFree = async () => {
    // Free cards need an owner so they stay editable and watchable.
    if (!freeAuthed) {
      const me = await fetch("/api/auth/me").then((r) => (r.ok ? r.json() : { user: null })).catch(() => ({ user: null }));
      if (!me.user) {
        setShowAuthGate(true);
        toast("One tiny account, so your card stays yours. Thirty seconds.");
        return;
      }
      setFreeAuthed(true);
    }
    setBusy(true);
    try {
      const card = await createCard();
      if (!card) return;
      if (card.editToken) saveEditToken(card.slug, card.editToken);
      await fetch(`/api/cards/${card.slug}/finalize-free`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editToken: card.editToken }),
      }).catch(() => {});
      setFreeCardSlug(card.slug);
      setFreeShare(true);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
    } finally {
      setBusy(false);
    }
  };

  const paidSend = async () => {
    if (delivery === "panda") {
      const email = recipientEmail.trim();
      if (!email) {
        toast("Where should Panda bring it? Their email is needed.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        toast("That email does not look right. Check it once more?");
        return;
      }
    }
    if (when === "day" && !date) {
      toast("Pick the day Panda should send it.");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const card = await createCard();
      if (!card) return;
      if (card.editToken) saveEditToken(card.slug, card.editToken);
      await startCheckout(card.id, card.slug, card.editToken);
    } finally {
      setBusy(false);
    }
  };

  // ---------- free share screen ----------
  if (freeShare && freeCardSlug) {
    return <ShareScreen slug={freeCardSlug} senderName={draft.senderName} recipientName={draft.recipientName} />;
  }

  const canNext =
    (step === 0 && (occasion || draft.customOccasion)) ||
    (step === 1 && draft.recipientName.trim() && draft.senderName.trim()) ||
    (step === 2 && draft.message.trim().length > 0);

  return (
    <div className="min-h-screen bg-ivory relative">
      <div className="absolute inset-0 bamboo-bg opacity-40 pointer-events-none" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-8 pb-28">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => {
              if (editingCard) {
                router.push("/dashboard");
                return;
              }
              if (step === 0) router.push("/");
              else setStepTracked(step - 1);
            }}
            className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink/60 hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {editingCard ? "Back to dashboard" : "Back"}
          </button>
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-ink/40">
            {editingCard ? "Editing your card" : `Step ${step + 1} of 4`}
          </p>
          <div className="flex gap-1.5" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i <= step ? "w-6 bg-jade" : "w-3 bg-ink/15"
                )}
              />
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.05fr_0.85fr] gap-10 mt-8">
          {/* Left: the current step */}
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="font-display font-semibold text-ink text-[clamp(1.5rem,3.4vw,2.1rem)] leading-tight">
                  {editingCard
                    ? step === 3
                      ? "Save your changes"
                      : "Fix it up"
                    : STEP_TITLES[step]}
                </h1>

                {/* STEP 0: occasion */}
                {step === 0 && !editingCard && (
                  <OccasionPicker
                    value={occasion}
                    custom={draft.customOccasion ?? ""}
                    onPick={(id) => {
                      set("occasion", id);
                      set("customOccasion", "");
                      setStepTracked(1);
                    }}
                    onCustom={(text) => {
                      set("occasion", "custom");
                      set("customOccasion", text);
                      setStepTracked(1);
                    }}
                  />
                )}

                {/* STEP 1: names */}
                {step === 1 && (
                  <div className="mt-7 space-y-5 max-w-md">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Chip>{effectiveOccasionLabel}</Chip>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipient" className="text-[13.5px] font-medium text-ink/80">
                        Their first name
                      </Label>
                      <Input
                        id="recipient"
                        value={draft.recipientName}
                        onChange={(e) => set("recipientName", e.target.value)}
                        placeholder="Sarah"
                        maxLength={40}
                        autoFocus
                        className="rounded-xl h-12 text-[15px] bg-paper"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sender" className="text-[13.5px] font-medium text-ink/80">
                        Your name
                      </Label>
                      <Input
                        id="sender"
                        value={draft.senderName}
                        onChange={(e) => set("senderName", e.target.value)}
                        placeholder="Sam"
                        maxLength={40}
                        className="rounded-xl h-12 text-[15px] bg-paper"
                      />
                    </div>
                    <Button
                      onClick={() => setStepTracked(2)}
                      disabled={!canNext}
                      className="sheen w-full h-12 rounded-full text-[15px] font-semibold"
                      size="lg"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* STEP 2: the words and the wrapping */}
                {step === 2 && (
                  <MessageStep
                    draft={draft}
                    set={set}
                    songId={songId}
                    fillSeed={fillSeed}
                    onNext={() => setStepTracked(3)}
                    canNext={Boolean(canNext)}
                    recipientName={draft.recipientName}
                  />
                )}

                {/* STEP 3: ready */}
                {step === 3 && editingCard ? (
                  <div className="mt-7 max-w-xl space-y-6">
                    <div className="rounded-2xl bg-jade-soft/50 border border-jade/20 p-5 text-[13.5px] text-ink-soft leading-relaxed">
                      You are editing a card that has not left yet. Save and Panda
                      swaps the words inside the same envelope, same delivery day.
                      Nothing about the plan changes.
                    </div>
                    <Button
                      onClick={() => void saveEdits()}
                      disabled={busy || !draft.message.trim() || !draft.recipientName.trim() || !draft.senderName.trim()}
                      className="sheen w-full h-12 rounded-full text-[15.5px] font-semibold"
                      size="lg"
                    >
                      {busy ? "Saving..." : "Save the changes"}
                    </Button>
                    <button
                      onClick={() => setStepTracked(2)}
                      className="w-full text-center text-[13px] font-medium text-ink/55 hover:text-jade py-2 transition-colors"
                    >
                      Keep editing
                    </button>
                  </div>
                ) : step === 3 ? (
                  <ReadyStep
                    draft={draft}
                    signoff={signoff}
                    songId={songId}
                    delivery={delivery}
                    setDelivery={setDelivery}
                    when={when}
                    setWhen={setWhen}
                    date={date}
                    setDate={setDate}
                    recipientEmail={recipientEmail}
                    setRecipientEmail={setRecipientEmail}
                    onPreview={() => setPreviewOpen(true)}
                    onPaid={paidSend}
                    onFree={sendFree}
                    busy={busy}
                    showAuthGate={showAuthGate && !freeShare}
                    onAuthed={() => {
                      setFreeAuthed(true);
                      setShowAuthGate(false);
                      sendFree();
                    }}
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: live preview */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.2em] text-ink/40">
                  Their card, live
                </p>
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-jade hover:text-jade-deep"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Open it like they will
                </button>
              </div>
              <motion.div layout>
                <MiniCard
                  data={{
                    occasion: draft.occasion === "custom" ? "just-because" : draft.occasion || "just-because",
                    recipientName: draft.recipientName || "them",
                    senderName: draft.senderName || "you",
                    message: draft.message || "Panda is waiting for your words...",
                    signoff,
                    theme: draft.theme,
                    watermark: true,
                  }}
                />
              </motion.div>
              {songId && (
                <div className="mt-3 rounded-2xl bg-paper border border-ink/8 p-3.5 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-blush-soft text-blush">
                    <Music className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink/85 truncate">Their song is attached</p>
                    <p className="text-[11.5px] text-ink/45">One tap away, right under your words</p>
                  </div>
                </div>
              )}
              {draft.photos.length > 0 && (
                <div className="mt-3 rounded-2xl bg-paper border border-ink/8 p-3.5 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-soft text-[#8C6D10]">
                    <Camera className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink/85">{draft.photos.length} photo{draft.photos.length > 1 ? "s" : ""} inside</p>
                    <p className="text-[11.5px] text-ink/45">Shown with the full card</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Envelope open preview modal */}
      <OpenPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        data={{
          occasionLabel: effectiveOccasionLabel,
          recipientName: draft.recipientName || "them",
          senderName: draft.senderName || "you",
          message: draft.message || "Your words will be right here.",
          signoff,
          theme: draft.theme,
          songId,
          photos: draft.photos,
          watermark: true,
          plan: "free",
        }}
        occasionLabel={effectiveOccasionLabel}
      />
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-jade-soft text-jade text-[12px] font-semibold px-3.5 py-1.5">
      {children}
    </span>
  );
}

function OccasionPicker({
  value,
  custom,
  onPick,
  onCustom,
}: {
  value: string;
  custom: string;
  onPick: (id: string) => void;
  onCustom: (text: string) => void;
}) {
  const [tab, setTab] = useState<"any" | "special">("any");
  const [text, setText] = useState(custom);
  const list = OCCASIONS.filter((o) => o.category === tab);

  return (
    <div className="mt-7">
      <div
        role="tablist"
        aria-label="Kind of occasion"
        className="inline-flex p-1 rounded-full bg-ink/[0.05] border border-ink/10"
      >
        {(
          [
            ["any", "Any day", "💗"],
            ["special", "Special days", "🎂"],
          ] as const
        ).map(([id, label, emoji]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "px-4 py-2 rounded-full text-[13px] font-semibold transition-all",
              tab === id ? "bg-jade text-white" : "text-ink/70 hover:text-ink"
            )}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {list.map((o) => (
          <button
            key={o.id}
            onClick={() => onPick(o.id)}
            className={cn(
              "relative card-lift rounded-xl bg-paper border-2 px-3 py-3.5 text-center",
              value === o.id ? "border-jade" : "border-transparent hover:border-ink/10"
            )}
          >
            {o.badge && (
              <span
                className={cn(
                  "absolute -top-1.5 -right-1.5 text-[8.5px] font-bold tracking-wider px-1.5 py-0.5 rounded-full text-white",
                  o.badge === "HOT" ? "bg-blush" : "bg-gold"
                )}
              >
                {o.badge}
              </span>
            )}
            <span className="block text-xl mb-1" aria-hidden>{o.emoji}</span>
            <span className="text-[12.5px] font-medium text-ink/85">{o.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && text.trim() && onCustom(text.trim())}
          placeholder="Write your own occasion"
          maxLength={60}
          className="rounded-full bg-paper"
        />
        <Button
          variant="outline"
          onClick={() => text.trim() && onCustom(text.trim())}
          disabled={!text.trim()}
          className="rounded-full px-5"
        >
          Use it
        </Button>
      </div>
    </div>
  );
}

/* The message + wrapping step */
function MessageStep({
  draft,
  set,
  songId,
  fillSeed,
  onNext,
  canNext,
  recipientName,
}: {
  draft: Draft;
  set: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
  songId: string | null;
  fillSeed: () => void;
  onNext: () => void;
  canNext: boolean;
  recipientName: string;
}) {
  const [uploading, setUploading] = useState(false);
  const photos = draft.photos;

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = PHOTO_LIMITS.max - photos.length;
    if (room <= 0) {
      toast("That is already 5 photos. The envelope is full.");
      return;
    }
    setUploading(true);
    try {
      const next = [...photos];
      for (const file of Array.from(files).slice(0, room)) {
        try {
          const res = await compressPhoto(file);
          next.push(res.dataUrl);
        } catch {
          toast(`Panda could not read ${file.name}`);
        }
      }
      set("photos", next);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-7 space-y-7 max-w-xl">
      <div className="flex items-center gap-2 flex-wrap">
        <Chip>{occasionLabel(draft.occasion === "custom" ? "just-because" : draft.occasion)}</Chip>
        <Chip>For {recipientName || "them"}, from {draft.senderName || "you"}</Chip>
      </div>

      {/* Message editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="message" className="text-[13.5px] font-medium text-ink/80">
            Write your message
          </Label>
          <button
            onClick={fillSeed}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-jade hover:text-jade-deep transition-colors"
          >
            <Shuffle className="h-3.5 w-3.5" />
            Panda writes it
          </button>
        </div>
        <Textarea
          id="message"
          value={draft.message}
          onChange={(e) => set("message", e.target.value.slice(0, 300))}
          placeholder={
            MESSAGE_SEEDS[draft.occasion === "custom" ? "just-because" : draft.occasion]?.[0]?.replaceAll(
              "{name}",
              recipientName || "you"
            ) ?? "Dear you..."
          }
          rows={5}
          className="rounded-2xl text-[14.5px] leading-relaxed bg-paper resize-none"
          autoFocus
        />
        <div className="flex justify-between items-center">
          <p className="text-[11.5px] text-ink/40">
            <button
              onClick={fillSeed}
              className="font-medium text-jade link-pretty"
            >
              Stuck? Try one of Panda&rsquo;s lines.
            </button>
          </p>
          <p className={cn("text-[11.5px] tabular-nums", draft.message.length > 280 ? "text-blush" : "text-ink/40")}>
            {draft.message.length}/300
          </p>
        </div>
      </div>

      {/* Song */}
      <div className="space-y-2">
        <Label htmlFor="song" className="text-[13.5px] font-medium text-ink/80 flex items-center gap-2">
          <Music className="h-4 w-4 text-blush" />
          Add a song
          <span className="text-[11px] font-normal text-ink/40">one tap, playing while they read · with the full card</span>
        </Label>
        <div className="flex gap-2">
          <Input
            id="song"
            value={draft.songInput}
            onChange={(e) => set("songInput", e.target.value)}
            placeholder="Paste a YouTube link..."
            className="rounded-full bg-paper"
          />
        </div>
        {draft.songInput && !songId && (
          <p className="text-[12px] text-blush">That does not look like a YouTube link Panda can use.</p>
        )}
        {songId && (
          <div className="flex items-center gap-3 rounded-2xl bg-paper border border-ink/8 p-3">
            { }
            <img
              src={`https://i.ytimg.com/vi/${songId}/mqdefault.jpg`}
              alt="Song thumbnail"
              className="h-12 w-[72px] rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-ink/85">Song attached</p>
              <p className="text-[11.5px] text-ink/45">One tap away, right under your words</p>
            </div>
            <button
              onClick={() => set("songInput", "")}
              className="p-1.5 rounded-full hover:bg-ink/5"
              aria-label="Remove song"
            >
              <X className="h-4 w-4 text-ink/50" />
            </button>
          </div>
        )}
      </div>

      {/* Photos */}
      <div className="space-y-2">
        <Label className="text-[13.5px] font-medium text-ink/80 flex items-center gap-2">
          <Camera className="h-4 w-4 text-gold" />
          Add photos of you two
          <span className="text-[11px] font-normal text-ink/40">up to 5 · with the full card</span>
        </Label>
        <div className="flex gap-2.5 flex-wrap">
          {photos.map((p, i) => (
            <div key={i} className="relative group">
              { }
              <img src={p} alt={`Photo ${i + 1}`} className="h-20 w-20 rounded-xl object-cover border border-ink/10" />
              <button
                onClick={() => set("photos", photos.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove photo ${i + 1}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {photos.length < PHOTO_LIMITS.max && (
            <label className="grid h-20 w-20 place-items-center rounded-xl border-2 border-dashed border-ink/15 hover:border-jade/50 hover:bg-jade-soft/40 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => onFiles(e.target.files)}
              />
              {uploading ? (
                <span className="h-4 w-4 rounded-full border-2 border-jade/40 border-t-jade animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-ink/35" />
              )}
            </label>
          )}
        </div>
      </div>

      {/* Theme picker */}
      <div className="space-y-2">
        <p className="text-[13.5px] font-medium text-ink/80">Choose a theme for them</p>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {THEMES.map((t) => {
            const free = FREE_THEMES.includes(t.id);
            const active = draft.theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  set("theme", t.id);
                  if (!free) {
                    toast(`${t.name} rides along with the full card. Pick it freely, it locks in when you pay.`);
                  }
                }}
                title={t.blurb}
                className={cn(
                  "relative rounded-xl p-1.5 border-2 bg-paper flex flex-col items-center gap-1 transition-all",
                  active ? "border-jade" : "border-transparent hover:border-ink/10"
                )}
                aria-pressed={active}
              >
                {!free && (
                  <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-gold/90 text-white" aria-hidden>
                    <Lock className="h-2.5 w-2.5" />
                  </span>
                )}
                <span
                  className="h-9 w-12 rounded-md"
                  style={{ background: `linear-gradient(140deg, ${t.colors.envelope}, ${t.colors.flap})` }}
                  aria-hidden
                />
                <span className="text-[9.5px] font-medium text-ink/70 leading-none text-center">{t.name.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11.5px] text-ink/45">{getTheme(draft.theme).blurb}</p>
      </div>

      <Button onClick={onNext} disabled={!canNext} className="sheen w-full h-12 rounded-full text-[15px] font-semibold" size="lg">
        Preview <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* The final step: delivery decisions */
function ReadyStep({
  draft,
  signoff,
  songId,
  delivery,
  setDelivery,
  when,
  setWhen,
  date,
  setDate,
  recipientEmail,
  setRecipientEmail,
  onPreview,
  onPaid,
  onFree,
  busy,
  showAuthGate,
  onAuthed,
}: {
  draft: Draft;
  signoff: string;
  songId: string | null;
  delivery: "panda" | "self";
  setDelivery: (v: "panda" | "self") => void;
  when: "now" | "day";
  setWhen: (v: "now" | "day") => void;
  date: string;
  setDate: (v: string) => void;
  recipientEmail: string;
  setRecipientEmail: (v: string) => void;
  onPreview: () => void;
  onPaid: () => void;
  onFree: () => void;
  busy: boolean;
  showAuthGate: boolean;
  onAuthed: () => void;
}) {
  return (
    <div className="mt-7 max-w-xl space-y-6">
      <button
        onClick={onPreview}
        className="w-full card-lift rounded-2xl bg-paper border border-ink/8 px-5 py-4 flex items-center gap-4 text-left"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blush-soft">
          <PartyPopper className="h-5 w-5 text-blush" />
        </span>
        <span className="flex-1">
          <span className="block text-[14.5px] font-semibold text-ink">
            See how {draft.recipientName || "they"} will open it
          </span>
          <span className="block text-[12px] text-ink/50">The seal, the rise, the whole moment. Worth a look.</span>
        </span>
        <ArrowRight className="h-4 w-4 text-ink/40" />
      </button>

      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/45">How it reaches them</p>

        <button
          onClick={() => setDelivery("panda")}
          className={cn(
            "w-full rounded-2xl border-2 px-5 py-4 text-left transition-all",
            delivery === "panda" ? "border-jade bg-jade-soft/40" : "border-ink/10 bg-paper hover:border-ink/20"
          )}
          aria-pressed={delivery === "panda"}
        >
          <span className="flex items-start gap-3.5">
            <Mail className="h-5 w-5 mt-0.5 text-jade shrink-0" />
            <span className="flex-1">
              <span className="flex items-center gap-2 flex-wrap">
                <span className="text-[14.5px] font-semibold text-ink">Let Panda surprise them</span>
                <span className="rounded-full bg-gold text-ink text-[9.5px] font-bold uppercase tracking-wide px-2 py-0.5">most loved</span>
              </span>
              <span className="block text-[12.5px] text-ink-soft mt-1 leading-relaxed">
                It lands in their inbox on the morning you pick, and they open it like a gift they never saw coming.
              </span>
            </span>
            <span className={cn("grid h-5 w-5 place-items-center rounded-full border-2 shrink-0", delivery === "panda" ? "border-jade bg-jade" : "border-ink/25")}>
              {delivery === "panda" && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </span>
          </span>
        </button>

        {delivery === "panda" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden pl-2">
            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[13px] font-medium text-ink/75">
                  Their email, where the envelope lands
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="sarah@email.com"
                  className="rounded-full bg-paper"
                />
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setWhen("now")}
                  className={cn(
                    "flex-1 rounded-full border-2 px-4 py-2.5 text-[13px] font-semibold transition-all",
                    when === "now" ? "border-jade bg-jade text-white" : "border-ink/15 bg-paper text-ink/70"
                  )}
                >
                  Right away
                </button>
                <button
                  onClick={() => setWhen("day")}
                  className={cn(
                    "flex-1 rounded-full border-2 px-4 py-2.5 text-[13px] font-semibold transition-all inline-flex items-center justify-center gap-1.5",
                    when === "day" ? "border-jade bg-jade text-white" : "border-ink/15 bg-paper text-ink/70"
                  )}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  On a special day
                </button>
              </div>
              {when === "day" && (
                <div className="space-y-2">
                  <Input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className="rounded-full bg-paper"
                  />
                  <p className="text-[11.5px] text-ink/45">
                    Panda sends it that morning, so the surprise is on time. Edit or cancel any time before, full refund.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <button
          onClick={() => setDelivery("self")}
          className={cn(
            "w-full rounded-2xl border-2 px-5 py-4 text-left transition-all",
            delivery === "self" ? "border-jade bg-jade-soft/40" : "border-ink/10 bg-paper hover:border-ink/20"
          )}
          aria-pressed={delivery === "self"}
        >
          <span className="flex items-start gap-3.5">
            <Link2 className="h-5 w-5 mt-0.5 text-jade shrink-0" />
            <span className="flex-1">
              <span className="text-[14.5px] font-semibold text-ink">I&rsquo;ll share the link</span>
              <span className="block text-[12.5px] text-ink-soft mt-1 leading-relaxed">
                The free version, carried by you. Keeps the watermark and Bamboo Grove.
              </span>
            </span>
            <span className={cn("grid h-5 w-5 place-items-center rounded-full border-2 shrink-0", delivery === "self" ? "border-jade bg-jade" : "border-ink/25")}>
              {delivery === "self" && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </span>
          </span>
        </button>
      </div>

      {delivery === "panda" ? (
        <div className="space-y-2">
          <Button onClick={onPaid} disabled={busy} className="sheen w-full h-12 rounded-full text-[15.5px] font-semibold" size="lg">
            {busy ? "Preparing the envelope..." : <>Send it to {draft.recipientName || "them"} · $4.99</>}
          </Button>
          <button
            onClick={onFree}
            disabled={busy}
            className="w-full text-center text-[13px] font-medium text-ink/55 hover:text-jade py-2 transition-colors"
          >
            Or send the free version
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <Button onClick={onFree} disabled={busy} className="w-full h-12 rounded-full text-[15px] font-semibold" size="lg">
            {busy ? "Folding the card..." : <>Get my free card link</>}
          </Button>
          <p className="text-center text-[12px] text-ink/40">Needs a free account so your cards stay yours</p>
        </div>
      )}

      {showAuthGate && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6 sm:p-8 mt-2"
        >
          <p className="text-center font-display font-semibold text-ink text-[17px] mb-1">
            Almost there. Your card needs a home.
          </p>
          <p className="text-center text-[12.5px] text-ink/55 mb-5">
            A free account keeps your cards, so you can come back to them and watch the opens.
          </p>
          <AuthPanel
            mode="signup"
            compact
            onAuthed={() => {
              onAuthed();
            }}
          />
        </motion.div>
      )}
    </div>
  );
}

/* Share screen after the free card exists */
function ShareScreen({ slug, senderName, recipientName }: { slug: string; senderName: string; recipientName: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/c/${slug}` : `/c/${slug}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Older browsers and non-secure contexts: select the text so a
      // long-press or ctrl-C works.
      try {
        const range = document.createRange();
        const node = document.getElementById("share-url-text");
        if (node) {
          range.selectNodeContents(node);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      } catch {}
      toast("Copy did not work here. The link is selected, copy it manually.");
      return;
    }
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-ivory relative flex items-center justify-center px-4">
      <div className="absolute inset-0 bamboo-bg opacity-40" aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg glass-card rounded-3xl p-8 text-center"
      >
        <Envelope theme={getTheme("bamboo-grove")} open={true} width={220} className="mx-auto" />
        <h1 className="mt-8 font-display font-semibold text-ink text-2xl">
          {recipientName}&rsquo;s card is ready
        </h1>
        <p className="mt-2 text-[14px] text-ink-soft leading-relaxed">
          The link works anywhere: text, WhatsApp, email, tucked into a note.
          When {recipientName} opens it, the envelope does its thing.
        </p>

        <div className="mt-6 flex items-center gap-2 rounded-full border border-ink/15 bg-paper pl-5 pr-2 py-2">
          <span id="share-url-text" className="flex-1 truncate text-left text-[13px] text-ink/70">{url}</span>
          <Button onClick={copy} size="sm" className="rounded-full h-9 px-4">
            {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : "Copy"}
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2.5">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${recipientName}, Panda has something for you: ${url}`)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-paper px-4 py-2.5 text-[13px] font-medium text-ink/80 hover:border-jade/40 hover:text-jade transition-all"
          >
            WhatsApp
          </a>
          <a
            href={`sms:?&body=${encodeURIComponent(`${recipientName}, Panda has something for you: ${url}`)}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-paper px-4 py-2.5 text-[13px] font-medium text-ink/80 hover:border-jade/40 hover:text-jade transition-all"
          >
            Text
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(`Panda has a little something for ${recipientName}`)}&body=${encodeURIComponent(`Open it here: ${url}`)}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-paper px-4 py-2.5 text-[13px] font-medium text-ink/80 hover:border-jade/40 hover:text-jade transition-all"
          >
            Email
          </a>
        </div>

        <div className="mt-7 p-4 rounded-2xl bg-jade-soft/60 border border-jade/15 text-left">
          <p className="text-[13px] font-semibold text-ink/85 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-jade" />
            One small thing
          </p>
          <p className="mt-1 text-[12.5px] text-ink-soft leading-relaxed">
            This is the free card, so it carries the Panda Messages mark and skips the
            song and photos. If you ever want the full moment, the $4.99 upgrade
            lands it in their inbox on a day you pick.
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <a
            href="/dashboard"
            className="flex-1 inline-flex justify-center items-center rounded-full bg-jade text-white text-[14px] font-semibold py-3 hover:bg-jade-deep transition-colors"
          >
            See it in my dashboard
          </a>
          <a
            href="/create"
            className="flex-1 inline-flex justify-center items-center rounded-full border-2 border-ink/12 text-ink text-[14px] font-semibold py-3 hover:border-ink/30 transition-colors"
          >
            Make another
          </a>
        </div>
      </motion.div>
    </div>
  );
}
