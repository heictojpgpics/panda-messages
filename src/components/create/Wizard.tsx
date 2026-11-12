"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { OCCASIONS, getOccasion, occasionLabel } from "@/data/occasions";
import { THEMES } from "@/data/themes";
import { MESSAGE_SEEDS } from "@/data/messages";
import { defaultSignoff } from "@/data/signoffs";
import { MiniCard } from "@/components/brand/MiniCard";
import { EnvelopeChip } from "@/components/brand/Envelope";
import { cn } from "@/lib/utils";
import { compressPhoto, PHOTO_LIMITS } from "@/lib/photo";
import { guessNameFromEmail } from "@/lib/name-from-email";
import { PACKS } from "@/lib/config";
import {
  ArrowLeft, ArrowRight, Shuffle, Music, Camera, Lock, X, Sparkles,
  Calendar, Mail, Link2, PartyPopper, Check, Eye, Users,
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
import { readDraftMemory, readEditToken, useCardMemoryStore } from "@/stores/card-memory";
import type { CardPhotoValue } from "@/lib/card-photos";
import { type CardSong } from "@/lib/song";
import { SongPicker } from "./SongPicker";

const DRAFT_MEMORY_KEY = "active";

interface Draft {
  occasion: string;
  customOccasion?: string;
  recipientName: string;
  senderName: string;
  message: string;
  signoff: string;
  theme: string;
  /** The Audius pick, structured and snapshotted at save time. */
  song: CardSong | null;
  /** A YouTube song from a card made before Audius; kept, never re-picked. */
  legacySongId: string | null;
  songInput: string;
  photos: CardPhotoValue[];
  step?: number;
}

const STEP_TITLES = ["What's the occasion?", "Who is it for?", "What would you like to say?", "Their card is ready"];

export function Wizard() {
  const router = useRouter();
  const params = useSearchParams();
  const editSlug = params.get("edit");

  const initial = useMemo<Draft>(() => {
    // URL params are hydration-safe: the server sees the same URL. Anything
    // from localStorage joins after mount, in the restore effect below, so
    // the first client paint always agrees with the server render.
    const occasion = params.get("occasion") ?? "";
    const custom = params.get("custom") ?? "";
    const to = params.get("to") ?? "";
    const valid = OCCASIONS.some((o) => o.id === occasion);
    const draft: Draft = {
      occasion: valid ? occasion : custom ? "custom" : "",
      customOccasion: custom,
      recipientName: to,
      senderName: "",
      message: "",
      signoff: "",
      theme: "bamboo-grove",
      song: null,
      legacySongId: null,
      songInput: "",
      photos: [],
    };
    return draft;
  }, [params]);

  const [step, setStep] = useState(() => {
    if (editSlug) return 3;
    if (initial.occasion && initial.recipientName) return 1;
    return 0;
  });
  const [draft, setDraft] = useState<Draft>(initial);

  // A refresh mid-flow should never cost anyone their words. The saved
  // draft is applied after mount (never during render) so the server and
  // the first client frame match exactly, then the restored step takes over.
  useEffect(() => {
    const saved: Partial<Draft> = readDraftMemory(DRAFT_MEMORY_KEY);
    if (!saved || Object.keys(saved).length === 0) return;
    const occasion = params.get("occasion") ?? saved.occasion ?? "";
    const custom = params.get("custom") ?? saved.customOccasion ?? "";
    const to = params.get("to") ?? saved.recipientName ?? "";
    const valid = OCCASIONS.some((o) => o.id === occasion);
    setDraft((d) => ({
      ...d,
      occasion: valid ? occasion : custom ? "custom" : d.occasion,
      customOccasion: custom || d.customOccasion,
      recipientName: to || saved.recipientName || d.recipientName,
      senderName: saved.senderName ?? d.senderName,
      message: saved.message ?? d.message,
      signoff: saved.signoff ?? d.signoff,
      theme: saved.theme ?? d.theme,
      song: saved.song ?? d.song,
      legacySongId: saved.legacySongId ?? d.legacySongId,
      songInput: saved.songInput ?? d.songInput,
      photos: Array.isArray(saved.photos) ? saved.photos : d.photos,
    }));
    if (!editSlug) {
      const savedStep = typeof saved.step === "number" && saved.step >= 0 && saved.step <= 3 ? saved.step : null;
      if (savedStep !== null) {
        setStep(savedStep);
      } else if (occasion && (to || saved.recipientName) && (saved.message || "")) {
        setStep(2);
      } else if (occasion && (to || saved.recipientName)) {
        setStep(1);
      }
    }
    // Runs once, on mount, merging whatever the URL carried with whatever
    // was saved.
  }, []);
  const [seedIdx, setSeedIdx] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  // A card already saved server-side this session: reused on retry instead
  // of creating a twin every time checkout hiccups.
  const [madeCard, setMadeCard] = useState<{ id: string; slug: string; editToken?: string } | null>(null);
  const [editingCard, setEditingCard] = useState<{ slug: string; editToken?: string } | null>(
    editSlug ? { slug: editSlug } : null
  );

  // Delivery state (step 4)
  const [when, setWhen] = useState<"now" | "day">("now");
  const [date, setDate] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");

  // Packs, credits and bulk sending.
  const [packId, setPackId] = useState<string>("single");
  const [credits, setCredits] = useState(0);
  const [spendCredits, setSpendCredits] = useState(true);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkRecipients, setBulkRecipients] = useState<{ email: string; name: string; guessed: boolean }[]>([]);
  const [madeBatch, setMadeBatch] = useState<{ batchId: string; cards: { id: string; slug: string; editToken: string }[] } | null>(null);

  // Credits live on the account; one fetch when the send step is near.
  useEffect(() => {
    if (step < 2) return;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null, credits: 0 }))
      .then((me) => setCredits(me.credits ?? 0))
      .catch(() => {});
  }, [step]);
  const saveDraftMemory = useCardMemoryStore((state) => state.saveDraft);
  const clearDraftMemory = useCardMemoryStore((state) => state.clearDraft);
  const rememberEditToken = useCardMemoryStore((state) => state.rememberEditToken);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => {
      const next = { ...d, [key]: value, step: key === "step" ? (value as number) : d.step };
      saveDraftMemory(DRAFT_MEMORY_KEY, next);
      return next;
    });
  };

  const setStepTracked = (n: number) => {
    setStep(n);
    set("step", n);
  };

  // Loading an existing card into the wizard (edit mode from the dashboard).
  // Keyed on editSlug alone so it runs exactly once per card: a self-
  // referencing dependency would refetch forever and wipe the user's edits.
  useEffect(() => {
    if (!editSlug) return;
    let cancelled = false;
    const editToken = readEditToken(editSlug);
    fetch(`/api/cards?slug=${editSlug}${editToken ? `&editToken=${encodeURIComponent(editToken)}` : ""}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("not yours");
        return r.json();
      })
      .then((c) => {
        if (cancelled) return;
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
          song: c.song ?? null,
          legacySongId: !c.song && c.songId && c.songProvider !== "audius" ? c.songId : null,
          songInput: "",
          photos: Array.isArray(c.photos) ? c.photos : [],
        }));
        setOriginalLegacySongId(
          !c.song && c.songId && c.songProvider !== "audius" ? c.songId : null
        );
      })
      .catch(() => {
        if (cancelled) return;
        toast("That card could not be loaded. It may not be yours.");
        router.replace("/dashboard");
      });
    return () => {
      cancelled = true;
    };
  }, [editSlug, router]);

  const occasion = draft.occasion;
  const seeds = MESSAGE_SEEDS[occasion] ?? MESSAGE_SEEDS["just-because"];
  const effectiveOccasionLabel =
    draft.occasion === "custom" && draft.customOccasion ? draft.customOccasion : occasionLabel(occasion);
  // Editing a card that still carries its old YouTube song: remember what
  // the server had, so an untouched song is left exactly as it is.
  const [originalLegacySongId, setOriginalLegacySongId] = useState<string | null>(null);
  const songId = draft.legacySongId;
  const signoff = draft.signoff.trim() || defaultSignoff(occasion);

  const fillSeed = () => {
    const seed = seeds[seedIdx % seeds.length];
    const msg = seed.replaceAll("{name}", draft.recipientName || "you");
    set("message", msg);
    setSeedIdx((i) => i + 1);
  };

  // ---------- persistence helpers ----------
  const saveEditToken = (slug: string, token: string, cardId?: string) => {
    rememberEditToken(token, slug, cardId ?? "");
  };

  // ---------- actions ----------
  /** The song fields each save path sends. Three shapes: an Audius pick
   *  replaces whatever was there; an untouched legacy song is sent as
   *  nothing; a removal (of either kind) sends an explicit clear. */
  const songPatch = (): Record<string, unknown> => {
    if (draft.song) return { song: draft.song };
    if (originalLegacySongId && draft.legacySongId) return {}; // untouched YouTube song
    if (originalLegacySongId || draft.legacySongId) return { song: null }; // removed
    return { song: null };
  };

  const saveEdits = async (): Promise<boolean> => {
    if (!editingCard) return false;
    setBusy(true);
    try {
      const photosSaved = await syncPhotos(editingCard);
      if (!photosSaved) return false;
      const res = await fetch(`/api/cards/${editingCard.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: editingCard.slug,
          editToken: editingCard.editToken,
          senderName: draft.senderName,
          recipientName: draft.recipientName,
          message: draft.message,
          signoff,
          theme: draft.theme,
          ...songPatch(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error ?? "The save did not go through.");
        return false;
      }
      toast("Saved. Panda resealed the envelope.");
      clearDraftMemory(DRAFT_MEMORY_KEY);
      router.push(`/dashboard?watch=${editingCard.slug}`);
      return true;
    } catch {
      toast("The connection hiccuped. Nothing was lost.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const syncPhotos = async (card: { slug: string; editToken?: string }): Promise<boolean> => {
    const res = await fetch(`/api/cards/${card.slug}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editToken: card.editToken, photos: draft.photos }),
    });
    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      if (Array.isArray(body.photos)) set("photos", body.photos);
      return true;
    }
    const body = await res.json().catch(() => ({}));
    toast(body.error ?? "Panda could not save the photos.");
    return false;
  };

  const createCard = async (): Promise<{ id: string; slug: string; editToken?: string } | null> => {
    // Reuse the card already made this session instead of minting twins
    // when checkout fails and the user tries again.
    if (madeCard) {
      await fetch(`/api/cards/${madeCard.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: madeCard.slug,
          editToken: madeCard.editToken,
          senderName: draft.senderName,
          recipientName: draft.recipientName,
          message: draft.message,
          signoff,
          theme: draft.theme,
          ...songPatch(),
        }),
      }).catch(() => {});
      if (!(await syncPhotos(madeCard))) return null;
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
        song: draft.song,
        // Photos are stored separately in private R2 once this draft has a
        // stable, owner-protected card id. They never travel in a D1 row.
        photos: [],
        replyTo: params.get("replyTo"),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error ?? "Something went wrong");
      return null;
    }
    setMadeCard(data);
    if (!(await syncPhotos(data))) return null;
    return data;
  };

  const startCheckout = async (opts: { batchId?: string; slug?: string; cardId?: string; editToken?: string }) => {
    setBusy(true);
    try {
      const deliverAt = when === "day" && date ? new Date(date + "T09:00:00").toISOString() : null;
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: opts.batchId,
          slug: opts.slug,
          packId,
          editToken: opts.editToken,
          recipientEmail: !opts.batchId ? recipientEmail : null,
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

  /** Send on credits already owned: no checkout, straight out the door. */
  const sendOnCredits = async (batchId: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/checkout/use-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "The send did not go through.");
        setSpendCredits(false);
        return;
      }
      clearDraftMemory(DRAFT_MEMORY_KEY);
      router.push(`/dashboard?watch=${data.slug ?? ""}&sent=${data.sent ?? 1}`);
    } finally {
      setBusy(false);
    }
  };

  /** Parse a pasted blob of emails into deduped, name-guessed recipients. */
  const parseBulkInput = (text: string) => {
    setBulkInput(text);
    const emails = text
      .split(/[\s,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.includes("@"));
    const seen = new Set<string>();
    const next: { email: string; name: string; guessed: boolean }[] = [];
    for (const email of emails) {
      if (seen.has(email)) continue;
      seen.add(email);
      const guess = guessNameFromEmail(email);
      next.push({ email, name: guess, guessed: Boolean(guess) });
    }
    setBulkRecipients(next.slice(0, 15));
    // The pack should fit the crowd: smallest pack that covers everyone.
    if (next.length > 5) setPackId("pack15");
    else if (next.length > 1) setPackId("pack5");
    else setPackId("single");
  };

  const bulkReady = bulkRecipients.length >= 2 && bulkRecipients.every((r) => r.name.trim().length > 0);

  const bulkSend = async () => {
    if (!bulkReady || busy) return;
    setBusy(true);
    try {
      // Reuse the batch already made this session (names may have been
      // corrected) instead of minting twins on every retry.
      let batch = madeBatch;
      if (!batch) {
        const res = await fetch("/api/cards/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base: {
              senderName: draft.senderName,
              occasion: draft.occasion === "custom" ? "just-because" : draft.occasion,
              customOccasion: draft.occasion === "custom" ? draft.customOccasion ?? "" : null,
              message: draft.message,
              signoff,
              theme: draft.theme,
              song: draft.song,
              replyTo: params.get("replyTo"),
            },
            recipients: bulkRecipients.map((r) => ({ email: r.email, name: r.name })),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast(data.error ?? "The batch did not come together.");
          return;
        }
        batch = data;
        setMadeBatch(data);
        for (const c of data.cards) if (c.editToken) saveEditToken(c.slug, c.editToken, c.id);
      } else {
        // Names may have been corrected after the first attempt: sync them.
        await Promise.all(
          bulkRecipients.map((r, i) =>
            fetch(`/api/cards/${batch!.cards[i]?.slug ?? ""}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                slug: batch!.cards[i]?.slug,
                editToken: batch!.cards[i]?.editToken,
                recipientName: r.name,
              }),
            }).catch(() => {})
          )
        );
      }
      if (!batch) return;
      if (spendCredits && credits >= bulkRecipients.length) {
        await sendOnCredits(batch.batchId);
      } else {
        await startCheckout({ batchId: batch.batchId });
      }
    } finally {
      setBusy(false);
    }
  };

  const paidSend = async () => {
    if (when === "day" && !date) {
      toast("Pick the day Panda should send it.");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const card = await createCard();
      if (!card) return;
      if (card.editToken) saveEditToken(card.slug, card.editToken, card.id);
      if (spendCredits && credits >= 1) {
        // A single card is its own batch of one.
        await sendOnCredits(card.id);
      } else {
        const email = recipientEmail.trim();
        if (!email) {
          toast("Where should Panda bring it? Their email is needed.");
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
          toast("That email does not look right. Check it once more?");
          return;
        }
        await startCheckout({ slug: card.slug, cardId: card.id, editToken: card.editToken });
      }
    } finally {
      setBusy(false);
    }
  };

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
                    onOpenPicker={() => setPickerOpen(true)}
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
                    when={when}
                    setWhen={setWhen}
                    date={date}
                    setDate={setDate}
                    recipientEmail={recipientEmail}
                    setRecipientEmail={setRecipientEmail}
                    packId={packId}
                    setPackId={setPackId}
                    credits={credits}
                    spendCredits={spendCredits}
                    setSpendCredits={setSpendCredits}
                    bulkMode={bulkMode}
                    setBulkMode={setBulkMode}
                    bulkInput={bulkInput}
                    parseBulkInput={parseBulkInput}
                    bulkRecipients={bulkRecipients}
                    setBulkRecipients={setBulkRecipients}
                    bulkReady={bulkReady}
                    onPreview={() => setPreviewOpen(true)}
                    onPaid={paidSend}
                    onBulkSend={bulkSend}
                    busy={busy}
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
              {(draft.song || draft.legacySongId) && (
                <div className="mt-3 rounded-2xl bg-paper border border-ink/8 p-3.5 flex items-center gap-3">
                  {draft.song?.artwork ? (
                     
                    <img src={draft.song.artwork} alt="" className="h-9 w-9 rounded-xl object-cover" />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-blush-soft text-blush">
                      <Music className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink/85 truncate">
                      {draft.song ? draft.song.title : "Their song is attached"}
                    </p>
                    <p className="text-[11.5px] text-ink/45 truncate">
                      {draft.song?.artist ?? "One tap away, right under your words"}
                    </p>
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
          occasionId: draft.occasion,
          recipientName: draft.recipientName || "them",
          senderName: draft.senderName || "you",
          message: draft.message || "Your words will be right here.",
          signoff,
          theme: draft.theme,
          song: draft.song
            ? {
                id: draft.song.id,
                provider: "audius",
                title: draft.song.title,
                artist: draft.song.artist,
                artwork: draft.song.artwork,
                duration: draft.song.duration,
                permalink: draft.song.permalink,
              }
            : null,
          songId,
          photos: draft.photos,
          watermark: true,
          plan: "free",
        }}
        occasionLabel={effectiveOccasionLabel}
      />

      {/* The Audius song picker */}
      <SongPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        recipientName={draft.recipientName}
        onPick={(song) => set("song", song)}
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
              "relative card-lift tap-feedback rounded-xl bg-paper border-2 px-3 py-3.5 text-center",
              value === o.id ? "border-jade bg-jade-soft/30" : "border-transparent hover:border-ink/10"
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
  onOpenPicker,
  fillSeed,
  onNext,
  canNext,
  recipientName,
}: {
  draft: Draft;
  set: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
  onOpenPicker: () => void;
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
          <p className="text-[11.5px] text-ink/50">
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
        <Label className="text-[13.5px] font-medium text-ink/80 flex items-center gap-2">
          <Music className="h-4 w-4 text-blush" />
          Add a song
          <span className="text-[11px] font-normal text-ink/40">millions of tracks, one tap while they read · with the full card</span>
        </Label>

        {draft.song ? (
          <div className="flex items-center gap-3 rounded-2xl bg-paper border border-ink/8 p-3 shadow-[0_10px_26px_-18px_rgba(22,36,28,0.4)]">
            {draft.song.artwork ? (
               
              <img
                src={draft.song.artwork}
                alt=""
                className="h-12 w-12 rounded-xl object-cover"
              />
            ) : (
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-blush-soft text-blush">
                <Music className="h-5 w-5" />
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-ink/85 truncate">{draft.song.title}</p>
              <p className="text-[11.5px] text-ink/45 truncate">
                {draft.song.artist}
                {draft.song.duration ? ` · ${Math.floor(draft.song.duration / 60)}:${String(draft.song.duration % 60).padStart(2, "0")}` : ""}
              </p>
            </div>
            <button
              onClick={onOpenPicker}
              className="text-[11.5px] font-medium text-ink/45 hover:text-jade px-2 py-1"
            >
              change
            </button>
            <button
              onClick={() => set("song", null)}
              className="p-1.5 rounded-full hover:bg-ink/5"
              aria-label="Remove song"
            >
              <X className="h-4 w-4 text-ink/50" />
            </button>
          </div>
        ) : draft.legacySongId ? (
          /* A card from before Audius: its YouTube song rides along unless removed. */
          <div className="flex items-center gap-3 rounded-2xl bg-paper border border-ink/8 p-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-ink/[0.06] text-ink/60">
              <Music className="h-5 w-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-ink/85">A song from before is still attached</p>
              <p className="text-[11.5px] text-ink/45">Keep it, or pick a fresh one from the catalog</p>
            </div>
            <button
              onClick={onOpenPicker}
              className="text-[11.5px] font-medium text-jade hover:text-jade/80 px-2 py-1"
            >
              pick new
            </button>
            <button
              onClick={() => set("legacySongId", null)}
              className="p-1.5 rounded-full hover:bg-ink/5"
              aria-label="Remove song"
            >
              <X className="h-4 w-4 text-ink/50" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenPicker}
            className="group flex w-full items-center gap-3 rounded-2xl border border-dashed border-ink/15 bg-paper/60 px-4 py-3.5 text-left transition-all hover:border-blush/45 hover:bg-blush/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush/40"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-blush-soft text-blush transition-transform group-hover:scale-105">
              <Music className="h-4.5 w-4.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-medium text-ink/80">Pick a song from the catalog</span>
              <span className="mt-0.5 block text-[11.5px] text-ink/45">
                Search millions of tracks, hear 30 seconds, attach the one that fits
              </span>
            </span>
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-ink/30 transition-transform group-hover:translate-x-0.5 group-hover:text-blush" />
          </button>
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
              <img
                src={typeof p === "string" ? p : ""}
                alt={`Photo ${i + 1}`}
                className="h-20 w-20 rounded-xl object-cover border border-ink/10"
              />
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
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {THEMES.map((t) => {
            const active = draft.theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => set("theme", t.id)}
                title={t.blurb}
                className={cn(
                  "relative tap-feedback rounded-xl p-1.5 border-2 bg-paper flex flex-col items-center gap-1 transition-all",
                  active
                    ? "border-jade bg-jade-soft/30 shadow-[0_8px_20px_-10px_rgba(21,122,85,0.45)]"
                    : "border-transparent hover:border-ink/10"
                )}
                aria-pressed={active}
              >
                <EnvelopeChip theme={t} size={46} />
                <span className="flex min-h-[22px] items-center px-0.5 text-[9px] font-medium text-ink/70 leading-[1.2] text-center">{t.name}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11.5px] text-ink/50">
          {getTheme(draft.theme).blurb} All fourteen come with every card; try them in the preview, switch as often as you like.
        </p>
      </div>

      <Button onClick={onNext} disabled={!canNext} className="sheen w-full h-12 rounded-full text-[15px] font-semibold" size="lg">
        Preview <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* The final step: delivery, pack and (maybe) a whole batch */
function ReadyStep({
  draft,
  signoff,
  when,
  setWhen,
  date,
  setDate,
  recipientEmail,
  setRecipientEmail,
  packId,
  setPackId,
  credits,
  spendCredits,
  setSpendCredits,
  bulkMode,
  setBulkMode,
  bulkInput,
  parseBulkInput,
  bulkRecipients,
  setBulkRecipients,
  bulkReady,
  onPreview,
  onPaid,
  onBulkSend,
  busy,
}: {
  draft: Draft;
  signoff: string;
  when: "now" | "day";
  setWhen: (v: "now" | "day") => void;
  date: string;
  setDate: (v: string) => void;
  recipientEmail: string;
  setRecipientEmail: (v: string) => void;
  packId: string;
  setPackId: (v: string) => void;
  credits: number;
  spendCredits: boolean;
  setSpendCredits: (v: boolean) => void;
  bulkMode: boolean;
  setBulkMode: (v: boolean) => void;
  bulkInput: string;
  parseBulkInput: (v: string) => void;
  bulkRecipients: { email: string; name: string; guessed: boolean }[];
  setBulkRecipients: (v: { email: string; name: string; guessed: boolean }[]) => void;
  bulkReady: boolean;
  onPreview: () => void;
  onPaid: () => void;
  onBulkSend: () => void;
  busy: boolean;
}) {
  const needed = bulkMode ? bulkRecipients.length : 1;
  const covered = spendCredits && credits >= needed;
  const pack = PACKS.find((p) => p.id === packId) ?? PACKS[0];

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

      {/* Credits the sender already owns */}
      {credits > 0 && (
        <div className="rounded-2xl border border-jade/25 bg-jade-soft/40 px-5 py-4 flex items-start gap-3.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-jade text-white text-[13px] font-bold">
            {credits}
          </span>
          <div className="flex-1">
            <p className="text-[13.5px] font-semibold text-ink">
              You have {credits} card{credits === 1 ? "" : "s"} paid for
            </p>
            <p className="text-[12px] text-ink/60 leading-relaxed">
              {covered
                ? `This ${bulkMode ? `batch of ${needed}` : "send"} is covered by your pack. Nothing to pay today.`
                : `This needs ${needed}. Your credits take ${Math.min(credits, needed)} of it, a small pack covers the rest.`}
            </p>
          </div>
          {credits >= needed && (
            <button
              onClick={() => setSpendCredits(!spendCredits)}
              aria-pressed={covered}
              className={cn(
                "shrink-0 self-center rounded-full border-2 px-4 py-2 text-[12.5px] font-semibold transition-all",
                covered
                  ? "border-jade bg-jade text-white"
                  : "border-ink/15 bg-paper text-ink/60 hover:border-ink/30"
              )}
            >
              {covered ? "Using credits" : "Buy a pack instead"}
            </button>
          )}
        </div>
      )}

      {/* How it reaches them */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/45">How it reaches them</p>

        <div className="rounded-2xl border-2 border-jade bg-jade-soft/30 px-5 py-4">
          <span className="flex items-start gap-3.5">
            <Mail className="h-5 w-5 mt-0.5 text-jade shrink-0" />
            <span className="flex-1">
              <span className="flex items-center gap-2 flex-wrap">
                <span className="text-[14.5px] font-semibold text-ink">Panda delivers it for you</span>
                <span className="rounded-full bg-gold text-ink text-[9.5px] font-bold uppercase tracking-wide px-2 py-0.5">the whole moment</span>
              </span>
              <span className="block text-[12.5px] text-ink-soft mt-1 leading-relaxed">
                {bulkMode
                  ? `Every person gets their own envelope, with their own name on it, in their own inbox.`
                  : `It lands in their inbox on the morning you pick, and they open it like a gift they never saw coming.`}
              </span>
            </span>
          </span>

          {!bulkMode ? (
            <div className="mt-4 space-y-4 pl-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[13px] font-medium text-ink/75">
                  Their email, where the envelope lands
                </Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
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
          ) : (
            <div className="mt-4 space-y-4 pl-2">
              <div className="space-y-2">
                <Label htmlFor="bulk-emails" className="text-[13px] font-medium text-ink/75">
                  Paste their emails (up to 15)
                </Label>
                <textarea
                  id="bulk-emails"
                  value={bulkInput}
                  onChange={(e) => parseBulkInput(e.target.value)}
                  rows={3}
                  placeholder={"mayaa@email.com, jonas.k@work.com,\ngrandma.june@gmail.com"}
                  className="w-full rounded-2xl border border-ink/12 bg-paper px-4 py-3 text-[13.5px] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-jade/30"
                />
                <p className="text-[11.5px] text-ink/45 leading-relaxed">
                  Separate with commas, spaces or new lines. Duplicates quietly disappear.
                  Everyone gets the same card, addressed to them alone.
                </p>
              </div>

              {bulkRecipients.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[12.5px] font-semibold text-ink/80">
                    {bulkRecipients.length} envelope{bulkRecipients.length === 1 ? "" : "s"} ready
                    <span className="ml-2 font-normal text-ink/50">
                      Panda guessed the names from the emails. Fix any that look wrong.
                    </span>
                  </p>
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {bulkRecipients.map((r, i) => (
                      <div key={r.email} className="flex items-center gap-2 rounded-xl border border-ink/10 bg-paper px-3 py-2">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-jade-soft text-[12px] font-bold text-jade" aria-hidden>
                          {r.name.trim() ? r.name.trim().charAt(0).toUpperCase() : "?"}
                        </span>
                        <Input
                          value={r.name}
                          onChange={(e) => {
                            const next = [...bulkRecipients];
                            next[i] = { ...r, name: e.target.value.slice(0, 40), guessed: false };
                            setBulkRecipients(next);
                          }}
                          placeholder="their name"
                          aria-label={`Name for ${r.email}`}
                          className="h-9 flex-1 border-0 bg-transparent px-1 text-[13px] focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <span className="hidden sm:block min-w-0 flex-1 truncate text-[11.5px] text-ink/40">{r.email}</span>
                        {r.guessed && <span className="shrink-0 rounded-full bg-ink/8 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-ink/45">guessed</span>}
                        <button
                          onClick={() => setBulkRecipients(bulkRecipients.filter((_, j) => j !== i))}
                          aria-label={`Remove ${r.email}`}
                          className="shrink-0 grid h-7 w-7 place-items-center rounded-full text-ink/40 hover:bg-blush-soft hover:text-blush transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bulk toggle */}
        <button
          onClick={() => setBulkMode(!bulkMode)}
          aria-pressed={bulkMode}
          className={cn(
            "w-full rounded-2xl border-2 px-5 py-3.5 text-left transition-all flex items-center gap-3",
            bulkMode ? "border-jade/50 bg-paper" : "border-dashed border-ink/20 bg-transparent hover:border-jade/40"
          )}
        >
          <Users className={cn("h-4.5 w-4.5 shrink-0", bulkMode ? "text-jade" : "text-ink/50")} />
          <span className="flex-1">
            <span className="block text-[13.5px] font-semibold text-ink">
              {bulkMode ? "Back to one special person" : "Sending to several people?"}
            </span>
            <span className="block text-[12px] text-ink/50 leading-relaxed">
              {bulkMode
                ? "One envelope, one inbox, one moment."
                : "Birthdays, a whole team, the entire family list. Paste the emails once."}
            </span>
          </span>
        </button>
      </div>

      {/* The pack */}
      {!covered && (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/45">Pick your pack</p>
          <div className="grid grid-cols-3 gap-2.5">
            {PACKS.map((p) => {
              const selected = packId === p.id;
              const fits = bulkMode ? p.cards >= needed : true;
              return (
                <button
                  key={p.id}
                  onClick={() => setPackId(p.id)}
                  aria-pressed={selected}
                  className={cn(
                    "relative tap-feedback rounded-2xl border-2 px-2.5 py-4 text-center transition-all",
                    selected
                      ? "border-jade bg-jade-soft/40 shadow-[0_10px_24px_-14px_rgba(21,122,85,0.5)]"
                      : "border-ink/10 bg-paper hover:border-ink/25"
                  )}
                >
                  {p.id === "pack5" && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-ink">
                      most loved
                    </span>
                  )}
                  {p.id === "pack15" && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-white">
                      best value
                    </span>
                  )}
                  <span className="block font-display font-semibold text-ink text-[22px] leading-none">
                    ${p.price}
                  </span>
                  <span className="mt-1.5 block text-[11.5px] font-semibold text-ink/80 leading-tight">
                    {p.cards} card{p.cards === 1 ? "" : "s"}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] text-ink/45">{p.perCardLabel}</span>
                  {bulkMode && fits && p.cards > needed && (
                    <span className="mt-1 block text-[9.5px] font-semibold text-jade leading-tight">
                      {p.cards - needed} spare
                    </span>
                  )}
                  {bulkMode && !fits && (
                    <span className="mt-1 block text-[9.5px] text-blush/80 leading-tight">too small</span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[11.5px] text-ink/50 leading-relaxed">
            Every card in a pack is a full card: the delivery, the song, the photos, no watermark.
            Unused cards stay on your account for whenever the next moment comes.{" "}
            <span className="text-ink/70 font-medium">{pack.blurb}</span>
          </p>
        </div>
      )}

      {/* The button */}
      {bulkMode ? (
        <div className="space-y-2">
          <Button
            onClick={onBulkSend}
            disabled={busy || !bulkReady}
            className="sheen w-full h-12 rounded-full text-[15px] font-semibold"
            size="lg"
          >
            {busy
              ? "Folding the envelopes..."
              : covered
                ? `Send ${bulkRecipients.length} cards · covered by your pack`
                : `Send ${bulkRecipients.length} cards · $${pack.price}`}
          </Button>
          {!bulkReady && bulkRecipients.length > 0 && (
            <p className="text-center text-[12px] text-ink/45">
              Every envelope needs a name. Fill in the ones Panda could not guess.
            </p>
          )}
        </div>
      ) : (
        <Button
          onClick={onPaid}
          disabled={busy}
          className="sheen w-full h-12 rounded-full text-[15.5px] font-semibold"
          size="lg"
        >
          {busy
            ? "Preparing the envelope..."
            : covered
              ? `Send it to ${draft.recipientName || "them"} · covered by your pack`
              : `Send it to ${draft.recipientName || "them"} · $${pack.price}`}
        </Button>
      )}
      <p className="text-center text-[12px] text-ink/55">
        Secure checkout · cancel before it sends for a full refund
      </p>
    </div>
  );
}
