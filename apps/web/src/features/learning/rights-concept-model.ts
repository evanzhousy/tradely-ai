/** Public teaching relationships, independent of assessment cases and answers. */
export type OptionType = "CALL" | "PUT";
export type OptionRole = "long" | "short";
export type TradeSide = "buy" | "sell";

export function underlyingAction(
	type: OptionType,
	role: OptionRole,
): TradeSide {
	return (type === "CALL") === (role === "long") ? "buy" : "sell";
}

/** The inventory lab deliberately keeps each trade on one side of, or exactly at, zero. */
export function positionChange(
	before: number | null,
	side: TradeSide,
	quantity: number,
) {
	if (before === null) return { after: null, action: "unknown" as const };
	const after = before + (side === "buy" ? quantity : -quantity);
	const action =
		before * after < 0
			? ("close-and-open" as const)
			: side === "buy"
				? before < 0
					? ("buy-to-close" as const)
					: ("buy-to-open" as const)
				: before > 0
					? ("sell-to-close" as const)
					: ("sell-to-open" as const);
	return { after, action };
}

export const exerciseTerms = {
	underlying: "ALFA",
	strike: 50,
	sharesPerContract: 100,
	openingPremiumPerShare: 2,
} as const;

export function exerciseAmounts(type: OptionType, contracts: number) {
	const shares = contracts * exerciseTerms.sharesPerContract;
	return {
		shares,
		cash: shares * exerciseTerms.strike,
		openingPremium: shares * exerciseTerms.openingPremiumPerShare,
		cashFrom: type === "CALL" ? ("holder" as const) : ("writer" as const),
		sharesFrom: type === "CALL" ? ("writer" as const) : ("holder" as const),
	};
}
