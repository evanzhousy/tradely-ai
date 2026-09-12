/** Expiration-only teaching valuation. All prices and cash values are cents. */
export type StrategyLeg =
	| { kind: "stock"; id: string; shares: number; entryPrice: number }
	| {
			kind: "option";
			id: string;
			option: "CALL" | "PUT";
			side: "long" | "short";
			strike: number;
			expiry: string;
			contracts: number;
			multiplier: number;
			premium: number;
	  };
export type StrategyValuation =
	| { ok: false; issue: "empty" | "invalid" | "mixed-expiry" }
	| {
			ok: true;
			terminalValue: number;
			entryCost: number;
			fees: number;
			profit: number;
			legs: {
				id: string;
				terminalValue: number;
				entryCost: number;
				profit: number;
			}[];
	  };
const nonnegative = (n: number) => Number.isFinite(n) && n >= 0;
export function valueStrategy(
	legs: readonly StrategyLeg[],
	spot: number,
	fees = 0,
): StrategyValuation {
	if (!legs.length) return { ok: false, issue: "empty" };
	if (
		!nonnegative(spot) ||
		!nonnegative(fees) ||
		new Set(legs.map((leg) => leg.id)).size !== legs.length
	)
		return { ok: false, issue: "invalid" };
	const expiries = new Set<string>();
	for (const leg of legs) {
		if (leg.kind === "stock") {
			if (
				!Number.isInteger(leg.shares) ||
				leg.shares === 0 ||
				!nonnegative(leg.entryPrice)
			)
				return { ok: false, issue: "invalid" };
		} else {
			if (
				!nonnegative(leg.strike) ||
				!nonnegative(leg.premium) ||
				!Number.isInteger(leg.contracts) ||
				leg.contracts <= 0 ||
				!Number.isFinite(leg.multiplier) ||
				leg.multiplier <= 0 ||
				!leg.expiry
			)
				return { ok: false, issue: "invalid" };
			expiries.add(leg.expiry);
		}
	}
	// A roll closes one expiry and opens another; it is not one co-expiring payoff basket.
	if (expiries.size > 1) return { ok: false, issue: "mixed-expiry" };
	const valued = legs.map((leg) => {
		const terminalValue =
			leg.kind === "stock"
				? leg.shares * spot
				: (leg.side === "long" ? 1 : -1) *
					Math.max(
						leg.option === "CALL" ? spot - leg.strike : leg.strike - spot,
						0,
					) *
					leg.contracts *
					leg.multiplier;
		const entryCost =
			leg.kind === "stock"
				? leg.shares * leg.entryPrice
				: (leg.side === "long" ? 1 : -1) *
					leg.premium *
					leg.contracts *
					leg.multiplier;
		return {
			id: leg.id,
			terminalValue,
			entryCost,
			profit: terminalValue - entryCost,
		};
	});
	const terminalValue = valued.reduce((sum, leg) => sum + leg.terminalValue, 0);
	const entryCost = valued.reduce((sum, leg) => sum + leg.entryCost, 0);
	const profit = terminalValue - entryCost - fees;
	if (
		!Number.isFinite(terminalValue) ||
		!Number.isFinite(entryCost) ||
		!Number.isFinite(profit)
	)
		return { ok: false, issue: "invalid" };
	return {
		ok: true,
		terminalValue,
		entryCost,
		fees,
		profit,
		legs: valued,
	};
}

export type StrategyExample = {
	id: string;
	label: readonly [string, string];
	note: readonly [string, string];
	focusLegId: string;
	legs: readonly StrategyLeg[];
};
export type StrategyConceptData = {
	kind: "option-strategies";
	underlying: string;
	asOf: string;
	expiry: string;
	spotRange: readonly [number, number];
	defaultSpot: number;
	feeMax: number;
	profitRange: readonly [number, number];
	terminalRange: readonly [number, number];
	examples: readonly [StrategyExample, ...StrategyExample[]];
	roll: {
		date: string;
		oldContract: string;
		newContract: string;
		quantity: number;
		multiplier: number;
		closingPrice: number;
		openingPrice: number;
	};
};
export function strategyPoints(
	legs: readonly StrategyLeg[],
	spotRange: readonly [number, number],
	fees: number,
	measure: "profit" | "terminal",
) {
	if (
		!Number.isFinite(spotRange[0]) ||
		!Number.isFinite(spotRange[1]) ||
		spotRange[0] < 0 ||
		spotRange[0] >= spotRange[1]
	)
		return null;
	const knots = [
		...new Set([
			spotRange[0],
			spotRange[1],
			...legs.flatMap((leg) => (leg.kind === "option" ? [leg.strike] : [])),
		]),
	]
		.filter((spot) => spot >= spotRange[0] && spot <= spotRange[1])
		.sort((a, b) => a - b);
	const points = knots.map((spot) => {
		const value = valueStrategy(legs, spot, fees);
		return value.ok
			? {
					spot,
					value: measure === "profit" ? value.profit : value.terminalValue,
				}
			: null;
	});
	return points.every((point) => point !== null) ? points : null;
}
/** The supplied linked transactions close the old quantity, then open the new one. Cost basis is not supplied. */
export function rollState(roll: StrategyConceptData["roll"], step: number) {
	return {
		oldQuantity: step >= 1 ? 0 : roll.quantity,
		newQuantity: step >= 2 ? roll.quantity : 0,
		cashFlow:
			(step >= 1 ? roll.closingPrice * roll.quantity * roll.multiplier : 0) -
			(step >= 2 ? roll.openingPrice * roll.quantity * roll.multiplier : 0),
	};
}
