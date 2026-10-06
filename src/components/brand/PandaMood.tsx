import { cn } from "@/lib/utils";

const MOODS = {
  center: "/panda/d-center.png",
  heart: "/panda/r-heart.webp",
  sparkle: "/panda/r-sparkle.webp",
  wink: "/panda/r-wink.webp",
  bashful: "/panda/r-bashful.webp",
  sleepy: "/panda/r-sleepy.webp",
  delighted: "/panda/r-delighted.webp",
  surprised: "/panda/r-surprised.webp",
  dizzy: "/panda/r-dizzy.webp",
  blink: "/panda/r-blink.webp",
  left: "/panda/d-left.webp",
  right: "/panda/d-right.webp",
  up: "/panda/d-up.webp",
  down: "/panda/d-down.webp",
} as const;

export type PandaMood = keyof typeof MOODS;

/** Static panda portraits extracted from the mascot sprite sheets. */
export function PandaMoodFace({
  mood = "center",
  size = 120,
  className,
  alt = "Panda",
}: {
  mood?: PandaMood;
  size?: number;
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={MOODS[mood]}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      loading={"lazy"}
      decoding={"async"}
      className={cn("object-contain select-none pointer-events-none", className)}
      style={{ width: size, height: "auto" }}
    />
  );
}

/** The soft circular halo version used inside cards. */
export function PandaHalo({
  mood = "center",
  size = 132,
  className,
}: {
  mood?: PandaMood;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("relative inline-grid place-items-center rounded-full", className)}
      style={{
        width: size * 1.24,
        height: size * 1.24,
        background: "radial-gradient(circle at 50% 42%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.55) 55%, rgba(255,255,255,0) 72%)",
      }}
    >
      <PandaMoodFace mood={mood} size={size} className="relative z-10" />
    </span>
  );
}
