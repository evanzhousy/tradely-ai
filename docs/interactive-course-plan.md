# Course update plan: concepts, interactive practice, and independent research

Updated September 8, 2026. Planning baseline: `2e1f657`. This consolidated plan replaces the earlier eleven-lesson conversion roadmap. Supporting evidence remains in the [content review](/Users/evansmacbookpro/Desktop/Projects/tradely/docs/reviews/course-content-review-2026-09-08.md), [concept coverage inventory](/Users/evansmacbookpro/Desktop/Projects/tradely/docs/reviews/platform-agnostic-concept-coverage-2026-09-08.md), and [pilot implementation record](/Users/evansmacbookpro/Desktop/Projects/tradely/docs/interactive-course-pilot.md).

**Recommendation:** expand the applied-research course into eight concept-led modules, with a working syllabus of 36 focused lessons. Build execution foundations first, revise existing lessons where their objectives remain recognizable, and progressively add advanced and portfolio material. Each lesson must teach and test a useful skill. The proposed count is an authoring outline, not a fixed runtime or database structure.

**Design statement:** Tradely owns explanations, versioned teaching cases, learner work, and assessment; the app supplies the coverage checklist, while optional 2D/Three.js views illustrate the same evidence without owning its meaning or grading.

**Implementation status:** the 36-lesson edition is implemented locally. The [verification record](reviews/course-update-verification-2026-09-08.md) records delivered behavior, tests, content audits and remaining live-account, media-publication and human-review gates. The original 11 IDs and existing version fields are retained.

## 1. Decisions carried forward

- Teach **platform-agnostic knowledge** encountered throughout `/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack`. Use neutral lesson titles and portable examples. Platform navigation belongs in product help; TradingFlow practice links remain optional enrichment.
- Teach **beginner foundations**: contracts, money, quotes, orders, executions, counterparties, side, and sentiment before advanced flow labels.
- Cover all in-scope financial/analytical concepts. Reconcile app glossaries, metric definitions, research abilities and portfolio analytics term by term. The current 30 concept families are the starting inventory, not proof of complete teaching.
- Make lessons interactive, with **selective optional Three.js** and an equivalent accessible 2D path. Interaction must expose a relationship or test a decision.
- Animate changing numbers with visible input/output relationships. **Default playback to the fastest available option, currently 2×**; preserve pause, replay, scrub/checkpoints, and reduced-motion behavior.
- Keep **Home, Curriculum, module context and previous/next lesson** available on desktop and mobile. Returning to the curriculum retains the learner's place.
- Keep content flexible and versioning simple: reuse JSONB attempt state/results and existing `content_version`/`scenario_version` fields. No curriculum publication, enrollment, or automatic migration framework.
- Preserve existing lesson IDs, URLs, access rules and historical progress where the objective continues. New objectives get new semantic IDs. Completion is separate from passing the current exercise.
- Provide complete **English and Simplified Chinese** explanations, examples, feedback and equivalent assessments.
- Finish implementation batches with scoped local commits and relevant verification. Publishing and remote data changes require their own identified targets; they are not implied by a local preview.

## 2. Starting point and immediate repairs

The worktree contains 11 lessons and 22 supplemental scenario variants, optional contract/GEX Three.js views, and existing account/attempt infrastructure. Reuse these assets.

A fresh run of the [assessment probe](/Users/evansmacbookpro/Desktop/Projects/tradely/docs/reviews/audit-course-assessments.cjs) at this planning baseline reproduced: fixed first-answer selection scores 36/60 independent question instances and earns “demonstrated” in 8/22 variants, including default cases for 7/11 lessons. Seventeen independent questions exactly repeat an earlier non-independent question within the same scenario. These are content-shortcut findings, not learner outcomes.

Repair first:

1. Reconcile quote price, per-contract amount, total premium and notional across lesson 6's text, captions and rendered video. A corrected script alone is insufficient.
2. Remove the unavailable Season 3 entry dependency and absent S4E12 ending handoff.
3. Replace the decorative recap chart with a genuine example carrying quantity, units, source, date, scope and coverage.
4. Clarify underspecified versus untestable forecasts, declared cross-expiry comparisons, and consistent denominator methods versus identical numeric denominators.
5. Replace duplicated/telegraphed independent items and align English/Chinese result claims.
6. Resolve app-source disagreements before reusing definitions: conviction versus urgency, DEX units, DEI conventions, index proxies, and T+1 attribution. The app tells us what students encounter; its wording is not automatically universal truth.

Real learner effectiveness and deployed account persistence were not established by the content review. They remain separate verification tasks and do not block local authoring.

## 3. Proposed syllabus

Numbers are planning positions, not stored IDs. C01–C30 refer to the [coverage inventory](/Users/evansmacbookpro/Desktop/Projects/tradely/docs/reviews/platform-agnostic-concept-coverage-2026-09-08.md). Each row requires learner output; merely mentioning a term does not satisfy it.

### Module A — Contracts and money

| # | Lesson | Coverage | Learner output |
| --- | --- | --- | --- |
| 1 | What an option contract describes | C01, C02 | Identify underlying, stock/ETF/index type, call/put, strike, expiry and stated multiplier |
| 2 | Buyers, writers, rights and obligations | C02, C09 | Explain long/short call and put positions and identify each party's right or obligation |
| 3 | Quote price, premium, moneyness, payoff and profit | C03 | Calculate per-contract/total premium, classify call/put moneyness, and distinguish payoff from profit and break-even |
| 4 | Expiration, exercise, assignment and settlement | C02, C24 | Follow a position under stated product rules; distinguish DTE/0DTE, exercise, assignment, cash and physical settlement |

### Module B — Quotes, executions, side and sentiment

| # | Lesson | Coverage | Learner output |
| --- | --- | --- | --- |
| 5 | A quote, an order and a trade are different events | C04 | Read bid/ask prices/sizes, spread, midpoint, last and NBBO; distinguish orders, cancellations, quote updates and prints |
| 6 | Who buys and who sells in one execution? | C05 | Identify counterparties, resting orders and aggressors; compare market, limit, marketable-limit, partial-fill and slippage examples |
| 7 | Reading execution side against a reliable quote | C06, C24 | Interpret ASK/AASK/MID/BID/BBID, inside-spread versus exact midpoint, and unreliable quote context |
| 8 | How option flow gets a bullish or bearish label | C07 | Explain all four call/put classifications; distinguish inferred direction, belief, position exposure and neutral/unknown |
| 9 | Validate one execution from its evidence | C03, C06, C07, C24 | Produce a calculation and fact/inference/unknown/next-check note from an unfamiliar print |

### Module C — Flow, positions and data quality

| # | Lesson | Coverage | Learner output |
| --- | --- | --- | --- |
| 10 | Why volume and open interest move differently | C08, C24 | Derive volume/OI from open/open, close/close and transfer examples; explain ΔOI and attribution limits |
| 11 | What a tape row represents | C10, C11 | Reconstruct aggregated size/premium/trade count; interpret sweep/block/auction/complex-order conditions without inferring identity |
| 12 | When activity is actually unusual | C12, C25 | Calculate relative volume and volume/OI; expose a tiny-denominator or partial-session false positive |
| 13 | One option leg can belong to many strategies | C09 | Use spreads, rolls, protective puts, covered/uncovered calls, straddles and collars as counterexamples to single-print intent claims |
| 14 | Read each source on its own clock | C24 | Audit identity, timestamps, coverage, missing versus zero, and fixed versus rolling cohorts |

### Module D — Pricing, Greeks and normalized exposure

| # | Lesson | Coverage | Learner output |
| --- | --- | --- | --- |
| 15 | Delta: a local price sensitivity | C13 | Calculate a small-move example with units/signs; distinguish sensitivity from a guaranteed price or probability |
| 16 | Gamma: how delta changes | C13 | Explain curvature and a conditional hedge adjustment, holding other inputs fixed |
| 17 | Time, volatility and rates: theta, vega and rho | C13 | Compare one-input changes and explain a loss despite a favorable underlying move |
| 18 | Implied and realized volatility answer different questions | C14 | Explain model-implied versus historical estimates, annualization/windows, IV30/RV20, vol points and event-related changes |
| 19 | Read a volatility smile, skew and term structure | C15 | Interpret strike/expiry and 25-delta slices, risk reversal/butterfly measures, and observed/fitted/unsupported cells |
| 20 | IV rank and IV percentile can disagree | C16 | Compute both on a small history; explain an outlier or insufficient sample |
| 21 | From delta equivalents to DEX and DEI | C17, C18 | Calculate trade magnitude, signed aggregate flow, neutral contribution, DEI and ΔOI normalization with explicit units/proxies |

### Module E — Modeled positioning and structure

| # | Lesson | Coverage | Learner output |
| --- | --- | --- | --- |
| 22 | Build and interpret a GEX snapshot | C19 | Reproduce small net/gross/call/put totals, explain sign assumptions and identify missing chain coverage |
| 23 | Gamma regimes and the zero-gamma boundary | C20 | Explain conditional hedging, a repriced flip and gamma-squeeze scenario without claiming a forecast |
| 24 | Walls, concentration, max pain and distance | C21 | Distinguish gamma-weighted levels from OI-only payout; preserve expiry scope, spot and ATR context |
| 25 | Charm and vanna: exposure changes without a new trade | C22 | Separate time, volatility and spot effects and state the model assumptions |

### Module F — Defensible comparison and investigation

| # | Lesson | Coverage | Learner output |
| --- | --- | --- | --- |
| 26 | Write a question the evidence can answer | C26 | Write an observable question, required evidence and a reason to reconsider it |
| 27 | Define who belongs in the comparison | C23, C24 | Derive eligibility from raw facts, record exclusions and distinguish intended from observed universe |
| 28 | Rank observations without inventing a prediction | C12, C23 | Choose a metric for the question, explain peer-driven rank changes and justify a candidate |
| 29 | Read a contract neighborhood | C03, C23 | Compare concentration versus total activity across strike/expiry slices and qualify a candidate with nearby evidence |
| 30 | Test a pattern without hindsight | C25, C26 | Reconstruct point-in-time evidence; compare baseline/calibration/recency choices and test an unseen period |

### Module G — Produce and audit research

| # | Lesson | Coverage | Learner output |
| --- | --- | --- | --- |
| 31 | Build a reproducible research packet | C27 | Assemble concrete inputs, parameters, transformations, exclusions and output that another person can rerun |
| 32 | Write a supported recap | C27 | Produce a headline, correctly labeled chart, source references and nearby caveats |
| 33 | Audit and repair an unfamiliar recap | C26, C27 | Locate numerical/temporal/inference defects, repair affected claims and preserve valid conclusions |

### Module H — Portfolio understanding

| # | Lesson | Coverage | Learner output |
| --- | --- | --- | --- |
| 34 | Positions, cost, cash and P&L | C28 | Calculate cost basis, mark/value, realized/unrealized P&L, fees and concentration; distinguish cash from buying power |
| 35 | Evaluate performance rather than balance growth | C29 | Separate cash flows from returns; interpret TWR, benchmark comparison, win rate, average win/loss, profit factor and attribution |
| 36 | Aggregate portfolio exposure and its limits | C30 | Sum mixed-portfolio Greeks with correct units/signs, evaluate a hedge and disclose missing exposure coverage |

The complete path can follow numerical order. Shorter paths preserve prerequisites:

- **Core evidence:** A → B → C → F → G. Its capstone uses quotes, premium, volume and dated OI without requiring every advanced model.
- **Advanced exposure:** after A–C, D → E, then an advanced F/G capstone with volatility and GEX assumptions.
- **Portfolio branch:** A–D supplies the contract, position and Greek prerequisites for H. Portfolio concepts do not require brokerage integration or a claim that the app's internal rollout is public.

Prerequisites guide learning; they do not introduce new hard access locks. Split overloaded lessons after pilot timing rather than silently dropping concepts or giving everything an arbitrary 12-minute label.

## 4. What happens to the existing eleven lessons

Preserve IDs/URLs when the core objective continues. Display names and order can change. New objectives receive new semantic IDs during authoring; planning numbers never become identity.

| Existing ID | New position | Treatment |
| --- | --- | --- |
| `audited-boundary` | 26 | Rewrite the introduction; require a concrete learner-written question |
| `symbol-universe` | 27 | Retain the table; replace supplied eligibility answers with raw facts and decisions |
| `rank-symbols` | 28 | Keep peer-change animation; add objective-based candidate justification |
| `symbol-drawer` | 14 | Remove navigation framing; assess several field-level requirements |
| `rank-contracts` | 29 | Keep 2D/3D; add equal-total/different-concentration cases and evidence-based selection |
| `validate-option-print` | 9 | Repair units/media; integrate the new side/sentiment foundations |
| `session-flow-vs-structure` | 10 | Keep clock replay; add transaction mechanisms and fixed-series comparisons |
| `dex-dei-gex` | 21 | Refocus on flow exposure/normalization; move reusable GEX material into new lesson 22 with its own ID |
| `cookbook-research-packet` | 31 | Replace sentence selection with concrete structured learner work |
| `market-recap` | 32 | Add actual chart interpretation and learner-produced headline/caption |
| `audit-market-recap` | 33 | Use an unseen packet with subtle defects and valid conclusions |

Retitling/reordering alone is not a content-version change. Substantive explanation/media changes use the existing content-version field; evidence/rubric changes use scenario version. Keep submitted results without silently regrading them. Do not copy old metrics completion into the new GEX lesson or award a new assessment automatically.

When the syllabus expands, display retained completed lessons alongside newly added work. The completion denominator may increase; explain that change rather than implying the learner lost completed work. Module/path context should make the next recommended lesson clear.

Preserve current free/paid assignments and course access semantics. New lessons can use the existing course entitlement during staged rollout. Extending free previews is a separate release-configuration choice. Modules and recommended paths do not require a new billing/enrollment system.

## 5. Standard lesson package and assessment

Every lesson needs an English/Chinese objective and prerequisites; definitions with units; a worked example; a guided interaction; a plausible misconception or contrasting case; an unfamiliar independent task; and criterion-level feedback/reference solution. Optional short video segments must agree with the text, numbers and version. Accessible written explanations must stand on their own.

Use **explain → worked example → supported attempt → contrasting case → independent work → debrief**. Include later retrieval practice. The [IES practice guide](https://ies.ed.gov/ncee/wwc/practiceguide/1) supports alternating worked examples with problems, concrete/abstract connections, spacing and explanatory questions. This informs the design, not an effectiveness claim for this course.

Assessment requirements:

- Materially change the independent reasoning problem, not only a symbol's name. Maintain a separate evaluation bank that is never a guided example.
- Use plausible distractors and balanced positions. Run first-position, other fixed-position and wording-shortcut probes. No authored independent case should award complete demonstration through a fixed-position strategy; this is a screening rule, not proof of learning.
- Require calculation, construction, evidence references or explanation when selection cannot demonstrate the promised skill. Opening a card does not establish understanding.
- Check units, source/clock matching, missingness and unsupported attribution as critical criteria. Include valid cases where proceeding is correct; universal caution should not pass.
- Use deterministic reviewed grading for numerical responses and bounded structured decisions. Do not award prose mastery through keyword checks or unvalidated AI grading. Store prose as learner work and assess it with an appropriate rubric/reviewer, or label it explicitly unverified/self-reviewed.
- Keep practiced, independently checked and reviewer-assessed results honest and distinct from video/manual course completion. Two repeating practice variants are not an unlimited unseen bank.

## 6. First pilot: one execution, two participants

Develop lessons 5–8 as one integrated foundation experiment, supplying contract/price prerequisites from 1–3 alongside it.

Use a synthetic bid of $2.00 × 40 contracts and ask of $2.10 × 30. Introduce a resting seller, then a buyer able to pay the ask, and show one 10-contract execution. Name both participants: the buyer buys at ask and the resting seller sells at ask. Count one trade, not two opposing flow events. Repeat at bid with roles reversed. Compare a marketable limit order and market order reaching the same price; a print alone does not reveal the instruction.

Next hide order messages, stale the quote, introduce an inside-spread execution, and change call to put. Ask which facts remain known, when side becomes indeterminate, and how the declared sentiment classification changes. Keep the option-leg label separate from the whole strategy. The [coverage addendum](/Users/evansmacbookpro/Desktop/Projects/tradely/docs/reviews/platform-agnostic-concept-coverage-2026-09-08.md) provides the four-way mapping, counterexamples and primary sources.

The unfamiliar test must establish that the learner can distinguish quote/order/trade events and quote size from execution size; name both counterparties and the aggressor; explain buying and selling at the same ask; handle all five side codes and inside-spread conventions; identify unknowable order instructions; explain bullish/bearish/neutral classifications; and reject unsupported conviction, opening-intent, identity and portfolio claims while retaining supported inferences.

The animation changes displayed quote size solely under explicit toy assumptions about cancellations, replenishment and other orders. Do not teach that every real size change reveals an execution. This is an educational simulation requiring no live orders or brokerage transactions.

## 7. Motion and Three.js

| Teaching purpose | Default presentation | 3D decision |
| --- | --- | --- |
| Orders, quotes, counterparties and prints | 2D timeline/price ladder with matched quantities | Not planned |
| Premium, payoff, DEX/DEI calculations | Linked inputs, arithmetic, units and before/after values | Not planned |
| Volume versus OI | Transaction ledger and separately dated report on a shared timeline | Keep 2D replay |
| Relative rank | Stable numbers and animated row movement | Not planned |
| Contract neighborhood | Strike/expiry table, slices and concentration measures | Retain optional Three.js |
| Signed GEX | Signed bars/table, net/gross totals and expiry slices | Retain optional Three.js |
| Volatility surface | Begin with smile and term-structure slices | Candidate after 2D works; distinguish measured, fitted and unsupported regions |
| Research writing/audit and portfolio arithmetic | Forms, evidence references, charts and calculations | Not planned |

Every numerical animation identifies what changed and why. All representations share domain state and timing. A display filter does not redefine the assessment universe; a moving tape does not refresh an old report; missing data stays missing.

Default to the fastest available rate, currently 2×. Preserve pause, replay, scrubbing/checkpoints, once-only visible autoplay where appropriate, hidden/offscreen pause and reduced-motion stepping. Playback rate and reading time are separate concerns. Load Three.js only when opened, stop idle rendering and release resources on teardown. WebGL failure preserves the same evidence and selection in 2D.

Evaluate equivalent unfamiliar tasks in 2D and 3D with matched prior knowledge and counterbalanced order or separate groups. Compare accuracy, critical misconceptions, time and device failures; preference is secondary. Inconclusive results keep 2D as default and do not delay teaching the concept.

## 8. Runtime, content, navigation and storage work

Reuse React/TanStack, current scenario modules, server-owned transitions/assessment and account access. Add only interaction types required by real lessons: numerical responses and selected reasons/evidence first, then structured research work for the capstone.

| Responsibility | Existing owner | Planned work |
| --- | --- | --- |
| Catalog/modules | [Course metadata](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/content/course.ts) | Group modules/prerequisites, add semantic lesson IDs, preserve URLs |
| Explanations/cases | [Lesson content](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/content/lesson-content.server.ts), [scenario registry](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/content/scenarios/index.server.ts) | Complete bilingual packages, sources and separate practice/evaluation cases |
| Actions/grading | [Domain types](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/domain/learning/types.ts), [engine](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/domain/learning/engine.ts) | Extend choice-based state with bounded numerical/structured work and valid old-state handling |
| Interaction/UI | [Learning screen](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/features/learning/learning-screen.tsx) | Quote/execution teaching view and actual artifact editing; decorative links do not substitute for evidence selection |
| Persistence | [Existing schema](/Users/evansmacbookpro/Desktop/Projects/tradely/packages/db/src/schema/index.ts), [learning service](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/server/learning.server.ts) | Reuse JSONB, server validation, ownership, revision conflicts and retry idempotency |
| Navigation | [Lesson route](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/routes/learn.$lessonSlug.tsx) and curriculum components | Module grouping, recommended next steps, visible Home/Curriculum, preserved place and mobile navigation |
| Media | [Media manifest](/Users/evansmacbookpro/Desktop/Projects/tradely/scripts/media-manifest.json) and delivery | Review text/script/captions/render together; preserve private paid-media boundaries |
| Verification | Learning tests and `learning:preview` harness | New interaction types, shortcuts, bilingual/accessibility states and real persistence |

The schema already has `lesson_progress.content_version`, `lesson_attempt.scenario_version`, and JSONB `state`/`assessment`. New sections and fields do not need individual database columns. Extend application validation without accepting arbitrary client grades.

Do not add curriculum publication/enrollment tables, a version-selection UI, or automatic user-migration service. Keep historical completion and submitted results. Use the existing explicit updated-case/restart behavior for retired scenarios. Older JSON must remain readable or safely retired, never overwritten to satisfy a renderer.

For capstone continuity, store the actual structured packet and source references in existing attempt JSON. A following lesson may copy an identified snapshot of that learner artifact, with a supplied fallback and provenance. It gets its own result. Add length/shape limits; learner prose, answers and evidence stay out of analytics/errors. No AI grading service is introduced by this plan.

## 9. Delivery phases and exit criteria

| Phase | Deliverables | Required evidence before promotion |
| --- | --- | --- |
| 0 — Content contract and corrections | Term-level coverage register; resolve disputed definitions; repair existing media/reference defects; draft reference capstone and rubric | Every app term mapped or explicitly classified; all C01–C30 have destinations; no unresolved critical definition in the first batch; corrected text/caption/render agree |
| 1 — Execution foundations | Lessons 1–8; develop 5–8 as the integrated order-to-print pilot with prerequisites supplied | Unfamiliar side/sentiment task works in both languages; numbers/roles stay distinct; keyboard/mobile/reduced-motion and first real account save/resume verified |
| 2 — Print, flow and positions | Lessons 9–14; rebuild old print/clock/drawer cases and introduce needed numerical/structured answers | Independent print/OI/aggregation cases require evidence and arithmetic; valid and indeterminate cases both present; no fixed-position demonstration |
| 3 — Quantities before models | Lessons 15–21 with formulas, units and assumptions | Reviewer independently reproduces calculations; unseen work separates magnitude, signed exposure and normalized values |
| 4 — Advanced structure | Lessons 22–25; revised GEX; optional IV surface after 2D slices | Sign/net/gross/missingness and model boundaries agree; levels are not guaranteed predictions; 2D remains complete |
| 5 — Comparison and research | Lessons 26–33; reuse strong universe/rank/neighborhood components; real packet/recap/audit outputs | Another reviewer reproduces the packet; unseen audit finds critical defects and retains valid conclusions |
| 6 — Portfolio branch | Lessons 34–36 with neutral account fixtures | Correct P&L/return/cash-flow/Greek calculations with valuation and coverage assumptions; no brokerage required |
| 7 — Coverage validation and release | Complete register, bilingual/media review, full account journey, learner evaluation and deployment checks | Every in-scope concept has teaching, worked example, independent task and review evidence; claims match the verified environment/results |

Phase 5's core evidence version can follow phase 2; its advanced version follows 3–4. Phase 6 depends on positions and Greeks, not successful 3D. All phases remain required for full concept coverage. Later content can be authored locally while a release check waits, but cannot be called deployed because a fixture works.

**First implementation batch:** resolve the precise quote/side/sentiment definitions through source review; author worked, contrasting and independent cases for lessons 5–8; build one integrated 2D order-to-print pilot in the current runtime with essential contract/premium prerequisites. Finish lessons 1–8 before presenting the foundation module as a complete learning path.

Assign content/domain, bilingual and engineering review responsibilities explicitly. One person may cover multiple roles, but checks remain distinct. Measure first-batch authoring, review, implementation and learner task time before estimating a date for all 36 lessons. Do not multiply the old uniform 12-minute labels into a delivery or course-duration promise.

## 10. Verification, release and stopping rules

### Content

- Complete a register of concept ID, aliases/app labels, source, universal definition, named model/vendor convention, units, prerequisites, lesson, example, assessment and status. Reconcile all current research abilities, glossary/metric catalogs and in-scope portfolio terms. Track future/prototype concepts separately.
- Have a domain reviewer solve each case from visible evidence and independently check calculations, units and accepted alternatives.
- Verify English/Chinese meaning, especially standing structure, neutral/unknown, aggressiveness versus conviction and result-label strength.
- Run answer-position, repeated-question and wording-shortcut audits. An answer-key test is not pedagogical validation.
- Begin with a small usability group, then use unfamiliar immediate and delayed transfer cases. A 3–7-day revisit informs a pilot, not long-term retention. Set meaningful improvement and sample size from baseline variability before claiming efficacy.

### Application and records

- Verify the actual account journey: access/sign-in, start, every new action, refresh/resume, artifact handoff, submission, retry, sign-out, account change and concurrent-tab conflict.
- Confirm paid cases and unrevealed evidence/keys remain server-protected. Anonymous/fixture practice must accurately disclose reset behavior and never claim account persistence.
- Check old versions, updated-case restart, retained historical completion, new-lesson empty state and failed-save recovery. Do not convert video completion into demonstrated understanding.
- Before remote writes, identify the intended non-production database and entitled test account. Apply only required existing migrations through the existing workflow and verify actual rows. The earlier environment/account gap is a release prerequisite, not a reason to build another database system.
- Exercise Home → Curriculum → lesson → Curriculum/Home, module context, previous/next, keyboard focus, touch, narrow layout, reduced motion and WebGL fallback. Ensure 3D is lazy-loaded and idle rendering stops.
- Verify consent handling and bounded analytics without learner text, answers, packets or evidence payloads.

Use Node 24. Run affected learning/content tests first, then type checking and build for runtime changes; database tests when persistence changes, plus credential/media-boundary checks before release. Extend the preview harness across every new lesson/variant/stage in both languages. Fixture rendering, isolated database tests, real signed-in persistence and deployed behavior remain separate evidence levels.

The course update is complete only when the register accounts for every in-scope term, every planned outcome has teaching and independent-assessment evidence, preserved-record/account journeys work, and the approved release is verified. A plan, test suite, glossary entry, animation or lesson count alone is insufficient.

Stop visual expansion when learners cannot explain the numbers in 2D. Stop assessment promotion when evidence-blind shortcuts pass. Fix an unreproducible packet before scoring learners on it. Keep 3D optional when its advantage is unproven. Release reviewed modules progressively and keep unfinished scope visible.

## Planning deliverable verification

This plan maps all 30 identified concept families to proposed lessons, assigns all 11 existing IDs a treatment, preserves the database/version boundary, specifies motion/navigation requirements, and defines the first batch and full-scope release gates. These are planned lessons and checks; this planning change does not implement them.
