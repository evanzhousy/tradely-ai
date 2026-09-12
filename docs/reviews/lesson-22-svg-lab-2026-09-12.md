# Lesson 22: gamma exposure — SVG review

The Learn stage of `gamma-exposure` now includes three interactive SVG scenes. The domain model owns the stated contribution formula and scope-aware aggregation; server-only fixtures own contract inputs and supplied contribution grids; exploration stays local and ungraded. The formula experiment is explicitly separate from already-scaled grid outputs.

## Teaching behavior

- **Scale a contribution.** Native controls change OI, hypothetical spot and an assumed position sign. The stated convention is gamma × OI × multiplier × spot² × 0.01 × sign, in USD delta exposure per +1% underlying move. The initial input produces +200,000; OI playback visits 1,000/1,500/2,000/2,500 and ends at +500,000. Reversing the assumption reverses the result. Doubling spot quadruples the frozen-gamma expression. Missing sign withholds the signed result. This is not a forecast of repriced gamma, ownership or actual hedging.
- **Inspect the distribution.** Native SVG cell buttons and an equivalent select inspect a 2-expiry × 3-strike grid. Distribution A has net +100, gross 400 and near-expiry net −150; distribution B has net +100, gross 100 and near-expiry net +100. Selecting a cell updates its expiry subtotal without changing the complete total. Units and model assumptions remain attached; supplied values are not scaled again.
- **Check the whole chain.** Full, traded-only, missing-value and explicit-zero cases retain the declared six-cell scope. Traded-only excludes −80 and +120, leaving a known subtotal +60 but no complete total. One missing +120 contribution leaves known subtotal −20 and no complete total. Explicit zeros count as known observations. Excluded and missing cells remain inspectable and distinctly labeled. Completeness is relative to the teaching scope, not a live-chain claim.

## Validation

- **28 tests across four files passed**, including 11 new tests for scaling, sign assumptions, invalid/missing inputs, net/gross/local distributions, excluded/zero/missing values, duplicate and foreign identities, controls, playback interruption/reset, Chinese, and the authorized Learn boundary.
- Workspace type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed.
- Version 2 assessment remains unchanged. The original first case accepts net 60, gross 160, and the equal-total comparison choice. Exploration dispatches no grading actions. The test uses the engine's existing numeric-response and choice-answer actions; no grading change was needed.
- Desktop review found no horizontal overflow or SVG text beyond the viewBox in any scene. Formula bars animate width during explicit playback and use an SVG reflection for negative direction. Direct input remains immediate.
- At 390px in Chinese dark mode, all scenes fit. Reduced motion remained off under pointer interaction. The native SVG selected an excluded contract and exposed subtotal +60 with no complete total. Keyboard ArrowRight moved OI from 1,000 to 1,100, producing +220,000. Enter practice opened the original assessment and removed the lab.
- The production-built route `http://127.0.0.1:8252/learn/gamma-exposure` enforced the anonymous paid gate, with no lab or authored model marker. The exact model marker was absent from client JavaScript while the lab title was present. No authenticated paid-account session was used.

## Evidence

[Lesson 22 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-22-interactive-evidence.gif)

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=gamma-exposure&lang=en&theme=light`. It renders the real learning UI using synthetic fixtures with no account/database/billing/analytics connections. It is not deployed or authenticated paid-account evidence.

The export is 24.26 seconds, 784 × 1150 pixels, 194 frames and 386,266 bytes. All 23 recorded UI assertions passed with no browser exceptions or log errors. The decoded contact sheet and mobile screenshot were visually reviewed. The adjacent `lesson-22-evidence-frames/capture.json` retains the URL, actual browser-frame times, assertions and errors; separate desktop, mobile and paid-gate JSON records retain those checks.

Lessons 23–36 and the final curriculum-wide audit remain required. The owned production preview was stopped after verification. No push or deployment was performed.
