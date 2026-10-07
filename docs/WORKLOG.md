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

## Reveal and keepsake refinement, 2026-10-07

### Findings and changes

- The reveal skipped from a closed envelope to a fully open flap. Rebuilt it as a paced three-beat sequence: seal break, letter lift, and card arrival. The reduced-motion route keeps the same order without excess movement.
- The reveal now carries a small, deterministic celebration chosen for the occasion first and the wrapping second. Birthday, graduation, new-home, thank-you, get-well, morning, night, and seasonal moments no longer all behave alike.
- Lifted the delivery header above the reveal layer and added separation below it, preventing the ambient card effects from colliding with the rounded “sent with Panda Messages” pill.
- Removed the redundant “Your name” reply field. A reply comes from the named recipient on the envelope, and the server sets that author identity itself.
- Rebalanced the reaction and reply controls for narrow screens. Reactions are compact four-column tactile choices with responsive labels; writing back and sending a return card are two clear, equal actions.
- Added private R2 photo architecture. New uploads move into a capability-scoped `CARD_PHOTOS` binding and are served through a no-store card proxy. The R2 bucket remains private, the card link is the access capability, drafts stay sealed, and old inline photo data remains readable.
- Added a deliberate photo layout for one, two, or several keepsakes instead of fixed square thumbnails in a wrapping row.
- Added six occasion-specific transparent portraits: congratulations, thank you, new home, new baby, good luck, and get well. The collection now has nineteen generated portraits, with occasion portraits taking priority over a generic theme face when appropriate.

### Verification

- Visual asset inspection confirmed all six new portraits have an alpha channel and a clean transparent silhouette.
- `npm run lint` and `npm run build` pass after the changes.
- Local HTTP smoke check returns `200` for the landing page. A draft reply read remains protected with `409`.
- Browser screenshot automation was attempted against the local server but the isolated browser cannot reach the sandbox address. The running app was checked over HTTP, and the animation, z-index, responsive grid, and focus paths were additionally verified in source and production build output.
- The supplied Cloudflare token authenticates and initialized D1, but Cloudflare rejected R2 operations because that token lacks R2 Object Storage permission. The binding and routes are committed and ready; creating or binding the production bucket requires a token with R2 edit permission.

## Envelope and reveal redesign, 2026-10-07

### What changed

The envelope was rebuilt as a physical prop rather than a vector illustration. It is now layered the way real mail is: an inside back, a dark mouth band, the sheet, the addressed front panel, the flap, the wax. The sheet rests fully inside the pocket and only ever emerges through the mouth, so a sealed envelope no longer shows paper poking out the top. The paper carries grain, seam lines, a light-catching fold ridge, a perforated stamp with a panda portrait and value tablet, a wavy cancellation mark, an italic "to {name}" address block, and a "panda post" return corner. The seal is a hand-poured wax blob with an embossed ring, a stamped-in panda, and a periodic glint while it waits.

The opening is now a six-stage sequence driven by one phase machine in CardScene: pressing (the whole prop gives under the tap), cracking (the wax tears into two halves plus eleven shards with gravity and a dust puff), unfolding (the flap tip springs up as the wax lets go, resists, then flops back past its crease), rising (the sheet climbs with friction, overshoots a hair and settles while the envelope leans back), lifted (a breath with the sheet held in the air), and card (the letter hands off to the card). Full pace is about 2.6 seconds to the card, roughly a quarter of that under reduced motion.

The celebration and the ambient weather were rebuilt in AmbientParticles. The burst is three choreographed waves: theme-colored confetti, the occasion's glyphs, then slow stars. The ambient drift falls in three depth layers with sinusoidal sway, masked away from the header band so nothing ever crowds the brand pill. Motifs are chosen for the occasion first, the wrapping second, and the season only when the card does not already have strong weather of its own: February adds hearts, late December into January adds snow, October adds leaves and pumpkins, graduation week adds caps and confetti.

The reactions and reply block was rebalanced. Reactions run three across on a phone and six on a desk, labels wrap instead of truncating, counts pop in with a spring, and the celebration bursts rise out of the tapped button rather than the middle of the screen. "Write {sender} back" is now the primary action in jade, with "Send a card back" as its quiet partner, stacked on narrow screens. The delivery header gained breathing room and a stronger pill so it always reads.

### Fixes found along the way

- The stage chain read a missing "card" key from the timing table, producing a NaN delay that stalled the sequence at the lifted stage. The table now covers every stage and the chain guards against non-finite holds.
- Inline style floats rounded to six significant digits in server HTML but compared as raw doubles during hydration, which tripped a mismatch warning. Every computed style value in the envelope and the particles is now quantized to two decimals.
- The seed script for local testing had shifted positional parameters (cards landed with plan and status crossed). It uses named parameters now.

### Verification

- `npm run lint`, `tsc --noEmit`, and `npm run build` all pass.
- Browser automation with screenshot and video capture verified the sequence on desktop and a 390px phone across bamboo, birthday, rose, winter, autumn, moonlit, and confetti wrappings, plus the landing demo, the wizard's rehearsal dialog, the reaction and reply flows, and replay.
- Vision review of the captured frames scored the sealed state 8.5/10, the mobile experience 9/10, and themed openings 9 to 10 out of 10, with the remaining notes (dev-tools badge, recording artifacts) outside the product.
- Zero hydration errors on the landing and card pages after the quantization fix.

## The fold, redone as a fold

The first rebuild of the opening still treated the flap as a shape that flips. Two root causes sat underneath the symptom. First, the flap's rotation was rendered with no perspective at all: a clipping wrapper between the stage and the flap flattened the 3D context, so rotateX collapsed into a plain vertical squash, which reads on screen as a flat panel shrinking to a line and reappearing upside down. Second, the liner face was never mirrored for the folded-back position, so the opened flap showed its broad edge up and its point at the crease, exactly backwards, with a dark band where the join should be.

The flap now lives inside its own perspective viewport and rotates around a hinge set a couple of pixels below the top edge. The crease edge never leaves the hinge; the panel foreshortens as it lifts, passes edge-on as a short standing band, and unfolds on the far side with the liner showing, its wide edge landing at the crease and its rounded tip pointing up. It comes to rest at 186 degrees, a hair past flat, the way a panel resting against the back panel of a real pocket would. Two backface-culled shade overlays ride the fold: the outer paper falls into shade as it swings up, and the liner is revealed deep in the pocket's shadow and comes back into the light as it settles. A thin light stroke along the free edge gives the paper a glint at the edge-on moment.

The join is now drawn rather than hoped for. A lip strip along the back panel's top edge sits over the crease in every state, so the flap reads as attached behind the envelope whether sealed or open, and the liner carries a contact shadow where the pocket's edge shades it. The wax seal moved from mid-flap to the tip, where it actually bonds flap to pocket, and the front panel's big fold triangle was quieted to a shallow seam so it can no longer read as a second flap.

Z order became explicit choreography. While the flap covers the face it lives above the mail layer; once it rests behind, it drops below the letter, so the sheet climbs past in front of the open liner, and its top edge slips out from behind the upper lip like real mail leaving a pocket. The clipping wrapper, whose bounds had also been silently trimming the risen letter's top, now clears far above the stage.

The landing demo and the wizard's rehearsal get the same chain through an internal two-beat sequence: the flap folds first, the letter climbs only after it settles. A demo envelope that renders already open skips straight to the settled pose.

### Fixes found along the way

- The unfolding keyframes were unreachable code: an earlier branch in the same animate expression caught the stage first, so the fold played as a single flat tween with none of its intended beats. The branch order now puts the unfolding case first.
- The clip wrapper's top bound (-60 percent) sat below both the open flap's tip and the letter's peak, trimming both during the rise. The bound now clears the full travel.
- The wax seal floated at mid flap, detached from the tip it was supposed to bond. It sits at the tip now, straddling the join, with the shatter origin matched in the scene.
- The wizard's rehearsal renders its envelope already open, which the completion-driven internal chain would have left waiting for an animation that never runs. The chain seeds itself from the mount-time open flag.

### Verification

- `npm run lint`, `tsc --noEmit`, and `npm run build` all pass; zero hydration errors on landing and card pages.
- Frame-by-frame vision review (10 fps contact sheets) of the fold: real 3D hinge with foreshortening and an edge-on standing moment, attached at the crease throughout, no gap, no 2D flip artifact, dynamic shading visible frame to frame, shade overlays confined to the flap shape. Fold realism scored 9/10; the full opening received a SHIP verdict.
- Regression checks: landing demo close and reopen on scroll, wizard rehearsal end to end, mobile at 390px, sealed and final states, and the handoff crossfade inspected at full resolution (no empty beat).

## 2026-10-07 Opening pace: a third of a second more air

The opening read as quick. A recipient taps the seal and, two and two thirds seconds later, holds a card; every beat was there but none of them lingered. The whole sequence now takes a beat under three seconds, with the extra third of a second spent where the eyes are: the fold.

Stage windows: the tap's press hold 230ms (was 200), the wax tear 550ms (was 480), the flap's fold 880ms (was 740), the letter's climb 1060ms (was 1000), the held breath unchanged at 240ms. Every duration inside the envelope stretches with its window in lockstep: the fold's rotation, its traveling shade, both liner shade overlays, the crack lift, and the letter's climb (1.01s after its 50ms wait), so nothing drifts out of sync or finishes early into dead air.

The landing demo and wizard rehearsal inherit the same pacing through the shared fold-and-climb chain. Reduced motion keeps scaling every number by the same single factor.

### Verification

- `npm run lint`, `tsc --noEmit`, and `npm run build` all pass.
- Frame-by-frame vision review of a 30fps capture: seal cracks at 230ms exactly, fold swings visibly for the full window and settles at 1660ms, letter peaks at 2720ms, card hands off at 2960ms. The flap stays attached at the crease in every frame with no gaps or artifacts, the liner reveals as the panel passes vertical, and the seal clears before the fold begins.
- Landing demo scroll-trigger still opens to the settled pose with the flap resting behind the pocket.

## Cloudflare storage and deployment hardening, 2026-10-07

### Findings and changes

- The private-photo error did not come from a missing value in `.env.example`. That file is documentation only, no `panda-messages` Worker existed in the Cloudflare account, and a static host cannot provide an R2 binding to a Next route handler.
- Replaced the production D1 REST client with the Worker-native `DB` binding. The deployed application no longer needs, receives, or can leak an account-wide Cloudflare API token. R2 already uses the matching `CARD_PHOTOS` capability binding.
- Declared the real D1 binding and private R2 bucket in `wrangler.toml`. The Worker is now the one production unit for the Next UI, API routes, D1, R2 proxy, and cron trigger. GitHub Pages is not a fit because it cannot run the private API or cron handler.
- Added the versioned initial D1 migration and applied it to both Wrangler's local D1 simulation and the existing remote database. Future deployments can use the Wrangler migration ledger instead of a one-off REST script.
- Added `cf:preview`, which launches the generated Worker entry directly. This avoids a development-only OpenNext/Wrangler generated-file mutation that duplicated `next-env` exports on a second Wrangler dev launch.
- Pinned Next.js and its ESLint config to 16.3.8. The prior floating range installed Next 16.4, which crashes this OpenNext Worker stack while loading `preview-props.json`; the pinned release is inside the adapter's declared support range and starts correctly in the Worker runtime.
- Rewrote the deployment guide and `.env.example` comments so it is explicit which variables are local tooling only and which capabilities Cloudflare injects at runtime.

### Verification

- Confirmed the remote D1 database is present and initialized, then verified its users, cards, events, reactions, replies, rate limits, and outbox records through `npm run db:status`.
- `npm run lint`, `npm run build`, and the clean OpenNext Worker build pass with the pinned dependency set.
- Wrangler production dry-run passes and lists the `DB`, `CARD_PHOTOS`, and `ASSETS` bindings.
- In the local Workers runtime, the full private-photo path passes: create draft `200`, R2 upload `200`, owner-authorized read `200` with `image/png`, and no-token draft read `403`.
