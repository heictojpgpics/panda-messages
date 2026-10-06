import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCardBySlug, recordView } from "@/lib/cards";
import { getOccasion, occasionLabel } from "@/data/occasions";
import { CardSceneClient } from "./CardSceneClient";

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
  const card = await getCardBySlug(slug);
  if (!card) notFound();

  // The moment of arrival. Counted once per first open.
  if (card.status === "sent" || !card.openedAt) {
    await recordView(card.id);
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
