# Interactive course implementation plan

Status: proposed implementation plan, following the agreed direction of interactive lessons with selective Three.js scenarios.

Prepared: 2026-09-06. Repository baseline: `5504e8a`. This document describes proposed work; it does not report deployed features or measured learning improvements.

Implementation update: print-validation, contract-neighborhood, and session-flow-versus-structure pilots now have local implementations on `codex/interactive-courses`, including independent case variants, saved attempts, server assessment, and bilingual UI. The contract pilot includes an optional Three.js view with animated columns and counters; the flow pilot uses a 2D volume replay beside dated OI and model snapshots. Both use the same playback clock and default fastest speed. See [the pilot review notes](interactive-course-pilot.md). Migration to an identified test database, signed-in browser verification, deployment, learner evaluation, and the other eight lesson conversions remain pending.

## Outcome and scope

Turn the 11 lessons in Evidence-Led Options Research into guided investigations in which learners make a judgment, inspect evidence, receive specific feedback, and apply the method to an unfamiliar case.

**Design statement:** Tradely's lesson engine owns versioned scenarios, learner attempts, and assessment; React presents the learning flow, while optional Three.js views visualize the same scenario state without owning scoring, access, or progress.

The first release covers the 11 lessons in `apps/web/src/content/course.ts`. The larger Academy media archive is source material for explanations, not a second conversion backlog. New courses about option pricing, Greeks, or volatility surfaces can follow as a separate curriculum initiative.

Tradely remains the independent learning product. Exercises use self-contained educational fixtures; TradingFlow remains the external destination for optional real-tool practice. The current account, payment, media-access, and attribution boundaries continue to apply.

## What each lesson becomes

Use one consistent flow, with short explanations available where learners need them:

1. **Brief:** state the question, relevant context, and learning objective.
2. **First judgment:** record an initial decision and the evidence supporting it.
3. **Investigation:** inspect additional facts or change an allowed input.
4. **Revision:** decide what the new evidence changes and what remains unknown.
5. **Debrief:** explain each assessment criterion, including acceptable alternative answers.
6. **Independent case:** apply the same method to a new fixture without the guided hints.

Keep the first exercise small: one central misconception and a few meaningful decisions. Progressively reveal complexity. Explain a mistake at the point it matters, and use relevant existing video segments or written material as optional help.

Assess reasoning supported by the available evidence. A decision to withhold a conclusion can be correct. Future price movement is not a substitute for evaluating the research process.

## Three reusable exercise types

| Type | Learner actions | Shared capabilities |
| --- | --- | --- |
| Evidence case | Select a claim, inspect facts, classify observations and uncertainty, revise a decision | Evidence reveal, claim classification, reason selection, criterion-level feedback |
| Comparison lab | Filter a universe, select contracts, compare snapshots, move through a fixed replay | Tables, linked 2D charts, timestamp and scope labels, parameter controls |
| Research packet | Build a bounded packet, connect claims to sources, audit another packet | Structured fields, evidence references, claim-to-source mapping, review checklist |

These are composition patterns, not three separately maintained applications. Extract shared behavior after the pilot establishes the repeated interaction. Use ordinary accessible controls for selection and ordering; any drag interaction must have a keyboard and touch alternative.

## Lesson-by-lesson conversion

Lesson numbers below are the learner-facing order. Build order is defined in the delivery phases.

| # | Lesson ID | Experience and assessment | Type | Three.js |
| --- | --- | --- | --- | --- |
| 1 | `audited-boundary` | Construct a question with a universe, source, horizon, and invalidation rule; identify where a revised question changes the original contract | Evidence case | No |
| 2 | `symbol-universe` | Admit or exclude rows using declared freshness and eligibility rules; explain how changing the denominator changes the comparison | Comparison lab | No |
| 3 | `rank-symbols` | Promote a candidate for investigation and identify counter-evidence; distinguish priority from a directional forecast | Evidence case | No |
| 4 | `symbol-drawer` | Audit a drawer's identity, source clocks, missing fields, and coverage; decide what can proceed and what needs another check | Evidence case | No |
| 5 | `rank-contracts` | Select a contract inside a fixed comparison boundary; inspect nearby strikes and expirations, including missing or incomparable values | Comparison lab | Optional pilot: contract neighborhood |
| 6 | `validate-option-print` | Inspect one execution, quote context, and surrounding prints; separate execution facts, supported inference, and unresolved intent | Evidence case | No |
| 7 | `session-flow-vs-structure` | Step through a fixture in which tape and reported snapshots update on different clocks; identify invalid same-time comparisons | Comparison lab | No |
| 8 | `dex-dei-gex` | Compare signed flow, normalized magnitude, and modeled structure; change a declared denominator or scope and explain which claims remain supported | Comparison lab | Start in 2D; any later spatial view needs its own evidence |
| 9 | `cookbook-research-packet` | Assemble question, fixed inputs, replay parameters, exclusions, and sources into a rerunnable educational packet | Research packet | No |
| 10 | `market-recap` | Match claims to charts and evidence; place source, date, scope, and caveats beside the claim they qualify | Research packet | No |
| 11 | `audit-market-recap` | Audit a deliberately flawed recap; locate unsupported claims, stale inputs, and missing lineage, then select a defensible revision | Research packet | No |

The last three lessons form a connected capstone. A learner can carry forward a packet, but each lesson also has a complete supplied fixture so a missing earlier attempt never prevents practice.

## The first Three.js experiment

Build a **contract neighborhood explorer** for lesson 5 only after its 2D version works.

- Represent strike and expiration on the horizontal dimensions; height represents one explicitly named, comparable metric with visible units.
- Use discrete observations. Preserve missing values as missing; do not interpolate a continuous surface that invents evidence between contracts.
- Selecting a contract synchronizes the 3D view, the 2D slice, and the accessible table.
- The question, admitted universe, evidence, selections, and grading remain identical in the 2D and 3D versions.
- Provide a focused initial view and constrained camera controls. All learning actions remain available through HTML controls.
- Load the renderer only when the learner opens 3D. A rendering failure returns to the equivalent 2D exercise with the current attempt intact.
- Start with simple geometry and direct labels. The existing cinematic trading-hall renderer supplies lifecycle references; its scene, lighting, and postprocessing do not become dependencies of the lesson engine.

Keep 3D only if learners use it to understand a spatial relationship more reliably or efficiently. Preference and visual appeal are secondary evidence. An inconclusive pilot leaves 2D as the default and does not delay the remaining curriculum.

Use on-demand rendering for stationary views and explicitly dispose of GPU resources on teardown, as described in the [Three.js rendering guide](https://threejs.org/manual/en/rendering-on-demand.html) and [cleanup guide](https://threejs.org/manual/en/cleanup.html). Canvas functionality needs an equivalent accessible representation under the [HTML standard](https://html.spec.whatwg.org/multipage/canvas.html#the-canvas-element).

## Content and assessment contract

Each scenario is an immutable, reviewed definition with a stable ID and version. It includes:

- Lesson and objective IDs, misconception being addressed, prerequisite knowledge, and expected decisions.
- A synthetic dataset, or a historical dataset whose instructional use has been verified, with provenance, units, scope, timestamps, and modeled assumptions.
- An evidence sequence, allowed interactions, valid transitions, and the facts visible at each stage.
- Structured answer choices, supported alternative responses, criterion-level rubric, and debrief explanations.
- Guided and independent variants, plus a held-back case for evaluation.
- English and Simplified Chinese prompts, controls, feedback, and equivalent assessment meaning.

Synthetic cases must be visibly labeled. Historical cases must exclude future information until the exercise intentionally reveals it. Unknown intent and missing data remain valid states; neither becomes a fabricated fact for the sake of a neat answer.

The pilot uses deterministic, reviewed grading for structured choices and evidence references. Open reflection may be offered as a local learner note with an explicit device-only label, but it is not automatically graded or sent to analytics. Any later persisted journal or AI tutor is a separate feature decision.

Paid scenario definitions remain server-only and are returned in stage-appropriate form after the existing lesson-access decision. Assessment keys and unrevealed evidence stay on the server until their authorized reveal/debrief stage. Rendering code can be public without bundling paid case content.

## Application architecture

| Responsibility | Proposed location or existing owner | Boundary |
| --- | --- | --- |
| Public lesson metadata | Existing `apps/web/src/content/course.ts` | Keep stable lesson IDs, ordering, access tiers, and practice links; add only the public exercise availability metadata needed by the catalog |
| Scenario content | New `apps/web/src/content/scenarios/` with server-only entry point | Own immutable fixtures, evidence sequence, translated copy, and assessment rules |
| Attempt transitions and rubric evaluation | New `apps/web/src/domain/learning/` | Pure typed logic, deterministic results, no rendering or network dependencies; answer-bearing modules must not enter client imports |
| Interactive lesson UI | New `apps/web/src/features/learning/` | Compose the three exercise patterns and expose accessible controls |
| Optional 3D view | New `apps/web/src/features/learning/three/` | Lazy-loaded renderer consuming the same approved view state and emitting the same selection actions as 2D |
| Access and persistence | Existing access resolver plus new `apps/web/src/server/learning.ts` and `learning.server.ts` | Validate identity, access, attempt ownership, scenario version, transition, and submitted answers |
| Lesson page integration | Existing `apps/web/src/routes/learn.$lessonSlug.tsx` | Present the active exercise, explanations, practice result, and existing course navigation |
| Database | Existing `packages/db/src/schema/index.ts` and versioned migrations | Add one attempt entity; derive current practice status from reviewed results |
| Instrumentation | Existing typed analytics registry, provider, and consent boundary | Emit bounded learning events without lesson text or learner notes |

Implement the first complete lesson before generalizing the engine. The second lesson should test whether the shared interfaces are sufficient; the capstone may keep its distinct packet state while reusing attempt and assessment contracts.

### Attempts, resume, and completion

Add one `lesson_attempt` table. An attempt records a server-issued ID, user, lesson, immutable scenario ID/version, status, revision, bounded structured state, criterion results, and creation/update/submission timestamps. The scenario version pins its fixture and rubric. Keep submitted attempts immutable; retrying creates a new attempt.

The server issues and authorizes attempts, validates every transition, and recomputes assessment results. Saves use revision checks, and submission is idempotent so retries or multiple tabs cannot replace a result or award duplicate completion. A stale save returns a conflict with an explicit recovery path.

Signed-in learners can resume a valid attempt across devices. Public preview exercises work without sign-in, using anonymous device-local practice state; it is labeled as local and does not claim account progress. Account changes must clear user-specific in-memory/local drafts. Importing a guest draft must revalidate the scenario and answers rather than accepting a guest-computed result.

Keep existing `lesson_progress` completion and video position records. A completed video or a manually completed lesson remains historical completion; it is not converted into demonstrated understanding. Display current exercise status separately as not started, in progress, practiced, or demonstrated on the independent case.

For the pilot, demonstrated means every required rubric criterion is met on an independent case without hints and no critical misconception remains. Optional enrichment criteria do not block it. A guided or hinted completion is practiced; a fresh independent variant can establish demonstrated status later. The server derives these labels from the versioned rubric and attempt record.

Adding an exercise does not by itself change the video's content version. A scenario change creates a new scenario version; old results stay visible but cannot silently certify the new rubric. Provide an explicit restart path for retired scenario versions. During the pilot, practice is additive and does not introduce new prerequisite locks or revoke earned completion.

## Delivery phases

Calendar estimates should follow the first completed pilot: case-authoring and domain review are currently unmeasured. The sequence below is the delivery commitment; each phase has a reviewable exit condition.

| Phase | Work | Exit condition |
| --- | --- | --- |
| 0 — Specify the pilot | Write objectives and rubrics for lessons 6, 7, and 5, in that build order; prepare guided, independent, and evaluation cases; establish device and learning baselines | A domain reviewer can solve every case, explain accepted alternatives, and trace every fact to its fixture |
| 1 — Ship one complete exercise | Implement lesson 6, Validate one print, with accessible 2D interactions, feedback, attempt saves/resume, access checks, translations, and measurement | The full learner journey works in the preview environment, including failed saves and retries; assessment and access checks pass |
| 2 — Prove reuse | Add lesson 7's clock comparison and lesson 5's contract comparison, both in 2D; refine shared behavior from actual repetition | Three usable pilot lessons share stable attempt and feedback contracts; case logic and renderer state remain separate |
| 3 — Evaluate selective 3D | Add the optional neighborhood explorer; compare it with the equivalent 2D lesson on held-back tasks | Record a keep, revise, or defer decision using learning, usability, and device evidence; 2D remains fully functional |
| 4 — Convert the other eight lessons | Batch A: lessons 1–4. Batch B: lesson 8. Batch C: lessons 9–11 and connected capstone | Each batch passes content review, accessibility, protected-access, resume, and independent-case assessment checks |
| 5 — Make validated exercises primary | Promote lesson by lesson, retain explanations/media, update learner-facing copy and documentation, and inspect production behavior | Every current lesson has a reviewed interactive path; old progress remains legible; production access, persistence, and consented measurement are verified |

Phase 4 depends on the reusable 2D pilot from phase 2, not a successful 3D result. Phase 3 can be deferred if it would hold up useful lessons. Within phase 4, the capstone follows the earlier evidence and comparison exercises.

Engineering owns runtime, persistence, rendering, and verification. A domain/content reviewer owns fixture correctness and rubrics. A bilingual reviewer checks that translated decisions and feedback preserve the same meaning. The same person can cover multiple responsibilities, but each review remains explicit.

## Learning evaluation and release gates

Evaluate interactivity and 3D separately:

1. Compare the existing explanation-based lesson with the 2D interactive version using equivalent unseen cases. Match prior knowledge and record time spent.
2. For the spatial lesson, compare 2D and 3D with the same data, tasks, hints, and scoring. Counterbalance order or use separate groups and alternate fixtures to avoid learning the answer in the first condition.
3. Include a delayed unfamiliar case, ideally 3–7 days later in a consented pilot, to distinguish immediate familiarity from retained understanding.

The main outcome is the fraction of reviewed reasoning criteria met on an unfamiliar case. Also record critical misconception rate, hints needed, task completion, time to a supported answer, and device-specific failures. Record learner preference separately.

Define the minimum meaningful improvement and acceptable usability regression before evaluating results. Choose sample size once baseline variability is available; a small usability group can expose problems but cannot establish an efficacy claim. If learning results are inconclusive, document the uncertainty and continue only with reversible, clearly usable changes rather than claiming a measured improvement.

Use application attempt records as result truth. Proposed analytics events are `lesson_exercise_started`, `lesson_exercise_submitted`, `lesson_hint_opened`, `lesson_renderer_changed`, and `lesson_exercise_save_failed`. Register them in the existing allowlist before emission. Allow only bounded identifiers, versions, renderer/experiment variant, criterion counts, duration buckets, and failure categories. Learner text, raw answers, evidence bodies, and market payloads must not enter analytics or exception logs.

Consent decline must not stop exercises, saving, grading, or account progress. Consented analytics describes its own population; it is not a complete learner denominator. Avoid high-frequency events for timeline dragging or camera movement. Verify deployed event shapes before creating insights that depend on them; the observability document's older live snapshot is not a current baseline.

## Required verification during implementation

- Content validation: unique scenario IDs/versions, valid lesson mappings, reachable endings, valid evidence references, complete translations, and reviewed solutions for independent cases.
- Assessment tests: accepted alternatives, uncertainty, missingness, unrevealed evidence, version changes, and inability to bypass required independent work through client-supplied results.
- Persistence and access tests: anonymous previews, entitled and denied paid access, account isolation, stale revisions, duplicate submissions, retired versions, and recovery from failed saves.
- Renderer checks: identical selection and assessment state across 2D/3D, direct 2D access, keyboard-only completion, touch controls, reduced motion, WebGL failure, repeated mount/teardown, and restored drafts.
- Performance checks: benchmark the same representative desktop and mobile devices before and after; verify that 3D downloads only when opened, resting views stop rendering, and switching lessons does not retain GPU resources. Agree numerical budgets during phase 0 using these devices.
- Repository checks appropriate to code changes: `pnpm check-types`, relevant Vitest suites, `pnpm test:db` when persistence changes, `pnpm check`, and `pnpm build`; protect existing media boundaries with `pnpm media:assert`.
- Browser evidence: complete all three pilot journeys in the preview deployment and then verify the released paths; distinguish source tests, preview behavior, and production evidence in the release note.

## Migration and rollout

Use one typed per-lesson rollout map owned by the lesson loader, with explicit supplemental or primary presentation and a separate opt-in 3D capability. Avoid scattering feature flags through individual controls.

Start with internal/preview access, then a bounded eligible learner cohort. Keep the existing free/paid lesson tiers. Promote a batch only after its content and runtime checks pass. Use additive database migrations; retire no old progress fields in this project.

If a released exercise fails, return its presentation to the existing lesson while preserving attempts. If only 3D fails, select the equivalent 2D view. Operational rollback should not require data deletion or re-uploading the course-media library.

Update `docs/ARCHITECTURE.md` when attempts become a third persisted entity, `docs/OBSERVABILITY.md` when new learning events ship, and course/interface copy when the primary lesson experience changes. Marketing claims must describe demonstrated functionality and any measured outcomes accurately.

## First implementation milestone

Deliver **Validate one print** as a complete 2D interactive lesson: reviewed synthetic case, committed initial judgment, evidence investigation, revision, specific debrief, independent assessment, accessible English/Chinese UI, signed-in resume, public/paid access behavior, and preserved historical progress.

Use this milestone to measure actual engineering and authoring effort before estimating the remaining conversion. The next implementation task should begin with its case specification and rubric, then build only the runtime required to deliver that lesson.

## Current implementation anchors

- [Course manifest](../apps/web/src/content/course.ts)
- [Current lesson page](../apps/web/src/routes/learn.$lessonSlug.tsx)
- [Server-only written content](../apps/web/src/content/lesson-content.server.ts)
- [Existing lesson access/data loader](../apps/web/src/server/lesson.server.ts)
- [Existing progress storage](../apps/web/src/server/progress.server.ts)
- [Database schema](../packages/db/src/schema/index.ts)
- [Analytics event contract](../apps/web/src/analytics/events.ts)
- [Trading hall renderer lifecycle](../apps/web/src/features/trading-hall/renderer.ts)
- [Architecture](ARCHITECTURE.md) and [observability contract](OBSERVABILITY.md)
