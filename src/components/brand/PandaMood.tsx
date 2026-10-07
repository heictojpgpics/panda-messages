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
  birthday: "/panda/theme-birthday-panda.webp",
  moonlit: "/panda/theme-moonlit-panda.webp",
  rose: "/panda/theme-rose-panda.webp",
  bamboo: "/panda/theme-bamboo-panda.webp",
  flowers: "/panda/theme-flowers-panda.webp",
  stargazer: "/panda/theme-stargazer-panda.webp",
  velvet: "/panda/theme-velvet-panda.webp",
  sun: "/panda/theme-sun-panda.webp",
  winter: "/panda/theme-winter-panda.webp",
  autumn: "/panda/theme-autumn-panda.webp",
  confetti: "/panda/theme-confetti-panda.webp",
  sea: "/panda/theme-sea-panda.webp",
  lantern: "/panda/theme-lantern-panda.webp",
} as const;

export type PandaMood = keyof typeof MOODS;

/** Match the hero on a card to its wrapping without making every theme noisy. */
export function pandaMoodForTheme(themeId: string): PandaMood {
  if (themeId === "bamboo-grove") return "bamboo";
  if (themeId === "pressed-flowers") return "flowers";
  if (themeId === "rose-garden" || themeId === "berry-kiss") return "rose";
  if (themeId === "long-distance") return "moonlit";
  if (themeId === "moonlit-garden") return "stargazer";
  if (themeId === "midnight-velvet") return "velvet";
  if (themeId === "golden-hour") return "sun";
  if (themeId === "winter-wonderland") return "winter";
  if (themeId === "autumn-leaves") return "autumn";
  if (themeId === "birthday-bash") return "birthday";
  if (themeId === "confetti-pop") return "confetti";
  if (themeId === "sea-glass") return "sea";
  if (themeId === "night-market") return "lantern";
  return "heart";
}

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
