import { getDb } from "@/lib/db";
import { outbox } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { SITE } from "@/lib/config";

/**
 * Email provider. With RESEND_API_KEY set, mail goes out for real.
 * Without it, everything lands in the demo outbox, which the dashboard
 * renders exactly as it would have arrived.
 */

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  cardId?: string | null;
  kind?: "card" | "receipt" | "claim" | "notify";
}

export interface SendResult {
  status: "sent" | "failed";
  provider: "resend" | "mock";
  ref: string | null;
  error?: string;
  /**
   * True when the provider definitively refused the send (bad address,
   * validation error). False when the outcome is unknown. Delivery uses
   * this to decide between retry and hold.
   */
  definitive?: boolean;
}

export function emailMode(): "resend" | "mock" {
  return process.env.RESEND_API_KEY ? "resend" : "mock";
}

async function resendSend(email: OutgoingEmail): Promise<{ id: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? `Panda <panda@${SITE.domain}>`,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`Resend ${res.status}: ${body.slice(0, 200)}`);
    // 4xx: our request was rejected outright. 5xx or unknown: unclear.
    (err as Error & { definitive?: boolean }).definitive = res.status >= 400 && res.status < 500;
    throw err;
  }
  const json = (await res.json()) as { id: string };
  return json;
}

/** Queue + send. In mock mode the outbox row itself is the delivery. */
export async function sendEmail(email: OutgoingEmail): Promise<SendResult> {
  const db = await getDb();
  const provider = emailMode();
  const now = new Date().toISOString();

  const [row] = await db
    .insert(outbox)
    .values({
      cardId: email.cardId ?? null,
      toEmail: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      kind: email.kind ?? "card",
      status: "queued",
      provider,
      createdAt: now,
    })
    .returning({ id: outbox.id });

  try {
    if (provider === "resend") {
      const sent = await resendSend(email);
      await db
        .update(outbox)
        .set({ status: "sent", providerRef: sent.id, sentAt: new Date().toISOString() })
        .where(eq(outbox.id, row.id));
      return { status: "sent", provider, ref: sent.id };
    }
    // Mock: mark sent instantly. The dashboard outbox shows the full email.
    await db
      .update(outbox)
      .set({ status: "sent", sentAt: new Date().toISOString() })
      .where(eq(outbox.id, row.id));
    return { status: "sent", provider: "mock", ref: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "send failed";
    const definitive = (err as Error & { definitive?: boolean }).definitive ?? false;
    await db.update(outbox).set({ status: "failed", error: message }).where(eq(outbox.id, row.id));
    return { status: "failed", provider, ref: null, error: message, definitive };
  }
}

/** Outbox rows for cards owned by the given user. Nobody else's mail. */
export async function listOutboxForUser(userCardIds: string[], limit = 40) {
  const db = await getDb();
  const { inArray } = await import("drizzle-orm");
  return db
    .select()
    .from(outbox)
    .where(inArray(outbox.cardId, userCardIds))
    .orderBy(desc(outbox.id))
    .limit(limit);
}
