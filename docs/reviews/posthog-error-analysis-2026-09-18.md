# PostHog error analysis — 2026-09-18

## Highest-priority finding

The current 24-hour production-filtered view for Tradely showed **no active error
issues**. Over the seven-day recurrence window, however, the authenticated
PostHog project UI for Tradely (project 582920) showed **2 production-matching
issue groups with 5 total occurrences**. The most important unresolved production
finding is `Learning persistence unavailable`: 4 occurrences for one observed
user, last seen 2026-09-14 12:59:23 -04. The application deliberately emits this
redacted diagnostic when a learning persistence operation fails so database
parameters and learner data are not sent to analytics.

The next action is to correlate that timestamp and the captured `operation`
property with server/database evidence. A bounded Vercel production log search
and runtime-error query covering 2026-09-14 16:45–17:15Z returned no matching
runtime evidence, so the underlying database/request failure remains unresolved.
Do not weaken the redaction boundary to obtain more detail.

## Scope, project verification, and execution status

- Fixed extraction time T: `2026-09-18T08:55:51Z`.
- Current interval: `[2026-09-17T08:55:51Z, 2026-09-18T08:55:51Z)`.
- Prior interval: `[2026-09-16T08:55:51Z, 2026-09-17T08:55:51Z)`.
- Recurrence interval: `[2026-09-11T08:55:51Z, 2026-09-18T08:55:51Z)`.
- Tradely project timezone: `America/New_York` (UTC-04:00 for this run).
- Verified PostHog project: Tradely, project 582920.
- Production filter used for customer-impact ranking: `environment = production`.
- Test users are filtered by default in the Tradely project metadata.

The PostHog connector has a project-routing defect in this session. Its
`switch-project` call reported a successful switch to Tradely 582920, but the
next schema, trends, and error-tracking reads still returned query provenance for
project 90561 (OptionData). Those connector reads were therefore excluded from
Tradely impact counts. Project-scoped error evidence below comes from the
authenticated PostHog UI at project 582920.

The current UI `Last 24 hours` view returned no issues. That read was taken close
to fixed T and supports zero observed current active groups, but the connector
routing defect prevented an exact raw-event aggregate for the fixed interval.
The seven-day project-wide UI showed 7 active groups / 25 displayed occurrences.
After applying `environment = production`, only 2 groups / 5 displayed
occurrences remained. The five visual-learning/browser groups from September
15–16 therefore must not be described as confirmed production customer impact.

## Current versus prior activity

| Scope | Current 24h | Prior 24h | Seven-day recurrence |
| --- | ---: | ---: | ---: |
| Production-filtered Tradely issues | 0 active groups observed | 0 inferred active groups | 2 groups / 5 occurrences |
| Project-wide/unattributed issues | 0 active groups observed | at least 2 groups / 3 occurrences | 7 groups / 25 occurrences |

The prior production count is an inference from the production-filtered seven-day
list: its only two matching issues were both last seen on September 14, before the
prior interval. The project-wide prior lower bound comes from two issues last seen
inside the prior interval: one pointer-capture occurrence and two LazyMotion
occurrences. Exact per-window issue-event totals could not be independently
queried because connector reads continued to route to project 90561.

## Ranked production findings

| Priority | Issue ID / issue | Observed impact | Evidence / confidence | Owner and disposition |
| --- | --- | --- | --- | --- |
| P2 | `01a0a0db-cf01-77d1-ae2e-29703dabb1e2` — `Learning persistence unavailable` | 4 occurrences; 1 observed user; sessions unavailable; last seen 2026-09-14 12:59:23 -04 | Confirmed production diagnostic; underlying cause unresolved | Learning persistence / server. Correlate captured operation with Vercel/database evidence; preserve redaction. |
| P3 | `01a0a0dc-4479-79c1-9bfb-29ab7ac388e9` — `Cannot read properties of undefined (reading 'allowed')` | 1 occurrence; 1 session; 1 observed user; last seen 2026-09-14 12:59:41 -04 | Confirmed production issue; no demonstrated blocked journey; PostHog attributes `LessonPage` / `src.routes.learn`, but exact failing expression is not recoverable from the deployment revision | Learning route / release mapping. Reproduce against the affected release or recover symbolicated event detail before changing code. |

These priorities describe the demonstrated scope in this run. Neither issue had
current-window recurrence, and there is not enough evidence to claim a resolved
production defect without release-matched journey verification and comparable
traffic exposure.

## Production deep dives

### Learning persistence unavailable

Current source in
[`apps/web/src/server/learning.server.ts`](../../apps/web/src/server/learning.server.ts)
uses `reportFailure(operation)` to capture a synthetic `Learning persistence
unavailable` exception with only `source=learning` and the operation name. The
comment explicitly forbids sending raw database errors because they may contain
bound parameters, learner answers, or attempt state. This is a deliberate privacy
boundary and should remain intact.

At the issue timestamp, the latest production deployment was commit
`f98df769152766f7119ab8bf8c7eaddf3b4bafc4` (`fix: give learning evidence room
in course summary`), deployed to `tradely.ai` / `www.tradely.ai` and ready before
the PostHog occurrence. The next production deployment in the live Vercel history
was later that day, so this is the correct release boundary for correlation.

A Vercel production runtime-log search for `Learning persistence unavailable`
from 2026-09-14 16:45Z through 17:15Z returned no matching logs. A runtime-error
cluster query for the same window also returned no errors. This does not refute
the PostHog event: the application intentionally creates the redacted exception
for analytics rather than rethrowing the raw database failure. Root cause remains
unresolved until the recorded operation can be correlated with database/request
telemetry at the same boundary.

Proposed verification gate: identify the captured operation from the PostHog
issue/event, inspect authorized server/database telemetry for that operation and
time range, then reproduce the operation in an authorized environment. Any fix
must preserve owner scoping and the existing redaction boundary. Production
resolution additionally requires a verified deployed release plus a successful
affected journey and a comparable observation window.

### `allowed` TypeError in LessonPage

PostHog reports a production TypeError, `Cannot read properties of undefined
(reading 'allowed')`, in `LessonPage` / `src.routes.learn`, with one occurrence,
one session, and one observed user. The affected production deployment was the
same `f98df769...` release.

Inspection of that revision does not reveal a direct `.allowed` property read in
the lesson route. The route contains an `accessState = page.found ? "allowed" :
null` value, but that string assignment cannot by itself explain the exception.
Current source has since changed substantially. Without the exact symbolicated
frame or a release-matched reproduction, ownership below the route level remains
provisional.

Proposed verification gate: recover the issue event's release/chunk/frame detail
or reproduce on the affected revision, then map the failure to the exact
expression before changing code. Do not treat later route refactors as proof the
issue was fixed.

## Non-production or unattributed project issues

The seven-day unfiltered Tradely project view showed five additional
visual-learning/browser issue groups that did not remain after applying
`environment = production`:

| Issue ID / issue | Seven-day displayed occurrences | Last seen | Source-level observation |
| --- | ---: | --- | --- |
| `01a0ab75-52a2-7663-b45c-63bbdf0c15dc` — pointer-capture `NotFoundError` | 1 | 2026-09-16 14:23:04 -04 | `use-slider.ts` calls `setPointerCapture`; likely pointer-state race. Guard/catch only if reproduced in a supported path. |
| `01a0ab73-0cc9-7fa1-8b83-40e730a596a7` — LazyMotion strict-mode error | 2 | 2026-09-16 14:20:35 -04 | Current learning motion uses `m` under strict `LazyMotion`; ownership remains provisional because the reported source is dependency-shaped. |
| `01a0a5e8-66c0-72b0-9e55-4a75c7edcc14` — Rive `BindingError` for deleted Artboard | 2 | 2026-09-15 12:31:23 -04 | Likely native-object disposal/queued-callback race; current Rive canvas contains defensive lifetime checks, but release timing must be matched before claiming resolution. |
| `01a0a45d-3f6a-7f20-b7f2-be33a2e494e9` — `Execution scenes require authorized teaching data` | 8 | 2026-09-15 12:15:26 -04 | Intentional provider invariant in `execution-concept-scenes.tsx`; if reproducible, ensure supported renders are wrapped in `ExecutionData.Provider` rather than weakening the invariant. |
| `01a0a3e9-9cc3-7f90-9e88-1ff0f18841cb` — `useId is not defined` | 7 | 2026-09-15 03:13:43 -04 | Current `concept-lab.tsx` imports `useId`; deployment/release evidence is insufficient to label the historical issue fixed. |

These rows are useful diagnostic evidence for preview/local or events missing the
production property. They are intentionally excluded from production priority and
customer-impact counts.

## Reconciliation and limitations

The authenticated UI gives two useful headline reconciliations over seven days:
7 project-wide active groups / 25 displayed occurrences, versus 2 groups / 5
occurrences after `environment = production`. That establishes that five groups
and 20 displayed occurrences were outside the verified production-filtered set.

The runbook calls for an independent raw-event reconciliation under the same
filters. That reconciliation is **blocked in this run**: the connector's
project-switch response said 582920 while subsequent query URLs still identified
project 90561, and the browser read surface used here did not expose a safe exact
raw-event aggregate for the fixed intervals. No counts from the misrouted
connector were attributed to Tradely.

Observed-user counts are per issue row and must not be summed into globally unique
people. Server diagnostic identity does not establish a customer count. Missing
or non-production `environment` values are kept unattributed rather than silently
included in production. No replay was required for the conclusions above.

## Reproducibility appendix

1. PostHog project switch: requested project 582920; response identified Tradely,
   `America/New_York`, and the expected organization. Verification step failed
   because subsequent connector query URLs still used project 90561.
2. Authenticated PostHog UI: project 582920 error tracking, seven-day active
   issues. Unfiltered: 7 groups / 25 displayed occurrences. With
   `environment = production`: 2 groups / 5 displayed occurrences.
3. Authenticated PostHog UI: project 582920 error tracking, `Last 24 hours`:
   `No issues found`.
4. Vercel project `tradely-ai-web`: production deployment
   `f98df769152766f7119ab8bf8c7eaddf3b4bafc4` was the active production release
   at 2026-09-14 16:59Z. Its aliases included `tradely.ai` and `www.tradely.ai`.
5. Vercel production runtime logs: 2026-09-14 16:45–17:15Z, query
   `Learning persistence unavailable`: no logs found.
6. Vercel runtime errors: same 30-minute production window: no runtime errors
   found.
7. Source inspection used the current tree plus read-only Git inspection of the
   affected deployment revision. No checkout/reset was performed.

## Remaining actions and maintenance

- Correlate the production persistence issue's captured operation with
  authorized server/database telemetry around 2026-09-14 16:59Z.
- Recover exact release/chunk/frame evidence or a release-matched reproduction
  for the one-off production `allowed` TypeError.
- Fix or work around the PostHog connector project-routing defect so future runs
  can execute exact fixed-window event reconciliation directly in project 582920.

No application code, deployment, PostHog issue state/settings, alerts, or external
communications changed. No synthetic app browser journey was run, so browser GIF
evidence is not applicable. Documentation-only validation covers relative links,
sensitive-data review, whitespace, staged diff, and Git commit.

Runbook maintenance: updated project-verification guidance so a successful
project-switch response must be followed by query-provenance verification; added
the durable rule to apply and verify `environment = production` before ranking
customer impact; replaced the stale handoff with the unresolved 2026-09-18 state.
