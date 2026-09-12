# Lesson 19: volatility surfaces — SVG review

The Learn stage of `volatility-surface` now contains three interactive SVG scenes. The lesson model owns cell lookup, wing compatibility and interpolation provenance; server-only fixtures own the surface and reference data. Existing authorization and grading remain unchanged.

## Teaching behavior

- **Slice the grid.** A native SVG 3×3 grid selects a strike/expiry cell. The learner can inspect a fixed-expiry strike slice or a fixed-strike term slice. Term points use actual calendar-day spacing, not equal category spacing. Midquote-derived and traded-only datasets have distinct values and coverage. Missing observations stay empty without connecting lines or fallback to another source.
- **Compare wings.** Supplied forward-delta, premium-unadjusted references produce put-minus-call skew +6 and butterfly +5 for the teaching example. Reversing the sign convention changes skew to −6 without changing butterfly. A missing ATM reference leaves skew available but withholds butterfly; a missing wing, incompatible expiry, coordinate convention or price source blocks the affected comparison. These delta/ATM references are explicitly distinct from the sparse fixed-strike grid.
- **Inspect estimates.** Interpolation starts off. The learner chooses linear IV or linear total variance and moves a native SVG tenor control. From supplied 14-day/28% and 42-day/24% ATM nodes, 30 days gives 25.7143% under linear IV and 24.8516% under linear total variance (ACT/365). Supplied nodes are filled, estimates outlined, and estimated curves dashed. Outside-anchor targets are not extrapolated. A known exact node remains available even when the other anchor is withheld. ATM30 is identified as a reference, not necessarily a listed contract.

The interpolation rules are illustrative, not a complete arbitrage-free surface or quote guarantee. All displayed IV inputs and assumptions are synthetic.

## Validation

- Four focused/shared files passed: **27 tests**, including 10 new surface tests. Coverage includes dimensions/dates, anchor consistency, missing source coverage, wing compatibility, sign convention, partial availability, interpolation benchmarks, no extrapolation, explicit provenance, SVG/form controls, Chinese and authorized projection.
- Workspace type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed.
- The term plot's 42-day point is checked at its actual position between 14 and 105 days. Visual review also caught line-drawing animation overriding the estimate dash pattern; an opacity transition now preserves `stroke-dasharray="5 4"`, with a regression assertion and browser verification.
- Version 2 grading remains unchanged. The original assessment accepts `6` skew points and `2` butterfly points from its own supplied values. Exploration writes no assessment actions; Continue opens the existing questions.
- Desktop verification exercised grid/source changes, partial wing availability, incompatible references and both interpolation methods. All three scenes were visually reviewed.
- At 390px in Chinese dark mode, all scenes fit without horizontal overflow or SVG text beyond the viewBox. Reduced motion remained off during pointer input. Native grid selection inspected a missing cell. Keyboard ArrowRight moved the tenor to 31 days and the variance estimate to 24.7569%; the dashed pattern and provenance remained visible. Enter practice opened the original assessment.
- The production-built route `http://127.0.0.1:8252/learn/volatility-surface` enforced the anonymous paid gate. Authored identity/convention markers were absent from client JavaScript while the new lab title was present. No authenticated paid-account session was used.

## Evidence

[Lesson 19 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-19-interactive-evidence.gif)

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=volatility-surface&lang=en&theme=light`. The review entry renders the real learning UI with synthetic examples and no account/database/billing/analytics connections. It is not a deployed or authenticated paid-account recording.

The export is 20.13 seconds, 784 × 1350 pixels, 161 frames and 434,048 bytes. All 23 recorded assertions passed, including direct SVG cell selection, source changes, missing wings, interpolation methods, dashed styling, missing anchors, exact supplied nodes and reset. No browser exceptions or log errors were reported. A decoded contact sheet was visually reviewed.

The adjacent `lesson-19-evidence-frames/capture.json` records the source URL, genuine browser-frame times, UI assertions and errors. Separate desktop, mobile and paid-gate JSON files retain their checks.

Lessons 20–36 and the final curriculum-wide audit remain required. No push or deployment was performed.
