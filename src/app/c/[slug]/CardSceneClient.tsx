"use client";

import { useCallback } from "react";
import { CardScene, type CardSceneData } from "@/components/card/CardScene";

export function CardSceneClient({
  slug,
  data,
}: {
  slug: string;
  data: CardSceneData;
}) {
  const onOpened = useCallback(() => {
    // Tell the sender's watch feed the moment it happened.
    fetch(`/api/cards/${slug}/open`, { method: "POST" }).catch(() => {});
  }, [slug]);

  return (
    <CardScene
      data={data}
      mode="view"
      slug={slug}
      onOpened={onOpened}
    />
  );
}
