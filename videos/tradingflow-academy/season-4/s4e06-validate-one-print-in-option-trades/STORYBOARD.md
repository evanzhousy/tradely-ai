# S4E06 storyboard

1. **01 · Print** — Start with one observed print — Open Option Trades and freeze the exact symbol, contract, timestamp, side, size, and session before interpretation. — visual: `s4e06-print`
2. **02 · Location** — Read bid and ask location — Ask whether the execution is at bid, mid, or ask; location describes the print, not the trader's intent. — visual: `s4e06-location`
3. **03 · Premium** — Keep premium and size separate — Premium is price per contract; size is quantity. Both need the same contract and timestamp context. — visual: `s4e06-premium`
4. **04 · Context** — Return to the contract drawer — Confirm expiry, strike, moneyness, DTE, and source freshness still match the print you opened. — visual: `s4e06-contract`
5. **05 · Repetition** — Check repetition without inferring accumulation — A repeated contract can justify a follow-up query; it cannot establish opening, closing, or accumulation on its own. — visual: `s4e06-repetition`
6. **06 · Quote** — Attach quote context — Record NBBO, neighboring prints, timing, and the next snapshot before treating a print as a research candidate. — visual: `s4e06-quote`
7. **07 · Boundary** — Leave unresolved claims open — Observed execution is not complete intent. Separate fact, unknown, and next check in the handoff. — visual: `s4e06-boundary`
8. **08 · Practice** — Separate session flow from structure — Next: S4E07 · keep today's tape separate from open interest and reported standing context. — visual: `s4e06-outro`
