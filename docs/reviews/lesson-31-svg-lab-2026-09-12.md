# Lesson 31: reproducible research packet — SVG review

The Learn stage of `cookbook-research-packet` now includes three interactive SVG scenes. The domain model owns exact premium-cent arithmetic, required row identity/coverage and fixed-method comparison. Server-only fixtures own the sample packet and rerun proposals. The existing graded capstone dataset, writing fields and self-review behavior remain unchanged.

## Teaching behavior

- **Trace the calculation.** Native source-row buttons and staged playback expose R1: 10×$2×100=$2,000 and R2: 20×$3×100=$6,000. The observed subtotal is $8,000. Required R3 remains missing, so the complete total is unavailable. Used row IDs and the exact unit transformation stay visible. Safe-integer cent arithmetic rejects invalid, missing or overflowing inputs and ambiguous identities without silently dropping required rows.
- **Make the packet readable.** Six native field controls expose concrete question/universe, session/cutoff, source/row IDs, units/multiplier, transformation and missingness values. Omitted fields disappear from the record preview and are flagged explicitly. Even all six present fields still require self or human review and do not create the missing R3 observation. This is a local sample preview, not a saved real packet.
- **Preserve each rerun.** A permitted session-date change creates a new dated instance TEACH-P2 while retaining TEACH-P1. Its displayed R1/R2 inputs reproduce $2,400+$4,500=$6,900; original subtotal $8,000 and missingness remain visible. The session cutoff is a fixed method parameter, not a permitted date-only replay input. Changes to cutoff, universe, source or transformation require explicit revision and supporting evidence; no new result is published for those proposals.

## Validation

- **27 tests across four files passed**, including 10 new tests for exact money arithmetic, zeros/missingness/overflow, row IDs, fixed versus permitted parameters, direct controls, playback interruption, concrete field values, preserved originals, Chinese and the paid Learn boundary.
- Workspace type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed.
- Shared graded `packetData(0)` remains unchanged at $108,000. Version 2 assessment accepts that observed-premium value, while all three writing responses retain `reviewRequired: true` and are not automatically marked mastered. Exploration dispatches no assessment actions. Existing persistence code was not modified; no authenticated account save was exercised.
- Desktop review found no horizontal or SVG-text overflow. The dated rerun explicitly includes its new row inputs, and fixed/proposed cutoffs are shown side by side. Decorative stage markers use direct SVG positions except during explicit playback.
- At 390px in Chinese dark mode, all scenes fit without clipped SVG cards. Reduced motion remained off under pointer interaction. Keyboard Space reviewed a changed-cutoff proposal, withholding its new subtotal and retaining the original $8,000. Continue opened the original numeric question and three writing fields with no lab remaining.
- The production-built route `http://127.0.0.1:8252/learn/cookbook-research-packet` enforced the anonymous paid gate with no lab or authored marker. The source marker was absent from client JavaScript while the lab title was present. No authenticated paid-account session was used.

## Evidence

[Lesson 31 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-31-interactive-evidence.gif)

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=cookbook-research-packet&lang=en&theme=light`. It renders the real learning UI with synthetic fixtures and no account/database/billing/analytics connections. It is not deployed or authenticated paid-account evidence.

The export is 34.38 seconds, 784 × 1500 pixels, 275 frames and 687,204 bytes. All 28 recorded assertions passed with no browser exceptions or log errors. Frame sampling pauses while tabs settle; actual capture times are retained. The decoded contact sheet, source frames and mobile screenshot were visually reviewed. The adjacent `lesson-31-evidence-frames/capture.json` records the environment, URL, timestamps, assertions and errors; separate desktop, mobile and paid-gate JSON files retain those checks.

Lessons 32–36 and the final curriculum-wide audit remain required. The owned production preview was stopped after verification. No push or deployment was performed.
