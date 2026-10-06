import { cookies } from "next/headers";
import { getDb } from "./db";
import { sessions, users, passwordClaims } from "./db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { newSessionToken, newToken, newId, sha256Hex, base64ToBytes, bytesToBase64 } from "./ids";

/**
 * Session auth that works identically on Node and Cloudflare Workers.
 * Passwords use PBKDF2 from Web Crypto (available in both runtimes), and
 * base64 goes through the Web helpers rather than Buffer so the file stays
 * Workers-safe. Session and claim tokens are stored hashed: a leaked
 * database is not a leaked login.
 */

const SESSION_COOKIE = "pm_session";
const SESSION_DAYS = 30;

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

// ---------- password hashing ----------

const ITERATIONS = 100_000;

async function pbkdf2(password: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: ITERATIONS },
    key,
    256
  );
  return bytesToBase64(new Uint8Array(bits));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt);
  return `pbkdf2:${ITERATIONS}:${bytesToBase64(salt)}:${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 1) return false;
  const salt = base64ToBytes(parts[2]);
  const expected = parts[3];
  const actual = await pbkdf2(password, salt);
  if (actual.length !== expected.length) return false;
  // constant-time compare
  let diff = 0;
  for (let i = 0; i < actual.length; i++) {
    diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

// ---------- user management ----------

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export async function findUserByEmail(email: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizeEmail(email)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createUser(email: string, password: string | null, name?: string) {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = newId();
  const passwordHash = password ? await hashPassword(password) : null;
  await db.insert(users).values({
    id,
    email: normalizeEmail(email),
    passwordHash,
    name: name ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return findUserByEmail(email);
}

export async function setPassword(userId: string, password: string): Promise<void> {
  const db = await getDb();
  const passwordHash = await hashPassword(password);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId));
}

// ---------- password claim tokens (for accounts created at checkout) ----------

export async function createPasswordClaim(userId: string): Promise<string> {
  const db = await getDb();
  const token = newToken(24);
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 48); // 48h
  await db.insert(passwordClaims).values({
    token: await sha256Hex(token),
    userId,
    expiresAt: expires.toISOString(),
    usedAt: null,
  });
  return token;
}

export async function consumePasswordClaim(token: string) {
  const db = await getDb();
  const hashed = await sha256Hex(token);
  const rows = await db
    .select()
    .from(passwordClaims)
    .where(
      and(
        eq(passwordClaims.token, hashed),
        isNull(passwordClaims.usedAt),
        gt(passwordClaims.expiresAt, new Date().toISOString())
      )
    )
    .limit(1);
  const claim = rows[0];
  if (!claim) return null;
  await db
    .update(passwordClaims)
    .set({ usedAt: new Date().toISOString() })
    .where(eq(passwordClaims.token, hashed));
  const userRows = await db.select().from(users).where(eq(users.id, claim.userId)).limit(1);
  return userRows[0] ?? null;
}

// ---------- sessions ----------

export async function createSession(userId: string): Promise<void> {
  const db = await getDb();
  const token = newSessionToken();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * SESSION_DAYS);
  await db.insert(sessions).values({
    token: await sha256Hex(token),
    userId,
    expiresAt: expires.toISOString(),
    createdAt: new Date().toISOString(),
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.token, await sha256Hex(token)));
  }
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, await sha256Hex(token)), gt(sessions.expiresAt, new Date().toISOString())))
    .limit(1);
  return rows[0] ?? null;
}
