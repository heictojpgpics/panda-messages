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

## Follow-up refinement, 2026-10-07

### Findings and changes

- Draft persistence and edit-token handling had grown into separate, easy-to-miss local-storage snippets across the composer, checkout, and dashboard. Replaced them with one versioned Zustand memory store, including a read-only bridge for an unfinished legacy draft. A saved wizard step now resumes at that exact point.
- The reaction and reply write routes protected draft cards, but their read routes still exposed draft activity. Reads now enforce the same live-card rule.
- Reworked the live-card response area: reaction choices now state their count accurately, retain a selected state after a successful send, support keyboard focus and pressed semantics, and do not celebrate a duplicate request. The reply form is clearer, calmer, and does not expose private reply text to every visitor holding a shared link.
- Replaced the repeated landing mascot sprite in the hero with an interactive rotating wardrobe of the new transparent portraits. The card preview and theme picker already use the theme-specific portrait, so each wrapping now has a coherent illustration throughout the journey.
- Generated and compressed ten additional transparent, hand-painted Panda portraits: bamboo, flowers, stargazer, velvet, sun, winter, autumn, confetti, sea, and lantern. Together with the existing themed portraits, all fourteen themes have a matching Panda treatment.
- Corrected the theme collection count on the landing page.

### Verification

- `npm run lint` passes.
- Production build passes with `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 npm run build`.
- Local HTTP checks return `200` for the landing page and every new portrait asset.
- Read-only live-card API smoke test: a local draft returns `409` from both reaction and reply reads; an already-sent card returns `200` from both endpoints.
