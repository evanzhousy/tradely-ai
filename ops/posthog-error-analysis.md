# PostHog error analysis

## Objective and ownership

Analyze errors reported by PostHog for Tradely, establish observed user impact,
trace actionable failures to their owning code or deployment, and produce a
ranked, reproducible incident report. This is the canonical error-triage procedure
in the [ops index](README.md); broad acquisition and product-funnel analysis is
outside its scope. An analysis run proposes repairs but does not implement them
unless the user also authorizes implementation.

## Agent Handoff

Last updated: 2026-09-12

Live read-only execution on 2026-09-12 reached the project-verification gate;
Tradely error attribution remains blocked. See the
[execution report](../docs/reviews/posthog-error-analysis-2026-09-12.md).

- [ ] Obtain explicit direction to switch the connector to Tradely (582920),
  then recheck schema and the returned query URL before error triage. The live
  trends result used OptionData.io (90561); fetching metadata for 582920 did not
  change the query context. The switch tool requires a user-requested switch.
- [ ] Run the issue inventory, comparison, recurrence, and root-cause analysis
  in the verified context. No Tradely exception counts or health verdict were
  established; the earlier report's ingestion-mismatch explanation is unproven.

## Recommended Invocation

```text
/goal Run ops/posthog-error-analysis.md for Tradely. Investigate PostHog errors
in the last 24 hours, compare the preceding 24 hours, and use seven days of
history for recurrence. Verify the project and production scope first. Produce
a dated evidence report with impact, ranked issues, root-cause confidence,
recommended fixes, and validation gates. Keep external systems read-only,
maintain the runbook, and commit only owned documentation. Do not push, deploy,
change issue status or settings, or send notifications.
```

Success means the project is verified, coverage and exact windows are recorded,
priority issues have evidence-backed dispositions, and every proposed repair has
a verification path. If access, attribution, or symbolication blocks a conclusion,
record the exact missing evidence and complete independent work. Do not invent
causes or retry denied access indefinitely. A blocked analysis is not a healthy
production verdict.

## Prerequisites and boundaries

1. Read [AGENTS.md](../AGENTS.md), this handoff, and the available PostHog skill.
   Check `git status --short`; preserve unrelated modified and untracked files.
2. Read the current [observability contract](../docs/OBSERVABILITY.md),
   [setup notes](../docs/POSTHOG-SETUP.md),
   [replay privacy contract](../docs/POSTHOG-REPLAY.md), and
   [event contract](../docs/ANALYTICS-SCENARIOS.md). Historical dashboard IDs,
   counts, alert status, and source-map snapshots require fresh verification.
3. Discover the connected PostHog app's current skills and tools for project
   discovery, Error Tracking issues/events, schema, queries, and documentation.
   Resolve identifiers before calls; use documentation search before relying on
   API or HogQL syntax. If access is unavailable, record the blocker and request
   the connection. Do not search environment files for personal API credentials.
4. Default to a fixed extraction time T: current window [T−24h, T), comparison
   [T−48h, T−24h), recurrence [T−7d, T). Record actual inclusive start/exclusive
   end timestamps in UTC and the project timezone. Honor a supplied issue link,
   release, or time range; include the reported occurrence if outside the default.
5. Analysis authorizes bounded read-only evidence collection and local reports.
   Do not resolve, ignore, merge, or delete issues; alter grouping, sampling,
   alerts, replay, consent, or project settings; send messages; or generate
   production exceptions, purchases, or learning records without authorization.
6. Keep tokens, emails, raw person/session IDs, learner answers, coaching text,
   payment details, and raw replay/log exports out of committed files. Use
   aggregates, redacted excerpts, and access-controlled evidence links.

## Procedure

### 1. Verify the project and collection boundary

Treat [project 582920](https://us.posthog.com/project/582920) as a repository
starting reference only. Verify organization, project ID/name, timezone, and
recent event hosts, routes, app identifiers, and event taxonomy. A project name
or authorized-URL list alone does not establish which application emits its data.
If traffic belongs to another product, stop Tradely impact attribution, record
the mismatch, and identify the mapping evidence needed. Do not silently switch
projects or change configuration to make the report proceed.

Verify the query's own project context, for example the project ID in its returned
`_posthogUrl`. An explicit `project-get(id)` retrieves that project's metadata;
it does not establish the default context of schema, trends, or issue queries.
Do not diagnose token/deployment contamination from those mixed reads. If the
documented `@current` lookup is rejected by a numeric-only connector schema,
use returned query provenance and project-list metadata. Follow the switch tool's
authorization requirement, then rerun schema discovery after switching. Redact
project tokens from metadata responses before displaying or saving them.

Inspect a bounded recent event sample and schema before selecting filters. Use
verified `app=tradely` and `environment=production` properties where available;
validate browser host against deployed Tradely domains. Server errors may lack
browser URLs, so establish their app/runtime/release provenance separately.
Exclude preview/local, staff, test traffic, and bots using actual project rules.
Reproduce saved-insight test filters explicitly in direct queries. Quantify
unattributed or missing-property events separately instead of silently dropping
or treating them as production.

Check `$exception` delivery and issue coverage, first/last event times, runtime,
release availability, sampling, truncation, and ingestion delay. Query no more
than the agreed periods; paginate with stable ordering and record whether all
pages were read. Empty results require checking access, scope, filters, capture,
and retention before concluding no observed errors.

### 2. Inventory and rank issues

List issues active in the current window, including reopened or previously
resolved issues with new events; do not restrict to newly created/open issues.
Include the user-supplied issue even if currently quiet. Start with the ten most
impactful groups, expand if needed for critical symptoms, and state coverage of
any remainder. Record for each:

- Issue ID/link, sanitized type/message, first/last seen, and current status.
- Current and prior event counts, observed affected browser people and sessions,
  release/runtime, route or server operation, and recurrence trend.
- Severity, confidence, likely owner, evidence links, and next action.

Separate event count, people, and sessions. Diagnostic identity `tradely-server`
is not an affected customer; server event volume does not reveal unique users.
Do not sum browser and server reports of the same failure as distinct incidents.
Check grouping changes and duplicate capture before attributing count growth to
regression. If reporting an affected-session rate, use observed browser sessions
with matching time, app, environment, route, and identity filters as denominator;
show counts and missing-session coverage. Do not divide server errors by visits.
Consent, DNT, blockers, and capture gaps mean observed users are not all users.

Rank by demonstrated consequence and breadth, then recurrence and confidence:
P0 for confirmed severe access/security/data-integrity failures; P1 for blocked
core journeys without a workable recovery; P2 for limited or recoverable product
failures; P3 for supported low-impact noise. Low count does not lower a serious
billing or access failure automatically. Label uncertain impact explicitly.
Do not dismiss extension, network, chunk-load, or ResizeObserver errors by name
alone; inspect origin frames and actual user-visible consequences first.

### 3. Investigate the highest-priority failures

Deep-dive up to five leading issues plus any critical issue. Compare earliest,
latest, and representative events across affected releases/browsers. Trace the
trigger, exception chain, symbolicated application frame, and affected journey.
Use available masked replay only when it adds causal context; missing replay is
a limitation, not permission to enable or unmask it.

Use these source owners as starting points and verify them each run:

| Boundary | Source |
| --- | --- |
| Browser SDK, capture, consent | [client](../apps/web/src/analytics/client.ts), [provider](../apps/web/src/analytics/provider.tsx) |
| Exception redaction and retained frames | [exception payload](../apps/web/src/analytics/exception-payload.ts) |
| Server exception capture | [server analytics](../apps/web/src/server/analytics/posthog.server.ts) |
| Release identity and symbol upload | [release](../apps/web/src/analytics/release.ts), [Vite config](../apps/web/vite.config.ts) |

Match event release/chunk/source-map identifiers to the deployed commit before
using local line numbers. Inspect that revision with read-only Git commands if
available; do not reset or check out over dirty work. Missing symbols or unknown
release means attribution is provisional. Source-map upload existence alone does
not prove this event was symbolicated by the correct release.

For missing capture, inspect consent gating, optional exception-module loading,
send-boundary redaction, configured hosts, and deployment evidence. Preserve the
privacy contract: do not add raw context or bypass consent to improve diagnosis.
Correlate server logs or deployment records only through available authorized
read access and shared request/trace/release evidence. Similar timestamps alone
do not prove that a server failure caused a browser exception. Checkout telemetry
does not establish a payment failure or entitlement state.

For each issue, distinguish confirmed cause, supported hypothesis, or unresolved.
Give the smallest discriminating reproduction/check, supporting and contradictory
evidence, and a disposition: proposed repair, deployment/configuration follow-up,
needs evidence, or evidence-supported noise. Noise disposition in a report does
not authorize changing PostHog issue status or suppression rules.

### 4. Define repair and verification gates

For each actionable issue, name the owning file/module or deployment setting,
proposed change, expected behavior, focused regression check, and residual risk.
Preserve server-owned access, grading, billing, and consent contracts. An analysis
request alone ends with recommendations; execute implementation only if authorized.

If implementing, reproduce safely locally or in an authorized preview and use
the repository's Node 24 toolchain. Choose focused tests from `pnpm --filter web
test -- <test-path>`; use `pnpm check-types` when types change and build checks
when bundling changes. Inspect build configuration before running production-mode
builds because source-map plugins can upload externally. For telemetry repairs,
verify no capture before consent or after withdrawal, redaction, and expected
capture after consent. Test failures in unrelated dirty files must be identified,
not silently repaired or included in the commit.

If browser verification occurs, load the available browser skill, record the
actual app or local component preview as a GIF, identify its environment, inspect
for sensitive content, and include the GIF and file link in the final response
as required by AGENTS.md. Keep sensitive captures outside Git. A data-only run
does not require synthetic browser activity.

Local tests prove local behavior. Production resolution additionally requires a
verified deployed release, successful affected journey, and a bounded observation
window with comparable traffic/capture coverage. Define that window and required
exposure for the issue; no events during no traffic is not proof of recovery.
If deployment or observation is unavailable, label the fix locally validated and
production unverified. Do not create a monitor automatically.

### 5. Report, validate, and commit

Write `docs/reviews/posthog-error-analysis-YYYY-MM-DD.md`, adding a scope suffix
for another same-day run rather than overwriting unrelated work. Include:

1. Highest-priority finding and recommended next action.
2. Project verification, extraction time/windows/timezone, filters, coverage,
   query limits, exclusions, and whether the run was complete or blocked.
3. Ranked issue table with impact units, comparison counts, severity, confidence,
   evidence links, owner, and disposition.
4. Deep-dive evidence, release/source mapping, hypotheses, proposed fixes, and
   local versus production verification gates.
5. Reproducibility appendix: executed query text or full tool filters/config,
   timestamps, aggregate results, and evidence links. Do not label example or
   unexecuted queries as evidence.
6. Remaining actions and limitations; state whether any code or external state
   changed and whether browser verification was performed.

Reconcile a headline issue count with an independent bounded event query under
the same filters, accounting for grouping and sampling differences. If blocked,
record why reconciliation cannot be done. Re-read report and runbook, validate
relative paths, inspect for sensitive data, and run `git diff --check`. No app
tests are needed for documentation-only work. Perform the maintenance decision,
stage only owned files, inspect `git diff --cached`, and commit validated scoped
changes before reporting completion. Do not push without authorization.

## Runbook Self-Maintenance

At the end of each run, use runbook-maintainer and the available greenfield skill
to compare the procedure with the ideal next execution:

1. Promote evidenced reusable lessons about source ownership, tool/schema drift,
   project verification, or missing validation gates into the procedure.
2. Keep transient blockers only in `Agent Handoff`, with the next action and
   evidence per item. Prune resolved/obsolete items first; aim for 3–7 items and
   never exceed 12. Update its date when state changes; use one line if none remain.
3. Keep incident counts, raw logs, and completed progress out of the runbook;
   dated reports own run results. Do not turn speculative repairs into policy.
4. Update the [ops index](README.md) when routing changes and validate links and
   diffs. Keep one canonical error procedure, with links instead of duplicate bodies.
5. If no durable procedure changed, report `Runbook maintenance: no change`.
   For creation or maintenance without operational execution, explicitly state
   that no live analysis was run in both the handoff and final response.
