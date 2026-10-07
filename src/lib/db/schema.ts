import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * The schema. One definition, two runtimes: local SQLite (better-sqlite3)
 * and Cloudflare D1 over REST. Column names are snake_case and the raw DDL
 * in ./ddl.ts is the source of truth for the physical tables, so
 * `npm run db:init` and the local driver always create the exact same
 * shape. Timestamps are ISO 8601 TEXT, which compares correctly and sorts
 * identically in both engines.
 */

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash"),
  name: text("name"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (t) => [
  uniqueIndex("users_email_key").on(t.email),
]);

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token").notNull(),
  userId: text("user_id").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
}, (t) => [
  uniqueIndex("sessions_token_key").on(t.token),
  index("sessions_user_idx").on(t.userId),
]);

export const passwordClaims = sqliteTable("password_claims", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token").notNull(),
  userId: text("user_id").notNull(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at"),
}, (t) => [
  index("password_claims_token_idx").on(t.token),
]);

export const cards = sqliteTable("cards", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  userId: text("user_id"),
  /** SHA-256 of the raw edit token, never the token itself. */
  editToken: text("edit_token").notNull(),
  senderName: text("sender_name").notNull(),
  recipientName: text("recipient_name").notNull(),
  recipientEmail: text("recipient_email"),
  occasion: text("occasion").notNull(),
  customOccasion: text("custom_occasion"),
  message: text("message").notNull(),
  signoff: text("signoff").notNull(),
  theme: text("theme").notNull(),
  songId: text("song_id"),
  songProvider: text("song_provider"),
  /** JSON array of compressed data URLs. */
  photos: text("photos"),
  plan: text("plan").notNull().default("free"),
  /** draft | awaiting_payment | scheduled | sent | opened | cancelled */
  status: text("status").notNull().default("draft"),
  watermark: integer("watermark", { mode: "boolean" }).notNull().default(true),
  replyToCardId: text("reply_to_card_id"),
  viewCount: integer("view_count").notNull().default(0),
  openedAt: text("opened_at"),
  paidAt: text("paid_at"),
  paymentRef: text("payment_ref"),
  checkoutProvider: text("checkout_provider"),
  deliverAt: text("deliver_at"),
  deliveredAt: text("delivered_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (t) => [
  uniqueIndex("cards_slug_key").on(t.slug),
  index("cards_user_idx").on(t.userId),
  index("cards_delivery_idx").on(t.status, t.deliverAt),
  index("cards_reply_idx").on(t.replyToCardId),
]);

export const cardEvents = sqliteTable("card_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cardId: text("card_id").notNull(),
  type: text("type").notNull(),
  meta: text("meta"),
  createdAt: text("created_at").notNull(),
}, (t) => [
  index("card_events_card_idx").on(t.cardId, t.id),
]);

export const reactions = sqliteTable("reactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cardId: text("card_id").notNull(),
  kind: text("kind").notNull(),
  visitorId: text("visitor_id").notNull(),
  createdAt: text("created_at").notNull(),
}, (t) => [
  // One of each kind per visitor. The uniqueness is the dedupe.
  uniqueIndex("reactions_once_key").on(t.cardId, t.kind, t.visitorId),
]);

export const replies = sqliteTable("replies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cardId: text("card_id").notNull(),
  authorName: text("author_name").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull(),
}, (t) => [
  index("replies_card_idx").on(t.cardId),
]);

export const rateLimits = sqliteTable("rate_limits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull(),
  count: integer("count").notNull(),
  windowStart: text("window_start").notNull(),
}, (t) => [
  uniqueIndex("rate_limits_key_key").on(t.key),
]);

export const outbox = sqliteTable("outbox", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cardId: text("card_id"),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  html: text("html").notNull(),
  text: text("text").notNull(),
  kind: text("kind").notNull(),
  status: text("status").notNull(),
  provider: text("provider").notNull(),
  providerRef: text("provider_ref"),
  error: text("error"),
  sentAt: text("sent_at"),
  createdAt: text("created_at").notNull(),
}, (t) => [
  index("outbox_card_idx").on(t.cardId),
]);

export const feedback = sqliteTable("feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email"),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull(),
});

export const waitlist = sqliteTable("waitlist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  source: text("source").notNull(),
  createdAt: text("created_at").notNull(),
}, (t) => [
  uniqueIndex("waitlist_email_key").on(t.email),
]);

export type Card = typeof cards.$inferSelect;
export type User = typeof users.$inferSelect;
export type CardEvent = typeof cardEvents.$inferSelect;
export type Reply = typeof replies.$inferSelect;
export type OutboxRow = typeof outbox.$inferSelect;
