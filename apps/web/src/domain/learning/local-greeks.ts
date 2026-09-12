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

/** Local Taylor terms; gamma is change in delta per $1 of underlying. */
export function gammaTerms(
	delta: number | null,
	gamma: number | null,
	moveCents: number,
) {
	if (
		delta === null ||
		gamma === null ||
		![delta, gamma, moveCents].every(Number.isFinite)
	)
		return null;
	const deltaChange = (gamma * moveCents) / 100;
	const nextDelta = delta + deltaChange;
	const deltaPriceCents = delta * moveCents;
	const gammaPriceCents = 0.5 * gamma * (moveCents / 100) ** 2 * 100;
	const totalPriceCents = deltaPriceCents + gammaPriceCents;
	if (
		![
			deltaChange,
			nextDelta,
			deltaPriceCents,
			gammaPriceCents,
			totalPriceCents,
		].every(Number.isFinite)
	)
		return null;
	return {
		deltaChange,
		nextDelta,
		deltaPriceCents,
		gammaPriceCents,
		totalPriceCents,
	};
}
