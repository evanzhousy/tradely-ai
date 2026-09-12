# Lesson 17: time, volatility and rates — SVG review

The Learn stage of `theta-vega-rho` now has three interactive SVG scenes. The lesson domain owns input-unit differences and dollar contributions; shared local-Greek code owns signed contract scaling; authored snapshots and the example-specific explanation stay server-only.

## Teaching behavior

- **Read the units.** A native SVG control and equivalent range input vary calendar days, IV or interest rates. From 20% to 23% is 3 IV points and 15% relative growth. The supplied vega applies to 3 points, not 15 or 0.03. From 4% to 4.5% is 0.5 rate points, producing a $0.015 per-unit estimate at the supplied rho. Theta uses the explicitly declared calendar-day convention, including weekends. These definitions and their local-model limitations are consistent with the OIC references for [Theta](https://www.optionseducation.org/advancedconcepts/theta), [Vega](https://www.optionseducation.org/advancedconcepts/vega) and [Rho](https://www.optionseducation.org/advancedconcepts/rho).
- **Scale the position.** Three cards retain separate input units rather than comparing unlike sensitivities on one axis. Two long calls with multiplier 100 produce −$8/calendar day, +$20/IV point and +$6/rate point. Shorting reverses the position sensitivities without altering the quoted option Greeks. A supplied put illustrates a different rho sign. The quantity slider applies contract count and multiplier once.
- **Build the contributions.** A five-step attribution adds spot, time, IV and rates to one hypothetical shock. The two-call long example progresses through $0, +$40, +$24, −$36 and −$33. Final components are spot +$40, theta −$16, vega −$60 and rho +$3. All four bars use one signed USD scale. Shorting reverses each contribution. Hiding a Greek preserves unaffected contributions but withholds its component and the total.

The replay is a build-up of a hypothetical attribution, not observed sequential repricing or realized P&L. Greeks remain constant within this local sum. Gamma, changing sensitivities, cross-effects, exercise/assignment, dividends, financing, taxes and fees remain outside the declared estimate.

## Validation

- Six focused/shared files passed: **47 tests**, including 10 new lesson tests plus Delta and Gamma regressions after extracting `signedPositionUnits`. Tests cover point versus relative changes, calendar-day effects, signed quantities, zero/missing/invalid inputs, reconciliation, exact chart scale, native SVG/form controls, replay interruption/reset, Chinese and protected projection.
- Workspace type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed.
- Version 2 grading remains unchanged. Learner answers `-0.24` and `-34` still pass the original grader. Local controls write no assessment actions; Continue opens the existing questions.
- Desktop browser checks verified every build-up total, unit changes, call/put sign effects and missing contributions. The $60 vega bar spans 105 of the 140 SVG units from zero to the declared $80 boundary.
- All three scenes fit at 390px in Chinese dark mode without page overflow or SVG text beyond the viewBox. Reduced motion remained off during pointer input. Keyboard ArrowRight moved elapsed time from two to three days, changing the estimate from −$0.08 to −$0.12. Enter practice opened the original questions.
- The production-built route `http://127.0.0.1:8252/learn/theta-vega-rho` enforced the anonymous paid-access gate. Both UPSILON contract markers and the example-specific explanation were absent from client JavaScript. A final component reload confirmed that the displayed explanation exactly matches its server-owned source and retains the −$33 result. No authenticated paid-account session was used.

## Evidence

[Lesson 17 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-17-interactive-evidence.gif)

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=theta-vega-rho&lang=en&theme=light`. The review entry renders the real learning UI with synthetic examples and no account/database/billing/analytics connections. It is not a deployed or authenticated paid-account recording.

The export is 23.88 seconds, 784 × 1450 pixels, 191 frames and 419,312 bytes. All 24 recorded assertions passed, including the different units, sign/size changes, missing inputs, reversal, pause, keyboard scrubbing and reset. No browser exceptions or log errors were reported. A decoded contact sheet was visually reviewed.

The adjacent `lesson-17-evidence-frames/capture.json` stores source URL, frame times, UI assertions and errors. Separate desktop, mobile, paid-gate and final-verification JSON files retain their checks. The final internal move of the unchanged explanation into server-owned data was verified after recording; the rendered text and behavior are unchanged.

Lessons 18–36 and the final curriculum-wide audit remain required. No push or deployment was performed.
