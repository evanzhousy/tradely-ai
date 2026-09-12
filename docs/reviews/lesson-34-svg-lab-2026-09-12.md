# Lesson 34: portfolio P&L — SVG review

The Learn stage of `portfolio-pnl` now includes three interactive SVG scenes. The domain model owns dated whole-share lot accounting, declared fee allocation, marked account values and signed option valuation. Option quantities reuse the existing signed-position-unit helper. Server-only fixtures provide independent synthetic examples rather than a connected brokerage account.

## Teaching behavior

- **Separate P&L components.** A lifecycle replay separates purchases, a supplied closing fill and a later mark. The one-lot example gives $120 realized and $120 unrealized before fees. Capitalizing the $5 opening fee proportionally and charging the $3 close fee gives $115 realized and $117 unrealized. Missing fees withhold affected net values while gross calculations and marked value can remain known. Missing marks withhold open valuation/unrealized results while realized P&L remains available.
- The two-lot example compares FIFO with a pooled average-cost attribution illustration. FIFO gives $1,500 realized and −$200 unrealized; average attribution gives $1,000 and +$300. Both total $1,300 before fees and $1,285 with the supplied fees. Matched/remaining cost basis is explicit. Average-mode bars represent cost allocation, not identification of physical shares sold. Lot timestamps determine FIFO, oversells/invalid inputs are rejected, and zero remaining holdings do not require a mark.
- **Separate cash and profit.** A $500 hypothetical deposit raises marked equity from $2,340 to $2,840 while supplied-scope trading P&L stays $340. Buying power remains a separately labeled original report value and is not recomputed or treated as cash/risk budget. Missing required marks withhold complete equity and allocation percentages without erasing known cash. Market-value allocation is contrasted with the option's larger underlying notional.
- **Value a signed option position.** Long/short controls retain the multiplier and reverse opening cash flow and marked value. Two uncovered short calls can have $400 opening credit, −$2,000 marked value and −$1,600 unrealized P&L at the hypothetical $10 mark. Received premium is not a loss cap. The finite slider is not a claim about maximum short-call loss. Notional is explicitly not delta-adjusted; current Greeks are not supplied. Marks are not promised fills.

## Validation

- **28 tests across four files passed**, including 11 new tests for fee allocation, FIFO chronology, average attribution, same-period totals, missing values, full closure, oversells, account cash-flow separation, overflow guards, option signs/multipliers, controls, playback interruption, Chinese and the paid Learn boundary.
- Workspace type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed.
- Version 2 assessment remains unchanged: the original first case accepts $120 realized and $120 unrealized before fees. Exploration dispatches no assessment actions; Continue opens the original questions.
- Desktop and 390px Chinese dark-mode review found no document or SVG-text overflow. Decorative stage markers and valuation geometry are direct SVG when playback is inactive.
- Mobile verification confirmed average-cost net results $990/$295 and total $1,285. Keyboard adjustment produced short-call loss −$1,600 while retaining opening credit $400. Withholding its mark removed valuation but retained known cash flow. Reduced motion remained off, and Continue removed the lab and opened the original assessment.
- The production-built route `http://127.0.0.1:8252/learn/portfolio-pnl` enforced the anonymous paid gate with no lab or authored marker. The source marker was absent from client JavaScript while the lab title was present. No authenticated paid-account session was used.

## Evidence

[Lesson 34 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-34-interactive-evidence.gif)

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=portfolio-pnl&lang=en&theme=light`. It renders the real learning UI with synthetic fixtures and no account/database/billing/analytics connections. It is not deployed or authenticated paid-account evidence.

The export is 30.88 seconds, 784 × 1850 pixels, 247 frames and 488,950 bytes. All 41 recorded assertions passed with no browser exceptions or log errors. Frame sampling pauses while tabs settle; actual capture times are retained. The decoded contact sheet and mobile screenshot were visually reviewed. The adjacent `lesson-34-evidence-frames/capture.json` stores the environment, URL, timestamps, assertions and errors; separate desktop, mobile and paid-gate JSON records retain those checks.

Lessons 35–36 and the final curriculum-wide audit remain required. The owned production preview was stopped after verification. No push or deployment was performed.
