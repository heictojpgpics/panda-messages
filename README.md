# Panda Messages 🐼

A personal card, made in a minute, delivered like a gift on the morning you pick.

Panda Messages is a production-grade alternative to kitty-card services: you pick an occasion,
write your words (or let Panda write them), attach a song and photos, choose from 11 themes, and
either share the link yourself for free or have Panda deliver it to their inbox for $4.99, once,
on the day you choose. The recipient opens an envelope, the card rises out, and the sender
watches the whole thing happen live.

## What is in the box

**For the visitor**
- A premium landing page with the panda mascot from [`page-mascot`](https://koboyo.com/page-mascot)
  following the reader's cursor, blinking when poked
- A message ideas library (SEO-ready, hand-written), a tone-based message writer, and a
  waitlist page for Panda Remembers

**For the sender**
- A 4-step card wizard: occasion → names → words/wrapping → delivery, with a live preview,
  message seeds in Panda's voice, YouTube song attach, up to 5 photos (compressed client-side),
  and 11 themes
- Free path: watermark card, self-share link, needs a free account
- Paid path ($4.99): no watermark, all themes, song, photos, scheduled email delivery,
  edit/cancel before send with full refund
- A dashboard with live watching: delivery, open, reaction and reply events stream in over SSE

**For the recipient**
- The card page: a sealed envelope with their name, a wax seal that cracks, the card rising out,
  theme-colored ambient particles, their song, the photos, reactions with a burst animation,
  and a reply box (or a card back, with the reply flow pre-filled)

**Under the hood**
- One codebase, two runtimes of storage: local SQLite (better-sqlite3, zero config) and
  Cloudflare D1 over REST (set 3 env vars). Same schema, same queries, no code path changes
- Session auth with PBKDF2 (Web Crypto), works on Node and Workers
- Payments: a premium simulated checkout by default, real Stripe Checkout + webhook when keys
  are set
- Email: a demo outbox by default (viewable in the dashboard, exactly as it would arrive),
  Resend when a key is set
- Delivery engine: idempotent, runs from page loads opportunistically and from
  `/api/cron/deliveries` for real schedulers

## Quick start

```bash
npm install          # or bun install
npm run dev          # http://localhost:3000
```

Everything works immediately: make cards, sign up, pay through the simulated checkout,
watch opens live, read the outbox. No configuration required.

## Going real

Copy `.env.example` to `.env` and fill in what you have. Each provider switches on
independently, with no code changes:

| Capability | Default (mock) | Set these to go real |
| --- | --- | --- |
| Storage | local SQLite file | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `D1_DATABASE_ID` |
| Payments | simulated checkout | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Email | demo outbox | `RESEND_API_KEY`, `EMAIL_FROM` |
| Scheduled delivery | opportunistic tick | a cron hit on `/api/cron/deliveries` (+ `CRON_SECRET`) |

See [DEPLOY.md](./DEPLOY.md) for the full Cloudflare walkthrough (D1 schema init,
Cron Trigger, webhook setup) and other hosting notes.

## The stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4** + shadcn/ui, with a custom forest/jade/gold brand system
- **Fraunces** (display serif) + **Inter** (UI)
- **Framer Motion** for the envelope, card and micro-interactions
- **Drizzle ORM** over better-sqlite3 / D1 HTTP
- **page-mascot** for the cursor-following panda
- SSE (Server-Sent Events) for live watching, no WebSocket server needed

## Project layout

```
src/
  app/
    page.tsx                 landing page
    create/                  the 4-step wizard
    c/[slug]/                the card experience (recipient view)
    checkout/[cardId]/       simulated checkout + success moment
    checkout/success/        Stripe redirect target
    dashboard/               sender control center (live watch, outbox)
    sign-in/ sign-up/ set-password/
    messages/                message ideas library (SEO)
    tools/message-writer/    the tone-based writer
    remember/                Panda Remembers waitlist
    about/ terms/ privacy/ refund-policy/ feedback/
    api/                     auth, cards, checkout, stripe webhook, cron, SSE
  components/
    brand/                   logo, panda faces, envelope, card, phone mock
    landing/                 every landing section
    create/ card/ auth/ marketing/
  data/                      occasions, themes, message seeds, library, writer
  lib/
    db/                      drizzle schema + dual drivers (sqlite / D1)
    auth.ts email.ts payments.ts delivery.ts cards.ts photo.ts
public/
  mascots/                   panda sprite sheets for page-mascot
  panda/                     extracted panda portraits (cards, UI)
```

## Scripts

```bash
npm run dev         # develop
npm run lint        # eslint
npm run db:init     # create tables on remote D1 (needs D1 env vars)
```

## Pricing philosophy

Free to make, always. $4.99 once for the full card: no watermark, all themes, song, photos,
scheduled delivery, live watching, replayable forever. Panda Remembers (birthday reminders)
will be $19 a year. Cancel before send = automatic full refund. No subscriptions, no dark
patterns.
