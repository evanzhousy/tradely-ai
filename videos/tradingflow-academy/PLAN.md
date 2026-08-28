# TradingFlow Academy: From Noise to Evidence

Status: curriculum proposal
Primary language: English narration, English master captions, Chinese subtitle edition
Primary format: 16:9, 1920x1080, 6–10 minutes per core episode
Production framework: HyperFrames, using the `general-video` workflow for the multi-scene product-and-methodology format

## 1. Series position

This should not be a playlist of feature tours. The series teaches one repeatable research method:

> Discover → Inspect → Validate → Compare → Decide.

The five-step sequence comes from the current TradingFlow Home workflow. Rank finds candidates, the symbol and contract views expose the evidence behind them, Option Trades validates the tape, and the final two steps force the viewer to compare freshness and state what remains unknown.

TradingFlow is the main teaching environment, not a product cutaway. Approximately 65–75% of each core episode should show the platform in use. Motion graphics explain only the concepts that the interface cannot explain by itself.

The existing `public/videos/tutorials/00-09` clips are all approximately 15 seconds long. Keep them as article openers and chapter trailers. The Academy videos become the substantive lessons linked from those articles.

The source-of-truth for terminology, platform mapping, and script claims is [`METHODOLOGY.md`](./METHODOLOGY.md). If a lesson conflicts with that document or the current App, update the lesson before production.

The acquisition narrative and fair competitive framing are defined in [`POSITIONING.md`](./POSITIONING.md). The series should lead with the user's interpretation problem before explaining the product.

### Problem-first opening contract

The first Academy video and any acquisition-focused cut should follow this order:

1. the mistake the viewer already recognizes;
2. why traditional single-lens analysis fails;
3. what current tape-, structure-, and alert-first products do well;
4. which ambiguity remains;
5. how TradingFlow's five-step workflow resolves that ambiguity;
6. proof through the actual App.

Do not claim that competitors lack options flow, GEX, contract analytics, or multi-tool workflows. TradingFlow's defensible difference is the integration of these lenses with explicit freshness, uncertainty, and a repeatable evidence path.

## 2. Methodology contract

Every episode should reinforce these rules:

1. A ranked row is a research candidate, not a trade signal.
2. Bid/ask location and option type imply possible sentiment; they do not reveal the participant's full intent.
3. Premium, DEX, DEI, volume, OI, and GEX answer different questions. Do not collapse them into one certainty score.
4. Session flow and structural positioning have different time horizons:
   - Premium and trade-tape DEX describe selected-session activity.
   - OI and delta-OI are dated structural evidence, generally updated after the session.
   - GEX is structural context for the selected date and scope, not an intraday forecast.
5. Call Wall, Put Wall, gamma flip, and other mapped levels are context. Never promise that a level will hold, attract price, or create a profitable entry.
6. A case study must show disconfirming evidence and an invalidation condition, not only the winning interpretation.
7. Every example must display symbol, date, session, scope, and data status such as live, delayed, historical, or prior-close.
8. Every metric explanation must state its source lens (Flow, Chain, or Hybrid), detail level (trade, contract, or symbol), and time horizon.
9. Until the DEX contract-multiplier wording is aligned across knowledge, UI copy, and implementation, teach DEX semantically rather than publishing a numeric formula.

## 3. Season 1 curriculum

Season title: **The Evidence-First Options Workflow**

| Episode | Working title | Methodology outcome | TradingFlow teaching surface | Target |
| --- | --- | --- | --- | --- |
| S1E01 | Why Options Flow Traders Get Faked Out | Understand context collapse, the limits of existing analysis approaches, and the five-step TradingFlow workflow | Home, Rank · Symbols, symbol inspection drawer, Rank · Contracts, Option Trades | 8 min |
| S1E02 | Read One Option Print Without Fooling Yourself | Read call/put, bid/ask side, size, premium, moneyness, DTE, and possible sentiment while preserving uncertainty | Option Trades live and historical tape | 7 min |
| S1E03 | Find Where Attention Is Concentrating | Use relative ranking and session scope instead of chasing the largest absolute print | Rank Workbench · Symbols | 6 min |
| S1E04 | From Symbol to Contract | Move from an active underlying to a specific contract using expiry, strike, moneyness, repetition, and Vol/OI | Rank Workbench · Contracts and contract drawer | 7 min |
| S1E05 | Separate Today's Flow from Standing Structure | Distinguish volume, OI, delta-OI, Vol/OI, walls, and freshness | Rank · Symbols inspection drawer · Positioning and Chain | 8 min |
| S1E06 | GEX Is a Regime, Not a Forecast | Interpret positive/negative gamma, gamma transition, Call Wall, Put Wall, expiry scope, and selected-date context | Rank · Symbols inspection drawer · GEX and Level Map | 8 min |
| S1E07 | DEX and DEI: Compare Directional Impact | Understand signed tape DEX, normalized DEI, and why neither is dealer inventory | Option Trades, Rank · Symbols, Rank · Contracts | 7 min |
| S1E08 | The Intraday Index Workflow | Execute the full Discover → Inspect → Validate → Compare → Decide loop without turning context into prediction | Rank · Symbols, symbol drawer, Rank · Contracts, Option Trades | 10 min |
| S1E09 | The Single-Stock Event Workflow | Combine event timing, DTE, IV, moneyness, structure, and current flow for an earnings name | Watchlists, Rank filters, symbol drawer, Option Trades Historical | 8 min |
| S1E10 | False-Positive Autopsy | Recognize hedges, spreads, rolls, stale OI assumptions, and missing follow-through | Option Trades Historical, Positioning/Chain tabs, price context | 7 min |
| S1E11 | Build a Repeatable Scanner | Define a universe and saved process instead of changing filters after seeing the result | Watchlists, filters, saved views | 6 min |
| S1E12 | Review the Process, Not the Prediction | Build a daily recap and journal that records evidence, uncertainty, invalidation, and outcome | Market Recap, Option Trades Historical, Cookbooks | 6 min |

## 4. Recommended pilot

Produce these three episodes first:

1. **S1E01 — Why Options Flow Traders Get Faked Out**
   Establishes the audience problem, fair competitive context, and the TradingFlow methodology that gives every later episode a shared vocabulary.
2. **S1E02 — Read One Option Print Without Fooling Yourself**
   Tests whether the series can teach a dense concept through a single core product surface.
3. **S1E08 — The Intraday Index Workflow**
   Proves that the platform can carry a complete end-to-end lesson rather than a collection of isolated features.

Review retention, viewer questions, app CTA clicks, and recurring points of confusion before producing the remaining nine episodes.

## 5. Standard episode structure

| Time | Section | Purpose |
| --- | --- | --- |
| 0:00–0:15 | Concrete hook | Start with a real decision, not a feature name |
| 0:15–0:45 | What can go wrong | Show the common misread the episode will correct |
| 0:45–1:30 | Method principle | Introduce one mental model with a minimal diagram |
| 1:30–5:30 | Platform walkthrough | Perform the workflow in TradingFlow, with cursor focus and short zooms |
| 5:30–6:30 | Counter-evidence | Show what would weaken or invalidate the interpretation |
| 6:30–7:15 | Practice task | Give the viewer one thing to find in the product |
| Final 15 sec | Recap and next lesson | Repeat the method in one sentence and link to the next episode |

Longer case-study episodes may extend the walkthrough, but should keep the same order.

S1E01 is the acquisition-oriented exception. It uses the eight-minute problem → market → solution → proof structure in `POSITIONING.md`. Later lessons should remain problem-first, but do not need to repeat the competitor landscape.

## 6. Visual and audio system

Reuse the visual decisions established during the market-recap production:

- White background and solid black body text.
- Black subtitles in a dedicated safe-area caption band, never overlapping charts or product controls.
- Full-color TradingFlow logo visible throughout, with a restrained end-card animation.
- Company name always paired with the ticker, for example `Microsoft (MSFT)`.
- Show the company or ETF mark next to a ticker when a licensed or official asset is available.
- Do not use gradient text.
- Gradients belong only to charts, and each chart uses one coherent color family.
- Use candlesticks for price paths, lines for cumulative change, bars for strike or category comparisons, and donuts only for true part-to-whole composition.
- Preserve TradingFlow UI colors in product footage. Explanatory overlays must not make the interface look like a different product.
- Recommended narration baseline: Frederick, using a calm analyst delivery rather than promotional cadence.
- Deliver separate caption files. Do not burn two languages into the same frame.

## 7. Product capture rules

1. Capture the current TradingFlow webapp from the sibling local development project so test authentication and stable UI states are available.
2. Use deterministic or archived datasets for core lessons. A viewer should be able to reproduce the filters and selected date.
3. For market case studies, save a data packet containing:
   - selected session and timezone;
   - symbol and option root;
   - source rows used in the lesson;
   - price candles;
   - OI and delta-OI date;
   - GEX date and expiry scope;
   - whether tape data is live, delayed, or historical.
4. Do not invent prices or option prints to make a story cleaner.
5. Avoid screenshots as the main visual. Record the platform interaction, then use abstract primitives only when explaining a concept the product screen cannot isolate.
6. Keep account identity, customer data, API keys, and paid-account details out of all captures.

## 8. Reusable visual grammar

Each episode should draw from the same limited set of teaching primitives:

- **Workflow staircase:** Discover, Inspect, Validate, Compare, Decide.
- **Data lens:** Source (Flow/Chain/Hybrid) × Horizon × Detail level.
- **Freshness clock:** visual separation of live/session, end-of-day, and prior-close inputs.
- **Research funnel:** Symbol → Contract → Print.
- **Structure/flow split:** separately dated structural evidence and selected-session activity.
- **Chain map:** strike ladder with price, Call Wall, Put Wall, gamma flip, OI, and GEX.
- **Evidence ledger:** Supports, Contradicts, Unknown.
- **Invalidation card:** what new observation would make the current interpretation weaker.

These primitives should be components shared across episodes, not recreated in each composition.

## 9. Distribution package per episode

Every core episode produces:

- one 16:9 YouTube master, 6–10 minutes;
- one 45–75 second vertical short built around the episode's main mistake and correction;
- one 30–60 second X video or native clip;
- English SRT and Chinese SRT;
- one poster image and three chapter thumbnails;
- one `/learn/<slug>` lesson containing the video, transcript, terminology, and practice task;
- one CTA deep link to the exact TradingFlow surface used in the lesson.

Proposed source layout:

```text
videos/tradingflow-academy/
  shared/
  season-1/
    e01-stop-looking-for-signals/
    e02-read-one-option-print/
    ...
```

Proposed published media layout:

```text
public/videos/academy/season-1/
  e01-stop-looking-for-signals.mp4
  e01-stop-looking-for-signals.zh.srt
  e01-stop-looking-for-signals-poster.jpg
```

## 10. Production sequence

### Phase 1 — Curriculum and pilot scripts

- Lock the methodology contract and terminology.
- Lock the problem statement, competitive categories, and allowed comparison claims in `POSITIONING.md`.
- Resolve or explicitly defer the DEX multiplier and “hedging pressure” copy mismatches documented in `METHODOLOGY.md`.
- Write S1E01, S1E02, and S1E08 scripts.
- Build the shared workflow-staircase, data-lens, freshness-clock, and research-funnel components.

### Phase 2 — Evidence packs and storyboards

- Select one archived session per pilot.
- Record data provenance and platform state.
- Review a text storyboard and wireframe board before animation.

### Phase 3 — Pilot production

- Capture platform interaction.
- Build the HyperFrames compositions.
- Add Frederick narration, music, and captions.
- Run HyperFrames checks, midpoint snapshots, and final Studio review before rendering.

### Phase 4 — Publish and learn

- Publish the three pilots to the Academy hub and existing Learn pages.
- Cut X and short-form derivatives.
- Collect viewer questions and identify where the method remains unclear.

### Phase 5 — Complete Season 1

- Adjust episode density from pilot evidence.
- Produce S1E03–S1E07 and S1E09–S1E12 in two batches.
- Add recurring dated case studies without changing the core curriculum.

## 11. Definition of done

An episode is ready only when:

- the methodology claim is accurate and non-predictive;
- all visible values match the archived evidence pack;
- the platform is the primary teaching surface;
- symbol, ticker, date, scope, and freshness are visible;
- counter-evidence and invalidation are included;
- captions remain outside product and chart content;
- the HyperFrames check passes and midpoint snapshots are reviewed;
- the final Studio preview is approved before render;
- the rendered file, subtitles, poster, lesson page, and derivative clips are verified.
