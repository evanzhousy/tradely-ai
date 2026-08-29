# Tradely observability

Tradely uses PostHog US Cloud project `582920` (`Tradely`) for consented product events, web vitals, browser exceptions, and consent-gated server exceptions. `AnalyticsProvider` owns client initialization, consent, identity, URL sanitization, and the typed emitter. `captureServerException` owns bounded Vercel/Node failures. Product components may emit only events declared in `apps/web/src/analytics/events.ts`.

The pinned operator dashboard is [Tradely — Learning & Reliability](https://us.posthog.com/project/582920/dashboard/2043620). Saved operational insights require `environment = production` and enable PostHog's test-account filter.

Current dedicated monitors:

- [Production exceptions — 7 days](https://us.posthog.com/project/582920/insights/p7Gip7Ew) (`11443701`)
- [Average LCP — production](https://us.posthog.com/project/582920/insights/kfUVR2un) (`11443702`)
- [Visitor → lesson activation — production](https://us.posthog.com/project/582920/insights/SRvfnuFt) (`11443815`)

As of 2026-08-29, the live project contains only `environment = local` application traffic, no error issues, and no symbol sets. Vercel Production and Preview contain the source-map variables, including a project-restricted `error_tracking:write` key, but no undeployed local build was uploaded. The production dashboard and alerts must remain labeled **unproven** until a new deployment emits production events and uploads valid source maps.

## Consent and privacy contract

- PostHog initializes opted out. No browser product event, web vital, browser exception, or server exception is sent before the learner selects **Allow analytics**.
- Consent is stored in local storage and mirrored into a same-site `tradely_analytics_consent` cookie containing only `granted` or `denied`. Server functions require `granted` before reporting.
- The learner can grant or withdraw analytics through **Privacy choices** in the footer. Withdrawal stops capture, resets the PostHog browser identity, and changes the server-consent cookie to `denied`.
- Do Not Track is respected.
- Clerk user ID is the only signed-in identity sent to PostHog. Email address, name, Stripe identifiers, payment details, lesson text, protected media URLs, tokens, and progress timestamps are excluded.
- URL query strings and fragments are removed before browser capture.
- Client and server exception messages/stacks pass through a bounded redaction layer for email, bearer credentials, sensitive query values, Clerk identifiers, and Stripe identifiers.
- The PostHog project anonymizes client IPs. Server events also set GeoIP capture off.
- Autocaptured element text/clicks, session replay, heatmaps, surveys, dead clicks, feature flags, and browser console-log capture remain disabled by the client configuration.
- Browser exception autocapture covers unhandled errors and promise rejections only after consent. Caught route, billing, and lesson-completion errors use the same bounded redaction layer.
- Web vitals include LCP, CLS, FCP, and INP without DOM attribution.

## Event contract

All product events carry:

- `app = tradely`
- `environment = production | preview | local`
- `event_schema_version = 1`

The primary learning journey is:

1. `$pageview` and `page_viewed`
2. `lesson_opened`
3. `lesson_video_started`
4. `tradingflow_link_opened`
5. `lesson_video_completed`
6. `lesson_completed`

Membership events are `membership_cta_clicked`, `billing_action_started`, `billing_action_redirected`, `billing_action_failed`, and `billing_checkout_returned`. A checkout return is explicitly marked `estimate: true`; it is not authoritative proof of payment, subscription activation, recognized revenue, or MRR.

Reliability events are `$exception`, `$web_vitals`, `billing_status_unavailable`, and `lesson_progress_save_failed`.

The live PostHog definitions for `page_viewed`, `analytics_consent_updated`, `auth_sign_in_opened`, `lesson_opened`, and `billing_checkout_returned` are verified and tagged. Other typed events should be verified only after the live project actually ingests them.

## Server exception coverage

Consent-gated server exceptions use the same Clerk ID as the client distinct ID when signed in; anonymous failures use `tradely-server`. Bounded properties are:

- `source = access | billing | lesson | media | progress`
- `operation`
- optional `lesson_id` and `action`
- `runtime = vercel_function | node`
- deployment `release` when Vercel provides a commit SHA

Expected customer states such as signed-out billing, already-active membership, or missing customer linkage are not paged. Stripe/DB/media configuration failures and unexpected access/progress failures are captured immediately so serverless execution does not end before delivery.

## Environment configuration

Runtime capture:

```text
VITE_POSTHOG_KEY=<browser-visible PostHog project token>
VITE_POSTHOG_HOST=https://us.i.posthog.com
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

`POSTHOG_CLI_API_KEY` must remain a sensitive Vercel build variable and must never be prefixed with `VITE_`, printed, or committed. The active `Tradely source maps` key is restricted to project `582920` and `error_tracking:write`; PostHog disables organization-level scopes on project-restricted keys. The Rollup plugin injects chunk IDs, uploads client and server source maps under release name `tradely-web`, and deletes maps after a successful upload.

Tradely sends directly to PostHog US Cloud and must not reuse TradingFlow's proxy, project, alert destination, or customer identity boundary.

## Error alerting

PostHog Error Tracking is enabled and connected to the TradingFlow Slack workspace with a dedicated Tradely channel, `#tradely-posthog-errors`. Three active workflows send to that channel:

- issue created: `01a04ebc-7896-0000-6f22-a0c98e01840a`
- issue reopened: `01a04ebc-a45a-0000-c5cb-e0f2729f3cd0`
- issue spiking: `01a04ebc-c7a3-0000-a242-be6151f57a65`

The issue-created workflow completed a successful PostHog test invocation against the Slack destination. Real production paging remains unproven until a deployed production exception creates, reopens, or spikes an issue.

Do not configure grouping, suppression, severity, or assignment rules before real production issues establish the failure shapes. Premature suppression can hide first-deployment defects.

## Verification

Before release:

1. Load the app with no stored consent and confirm there are no requests to PostHog ingestion.
2. Choose **Use necessary only** and confirm capture remains silent and the consent cookie is `denied`.
3. Choose **Allow analytics** and verify one `$pageview` plus one `page_viewed` event for the current route and a `granted` consent cookie.
4. Navigate between routes and confirm query strings are absent from captured URLs.
5. Sign in and verify the PostHog distinct ID is the Clerk user ID without email person properties.
6. Trigger a controlled caught browser error and a controlled consented server error in a non-production environment; verify redaction and issue grouping.
7. Withdraw consent and confirm subsequent browser and server actions emit no PostHog requests.
8. Build with source-map variables and verify the output reports successful uploads.
9. Verify PostHog Symbol sets contains valid uploaded files for the deployed release.
10. After deployment, require observed `environment = production` page views, web vitals, and exception readiness before calling observability live.
