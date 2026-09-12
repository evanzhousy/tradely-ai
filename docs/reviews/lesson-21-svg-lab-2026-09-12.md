# Lesson 21: DEX, DEI and GEX — SVG review

The Learn stage of `dex-dei-gex` now includes three interactive SVG scenes. The domain model owns magnitude, classification and denominator validity; server-only fixtures own the source reports; controls remain local and ungraded. Shared scene, control and motion primitives are reused without conflating flow and position models.

## Teaching behavior

- **Build the flow.** Three supplied prints produce bullish 60,000, bearish 20,000 and neutral 10,000 share equivalents. Native controls change print B's contracts and inferred classification. Explicit playback grows its size through 500/1,000/1,500/2,000 contracts, taking net DEX from +40,000 to −20,000. At 1,500, net is zero but gross remains 130,000. Neutral contributions remain visible as unsigned dashed bars. The negative option delta does not determine the inferred-flow sign. Premium dollars are calculated separately; hypothetical size changes hold premium per contract fixed.
- **Change the denominator.** Original net flow stays +40,000. Doubling typical volume from 1m to 2m changes magnitude DEI from 4% to 2%, while a separate supplied GEX report stays fixed. Six references distinguish stock volume, an explicitly scaled proxy, missing scale, missing method, missing volume and zero volume. Invalid denominators remain unavailable. The illustrative proxy factor is not a universal index conversion.
- **Trace the source.** Native SVG report buttons and an equivalent select expose classified tape, reported absolute ΔOI change, and separately supplied GEX. Their units, clocks and sign conventions remain attached. Only classified tape is eligible for this lesson's flow-based DEI. OI does not inherit today's tape direction; GEX cannot substitute for a share-equivalent flow numerator. No dealer inventory or hedging observation is inferred.

## Validation

- **28 tests across four files passed**, including 11 new tests covering absolute delta magnitude, classification, cancellation, neutral coverage, premium independence, invalid inputs, positive/proxy denominators, source lineage, controls, playback interruption/reset, Chinese, and the authorized Learn projection.
- Workspace type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed.
- Version 2 assessment remains unchanged. Its original first case accepts net premium 40,000 USD, net DEX 40,000 share equivalents and DEI 4%. Exploration dispatches no assessment actions; Continue opens the original questions.
- Desktop review found no horizontal overflow or SVG text beyond the viewBox in all three scenes. The playback bars use explicit SVG reflection for negative direction and animate width, avoiding Motion's transform interpretation of `x`.
- At 390px in Chinese dark mode, all scenes fit, reduced-motion policy remained off under pointer input, and SVG source selection withheld DEI for OI. Keyboard ArrowRight changed B from 500 to 600 contracts and net DEX to +36,000. Enter practice opened the original assessment with no lab remaining.
- The production-built route `http://127.0.0.1:8252/learn/dex-dei-gex` showed the anonymous paid gate and no lab or authored report marker. The exact authored GEX source marker was absent from client JavaScript; the lab title was present. No authenticated paid-account session was used.
- The long-running component preview retained an import-resolution error after the new module was created. After verifying the file and successful build, the owned preview was restarted and all subsequent browser checks passed. No application workaround was introduced.

## Evidence

[Lesson 21 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-21-interactive-evidence.gif)

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=dex-dei-gex&lang=en&theme=light`. It renders the real learning UI using synthetic fixtures with no account/database/billing/analytics connections. It is not deployed or authenticated paid-account evidence.

The export is 29.51 seconds, 784 × 1150 pixels, 236 frames and 480,380 bytes. All 21 recorded UI assertions passed with no browser exceptions or log errors. A decoded contact sheet was visually reviewed. The adjacent `lesson-21-evidence-frames/capture.json` stores the URL, actual capture timestamps, assertions and errors. Separate desktop, mobile and paid-gate records retain their checks.

Lessons 22–36 and the final curriculum-wide audit remain required. The owned production preview was stopped after verification. No push or deployment was performed.
