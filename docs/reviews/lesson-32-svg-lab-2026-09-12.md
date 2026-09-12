# Lesson 32: market recap — SVG review

The Learn stage of `market-recap` now includes three interactive SVG scenes. The lesson reuses Lesson 31's server-only teaching packet, with explicit strike-to-row mappings. The domain model separates contract counts from premium cents and calculates the effect of a cropped bar axis. Existing capstone data, writing persistence code and self-review behavior are unchanged.

## Teaching behavior

- **Match chart and claim.** Volume bars show 10 and 20 contracts; premium bars show $2,000 and $6,000. Chart metric and sample claim quantity are independently selectable. A mismatch is identified without falsely discarding the valid packet number. Native row buttons expose source identity and values. R3 always has a distinct missing marker, never an observed zero bar. The complete-universe total remains unavailable.
- **Inspect the scale.** A marked truncation demonstration raises the axis minimum from 0 to 5 to 9 and back during explicit playback. At minimum 9, the visible heights have ratio 11× while actual values retain ratio 2× and subtotal 30. Direct and keyboard input use immediate native SVG geometry; playback alone animates bar heights. This changes presentation, not observations.
- **Build a bounded recap.** Fixed headline examples contrast a supported partial observation with full-universe, opening-position/intent and forecasting overclaims. Repair retains the valid count and coverage boundary. Native caption controls assemble concrete source/row IDs, date/universe, axes/units and missingness. A complete caption does not automatically fix an unsupported headline or certify prose quality. This local sample is not saved or published; the writing exercise remains separate.

## Validation

- **27 tests across four files passed**, including 10 new tests for shared teaching data, independent metric dependencies, missing versus zero, axis ratios, metric/claim alignment, direct controls, playback interruption, fixed-template repairs, caption fields, Chinese and the paid Learn boundary.
- Workspace type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed.
- The distinct shared graded `packetData(0)` remains unchanged at 500 observed contracts. Version 2 grading still accepts that count and the unavailable-full-total choice. Both writing fields retain `reviewRequired: true` without automatic mastery. Exploration dispatches no assessment actions. No authenticated save or export was exercised.
- Desktop and 390px Chinese dark-mode review found no document/SVG-text overflow or clipped headline cards. The browser measured bar heights 19.0909 and 210 at axis minimum 9, confirming visual ratio 11 while the data ratio remained 2 and subtotal 30. Reduced motion remained off.
- Keyboard Space repaired the sample headline to the bounded observation. Continue opened the original numeric question and two writing fields, with no lab remaining.
- The production-built route `http://127.0.0.1:8252/learn/market-recap` enforced the anonymous paid gate with no lab or authored source marker. The source marker was absent from client JavaScript while the lab title was present. No authenticated paid-account session was used.

## Evidence

[Lesson 32 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-32-interactive-evidence.gif)

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=market-recap&lang=en&theme=light`. It renders the real learning UI with synthetic fixtures and no account/database/billing/analytics connections. It is not deployed or authenticated paid-account evidence.

The export is 32.63 seconds, 784 × 1450 pixels, 261 frames and 698,220 bytes. All 19 recorded assertions passed with no browser exceptions or log errors. Frame sampling pauses while tabs settle; actual capture times are retained. The decoded contact sheet and mobile screenshot were visually reviewed. The adjacent `lesson-32-evidence-frames/capture.json` stores the environment, URL, timestamps, assertions and errors; separate desktop, mobile and paid-gate JSON records retain those checks.

Lessons 33–36 and the final curriculum-wide audit remain required. The owned production preview was stopped after verification. No push or deployment was performed.
