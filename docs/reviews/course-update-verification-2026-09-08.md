# Course update implementation and verification

September 8, 2026. Implements the [consolidated course plan](../interactive-course-plan.md). This is a local implementation record. It does not assert deployment, a completed live-account test, an independent domain review, or measured learner effectiveness.

## Delivered course

The curriculum now contains eight modules and 36 bilingual lessons. Each has a concept explanation, worked example, misconception, guided case and independent case. The two practice variants use different evidence; a third variant is reserved for evaluation and cannot be fetched through the runtime scenario registry. Explanations and rubrics live in server-only lesson packages. The public syllabus contains metadata and module relationships.

The eleven existing lesson IDs, URLs and access classifications are retained. The three existing free previews remain free; new lessons use the existing paid course rule. New content uses version 2. Historical completion remains visible, submitted earlier attempts retain their stored assessment, and earlier active cases require an explicit restart. A cached browser tab cannot keep mutating an earlier case after the current case has changed.

The foundations explicitly cover orders, quotes, cancellations and prints; resting and incoming counterparties; partial fills; all five quote-location labels; and all four call/put sentiment mappings. The lessons distinguish an inferred aggressor from the counterparties to every trade, and an isolated-leg sentiment label from the investor's beliefs or complete portfolio. Unknown direction remains unknown.

Later modules teach units and calculations for premium, payoff, OI, aggregation, Greeks, volatility, DEX/DEI, GEX, structural levels, research comparisons and portfolio analytics. The source app supplies the vocabulary checklist; vendor-specific model conventions are declared rather than presented as universal market facts.

The [concept register](course-concept-register.json) maps **196 source entries to 30 concept families and 36 lesson owners**, with zero unmapped entries in the selected catalogs. It records source paths and hashes for glossary entries, GEX education, model attributes, metric definitions, volatility labels, research catalogs, statistical-model concepts and documented portfolio analytics. This is a teaching-ownership map, not proof that every term has passed an independent educational review.

## Interaction and assessment

| Before | After | Why |
| --- | --- | --- |
| A selection often passed without interpreting new evidence | Numeric work, changed source values and contrasting cases accompany choice questions | Require a calculation or decision grounded in the supplied case |
| Execution terms were assumed | Editable order-to-fill demonstration shows both counterparties, quantity, quote depth and one print | Make buy-at-ask and sell-at-ask understandable together |
| Learning navigation followed an eleven-item list | Eight module groups, module links, prerequisites, Home/Curriculum and previous/next lessons | Let learners find the foundations and return to their place |
| Research output was mostly selected labels | Learners write a packet, recap and audit, retaining worksheet rows and a Markdown export | Preserve reviewable work and its provenance |
| A result could imply written reasoning was graded | Written work is explicitly unreviewed; automatic criteria have their own denominator | Saving prose does not certify its quality |
| GEX and neighboring contracts could be read mainly as static shapes | Optional Three.js shares the declared evidence with the table; replayed contract volumes use one clock | Let motion expose changing quantities without changing grading inputs |

The fastest replay option remains the default, **2×**. Replay pauses when hidden or offscreen; reduced motion avoids autoplay and supports discrete checkpoints. The contract explorer's manual replay changes numeric table cells and 3D heights together. GEX keeps a fixed scale across its two distributions. WebGL failure retains the selected snapshot and its accessible table. The early volume/OI lesson does not expose an unexplained GEX metric.

Numeric and written fields require an explicit save. A dirty draft blocks submission. The server validates response shape, length and numeric syntax; numeric answer keys and tolerance stay out of projected client questions. Text is saved for self or human review and prevents an automatic `demonstrated` result.

The recap can copy the same user's submitted research packet, and the audit can copy their submitted recap. The receiving case matches the source variant. Its JSON snapshot contains the source attempt/version/date, responses and worksheet; it stays fixed for that attempt. Access and ownership are checked on both ends. Retry wording explains when the source is fixed.

## Storage and compatibility

There are still only the existing `app_user`, `lesson_progress` and `lesson_attempt` tables. This implementation adds no schema migration. It reuses `lesson_progress.content_version`, `lesson_attempt.scenario_version` and JSONB state/results. There is no curriculum publication, enrollment or automatic migration subsystem.

The original `0002_learning_attempts.sql` is exercised in isolated PostgreSQL tests. The configured Neon target was inspected read-only and lacks `lesson_attempt`; it still needs that already-existing migration before account persistence can work there. No remote migration or access grant was made. The intended test database and an entitled test account have been requested and remain unidentified for live verification.

Revision checks, command-ID deduplication, simultaneous-start handling, account isolation and immutable submitted results remain in place. Raw learner responses and source work are excluded from analytics and exception details.

## Validation evidence

- **291 tests pass in 52 files**, including migration-backed PGlite persistence, all 33 paid lesson journeys, save/resume, access denial, account isolation, source-work continuity, immutable legacy results and rejection of cached-tab updates to older active cases.
- Workspace TypeScript checks pass. The existing TanStack circular-dependency warning remains non-failing.
- The production build passes with source-map upload disabled for local verification: `POSTHOG_SOURCEMAPS_ENABLED=false VERCEL_ENV=preview pnpm build` under Node 24.
- Scoped Biome checks cover the changed source, tests and audit scripts. The repository-wide lint-staged hook runs `biome check --write .`; the local implementation commit uses `HUSKY=0` after scoped checks to avoid rewriting unrelated generated files.
- PostHog credential scanning and the existing 26-asset media-boundary assertion pass. No lesson responses or private media were moved into public production assets.
- **432 browser views** cover all 36 lessons × two practice variants × three stages × two languages. English used a desktop viewport; Chinese used a 390-pixel mobile viewport and dark theme. Every view loaded without a Vite error overlay or horizontal overflow. An additional 36 desktop/mobile views rechecked the revised transfer cases, GEX and volume/OI displays after the final content edits; all passed. These are rendering checks, not account journeys.
- Focused browser flows exercise numeric save/submit, all four sentiment rows plus unknown/portfolio context (6/6 supported), research-packet writing and Markdown download, curriculum module anchors and return links, actual WebGL rendering, paused replay and forced WebGL loss.
- At a paused contract replay sample, the 3D labels and 2D table both showed the same 133/110/110 nonzero volumes. Time, replay position and render count stayed unchanged while paused. GEX Snapshot B remained selected with the same signed values after forced context loss switched to its table.

The [current assessment probe](course-assessment-probe-v2-2026-09-08.json) covers **72 practice variants and 186 independent question instances**. No variant earns `demonstrated` with any tested fixed answer position plus zero arithmetic/blind prose, or by copying the guided answers into the independent case. The same shortcut gates pass for the 36 reserved evaluation cases in the test suite. The initial copy probe exposed seven practice variants and one reserved variant; these now require different calculations from their guided examples.

The audit still counts **57 repeated canonical question instances** after normalizing choice order. Some definitions and unknown-evidence checks deliberately recur. This is disclosed rather than presented as zero repetition. Passing the shortcut probes does not establish item difficulty, transfer to unseen market evidence, or educational effectiveness.

Browser screenshots and detailed local traces are under ignored `artifacts/course-update/`. Build/test logs are local `/tmp/tradely-course-*.log` files. The historical eleven-lesson audit remains unchanged.

## Corrected video companions

Three optional English, captioned, silent companions were authored and rendered locally: premium calculation, research question, and recap audit. Each is 45 seconds at 1920×1080. The premium example explicitly shows `$2.05/share × 100 shares/contract × 500 contracts = $102,500`. The entry and ending are standalone, with no absent-season dependency. The recap has an actual zero-origin chart, units, source/date/scope and an explicit missing row.

All three pass HyperFrames layout/contrast checks at nine sampled times and render successfully. Final frames were inspected; the premium companion also loaded and sought to 20 seconds in the local browser. [Render verification](../../videos/course-v2-companions/render-verification.json) records file hashes and local-only status. Source generation is reproducible through `scripts/build-course-companions.mjs`; renders, generated HTML and fonts remain ignored.

Earlier videos are withheld from this edition through `mediaCurrent: false`. The corrected companions are available only in the isolated local review page and have **not** been uploaded to their proposed private keys or activated on the real lesson route. The core lessons and exercises are complete in English and Chinese; these optional videos are English only.

Primary references were rechecked during authoring, including [OIC on bid/ask and order execution](https://www.optionseducation.org/news/understanding-the-bid-and-ask-prices-for-options), [OIC on open interest](https://www.optionseducation.org/news/open-interest-why-it-matters), and [OIC on Greeks](https://www.optionseducation.org/advancedconcepts/understanding-options-greeks). The earlier FINRA Greeks link redirected to a general page, so the course now points directly to the relevant OIC reference.

## Remaining release gates

1. Identify the intended test database and entitled account; apply the existing attempt-table migration to that confirmed target, then verify real sign-in, reload/resume, account isolation and source-work continuity through the deployed server path.
2. Have an independent domain reviewer and representative learners evaluate the authored cases and reserved variants. Use their errors and explanations to assess transfer, wording and remaining repetition.
3. Review and publish the corrected companion assets to the identified private media destination, verify signed playback/captions, and activate only the approved lessons' media. Deployment and push remain separate from this local commit.
