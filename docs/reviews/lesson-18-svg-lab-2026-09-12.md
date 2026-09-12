# Lesson 18: implied and realized volatility — SVG review

The Learn stage of `implied-realized-volatility` now has three interactive SVG scenes. A lesson domain model owns pricing/inversion, sampled-return statistics and comparison eligibility; server-only data owns the hypothetical prices, returns and reference snapshots. UI exploration does not write assessment state.

## Teaching behavior

- **Infer IV from price.** Learners adjust trial IV or fit it to a supplied last, bid or ask price. The deliberately restricted model is a European ATM call with zero rates/dividends and ACT/365 maturity. Fitting the $2.40 last price over 30 days gives about 20.99% IV. The $2.52 ask gives 22.04%; changing the assumed maturity to 60 days gives 15.58% for that same price. Missing prices disable fitting. The UI identifies these as model assumptions, not editable terms of a real contract or observed future volatility. The model-input distinction follows the [OIC Black-Scholes overview](https://www.optionseducation.org/advancedconcepts/black-scholes-formula).
- **Measure past returns.** The supplied eight-session sample gives 21.2132% annualized RV using sample SD (n−1) and 252 observations/year. The latest four sessions give 14.4914%. Two-session sampling compounds adjacent simple returns and uses 126 periods/year; the four-session example then gives 0.0595%. The deliberately alternating short sample exposes how coarse sampling can hide intermediate moves. A hypothetical final-return control changes the estimate. Missing observations are retained as missing and withhold the result; they are not dropped or initialized as zero.
- **Compare horizons.** A source-relative schematic separates forward 30 calendar days from trailing 20 trading sessions, without implying equal lengths. The supplied IV30 30% / RV20 24% pair differs by +6 volatility points, or +25% relative to RV. This question requires matching underlying/as-of data and the declared daily simple-return sample-SD definition with 252 annual periods. Different dates/identities, missing values, unknown windows and unspecified sampling withhold the comparison. Unspecified historical volatility is not labeled as the required RV20. A defined comparison remains context, not a return forecast or certain mispricing.

The price model, return exercise and standardized references are separate examples. The supplied RV20 is not reconstructed from the four/eight-session exercise, and IV30 need not represent a single listed contract.

## Validation

- Four focused/shared files passed: **29 tests**, including 12 new volatility tests. Tests cover three independent Python `math.erf` pricing benchmarks (within 0.002 cents), bounded inversion, maturity/source effects, quote-cent fitting, zero and missing inputs, compound sampling, independent Python `statistics.stdev` references, annualization, complete source definitions and protected projection.
- Workspace type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed.
- Version 2 grading is unchanged. The existing grader accepts `8` volatility points and the `context` interpretation. Local fitting/controls do not submit assessment actions; Continue opens the existing assessment.
- Desktop verification confirmed price fits, lookback/sampling changes and all comparison failure cases. Active-tab ARIA and computed styles matched the selected panel.
- All three scenes fit at 390px in Chinese dark mode without page overflow or SVG text outside the viewBox. Reduced motion stayed off during pointer interaction. Keyboard ArrowRight changed trial IV from 40% to 40.01%. Missing sampling withheld the spread, and Enter practice opened the original questions.
- The production-built local route `http://127.0.0.1:8252/learn/implied-realized-volatility` enforced the anonymous paid gate. Authored model/return identity markers were absent from client JavaScript while the new lab title was present. No authenticated paid-account session was used.

## Evidence

[Lesson 18 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-18-interactive-evidence.gif)

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=implied-realized-volatility&lang=en&theme=light`. The review entry renders the real learning UI with synthetic examples and no account/database/billing/analytics connections. It is not a deployed or authenticated paid-account recording.

The export is 21.38 seconds, 784 × 1250 pixels, 171 frames and 499,285 bytes. All 23 recorded UI assertions passed, including fits, price/maturity changes, return perturbation, sampling, missing inputs, source-definition gates and reset. No browser exceptions or log errors were reported. A decoded contact sheet was visually reviewed.

The adjacent `lesson-18-evidence-frames/capture.json` records the source URL, genuine browser-frame times, UI assertions and errors. Separate desktop, mobile and paid-gate JSON files retain their checks.

Lessons 19–36 and the final curriculum-wide audit remain required. No push or deployment was performed.
