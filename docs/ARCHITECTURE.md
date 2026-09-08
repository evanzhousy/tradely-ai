# Tradely architecture

## Product boundary

Tradely owns its identity, billing, database, media, and customer relationship. The course teaches platform-agnostic market concepts. TradingFlow is an external partnered practice tool and a source for the concept coverage checklist. Outbound links contain only course-level UTM attribution—never Clerk IDs, Stripe IDs, progress, or other personal data.

## Persistent model

The source schema defines three PostgreSQL tables. The interactive-practice table requires migration `0002_learning_attempts` before deploying its server functions.

- `app_user`: Clerk user ID, optional Stripe Customer ID, a verified/revocable
  Lifetime Course Pass grant with its unique Stripe Checkout Session, and narrow
  manual access overrides.
- `lesson_progress`: user plus lesson ID, authoritative content version, last video position, and completion timestamps.
- `lesson_attempt`: a user-owned, versioned scenario attempt with structured answers, inspected evidence, hint use, revision, and an immutable submitted assessment. A partial unique index permits one active attempt per user and lesson.

The eight-module, 36-lesson syllabus lives in `apps/web/src/content/syllabus.ts`; `course.ts` adds access, existing IDs and media metadata. Bilingual explanations, worked examples, synthetic cases and answer keys live in server-only `content/units/*.server.ts` modules. JSONB attempt state accepts choice IDs, numerical strings, written responses and optional snapshots of preceding learner work. Versioning uses only the existing `content_version` and `scenario_version` fields. There are no subscription, entitlement, enrollment, prerequisite, quiz, or processed-webhook tables.

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

The current course edition sets `mediaCurrent: false`: earlier videos are withheld while the updated interactive lessons and notes are the primary instruction. Three corrected English silent companions are rendered and checked locally under `videos/course-v2-companions/`; their proposed private keys have not been uploaded or activated. Only the isolated local review entry can import those generated files.

Posters are public because they reveal no paid lesson body. Caption tracks follow the same protection as their video.

The operational Git and artifact boundary is documented in
[`ops/human/ops-engineer-instruction.md`](../ops/human/ops-engineer-instruction.md): final media is delivered through R2, while source and metadata remain reviewable in Git.

## Progress contract

The client submits only the lesson ID, playback position, and completion intent. The server resolves the lesson, its content version, and its current access rule from source control. A signed-in user cannot write progress for a paid lesson without current access.

Resume positions are restored only when the stored content version matches the current lesson version. This prevents an old timestamp from dropping a learner into the wrong place after a lesson is replaced.

## Interactive practice contract

`content/learning-rollout.ts` derives public introductions and capabilities from the syllabus. All 36 lessons use a worked explanation, a guided case and an independent case. Two practice variants are available; a third evaluation variant is reserved for offline review and is absent from the runtime registry. Case content and answer keys remain server-only; the client receives the current stage and approved evidence. The lesson loader applies the existing access decision before returning protected lesson content. Opening or changing a saved attempt rechecks identity, paid access and attempt ownership.

The four execution foundations share a 2D order/quote/print demonstration. Its editable buy/sell order, order quantity and, in the sentiment lesson, option type expose the relevant relationships. One fill has two counterparties but adds volume only once. Partial fills and cancellations retain their different effects on resting quantity and executed volume. The demonstration belongs to the explanation stage; independent cases present different evidence.

Numeric responses have explicit units and server-side parsing, tolerance and completeness checks. Text responses are bounded and saved for self or human review; they never receive automatic mastery credit. Unsaved drafts block submission. Submitted work can be downloaded as Markdown with the source worksheet and missing observations. The recap can snapshot the same user's latest submitted research packet, and the audit can snapshot their recap. The receiving case matches that source variant, access is rechecked, and subsequent edits or retries cannot rewrite the copied snapshot.

The contract explorer shares selection and view filters across an accessible 2D map and a lazy-loaded Three.js view. Its immutable snapshot ID is part of the component key; saving an answer does not change the graph's snapshot or reset the camera. The renderer owns graphics resources only. It neither grades answers nor changes the declared comparison boundary, and WebGL failure preserves the selection in 2D.

Contract replay version 2 uses one monotonic clock for the numeric map and animated column heights. Synthetic checkpoint volumes are temporally interpolated while prior-session and missing observations retain their original state. The close is the unchanged assessment snapshot. Playback is local presentation state, pauses when hidden or offscreen, and produces no attempt writes or per-frame analytics. Reduced motion disables autoplay and opts manual playback into discrete checkpoints.

The clock, rate options, and transport controls are shared with the 2D session-flow comparison. Its sampler changes only cumulative volume; OI and model values retain their supplied report dates. Report-to-report OI changes require present values, identical scopes, and increasing dates. Synthetic snapshots with missing model values or mismatched OI scopes stay explicitly unavailable. The fastest available playback rate, 2×, is the default in each replay. Optional Three.js is used for the contract neighborhood and signed GEX distribution. The GEX view retains a common scale, explicit missing values and the same snapshot/slice selection as its table.

Every decision is saved before the next action is enabled. Updates compare the expected revision and deduplicate the command ID; a lost response can be retried without applying the decision twice. Concurrent-tab conflicts require loading the current attempt. Submitted attempts are immutable, and their assessments are stored independently of subsequent rubric edits. A retry uses the alternate independent case unless it continues a fixed source-work snapshot. Retired scenario versions require an explicit restart and retain the prior record; cached-tab mutations to earlier active versions are rejected. Submitted earlier cases can still be viewed with their stored assessment and an archive label.

Practice completion is separate from `lesson_progress`. The independent case earns `demonstrated` only when every required criterion is automatically checkable and met without an independent-case hint. Cases containing unreviewed prose and other completed attempts are `practiced`. The result separates automatically checked criteria from pending written review. A course completion timestamp does not establish this result. The three existing free lessons retain anonymous practice without persistence. New lessons use the existing paid course access rule. Signed-in account persistence uses the same three-table schema.

The exercise clears its client state when Clerk identity changes and ignores responses belonging to an unmounted account. Raw answers, evidence, and learner content are excluded from analytics and exception logging. See [the current implementation verification](reviews/course-update-verification-2026-09-08.md) for coverage, validation and remaining release gates. The [pilot implementation notes](interactive-course-pilot.md) remain historical evidence.

## Failure behavior

- No Clerk configuration: public previews work; identity-dependent actions remain unavailable.
- No database: previews work; account progress reports unavailable without fabricating state.
- Stripe lookup failure: paid access is not revoked or described as unpaid; the UI asks the learner to retry.
- Protected media failure: the authorized written lesson remains available and the UI reports that video could not be issued.
