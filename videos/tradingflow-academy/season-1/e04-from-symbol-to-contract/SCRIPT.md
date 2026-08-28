# Narration Script

## 01 — The gap between symbol and contract

A ranked symbol tells you where options activity is concentrating. It does not tell you which contract deserves attention. One symbol can contain dozens of expiries, hundreds of strikes, and both calls and puts. If you jump from “this ticker is active” to the largest premium print, you have skipped the most important step: defining the contract. In TradingFlow, every contract begins with three coordinates: expiry, strike, and side. Today we will narrow those coordinates with evidence, not with a magic score. The goal is not to find the best contract. The goal is to find a contract that is specific enough to inspect, and honest enough to explain.

## 02 — Expiry defines the clock

Start with expiry, because expiry defines the clock of the position. A contract expiring this week and a contract expiring in three months can sit on the same symbol and the same strike, but they respond to time, volatility, and price movement very differently. In Contract Rank, narrow the expiry scope before you compare size. Use an exact date when you are investigating a known event, or use days-to-expiration when you want a consistent horizon. Remember that the ranked row aggregates the full selected session. A large session total does not mean the activity arrived at one moment, and a nearer expiry is not automatically a stronger conviction. Expiry is a constraint. It tells you which clock you are willing to analyze.

## 03 — Strike and moneyness locate the contract

Next, locate the strike relative to the underlying. TradingFlow labels contracts as in the money, at the money, or out of the money using the latest available print or chain snapshot. That label is a current location, not a summary of where the contract spent the entire session. The premium and flow totals still cover the full selected session. Compare nearby strikes within the same expiry. Ask how far each strike sits from the latest underlying price, what delta implies about current sensitivity, and whether the strike is actually tradeable. Do not call a far out-of-the-money contract “cheap” just because its option price is small. You are choosing a location on the chain, not buying a prediction.

## 04 — Repetition changes the evidence

Now look for repetition. A single large print can matter, but it is one observation. Several prints in the same exact contract, spread across time, create a different evidence pattern. Contract Rank aggregates those trades into one session row, so use the trade count and then inspect the underlying prints. Repetition does not guarantee that one participant is building a position. It simply tells you the contract kept reappearing. Also be precise with execution side. Ask size share and bid size share describe where trades executed relative to the quote. They are useful context, but they are not literal opening and closing labels. Repetition should make you more curious, not more certain.

## 05 — Vol/OI is turnover, not intent

Volume-to-open-interest is the fastest metric to misuse. TradingFlow calculates it as daily volume divided by open interest when open interest is positive. A reading of three means today’s volume is three times the reported contracts outstanding. That is turnover relative to a prior positioning base. It can highlight an unusual contract, but it does not prove that three times the open interest was newly opened. Contracts can trade repeatedly, positions can close, and open interest updates on a different schedule. When open interest is zero, missing, or extremely thin, the ratio is undefined or unstable. Treat Vol/OI as a turnover shock detector. Then verify the prints, the liquidity, and the timing.

## 06 — Inspect the exact contract

Once expiry, strike, repetition, and turnover line up, open the exact-contract drawer. The Flow tab tells you how the selected session traded: premium, size, execution-side mix, and intraday activity. Positioning adds open interest and changes in open interest, which usually come from a different reporting horizon. Tradeability asks whether spreads, size, and recent pricing make the contract practical to inspect further. Keep those horizons separate. Intraday flow can be fresh while open interest still reflects the prior reporting cycle. The drawer is not a verdict. It is where one ranked row becomes a structured research object. If the evidence still looks coherent, carry the exact option symbol into Option Trades and inspect the prints directly.

## 07 — A repeatable five-check workflow

Here is the workflow. First, choose the expiry clock. Second, compare strikes and current moneyness inside that clock. Third, check whether the exact contract repeated across the session. Fourth, interpret Vol/OI as turnover relative to open interest, not as proof of new positioning. Fifth, open the drawer and separate Flow, Positioning, and Tradeability before you continue. Notice what is missing: there is no single number that says “trade this.” The method is a funnel. Each step removes ambiguity, and each step preserves the reason you kept the candidate. By the end, you should be able to explain why this exact contract deserves another minute of research.

## 08 — Practice and next episode

Open Contract Rank and choose one symbol from your watchlist. Narrow it to one expiry, compare three neighboring strikes, and write down the exact contract that repeats most clearly. Then record its Vol/OI, trade count, moneyness, and one liquidity observation from the drawer. Your output is not a trade. It is a contract-level research note. In the next episode, we will take that exact option symbol into Option Trades and verify the story print by print: sequence, timing, quote context, and whether the apparent pattern survives closer inspection. This is TradingFlow Academy. Move from attention, to evidence, to a decision you can actually explain.

