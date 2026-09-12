# Lesson 20: IV rank and percentile — SVG review

The Learn stage of `iv-rank-percentile` now contains three interactive SVG scenes. Calculations belong to the lesson domain model, synthetic source fixtures remain server-only, and exploration stays local and ungraded.

## Teaching behavior

- **Compare two measures.** Move hypothetical current IV against five fixed, dated observations. Rank measures range distance; percentile counts strictly lower observations with ties retained in the denominator. At current 30, history 10/20/20/30/100 gives rank 22.22% and percentile 60%. Moving to 20 produces 11.11% and 20%; moving to 31 produces 23.33% and 80%. The current value is never appended to history.
- **Change one extreme.** Explicit playback changes only the historical maximum from 40 through 120 while current IV stays 30. Rank falls from 66.67% to 18.18%, but percentile remains 60%. Manual input interrupts playback. The diagram labels its changing normalized endpoints; these are hypothetical replacements, not observed market playback.
- **Audit the sample.** Eight cases expose complete, shorter, flat, tied, missing, incompatible-reference, unknown-coverage and current-in-history samples. Flat history leaves rank undefined while percentile remains defined. Missing or incompatible required evidence withholds both statistics. Raw observations remain visible. The teaching sample is not represented as a one-year estimate, and provider conventions can differ.

## Validation

- **27 tests across four files passed**, including 10 new tests for formulas, ties, outliers, flat histories, invalid values, date/reference/coverage rules, duplicate dates, native controls, playback interruption/reset, Chinese, and authorized projection.
- Workspace type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed.
- Original version 2 grading remains unchanged: its separate supplied history accepts rank 25 and percentile 40. Only Continue opens the original assessment; exploration dispatches no grading actions.
- Desktop verification covered all scenes and eight audit cases. At 390px in Chinese dark mode, all scenes fit without horizontal overflow or SVG text outside the viewBox. Reduced-motion policy remained off during pointer input. Keyboard ArrowRight changed current IV from 30 to 31 and produced rank 23.33% / percentile 80%. Enter practice opened the existing assessment.
- The production-built route `http://127.0.0.1:8252/learn/iv-rank-percentile` showed the anonymous paid gate, with no lab or authored reference. The exact authored reference marker was absent from client JavaScript; the new lab title was present. No authenticated paid-account verification was performed.

## Evidence

[Lesson 20 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-20-interactive-evidence.gif)

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=iv-rank-percentile&lang=en&theme=light`. It renders the real learning UI with synthetic fixtures and no account/database/billing/analytics connections. This is not deployed or authenticated paid-account evidence.

The export is 29.88 seconds, 784 × 1100 pixels, 239 frames and 530,174 bytes. All 27 recorded UI assertions passed, with no browser exceptions or log errors. A decoded contact sheet and the mobile screenshot were visually reviewed. The adjacent `lesson-20-evidence-frames/capture.json` preserves the source URL, actual browser capture timestamps, assertions and errors. Separate desktop, mobile and paid-gate JSON files retain those checks.

Lessons 21–36 and the final curriculum-wide audit remain required. The owned production preview was stopped after verification. No push or deployment was performed.
