# Interactive SVG curriculum progress

Goal: complete interactive SVG teaching experiences for all remaining lessons in the 36-lesson curriculum. Browser/GIF evidence, preserved grading/access, relevant validation and local commits are required. No push or deployment is implied.

Current baseline: Lessons 1–14 have implemented SVG labs and individual review records. Final curriculum-wide completion still needs a fresh audit.

| Lesson | ID | Status |
| --- | --- | --- |
| 1 | `option-contracts` | Existing SVG lab; final audit pending |
| 2 | `option-rights` | Existing SVG lab; final audit pending |
| 3 | `premium-payoff` | Existing SVG lab; final audit pending |
| 4 | `expiration-settlement` | Existing SVG lab; final audit pending |
| 5 | `quotes-orders-trades` | Existing SVG lab; final audit pending |
| 6 | `execution-counterparties` | Existing SVG lab; final audit pending |
| 7 | `execution-side` | Existing SVG lab; final audit pending |
| 8 | `flow-sentiment` | Existing SVG lab; final audit pending |
| 9 | `validate-option-print` | Existing SVG lab; final audit pending |
| 10 | `session-flow-vs-structure` | Existing SVG lab; final audit pending |
| 11 | `trade-records` | Existing SVG lab; final audit pending |
| 12 | `unusual-activity` | SVG implemented; browser/GIF and validation complete; final audit pending |
| 13 | `option-strategies` | SVG implemented; browser/GIF and validation complete; final audit pending |
| 14 | `symbol-drawer` | SVG implemented; browser/GIF and validation complete; final audit pending |
| 15 | `delta` | Not started |
| 16 | `gamma` | Not started |
| 17 | `theta-vega-rho` | Not started |
| 18 | `implied-realized-volatility` | Not started |
| 19 | `volatility-surface` | Not started |
| 20 | `iv-rank-percentile` | Not started |
| 21 | `dex-dei-gex` | Not started |
| 22 | `gamma-exposure` | Not started |
| 23 | `gamma-regimes` | Not started |
| 24 | `structural-levels` | Not started |
| 25 | `charm-vanna` | Not started |
| 26 | `audited-boundary` | Not started |
| 27 | `symbol-universe` | Not started |
| 28 | `rank-symbols` | Not started |
| 29 | `rank-contracts` | Not started |
| 30 | `point-in-time-research` | Not started |
| 31 | `cookbook-research-packet` | Not started |
| 32 | `market-recap` | Not started |
| 33 | `audit-market-recap` | Not started |
| 34 | `portfolio-pnl` | Not started |
| 35 | `portfolio-performance` | Not started |
| 36 | `portfolio-exposure` | Not started |

## Continuation notes

- Next implementation: Lesson 15, `delta`. Lesson 14 evidence and checks are recorded in `lesson-14-svg-lab-2026-09-12.md`.
- Source examples remain server-only and reach only the authorized Learn projection. Keep existing assessment versions and answers intact.
- Shared components: `concept-lab.tsx`, `concept-scene.tsx`, and `lesson-motion.tsx`.
- Use the local component preview at port 8261 for authored paid examples; verify the anonymous paid gate on the production-built local preview separately.
- Use Node 24 and finish source edits before full-suite checks to avoid mixed hot-reload/test-module results.
- Each completed lesson needs real browser GIF evidence and a review record. Do not mark the overall goal complete at an individual lesson checkpoint.

### Next lesson design notes

- Lesson 15 (`delta`): inspect the authored teaching unit; show a local small-move price approximation, option versus position signs, contract multipliers and the limits of holding delta constant. Keep delta distinct from a guaranteed move or a literal forecast probability.
- Reuse coordinate/control primitives while keeping lesson-specific data and calculation contracts explicit.
- Preserve the full objective: all remaining lesson IDs above need implementation and evidence, followed by a curriculum-wide completion audit.

### Live continuation resources

- The overall goal remains active. Browser task space **140** is retained under agent control for this ongoing goal; reuse it and verify ownership before interaction.
- Component preview: `http://127.0.0.1:8261/`, last verified PID **3498**, exec session **78039**. Verify the live process before reuse; do not restart merely because a previous observation timed out.
- The owned production preview on port 8252 was stopped after Lesson 14 verification, ready for the next rebuild.
- Lesson 13 model: `apps/web/src/domain/learning/strategy-concept.ts`; signed-leg valuation, exact expiry curve knots and separate roll inventory/cash are wired into the authorized Learn projection.
- Source edits should finish before test/browse snapshots. A full page reload after HMR prevents stale context-provider state in the isolated preview.
