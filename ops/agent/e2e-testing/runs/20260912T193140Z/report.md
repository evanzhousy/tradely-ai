# Tradely Browser E2E run report

Run ID: `20260912T193140Z`
Status: `PARTIAL` — Browser round 1 complete; queue remains unmaterialized for the remaining cases
Target: local development server, `http://localhost:8250/`
Browser surface: @Browser / Codex In-app Browser (Chromium-backed)
Started UTC: 2026-09-12T19:31:40Z

## Refresh record

- Previous inventory baseline: `c16a86f8287065212224d39cc32a6c64884c2c9d`.
- Reviewed application HEAD: `8ef25191b9d854399c1c897f0d9092ef1249635e`.
- Ancestry: verified by the Git range review; commits from the baseline through HEAD were inspected for application, package and ops changes.
- Current dirty scope preserved and excluded from owned changes: `apps/web/src/content/units/portfolio.server.ts`, `apps/web/src/domain/learning/types.ts`, `apps/web/src/features/learning/learning-screen.tsx`, new `pnl-concept` sources/scenes, deleted legacy ops files and `ops/cursor/`.
- Relevant committed changes since baseline: audit-recap lesson/lab and test, E2E inventory/runbook creation, plus prior learning labs and product/analytics changes.
- Inventory refresh: 120 test files and 682 source declarations/templates. The audit-recap test adds 10 declarations; syllabus remains 36 lessons. Current dirty P&L lab changes affect learning/lab coverage and require a retest against the changed worktree.
- Runbook change in this execution: added Feishu Mail OTP authentication procedure and its blocker/evidence rules.
- Pre-run maintenance: procedure changed for the explicitly requested Feishu mailbox authentication path; expected case IDs remain stable.

## Environment and prerequisites

- Local server started with `pnpm dev:web`; Vite reported `http://localhost:8250/`.
- Startup warning: current Node is `v22.16.0`; repository requires Node 24.x. Local browser evidence is therefore environment-qualified and may be blocked for release acceptance until Node 24 is used.
- `VERCEL_OIDC_TOKEN` was reported unset by the local env runner. No environment values or secrets were printed.
- Feishu Mail is available as a native app on the host, but no approved mailbox/test identity or Feishu Mail connector access has yet been verified. Email-authenticated cases remain blocked until the assigned non-production mailbox is confirmed.
- Stripe test-mode membership/pass fixtures, cancellation policy, Neon Auth test identities and GIF capture output have not yet been verified.

## Queue

The queue was not fully materialized before the first recovery round because the current Browser surface exposed no local GIF export path and the authentication/payment fixtures remain unresolved. The remaining queue must still be materialized from the refreshed 122 acceptance rows, the 36 × 7 lesson sweep, current route/guide registries and required browser/configuration matrix. Each concrete instance remains one status row and one goal round.

| Instance ID | Parent | Fixture / matrix | Dependencies | Status | Latest round | Evidence / blocker |
| --- | --- | --- | --- | --- | --- | --- |
| AUTH-001/email-returning/desktop-en | AUTH-001 | Assigned verified Feishu-mail test identity; Chromium 1440×900; English | Feishu mailbox and OTP delivery | BLOCKED | — | Mailbox/identity not yet verified |
| NAV-001/home-free-cta/desktop-en | NAV-001 | Anonymous; Chromium 1280×720; English | Local page loaded | BLOCKED | 1 | Visible navigation succeeded; required sanitized GIF file could not be exported from @Browser |
| NAV-002/home-catalog/desktop-en | NAV-002 | Anonymous; Chromium 1280×720; English | Local page loaded | BLOCKED | 2 | Catalog matched 36 lessons/8 modules/7 free lessons; required sanitized GIF file could not be exported from @Browser |
| NAV-003/free-filter/desktop-en | NAV-003 | Anonymous; Chromium 1280×720; English | Curriculum loaded | BLOCKED | 3 | Filter showed exactly 7 of 36 free lessons; required sanitized GIF file could not be exported from @Browser |

## Round records

### Round 1 — NAV-001/home-free-cta/desktop-en

- Started/finished UTC: 2026-09-12T19:33Z.
- Target: local `http://localhost:8250/`, current worktree at `8ef25191b9d854399c1c897f0d9092ef1249635e` plus preserved dirty changes.
- Matrix/fixture: Codex In-app Browser, Chromium-backed, 1280×720 screenshot, English, anonymous.
- Expected: homepage free-foundations CTA navigates to `/learn/option-contracts`.
- Actions: opened local homepage; activated the visible “Start the free foundations course” CTA; inspected the resulting URL and accessibility tree.
- Observed: URL became `/learn/option-contracts`; the lesson route exposed a visible Sign in link and the analytics-consent dialog. The destination was visibly reached. The screenshot was emitted by @Browser, but the current surface did not expose a writable GIF/export path.
- Status: `BLOCKED` overall because the runbook requires a sanitized GIF file for a Browser PASS. Visible navigation sub-observation: pass.
- Evidence: inline @Browser screenshot in the execution turn; no report file link available. No server/provider mutation was involved.
- Findings: `BLK-EVID-001` — Browser evidence capture lacks a local GIF export path in the exposed @Browser surface.
- Cleanup: none.
- Next eligible instance: `NAV-002/home-catalog/desktop-en` (after queue materialization).

## Findings and blockers

- `BLK-ENV-001` — P1 infrastructure: local server runs under Node 22 although the repo requires Node 24. Resolve by starting the same target under Node 24 before treating local results as release-grade.
- `BLK-AUTH-001` — P0 fixture: assigned Feishu mailbox/test identity and OTP retrieval path are not verified. Resolve by providing/authorizing the non-production Feishu mailbox; do not use a guessed or hard-coded OTP.
- @Browser availability is verified through the Codex In-app Browser surface; no interaction result or GIF has been captured yet.

### Round 3 — NAV-003/free-filter/desktop-en

- Started/finished UTC: 2026-09-12T19:37Z.
- Target: local `http://localhost:8250/courses/tradingflow-foundations`, current worktree at `8ef25191b9d854399c1c897f0d9092ef1249635e` plus preserved dirty changes.
- Matrix/fixture: Codex In-app Browser, Chromium-backed, 1280×720, English, anonymous.
- Expected: Free filter returns exactly the seven explicit free lesson IDs without changing access based on syllabus position.
- Actions: selected the visible Free tab and inspected the result count, free lesson links and module groups.
- Observed: result text was `7 of 36 lessons`; the four foundation lessons and three research previews were visible, with only their contracts/research module groups shown. This matched the source access metadata.
- Status: `BLOCKED` overall because a sanitized GIF file could not be exported; functional visible observation matched expected.
- Evidence: inline @Browser accessibility state in the execution turn; no report file link available.
- Findings: `BLK-EVID-001` (same capture blocker).
- Cleanup: none.
- Next eligible instance: `NAV-004/search-localized/desktop-en` after queue materialization.

### Round 2 — NAV-002/home-catalog/desktop-en

- Started/finished UTC: 2026-09-12T19:35Z.
- Target: local `http://localhost:8250/courses/tradingflow-foundations`, current worktree at `8ef25191b9d854399c1c897f0d9092ef1249635e` plus preserved dirty changes.
- Matrix/fixture: Codex In-app Browser, Chromium-backed, 1280×720, English, anonymous.
- Expected: curriculum route exposes the current 36 lessons in eight modules and current free-access metadata.
- Actions: opened the curriculum route; inspected the accessibility tree for totals, module headings, lesson links and free filters.
- Observed: visible totals were 36 lessons, 8 modules and 7 free lessons; filter showed 36 of 36; all module groups and lesson links were present, including portfolio P&L. No sign-in was required to inspect the catalog.
- Status: `BLOCKED` overall because the runbook requires a sanitized GIF file for a Browser PASS; functional visible observation matched expected.
- Evidence: inline @Browser accessibility state from the execution turn; no report file link available.
- Findings: `BLK-EVID-001` (same capture blocker).
- Cleanup: none.
- Next eligible instance: `NAV-003/free-filter/desktop-en` after queue materialization.

## Next action

Verify the assigned non-production Feishu mailbox and test identities, resolve the Node 24 runtime, then freeze the queue and execute exactly one eligible Browser instance in the next goal round. Keep this report and the runbook handoff synchronized.
