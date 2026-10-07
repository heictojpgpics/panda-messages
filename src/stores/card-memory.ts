"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ComposerDraftMemory = {
  occasion?: string;
  customOccasion?: string;
  recipientName?: string;
  senderName?: string;
  message?: string;
  signoff?: string;
  theme?: string;
  songInput?: string;
  photos?: string[];
  step?: number;
};

type CardMemoryState = {
  drafts: Record<string, ComposerDraftMemory>;
  editTokens: Record<string, string>;
  saveDraft: (key: string, draft: ComposerDraftMemory) => void;
  clearDraft: (key: string) => void;
  rememberEditToken: (token: string, ...keys: string[]) => void;
  editTokenFor: (key?: string | null) => string | undefined;
};

/**
 * One versioned client memory for unfinished cards and private edit tokens.
 * It replaces ad-hoc localStorage reads while keeping recovery deterministic
 * after refreshes, tab changes, and the jump into checkout.
 */
export const useCardMemoryStore = create<CardMemoryState>()(
  persist(
    (set, get) => ({
      drafts: {},
      editTokens: {},
      saveDraft: (key, draft) =>
        set((state) => ({ drafts: { ...state.drafts, [key]: { ...draft } } })),
      clearDraft: (key) =>
        set((state) => {
          const { [key]: _removed, ...drafts } = state.drafts;
          return { drafts };
        }),
      rememberEditToken: (token, ...keys) =>
        set((state) => ({
          editTokens: keys.reduce<Record<string, string>>(
            (next, key) => (key ? { ...next, [key]: token } : next),
            state.editTokens
          ),
        })),
      editTokenFor: (key) => (key ? get().editTokens[key] : undefined),
    }),
    {
      name: "panda-card-memory-v1",
      version: 1,
      partialize: (state) => ({ drafts: state.drafts, editTokens: state.editTokens }),
    }
  )
);

export function readDraftMemory(key = "active"): ComposerDraftMemory {
  const current = useCardMemoryStore.getState().drafts[key];
  if (current) return current;

  // A quiet one-way bridge for people who started a card before v1.
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem("panda-draft-v2") ?? "{}") as ComposerDraftMemory;
  } catch {
    return {};
  }
}

export function readEditToken(key?: string | null): string | undefined {
  const current = useCardMemoryStore.getState().editTokenFor(key);
  if (current || !key || typeof window === "undefined") return current;
  try {
    const legacy = JSON.parse(window.localStorage.getItem("panda-edit-tokens") ?? "{}") as Record<string, string>;
    return legacy[key];
  } catch {
    return undefined;
  }
}
