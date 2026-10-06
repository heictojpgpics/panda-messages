export interface Occasion {
  id: string;
  label: string;
  emoji: string;
  category: "any" | "special";
  badge?: "HOT" | "NEW";
  /** Used by the message writer to seed lines. */
  short: string;
}

export const OCCASIONS: Occasion[] = [
  { id: "just-because", label: "Just because", emoji: "💗", category: "any", badge: "HOT", short: "just because" },
  { id: "love-you", label: "Love You", emoji: "💚", category: "any", short: "love" },
  { id: "no-reason", label: "No Reason", emoji: "✨", category: "any", short: "no reason at all" },
  { id: "sending-kiss", label: "Sending Kiss", emoji: "😘", category: "any", short: "a kiss" },
  { id: "i-miss-you", label: "I miss you", emoji: "✉️", category: "any", short: "missing you" },
  { id: "sending-hug", label: "Sending Hug", emoji: "🫂", category: "any", short: "a hug" },
  { id: "forgive-me", label: "Forgive Me", emoji: "🥺", category: "any", short: "an apology" },
  { id: "sorry", label: "Sorry", emoji: "😔", category: "any", short: "being sorry" },
  { id: "good-morning", label: "Good morning", emoji: "☀️", category: "any", short: "the morning" },
  { id: "thinking-of-you", label: "Thinking of you", emoji: "💭", category: "any", short: "thinking of you" },
  { id: "good-night", label: "Good night", emoji: "🌙", category: "any", short: "the night" },
  { id: "thank-you", label: "Thank You", emoji: "🙌", category: "any", badge: "HOT", short: "gratitude" },
  { id: "proud-of-you", label: "Proud of you", emoji: "🌟", category: "any", short: "being proud" },
  { id: "get-well", label: "Get well soon", emoji: "🌼", category: "any", short: "getting well" },
  { id: "birthday", label: "Birthday", emoji: "🎂", category: "special", badge: "HOT", short: "their birthday" },
  { id: "anniversary", label: "Anniversary", emoji: "💍", category: "special", short: "an anniversary" },
  { id: "valentines", label: "Valentine's Day", emoji: "💘", category: "special", short: "Valentine's Day" },
  { id: "christmas", label: "Christmas", emoji: "🎄", category: "special", short: "Christmas" },
  { id: "mothers-day", label: "Mother's Day", emoji: "🌷", category: "special", short: "Mother's Day" },
  { id: "fathers-day", label: "Father's Day", emoji: "🧡", category: "special", short: "Father's Day" },
  { id: "new-baby", label: "New Baby", emoji: "🍼", category: "special", badge: "NEW", short: "a new baby" },
  { id: "graduation", label: "Graduation", emoji: "🎓", category: "special", short: "graduating" },
  { id: "congratulations", label: "Congratulations", emoji: "🎉", category: "special", short: "big news" },
  { id: "new-home", label: "New Home", emoji: "🏡", category: "special", short: "a new home" },
];

export function getOccasion(id: string): Occasion | undefined {
  return OCCASIONS.find((o) => o.id === id);
}

export function occasionLabel(id: string): string {
  return getOccasion(id)?.label ?? "Just because";
}

export function occasionEmoji(id: string): string {
  return getOccasion(id)?.emoji ?? "💌";
}
