export const SITE = {
  name: "Panda Messages",
  shortName: "Panda",
  character: "Panda",
  domain: "pandamessages.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pandamessages.com",
  supportEmail: "support@pandamessages.com",
  cardPrice: 5,
  cardPriceLabel: "$5",
  reminderPrice: 19,
  reminderPriceLabel: "$19",
  currency: "usd",
} as const;

/**
 * Card packs. One purchase, whole pack: credits land on the account and
 * every send spends one. Prices are the single source of truth for the
 * checkout API, the Stripe line item and the pricing page, so a price
 * change is a one-line edit that cannot drift out of sync.
 */
export interface CardPack {
  id: "single" | "pack5" | "pack15";
  cards: number;
  price: number;
  label: string;
  /** Shown under the price, e.g. "$4 a card". */
  perCardLabel: string;
  blurb: string;
}

export const PACKS: CardPack[] = [
  {
    id: "single",
    cards: 1,
    price: 5,
    label: "One card",
    perCardLabel: "$5 a card",
    blurb: "The one you have in mind, fully unlocked.",
  },
  {
    id: "pack5",
    cards: 5,
    price: 20,
    label: "Five cards",
    perCardLabel: "$4 a card",
    blurb: "A few birthdays, one apology, a just because.",
  },
  {
    id: "pack15",
    cards: 15,
    price: 50,
    label: "Fifteen cards",
    perCardLabel: "$3.33 a card",
    blurb: "The whole year wrapped in one go.",
  },
];

export function packById(id: string): CardPack | null {
  return PACKS.find((p) => p.id === id) ?? null;
}

/** The smallest pack that covers n cards, so bulk sends start sensible. */
export function packForCount(n: number): CardPack {
  if (n > 5) return PACKS[2];
  if (n > 1) return PACKS[1];
  return PACKS[0];
}

export function paymentMode(): "stripe" | "mock" {
  return process.env.STRIPE_SECRET_KEY ? "stripe" : "mock";
}

export function emailMode(): "resend" | "mock" {
  return process.env.RESEND_API_KEY ? "resend" : "mock";
}

export function storageMode(): "d1" | "local" {
  return process.env.PANDA_STORAGE_MODE === "d1" ? "d1" : "local";
}

/** The public base URL, one source for links in emails and redirects. */
export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
