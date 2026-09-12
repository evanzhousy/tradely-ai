# PostHog error analysis — 2026-09-12

## Decision

The connector's analytics query context is **OptionData.io (90561)**, while the
requested application is **Tradely (582920)**. The live trends response embeds
`https://us.posthog.com/project/90561/insights/new` in `_posthogUrl` and returns
93 pageviews, all in the `www.optiondata.io` hostname bucket. The explicit
`project-get(582920)` metadata call did not select that project for analytics.

This explains the apparent cross-product results without establishing a Tradely
ingestion or deployment misconfiguration. Do not change deployment keys based
on this evidence. The earlier [product report](posthog-analysis-2026-09-12.md)
did not establish that its analytics reads executed in project 582920; its
cross-product-ingestion conclusion is not supported.

Next action: explicitly select Tradely (582920) in the connector, verify the
resulting query provenance and event schema, and resume error triage. The exposed
`switch-project` tool says it may only be used when the user asks to change the
project. No project switch was performed in this execution.

## Scope and execution status

- Live read-only extraction: 2026-09-12, approximately 17:56–17:58 UTC.
- Fixed endpoint T: `2026-09-12T17:56:26Z`.
- Intended current interval: `[2026-09-11T17:56:26Z, 2026-09-12T17:56:26Z)`.
- Intended prior interval: `[2026-09-10T17:56:26Z, 2026-09-11T17:56:26Z)`.
- Intended recurrence interval: `[2026-09-05T17:56:26Z, 2026-09-12T17:56:26Z)`.
- Tradely metadata timezone: `America/New_York` (UTC−04:00 for these dates).
  Current interval corresponds to September 11–12, 13:56:26 local time.
- Organization ID returned for both projects:
  `0191e259-9f2b-0000-3852-dace2842affe`; organization name was not queried.
- Result: blocked at project attribution, with the independent connector-context
  diagnosis completed. No Tradely exception inventory, recurrence, affected-user
  counts, stack analysis, source-map attribution, or production-health claim.
- No code, deployment, PostHog settings, issue status, or external communications
  changed. No browser verification, replay, or synthetic traffic was performed.
  Documentation was updated; browser GIF evidence is not applicable.

## Ranked findings

| Priority | Finding | Evidence and confidence | Owner / disposition |
| --- | --- | --- | --- |
| First | Analytics reads use the wrong project for this task | Confirmed: returned query URL identifies 90561; project listing names it OptionData.io | Operator / connector context: select 582920 and reverify |
| Second | Prior ingestion-mismatch diagnosis overstates the evidence | Confirmed methodological gap: explicit metadata and implicit analytics context differ in this run; earlier query context was not established | Analysis documentation: correction added; rerun prior product analysis after context verification |
| Unassigned | Tradely product errors and customer impact | Unknown: no verified Tradely issue data read | Resume triage; do not assign product severity or claim no errors |

The 93 pageviews are a connector-provenance diagnostic, not a Tradely metric or
an error count. The query intentionally applied no production, app, staff, bot,
or test exclusions because its purpose was identifying the data source. It used
`filterTestAccounts=false`, a 20-bucket host limit, and hourly intervals; one
host bucket was returned. No sampling or truncation warning appeared in this
response. The engine returned 25 hourly bucket labels covering partial boundary
hours. The exact requested timestamps are preserved below; endpoint semantics
were not independently reconciled because impact analysis stopped at attribution.

## Reproducible evidence

Calls were sequential. No server conversation ID was returned, so none was
invented. Project metadata can contain tokens; only safe fields are retained here.

1. `posthog_project_get`: `{"id":582920}` returned name `Tradely`, project ID
   582920, timezone `America/New_York`, admin access, authorized app URLs
   `https://tradely.ai` and `https://www.tradely.ai`, and a default test-account
   exclusion using cohort 526042. These are metadata, not query-context proof.
2. `posthog_get_more_tools` requested the `querying-posthog-data` skill and
   read-only error capabilities. It returned `Tool get_more_tools not found`.
   Available typed tools were discovered locally; no SQL was attempted.
3. `posthog_read_data_schema`: `{"query":{"kind":"events","limit":100}}`
   returned `$pageview`, `$exception`, and OptionData-shaped events including
   `api_key_action`, `historical_query_executed`, and `option_chain_query_executed`.
   The response did not establish Tradely event coverage.
4. `posthog_read_data_schema` with `kind=event_properties`,
   `event_name=$pageview` confirmed `$host` exists. A subsequent
   `kind=event_property_values`, `event_name=$pageview`, `property_name=$host`
   returned `www.optiondata.io`. The values lookup has no time-range parameter;
   the bounded trends query below supplies current-window evidence.
5. `posthog_project_get` with documented `id="@current"` was rejected before
   execution: the connector schema requires a number. No retry loop was used.
6. `posthog_query_trends` executed the following configuration:

```json
{
  "dateRange": {
    "date_from": "2026-09-11T17:56:26Z",
    "date_to": "2026-09-12T17:56:26Z"
  },
  "series": [{"kind": "EventsNode", "event": "$pageview", "math": "total"}],
  "breakdownFilter": {
    "breakdowns": [{"property": "$host", "type": "event"}],
    "breakdown_limit": 20
  },
  "filterTestAccounts": false,
  "interval": "hour",
  "output_format": "json"
}
```

Returned aggregate: `www.optiondata.io = 93`. Returned query-link project: 90561.
The project can be inspected at [OptionData.io](https://us.posthog.com/project/90561).
The requested destination is [Tradely](https://us.posthog.com/project/582920).

7. `posthog_projects_get` confirmed IDs/names 90561 / OptionData.io and
   582920 / Tradely under the same organization. This supports the query URL
   interpretation without changing the active context.
8. `posthog_docs_search` checked project scoping and error-tracking filtering.
   Relevant official references:
   [MCP FAQ](https://posthog.com/docs/model-context-protocol/faq#advanced-configuration)
   and [error investigation through MCP](https://posthog.com/docs/error-tracking/surfaces/mcp).
   The tool descriptions distinguish project retrieval from switching; the
   returned query URL is the decisive evidence for this run.

## Remaining verification and maintenance

After explicit project selection, rerun schema discovery and verify the returned
query URL names 582920 before applying Tradely app/environment/test filters.
Then run all-status issue inventory for the current/prior windows, seven-day
recurrence, representative stack/release investigations, and independent count
reconciliation. Deployed token mapping only needs investigation if mismatched
traffic persists within the verified Tradely query context.

No application tests were needed for this documentation-only change. Relative
links, whitespace, staged diff, and sensitive-data checks are the validation gates.
Runbook maintenance: added the durable distinction between explicit metadata
retrieval and active query context; updated the handoff with the precise blocker.
Invocation, self-maintenance policy, and canonical index routing remain intact.
