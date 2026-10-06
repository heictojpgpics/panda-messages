import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCardBySlug } from "@/lib/cards";
import { getOccasion, occasionLabel } from "@/data/occasions";
import { opportunisticTick } from "@/lib/delivery";
import { CardSceneClient } from "./CardSceneClient";
import { CardNotReady } from "./CardNotReady";
import { PandaMoodFace } from "@/components/brand/PandaMood";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const card = await getCardBySlug(slug);
  if (!card) return { title: "A card that is not here" };
  return {
    title: `A little something for ${card.recipientName}`,
    description: "Someone who cares about you sent a card. Open the envelope.",
    robots: { index: false, follow: false },
  };
}

export default async function CardPage({ params }: Props) {
  const { slug } = await params;
  let card = await getCardBySlug(slug);
  if (!card) notFound();

  // If a scheduled card's moment has come, give delivery a beat to run.
  if (card.status === "scheduled") {
    await opportunisticTick().catch(() => {});
    card = (await getCardBySlug(slug)) ?? card;
  }

  // Draft and unpaid cards have not reached anyone. Waiting rooms, not
  // spoilers: the link should never leak the words early.
  if (card.status === "draft" || card.status === "awaiting_payment") {
    return (
      <CardNotReady
        recipientName={card.recipientName}
        kind="unfinished"
      />
    );
  }

  if (card.status === "cancelled") {
    return (
      <main className="min-h-screen bg-mist/50 flex flex-col items-center justify-center px-4 text-center">
        <PandaMoodFace mood="bashful" size={96} className="drop-shadow-md" />
        <h1 className="mt-6 font-display font-semibold text-ink text-2xl">
          This card was taken back
        </h1>
        <p className="mt-3 text-[14px] text-ink-soft max-w-sm leading-relaxed">
          The sender asked Panda to hold it before it reached you. Nothing
          personal, promise. If you think this was a mistake, ask them to
          send it again.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-full border-2 border-ink/12 text-ink text-[13.5px] font-semibold px-6 py-3 hover:border-ink/30 transition-colors"
        >
          Make one of your own
        </Link>
      </main>
    );
  }

  if (card.status === "scheduled") {
    const when = card.deliverAt ? new Date(card.deliverAt) : null;
    return (
      <CardNotReady
        recipientName={card.recipientName}
        kind="early"
        when={when}
      />
    );
  }

  const label =
    card.occasion === "custom"
      ? "Just because"
      : getOccasion(card.occasion)?.label ?? occasionLabel(card.occasion);

  const photos: string[] = card.photos ? JSON.parse(card.photos) : [];
  const showPhotos = card.plan === "paid" ? photos : [];

  return (
    <main className="min-h-screen bg-mist/50 flex flex-col">
      <header className="w-full py-5 px-4">
        <Link
          href="/"
          className="mx-auto flex w-fit items-center gap-2 rounded-full bg-white/70 border border-ink/10 px-4 py-2 text-[12.5px] font-medium text-ink/70 hover:text-ink transition-colors backdrop-blur"
        >
          🐼 sent with Panda Messages
        </Link>
      </header>
      <div className="flex-1 px-2 sm:px-4 pb-8">
        <CardSceneClient
          slug={slug}
          data={{
            occasionLabel: label,
            recipientName: card.recipientName,
            senderName: card.senderName,
            message: card.message,
            signoff: card.signoff,
            theme: card.theme,
            songId: card.plan === "paid" ? card.songId : null,
            photos: showPhotos,
            watermark: card.watermark,
            plan: card.plan === "paid" ? "paid" : "free",
          }}
        />
      </div>
    </main>
  );
}
