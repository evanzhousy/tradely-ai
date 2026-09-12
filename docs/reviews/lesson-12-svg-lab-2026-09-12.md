# Lesson 12: unusual activity — SVG review

The Learn stage of `unusual-activity` now has three interactive SVG scenes. Ratio math and comparison eligibility remain separate from the existing assessment; authored samples, benchmark metadata and source windows remain server-only.

## Teaching behavior

- **Denominator effects.** A native SVG control and an equivalent labeled range vary a hypothetical denominator while volume stays fixed. Relative volume uses a typical-volume baseline; volume/OI uses dated outstanding contracts. The smaller record has 10 contracts of volume but a 10× volume/OI ratio. Missing or non-positive denominators produce unavailable results, not zero or infinity; observed zero activity remains a valid zero ratio.
- **Matching windows.** Complete-session comparisons and matched first-hour comparisons both produce 2× in the supplied examples. First-hour versus full-session, incomplete coverage, a different contract baseline and missing benchmark evidence withhold the ratio. The displayed bars represent declared time windows; the supplied coverage flag remains an independent requirement.
- **Screening and pooling.** A declared inclusive threshold selects rows. The learner can inspect all rows or only those passing the screen. Equal-row means and pooled ratios are shown for that explicit population. Each row exposes its numerator and denominator. For all rows, relative-volume mean is 1.5× versus pooled 1.9091×; volume/OI mean is 5.1× versus pooled 0.2098×. Selecting only the high-turnover row makes both 10×. An empty or incomplete selected population has no summary ratio.

These are population-level ratio summaries, not an instruction to merge unlike-contract tape prices. A screen is a declared research filter, not proof of opening trades, informed ownership or future returns. Sliders are labeled as hypothetical exploration.

## Boundaries and validation

- Authored data lives in `activity-concept.server.ts` and enters only the authorized Learn projection. The lab rejects absent or mismatched teaching data.
- Version 2 grading remains unchanged: guided relative volume 3 and volume/OI 0.5. Independent variants and progress controls are preserved.
- Full learning/domain/content/server regression run: **35 files, 280 tests passed**. Type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed.
- Ten focused tests passed, covering valid zero activity, missing/invalid denominators, matched windows/scope/coverage, mean versus pooled ratios, filtering, empty selection, SVG input linkage, playback interruption, Chinese reset and protected projection.
- Desktop verification confirmed denominator effects, all six window cases and summary changes under filtering. No browser exceptions or log errors were reported.
- At 390px, all three Chinese dark-mode scenes fit without horizontal overflow or SVG text outside the viewBox. Reduced motion stayed off for pointer interaction. Keyboard ArrowRight moved the SVG denominator from 100 to 101 and the ratio to 1.9802×. Continue to practice opened the original relative-volume question.

- The production-built local route at `http://127.0.0.1:8252/learn/unusual-activity` enforced paid access for the anonymous browser, with no lab or authored contract in the document. Authored contract markers were absent from the client build. No live authenticated paid-account session was used.
- The final recorded sequence reported no browser exceptions or log errors.

## Evidence

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=unusual-activity&lang=en&theme=light`. The separate review entry uses the real `LearningScreen` and authored synthetic cases without account/database/billing/analytics connections. It is not a deployed or authenticated paid-account recording.

[Lesson 12 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-12-interactive-evidence.gif)

The export is 21.01 seconds, 784 × 1100 pixels, 168 frames and 387,773 bytes. A decoded contact sheet was visually reviewed.

The adjacent `lesson-12-evidence-frames/capture.json` contains source URL, frame times, observed values and browser errors. Frames are genuine browser captures, assembled without reconstructing the interface.

This is one checkpoint toward completing the remaining curriculum. Lessons 13–36 and the final curriculum-wide completion audit remain required. No push or deployment was performed.
