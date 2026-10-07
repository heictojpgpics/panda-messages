# Deploying Panda Messages

The app runs anywhere Next.js runs. Every external piece (storage, payments,
email, scheduling) is optional and switches on with environment variables
only: no code changes, no flags. Copy `.env.example` to `.env` and fill in
what you have.

Two deployment shapes, both production grade:

1. **A Node host running the standalone build** (Vercel, Railway, Fly,
   Render, your own box). Fully verified path. Storage: Cloudflare D1 over
   REST, or a local SQLite file for single-instance hosts.
2. **Cloudflare Workers** via `@opennextjs/cloudflare`. The full app on the
   edge, `wrangler.toml` is already in the repo.

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

The same queries run against a remote D1 database when three variables are
set. Nothing else changes.

```bash
npx wrangler d1 create panda-messages
```

- Create an API token in the Cloudflare dashboard (My Profile > API Tokens)
  with **D1 edit** permission.
- Set:

```
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
D1_DATABASE_ID=...
```

- Create the tables (idempotent, safe to re-run):

```bash
npm run db:init
```

- Verify:

```bash
npm run db:status
# Storage: Cloudflare D1 (...)
#   users 0 rows, cards 0 rows, ... Remote D1 is ready.
```

`db:init` applies the DDL from `src/lib/db/ddl.ts` over the REST API, the
same statements the local driver applies on boot, so both storages always
have the identical shape. Additive column changes live in
`COLUMN_MIGRATIONS` at the bottom of that file; both `db:init` and the
local driver apply them guarded, so old databases are repaired without
touching fresh ones.

## 3. Node host deployment (verified path)

```bash
npm install
npm run build
npm run start          # node .next/standalone/server.js
```

- Set `NEXT_PUBLIC_SITE_URL` to the public URL (card links, emails,
  redirects, sitemap all derive from it).
- Set the three D1 variables (recommended) or `SQLITE_PATH` for a file.
- Set `PORT` if not 80/443 behind a proxy. The standalone server respects
  `HOSTNAME` and `PORT`.

This is the exact path used for the production build check: `npm run build`
outputs `.next/standalone`, and `npm run start` boots it with plain `node`.

## 4. Cloudflare Workers

The repo ships `wrangler.toml` wired for
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare):

```bash
npm install -D @opennextjs/cloudflare wrangler
npx opennextjs-cloudflare build
npx wrangler deploy
```

Secrets never go in the committed file:

```bash
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
npx wrangler secret put CLOUDFLARE_API_TOKEN
npx wrangler secret put D1_DATABASE_ID
npx wrangler secret put STRIPE_SECRET_KEY        # when live
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put CRON_SECRET
```

Notes on Workers:

- The app talks to D1 over the REST API, so it needs the account id, token
  and database id as secrets even inside Cloudflare. (A native D1 binding
  swap later is a contained change in `src/lib/db/d1.ts` only.)
- The local SQLite driver is imported lazily inside `src/lib/db/sqlite.ts`
  and never loads in D1 mode, so the Node-only dependencies stay out of the
  Workers runtime path.
- `wrangler.toml` already has a `nodejs_compat` flag, static assets binding
  and a Cron Trigger (see below).

### Cron Trigger for deliveries

Scheduled cards go out on the minute they are due. The engine is
idempotent, so any scheduler may ping it:

```
GET /api/cron/deliveries
Authorization: Bearer $CRON_SECRET
```

- **Cloudflare Cron Triggers**: `wrangler.toml` contains
  `[triggers] crons = ["* * * * *"]`. Route the `scheduled` event to the
  endpoint above (a fetch to your public URL with the header), or remove
  that block and use an external scheduler.
- **External cron** (cron-job.org, GitHub Actions, Upstash QStash): hit the
  endpoint above every minute (or every five; the engine catches up).
- **No scheduler at all**: every page load nudges the engine
  opportunistically, so low-traffic deployments still deliver on time when
  anyone (including the sender's open dashboard tab) is around.

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
| `CLOUDFLARE_ACCOUNT_ID` | optional | D1 REST access (all three switch storage to D1) |
| `CLOUDFLARE_API_TOKEN` | optional | D1 REST access |
| `D1_DATABASE_ID` | optional | D1 database |
| `SQLITE_PATH` | optional | local SQLite file location (default `db/panda.db`) |
| `STRIPE_SECRET_KEY` | optional | live payments |
| `STRIPE_WEBHOOK_SECRET` | optional | webhook signature verification |
| `RESEND_API_KEY` | optional | real email |
| `EMAIL_FROM` | optional | sender address |
| `CRON_SECRET` | optional | protects the cron endpoint |

## 8. Operations notes

- **Backups**: D1 supports Time Travel (`wrangler d1 export`). Local
  SQLite: copy `db/panda.db` (plus its `-wal` file while the server runs).
- **Photos** live inside the card row as compressed data URLs (max 5, each
  under ~200KB client-side). For very high volume, moving to R2 with signed
  URLs is a contained change in `src/lib/photo.ts` + the `cards` table.
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
