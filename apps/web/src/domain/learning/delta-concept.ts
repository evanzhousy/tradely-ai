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

/** Prices/changes are cents; delta and position delta retain their natural units. */
export function localDeltaChange(
	delta: number | null,
	moveCents: number,
	quantity: number,
	multiplier: number,
	side: "long" | "short",
) {
	if (
		delta === null ||
		!Number.isFinite(delta) ||
		!Number.isFinite(moveCents) ||
		!Number.isInteger(quantity) ||
		quantity < 0 ||
		!Number.isFinite(multiplier) ||
		multiplier <= 0
	)
		return null;
	const unitChangeCents = delta * moveCents;
	const positionDelta =
		delta * quantity * multiplier * (side === "long" ? 1 : -1);
	const positionChangeCents = positionDelta * moveCents;
	if (
		![unitChangeCents, positionDelta, positionChangeCents].every(
			Number.isFinite,
		)
	)
		return null;
	return { unitChangeCents, positionDelta, positionChangeCents };
}

/** Declared quadratic teaching curve, not a market-pricing or probability model. */
export function illustrativeDeltaCurve(
	curve: DeltaConceptData["curve"],
	moveCents: number,
) {
	return {
		linearPriceCents: curve.priceCents + curve.delta * moveCents,
		curvedPriceCents:
			curve.priceCents +
			curve.delta * moveCents +
			0.5 * curve.gammaPerDollar * (moveCents / 100) ** 2 * 100,
		localDelta: curve.delta + (curve.gammaPerDollar * moveCents) / 100,
	};
}
