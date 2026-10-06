import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "Refund policy",
  description: "Cancel any time before it sends and the refund is automatic and full.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Nav />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-32 pb-20">
          <h1 className="font-display font-semibold text-ink text-3xl">Refund policy</h1>

          <div className="mt-8 rounded-3xl bg-jade-soft/50 border border-jade/20 p-6">
            <p className="font-display font-semibold text-ink text-[17px]">
              The whole policy, in one line
            </p>
            <p className="mt-2 text-[14px] text-ink-soft leading-relaxed">
              Cancel any time before your card is delivered and the refund is automatic, full,
              and instant. You can cancel yourself from your dashboard, one click, no forms.
            </p>
          </div>

          <div className="mt-10 space-y-8">
            <section>
              <h2 className="font-display font-semibold text-ink text-lg">Before it sends</h2>
              <p className="mt-3 text-[14px] text-ink-soft leading-[1.75]">
                Every paid card can be cancelled from your dashboard until the moment Panda
                delivers it. The card is withdrawn and the full $4.99 returns to your original
                payment method. In demo mode this happens instantly. With live payments it is
                issued through our payment provider and usually lands within a few days,
                depending on your bank.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-ink text-lg">If it does not arrive</h2>
              <p className="mt-3 text-[14px] text-ink-soft leading-[1.75]">
                If a card fails to deliver for a reason on our side, you are refunded
                automatically. You will see the failure on your dashboard, and you do not have
                to ask. But you can ask, and quickly.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-ink text-lg">After it sends</h2>
              <p className="mt-3 text-[14px] text-ink-soft leading-[1.75]">
                Once the envelope is opened, the moment has happened and cannot be un-happened,
                so refunds are not automatic after delivery. That said, if something was clearly
                broken, wrong or hurtful on our side, write to us. We are reasonable people and
                we would rather give back your money than argue.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-ink text-lg">Panda Remembers</h2>
              <p className="mt-3 text-[14px] text-ink-soft leading-[1.75]">
                The yearly reminder service, when it launches, is cancellable any time. Cancel
                and the remaining months are refunded pro rata. No retention maze, no phone
                calls.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-ink text-lg">How to ask</h2>
              <p className="mt-3 text-[14px] text-ink-soft leading-[1.75]">
                The dashboard handles the common cases on its own. For everything else:{" "}
                <a href="mailto:support@pandamessages.com" className="text-jade font-medium link-pretty">
                  support@pandamessages.com
                </a>
                . A human reads it, usually the same day.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
