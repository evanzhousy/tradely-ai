# Lesson 14: source clocks and coverage — SVG review

The Learn stage of `symbol-drawer` now contains three interactive SVG scenes. The lesson teaches source availability, task-relative validity and exact cohort membership using authored synthetic examples. Its version 2 assessment remains unchanged.

## Teaching behavior

- **Separate the clocks.** The replay moves through 09:58, 10:00, 10:02 and 10:04 ET. A trade occurs at 09:59 but reaches the observer at 10:02. Before receipt its available quantity is unknown, not zero; afterward the observer can use 20 contracts without changing the event time. Prior-cleared OI stays at 900 contracts with its own as-of/receipt dates, and the model snapshot retains its separate date. The illustrated delivery schedule is not a product-latency claim.
- **Match the requirement.** Learners choose the current, latest completed or selected historical session, then audit one of nine alternative snapshots. Identity, session, event window, unit, receipt availability, observed value and full required coverage are checked independently. A newer BETA receipt cannot replace ALFA. An observed zero passes the complete current-session requirement; missing and not applicable remain distinct. A partial count describes only its declared subset.
- **Track the same series.** A two-report replay moves exact expiry-series cards into or out of a 0–30 DTE group. Rolling membership changes from A/B to B/C; total OI rises from 1,600 to 2,900. The 1,300 difference decomposes into −100 retained-series change + 2,000 entering OI − 600 exiting OI. Fixed membership keeps A/B and falls from 1,600 to 900 (−700). The supplied later report for expired A is explicitly zero. Withholding it makes the fixed comparison unavailable while leaving the rolling comparison valid; withholding retained B affects both.

The cohort scene reuses the existing membership and missing-aware comparison functions from `oi-concept.ts`. Native SVG geometry owns card positions during direct input and reduced motion; optional animation moves cards only during playback. The comparison remains retrospective and does not claim that later receipts were available at an earlier historical decision time.

## Validation

- Five focused/shared files passed: **38 tests**, including 11 new source-lab tests and the existing OI lab regression. Coverage includes exact receipt boundaries, invalid/future receipt times, zero/missing/not-applicable values, independent source checks, explicit session selection, calendar DTE consistency, cohort decomposition, missing-value dependencies, playback interruption, reset, Chinese and authorized Learn projection.
- Workspace type checks, production build, changed-file Biome, PostHog credential scan, media-boundary assertion and `git diff --check` passed.
- Desktop browser checks exercised all nine source snapshots. The selected historical source passed its stated historical requirement; a newer completed session did not. SVG card positions and displayed totals were visually reviewed.
- All three scenes fit at 390px in Chinese dark mode without page overflow or SVG text beyond the viewBox. Reduced motion remained off during pointer input. Two keyboard ArrowRight inputs revealed the trade at receipt while preserving prior OI. The later rolling report placed A outside and B/C inside using native SVG transforms.
- Enter practice opened the original flow-session and fixed-report OI questions: accepted answers remain `yes` and `-70`. Local lab controls do not write assessment actions.
- The production-built local route `http://127.0.0.1:8252/learn/symbol-drawer` enforced the anonymous paid gate. New authored contract and source-name markers were absent from client JavaScript, while the new lab title was present. No authenticated paid-account verification was performed.

## Evidence

[Lesson 14 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-14-interactive-evidence.gif)

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=symbol-drawer&lang=en&theme=light`. The review entry renders the real learning UI with synthetic fixtures and no account/database/billing/analytics connections. It is not a deployed or authenticated paid-account recording.

The adjacent `lesson-14-evidence-frames/capture.json` records URL, frame times, UI assertions and browser errors. `lesson-14-mobile-checks.json`, `lesson-14-desktop-checks.json` and `lesson-14-paid-gate.json` retain the separate verification results. Frames are genuine browser screenshots.

The final GIF is 25.51 seconds, 784 × 1250 pixels, 204 frames and 438,867 bytes. All 19 assertions in the recorded sequence passed, including play/pause, keyboard scrubbing, reset and missing-value dependencies. No browser exceptions or log errors were reported. A decoded contact sheet was visually reviewed.

Lessons 15–36 and a final curriculum-wide audit remain required. No push or deployment was performed.
