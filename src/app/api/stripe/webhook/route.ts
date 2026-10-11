import { NextRequest, NextResponse } from "next/server";
import { verifyStripeSignature } from "@/lib/payments";
import { fulfillBatch } from "@/lib/fulfillment";

export const dynamic = "force-dynamic";

/** Stripe webhook: the real money path. Verify, then run the same pipeline. */
export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  if (!(await verifyStripeSignature(payload, signature))) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Record<string, unknown>;
  const metadata = (session.metadata ?? {}) as Record<string, unknown>;
  const batchId = String(metadata.batchId ?? session.client_reference_id ?? "");
  const packId = String(metadata.packId ?? "single");
  if (!batchId) return NextResponse.json({ received: true });

  const customerDetails = (session.customer_details ?? {}) as Record<string, unknown>;
  const customerEmail = String(customerDetails.email ?? session.customer_email ?? "") || null;
  const ref = String(session.id ?? "");

  // fulfillBatch is idempotent: a retried webhook changes nothing.
  const result = await fulfillBatch({
    batchId,
    packId,
    paymentRef: ref,
    provider: "stripe",
    buyerEmail: customerEmail,
  }).catch((err) => {
    console.error("stripe fulfillment failed", err);
    return null;
  });

  return NextResponse.json({ received: true, ok: Boolean(result?.ok) });
}
