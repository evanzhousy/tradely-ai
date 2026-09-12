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
