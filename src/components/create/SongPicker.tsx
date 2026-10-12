"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatSongTime, type CardSong } from "@/lib/song";
import {
  Music,
  Search,
  Play,
  Pause,
  Sparkles,
  BadgeCheck,
  Loader2,
  RefreshCw,
} from "lucide-react";

/**
 * The song picker: a crate-digging moment inside the wizard.
 *
 * Everything the sender browses comes from our own /api/audius routes,
 * which keep the Audius catalog behind our domain: one tight CSP, one
 * rate limit, and previews that stream through the same pipe the
 * recipient's letter will use, so what the sender hears is exactly what
 * the recipient gets.
 *
 * One shared audio element previews one track at a time, gently
 * auto-stopping after 30 seconds: enough to feel a song, not enough to
 * turn card-making into a listening party.
 */

const PREVIEW_MS = 30_000;

interface PickerTrack {
  id: string;
  title: string;
  artist: string;
  artistHandle: string;
  verified: boolean;
  artwork: string | null;
  artworkSmall: string | null;
  duration: number;
  genre: string | null;
  mood: string | null;
  playCount: number;
  permalink: string | null;
}

function toCardSong(t: PickerTrack): CardSong {
  return {
    id: t.id,
    title: t.title,
    artist: t.artist,
    artwork: t.artwork ?? t.artworkSmall ?? null,
    duration: t.duration,
    permalink: t.permalink,
  };
}

function compactCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

/** Three bars that dance while a preview plays. */
function EqualizerBars({ color = "currentColor" }: { color?: string }) {
  return (
    <span className="flex h-3.5 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-full"
          style={{
            background: color,
            height: "100%",
            animation: `eq-bar 0.9s ease-in-out ${i * 0.18}s infinite alternate`,
          }}
        />
      ))}
      <style>{`@keyframes eq-bar { from { height: 30% } to { height: 100% } }`}</style>
    </span>
  );
}

function TrackRow({
  track,
  previewing,
  playing,
  onPreview,
  onSelect,
}: {
  track: PickerTrack;
  previewing: boolean;
  playing: boolean;
  onPreview: (t: PickerTrack) => void;
  onSelect: (t: PickerTrack) => void;
}) {
  const [artBroken, setArtBroken] = useState(false);
  return (
    <button
      type="button"
      onClick={() => onSelect(track)}
      className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-ink/[0.045] focus-visible:bg-ink/[0.045] focus-visible:outline-none"
    >
      <span className="relative h-11 w-11 shrink-0" aria-hidden>
        {track.artworkSmall && !artBroken ? (
           
          <img
            src={track.artworkSmall}
            alt=""
            className="h-full w-full rounded-[8px] object-cover shadow-[0_2px_6px_-2px_rgba(22,36,28,0.35)]"
            loading="lazy"
            onError={() => setArtBroken(true)}
          />
        ) : (
          <span className="grid h-full w-full place-items-center rounded-[8px] bg-blush/20">
            <Music className="h-4 w-4 text-blush" />
          </span>
        )}
        {previewing && (
          <span className="absolute inset-0 grid place-items-center rounded-[8px] bg-black/45 backdrop-blur-[1px]">
            {playing ? <EqualizerBars color="#fff" /> : <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}
          </span>
        )}
      </span>

      <span
        role="button"
        tabIndex={0}
        aria-label={previewing && playing ? `Pause preview of ${track.title}` : `Preview ${track.title}`}
        onClick={(e) => {
          e.stopPropagation();
          onPreview(track);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            onPreview(track);
          }
        }}
        className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full bg-ink/[0.06] text-ink/70 transition-colors hover:bg-blush hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush/50"
      >
        {previewing && playing ? (
          <Pause className="h-3 w-3 fill-current" />
        ) : (
          <Play className="h-3 w-3 translate-x-[1px] fill-current" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1">
          <span className="truncate text-[13.5px] font-medium text-ink/90">{track.title}</span>
          {track.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-jade" aria-label="Verified artist" />}
        </span>
        <span className="mt-0.5 block truncate text-[11.5px] text-ink/50">
          {track.artist}
          {track.playCount > 0 ? ` · ${compactCount(track.playCount)} plays` : ""}
        </span>
      </span>

      <span className="shrink-0 text-[11px] tabular-nums text-ink/40">
        {formatSongTime(track.duration)}
      </span>
    </button>
  );
}

export function SongPicker({
  open,
  onOpenChange,
  onPick,
  recipientName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (song: CardSong) => void;
  recipientName?: string;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [genre, setGenre] = useState<string | null>(null);
  const [tracks, setTracks] = useState<PickerTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [surprised, setSurprised] = useState(false);

  // Preview state: the id being previewed, and whether audio flows.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);

  const stopPreview = useCallback(() => {
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    const el = audioRef.current;
    if (el) {
      el.pause();
      try {
        el.src = "";
      } catch {
        /* already clear */
      }
    }
    setPreviewId(null);
    setPreviewPlaying(false);
  }, []);

  // Debounce typing into searches.
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 350);
    return () => window.clearTimeout(t);
  }, [query]);

  // One audio element lives for the picker's whole life; the modal closing
  // silences it.
  useEffect(() => {
    if (!open) stopPreview();
  }, [open, stopPreview]);
  useEffect(() => () => stopPreview(), [stopPreview]);

  const load = useCallback(async (url: string, label: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "no luck");
      const list: PickerTrack[] = Array.isArray(data.tracks) ? data.tracks : [];
      setTracks(list);
      if (list.length === 0 && label === "search") {
        setError("No songs matched. Try a couple of words, or an artist's name.");
      }
    } catch {
      setTracks([]);
      setError("Panda could not reach the music shelf. One more try?");
    } finally {
      setLoading(false);
    }
  }, []);

  // Opening the picker shows this week's trending; searching takes over.
  useEffect(() => {
    if (!open) return;
    if (debounced.length >= 2) {
      void load(`/api/audius/search?q=${encodeURIComponent(debounced)}&limit=30`, "search");
      return;
    }
    if (surprised) return; // surprise list stays until dismissed
    if (debounced.length === 0) {
      const g = genre ? `&genre=${encodeURIComponent(genre)}` : "";
      void load(`/api/audius/trending?limit=18${g}`, "trending");
    }
     
  }, [open, debounced, genre, surprised]);

  const surprise = useCallback(async () => {
    setQuery("");
    setDebounced("");
    setGenre(null);
    setSurprised(true);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/audius/lucky");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "no luck");
      setTracks(Array.isArray(data.tracks) ? data.tracks : []);
    } catch {
      setError("The crate of records is out of reach. One more try?");
    } finally {
      setLoading(false);
    }
  }, []);

  const preview = useCallback(
    (track: PickerTrack) => {
      const el = audioRef.current;
      if (!el) return;
      if (previewId === track.id && previewPlaying) {
        el.pause();
        setPreviewPlaying(false);
        return;
      }
      if (previewId === track.id && !previewPlaying) {
        setPreviewPlaying(true);
        void el.play().catch(() => setPreviewPlaying(false));
        return;
      }
      if (stopTimerRef.current !== null) window.clearTimeout(stopTimerRef.current);
      el.src = `/api/audius/stream/${encodeURIComponent(track.id)}`;
      el.currentTime = 0;
      setPreviewId(track.id);
      setPreviewPlaying(false);
      void el
        .play()
        .then(() => {
          setPreviewPlaying(true);
          // Previews are a taste, not the whole meal.
          stopTimerRef.current = window.setTimeout(() => stopPreview(), PREVIEW_MS);
        })
        .catch(() => {
          setPreviewId(null);
          setPreviewPlaying(false);
        });
    },
    [previewId, previewPlaying, stopPreview]
  );

  const genres = useMemo(
    () => ["Lo-Fi", "Pop", "R&B/Soul", "Acoustic", "Jazz", "Soundtrack", "Hip-Hop/Rap", "Electronic"],
    []
  );

  const heading = debounced.length >= 2 ? "What Panda found" : surprised ? "Fresh out of the crate" : genre ? `${genre}, this week` : "Trending this week";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="top-[50%] translate-y-[-50%] max-h-[86vh] w-[min(94vw,560px)] gap-0 overflow-hidden rounded-3xl border-ink/10 bg-cream p-0 sm:max-w-[560px] [&>*]:min-w-0"
      >
        <audio ref={audioRef} preload="none" />

        <DialogHeader className="min-w-0 space-y-1 px-5 pt-5 text-left">
          <DialogTitle className="font-display text-[19px] font-semibold text-ink">
            {recipientName ? `The song that goes with ${recipientName}'s card` : "Pick the song"}
          </DialogTitle>
          <DialogDescription className="text-[12.5px] leading-relaxed text-ink/55">
            Millions of tracks from the open Audius catalog. Tap a row to attach it; tap the little play to
            hear 30 seconds first.
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 px-5 pb-3 pt-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (surprised) setSurprised(false);
              }}
              placeholder="Search a song, an artist, a feeling..."
              className="h-11 rounded-full border-ink/10 bg-white pl-10 pr-10 text-[14px] shadow-none focus-visible:ring-blush/40"
              maxLength={80}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-ink/40 hover:text-ink/70"
              >
                clear
              </button>
            )}
          </div>

          {/* Mobile: a scrollable chip rail. Desktop: the same chips wrap
              into tidy rows so nothing hides off-screen. */}
          <div className="mt-3 flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible">
            <button
              type="button"
              onClick={surprise}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-blush/30 bg-blush/10 px-3 py-1.5 text-[12px] font-medium text-blush transition-colors hover:bg-blush/20"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Surprise me
            </button>
            <button
              type="button"
              onClick={() => {
                setSurprised(false);
                setGenre(null);
              }}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                genre === null && !surprised
                  ? "border-ink/15 bg-ink text-cream"
                  : "border-ink/12 bg-white text-ink/65 hover:bg-ink/[0.04]"
              )}
            >
              This week
            </button>
            {genres.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setSurprised(false);
                  setGenre(g);
                }}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                  genre === g && !surprised
                    ? "border-ink/15 bg-ink text-cream"
                    : "border-ink/12 bg-white text-ink/65 hover:bg-ink/[0.04]"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[180px] max-h-[46vh] min-w-0 overflow-y-auto px-3 pb-4">
          {loading ? (
            <div className="space-y-1.5 px-2 pt-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-1.5">
                  <span className="h-11 w-11 animate-pulse rounded-[8px] bg-ink/[0.07]" />
                  <span className="flex-1 space-y-1.5">
                    <span className="block h-3 w-2/3 animate-pulse rounded-full bg-ink/[0.07]" />
                    <span className="block h-2.5 w-1/3 animate-pulse rounded-full bg-ink/[0.05]" />
                  </span>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-blush/12">
                <Music className="h-5 w-5 text-blush" />
              </span>
              <p className="text-[13px] text-ink/60">{error}</p>
              <button
                type="button"
                onClick={() => {
                  if (debounced.length >= 2) {
                    void load(`/api/audius/search?q=${encodeURIComponent(debounced)}&limit=30`, "search");
                  } else if (surprised) {
                    void surprise();
                  } else {
                    const g = genre ? `&genre=${encodeURIComponent(genre)}` : "";
                    void load(`/api/audius/trending?limit=18${g}`, "trending");
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white px-4 py-2 text-[12.5px] font-medium text-ink/75 hover:bg-ink/[0.04]"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Try again
              </button>
            </div>
          ) : tracks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-jade/12">
                <Music className="h-5 w-5 text-jade" />
              </span>
              <p className="text-[13px] text-ink/60">Nothing on this shelf yet. Try a search, or let Panda surprise you.</p>
            </div>
          ) : (
            <>
              <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-ink/35">
                {heading}
              </p>
              <div className="space-y-0.5">
                {tracks.map((t) => (
                  <TrackRow
                    key={t.id}
                    track={t}
                    previewing={previewId === t.id}
                    playing={previewPlaying}
                    onPreview={preview}
                    onSelect={(track) => {
                      stopPreview();
                      onPick(toCardSong(track));
                      onOpenChange(false);
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
