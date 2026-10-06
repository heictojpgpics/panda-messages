export const DEFAULT_SIGNOFFS: Record<string, string> = {
  default: "with love, Panda 💚",
  birthday: "happy birthday again, Panda 💚",
  valentines: "yours, Panda 💚",
  "good-night": "sleep well, Panda 💚",
  "good-morning": "rise gently, Panda 💚",
  christmas: "merry everything, Panda 💚",
};

export function defaultSignoff(occasion: string): string {
  return DEFAULT_SIGNOFFS[occasion] ?? DEFAULT_SIGNOFFS.default;
}

export const REACTION_KINDS = [
  { id: "heart", emoji: "💗", label: "Heart" },
  { id: "love", emoji: "💚", label: "Love" },
  { id: "hug", emoji: "🫂", label: "Hug" },
  { id: "laugh", emoji: "😄", label: "Made me laugh" },
  { id: "cry", emoji: "🥺", label: "Made me cry" },
  { id: "wow", emoji: "✨", label: "Wow" },
] as const;

export type ReactionKind = (typeof REACTION_KINDS)[number]["id"];
