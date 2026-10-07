# Panda Messages production audit worklog

## Baseline, 2026-10-07

- Cloned the repository and installed the exact dependency lockfile.
- Ran lint successfully before changes.
- Read the application, data, delivery, authentication, payment, D1, and UI layers.
- Inspected the public Kitty Messages landing page as a product reference. Its strongest patterns are the instant occasion picker, early recipient-moment preview, clear paid-surprise value, and short reassurance around delivery and refunds.
- A local server returns the Panda home page successfully. The cloud browser cannot reach the sandbox-local server, so its visual audit is supplemented with runtime HTTP checks, source-level responsive review, and production builds.

## Findings and changes

- The card-opening instruction used hover-only opacity. On touch devices it was invisible. It is now always visible on touch and still appears on hover at larger widths.
- Reactions previously animated as successful before the API answered. They now fetch existing counts, only celebrate a fresh accepted reaction, and surface a clear error if delivery fails.
- Reactions and replies could be attempted against unfinished cards. Both routes now require an already-live card.
- Added a consistent keyboard focus treatment and stronger reduced-motion handling.
- Added three themed generated Panda portraits and connected them to the card experience.
- Added Sea Glass, Berry Kiss, and Night Market themes, all built on existing card texture systems.
- Theme selection now uses the real envelope swatches, so the wrapping choice reads as a card choice rather than a generic color tile.
- Checkout order details now require the signed-in owner or the original edit token. The token is retained by card id for the first checkout, and edit photo updates now enforce the same size limits as card creation.
- Updated product documentation and customer-facing plan copy to reflect the fourteen-theme collection.

## Verification

- `npm run lint` passes after the changes.
- Production build passes with `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 npm run build`. The TLS setting is needed only by this sandbox while Next fetches the configured Google Fonts.
- HTTP smoke checks returned `200` for the landing page, creation, authentication, dashboard, message library, policy pages, reminder, writer, and an already-live card.
- Authenticated local flow: sign up, create a draft, reject draft reaction and reply with `409`, finalize the free card, accept one live reaction and reply with `200`.
- Ownership flow: checkout details reject an unauthenticated request with `403` and accept the original edit token with `200`.
- Draft update flow: a route-bound `PATCH` returns `200` for the authenticated owner.
