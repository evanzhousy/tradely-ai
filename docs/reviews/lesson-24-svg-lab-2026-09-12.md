# Lesson 24: structural levels — SVG review

The Learn stage of `structural-levels` now includes three interactive SVG scenes. The lesson domain owns scope-aware concentration selection, OI-only intrinsic payouts and compatible-reference distances. Source rows and teaching references remain server-only. Exploration remains local and ungraded.

## Teaching behavior

- **Choose the level rule.** Native SVG strike buttons inspect values while selects change OI versus supplied gamma magnitude, calls versus puts, and near versus both expiries. The near call gamma maximum is 100 while the near call OI maximum is 105. Both-expiry call gamma selects 105 and put gamma selects 95. The domain retains tied positive maxima and withholds a complete result for missing required strike/expiry coverage. Bars disclose their per-view scaling; units and model source remain attached. Concentrations do not identify dealer ownership or guarantee support/resistance.
- **Explore payout minima.** An explicit settlement playback, native SVG candidate buttons and a settlement range expose call, put and total intrinsic payout. A single strike 100 with 10 calls and 20 puts yields $10,000 at settlement 95, $0 at 100 and $5,000 at 105. A two-strike example ties at candidates 95, 100 and 105 with total $20,000. Missing required OI withholds total and minima. No gamma or ownership assumption is needed, premiums are excluded, and a candidate minimum is not a settlement forecast.
- **Measure the distance.** Reference spot and ATR controls independently update signed dollar, spot-percentage and ATR distances. At level 100, spot 102 and ATR 2, outputs are −2 dollars, −1.96% and −1 ATR. ATR 4 changes only normalized distance to −0.5. Missing or zero ATR leaves dollar/percent distances available. A pre-split level 100 with post-split spot 51 blocks comparison; the supplied adjusted level 50 and ATR 1 restore compatible distances. ATR's stated historical window and price-scale assumptions remain visible.

## Validation

- **27 tests across four files passed**, including 10 new tests for concentration rules/scope/ties, incomplete coverage, intrinsic payout and tied candidates, missing OI, distance validity, native controls, playback interruption/reset, Chinese and the authorized Learn boundary.
- Workspace type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed.
- Version 2 assessment remains unchanged. Its first case accepts distance −1 ATR and payout 5,000 USD. Exploration dispatches no assessment actions; Continue opens the original questions.
- Desktop review found no horizontal overflow or SVG text beyond the viewBox in all scenes. The payout marker animates only during explicit playback; direct input is immediate. Candidate knots include the supplied strikes, so the illustrated connectors follow the example's piecewise-linear intrinsic payout.
- At 390px in Chinese dark mode, all scenes fit and reduced motion remained off under pointer input. An SVG candidate selected settlement 95 and payout $10,000; keyboard ArrowRight moved to 96 and payout $8,000. The adjusted split case displayed −1 dollars and −1 ATR. Enter practice opened the original assessment and removed the lab.
- The production-built route `http://127.0.0.1:8252/learn/structural-levels` enforced the anonymous paid gate with no lab or authored model marker. The exact model marker was absent from client JavaScript while the lab title was present. No authenticated paid-account session was used.

## Evidence

[Lesson 24 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-24-interactive-evidence.gif)

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=structural-levels&lang=en&theme=light`. It renders the real learning UI with synthetic fixtures and no account/database/billing/analytics connections. It is not deployed or authenticated paid-account evidence.

The export is 29.01 seconds, 784 × 1200 pixels, 232 frames and 524,039 bytes. All 22 recorded UI assertions passed with no browser exceptions or log errors. The decoded contact sheet and mobile screenshot were visually reviewed. The adjacent `lesson-24-evidence-frames/capture.json` stores the URL, actual browser capture times, assertions and errors. Separate desktop, mobile and paid-gate JSON files retain those checks.

Lessons 25–36 and the final curriculum-wide audit remain required. The owned production preview was stopped after verification. No push or deployment was performed.
