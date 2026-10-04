import { type Contract, optionQuote, valueAtExpiry } from "@/content/world";

/** The contracts and payoffs the options lesson teaches with, shared by its film and its playground. */

export const call100: Contract = {
	expiry: "oct18",
	strike: 100,
	right: "call",
};
export const put100: Contract = { expiry: "oct18", strike: 100, right: "put" };
export const put95: Contract = { expiry: "oct18", strike: 95, right: "put" };
export const call105: Contract = {
	expiry: "oct18",
	strike: 105,
	right: "call",
};
export const call110: Contract = {
	expiry: "oct18",
	strike: 110,
	right: "call",
};

export type Use = "shares" | "protect" | "earn" | "view";

/** Payoffs in dollars per share at Oct 18, by ALFA's price in dollars. */
export const SPOTS = [80, 85, 90, 95, 100, 105, 110, 115, 120];
export const shares = (spot: number) => (spot - 100) * 100;
export const putCost = optionQuote(put95).ask;
export const callIncome = optionQuote(call110).bid;
export const viewCost = optionQuote(call105).ask;
export const positionPayoff: Record<
	Exclude<Use, "shares">,
	(spot: number) => number
> = {
	protect: (spot) => shares(spot) + valueAtExpiry(put95, spot * 100) - putCost,
	earn: (spot) =>
		shares(spot) - valueAtExpiry(call110, spot * 100) + callIncome,
	view: (spot) => valueAtExpiry(call105, spot * 100) - viewCost,
};
/** What the Oct 18 100 call costs, in dollars a share: the ask. */
export const CALL_COST = optionQuote(call100).ask;
