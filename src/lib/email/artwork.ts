import { siteUrl } from "@/lib/config";
import type { ArtworkKey } from "./copy";

/**
 * Artwork for the mail. Each panda portrait is a sealed envelope in the
 * carrier's paws, because the card inside stays hidden until the reader
 * chooses to open it. Alt text carries the scene for readers who cannot
 * see it, and for every email client that blocks images by default.
 */

const ART: Record<ArtworkKey, { file: string; alt: string }> = {
  post: {
    file: "email-panda-post.png",
    alt: "Panda in a cream cardigan holding a sealed envelope closed with a green wax seal",
  },
  love: {
    file: "email-panda-love.png",
    alt: "Panda in a red knit sweater holding a sealed envelope and a single rose",
  },
  celebrate: {
    file: "email-panda-celebrate.png",
    alt: "Festive panda in a patterned sweater holding a sealed envelope while confetti falls",
  },
  moon: {
    file: "email-panda-moon.png",
    alt: "Panda in a navy coat and mustard scarf holding a sealed envelope under a crescent moon charm",
  },
  birthday: {
    file: "email-panda-birthday.png",
    alt: "Panda in a party hat holding a sealed envelope with a pink wax seal, with balloons",
  },
  christmas: {
    file: "email-panda-christmas.png",
    alt: "Panda in a santa hat holding a sealed envelope with a red wax seal and a pine sprig",
  },
  "mothers-day": {
    file: "email-panda-mothers-day.png",
    alt: "Panda in a blush cardigan holding a sealed envelope and a bouquet of tulips",
  },
  "fathers-day": {
    file: "email-panda-fathers-day.png",
    alt: "Panda in a flat cap and navy sweater holding a sealed envelope with a blue wax seal",
  },
  graduation: {
    file: "email-panda-graduation.png",
    alt: "Panda in a graduation cap holding an envelope tied with a gold ribbon like a diploma",
  },
  "new-baby": {
    file: "email-panda-new-baby.png",
    alt: "Softly lit panda in a pastel cardigan holding a sealed envelope with a pale blue wax seal",
  },
  "new-home": {
    file: "email-panda-new-home.png",
    alt: "Panda in a mustard scarf holding a sealed envelope with a copper wax seal",
  },
  "thank-you": {
    file: "email-panda-thank-you.png",
    alt: "Panda in a sage sweater holding a sealed envelope and a small bouquet of daisies",
  },
  "get-well": {
    file: "email-panda-get-well.png",
    alt: "Panda in a cozy shawl holding a sealed envelope with a sage wax seal and a daisy",
  },
  "good-morning": {
    file: "email-panda-good-morning.png",
    alt: "Panda in a straw sun hat holding a sealed envelope in warm morning light",
  },
};

export function emailArtwork(key: ArtworkKey) {
  const art = ART[key];
  return {
    src: `${siteUrl()}/panda/email/${art.file}`,
    alt: art.alt,
    width: 640,
    height: 800,
  };
}

/** The theme's own wax seal, rendered from the site's exact seal artwork. */
export function emailSeal(themeId?: string) {
  const id = themeId ?? "bamboo-grove";
  return {
    src: `${siteUrl()}/panda/email/seals/seal-${id}.png`,
    alt: "A wax seal stamped with a panda",
    width: 128,
    height: 128,
  };
}
