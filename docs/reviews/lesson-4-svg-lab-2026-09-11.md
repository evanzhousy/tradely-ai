# Lesson 4: expiration, exercise and settlement

The Learn stage for `expiration-settlement` now contains three bilingual interactive SVG scenes:

1. **Close / exercise:** play or step through a supplied completed closing sale versus valid exercise. Both consume the long option, but only exercise invokes the right and leads to assignment/delivery. Sale proceeds and gross exercise cash remain separate from profit.
2. **Exercise timing:** scrub four supplied schedule stops and compare American/European styles. Trading availability, exercise eligibility, and calendar-day DTE are separate. The last three stops all occur on the expiry date, including the stop after the exercise deadline. The schedule is explicitly fictional and does not prescribe real market hours or broker cutoffs.
3. **Settlement:** compare physical stock delivery with cash-settled index examples. Inspecting the last display never substitutes it for the official reference. Missing official data remains unknown; a negative raw settlement-minus-strike difference remains visible even when call payoff is floored at zero. Put payoff reverses that difference before applying the floor.

The shared scene controls now own the reusable range field, and the learning screen uses a single capability-to-component registry. Labs still render only in Learn, own only local exploration state, and never dispatch assessment answers. Existing version 2 cases, access rules, saved progress, and full notes are unchanged.

Financial concept references were checked against [OIC Exercising Options](https://www.optionseducation.org/optionsoverview/exercising-options) and [OIC Equity vs. Index Options](https://www.optionseducation.org/advancedconcepts/equity-vs-index-options). Product units and assumptions are stated separately: the stock example uses strike $50 and 100 shares/contract; the index example uses strike 4,000 and $100/point. Neither display presents exercise cash or cash payoff as profit.

## Verification

- The learning-scoped regression suite passed: 27 files / 202 tests, covering learning components, domain logic, content, server persistence/journey, and anonymous preview. It ran with one worker and command-line startup allowances (`--testTimeout=60000 --hookTimeout=60000`). This was not a run of unrelated application test suites.
- The four lesson labs' 32 interaction tests passed. Lesson 4 adds nine tests for route differences, timing/DTE, cash/share direction, negative differences, missing references, inspection independence, pause/reset, Chinese controls, and Learn-only integration. Its nine tests passed again after visual alignment adjustments.
- Node 24 type checks and production build passed. Changed-file formatting, credential/media scans, and diff checks were also performed.
- Desktop browser verified a European exercise window with 0DTE and closed trading, a $2,500 payoff unchanged while inspecting the 4,030 last display, and an unknown payoff when the official reference was missing.
- All three Chinese/dark scenes fit a 390 px viewport with no document overflow. Reduced-motion mode retained controls. Keyboard quantity adjustment in the physical call example produced 200 shares received and a $10,000 holder cash outflow.
- The timeline's selected cells use outlines, keeping the selection indicator clear of the labels. The last axis label is aligned inside the SVG boundary.
- The production-built preview (`vite preview`, port 8252) opened `/learn/expiration-settlement`, loaded the anonymous lab through the existing API, and advanced into the guided case. The separate Vite dev server reproduced the recurring cold-start `__vite_ssr_import_3__` initialization error seen in previous lesson reviews. It remains a local dev-runtime limitation; no authentication or loader behavior was changed for this feature.
- GIF evidence records the implemented local component preview at `http://127.0.0.1:8261/?lesson=expiration-settlement` and is delivered separately in the task response.

This is local implementation and verification, not a production deployment or a measured learning-outcome result.
