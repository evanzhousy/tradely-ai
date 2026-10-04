import { type Contract, type ExpiryId, optionQuote } from "@/content/world";

/** The chain, book and endings the trading lesson teaches with, shared by its film and its playground. */

/** One contract's fee, in cents. */
export const FEE = 65;

export const chainExpiries: readonly ExpiryId[] = ["sep20", "oct18", "nov15"];
export const strikes = [90, 95, 100, 105, 110];

/** Each strike's call and put quotes for an expiry. */
export function chainRows(expiry: ExpiryId): {
	strike: number;
	call: { bid: number; ask: number };
	put: { bid: number; ask: number };
}[] {
	return strikes.map((strike) => ({
		strike,
		call: optionQuote({ expiry, strike, right: "call" }),
		put: optionQuote({ expiry, strike, right: "put" }),
	}));
}

/** A thinly traded call and its book, in cents per share. */
export const thin: Contract = { expiry: "dec20", strike: 110, right: "call" };
export const thinBook = {
	asks: [
		{ price: 265, size: 3 },
		{ price: 275, size: 5 },
		{ price: 290, size: 8 },
	],
	bids: [
		{ price: 220, size: 4 },
		{ price: 210, size: 6 },
		{ price: 195, size: 10 },
	],
};

export const nov105: Contract = { expiry: "nov15", strike: 105, right: "call" };
export type Route = "hold" | "sell" | "expire" | "exercise";

/** Cash in and the result, in cents, for each way the Nov 15 105 call can end. */
export function routeFacts(route: Route) {
	const paid = optionQuote(nov105).ask * 100 + FEE;
	if (route === "sell")
		return { cash: 370 * 100 - FEE, result: 370 * 100 - FEE - paid };
	if (route === "expire") return { cash: 0, result: -paid };
	if (route === "exercise")
		return { cash: 0, result: (112 - 105) * 100 * 100 - paid };
	return { cash: 0, result: -paid };
}
