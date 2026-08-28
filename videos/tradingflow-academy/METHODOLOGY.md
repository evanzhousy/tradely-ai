# TradingFlow Core Concepts and Product Philosophy

Status: repository-grounded curriculum authority
Audience: Academy writers, product educators, video producers, and reviewers
Current product: TradingFlow web app
Last reviewed against the app repository: 2026-07-26

## 1. Executive thesis

TradingFlow is not a one-click options signal product. It is an evidence-first research workflow:

> Discover → Inspect → Validate → Compare → Decide

The platform helps a trader move from broad activity to a specific, testable interpretation:

1. discover where attention is concentrating;
2. inspect the underlying and the exact contract;
3. validate the interpretation against actual option prints;
4. compare evidence with different freshness, horizons, and scopes;
5. decide while stating what remains unknown.

The desired outcome is not certainty. It is a better-defined decision with visible evidence, explicit caveats, and a repeatable path back to the source data.

## 2. Source-of-truth hierarchy

Academy scripts must be reviewed in this order:

1. `awesome-ai-coding-rules/knowledge/basic_concepts.md` for the shared conceptual vocabulary;
2. `tradingflow-webapp-fullstack/doc/domain-knowledge/<module>/domain-invariants.md` for current product promises and non-negotiable business rules;
3. the matching `functionality.md` for the current user-facing surface and workflow;
4. current source code and tests for implemented formulas, routes, labels, scopes, and edge cases;
5. the visible local App for final presentation and interaction verification.

When these sources disagree, the disagreement must be resolved or disclosed before it becomes narration. A polished script is not allowed to hide a semantic mismatch.

## 3. The product philosophy

### 3.1 Workflow over signal

A ranked row, unusual print, wall, or gamma regime is a research starting point. None is a standalone instruction to buy, sell, enter, or exit.

TradingFlow should teach the viewer to ask the next question:

- Why did this symbol rank?
- Which contract contributed?
- What did the prints actually show?
- Which evidence is intraday, overnight, or prior-close?
- What would contradict the interpretation?

### 3.2 Discovery and validation are different jobs

Rank is the discovery layer. It compresses a large universe into names and contracts worth inspecting.

Option Trades is the validation layer. It exposes the tape-level evidence behind the candidate, with Live and Historical views.

Ranking tells the user where to look. The tape helps the user determine what was observed. Neither proves the participant's full strategy or future price direction.

### 3.3 Every metric has a lens

TradingFlow data must be read along three dimensions:

| Dimension | Values | Why it matters |
| --- | --- | --- |
| Data source | Flow, Chain, Hybrid | A trade print and an option-chain snapshot answer different questions. |
| Time horizon | Single anchor, Multi-horizon | Session activity, overnight OI, and prior-close GEX cannot be treated as simultaneous observations. |
| Detail level | Trade, Contract, Symbol | A single execution, a contract aggregate, and a full-chain symbol view are not interchangeable. |

The app's main surfaces occupy different positions in this map:

| Surface | Primary lens | Research job |
| --- | --- | --- |
| Option Trades | Flow · trade level | Inspect Live or Historical option prints. |
| Rank · Contracts | Hybrid · contract level | Find standout contracts using recent flow plus structural context. |
| Rank · Symbols | Chain-led hybrid · symbol level | Find active underlyings and inspect full-chain structure with a lightweight flow overlay. |

### 3.4 Inference must remain labeled as inference

Options data reveals executions and modeled exposures, not the complete intent of the participant.

- Bid/ask location is an aggressor inference.
- Sentiment is inferred from option type and execution side.
- A sweep or block describes execution style, not necessarily directional conviction.
- Premium describes money traded, not whether the trade was an outright bet, hedge, spread leg, roll, opening trade, or closing trade.
- OI change can strengthen an interpretation after the fact, but it does not identify the original trader or reconstruct the complete strategy.

The correct Academy language is “suggests,” “is consistent with,” “shows concentration,” or “we cannot determine.” Avoid “proves,” “guarantees,” “smart money,” and “institutional conviction.”

### 3.5 Structure is context, not a forecast

GEX, Call Wall, Put Wall, gamma transition, Gamma Magnet, OI, and Max Pain describe modeled or observed structure around strikes.

They do not guarantee:

- support or resistance;
- a price magnet;
- a reversal;
- a breakout;
- a profitable entry.

The app's current GEX language is deliberately conditional:

- GEX uses prior-close option structure and a dealer-sign convention.
- Net GEX sign describes a modeled gamma backdrop, not bullish or bearish direction.
- A positive, negative, or near-zero gamma regime describes possible hedging behavior, not a probability or forecast.
- Call Wall and Put Wall names describe concentration.
- The gamma transition is a modeled regime boundary, not a support/resistance node.

### 3.6 Freshness is part of the value

A number without its date and scope is incomplete.

- Option Trades describes selected-session executions.
- Daily volume describes the current or selected trading session.
- OI is overnight-cleared and is not updated trade by trade.
- ΔOI compares two OI snapshots.
- GEX is selected-date, prior-close modeled structure for an explicit expiry scope.
- Historical price candles may span prior sessions, while structural overlays remain tied to the selected Rank date.

Every lesson must display the symbol, session date, market timezone, expiry scope, and whether data is Live, latest snapshot, Historical, delayed, overnight, or prior-close.

### 3.7 Magnitude and direction must be separated

TradingFlow intentionally separates “how large?” from “which way?”

- Net DEX is signed session-flow direction.
- Net DEI is the magnitude of Net DEX relative to an effective liquidity denominator.
- ΔOI DEI is also interpreted by magnitude in the Rank UI; its signed source context is read separately.
- Gross GEX is magnitude.
- Net GEX sign describes the modeled gamma backdrop, not price direction.

No Academy lesson may turn these into a composite certainty score unless a separately documented, no-look-ahead validation process exists.

### 3.8 Repeatability over storytelling

Cookbooks and Market Recap express the platform's broader research philosophy:

- A Cookbook recipe is a repeatable definition, not a baked result.
- Recipe data is resolved from the current or explicitly pinned session.
- AI Insight is an opt-in, read-only interpretation of the visible data, not hidden evidence.
- Market Recap uses completed-session datasets and vetted charts.
- Market numbers must come from the recap evidence, while cited news may supply context only.
- Every conclusion remains descriptive and includes a disclaimer.

The platform should make a compelling explanation auditable, not merely persuasive.

### 3.9 Useful preview, premium depth

The product's access model also communicates a philosophy:

- public previews should be genuinely useful;
- paid value should come from depth, control, persistence, live updates, exports, detailed inspection, and AI;
- premium gates should appear when the user reaches for a premium action, not as an unsolicited interruption;
- a preview must never pretend that paid customization or real-time streaming is active.

Academy footage must identify when an action requires sign-in or a paid entitlement. It should teach the real product rather than silently cutting around its access boundaries.

## 4. The canonical five-step workflow

| Step | User question | Current App surface | Route | Required teaching behavior |
| --- | --- | --- | --- | --- |
| Discover | Where is unusual or concentrated activity appearing? | Rank · Symbols | `/app/rank/symbols` | Treat ranked names as candidates, not signals. |
| Inspect | Which exact contract and structural features explain the candidate? | Rank · Contracts and the Symbols inspection drawer | `/app/rank/contracts` | Check expiry, strike, moneyness, Vol/OI, OI context, and contributing flow. |
| Validate | What did actual trades show? | Option Trades · Live / Historical | `/app/option-trades/live`, `/app/option-trades/historical` | Read prints, aggressor inference, premium, repetition, and activity type. |
| Compare | Are the observations comparable in date, scope, and freshness? | Cross-surface comparison | Current working surfaces | Separate session flow from OI and GEX structure; do not back-project structural levels. |
| Decide | What is supported, contradicted, and still unknown? | Evidence ledger, Cookbook, or recap workflow | `/app/cookbooks`, `/app/market-recap` | State counter-evidence, uncertainty, and the next observation that would change the view. |

The standalone Option Chain Analysis route is retired. Its structural analysis now lives inside Rank · Symbols and the symbol inspection drawer, including the Overview, Positioning, GEX, Vol, and Chain tabs. Where available, the paid consent-gated Flow tab connects selected-session evidence to that structural context.

## 5. Core concept map

### 5.1 Reading an execution

| Concept | What it answers | Safe interpretation | What it cannot prove |
| --- | --- | --- | --- |
| Side | Where did the trade print relative to bid and ask? | AASK/ASK suggests buyer aggression; BID/BBID suggests seller aggression; MID is uncertain. | The trader's complete position or motive. |
| Sentiment | What directional reading follows from option type and side? | Call ask and put bid lean bullish; call bid and put ask lean bearish. | Whether the trade is an outright bet, hedge, spread, roll, open, or close. |
| Premium | How much option value traded? | Contract size × option price × contract multiplier. | Directional truth or conviction. |
| Activity type | How was the order executed? | Sweep, block, and related codes describe execution mechanics. | A guaranteed directional strategy. |
| Moneyness | Where is the strike relative to spot? | ITM, ATM, and OTM frame sensitivity and payoff location. | Whether the option is cheap, expensive, or likely to finish profitable. |
| DTE | How much time remains? | Separates 0DTE, near-term, and longer-dated behavior. | The catalyst or participant's holding period. |

### 5.2 Flow, turnover, and persistence

| Concept | What it answers | Current semantic contract | Caveat |
| --- | --- | --- | --- |
| Volume | How many contracts traded during the session? | Intraday/session activity. | It includes opening, closing, and churn. |
| OI | How many contracts remain open after clearing? | Overnight structural snapshot. | Not real time and does not reveal holder direction. |
| ΔOI | How did cleared OI change from the prior snapshot? | Later evidence about persistence or position change. | It does not uniquely map back to one trade. |
| Vol/OI | How heavy is today's turnover relative to standing OI? | Freshness and concentration heuristic. | A high ratio is not proof that every trade opened a new position. |
| UOA | Is activity loud relative to the instrument's baseline? | Discovery heuristic using relative abnormality. | Not proof of institutional participation or a future move. |
| T+1 review | Did activity appear to persist in the next OI snapshot? | Stronger retrospective evidence than intraday guessing. | Still aggregate, not participant-level attribution. |

### 5.3 Directional exposure

| Concept | What it answers | Current semantic contract | Caveat |
| --- | --- | --- | --- |
| Bull/Bear/Neutral DEX | How much delta-weighted, share-equivalent session flow fell into each inferred sentiment bucket? | Contract-level flow derivation; neutral prints remain visible. | A modeled flow measure, not dealer inventory. |
| Net DEX | Which inferred sentiment bucket dominated after bullish minus bearish flow? | Signed session trade-tape direction. | Not forced hedging, position ownership, or a forecast. |
| Net DEI | How large is Net DEX relative to the effective liquidity denominator? | Non-negative magnitude; direction is read from Net DEX/Sentiment. | Index roots may use explicit proxy denominators; unsupported roots remain unknown. |
| ΔOI DEX | How large is the signed day-over-day OI change in delta-equivalent shares? | `ΔOI × 100 × delta`. | Structural change, not current-session tape flow. |
| ΔOI DEI | How large is ΔOI DEX relative to the effective denominator? | Magnitude in the Rank UI, with direction read separately. | Does not prove that today's flow opened or persisted a position. |

### 5.4 Gamma and strike structure

| Concept | What it answers | Current semantic contract | Caveat |
| --- | --- | --- | --- |
| GEX | Where could modeled gamma-related hedge sensitivity be concentrated? | Prior-close structure using a dealer-sign convention. | Not observed dealer positioning or a price forecast. |
| Net GEX | What is the modeled gamma backdrop after call and put effects combine? | Sign separates positive, negative, and near-zero regimes. | Sign is not bullish/bearish price direction. |
| Gross GEX | How much total gamma magnitude exists before offsetting? | Absolute call plus absolute put GEX. | Large gross can coexist with near-zero net. |
| Gamma regime | Might modeled hedging more often dampen or reinforce moves? | Positive, negative, or balanced near zero. | News, liquidity, IV, time, and price can change or overwhelm it. |
| Gamma transition | Where does repriced Net GEX cross zero? | Continuous modeled regime boundary. | Not a strike node, support, or resistance. |
| Call Wall | Where is positive call-GEX concentration strongest in scope? | Prefer the strongest eligible strike at or above spot. | “Wall” does not guarantee resistance. |
| Put Wall | Where is negative put-GEX concentration strongest in scope? | Prefer the strongest eligible strike at or below spot. | “Wall” does not guarantee support. |
| Gamma Magnet | Which strike has the largest gross GEX concentration? | Concentration reference. | No direction or promise that price will visit it. |
| Expiry scope | Which expirations are included? | 0DTE = 0 days; Weekly = 1–7; Monthly = 8–31; All includes longer dates. | Scopes are not comparable unless the selected date and denominator are held constant. |

### 5.5 Volatility

IV and its derived comparisons describe the price of optionality, not future realized direction.

- IV: the volatility implied by option prices.
- IV Rank / Percentile: where current IV sits relative to its own history.
- Skew: how IV differs across calls, puts, and deltas.
- Term structure: how IV differs across expirations.

These measures help frame whether optionality is relatively rich, cheap, concentrated, or event-sensitive. They do not independently indicate that the underlying will rise or fall.

## 6. How the concepts work together

The recommended reasoning sequence is:

1. **Rank the symbol.** Find an underlying that is unusual relative to the selected universe and session.
2. **Inspect the contract.** Identify which expiries, strikes, moneyness bands, and flow buckets contribute.
3. **Read the tape.** Confirm whether actual prints show repeated buyer or seller aggression, meaningful premium, neutral execution, or mixed evidence.
4. **Add structure.** Use OI, ΔOI, GEX, volatility, and price context as separately dated lenses.
5. **Compare scopes.** Confirm date, expiry scope, denominator, and data status before combining any numbers.
6. **Write an evidence ledger.** Record `Supports`, `Contradicts`, and `Unknown`.
7. **Define the next check.** For example, later prints, price response, IV change, or the next cleared OI snapshot.

This is the TradingFlow method: progressively reduce ambiguity without pretending to eliminate it.

## 7. Academy truth contract

Every lesson, chart, narration script, caption file, and social cut must follow these rules:

1. State what the metric measures before interpreting it.
2. Keep Flow, Chain, and Hybrid evidence labeled.
3. Keep trade, contract, and symbol levels distinct.
4. Show the data date, session, timezone, expiry scope, and freshness.
5. Pair every inferred claim with its uncertainty.
6. Never call Net DEX dealer inventory.
7. Never display Net DEI or ΔOI DEI as directional by themselves.
8. Never present GEX sign as bullish/bearish price direction.
9. Never promise that a wall, magnet, or gamma transition will hold or attract price.
10. Never call a high Vol/OI, UOA, or large premium print proof of opening activity or institutional intent.
11. Include at least one contradictory or ambiguous observation in each case study.
12. End with what would change the interpretation, not a buy/sell instruction.

## 8. Current terminology

Use:

- TradingFlow
- Home
- Rank Workbench
- Rank · Symbols
- Rank · Contracts
- symbol inspection drawer
- Option Trades · Live
- Option Trades · Historical
- Cookbooks
- Market Recap

Avoid in new lessons:

- OptionData as the current product name
- Market Rank as a current module name
- standalone Option Chain Analysis
- GEX Explorer as a standalone route
- “smart money,” “guaranteed support,” “guaranteed resistance,” or “confirmed signal”

## 9. Contract mismatches to resolve before formula-led scripts

The audit found several places where the shared concept document, current UI copy, and implementation are not fully aligned.

### 9.1 DEX contract multiplier

`basic_concepts.md` describes stored DEX as `delta × size`, while its numerical example implies the 100-share contract multiplier. The current Rank derivation explicitly calculates sentiment-bucket DEX as `side size × |delta| × 100`.

Until the shared glossary, UI tooltips, and implementation use one documented convention, Academy narration should say:

> delta-weighted, share-equivalent session exposure

Do not teach a numeric DEX formula in a published lesson yet.

### 9.2 “Hedging pressure” versus session flow

Some current Rank tooltips describe Bull/Bear DEX and DEI as “hedging pressure.” The Rank domain invariant is stricter: Net DEX is signed session trade-tape direction, not dealer inventory or evidence of forced hedging.

Academy scripts must follow the stricter invariant and call it session flow or directional exposure.

### 9.3 Structural levels

Older concept language treats Call Wall, Put Wall, Max Pain, and large OI as support, resistance, or magnets too directly. Current GEX education in the App says these labels describe concentration and do not guarantee price behavior.

Academy scripts must use the current conditional language.

### 9.4 UOA, OI, and participant intent

Older material sometimes treats thresholds as proof of institutional conviction, opening activity, or directional impact. The actual App exposes aggregate prints and cleared OI, not participant identity or full strategy.

Thresholds may be taught as screening heuristics only. T+1 OI is stronger retrospective evidence, not definitive participant-level attribution.

### 9.5 Product naming and routes

Parts of the knowledge file still use the OptionData name and older product taxonomy. Current lessons must use the TradingFlow routes and module names listed above.

## 10. Curriculum consequence

The Academy is therefore not organized as a glossary in video form. It is organized around the five-step workflow:

- foundation: inference, uncertainty, and data freshness;
- discovery: Rank · Symbols;
- inspection: Rank · Contracts and the symbol drawer;
- validation: Option Trades;
- structural context: OI, ΔOI, GEX, and volatility;
- synthesis: evidence ledger, Cookbooks, and Market Recap.

Each metric lesson must answer three questions:

1. What does the metric measure?
2. Which App surface and time horizon does it belong to?
3. What can it not tell us?

That structure keeps TradingFlow's methodology and the real product inseparable.

## 11. Evidence index

The following current files were used to derive this document:

- shared vocabulary: `awesome-ai-coding-rules/knowledge/basic_concepts.md`;
- platform taxonomy and current surface map: `tradingflow-webapp-fullstack/doc/domain-knowledge/shared/functionality.md`;
- Rank promises and metric semantics: `tradingflow-webapp-fullstack/doc/domain-knowledge/rank/domain-invariants.md`;
- Option Trades behavior and freshness rules: `tradingflow-webapp-fullstack/doc/domain-knowledge/option-trades/domain-invariants.md`;
- Cookbook repeatability and AI boundaries: `tradingflow-webapp-fullstack/doc/domain-knowledge/cookbooks/domain-invariants.md`;
- Market Recap evidence rules: `tradingflow-webapp-fullstack/doc/domain-knowledge/market-recap/domain-invariants.md`;
- canonical Home workflow: `tradingflow-webapp-fullstack/src/pages/home/infographics/HomeWorkflowSvg.tsx`;
- current tool chooser: `tradingflow-webapp-fullstack/src/pages/home/infographics/HomeToolChooserSvg.tsx`;
- DEX implementation: `tradingflow-webapp-fullstack/src/domain/contractRank/sideSizeFlow.ts`;
- current GEX educational copy: `tradingflow-webapp-fullstack/src/pages/contractFlowRank/components/symbolDrawer/GexTermHelp.tsx`;
- current Rank calculation tooltips: `tradingflow-webapp-fullstack/src/pages/contractFlowRank/util/cellCalculationTooltips.ts`.
