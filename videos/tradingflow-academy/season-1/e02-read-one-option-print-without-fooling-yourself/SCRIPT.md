# SCRIPT — Read One Option Print Without Fooling Yourself

Target runtime: 7:00  
Narration: English, Frederick, calm analyst delivery  
Case: SPX, 2026-07-24, Option Trades Historical, New York time

## Scene 1 — Bullish, right? · 0:00–0:24

A call trades above the ask. Four contracts. Seventy thousand dollars of
premium. Call plus ask-side execution: bullish, right?

That label is a useful inference. It is not the participant's complete
strategy.

In this lesson, we will read one real option print without turning partial
evidence into a complete story.

## Scene 2 — Freeze the observation · 0:24–1:02

First, freeze what TradingFlow actually shows.

This is SPX on July twenty-fourth, twenty twenty-six, in the Historical tape.
The print arrived at seventeen-oh-six and thirty-eight seconds, New York time.
It is a forty-four-forty-five call expiring September eighteenth, with
fifty-six days to expiration.

SPX was at seventy-four-oh-eight point three. The call traded at one
seventy-five, four contracts, for seventy thousand dollars.

Those are observations. They describe one execution in one selected session.
They do not yet describe the trader's portfolio, opening or closing status, or
future price direction.

## Scene 3 — Read seven fields in order · 1:02–1:55

Use the same reading order for every print.

One: call or put. This tells you the contract type, not the trade thesis.

Two: execution side. AAsk means the trade occurred above the ask. BBid means
below the bid. That helps infer who crossed the spread.

Three: size. How many contracts traded?

Four: premium. Price times size times the one-hundred contract multiplier.
Premium measures money traded, not conviction.

Five: moneyness. Is the strike in, at, or out of the money relative to spot?

Six: days to expiration. A seven-day contract and a fifty-six-day contract
carry very different timing exposure.

Seven: context. Check strike, spot, open interest, volume-to-open-interest,
activity type, trade count, and neighboring prints.

The first six describe the row. The seventh protects you from reading the row
alone.

## Scene 4 — Sentiment is a matrix, not intent · 1:55–2:55

TradingFlow's sentiment logic combines contract type with execution side.

A call bought at or above the ask is labeled bullish. A call sold at or below
the bid is labeled bearish.

A put bought at or above the ask is labeled bearish. A put sold at or below
the bid is labeled bullish.

Mid-market execution remains neutral because the aggressor is ambiguous.

This matrix is useful because it standardizes one tape-level inference. But
notice what it does not contain: opening versus closing, spread linkage,
hedging purpose, account inventory, or the rest of the order.

The correct sentence is, "This print is consistent with aggressive call
buying." The dangerous sentence is, "Smart money knows SPX is going up."

## Scene 5 — Autopsy the call · 2:55–4:00

Now apply the sequence to our SPX call.

It is a call. It printed AAsk, so aggressive call buying is a reasonable
inference.

The strike is seventy-four forty-five while spot is seventy-four oh-eight
point three. That makes the call out of the money by thirty-six point seven
index points.

It has fifty-six days to expiration and a delta near point five-two.

The premium is seventy thousand dollars, but the size is only four contracts.
Most of the dollar amount comes from the one-hundred multiplier and a
one-hundred-seventy-five-dollar option price. Large premium does not
automatically mean a large number of contracts.

Open interest is twenty-seven eighty-five, and the displayed volume-to-open-
interest ratio is one point two-eight. That is useful contract context. It does
not prove these four contracts opened a new position.

So far, we have an ask-side call with meaningful dollar value. We still do not
have the complete trade.

## Scene 6 — The neighboring print changes the hypothesis · 4:00–4:55

Now look at another row.

At the exact same second, TradingFlow shows an SPX put with the same September
eighteenth expiry, the same seventy-four forty-five strike, the same spot
price, and the same size of four.

The put printed BBid for sixty-nine point two thousand dollars. Its delta is
negative point four-eight.

If these two rows are linked, buying the call while selling the put is
consistent with a synthetic-long or risk-reversal-like structure.

But "if linked" is doing important work. Matching time, strike, expiry, and
size makes linkage plausible. The tape alone does not prove the rows came from
one participant or one order.

The second print does not give us certainty. It gives us a better hypothesis
than "big bullish call."

## Scene 7 — Four tests before a conclusion · 4:55–5:50

Before you conclude, run four tests in Option Trades.

First, inspect neighboring prints. Match the timestamp, contract, strike,
expiry, and size. Opposite legs can change the interpretation.

Second, inspect activity type and trade count. Exchange-provided tags can
describe single-leg, multi-leg, auction, or stock-option mechanisms. They add
structure, but still may not reconstruct the full portfolio.

Third, look for repetition across the selected session. Repeated aligned flow
is stronger evidence than one isolated row. Mixed or mid-market flow weakens
a clean directional reading.

Fourth, return after the next cleared open-interest snapshot. A change in open
interest can strengthen an opening-position hypothesis after the fact, but it
still cannot identify the original trader.

No follow-through, an offsetting leg, neutral execution, or contradictory
session flow should reduce your confidence. None of them should be hidden.

## Scene 8 — Write the evidence ledger · 5:50–6:32

Finish with three columns.

Observed: an SPX seventy-four forty-five call traded AAsk, size four, for
seventy thousand dollars. A same-second put shared the strike, expiry, and
size.

Inferred: the call is consistent with aggressive buying. The put is consistent
with aggressive selling. If linked, the pair is consistent with a structured
bullish position.

Unknown: whether the prints are linked, whether they opened or closed, whether
they hedge another position, who traded them, and what SPX does next.

This ledger does not weaken analysis. It shows exactly how much evidence the
analysis contains.

## Scene 9 — Practice in TradingFlow · 6:32–7:00

Open TradingFlow Option Trades and switch to Historical.

Choose one print. Record the symbol, session, expiry, strike, call or put,
side, size, premium, moneyness, and days to expiration.

Then add one line each for observed, inferred, and unknown.

One print is evidence, not a complete trade thesis.

Next, we will use Rank to find where attention is concentrating before we ever
choose a print to inspect.
