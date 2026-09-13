# Free learning code change plan

Date: September 13, 2026

Status: proposed implementation; no product or production change made

Source baseline: `02d84fa69be527c7cbf9f0c777c15f024f477c71`

## Decision and intended outcome

Make the complete current Tradely curriculum free. Tradely should help people learn options research and apply it in TradingFlow; TradingFlow retains its own accounts, paid tools, data, and billing.

**Design statement:** the course catalog owns public learning availability, authentication owns saved learner work, the coaching service owns bounded AI admission, and the billing service owns historical purchase support only.

This changes the business role of Tradely. It does not establish that the existing paid offer has failed. Revenue, active subscriptions, deployment configuration, media availability, and downstream TradingFlow conversion have not been verified for this plan.

The September 10 policy in `docs/free-course-strategy.md` remains a description of the current implementation until the replacement ships. Update that document with the implementation; do not announce free access from this planning commit.

## Product contract

| Capability | Target behavior |
| --- | --- |
| All 36 current lessons across eight modules | Read and use interactive explanations without payment or an account |
| Guided and independent exercises | Available anonymously, with server-computed feedback; guest work resets on reload |
| Saved attempts, progress, revisions, and downloads of saved work | Free Tradely account; existing ownership and version rules apply |
| Research packet → recap → audit | Guests use the supplied cases; signed-in learners can reuse their own saved work |
| Course videos and captions | Free wherever an approved, current asset is enabled; withheld/outdated videos remain withheld |
| AI coaching | Optional, signed-in, limited service; keep the existing pilot audience until its release gates pass |
| TradingFlow practice | Optional external step with clear account/subscription requirements; never required to complete a Tradely exercise |
| New Tradely payments | Neither membership nor Course Pass checkout can create a charge |
| Previous purchases | Accessible billing/support path and retained purchase records; payment status no longer changes learning access |

Preserve educational claims, deterministic grading, separate `practiced` and `demonstrated` results, answer-key protection, accessibility, English/Chinese UI parity, and analytics consent. Free access does not make private learner work public or promise unlimited AI.

## Current coupling that must change

| Area | Current source and behavior | Consequence |
| --- | --- | --- |
| Course model | `apps/web/src/content/course.ts` derives `preview`/`paid` from seven free lesson IDs | Flipping the IDs alone leaves payment terminology and unrelated behavior coupled |
| Access | `apps/web/src/server/access.server.ts` reads user grants and Stripe subscriptions and emits `canAccessPaid` | Signed-in learning can depend on billing availability |
| Exercises | `apps/web/src/server/preview-learning.server.ts` and `apps/web/src/features/learning/learning-exercise.tsx` allow guest practice only for previews | Opening lesson text alone would leave many exercises inaccessible |
| Saved work | `apps/web/src/server/learning-access.server.ts` and `apps/web/src/server/progress.server.ts` recheck course payment access | Saved learning must move to identity/ownership checks |
| Media | `apps/web/src/server/media.server.ts` uses preview/paid status to choose public URLs versus signed storage | Relabeling everything as preview would produce incorrect media URLs |
| Media tooling | `scripts/assert-media-boundary.mjs` looks for paid lesson declarations; the manifest records private assets | Storage assertions must survive the removal of payment labels |
| Pricing | `apps/web/src/domain/billing.ts` defines $49 one-time and $69/month; membership checkout has no global retirement gate | Hiding pricing or disabling only the lifetime flag cannot stop purchases |
| AI | `apps/web/src/server/coaching.server.ts` uses `canAccessPaid ? 3 : 1`; configuration defaults to an allowlisted, disabled pilot | Making every learner look paid would silently increase quotas |
| Discovery | `apps/web/src/seo/pages.ts` indexes only preview lessons | Former paid lessons need public SSR content, indexing, and sitemap changes |

All current syllabus entries set `mediaCurrent: false`. This release must not activate historical Academy videos or locally rendered companions simply because lessons become free.

## Architecture choices

1. Remove the commercial `LessonAccess` distinction from the active course model. Keep named beginner/research learning paths as navigation recommendations, independent of access. Do not add a permanent `FREE_MODE` switch or mark everyone as subscribed.
2. Separate public content reads from optional account state. Known published lessons and guest exercises must work with Stripe absent and with auth/database services unavailable. Show an explicit saved-progress error for affected accounts without hiding lessons or silently overwriting work.
3. Keep the current exercise engine and server-only scenario registry. Generalize the guest transport to every published lesson; rename preview concepts to guest practice where they describe persistence. Do not duplicate the scoring engine or deliver complete scenario objects to the browser.
4. Keep Stripe compatibility in the existing billing module and `/pricing` route during retirement. No new billing platform, zero-dollar subscription, entitlement service, or cross-product account merger.
5. Give media an explicit delivery field independent of learning price, such as `mediaDelivery: "public" | "signed"`, alongside the existing current/withheld status. Keep owned R2 objects private in storage; free public access can use a short-lived URL to an approved object.
6. Give coaching one account allowance independent of historical purchases. Reuse the existing database-atomic admission command, generation records, and provider boundary.

## Implementation sequence

The steps below are separate reviewable commits, but the application changes should reach production together after end-to-end validation. A partial deployment must not advertise free lessons while leaving exercise or media paywalls in place.

### 1. Retire new sales and preserve historical billing

Owners:

- `apps/web/src/server/billing.ts`
- `apps/web/src/server/billing.server.ts`
- `apps/web/src/domain/billing.ts`
- `apps/web/src/domain/pricing-search.ts`
- `apps/web/src/routes/pricing.tsx`
- `apps/web/src/components/pricing-actions.tsx`
- `packages/env/src/server.ts`, `apps/web/.env.example`
- `apps/web/src/domain/billing-preflight.ts`, `apps/web/scripts/billing-preflight.ts`

Changes:

- Make both checkout entry points return a typed, expected `sales_retired` result before creating a Stripe Customer or Session. Keep this guard unconditional in the free-learning release; an old lifetime flag must not reopen sales.
- Remove purchase-creation code after callers/tests migrate. Retain narrow rejected entry points during compatibility support for cached clients; unexpected failures still have their own error path.
- Keep `/pricing` as an access explanation and previous-purchases destination. Remove it from the primary sales navigation. Its public content must not fetch Stripe prices or require billing configuration.
- Keep valid old Checkout return parameters working. A verified historical purchase is a billing fact; it is no longer an unlock. Preserve current account, customer, exact price, payment, and session checks. Invalid or mismatched callbacks never write another user's purchase record.
- Load historical billing on demand for signed-in users. Preserve Customer Portal access, verification/restore, support, and refund/dispute records. Provide a footer link to `/pricing#past-purchases`; do not replace this route with a redirect that loses return parameters.
- Remove `LIFETIME_CHECKOUT_ENABLED` from active application behavior once the retirement guard owns new sales. Keep exact historical Price/account configuration required for recovery and audit.
- Change billing preflight from checking sale readiness to checking the retirement contract and historical recovery. Keep existing account/mode isolation checks. A Stripe-free learning build must pass without implying that historical billing recovery is configured.
- Keep `app_user` customer, Course Pass, and revocation columns. Do not drop or rewrite historical migrations, grants, or payment records.

Acceptance: both checkout actions create zero Stripe objects for guests, ordinary accounts, former members, stale UI callers, and environments still carrying the old enable flag. `/pricing` remains useful with Stripe unavailable. Purchase recovery remains account-scoped.

### 2. Open the complete learning experience

Owners:

- `apps/web/src/content/course.ts`, `apps/web/src/content/learning-rollout.ts`
- `apps/web/src/domain/access.ts`, `apps/web/src/server/access.server.ts`
- `apps/web/src/server/lesson.server.ts`, `apps/web/src/server/learning-access.server.ts`
- `apps/web/src/server/learning.ts`, `apps/web/src/server/preview-learning.server.ts`
- `apps/web/src/server/learning.server.ts`, `apps/web/src/server/progress.server.ts`
- `apps/web/src/features/learning/learning-exercise.tsx`, `apps/web/src/features/learning/preview-learning.tsx`
- `apps/web/src/features/learning/learning-screen.tsx`, `apps/web/src/features/learning/copy.ts`

Changes:

- Remove paid lesson decisions, `canAccessPaid`, and billing-unavailable states from learning responses. Move any billing-only types still needed by historical support into the billing domain.
- Resolve public lesson bodies/capabilities directly from the catalog. Optional identity/progress loading must not become a prerequisite for public reading or guest exercise execution.
- Generalize guest exercise validation from seven preview IDs to known published lessons with current runtime scenarios. Keep variants 0/1, bounded action history, strict input parsing, server recomputation, and current-stage projection. Held-out evaluation cases and full answer keys remain server-only.
- Require identity for saved attempt/progress mutations and verify attempt ownership, revision, scenario version, and allowed transitions on every command. Remove only the payment condition.
- Preserve saved attempts and course completion without changing content/scenario versions merely to change price. Archived submissions, alternate retry cases, and research source snapshots retain their existing rules.
- Preserve account-switch cleanup and ignore stale asynchronous responses. Explain guest resets before sign-in; do not import guest answers into an account without a separately designed, validated transfer flow.
- Keep supplied-case fallback for anonymous recap/audit exercises. Signed-in source reuse remains restricted to that learner's eligible submitted packet or recap.

Acceptance: all 36 lessons and both runtime practice variants open anonymously. Ordinary signed-in users can save every lesson and reuse their own source work. Missing Stripe credentials and simulated Stripe outages cause zero learning failures or Stripe requests.

### 3. Decouple media delivery from billing

Owners:

- `apps/web/src/content/course.ts`
- `apps/web/src/server/media.server.ts`
- `apps/web/src/routes/api.lesson-media.$lessonSlug.$asset.ts`
- `scripts/media-manifest.json`, `scripts/import-course-media.mjs`, `scripts/assert-media-boundary.mjs`
- `apps/web/scripts/upload-course-media.mjs`

Changes:

- Preserve current/withheld media status and explicit storage delivery metadata. Changing course access must not change object keys or import paths.
- For an enabled public asset, use the existing public delivery base. For an enabled private R2 asset, issue the existing bounded presigned URL after validating the published lesson, current media status, and allowed asset; identity/payment is unnecessary.
- Adapt the local signed route to validate a lesson/asset/expiry capability instead of a required user ID. Enforce the same current-media predicate at issuance and serving, exact asset enums, safe known paths, GET/HEAD, captions, and byte-range playback.
- Remove cookie-dependent caching from anonymous media responses. Prevent caching an expiring URL beyond its lifetime; keep private learner data out of all shared caches.
- Update media assertions to check ownership, manifest consistency, storage placement, and publication readiness rather than search source text for `access: "paid"`. Retain protections against staging private storage assets or generated binaries inside public source/Git.
- Avoid bucket-wide ACL changes or bulk uploads. Existing withheld assets remain absent from the UI and direct issue routes. Validate delivery with a controlled local fixture until a current asset is separately approved.

Acceptance: a current fixture video/caption works as a guest, including range seeking and HEAD; invalid asset names and expired tokens fail; withheld assets cannot be obtained by bypassing the lesson page. Media failure leaves the written lesson and practice usable.

### 4. Keep AI coaching bounded and independent

Owners:

- `apps/web/src/server/coaching-config.server.ts`, `apps/web/src/server/coaching.server.ts`
- `apps/web/src/server/coaching-provider.server.ts`
- `apps/web/src/domain/coaching/policy.ts`
- `apps/web/src/features/learning/coaching-panel.tsx`, `apps/web/src/features/learning/coaching-copy.ts`
- `packages/env/src/server.ts`, `apps/web/scripts/coaching-preflight.mjs`
- `packages/db/src/schema/index.ts` and a new forward migration when the accounting change below is implemented
- `packages/db/scripts/purge-coaching.mjs`, `apps/web/scripts/evaluate-coaching.ts`

Initial policy: one new two-round coaching session per authenticated account per UTC day, on the three currently supported lessons. Preserve the existing $10 per UTC admission-day global reservation budget, runtime model-price verification, token/output limits, no automatic retry of ambiguous calls, and global disable control. Former payment status does not increase the allowance. Keep the current allowlist until provider quality and wider-audience abuse checks pass.

The $10 value is a ceiling for complete-session reservations admitted on that UTC date. A reserved second round can execute later, so it is not an exact wall-clock daily invoice ceiling. Record actual usage and unresolved cost separately and describe the limit accurately in operations docs.

One accounting issue must be addressed before broad AI access: the current global total is summed from account-owned coaching sessions, while account deletion cascades those rows. Add a small global daily-reservation ledger with no account foreign key and reserve against it in the existing SQL advisory-lock transaction. Content/account deletion must not make spent or reserved global budget available again. Use a new migration, never edit `0004` in place. The ledger stores date and aggregate reserved micro-USD only, with a documented retention period.

Disable coaching admission while installing the ledger and updating the command, then backfill the current admission day under the same lock. If prior hard deletions prevent a complete total, keep new admissions disabled until the next UTC day instead of treating the incomplete sum as the budget baseline. Confirm no old application instance can reserve outside the new ledger before re-enabling the pilot. Existing sessions retain their recorded reservations; historical spend must not be presented as reconstructable when its source rows no longer exist.

Retain per-account quota checks, generation/round uniqueness, conservative reservation for unknown outcomes, and soft-delete race protections. Quota exhaustion, provider failure, disabled AI, or unavailable configuration must leave ordinary exercises and static hints usable. Existing reserved sessions remain recoverable within their original limits.

The public launch of free lessons does not require widening the AI pilot. Wider availability is a follow-up gate after the ledger, concurrent admission tests, deletion tests, and real-provider teaching-quality review pass. Update coaching evaluation to accept an external output directory before running it; its current default writes reports under the repository.

Acceptance: one account cannot obtain a second new session that UTC day through retries, multiple tabs, a different lesson, or deleting coaching content. Parallel accounts cannot exceed the global reservation ceiling. Account deletion cannot replenish it. Duplicate requests invoke the provider once. Guest calls never invoke it.

### 5. Replace the sales journey and update public discovery

Owners:

- `apps/web/src/routes/index.tsx`, `apps/web/src/routes/courses.tradingflow-foundations.tsx`, `apps/web/src/routes/learn.$lessonSlug.tsx`
- `apps/web/src/components/header.tsx`, `apps/web/src/components/footer.tsx`, `apps/web/src/components/auth-controls.tsx`
- `apps/web/src/components/access-panel.tsx`, `apps/web/src/components/complete-lesson-button.tsx`
- `apps/web/src/components/course-list.tsx`, `apps/web/src/components/course-catalog.tsx`, `apps/web/src/components/landing-curriculum.tsx`
- `apps/web/src/components/practice-card.tsx`, `apps/web/src/i18n/messages.ts`
- `apps/web/src/seo/pages.ts`, `apps/web/src/routes/sitemap[.]xml.ts`
- `apps/web/src/content/legal.ts`, `apps/web/src/content/changelog.ts`

Changes:

- Lead with “Learn options research for free” and “Start learning.” Remove locks, member-only badges, redundant Free/Paid filters, paid-progress errors, upsells, and the foundation-completion pricing CTA. Keep beginner recommendations and module/progress navigation.
- Offer “Create a free account to save progress” when persistence would help. Reading, exercises, and basic feedback must remain reachable without signing in.
- After an appropriate completed exercise, use the existing `PracticeCard` and lesson practice mapping to offer “Apply this in TradingFlow.” State that TradingFlow has separate access and pricing. Keep completion possible without clicking the outbound link; avoid unrelated CTAs on beginner concepts.
- Preserve public URLs. Make all published lessons indexable and include them in the production sitemap. Preserve preview-deployment noindex and unknown-slug 404 behavior. Verify lesson text in SSR HTML, not just metadata.
- Update pricing/home/course metadata, English/Chinese copy, FAQs or relevant guide copy, and terms/privacy language. Remove new-sale and unfulfilled partner-benefit promises; retain accurate historical payment processing and data-retention disclosures.
- Keep existing release IDs unchanged. Draft the new changelog entry during implementation and date/publish it with the actual free-learning release. Do not claim every lesson has a current video or production AI coach.

Acceptance: a guest can follow home → any module → lesson → exercise → next lesson with no purchase gate. EN/ZH, mobile, keyboard, and reduced-motion flows remain usable. Every published lesson has one canonical and the correct production/preview indexing policy.

### 6. Measure the learning-to-TradingFlow path

Owners:

- `apps/web/src/analytics/events.ts` and its schema/allowlist tests
- `apps/web/src/analytics/billing-status.ts`
- `apps/web/src/features/learning/preview-learning.tsx`, `apps/web/src/features/learning/learning-exercise.tsx`
- `apps/web/src/components/practice-card.tsx`
- `docs/free-course-strategy.md`, `docs/ANALYTICS-SCENARIOS.md`, `docs/OBSERVABILITY.md`, `docs/POSTHOG-REPLAY.md`

Reuse existing lesson, guest/account exercise, completion, and `tradingflow_link_opened` events. Preserve the historical meaning of `preview_exercise_*` as unsaved guest practice during the first release; document its expanded lesson coverage. Remove paid access fields from new learning events, or use an explicitly versioned payload where compatibility requires it. Historical billing events remain historical; stop emitting billing failures from ordinary learning.

Keep the current bounded attribution convention: `utm_source=tradely`, `utm_medium=course`, and stable lesson campaign values. Do not add emails, account IDs, checkout IDs, answers, or shared cross-site identifiers. Consent denial must still produce no product analytics; learner text and inputs remain masked even when lessons become public.

Tradely can measure exercise progress and outbound clicks. Confirm separately whether TradingFlow retains campaign attribution through sign-in and links it to meaningful product use and paid subscriptions within its own system. If missing, specify a companion change in that project using its existing consent/auth/billing contracts. Do not merge identities or call an outbound click a paid conversion. This dependency is not implemented by changing this repository.

Start a 90-day evaluation at production cutover, with checks at days 30, 60, and 90:

- Learning: unique observable starters, guided/independent exercise submissions, completed learning paths, and returning learners; separate guest and account coverage and disclose deduplication limits.
- Product: attributable TradingFlow arrivals, first completed relevant research workflow, new paid subscriptions, and subscriptions still paid 30 days later. Define the exact qualifying product event in TradingFlow before accepting this metric.
- Economics: additional TradingFlow contribution after variable costs, compared with foregone Tradely contribution plus media, AI, infrastructure, refunds, and operator time over the same horizon. Use accounting records for payments.

Exclude internal/test traffic and existing customers from new-customer acquisition counts; analyze existing-customer retention separately. Segment acquisition source/locale only when sample sizes support it. Use cohorts with complete 30-day follow-up; day-90 reporting cannot include immature late cohorts. Before/after attribution is directional evidence, not causal proof of incrementality. Do not invent a baseline from old documentation or compare different traffic mixes as an experiment.

If traffic grows without useful practice or downstream activation, pause additional content investment and inspect the failing step. If traffic is too sparse, observe learner journeys and report uncertainty instead of declaring the model validated. This plan does not create a scheduled automation.

## Existing-customer cutover

This is a separate operational phase after code is concrete and validated. First produce a read-only inventory of exact Tradely Products/Prices, including historical prices, customers, subscriptions in every relevant status, schedules, open Sessions, unsettled payments, invoices, and previously promised partner benefits. Do not infer ownership from a customer email or cancel all subscriptions in the shared Stripe account.

Recommended policy for review: stop recurring Tradely billing at cutover, assess unused prepaid membership amounts for refund, and propose a clear goodwill policy for previous Course Pass buyers. Keep their accounts, progress, purchase evidence, and support path. Exact recipients, amounts, and any customer communication need a reviewable inventory before execution; the planning request authorizes none of those external actions.

Prepare a bounded, rerunnable retirement command, proposed at `apps/web/scripts/retire-tradely-billing.ts`, with dry run by default, exact account/mode and Price allowlists, fresh retrieval before mutation, and an external audit output directory. It must identify mixed-product subscriptions and ambiguous ownership for review rather than cancel them automatically. Generate the proposed action list before requesting authority to execute it.

The authorized cutover must close every purchasing path: deploy the new-sale guard, expire still-open matching Checkout Sessions, disable Tradely-specific payment links if present, and archive the exact retired Prices. Already completed or processing payments require reconciliation. [Stripe's Session-expiration API](https://docs.stripe.com/api/checkout/sessions/expire) applies to open Sessions; [archiving a Price](https://docs.stripe.com/products-prices/manage-prices) does not terminate existing subscriptions.

Cancel the reviewed recurring subscriptions and inspect their schedules, invoices, and pending items. For an immediate cancellation without a new final charge or automatic proration, explicitly choose the corresponding API options; handle any approved refund separately. Cancellation has invoice consequences and does not by itself settle every pending item. Follow [Stripe's cancellation guidance](https://docs.stripe.com/billing/subscriptions/cancel). Preserve historical invoice/tax records and handle approved refund tax adjustments through the original billing records.

Use a Tradely-specific portal configuration if required to prevent resubscription; avoid changing shared account-wide settings. Verify the historical portal exposes only the intended customer's support/billing actions. Disable old deployment/payment-link paths that could still sell the retired Prices. Reconcile again after in-flight operations settle. Acceptance is no remaining unapproved future Tradely charge, not merely hidden buttons.

There is no existing Stripe webhook in this application. Do not claim automated refund/cancellation reconciliation; use the bounded audit and the existing historical-support workflow.

## Validation and release gates

| Boundary | Required proof |
| --- | --- |
| Public learning | Table-driven loader/guest transport tests for all 36 lessons and both runtime variants; unknown lessons rejected |
| Saved work | Ordinary unpaid account saves, reloads, retries, exports, and packet/recap/audit source reuse; cross-account and stale-revision rejection |
| Grading | Existing curriculum/engine tests retain key projection, held-out exclusion, immutable assessments, and prose-review distinctions |
| Dependency failures | No Stripe calls from learning; public content remains available during auth/database failure; persistence errors are explicit |
| Retired checkout | Both actions reject with no Stripe writes, including old enable flags, cached clients, and repeated requests |
| Historical support | Valid/invalid/mismatched purchase returns, restore, refund/revocation records, and the correct Customer Portal account |
| Media | Guest GET/HEAD/range/caption success for current fixture; withheld media, expiry, invalid asset/path denial; no bulk publication |
| AI | Per-account quota, concurrent global cap, deleted-account budget retention, midnight continuation, duplicate/ambiguous calls, and static fallback |
| Privacy/analytics | Consent denial, masked learner work, bounded properties, URL sanitization, and legacy event compatibility |
| Discovery/UI | Production SSR/sitemap/canonical coverage, Preview noindex, preserved old URLs, EN/ZH, desktop/mobile, keyboard/reduced motion |

Run the affected existing suites first, then workspace typechecks, full web/database tests, production build, media boundary checks, and formatting checks under Node 24 / pnpm 11. Use existing PGlite migration tests for the forward AI-ledger migration. Do not edit prior migrations or run migrations during a build.

Repository commands for the implementation gate:

```sh
pnpm check-types
pnpm --filter web test
pnpm test:db
pnpm check
pnpm build
git diff --check
```

Use the required release/observability build configuration through the existing secret-safe environment; do not disable build gates to obtain a pass. Preserve unrelated dirty work and distinguish pre-existing failures from failures caused by this change. Real Stripe/provider tests use the appropriate isolated test environment and separately scoped credentials; mock results are not live proof.

Update the canonical browser acceptance inventory at `ops/agent/e2e-testing/e2e-test-cases.md` and its runbook when implementing the changed contract. Record actual UI interactions and provide GIF evidence for the free guest journey, account save/resume, AI limit fallback, and historical billing path. Store all test reports, captures, GIFs, provider evaluations, and retirement manifests outside the repository, for example `/tmp/tradely-free-learning/<run-id>/`. Never put OTPs or secrets in evidence.

Release sequence:

1. Commit the validated application changes, compatible database migration, and updated documentation locally.
2. Verify a Preview deployment with sales blocked and AI still restricted; reconcile all acceptance evidence.
3. Prepare the concrete production deployment and customer-retirement action list for the user's final authorization.
4. Apply the additive migration in its target environment, deploy, execute the authorized scoped billing cutover, and verify guest/account behavior plus no unintended future charges.
5. Publish accurate release copy and start the measurement window. Widen AI only after its separate quality, budget, and abuse gates pass.

If a learning regression appears, roll forward or revert the specific UI/service change while retaining public access and retired sales. Do not redeploy an old billing-enabled build as a blanket rollback. Never reverse refunds, reactivate subscriptions, restore deleted personal data, or re-enable withheld media as a rollback mechanism. The AI disable control remains independent.

## Documentation to update with implementation

Update `README.md`, `docs/ARCHITECTURE.md`, `docs/BILLING.md`, `docs/AI-COACH.md`, `docs/SEO.md`, `docs/free-course-strategy.md`, analytics/replay documentation, relevant media operations documentation, and canonical E2E procedures. Keep historical dated reports intact and label superseded policies; do not rewrite previous validation as proof of the new behavior.

Draft release message: “All current Tradely lessons and interactive exercises are now free. Create a free account to save your progress. TradingFlow remains a separate service. Optional AI coaching has availability and usage limits.” Publish only the capabilities actually enabled at release.

## Completion criteria

The code implementation is complete when public learning and free account persistence have passed the matrix, no learning path depends on Stripe, new checkout is impossible, legacy support remains correct, costs stay bounded, documentation reflects the new contract, and the cohesive changes are committed.

The production transition is complete only after the matching deployment, scoped billing retirement, live verification/GIF evidence, and measurement readiness are confirmed. Missing customer inventory, provider evidence, or downstream attribution must be reported as an unresolved boundary rather than a successful launch.
