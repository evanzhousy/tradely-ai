# S2E02 storyboard

1. **01 · Question** — Keep the question fixed — The replay tests the same question; it does not rewrite it after seeing the result. — visual: `hypothesis`
2. **02 · Identity** — Freeze the contract identity — Symbol, strike, expiry, DTE, and moneyness stay explicit before the new observation arrives. — visual: `chain`
3. **03 · Universe** — Define the comparison set — Keep the same symbols, selected session, expiry scope, moneyness, volume/OI, and source lens. — visual: `scope`
4. **04 · Timeline** — Freeze freshness and order — Selected date, session, as-of timestamp, and observation order are part of the recipe. — visual: `clock`
5. **05 · Checks** — Define the evidence gates — Neighboring leg, quote context, OI persistence, and follow-through are checks—not post-hoc justifications. — visual: `validate-hypothesis`
6. **06 · Run** — Execute the recipe in TradingFlow — Use the same Discover → Inspect → Validate → Compare path and save the starting packet. — visual: `replay`
7. **07 · Resolution** — Predefine the allowed outcomes — Retained, lowered, or unresolved are valid; no direction or hit-rate score is smuggled in. — visual: `uncertainty-card`
8. **08 · Practice** — Make the recipe runnable — Next: S2E03 · replay the recipe across sessions without changing the question. — visual: `s2e02-outro`
