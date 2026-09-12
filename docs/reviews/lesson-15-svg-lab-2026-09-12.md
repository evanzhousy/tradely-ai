# Lesson 15: delta — SVG review

The Learn stage of `delta` now has three interactive SVG scenes. The domain model owns unit conversion and position signs, server-only data owns the hypothetical examples, and UI motion changes presentation without writing assessment state.

## Teaching behavior

- **Move the underlying.** A native SVG slider and equivalent form slider vary a small underlying move. The supplied call has model delta +0.50 and a $4.00 starting price; a $0.40 rise estimates $4.20. The supplied put has delta −0.40 and a $2.50 starting price; the same rise estimates $2.34. Fractional-cent estimates stay visible instead of being rounded before the calculation. This follows delta's definition as a local theoretical price sensitivity, with other inputs fixed. [OIC technical information](https://www.optionseducation.org/referencelibrary/faq/technical-information), [OIC option price behavior](https://www.optionseducation.org/referencelibrary/faq/option-price-behavior).
- **Build position exposure.** Model delta, contract count, multiplier and long/short sign remain separate in the SVG calculation. Two long 100-unit calls produce +100 shares-equivalent and about +$40 for a $0.40 stock move. Shorting the same options leaves the quoted +0.50 delta unchanged but reverses the position to −100 and −$40. A short put example produces positive position delta. The 100/10-unit size selector explicitly compares hypothetical specifications, not an actual contract-term change.
- **Test the limits.** A separate, declared quadratic curve compares a fixed 0.50 slope with a response that also contains ½ × 0.04 × move² in dollar units. At a $0.40 move, the curve price is $4.2032 versus the $4.20 line; at $8 it is $9.28 versus $8.00, with a $1.28 gap and local slope 0.82. This is a mathematical illustration, not a market-pricing model or universal safe-move threshold. Changed volatility or elapsed time withholds the total estimate while retaining the explicitly mechanical old-delta spot calculation. Missing delta withholds that calculation too.

The UI distinguishes model sensitivity from inferred flow sentiment, share-equivalent exposure from share ownership, and estimated value changes from realized profit. Probability interpretations require additional assumptions. The curve legend uses dashed/solid line styles so it remains accurate in both themes.

## Validation

- Four focused/shared regression files passed: **27 tests**, including 10 delta-lab tests. Tests cover cents and multipliers, all position signs, fractional-cent calculations, zero/missing/invalid inputs, curve tangency and declared chart bounds, linked SVG/form controls, changed-input limits, replay interruption/reset, Chinese and protected projection.
- Workspace type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed.
- Version 2 grading is unchanged. The test submits learner answers `120` and `60` through the existing grader and confirms both are accepted; it does not depend on the floating-point string representation of the authored key.
- Desktop browser checks verified put/call changes, sign reversal, quantity and lot-size effects, and missing/changed-input conditions. The three rendered scenes were visually reviewed.
- All three scenes fit a 390px viewport in Chinese dark mode without horizontal overflow or SVG text outside the viewBox. Reduced motion stayed off under pointer input. Keyboard ArrowRight moved the local stock change from $0.40 to $0.45 and the call estimate to $4.225. Enter practice opened the existing position-delta and value-change questions.
- The production-built route `http://127.0.0.1:8252/learn/delta` was checked separately for the anonymous paid-access gate. Authored call/put identity markers were absent from client JavaScript, while the new lab title was present. No authenticated paid-account session was used.

## Evidence

[Lesson 15 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-15-interactive-evidence.gif)

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=delta&lang=en&theme=light`. The review entry renders the real learning UI with synthetic examples and no account/database/billing/analytics connections. It is not a deployed or authenticated paid-account recording.

The adjacent `lesson-15-evidence-frames/capture.json` records source URL, frame times, UI assertions and browser errors. Separate desktop, mobile and paid-gate JSON files retain their checks. The GIF uses genuine browser frames.

The final export is 24.88 seconds, 784 × 1350 pixels, 199 frames and 408,402 bytes. All 19 recorded UI assertions passed, including small/wide moves, long/short reversal, sizing, changed/missing inputs, pause, keyboard scrubbing and reset. No browser exceptions or log errors were reported. The decoded contact sheet was visually reviewed.

Lessons 16–36 and the final curriculum-wide audit remain required. No push or deployment was performed.
