# Deploying Panda Messages

The app is designed to run anywhere Next.js runs, with an optional Cloudflare
path for storage (D1), scheduling (Cron) and email. Pick the pieces you want.
Nothing below requires code changes.

## 1. Any Node host (Vercel, Railway, Fly, your own box)

```bash
npm install
npm run build
npm run start
```

Environment variables: see `.env.example`. Unset D1 vars mean storage falls
back to a local SQLite file, which is fine for single-instance hosts.

## 2. Cloudflare (recommended target)

### 2.1 Next.js on Workers

The simplest Cloudflare deployment for this app is
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare):

```bash
npm install -D @opennextjs/cloudflare wrangler
npx opennextjs-cloudflare build
npx wrangler deploy
```

Add to `wrangler.toml` (scheduling, see 2.3):

```toml
[triggers]
crons = ["* * * * *"]
```

### 2.2 D1 database

```bash
npx wrangler d1 create panda-messages
```

Copy the database id into `D1_DATABASE_ID`. Create an API token in the
Cloudflare dashboard (Account → API Tokens → "Edit Cloudflare Workers") with
D1 edit permission, and set `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN`.

Create the tables (run once, locally, with those three env vars set):

```bash
npm run db:init
```

That runs `scripts/init-d1.mjs`, which applies `src/lib/db/ddl.ts` to the
remote database over the REST API.

> Note: when the app runs *inside* a Worker with a real D1 binding, the REST
> driver here still works (it is plain HTTPS). Swapping in the native binding
> later is a small, isolated change in `src/lib/db/index.ts`.

### 2.3 Cron Trigger for deliveries

Scheduled cards go out on the minute they are due. The engine is idempotent,
so any scheduler may ping it:

```
GET /api/cron/deliveries
Authorization: Bearer $CRON_SECRET
```

With `@opennextjs/cloudflare`, the `fetch` handler in the worker receives
`scheduled` events; route them to the same URL (a fetch to the public URL
with the header works). Alternatively use any external cron service
(cron-job.org, GitHub Actions, Upstash QStash) against the endpoint above.

In the default Node/dev setup, every page load nudges the engine too, so
demo cards deliver without any scheduler at all.

### 2.4 Email with Resend

1. Create a sender domain in Resend and verify it.
2. Set `RESEND_API_KEY` and `EMAIL_FROM=Panda <panda@yourdomain.com>`.

Delivery emails are transactional, one per card, to the address the sender
provides. There is no list, so there is nothing to unsubscribe from.

### 2.5 Stripe for the $4.99 card

1. Product is created inline by the checkout session (price_data), so there
   is nothing to configure in Stripe's catalog.
2. Set `STRIPE_SECRET_KEY` (sk_live_... or sk_test_...).
3. Add a webhook endpoint in Stripe pointing to
   `https://your-domain/api/stripe/webhook`, subscribed to
   `checkout.session.completed`, and copy the signing secret into
   `STRIPE_WEBHOOK_SECRET`.

Refunds: cancelling a scheduled card calls the Stripe refund API
automatically, full amount.

## 3. Environment reference

| Variable | Required | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | recommended | absolute URL used in emails, card links, sitemap |
| `CLOUDFLARE_ACCOUNT_ID` | optional | D1 REST access |
| `CLOUDFLARE_API_TOKEN` | optional | D1 REST access |
| `D1_DATABASE_ID` | optional | D1 database |
| `STRIPE_SECRET_KEY` | optional | live payments |
| `STRIPE_WEBHOOK_SECRET` | optional | webhook signature verification |
| `RESEND_API_KEY` | optional | real email |
| `EMAIL_FROM` | optional | sender address |
| `CRON_SECRET` | optional | protects the cron endpoint |

## 4. Operations notes

- **Backups**: D1 supports point-in-time restore and Time Travel exports
  (`wrangler d1 export`). Local SQLite: copy `db/panda.db`.
- **Photos** live inside the card row as compressed data URLs (max 5, each
  ~180KB client-side). For very high volume, moving to R2 with signed URLs is
  a contained change in `src/lib/photo.ts` + `cards` table.
- **The outbox** keeps every email (demo or real) as a record, visible to the
  sender in the dashboard. Drop `outbox` rows older than 90 days if you like;
  nothing links back to them.
- **Sessions** expire after 30 days. Password claims after 48 hours.

## 5. How the guardrails behave

- **Rate limits** live in the `rate_limits` table (DB-backed, so they hold
  across isolates). Defaults: 10 sign-in attempts per IP per 10 minutes,
  5 sign-ups per hour, 20 cards per hour, 10 checkouts per hour, 60
  reactions per 10 minutes, 10 replies per 10 minutes. They are code-level
  constants in `src/app/api/*` if you ever want to tune them.
- **Payment idempotency**: a card flips to paid exactly once. Stripe
  webhook retries, double submits and racing requests all collapse into
  the first winner. Deliveries claim `scheduled -> sent` atomically before
  the email goes out, so two overlapping cron runs cannot double-send.
- **Token storage**: session, password-claim and edit tokens are stored
  as SHA-256 hashes. A database leak is not a leak of logins.
- **Owner notifications**: first open, every reply, and delivery failures
  email the card's owner automatically (mock outbox by default, Resend
  when configured).
- **Column migrations**: additive schema changes live in
  `COLUMN_MIGRATIONS` inside `src/lib/db/ddl.ts`. The local driver and
  `npm run db:init` both apply them guarded, so re-running is always safe.
