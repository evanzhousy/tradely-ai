# Lesson 25: charm and vanna — SVG review

The Learn stage of `charm-vanna` now includes three interactive SVG scenes. The domain model owns derivative-unit conversion and partial delta effects; position scaling reuses `signedPositionUnits` from `local-greeks.ts`. Server-only fixtures own local derivatives and events. Exploration remains local and ungraded.

## Teaching behavior

- **Separate the effects.** Independent elapsed-calendar-day and IV-percentage-point controls update charm, vanna and combined delta changes. One day with IV +2 points gives −0.01 +0.04 = +0.03. The initial delta 0.45 is shown explicitly beside next delta 0.48. Playback visits controlled time/IV states. Two days and IV +1 point cancel at zero while both contributions remain nonzero. These are fixed-derivative first-order estimates, not full repricing or observed trades.
- **Read the convention.** Keep the event fixed while selecting elapsed-day, remaining-day or decimal-volatility representations. Charm −0.01 per elapsed day × +1 and charm +0.01 per remaining day × −1 both give −0.01. Vanna +0.02 per IV point ×2 and +2 per decimal volatility ×0.02 both give +0.04. Native SVG buttons reveal the relevant unit explanation. Unknown time convention or volatility scale withholds the affected term and combined result while retaining the other term.
- **Scale the position.** Event and quantity controls plus native SVG long/short buttons scale option delta change into shares-equivalent. +0.03 becomes +6 for two long contracts ×100 or −6 for two short contracts, while option delta remains 0.48. Missing position evidence withholds position change without erasing the known option effect. Time-only, IV-only and cancellation events remain distinct. Model changes and concentration labels do not establish dealer flows or hedge executions.

## Validation

- **27 tests across four files passed**, including 10 new tests for contribution arithmetic/cancellation, equivalent conventions, missing/invalid inputs, partial availability, signed units, controls, playback interruption/reset, Chinese and the authorized Learn boundary.
- Workspace type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed.
- Version 2 assessment remains unchanged. Its original first case uses two days, IV +1 point and two long contracts; both option and position delta changes are zero. Exploration dispatches no assessment actions; Continue opens the original questions.
- Desktop review found no horizontal overflow or SVG text beyond the viewBox in all scenes. The initial delta was added explicitly after visual review, then tests, types and build were rerun. Final GIF layout checks confirmed the scenes fit the capture. Explicit playback animates bar widths; numeric readouts and direct controls remain immediate.
- At 390px in Chinese dark mode, all scenes fit and reduced motion remained off under pointer input. The native short-position button changed +6 to −6; keyboard ArrowRight increased quantity from two to three and changed exposure to −9, retaining option delta 0.48. Enter practice opened the existing assessment with no lab remaining.
- The production-built route `http://127.0.0.1:8252/learn/charm-vanna` enforced the anonymous paid gate with no lab or authored reference marker. The exact reference marker was absent from client JavaScript while the lab title was present. No authenticated paid-account session was used.

## Evidence

[Lesson 25 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-25-interactive-evidence.gif)

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=charm-vanna&lang=en&theme=light`. It renders the real learning UI with synthetic fixtures and no account/database/billing/analytics connections. It is not deployed or authenticated paid-account evidence.

The export is 27.13 seconds, 784 × 1150 pixels, 217 frames and 334,466 bytes. All 22 recorded UI assertions passed with no browser exceptions or log errors. The decoded contact sheet and mobile screenshot were visually reviewed. The adjacent `lesson-25-evidence-frames/capture.json` stores the URL, actual browser capture times, assertions and errors; separate desktop, mobile and paid-gate records retain those checks.

Lessons 26–36 and the final curriculum-wide audit remain required. The owned production preview was stopped after verification. No push or deployment was performed.
