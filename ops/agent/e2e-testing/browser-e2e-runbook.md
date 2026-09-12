# Tradely Browser E2E runbook

## Objective and ownership

Run the current [E2E test-case inventory](e2e-test-cases.md) against the selected Tradely environment using **[@Browser](plugin://browser@openai-bundled)**, testing **one concrete case per goal round**, then summarize every finding and coverage gap.

The inventory owns expected behavior and stable case IDs; this runbook owns execution and maintenance; each run's report owns evidence, findings and the resumable queue. Do not copy the complete inventory into this procedure or treat automated test titles as browser proof.

Read [AGENTS.md](../../../AGENTS.md) and use the installed `runbook-maintainer` skill when executing or maintaining this procedure. This is the canonical execution runbook; the [directory index](README.md) links its supporting files.

## Agent Handoff

Last updated: 2026-09-12

Documentation creation only; no goal, browser session, application tests or provider checks were executed in this pass.

- First execution: perform the Git-history refresh below before browser testing; there is no completed-run baseline or existing results ledger.
- Resolve the target environment and fixture availability at execution time. No hosted deployment, test identity, payment or cancellation fixture has been verified by this document.
- The creation-time worktree contains concurrent application edits, including audit-recap teaching work. Recheck current status and include relevant uncommitted changes in the refresh; do not absorb or overwrite another task's changes.

Keep this section to 3–7 actionable bullets (maximum 12). On resume, replace these initial items with the active report path, last durable round/next case and unresolved prerequisite actions. Completed work belongs in the report, not here.

## Recommended invocation

To have the agent refresh first and then start the goal, send:

```text
Run ops/agent/e2e-testing/browser-e2e-runbook.md using @Browser.
First update the runbook and e2e-test-cases.md from recent Git history and
current code. Then use /goal to execute the refreshed browser E2E queue,
one concrete test case per goal round. Finish with all findings,
coverage gaps and GIF evidence. Use the local test environment by default.
```

To invoke directly in goal mode:

```text
/goal Run ops/agent/e2e-testing/browser-e2e-runbook.md using @Browser.
Refresh this runbook and e2e-test-cases.md from Git history before the first
test. Execute one concrete case per round and checkpoint each result.
Summarize all findings, unverified boundaries and GIF evidence at the end.
```

An explicit Preview/test URL in the user's invocation overrides the local default. The local default is the URL configured by the current dev server; verify it from source/startup output rather than assuming an old port. Do not silently choose production or infer that local code matches a hosted deployment.

When the user asks only to write/update this runbook, perform documentation maintenance only. Do not start a goal or execute tests. When asked to run it, the request authorizes routine testing within the specified test environment; it does not authorize live charges, canceling real subscriptions, production mutations, sending messages to other people, or unrelated repairs.

## 1. Mandatory refresh from Git history — before testing

Start with the handoff and active report. Inspect current repository instructions and preserve dirty/untracked work. Use the commands below from the repository root; review outputs without exposing `.env` contents or credentials.

```bash
git status --short
git rev-parse HEAD
git log -20 --date=iso-strict --format='%h %ad %s'
git diff --name-status
git diff --cached --name-status
rg --files apps/web/src packages/db ops/agent/e2e-testing
```

1. Resolve `last_reviewed_code_sha` from the previous run's refresh record. On the first run use the inventory's recorded baseline commit as a starting point. Verify that the ref exists and is an ancestor of the current code; never manufacture a baseline or mark an unchecked revision reviewed.
2. For a valid baseline, inspect the **entire** range to HEAD, including renamed/deleted files, rather than just the latest 20 commits. The short log above is orientation only. Substitute the verified SHA for `<baseline>` in these commands:

   ```bash
   git merge-base --is-ancestor <baseline> HEAD
   git log --reverse --format='%h %s' <baseline>..HEAD -- apps/web packages/db packages/env packages/ui package.json pnpm-lock.yaml ops
   git diff --find-renames --name-status <baseline> HEAD
   git diff <baseline> HEAD -- apps/web/src/routes apps/web/src/server apps/web/src/auth apps/web/src/domain apps/web/src/content packages/db/src
   ```

3. If the baseline is missing, unreachable, or not ancestral after a rebase, inspect available history and perform a full current route/feature/test inventory. Record the history gap. Do not silently truncate review to a chosen date or claim complete historical coverage.
4. Read relevant changed components, tests, configuration and docs, including working-tree and staged changes and new untracked application files. Inspect sensitive configuration by names/presence and environment identity only. Record dirty-path/content fingerprints privately so later rounds can detect changes without putting source patches or secrets into reports.
5. Map each user-visible change to affected case IDs: route/navigation, sign-up/sign-in, access, checkout/payment/cancellation, learning/progress, labs/replay, media, coaching, privacy and accessibility. Read the current implementation and tests to resolve the actual behavior; commit subjects are not an oracle. Check changed tests for new assertions and missing browser coverage.
6. Update **this runbook first** where prerequisites, commands, environment setup, evidence requirements or execution order have drifted. Update the **case inventory** where scope, expected results, routes, lesson/lab coverage or automated supporting references changed. Preserve stable IDs; append new IDs. Record retirement/replacement of obsolete IDs and the reason. Never rewrite an expected result to excuse an apparent regression in the agreed product contract.
7. Refresh affected automated test declarations/source references and totals in the inventory. Verify the current route set, syllabus/free IDs and enabled feature boundaries. Avoid hard-coding current case/lesson counts into this runbook.
8. Write a refresh record in the new/active run report: previous baseline, reviewed code SHA, dirty-state scope, commits/range examined, changed paths → affected/new/retired case IDs, procedure edits and unresolved contract questions. If no relevant change exists, record the range reviewed and `Pre-run maintenance: no change` rather than making cosmetic edits.
9. Validate links, case IDs, totals and `git diff --check`. Commit only the validated documentation changes owned by this run, following repository instructions. Do not push. Store `last_reviewed_code_sha` as the application revision actually reviewed, not merely the subsequent documentation commit.

**Refresh gate:** Browser testing starts only after this review and queue reconciliation. If the target is hosted, record its deployment/revision evidence separately. If it is older than the refreshed local inventory, preserve the discrepancy and mark affected tests blocked/unsupported for that deployment; do not describe an undeployed feature as a proven production regression.

## 2. Resolve prerequisites and establish the goal

After the refresh, read the current inventory's fixture and browser matrix. Record:

- Base URL, local/Preview/production classification, application revision/deployment, startup command if local, and current dirty-state scope.
- Available anonymous and distinct verified test accounts; unpaid/member/pass-owner/manual-grant fixtures and saved-attempt versions as required by individual cases. Use aliases A/B in reports.
- Verified separation of non-production Auth, database and Stripe test configuration. Inspect no secrets in output. A public page or local URL alone does not prove test-mode billing.
- Current feature availability: Course Pass sales flag, media edition, coaching cohort/budgets, portal cancellation policy, provider linking policy. Record unavailable evidence as unknown.
- Available @Browser capabilities for viewport, locale, keyboard, reduced motion, WebGL, network/console inspection and recording. Do not claim Firefox/Safari coverage from Chromium viewport emulation.

Repair routine local startup/environment issues within existing authorization before abandoning browser coverage. Preserve existing services; identify the process/port before starting another instance, and stop only a process owned by this run. Production setup changes, enabling paid AI generation and destructive fixture changes remain bounded by user authorization. Continue independent eligible cases while a case-specific prerequisite is missing.

**Goal contract:**

- Objective: execute the refreshed, explicitly enumerated browser acceptance queue one case per round and deliver a complete findings/coverage report for the named environment.
- Success: every applicable queued instance has a final evidenced PASS or FAIL; every genuine NOT APPLICABLE has feature/config evidence; no unresolved BLOCKED, NOT RUN or RUNNING instances; final report, GIF links and handoff are validated. Product defects may remain: this is a testing goal, not a remediation goal. A completed audit with defects is not a green release.
- Stop: successful audit completion, user-directed pause/cancellation, or a genuine global impasse under the active goal controller's rules. Do not stop because a single case fails or because the queue is long.

Use the available goal controller (`create_goal` when exposed) only after the user requests execution. If `/goal` already created a goal, continue it rather than creating a second one. Do not invent a token budget. If goal mode is unavailable, record that limitation and do not claim ordinary turns are automatic goal continuation.

For a normal run request, finish preflight before creating the execution goal. For a direct `/goal` invocation, complete preflight at the beginning of its first turn and execute at most the first case in that turn. Preflight, recovery-only and final-report turns are control turns, never fabricated test rounds. This exception does not permit batching multiple cases in later turns.

## 3. Materialize a finite, resumable case queue

Create `runs/<UTC-run-id>/report.md` under this directory, where the run ID is a timestamp such as `20260912T180000Z`. Create it at execution time, not during documentation-only maintenance. Keep sanitized report/queue files in Git. Keep raw captures, sensitive transcripts and large media under the repository's ignored `tmp/browser-e2e/<run-id>/` directory; export sanitized GIFs there and use absolute file links. Reports must identify local-only evidence that is unavailable from a fresh clone.

Build the queue from the **refreshed** inventory:

1. Include every acceptance row. Split compound rows into concrete instances where they specify multiple offers, statuses, invalid inputs, routes, providers, languages, account states or independent outcomes. Expand every current lesson's L01–L07 checks and required case variants. Enumerate route/guide sweeps from the current registries.
2. Assign stable instance IDs, for example `AUTH-012/email-new/desktop-en`, `BILL-018/member-period-end/desktop-en`, or `LESSON-option-contracts-L04-A/desktop-en`. Preserve the parent ID. Every split branch must appear explicitly; a parent is not complete while any required child remains untested.
3. Apply the inventory's browser/viewport/locale/accessibility matrix deliberately. Record each required configuration, which cases it expands, and the rationale for representative repeated coverage; do not silently shrink “each lesson” into one example. Unsupported requested browser engines/capabilities are coverage gaps, not equivalent passes.
4. Record supporting automated declarations separately as unit/component/server coverage references. They are not hundreds of extra browser cases merely because they appear in the appendix. A server-only assertion may need a controlled request/provider/DB check attached to the same browser case. If unavailable through authorized tools/fixtures, mark that required evidence blocked.
5. Order by dependencies and risk: onboarding/sign-in → payments/access → learning/progress → cancellation/access-loss/recovery; then remaining discovery/labs/privacy/secondary cases. Delay cancellation until tests relying on that subscription finish, or use distinct fixtures. Keep all queued P1/P2 cases; prioritization is not scope reduction.
6. Freeze the queue and matrix revision before the first case. Add newly discovered requirements explicitly with source/reason; never delete an unexecuted row to improve completion numbers. Retired cases remain traceable with reason and replacement.

The queue table in `report.md` is the single source of progress:

| Instance ID | Parent | Fixture / matrix | Dependencies | Status | Latest round | Evidence / blocker |
| --- | --- | --- | --- | --- | --- | --- |

Use `NOT RUN`, `RUNNING`, `PASS`, `FAIL`, `BLOCKED`, `NOT APPLICABLE`. Preserve previous round records when retesting; update only the latest queue disposition. No separate checked-off list in the runbook.

## 4. Use the requested @Browser surface

Use the bundled **@Browser** surface for application interactions, OAuth/Checkout/Portal journeys and visual evidence. Load its current instructions and follow only capabilities actually exposed in the session. Do not silently substitute ego-browser, a standalone Playwright/agent-browser session, curl, static source checks or rendered component tests for @Browser acceptance.

Where the host exposes @Browser through CUA's in-app browser, the documented entry is `cua.createBrowserTab("iab", verifiedBaseUrl, { visible: true })` via `mcp__cua_repl.js`. Its first invocation must contain only the supported entry call; read the returned documentation/state before continuing. Discover other browser entry points from the current tool inventory rather than assuming this adapter is always installed.

Inspect the page before acting. Prefer current semantic locators and refresh state after navigation or rerender. Capture actual transitions and resulting UI. Do not read private framework internals to manufacture browser proof. Network/server/provider checks may supplement visible evidence within the selected case but must be labeled separately.

If @Browser is unavailable, record the tool-availability blocker. Source review, queue preparation and report maintenance can continue; browser cases cannot pass. If only screenshot capture is available, assemble a clearly labeled **sampled interaction GIF** from actual before/during/after screenshots in order. Do not simulate interactions or use AI-generated frames. If neither recording nor a valid sampled GIF is possible, record the missing GIF as an evidence blocker rather than claiming full verification.

## 5. One test case per goal round

A **test round** is one goal execution turn dedicated to exactly one queue instance and one expected outcome. It can contain multiple browser actions needed for that case and supporting evidence checks. Retries/debugging of the same instance are allowed; a second independent instance must wait for the next goal round. Do not delegate cases or launch parallel test agents.

At each turn:

1. Read the active report/checkpoint. Confirm the target URL, account fixture, latest queue revision and whether the previous round ended durably. A `RUNNING` case without a finished record is incomplete; inspect its actual state before resuming, especially after checkout or cancellation. Never blindly repeat a possibly successful payment.
2. Check for relevant application/deployment/dirty-state changes since the last round. If changed, perform the refresh gate again before the next test. Preserve old evidence under its old revision, invalidate affected latest passes for the new target and enqueue explicit retests. Routine report commits alone do not invalidate application coverage.
3. Choose **one** eligible NOT RUN case or a blocked case whose prerequisite has actually changed. If none are eligible, handle the impasse rules below. Update its status to RUNNING and save the planned round number, instance ID, expected outcome and fixture before interacting.
4. State a short pre-round plan to the user: round number, case ID, environment and behavior being tested. Establish only the selected case's prerequisites; do not count setup as passing other cases.
5. Execute the case in @Browser. Record reproducible actions, observable result, relevant sanitized errors/network evidence and persistence/provider confirmation required by the inventory. Record fixture changes and any cleanup/reuse obligation.
6. Capture a sanitized GIF showing the actual interaction and result with the environment in its caption. For email/OAuth/payment pages, omit sensitive entry frames and preserve non-sensitive transition/outcome evidence. Never save OTPs, cookies, card data, raw learner text, credentials or signed media URLs in Git/reports.
7. Assign a result using the rules below; append the round record and update only that instance's queue status. Multiple findings from the same case may be recorded in this round. Log an unrelated incidental observation as **unverified** and queue its own case; do not claim it tested.
8. Checkpoint the report and handoff before ending the turn. State the one-case outcome and next case briefly. **End this goal turn without starting the next case**; leave the active goal to continue in its next round. A tool call or a paragraph label is not a new goal round.

Per-round record:

```text
Round: <sequential integer>; instance: <ID>; parent: <ID>
Started/finished (UTC): <timestamps>
Target: <environment, URL without sensitive query, code/deployment revision>
Matrix/fixture: <browser, viewport, locale, motion, account alias/access>
Prerequisites: <verified conditions and setup references>
Expected: <one outcome from inventory>
Actions: <reproducible ordered steps>
Observed: <visible result and discrepancy>
Status: PASS | FAIL | BLOCKED | NOT APPLICABLE
Evidence: <absolute sanitized GIF link, browser/network evidence,
           separately labeled domain/provider confirmation>
Findings: <stable finding IDs or none>
Fixture changes/cleanup: <owned resources and safe next action>
Next eligible instance: <ID>
```

## 6. Evidence, results and blockers

- **PASS:** expected visible behavior and all required domain/provider evidence are present, with GIF evidence. Source/unit results cannot fill a missing browser/provider boundary.
- **FAIL:** reproducible application behavior violates the supported contract. Preserve evidence, severity and affected instance; continue other independent cases. Do not automatically fix the product or change expected results. Fixes require scope authorization, their own validation/commit and a later one-case retest.
- **BLOCKED:** cannot execute or prove a required assertion due to unavailable browser, credentials, fixture, provider, deployment, permissions or capture capability. Include the exact missing condition, attempts and next action. Partial visible success with missing payment/persistence proof is blocked overall; keep the proven sub-observations.
- **NOT APPLICABLE:** the conditional branch is demonstrably disabled or intentionally absent in the target and the inventory permits that branch to be skipped. Cite config/content evidence. Missing tools, lack of time or unavailable accounts are not N/A.

For each finding record: stable ID, severity (separate from case priority), affected users/flow, expected versus actual, minimal reproduction, first/last revision, evidence links, confirmed versus suspected cause, and recommended next action. Deduplicate common causes while retaining every affected case and environment. Keep infrastructure/fixture gaps separate from confirmed product defects.

A failed case does not block the whole goal. Continue independent cases and retain failed prerequisites as blockers on dependent cases. Do not loop unchanged blocked cases just to inflate rounds.

If all remaining work is blocked, record a partial report and the precise user/external action needed. Follow the actual goal controller: where `update_goal` is exposed, mark blocked only after the same global blocking condition persists for at least three consecutive goal turns and no meaningful independent work remains. Earlier recovery turns may inspect prerequisites and improve evidence; do not invent browser cases to fill them. After user resumption, recheck conditions and start the blocked-turn count afresh. Never mark the goal complete merely to stop continuation while required cases remain blocked/unrun.

On user pause or budget interruption, checkpoint honestly; do not claim completion. Do not create a heartbeat/scheduled task to bypass a stop. Resume from the saved queue with environment/version checks.

## 7. Final findings report and completion

At the end of execution (or any genuine stop), finalize `runs/<run-id>/report.md` with:

1. Outcome: **complete audit with/without defects**, **blocked**, or **partial/user-paused**. State release readiness separately; any failed critical gate or missing required evidence prevents an all-green claim.
2. Refresh summary: reviewed Git range, changes to runbook/inventory, target revision/deployment, uncommitted scope and any revision drift/retests. Include the matrix actually exercised.
3. Coverage: total concrete instances and distinct parents; counts for PASS, FAIL, BLOCKED, NOT APPLICABLE, NOT RUN and RUNNING. Reconcile totals exactly. Report the lesson sweep and browser/configuration coverage separately. Retests add round records, not duplicate queue-instance counts.
4. **All findings**, sorted by severity, with affected case IDs, impact, reproduction and evidence. Include sign-in/sign-up, membership/Course Pass payments, and cancellation through actual access loss as explicit lifecycle summaries, even if blocked.
5. Every blocker/unsupported branch and what would resolve it. Clearly separate @Browser, automated/server checks, real-provider proof and unverified behavior. Link representative GIFs in the user-facing summary and the complete per-case evidence index in the report.
6. Remaining test-owned fixture cleanup, remediation recommendations and retest list. Delete only disposable resources created by this run within authorized scope; preserve shared accounts/subscriptions and prior evidence. Document retained fixtures for the next run.
7. Runbook maintenance decision and next-run handoff. No completed todos or raw logs in this runbook.

Validate case counts, unique IDs, queue-to-round references, evidence-file existence, links and `git diff --check`. Review screenshots/GIFs for secrets before referencing or committing reports. Commit only owned sanitized documentation/report changes after validation; do not push or absorb concurrent edits.

Mark the goal complete only when its success criteria are actually satisfied and no required work remains. An audit can finish with confirmed product defects if every applicable case has been executed and reported; never equate that with the application passing. Report blocked/partial coverage explicitly instead of silently narrowing the objective.

The final user response must be self-contained: outcome, tested environment, coverage totals, highest-impact findings, all-findings report link, GIF evidence links, commit, remaining blockers and whether runbook maintenance changed anything. Documentation-only passes must explicitly say the tests/goal were not run.

## Runbook Self-Maintenance

At the start of every execution, perform the Git-history refresh. At the end, use `runbook-maintainer` and a short `greenfield` review to compare the actual run with an ideal next execution.

- Promote only supported durable lessons into prerequisites, ordering, browser instructions, case preparation or evidence gates. Keep transient counts, incidents and findings in the run report.
- Update the inventory when product contracts/routes/case definitions change; update this procedure when execution changes. Preserve stable IDs and report historical evidence against its original revision.
- Keep one bounded Agent Handoff pointing to the current queue, next action and unresolved blockers. Prune completed/obsolete bullets before adding new ones.
- Correct stale commands/paths or weak verification gates when observed. If a contract is ambiguous, preserve the uncertainty and request the necessary decision rather than teaching the next agent a guess.
- If nothing durable changed, state `Runbook maintenance: no change` in the report. Do not edit for cosmetic activity or copy full logs into the runbook.
- Update the [directory index](README.md) and [operations index](../../README.md) when this runbook is added, renamed, moved or replaced. Use thin links instead of duplicate procedures.

This procedure applies the installed maintainer skill; it is not a mirror of that skill. Do not modify the installed skill or unrelated repositories during a Tradely test run.
