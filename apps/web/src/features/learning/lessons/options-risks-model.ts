import {
	type Contract,
	optionQuote,
	priceOption,
	valueAtExpiry,
} from "@/content/world";

/** The call, its decay and the round trips the risk lesson teaches with, shared by its film and its playground. */

export const call100: Contract = {
	expiry: "oct18",
	strike: 100,
	right: "call",
};
export const PAID = optionQuote(call100).ask;
export const DAYS = 32;
export const FEE = 65;

/** The call's model value per share, in dollars, `days` after Sep 16 at an IV in percent. */
export const value = (spot: number, days: number, iv: number) =>
	priceOption({
		spot,
		strike: 100,
		days: DAYS - days,
		iv: iv / 100,
		right: "call",
	}).price;

export const curve = (days: number, iv: number) =>
	Array.from({ length: 41 }, (_, i) => {
		const spot = 90 + i / 2;
		return [spot, value(spot, days, iv)] as const;
	});

/** With 20 of the 32 days gone and IV unchanged, the lowest whole dollar that earns the premium back. */
export const RECOVER_AT =
	Array.from({ length: 21 }, (_, i) => 90 + i).find(
		(spot) => value(spot, 20, 35) * 100 >= PAID,
	) ?? 110;

export type Side = "buyer" | "writer";

/** Each side's result at Oct 18 in cents per share. */
export const atExpiry = (side: Side, spot: number) => {
	const buyer = valueAtExpiry(call100, spot * 100) - PAID;
	return side === "buyer" ? buyer : -buyer;
};

export type Kind = "active" | "thin";

export const costContracts: Record<Kind, Contract> = {
	active: call100,
	thin: { expiry: "dec20", strike: 110, right: "call" },
};

/** A round trip's spread, fees and loss in cents. */
export function costFacts(state: { kind: Kind; contracts: number }) {
	const quote = optionQuote(costContracts[state.kind]);
	const shares = state.contracts * 100;
	const spread = (quote.ask - quote.bid) * shares;
	const fees = FEE * state.contracts * 2;
	const paid = quote.ask * shares;
	// The bid has to reach the price paid plus both fees before selling breaks even.
	const breakeven = quote.ask + fees / shares;
	return { quote, spread, fees, loss: spread + fees, paid, breakeven };
}
