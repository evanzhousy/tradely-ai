# Lesson 16: gamma — SVG review

The Learn stage of `gamma` now contains three interactive SVG scenes. Shared local Greek calculations own cents, sensitivities and position scaling; authored snapshots stay server-only and reach the authorized Learn projection. Motion does not own grading or position state.

## Teaching behavior

- **Separate the calculations.** The chart switches between next option delta and gamma's price term. Given delta 0.50, gamma 0.04/$1 and a $2 rise, delta changes by 0.08 to 0.58, while the price estimate adds $1.00 from delta and $0.08 from the half-gamma squared term. A $2 fall keeps that gamma price term positive but gives a combined −$0.92 change per unit. The put example preserves its negative quoted delta and positive option gamma. Gamma's role in changing delta and the long/short sign distinction follow the [OIC Gamma overview](https://www.optionseducation.org/advancedconcepts/gamma).
- **Replay a hedge.** For the supplied two long calls with multiplier 100, a $2 rise changes position delta from +100 to about +116 shares-equivalent. The existing −100-share hedge leaves +16 residual delta. Only after an assumed sale of 16 shares does the snapshot return to zero delta. Shorting the position or reversing the stock move changes the required adjustment. Position gamma is labeled in shares-equivalent per $1. Switching to Greeks only withholds positions, residual delta and hedge instructions.
- **Inspect sensitivity.** Native SVG buttons and a select inspect five illustrative snapshots: longer-dated ATM, 0-DTE ATM/OTM/ITM, and missing gamma. The 0-DTE ATM snapshot has higher supplied gamma than the other complete examples. A $4 move produces a raw constant-gamma extrapolation of 1.30; a −$4 move produces −0.30. Both remain visible as diagnostics while the usable call-delta estimate is withheld. Neither is clamped to 0 or 1. Being within bounds is explicitly not proof of accuracy.

The examples are local approximations with other inputs fixed. They do not establish unknown dealer holdings, guarantee hedge fills, remove gamma/volatility/time/cost risk, or define a universal near-expiry sensitivity curve.

## Validation

- Five focused/shared files passed: **37 tests**, including 10 gamma tests and the 10 existing delta tests after extracting shared arithmetic into `local-greeks.ts`. Tests cover the two gamma formulas, signed hedges, one multiplier, zero/missing/invalid inputs, raw out-of-bounds values, date consistency, SVG/form controls, snapshot buttons, replay interruption, reset, Chinese and protected projection.
- Workspace type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed.
- The existing version 2 grader still accepts `0.48` for next delta and `-6` for the additional stock hedge. Lab controls do not submit assessment actions; Continue enters the original assessment.
- Desktop checks verified formula switching, the residual before a hedge fill, zero delta after it, sign reversal, missing position evidence and all five sensitivity snapshots.
- Visual review found an initially misleading neutral-state label before adjustment. The final label now follows actual residual delta, with tests for both residual and neutral states. The explanation covers rises and falls, and the position-gamma unit is explicit.
- All three scenes fit at 390px in Chinese dark mode with no horizontal overflow or SVG text outside the viewBox. Reduced motion stayed off during pointer interaction. Keyboard input changed the underlying move to $2.25 and next call delta to 0.59. Tapping SVG snapshot A selected its 0.52 estimate at the starting $0.50 move. The updated hedge label was also checked on mobile.
- The production-built local route `http://127.0.0.1:8252/learn/gamma` was checked separately for the anonymous paid-access gate. Authored TAU contract markers were absent from client JavaScript while the new lab title was present. No authenticated paid-account session was used.

## Evidence

[Lesson 16 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-16-interactive-evidence.gif)

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=gamma&lang=en&theme=light`. This review entry renders the real learning UI with synthetic examples and no account/database/billing/analytics connections. It is not a deployed or authenticated paid-account recording.

The adjacent `lesson-16-evidence-frames/capture.json` stores the URL, browser frame times, UI assertions and errors. Separate desktop, mobile and paid-gate JSON files retain their checks. The GIF uses genuine browser screenshots.

The final export is 25.38 seconds, 784 × 1500 pixels, 203 frames and 584,405 bytes. All 25 recorded assertions passed, including the corrected hedge status, both adjustment directions, missing evidence, direct SVG selection, keyboard scrubbing, pause and reset. No browser exceptions or log errors were reported. A decoded contact sheet was visually reviewed.

Lessons 17–36 and the final curriculum-wide audit remain required. No push or deployment was performed.
