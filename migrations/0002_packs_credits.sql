-- Packs, credits and bulk sending.
-- users.credits: unused paid sends, bought as packs, spent one per card.
-- cards.batch_id: cards born in one bulk send share a batch id.
-- cards.pack_id: the pack that paid for the card.
-- purchases: one row per completed pack purchase, for receipts and history.

ALTER TABLE users ADD COLUMN credits INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cards ADD COLUMN batch_id TEXT;
ALTER TABLE cards ADD COLUMN pack_id TEXT;

CREATE INDEX IF NOT EXISTS cards_batch_idx ON cards (batch_id);

CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pack_id TEXT NOT NULL,
  cards_included INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  payment_ref TEXT,
  provider TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS purchases_user_idx ON purchases (user_id);
