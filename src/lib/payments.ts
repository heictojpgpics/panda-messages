import { SITE } from "./config";

/**
 * Payments. Stripe when STRIPE_SECRET_KEY is set, otherwise a premium
 * simulated checkout that runs the full flow locally. Either way the
 * happy path is identical: card becomes paid, delivery is scheduled.
 */

export type CheckoutSession = {
  url: string;
  provider: "stripe" | "mock";
  ref: string;
};

export function paymentMode(): "stripe" | "mock" {
  return process.env.STRIPE_SECRET_KEY ? "stripe" : "mock";
}

export function stripeEnabled(): boolean {
  return paymentMode() === "stripe";
}

/** Create a Stripe Checkout Session over the plain REST API (no SDK). */
export async function createStripeCheckout(opts: {
  cardId: string;
  slug: string;
  customerEmail?: string | null;
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutSession> {
  const key = process.env.STRIPE_SECRET_KEY!;
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", opts.successUrl);
  body.set("cancel_url", opts.cancelUrl);
  body.set("client_reference_id", opts.cardId);
  body.set("metadata[cardId]", opts.cardId);
  body.set("metadata[slug]", opts.slug);
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", "usd");
  body.set("line_items[0][price_data][unit_amount]", String(Math.round(SITE.cardPrice * 100)));
  body.set("line_items[0][price_data][product_data][name]", "Panda card, delivered");
  body.set(
    "line_items[0][price_data][product_data][description]",
    "A personal card, hand-delivered by Panda on the day you pick. No watermark, keepsake replay, edit or cancel any time before it sends."
  );
  if (opts.customerEmail) body.set("customer_email", opts.customerEmail);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Stripe ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as { id: string; url: string };
  return { url: json.url, provider: "stripe", ref: json.id };
}

export async function stripeRefund(paymentRef: string): Promise<boolean> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !paymentRef.startsWith("cs_")) return false;
  // Expand the session to reach the payment intent.
  const sessionRes = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${paymentRef}?expand[]=payment_intent`,
    { headers: { Authorization: `Bearer ${key}` } }
  );
  if (!sessionRes.ok) return false;
  const session = (await sessionRes.json()) as { payment_intent?: { id: string } | string };
  const piId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!piId) return false;
  const res = await fetch("https://api.stripe.com/v1/refunds", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ payment_intent: piId }),
  });
  return res.ok;
}

/** Verify a Stripe webhook signature using Web Crypto (runtime agnostic). */
export async function verifyStripeSignature(payload: string, header: string): Promise<boolean> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => kv.split("=") as [string, string])
  );
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;
  // Reject stale signatures: replaying an old webhook should not work.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 60 * 10) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(`${timestamp}.${payload}`));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}
