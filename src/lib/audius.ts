import { sdk as createAudiusSdk, type AudiusSdk } from "@audius/sdk";

/**
 * Audius integration (server-only).
 *
 * The catalog is the world's largest open music library, and the SDK is the
 * supported way into it. We keep every Audius call behind this module so:
 *
 *   - the heavy SDK never reaches the browser bundle (the client talks to
 *     our own /api/audius/* routes instead),
 *   - an API key can be added later via AUDIUS_API_KEY without touching a
 *     single call site (requests work without one; the key lifts limits),
 *   - every response is normalized once, into the small shape the card
 *     product actually stores.
 */

const APP_NAME = "Panda Messages";

/** One shared client. The SDK is stateless for reads, so a singleton keeps
 *  connection reuse and middleware setup in one place. */
let client: AudiusSdk | null = null;

function audius(): AudiusSdk {
  if (!client) {
    const apiKey = process.env.AUDIUS_API_KEY?.trim() || undefined;
    client = apiKey
      ? createAudiusSdk({ apiKey, appName: APP_NAME })
      : createAudiusSdk({ appName: APP_NAME });
  }
  return client;
}

/* ------------------------------------------------------------------ */
/* The normalized track: everything a card needs, nothing it doesn't   */
/* ------------------------------------------------------------------ */

export interface AudiusTrack {
  id: string;
  title: string;
  artist: string;
  artistHandle: string;
  verified: boolean;
  /** 480x480 artwork; content-node URLs are https and stable per upload. */
  artwork: string | null;
  /** 150x150 artwork for tight spots (picker rows). */
  artworkSmall: string | null;
  /** Seconds. */
  duration: number;
  genre: string | null;
  mood: string | null;
  playCount: number;
  /** audius.co permalink for attribution and as a fallback link. */
  permalink: string | null;
}

/** Raw SDK track (camelCased by the SDK). Only the fields we read. */
interface RawTrack {
  id: string;
  title?: string;
  duration?: number;
  genre?: string | null;
  mood?: string | null;
  playCount?: number;
  permalink?: string | null;
  isStreamable?: boolean;
  isAvailable?: boolean;
  isStreamGated?: boolean;
  isDelete?: boolean;
  isUnlisted?: boolean;
  artwork?: Partial<Record<"_150x150" | "_480x480" | "_1000x1000", string>> | null;
  user?: { name?: string; handle?: string; isVerified?: boolean } | null;
}

function isPlayableTrack(t: RawTrack): boolean {
  // Gated, unlisted, withdrawn, or non-streamable tracks would give the
  // recipient a dead player, so they never make it into a card.
  return Boolean(
    t.id &&
    t.title &&
    t.isStreamable !== false &&
    t.isAvailable !== false &&
    t.isStreamGated !== true &&
    t.isDelete !== true &&
    t.isUnlisted !== true
  );
}

function normalizeTrack(t: RawTrack): AudiusTrack | null {
  if (!isPlayableTrack(t)) return null;
  return {
    id: t.id,
    title: (t.title ?? "Untitled").slice(0, 140),
    artist: (t.user?.name || t.user?.handle || "Unknown artist").slice(0, 90),
    artistHandle: (t.user?.handle ?? "").slice(0, 60),
    verified: Boolean(t.user?.isVerified),
    artwork: t.artwork?._480x480 ?? t.artwork?._1000x1000 ?? null,
    artworkSmall: t.artwork?._150x150 ?? t.artwork?._480x480 ?? null,
    duration: Math.max(0, Math.round(t.duration ?? 0)),
    genre: t.genre ?? null,
    mood: t.mood ?? null,
    playCount: t.playCount ?? 0,
    permalink: t.permalink ? `https://audius.co${t.permalink}` : null,
  };
}

function normalizeList(tracks: RawTrack[] | undefined): AudiusTrack[] {
  if (!Array.isArray(tracks)) return [];
  const out: AudiusTrack[] = [];
  for (const t of tracks) {
    const n = normalizeTrack(t);
    if (n) out.push(n);
    if (out.length >= 40) break; // a picker page never needs more
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* A tiny TTL cache: repeated searches shouldn't re-hit the network    */
/* ------------------------------------------------------------------ */

const CACHE_TTL_MS = 60_000;
const CACHE_MAX = 120;
const cache = new Map<string, { at: number; value: unknown }>();

function cacheGet<T>(key: string): T | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return hit.value as T;
}

function cacheSet(key: string, value: unknown): void {
  if (cache.size >= CACHE_MAX) {
    // Drop the oldest entry; Map preserves insertion order.
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), value });
}

/** Wrap any SDK read with one silent retry, then a clean error. */
async function withRetry<T>(op: () => Promise<T>): Promise<T> {
  try {
    return await op();
  } catch {
    await new Promise((r) => setTimeout(r, 350));
    return await op();
  }
}

/* ------------------------------------------------------------------ */
/* Public helpers used by the API routes                               */
/* ------------------------------------------------------------------ */

const SEARCH_FLOOR = 2; // shorter queries just match noise

export async function searchAudiusTracks(
  query: string,
  opts: { limit?: number; offset?: number } = {}
): Promise<AudiusTrack[]> {
  const q = query.trim().slice(0, 80);
  if (q.length < SEARCH_FLOOR) return [];
  const limit = Math.min(Math.max(opts.limit ?? 24, 1), 40);
  const offset = Math.min(Math.max(opts.offset ?? 0, 0), 400);
  const key = `search:${q}:${limit}:${offset}`;
  const cached = cacheGet<AudiusTrack[]>(key);
  if (cached) return cached;

  const res = await withRetry(() =>
    audius().tracks.searchTracks({ query: q, limit, offset, sortMethod: "relevant" })
  );
  const value = normalizeList(res.data as RawTrack[] | undefined);
  cacheSet(key, value);
  return value;
}

/** Curated genres the picker offers. Occasion-flavored, not a genre dump. */
export const PICKER_GENRES = [
  "Lo-Fi",
  "Pop",
  "R&B/Soul",
  "Acoustic",
  "Jazz",
  "Soundtrack",
  "Hip-Hop/Rap",
  "Electronic",
] as const;

export async function getAudiusTrending(
  genre?: string | null,
  opts: { limit?: number } = {}
): Promise<AudiusTrack[]> {
  const limit = Math.min(Math.max(opts.limit ?? 18, 1), 40);
  const cleanGenre = genre && (PICKER_GENRES as readonly string[]).includes(genre) ? genre : null;
  const key = `trending:${cleanGenre ?? "all"}:${limit}`;
  const cached = cacheGet<AudiusTrack[]>(key);
  if (cached) return cached;

  const res = await withRetry(() =>
    audius().tracks.getTrendingTracks({
      limit,
      time: "week",
      ...(cleanGenre ? { genre: cleanGenre } : {}),
    })
  );
  const value = normalizeList(res.data as RawTrack[] | undefined);
  cacheSet(key, value);
  return value;
}

/** "Surprise me": the network's feeling-lucky pool, hand-shuffled. */
export async function getAudiusLucky(): Promise<AudiusTrack[]> {
  const key = "lucky";
  const cached = cacheGet<AudiusTrack[]>(key);
  if (cached) {
    // Reshuffle the cached pool so repeat taps feel alive.
    return [...cached].sort(() => Math.random() - 0.5).slice(0, 12);
  }
  const res = await withRetry(() =>
    audius().tracks.getFeelingLuckyTracks({ limit: 40 })
  );
  const value = normalizeList(res.data as RawTrack[] | undefined);
  cacheSet(key, value);
  return value.sort(() => Math.random() - 0.5).slice(0, 12);
}

export async function getAudiusTrack(id: string): Promise<AudiusTrack | null> {
  const clean = id.trim().slice(0, 20);
  if (!clean) return null;
  const key = `track:${clean}`;
  const cached = cacheGet<AudiusTrack>(key);
  if (cached) return cached;

  const res = await withRetry(() => audius().tracks.getTrack({ trackId: clean }));
  const value = res.data ? normalizeTrack(res.data as RawTrack) : null;
  if (value) cacheSet(key, value);
  return value;
}

/**
 * The canonical stream URL for an Audius track. The endpoint answers with
 * a signed 302 to a content node; the audio proxy route follows it
 * server-side so the browser only ever sees our own domain.
 */
export function audiusStreamUrl(trackId: string): string {
  return `https://api.audius.co/v1/tracks/${encodeURIComponent(trackId)}/stream`;
}
