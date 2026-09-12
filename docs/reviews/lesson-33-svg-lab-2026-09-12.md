# Lesson 33: audit a market recap — SVG review

The Learn stage of `audit-market-recap` now includes three interactive SVG scenes. The lesson reuses the server-only teaching packet and exact premium arithmetic from Lessons 31–32. It separates recalculating dollars, inspecting fixed report claims and preparing a bounded signoff. The distinct graded capstone dataset and writing-review path remain unchanged.

## Teaching behavior

- **Recalculate the number.** The flawed factors reproduce $20+$60=$80. Native row controls or explicit playback restore source multipliers: repairing R1 yields $2,060, then repairing R2 yields $8,000 observed premium. The valid R1 per-share price $2 stays visible throughout; R3 remains missing and the full total unavailable. Amount repair does not approve other report claims.
- **Find the first defect.** Fixed identity, date, expiry-scope, scale, coverage and inference examples show report excerpts beside source evidence. The supported identity is retained. Repairing a later inference leaves the earlier date defect unresolved. The actual cropped chart has bar-height ratio 11× for values 10 and 20; its repair restores a zero axis and 2× geometry. Repairing coverage wording does not create the missing row. These are supplied example checks and repairs, not automatic analysis of arbitrary prose.
- **Write a bounded signoff.** A supplied repaired example includes supported/retained facts, repairs, unresolved evidence and reopening conditions. Native fields assemble the signoff preview. It preserves R1's valid fact, $8,000 observed premium, missing R3, unknown intent/ownership and concrete conditions for further review. The example is explicitly separate from whether earlier local controls were completed and does not save or certify a real audit.

## Validation

- **27 tests across four files passed**, including 10 new tests for flawed/repaired premium arithmetic, source preservation, first unresolved checks, partial repairs, chart geometry repair, bounded signoff fields, playback interruption, Chinese and the paid Learn boundary.
- Workspace type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed.
- Shared graded `packetData(0)` remains unchanged. Version 2 still grades corrected premium $108,000, while audit and signoff writing remain `reviewRequired: true` without automatic mastery. Exploration dispatches no assessment actions. No authenticated note save was exercised.
- Desktop and 390px Chinese dark-mode review found no document or SVG-text overflow, including the embedded chart-scale inspection. Keyboard Space repaired its measured rectangle-height ratio from 11 to 2 while the first unresolved check stayed Source date. Reduced motion remained off.
- Continue opened the original numeric question and two writing fields, with no lab remaining.
- The production-built route `http://127.0.0.1:8252/learn/audit-market-recap` enforced the anonymous paid gate with no lab or authored source marker. The source marker was absent from client JavaScript while the lab title was present. No authenticated paid-account session was used.

## Evidence

[Lesson 33 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-33-interactive-evidence.gif)

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=audit-market-recap&lang=en&theme=light`. It renders the real learning UI with synthetic fixtures and no account/database/billing/analytics connections. It is not deployed or authenticated paid-account evidence.

The export is 31.38 seconds, 784 × 1450 pixels, 251 frames and 884,432 bytes. All 21 recorded assertions passed with no browser exceptions or log errors. Frame sampling pauses while tabs settle; actual capture times are retained. The decoded contact sheet and mobile screenshot were visually reviewed. The adjacent `lesson-33-evidence-frames/capture.json` stores the environment, URL, timestamps, assertions and errors; separate desktop, mobile and paid-gate JSON records retain those checks.

Lessons 34–36 and the final curriculum-wide audit remain required. The owned production preview was stopped after verification. No push or deployment was performed.
