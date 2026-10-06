import { cn } from "@/lib/utils";

const MOODS = {
  center: "/panda/d-center.png",
  heart: "/panda/r-heart.png",
  sparkle: "/panda/r-sparkle.png",
  wink: "/panda/r-wink.png",
  bashful: "/panda/r-bashful.png",
  sleepy: "/panda/r-sleepy.png",
  delighted: "/panda/r-delighted.png",
  surprised: "/panda/r-surprised.png",
  dizzy: "/panda/r-dizzy.png",
  blink: "/panda/r-blink.png",
  left: "/panda/d-left.png",
  right: "/panda/d-right.png",
  up: "/panda/d-up.png",
  down: "/panda/d-down.png",
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
