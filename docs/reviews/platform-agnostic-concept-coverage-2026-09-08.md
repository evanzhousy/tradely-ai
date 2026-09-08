# Platform-agnostic concept coverage: curriculum scope correction

User clarification, September 8, 2026: learners need the financial and analytical concepts used throughout TradingFlow, including elementary quote/trade/side/sentiment concepts. Tradely teaches transferable knowledge. Product navigation is outside this curriculum's purpose.

The [consolidated course update plan](/Users/evansmacbookpro/Desktop/Projects/tradely/docs/interactive-course-plan.md) now owns the proposed syllabus, existing-lesson mapping, implementation phases and release criteria. This document remains the supporting concept inventory and definition review.

**Correction to the earlier review:** reviewing the existing 11 lessons did not establish coverage of all concepts learners need. The previous suggestion to assume basic option vocabulary is not sufficient for this audience. Those lessons are an applied research sequence; they need a substantive conceptual foundation and additional advanced modules.

**Design statement:** Tradely owns a concept curriculum organized by prerequisites, worked examples, and independent demonstrations; the app supplies an inventory of encountered concepts, while financial definitions and explicitly stated model conventions govern what is taught.

This is a coverage plan, not a claim that the concepts below have already been authored or validated. It references the inspected local app at `eaa0f9149` and Tradely at `3623470`. App source documents and labels can disagree and are not proof of deployment. The portfolio material is documented as an internal rollout. Future recipe ideas and prototype-only visualizations should not be advertised as shipped features.

## What the current lessons miss about side and sentiment

The existing print exercise tests a stale quote, a matched bid-side print, a midpoint print, premium arithmetic, and unknown opening/closing intent. It does not systematically establish:

- A quote is an advertised opportunity to trade; an execution is a transaction that happened. A quote update can occur with no trade.
- Bid is an offer to buy; ask is an offer to sell. Both have sizes and timestamps. An individual venue quote is not automatically the consolidated NBBO.
- Every executed trade has both a buyer and a seller. Aggressor classification asks which party likely demanded immediate execution.
- A resting seller can sell at the ask when an incoming buyer takes that offer. This is still an ask-side print; “seller” and “seller-initiated” are different concepts.
- A buyer can take an offer with a market order or a marketable limit order. A print at the ask alone does not reveal the original order type.
- `ASK`, `AASK`, `MID`, `BID`, and `BBID` locate the execution against a reference quote. `MID` can mean somewhere inside the spread under the feed's convention, not necessarily exactly the arithmetic midpoint.
- A sentiment label is another inference, combining quote-side execution and call/put type. It is not the same as execution side, confirmed position direction, trader belief, or a price forecast.
- “Neutral” in a classification feed can mean direction is indeterminate. It does not mean the participant has a neutral portfolio or expects a flat market.

The app's [interpretation registry](/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/src/lib/metrics/registry.ts:63) already separates execution side from inferred direction. Its [row sentiment explanations](/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/src/locales/en-US.ts:3742) make the same distinction. Tradely should teach the reasoning behind those boundaries, rather than relying on the learner to discover them in a tooltip.

## Foundation example: two participants, one print

Use a synthetic option with bid **$2.00 × 40 contracts**, ask **$2.10 × 30 contracts**, and an explicitly matched quote timestamp.

1. A seller posts a limit offer at $2.10. No execution has happened yet.
2. A buyer submits an order able to pay $2.10 and trades 10 contracts against that offer.
3. The buyer bought at the ask, and the resting seller sold at the ask. There is one execution, not a separate bullish buy and bearish sell to count twice.
4. The print's quote location is ask-side. Under the illustrative matching sequence, the buyer demanded immediate execution. If all we had were the print and quote, this would be an inference rather than knowledge of both orders.
5. Repeat with a seller accepting the $2.00 bid. The resting buyer buys at the bid; the incoming seller is the aggressor.
6. Remove the order messages and stale the reference quote. Ask which conclusions are no longer supported.

Quote sizes in this controlled example change by the executed quantity only because replenishment, cancellations, and other orders are explicitly excluded. Do not teach that every real-world size change reveals one order's execution.

This follows the basic bid/ask mechanics described by [OIC](https://www.optionseducation.org/news/understanding-the-bid-and-ask-prices-for-options). [Investor.gov's order definitions](https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders) distinguish execution at available prices from a limit-price constraint; neither a past quote nor a last print guarantees a future fill.

### Then derive sentiment, with the perspective named

For a simple isolated option leg, using the likely aggressor's directional effect and the app's stated classification convention:

| Option | Supported quote-side inference | Conventional flow classification |
| --- | --- | --- |
| Call | Likely buyer-initiated at ask | Bullish |
| Call | Likely seller-initiated at bid | Bearish |
| Put | Likely buyer-initiated at ask | Bearish |
| Put | Likely seller-initiated at bid | Bullish |
| Either | Indeterminate side | Neutral/unknown, according to the declared convention |

Above-ask and below-bid categories require checking the quote's reliability and execution conditions before extending this mapping. They are not automatic measures of conviction. Labels and classification algorithms vary across vendors; teach the general concept and disclose the convention being used.

First explain bullish as an upward directional view or exposure and bearish as a downward one, with the subject and time horizon stated. Then distinguish a person's belief, a position's exposure, and a feed's inferred flow label. A put purchase can be one part of a bullish investor's protective strategy: [OIC's protective-put example](https://prd-web.optionseducation.org/strategies/all-strategies/protective-put-married-put) makes that counterexample concrete. The option-leg label does not identify the whole portfolio.

### Required assessment for this foundation

Use unfamiliar prices, rearranged answer positions, and both supported and indeterminate cases. Require the learner to:

- Explain why the seller in an ask-side execution is not necessarily the aggressor.
- Distinguish a quote update, an order, a cancellation, and a print on a timeline.
- Distinguish a market order from a marketable limit order; say when order type is unknowable.
- Classify all four call/put × likely buyer/seller combinations and explain one in words.
- Separate an inside-spread print from the exact midpoint and handle unreliable quote context.
- Reject “put bought = the investor is bearish” when the complete strategy is absent.
- State what neutral does and does not mean.

A two-sided order/quote animation can help: incoming order, resting counterparty, matched quantity, and resulting print should move together. The quote and trade counters must remain separate. A clear 2D illustration is enough; choose 3D only if it adds an independently testable spatial concept.

## Coverage map across the app's analytical vocabulary

“Missing” means no adequate dedicated teaching and independent assessment was found in the current 11-lesson sequence. “Partial” means relevant material exists but does not satisfy the full row. Source keys are resolved below. Rows are teaching families, not a requirement to create one lesson per row or force everything into the initial course.

| ID | Platform-agnostic concepts to teach | Current coverage | App evidence | Evidence of understanding to require |
| --- | --- | --- | --- | --- |
| C01 | Underlying, ticker, stock/ETF/index, sector, spot, market cap, share volume, earnings dates | Partial identity/universe checks | A, D, F | Identify the instrument and reject a comparison with incompatible units or event dates |
| C02 | Call/put rights and obligations, holder/writer, long/short, strike, expiration, DTE/0DTE, multiplier, exercise/assignment and settlement | Partial identity and call moneyness; foundations missing | A, C, E | Explain one contract and calculate its stated-unit obligation/payoff; distinguish exercise from an exchange trade |
| C03 | Quote price, per-contract amount, total execution premium, notional, intrinsic/extrinsic value, moneyness for calls and puts, payoff versus profit/break-even | Partial; media conflict in lesson 6 | A, C, D | Calculate each quantity separately; show why an ITM option can still lose money after premium |
| C04 | Quote versus order versus trade; best bid/ask; bid/ask sizes; NBBO; spread in dollars and percent; midpoint/mark/last | Partial quote positioning only | A, B, C | Reconstruct a quote/trade timeline without treating a quote or last price as a guaranteed fill |
| C05 | Market/limit/marketable-limit orders, resting orders, liquidity provider/taker, aggressor/counterparty, partial fills, depth, price improvement, slippage | Missing | B, C, F; prerequisite to side | Identify both parties to a fill and what the tape cannot reveal about order instructions |
| C06 | Execution-side location: AASK/ASK/MID/BID/BBID; stale, missing, locked/crossed or mismatched quotes; reporting/condition limits | Partial; mainly bid/mid/stale | B, C, D | Classify valid examples and withhold an inference when the reference is unusable |
| C07 | Bullish/bearish/neutral: belief versus exposure versus inferred classification; all four call/put combinations; unknown direction | Missing as a coherent foundation | A, B, C, D | Explain the mapping and preserve the unknown complete strategy |
| C08 | Buy/sell to open/close; OI creation, transfer, reduction; volume versus OI; ΔOI; report timing; expiry/exercise effects; limits of T+1 attribution | Partial clock comparison | A, B, C, F | Produce different OI changes from equal volume and explain why a later aggregate cannot identify an individual print's owner |
| C09 | Single leg versus multi-leg; spreads, straddles, collars, rolls, covered versus uncovered call, protective put; stock-option linkage | Mostly caveats, no mechanism | A, C, F, H | Give two possible strategies consistent with the same isolated print; distinguish leg direction from net portfolio risk |
| C10 | Raw prints versus aggregation; trade count versus contract count; weighted versus unweighted summaries; duplicate/corrected/out-of-order records | Missing | A, B, C | Reconstruct aggregate size/premium and preserve count/chronology; do not infer common ownership from clustering |
| C11 | Execution conditions: sweep/ISO, block, auction/cross, electronic/floor, complex-order/stock-contingent mechanisms | Missing | B, C | Explain what a condition describes and why it does not establish institution, information advantage, or conviction |
| C12 | Unusual activity, relative volume, volume/OI, baseline/window choice, tiny denominators, partial-session comparisons, opening-position heuristics | Partial eligibility; measures missing | A, B, C, F | Compare several measures and demonstrate a false positive caused by the denominator or coverage |
| C13 | Delta, gamma, theta, vega, rho; units, long/short signs, local sensitivities, all-else-equal assumptions | Missing foundations | A, C, F, G | Compute a small-change example and explain why one Greek is not a complete profit forecast |
| C14 | Implied versus realized/historical volatility; annualization, window/source, IV30/RV20, vol points versus relative percent, IV crush and event context | Missing | A, C, D, F | Compare aligned definitions and explain why IV minus RV alone is not proof of mispricing |
| C15 | ATM reference, 25-delta coordinates, volatility smile/skew, risk reversal, butterfly, term structure, IV surface, observed/fitted/missing regions | Missing | A, F; live locale descriptions | Interpret strike/expiry slices and avoid treating a fitted or absent cell as an observed quote |
| C16 | IV rank versus IV percentile; trailing sample, outliers, insufficient history, same-method comparison across instruments | Missing | A, D, F | Construct a dataset where rank and percentile disagree and explain both answers |
| C17 | Trade delta-equivalent magnitude versus signed position delta versus signed aggregate flow; gross/bull/bear/neutral DEX, cancellation, Net DEX | Partial; final numbers mainly supplied | A, C, D, F | Derive the units and the stated sign convention, then aggregate without confusing tape direction with dealer inventory |
| C18 | DEI/ΔOI DEI, effective-volume denominator, percentage scaling, sign versus magnitude, stock/index proxy normalization, unavailable denominator | Partial denominator lab | A, D, F | Calculate an example, identify numerator lineage, and explain the assumptions behind a proxy rather than memorize vendor configuration |
| C19 | GEX model, OI versus volume inputs, assumed position signs, net/gross/call/put GEX, cancellation, units, full-chain coverage and selected scope | Partial signed-grid lab | A, D, F | Explain why equal net totals can conceal different gross and local exposure; identify what is modeled |
| C20 | Positive/negative/near-zero gamma regimes; conditional delta hedging, zero-gamma flip/repricing, gamma squeeze; scenario sensitivity | Mostly named, mechanism missing | A, C, D, F, H | Explain conditional hedging behavior under stated positions and why a modeled regime is not a forecast |
| C21 | Call/put walls, gamma concentration/magnet, max pain versus gamma-weighted levels, expiry shares, level distance, reference spot and ATR | Missing | A, F, H | Reproduce a small concentration or payout example; reject guaranteed support/resistance/pinning interpretations |
| C22 | Charm, vanna, charm concentration/pin; time/volatility-driven delta changes, sign conventions and model uncertainty | Missing | A, F | Distinguish time, spot, and volatility effects and state the assumptions behind each modeled quantity |
| C23 | Ranking versus prediction; signed versus magnitude ordering; comparable universe, liquidity floor, exclusions, selection/survivorship bias; concentration | Partial in lessons 1–5 | A, F, H | Choose a metric for a question and describe how peer/universe changes alter the result |
| C24 | Time and provenance: live/delayed/completed session, event/source/receipt dates, point-in-time information, source grain, rolling versus fixed cohorts, zero versus missing | Partial, strongest in lessons 4 and 7 | A, B, D, F | Reconstruct what was knowable at a stated time and reject mixed-grain or look-ahead evidence |
| C25 | Historical abnormality, baseline calibration, percentile/standardized score, recency weighting/half-life, coverage and uncertainty; heuristic scores versus probabilities | Missing | I; prototype/internal status must stay explicit | Show how a score changes with baseline or decay despite unchanged raw executions; explain what it does not estimate |
| C26 | Research question, falsifiability, observation/inference, counter-evidence, confirmation/selection bias, replay, out-of-sample cases, correlation versus causality | Partial; process wording stronger than practice | A, H | Produce a bounded hypothesis and test it on unseen evidence without rewriting the question |
| C27 | Reproducible analysis, calculations, source-to-claim lineage, chart axes/units/scales, aggregation, caveats, research brief and independent audit | Partial MCQ recognition; artifact missing | H | Have another reader reproduce the result and locate seeded defects |
| C28 | Holdings, quantity, cost basis, mark/market value, cash versus buying power, realized/unrealized P&L, fees, long/short risk, allocation/concentration | Missing; separate portfolio track | G | Calculate a small account example and distinguish balance, risk, and deployable capital |
| C29 | Equity curve, deposits/withdrawals versus return, time-weighted return, benchmark comparison, win rate, average win/loss, profit factor, attribution, FIFO assumptions | Missing; separate portfolio track | G | Explain why a rising account balance or high win rate need not imply a superior investment return |
| C30 | Portfolio Greeks, multiplier/direction aggregation, missing-Greek coverage, hedging, contract/underlying exposure, journal versus outcome evidence | Missing; separate portfolio track | G, C | Aggregate a small mixed portfolio with explicit units and disclose uncovered positions |

C02/C03/C05 include prerequisite ideas needed to understand exposed data, even when the app does not have a field for each idea. C09 should teach strategy structures as interpretation counterexamples before any later strategy course. C25 must describe its analytical method without implying its prototype or internal presentation is publicly available. C28–C30 belong in a portfolio learning track; they should not make the initial execution lesson unnecessarily long.

This map establishes the coverage families found in the inspected app, not a certification that every future label or every market concept is covered. The detailed term register below is the required next authoring control. No current concept should be considered taught simply because it appears in this document.

## Source inventory and known disagreements

| Key | Inspected app source | Use in curriculum design |
| --- | --- | --- |
| A | [Domain concept model](/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/doc/ontology/concepts.md) | Underlying, contract, chain, and trade; attributes and their lineage |
| B | [Option Trades functionality](/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/doc/domain-knowledge/option-trades/functionality.md:202) and its domain invariants | Tape concepts, aggregation, freshness, ratio semantics |
| C | [App glossary and value explanations](/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/src/locales/en-US.ts:3490) and [shared basic concepts](/Users/evansmacbookpro/Desktop/Projects/awesome-ai-coding-rules/knowledge/basic_concepts.md:37) | Terms learners actually encounter; also a source of wording to challenge |
| D | [Metric interpretation/definition registry](/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/src/lib/metrics/registry.ts) and [dimension registry](/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/src/lib/metrics/dimensions.ts:27) | Units, direction versus magnitude, explicit conventions |
| F | [Rank functionality](/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/doc/domain-knowledge/rank/functionality.md:141), [Rank invariants](/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/doc/domain-knowledge/rank/domain-invariants.md:69), and [research abilities](/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/src/domain/researchWorkflows/catalog.ts:14) | Discovery, contract/chain/flow/positioning, tradeability, volatility, GEX |
| E | [Current Tradely manifest](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/content/course.ts) | Existing lesson identity and current coverage, not a constraint on the final concept sequence |
| G | [Portfolio functionality](/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/doc/domain-knowledge/portfolio/functionality.md:33) and [analytics invariants](/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/doc/domain-knowledge/portfolio/domain-invariants.md:113) | Financial concepts in the internal portfolio surface; exclude brokerage connection instructions |
| H | [Cookbooks functionality](/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/doc/domain-knowledge/cookbooks/functionality.md), [official versus prospective analyses](/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/doc/data-app-catalog.md:9), and research abilities | Analytical techniques and output quality, independent of recipe UI |
| I | [Flow activity model](/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/src/domain/optionTrades/flowActivity.ts) and [calibration metadata](/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/src/domain/optionTrades/flowMatrixTypes.ts) | Statistical/recency concepts, with implementation and release status separated from universal definitions |

Do not copy inconsistent source wording into lessons:

1. The shared basic-concepts file calls AASK “strong conviction” and BBID “desperate to exit.” Those are interpretations of psychology that quote location cannot establish. The newer app interpretation registry is more restrained.
2. `side` is called “observed” in parts of the concept model, but the classification is obtained by comparing a trade with a reference quote. Teach the execution price and quote as evidence, then the location/classification and its inferred aggressor as distinct steps.
3. Some glossary DEX/DEI descriptions omit the stated multiplier or percentage scale that other app descriptions include. Require explicit units and an example; never transfer a stored-field shorthand into a universal financial formula.
4. Older signed-DEI wording remains in locale text while current Rank invariants require magnitude. Teach the general normalized-exposure concept and explicitly name the example's sign and aggregation convention.
5. Some descriptions use “confirmation” for T+1 OI attribution or stronger dealer-hedging language than the interpretation registry supports. An aggregate report and assumed dealer signs do not identify the owner, complete strategy, or exact hedge transactions.
6. Option Trades documentation describes an index proxy under Vol/OI, while the conceptual definition is contract volume divided by contract OI and the clearly governed proxy treatment elsewhere belongs to DEI. Treat this as a documentation/implementation question to resolve, not a platform-agnostic rule that indices have no OI.

These are content-source disagreements found during this pass, not patches to the application and not an exhaustive app correctness audit. Exchange-specific activity abbreviations, model conventions, and any further disputed definitions need primary-source checks before lesson authoring.

## Revised learning sequence

1. **Contracts and money:** C01–C03. Learners can identify the instrument, rights/obligations, and units.
2. **How an execution happens:** C04–C07. Quotes, orders, trades, side, counterparties, and inferred sentiment come before reading flow labels.
3. **What the tape can establish:** C08–C12 and C24. Positions, OI, aggregation, activity conditions, liquidity, and the limits of attribution.
4. **Why option values and exposures change:** C13–C18. Greeks, volatility, normalized exposure, and the prerequisites for interpreting advanced numbers.
5. **How structure is modeled:** C19–C22. Chain coverage, GEX, levels, second-order effects, and model assumptions.
6. **How to compare and investigate:** C23–C27. Screening, calibration, evidence, research briefs, and independent audit; reuse the strongest current exercises here.
7. **How to evaluate one's own portfolio:** C28–C30. A separate branch after contracts, positions, and Greeks.

Use platform-independent lesson names such as “Who initiated this trade?”, “How option flow becomes a sentiment label”, and “What a volatility surface describes.” Existing titles centered on opening drawers or using Rank/Cookbooks should become conceptual titles when those lessons are revised. App navigation and configuration remain in product help. Examples can use neutral tables, synthetic option symbols, exchange-style quote messages, and ordinary spreadsheets.

Full coverage does not mean every student must take every advanced topic first. Each topic needs a clear prerequisite path, and the introductory path must genuinely teach its vocabulary rather than defer it to unexplained tooltips.

## Authoring and coverage acceptance

Before declaring complete app-concept coverage, maintain one term register with: concept ID, aliases/app labels, source location, universal definition, explicit vendor/model convention if any, units, prerequisites, teaching lesson, worked example, independent assessment, and review status. Every domain term in the active research ability catalogs, glossary, metric catalogs, and in-scope portfolio surface must either map to that register or have a documented duplicate/non-domain/out-of-scope disposition. Prospective features are tracked separately. This can be a reviewed source document; it does not need a new database system.

A concept is covered only when learners receive **an explanation, a worked example, a plausible misconception, and an independent task**. A keyword, disclaimer, tooltip, or animation alone is insufficient. Use multiple-choice where it tests a real distinction; require calculations or short explanations when recognition cannot demonstrate the skill. The earlier first-answer shortcut and repeated-case findings still apply.

Immediate priority is the contracts → quotes/orders/trades → side → sentiment foundation. Test it with both a buyer and seller shown in the same transaction. Then extend the register and lesson plan across the remaining families. This changes the earlier “capstone first” priority: define the capstone as the destination, but author the missing execution foundations before asking beginners to perform that research workflow.
