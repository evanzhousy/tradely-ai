import { gammaTerms } from "./local-greeks";

export type DeltaOption = {
	id: string;
	label: readonly [string, string];
	contract: string;
	priceCents: number;
	delta: number;
};
export type DeltaConceptData = {
	kind: "delta";
	asOf: string;
	underlying: string;
	spotCents: number;
	options: readonly [DeltaOption, ...DeltaOption[]];
	localMoveRange: readonly [number, number];
	defaultMoveCents: number;
	localPriceRange: readonly [number, number];
	defaultQuantity: number;
	quantityMax: number;
	multipliers: readonly [number, ...number[]];
	positionMoveCents: number;
	curve: {
		priceCents: number;
		delta: number;
		gammaPerDollar: number;
		moveRange: readonly [number, number];
		priceRange: readonly [number, number];
		frames: readonly [number, ...number[]];
	};
};

/** Declared quadratic teaching curve, not a market-pricing or probability model. */
export function illustrativeDeltaCurve(
	curve: DeltaConceptData["curve"],
	moveCents: number,
) {
	const terms = gammaTerms(curve.delta, curve.gammaPerDollar, moveCents);
	if (!terms) throw new Error("Invalid declared teaching curve");
	return {
		linearPriceCents: curve.priceCents + terms.deltaPriceCents,
		curvedPriceCents: curve.priceCents + terms.totalPriceCents,
		localDelta: terms.nextDelta,
	};
}
