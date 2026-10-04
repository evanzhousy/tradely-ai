import {
	ALFA,
	type Contract,
	optionQuote,
	valueAtExpiry,
} from "@/content/world";

/** The contracts, prices and payoffs the premium lesson teaches with, shared by its film and its playground. */

export type Right = "call" | "put";
export const oct18 = (strike: number, right: Right): Contract => ({
	expiry: "oct18",
	strike,
	right,
});

/**
 * Value at expiry in cents per share for a price in dollars. Cents per share equal dollars
 * per 100-share contract, which is how the charts below are drawn.
 */
export const payoffAt = (contract: Contract, spot: number) =>
	valueAtExpiry(contract, Math.round(spot * 100));

export const STRIKES = [90, 95, 100, 105, 110] as const;
export type Moment = "now" | "expiry";

/** Cents per share with ALFA at $100: the Sep 16 ask, or what is left at expiry. */
export function priceParts(strike: number, right: Right, moment: Moment) {
	const contract = oct18(strike, right);
	const intrinsic = valueAtExpiry(contract, ALFA.open);
	const price = moment === "now" ? optionQuote(contract).ask : intrinsic;
	return { price, intrinsic, time: price - intrinsic };
}

export type BuyId = "c100" | "c105" | "p95";
export const buys: Record<BuyId, Contract> = {
	c100: oct18(100, "call"),
	c105: oct18(105, "call"),
	p95: oct18(95, "put"),
};

/** Price at which a bought option's value at expiry repays its premium, in dollars. */
export const breakEven = (contract: Contract, paid: number) =>
	contract.right === "call"
		? contract.strike + paid / 100
		: contract.strike - paid / 100;

export type WriteId = "p95" | "c105";
export const writes: Record<WriteId, Contract> = {
	p95: oct18(95, "put"),
	c105: oct18(105, "call"),
};
