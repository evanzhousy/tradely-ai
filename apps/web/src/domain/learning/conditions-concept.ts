type Copy = readonly [string, string];

export type ExecutionCondition = {
	id: string;
	label: Copy;
	meaning: Copy | null;
};
export type ConditionClaim =
	| "meaning"
	| "owner"
	| "institution"
	| "inside"
	| "strategy";
export function conditionSupports(
	condition: ExecutionCondition,
	definitionAvailable: boolean,
	claim: ConditionClaim,
) {
	return (
		definitionAvailable && condition.meaning !== null && claim === "meaning"
	);
}

export type SweepVenue = { id: string; priceCents: number; size: number };
export type LegQuote = {
	strike: number;
	bidCents: number;
	askCents: number;
	printCents: number;
};
export type ConditionsConceptData = {
	kind: "execution-conditions";
	contract: string;
	multiplier: number;
	/** Displayed offers, cheapest first. */
	venues: readonly [SweepVenue, ...SweepVenue[]];
	block: { size: number; bidCents: number; askCents: number };
	spread: {
		contracts: number;
		netCents: number;
		lower: LegQuote;
		upper: LegQuote;
	};
	conditionQuantity: number;
	conditions: readonly [ExecutionCondition, ...ExecutionCondition[]];
};

/** Fills an incoming buy against displayed offers in price order; each fill is its own print. */
export function sweepFills(
	venues: readonly SweepVenue[],
	size: number,
	multiplier: number,
) {
	let remaining = size;
	const fills = venues.flatMap((venue) => {
		const quantity = Math.min(remaining, venue.size);
		remaining -= quantity;
		return quantity > 0 ? [{ ...venue, quantity }] : [];
	});
	const filled = fills.reduce((sum, fill) => sum + fill.quantity, 0);
	const costCents = fills.reduce(
		(sum, fill) => sum + fill.priceCents * fill.quantity,
		0,
	);
	return {
		fills,
		filled,
		unfilled: remaining,
		premium: (costCents * multiplier) / 100,
		averageCents: filled > 0 ? costCents / filled : null,
	};
}

export type LocationCode = "BBID" | "BID" | "MID" | "ASK" | "AASK";
export function locationCode(
	priceCents: number,
	bidCents: number,
	askCents: number,
): LocationCode {
	if (priceCents < bidCents) return "BBID";
	if (priceCents === bidCents) return "BID";
	if (priceCents < askCents) return "MID";
	if (priceCents === askCents) return "ASK";
	return "AASK";
}

/** A package's own market: buy the lower-strike leg at its ask and sell the upper at its bid, and the reverse. */
export function packageMarket(lower: LegQuote, upper: LegQuote) {
	return {
		bidCents: lower.bidCents - upper.askCents,
		askCents: lower.askCents - upper.bidCents,
	};
}
