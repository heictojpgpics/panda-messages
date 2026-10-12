// seed-keepsake.mjs — the showcase card for the full-screen opening demo:
// paid, delivered, with an Audius song and three photos, styled after the
// kittymessages reference sample (Sam -> Sarah, birthday).
//
// The song is a frozen Audius snapshot: the letter renders it without a
// live lookup, while playback resolves fresh through /api/audius/stream.
import { getPlatformProxy } from "wrangler";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha = (s) => createHash("sha256").update(s).digest("hex");
const now = new Date().toISOString();

const CARD = {
  slug: "keepsake-demo",
  occasion: "birthday",
  theme: "golden-hour",
  sender: "Sam",
  recipient: "Sarah",
  message:
    "Another year of you, which is the best news all year. Thank you for every laugh, every late night, every cake we should not have eaten. Whatever this next one brings, I want a front-row seat.",
  signoff: "with love, Sam",
  song: {
    id: "W6ENB", // Jijikita — Love Story
    title: "Love Story",
    artist: "Jijikita",
    artwork: "https://val009.open-audio-validator.com/content/QmTesbUjfnJUnZRcauTathBmqTVDDjvJQscM3SHzCUYv1y/480x480.jpg",
    duration: 202,
    permalink: "https://audius.co/kitaurasyuji1/love-story",
  },
  photos: ["/demo/picnic.png", "/demo/candles.png", "/demo/selfie.png"],
};

const INSERT = `INSERT INTO cards (
  id, slug, user_id, edit_token, sender_name, recipient_name, recipient_email,
  occasion, custom_occasion, message, signoff, theme,
  song_id, song_provider, song_title, song_artist, song_artwork, song_duration, song_permalink,
  photos,
  plan, status, watermark, reply_to_card_id, view_count, opened_at, paid_at, payment_ref,
  checkout_provider, deliver_at, delivered_at, created_at, updated_at
) VALUES (
  ?, ?, 'seed-user', ?, ?, ?, 'seed@example.com',
  ?, NULL, ?, ?, ?,
  ?, 'audius', ?, ?, ?, ?, ?,
  ?,
  'paid', 'delivered', 0, NULL, 0, NULL, ?, 'mock_seed',
  'mock', ?, ?, ?, ?
)`;

async function main() {
  const proxy = await getPlatformProxy({
    configPath: path.join(root, "wrangler.toml"),
    experimental: { remoteBindings: false },
  });
  const db = proxy.env.DB;
  if (!db) throw new Error("No DB binding");

  const exists = await db.prepare("SELECT id FROM cards WHERE slug = ?").bind(CARD.slug).first();
  if (exists) {
    await db.prepare("DELETE FROM cards WHERE slug = ?").bind(CARD.slug).run();
    console.log("removed old keepsake-demo");
  }

  await db
    .prepare(INSERT)
    .bind(
      randomUUID(),
      CARD.slug,
      sha("edit:seed"),
      CARD.sender,
      CARD.recipient,
      CARD.occasion,
      CARD.message,
      CARD.signoff,
      CARD.theme,
      CARD.song.id,
      CARD.song.title,
      CARD.song.artist,
      CARD.song.artwork,
      CARD.song.duration,
      CARD.song.permalink,
      JSON.stringify(CARD.photos),
      now, // paid_at
      now, // deliver_at
      now, // delivered_at
      now, // created_at
      now // updated_at
    )
    .run();
  console.log("seeded keepsake-demo ->", CARD.slug, "with song", CARD.song.title);
  await proxy.dispose();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
