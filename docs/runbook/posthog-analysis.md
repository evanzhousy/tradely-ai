# PostHog web traffic and user behavior analysis

## Objective and ownership

Teach an AI agent to explain how visitors discover Tradely, reach meaningful
learning activity, save their work, and return. Produce reproducible findings
and up to three measurable next actions, separating observations, hypotheses,
and measurement gaps. This is the canonical traffic/product procedure in the
[runbook index](README.md). Use [error analysis](../../ops/posthog-error-analysis.md)
for deeper incident triage.

## Agent Handoff

Last updated: 2026-10-06

This was a documentation creation and migration only; no live traffic analysis,
production checks, or PostHog writes were executed. Local event emitters were
reviewed. Plugin tool inventory was available, but the skill lookup and docs
schema lookup did not complete; no query payload or HogQL example was validated.

- [ ] At the first execution, verify the connected project and query provenance,
  then load current PostHog skills/docs and live schema before querying. Project
  `582920` is the source reference, not current proof of the connector context.
- [ ] Check deployed coverage of film/playground, guest-save, and sign-in events.
  The current player reuses visual event names across film shots and playground
  scenes; source presence does not prove capture or distinguish every surface.

## Recommended Invocation

```text
/goal Run docs/runbook/posthog-analysis.md for Tradely using @PostHog. Compare
the last 28 complete calendar days with the preceding 28 in the verified project
timezone. Verify project provenance and measurement coverage first, then analyze
traffic, acquisition quality, navigation, learning engagement, sign-in/save
journeys, and mature retention cohorts. Start the report with Doing well and
Doing badly / needs attention. Give up to three evidence-backed actions.
Keep PostHog read-only and store reports/captures outside the repository.
Maintain this runbook and commit only owned documentation changes. Do not push,
deploy, change analytics settings, send notifications, or generate test traffic.
```

Success requires verified project provenance, explicit metric definitions and
coverage, both web and behavior analysis, a reproducible evidence appendix, and
an independent reconciliation of at least one headline metric. Each unavailable
section needs a specific blocker and next verification step. Finish independent
sections if a gate fails; do not invent results or retry denied access indefinitely.

## Prerequisites and boundaries

1. Read [AGENTS.md](../../AGENTS.md), the handoff, the installed PostHog skill,
   and runbook-maintainer. Inspect `git status --short` and preserve unrelated
   edits/deletions. This procedure authorizes analysis and runbook maintenance;
   recommendations do not authorize implementation.
2. Review the [event contract](../ANALYTICS-SCENARIOS.md),
   [registry](../../apps/web/src/analytics/events.ts),
   [provider](../../apps/web/src/analytics/provider.tsx),
   [project constants](../../apps/web/src/analytics/posthog-config.ts),
   [observability](../OBSERVABILITY.md), [setup](../POSTHOG-SETUP.md), and
   [replay privacy](../POSTHOG-REPLAY.md). Use the current emitters and
   [syllabus](../../apps/web/src/content/syllabus.ts) to resolve drift; prose and
   saved dashboards may describe older product versions.
3. Use read-only project/schema discovery, aggregate queries, existing insights,
   and permitted masked recordings. Do not create/edit dashboards, actions,
   cohorts, flags, experiments, alerts, project settings, or instrumentation.
   Do not enable recording or relax consent/masking to fill a data gap.
4. Never hunt for personal API keys in environment files. Keep credentials,
   emails, raw person/session IDs, answers, coaching text, payment details, and
   raw replay exports out of chat and repository files. Metadata responses may
   contain tokens: redact before displaying or saving them.
5. Put reports, query artifacts, screenshots, and GIFs in an external directory,
   for example `/tmp/tradely-posthog-analysis/<run-id>/`. Save only aggregates and
   safe query/configuration evidence. Do not recreate deleted review reports.
   If the user explicitly requests a repository report, follow that exact scope.
6. Do not manufacture production visits, exceptions, purchases, or learning
   records. This is a data analysis; a browser smoke test is optional. If used,
   follow the browser skill and capture a reviewed GIF of actual UI/interactions,
   name its environment, and link it in the final response as AGENTS.md requires.

## Procedure

### 1. Discover tools and verify the collection boundary

Use the connected PostHog plugin before unrelated tools. In its `exec` interface,
discover current skills/tools rather than assuming old function names:

```text
learn -s "web analytics funnels retention session replay"
tools
info <selected-tool-name>
schema <selected-tool-name> <field-path>
call <selected-tool-name> <json-input>
```

These are interface patterns, not complete analytics payloads. Inspect `info`
before the first call and use `schema` for complex hinted fields. Look for
project discovery, `read-data-schema`, `query-web-overview`, `query-web-stats`,
`query-trends`, `query-funnel`, `query-retention`, `query-paths`, `execute-sql`,
and recording reads; names and permissions can change. Use advertised skills
first. Search business knowledge when that source is available, then current
PostHog docs for session, attribution, funnel, retention, and HogQL semantics.
Attempt unavailable checks once, record the limitation, and continue with other
verified evidence. Do not guess unsupported payloads or syntax.

Verify organization, project ID/name, timezone, and a bounded recent aggregate
of hosts/routes/events. The source reference is
[Tradely project 582920](https://us.posthog.com/project/582920). Check the actual
query's returned project context (such as its `_posthogUrl`), not just metadata
or a successful project-switch response. An explicitly selected project's
metadata does not prove the default context of the next query.

Expected production domains are `tradely.ai` and `www.tradely.ai`. Require
consistent app/taxonomy/host evidence. If results belong to another product,
stop attribution to Tradely; use an authorized project-scoped read surface or
report the blocker. Do not diagnose deployed token contamination from a query
context mismatch alone. Historical dashboard IDs are discovery hints only.

### 2. Pin scope, establish coverage, and define metrics

Default to two adjacent 28-day periods excluding today, in the verified project
timezone. Record exact inclusive-start/exclusive-end timestamps, their UTC
equivalents, extraction time, and any user-specified scope. Calendar-day windows
can cross daylight-saving changes. Compare equal exposure; if history is shorter,
report the available range and limit the comparison.

Start with a small recent range, then widen. Inventory event names, required
property coverage, daily volume, first/latest capture times, runtime, release,
schema version, and session/identity availability. Inspect source emitters for
candidate events, then verify live capture. Distinguish absent events, missing
properties, denied access, truncated results, sampling, and actual measured zero.

Apply verified `app=tradely` and `environment=production` filters. Separate
browser traffic from server diagnostics (`runtime` where supported). Exclude
local/preview, known test/staff identities, bots, and diagnostic identities such
as `tradely-server` using documented project rules. Reproduce saved-insight test
filters in direct queries. Quantify events missing required properties; do not
silently merge them into production. Record all exclusion predicates.

Create a metric dictionary alongside the report:

| Field | Required definition |
| --- | --- |
| Signal | Live event/property and actual source emitter; release coverage |
| Unit | Events, observed browser identities, resolved people, or sessions |
| Population | Filters, eligible routes/lessons, identity rules, exclusions |
| Rate | Numerator, denominator, matching keys, order and conversion window |
| Time | Exact periods, timezone, cohort start and follow-up window |
| Evidence | Executed query/configuration, result link, extraction time, limits |

Preserve these interpretation rules:

- `$pageview` and `page_viewed` can represent the same visit. Choose one per
  metric; never sum them. Native Web Analytics and semantic route metrics must
  retain their own documented definitions.
- Consent and Do Not Track limit the observed population. Consent grants cannot
  produce an acceptance rate because denied/unobserved visitors lack equivalent
  measurement. The first captured page can be where consent was granted, rather
  than the true arrival page; label observed landing pages accordingly.
- URLs are sanitized. Verify referrer/UTM coverage before promising attribution;
  keep unknown/direct buckets explicit and do not recover stripped queries.
- People, anonymous browser IDs, sessions, and event totals are different units.
  Verify identity merging and missing session IDs. Person properties can reflect
  ingestion-time state; confirm current instance semantics before segmentation.
- Registry entries and saved insight names do not prove an active emitter,
  deployed delivery, or a trustworthy business outcome.

If data is surprising, check provenance, time bounds, schema, filters, release
coverage, ingestion delay, and tool limits in that order. Narrow slow queries;
do not export unbounded events or run repeated broad scans.

### 3. Analyze traffic, acquisition quality, and navigation

For each comparable metric show current/prior counts, absolute change, and
relative change when the prior value is nonzero. A zero baseline has no meaningful
percentage-growth value. Show the numerator and denominator next to every rate.

| Question | Analysis |
| --- | --- |
| Is useful traffic growing? | Daily observed visitors, sessions, page views, and meaningful learner activity; disclose new/returning definitions and identity limits. |
| Which sources bring engaged learners? | Available source/referrer/channel/campaign traffic and sequential learning activation by source; distinguish session attribution from first-touch attribution. |
| Which entry pages work? | Observed home, guide, curriculum, lesson, and pricing entries; progression into learning; exits and native bounce/engagement only with verified definitions. |
| Where does navigation stall? | Entry → curriculum/lesson paths, repeated routes, observed exits, guide-to-lesson movement, and sign-in detours; separate direct lesson arrivals. |
| Who sees friction? | Device/browser/locale/source comparisons with sample sizes; limit tiny cross-segments and label exploratory comparisons. |
| Does reliability warrant investigation? | Same-window browser exceptions and p75 web vitals by route/device/release, with units, measured sample size, and affected-session/people definitions. |

Do not average segment rates without their denominators or mix traffic-growth
effects with conversion changes. Native bounce/session duration requires verified
capture and definitions; missing page-leave events do not prove short visits.
`server_route_timing` measures only slow course-progress reads, not all requests.
Route errors coinciding with drop-off justify investigation, not a causal claim.
Zero errors with absent/sparse exposure does not establish health. Route deeper
error investigation to the error runbook.

SEO impressions, rankings, ad costs, and total customer acquisition are outside
PostHog-only evidence. Do not use search clicks as a consented-person denominator.

### 4. Analyze learning, sign-in, saved work, and retention

Use ordered native funnels or a documented sequential query, never ratios of
unrelated event totals. Specify the entry cohort, unit, step order, conversion
window, matching properties, and treatment of repeat attempts. Default to
same-session web journeys and a seven-day person-level learning window only if
identity supports them. Fetch sufficient follow-up beyond the entry window;
exclude or label incomplete entrants. Report total and step-to-step conversions.

The current product offers free learning and historical billing support. Inspect
the deployed edition before applying historical preview/paid funnels. Candidate
journeys below are source-based starting points, not live measurement proof:

| Journey | Candidate steps and interpretation |
| --- | --- |
| Guide discovery | Guide `page_viewed` → `guide_demo_started` → `guide_demo_completed` → `guide_next_step_clicked`; match guide/demo IDs and inspect the linked destination. |
| Visual learning | Allowed `lesson_opened` → `visual_lesson_scene_started` → `visual_lesson_explored` or `visual_lesson_task_completed`; match lesson/scene where the step relationship permits. |
| Film consumption | Film shot starts → final-shot completion; resolve shot IDs from the deployed lesson film, separate from playground scene completion. |
| Prediction/task engagement | `visual_lesson_predicted` and `visual_lesson_task_completed`, by supported scene/kind; report counts and repeat-attempt limits, not independent mastery. |
| Guest work to saved work | `guest_work_save_requested` → `auth_sign_in_completed` → `guest_work_import_succeeded`; match lesson/intent on work events, check import failures, identity continuity, and property availability. |
| Sign-in | `auth_sign_in_opened` → `auth_sign_in_completed`; direct sign-in entries can bypass the first event. This is sign-in completion, not new-account signup. |
| Saved progress | `lesson_completed` and progress-save failures; successful persisted completion is distinct from understanding or an active learning task. |
| Exercises/coaching | Verified current `preview_exercise_*`, `lesson_exercise_*`, or `lesson_coach_*` emitters only; match lesson/scenario/version/round and keep guest and signed-in populations separate. |
| Outbound interest | `tradingflow_link_opened` and active `tradingflow_lab_*` events by supported surface; do not infer TradingFlow account activation or payment. |
| Historical billing support | Portal/restore `billing_action_*` and `course_pass_access_verified` by source; restored/existing access is not a new purchase. |

Check the [player](../../apps/web/src/features/learning/walkthrough/player.tsx),
[walkthrough](../../apps/web/src/features/learning/walkthrough/walkthrough.tsx),
[guest flow](../../apps/web/src/features/learning/preview-learning.tsx),
[import](../../apps/web/src/features/learning/guest-import-panel.tsx), and
[auth identity](../../apps/web/src/analytics/auth-identity.tsx) before interpreting
these events. Film playback currently shares visual names with playgrounds and
emits completion for the final film shot. Autoplay completion is consumption;
it does not prove active attention. Deduplication before consent can leave
completion without a captured start. A scene ID alone may be ambiguous across
surfaces or releases; report that gap rather than assigning guessed meaning.

Define activation explicitly, for example the first observed direct playground
exploration or supported task completion after an allowed lesson open. Separate
exploration from task success and from passive autoplay. Confirm that exploration
means what the emitter actually captures (the player can emit it on opening the
playground). `auth_session_established` includes restored sessions and is not
signup. Exercise starts can include resume/restart; repeated predictions/tasks
are not unique attempts without a verified attempt key. Do not assume anonymous
activity is linked across browsers or after a sign-in identity reset.

Define active learners by the chosen meaningful event, not page views. Report
D1/D7 and weekly retention only when cohort size/history permits. Specify
first-observed activation, qualifying return event, timezone, and exact-day,
bounded-week, or rolling semantics. Exclude immature cohorts from denominators;
D7 requires its full defined follow-up. Use first-observed rather than new when
earlier history is unavailable. Separate returning to the same lesson from
engaging with another lesson. Compare lesson/scene versions fairly.

No current checkout/revenue funnel is assumed. Do not infer purchases, revenue,
churn, CAC, or LTV from client behavior or historical access events. Independent
learning benefit and payment outcomes need separately authorized evidence.

### 5. Explain behavior and prioritize actions

Investigate the largest supported loss/opportunity. If recordings are permitted
and available, sample a small set from the affected step plus successful journeys;
record selection criteria, period, and sample size. Respect masked/blocked
surfaces. Recordings and heatmaps provide qualitative context, not prevalence or
causation; unavailable text/click capture is not permission to unmask it.

Separate facts (query-supported), hypotheses (possible explanations), and
unmeasurable questions. Rank up to three actions by observed affected population,
expected benefit, confidence, and effort. Each needs evidence, owner/area,
testable hypothesis, primary metric, guardrail, evaluation window, and success/
stop rule. Label proposed targets as proposals. If coverage is weak, prioritize
the concrete measurement repair rather than a speculative feature backlog.

### 6. Deliver and verify

Save the external report as `posthog-analysis-YYYY-MM-DD.md` inside the run's
output directory (use a suffix for separate same-day scopes). Include:

1. **Doing well**: supported successes with counts and evidence; say when none
   can be established. **Doing badly / needs attention**: losses, friction,
   coverage gaps, and their consequences. Then state the highest-priority action.
2. Scope/coverage: project/provenance, extraction time, periods/timezone, filters,
   releases, units, attribution/identity limits, sampling, and missing evidence.
3. Traffic comparison, source quality, entry/navigation findings, and reliability.
4. Learning activation, sequential funnels, saved-work/sign-in outcomes, and
   mature retention counts/rates; unavailable questions explicitly labeled.
5. Up to three ranked actions and confidence limits.
6. Evidence appendix: executed query text or complete insight configuration,
   query timestamps, safe aggregate results, metric dictionary, and verified
   PostHog links. Unexecuted example SQL is not evidence.

Before finalizing, reconcile at least one headline count with an independent
aggregate query or existing insight under identical definitions/filters. Explain
discrepancies. Check deduplication, sequential funnel counts, consistent rate
denominators, equal comparison exposure, mature retention, and zero baselines.
Every material conclusion must link to evidence; do not select favorable results.

Re-read the runbook/report, validate changed relative links and `git diff --check`,
and perform the self-maintenance decision. Documentation-only work needs no app
build or unit tests; never run/add unit tests in this repository. Stage only owned
runbook/index edits, inspect `git diff --cached`, and commit after validation.
Keep unrelated changes out and do not push/deploy. The final response must link
the report (and GIF if browser verification occurred), summarize findings,
limitations, checks, local commit, maintenance decision, and open handoff items.
Say explicitly if the pass was documentation-only and no analysis was executed.

## Runbook Self-Maintenance

At the end of each execution, use runbook-maintainer and a short greenfield review:

1. Promote evidenced reusable lessons into prerequisites, procedure, metric
   semantics, or verification: changed tools/schema/emitters, repeated ambiguity,
   or weak validation gates. Preserve domain truth before simplifying instructions.
2. Keep transient blockers in `Agent Handoff`; prune completed/obsolete items
   before adding 3–7 actionable next steps with evidence. Never exceed 12.
   Keep one-off counts, raw logs, and run history in the external report.
3. Update the handoff date when state changes. If nothing remains, write
   `No open handoff items after the latest run.` Do not retain completed todos.
4. Keep this file canonical. Update the [runbook index](README.md),
   [agent index](../../ops/agent/README.md), [legacy index](../../ops/cursor/README.md),
   and [ops index](../../ops/README.md) when routing changes; keep old procedures
   as thin aliases. Do not duplicate the event registry or provider policy.
5. Validate links and whitespace, then commit only owned edits. If no durable
   lesson changed the procedure, report `Runbook maintenance: no change`.
   Do not rewrite the runbook for fluctuations, speculation, or completed work.
