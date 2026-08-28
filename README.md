# Tradely

Tradely is the independent options-learning hub for `tradely.ai`. It teaches an ordered evidence workflow and sends learners into TradingFlow for official, bounded practice tasks. Tradely and TradingFlow do not share accounts, billing, databases, or infrastructure.

## Stack

- TanStack Start, React, TypeScript, and TanStack Router
- Clerk for Tradely identity
- Stripe Checkout and Customer Portal for Tradely membership
- Neon Postgres with Drizzle
- shadcn/ui Base Luma primitives and Tailwind CSS
- Cloudflare R2 (S3-compatible) storage for paid course media
- Typed English / Simplified Chinese interface copy with a persisted language preference
- Consent-aware PostHog product analytics, web vitals, and browser error tracking

The database intentionally contains only two tables: `app_user` and `lesson_progress`. Curriculum structure, lesson ordering, prerequisites, and content versions live in source control.

## Local setup

This repo expects Node 24+ and pnpm 11+.

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
pnpm media:import /absolute/path/to/tradingflow-web-landingpage
pnpm dev:web
```

Open [http://localhost:3001](http://localhost:3001).

`media:import` copies the three free lesson videos and course overview into the public development directory. Paid lesson videos and caption tracks go into ignored `apps/web/private-media/` storage and are served only through short-lived, user-bound URLs. Posters remain public. The import uses the full 7–8 minute TradingFlow Academy masters, not the 15-second chapter cards.

## Service configuration

Copy [apps/web/.env.example](apps/web/.env.example) and configure a dedicated Tradely Clerk app, Stripe account, and Neon database. Do not reuse TradingFlow credentials or customer identifiers.

For production media, configure `MEDIA_S3_*` for the shared Tradely Cloudflare R2 private bucket. Paid objects use these keys:

```text
tradingflow-foundations/03-symbol-drawer.mp4
tradingflow-foundations/captions/03-symbol-drawer.vtt
```

The server issues 30-minute presigned object URLs only after Clerk identity and the configured Stripe Price have been verified. `MEDIA_SIGNING_SECRET` plus local private media is a development or long-running Node-host fallback; it is not needed when S3 storage is configured.

## Database

Generate and apply versioned migrations rather than using schema push in production.

```bash
pnpm db:generate
pnpm db:migrate
```

The initial migration is [packages/db/src/migrations/0000_salty_randall.sql](packages/db/src/migrations/0000_salty_randall.sql).

## Verification

```bash
pnpm check-types
pnpm --filter web test
pnpm exec biome check .
pnpm build
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the access, billing, progress, and media contracts.
See [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md) for the consent, identity, event, error, and web-vitals analytics contract.

## Trust and accessibility surface

The shared shell includes a keyboard-visible skip link, semantic landmarks, a native language selector, reduced-motion support, and a footer linking to the Privacy Policy, Terms of Service, Options Risk Disclosure, and Cookie Policy. Course metadata and all shell controls support English and Simplified Chinese; lesson bodies currently remain English with an explicit language note until a reviewed translation is available.
