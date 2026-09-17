# Tradely observability

Current learning opens emit `access_tier: free` and `access_state: allowed`. Historical preview/paid values remain readable; `preview_exercise_*` still means unsaved guest practice and now covers all 36 lessons. Billing events are limited to historical support. `tradingflow_link_opened` is an outbound click, not a payment or product-activation record. Existing consent, masking, query sanitization, and project-provenance requirements remain. Old snapshots below are not current traffic or revenue evidence.

The complete application event catalog and scenario verification points are in
[Analytics scenarios](ANALYTICS-SCENARIOS.md). The current masked replay and heatmap setup is documented in [Replay setup](POSTHOG-REPLAY.md).

Tradely uses PostHog US Cloud project `582920` (`Tradely`) for consented product events, web vitals, browser exceptions, and consent-gated server exceptions. `AnalyticsProvider` owns client initialization, consent, identity, URL sanitization, and the typed emitter. `captureServerException` owns bounded Vercel/Node failures. Product components may emit only events declared in `apps/web/src/analytics/events.ts`.

Tradely uses the existing Google Analytics 4 property `552068066` and web stream `landingpage` (`15524570705`) for `tradely.ai`. Its measurement ID is `G-TGJJLS7M42`. The Google tag loads only after explicit analytics consent, sends page views and allowlisted typed product events, disables Google advertising signals, and never receives the Tradely user ID, lesson text, or payment details. The stream has email redaction plus eight sensitive URL-query keys enabled; Tradely's custom page locations are query-free. The stream will show no Tradely data until a deployment containing this integration is live.

The pinned operator dashboard is [Tradely — Learning & Reliability](https://us.posthog.com/project/582920/dashboard/2043620). Saved operational insights require `environment = production` and enable PostHog's test-account filter.

Dashboard tags include `actions` and `release` alongside learning, billing, retention, privacy, performance, triage, error tracking, and observability categories.

The dashboard is not publicly shared. PostHog object-level permissions for invited-only editing are a Boost-gated feature; until that add-on is enabled, retain the project-level access model and do not publish the dashboard publicly.

Current dedicated monitors:

- [Production exceptions — 7 days](https://us.posthog.com/project/582920/insights/p7Gip7Ew) (`11443701`)
- [Average FCP — 30 days](https://us.posthog.com/project/582920/insights/tiLO4MsK) (`11430623`)
- [Production FCP by route — 30 days](https://us.posthog.com/project/582920/insights/GTUeHQ3S) (`11451249`)
- [Root-route FCP by device — 30 days](https://us.posthog.com/project/582920/insights/sf7Qbbdz) (`11451297`)
- [Average LCP — production](https://us.posthog.com/project/582920/insights/kfUVR2un) (`11443702`)
- [Production LCP by route — 30 days](https://us.posthog.com/project/582920/insights/wEjp1DK7) (`11452276`)
- [Average INP — production](https://us.posthog.com/project/582920/insights/SzyBkjVO) (`11451069`)
- [Average CLS — production](https://us.posthog.com/project/582920/insights/0Yd3VwvW) (`11451039`)
- [Analytics consent grants — production](https://us.posthog.com/project/582920/insights/N8ppJeF9) (`11451707`)
- [Consented page views — 7 days](https://us.posthog.com/project/582920/insights/Ypp1NBip) (`11430595`)
- [Lesson opens — 30 days](https://us.posthog.com/project/582920/insights/EEKq8j3X) (`11430598`)
- [Lesson opens by access state — production](https://us.posthog.com/project/582920/insights/mLnfze3W) (`11451664`)
- [Lesson opens by lesson — production](https://us.posthog.com/project/582920/insights/M2AeBhKw) (`11451731`)
- [Daily active learners — production](https://us.posthog.com/project/582920/insights/ssr1loUD) (`11452245`)
- [Weekly lesson retention — production](https://us.posthog.com/project/582920/insights/Qu9BOWfL) (`11451736`)
- [Lesson-open stickiness — production](https://us.posthog.com/project/582920/insights/Sy87b5VQ) (`11452044`)
- [Learner lifecycle — production](https://us.posthog.com/project/582920/insights/d9TxLZ9P) (`11452097`)
- [Lesson opens by locale — production](https://us.posthog.com/project/582920/insights/9jLNYVGh) (`11451836`)
- [Sign-in opens by surface — production](https://us.posthog.com/project/582920/insights/nUdxE2eo) (`11451956`)
- [Learner navigation paths — production](https://us.posthog.com/project/582920/insights/RSFnCMvX) (`11452143`)
- [Visitor → lesson activation — production](https://us.posthog.com/project/582920/insights/SRvfnuFt) (`11443815`)
- Historical — [Checkout returns — estimate](https://us.posthog.com/project/582920/insights/OyB8E0dZ) (`11430646`)
- Historical — [Checkout returns by status — production estimate](https://us.posthog.com/project/582920/insights/DxDAIzJI) (`11451681`)
- Historical — [Visitor → checkout return — production estimate](https://us.posthog.com/project/582920/insights/t0x3L4n1) (`11451653`)
- Historical — [Billing journey — production estimate](https://us.posthog.com/project/582920/insights/8uqdQeNL) (`11451824`)
- Historical — [Billing actions by type — production](https://us.posthog.com/project/582920/insights/4skB8g1o) (`11451966`)
- Historical — [Paywall → membership CTA — production](https://us.posthog.com/project/582920/insights/CgIvtWqn) (`11451924`)
- Historical — [Sign-in → allowed lesson — production](https://us.posthog.com/project/582920/insights/e2VJxjwn) (`11451993`)

The dashboard intentionally leads with reliability and performance diagnostics, then shows traffic and learning activation. Historical billing/access tiles remain visible only to preserve the retired-flow record until the live dashboard is reconciled after the replacement events are deployed.

## Live validation snapshot

As of 2026-08-29 in the `America/New_York` project timezone, the current partial day contains 10 production `page_viewed` events and 6 production `$web_vitals` events. No production `$exception` events or Error Tracking issues matched the last 30 days, which means exception paging has not yet been exercised by a real production failure. PostHog has 148 valid source-map symbol sets with uploaded files; the latest entries belong to release `tradely-web`, branch `main`, commit `34a594f3ff1287b2f6c32c18c69649fe804051d6`, deployed as `34a594f3ff1287b2f6c32c18c69649fe804051d6+dpl_9bdWtqNAa9aXvJoYk9eVGDxThkzY`.

The production dashboard and performance alerts are now backed by deployed traffic and valid source maps. Exception readiness remains **unproven** until a production `$exception` creates, reopens, or spikes an Error Tracking issue.

The current production events predate the release-context change, so they do not carry the new `release` property. Release-based breakdowns should begin only after a deployment containing the updated Vite and PostHog client code is serving traffic.

Production Vite builds fail closed when the PostHog project key is missing or malformed, either PostHog host is outside Tradely's US endpoints, neither `VERCEL_GIT_COMMIT_SHA` nor an explicit `VITE_APP_RELEASE` is available, or PostHog source-map upload is disabled or pointed at another project. This prevents a deploy that would silently omit telemetry, cross account boundaries, produce uncorrelated events, or create opaque Error Tracking issues.

Historical checkout/paywall insights describe the retired paid-course flow and are not current conversion KPIs. The active product is free learning; current analysis should center on lesson opens, visual-scene engagement, sign-in completion, saved study marks, and returning learners. Historical billing data remains available for support and audit use.

The current lesson route reports `access_tier=free` and `access_state=allowed`. Older `payment_required` and `signed_out` lesson-open values belong to the retired access model and must not be used as current paywall metrics.

Checkout-return and membership-CTA events are no longer part of the active source contract. Existing PostHog rows and saved insights are historical evidence only.

The consent monitor currently shows 1 explicit analytics grant in the partial 30-day window. Because denials are intentionally not captured, this is an opt-in count rather than a consent rate or denominator.

The lesson-demand monitor currently shows `audited-boundary` with 2 opens, followed by `cookbook-research-packet`, `dex-dei-gex`, `rank-symbols`, and `symbol-drawer` with 1 each. The breakdown uses only bounded lesson identifiers and never lesson text.

The daily-active-learner monitor currently shows one production learner on the partial 2026-08-29 interval and zero on the preceding 30-day intervals. Treat this as an instrumentation and early-adoption signal, not a baseline, until repeat traffic grows.

The weekly lesson-retention monitor has one Week-0 cohort and no later return observations. Treat it as directional until more learners and repeat sessions establish a meaningful baseline.

The locale monitor currently shows 6 lesson opens for `en` and no other observed locale in the last 30 days. This reflects current traffic, not a conclusion about demand for other languages.

The lesson-open stickiness monitor currently shows one learner active on one day and no learner active on additional days in the 30-day window. Treat this as directional until repeat engagement grows.

The learner-lifecycle monitor currently shows one `new` learner in the latest week and no `returning`, `resurrecting`, or `dormant` learners. This is a small sample, not a churn or growth baseline.

`auth_sign_in_opened` remains an intent signal. `auth_sign_in_completed` is the identified outcome for a Tradely-started email-OTP or Google flow; `auth_session_established` remains broader session-readiness telemetry and also covers restored sessions.

The navigation-path monitor currently shows one consented learner moving from home to `audited-boundary`, then `rank-symbols`, then `symbol-drawer`. It intentionally uses PostHog's `$pageview` path event type because Paths scopes navigation nodes by event type; the semantic `page_viewed` action remains the source for traffic and funnel metrics. Path timing is directional and based on a one-person sample.

## Consent and privacy contract

- PostHog and Google Analytics 4 initialize opted out. No browser product event, web vital, browser exception, server exception, Google tag, or Google Analytics event is sent before the learner selects **Allow analytics**. The PostHog client reconciles Tradely's persisted consent before exposing itself, so stale SDK opt-in state cannot leak events during provider startup. If the optional PostHog bundle fails to initialize, the provider keeps the app usable and leaves Google consented capture independent; a later grant can retry the PostHog path.
- The PostHog browser SDK is deferred until an existing granted choice or a new explicit grant; unknown and denied visitors do not pay the SDK startup cost.
- Consent is stored in local storage and mirrored into a same-site `tradely_analytics_consent_v2` cookie containing only `granted` or `denied`. Server functions require `granted` before reporting.
- Consent storage and cookie writes are best effort: browser storage failures fail closed for server capture without interrupting the privacy controls or the learner's navigation.
- Open tabs subscribe to the consent storage key, so a grant or withdrawal in one tab is applied to PostHog and Google Analytics in the others.
- The learner can grant or withdraw analytics through **Privacy choices** in the footer. Withdrawal stops PostHog and Google Analytics capture, resets the PostHog browser identity, and changes the server-consent cookie to `denied`.
- An explicit grant is queued until each configured provider is ready, so a fast consent click cannot lose the `analytics_consent_updated` event; it is emitted once per provider. PostHog's automatic `$opt_in` event is suppressed so the explicit application event remains the canonical consent signal.
- Do Not Track is respected by both PostHog and Google Analytics: GA4 will not initialize under a DNT signal, and an active stream is stopped if the signal changes.
- Tradely user ID is the only signed-in identity sent to PostHog. Email address, name, Stripe identifiers, payment details, lesson text, protected media URLs, tokens, and progress timestamps are excluded.
- URL query strings and fragments are removed before PostHog browser and server capture and from Tradely's custom Google Analytics page locations. URL-like PostHog system properties are sanitized centrally, and PostHog's explicit URL-hash suppression is enabled as defense in depth. Google stream-level redaction covers email plus eight sensitive query keys.
- Client and server exception messages/stacks pass through a bounded redaction layer for email, bearer credentials, sensitive query values, authentication identifiers, and Stripe identifiers.
- The PostHog project anonymizes client IPs. Server events also set GeoIP capture off.
- Masked session replay and coordinate heatmaps are enabled after version-2 consent, with 30-day replay retention. Text and inputs are masked; protected lesson contents and media are blocked. Generic autocaptured element text/clicks, surveys, standalone dead-click events, feature-flag evaluation, web experiments, conversations, product tours, browser console-log capture, and optional device-model lookup remain disabled. DOM text and element attributes are masked as a defense in depth if autocapture is ever enabled. External PostHog dependency loading is disabled, and any future permitted extension URLs are version-pinned. Google advertising signals and user-ID collection are disabled.
- Browser exception autocapture covers unhandled errors and promise rejections only after consent. The route error boundary waits for a consented PostHog client before capturing, while caught billing and lesson-completion errors use the same bounded redaction layer.
- PostHog initialization, event capture, identity changes, and exception capture fail closed: browser SDK import, server client construction, readiness, and transport failures are swallowed and never interrupt route rendering, billing, lesson completion, or error recovery.
- Web vitals include LCP, CLS, FCP, and INP without DOM attribution.

The 2026-09-09 PostHog update enables masked session recording and heatmaps. Console/network capture and surveys remain off; IP anonymization remains enabled. Event retention is configured for 84 months but enforcement is disabled; shortening or enforcing retention can remove historical data and requires an explicit product/legal decision.

## Event contract

All product events carry:

- `app = tradely`
- `environment = production | preview | local`
- `event_schema_version = 1`
- `release` is a trimmed, 120-character-bounded Vercel commit SHA when available, otherwise an explicit `VITE_APP_RELEASE`, with `local` as the development fallback across browser, server, and build telemetry; it contains no secret or user identifier.
- `runtime` distinguishes `browser` events from server `vercel_function` or `node` events and is preserved through the shared property-pruning boundary for cross-runtime triage.

The primary learning journey is:

1. `$pageview` and `page_viewed`
2. `lesson_opened`
3. `visual_lesson_scene_started`
4. `visual_lesson_explored` when the learner directly manipulates a scene
5. `visual_lesson_scene_completed`
6. `lesson_video_started` / `lesson_video_completed` when companion media exists
7. `tradingflow_link_opened` when the learner follows a product-practice handoff
8. `lesson_completed` when a signed-in learner records the study mark

The older signed-in exercise/coaching event family remains registered for the retained exercise implementation, but the current lesson route renders `VisualLesson` and does not mount `LearningExercise`. Do not use `lesson_exercise_*`, `lesson_hint_opened`, renderer, or coaching events as denominators for the current visual curriculum unless that product surface is mounted again.

The `lesson_attempt.assessment` record is authoritative for a submitted practice result. Analytics remains consented, best-effort journey evidence. Database failures from the learning service are replaced with a fixed error before exception capture so SQL parameters and case content cannot enter telemetry. New event shapes must be observed in a deployed consented session before building live insights; this source addition does not establish delivery or learning efficacy.

Sales are retired. Active billing telemetry is limited to support of existing customers: `billing_action_started`, `billing_action_redirected`, and `billing_action_failed` use `action=portal|course_pass_restore`. `course_pass_access_verified` is emitted server-side only after historical Course Pass verification/restoration has succeeded; Stripe and the database remain entitlement truth.

Reliability events are `$exception`, `$web_vitals`, `server_route_timing`, and `lesson_progress_save_failed`.

Authentication telemetry includes `auth_sign_in_opened` for entry intent, `auth_sign_in_completed` for a Tradely-started flow that reaches an identified session, and `auth_session_established` for signed-in session readiness including restored sessions. None of these is labeled account creation because the application does not have a trustworthy Neon new-user boundary.

Small terminal browser events (`analytics_consent_updated`, `billing_action_redirected`, `lesson_completed`, `lesson_video_completed`, `tradingflow_link_opened`, and `visual_lesson_scene_completed`) use PostHog's immediate `sendBeacon` transport so navigation or unload is less likely to drop them.

The live project has proven production delivery for the core route, consent, identity, lesson, and reliability events. Newly added `visual_lesson_*` and `auth_sign_in_completed` definitions should be promoted into saved PostHog actions/insights only after a deployed consented session establishes their live property shapes. The browser and Node `before_send` boundaries drop unregistered custom events and prune undeclared non-system properties.

As of the 2026-09-17 audit, production delivery is established for `page_viewed`, `lesson_opened`, `analytics_consent_updated`, `auth_session_established`, `server_route_timing`, and several learning/support events. The new visual-lesson and explicit sign-in-completion events remain deployment-gated until observed in project 582920.

Existing PostHog actions for payment-required lessons, membership CTA, checkout start/redirect, and checkout return are historical definitions from the retired sales flow. Keep them only for historical analysis; current dashboards should not present them as live conversion objectives. Reusable current actions include consent granted, lesson opened, consented page viewed, and sign-in opened; add visual-lesson and sign-in-completion actions only after their deployed schema is observed.

## Server exception coverage

Consent-gated server exceptions use the same Tradely user ID as the client distinct ID when signed in; anonymous failures use `tradely-server`. Bounded properties are:

- `source = access | billing | lesson | media | progress`
- `operation`
- optional `lesson_id` and `action`
- `runtime = vercel_function | node`
- bounded deployment `release`, using the Vercel commit SHA when available and `local` otherwise

Expected customer states such as signed-out billing, already-active membership, or missing customer linkage are not paged. Stripe/DB/media configuration failures and unexpected access/progress failures are captured immediately so serverless execution does not end before delivery.

The Node client explicitly uses `personProfiles = identified_only`, and server events set `$process_person_profile = false` for anonymous diagnostics. Anonymous `tradely-server` timing events therefore do not create person profiles while signed-in exceptions retain the authentication identity. Server delivery is bounded to one retry, a 250 ms retry delay, and a 1.5 second request timeout so PostHog outages cannot add unbounded learner latency. The server telemetry boundary is covered by transport-mocked tests for consent denial, exception delivery, slow-loader timing, identity, and bounded release metadata; these tests never send synthetic events to PostHog.

## Slow loader timing

The `server_route_timing` event records only consented, slow `course_progress_read` loader calls. It carries a 120-character-bounded operation, bounded duration in milliseconds, `ok` or `unavailable` status, a signed-in boolean, and the same bounded release contract as browser events; it uses the anonymous `tradely-server` identity and contains no user, billing, URL, or lesson content. Timings below one second are intentionally omitted to keep diagnostic volume and response overhead low. The event is local code awaiting deployment; verify its live schema and create any derived insight only after production traffic captures it.

The current Vercel production deployment is still commit `34a594f3ff1287b2f6c32c18c69649fe804051d6`; the local `server_route_timing` changes are not in that deployment. Therefore, the absence of this event in PostHog is expected until an authorized deployment ships the instrumentation.

## Environment configuration

Runtime capture:

```text
VITE_POSTHOG_KEY=<browser-visible PostHog project token>
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_APP_RELEASE=<Vercel commit SHA; injected by vite.config.ts>
VITE_GOOGLE_ANALYTICS_MEASUREMENT_ID=G-TGJJLS7M42
POSTHOG_PROJECT_TOKEN=<same project token; optional when VITE_POSTHOG_KEY is present at runtime>
POSTHOG_HOST=https://us.i.posthog.com
```

Build-time source maps:

```text
POSTHOG_SOURCEMAPS_ENABLED=true
POSTHOG_CLI_HOST=https://us.posthog.com
POSTHOG_CLI_PROJECT_ID=582920
POSTHOG_CLI_API_KEY=<personal API key>
```

`POSTHOG_CLI_API_KEY` must remain a sensitive Vercel build variable and must never be prefixed with `VITE_`, printed, or committed. The active `Tradely source maps` key is restricted to project `582920` and `error_tracking:write`; PostHog disables organization-level scopes on project-restricted keys. The Rollup plugin injects chunk IDs, uploads client and server source maps under release name `tradely-web`, and deletes maps after a successful upload. Production builds and runtime env validation fail closed unless `POSTHOG_SOURCEMAPS_ENABLED=true`, the credentials are present, `POSTHOG_CLI_PROJECT_ID=582920`, and the ingestion/control hosts remain `https://us.i.posthog.com` and `https://us.posthog.com` respectively.

The 2026-08-29 repository secret audit found no PostHog credential outside ignored environment files; the only tracked `phc_` matches are schema validators and test placeholders. `.env` and `.env*.local` remain ignored, source-map credentials are expected only in Vercel build configuration, and `pnpm check` now reruns the credential, SDK-boundary, and build-only-key scan against tracked and non-ignored files without printing values. Browser and Node SDK imports must remain behind their shared consent/redaction modules, and `POSTHOG_CLI_API_KEY` may only be read by `vite.config.ts`.

Tradely sends directly to PostHog US Cloud and must not reuse TradingFlow's proxy, project, alert destination, or customer identity boundary.

The `posthog-js`, `posthog-node`, and `@posthog/rollup-plugin` versions are exact-pinned in `apps/web/package.json` and `pnpm-lock.yaml`; upgrades should be reviewed against the PostHog changelog and revalidated before deployment.

## Error alerting

PostHog Error Tracking is enabled and connected to the TradingFlow Slack workspace with a dedicated Tradely channel, `#tradely-posthog-errors`. Three active workflows send to that channel:

- issue created: `01a04ebc-7896-0000-6f22-a0c98e01840a`
- issue reopened: `01a04ebc-a45a-0000-c5cb-e0f2729f3cd0`
- issue spiking: `01a04ebc-c7a3-0000-a242-be6151f57a65`

The issue-created workflow completed a successful PostHog test invocation against the Slack destination. Real production paging remains unproven until a deployed production exception creates, reopens, or spikes an issue.

Six saved insight threshold alerts are enabled on a daily schedule and route to `#tradely-posthog-errors`:

- `Production exception detected` (`01a04f59-f3af-0000-7ed5-59cee79a6690`): production exception count above `0`
- `Production LCP above 2500 ms` (`01a04f5f-436b-0000-e518-3e1f4ad9c344`): average LCP above `2500 ms`
- `Production CLS above 0.1` (`01a04f64-b03f-0000-8bf5-d93d2f161554`): average CLS above `0.1`
- `Production INP above 200 ms` (`01a04f68-6e75-0000-95ca-348ab067be2c`): average INP above `200 ms`
- `Production FCP above 1800 ms` (`01a04f6b-5dbb-0000-019f-7a3eed5321b9`): average FCP above `1800 ms`
- `Root-route FCP above 1800 ms` (`01a04f76-5566-0000-5a06-0c06ade24922`): any root-route device FCP above `1800 ms`

PostHog test messages for all six alerts were observed in Slack. The FCP alert subsequently fired on 2026-08-29 at 17:28 because the current interval measured `2.9 s`, above the `1.8 s` threshold; investigate this performance signal before changing the threshold. Fifteen-minute insight checks require the PostHog Boost add-on, so daily evaluation is the available cadence.

The latest alert-state audit shows both `Production FCP above 1800 ms` and `Root-route FCP above 1800 ms` **Firing**. `Production exception detected`, `Production LCP above 2500 ms`, `Production CLS above 0.1`, and `Production INP above 200 ms` are enabled and **Not firing**. Alert state is a control-plane signal; investigate the route diagnostics and verify Slack delivery separately.

The aggregate FCP insight is rendered as a daily trend with threshold context and tagged `active-alert` while firing, preserving the same production query while making the alert's trajectory visible to operators.

The FCP triage insight breaks the same production metric down by sanitized pathname. Its current 30-day aggregates are `/` at `3772 ms` and `/pricing` at `2064 ms`; use this diagnostic view to prioritize remediation without changing the alert threshold.

The LCP route diagnostic currently shows `/` at `3172 ms` and `/pricing` at `2064 ms` over the last 30 days. This is a small route-level sample for prioritization; it does not change the aggregate LCP alert threshold.

The root-route device diagnostic shows only `Desktop` traffic in the current sample, averaging `3772 ms`; no mobile root-route sample is available yet, so mobile performance is unknown rather than healthy.

Root-route triage identifies a likely critical-path contributor: `apps/web/src/routes/index.tsx` synchronously awaits `getCourseProgress()` in the route loader before the homepage shell can render. That loader performs access resolution plus signed-in progress reads, so auth, billing, or database latency can move directly into FCP/LCP. A future performance change should preserve the learning record but defer or stream progress behind the initial shell; this requires separate application-change authorization.

Do not configure grouping, suppression, severity, or assignment rules before real production issues establish the failure shapes. Premature suppression can hide first-deployment defects.

## Pending activation gates

- **Historical project audit (2026-08-29):** PostHog reports `effective_membership_level = 8`, `access_control = false`, `event_retention_months = 84`, and `events_retention_enforced = false`; session recording, surveys, and heatmaps remain disabled.
- **Authorized deployment:** ship the local `server_route_timing` and `auth_session_established` instrumentation, then run a consented production probe, confirm both events and their `release` values in PostHog, and only then create their actions or derived insights. Production builds now fail closed if release metadata or project-scoped source-map configuration is absent.
- **Retention decision:** choose and approve the event-retention period before enabling enforcement; the current project setting is 84 months with enforcement disabled.
- **Dashboard permissions:** enable invited-only editing only after the PostHog Boost feature is available; the dashboard setting is prepared but not effective under the current project tier.
- **Performance remediation:** separately approve deferring or streaming the homepage progress loader before changing the route implementation; the active FCP alerts should remain visible during the change.

## Verification

Before release:

When verifying with browser automation, use a normal Chrome user agent and ensure the browser does not expose `navigator.webdriver=true` (for `agent-browser`, pass `--args '--disable-blink-features=AutomationControlled'`). PostHog intentionally drops either signal as bot traffic before `before_send`; do not disable the production user-agent filter just to make an automated probe appear. When querying the probe in PostHog, set `filterTestAccounts: false` so localhost and explicitly marked test users are included. Saved production monitors should continue filtering test accounts.

1. Load the app with no stored consent and confirm there are no requests to PostHog ingestion.
2. Choose **Use necessary only** and confirm capture remains silent and the consent cookie is `denied`.
3. Choose **Allow analytics** and verify one `$pageview` plus one `page_viewed` event for the current route, one GA4 `page_view`, the Google tag load, and a `granted` consent cookie.
4. Navigate between routes and confirm query strings are absent from captured URLs.
5. Sign in and verify the PostHog distinct ID is the Tradely user ID without email person properties; verify one `auth_session_established` event per consented analytics session and a bounded `release` property on browser and server events.
6. Trigger a controlled caught browser error and a controlled consented server error in a non-production environment; verify redaction and issue grouping.
7. Withdraw consent and confirm subsequent browser and server actions emit no PostHog or Google Analytics requests.
8. Build with source-map variables and verify the output reports successful uploads.
9. Verify PostHog Symbol sets contains valid uploaded files for the deployed release; the current release has 148 valid uploaded symbol sets.
10. Require observed `environment = production` page views, web vitals, and `auth_session_established` before calling product monitoring live. Production traffic, source maps, and Slack threshold delivery are currently proven; real exception paging remains unproven until a production exception issue is observed.
