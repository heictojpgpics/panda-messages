import { NextRequest } from "next/server";
import { getCardBySlug, listEventsForCard } from "@/lib/cards";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events feed for one card. The sender's watch page keeps this
 * open and receives opened / reacted / replied moments as they happen.
 * Works on Node and on Cloudflare Workers, no WebSocket server needed.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = await getCardBySlug(slug);
  if (!card) return new Response("not found", { status: 404 });

  // Only the maker may watch. (Recipients get their own live experience on the card page.)
  const user = await getCurrentUser();
  const url = new URL(req.url);
  const editToken = url.searchParams.get("editToken");
  const owns =
    (user && card.userId && card.userId === user.id) ||
    (editToken && editToken === card.editToken);
  if (!owns) return new Response("forbidden", { status: 403 });

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      // Replay current state first so the watcher's UI is instant.
      send({
        type: "state",
        status: card.status,
        deliveredAt: card.deliveredAt,
        openedAt: card.openedAt,
        viewCount: card.viewCount,
      });

      let lastId = 0;
      try {
        const history = await listEventsForCard(card.id, 0, 50);
        for (const ev of history) {
          send({
            type: ev.type,
            id: ev.id,
            at: ev.createdAt,
            meta: ev.meta ? JSON.parse(ev.meta) : null,
          });
          lastId = Math.max(lastId, ev.id);
        }
      } catch {
        // Start from now if history is unavailable.
      }

      const poll = setInterval(async () => {
        if (closed) return;
        try {
          const events = await listEventsForCard(card.id, lastId, 20);
          for (const ev of events) {
            send({
              type: ev.type,
              id: ev.id,
              at: ev.createdAt,
              meta: ev.meta ? JSON.parse(ev.meta) : null,
            });
            lastId = Math.max(lastId, ev.id);
          }
        } catch {
          // Ignore transient read errors, keep the stream alive.
        }
      }, 1500);

      const keepAlive = setInterval(() => {
        if (closed) return;
        controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, 15000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(poll);
        clearInterval(keepAlive);
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      };

      req.signal.addEventListener("abort", cleanup);
      // Auto-close long watchers after 10 minutes. The client reconnects.
      setTimeout(cleanup, 10 * 60 * 1000);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
