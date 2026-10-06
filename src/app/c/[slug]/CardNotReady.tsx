import { PandaMoodFace } from "@/components/brand/PandaMood";
import { Envelope } from "@/components/brand/Envelope";
import { getTheme } from "@/data/themes";

/**
 * The waiting room states of a card link. An early link or a work in
 * progress gets a gentle tease instead of the content, so the surprise
 * stays a surprise and drafts never leak.
 */
export function CardNotReady({
  recipientName,
  kind,
  when,
}: {
  recipientName: string;
  kind: "early" | "unfinished";
  when?: Date | null;
}) {
  const morning = when
    ? when.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
    : null;

  return (
    <main className="min-h-screen bg-mist/50 flex flex-col items-center justify-center px-4 text-center">
      <div className="flex flex-col items-center max-w-md">
        <Envelope theme={getTheme("bamboo-grove")} open={false} width={200} className="opacity-90" />
        <h1 className="mt-8 font-display font-semibold text-ink text-2xl leading-snug">
          {kind === "early"
            ? `Panda is holding something for you, ${recipientName}`
            : "This card is still being made"}
        </h1>
        <p className="mt-3 text-[14px] text-ink-soft leading-relaxed">
          {kind === "early"
            ? morning
              ? `It arrives on ${morning}, in the morning. Come back then. It will open like a gift, promise.`
              : "It has not left Panda's paws quite yet. Check back a little later."
            : "The envelope is not sealed yet. Whoever is writing it wants to get the words just right. Come back soon."}
        </p>
        <PandaMoodFace
          mood={kind === "early" ? "sleepy" : "wink"}
          size={72}
          className="mt-6 drop-shadow-md"
        />
      </div>
    </main>
  );
}
