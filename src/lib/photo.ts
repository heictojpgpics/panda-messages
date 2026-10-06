"use client";

/**
 * Client-side photo pipeline. Compress before anything leaves the browser:
 * cards are small, private, and perfect at 900px.
 */

const MAX_DIM = 900;
const QUALITY = 0.82;
const MAX_BYTES = 180_000; // ~180KB per photo, keeps D1 rows comfortable
const MAX_PHOTOS = 5;

export interface PhotoResult {
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
}

export async function compressPhoto(file: File): Promise<PhotoResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Not an image");
  }
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  const scale = Math.min(1, MAX_DIM / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  let quality = QUALITY;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  // Shrink until it fits the budget.
  while (dataUrl.length * 0.75 > MAX_BYTES && quality > 0.5) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  return { dataUrl, width, height, bytes: Math.round(dataUrl.length * 0.75) };
}

export function extractYouTubeId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  // Direct ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  const patterns = [
    /(?:youtube\.com\/watch\?[^#]*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:music\.youtube\.com\/watch\?[^#]*v=)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = raw.match(p);
    if (m) return m[1];
  }
  return null;
}

export const PHOTO_LIMITS = { max: MAX_PHOTOS, maxDim: MAX_DIM };
