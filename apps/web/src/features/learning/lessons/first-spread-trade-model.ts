import {
	ALFA,
	type Contract,
	expiries,
	optionQuote,
	quoteAt,
	valueAtExpiry,
} from "@/content/world";

/**
 * One call debit spread, from the view to its end: the numbers the first-spread-trade film
 * and playground share. Amounts per share are in cents, as the world's quotes are; amounts
 * per spread are in whole dollars (one spread covers 100 shares, so the two are the same
 * number). This is how a defined-risk trade works, not a trade to copy.
 */

// ——— The view and the structure ———

/** The view, stated so it can be wrong: ALFA above this price on Oct 18. Dollars. */
export const VIEW_LEVEL = 105;
export const LONG: Contract = { expiry: "oct18", strike: 100, right: "call" };
export const SHORT: Contract = { expiry: "oct18", strike: 105, right: "call" };
/** The bought call fills at its ask and the sold call at its bid. Cents a share. */
export const PAID = optionQuote(LONG).ask;
export const RECEIVED = optionQuote(SHORT).bid;
/** The net debit: what the pair costs. Cents a share, and so dollars a spread. */
export const DEBIT = PAID - RECEIVED;
/** The distance between the strikes. Cents a share, and so dollars a spread. */
export const WIDTH = (SHORT.strike - LONG.strike) * 100;
/** Dollars a spread. */
export const MAX_LOSS = DEBIT;
export const MAX_GAIN = WIDTH - DEBIT;
/** ALFA prices, in dollars. */
export const BREAK_EVEN = LONG.strike + DEBIT / 100;
export const CALL_BREAK_EVEN = LONG.strike + PAID / 100;
/** One spread covers this many shares. */
export const SHARES = ALFA.multiplier;

const cents = (spot: number) => Math.round(spot * 100);
/** Dollars a spread at expiry, for ALFA at `spot` dollars. */
export const spreadValue = (spot: number) =>
	valueAtExpiry(LONG, cents(spot)) - valueAtExpiry(SHORT, cents(spot));
export const spreadProfit = (spot: number) => spreadValue(spot) - DEBIT;
/** The bought call held alone: dollars a contract at expiry. */
export const callProfit = (spot: number) =>
	valueAtExpiry(LONG, cents(spot)) - PAID;

export const RANGE = [90, 115] as const;
/** The lowest whole-dollar price in range at which the call alone ends ahead of the spread. */
export const CALL_AHEAD_FROM = (() => {
	for (let spot = RANGE[0]; spot <= RANGE[1]; spot++)
		if (callProfit(spot) > spreadProfit(spot)) return spot;
	return RANGE[1];
})();

// ——— Size and the written exits ———

/** The account the course sizes against, in dollars. */
export const ACCOUNT = 10_000;
export const SIZE_LIMIT = 5;
/**
 * Two example rules for the most one trade may lose, as a percent of the account: the one
 * this lesson's trader accepts, and the stricter example the size-and-exit lesson uses.
 */
export const CAP_PERCENT = 5;
export const STRICT_PERCENT = 2;
export const capFor = (percent: number) => (ACCOUNT * percent) / 100;
/** Dollars. */
export const LOSS_CAP = capFor(CAP_PERCENT);
export const STRICT_CAP = capFor(STRICT_PERCENT);
export const worstCase = (spreads: number) => MAX_LOSS * spreads;
export const bestCase = (spreads: number) => MAX_GAIN * spreads;
/** The worst case as a fraction of the account. */
export const accountShare = (spreads: number) => worstCase(spreads) / ACCOUNT;
/** Whole spreads whose worst case fits a cap: rounded down, and zero is a valid size. */
export const spreadsWithin = (cap: number) => Math.floor(cap / MAX_LOSS);
/** The size the film and the playground's worked step use. */
export const PLAN_SPREADS = spreadsWithin(LOSS_CAP);

/**
 * One written exit plan, as an example of its form: sell the spread when it can be sold for
 * the profit point, when it falls to the loss point, or on the time stop, whichever comes
 * first. Prices are the spread's net price in cents a share.
 */
export const EXIT = {
	profitAt: 365,
	lossAt: 115,
	timeStop: "oct11",
} as const;
export const EXIT_PROFIT = EXIT.profitAt - DEBIT;
export const EXIT_LOSS = EXIT.lossAt - DEBIT;

// ——— Three ends on Oct 18 ———

/** In the money by this much at expiry, an equity option is exercised unless told otherwise. Cents. */
export const AUTO_EXERCISE_CENTS = 1;
export type End = "below" | "between" | "above";
/** ALFA's close on Oct 18 in each case, in dollars. */
export const ENDS: Record<End, number> = {
	below: 97,
	between: 103,
	above: 108,
};
/** Cash for 100 shares at a strike, in dollars. */
export const sharesCash = (contract: Contract) => contract.strike * SHARES;

/** What happens to one spread left to expire with ALFA at `spot` dollars. */
export function settle(spot: number) {
	const exercised = cents(spot) >= LONG.strike * 100 + AUTO_EXERCISE_CENTS;
	const assigned = cents(spot) >= SHORT.strike * 100 + AUTO_EXERCISE_CENTS;
	return {
		/** Your call is exercised: you buy 100 shares at its strike. */
		exercised,
		/** The call you sold is assigned: you sell 100 shares at its strike. */
		assigned,
		/** Shares in the account on Monday. */
		shares: (exercised ? SHARES : 0) - (assigned ? SHARES : 0),
		/** Dollars paid for shares, and received for them. */
		due: exercised ? sharesCash(LONG) : 0,
		received: assigned ? sharesCash(SHORT) : 0,
		/** Dollars a spread, with any shares valued at `spot`. */
		profit: spreadProfit(spot),
	};
}

/**
 * The net price the spread can be sold for on expiry afternoon, from the model's quotes:
 * the bought call sold at its bid, the sold call bought back at its ask. Cents a share.
 */
export function closeCredit(spot: number) {
	const on = expiries[LONG.expiry].date;
	return Math.max(
		quoteAt(LONG, cents(spot), on).bid - quoteAt(SHORT, cents(spot), on).ask,
		0,
	);
}
export const closeProfit = (spot: number) => closeCredit(spot) - DEBIT;
