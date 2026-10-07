import { getCloudflareContext } from "@opennextjs/cloudflare";
import { base64ToBytes, randomHex } from "@/lib/ids";

export interface StoredCardPhoto {
  id: string;
  key: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
}

export type CardPhotoValue = string | StoredCardPhoto;

type R2Object = {
  body: ReadableStream<Uint8Array>;
  httpMetadata?: { contentType?: string };
};

type R2Bucket = {
  put: (key: string, value: ArrayBuffer | Uint8Array, options?: { httpMetadata?: { contentType?: string; cacheControl?: string } }) => Promise<unknown>;
  get: (key: string) => Promise<R2Object | null>;
  delete: (keys: string | string[]) => Promise<void>;
};

const ACCEPTED_TYPES = new Set<StoredCardPhoto["contentType"]>([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function isStoredCardPhoto(photo: CardPhotoValue): photo is StoredCardPhoto {
  return typeof photo === "object" && photo !== null && typeof photo.id === "string" && typeof photo.key === "string";
}

export function parseCardPhotos(value: string | null): CardPhotoValue[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is CardPhotoValue => typeof item === "string" || isStoredCardPhoto(item)) : [];
  } catch {
    return [];
  }
}

export function dataUrlToPhotoBytes(value: string): { bytes: Uint8Array; contentType: StoredCardPhoto["contentType"] } {
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([a-zA-Z0-9+/=]+)$/);
  if (!match || !ACCEPTED_TYPES.has(match[1] as StoredCardPhoto["contentType"])) {
    throw new Error("That image format is not supported.");
  }
  return { bytes: base64ToBytes(match[2]), contentType: match[1] as StoredCardPhoto["contentType"] };
}

export function newPhotoKey(cardId: string, contentType: StoredCardPhoto["contentType"]): string {
  const extension = contentType === "image/jpeg" ? "jpg" : contentType === "image/png" ? "png" : "webp";
  return `cards/${cardId}/${randomHex(14)}.${extension}`;
}

export function cardPhotoUrl(slug: string, photo: CardPhotoValue, editToken?: string): string | null {
  if (!isStoredCardPhoto(photo)) return typeof photo === "string" ? photo : null;
  const path = `/api/cards/${encodeURIComponent(slug)}/photos/${encodeURIComponent(photo.id)}`;
  return editToken ? `${path}?editToken=${encodeURIComponent(editToken)}` : path;
}

export function getCardPhotoBucket(): R2Bucket | null {
  try {
    const env = getCloudflareContext().env as unknown as { CARD_PHOTOS?: R2Bucket };
    const bucket = env.CARD_PHOTOS;
    return bucket ?? null;
  } catch {
    return null;
  }
}
