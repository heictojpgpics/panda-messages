"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CardScene, type CardSceneData } from "@/components/card/CardScene";

/** The "see how they will open it" rehearsal. The full moment, in a box. */
export function OpenPreview({
  open,
  onClose,
  data,
  occasionLabel,
}: {
  open: boolean;
  onClose: () => void;
  data: CardSceneData;
  occasionLabel: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[520px] p-0 overflow-hidden bg-transparent border-none">
        <DialogTitle className="sr-only">A rehearsal of {data.recipientName} opening the card</DialogTitle>
        <CardScene data={{ ...data, occasionLabel }} mode="demo" />
      </DialogContent>
    </Dialog>
  );
}
