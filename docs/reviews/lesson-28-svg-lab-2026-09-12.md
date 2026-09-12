# Lesson 28: rank symbols — SVG review

The Learn stage of `rank-symbols` now includes three interactive SVG scenes. The domain model owns signed/magnitude ordering, tied ranks and eligible activity ranking; numeric normalization reuses the prior lesson's positive-baseline calculation. Server-only fixtures own comparison snapshots. Exploration remains local and ungraded; this is a free research-path lesson.

## Teaching behavior

- **Change the ordering.** Signed order places +60 above −100; magnitude order puts −100 first while retaining its negative sign. Peer playback changes only C, keeping A +60 and B −100 fixed. A's rank changes with the peer set. Native ranked buttons remain in sorted document order and use layout-based motion inside the SVG. Tied scores share their competition rank with stable symbol ordering.
- **Choose the activity metric.** Raw volume selects A, whereas comparable relative activity selects B at the default 100-contract floor. Removing the floor admits C's 50 contracts over a baseline of 1, producing 50×; this changes the comparison rather than establishing a better signal. D lacks a baseline, F's baseline is incomparable and E lacks complete session volume. Exclusions remain visible, with native row inspection and a source-row selector.
- **Carry the candidate forward.** B stays the inspected candidate through independent peer, baseline and coverage revisions. Corrected C at 12× lowers B's rank without changing B's 3× ratio. Correcting B's baseline changes its ratio to 0.3×. Withdrawn B coverage withholds its rank and comparison value while retaining the old reported count. The handoff explicitly includes observed peers, exclusions, a next inspection and revision triggers; it is not a saved watchlist or a trading forecast.

## Validation

- **27 tests across four files passed**, including 10 new tests for signed/magnitude order, ties, unchanged focal values, raw/relative differences, missing inputs, floors/exclusions, controls, playback interruption, candidate revisions, Chinese and public Learn access.
- Workspace type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed.
- Version 2 assessment remains unchanged. Its first case accepts ALFA relative volume 0.5× and BETA as the relative-activity leader. Exploration dispatches no assessment actions; Continue opens the original questions.
- Desktop review found no horizontal overflow or SVG text beyond the viewBox. The candidate handoff was expanded to show exclusions directly. A mobile coordinate check caught rank text updating before manually animated SVG row positions; the rows were changed to native layout order with the app's layout-based animation pattern. Tests, types and build were rerun after the fix.
- At 390px in Chinese dark mode, all scenes fit. The corrected visual-order assertion confirmed B, C, A at the +80 C snapshot under magnitude order, matching A's rank 3. Reduced motion remained off. Keyboard ArrowLeft reduced the activity floor to zero and exposed C as the observed relative leader. Continue opened the original assessment and removed the lab.
- The production-built local route `http://127.0.0.1:8252/learn/rank-symbols` opened the free lab while signed out. Changing magnitude order moved A from rank 1 to 2; reloading and reopening restored rank 1. The page discloses anonymous reset-on-reload behavior.
- The authored source marker was absent from client JavaScript while the lab title was present. Teaching data is intentionally returned through this free lesson's public Learn projection. No authenticated account session was used.

## Evidence

[Lesson 28 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-28-interactive-evidence.gif)

The GIF records the **production-built local application, anonymous free preview**, at `http://127.0.0.1:8252/learn/rank-symbols`. It shows the actual application route with synthetic authored teaching records, not a deployed site or authenticated account session.

The export is 31.13 seconds, 872 × 1450 pixels, 249 frames and 744,594 bytes. All 20 recorded UI assertions passed with no browser exceptions or log errors. Frame sampling pauses while tabs settle; actual frame times are retained. The decoded contact sheet and mobile screenshots were visually reviewed. The adjacent `lesson-28-evidence-frames/capture.json` stores the environment, URL, timestamps, assertions and errors; separate desktop, mobile and public-preview JSON records retain their checks.

Lessons 29–36 and the final curriculum-wide audit remain required. The owned production preview was stopped after verification. No push or deployment was performed.
