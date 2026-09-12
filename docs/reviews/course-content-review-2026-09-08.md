# Evidence-Led Options Research: greenfield and adversarial content review

Reviewed September 8, 2026, against worktree HEAD `a17dabb` and the concurrent local learning-UI changes. This is a content review and redesign proposal. No lessons, access rules, database records, or deployments were changed by this review.

**Subsequent scope clarification:** the user requires platform-agnostic teaching of the financial and analytical concepts encountered throughout TradingFlow, including basic quotes, orders, executions, side, and sentiment. This review evaluated the existing 11 classes; it did not establish complete app-concept coverage. The [concept coverage addendum](/Users/evansmacbookpro/Desktop/Projects/tradely/docs/reviews/platform-agnostic-concept-coverage-2026-09-08.md) supersedes the assumed entry-level vocabulary and makes the missing execution foundations the immediate authoring priority. The findings below remain the review of the earlier lesson set.

**Verdict:** the course has a useful evidence discipline and several worthwhile comparison exercises, but it currently teaches recognition of cautious language more reliably than independent research. Keep the numerical core of lessons 5–8. Rebuild the opening around a concrete problem and make lessons 9–11 produce an actual research artifact. More animation will not resolve these gaps.

**Highest-leverage change:** define the final research brief and its scoring rubric first, then make each earlier lesson contribute one decision the learner must make to produce it.

## Evidence and review boundary

The active [course manifest](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/content/course.ts) contains 11 lessons. This review covers all 11 written bodies, their public objectives and practice instructions, English/Chinese exercise content, all 22 scenario variants and answer keys, the assessment engine, all 11 mapped Season 4 narration outlines and caption files, and a fresh 02:30 frame from each local video master. The larger Academy archive is not a second active curriculum; the [conversion plan](/Users/evansmacbookpro/Desktop/Projects/tradely/docs/interactive-course-plan.md:17) explicitly makes that distinction.

The local masters all report 480 seconds through `ffprobe`. Every caption file has eight one-minute cues, with only 147–176 whitespace-delimited words per lesson. Written bodies contain 110–136 whitespace-delimited words, including headings. These counts establish sparse explanatory text, not total spoken-word counts. I did not listen to every minute, measure real learners, inspect the deployed R2 copies, or validate the current external TradingFlow UI. Local media observations must not be presented as deployed-media findings.

Current pending UI work includes calculation traces, animated emphasis, and a source-to-draft visualization. It was inspected where relevant and left untouched. In particular, animated links in [ResearchConnections](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/features/learning/research-connections.tsx) display the current selected answers; they do not add a learner-authored packet, independently selected source references, or a rerunnable output.

The [read-only probe](/Users/evansmacbookpro/Desktop/Projects/tradely/docs/reviews/audit-course-assessments.cjs) and [updated captured results](/Users/evansmacbookpro/Desktop/Projects/tradely/docs/reviews/course-assessment-probe-v2-2026-09-08.json) make the assessment findings reproducible. The probe loads authored fixtures and the actual pure transition/assessment engine. It does not connect to an account or database. Source hashes identify the exact inspected inputs.

## Findings that change the next decision

### P1 — The assessment has a demonstrated answer-position shortcut

The probe always chooses the first displayed answer, opens required evidence without interpreting it, uses no hint, and submits through the normal domain transitions. It scores **36 of 60 independent question instances** and earns **“demonstrated” in 8 of 22 variants**. Seven are default first cases: lessons 1, 2, 3, 4, 7, 8, and 10. The eighth is lesson 9's alternate case. [The UI preserves authored choice order](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/features/learning/learning-screen.tsx:398); [the engine derives the result from those selections](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/domain/learning/engine.ts:126).

This is an assessment-validity problem, not an authorization exploit. The English result already limits its claim to “this case,” which is good. Nevertheless, a result obtained by ignoring the evidence is poor evidence even for that narrow claim.

Seventeen of the 60 independent question objects are exact repeats of an earlier non-independent question within the same scenario, including prompts, choices, accepted answers, and explanations. This deliberately conservative count excludes near-duplicates. In lesson 9 case A, lesson 10 case A, and lesson 11 case A, the entire independent question set is repeated from the guided stage. Different packet names do not establish a new reasoning demand.

**Revision:** use plausible alternatives that require interpreting data, counterbalance answer positions, and assess at least one change that reverses the correct decision. Reserve unseen cases for transfer evaluation. Do not treat shuffling alone as the repair: “guaranteed rally,” “erase history,” and “hide missing rows” remain easy distractors wherever they are placed. A learner should sometimes conclude “proceed” and sometimes “withhold,” based on evidence rather than the tone of the answer.

### P1 — Lesson 6's video contradicts the corrected premium explanation

At 02:30, the local rendered video says **“Premium is price per contract; size is quantity.”** Its table labels premium `220 · price / contract`, size `220 · contracts`, and notional `premium × multiplier`, without a complete calculation. The [caption file](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/private-media/tradingflow/captions/05-option-trades.vtt:10) repeats the ambiguous unit claim. The updated [written explanation](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/content/lesson-content.server.ts:60) and [narration outline](/Users/evansmacbookpro/Desktop/Projects/tradely/videos/tradingflow-academy/season-4/s4e06-validate-one-print-in-option-trades/SCRIPT.md:21) correctly distinguish the quoted price and total execution premium.

For the course's equity-option examples, the quote is per share and the stated multiplier converts it to the per-contract amount; contract count then gives the execution total. That distinction agrees with [OIC's options basics](https://www.optionseducation.org/optionsoverview/options-basics). Keep “stated multiplier,” since not every product or adjusted contract should be taught as an unconditional 100-share contract.

**Revision:** update video, captions, displayed calculation, and text together. Show `$2.05/share × 100 shares/contract × 500 contracts = $102,500`. Distinguish total premium from underlying notional. The [fresh local frame](/Users/evansmacbookpro/Desktop/Projects/tradely/artifacts/course-content-review-2026-09-08/s4e06.png) is the direct evidence; it is an ignored local review artifact, not a public media asset.

### P1 — The final three lessons do not deliver the promised output

The [home copy](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/i18n/messages.ts:26) promises building a packet and writing a recap. In the current [packet scenarios](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/content/scenarios/research-workflow.ts:422), learners choose sentences about fixed inputs, chart A/B, a headline, and a proposed revision. Charts A and B are text descriptions in the supplied record. There is no learner-built evidence table, inspectable transformation, authored chart, source-level claim mapping, or independent audit artifact.

Multiple-choice recognition is useful preparation, but it does not demonstrate the promised production skill. A visual line from a supplied packet to a selected sentence also cannot establish that skill. This is the largest gap between the product promise and instructional output.

**Revision:** supply actual small datasets and charts; let the learner assemble a brief with named inputs, calculations, claims, and limitations. Carry it into the recap and audit, with a complete supplied fallback for learners entering later. A document or simple structured form is enough for the first content pilot; this does not require new database architecture, AI grading, or a publishing platform.

### P2 — The starting point assumes a prior course and too much process vocabulary

Lesson 1's [script](/Users/evansmacbookpro/Desktop/Projects/tradely/videos/tradingflow-academy/season-4/s4e01-start-a-new-question-with-the-audited-boundary/SCRIPT.md:9) and [captions](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/public/media/tradingflow/captions/00-audited-boundary.vtt:4) tell learners to start from the Season 3 audit. This curriculum provides neither that audit nor a worked substitute. The same opening assigns reviewer, maintainer, replay operator, and escalation roles before showing why one individual learner needs the method. The final video points to S4E12, which is absent from the active 11-lesson manifest.

**Revision:** open with one misleading interpretation that the learner can fix in a few minutes. Introduce provenance and versioned research records when a change creates a concrete need. Explain that one individual may own the whole brief. Remove the inherited Season 3 entry dependency and replace the unavailable S4E12 handoff with the actual course completion task.

### P2 — Some teaching rules are too absolute or underspecified

- Lesson 1 says “What will rally next?” cannot be tested. It is underspecified as written; a forecast with a universe, horizon, outcome, and evaluation rule can be tested. The relevant boundary is that these observations do not validate such a forecast. The nearby phrase “call pressure” also needs an operational definition; call volume alone is a cleaner name for the supplied exercise. [Written lesson, line 6](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/content/lesson-content.server.ts:6).
- Lesson 5's video says comparisons require the same expiry, while its spatial lab intentionally compares multiple expiries. The rule should require a declared expiry comparison and appropriate interpretation, not forbid the relationship the lesson teaches. [Narration, scene 6](/Users/evansmacbookpro/Desktop/Projects/tradely/videos/tradingflow-academy/season-4/s4e05-rank-contracts-without-redefining-the-universe/SCRIPT.md:39).
- Lesson 8 repeatedly says the denominator must be “the same.” Distinguish the same denominator **definition, units, and estimation window** from the same numeric value. Comparing properly normalized values across instruments does not require their underlying volumes to be identical. The local TradingFlow [metric definition](/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/src/lib/metrics/registry.ts:184) itself describes instrument-specific effective-volume denominators and index proxies. This is a local source check, not proof of every deployed surface.
- Freshness must be relative to a stated task. A prior cleared OI report can be valid context while yesterday's flow is invalid for today's volume comparison. Lesson 4's alternate case correctly teaches this nuance; use it consistently elsewhere.

### P2 — The course's own chart example does not meet its stated chart standard

Lesson 10's 02:30 [rendered frame](/Users/evansmacbookpro/Desktop/Projects/tradely/artifacts/course-content-review-2026-09-08/s4e10.png) has decorative bars grouped under DEX, DEI, and GEX, without a numerical axis, actual denominator, or inspectable data source. It displays a reminder that those labels should remain visible rather than demonstrating them. It is labeled illustrative, so this is not a claim that fabricated market data was presented as observed data. It is a weak positive example: learners are asked to emulate a standard the example does not actually show.

**Revision:** use a fully specified chart with one quantity and one unit, or visibly separate panels for unlike metrics. Also show a plausible flawed chart and make the learner locate its defect.

### P2 — Language support and instructional depth are uneven

The exercises contain English and Chinese, but the written lesson remains English and the [page explicitly discloses this](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/routes/learn.$lessonSlug.tsx:256). This is partial localization, not hidden full-language support. A Chinese learner has fewer explanatory resources than English learners. The translation of “standing structure” as “长期结构” can imply long-term duration, while the source concept concerns reported outstanding structure. “已在本案例中独立掌握” also sounds stronger than the narrow English result label. [Course translation](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/i18n/course.ts:70), [result copy](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/features/learning/copy.ts:36).

The short written bodies function well as summaries, but provide few worked examples. The video caption density and sampled frames reinforce the concern that process rules take more space than worked decisions. All lessons are labeled 12 minutes while video masters are 8 minutes; this could be a reasonable total-study estimate, but it needs learner timing rather than an identical value assigned to every class.

## Individual lesson verdicts

These are content-readiness judgments, not numerical ratings of teaching effectiveness. P1 requires correction before promoting the lesson as validated independent instruction; P2 is a material instructional revision.

| # | Class | Verdict | Most important change |
| --- | --- | --- | --- |
| 1 | Start with an audited boundary | Rebuild the introduction | Have the learner write and test a usable question |
| 2 | Choose the correct symbol universe | Retain; deepen | Derive eligibility from raw source facts |
| 3 | Use Rank Symbols without turning rank into a signal | Retain the lab; shorten repeated rules | Make candidate priority depend on the research objective |
| 4 | Open a symbol drawer with freshness checks | Combine with source inspection | Audit several field-level clocks and identity mismatches |
| 5 | Rank contracts without redefining the universe | Strongest spatial candidate; revise | Assess neighborhood interpretation beyond the tallest valid bar |
| 6 | Validate one print in Option Trades | Strong core; repair media first | Reconcile units and require an evidence-based final note |
| 7 | Separate session flow from standing structure | Retain and deepen | Explain the mechanism connecting trades and reported OI |
| 8 | Compare DEX, DEI, and GEX without collapsing horizons | Retain; add foundations | Define and compute the quantities before comparing pictures |
| 9 | Build a repeatable research packet in Cookbooks | Rebuild as production work | Assemble and rerun a real small packet |
| 10 | Turn a completed packet into a Market Recap | Rebuild as production work | Produce a bounded headline and properly labeled chart |
| 11 | Audit a Market Recap before publishing | Rebuild as an adversarial capstone | Find, justify, and repair defects in someone else's brief |

### 1. Start with an audited boundary

**Keep:** preserving a question while evidence changes; separating observations, inferences, contradictions, and unknowns. These are useful research habits.

**Challenge:** the independent test asks only whether the boundary changed and what a candidate earns. A learner can pass without choosing an actual universe, defining freshness, naming an observable quantity, setting an invalidation condition, or classifying the four evidence states. Case A largely repeats the guided September 3 calls → September 4 puts example. “Which stock must rally?” is too obviously wrong to expose a realistic misconception. [Scenario source](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/content/scenarios/research-workflow.ts:73).

**Greenfield task:** show a claim such as “ALFA has unusual call activity,” then require the learner to specify unusual relative to what, over which session, and under which coverage rule. Supply a finished example after the first attempt. Later change only one variable and ask whether it is new evidence, a permitted rerun, or a new question. A defensible student-generated sentence is the output.

**Acceptance:** another reader can identify the target, period, source, comparison rule, and condition that would make the conclusion unsupported. No inherited Season 3 material is required. Use a small form and text, not 3D.

### 2. Choose the correct symbol universe

**Keep:** the interactive admission table; missing values remain distinct from zero; outside-scope rows do not win merely because their volume is larger.

**Challenge:** `fresh` and `eligible` are supplied booleans, so the learner reads the answer in a quality label rather than applying a freshness or liquidity rule. In case A, only the names of the principal candidates change. The assessment selects a leader but never requires declaring an eligible set or describing how exclusions limit the result. “Denominator” also blurs the admitted peer set with a normalization quantity. [Dataset and questions](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/content/scenarios/research-workflow.ts:27).

**Greenfield task:** provide raw timestamps, instrument categories, coverage, a liquidity measure, and a stated threshold. Require admission/exclusion with a reason for each row. Introduce a missing high-volume member and distinguish “largest among observed eligible rows” from “largest in the complete intended universe.”

**Acceptance:** the learner constructs the eligible set, explains each exclusion, and preserves the coverage caveat after a row is restored. A sortable table is sufficient.

### 3. Use Rank Symbols without turning rank into a signal

**Keep:** the first symbol stays at 1,000 while changing peers move its rank. This is a clear counterexample to equating rank improvement with more own-symbol activity.

**Challenge:** the guided and case-A independent rank question are identical. The second independent criterion is generic missing-data handling, even though the ranking fixture itself has no missing value among its eligible rows. There is no task requiring a candidate justification or counter-evidence, despite the written objective. [Ranking questions](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/content/scenarios/research-workflow.ts:212).

**Greenfield task:** compare three candidates whose raw volume, baseline-normalized activity, and coverage disagree. Declare the question before selecting the appropriate priority. Then introduce new coverage or a peer change and ask what should change in the handoff.

**Acceptance:** the learner explains why a chosen row deserves inspection under this particular objective, and names a fact that would demote it. Combine overlapping material from lesson 2 while retaining this distinct relative-rank experiment. Use animated reordering with persistent numbers; 3D adds little here.

### 4. Open a symbol drawer with freshness checks

**Keep:** the alternate case permits September 2 OI beside valid September 3 flow. It correctly resists the simplistic rule that every older date invalidates every observation.

**Challenge:** the actual assessment is mostly a one-field date comparison plus the reused candidate question. The record announces that all required fields are present; identity collisions, missing denominators, partial sessions, and not-applicable fields are not tested. Case A changes the symbol but repeats the entire guided question set. [Drawer scenario](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/content/scenarios/research-workflow.ts:323).

**Greenfield task:** offer a compact drawer with five fields: matching flow, legitimate prior OI, a different symbol's metric, partial coverage, and a missing optional model. Ask which specific conclusions can proceed and which cannot. The wrong response should include both unqualified acceptance and unnecessary rejection of everything.

**Acceptance:** each accepted observation is tied to the right identity, clock, unit, and requirement. Merge this with the broader evidence-inspection stage unless real-tool navigation warrants a separate short guide. Use annotations on a realistic fixture, not 3D.

### 5. Rank contracts without redefining the universe

**Keep:** fixed scope, explicit stale/missing observations, numeric strike/expiry axes, call moneyness with spot, and equal-peak/different-breadth cases. This is the course's strongest reason to offer optional 3D. Five independent criteria cover more than the usual two or three.

**Challenge:** the ranking task still reduces mainly to choosing the largest eligible volume printed in answer choices. Moneyness is classified but does not influence a meaningful research decision. The equal-peak cases also differ in total volume (3,000 versus 8,200); they demonstrate breadth but do not isolate distribution from scale. This is not a mathematical error, but it weakens a claim that geometry alone provides the insight. [Main scenario](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/content/scenarios/contract-neighborhood.ts:297), [paired cases](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/content/scenarios/neighborhood-comparison.ts:5).

**Greenfield task:** add an equal-total pair with different concentration, mixed valid expiry slices, and puts as well as calls. Require a selected candidate plus a neighboring observation that qualifies the choice. For example, both isolated and broad activity can merit investigation, but support different descriptive handoffs.

**Acceptance:** the learner preserves scope, correctly identifies moneyness, distinguishes total activity from concentration, and cites a valid nearby observation. Keep 2D fully equivalent; retain 3D only if an unseen spatial task benefits.

### 6. Validate one print in Option Trades

**Keep:** the 90-second-old quote creates a real evidence conflict; a matched bid-side execution and a midpoint alternative require different readings. Premium arithmetic and opening/closing uncertainty are distinct criteria. These are materially better decisions than a generic warning against prediction.

**Challenge:** fix the video/caption unit conflict first. The written first paragraph also states the bid/ask inference before requiring a contemporaneous, interpretable quote. Make that condition explicit. The current independent cases never present an ask-side result as correct and do not test complex-order context or unreliable trade reporting. The open evidence note largely supplies the uncertainty conclusion. [Print cases](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/content/scenarios/option-print.ts:245).

**Greenfield task:** calculate the premium from a stated quote, size, and multiplier; select the appropriate quote record; then write “execution fact / supported inference / unresolved issue / next check.” Introduce a valid ask-side case and one case where timestamp alignment alone is insufficient to classify the economic strategy. OIC describes normal market buys/sells as typically executing at offer/bid; this supports cautious inference, not identification of the participant's portfolio. [OIC bid/ask explanation](https://www.optionseducation.org/news/understanding-the-bid-and-ask-prices-for-options).

**Acceptance:** the learner gets units right, changes the inference when the evidence changes, and does not infer opening intent. A 2D quote/time comparison and calculation trace are appropriate.

### 7. Separate session flow from standing structure

**Keep:** moving session volume beside fixed report dates makes the conceptual distinction visible. The alternate case correctly rejects subtraction across different expiry scopes.

**Challenge:** the learner sees that OI does not move with volume but never explains why. The independent assessment can be passed in case A by first-option selection. The supplied scope strings use a rolling DTE band; matching the band label across dates does not necessarily identify the same expiry series. A valid cross-date claim should specify whether it concerns a fixed series cohort or a changing bucket. [Comparison data](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/content/scenarios/session-flow.ts:19).

**Greenfield task:** start with a tiny transaction ledger showing open/open, close/close, and open/close trades. Let the learner derive volume and OI change, then remove the opening/closing labels and ask what becomes unknowable. Add a fixed-expiry versus rolling-DTE comparison. OIC explicitly describes these three opening/closing combinations and the role of exercise/assignment in reported OI. [OIC open-interest explanation](https://www.optionseducation.org/news/open-interest-why-it-matters).

**Acceptance:** explain why the same volume can coexist with different OI changes; identify the report interval and cohort; reject unsupported participant attribution. Keep the 2D clock animation, now tied to a mechanism.

### 8. Compare DEX, DEI, and GEX without collapsing horizons

**Keep:** signed DEX remains separate from nonnegative DEI magnitude; a non-positive denominator yields unknown; equal GEX totals hide opposite near-expiry signs; missing cells prevent a complete total. The lab's arithmetic is internally consistent with its stated convention.

**Challenge:** DEX arrives as a finished number, the “effective denominator” has no derivation, and gamma appears as supplied signed cells. A beginner can repeat “half the DEI” without understanding the numerator, denominator, or model sign. The local video uses `1.8×` for DEI while the lab uses percentages, without a conversion bridge. The complete GEX arrays are reused between guided and independent cases except for one missing-cell variant. [Metric cases](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/content/scenarios/metric-lenses.ts:6).

**Greenfield task:** first compute one delta-equivalent exposure from explicitly stated inputs and classification assumptions. Compare two instruments using the same normalization method with different valid denominators. Explain how the supplied gamma contribution's units and assumed position sign differ from observed volume. Then use a new GEX distribution for an unseen slice question. This course need not become a pricing-model course, but it must teach enough to interpret its units.

**Acceptance:** explain what 5% is a percentage of, retain DEX's sign, distinguish known subtotal from complete total, and state what the GEX model assumes. Teach the 2D calculations first. Optional 3D can help with strike/expiry distribution, but currently has no measured learning advantage.

### 9. Build a repeatable research packet in Cookbooks

**Keep:** separating fixed method from replay parameters and preserving the earlier run are valuable. Supplying a fallback packet avoids blocking practice on earlier lesson completion.

**Challenge:** choosing “Universe, contract scope, source lens, method, and invalidation rule” does not build those fields. The current packet says the selected fields become a handoff, but stores selected answer IDs rather than a concrete method another learner can execute. Case A repeats all guided questions, and case B changes only the revision decision. [Packet decisions](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/content/scenarios/research-workflow.ts:470).

**Greenfield task:** provide a small input dataset and a partially completed method card. Have the learner fill actual scope values, attach input rows, choose a transformation, record exclusions, and run it on a second supplied session. The second run should contain a plausible trap, such as a changed column unit or expired contract.

**Acceptance:** another person can reproduce the same result from the learner's packet without asking for missing parameters. Preserve each run's evidence. A document/structured builder is sufficient; no 3D and no new versioning platform are needed.

### 10. Turn a completed packet into a Market Recap

**Keep:** claim-to-source discipline and caveats next to the claim. Separating a session-volume claim from modeled GEX is a legitimate first exercise.

**Challenge:** two multiple-choice answers do not establish writing or chart-selection skill. Chart A/B are prose descriptions, so actual axis or scale interpretation is absent. The prepared bounded headline already contains the number and caveat. Case A repeats both guided questions. The local video exemplar also violates its own chart-labeling standard. [Recap branch](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/content/scenarios/research-workflow.ts:545).

**Greenfield task:** use lesson 9's packet to produce a short headline, a caption, and one chart. Offer two plausible charts of the same quantity: one with an unsuitable aggregation or truncated context, one valid. Require the learner to attach the source, unit, date, scope, and coverage limitation in the actual output.

**Acceptance:** a reader can trace each numerical claim to a specific calculation and read the chart without hidden assumptions. Correctly decline a full-universe superlative when coverage is incomplete. Use 2D charting and a small writing task.

### 11. Audit a Market Recap before publishing

**Keep:** an independent audit is the right final course task. Source lineage, missingness, and bounded signoff naturally combine earlier skills.

**Challenge:** the current example announces its major defect with “Dealers accumulated calls and price will rise.” It then asks essentially the same chart/headline questions as lesson 10 plus a revision check. There is no real transformation to reproduce, subtle numerical error to locate, or choice about whether a limited valid claim survives. The entire case-A independent set repeats the guided set. [Audit branch](/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/src/content/scenarios/research-workflow.ts:575).

**Greenfield task:** supply someone else's polished recap with an unannounced mix of valid and invalid claims. Seed a wrong multiplier, a stale quote, a rolling-cohort OI comparison, a hidden missing cell, and one fully defensible conclusion. Require the learner to cite the source, repair each affected claim, and preserve valid work. Run the audit against an unseen packet, not the one just constructed in a guided demonstration.

**Acceptance:** find every critical defect, explain its effect, produce a defensible repaired brief, and avoid rejecting valid claims merely because uncertainty exists elsewhere. End with that artifact and its open questions, not the unavailable S4E12 video. No 3D is needed.

## Greenfield course shape

**Design statement:** the course owns a progressively constructed research brief and evidence-based assessment; each lesson teaches one necessary decision, while TradingFlow is an optional place to practice the same method on a real interface.

Assumed audience: an individual who knows basic option contract vocabulary but cannot yet evaluate flow-based claims reliably. This is a design assumption from the title and practice path, not validated audience research. Add a short entry check for call/put, strike, expiry, quote units, and volume versus outstanding contracts. Route gaps to a concise primer rather than assuming an earlier Academy season or adding a large prerequisite course.

If starting today, I would organize six learning units while preserving the existing lesson IDs during any later implementation:

| Unit | Existing lessons | Learner output |
| --- | --- | --- |
| Ask a question worth answering | 1 | One observable question and its evidence requirements |
| Build a defensible comparison | 2–3 | An eligible universe and justified candidate priority |
| Inspect the contract and execution | 4–6 | A contract/print note with calculation, inference, uncertainty, and next check |
| Reconcile flow, reports, and models | 7–8 | A source/clock/unit table and a defensible cross-source comparison |
| Produce a research brief | 9–10 | A rerunnable packet, one chart, and a bounded headline |
| Challenge another research brief | 11 | A repaired brief with cited defects and justified signoff |

This combines repeated introductions without deleting the distinct reasoning skills. Teach a concrete worked decision, offer a partially completed problem, then remove the scaffolding on a different case. Short retrieval checks remain useful between units. The [IES practice guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/1) supports alternating worked examples with problem solving, connecting concrete and abstract representations, spacing practice, and asking explanatory questions. Those broad recommendations support this design direction; they do not prove it will improve adult options-research learning.

The first worked brief can stay small: “Within the declared session and observed eligible contracts, where did call volume concentrate, and what can the tape support about one candidate?” Its output includes the scope, exact inputs, a premium calculation, a quote-quality decision, a dated OI comparison, a descriptive chart, and a limitation. A reviewer must be able to reconstruct the calculation and lower an unsupported claim.

For the final unseen task, score six dimensions: question/scope, units/calculation, source/clock matching, inference boundaries, reproducibility, and claim/chart consistency. Critical errors include a wrong multiplier, fabricated missing data, claiming volume equals new positions, or asserting a participant strategy without evidence. **Neither universal caution nor universal confidence should pass.** Include a valid supported inference that the learner must retain.

Three.js remains optional for lesson 5's neighborhood and, potentially, lesson 8's signed distribution. Assess the spatial insight with a case where the largest bar or total is insufficient. Do not add 3D to forms, audit checklists, quote arithmetic, or packet writing. Keep the user's fastest-default playback preference, together with pause/scrub controls; do not substitute animation speed for adequate explanation time.

## Proposed order of work and stopping rules

1. **Before further promotion:** reconcile lesson 6's rendered units and captions; repair the misleading chart exemplar; remove missing-season references; clarify the forecast, expiry, and denominator wording. Check the actual served assets after any later publication.
2. **Next content milestone:** write one complete capstone packet, one valid reference solution, one flawed recap, and a criterion-level rubric. Have a domain reviewer solve it from the supplied evidence. Resolve disagreement about accepted conclusions before adding UI.
3. **Then repair assessment:** replace repeated or telegraphed independent items, counterbalance positions, and use unfamiliar values, plausible alternatives, and evidence changes that alter the answer. Re-run the included shortcut probe. A useful mechanical gate is zero complete independent-case passes from fixed-position guessing across the authored variants; that is a necessary screen, not proof of learning.
4. **Then revise the teaching sequence:** adapt lessons 1–4 to the capstone's concrete needs; add the OI mechanism and the missing metric foundations; make 9–11 produce and review artifacts. Keep English and Chinese explanations and assessment meaning aligned.
5. **Then evaluate with learners:** first use a small target-audience usability group to find confusing instructions and failed tasks. Follow with unseen immediate and 3–7-day delayed cases scored against the predeclared rubric. Set the required improvement and sample size from baseline variability before making effectiveness claims. Record criterion accuracy, critical errors, time, hints, and whether a second person can reproduce the brief.

Stop expanding visual complexity if learners still cannot explain the quantities or produce the brief in 2D. Keep 3D optional if its unseen-task results are inconclusive. If the capstone cannot be solved from its own evidence, revise the content before treating it as an assessment.

## Completion audit for this review

- All 11 active classes have a verdict, retained value, adversarial challenge, concrete replacement task, acceptance condition, and interaction recommendation.
- All 22 scenario variants were read and exercised through the real pure assessment engine. The captured result includes 60 independent question instances and the 17 exact-repeat findings.
- Written content, narration outlines, all mapped captions, and current local video samples were cross-checked; the unit and chart conflicts have direct media evidence.
- Financial concept checks use OIC primary sources; the local product-specific normalization convention was checked against the sibling application's definition. Learning-design support is clearly distinguished from measured results for this course.
- Current application and concurrent UI work were left intact. This deliverable evaluates and proposes; implementing the revisions and validating them with learners remain future work.

Reproduce the assessment probe with:

```sh
npx --yes --package=node@24 -- node /Users/evansmacbookpro/Desktop/Projects/tradely/docs/reviews/audit-course-assessments.cjs
```

Local sampled frames are in `/Users/evansmacbookpro/Desktop/Projects/tradely/artifacts/course-content-review-2026-09-08/`. They are ignored artifacts and are not included in the review commit. They are supporting samples, not a full audiovisual or production-delivery certification.
