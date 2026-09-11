# Lesson 9: validate one execution — SVG review

The Learn stage of `validate-option-print` now has three interactive SVG scenes. The review model separates observations, calculations, inferences and unknowns; authored evidence packets stay server-only; the learning engine retains grading and progress ownership.

## Teaching interactions

1. **Inspect the print.** Explicit playback and a native SVG timeline move through contract identity, execution time, price per quoted unit, contract count and stated multiplier. The same fields produce a $102,500 premium for 500 contracts at $2.05 with multiplier 100. Removing multiplier evidence makes the amount unavailable; it never defaults to 100. Quote staleness does not erase execution arithmetic.
2. **Sort the evidence.** Learners classify a statement into observed, calculated, inferred or unknown. The packet can retain a stale quote, supply a matched quote, omit a multiplier, add an opening record, flag a complex leg or supply linked-leg evidence. A new packet clears the previous classification. Opening flags are observed; quote-based aggressor claims remain inferred; complete strategy and belief remain unknown even with linkage. Quote timing and condition flags remain explicit.
3. **Choose the next check.** Four gaps require different follow-ups: quote timing, contract multiplier, opening/closing status and linked-leg evidence. The correct supplied record resolves that selected gap. Looking for a larger print, waiting for a price move or requesting unrelated evidence does not resolve it. Comparisons start from the gap's original packet and preserve unrelated unknowns.

The native controls and SVG highlights share state. Playback pauses on direct input and hidden-page/unmount behavior uses the existing shared clock. All examples are fictional and ungraded; no live record request is made by a teaching interaction. Dollar size is not a conviction score, profit or net market inflow.

## Access and assessment

- `print-review-concept.server.ts` owns authored prices, identity, timestamps, multiplier and follow-up packets. Only the authorized Learn projection supplies them to the client. Missing or mismatched teaching data is rejected.
- The lesson remains version 2. Guided answers stay `premium=63000` and `inference=seller`; independent variants, grading and completion remain unchanged.
- Local controls do not send assessment actions. Continue to practice uses the existing transition. Anonymous public practice still rejects this paid lesson.
- The developer component preview renders the real `LearningScreen` with supplied synthetic fixtures. It has no account, database, billing or analytics connection and is excluded from the production application build.

## Validation

- Broader learning, domain, content and server regressions: **32 files, 250 tests passed**.
- Type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed. The authored contract marker and stale-quote timestamp are absent from production client JavaScript.
- Ten focused tests passed and were rechecked after adding the explicit complex-leg packet. They cover execution units, independence of amount and quote inference, all evidence categories, targeted dependencies, native-input interruption, feedback resets, Chinese controls, data boundaries and the existing assessment.
- Desktop checks confirmed: missing multiplier → unavailable amount; stale quote → unknown aggressor with $102,500 retained; matched quote → inferred buyer; explicit opening record → observed opening status. Targeted follow-ups supplied the matching quote, multiplier, opening record and linked-leg evidence as appropriate.
- At 390px, all three Chinese dark-mode scenes fit without horizontal overflow or SVG text outside the viewBox. Keyboard ArrowRight advanced the SVG inspection timeline; reduced motion stayed off during pointer input. Continue to practice opened the original premium question.
- The complex-leg packet retained $102,500 but withheld aggressor inference despite its matched timestamp. Its condition-review flag was visible. Desktop and mobile verification reported no exceptions or browser log errors.

- The production-built local route at `http://127.0.0.1:8252/learn/validate-option-print` showed the paid-lesson sign-in/access message for the anonymous browser, with no lab or authored contract in the document. Paid-account persistence was covered by server regressions; no live authenticated paid-account session was used.
- The final recorded desktop sequence reported no exceptions or browser log errors.

## Evidence

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=validate-option-print&lang=en&theme=light`. It is not a deployed or authenticated paid-account recording.

[Lesson 9 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-9-interactive-evidence.gif)

The reviewed GIF is 24.26 seconds, 784 × 1120 pixels, 194 frames and 492,570 bytes. A contact sheet decoded from the final export was visually checked.

The adjacent `lesson-9-evidence-frames/capture.json` records the URL, frame times, observed values and browser errors. Screenshots are assembled directly into the GIF without recreating the interface.

The lesson retains its existing OIC quote and option-basics sources. Its classification and inference rules remain scoped to the course's stated conventions.

No push or deployment was performed.
