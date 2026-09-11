# Lesson 5: quotes, orders and trades — SVG review

The Learn stage of `quotes-orders-trades` now has three interactive SVG scenes. Learners move the ask to compare spread, midpoint, last and a mark convention; play an order through a supplied outcome; and trace eligible best prices across three fictional venues.

## Learning behavior

- Quote arithmetic uses cents per share and preserves half-cent midpoints. Changing the quote or mark convention never creates an execution.
- Adding a displayed sell order increases ask size. A confirmed cancellation and a supplied confirmed execution both reduce it, but only the execution adds volume, a trade message and a dated last price. Sending an instruction alone changes neither the book nor tape.
- Best bid and best ask may have different source venues. Stale/excluded quotations are removed from the calculation. Empty eligibility yields unknown prices, and tied best prices retain all contributing venue IDs.
- English and Chinese use the existing scene tabs, reset, native form controls and explicit playback. Motion highlights supplied states; it owns no grading or persistence. Keyboard and live reduced-motion preferences retain immediate functional controls.

## Access and assessment

This is the first paid lesson in the revised foundation sequence. Its authored numeric dataset lives in `quote-concept.server.ts`, behind the existing lesson authorization, and enters only the current Learn projection. No client fixture fallback exists. The production client JavaScript contains no `ALFA 2030-06-21 $50 CALL` fixture marker. The local review entry is a separate developer fixture preview, excluded from the application build.

The version 2 scenario, guided midpoint/event answers, independent variants, grading and progress controls remain intact. The old quote-mode execution demonstration is replaced for this lesson only; later lessons retain their existing execution lab.

## Validation

- Relevant learning, domain, content and server regression suites: **28 files, 210 tests passed**. The eight new focused cases also passed after the SVG initialization fix.
- Type checks, production build, changed-file Biome, PostHog credential scan, media-boundary assertion and `git diff --check` passed.
- Desktop component preview: ask moved from $2.10 to $2.30, midpoint became $2.15, and the last-based mark stayed $2.08. Cancellation of 10 left ask size 20 and volume 0; trade of 10 left ask size 20 and volume 10; adding 10 increased ask size to 40 with volume 0.
- Venue comparison: all eligible gave $2.00/$2.10; excluding stale C gave $2.00/$2.12; no eligible quotes gave unknown prices. Inspection and reset worked independently.
- 390px Chinese dark preview: no horizontal overflow or SVG text outside the viewBox in the event/venue scenes. Keyboard ArrowRight changed ask to $2.11 and midpoint to $2.055. Live reduced motion stayed off for pointer input. Continue to practice opened the original guided questions.
- The production-built local route at `http://127.0.0.1:8252/learn/quotes-orders-trades` showed the paid-lesson sign-in/access message for the anonymous browser. It rendered no concept lab or authored fixture. Authenticated paid-account persistence was covered by existing server regression tests, not a live paid-account browser session.
- Browser review caught a crowded bid/ask caption and an undefined initial SVG bar width. Both were repaired. The final recorded desktop interaction sequence reported no browser exceptions or log errors.

## Evidence

GIF captured from the **actual local component preview** at `http://127.0.0.1:8261/?lesson=quotes-orders-trades&lang=en&theme=light`, using the production `LearningScreen` and authored scenario. It is not a deployed or authenticated-account recording.

[Lesson 5 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-5-interactive-evidence.gif)

Capture frames, timestamps and observed values are in the adjacent `lesson-5-evidence-frames/capture.json`. Screenshots are genuine browser captures, assembled into a GIF without reconstructing the UI.

The teaching source references remain [OIC: bid and ask prices](https://www.optionseducation.org/news/understanding-the-bid-and-ask-prices-for-options) and [Investor.gov: types of orders](https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders). The venue example illustrates the eligible-quote principle; it is not a national market feed or fill guarantee.

No deployment or push was performed.
