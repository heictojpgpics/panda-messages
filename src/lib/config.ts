export const SITE = {
  name: "Panda Messages",
  shortName: "Panda",
  character: "Panda",
  domain: "pandamessages.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pandamessages.com",
  supportEmail: "support@pandamessages.com",
  cardPrice: 4.99,
  cardPriceLabel: "$4.99",
  reminderPrice: 19,
  reminderPriceLabel: "$19",
  currency: "usd",
} as const;

export function paymentMode(): "stripe" | "mock" {
  return process.env.STRIPE_SECRET_KEY ? "stripe" : "mock";
}

export function emailMode(): "resend" | "mock" {
  return process.env.RESEND_API_KEY ? "resend" : "mock";
}

export function storageMode(): "d1" | "local" {
  return process.env.D1_DATABASE_ID ? "d1" : "local";
}
