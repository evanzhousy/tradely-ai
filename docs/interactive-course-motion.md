# 2D lesson motion

Implemented locally on September 8, 2026, using Motion for React 13.2.0.

**Design statement:** the lesson motion boundary owns short presentation transitions; scenario definitions, server assessment, and the existing replay controller retain ownership of observations, grading, and playback.

| Before | After | Teaching purpose |
| --- | --- | --- |
| Universe rows jump to their new rank | Stable symbol keys and position-only layout transitions move rows over 240 ms; a separate focal-value readout stays visible | Show that relative rank can change without growth in the focal observation |
| Inspected evidence appears abruptly | A short reveal emphasizes newly inspected facts in guided stages, including their dates and coverage | Help the learner follow which source was added; independent facts receive no extra value-highlighting cue |
| Bid–ask location is a fixed graphic | An explicitly hypothetical bid/midpoint/ask marker moves alongside a fixed case-execution reference | Explore quote location without changing the execution or repairing missing quote timing |
| Premium and DEI are single-line calculations | Exact terms can be traced in order, with changed terms and results briefly highlighted | Follow price × count × multiplier, or absolute DEX ÷ effective denominator × 100 |
| Packet inputs and draft answers are separated | SVG links appear from inspected packet sources to the learner's selected draft answers | Make source-to-claim tracing visible without endorsing ungraded answers |
| Stage and debrief changes replace content abruptly | Short entry transitions introduce the new heading, evidence, and feedback | Preserve the learner's place without retaining stale questions or answer controls |

## Motion and data rules

- Standard transition: a 240 ms tween with easing [0.23, 1, 0.32, 1]. No spring overshoot is used for data displays.
- Calculation tracing staggers four exact terms by 65 ms. All controls remain usable during presentation.
- Numerical observations, totals, signs, missing values, and grading do not tween. The only interpolated price is explicitly hypothetical; its marker and text derive from one Motion value.
- The existing session-volume replay remains the source of playback timing, pause, seek, visibility handling, and stepped reduced-motion behavior. No second clock was added to it.
- The root policy starts with static content and enables incidental transitions following pointer interaction. Keyboard navigation and reduced-motion preferences select an instant transition. The separate instructional replay keeps its existing accessible controls.
- Layout measurement stays enabled for ranked rows; transition options determine whether they move or snap. Disabling layout measurement dynamically loses the prior row geometry.
- The lesson uses a manual live preference policy: its media-query listener and input mode control every transition, layout duration, and imperative quote animation. MotionConfig keeps its internal reducedMotion flag at **never** because that flag is a mount-time snapshot; using it for changing preferences can suppress later movement after the user re-enables motion. The live policy selects an instant transition whenever reduced motion is requested.
- HTML content is available immediately; the layout feature bundle loads asynchronously as a complete renderer so initially visible rows attach their layout measurements correctly. A failed import falls back to the basic renderer with animation disabled. The quote example has a plain SVG/text path while motion is unavailable or disabled.
- Entry transitions never keep old interactive content mounted during an exit. No answer, evidence text, or per-frame activity is added to analytics.
- Research links are explicitly draft links until server feedback exists. Rendering a line is not evidence that a claim is correct.

## Review

Run **pnpm --filter web learning:preview**. The loopback review harness supports a bounded zero-based stage parameter:

- [Rank movement](http://127.0.0.1:8261/?lesson=rank-symbols&stage=1)
- [Bid–ask and premium](http://127.0.0.1:8261/?lesson=validate-option-print)
- [Normalization](http://127.0.0.1:8261/?lesson=dex-dei-gex&stage=1)
- [Packet connections](http://127.0.0.1:8261/?lesson=market-recap&stage=1)

The review harness prefills earlier answers when jumping stages and makes no account writes. The application still uses its existing authorized server endpoints.

Functional tests cover preference changes, keyboard policy, exact values, row ordering, hypothetical quote boundaries, calculation replay, and draft-link meaning. Browser verification must also inspect actual intermediate transforms: passing a row-order test alone does not prove an animation runs. Compare desktop and 390 px Chinese/dark views, rapidly reverse a transition, check the reduced-motion path, and verify the final values after each change.

Animation functionality does not establish improved learner outcomes. Held-out learning-effectiveness evaluation remains separate from implementation verification.


## Verification recorded on September 8

Workspace type checks, the production build, 228 web tests, scoped Biome checks, credential scanning, and the media-boundary check passed. Browser review covered 140 lesson/variant/stage views with inspected evidence across English desktop and 390 px Chinese/dark layouts, with no overflow or error overlays.

A frame capture confirmed ALFA moving between its old and new row positions over approximately 240 ms while its focal readout stayed at 1,000. Rapid reversal returned the original order and resting transform. Keyboard and reduced-motion paths snapped to their final positions. The hypothetical quote marker and its label agreed within the displayed three-decimal rounding precision throughout the transition, and the case execution remained fixed. Draft packet links appeared only after source inspection and answer selection, without implying pre-submission correctness.

The preview CSS now explicitly scans the real app components. This corrects missing utility classes when the isolated Vite root would otherwise scan only the preview directory. The larger Motion feature bundle was emitted as a separate client chunk. No rollout or student learning-effectiveness claim is made by these implementation checks.
