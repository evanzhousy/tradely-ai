# Lesson 36: portfolio exposure — SVG review

`portfolio-exposure` now has three interactive Learn scenes. All examples share the synthetic underlying XYZ and a declared snapshot. Domain calculations reuse signed contract scaling. Fixtures remain server-owned.

## Teaching behavior

- **Covered delta:** 100 shares and two short calls with delta 0.40 and multiplier 100 give +20 covered shares-equivalent. Selling 20 shares offsets that subtotal, while missing put sensitivity prevents a complete total. Supplying the put's −30 delta changes the complete total to −30 after the adjustment. Explicit playback demonstrates stock changes; keyboard input stops it.
- **Other risks:** An independent 80-share/two-short-call subset starts delta-neutral, with gamma −4 shares/$, theta +$6/calendar day and vega −$24/IV percentage point. A ±$1 spot move gives −$2 from the gamma term, while local next delta changes to ∓4. IV +1 point contributes −$24; one day contributes +$6 under frozen local Greeks. The curve shows only spot terms; the separate combined estimate includes the other controls. The third holding, cross effects, assignment, jumps, funding and execution costs are explicitly outside this approximation.
- **Units and time:** $0.12 per IV point and $12 per unit volatility yield the same −$24/point short-call contribution. With known zero stock vega and +$10 put vega, complete portfolio vega is −$14/point. Stale or missing call data leaves +$10 known subtotal and withholds the complete current total. Timestamps are shown rather than silently mixed.

## Validation

- Seven new lesson tests plus five shared motion tests passed. Coverage includes sign/multiplier conversion, stale and missing inputs, neutral subtotals, local Taylor terms, controls, playback interruption, Chinese, unavailable fixtures and paid access.
- Workspace type checks, production build and changed-file Biome passed. Original version 2 answers remain +20 covered delta, −20 stock adjustment, and “no” to whole-portfolio neutrality. Exploration dispatches no assessment actions.
- Desktop keyboard interactions matched the domain results. All three 390px Chinese dark-mode scenes had no document or SVG-text overflow; reduced motion stayed off.
- The production-built local route `http://127.0.0.1:8252/learn/portfolio-exposure` enforced the anonymous paid gate without the lab or authored marker. `PORTFOLIO-E` was absent from client JavaScript. No authenticated paid-account verification or deployment is claimed.

## Evidence

[Lesson 36 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-36-interactive-evidence.gif)

Recorded from the **actual local component preview** at `http://127.0.0.1:8261/?lesson=portfolio-exposure&lang=en&theme=light`, using real UI components and synthetic fixtures. It has no connected account, database, billing or analytics.

Export: 32.38 seconds, 784 × 1280, 259 frames, 270,415 bytes. The 34 source screenshots, actual timestamps, 11 successful assertions and empty browser error list are in `lesson-36-evidence-frames/capture.json`. Sampling pauses while scenes settle. The decoded contact sheet was visually inspected. Separate desktop, mobile and paid-gate JSON records retain those checks.

All lessons and the final curriculum audit are complete; see `svg-curriculum-completion-audit-2026-09-12.md`. No push or deployment was performed.
