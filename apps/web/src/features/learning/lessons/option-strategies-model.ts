import {
	type Contract,
	optionQuote,
	quoteAt,
	valueAtExpiry,
} from "@/content/world";

export const oct18 = (strike: number, right: "call" | "put"): Contract => ({
	expiry: "oct18",
	strike,
	right,
});
/** Dollars per contract at expiry (cents per share equal dollars per 100 shares). */
export const payoff = (contract: Contract, spot: number) =>
	valueAtExpiry(contract, Math.round(spot * 100));
export const RANGE = [80, 120] as const;
export const kinks = (
	f: (spot: number) => number,
	strikes: readonly number[],
) => [RANGE[0], ...strikes, RANGE[1]].map((spot) => [spot, f(spot)] as const);

// ——— One leg, three positions ———

export type Context = "alone" | "covered" | "spread";

export const CALL_105 = oct18(105, "call");
export const CALL_100 = oct18(100, "call");
/** The short leg sells at the bid; the long call in the spread buys at the ask. Cents a share. */
export const SOLD = optionQuote(CALL_105).bid;
export const BOUGHT_100 = optionQuote(CALL_100).ask;
export const STOCK_COST = 100;

export const shortLeg = (spot: number) => SOLD - payoff(CALL_105, spot);
export const structures: Record<Context, (spot: number) => number> = {
	alone: shortLeg,
	covered: (spot) => (spot - STOCK_COST) * 100 + shortLeg(spot),
	spread: (spot) => payoff(CALL_100, spot) - BOUGHT_100 + shortLeg(spot),
};

// ——— Adding signed legs ———

export const CALL_110 = oct18(110, "call");
/** The Monday block: bought the 105 call at $2.15, sold the 110 call at $0.90. */
export const NET = 215 - 90;
export const longLeg = (spot: number) => payoff(CALL_105, spot);
export const shortLeg110 = (spot: number) => -payoff(CALL_110, spot);
export const spreadPayoff = (spot: number) => longLeg(spot) + shortLeg110(spot);

// ——— A roll ———

export const ROLL_DATE = "2030-10-04";
export const ROLL_SPOT = 10_200;
export const ROLL_QUANTITY = 16;
export const NOV_100: Contract = {
	expiry: "nov15",
	strike: 100,
	right: "call",
};
export const SELL_OCT = quoteAt(CALL_100, ROLL_SPOT, ROLL_DATE).bid;
export const BUY_NOV = quoteAt(NOV_100, ROLL_SPOT, ROLL_DATE).ask;
export const CASH_IN = SELL_OCT * ROLL_QUANTITY * 100;
export const CASH_OUT = BUY_NOV * ROLL_QUANTITY * 100;
