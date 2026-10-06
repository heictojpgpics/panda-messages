import { randomBytes, randomUUID } from "crypto";

const ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789";
const SLUG_ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789";

export function newId(): string {
  return randomUUID();
}

/** Short, friendly, unambiguous id for card links. */
export function newSlug(length = 10): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  }
  return out;
}

export function newToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function newSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/** Stable per-visitor id so reactions and views count once per person. */
export function newVisitorId(): string {
  return randomBytes(12).toString("hex");
}
