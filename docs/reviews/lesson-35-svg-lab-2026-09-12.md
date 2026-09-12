# Lesson 35: portfolio performance — SVG review

`portfolio-performance` now has three interactive Learn scenes using server-owned synthetic fixtures and domain calculations. Existing version 2 questions, access checks and persistence remain intact.

## Teaching behavior

- **Cash flows and returns:** Four valuation checkpoints distinguish the external-flow jump from investment performance. The original $1,000 → $1,100, $900 deposit, $2,100 end example gives 15.5% TWR versus 110% raw balance growth. Holding valuation checkpoints fixed and changing the hypothetical deposit to $1,500 gives −11.15% TWR. Missing boundary valuation or a zero return denominator withholds TWR. Raw growth can remain known. Explicit playback visits supplied flow assumptions; direct input stops it.
- **Payoff distribution:** Four $20 wins and one $100 loss give 80% win rate, −$20 total and 0.8 profit factor. Changing the loss to $50 gives $30 total and 1.6 profit factor. A breakeven fifth lot stays in the win-rate denominator; zero losses leave profit factor undefined. Missing the fifth outcome preserves the known $80 subtotal but withholds complete-sample metrics. The five-lot FIFO example is net of declared costs and is not full-account evidence.
- **Comparison evidence:** The original 15.5% TWR versus a compatible synthetic 10% benchmark gives 5.5 percentage points. Date, currency, fee or income-basis mismatches, or missing return data, withhold the like-for-like difference pending reconciliation. A separate realized-dollar attribution keeps unknown symbol C visible: A $80 and B −$100 give a known −$20 subtotal; supplied C $50 yields a complete declared-symbol $30 total. C's aggregate provides no trade count and cannot establish an account win rate.

## Validation

- 11 tests across the lesson and shared motion files passed. Six new tests cover calculations, missing evidence, duplicate identity, playback interruption, controls, Learn projection, unchanged grading and anonymous paid denial.
- Workspace type checks, production build, changed-file Biome, credential scan, media-boundary assertion and diff whitespace checks passed.
- Browser desktop checks exercised keyboard ranges, missing values, zero losses, comparison mismatch and attribution coverage. Reset and Continue were checked separately. All three mobile Chinese dark-mode scenes had no document/SVG-text overflow and motion remained off under reduced motion.
- Visual review caught crowded flow checkpoint labels; shortened English labels resolve the collision in the final GIF.
- The production-built local route `http://127.0.0.1:8252/learn/portfolio-performance` displayed the paid sign-in gate, without a lab or authored source marker. `PERFORMANCE-R` was absent from client JavaScript. This is anonymous-gate evidence, not authenticated paid-account verification.

## Evidence

[Lesson 35 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-35-interactive-evidence.gif)

The GIF records the **actual local component preview**, `http://127.0.0.1:8261/?lesson=portfolio-performance&lang=en&theme=light`, with real application components and synthetic fixtures. It has no connected identity, database, billing or analytics. It is not a deployed or authenticated paid-account recording.

Export: 28.26 seconds, 784 × 1080, 226 frames, 233,166 bytes. The 36 original browser screenshots and timestamps, 11 successful recording assertions and empty browser error list are retained in `lesson-35-evidence-frames/capture.json` alongside the GIF. Sampling pauses during scene transitions. The decoded GIF contact sheet and mobile screenshot were visually reviewed. Desktop, mobile, navigation and paid-gate checks have adjacent JSON records.

Lesson 36 and the final curriculum-wide audit remain. No push or deployment was performed.
