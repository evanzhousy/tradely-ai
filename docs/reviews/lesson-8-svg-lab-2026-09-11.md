# Lesson 8: flow sentiment — SVG review

The Learn stage of `flow-sentiment` now has three interactive SVG scenes, replacing its earlier generic execution demonstration. The sentiment model maps option type and a supported likely aggressor; server-owned fixtures supply execution evidence and position linkage. Exploration remains separate from grading and persistence.

## Teaching behavior

1. **Four combinations.** An animated matrix connects call/put and buying/selling to the isolated leg's directional convention. Controls and explicit playback cover all four combinations. The selected likely aggressor supplies the perspective; the resting counterparty's opposite leg does not create another print or double volume.
2. **When direction is unknown.** Put executions are compared with matched ask/bid evidence, an inside-spread print, stale/missing quotes and a complex-leg condition flag. This reuses Lesson 7's reference validation before applying a flow convention. Unsuitable evidence keeps direction indeterminate and retains the print. A local question distinguishes that uncertainty from an investor expecting a flat market or holding a neutral portfolio.
3. **Leg versus portfolio.** The same completed put purchase is replayed against unknown linkage, stock protection and a supplied buy-to-close record. A native range over the SVG timeline and an equivalent labeled range support direct input; explicit playback traces before/record/after. Protection retains 1,000 shares and adds 10 puts. Closing removes the 10 short puts, leaving zero. Unknown shares remain unknown. The transaction's bearish flow label stays constant across those different contexts.

Dates, prices per share, contract quantity and the supplied multiplier remain explicit. Signed inventory is not an estimated Greek, return forecast or proof of the investor's full portfolio or beliefs. No profit chart or portfolio exposure is fabricated from incomplete holdings.

## Access and assessment

- Authored numeric examples and linked inventories live in `sentiment-concept.server.ts` and enter the authorized Learn projection. The lab rejects missing or mismatched teaching data.
- Version 2 assessment, independent variants, grading and progress remain intact. Guided labels stay bull/bear/bear/bull, with `unknown` for neutral and `no` for the full-portfolio claim.
- Controls send no assessment actions. Continue to practice uses the existing transition. Anonymous practice remains unavailable for this paid lesson.
- The local component preview renders the real `LearningScreen` with authored synthetic fixtures and no account/database/billing/analytics connection; that separate entry is excluded from the production build.

## Verification

- Broader learning/domain/content/server regressions: **31 files, 240 tests passed**.
- Type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed. The authored contract marker and stale-quote timestamp are absent from production client JavaScript.
- Ten focused tests passed, covering all four mappings, reference validation, missing inventory, matrix controls/playback, neutral feedback, context changes, timeline interruption, Chinese controls, data boundaries and the existing assessment.
- Desktop browser checks confirmed put buying → bearish flow and put selling → bullish flow; inside, stale, missing and complex evidence → indeterminate. Wrong neutral claims received explanatory feedback.
- Position replay produced 1,000 shares/10 puts for protection, unknown shares/zero puts for closing, and unknown holdings without linkage, while retaining the bearish flow label.
- Browser review caught a displaced matrix outline caused by animating rectangle x/y as both geometry and transform. Animation now belongs to its SVG group; the outline and selected cell measured identical x/y positions.
- At 390px, all Chinese dark-mode scenes fit without horizontal overflow or SVG text outside the viewBox. Reduced-motion preference kept motion off during pointer input. Keyboard ArrowRight advanced the SVG timeline one step, and Continue to practice opened the original classification questions. No exceptions or browser log errors occurred in these desktop/mobile checks.

- The production-built local route at `http://127.0.0.1:8252/learn/flow-sentiment` showed the paid-lesson access message to the anonymous browser, with no lab or authored contract marker in the document. Paid-account persistence was covered by server regressions; no live authenticated paid-account session was used.
- The final recorded desktop sequence reported no exceptions or browser log errors.

## Evidence

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=flow-sentiment&lang=en&theme=light`. It is not a deployed or authenticated paid-account recording.

[Lesson 8 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-8-interactive-evidence.gif)

The reviewed export is 29.76 seconds, 784 × 1030 pixels, 238 frames and 414,191 bytes. A contact sheet decoded from the final GIF was visually checked.

The adjacent `lesson-8-evidence-frames/capture.json` records URL, frame timestamps, observed results and browser errors. The GIF is assembled from genuine browser screenshots, without reconstructing the interface.

The lesson retains its existing OIC sources. The linked stock-protection example is consistent with [OIC's protective-put explanation](https://www.optionseducation.org/videolibrary/protective-put-strategy-explained). Flow labels remain explicitly scoped to this course's convention.

No push or deployment was performed.
