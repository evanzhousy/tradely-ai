# PostHog setup verification — 2026-09-08

Tradely uses [PostHog project 582920](https://us.posthog.com/project/582920)
and the existing [Learning & Reliability dashboard](https://us.posthog.com/project/582920/dashboard/2043620).
The dashboard has 28 panels. The [observability contract](OBSERVABILITY.md)
defines consent, event ownership, identity, release attribution, and the deployment variables.
Its August live snapshots are historical; this note records the September setup check.

## Live configuration

- Added and read back the authorized URLs `https://tradely.ai` and
  `https://www.tradely.ai`. Both belong to Vercel project `tradely-ai-web`.
- The local browser project token matches project 582920. Values remain in ignored
  environment files; no token or source-map credential was added to Git.
- US ingestion remains `https://us.i.posthog.com`, with UI/control at
  `https://us.posthog.com`.
- Existing IP anonymization, production/test filters, dashboard visibility,
  and consent requirements remain in effect. Replay and heatmaps remain disabled.
- The seven-day production pageview monitor returned 11 events before this
  verification. Production release `7daa04c72c545b0ed886296af811aa21496346eb`
  appeared in PostHog and matched the deployment serving the two production domains.

Authorized URLs configure PostHog's website/toolbar allowlist; they do not turn on
autocapture, replay, or consent-free collection. See the
[PostHog authorized URL documentation](https://posthog.com/docs/health-checks/authorized-urls).

## Browser SDK repair

The previous client enabled web vitals and automatic exceptions while also
disabling external dependency loading. Its `posthog-js` import did not include
those optional modules. A consented production browser had no error handler or
web-vitals callbacks installed; the seven-day production query returned no web vitals.
Zero automatic errors was therefore insufficient evidence of application health.

`getPostHogClient` now loads the pinned `exception-autocapture` and `web-vitals`
modules alongside the existing lazy SDK import, before initialization. External
script loading stays disabled. Unknown or denied consent still avoids loading
the SDK through `AnalyticsProvider`.

Automatic errors now pass through serialized exception redaction in `before_send`:
bounded messages/chains/frames, sanitized source URLs, no breadcrumbs or local
variable/source-context payloads, and preserved line/column/chunk identifiers for
source-map resolution. This also applies to manually captured browser errors.
See [PostHog's dependency bundling guidance](https://posthog.com/docs/libraries/js).

## Validation and release boundary

- Node 24: all 52 analytics tests passed, including tests using the real SDK for
  automatic exception capture, consent withdrawal, and redaction.
- Workspace type checking, the Vite build with source-map upload disabled, scoped
  Biome checks, and the PostHog credential scan passed. Both extension chunks were
  present in the build output.
- Browser verification on `http://127.0.0.1:8252`: no SDK or ingestion requests
  before consent or after choosing necessary-only; both extensions loaded after
  consent, and route navigation emitted `$pageview` and `page_viewed`.
- PostHog returned 6 local page views and 2 local web-vitals events for that origin
  during the verification window, with test accounts included explicitly. These
  are controlled local probes, not production/customer activity.
- The full suite returned 334 passing tests and one failure in the pre-existing
  auth migration: `src/server/auth.server.test.ts`, `has no identity when auth is
  disabled`, with `readAuthSession(...).catch is not a function`. The PostHog repair
  does not edit that migration.

The authorized-domain changes are live. The browser repair requires an authorized
deployment; no push, application deployment, or source-map upload was performed
by this setup task. After deployment, confirm production `$web_vitals` carry the
new release and verify uploaded symbol sets for that release. Real production
exception alert delivery remains a separate verification gate.
