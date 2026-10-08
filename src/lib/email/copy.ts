import { getOccasion } from "@/data/occasions";

/**
 * The words of the mail.
 *
 * One voice across every email: Panda is a small postal service that
 * carries real cards between two people. The sentences are short, the
 * verbs are physical, and nothing is announced that the reader cannot
 * picture. No em dashes anywhere, ever.
 */

export type ArtworkKey =
  | "post"
  | "love"
  | "celebrate"
  | "moon"
  | "birthday"
  | "christmas"
  | "mothers-day"
  | "fathers-day"
  | "graduation"
  | "new-baby"
  | "new-home"
  | "thank-you"
  | "get-well"
  | "good-morning";

export interface OccasionVoice {
  /** Small caps label above the headline, like a postal class stamp. */
  eyebrow: string;
  /** The line the whole email hangs on. */
  headline: string;
  /** One or two sentences, {sender} is replaced at send time. */
  body: string;
  /** The panda portrait that carries this occasion. */
  art: ArtworkKey;
}

const JUST_BECAUSE_BODY =
  "{sender} had no reason and every reason. A card got written, sealed, and sent your way.";

const VOICES: Record<string, OccasionVoice> = {
  "just-because": {
    eyebrow: "A just because card",
    headline: "Someone was thinking about you today",
    body: JUST_BECAUSE_BODY,
    art: "post",
  },
  "no-reason": {
    eyebrow: "A no reason card",
    headline: "No occasion. Just you.",
    body: "{sender} wrote you a card for no reason at all, which might be the best reason there is.",
    art: "post",
  },
  "love-you": {
    eyebrow: "A love letter",
    headline: "It is sealed, and it is yours",
    body: "{sender} wrote down something that deserved better than a text message. Panda carried it here without peeking.",
    art: "love",
  },
  "sending-kiss": {
    eyebrow: "A little something",
    headline: "This arrived with a kiss on it",
    body: "{sender} sealed a card, pressed a kiss on the wax, and sent it your way.",
    art: "love",
  },
  "i-miss-you": {
    eyebrow: "A miss you card",
    headline: "You were missed. Here is proof.",
    body: "The miles got to {sender}, so they sat down and wrote. The card has been traveling ever since.",
    art: "moon",
  },
  "sending-hug": {
    eyebrow: "A hug, by mail",
    headline: "Arms were not long enough, so this will have to do",
    body: "{sender} folded a hug into an envelope and asked Panda to walk it over.",
    art: "post",
  },
  "forgive-me": {
    eyebrow: "An apology",
    headline: "Some words take courage to send",
    body: "{sender} found the words that were hard to find and wrote them down properly. They are waiting inside.",
    art: "post",
  },
  sorry: {
    eyebrow: "An apology",
    headline: "Words that were owed to you",
    body: "{sender} sat with this one for a while before sealing it. What is inside came from an honest place.",
    art: "post",
  },
  "good-morning": {
    eyebrow: "A good morning card",
    headline: "The morning just got better",
    body: "{sender} wanted to be the first good thing you read today.",
    art: "good-morning",
  },
  "thinking-of-you": {
    eyebrow: "A thinking of you card",
    headline: "You crossed someone's mind today",
    body: "It stayed there long enough that {sender} wrote you a card about it.",
    art: "post",
  },
  "good-night": {
    eyebrow: "A good night card",
    headline: "One last thing before you sleep",
    body: "{sender} tucked a card into the night for you. It will still be there in the morning.",
    art: "moon",
  },
  "thank-you": {
    eyebrow: "A thank you card",
    headline: "Someone did not forget what you did",
    body: "{sender} remembered, and then remembered again, and then wrote it down. It is inside.",
    art: "thank-you",
  },
  "proud-of-you": {
    eyebrow: "A proud of you card",
    headline: "Someone has been watching you do hard things",
    body: "{sender} noticed everything it took, and wrote you a card about it.",
    art: "celebrate",
  },
  "get-well": {
    eyebrow: "A get well card",
    headline: "Panda tiptoed the whole way here",
    body: "{sender} sent something small and warm for the recovery. Blanket recommended.",
    art: "get-well",
  },
  birthday: {
    eyebrow: "A birthday card",
    headline: "It is your day, and someone made a fuss of it",
    body: "{sender} refused to let the day pass quietly. There is a proper card inside, candles and all.",
    art: "birthday",
  },
  anniversary: {
    eyebrow: "An anniversary card",
    headline: "Another year, marked properly",
    body: "{sender} wrote something for the occasion. Some years deserve more than a dinner reservation.",
    art: "love",
  },
  valentines: {
    eyebrow: "A Valentine",
    headline: "Roses wilt. This does not.",
    body: "{sender} skipped the florist this year and wrote you something that keeps.",
    art: "love",
  },
  christmas: {
    eyebrow: "A Christmas card",
    headline: "It came with the winter post",
    body: "{sender} sent a little of the season your way. Best opened near a window with snow in it.",
    art: "christmas",
  },
  "mothers-day": {
    eyebrow: "A Mother's Day card",
    headline: "For everything, and then some",
    body: "{sender} tried to fit years of it into one card. It barely held.",
    art: "mothers-day",
  },
  "fathers-day": {
    eyebrow: "A Father's Day card",
    headline: "The card he will actually keep",
    body: "{sender} wrote it by hand and meant it. It beats a tie and he knows it.",
    art: "fathers-day",
  },
  "new-baby": {
    eyebrow: "A new baby card",
    headline: "Tiny person, big news",
    body: "{sender} wrote something for the newest person in the room. Read it to them when they are older.",
    art: "new-baby",
  },
  graduation: {
    eyebrow: "A graduation card",
    headline: "The tassel moved. The card followed.",
    body: "{sender} watched you cross the stage and sat down to write the same night.",
    art: "graduation",
  },
  congratulations: {
    eyebrow: "A congratulations card",
    headline: "Big news travels by mail",
    body: "{sender} heard the news and would not let a text message carry it. Open it properly.",
    art: "celebrate",
  },
  "new-home": {
    eyebrow: "A new home card",
    headline: "First class mail for a first home",
    body: "{sender} sent something for the new place. Best read on the floor, since the sofa is not here yet.",
    art: "new-home",
  },
};

const FALLBACK: OccasionVoice = {
  eyebrow: "A card",
  headline: "Someone put it in writing",
  body: "{sender} wrote you a card and asked Panda to carry it over. It is sealed and waiting.",
  art: "post",
};

export function occasionVoice(occasionId?: string, customOccasion?: string | null): OccasionVoice {
  const custom = customOccasion?.trim();
  if (custom) {
    return {
      ...FALLBACK,
      eyebrow: `A ${custom.toLowerCase().replace(/\.$/, "")} card`,
    };
  }
  return VOICES[occasionId ?? ""] ?? FALLBACK;
}

export function occasionLabel(occasionId?: string, customOccasion?: string | null): string {
  const custom = customOccasion?.trim();
  if (custom) return custom;
  return getOccasion(occasionId ?? "")?.label ?? "Just because";
}
