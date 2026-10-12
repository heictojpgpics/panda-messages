/**
 * The song a card carries, shared by the wizard, the letter, and the
 * server. Client-safe on purpose: no Audius SDK imports live here.
 *
 * A card's song is a frozen snapshot from the moment the sender picked it.
 * The audio itself always resolves fresh through /api/audius/stream/<id>,
 * so a song keeps playing even if its artwork host or metadata shifts.
 */

export interface CardSong {
  /** Audius track id, e.g. "D7KyD". */
  id: string;
  title: string;
  artist: string;
  /** 480x480 content-node URL (https). */
  artwork: string | null;
  /** Seconds. */
  duration: number;
  /** audius.co link, shown if audio ever fails. */
  permalink: string | null;
}

export function isCardSong(value: unknown): value is CardSong {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.id === "string" &&
    s.id.length > 0 &&
    s.id.length <= 20 &&
    /^[a-zA-Z0-9]+$/.test(s.id) &&
    typeof s.title === "string" &&
    typeof s.artist === "string"
  );
}

/** Same fields as the card row, as the letter consumes them. */
export interface CardSongView {
  id: string;
  provider: string;
  title: string | null;
  artist: string | null;
  artwork: string | null;
  duration: number | null;
  permalink: string | null;
}

export function songViewFromCard(card: {
  songId: string | null;
  songProvider: string | null;
  songTitle?: string | null;
  songArtist?: string | null;
  songArtwork?: string | null;
  songDuration?: number | null;
  songPermalink?: string | null;
}): CardSongView | null {
  if (!card.songId) return null;
  return {
    id: card.songId,
    provider: card.songProvider ?? "audius",
    title: card.songTitle ?? null,
    artist: card.songArtist ?? null,
    artwork: card.songArtwork ?? null,
    duration: card.songDuration ?? null,
    permalink: card.songPermalink ?? null,
  };
}

export function formatSongTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Server-side sanitation of a song snapshot as it is written to the cards
 * table. Nothing the client says is trusted at face value; lengths are
 * capped and URLs must be https.
 */
export function sanitizeSongSnapshot(song: unknown): {
  songId: string | null;
  songProvider: string | null;
  songTitle: string | null;
  songArtist: string | null;
  songArtwork: string | null;
  songDuration: number | null;
  songPermalink: string | null;
} {
  const empty = {
    songId: null,
    songProvider: null,
    songTitle: null,
    songArtist: null,
    songArtwork: null,
    songDuration: null,
    songPermalink: null,
  };
  if (!isCardSong(song)) return empty;

  const artwork =
    typeof song.artwork === "string" &&
    song.artwork.startsWith("https://") &&
    song.artwork.length <= 500
      ? song.artwork
      : null;
  const permalink =
    typeof song.permalink === "string" &&
    song.permalink.startsWith("https://audius.co/") &&
    song.permalink.length <= 300
      ? song.permalink
      : null;

  return {
    songId: song.id,
    songProvider: "audius",
    songTitle: song.title.slice(0, 140) || null,
    songArtist: song.artist.slice(0, 90) || null,
    songArtwork: artwork,
    songDuration:
      typeof song.duration === "number" && Number.isFinite(song.duration)
        ? Math.max(0, Math.round(song.duration))
        : null,
    songPermalink: permalink,
  };
}
