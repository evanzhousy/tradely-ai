# Lesson 3: premium, value, payoff and profit

Lesson 3 (`premium-payoff`) now uses three bilingual SVG scenes in Learn:

1. **Premium:** convert price per share into premium per contract and total premium. Quantity and option-price sliders update exact amounts. Referenced notional uses the separately stated entry stock price.
2. **Option value:** compare intrinsic and extrinsic portions of supplied American-style equity-option premiums. An expiry comparison holds spot fixed and removes extrinsic value; it is explicitly not a forecast or a pricing model.
3. **Payoff/profit:** drag the hypothetical expiration stock price on a native range over the SVG. Dashed payoff and solid profit curves remain fully visible. A fixed per-share scale separates chart shape and break-even from position quantity; position totals retain negative profit. Controls support Call/Put, paid premium, quantity, an ITM-loss example, and break-even.

The public model computes cash in integer cents. Strike is $100, entry stock price is $100, multiplier is 100, and the examples exclude fees. The expiry chart models long calls and puts. ATM is explicitly exact equality with strike in this lab. Public teaching math does not import assessment cases or accepted answers.

The shared `ChoiceField` was extracted from Lesson 2 into the existing scene controls. Full written notes remain available. Lesson 3's version 2 cases, grading questions, access rules, and persisted progress contracts are unchanged; the new capability is projected only into Learn.

Concept references: [OIC Options Pricing](https://www.optionseducation.org/optionsoverview/options-pricing), [Long Call](https://www.optionseducation.org/strategies/all-strategies/long-call), and [Long Put](https://www.optionseducation.org/strategies/all-strategies/long-put).

## Verification

- Nine new tests cover cent arithmetic, both option types, zero payoff versus negative profit, break-even invariance, supplied quote decomposition, notional, quantity-independent chart curves, Chinese reset, and Learn-only integration. The three lessons' 23 interaction tests passed.
- The full run passed 475 of 477 tests. An isolated rerun passed the PGlite migration check that exceeded 30 seconds under concurrent load. The existing 3D playback test needed a 5-second lazy-renderer query wait instead of the testing library's default 1 second; its original playback and final-value assertions remain intact, and all four tests in that file passed on recheck. All 477 unique tests were therefore covered successfully across runs. Repository-wide timeout configuration was not changed.
- Removed unsupported `exact` options from Lesson 2 role queries, whose string names already match exactly. This corrected a type-checking issue in the previous test code.
- Node 24 type checks, production build, changed-file Biome, credential scan, media-boundary check, and diff checks passed.
- Desktop browser: the initial $400 payoff and −$200 profit were correct; dragging expiration stock to $115 produced $2,400 profit. The payoff curve retained its dashed styling. The chart shows complete curves immediately, so controls never operate against a partially drawn graph.
- At 390 px, all three Chinese/dark scenes had no document overflow, with readable foreground/background colors. Reduced-motion mode kept the controls functional. Keyboard adjustment to $102.25 updated profit to −$150.
- The actual local `/learn/premium-payoff` route opened the lab through the anonymous preview API and advanced to its guided case. A transient local SSR initialization error cleared after restarting the dev server following a concurrent production build; no authentication or server-boundary repair was needed.
- GIF evidence is recorded from `http://127.0.0.1:8261/?lesson=premium-payoff`, using the implemented local component preview. The GIF is delivered as a separate artifact in the task response.

This is local implementation and verification, not a production deployment or a measured learning-outcome result.
