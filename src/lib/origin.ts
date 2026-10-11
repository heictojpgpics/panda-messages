import type { NextRequest } from "next/server";

/**
 * Cross-site request guard for state-changing endpoints.
 *
 * A browser only sends cookies cross-origin under specific conditions, and
 * a hostile site can still fire fetch POSTs at us with a victim's session
 * cookie attached. Same-origin enforcement at the door closes that class
 * completely: any POST whose Origin (or Referer, when Origin is absent,
 * as with some older clients) is not this site is refused before it
 * touches a route handler.
 *
 * Non-browser callers (Stripe webhooks, cron triggers) send no Origin at
 * all and pass through: they authenticate by signature or secret, not
 * by cookie.
 */
export function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) {
    // No Origin header: not a browser cross-site call (curl, webhooks,
    // server-to-server). Same-origin form posts also land here in some
    // browsers, and Referer backs them up when present.
    const referer = req.headers.get("referer");
    if (!referer) return true;
    try {
      return new URL(referer).host === req.headers.get("host");
    } catch {
      return false;
    }
  }
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}
