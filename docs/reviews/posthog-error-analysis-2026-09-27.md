# PostHog error analysis — 2026-09-27

## Executive assessment

### Doing well

- **Project attribution is trustworthy for this run.** Every project-scoped
  query returned Tradely project 582920 provenance, resolving the connector
  routing problem that blocked exact reconciliation in the prior run.
- **Production and local evidence are separated correctly.** The analysis used
  `app = tradely` and `environment = production` for customer-impact findings,
  and kept all 79 local exceptions out of the production result.
- **The production deployment was available.** The latest deployment was Ready
  and owned both `tradely.ai` and `www.tradely.ai`; Vercel reported no grouped
  runtime-error clusters during the seven-day window.
- **Error evidence is actionable without weakening privacy.** Source maps and
  release metadata identified the historical `allowed` failure as a
  client/server deployment-contract mismatch. The persistence diagnostic exposed
  the bounded `learning_open` operation while still withholding raw database and
  learner data.

### Doing poorly / needs attention

- **Current PostHog production coverage is insufficient.** Both 24-hour windows
  contained zero captured production events and zero production page views,
  despite Vercel recording current production requests. Error absence therefore
  cannot establish current reliability.
- **The learning-open persistence failure is unresolved.** Four production
  occurrences remain attributed only to the redacted `learning_open` operation;
  the underlying database or request failure has not been correlated.
- **A deployment broke response compatibility for a cached client.** An older
  browser release read `page.access.allowed` after the newer server response had
  removed `access`. It was a one-off historical failure, but it demonstrates that
  server-function response changes were not safe across deployment skew.
- **The cause of the analytics coverage gap is not yet determined.** This
  data-only run did not generate a consented production journey, so it cannot
  distinguish a lack of consenting users from a managed-proxy or delivery
  failure. That boundary needs direct verification.

## Highest-priority finding

No production `$exception` events or Error Tracking issues were observed in the
current 24-hour window, the preceding 24-hour window, or the seven-day recurrence
window. This is **not a production-health verdict**: PostHog also captured zero
Tradely production events and zero production page views in both 24-hour windows.
The last production event in the seven-day window was recorded on 2026-09-24 at
15:54:02 -04, more than two days before extraction.

The next action is to verify consented production analytics delivery through the
managed proxy before using PostHog error absence as a reliability signal. Vercel
recorded production requests in the current window, while PostHog recorded no
production events. Those request counts are not a visitor or consent denominator,
but they establish that the empty PostHog window cannot be explained as proven
absence of application traffic.

## Scope, project verification, and execution status

- Fixed extraction time T: `2026-09-27T19:10:18Z`.
- Current interval: `[2026-09-26T19:10:18Z, 2026-09-27T19:10:18Z)`.
- Prior interval: `[2026-09-25T19:10:18Z, 2026-09-26T19:10:18Z)`.
- Recurrence interval: `[2026-09-20T19:10:18Z, 2026-09-27T19:10:18Z)`.
- Tradely project timezone: `America/New_York` (UTC-04:00 for this run).
- Verified project: Tradely, project `582920`, organization `FLWOMAN LLC TEAM`.
- Verified authorized application URLs: `https://tradely.ai` and
  `https://www.tradely.ai`.
- Production impact filters: `app = tradely` and `environment = production`.
- Error Tracking reads excluded the project's configured test cohort.
- Query coverage: all statuses, limit 100, offset 0, `hasMore = false` for every
  issue-list window.

Project routing was healthy in this session. `switch-project` selected Tradely
582920, and the current, prior, recurrence, and issue-detail query links all
returned `/project/582920/` provenance. The connector's authoritative `learn`
command was unavailable for this client, so the run used the connected app's
discovered read-only tools and current PostHog documentation instead.

This was a complete read-only analysis for the available PostHog and Vercel
surfaces. It was blocked from declaring production health by missing current
PostHog production exposure. No browser journey was generated because synthetic
production activity is outside this runbook's read-only data-analysis scope.

## Current versus prior activity

| Scope | Current 24h | Prior 24h | Seven-day recurrence |
| --- | ---: | ---: | ---: |
| Production Error Tracking issues | 0 | 0 | 0 |
| Production `$exception` events | 0 | 0 | 0 |
| Production page views | 0 | 0 | 22 from 3 observed people |
| All captured production events | 0 | 0 | 105 |
| Unfiltered `$exception` events | not used for impact | not used for impact | 79 from 3 observed people / 14 sessions |

All 79 unfiltered exceptions were local: 78 browser events from
`localhost:8250` and one `vercel_function` event with `environment = local`.
They are excluded from production impact. The Error Tracking list returned no
issues even without the production property filters because the list read used
the project's test-account exclusion, while the raw reconciliation query did not.

The latest seven-day production deployment was ready at extraction: commit
`6640e5e961580cdb2119954b8823b60adefff0eb`, deployment
`dpl_GDMWc5f8FAnqUMx3EbyLeXFXEXcb`, with both `tradely.ai` and
`www.tradely.ai` aliases. Current-window Vercel runtime logs contained 133 HTTP
200 responses, 48 HTTP 404 responses, and one HTTP 307 response. Vercel reported
no runtime-error clusters for the seven-day window. Request counts can include
bots and repeated requests and are not equivalent to people, sessions, or
consented analytics exposure.

## Ranked production findings

There are no active or recurring production issue groups to rank in the agreed
windows. The operational limitation is ranked separately because it prevents a
healthy-production conclusion.

| Priority | Finding | Evidence | Owner and disposition |
| --- | --- | --- | --- |
| P2 observability | Current production error coverage cannot be interpreted | Zero PostHog production events in both 24-hour windows; last seven-day production event was 2026-09-24 15:54:02 -04; Vercel still recorded current production requests | Analytics delivery / consent boundary. Verify the managed proxy and one ordinary consented production journey without weakening consent or bot filtering. |

## Historical handoff verification

### `Learning persistence unavailable`

[PostHog issue `01a0a0db-cf01-77d1-ae2e-29703dabb1e2`](https://us.posthog.com/project/582920/error_tracking/01a0a0db-cf01-77d1-ae2e-29703dabb1e2)
remains active with medium severity, four occurrences, one diagnostic identity,
and no sessions. It has not recurred since 2026-09-14 12:59:23 -04.

This run recovered the previously missing bounded operation: all four events were
`operation = learning_open`, `runtime = vercel_function`, and release
`f98df769152766f7119ab8bf8c7eaddf3b4bafc4`. The symbolicated frames point to
`reportFailure` and `openLearningImpl` in `src/server/learning.server.ts`. The
source intentionally replaces the raw database exception with the fixed message
to keep bound parameters, learner answers, and attempt state out of analytics.

A Vercel production log query for `learning_open` over
`2026-09-14T16:55:00Z`–`2026-09-14T17:05:00Z` returned no logs. This does not
disprove the PostHog event because the application catches the raw error and emits
the redacted diagnostic separately. The cause remains unresolved. The smallest
next check is authorized database/request evidence for the learning-open path and
the affected release, preserving the existing redaction boundary.

### Historical `allowed` TypeError

[PostHog issue `01a0a0dc-4479-79c1-9bfb-29ab7ac388e9`](https://us.posthog.com/project/582920/error_tracking/01a0a0dc-4479-79c1-9bfb-29ab7ac388e9)
remains active with medium severity but has one occurrence only, last seen
2026-09-14 12:59:41 -04. It has not recurred in the current seven-day window.

Fresh event metadata corrects the earlier report's release attribution. The
browser exception came from release
`304c1ec775daad55cc709e876cb7b42c1da569d7`, not the then-current server
release. Its symbolicated frame is `LessonPage` line 78/79, where that browser
chunk reads `page.access.allowed`. At server release
`f98df769152766f7119ab8bf8c7eaddf3b4bafc4`, the lesson response had removed
the `access` field as part of the free-learning migration. The evidence therefore
supports a cached/old browser chunk calling a newer incompatible server response
contract during deployment skew.

Current source no longer reads `page.access`, so no current code repair is
proposed from this one-off historical event. The reusable prevention is to keep
server-function response contracts backward compatible across rolling deployments
or version them when a cached client can outlive the server release. Production
closure would require current consented exposure and no recurrence; the present
zero-exposure 24-hour windows cannot provide that proof.

## Repair and verification gates

### Production analytics exposure

- Owner: `apps/web/src/analytics/provider.tsx`, managed PostHog proxy/deployment
  configuration, and consent flow.
- Proposed check: use one ordinary, authorized production browser journey that
  grants analytics consent, then verify a bounded `$pageview` / `page_viewed`
  pair and expected host/app/environment properties in project 582920.
- Preserve: no capture before consent or after withdrawal, production bot
  filtering, query sanitization, and the `https://z.tradely.ai` ingestion boundary.
- Success gate: fresh production events in project 582920 with
  `app = tradely`, `environment = production`, and expected production host;
  subsequent error windows must report both error counts and exposure counts.

### Learning-open persistence diagnostic

- Owner: `apps/web/src/server/learning.server.ts` plus the authorized database
  and request-telemetry boundary.
- Proposed check: correlate the four 2026-09-14 `learning_open` diagnostics with
  database/request evidence for release `f98df769...`; do not send raw database
  messages or learner content to PostHog.
- Success gate for any eventual repair: local type/static/build validation, an
  authorized successful learning-open journey on a deployed release, and a
  comparable production observation window with non-zero exposure.

### Deployment-contract compatibility

- Owner: the lesson server-function response contract and route consumer.
- Proposed practice: retain compatible fields or introduce an explicit response
  version when cached clients can cross a deployment boundary.
- Verification gate: exercise an old supported client response consumer against
  the new server contract in an authorized preview before rollout. The historical
  one-off alone does not justify reintroducing the retired paid-access model.

## Reconciliation and limitations

The Error Tracking list and the raw event query agree on zero production issues
and zero production exception events in every agreed window. The raw query also
found 79 local exceptions, all excluded from production impact. The issue list's
test-account filtering explains why those local events did not appear as impact
rows.

PostHog recorded 22 production page views from three observed people in the
seven-day interval, but none after 2026-09-24. Consent, blockers, DNT, bot
filtering, and capture failures mean observed people are not all users. Vercel
request counts do not provide a PostHog exposure denominator, and 404 counts were
not investigated as PostHog issues because Vercel reported no runtime-error
cluster and the request paths were not needed for this run's conclusion.

No replay was opened. No raw person/session IDs, learner answers, coaching text,
payment data, or project token are included in this report.

## Reproducibility appendix

1. `projects-get` and `project-get(582920)` verified the Tradely project,
   timezone, authorized URLs, test cohort, and Error Tracking enablement.
2. `switch-project(582920)` was followed by `$exception` schema reads and four
   issue-list queries whose `_posthogUrl` values all used project 582920.
3. Error Tracking issue-list filters for production were `app = tradely` and
   `environment = production`, status `all`, test accounts excluded, limit 100,
   offset 0. Current, prior, and recurrence results were empty with `hasMore=false`.
4. The unfiltered seven-day Error Tracking read was also empty under the project
   test-account exclusion.
5. Raw `events` queries used exact inclusive-start/exclusive-end UTC timestamps.
   They counted production exceptions for the three windows, grouped all
   seven-day exceptions by provenance, and counted production page views/all
   events for exposure.
6. A history query found 205 `$exception` events since 2026-08-28, including five
   production events. The latest exception was local on 2026-09-27.
7. Historical issue-detail/event reads returned all four persistence events and
   the single TypeError event with no pagination remainder. Identity values were
   excluded from the report.
8. Read-only Git inspection used `git show` and `git diff` for releases
   `304c1ec...` and `f98df769...`; no checkout or reset occurred.
9. Vercel reads covered recent production deployments, seven-day runtime-error
   clusters, current-window status-code aggregates, and a bounded historical
   `learning_open` log search.

## Remaining actions and maintenance

- Verify fresh consented production delivery into project 582920 before treating
  empty error windows as evidence of reliability.
- Correlate the historical `learning_open` persistence failure with authorized
  database/request evidence while preserving fixed-message redaction.
- Treat the old `allowed` TypeError as an evidence-supported deployment-contract
  skew. Keep future server-function response migrations compatible with cached
  clients or explicitly version the response.

No application code, deployment, PostHog issue status/settings, alerts, external
communications, or production data changed. Browser verification was not
performed, so GIF evidence is not applicable.

Runbook maintenance: added exposure checking for zero-error windows, explicit
client-release versus server-deployment comparison for response-contract errors,
and a required evidence-based `Doing well` / `Doing poorly` executive assessment
at the start of future reports; refreshed the live handoff. The assessment-format
follow-up was documentation-only and did not rerun live analysis.
