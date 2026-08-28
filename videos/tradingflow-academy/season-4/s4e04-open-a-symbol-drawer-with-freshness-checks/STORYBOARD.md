# S4E04 storyboard

1. **01 · Drawer** — Open one symbol drawer — Move from a ranked candidate to one selected symbol; the drawer is a controlled inspection surface, not a signal panel. — visual: `s4e04-drawer`
2. **02 · Freshness** — Check the as-of line first — Confirm the selected session, timestamp, and source freshness before trusting the values inside the drawer. — visual: `s4e04-freshness`
3. **03 · Identity** — Freeze symbol identity — Keep symbol, contract, expiry, strike, and instrument type attached so fields cannot drift across objects. — visual: `s4e04-identity`
4. **04 · Lens** — Name the flow lens — A field is only interpretable inside a named lens: trades, quote context, open interest, or modeled structure. — visual: `s4e04-lens`
5. **05 · Coverage** — Audit required fields — Mark present, missing, and not-applicable fields explicitly before making a comparison or handoff. — visual: `s4e04-coverage`
6. **06 · Stop** — Stop on stale or missing context — A stale timestamp or missing required field lowers usefulness; it does not become confidence by omission. — visual: `s4e04-stop`
7. **07 · Read** — Separate observed from unknown — Record what the drawer shows, what remains unknown, and the next check without turning context into intent. — visual: `s4e04-read`
8. **08 · Practice** — Rank contracts without redefining the universe — Next: S4E05 · move from symbol to contract with expiry, strike, and moneyness still in scope. — visual: `s4e04-outro`
