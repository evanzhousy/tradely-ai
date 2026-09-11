# Lesson 1 interactive SVG lab

Lesson 1 (`option-contracts`) now teaches through four interactive scenes in the existing Learn stage: anatomy, contract identity, units, and source time. A short introduction replaces the large visible text block; complete bilingual notes remain available below the lesson.

## Design and boundaries

- Native controls drive SVG connectors, contract comparisons, deliverable illustrations, and an observation timeline. Anatomy controls retain a 48 px height on mobile. The timeline uses a native range over the SVG track for pointer, touch, and keyboard access.
- Stock, ETF, and cash-settled index examples state their own terms. Missing terms do not default to 100. Premium, physical deliverable, share ownership, and delta-equivalent exposure remain distinct.
- Playback is explicit, interruptible, and stops on direct selection, page hiding, or scene unmount. Motion uses the existing lesson preference policy. Snapshot selection shows only supplied observations; it never interpolates a market price.
- Public fixtures live with the lab. The server projects a typed Learn-only capability. Exploration does not dispatch learning actions, change answers, award completion, or expose later cases. Existing assessment versions and archived version 2 work are preserved.
- The change also repairs two existing test harness issues encountered during validation: an unguarded regex-array destructure in the free-course navigation test and missing router context in the access-panel analytics test. Neither repair changes application behavior.

## Validation

- 85 test files, 461 tests passed with `pnpm --filter web test --maxWorkers=2 --testTimeout=30000 --hookTimeout=60000` under Node 24. The larger command-line time limits accommodate local PGlite startup; default/concurrent runs hit timeouts. Repository test timeout configuration was not changed.
- `pnpm check-types`, `pnpm build`, changed-file Biome checks, `pnpm posthog:secrets`, `pnpm media:assert`, and `git diff --check` passed.
- Seven new behavioral tests cover explicit units, missing/cash terms, identity versus observations, reset, playback interruption, keyboard snapshot navigation, Chinese rendering, and separation from grading.
- Browser verification used both the isolated lesson fixture and the actual local `/learn/option-contracts` route. Anonymous preview opened through the existing server action, rendered all four scenes, and continued to the guided case with no lab left in the assessment view.
- Desktop: native diagram selection worked; adding a fourth contract changed premium from $600 to $800 and deliverable to 400 shares. Dragging the SVG timeline selected the exact final snapshot (10:32 ET, $1.90/share).
- Mobile: all four Chinese scenes fit a 390 px viewport without document overflow; anatomy buttons measured 48 px high. Reduced-motion policy reported off; keyboard End selected the final snapshot. Dark and light presentation were reviewed.

This is local implementation and verification, not a production deployment or evidence of measured learning improvement.
