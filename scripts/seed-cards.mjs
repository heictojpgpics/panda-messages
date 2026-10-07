// Seed a set of test cards into the local SQLite DB so every theme/occasion
// combination can be inspected visually at /c/<slug>.
import Database from "better-sqlite3";
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(path.join(root, "db"), { recursive: true });
const db = new Database(path.join(root, "db", "panda.db"));

db.exec(`CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL, user_id TEXT, edit_token TEXT NOT NULL,
  sender_name TEXT NOT NULL, recipient_name TEXT NOT NULL, recipient_email TEXT,
  occasion TEXT NOT NULL, custom_occasion TEXT, message TEXT NOT NULL, signoff TEXT NOT NULL,
  theme TEXT NOT NULL, song_id TEXT, song_provider TEXT, photos TEXT,
  plan TEXT NOT NULL DEFAULT 'free', status TEXT NOT NULL DEFAULT 'draft',
  watermark INTEGER NOT NULL DEFAULT 1, reply_to_card_id TEXT,
  view_count INTEGER NOT NULL DEFAULT 0, opened_at TEXT, paid_at TEXT, payment_ref TEXT,
  checkout_provider TEXT, deliver_at TEXT, delivered_at TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`);
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS cards_slug_key ON cards (slug)`);

const sha = (s) => createHash("sha256").update(s).digest("hex");
const now = new Date().toISOString();

const cards = [
  {
    slug: "bamboo-heart",
    occasion: "love-you",
    theme: "bamboo-grove",
    sender: "Maya",
    recipient: "Daniel",
    message:
      "I found the note you left in my coat pocket last Tuesday, the one about the rain and the terrible coffee. I read it four times on the bus. I kept the ticket stub from that first awful date in my wallet ever since, and I have no plans to take it out. You make ordinary weeks feel like something I get to keep.",
    signoff: "yours, always",
    plan: "paid",
  },
  {
    slug: "birthday-candles",
    occasion: "birthday",
    theme: "birthday-bash",
    sender: "Priya",
    recipient: "Jonah",
    message:
      "Twenty-nine looks good on you already, and it has been one day. I still tell people about the birthday you decided to learn the accordion. Nothing you do next year will surprise me, and I cannot wait to be wrong about that.",
    signoff: "big love, P",
    plan: "paid",
  },
  {
    slug: "rose-valentine",
    occasion: "valentines",
    theme: "rose-garden",
    sender: "Theo",
    recipient: "Amara",
    message:
      "Every valentine card in the shop said something about forever. I just wanted to say thank you for the small things: the coffee you bring me without asking, the way you laugh at your own jokes before the punchline. Those are my forever, actually.",
    signoff: "all my heart",
    plan: "paid",
  },
  {
    slug: "winter-snow",
    occasion: "christmas",
    theme: "winter-wonderland",
    sender: "Grandma June",
    recipient: "Ellie",
    message:
      "The tree went up early this year. Your ornament from third grade still hangs front and center, the lopsided snowman. Come home whenever you can, the guest room has new blankets and the kettle is always on.",
    signoff: "love, Grandma",
    plan: "paid",
  },
  {
    slug: "autumn-thanks",
    occasion: "thank-you",
    theme: "autumn-leaves",
    sender: "Marcus",
    recipient: "Sam",
    message:
      "You drove four hours to help me move and never once mentioned the sofa. You carried the sofa. Twice, because I labeled the rooms wrong. Friends like you are rare and I wanted to say it properly, in ink.",
    signoff: "grateful, Marcus",
    plan: "paid",
  },
  {
    slug: "moonlit-night",
    occasion: "good-night",
    theme: "moonlit-garden",
    sender: "Ren",
    recipient: "Kai",
    message:
      "You fell asleep on the phone again last night. I stayed on the line a while. The city is loud here but your breathing through the speaker made it feel like home. Sleep well tonight, wherever the night finds you.",
    signoff: "til morning",
    plan: "paid",
  },
  {
    slug: "congrats-grad",
    occasion: "graduation",
    theme: "confetti-pop",
    sender: "Auntie Carol",
    recipient: "Nina",
    message:
      "Four years, two jobs, one thesis and countless instant noodles. You did the whole thing. I told everyone at book club before you even posted it. Wear the silly hat, take the photos, you earned every single one of them.",
    signoff: "proudly, Auntie C",
    plan: "paid",
  },
  {
    slug: "free-just-because",
    occasion: "just-because",
    theme: "bamboo-grove",
    sender: "Alex",
    recipient: "Jordan",
    message:
      "No occasion. I just remembered the thing you said about pigeons at 2am and laughed on the train like a lunatic. That is all. Carry on with your day.",
    signoff: "with love, Panda 💚",
    plan: "free",
  },
];

const insert = db.prepare(`
  INSERT OR REPLACE INTO cards (
    id, slug, user_id, edit_token, sender_name, recipient_name, recipient_email,
    occasion, custom_occasion, message, signoff, theme, song_id, song_provider, photos,
    plan, status, watermark, reply_to_card_id, view_count, opened_at, paid_at, payment_ref,
    checkout_provider, deliver_at, delivered_at, created_at, updated_at
  ) VALUES (
    @id, @slug, NULL, @edit_token, @sender, @recipient, NULL,
    @occasion, NULL, @message, @signoff, @theme, NULL, NULL, NULL,
    @plan, 'sent', @watermark, NULL, 0, NULL, NULL, NULL,
    NULL, NULL, NULL, @now, @now
  )
`);

for (const c of cards) {
  insert.run({
    id: randomBytes(8).toString("hex"),
    slug: c.slug,
    edit_token: sha(randomBytes(12).toString("hex")),
    sender: c.sender,
    recipient: c.recipient,
    occasion: c.occasion,
    message: c.message,
    signoff: c.signoff,
    theme: c.theme,
    plan: c.plan,
    watermark: c.plan === "paid" ? 0 : 1,
    now,
  });
}

const check = db.prepare("SELECT slug, plan, status, watermark FROM cards").all();
console.log("Seeded", cards.length, "cards. Verify:", check);
db.close();
