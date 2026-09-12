# Lesson 13: option strategies — SVG review

The Learn stage of `option-strategies` now has three interactive SVG scenes. Authored positions stay server-only and enter the authorized Learn projection. The original version 2 assessment and its answers remain unchanged.

## Teaching behavior

- **Connect the legs.** Six supplied structures cover a long call vertical, protective put, covered call, uncovered short call, long straddle and collar. Learners can inspect the complete linked positions or select one position alone. The isolated view withholds the full strategy identity. Signed positions are explicitly supplied; a trade print alone cannot establish those positions or opening/closing status.
- **Explore expiration.** A native SVG price control and an equivalent labeled slider update the exact piecewise expiration curve. The calculation combines signed stock and option values, premiums, contract quantities, multipliers and fees. Profit and terminal value are separate measures. Fit strategy makes small spreads legible; Shared range supports magnitude comparisons across examples. The scale remains fixed during price/fee drags. A finite displayed price window is not a risk limit.
- **Close, then open.** A three-step replay tracks separate contract expiries, old/new inventory and cash from supplied closing/opening fills. Cash changes from $0 to $500 received, then to a $200 net debit. Without the original cost basis, this is not realized profit. Different expiries are not combined into a single expiration payoff basket.

The positions, entry dates and prices are fictional teaching examples. The expiration illustration excludes early exercise/assignment, dividends, financing and taxes. For reference, the OIC descriptions of [covered calls](https://www.optionseducation.org/strategies/all-strategies/covered-call-buy-write) and [uncovered calls](https://www.optionseducation.org/strategies/all-strategies/naked-call-uncovered-call-short-call) support the distinction between covering stock and an uncovered short call's unlimited upside loss exposure.

## Validation

- Five focused/shared regression files passed: **30 tests**, including 4 signed-leg valuation tests and 9 strategy-lab tests. Coverage includes exact strike knots, shared chart bounds at fee extremes, invalid/mixed-expiry inputs, missing/incorrect teaching data, local controls, roll replay interruption and authorized projection.
- Workspace type checks, production build, changed-file Biome, PostHog credential scan, media-boundary assertion and `git diff --check` passed.
- Browser verification rendered all six structures, withheld strategy identity in the isolated view and restored the starting state on reset.
- At a $115 expiry price, the vertical has $1,000 terminal value, $400 net entry cost and $600 profit. Adding $25 fees reduces profit to $575 without changing terminal value. Dragging price to $105 gives $500 terminal value and $75 profit after those fees.
- At a $140 expiry price, with zero fees and shared axes, the covered call shows $1,200 profit while the uncovered short call shows a $2,800 loss. The latter explicitly explains that loss continues beyond the plotted window.
- All three scenes fit a 390px viewport in Chinese dark mode, without horizontal overflow or SVG text outside the viewBox. Reduced motion stayed off under pointer interaction. Keyboard ArrowRight moved the SVG price from $115 to $116. Enter practice opened the original $108 / $3 net premium assessment.
- The production-built local route `http://127.0.0.1:8252/learn/option-strategies` enforced the anonymous paid gate. Its document contained neither the lab nor authored positions. New authored identity markers were absent from client JavaScript, while the new lab title was present. No authenticated paid-account session was used.
- A stale import-resolution error in the long-running component preview was cleared by restarting that owned preview process after the files were complete. The verified page had no browser exceptions or log errors.

## Evidence

[Lesson 13 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-13-interactive-evidence.gif)

This records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=option-strategies&lang=en&theme=light`. The separate review entry renders the real learning UI with synthetic examples, without account/database/billing/analytics connections. It is not a deployed or authenticated paid-account recording.

The final GIF is 26.13 seconds, 784 × 1400 pixels, 209 frames and 528,621 bytes. It shows structure selection, isolated evidence, price/fee changes, payoff versus profit, covered/uncovered comparison and roll play/pause/scrub/reset. All 13 assertions in the recorded sequence passed, with no browser exceptions or log errors.

The adjacent `lesson-13-evidence-frames/capture.json` stores source URL, frame times, observed UI values and browser errors. `lesson-13-mobile-checks.json` records the mobile, keyboard, reduced-motion and practice-transition checks. The GIF is assembled from genuine browser screenshots; its decoded contact sheet was visually reviewed.

This is a checkpoint toward the remaining curriculum. Lessons 14–36 and the final curriculum-wide audit remain required. No push or deployment was performed.
