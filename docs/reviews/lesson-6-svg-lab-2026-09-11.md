# Lesson 6: execution counterparties — SVG review

The Learn stage of `execution-counterparties` now has three interactive SVG scenes, replacing its earlier generic execution demonstration.

The execution model owns hypothetical matching; authored book snapshots remain server-only; SVG scenes consume that state without changing assessment answers or advancing attempts. The existing scene shell, native controls and motion policy are reused. Matching logic stays separate from Lesson 5's quote-event model because the two lessons calculate different outcomes.

## Teaching interactions

1. **One trade, two sides.** Explicit playback follows a resting quote, incoming instruction and confirmed match. Switching buy/sell reverses the aggressor and resting roles. Both parties execute at the same price; one 10-contract trade remains one print and 10 contracts of volume. Call/put switching does not change that accounting.
2. **Limits and liquidity.** A price-and-size exploration matches a fictional order against displayed depth. A buy limit accepts its limit or lower, a sell limit its limit or higher. Price-order matching stops when size is exhausted. Market mode illustrates consumption across several prices; unmatched size beyond the shown book stays unresolved. Average matched prices are rounded references, and no-fill averages remain missing.
3. **What a print reveals.** Two possible order histories produce the same 10-contract print at $2.10. Learners make an ungraded judgment and reveal the extra order record. One example supplies a marketable limit, the other a market order. Switching examples hides the record and clears the previous response. The print alone establishes neither the original instruction nor the aggressor, identity or strategy.

All quantities are contracts and prices are dollars per share. Snapshots and prints retain their dates/times. Hypothetical book matching explicitly excludes earlier orders, replenishment, cancellations, hidden liquidity, routing and fees. It does not promise real fills or determine what happens to a remainder under an unspecified time-in-force.

## Access and assessment

- The paid dataset is authored in `execution-concept.server.ts` and reaches the browser through the existing authorized Learn projection. There is no client fixture fallback.
- `LearningStepView.conceptData` is now a discriminated union. Both Lesson 5 and Lesson 6 reject missing or mismatched teaching data.
- The lesson's version 2 scenario, guided answers (`unfilled=10`, `aggressor=buyer`), independent variants, scoring and progress controls remain unchanged. Later lessons keep their execution demonstrations.
- The separate local component preview renders the real `LearningScreen` with authored synthetic fixtures and no account, database, billing or analytics connection. It is excluded from the production application build.

## Verification

- Broader learning, domain, content and server regressions: **29 files, 220 tests passed**.
- Focused Lesson 5/6 regression checks: 18 tests passed, covering matching, direction, empty depth, volume counting, playback interruption, evidence reveal/reset, Chinese controls, projection and anonymous paid-preview rejection.
- Type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed. Production client JavaScript includes the new scenes but neither the authored contract marker nor print ID.
- Desktop browser checks: incoming buy and incoming sell/put both produced one print and 10 contracts. Buy 40 at limit $2.10 matched 30 with 10 unfilled; $2.15 matched all 40 at a $2.1125 average; $2.00 matched none. Market 100 matched the 90 displayed contracts and retained 10 unresolved. Revealed examples showed different original instructions with the same print. No browser exceptions or log errors were reported during this sequence.

- At 390px, all three Chinese dark-mode scenes fit without horizontal overflow or SVG text outside the viewBox. Live reduced motion remained off during pointer interaction. Keyboard ArrowRight changed the limit from $2.10 to $2.11, and Continue to practice opened the existing guided question. No browser errors were reported.
- The production-built route at `http://127.0.0.1:8252/learn/execution-counterparties` showed the paid-lesson access message to the anonymous browser, with no concept lab or authored contract in the document. Paid-account persistence was covered by server regressions; no live authenticated paid-account session was used.
- The final recorded desktop sequence reported no exceptions or browser log errors.

## Evidence

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=execution-counterparties&lang=en&theme=light`. It is not a deployed or authenticated paid-account recording.

[Lesson 6 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-6-interactive-evidence.gif)

The verified export is 27.76 seconds, 784 × 1135 pixels, 222 frames and 482,444 bytes. A contact sheet decoded from the GIF was visually reviewed.

The adjacent `lesson-6-evidence-frames/capture.json` contains source URL, frame times and observed results. Browser frames are assembled directly into the GIF without recreating the interface.

The lesson retains its primary references: [OIC: understanding bid and ask prices](https://www.optionseducation.org/news/understanding-the-bid-and-ask-prices-for-options) and [Investor.gov: types of orders](https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders).

No push or deployment was performed.
