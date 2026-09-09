# AI practice coaching

Local implementation validation is recorded in [the verification report](reviews/ai-coach-verification-2026-09-09.md). Provider quality and deployment gates remain outstanding.

The proposed next stage—targeted follow-up practice, visual evidence guidance and progress across cases—is described in [the learning progression code-change plan](research/ai-learning-progression-code-change-plan-2026-09-09.md). Those additions are planned, not implemented.

The pilot adds two rounds of formative feedback to the guided cases in `audited-boundary`, `rank-symbols`, and `rank-contracts`. It never writes `lesson_attempt.assessment`, `lesson_progress`, or mastery. The boundary lesson reuses its saved written answer; the other two collect a separate saved explanation. Independent cases keep the existing deterministic scoring and hint policy.

## Runtime and data

`server/coaching.ts` uses the existing TanStack server-function CSRF middleware. Every operation checks current account and lesson access. `coaching-context.server.ts` projects only current guided evidence and saved answers; original answer keys, future cases, identity and billing information are excluded from the model request. Numerical checks reuse `evaluateStep()` from the learning engine. Feedback is structurally validated, references are allowlisted, and text is rendered without HTML.

Migration `0004_coaching_records.sql` adds `coaching_session`, `coaching_generation`, and the narrow `tradely_coaching_command` SQL function. A short advisory lock plus attempt/session row locks make admission, two-round budget reservation, input snapshots and generation creation atomic with the existing `neon-http` driver. No interactive transaction callback is required. No database migration runs during build.

A logical generation is stored before its provider call. Session/round and command IDs are unique. Repeating a request retrieves the existing generation. A 45-second abandoned lease becomes `indeterminate`; it is not automatically dispatched again. A late successful response can still be saved against its original snapshot. Delete scrubs both snapshots and feedback, and a racing response cannot restore deleted content. Provider/persistence exceptions are replaced with fixed diagnostic messages before logging.

There is intentionally no automatic retry for ambiguous provider failures. A learner can continue with the course's static hint and ordinary exercises. Existing immutable submissions are never reopened for coaching. Runtime history is scoped to the current attempt and is recovered on the lesson page; the first release does not add a cross-attempt history browser.

## Configuration

All values are server-only:

- `AI_COACH_ENABLED=false` by default.
- `AI_COACH_USER_IDS`: comma-separated exact Tradely account IDs; no wildcard.
- `AI_COACH_MODEL=anthropic/claude-haiku-4.5`: the initial bounded candidate, not yet validated for teaching quality.
- `AI_GATEWAY_API_KEY`: use a Tradely-specific key. It is never passed to the browser.
- `AI_COACH_DAILY_BUDGET_USD=10`: complete-session admission budget per UTC date, at most $100. It is a reservation budget, not a claim about wall-clock provider spend when an old session finishes on a later day.

The provider is pinned to Anthropic via Vercel AI Gateway, with no model/provider fallback and SDK retries disabled. Input is bounded conservatively by UTF-8 bytes plus 4,096 framing/schema tokens, up to 32,000; output is limited to 1,200 tokens, with a 20-second abort deadline. Conservative rates are 1.25 micro-USD per input token and 5.5 per output token. A full two-round session reserves 93,200 micro-USD ($0.0932). Current catalog pricing is checked before admission/calls and cached for at most a minute; absent or higher pricing stops calls. Observed usage is stored separately; unknown usage uses the reservation estimate, never zero. Reservations are not refunded opportunistically, which prevents concurrency and unknown-outcome overspend.

Free-access users may start one session per UTC day; users with full course access may start three. A reserved second round can finish after midnight without a new admission allowance. Global disable, revoked access or incompatible model/rubric changes can still prevent new calls. No Stripe product, checkout price or existing Course Pass entitlement is changed. Pilot access does not promise unlimited lifetime AI.

## Local checks and model evaluation

Run under Node 24:

```sh
pnpm --filter web coaching:preflight
pnpm --filter web coaching:evaluate
pnpm --filter web exec vitest run src/domain/coaching src/server/coaching.server.test.ts src/server/coaching-provider.server.test.ts src/features/learning/coaching-panel.test.tsx src/analytics/coaching-events.test.ts
```

Preflight reports presence only and reads the public model catalog. It does not contact the database or generate text. A nonzero result with no key/cohort configured is expected before activation.

The evaluation dry run validates 90 authored synthetic prompts: 60 development examples and 30 acceptance examples, balanced across the three lessons and English/Chinese. They use guided evidence, not the curriculum's held-out evaluation cases. Expectations are retained for human review and are not sent to the model.

With a separately budgeted development key and the configured model, run:

```sh
pnpm --filter web coaching:evaluate --run --development
pnpm --filter web coaching:evaluate --run
```

Each run creates a new directory under ignored `artifacts/coaching/`, writes a running record before each call and persists the result/metadata afterward. A rerun is a deliberate new experiment and can incur new charges; the tool does not automatically replay uncertain calls. Review the 30 acceptance outputs blind against their expectations. The script does not call a model to grade itself or claim that schema-valid responses teach effectively. Two-round revision behavior also requires human review before release.

For local UI review, use the existing isolated preview:

```sh
pnpm --filter web exec vite --config learning-preview/vite.config.ts --port 8264
```

Open `http://127.0.0.1:8264/?lesson=rank-symbols&coaching=1`, or select another pilot lesson and append `lang=zh&theme=dark`. The banner identifies deterministic fixture feedback; everything resets on reload. These files are outside the application build. They are not an anonymous production AI endpoint.

## Retention and deployment sequence

Private explanations, input snapshots and feedback remain in the account until the learner deletes the coaching record or requests account deletion. Coaching/session ownership uses cascading account/attempt foreign keys. Deleting a coaching record clears its text immediately but retains a short-term tombstone for admission accounting. It does not delete the user's original lesson answers.

The retention command removes tombstones older than 30 days and clears old token/cost/timing details and admission dates. It preserves minimal reservation state for unfinished sessions and the user's non-deleted learning record. It is dry-run by default and does not load a database URL from a file implicitly:

```sh
pnpm --filter @tradely/db coaching:purge
# With the intended DATABASE_URL already supplied through the secure environment:
pnpm --filter @tradely/db coaching:purge --apply
```

Before public activation:

1. Confirm the target already records migrations 0000–0003, then apply the reviewed additive migration 0004 to preview. Historical migration 0003 includes a prelaunch reset and must not be replayed against live data. Confirm actual Neon compatibility, current free/paid/denied accounts, concurrent commands, deletion and resume. PGlite tests alone are not hosted database proof.
2. Configure the dedicated Gateway key, exact cohort IDs and model in preview; run preflight and controlled real model evaluation. Verify actual provider processing/log-retention settings before publishing claims about them.
3. Run the browser lifecycle checks, consent/privacy verification, and client-asset boundary scan; verify source maps or diagnostics do not contain learner text.
4. Arrange daily execution of the retention command through the existing operator scheduler and verify a run. The repository does not silently create a production schedule or apply a migration.
5. Enable a small invited cohort only after feedback quality, latency, cost and operational checks pass. Keep the four-week learning/retention study separate from implementation validation.

Disabling `AI_COACH_ENABLED` stops new generations while still allowing authorized history reads and deletion. Without the additive tables and with the feature disabled, existing practice remains usable. Keep the additive data on rollback; do not drop tables or rewrite grades.
