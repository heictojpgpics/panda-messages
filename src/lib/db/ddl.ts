/**
 * The physical tables. These statements are the single source of truth for
 * the schema: the local SQLite driver runs them on boot, and
 * `npm run db:init` (scripts/init-d1.mjs) reads this exact file and applies
 * them to a remote Cloudflare D1 database over the REST API.
 *
 * Everything is CREATE ... IF NOT EXISTS, so re-running is always safe.
 * Column names here must match ./schema.ts one for one.
 */

export const DDL: string[] = [
  `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    password_hash TEXT,
    name TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
  `,
  `
  CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (email)
  `,
  `
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
  `,
  `
  CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_key ON sessions (token)
  `,
  `
  CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id)
  `,
  `
  CREATE TABLE IF NOT EXISTS password_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT
  )
  `,
  `
  CREATE INDEX IF NOT EXISTS password_claims_token_idx ON password_claims (token)
  `,
  `
  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL,
    user_id TEXT,
    edit_token TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_email TEXT,
    occasion TEXT NOT NULL,
    custom_occasion TEXT,
    message TEXT NOT NULL,
    signoff TEXT NOT NULL,
    theme TEXT NOT NULL,
    song_id TEXT,
    song_provider TEXT,
    photos TEXT,
    plan TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'draft',
    watermark INTEGER NOT NULL DEFAULT 1,
    reply_to_card_id TEXT,
    view_count INTEGER NOT NULL DEFAULT 0,
    opened_at TEXT,
    paid_at TEXT,
    payment_ref TEXT,
    checkout_provider TEXT,
    deliver_at TEXT,
    delivered_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
  `,
  `
  CREATE UNIQUE INDEX IF NOT EXISTS cards_slug_key ON cards (slug)
  `,
  `
  CREATE INDEX IF NOT EXISTS cards_user_idx ON cards (user_id)
  `,
  `
  CREATE INDEX IF NOT EXISTS cards_delivery_idx ON cards (status, deliver_at)
  `,
  `
  CREATE INDEX IF NOT EXISTS cards_reply_idx ON cards (reply_to_card_id)
  `,
  `
  CREATE TABLE IF NOT EXISTS card_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id TEXT NOT NULL,
    type TEXT NOT NULL,
    meta TEXT,
    created_at TEXT NOT NULL
  )
  `,
  `
  CREATE INDEX IF NOT EXISTS card_events_card_idx ON card_events (card_id, id)
  `,
  `
  CREATE TABLE IF NOT EXISTS reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    visitor_id TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
  `,
  `
  CREATE UNIQUE INDEX IF NOT EXISTS reactions_once_key ON reactions (card_id, kind, visitor_id)
  `,
  `
  CREATE TABLE IF NOT EXISTS replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
  `,
  `
  CREATE INDEX IF NOT EXISTS replies_card_idx ON replies (card_id)
  `,
  `
  CREATE TABLE IF NOT EXISTS rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL,
    count INTEGER NOT NULL,
    window_start TEXT NOT NULL
  )
  `,
  `
  CREATE UNIQUE INDEX IF NOT EXISTS rate_limits_key_key ON rate_limits (key)
  `,
  `
  CREATE TABLE IF NOT EXISTS outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id TEXT,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    html TEXT NOT NULL,
    text TEXT NOT NULL,
    kind TEXT NOT NULL,
    status TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_ref TEXT,
    error TEXT,
    sent_at TEXT,
    created_at TEXT NOT NULL
  )
  `,
  `
  CREATE INDEX IF NOT EXISTS outbox_card_idx ON outbox (card_id)
  `,
  `
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
  `,
  `
  CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_key ON waitlist (email)
  `,
];

/**
 * Additive column changes for databases created before a column existed.
 * Applied guarded (the column is added only when missing), by the local
 * driver on boot and by `npm run db:init` remotely, so re-running is
 * always safe. Keep entries forever: they are a no-op on fresh databases
 * and a repair on old ones.
 */
export const COLUMN_MIGRATIONS: [string, string, string][] = [
  ["cards", "custom_occasion", "ALTER TABLE cards ADD COLUMN custom_occasion TEXT"],
  ["cards", "reply_to_card_id", "ALTER TABLE cards ADD COLUMN reply_to_card_id TEXT"],
];
