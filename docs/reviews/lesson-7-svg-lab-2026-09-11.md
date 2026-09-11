# Lesson 7: execution side — SVG review

The Learn stage of `execution-side` now has three interactive SVG scenes in place of its earlier generic execution demonstration. The location model owns price comparisons and reference checks; authored examples stay server-only; the existing learning engine continues to own grading and progress.

## Learning behavior

- **Map the print.** A native range over the SVG lets learners drag the execution marker directly. A second labeled range supplies an equivalent control. Region presets and explicit playback visit BBID, BID, MID, ASK and AASK. Integer-cent controls preserve exact quote-boundary comparisons. MID includes the full open spread, not just its arithmetic midpoint. Playback stops on direct input and retains its final state.
- **Check the reference.** The same recorded print is compared with a matched quote and seven unsuitable reference examples: stale, missing, locked, crossed, a flagged complex-order leg, another contract, and a later quote. Each produces a specific reason to withhold classification while preserving the execution's price and size. Quote alignment is supplied evidence; the lesson invents no universal age threshold.
- **Location versus intent.** Learners inspect different claims against the same selected execution. Location is an observed price comparison; at-ask/at-bid initiation remains a possible inference; original order instructions, belief and opening/closing status are not established. Inside- and outside-spread prints alone do not establish initiation in this teaching model.

The five location labels are this lesson's declared convention. Dates, units, reference contract and quote/print timestamps remain visible. The examples are fictional and ungraded. Changing an exploration control neither creates an execution nor advances an attempt.

## Access and assessment

The authored dataset lives in `side-concept.server.ts` and enters only the authorized Learn projection. The new lab accepts the shared discriminated teaching-data union and rejects absent or mismatched data. The production client must contain the reusable presentation and model, but not the authored contract marker.

Version 2 grading remains intact: the guided sequence expects AASK, ASK, MID, BID, BBID, followed by `unknown` for a stale quote. Independent variants, progression and the following lesson's sentiment demonstration remain unchanged. Anonymous public practice still rejects this paid lesson.

## Verification

- Learning/domain/content/server regressions: **30 files, 230 tests passed**.
- Type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed. Neither the authored contract marker nor the stale-quote timestamp appears in production client JavaScript.
- Ten focused cases cover exact boundaries, non-midpoint MID prices, invalid and unsuitable references, claim strength, linked native inputs, interruption, playback completion, reset, Chinese controls, missing data, authorized projection and the existing assessment.
- The final focused recheck passed all ten tests using the broader suite's 60-second test timeout. A preceding run with the default five-second limit timed out in a 6.2-second DOM interaction test while the build ran; assertions were preserved.
- Desktop browser: direct SVG dragging reached $4.30/AASK; playback retained AASK after stopping. All seven unsuitable references withheld the code while retaining `20 @ $4.20`. At-ask initiation showed a qualified inference; original order type and above-ask initiation remained unestablished.
- 390px Chinese dark mode: all three scenes fit without horizontal overflow or SVG text outside the viewBox. Keyboard ArrowRight on the SVG input moved $4.07 to $4.08, still MID. Live reduced-motion preference kept motion off during pointer input. Continue to practice opened the existing classification questions.
- Browser review caught a timeline connector crossing the print's timestamp. It now routes around that label. No exceptions or browser log errors were reported during desktop and mobile interaction checks.

- The production-built local route at `http://127.0.0.1:8252/learn/execution-side` showed the paid-lesson sign-in/access message for the anonymous browser, with no lab or authored contract in the document. Paid-account persistence was covered by server regressions; no live authenticated paid-account session was used.
- The final recorded desktop sequence reported no exceptions or browser log errors.

## Evidence

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=execution-side&lang=en&theme=light`, using the real `LearningScreen` and authored synthetic cases. That separate developer preview connects no account, database, billing or analytics and is excluded from the production application build.

[Lesson 7 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-7-interactive-evidence.gif)

The reviewed GIF is 26.88 seconds, 784 × 980 pixels, 215 frames and 377,115 bytes. A contact sheet decoded from the exported GIF was visually checked.

The adjacent `lesson-7-evidence-frames/capture.json` contains source URL, frame timestamps and observed values. The GIF is assembled directly from browser screenshots, not from a reconstructed interface.

The lesson retains its [OIC bid/ask reference](https://www.optionseducation.org/news/understanding-the-bid-and-ask-prices-for-options). Its location-code names are explicitly scoped to the course convention.

No push or deployment was performed.
