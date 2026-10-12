import { NextResponse } from "next/server";
import { audiusStreamUrl } from "@/lib/audius";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * The audio proxy.
 *
 * Audius tracks live on content nodes whose hostnames rotate, and whose
 * stream endpoint answers with a signed 302. Playing audio straight from
 * the browser would mean listing every possible node in the page's CSP
 * forever. Instead the card's player points at this route, which follows
 * the redirect server-side and streams the bytes back under our own
 * origin: one tight CSP, every node rotation invisible, and a clean 404
 * when a track is ever withdrawn.
 *
 * Two details that matter:
 *   - upstream serves real MP3s (ID3-tagged) behind a generic
 *     application/octet-stream MIME; the proxy corrects it so Safari,
 *     which refuses to sniff, plays too,
 *   - the abort timer guards the handshake only; once headers arrive it
 *     is cleared so a five-minute song streams to the end.
 */

const ID_PATTERN = /^[a-zA-Z0-9]{1,20}$/;

function errorResponse(status: number, message: string): Response {
  return new NextResponse(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!ID_PATTERN.test(id)) {
    return errorResponse(400, "Not a song Panda can play.");
  }

  // A play is one request; a browse session previews a handful. Generous
  // ceiling, still bounded.
  const verdict = await rateLimit(`audius-stream:${clientIp(req)}`, 90, 60_000);
  if (!verdict.ok) {
    return errorResponse(429, "Too many plays at once. Give it a breath.");
  }

  const abort = new AbortController();
  const handshakeTimer = setTimeout(() => abort.abort(), 15_000);
  let upstream: Response;
  try {
    upstream = await fetch(audiusStreamUrl(id), {
      redirect: "follow",
      signal: abort.signal,
      // The catalog serves the whole song as one progressive stream; Range
      // is not supported upstream, so none is forwarded or advertised.
      headers: { Accept: "audio/*, application/octet-stream;q=0.9, */*;q=0.5" },
    });
  } catch {
    return errorResponse(502, "The song did not answer. Try again in a moment.");
  } finally {
    clearTimeout(handshakeTimer);
  }

  if (upstream.status === 404 || upstream.status === 410) {
    return errorResponse(404, "This song has drifted off the shelf.");
  }
  if (upstream.status === 403 || upstream.status === 401) {
    return errorResponse(404, "This song is no longer shared this way.");
  }
  if (upstream.status === 429) {
    return errorResponse(429, "The library is busy. Try again in a moment.");
  }
  if (!upstream.ok || !upstream.body) {
    return errorResponse(502, "The song did not answer. Try again in a moment.");
  }

  const upstreamType = upstream.headers.get("content-type") ?? "";
  const contentType = upstreamType.includes("audio") ? upstreamType : "audio/mpeg";

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // The bytes of a track never change; let the browser keep them for
      // instant replays without another hop through here.
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** Some players probe before they play. Same answer, no body. */
export async function HEAD(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const get = await GET(req, ctx);
  return new Response(null, {
    status: get.status,
    headers: get.headers,
  });
}
