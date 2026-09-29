# PostHog error analysis — 2026-09-29

## Executive assessment

### Doing well

- **Attribution is reliable for this run.** Project metadata and every Error
  Tracking query resolved to Tradely project `582920` in the US organization.
- **Consented production events are arriving.** The current 24 hours contain six
  production events, including one `$pageview` / `page_viewed` pair from one
  observed session. The prior 24 hours contain the eleven events from the
  controlled consent verification. Events have the expected Tradely host,
  environment, browser runtime, and release fields.
- **No production exception or HTTP 5xx was observed in either 24-hour window.**
  The Error Tracking lists and independent raw event query agree on zero
  production `$exception` events; bounded Vercel 5xx log reads were also empty.
- **The latest deployment is available.** Vercel reports release `3fdc431…`
  Ready on both `tradely.ai` and `www.tradely.ai`.

### Doing poorly / needs attention

- **Error coverage remains thin.** The current production window has one
  observed page-view session, and the prior window consists of the known
  controlled consent journey. No consented event was observed on the newest
  release, so zero exceptions cannot establish its reliability.
- **Hashed JavaScript assets returned 404 during a deployment transition.**
  Sixteen distinct asset paths failed on release `45f7709…` within roughly
  30 minutes of its deployment. A browser may have recovered through the
  existing stale build reload handler; these logs do not prove recovery or
  affected user count.
- **Local browser errors rose sharply.** Raw local `$exception` volume was
  133 in the current window versus five in the prior window. Four active,
  test-filtered Error Tracking groups share the `useI18n must be used within
  LocaleProvider` message. All sampled issue events came from
  `localhost:8250`; none was attributed to production.
- **The historical learning-open persistence failure remains unexplained.**
  Its four production diagnostics last occurred on September 14. The bounded
  `learning_open` operation is known, but the underlying database or request
  cause has not been correlated.

## Highest-priority finding and next action

The highest-priority current investigation is the sixteen hashed-asset 404s on
[Vercel deployment `dpl_EgywFP8W7hM8hgDHDvUCE2FyPGrS`](https://vercel.com/evans-projects-3b396257/tradely-ai-web/EgywFP8W7hM8hgDHDvUCE2FyPGrS).
They occurred from approximately 15:53 to 16:10 UTC on September 28, after the
deployment became Ready at 15:41 UTC. The paths include lesson, chart,
walkthrough, and UI chunks. The evidence supports a deployment or cache
transition problem; it does not identify a customer or show a blocked lesson.

Next, hold a supported browser page open across an authorized preview deployment,
navigate into an on-demand lesson, and check whether the stale build handler
reloads once and completes the journey. If a chunk still fails after reload,
inspect asset publication and retention for that deployment. Preserve the
existing consent and error-capture boundaries. This analysis does not change
application code or deployment configuration.

## Scope and collection boundary

- Fixed extraction time T: `2026-09-29T06:02:53Z` (02:02:53 in the project
  timezone, `America/New_York`, UTC−04:00).
- Current: `[2026-09-28T06:02:53Z, 2026-09-29T06:02:53Z)`.
- Prior: `[2026-09-27T06:02:53Z, 2026-09-28T06:02:53Z)`.
- Recurrence: `[2026-09-22T06:02:53Z, 2026-09-29T06:02:53Z)`.
- Verified project: Tradely `582920`; authorized browser hosts are
  `tradely.ai` and `www.tradely.ai`.
- Customer-impact filters: `app = tradely`, `environment = production`, all
  issue statuses, and the project's configured test-account exclusion.
- Each issue list used `limit=100`, `offset=0`, and returned `hasMore=false`.
  The current, prior, and seven-day production lists were empty. No page of
  production issues was omitted.

The PostHog connector's `learn` command was unavailable to this client. Live
tool discovery, schema reads, and the current [PostHog issue-monitoring
documentation](https://posthog.com/docs/error-tracking/monitoring) supplied the
query contract. `switch-project(582920)` was followed by queries whose
`_posthogUrl` identified project `582920`. No results from another project were
used. The independent raw event query does not apply the project's test cohort,
so raw local counts are kept apart from test-filtered issue counts.

## Current, prior, and recurrence counts

| Evidence | Current 24h | Prior 24h | Seven days |
| --- | ---: | ---: | ---: |
| Production Error Tracking issue groups | 0 | 0 | 0 |
| Raw production `$exception` events | 0 | 0 | 0 |
| Captured production events | 6 | 11 | 28 |
| Production `$pageview` events | 1 | 2 | 5 |
| Observed page-view people / sessions | 1 / 1 | 1 / 1 | 3 / 3 |
| Raw local `$exception` events, including test traffic | 133 | 5 | 162 |
| Vercel HTTP 200 responses reported | 176 | 223 | not used as an analytics denominator |
| Vercel HTTP 404 responses reported | 48 | 29 | not summed |
| Vercel HTTP 5xx responses in bounded reads | 0 | 0 | grouped runtime errors returned none |

The prior production analytics events are the controlled consent journey
documented in the [September 28 report](posthog-error-analysis-2026-09-28.md).
The current six events carry release `d0eddd5…`: one `$pageview`, one
`page_viewed`, one `$web_vitals`, one `$pageleave`, and two `locale_changed`.
The page view represents one observed session. The seven-day total also
contains older events from release
`52167f3…`. Do not add `$pageview` and `page_viewed` as separate visits or
sum per-window people into unique people across windows.

The latest captured production event was at 2026-09-28 13:06:31 −04:00. The
newest Vercel deployment, release `3fdc431…`, became Ready at approximately
2026-09-29 05:22 UTC. The captured event precedes it, so this run has no
consented PostHog exposure for the newest release. Vercel request counts can
include scanners, assets, retries, and visitors who did not consent.

## Ranked findings

| Priority | Finding | Evidence and impact | Confidence / owner | Disposition |
| --- | --- | --- | --- | --- |
| P2 investigation | Hashed asset 404s during deployment | 16 distinct asset paths on `45f7709…`, approximately 15:53–16:10 UTC; people and sessions unavailable | High on missing assets, unknown user consequence; web deployment and `stale-build.ts` | Reproduce a browser transition on an authorized preview; verify a single recovery reload and the final lesson state. |
| P2 observability | Sparse consented production exposure | Current: one observed page-view session and zero exceptions; no captured event on newest release | High on coverage limit; analytics and release monitoring | Pair future error verdicts with exposure and active-release identity. Do not call the newest release error-free. |
| P3 local diagnostic | `useI18n` provider errors | Four test-filtered issue groups, 92 displayed occurrences across seven days; sampled events all on localhost | High on local origin, unresolved trigger; local app/provider tree | Reproduce with a clean local build before changing provider ownership; do not attribute to customers. |
| P3 historical | Learning persistence unavailable | Four production occurrences on September 14; no seven-day recurrence | Confirmed diagnostic, underlying cause unresolved; learning server/database | Correlate `learning_open` with authorized request/database evidence while retaining redaction. |

The current 404 path breakdown contains 16 hashed asset requests and 32
scanner or sitemap probes, including WordPress and XML-RPC paths. The prior
window's 29 404s were mostly scanner, generic contact, and missing file paths;
one `/llms.txt` request returned a bounded 404. The one-off `/llms.txt` 500
found in the earlier run did not recur as a 5xx in either current comparison
window. An empty grouped-runtime-error result was cross-checked with explicit
5xx log reads before making that statement.

## Deep dives

### Deployment asset requests

The sixteen asset 404s were all logged against deployment
`dpl_EgywFP8W7hM8hgDHDvUCE2FyPGrS` (release `45f7709…`). Vercel returned
individual paths and times for that deployment after a broad ungrouped log read
timed out. The current source has `useReloadOnStaleBuild()` in the root route
and an error-page fallback. They attempt one reload for Vite preload or dynamic
import failure, with a 30-second guard against loops. The logs do not expose
whether the handler ran or the lesson recovered. No replay was used because
no matching production exception or session was identified.

Proposed verification gate: keep an old page mounted across a preview deploy,
load a lazy lesson asset, observe any 404, and confirm one reload reaches the
new build. If it does not, investigate Vercel asset retention and error-path
coverage. Production closure requires a deployed fix, a successful affected
journey, and a later window with comparable traffic and no supported-path
asset failures.

### Local `useI18n` issue groups

The seven-day project-wide issue list with the test cohort excluded returned
four active groups: [root metadata](https://us.posthog.com/project/582920/error_tracking/01a0de4f-9af0-7143-a1ca-a128d3053b41)
(70 displayed occurrences), [course page](https://us.posthog.com/project/582920/error_tracking/01a08287-0be6-73f3-ad84-09b708469a04)
(12), [pricing page](https://us.posthog.com/project/582920/error_tracking/01a0e977-c220-71b1-8c5c-bc88bc48995e)
(8), and [lesson page](https://us.posthog.com/project/582920/error_tracking/01a0e98a-f513-76d0-a35c-4a060a79e175)
(2). All sampled URLs were `http://localhost:8250`; issue counts and people
must not be summed as unique incidents or users. The raw event query, which
includes test traffic, found 162 local exceptions across fourteen issue IDs.

Current source places `LocalizedDocumentMetadata` and the route outlet inside
`AppProviders`, which contains `LocaleProvider`. The sampled local Vite frames
prove the thrown hook, but do not prove why its context was absent during those
renders. A clean local reproduction would distinguish an app provider defect
from development reload or duplicate module state. No production issue shares
this event provenance.

### Historical production handoff

[Learning persistence unavailable](https://us.posthog.com/project/582920/error_tracking/01a0a0db-cf01-77d1-ae2e-29703dabb1e2)
remains active with four production occurrences, one diagnostic identity, zero
sessions, and last seen 2026-09-14 12:59:23 −04:00. The captured operation is
`learning_open` on release `f98df769…`. It deliberately replaces raw database
errors to avoid sending parameters and learner content. The database/request
cause remains unresolved.

The historical [`allowed` TypeError](https://us.posthog.com/project/582920/error_tracking/01a0a0dc-4479-79c1-9bfb-29ab7ac388e9)
also remains active but last occurred on September 14 (one occurrence, one
observed session). Existing release and source evidence supports an old browser
chunk reading `page.access.allowed` after a newer server response removed
`access`. It did not recur in this seven-day window. Preserve or version
server-function response contracts across deployments.

## Reproducibility and limitations

The following were executed against project `582920` at fixed T:

1. Error Tracking issue lists for the three windows with status `all`, test
   exclusion, `app=tradely`, `environment=production`, `limit=100`, and
   `offset=0`; each returned zero rows and `hasMore=false`. The project-wide
   current and seven-day lists used the same time/status/test settings without
   app/environment filters; they returned four local groups.
2. PostHog schema reads confirmed `$exception` properties `app`,
   `environment`, `$host`, `runtime`, `release`, and issue ID; information-schema
   reads confirmed the `events` table and the `event`, `timestamp`,
   `properties`, `person_id`, and `$session_id` columns.
3. The independent production aggregate executed this HogQL (the other raw
   queries used the same seven-day bounds and grouped `$exception` by
   app/environment/host/runtime or local issue ID):

   ```sql
   WITH scoped AS (
     SELECT timestamp, created_at, event, person_id,
       $session_id AS session_id,
       properties.$host AS host,
       properties.release AS release
     FROM events
     WHERE timestamp >= toDateTime('2026-09-22T06:02:53Z')
       AND timestamp < toDateTime('2026-09-29T06:02:53Z')
       AND properties.app = 'tradely'
       AND properties.environment = 'production'
   )
   SELECT 'current_24h' AS window, count() AS events,
     countIf(event = '$exception') AS exceptions,
     countIf(event = '$pageview') AS pageviews,
     uniqIf(person_id, event = '$pageview') AS pageview_people,
     uniqIf(session_id, event = '$pageview') AS pageview_sessions,
     max(timestamp) AS latest_event
   FROM scoped
   WHERE timestamp >= toDateTime('2026-09-28T06:02:53Z')
   UNION ALL
   SELECT 'prior_24h', count(), countIf(event = '$exception'),
     countIf(event = '$pageview'),
     uniqIf(person_id, event = '$pageview'),
     uniqIf(session_id, event = '$pageview'), max(timestamp)
   FROM scoped
   WHERE timestamp >= toDateTime('2026-09-27T06:02:53Z')
     AND timestamp < toDateTime('2026-09-28T06:02:53Z')
   UNION ALL
   SELECT 'recurrence_7d', count(), countIf(event = '$exception'),
     countIf(event = '$pageview'),
     uniqIf(person_id, event = '$pageview'),
     uniqIf(session_id, event = '$pageview'), max(timestamp)
   FROM scoped
   ```

   A separate `$exception` query grouped the seven-day window by app,
   environment, host, and runtime. Local counts used `environment='local'`
   with the same windows; issue groups were also aggregated by
   `$exception_issue_id`.
4. Issue-detail/event reads covered the four test-filtered local groups and
   rechecked both historical production issues. Sampled local frames were
   inspected without retaining person IDs, session IDs, learner content, or
   raw replay.
5. Vercel reads covered recurrence-window production deployments, current/prior
   status-code counts, explicit 5xx reads, 404 path groups, and the individual
   asset 404s on deployment `dpl_EgywFP8W7hM8hgDHDvUCE2FyPGrS`.

The production issue and raw-event counts agree at zero. There is insufficient
consented exposure on the newest release to infer reliability. The broad asset
log query timed out; a bounded deployment query returned the sixteen relevant
asset rows. This run did not open replay, generate synthetic traffic, perform a
browser journey, change code, or mutate external issue/deployment state. No GIF
evidence is required for this data-only run.

## Remaining actions and maintenance

- Reproduce a supported browser across a preview deployment and verify the
  stale-build reload completes a lesson after an asset 404.
- Correlate the historical `learning_open` failure with authorized
  database/request evidence while retaining fixed-message redaction.
- Reproduce the local `useI18n` provider error on a clean local build if it
  persists; sampled events do not establish production customer impact.

Runbook maintenance: no durable procedure change was needed. The handoff was
pruned and refreshed with the current asset and local-error evidence.
