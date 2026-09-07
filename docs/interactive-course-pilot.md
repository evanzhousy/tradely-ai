# Interactive lesson pilots: implementation and review

These are the print-validation, contract-neighborhood, and session-flow-versus-structure milestones from [the course conversion plan](interactive-course-plan.md). All three are supplemental exercises for existing paid lessons, with English and Simplified Chinese content, server-owned assessment, and saved attempts. The contract lesson includes the optional Three.js experiment. Eight lesson conversions and learner-effectiveness evaluation remain pending.

## Case specification

The central misconception is treating the location of a trade against an unverified quote snapshot as proof of participant intent. All contracts and observations below are explicitly synthetic, with a stated multiplier of 100.

| Stage | Evidence | Expected reasoning |
| --- | --- | --- |
| Initial judgment | 500 ALFA calls at $2.05; displayed quote $2.00 / $2.05; quote timing not yet inspected | Record the execution and $102,500 premium. Opening intent and future direction are not established. |
| Investigation | Quote is 90 seconds earlier; an additional execution has no order linkage; OI is from a prior cleared session | Aggressor side remains unresolved. Repetition does not prove accumulation. Obtain a time-aligned quote. |
| Independent case A | 400 BETA puts at $1.80; matched quote $1.80 / $1.90 | Aggressive selling is a supported inference; premium is $72,000; opening/closing and full strategy remain unknown. |
| Independent case B, used on retry | 250 GAMMA calls at $4.10; matched quote $4.00 / $4.20 | Midpoint location leaves aggressor side unresolved; premium is $102,500; opening/closing and full strategy remain unknown. |

Initial and guided mistakes receive specific feedback and do not prevent progression. Only the independent case determines the practice result. All three independent criteria must be met without a hint for “Demonstrated in this case.” A hint or a missed criterion records “Practice completed.” Neither result promises general trading competence or changes historical course completion.

Both variants share the guided investigation, then change the independent evidence. Repeated retries cycle these two variants; they are practice material, not an unlimited bank of unseen assessment cases.

## Runtime and data boundaries

- The case registry and authored content import the TanStack server-only boundary.
- The browser receives explicit projections of the current stage. Rubrics, future cases, and unopened source details are excluded.
- `openLearning` creates or resumes an authorized attempt. Duplicate starts reuse the active attempt.
- `updateLearning` accepts a bounded action, server-issued attempt ID, expected revision, and command UUID. It resolves the current account and lesson access for every mutation.
- Individual answer choices, inspected evidence, hints, and stage transitions are persisted. Failed saves retain the last confirmed UI state and allow retry with the same command ID.
- Concurrent updates use a conditional SQL update. The losing tab must reload; it cannot silently overwrite the winner.
- Submitted assessments and attempt state remain stored. Retrying creates a new attempt; the existing video timestamp and completed lesson record remain unchanged.
- The UI remounts on account changes and ignores late responses for the prior account. Case content and answers are not stored in browser local storage.

## Verification

Automated coverage uses the real generated PostgreSQL migrations inside an isolated PGlite database. It exercises authorization, cross-account isolation, concurrent starts and decisions, lost-response retries, retirement, submission, immutable results, and legacy progress preservation. It does not connect to the configured Neon database.

UI tests cover save retries, account changes during in-flight requests, access revocation, Chinese labels, and named answer controls. Domain tests cover evidence projection, transition validation, independent hints, alternative quote interpretation, valid rubrics, and bilingual content. Analytics tests verify that answer and evidence payloads are pruned.

Local browser review uses the actual `LearningScreen` and domain engine in an ignored fixture harness. It verifies interaction and rendering, not production identity, Neon writes, or event delivery. Browser evidence is stored under `artifacts/interactive-practice/` as ignored generated images.

Validation on 2026-09-06: 145 web tests and 6 database utility tests passed under Node 24, alongside workspace type checks, the application build, credential scanning, and media-boundary checks. The implementation files passed Biome. Repository-wide `pnpm check` remains blocked by unrelated diagnostics, predominantly the unchanged Draco decoder and static-site files; those files were not modified for this pilot.

Browser review completed the guided investigation and independent case, including keyboard selection and submission. The independent case returned 3/3 criteria and “Demonstrated in this case.” English/light and Chinese/dark views were inspected, with no horizontal overflow at 390px or 1120px. This verifies the fixture UI and calculation path; it is not evidence of learner improvement. The final client build was also checked for private-case sentinel strings.

## Release sequence

1. Review the case wording and bilingual feedback in the local/preview exercise.
2. Apply `0002_learning_attempts.sql` through the existing versioned Drizzle migration workflow in the intended environment, after confirming its database target.
3. Deploy the application to the preview target and exercise the paid lesson with an entitled test account. Confirm save/resume, sign-out, second-tab conflict, and a submitted assessment in that environment.
4. Verify declined analytics consent does not affect learning and consented learning events match the declared registry.
5. Release the supplemental pilot to the intended learner cohort; collect usability and unfamiliar-case evidence before making interactive lessons primary.

The migration is generated in this change. It is not automatically applied by the build. Existing media and completion stay available if the attempt table is unavailable; the practice panel reports the failure explicitly. Removing the lesson from the rollout map disables the pilot without deleting attempts.

## Contract neighborhood and Three.js

The `rank-contracts` exercise uses a fixed, synthetic grid of call contracts. Strike, numeric days to expiry, and reported volume form the three axes. Data from a prior session and contracts outside the declared question stay distinguishable from comparable observations. Missing volume is a ring in 3D and a dash in the map, rather than an invented zero or interpolated surface.

The default application view is 2D. Selecting **3D + map** loads the Three.js renderer. The local fixture preview opens the contract lesson in 3D so the experiment is directly reviewable. Selecting a column or a map cell updates the same selection; scope and expiry filters change visibility without changing the frozen research boundary or the volume scale.

The guided case admits ALFA calls with strikes 95–105 and 14–30 days to expiry. Its largest comparable observation is the 100 call at 14 days with volume 3,200; the larger 60-day observation is outside scope and the 95 call at 14 days is stale. The independent BETA variants use strikes 100–110 and 30–60 days, with different freshness states so a memorized candidate does not answer both cases correctly.

Camera controls support pointer orbit, zoom, and native Turn left / Turn right / Reset view buttons. The camera stays still during data playback. Rendering runs while the replay advances and returns to on-demand rendering when paused or finished. Renderer resources, listeners, observers, and the WebGL context are released on teardown or initialization failure. A lost context pauses playback and falls back to the same 2D data and selection. Dataset IDs are immutable, so ordinary answer saves do not rebuild the graph or reset the camera.

Browser verification confirmed actual WebGL2 rendering, bidirectional column/map selection, a stable render count during an idle interval, a working forced-context-loss fallback, and one canvas after repeated renderer switches. The 390px Chinese/dark view had no horizontal overflow. Model and UI tests cover numeric axis distances, stable scales, fixed scope, stale/missing data, lazy loading, preserved selection, grading, and separate saved attempts for the two lessons. These checks establish functionality, not a learning advantage over 2D.

## Animated session replay — 2026-09-07

Contract scenario version 2 adds an illustrative session from 09:30 to 16:00 ET, lasting 14 seconds at 1× and 7 seconds at the default fastest speed of 2×. Five deterministic checkpoints define different volume build-up profiles. Current-session volume grows monotonically; prior-session data remains fixed and missing observations remain missing. Intermediate values are explicitly synthetic and interpolated. The final snapshot exactly matches the original closing values used by the assessment.

The Three.js columns, floating numeric labels, timeline, and 2D map share a monotonic playback clock. The renderer samples at display refresh rate; React numeric updates are capped at 30fps. Column movement uses mesh transforms, and moving labels and map bars use CSS transforms. Play/pause, scrubbing, five checkpoint buttons, and 0.5× / 1× / 2× speed controls let learners inspect changes. Selecting 16:00 restores the exact assessment snapshot, and the metric questions now name that closing time explicitly.

The replay starts once after the first 3D view is ready and visible. Explicit timeline interaction cancels pending autoplay. Playback pauses when the explorer leaves view or the tab becomes hidden; returning does not skip ahead. Reduced-motion preference suppresses autoplay and uses discrete checkpoint steps for manually requested playback. Live-region announcements are disabled for the moving selected-value readout while playback runs.

The replay is presentation state, not an attempt mutation: it does not save decisions, submit answers, or emit per-frame analytics. Scenario and snapshot IDs advance to version 2; version-1 attempts retain their stored record and use the existing explicit restart path. Video progress and historical course completion remain unchanged.

Validation: 164 web tests, workspace type checks, the application build, and changed-file Biome checks passed. Tests cover monotonic values, exact checkpoints, closing-state identity, clock continuity, pause/resume, rate changes, scrubbing, hidden/offscreen behavior, cleanup, reduced motion, and one-time autoplay. Browser checks confirmed changing values during playback, matching paused 2D/3D values, an idle renderer after pause, and a 390px Chinese/dark layout without horizontal overflow. A fresh reduced-motion load stayed paused at the close; explicit playback advanced to the 10:30 checkpoint without being interrupted by duplicate preference notifications. Credentials and media-boundary checks also passed. Production migration and deployment remain pending.

## Course navigation — 2026-09-07

Lesson pages include direct Home and Curriculum links on desktop and mobile. The isolated fixture preview uses the same navigation component in a sticky header, with links to the running main app at `http://127.0.0.1:8250/` and `/courses/tradingflow-foundations`. The preview remains local fixture data; course access and progress use the main application's existing checks. The main header labels now read Home / Curriculum (首页 / 课程目录), and the mobile menu closes after selecting a destination.

## Next milestone

Finish the signed-in browser journey on an identified test database before expanding the next conversion batch. Before learning-effect evaluation, author a separate held-back case and fix the study criteria; the shipped practice variants are not held-out evaluation evidence.

## Session flow and structure — 2026-09-07

**Design statement:** one replay clock owns playback timing and accessibility, while each lesson's domain sampler determines which observations can change; the assessment remains server-owned.

The new `session-flow-vs-structure` pilot animates September 3 session volume against fixed September 2 OI and GEX snapshots. The guided case grows from 0 to 8,400 traded contracts while reported OI stays at 12,000; the earlier comparable report is 12,200, so ΔOI is -200 across September 1 and 2. The exercise asks learners to inspect report dates, scope, and model assumptions before interpreting changes. The independent case either permits a -400 report-to-report comparison or rejects it because the expiry scopes differ. The latter also preserves a missing model value as missing.

The conceptual distinction follows the Options Industry Council's explanation of [volume and outstanding option contracts](https://www.optionseducation.org/referencelibrary/faq/general-information). All numbers, dates, scope labels, interpolation profiles, and GEX model values in the exercise are authored synthetic fixtures, not market observations or forecasts.

`domain/learning/replay.ts`, `use-learning-replay.ts`, and `ReplayControls` now serve both animated pilots. Available rates remain 0.5×, 1×, and 2×; the default is derived from the fastest option. Hidden/offscreen pause, stepped reduced motion, deterministic scrubbing, and clock continuity use the existing tested transport. OI deltas reject missing values, unlike scopes, and reversed report dates. Neither animation makes attempt writes.

Local review: select **Session flow vs structure · Animated clocks** in the fixture dropdown, or open `http://127.0.0.1:8261/?lesson=session-flow-vs-structure`. The fixture now explicitly says decisions reset on reload instead of claiming they were saved to an account.

### Integrated verification and remaining gate

The added `learning-journey.test.ts` uses the actual access resolver, user records, lesson loader, attempt services, and course-progress services against the generated migrations in isolated PostgreSQL (PGlite). It covers all three pilots, restores saved evidence and answers with a new request at every stage, preserves final assessment results, verifies separate explicit lesson completion, and checks sign-out and another account's denial. Identity, billing lookup, and media are test boundaries; this is not a real Clerk browser session.

A read-only check of the configured database on September 7 found `lesson_progress` present and `lesson_attempt` absent. The local Clerk configuration is a development instance. Real signed-in save/resume verification therefore requires an entitled test account and confirmation of the database target before applying `0002_learning_attempts.sql`. No remote schema or account grant was changed during this implementation.

Verification: all 45 learning tests passed, the application build passed, 32 learning source files passed Biome, and credential/media-boundary checks passed. The client output contained none of the private authored case markers. Browser review completed the new independent case with 3/3 criteria, observed moving volume with unchanged OI, checked the 390px Chinese/dark layout without overflow, and confirmed reduced-motion startup at 16:00 followed by explicit stepped playback. The broader suite recorded 180 passing tests and one failure in the concurrently edited house-interior navigation test; a later workspace type check also encountered an unused import in that unrelated test. Those house files were not changed for this feature.
