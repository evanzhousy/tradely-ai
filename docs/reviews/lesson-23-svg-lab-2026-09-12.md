# Lesson 23: gamma regimes — SVG review

The Learn stage of `gamma-regimes` now includes three interactive SVG scenes. The lesson domain owns aggregate sensitivity, conditional hedge adjustments and sampled sign-crossing checks. Server-only fixtures own portfolios, repriced spot samples and evidence records. Exploration remains local and ungraded.

## Teaching behavior

- **Test the hedge response.** Native controls choose long-gamma, short-gamma, near-zero-net or incomplete position sets and vary a local spot move. Explicit playback visits supplied up, flat and down moves. Portfolio delta change and its offsetting stock-hedge adjustment stay separate. A +200 shares-per-dollar sensitivity and +$0.50 move yield delta +100 and hedge −100; short gamma reverses that response. A net sensitivity +5 retains gross 995. Missing position sensitivity withholds the target. These are already position-scaled share sensitivities, not dollar GEX per 1% move.
- **Inspect a modeled flip.** Native SVG buttons and a range select supplied spot samples. Fixed-position curve A brackets a crossing between 95 and 100, with illustrative linear estimate 97.5. Changed positions B bracket 100–105 with estimate 103.33. Near-expiry-only samples have no supported crossing; missing spot 95 breaks curve A and prevents bridging the gap. The domain also distinguishes an isolated sign-changing zero from a zero touch, handles multiple crossings and rejects unordered spot samples. Estimates are not guaranteed exact roots or support/resistance lines; absence in finite samples is not proof of global absence.
- **Open the evidence.** Three native SVG reveal controls independently expose a synthetic model packet, a +100-share fill at 14:30:01 UTC, and a 500-share displayed ask-depth snapshot at 14:30:00 UTC. A modeled target does not populate the fill; hiding the model does not erase the independent fill. Records retain their clocks and meanings. Even with all three supplied records, price impact or a squeeze is not established.

## Validation

- **27 tests across four files passed**, including 10 new tests for local hedge signs/units, gross/net/missing sensitivities, adjacent brackets, isolated zeros, gaps, multiple crossings, extreme finite scales, controls, playback interruption/reset, evidence independence, Chinese and the authorized Learn boundary.
- Workspace type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed.
- Original version 2 grading remains unchanged. Its first case accepts hedge −60 shares and the choice that market direction is not established. Exploration dispatches no assessment actions; Continue opens the existing questions.
- Desktop review found no horizontal overflow or SVG text beyond the viewBox in any scene. Explicit playback animates the spot marker and bar widths; numeric readouts update immediately and direct controls use immediate geometry. Estimated flip guides retain their dash pattern.
- At 390px in Chinese dark mode, all scenes fit and reduced motion remained off under pointer input. All three SVG evidence cards revealed their supplied records. Keyboard ArrowRight moved spot change from +$0.50 to +$0.60 and hedge adjustment to −120 shares. Enter practice opened the original assessment with no lab remaining.
- The production-built route `http://127.0.0.1:8252/learn/gamma-regimes` enforced the anonymous paid gate, with no lab or authored packet marker. The exact packet marker was absent from client JavaScript while the lab title was present. No authenticated paid-account session was used.

## Evidence

[Lesson 23 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-23-interactive-evidence.gif)

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=gamma-regimes&lang=en&theme=light`. It renders the real learning UI with synthetic fixtures and no account/database/billing/analytics connections. It is not deployed or authenticated paid-account evidence.

The export is 28.38 seconds, 784 × 1200 pixels, 227 frames and 564,423 bytes. All 21 recorded UI assertions passed with no browser exceptions or log errors. The decoded contact sheet and mobile screenshot were visually reviewed. The adjacent `lesson-23-evidence-frames/capture.json` stores the source URL, actual browser capture times, assertions and errors; separate desktop, mobile and paid-gate JSON files retain those checks.

Lessons 24–36 and the final curriculum-wide audit remain required. The owned production preview was stopped after verification. No push or deployment was performed.
