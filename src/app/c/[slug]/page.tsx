import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCardBySlug } from "@/lib/cards";
import { getOccasion, occasionLabel } from "@/data/occasions";
import { opportunisticTick } from "@/lib/delivery";
import { CardSceneClient } from "./CardSceneClient";
import { CardNotReady } from "./CardNotReady";
import { PandaMoodFace } from "@/components/brand/PandaMood";
import { parseCardPhotos } from "@/lib/card-photos";

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

  const label = card.customOccasion?.trim()
    ? card.plan === "paid"
      ? card.customOccasion.trim()
      : "Just because"
    : card.occasion === "custom"
      ? "Just because"
      : getOccasion(card.occasion)?.label ?? occasionLabel(card.occasion);

  const photos = parseCardPhotos(card.photos);
  const showPhotos = card.plan === "paid" ? photos : [];

  return (
    <main className="relative min-h-svh">
      {/* The scene owns the whole viewport: the moment is immersive, so
          chrome waits until the letter has been read. A reply lineage gets
          a quiet note above the world. */}
      {card.replyToCardId && (
        <div className="pointer-events-none absolute inset-x-0 top-2 z-30 flex justify-center px-3">
          <p className="rounded-full bg-jade-soft/80 border border-jade/20 px-4 py-1.5 text-[11.5px] font-semibold text-jade backdrop-blur-sm">
            🐼 One of yours, come back around
          </p>
        </div>
      )}
      <CardSceneClient
        slug={slug}
        data={{
          occasionLabel: label,
          occasionId: card.occasion,
          recipientName: card.recipientName,
          senderName: card.senderName,
          message: card.message,
          signoff: card.signoff,
          theme: card.theme,
          songId: card.plan === "paid" ? card.songId : null,
          song:
            card.plan === "paid" && card.songProvider !== "youtube" && card.songId
              ? {
                  id: card.songId,
                  provider: card.songProvider ?? "audius",
                  title: card.songTitle ?? null,
                  artist: card.songArtist ?? null,
                  artwork: card.songArtwork ?? null,
                  duration: card.songDuration ?? null,
                  permalink: card.songPermalink ?? null,
                }
              : null,
          photos: showPhotos,
          photoSlug: slug,
          watermark: card.watermark,
          plan: card.plan === "paid" ? "paid" : "free",
        }}
      />
    </main>
  );
}
