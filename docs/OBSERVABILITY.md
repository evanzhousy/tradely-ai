# Tradely observability

Tradely sends consented browser observability to PostHog project `582920` (`tradely`) on US Cloud. `AnalyticsProvider` owns SDK initialization, consent, identity, URL sanitization, and the typed event emitter. Product components may emit only events declared in `apps/web/src/analytics/events.ts`.

The pinned operator dashboard is [Tradely — Learning & Reliability](https://us.posthog.com/project/582920/dashboard/2043620). Every saved insight requires `environment = production`, also enables PostHog's test-account filter, and covers consented page views, lesson opens, average FCP, and checkout returns marked as estimates.

## Consent and privacy contract

- PostHog initializes opted out. No analytics events are sent before the learner selects **Allow analytics**.
- The learner can grant or withdraw analytics through **Privacy choices** in the footer. Withdrawal stops capture and resets the PostHog browser identity.
- Do Not Track is respected.
- Clerk user ID is the only signed-in identity sent to PostHog. Email address, name, Stripe identifiers, payment details, lesson text, video URLs, and progress timestamps are excluded.
- URL query strings and fragments are removed before capture.
- The PostHog project discards client IP data after coarse GeoIP enrichment and bot detection; it is not stored with events.
- Autocaptured element text, autocaptured clicks, session replay, heatmaps, surveys, dead clicks, feature flags, and console-log capture are disabled.
- Browser exception autocapture covers unhandled errors and promise rejections only after consent. Caught route, billing, and lesson-completion errors are passed through a bounded redaction layer.
- Web vitals include LCP, CLS, FCP, and INP without DOM attribution.

## Event contract

The primary journey is:

1. `$pageview` and `page_viewed`
2. `lesson_opened`
3. `lesson_video_started`
4. `tradingflow_link_opened`
5. `lesson_video_completed`
6. `lesson_completed`

Membership events are `membership_cta_clicked`, `billing_action_started`, `billing_action_redirected`, `billing_action_failed`, and `billing_checkout_returned`. A checkout return is explicitly marked `estimate: true`; it is not authoritative proof of payment or subscription activation.

Reliability events are `$exception`, `$web_vitals`, `billing_status_unavailable`, and `lesson_progress_save_failed`.

## Environment configuration

```text
VITE_POSTHOG_KEY=<PostHog project token>
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

The project token is browser-visible by design. Never add a PostHog personal API key to a `VITE_` variable.
Tradely sends directly to PostHog US Cloud and must not reuse the TradingFlow reverse-proxy domain; the two products remain separate infrastructure and customer boundaries.

## Verification

Before release:

1. Load the app with no stored consent and confirm there are no requests to PostHog ingestion.
2. Choose **Use necessary only** and confirm capture remains silent.
3. Choose **Allow analytics** and verify one `$pageview` plus one `page_viewed` event for the current route.
4. Navigate between routes and confirm query strings are absent from captured URLs.
5. Sign in and verify the PostHog distinct ID is the Clerk user ID without an email person property.
6. Withdraw consent through the footer and confirm subsequent navigation emits no PostHog requests.
