import {
	ALFA,
	type Contract,
	type Copy,
	dayLabel,
	daysBetween,
	expiries,
	modelValue,
	optionQuote,
	quoteAt,
	SESSION_DATE,
	valueAtExpiry,
} from "@/content/world";
import { ACCOUNT } from "./size-and-exit-model";

/**
 * Selling an option you can cover: one covered call and one cash-secured put on ALFA, from the
 * teaching Monday's quotes, shared by the selling-covered-options film and playground. Money
 * is in cents: "a share" where a name says so, otherwise per contract (100 shares). This shows
 * how the two obligations work and what they can cost, not which one to sell.
 */

/** One contract covers this many shares. */
export const SHARES = ALFA.multiplier;
/** ALFA on Mon Sep 16, cents a share. The example's shares are bought at this price. */
export const SPOT = ALFA.open;
export const STOCK_COST = SPOT;
/** The example account the course sizes against, cents. */
export { ACCOUNT };

const cents = (spot: number) => Math.round(spot * 100);

// ——— The covered call: 100 shares owned, one call sold against them ———

export const CALL: Contract = { expiry: "oct18", strike: 105, right: "call" };
/** Sold at the bid. Cents a share. */
export const CALL_BID = optionQuote(CALL).bid;
/** The premium kept, cents a contract. */
export const CALL_PREMIUM = CALL_BID * SHARES;
/** The shares alone at expiry, cents a contract, for ALFA at `spot` dollars. */
export const sharesProfit = (spot: number) =>
	(cents(spot) - STOCK_COST) * SHARES;
/** The sold call alone: its premium kept, less what it is worth at expiry. */
export const callLeg = (spot: number) =>
	(CALL_BID - valueAtExpiry(CALL, cents(spot))) * SHARES;
/** Shares and sold call together at expiry, cents a contract. */
export const coveredProfit = (spot: number) =>
	sharesProfit(spot) + callLeg(spot);
/** At the strike or above: the shares go at the strike and the premium is kept. */
export const COVERED_BEST = coveredProfit(CALL.strike);
/** ALFA at $0: the shares are worth nothing and only the premium is left. */
export const COVERED_WORST = coveredProfit(0);
/** Break-even at expiry, cents a share: the shares' cost less the premium. */
export const COVERED_EVEN = STOCK_COST - CALL_BID;
/** Above this price, cents a share, the shares alone end ahead: the strike plus the premium. */
export const COVERED_CAP = CALL.strike * 100 + CALL_BID;
/** If the call is assigned, the shares are sold at its strike: cash received, cents. */
export const CALL_DELIVERY = CALL.strike * 100 * SHARES;

// ——— The cash-secured put: the strike × 100 in cash set aside, one put sold ———

export const PUT: Contract = { expiry: "oct18", strike: 95, right: "put" };
/** Sold at the bid. Cents a share. */
export const PUT_BID = optionQuote(PUT).bid;
/** The premium kept, cents a contract. */
export const PUT_PREMIUM = PUT_BID * SHARES;
/** The cash set aside to buy 100 shares at the strike if assigned, cents. */
export const CASH = PUT.strike * 100 * SHARES;
/** The sold put at expiry, cents a contract, for ALFA at `spot` dollars. */
export const securedProfit = (spot: number) =>
	(PUT_BID - valueAtExpiry(PUT, cents(spot))) * SHARES;
/** At the strike or above the put expires worthless and the premium is kept. */
export const SECURED_BEST = securedProfit(PUT.strike);
/** ALFA at $0: 100 shares bought at the strike are worth nothing; the premium is kept. */
export const SECURED_WORST = securedProfit(0);
/** If assigned, the net price paid a share, and the break-even: the strike less the premium. */
export const NET_PRICE = PUT.strike * 100 - PUT_BID;
/** The cash set aside as a share of the example account. */
export const CASH_SHARE = CASH / ACCOUNT;
/** How many of these puts the example account can secure at once: rounded down. */
export const PUTS_SECURED = Math.floor(ACCOUNT / CASH);

// ——— Expiry ———

/** In the money by this much at expiry, an equity option is exercised unless told otherwise. Cents. */
export const AUTO_EXERCISE_CENTS = 1;
/** The sold call is assigned at expiry: ALFA a cent or more above its strike. */
export const callAssigned = (spot: number) =>
	cents(spot) >= CALL.strike * 100 + AUTO_EXERCISE_CENTS;
/** The sold put is assigned at expiry: ALFA a cent or more below its strike. */
export const putAssigned = (spot: number) =>
	cents(spot) <= PUT.strike * 100 - AUTO_EXERCISE_CENTS;

/** The option bought back on expiry afternoon at its model ask, cents a share. */
export const closeAsk = (contract: Contract, spot: number) =>
	quoteAt(contract, cents(spot), expiries[contract.expiry].date).ask;

export type Trade = "call" | "put";
/** One sold option on expiry day, left open or bought back first, with ALFA at `spot` dollars. */
export function settle(trade: Trade, spot: number, closed: boolean) {
	const call = trade === "call";
	const ask = closed ? closeAsk(call ? CALL : PUT, spot) : 0;
	const assigned = !closed && (call ? callAssigned(spot) : putAssigned(spot));
	return {
		assigned,
		/** Cents a share paid to buy the option back, or 0 when it was left open. */
		ask,
		/** ALFA shares in the account afterwards. */
		shares: call ? (assigned ? 0 : SHARES) : assigned ? SHARES : 0,
		/** Cash moved by an assignment, cents: in for the call, out for the put. */
		cash: assigned ? (call ? CALL_DELIVERY : -CASH) : 0,
		/** The result per contract, cents, with any shares valued at `spot`. */
		profit: closed
			? (call ? sharesProfit(spot) : 0) +
				((call ? CALL_BID : PUT_BID) - ask) * SHARES
			: call
				? coveredProfit(spot)
				: securedProfit(spot),
	};
}

/** The charts' range of ALFA prices at expiry, dollars. */
export const RANGE = [85, 120] as const;
/** The lowest whole-dollar price in range at which the shares alone end ahead of the pair. */
export const SHARES_AHEAD_FROM = (() => {
	for (let spot = RANGE[0]; spot <= RANGE[1]; spot++)
		if (sharesProfit(spot) > coveredProfit(spot)) return spot;
	return RANGE[1];
})();

/** Closes at expiry the playground and the case questions use, dollars: clear of both strikes. */
export type End = "low" | "middle" | "high";
export const ENDS: Record<End, number> = { low: 90, middle: 100, high: 110 };
/** A higher close for the trade-off: the shares alone against the pair. */
export const RALLY = 115;

// ——— Assignment before expiry ———

/**
 * The trading days from the sale to expiry, Monday to Friday: the holder may exercise on any
 * of them, so the writer can be assigned on any of them. The world's calendar has no market
 * holiday in this window.
 */
export const TRADING_DAYS: readonly string[] = (() => {
	const days: string[] = [];
	const last = daysBetween(SESSION_DATE, expiries[CALL.expiry].date);
	for (let i = 0; i <= last; i++) {
		const date = new Date(
			Date.parse(`${SESSION_DATE}T00:00:00Z`) + i * 86_400_000,
		);
		const weekday = date.getUTCDay();
		if (weekday !== 0 && weekday !== 6)
			days.push(date.toISOString().slice(0, 10));
	}
	return days;
})();
/** The day of the month of a trading day, for a calendar cell. */
export const dayOfMonth = (date: string) => Number(date.slice(8, 10));

/**
 * One day late in the put's life: deep in the money with almost no time value left, when a
 * holder gains little by waiting. Prices from the course's model, so they are modeled.
 */
export const EARLY = { date: "2030-10-14", spot: 8_600 } as const;
export const EARLY_DAY: Copy = dayLabel(EARLY.date);
/** In the money by, cents a share. */
export const EARLY_INTRINSIC = valueAtExpiry(PUT, EARLY.spot);
/** Time value left that day, cents a share: the model value less what it is in the money by. */
export const EARLY_TIME_VALUE =
	Math.round(modelValue(PUT, EARLY.spot, EARLY.date).price * 100) -
	EARLY_INTRINSIC;
/** The put bought back to close that day at its ask, cents a share. */
export const BUY_BACK = quoteAt(PUT, EARLY.spot, EARLY.date).ask;
/** Sold at the bid and bought back at the ask: the result, cents a contract. */
export const BUY_BACK_RESULT = (PUT_BID - BUY_BACK) * SHARES;
/** Assigned that night instead: 100 shares at the strike, valued at that day's price. */
export const EARLY_ASSIGNED_RESULT =
	(EARLY.spot - PUT.strike * 100 + PUT_BID) * SHARES;
