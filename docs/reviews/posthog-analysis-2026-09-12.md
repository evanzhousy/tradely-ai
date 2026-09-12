# PostHog web and product analysis — 2026-09-12

## Decision summary

Do not use project 582920 for a Tradely product decision yet. The connected
project is named “Tradely,” but its live pageview traffic is on `www.optiondata.io`
and its event taxonomy contains OptionData events, while the registered Tradely
events in source are absent. The highest-priority action is to reconcile the
PostHog project/token/deployment mapping and then rerun this analysis against a
project containing `tradely.ai` production traffic. Any conversion, retention,
revenue, or learning conclusion from the selected project would be invalid.

## Scope and coverage

- Extraction date: 2026-09-12; project queried: 582920, display name `Tradely`.
- Project timezone: `America/New_York`; user access reported as admin.
- Current period: 2026-08-15 00:00:00 through 2026-09-12 00:00:00 (exclusive).
- Prior period: 2026-07-18 00:00:00 through 2026-08-15 00:00:00 (exclusive).
- Queries were read-only HogQL and schema/project reads through the connected
  PostHog app. No dashboard, action, setting, flag, experiment, survey, or data
  was changed. No browser or synthetic traffic was used.
- The project reports authorized URLs `tradely.ai` and `www.tradely.ai`, but
  current pageviews are hosted on `www.optiondata.io`. This is a project/data
  boundary failure, not evidence about Tradely visitors.
- Counts are observed events and distinct PostHog `person_id` values. Consent,
  bot filtering, identity merging, and capture gaps limit population coverage.

## Web analysis (diagnostic only; not Tradely evidence)

The bounded period contains 1,462 `$pageview` events from 406 persons versus
3,002 events from 1,882 persons in the prior period. This cannot be interpreted
as Tradely growth because the route inventory is OptionData. Current pageviews
are concentrated on `www.optiondata.io`: `/` 318, `/realtime_data` 161,
`/survey` 149, `/home` 129, `/billing` 111, `/api_key` 104,
`/option_chain` 102, and `/historical_data` 99.

The live pageview schema does include `$pathname`, `$host`, `$referrer`,
`$referring_domain`, `utm_source`, `$device_type`, `environment`, `release`,
`locale`, and bot classification fields. The sampled current pageviews classify
1,255 as Desktop Regular, 275 Mobile Regular, 8 Tablet Regular, 10 Desktop AI
Agent, and 2 Mobile Bot. These properties are suitable for a future verified
analysis, but the host mismatch prevents using them for Tradely acquisition or
navigation decisions.

Current `$web_vitals` volume is 828 events from 286 persons; prior volume is 640
from 215 persons. The live property names differ from the attempted generic
metric fields: the schema exposes metric-specific fields such as
`$web_vitals_LCP_value`. A future run must verify each metric property before
calculating p75 values. Current `$exception` volume is 116 events from 53
persons versus 101 from 55 persons prior; this is diagnostic volume only and
does not establish customer impact.

## Product analysis

The live taxonomy contains `demo_run`, `billing_action`, `subscription_checkout`,
`cta_click`, `dashboard_section_viewed`, `api_key_action`,
`historical_query_executed`, `market_structure_query_executed`, and
`option_chain_query_executed`. It does not contain the source-registered Tradely
events required by the runbook, including `page_viewed`, `lesson_opened`,
`lesson_exercise_started`, `lesson_exercise_submitted`, `lesson_completed`,
`auth_session_established`, `membership_cta_clicked`, and
`course_pass_access_verified`.

Observed current/prior volumes for the available product-shaped events are:

| Event | Current events / persons | Prior events / persons |
| --- | ---: | ---: |
| `demo_run` | 29 / 5 | 68 / 6 |
| `billing_action` | 12 / 3 | 8 / 4 |
| `subscription_checkout` | 1 / 1 | 1 / 1 |
| `cta_click` | 123 / 68 | 113 / 77 |
| `historical_query_executed` | 6 / 2 | 90 / 1 |
| `market_structure_query_executed` | 3 / 2 | 21 / 4 |
| `option_chain_query_executed` | 2 / 1 | 11 / 3 |

These numbers describe the selected project's captured traffic, not Tradely
learning, billing, or activation. The source contract explicitly says checkout
redirects/returns are intent telemetry and that client events do not prove
payment, mastery, or independent learning; no such claims are made here.

## Evidence and reproducibility

The following reads were executed on 2026-09-12:

1. `posthog_project_get(582920)` — verified project name, timezone, authorized
   URLs, primary dashboard reference, and current settings.
2. `posthog_read_data_schema(kind=events, limit=500)` — verified live event
   taxonomy and recent-event availability.
3. `posthog_read_data_schema(event_name='$pageview', kind=event_properties)` —
   verified route, host, referrer, device, environment, release, locale, and
   traffic properties.
4. HogQL event inventory, period comparison, host/path breakdown, and traffic
   classification queries over the two periods above. The report preserves only
   aggregate outputs; no raw people, emails, secrets, or full property blobs.
5. `posthog_dashboard_get(2043620)` — returned 404 in the active project, so the
   historical dashboard URL could not be treated as current evidence.

The period comparison query grouped `event` and `count()`/`count(DISTINCT
person_id)` after filtering the stated timestamps. Route and host queries grouped
`properties.$host` and `properties.$pathname` for `$pageview`. The event schema
and property schema were read before querying. A separate source review confirms
that Tradely’s typed registry and consent contract live in
`apps/web/src/analytics/events.ts` and `docs/ANALYTICS-SCENARIOS.md`.

## Prioritized actions and gates

1. **Reconcile project ownership (P0).** Verify the Vercel production
   `VITE_POSTHOG_KEY`, PostHog project ID, ingestion host, and deployed release
   against the project selected in the connector. Success requires a fresh
   consented `tradely.ai` pageview with `app=tradely`, `environment=production`,
   and a matching release, while preserving consent and redaction boundaries.
   Stop if the key is unavailable or belongs to another product.
2. **Rerun coverage and funnels (P1).** After the mapping gate passes, repeat the
   runbook for the same two complete periods, first verifying `page_viewed`,
   learning, auth, coaching, and billing event properties. Require sequential
   funnel counts and at least one independent-query reconciliation before any
   product recommendation.
3. **Repair measurement only if needed (P1).** If the verified Tradely project
   still lacks typed events, identify the deployed release and consent state
   causing the gap. Do not create actions or change instrumentation during an
   analysis run; open a scoped implementation task with a separate approval.

## Limitations

The analysis is blocked for Tradely product conclusions by a live project/data
mismatch and a missing dashboard in the active project. No retention cohort,
learning funnel, paid conversion, revenue, replay sample, or causal claim is
valid from this run. This report is a diagnostic finding about observability
configuration, not a statement about OptionData product performance.
