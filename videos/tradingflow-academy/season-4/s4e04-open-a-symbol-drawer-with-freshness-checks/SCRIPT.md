# S4E04 narration outline

Open a Symbol Drawer with Freshness Checks

## 1. 01 · Drawer

**Open one symbol drawer**

Move from a ranked candidate to one selected symbol; the drawer is a controlled inspection surface, not a signal panel.

## 2. 02 · Freshness

**Check the as-of line first**

Confirm the selected session, timestamp, and source freshness before trusting the values inside the drawer.

## 3. 03 · Identity

**Freeze symbol identity**

Keep symbol, contract, expiry, strike, and instrument type attached so fields cannot drift across objects.

## 4. 04 · Lens

**Name the flow lens**

A field is only interpretable inside a named lens: trades, quote context, open interest, or modeled structure.

## 5. 05 · Coverage

**Audit required fields**

Mark present, missing, and not-applicable fields explicitly before making a comparison or handoff.

## 6. 06 · Stop

**Stop on stale or missing context**

A stale timestamp or missing required field lowers usefulness; it does not become confidence by omission.

## 7. 07 · Read

**Separate observed from unknown**

Record what the drawer shows, what remains unknown, and the next check without turning context into intent.

## 8. 08 · Practice

**Rank contracts without redefining the universe**

Next: S4E05 · move from symbol to contract with expiry, strike, and moneyness still in scope.

## Practice

S4E05 · Rank contracts without redefining the universe.
