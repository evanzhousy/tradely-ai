# Tradely architecture

## Product boundary

Tradely owns its identity, billing, database, media, and customer relationship. TradingFlow is an external partnered practice tool. Outbound links contain only course-level UTM attribution—never Clerk IDs, Stripe IDs, progress, or other personal data.

## Persistent model

Only two PostgreSQL tables are persisted:

- `app_user`: Clerk user ID, optional Stripe Customer ID, a verified/revocable
  Lifetime Course Pass grant with its unique Stripe Checkout Session, and narrow
  manual access overrides.
- `lesson_progress`: user plus lesson ID, authoritative content version, last video position, and completion timestamps.

Course and lesson metadata live in `apps/web/src/content/course.ts`. Lesson bodies remain in a server-only module. There are no subscription, entitlement, enrollment, prerequisite, quiz, or processed-webhook tables.

## Access contract

1. Clerk establishes the current Tradely user.
2. `app_user.stripe_customer_id` identifies that user in the configured Tradely billing account. The current product decision reuses Stripe account `acct_1LZx3GFrxuhJplqI` while retaining Tradely-specific Products, Prices, and Clerk mappings.
3. A verified, non-revoked Course Pass or non-expired manual grant short-circuits
   subscription lookup for lesson access.
4. Otherwise, the server calls Stripe at access time. Subscription access is
   active only when an `active` or `trialing` Subscription contains the exact
   configured `STRIPE_MEMBERSHIP_PRICE_ID`.
5. One-time access is granted only after the server verifies a completed, paid
   Checkout Session for the signed-in Clerk user, matching Stripe Customer,
   exact `STRIPE_COURSE_PASS_PRICE_ID`, and exact entitlement metadata.
6. Billing lookup failure is represented as unavailable, not as unpaid.
7. Paid lesson bodies and media URLs are returned only after that server decision.

Stripe remains payment, subscription, refund, and dispute truth. The verified
`app_user` Course Pass grant is the low-latency entitlement record. Checkout
Customer creation and Checkout Session creation use stable idempotency keys; an
already-active member cannot create another membership subscription, and an
active Course Pass owner cannot create another Course Pass checkout through
Tradely.

## Media contract

Free preview media may use `MEDIA_PUBLIC_BASE_URL`. Paid media must never be placed under `apps/web/public`.

The preferred production path is the shared Tradely Cloudflare R2 private bucket (R2's S3-compatible API). Test and production intentionally use the same bucket and credentials, while all credentials remain server-only. After access succeeds, the server returns 30-minute presigned URLs for the exact video and caption objects. The local Node-host fallback returns a signed Tradely endpoint; each request verifies both the HMAC token and the current Clerk user, and video responses support byte ranges.

Posters are public because they reveal no paid lesson body. Caption tracks follow the same protection as their video.

The operational Git and artifact boundary is documented in
[`ops/human/ops-engineer-instruction.md`](../ops/human/ops-engineer-instruction.md): final media is delivered through R2, while source and metadata remain reviewable in Git.

## Progress contract

The client submits only the lesson ID, playback position, and completion intent. The server resolves the lesson, its content version, and its current access rule from source control. A signed-in user cannot write progress for a paid lesson without current access.

Resume positions are restored only when the stored content version matches the current lesson version. This prevents an old timestamp from dropping a learner into the wrong place after a lesson is replaced.

## Failure behavior

- No Clerk configuration: public previews work; identity-dependent actions remain unavailable.
- No database: previews work; account progress reports unavailable without fabricating state.
- Stripe lookup failure: paid access is not revoked or described as unpaid; the UI asks the learner to retry.
- Protected media failure: the authorized written lesson remains available and the UI reports that video could not be issued.
