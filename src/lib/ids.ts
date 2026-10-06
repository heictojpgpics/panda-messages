/**
 * Runtime-agnostic ids and bytes.
 *
 * Web Crypto (crypto.getRandomValues, crypto.randomUUID) is available in
 * Node 18+, Bun, Deno and Cloudflare Workers, so this file works in every
 * runtime the app can be deployed to without a Node polyfill.
 */

const ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789";

/** Random bytes as a hex string. */
export function randomHex(bytes = 16): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  let out = "";
  for (const b of buf) out += b.toString(16).padStart(2, "0");
  return out;
}

export function newId(): string {
  return crypto.randomUUID();
}

/** Short, friendly, unambiguous id for card links. */
export function newSlug(length = 10): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/** URL-safe random token (base64url). */
export function newToken(bytes = 32): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return bytesToBase64Url(buf);
}

export function newSessionToken(): string {
  return randomHex(32);
}

/** Stable per-visitor id so reactions and views count once per person. */
export function newVisitorId(): string {
  return randomHex(12);
}

/** SHA-256 hex digest of a string, Web Crypto only. */
export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(input));
  const bytes = new Uint8Array(digest);
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

/** Bytes to base64, without Node's Buffer. */
export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** Bytes to base64url. */
export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

/** Base64 to bytes, without Node's Buffer. */
export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Constant-time string compare, for token checks. */
export function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
