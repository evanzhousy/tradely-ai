# Tradely

Tradely is the independent options-learning hub for `tradely.ai`. It teaches an ordered evidence workflow and sends learners into TradingFlow for official, bounded practice tasks. Tradely and TradingFlow do not share accounts, billing, databases, or infrastructure.

## Stack

- TanStack Start, React, TypeScript, and TanStack Router
- Clerk for Tradely identity
- Stripe Checkout and Customer Portal for Tradely membership plus a one-time Lifetime Course Pass
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
pnpm media:import
pnpm dev:web
```

Open [http://localhost:8250](http://localhost:8250).

`media:import` copies the three free lesson videos into the public development directory. Paid lesson videos and caption tracks go into ignored `apps/web/private-media/` storage and are served only through short-lived, user-bound URLs. Posters remain public. The import reads the Tradely-owned `videos/tradingflow-academy/` source tree and uses the full 7–8 minute Academy masters, not the 15-second Landing chapter cards.

Media ownership and source/access invariants are checked with `pnpm media:assert`. Use `pnpm media:assert:local` after `pnpm media:import` to require every local Academy/caption source before a media operation. Use `pnpm media:verify` for a read-only checksum/size check against the configured Tradely R2 bucket. `pnpm media:upload` is the explicit mutating command; it uploads only the private assets listed in `scripts/media-manifest.json` and verifies every object after upload.

For the Git/R2/ChatCut boundary, generated-artifact policy, release sequence,
and rollback rules, see [the ops engineer media practice](ops/human/ops-engineer-instruction.md).

## Service configuration

Copy [apps/web/.env.example](apps/web/.env.example) and configure a dedicated Tradely Clerk app, the approved Stripe account ID, and Neon database. Tradely currently reuses Stripe account `acct_1LZx3GFrxuhJplqI` by product decision, but keeps its own Products, Prices, and customer-to-Clerk mappings. Configure separate `STRIPE_MEMBERSHIP_PRICE_ID` and `STRIPE_COURSE_PASS_PRICE_ID` values. Setting `LIFETIME_CHECKOUT_ENABLED=false` stops new Course Pass purchases without revoking existing grants.

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
See [docs/BILLING.md](docs/BILLING.md) for membership, Lifetime Course Pass, fulfillment, restore, refund, and rollout operations.

Billing operators can run `pnpm billing:preflight` for read-only Stripe/config
verification and `pnpm billing:revoke-course-pass` for the dry-run-first manual
refund/dispute revocation path.

## Trust and accessibility surface

The shared shell includes a keyboard-visible skip link, semantic landmarks, a native language selector, reduced-motion support, and a footer linking to the Privacy Policy, Terms of Service, Options Risk Disclosure, and Cookie Policy. Course metadata and all shell controls support English and Simplified Chinese; lesson bodies currently remain English with an explicit language note until a reviewed translation is available.
