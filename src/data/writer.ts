/**
 * The message writer. A small offline engine that assembles drafts from
 * hand-written pieces: tone, relationship and occasion pick the parts.
 * No model calls, no latency, no two outputs the same.
 */

export type Tone = "sweet" | "funny" | "poetic" | "simple";
export type Relationship =
  | "partner"
  | "friend"
  | "parent"
  | "family"
  | "colleague"
  | "anyone";

export interface WriterInput {
  occasion: string;
  tone: Tone;
  relationship: Relationship;
  theirName: string;
  yourName: string;
}

interface Voice {
  openers: string[];
  middles: string[];
  closers: string[];
}

function fill(text: string, their: string, yours: string): string {
  const t = their?.trim() || "you";
  return text
    .replaceAll("{them}", t)
    .replaceAll("{you}", yours?.trim() || "me");
}

const VOICES: Record<Tone, Voice> = {
  sweet: {
    openers: [
      "I have been meaning to tell you something, {them}, so here it is in writing where I cannot chicken out.",
      "{them}, a small honest thing before the day gets loud:",
      "I hope you know how much room you take up in my life, {them}, in the best possible way.",
      "There is no occasion for this, {them}. I just wanted you to hear something true today.",
    ],
    middles: [
      "You are the kind of person people describe when they describe good people, and I do not think you hear it enough.",
      "The ordinary days are better with you in them, and the hard ones are survivable, which is nearly the same thing.",
      "You make it easy to be soft in a world that rewards being sharp. I notice it every time.",
      "Whatever you are quietly carrying lately, you are carrying it well, and someone sees that.",
    ],
    closers: [
      "That is all. Just the truth, delivered early.",
      "Keep this for a day that needs it. It keeps.",
      "You are loved in more places than this one, {them}.",
      "yours, {you}",
    ],
  },
  funny: {
    openers: [
      "Breaking news for {them}: someone thinks you are excellent, more at eleven.",
      "{them}, this message has no agenda, unlike your calendar.",
      "I was going to say something sincere, {them}, but I know you, so here comes the joke version first.",
      "A formal notice for {them}, from {you}, filed under feelings.",
    ],
    middles: [
      "You are my favorite notification and my loudest group chat, and I mean both as compliments.",
      "Statistically, people with a {them} in their life report 34 percent more laughing at unfunny things.",
      "If being patient with me were a job, you would be head of department by now, with a plaque.",
      "You have the comedic timing of a professional and the patience of a saint, and only one of those is paying off.",
    ],
    closers: [
      "Anyway. You are stuck with me, {them}.",
      "This message will self destruct in the time it takes you to smile.",
      "From {you}, with love and mild sarcasm, mostly love.",
      "yours, chaotically, {you}",
    ],
  },
  poetic: {
    openers: [
      "Some people arrive like weather, {them}. You arrived like the season after.",
      "If I wrote it down, {them}, it would read like this: you are the quiet under all the noise.",
      "There are rooms my mind keeps returning to, {them}, and you are the light left on in most of them.",
      "For {them}, because some things should be said slowly.",
    ],
    middles: [
      "Ordinary time bends around you. Minutes near you are longer in the good way, the way holidays were longer when we were small.",
      "You are the proof that the world, on its worst days, still occasionally gets someone exactly right.",
      "Whatever is heavy for you lately, set it down a while. Even rivers rest in lakes.",
      "The old poets were trying to describe people like you and ran out of ink halfway.",
    ],
    closers: [
      "That is the whole of it, said plainly, at last.",
      "Kept, carried, and said now so it stops collecting dust.",
      "yours, softly, {you}",
      "from {you}, who means every word above",
    ],
  },
  simple: {
    openers: [
      "{them}, quick thing:",
      "Hi {them}. No long message, just this:",
      "One line for {them}, because it deserves its own space:",
      "For {them}, simply:",
    ],
    middles: [
      "Thank you for being exactly who you are. It matters more than you know.",
      "You make the days easier and the stories better. That is the whole thing.",
      "Glad you exist. Today and generally.",
      "Thinking of you, warmly, and wanted you to know it.",
    ],
    closers: [
      "That is it. Consider it said.",
      "More later, this first.",
      "{you}",
      "From {you}, sincerely.",
    ],
  },
};

const OCCASION_LINES: Record<string, string[]> = {
  birthday: [
    "It is your birthday, and the world is under strict instructions to behave accordingly.",
    "Another year of you, which the calendar should really mark in gold.",
    "Happy birthday. May the year ahead be mostly kind and occasionally ridiculous.",
  ],
  "love-you": [
    "I love you, said plainly, because it is the truest thing I own.",
    "Still choosing you. Every time the question comes up.",
    "You are my favorite person, and I have met several.",
  ],
  "i-miss-you": [
    "The usual places are fine, {them}. They are just not the same without you.",
    "Missing you has become a background hum. This message is it getting louder.",
    "I would trade a hundred weekend plans for one ordinary Tuesday with you.",
  ],
  "thank-you": [
    "Thank you. Two small words for something that was not small at all.",
    "What you did mattered, and I have been carrying the thank you around since.",
    "Gratitude, filed officially, with interest.",
  ],
  "good-morning": [
    "Good morning. May the coffee be strong and the inbox be short.",
    "The day has not decided its mood yet, and you get to nudge it.",
  ],
  "good-night": [
    "Good night. The day did its best, and so did you.",
    "Set it all down now. It keeps until morning, and you will be stronger for the rest.",
  ],
  "thinking-of-you": [
    "You crossed my mind four times before lunch, and I decided that was worth reporting.",
    "Thought of you, immediately and without warning, so here is proof.",
  ],
  "congratulations": [
    "Congratulations, loudly, and a second time quieter because the first was for show.",
    "Whatever you just did, everyone who loves you is currently showing off about it.",
  ],
  "get-well": [
    "Recovery instructions: rest, water, no heroics. Somebody loves you and is enforcing this.",
    "The healing takes the time it takes. Be patient with the slow days.",
  ],
};

const PANDA_VOICE: string[] = [
  "Panda was asked to deliver something to {them} and cannot reveal the sender, except through tone.",
  "Panda does not need a reason to think of {them}. It happens all day, apparently.",
  "A small delivery for {them}: one card, zero reasons, one person who thought of you and smiled.",
  "Panda checked twice. No reason found. Someone simply likes {them} existing in the world.",
  "{them} exists, and that was reason enough, according to the sender of this card.",
  "Panda is an expert at resting and says with authority: {them} has earned a slow morning.",
  "This envelope is warm because someone held it for a while before sending it to {them}.",
  "Somebody loves {them} a normal amount, said no panda ever.",
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

/** Deterministic-but-varied: same seed, same drafts; new seed, fresh set. */
export function writeDrafts(input: WriterInput, seed: number): string[] {
  const voice = VOICES[input.tone];
  const drafts: string[] = [];
  const occ = input.occasion;
  const occLines = OCCASION_LINES[occ] ?? [];

  for (let i = 0; i < 3; i++) {
    const s = seed + i * 7;
    let opener = pick(voice.openers, s);
    let middle = pick(voice.middles, s + 3);
    let closer = pick(voice.closers, s + 5);
    const occLine = occLines.length ? pick(occLines, s + 2) : null;

    // Weave the occasion line in as the middle for variety.
    if (occLine && (i + seed) % 2 === 0) middle = occLine;

    const parts = [opener, middle, closer].filter(Boolean);
    drafts.push(
      fill(parts.join(" "), input.theirName, input.yourName).replace(/\s+/g, " ").trim()
    );
  }
  return drafts;
}

/** What would your panda say: short panda-voice lines. */
export function pandaSay(occasion: string, theirName: string, seed: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < 3; i++) {
    const line = pick(PANDA_VOICE, seed + i * 5);
    out.push(fill(line, theirName, "your secret admirer"));
  }
  if (occasion === "birthday") {
    out[0] = fill(
      "It is the day of {them}. Repeat: the day of {them}. Panda has been informed that this is the most important day of the year and treats it accordingly.",
      theirName,
      "panda"
    );
  }
  return out;
}
