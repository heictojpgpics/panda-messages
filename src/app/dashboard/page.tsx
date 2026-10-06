"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { PandaMoodFace } from "@/components/brand/PandaMood";
import { cn } from "@/lib/utils";
import { occasionLabel } from "@/data/occasions";
import { getTheme } from "@/data/themes";
import { EnvelopeChip } from "@/components/brand/Envelope";
import { toast } from "sonner";
import {
  Send, LogOut, Copy, X, Radio, Inbox, Clock, Check, Sparkles,
  Eye, Heart, MessageCircle, Ban, Plus, ExternalLink,
} from "lucide-react";

interface DashCard {
  id: string;
  slug: string;
  status: string;
  plan: string;
  occasion: string;
  recipientName: string;
  senderName: string;
  deliverAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  viewCount: number;
  createdAt: string;
  theme: string;
  hasSong: boolean;
  photoCount: number;
}

interface DashEvent {
  id: number;
  cardId: string;
  type: string;
  meta: Record<string, unknown> | null;
  at: string;
}

interface OutboxMail {
  id: number;
  cardId: string | null;
  to: string;
  subject: string;
  status: string;
  provider: string;
  html: string;
  kind: string;
  at: string;
}

type Tab = "cards" | "activity" | "outbox";

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  draft: { label: "draft", cls: "bg-ink/8 text-ink/50" },
  awaiting_payment: { label: "checkout open", cls: "bg-gold-soft text-[#8C6D10]" },
  scheduled: { label: "scheduled", cls: "bg-jade-soft text-jade" },
  sent: { label: "delivered", cls: "bg-gold-soft text-[#8C6D10]" },
  opened: { label: "opened 💚", cls: "bg-blush-soft text-blush" },
  cancelled: { label: "cancelled", cls: "bg-ink/8 text-ink/40" },
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory" />}>
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const router = useRouter();
  const params = useSearchParams();
  const watchSlug = params.get("watch");

  const [loaded, setLoaded] = useState(false);
  const [authed, setAuthed] = useState(true);
  const [cards, setCards] = useState<DashCard[]>([]);
  const [events, setEvents] = useState<DashEvent[]>([]);
  const [outbox, setOutbox] = useState<OutboxMail[]>([]);
  const [user, setUser] = useState<{ email: string; name: string | null } | null>(null);
  const [tab, setTab] = useState<Tab>(watchSlug ? "cards" : "cards");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/account/cards");
      if (res.status === 401) {
        setAuthed(false);
        setLoaded(true);
        return;
      }
      const data = await res.json();
      setCards(data.cards ?? []);
      setEvents(data.events ?? []);
      setOutbox(data.outbox ?? []);
      setUser(data.user ?? null);
      setAuthed(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-ivory grid place-items-center">
        <span className="h-9 w-9 rounded-full border-[3px] border-jade/30 border-t-jade animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-ivory grid place-items-center px-4 text-center">
        <div className="flex flex-col items-center gap-4 max-w-sm">
          <PandaMoodFace mood="sleepy" size={80} />
          <h1 className="font-display font-semibold text-ink text-xl">
            Panda looked everywhere…
          </h1>
          <p className="text-[13.5px] text-ink-soft">
            {params.get("paid")
              ? "Just paid? Check your inbox, the password link is already there. Or sign in if you had an account."
              : "No account on this device. Sign in and your cards will be right here."}
          </p>
          <div className="flex gap-2.5 mt-2">
            <Link
              href="/sign-in"
              className="rounded-full bg-jade text-white text-[14px] font-semibold px-6 py-3"
            >
              Sign in
            </Link>
            <Link
              href="/"
              className="rounded-full border-2 border-ink/12 text-ink text-[14px] font-semibold px-6 py-3"
            >
              Back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const watchCard = cards.find((c) => c.slug === watchSlug) ?? null;

  return (
    <div className="min-h-screen bg-ivory relative">
      <div className="absolute inset-0 bamboo-bg opacity-30 pointer-events-none" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:block text-[12.5px] text-ink/50">{user?.email}</span>
            <Link
              href="/create"
              className="sheen inline-flex items-center gap-1.5 rounded-full bg-jade text-white text-[13.5px] font-semibold px-4 py-2.5 shadow-[0_10px_24px_-10px_rgba(21,122,85,0.65)] hover:bg-jade-deep"
            >
              <Plus className="h-4 w-4" />
              New card
            </Link>
            <button
              onClick={async () => {
                await fetch("/api/auth/signout", { method: "POST" });
                router.push("/");
              }}
              className="grid h-10 w-10 place-items-center rounded-full border border-ink/12 text-ink/60 hover:text-ink hover:border-ink/30 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Watch panel */}
        {watchCard && <WatchPanel card={watchCard} onDone={() => router.push("/dashboard")} />}

        {/* Tabs */}
        <div className="mt-8 flex gap-1.5 p-1 rounded-full bg-ink/[0.05] w-fit border border-ink/10">
          {(
            [
              ["cards", "My cards", Send],
              ["activity", "Activity", Radio],
              ["outbox", "Panda's outbox", Inbox],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-all",
                tab === id ? "bg-jade text-white" : "text-ink/60 hover:text-ink"
              )}
              aria-pressed={tab === id}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mt-6 pb-16">
          {tab === "cards" && <CardsTab cards={cards} onChange={load} />}
          {tab === "activity" && <ActivityTab events={events} cards={cards} />}
          {tab === "outbox" && <OutboxTab mails={outbox} />}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Cards list ---------------- */

function CardsTab({ cards, onChange }: { cards: DashCard[]; onChange: () => void }) {
  if (cards.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center flex flex-col items-center gap-4">
        <PandaMoodFace mood="bashful" size={84} />
        <h2 className="font-display font-semibold text-ink text-lg">No cards yet</h2>
        <p className="text-[13.5px] text-ink-soft max-w-xs">
          The first one is the best one. Someone out there has no idea what is coming.
        </p>
        <Link
          href="/create"
          className="sheen mt-2 inline-flex items-center gap-2 rounded-full bg-jade text-white text-[14.5px] font-semibold px-6 py-3.5"
        >
          <Sparkles className="h-4 w-4" />
          Make your first card
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <AnimatePresence initial={false}>
        {cards.map((card) => (
          <CardRow key={card.id} card={card} onChange={onChange} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function CardRow({ card, onChange }: { card: DashCard; onChange: () => void }) {
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const theme = getTheme(card.theme);
  const status = STATUS_STYLE[card.status] ?? STATUS_STYLE.draft;

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/c/${card.slug}`);
    setCopied(true);
    toast("Link copied. Go make someone's day.");
    setTimeout(() => setCopied(false), 2200);
  };

  const cancel = async () => {
    if (!confirm(`Cancel the card for ${card.recipientName}? They never see it, and the payment is refunded in full.`)) return;
    setCancelling(true);
    try {
      const tokens = JSON.parse(localStorage.getItem("panda-edit-tokens") ?? "{}");
      const res = await fetch(`/api/cards/${card.slug}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editToken: tokens[card.slug] }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Could not cancel.");
        return;
      }
      toast(data.refunded ? "Cancelled, refund on its way." : "Cancelled.");
      onChange();
    } finally {
      setCancelling(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="card-lift rounded-3xl bg-paper border border-ink/8 p-5 flex flex-col gap-4"
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 mt-0.5">
          <EnvelopeChip theme={theme} size={56} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-semibold text-ink text-[16px] truncate">
              For {card.recipientName}
            </p>
            <span className={cn("text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5", status.cls)}>
              {status.label}
            </span>
          </div>
          <p className="text-[12px] text-ink/50 mt-0.5">
            {occasionLabel(card.occasion)} · from {card.senderName}
            {card.hasSong ? " · 🎵" : ""}
            {card.photoCount ? ` · ${card.photoCount} photo${card.photoCount > 1 ? "s" : ""}` : ""}
          </p>
          {card.plan === "paid" && card.status === "scheduled" && card.deliverAt && (
            <p className="text-[12px] text-jade mt-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Lands {new Date(card.deliverAt).toLocaleDateString(undefined, { month: "long", day: "numeric" })}, in the morning
            </p>
          )}
          {card.status === "opened" && (
            <p className="text-[12px] text-blush mt-1 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Opened {new Date(card.openedAt!).toLocaleDateString()} · viewed {card.viewCount}×
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={`/c/${card.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 px-4 py-2 text-[12.5px] font-medium text-ink/70 hover:border-jade/40 hover:text-jade transition-all"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Their view
        </a>
        <button
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 px-4 py-2 text-[12.5px] font-medium text-ink/70 hover:border-jade/40 hover:text-jade transition-all"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-jade" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy link"}
        </button>
        {card.status === "scheduled" && card.plan === "paid" && (
          <button
            onClick={cancel}
            disabled={cancelling}
            className="inline-flex items-center gap-1.5 rounded-full border border-blush/25 text-blush px-4 py-2 text-[12.5px] font-medium hover:bg-blush-soft/50 transition-all ml-auto"
          >
            <Ban className="h-3.5 w-3.5" />
            {cancelling ? "Cancelling..." : "Cancel + refund"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ---------------- Live watch panel ---------------- */

function WatchPanel({ card, onDone }: { card: DashCard; onDone: () => void }) {
  const [log, setLog] = useState<DashEvent[]>([]);
  const [live, setLive] = useState(false);
  const [closed, setClosed] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const tokens = JSON.parse(localStorage.getItem("panda-edit-tokens") ?? "{}");
    const token = tokens[card.slug];
    const url = `/api/cards/${card.slug}/events${token ? `?editToken=${token}` : ""}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => setLive(true);
    es.onerror = () => setLive(false);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "state") return;
        setLog((l) => [...l.filter((x) => x.id !== data.id), { id: data.id, cardId: card.id, type: data.type, meta: data.meta, at: data.at }]);
      } catch {}
    };

    return () => es.close();
  }, [card.slug, card.id]);

  if (closed) return null;

  const phase = (() => {
    if (card.status === "opened") return "opened";
    if (card.status === "sent") return "delivered";
    if (card.status === "scheduled") return "scheduled";
    return "waiting";
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 glass-card rounded-3xl p-6 relative overflow-hidden"
    >
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl bg-jade/10" aria-hidden />
      <div className="flex items-center gap-4">
        <PandaMoodFace mood={phase === "opened" ? "delighted" : "sleepy"} size={62} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-ink text-[17px]">
            Watching for {card.recipientName}
          </p>
          <p className="text-[12.5px] text-ink/50 flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", live ? "bg-jade live-dot" : "bg-ink/20")} />
            {live ? "Live. This updates the instant something happens." : "Reconnecting..."}
          </p>
        </div>
        <button
          onClick={() => {
            esRef.current?.close();
            setClosed(true);
            onDone();
          }}
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink/5 text-ink/50"
          aria-label="Stop watching"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex gap-2.5 flex-wrap min-h-[42px]">
        {log.length === 0 && (
          <p className="text-[12.5px] text-ink/40 py-2">
            Nothing yet. {card.deliverAt
              ? `Panda delivers on ${new Date(card.deliverAt).toLocaleDateString(undefined, { month: "long", day: "numeric" })}.`
              : "The envelope is out there."}
          </p>
        )}
        <AnimatePresence>
          {log.map((e) => (
            <motion.span
              key={e.id}
              initial={{ opacity: 0, scale: 0.8, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-medium",
                e.type === "opened" && "bg-blush-soft text-blush",
                e.type === "delivered" && "bg-gold-soft text-[#8C6D10]",
                e.type === "reacted" && "bg-jade-soft text-jade",
                e.type === "replied" && "bg-jade-soft text-jade",
                !["opened", "delivered", "reacted", "replied"].includes(e.type) && "bg-ink/5 text-ink/60"
              )}
            >
              {e.type === "opened" && <Eye className="h-3.5 w-3.5" />}
              {e.type === "delivered" && <Send className="h-3.5 w-3.5" />}
              {e.type === "reacted" && <Heart className="h-3.5 w-3.5 fill-current" />}
              {e.type === "replied" && <MessageCircle className="h-3.5 w-3.5" />}
              {e.type === "opened" ? "They opened it. Right now." :
                e.type === "delivered" ? "Delivered to their inbox" :
                e.type === "reacted" ? `They sent a ${(e.meta as { kind?: string })?.kind ?? "reaction"}` :
                e.type === "replied" ? `Reply from ${(e.meta as { authorName?: string })?.authorName ?? "them"}` :
                e.type}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ---------------- Activity ---------------- */

function ActivityTab({ events, cards }: { events: DashEvent[]; cards: DashCard[] }) {
  const byId = new Map(cards.map((c) => [c.id, c]));
  if (events.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-10 text-center text-[13.5px] text-ink-soft">
        Quiet so far. Activity shows up here the moment a card moves.
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {events.map((e) => {
        const card = byId.get(e.cardId);
        return (
          <div key={e.id} className="flex items-center gap-3.5 rounded-2xl bg-paper border border-ink/8 px-4 py-3">
            <span className={cn(
              "grid h-9 w-9 place-items-center rounded-full shrink-0",
              e.type === "opened" && "bg-blush-soft text-blush",
              e.type === "delivered" && "bg-gold-soft text-[#8C6D10]",
              e.type === "reacted" && "bg-jade-soft text-jade",
              e.type === "replied" && "bg-jade-soft text-jade",
              !["opened", "delivered", "reacted", "replied"].includes(e.type) && "bg-ink/5 text-ink/50"
            )}>
              {e.type === "opened" ? <Eye className="h-4 w-4" /> :
                e.type === "delivered" ? <Send className="h-4 w-4" /> :
                e.type === "reacted" ? <Heart className="h-4 w-4 fill-current" /> :
                e.type === "replied" ? <MessageCircle className="h-4 w-4" /> :
                <Clock className="h-4 w-4" />}
            </span>
            <p className="text-[13.5px] text-ink/80 flex-1 min-w-0 truncate">
              {e.type === "opened" ? `${card?.recipientName ?? "They"} opened the card` :
                e.type === "delivered" ? `Card delivered for ${card?.recipientName ?? "them"}` :
                e.type === "reacted" ? `${card?.recipientName ?? "They"} reacted ${(e.meta as { kind?: string })?.kind ?? ""}` :
                e.type === "replied" ? `${(e.meta as { authorName?: string })?.authorName ?? "They"} wrote back` :
                e.type === "paid" ? "Payment received" :
                e.type === "scheduled" ? "Card scheduled" :
                e.type === "created" ? "Card made" : e.type}
            </p>
            <span className="text-[11.5px] text-ink/35 whitespace-nowrap">
              {new Date(e.at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Outbox ---------------- */

function OutboxTab({ mails }: { mails: OutboxMail[] }) {
  const [openId, setOpenId] = useState<number | null>(null);

  if (mails.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-10 text-center text-[13.5px] text-ink-soft">
        Empty. This is where every email Panda sends shows up, exactly as it arrived.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <p className="text-[12px] text-ink/45 px-1">
        Every delivery email, kept as a record. In demo mode nothing leaves the building. With a
        Resend key, these are the exact emails that go out.
      </p>
      {mails.map((m) => (
        <div key={m.id} className="rounded-2xl bg-paper border border-ink/8 overflow-hidden">
          <button
            onClick={() => setOpenId(openId === m.id ? null : m.id)}
            className="w-full flex items-center gap-3.5 px-4 py-3 text-left"
            aria-expanded={openId === m.id}
          >
            <span className={cn(
              "grid h-9 w-9 place-items-center rounded-full shrink-0",
              m.status === "sent" ? "bg-jade-soft text-jade" : "bg-ink/5 text-ink/40"
            )}>
              <Inbox className="h-4 w-4" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13.5px] font-medium text-ink/85 truncate">{m.subject}</span>
              <span className="block text-[11.5px] text-ink/45 truncate">to {m.to} · {m.provider} · {m.status}</span>
            </span>
          </button>
          {openId === m.id && (
            <div className="border-t border-ink/8 p-4 bg-white/60">
              <div
                className="mx-auto max-w-md rounded-2xl overflow-hidden border border-ink/10 bg-white shadow-sm [&_a]:text-jade"
                dangerouslySetInnerHTML={{ __html: m.html }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
