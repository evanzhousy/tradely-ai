import {
	alfaCloses,
	daysToExpiry,
	modelVolatility,
	oct100CallCloseQuote,
	oct100CallMonday,
	priceOption,
	signedUsd,
	yourAccount,
	yourSecondAccount,
} from "@/content/world";

/** The numbers the portfolio Greeks lesson teaches with, shared by its film and its playground. */

/** Monday's close: ALFA's last trade, and 32 days to the Oct 18 expiry. */
export const SPOT = oct100CallCloseQuote.spot / 100;
export const FRIDAY_SPOT = alfaCloses[alfaCloses.length - 1].close;
export const DAYS = daysToExpiry("oct18");
export const CALLS = oct100CallMonday.trades
	.filter((trade) => trade.buyer === "you")
	.reduce((sum, trade) => sum + trade.quantity, 0);
export const PUTS = yourSecondAccount.puts.quantity;
export const PUT_STRIKE = yourSecondAccount.puts.strike;

/** Model Greeks per share for an Oct 18 contract. */
export const greeks = (
	right: "call" | "put",
	strike: number,
	spot: number,
	days = DAYS,
) =>
	priceOption({
		spot,
		strike,
		days,
		iv: modelVolatility("oct18", strike),
		right,
	});
export const CALL = greeks("call", 100, SPOT);
export const PUT = greeks("put", PUT_STRIKE, SPOT);
/** The puts as the second broker last valued them: at Friday's close, three days earlier. */
export const PUT_FRIDAY = greeks("put", PUT_STRIKE, FRIDAY_SPOT, DAYS + 3);

export const round3 = (value: number) => Math.round(value * 1000) / 1000;
/** Signed per-share sensitivity to three places: "+0.566", "−0.259". */
export const fixed3 = (value: number) =>
	`${value < 0 ? "−" : value > 0 ? "+" : ""}${Math.abs(value).toFixed(3)}`;
/** A holding's delta in shares: contracts × 100 × delta per share. */
export const shares = (contracts: number, delta: number) =>
	Math.round(contracts * 100 * delta);
export const STOCK_DELTA = yourAccount.shares;
export const CALL_DELTA = shares(CALLS, CALL.delta);
export const PUT_DELTA = shares(PUTS, PUT.delta);
export const PUT_DELTA_FRIDAY = shares(PUTS, PUT_FRIDAY.delta);
export const SUBTOTAL = STOCK_DELTA + CALL_DELTA;
export const TOTAL = SUBTOTAL + PUT_DELTA;
/** Whole dollars from dollars: "+$875", "−$964". */
export const wholeUsd = (value: number) =>
	signedUsd(Math.round(value) * 100, 0);

export const HEDGE = TOTAL;
export const UP = 5;
export const WEEK = 7;
/** Your holdings' value in dollars at a price, with `days` left to expiry. */
export const holdingsValue = (spot: number, days: number) =>
	yourAccount.shares * spot +
	CALLS * 100 * greeks("call", 100, spot, days).price +
	PUTS * 100 * greeks("put", PUT_STRIKE, spot, days).price;
export const holdingsDelta = (spot: number) =>
	yourAccount.shares +
	CALLS * 100 * greeks("call", 100, spot).delta +
	PUTS * 100 * greeks("put", PUT_STRIKE, spot).delta;
/** The hedged book's P&L in dollars from Monday's close: holdings repriced, less the short shares. */
export const hedgedPnl = (spot: number, daysPassed: number) =>
	holdingsValue(spot, DAYS - daysPassed) -
	holdingsValue(SPOT, DAYS) -
	HEDGE * (spot - SPOT);
export const GAMMA = CALLS * 100 * CALL.gamma + PUTS * 100 * PUT.gamma;
export const THETA = CALLS * 100 * CALL.theta + PUTS * 100 * PUT.theta;
export const VEGA = CALLS * 100 * CALL.vega + PUTS * 100 * PUT.vega;
export const UP_PNL = hedgedPnl(SPOT + UP, 0);
export const UP_DELTA = Math.round(holdingsDelta(SPOT + UP) - HEDGE);
export const WEEK_PNL = hedgedPnl(SPOT, WEEK);

export const CALL_VEGA = round3(CALL.vega);
/** The second broker's convention: vega per 1.00 of volatility, 100 vol points. */
export const PUT_VEGA_PER_UNIT = Math.round(PUT.vega * 100 * 100) / 100;
export const PUT_VEGA = round3(PUT_VEGA_PER_UNIT / 100);
export const VEGA_TOTAL = Math.round(
	CALLS * 100 * CALL_VEGA + PUTS * 100 * PUT_VEGA,
);
export const RAW_SUM = (CALL_VEGA + PUT_VEGA_PER_UNIT).toFixed(3);
