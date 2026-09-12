# Lesson 27: symbol universe — SVG review

The Learn stage of `symbol-universe` now includes three interactive SVG scenes. The lesson domain derives candidate eligibility from source facts, keeps unknown candidates separate from observed qualifiers, and validates a positive numeric baseline. Server-only fixtures own the source records and dated membership snapshots. Exploration remains local and ungraded; this is a free research-path lesson.

## Teaching behavior

- **Apply the rule.** A staged SVG replay checks instrument, session, coverage and volume floor. Native row buttons expose the underlying facts, including D's misleading ready badge alongside missing coverage/value. The stock/same-session/≥500 rule admits A 800 and E 500; it excludes the ETF, prior-session row and known below-floor F 200. Unknown D is retained as unknown. Type and floor controls recompute eligibility; playback withholds admission count until the full rule is checked.
- **Name the denominator.** The original observed eligible count is two and subtotal 1,300; complete qualifying total is unavailable. A supplied same-session correction D=1,500 gives three qualifying rows, total 2,800 and leader D under the unchanged rule. Independently, A's 800 contracts divided by a typical option-volume baseline of 500 is 1.6×; changing the baseline changes the ratio without changing peer count. Missing or nonpositive baselines remain unavailable. The earlier incomplete sample is not retrospectively certified.
- **Keep historical membership.** Fixed historical observations belong to a separately declared membership example. OLD was a historical member and led with 1,200; a later membership list omits it and adds NEW with no supplied history. Applying that list backward makes A the remaining observed leader but changes the population. OLD's data stays visible and NEW is never backfilled with zero. Restoring historical membership restores OLD as the observed leader. This is not a performance backtest.

## Validation

- **27 tests across four files passed**, including 10 new tests for source-derived eligibility, threshold boundaries, unknown coverage, corrected totals, positive baselines, controls, staged playback/interruption, historical membership, Chinese and public Learn access.
- Workspace type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed.
- Version 2 assessment remains unchanged. Its first case accepts one admitted observed row, subtotal 800 and the limited-claim choice. Exploration dispatches no assessment actions; Continue opens the original questions.
- Desktop review found no horizontal overflow or SVG text beyond the viewBox in all scenes. The stage marker animates only during explicit playback; rule changes immediately recompute the complete rule result.
- At 390px in Chinese dark mode, all scenes fit, including the corrected three-peer view. Reduced motion remained off under pointer input. A native SVG member selection exposed NEW's unknown historical volume while retaining OLD's value. Keyboard ArrowRight moved the floor from 500 to 600 and admitted count from two to one. Continue opened the original assessment with no lab remaining.
- The production-built local route `http://127.0.0.1:8252/learn/symbol-universe` opened the free lab while signed out. Broadening type changed admitted rows from two to three; reloading and reopening restored two. The page states that anonymous decisions reset on reload.
- The authored source marker was absent from client JavaScript while the lab title was present. Teaching data is intentionally returned through the public Learn projection for this free lesson; no authenticated account session was used.

## Evidence

[Lesson 27 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-27-interactive-evidence.gif)

The GIF records the **production-built local application, anonymous free preview**, at `http://127.0.0.1:8252/learn/symbol-universe`. It shows the actual application route with synthetic authored teaching records, not a deployed site or authenticated account session.

The export is 29.88 seconds, 872 × 1350 pixels, 239 frames and 506,907 bytes. All 21 recorded UI assertions passed with no browser exceptions or log errors. Frame sampling pauses while tabs settle; actual capture times are retained. The decoded contact sheet and mobile screenshot were visually reviewed. The adjacent `lesson-27-evidence-frames/capture.json` stores the environment, URL, timestamps, assertions and errors; separate desktop, mobile and public-preview JSON records retain their checks.

Lessons 28–36 and the final curriculum-wide audit remain required. The owned production preview was stopped after verification. No push or deployment was performed.
