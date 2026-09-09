# Analytics scenarios

This is the implementation contract for Tradely's 24 application events, reviewed
on 2026-09-09. The typed names and permitted properties live in
[`events.ts`](../apps/web/src/analytics/events.ts). Consent, identity, and delivery
belong to [`AnalyticsProvider`](../apps/web/src/analytics/provider.tsx), with SDK
imports restricted to the shared browser and server clients.

## Shared rules

- Browser events require analytics consent and respect Do Not Track. Unknown or
  denied consent does not load the PostHog SDK. Server events require the same-site
  `tradely_analytics_consent=granted` cookie.
- PostHog events carry `app=tradely`, `environment`, `runtime`, `release`, and
  `event_schema_version=1`. Custom properties are pruned to the typed allowlist.
- Route URLs omit query strings and fragments. Learner answers, case bodies,
  protected media URLs, email, payment details, and secrets are excluded from
  application event properties. Exceptions pass through bounded redaction.
- Browser application events also go to GA4 when configured; GA4 route views use
  `page_view`. Server timing and PostHog SDK diagnostics stay in PostHog.
- After consent, a bounded queue can hold events while the PostHog SDK loads.
  Withdrawal clears that queue. GA4 readiness does not substitute for PostHog
  identity readiness.
- Business actions continue to work when analytics is disabled or unavailable.
  Successful saves/restorations remain successful if refreshing the UI fails;
  refresh errors may emit `$exception`, never a false save/payment failure.

## Application events

Paths below are relative to `apps/web/src`.

| Event | Trigger and interpretation | Implementation |
| --- | --- | --- |
| `analytics_consent_updated` | Explicit grant, once per provider in the current consent window; only `status=granted`. | `analytics/provider.tsx` |
| `page_viewed` | Current page after consent, then each pathname change. Query-only or language-only changes do not duplicate the visit. Auth entry uses `route_name=auth_sign_in`. | `analytics/route-analytics.tsx` |
| `locale_changed` | Language selection changes; previous/new locale only. | `components/locale-switcher.tsx` |
| `auth_sign_in_opened` | Click sign-in from header, restricted lesson, or pricing; records entry surface. | `components/auth-controls.tsx`, `access-panel.tsx`, `pricing-actions.tsx` |
| `auth_session_established` | PostHog identifies an available signed-in Neon identity after consent. Deduplicated while that mounted identity remains active; existing restored sessions also qualify. | `analytics/auth-identity.tsx` |
| `tradingflow_link_opened` | Click a header or lesson-practice TradingFlow link; optional bounded lesson ID/tool. `home_hero` is reserved in the type but has no current emitter. | `components/header.tsx`, `practice-card.tsx` |
| `lesson_opened` | View a valid lesson after consent, once per lesson visit, including restricted access. Captures access state at that moment, locale, and media availability. | `routes/learn.$lessonSlug.tsx` |
| `lesson_video_started` | First captured play in a mounted lesson/revision player; pause/resume does not duplicate it. A new lesson or content revision starts a fresh player lifecycle. | `components/video-player.tsx` |
| `lesson_video_completed` | Video `ended`; records duration and lesson ID, not media URL. Replay can produce another completion. | `components/video-player.tsx` |
| `lesson_completed` | Server confirms a requested completion save. | `components/complete-lesson-button.tsx` |
| `lesson_progress_save_failed` | Completion save is rejected (`signed_out`, `access_denied`) or throws (`unavailable`). Optional video-position writes do not emit this event. | `components/complete-lesson-button.tsx` |
| `lesson_exercise_started` | Signed-in exercise successfully opens, resumes, or restarts. This is not a unique-attempt count. | `features/learning/learning-exercise.tsx` |
| `lesson_hint_opened` | Server successfully processes a hint request; scenario IDs/version and current stage only. | `features/learning/learning-exercise.tsx` |
| `lesson_exercise_submitted` | An update returns an assessment; once per returned attempt within the mounted learning session. Records criteria counts and `practiced`/`demonstrated`, not answers. | `features/learning/learning-exercise.tsx` |
| `lesson_exercise_save_failed` | Signed-in exercise open/update fails; bounded failure reason only. | `features/learning/learning-exercise.tsx` |
| `lesson_renderer_changed` | Select 2D/3D or fall back to 2D on renderer failure. | `features/learning/learning-exercise.tsx`, `contract-explorer.tsx` |
| `membership_cta_clicked` | Restricted lesson's membership/access CTA is clicked. | `components/access-panel.tsx` |
| `billing_status_unavailable` | Unavailable billing is visible in a lesson access or course-progress surface. Waits for consent/readiness; deduplicated until recovery, a new mount, or a new consent window. | `analytics/billing-status.ts`, used by the access panel, home, and curriculum |
| `billing_action_started` | Checkout or portal request begins; offer distinguishes membership from lifetime course access. | `components/pricing-actions.tsx` |
| `billing_action_redirected` | Server returns a hosted URL, immediately before navigation. It does not prove checkout or payment completion. | `components/pricing-actions.tsx` |
| `billing_action_failed` | Checkout, portal, or restoration fails. Under the existing contract, restoration failures use `action=checkout`, `offer=lifetime_course`. | `components/pricing-actions.tsx` |
| `billing_checkout_returned` | Recognized checkout return on pricing; `status`, `offer`, and `estimate=true`. It does not prove payment. | `routes/pricing.tsx` |
| `course_pass_access_verified` | Verification/restoration returns confirmed access; source is `checkout_return`, `restore`, or `existing`. Analytics remains best effort; Stripe/database retain authority. | `routes/pricing.tsx`, `components/pricing-actions.tsx` |
| `server_route_timing` | Course-progress read takes at least 1,000 ms; duration capped at 60,000 ms, plus status and signed-in state. | `server/progress.server.ts`, `server/analytics/posthog.server.ts` |

## SDK scenarios

- `$pageview` accompanies `page_viewed` for the same visit. Do not add them together
  as separate visits.
- `$identify`/`$set` associate the permitted Tradely user ID and `auth_provider`.
  Sign-out/account changes reset identity; there is no dedicated sign-out event.
- `$web_vitals` records available LCP, CLS, FCP, and INP without DOM attribution.
- `$exception` covers unhandled browser errors/rejections, route boundaries,
  unexpected completion/billing failures, and instrumented server access, billing,
  media, progress, and learning failures. Browser console-error capture and global
  Node exception autocapture stay disabled.

Replay, heatmaps, generic click autocapture, page-leave events, and optional product
widgets remain disabled. Anonymous exercise previews intentionally do not emit
the signed-in exercise events. No dedicated signup, payment-success, subscription
activation, refund, or revenue event is part of this contract.

## Verification

- `analytics/provider.test.tsx`: delayed SDK readiness after GA4, identity/session
  deduplication, account changes, pending-event withdrawal, and consent failures.
- `analytics/route-analytics.test.tsx`: consented navigation, query removal,
  language changes, auth route classification, withdrawal, and resumption.
- `components/access-panel.test.tsx`: unavailable state already visible when
  consent arrives, recovery, and renewed consent.
- `components/video-player.test.tsx`: per-lesson/revision start lifecycle,
  consented retry, completion, and protected URL exclusion.
- `components/complete-lesson-button.test.tsx`: confirmed saves, rejected saves,
  exceptions, and refresh failures after successful persistence.
- `components/pricing-actions.test.tsx`: offer-specific checkout failures,
  portal failures, verified restoration, and refresh failure classification.
- `features/learning/learning-exercise.test.tsx` and `contract-explorer.test.tsx`:
  open/hint/assessment outcomes, failures, stale account responses, renderer
  selection, and fallback.
- Existing SDK, property-redaction, Google Analytics, and server-telemetry tests
  cover capture/privacy boundaries. Local test success is separate from deployed
  event delivery and PostHog dashboard population.

For a local browser smoke test, grant consent, navigate between home, pricing, and
sign-in, then withdraw consent. Verify one `$pageview`/`page_viewed` pair per
navigation, no sensitive query values, and no further events after withdrawal.
Use a normal Chrome user agent and `navigator.webdriver=false`; keep production
bot filtering enabled. Do not perform real checkout or mutate production learning
records for a smoke test.

Reference: [PostHog event tracking guidance](https://posthog.com/tutorials/event-tracking-guide).
See [observability configuration](OBSERVABILITY.md) for deployment and alerting.

The 2026-09-09 implementation passed 373 tests, workspace type checking, the Vite
build (source-map upload disabled), scoped Biome checks, and the credential scan.
A local browser smoke test verified consent-gated initialization, page-view pairs,
a query-free checkout-return event, language-change events, web vitals, and zero
new events after withdrawal. Signed-in and persistence-failure scenarios were
verified with isolated tests; no production checkout or learning records were
changed. Deployment of these source changes is a separate step.
