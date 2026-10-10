# Deploying Panda Messages

The production app runs as one full-stack Cloudflare Worker built by
OpenNext. D1 and R2 are attached as private capability bindings, so the
application never stores an account-wide Cloudflare API token. Copy
`.env.example` to `.env` only for local Node development and deployment
tooling; it is not deployed configuration.

## Deployment shape: why this is a Worker, not Pages

Cloudflare Pages Functions can bind D1 and R2. That is the right design for
a static site with a small `/functions` API. This repository is not that
shape: it uses the Next.js App Router, dynamic route handlers, server-side
rendering, an authorization-checked private-photo proxy, and a scheduled
delivery handler. Cloudflare's current Next.js guidance sends that full-stack
feature set to Workers, while Pages is for a static Next.js export.

This is still one Cloudflare deployment: the Worker serves the site, API,
cron trigger, D1 access and private R2 access under one domain. Do not move
the Cloudflare management token into a runtime secret. `DB` and
`CARD_PHOTOS` are native bindings, not credentials.

Two supported development shapes:

1. **Local Node development** uses the SQLite file automatically. This is
   never used by the deployed application.
2. **Cloudflare Workers** is the only production deployment shape. It hosts
   the Next.js app, its API, the D1 database, private R2 photos, and the
   delivery cron in one runtime.

## 1. Quick sanity checks

```bash
npm install
npm run dev            # http://localhost:3000, local SQLite, zero config
npm run lint           # eslint
npm run build          # strict types + production bundle
npm run db:status      # prints every table and row count
```

The local SQLite file is created at `db/panda.db` on first boot, schema
included. Override the location with `SQLITE_PATH` (use an absolute path in
production; the standalone server resolves relative paths from its own
directory).

## 2. Storage: Cloudflare D1

The Worker uses the `DB` binding declared in `wrangler.toml`. D1 access is
private to this Worker and never crosses the public management API.

Provision the database, private photo bucket, and committed schema migration
with one explicit operator command:

```bash
npm run cf:provision
```

The command first verifies that the `database_id` already committed in
`wrangler.toml` resolves to the expected `panda-messages` database. It fails
closed if it does not, rather than creating a second empty database. It then
ensures `panda-message-photos` exists, disables its `r2.dev` public URL,
applies the committed D1 migration, repairs the two additive columns needed by
legacy databases, and verifies the core tables. It requires
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` only on the terminal or CI
runner that executes it.

To inspect the exact plan without reaching Cloudflare:

```bash
npm run cf:provision -- --dry-run
```

For an intentionally new environment where the configured D1 database does
not exist, add `--bootstrap`. This is explicit because pointing production at
a new empty database by accident would lose access to live cards:

```bash
npm run cf:provision -- --bootstrap
```

- Verify:

```bash
npm run db:status
# Storage: Cloudflare D1 (...)
#   users 0 rows, cards 0 rows, ... Remote D1 is ready.
```

`db:init` remains as a compatibility alias for applying the D1 migration.
For all new environments prefer `cf:provision`, because it also verifies the
bound D1 database and locks down the photo bucket. To apply only the
committed migration:

```bash
npm run cf:provision -- --migrate-only
```

Wrangler records each migration, so CI can safely apply only migrations that
have not reached production. The CLI credential is used only by the machine
or CI runner that runs the migration.

## 3. Local Node preview

```bash
npm install
npm run build
npm run start          # node .next/standalone/server.js
```

- This mode is for local preview only. It writes to SQLite, not the
  production D1 database, and cannot access the private R2 photo bucket.
- Set `PORT` if needed. The standalone server respects `HOSTNAME` and
  `PORT`.

This is the exact path used for the production build check: `npm run build`
outputs `.next/standalone`, and `npm run start` boots it with plain `node`.

## 4. Cloudflare Workers production deployment

The repo ships everything except the two dev-only packages (they are
heavy; install them when you want this path):

```bash
npm install
npm run cf:deploy
```

### Cloudflare Workers Builds (Git integration)

Workers Builds runs its **Build command** and **Deploy command** separately.
The build must generate `.open-next/worker.js` before Wrangler deploys the
wrapper in `worker-entry.ts`. In **Workers & Pages → panda-messages → Settings
→ Builds**, configure the production branch with exactly one of these safe
setups:

| Build command | Deploy command |
| --- | --- |
| `npm run cf:build` | `npx wrangler deploy` |
| *(leave empty)* | `npm run deploy` |

Use the first setup for the clearest build log. Do not use a blank Build
command together with `npx wrangler deploy`: that command alone cannot create
the OpenNext output. Do not set `npm run cf:build` as the Build command and
`npm run deploy` as the Deploy command together, because that builds twice.

Use the same deployment command for preview builds only if a preview is meant
to deploy the full worker; otherwise leave preview builds disabled until their
runtime bindings and environment values are configured.

The Worker has two private bindings in `wrangler.toml`:

- `DB` points only to the `panda-messages` D1 database.
- `CARD_PHOTOS` points only to the `panda-message-photos` R2 bucket. The
  bucket has no public domain. The app streams individual objects only after
  checking the private card capability or live-card state.

What is committed for this path:

- `open-next.config.ts` — the adapter configuration (no imports, so a
  plain clone still typechecks without the adapter installed).
- `worker-entry.ts` — the worker entry. It wraps the generated
  `.open-next/worker.js` and adds a `scheduled` handler, which the
  OpenNext worker does not ship: the Cron Trigger calls the delivery
  engine in-process on `/api/cron/deliveries` with `CRON_SECRET`.
- `wrangler.toml` — entry, `nodejs_compat`, asset, D1 and R2 bindings,
  non-secret vars, the cron trigger and observability.

`npm run cf:build && npx wrangler deploy --dry-run` builds and validates the
whole worker locally before a real deploy (the bundle is about 7.6MB raw,
1.6MB gzipped). Running `wrangler deploy` alone from a clean checkout is not
enough because the OpenNext output has not been generated yet.

Secrets never go in the committed file:

```bash
npx wrangler secret put STRIPE_SECRET_KEY        # when live
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put CRON_SECRET
```

Notes on Workers:

- D1 and R2 use Worker bindings, not REST credentials. The Cloudflare token
  is needed only by Wrangler or CI to deploy and migrate. Never set it as a
  Worker secret.
- For an exact local runtime test, run these commands in order:

  ```bash
  npx wrangler d1 migrations apply panda-messages --local
  npm run cf:preview
  ```

  This uses local D1 and R2 simulations. Use remote bindings only when
  intentionally testing a real Cloudflare resource.

### Cron Trigger for deliveries

Scheduled cards go out on the minute they are due. The engine is
idempotent, so any scheduler may ping it:

```
GET /api/cron/deliveries
Authorization: Bearer $CRON_SECRET
```

- **Cloudflare Cron Triggers**: wired up already. `wrangler.toml` has
  `[triggers] crons = ["* * * * *"]` and `worker-entry.ts` routes the
  scheduled event into the engine. Nothing to do.
- **External cron** (cron-job.org, GitHub Actions, Upstash QStash): hit
  the endpoint above every minute (or every five; the engine catches
  up). Remove the `[triggers]` block if you go this way.
- **No scheduler at all**: every page load nudges the engine
  opportunistically, so low-traffic deployments still deliver on time
  when anyone (including the sender's open dashboard tab) is around.

## 5. Email with Resend

1. Verify a sender domain at resend.com/domains.
2. Set `RESEND_API_KEY` and `EMAIL_FROM=Panda <panda@yourdomain.com>`.

Delivery emails are transactional, one per card, to the address the sender
provides. There is no list, so there is nothing to unsubscribe from. The
outbox table keeps a record of every send (real or demo) and the dashboard
shows it to the card's owner.

## 6. Stripe for the $4.99 card

1. Set `STRIPE_SECRET_KEY` (sk_live_... or sk_test_...). The product is
   created inline by the checkout session, so Stripe's catalog needs
   nothing.
2. Add a webhook endpoint in Stripe pointing to
   `https://your-domain/api/stripe/webhook`, subscribed to
   `checkout.session.completed`, and copy the signing secret into
   `STRIPE_WEBHOOK_SECRET`. Signatures are checked with a 10 minute
   freshness window, so replays do not work.
3. Cancelling a scheduled card calls the Stripe refund API automatically,
   full amount.

Without Stripe keys, checkout runs as a premium simulated flow (the whole
pipeline, no charge). The test card in Stripe test mode is
`4242 4242 4242 4242`.

## 7. Environment reference

| Variable | Required | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | recommended | absolute URL for emails, card links, sitemap |
| `PANDA_STORAGE_MODE` | local only | set to `d1` only when testing the local simulated D1 binding |
| `CLOUDFLARE_ACCOUNT_ID` | tooling only | deploy and provisioning account |
| `CLOUDFLARE_API_TOKEN` | tooling only | deploy and provisioning credential, never a Worker or Pages secret |
| `D1_DATABASE_ID` | tooling only | operational reference; the runtime binding comes from `wrangler.toml` |
| `SQLITE_PATH` | optional | local SQLite file location (default `db/panda.db`) |
| `STRIPE_SECRET_KEY` | optional | live payments |
| `STRIPE_WEBHOOK_SECRET` | optional | webhook signature verification |
| `RESEND_API_KEY` | optional | real email |
| `EMAIL_FROM` | optional | sender address |
| `CRON_SECRET` | optional | protects the cron endpoint |

## 8. Operations notes

- **Backups**: D1 supports Time Travel (`wrangler d1 export`). Local
  SQLite: copy `db/panda.db` (plus its `-wal` file while the server runs).
- **Photos** are compressed in the browser, stored in private R2 (max 5,
  260KB each), and represented in D1 only by opaque object keys. The bucket
  has no public URL and objects are served through the authorization-checked
  card route with `private, no-store` response headers.
- **The outbox** keeps every email as a record. Drop rows older than 90
  days if you like; nothing links back to them.
- **Sessions** expire after 30 days. Password claims after 48 hours.
- **Rate limits** live in the `rate_limits` table (DB-backed, so they hold
  across isolates). Defaults: 10 sign-ins per IP per 10 minutes, 5 sign-ups
  per hour, 20 cards per hour, 20 checkouts per hour, 60 reactions per 10
  minutes, 10 replies per 10 minutes. They are constants in
  `src/app/api/*` if you want to tune them.
- **Payment idempotency**: a card flips to paid exactly once. Stripe
  webhook retries, double submits and racing requests collapse into the
  first winner. Deliveries claim `scheduled -> sent` atomically before the
  email goes out, so two overlapping cron runs cannot double-send.
- **Token storage**: session, password-claim and edit tokens are stored as
  SHA-256 hashes. A database leak is not a leak of logins.
- **Owner notifications**: first open, every reply, and delivery failures
  email the card's owner automatically.

## 9. Repo hygiene

- `bun.lock` (bun) and `package-lock.json` (npm) are both committed; use
  whichever installer you like.
- `.env` is gitignored. `.env.example` is the template and the source of
  truth for every variable.
- The database schema lives in `src/lib/db/ddl.ts` (physical DDL) and
  `src/lib/db/schema.ts` (drizzle definitions), and they must stay in
  sync. `npm run db:status` is a quick way to see the physical result.
