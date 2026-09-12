# PostHog web and product analysis

## Objective and ownership

Produce an evidence-led analysis of Tradely: how visitors arrive and navigate,
where learners reach value or drop out, what brings them back, and which product
change should be prioritized. Separate observed facts, hypotheses, and missing
measurement. This is the canonical procedure in the [agent index](README.md).

## Agent Handoff

Last updated: 2026-09-12

No open maintenance items. This pass created documentation only; no live PostHog
analysis, production checks, or browser verification was executed. On first
execution, establish current project access, event coverage, and a baseline.

## Recommended Invocation

```text
/goal Run ops/agent/posthog-analysis.md for Tradely. Analyze the last 28 complete
calendar days against the preceding 28 days in the verified project timezone.
Produce a reproducible web and product report with coverage limits, ranked
findings, and up to three measurable next actions. Keep PostHog read-only,
maintain the runbook, and commit only scoped documentation changes. Do not push,
deploy, change project settings, or send notifications.
```

Success means both analysis tracks are covered, every material number has a
reproducible definition and evidence, unmeasurable questions are labeled, and the
report ends with a decision supported by the data. Finish when these gates pass;
if access or coverage prevents a section, report the specific blocker and finish
independent sections without inventing results. Do not repeatedly retry denied
access or broaden the investigation indefinitely.

## Prerequisites and boundaries

1. Read [AGENTS.md](../../AGENTS.md), this handoff, and the available PostHog skill.
   Check `git status --short` and preserve unrelated modified/untracked files.
2. Read the current [event contract](../../docs/ANALYTICS-SCENARIOS.md),
   [typed registry](../../apps/web/src/analytics/events.ts),
   [provider](../../apps/web/src/analytics/provider.tsx),
   [setup notes](../../docs/POSTHOG-SETUP.md),
   [replay contract](../../docs/POSTHOG-REPLAY.md), and
   [observability notes](../../docs/OBSERVABILITY.md). Historical counts, alerts,
   rollout status, and dashboard definitions in these notes require fresh checks.
3. Discover the connected PostHog app's current tools and advertised skills.
   Confirm organization, project name/ID, timezone, and access before queries.
   Repository setup points to [Tradely project 582920](https://us.posthog.com/project/582920)
   and [Learning & Reliability](https://us.posthog.com/project/582920/dashboard/2043620);
   these are starting references to verify, not permission to select another
   product's project. If tools are missing, request the PostHog connection and
   record the blocker; do not hunt for personal API keys in environment files.
4. Use read-only discovery, queries, existing insights, and authorized recordings.
   Creating or editing dashboards, actions, cohorts, alerts, flags, experiments,
   instrumentation, retention, or consent settings is outside an analysis run
   unless already authorized. Do not send Slack/email messages or manufacture
   production purchases, learning records, exceptions, or test traffic.
5. Default to the last 28 complete calendar days and the preceding 28, excluding
   today. Record exact inclusive start/exclusive end timestamps and timezone.
   Honor a user-specified period instead. For a young product, report the actual
   available period and avoid comparing unequal exposure as equivalent.
6. Keep secrets, raw person IDs, emails, learner answers, coaching text, payment
   details, and replay exports out of committed reports. Use aggregates and
   access-controlled evidence links. Analytics consent and Do Not Track create
   selection bias: the observed population is not all visitors or customers.

## Procedure

### 1. Establish coverage before interpreting behavior

Start with a narrow event inventory, then expand to the agreed periods. Inspect
live names, property availability, first/last timestamps, daily volume, release,
environment, runtime, and identity/session fields. Reconcile unexpected changes
with instrumentation and deployment dates; local source does not prove delivery.

Use `app=tradely` and `environment=production` where present and verified. Exclude
local/preview, bots, staff, and test accounts using the project's actual rules.
If older events lack those properties, quantify their exclusion or analyze them
separately with a justified alternative; do not silently include them. Saved
insights may apply test filters that direct HogQL does not: reproduce the actual
predicates in direct queries. Exclude diagnostic identities such as
`tradely-server` from people and learning metrics.

Record a compact metric dictionary: event/property, actual emitter, unit (events,
people, or sessions), denominator, identity rules, filters, time window, and known
limitations. Inspect existing actions/insights before reuse; names alone do not
prove their filters or semantics. Use current PostHog documentation search before
relying on HogQL syntax, session definitions, attribution, funnel behavior, or
retention semantics. Store executed query text or complete insight configuration
with the report; do not include unexecuted illustrative SQL as evidence.

Check these contracts against source and live data:

- `$pageview` and `page_viewed` describe the same visit. Choose one per metric;
  never sum them. Prefer semantic `page_viewed` for route/product steps and the
  verified Web Analytics page-view definition for its native traffic metrics.
- `auth_session_established` includes restored identities after consent. It is
  neither a dedicated signup event nor a count of newly acquired accounts.
- A registered event can lack an active emitter or deployed traffic. Missing
  events mean unknown coverage until verified, not zero product demand.
- URL queries/fragments are sanitized. Verify actual campaign/referrer property
  coverage before promising UTM attribution. Do not recover stripped data.
- Consent-grant events do not supply the denominator for a consent-acceptance
  rate because denied and unobserved visitors are not equally measured.
- Page views, device identities, resolved people, and sessions are different
  units. Document identity merging and missing session IDs; do not silently mix
  anonymous browser counts with signed-in learner counts.

If results are empty or surprising, check project, period/timezone, event names,
properties, exclusions, release coverage, ingestion delay, and query limits in
that order. Use bounded aggregate reads, inspect truncation/sampling notices, and
retry a smaller range rather than exporting raw events without a limit.

### 2. Web analysis: acquisition and navigation

Report current value, comparison value, absolute change, and relative change
where the prior denominator is nonzero. Show sample counts beside rates.

| Question | Required analysis |
| --- | --- |
| Is qualified traffic growing? | Daily observed visitors, sessions, and page views; new/returning definitions; separate volume growth from downstream learner activation. |
| Which sources bring useful visits? | Available referrer/channel/campaign breakdowns by traffic and activation, with unknown/direct attribution shown explicitly. |
| Which entry pages work? | Landing pages for home, guides, curriculum, and pricing; visits followed by meaningful next steps, exits, and native bounce/engagement metrics only with verified definitions. |
| Where does navigation stall? | Top paths into lessons and pricing; repeated routes, exits, access-state barriers, and observed next-step conversion. |
| Who experiences friction? | Device/browser, locale, and source splits where sample sizes support them; avoid many tiny cross-segments. |
| Could reliability explain loss? | Web-vitals distributions by route/device/release, affected browser people/sessions, and relevant errors during the same period. |

Use p75 vitals where supported, with units and sample counts; distinguish them
from existing average-based alerts. `server_route_timing` captures only slow
course-progress reads, so its distribution is not all-request latency. Temporal
coincidence between errors and drop-off supports investigation, not causation.
Server diagnostics do not count as browser visits or unique affected customers.

Keep SEO impressions/search rankings and advertising costs out of PostHog-only
claims unless separately sourced. Never use aggregate search clicks as the
denominator of a consented-person product funnel.

### 3. Product analysis: activation, learning, retention, and paid intent

For every funnel, specify ordered steps, unit, conversion window, exclusions,
and matching properties. Default to a same-session web journey and a seven-day
person-level learning journey when identity supports it; justify alternatives.
Use native funnels or a verified sequential query, not ratios of unrelated event
totals. Match lesson/scenario/version and offer as appropriate so different
lessons or products do not falsely complete the same funnel. Show total and
step-to-step conversion plus counts lost. Label observed drop-off as such, since
consent withdrawal and capture failures can also terminate a measured journey.

| Journey | Candidate observed steps and interpretation |
| --- | --- |
| Public guides | `page_viewed` with guide route → `guide_demo_started` → `guide_demo_completed` → `guide_next_step_clicked`; match guide/demo IDs and actual destination where available. |
| Anonymous preview | Allowed `lesson_opened` → `preview_exercise_started` → `preview_exercise_submitted`; report separately from signed-in exercises. |
| Sign-in entry | `auth_sign_in_opened` → `auth_session_established`; directional observed identity establishment, not signup conversion. |
| Learner activation | Allowed `lesson_opened` → `lesson_exercise_started` → `lesson_exercise_submitted`; use first observed submission as an explicit operational activation proxy. |
| Learning progression | Submission results, criteria met/total, hints, `lesson_completed`, and return to another lesson; distinguish saved completion from demonstrated understanding. |
| Video use | `lesson_video_started` → `lesson_video_completed` only for lessons with media; replays can repeat completion events. |
| AI coaching | `lesson_coach_started` → `lesson_coach_feedback_viewed` → `lesson_coach_revision_saved` → `lesson_coach_cycle_completed`; inspect round semantics and `lesson_coach_failed`. |
| Paid intent | `membership_cta_clicked` where applicable → `billing_action_started` with checkout action → `billing_action_redirected` → `billing_checkout_returned`; segment by offer and return status. Pricing can enter directly without a membership CTA. |
| Course Pass access | `course_pass_access_verified` split by `source`; existing/restored access is not a new purchase. |
| TradingFlow interest | `tradingflow_link_opened` by active surface/tool; outbound interest does not prove activation in another product. |

Exercise starts include resume/restart, so event totals are not unique attempts.
Client learning/coaching events do not prove independent mastery or incremental
AI benefit. Do not pool different assessment versions or infer that a saved
revision improved reasoning. Use only supported independent-assessment evidence
for such claims; otherwise name the measurement gap.

Checkout redirects and successful returns are intent/return telemetry. Do not
calculate revenue, paid conversion, refunds, churn, CAC, LTV, or subscription
activation from them. Authoritative payment analysis requires separately
available and authorized billing evidence with explicit reconciliation; do not
bypass consent by importing operational records into behavioral analytics.

Define active learners by a meaningful learning event, not `$pageview`. Report
D1/D7 and weekly retention for first-observed activated cohorts where coverage
permits. State whether return means exact-day, bounded-week, or rolling retention,
which return event qualifies, and the cohort timezone. Exclude immature cohorts
from each denominator; a D7 result needs seven full follow-up days. If first-ever
activity predates available history, call the cohort first-observed, not new.
Separate returning to the same lesson from progressing to another lesson.

### 4. Explain and prioritize

Investigate the largest supported loss or opportunity across acquisition,
activation, retention, and paid intent. If useful and available, inspect a small,
purposeful sample of masked replays from the relevant funnel step and a successful
comparison group. State selection criteria and sample size; replay anecdotes do
not establish prevalence. Never unmask protected learning/coaching surfaces.
Unavailable recordings are a limitation, not authorization to enable recording.

If browser verification is performed, follow the available browser skill and
AGENTS.md: capture actual verified UI/interactions as a GIF, identify environment,
inspect it for private data, and link the evidence in the final response. Store
sensitive captures outside Git. A data-only analysis does not require a browser
smoke test or synthetic product activity.

Rank up to three actions by affected population, expected benefit, confidence,
and effort. For each, give evidence, a testable hypothesis, owner/area, primary
metric, guardrail, evaluation window, and success/stop rule. Quantify targets as
proposed targets, not forecasts. Small cohorts warrant counts and uncertainty,
not strong causal claims or a long feature backlog. If coverage is inadequate,
prioritize the specific measurement repair before a speculative product change.

### 5. Deliver, validate, and commit

Write a dated report at `docs/reviews/posthog-analysis-YYYY-MM-DD.md` (use a suffix
for a distinct same-day scope; do not overwrite unrelated reports). Include:

1. Decision summary: the highest-priority finding and recommended next action.
2. Scope and coverage: project, extraction timestamp, exact periods/timezone,
   release coverage, filters, identity units, missing data, and sampling/limits.
3. Web analysis: comparison table, acquisition quality, navigation, reliability.
4. Product analysis: funnel counts/rates, activation definition, learning and
   coaching limits, mature retention cohorts, paid-intent/access distinctions.
5. Evidence appendix: query text/configurations, execution timestamps, metric
   definitions, source/insight links, and aggregate results sufficient to rerun.
6. Up to three prioritized actions, uncertainty, and unresolved measurement gaps.

Before finalizing, reconcile at least one headline metric with an independent
query or existing insight using identical filters. Explain discrepancies rather
than selecting the more favorable value. Check funnel counts are sequential,
rate denominators and comparison periods match, zero baselines are labeled, and
retention cohorts are mature. Ensure findings distinguish observation from
hypothesis and code presence from production evidence.

Re-read the report/runbook, validate relative links, and run `git diff --check`.
No application tests are needed for documentation-only changes. Perform the
self-maintenance decision, stage only owned report/runbook/index paths, inspect
`git diff --cached`, and commit the validated documentation. Do not push without
authorization. Report key findings, report link, checks, limitations, commit hash,
maintenance decision, and any required GIF evidence. For a documentation-only
creation/maintenance pass, explicitly say the analysis was not executed.

## Runbook Self-Maintenance

At the end of each execution, use runbook-maintainer and its greenfield review
when available. Compare the actual run with an ideal repeatable analysis:

1. Promote only evidenced durable lessons into this procedure: changed event
   semantics, source owners, query/tool behavior, or missing validation gates.
2. Keep transient blockers in `Agent Handoff`; prune resolved/obsolete items
   before adding up to 3–7 next actions, each with evidence or a blocker. Keep
   current counts and conclusions in the dated report, not in this procedure.
3. Update the handoff date when its state changes. If no items remain, write one
   line saying so. Do not accumulate completed todos or raw logs.
4. Maintain the [index](README.md) when routing changes and validate links/diffs.
   Keep the event contract canonical; do not turn this runbook into a competing
   registry of every property or a copy of historical dashboard configuration.
5. If no durable lesson changed the procedure, report `Runbook maintenance: no
   change`. Do not rewrite policy for one-off fluctuations or speculation.
