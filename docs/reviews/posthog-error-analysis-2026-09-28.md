# PostHog error analysis — 2026-09-28

## Executive assessment

### Doing well

- **Project attribution is trustworthy.** Project discovery, metadata, schema,
  Error Tracking lists, and issue details all resolved to Tradely project 582920.
- **Production and local evidence remain separated.** All 79 raw exception
  events in the recurrence window were local and were excluded from customer
  impact; production queries used `app = tradely` and
  `environment = production`.
- **The current deployment is available.** Deployment
  `dpl_GDMWc5f8FAnqUMx3EbyLeXFXEXcb` is Ready, serves both production domains,
  and had no explicit 5xx response in the current 24-hour log breakdown.
- **The current window improved at the deployment boundary.** The prior window's
  single `/llms.txt` 500 and hashed-asset 404 pattern did not recur in the
  current path/status evidence.
- **Privacy boundaries still support useful diagnosis.** The historical
  persistence issue remains narrowed to `learning_open`, and the prior
  `allowed` TypeError remains symbolicated without exposing learner or database
  payloads.

### Doing poorly / needs attention

- **Current PostHog production coverage is still absent.** Both 24-hour windows
  contained zero captured production events and zero production page views,
  while Vercel recorded hundreds of production responses. PostHog cannot
  establish current application reliability from these windows.
- **The analytics coverage gap has no confirmed cause.** This data-only run
  cannot distinguish no consenting visitors from consent, managed-proxy, or
  delivery failure.
- **The prior deployment window contained one HTTP 500.** `GET /llms.txt`
  returned 500 on deployment `dpl_9mnXw9sPH3XwiYU6Vy9uAr1BS5C8`; no repository
  route owns that path, and the current window returns it as 404 instead.
- **The prior window contained a stale-asset pattern.** At least 23 of the 44
  prior 404 responses in the displayed path breakdown targeted hashed JavaScript
  assets. This supports deployment/cache skew but lacks user/session evidence.
- **Historical persistence remains unresolved.** Four production
  `learning_open` diagnostics are still active in PostHog without correlated
  database/request evidence.

## Highest-priority finding

No production `$exception` events or Error Tracking issues were observed in the
current 24-hour window, preceding 24-hour window, or seven-day recurrence window.
This is not a healthy-production verdict: PostHog also captured zero production
events in both 24-hour windows. The latest production analytics event in the
recurrence window remains 2026-09-24 15:54:02 -04.

The next action is a normal, authorized, consented production delivery check
through `https://z.tradely.ai`, followed by project-scoped verification of the
expected `$pageview` / `page_viewed` pair. Preserve opt-in consent, DNT, bot
filtering, sanitization, and the existing proxy boundary.

## Scope, project verification, and execution status

- Fixed extraction time T: `2026-09-28T05:50:21Z`.
- Current interval: `[2026-09-27T05:50:21Z, 2026-09-28T05:50:21Z)`.
- Prior interval: `[2026-09-26T05:50:21Z, 2026-09-27T05:50:21Z)`.
- Recurrence interval: `[2026-09-21T05:50:21Z, 2026-09-28T05:50:21Z)`.
- Project timezone: `America/New_York` (UTC-04:00 during this run).
- Verified project: Tradely `582920`, organization `FLWOMAN LLC TEAM`.
- Verified application URLs: `https://tradely.ai` and
  `https://www.tradely.ai`.
- Production filters: `app = tradely`, `environment = production`; Error
  Tracking also excluded the configured test cohort.
- Issue-list coverage: all statuses, limit 100, offset 0, `hasMore = false` in
  every window.

The connector's authoritative `learn` command remained unavailable, so the run
used discovered live tools and current PostHog documentation. All returned
Error Tracking URLs used `/project/582920/`; no mixed-project result was used.

This was a read-only operational run. It completed PostHog issue and raw-event
reconciliation plus bounded Vercel deployment/status/path evidence. It remains
blocked from a production-health conclusion by zero current PostHog production
exposure. No browser activity was generated.

## Current versus prior activity

| Scope | Current 24h | Prior 24h | Seven-day recurrence |
| --- | ---: | ---: | ---: |
| Production Error Tracking issues | 0 | 0 | 0 |
| Production `$exception` events | 0 | 0 | 0 |
| Production page views | 0 | 0 | 22 from 3 observed people |
| All captured PostHog production events | 0 | 0 | 105 |
| Unfiltered `$exception` events | not used for impact | not used for impact | 79 from 3 observed people / 14 sessions |
| Vercel HTTP 200 responses | 216 | 216 | not used as analytics exposure |
| Vercel HTTP 404 responses | 30 | 44 | not used as product-error count |
| Vercel HTTP 500 responses | 0 observed | 1 | 1 observed |

The 79 recurrence-window exceptions were 78 local browser events from
`localhost:8250` plus one local `vercel_function` event without a browser host.
The Error Tracking list returned no rows under the project's test-account
exclusion; the independent raw query did not apply that cohort exclusion.

Current 404 paths were primarily generic scanner probes, including WordPress,
credential-file, and admin paths. Two identical requests targeted
`/api/session/properties`; no repository route owns that path, and no associated
exception or demonstrated user journey was available. The prior breakdown
contained at least 23 displayed requests for obsolete hashed JavaScript assets,
plus scanner paths. A full prior 404 log-page read timed out, so those path counts
are the bounded evidence surface.

## Ranked findings

| Priority | Finding | Impact and evidence | Confidence | Owner / disposition |
| --- | --- | --- | --- | --- |
| P2 observability | Current PostHog error coverage cannot be interpreted | Zero PostHog production events in both 24-hour windows, despite 216 Vercel 200 responses in each | High on the gap; unresolved cause | Analytics delivery/consent. Verify one ordinary consented production journey and ingestion. |
| P3 | Prior stale hashed-asset 404 pattern | At least 23 displayed asset 404s in the prior window; none in the current returned path list; no affected people/sessions available | Medium | Deployment/cache boundary. Treat as possible cached-client skew; do not claim customer impact without journey/session evidence. |
| P3 | One prior `/llms.txt` 500 | One request on `dpl_9mn...`; current path evidence shows one 404 instead; no repository route owner or recurrence | High on occurrence, low on product impact | Framework/fallback boundary. Confirm whether `llms.txt` is intentionally unsupported; otherwise add an explicit static/route response in a separately authorized implementation. |
| P3 watch | Two current `/api/session/properties` 404s | Same timestamp and current deployment; no source owner, exception, or user impact | Low | Unattributed external/probe request. Revisit only if it recurs or gains an application caller. |

There were no PostHog production issue groups to rank. The Vercel findings are
kept separate because request volume is not equivalent to affected users or
consented sessions.

## Historical handoff verification

### Learning persistence unavailable

[Issue `01a0a0db-cf01-77d1-ae2e-29703dabb1e2`](https://us.posthog.com/project/582920/error_tracking/01a0a0db-cf01-77d1-ae2e-29703dabb1e2)
remains active, medium severity, with four occurrences, one diagnostic identity,
zero sessions, and no recurrence after 2026-09-14 12:59:23 -04. The bounded
operation remains `learning_open` on release `f98df769...`.

Cause remains unresolved. The next discriminating check is authorized
database/request evidence for the learning-open path and affected release. Raw
database errors, bound parameters, answers, and attempt state must remain outside
PostHog.

### Historical `allowed` TypeError

[Issue `01a0a0dc-4479-79c1-9bfb-29ab7ac388e9`](https://us.posthog.com/project/582920/error_tracking/01a0a0dc-4479-79c1-9bfb-29ab7ac388e9)
remains active, medium severity, with one occurrence and no recurrence after
2026-09-14 12:59:41 -04. Existing evidence still supports cached browser release
`304c1ec...` reading `page.access.allowed` after server release `f98df769...`
removed that response field. No current source repair is proposed; future
server-function response changes should remain compatible across deployments or
use explicit versioning.

## Repair and verification gates

### Production analytics exposure

- Owner: PostHog client/provider, consent state, managed proxy, and deployment
  configuration.
- Check: complete one normal authorized production journey after granting
  analytics consent, then verify bounded events in project 582920 with
  `app=tradely`, `environment=production`, the expected host, and current release.
- Preserve: no capture before consent or after withdrawal, DNT, bot filtering,
  URL/property redaction, and the managed proxy.
- Success: a fresh `$pageview` / `page_viewed` pair and subsequent comparable
  exposure counts for error observation.

### Deployment/cache boundary

- Owner: deployment asset lifecycle and server-function response contracts.
- Check: verify supported clients do not request removed hashed assets across a
  deployment transition and that changed server responses remain compatible with
  cached clients.
- Success: no supported-path chunk/asset load failure in an authorized preview
  transition; production closure requires fresh exposure and non-recurrence.

### Fallback routes

- Owner: web route/static-asset policy.
- Check: decide whether `/llms.txt` is intentionally unsupported. If unsupported,
  it should remain a bounded 404 without throwing; if supported, implementation
  requires a separate content decision and authorization.
- Success: expected response status on the deployed route and no server error.

## Reconciliation and limitations

The Error Tracking list and raw event query agree on zero production exceptions
in all fixed windows. Raw events additionally show 79 local exceptions, excluded
from production impact. Production exposure is non-zero only in the seven-day
window and stopped on September 24.

Vercel's grouped runtime-error surface returned no clusters, but explicit
status-code logs returned one prior 500. The status-code evidence therefore owns
that occurrence. The prior detailed 404 read timed out; only the complete grouped
count and returned top path breakdown are used. Vercel requests may include bots,
scanners, retries, and assets and cannot substitute for people or sessions.

No replay was opened. No raw person/session IDs, learner content, database
payload, payment data, or credentials are included.

## Reproducibility appendix

1. Project list/get verified Tradely 582920, timezone, authorized URLs, privacy
   settings, test cohort, and enabled Error Tracking/replay/heatmaps.
2. `switch-project(582920)` was followed by `$exception` schema/value reads and
   four issue lists whose `_posthogUrl` values all used project 582920.
3. Issue lists used exact windows, status `all`, limit 100, offset 0, and test
   exclusion. Production lists also used `app=tradely` and
   `environment=production`.
4. Information-schema discovery confirmed `events` and its current columns before
   raw HogQL execution.
5. Raw aggregate queries reconciled production exceptions, all exception
   provenance, production exposure, and production event taxonomy.
6. Historical issue-detail reads reverified status, severity, impact, and last
   occurrence for the two handoff issues.
7. Vercel reads covered five recurrence-window deployments, current/prior status
   counts, seven-day grouped runtime errors, the prior 500, and current/prior 404
   path breakdowns. The ungrouped prior 404 query timed out and is not evidence.
8. Source search found no repository owner for `/llms.txt` or
   `/api/session/properties`.

## Remaining actions and maintenance

- Verify fresh consented production delivery into PostHog project 582920.
- Correlate the historical `learning_open` failure with authorized
  database/request evidence while preserving fixed-message redaction.
- Check deployment-transition compatibility for cached hashed assets and
  server-function responses before future rollout conclusions.
- Decide whether `/llms.txt` is intentionally unsupported; keep unsupported
  probes fail-closed as 404 rather than 500.

No application code, deployment, issue state/settings, alerts, production data,
or external communications changed. Browser verification was not performed, so
GIF evidence is not applicable.

Runbook maintenance: added same-window Vercel status/path reconciliation when
PostHog exposure is absent, and clarified that explicit 5xx logs outrank an empty
grouped-runtime-error result.
