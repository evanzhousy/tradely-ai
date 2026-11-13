import {
	type Contract,
	daysToExpiry,
	oct100CallMonday,
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
/** The 105/110 call spread: the 105 call bought at $2.15, the 110 call sold at $0.90. */
export const NET = 215 - 90;
export const longLeg = (spot: number) => payoff(CALL_105, spot);
export const shortLeg110 = (spot: number) => -payoff(CALL_110, spot);
export const spreadPayoff = (spot: number) => longLeg(spot) + shortLeg110(spot);

// ——— A roll ———

/** The course's example account: your two Monday buys of the Oct 18 100 call. */
const mondayLots = oct100CallMonday.trades.filter(
	(trade) => trade.buyer === "you",
);
export const ROLL_DATE = "2030-10-04";
export const ROLL_SPOT = 10_200;
export const ROLL_QUANTITY = mondayLots.reduce(
	(sum, lot) => sum + lot.quantity,
	0,
);
/** What the October calls cost on Monday, in cents. */
export const ROLL_PAID = mondayLots.reduce(
	(sum, lot) => sum + lot.quantity * lot.price * 100,
	0,
);
export const NOV_100: Contract = {
	expiry: "nov15",
	strike: 100,
	right: "call",
};
/** The roll sells October at its bid and buys November at its ask. Cents a share. */
export const SELL_OCT = quoteAt(CALL_100, ROLL_SPOT, ROLL_DATE).bid;
export const BUY_NOV = quoteAt(NOV_100, ROLL_SPOT, ROLL_DATE).ask;
export const CASH_IN = SELL_OCT * ROLL_QUANTITY * 100;
export const CASH_OUT = BUY_NOV * ROLL_QUANTITY * 100;
/** The roll's net cost: a share, a contract (×100) and for the whole position. Cents. */
export const ROLL_NET_SHARE = BUY_NOV - SELL_OCT;
export const ROLL_NET_CONTRACT = ROLL_NET_SHARE * 100;
export const ROLL_NET = CASH_OUT - CASH_IN;
/** The loss made final by selling the October calls for less than they cost. Cents, negative. */
export const ROLL_REALIZED = CASH_IN - ROLL_PAID;
/** Everything paid for calls once the roll is done. Cents. */
export const ROLL_TOTAL_PAID = ROLL_PAID + ROLL_NET;
export const OCT_DAYS_LEFT = daysToExpiry("oct18", ROLL_DATE);
export const NOV_DAYS_LEFT = daysToExpiry("nov15", ROLL_DATE);
export const ROLL_WEEKS = (NOV_DAYS_LEFT - OCT_DAYS_LEFT) / 7;
