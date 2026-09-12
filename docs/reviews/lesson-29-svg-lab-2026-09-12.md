# Lesson 29: rank contracts — SVG review

The Learn stage of `rank-contracts` now includes three interactive SVG scenes. The lesson reuses existing contract-scope and call-moneyness rules, adding scope-aware known/complete totals, peaks and breadth. Server-only fixtures own the fixed call neighborhoods and source-session metadata. The existing investigation-stage neighborhood comparison remains intact.

## Teaching behavior

- **Explore the neighborhood.** Native SVG cells and an equivalent contract selector expose strike, expiry and volume. Expiry focus dims other rows and reports a focused subtotal without changing the full nine-cell scope total. Selecting a different expiry moves the focus with the selected contract. Hypothetical spot changes moneyness only: the 105 call moves from OTM at 103 through ATM at 105 to ITM at 110 while observed volume and full total remain fixed.
- **Compare the shapes.** Two fixed layouts both total 8,000 contracts and peak at 3,000. The compact layout has three nonzero cells and the broad layout has nine. Explicit comparison playback changes the layout and animates the breadth meter. Explicit zeros count as known coverage but not nonzero breadth. The playback is not a reconstructed market session.
- **Audit the candidates.** Missing, prior-session and outside-scope cases retain raw values for inspection. A missing required cell or a 12,000-contract prior-session observation leaves known eligible subtotal 7,500 and known peak 3,000, but complete total and peak unavailable. A visible 20,000-contract row at strike 115 is outside the fixed scope and cannot displace its complete peak 3,000 or total 8,000. A shape does not identify spreads, common ownership or a forecast.

## Validation

- **31 tests across five files passed**, including 10 new scene/model tests and the existing contract-scope tests. Coverage includes totals/peak/breadth, explicit zeros, missing/stale values, invalid values, duplicate identities, scope exclusion, focus, moneyness, playback interruption, Chinese and the authorized Learn boundary.
- Workspace type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed.
- Version 2 assessment remains unchanged. Its first case accepts breadth 3 and OTM for the 105 call at its supplied spot 100. Exploration dispatches no assessment actions. Continue removes the new lab and retains the original two-case neighborhood comparison and questions.
- Desktop review caught one SVG caption extending beyond its viewBox. It was split into two lines, then tests, types and build were rerun; the corrected English caption passed the browser bounding check. Final desktop/mobile checks found no horizontal or SVG text overflow.
- At 390px in Chinese dark mode, all scenes fit, including the outside-scope inspection control. Reduced motion remained off under pointer input. Native SVG selection plus keyboard ArrowRight moved reference spot to 105 and the 105 call to ATM, retaining volume 2,500 and full total 8,000. Enter practice opened the existing paired-neighborhood investigation and original assessment.
- The production-built route `http://127.0.0.1:8252/learn/rank-contracts` enforced the anonymous paid gate with no lab or authored source marker. The exact source marker was absent from client JavaScript while the lab title was present. No authenticated paid-account session was used.

## Evidence

[Lesson 29 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-29-interactive-evidence.gif)

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=rank-contracts&lang=en&theme=light`. It renders the real learning UI with synthetic fixtures and no account/database/billing/analytics connections. It is not deployed or authenticated paid-account evidence.

The export is 25.13 seconds, 784 × 1350 pixels, 201 frames and 348,962 bytes. All 24 recorded UI assertions passed with no browser exceptions or log errors. Frame sampling pauses while tabs settle; actual frame times are retained. The decoded contact sheet, source frames and mobile screenshot were visually reviewed. The adjacent `lesson-29-evidence-frames/capture.json` stores the environment, URL, timestamps, assertions and errors; separate desktop, mobile and paid-gate JSON records retain their checks.

Lessons 30–36 and the final curriculum-wide audit remain required. The owned production preview was stopped after verification. No push or deployment was performed.
