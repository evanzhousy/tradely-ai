type Copy = readonly [string, string];
export type GexContract = {
	gamma: number | null;
	oi: number | null;
	multiplier: number;
	spot: number;
	sign: -1 | 1 | null;
};
export type GexCell = {
	id: string;
	strike: number;
	expiry: string;
	value: number | null;
	traded: boolean;
};
export type GexSnapshot = {
	id: string;
	label: Copy;
	cells: readonly GexCell[];
};
export type GexConceptData = {
	kind: "gamma-exposure";
	symbol: string;
	asOf: string;
	model: string;
	units: Copy;
	contract: GexContract;
	oiFrames: readonly [number, ...number[]];
	oiRange: readonly [number, number];
	spotRange: readonly [number, number];
	requiredIds: readonly string[];
	strikes: readonly number[];
	expiries: readonly string[];
	snapshots: readonly [GexSnapshot, ...GexSnapshot[]];
};
const nonnegative = (value: number | null): value is number =>
	value !== null && Number.isFinite(value) && value >= 0;
/** Frozen-input teaching convention: USD delta-notional change for a +1% spot move. */
export function contractGex(input: GexContract) {
	if (
		!nonnegative(input.gamma) ||
		!nonnegative(input.oi) ||
		!Number.isInteger(input.oi) ||
		!Number.isFinite(input.multiplier) ||
		input.multiplier <= 0 ||
		!Number.isFinite(input.spot) ||
		input.spot <= 0 ||
		input.sign === null
	)
		return null;
	const value =
		input.gamma *
		input.oi *
		input.multiplier *
		input.spot ** 2 *
		0.01 *
		input.sign;
	return Number.isFinite(value) ? value : null;
}
/** Required identities define scope. A known subtotal never replaces a complete total. */
export function summarizeGex(
	cells: readonly GexCell[],
	requiredIds: readonly string[],
) {
	const ids = cells.map((c) => c.id);
	const required = new Set(requiredIds);
	const invalidScope =
		required.size === 0 ||
		required.size !== requiredIds.length ||
		new Set(ids).size !== ids.length ||
		ids.some((id) => !required.has(id));
	const known = cells.filter(
		(c) => c.value !== null && Number.isFinite(c.value),
	);
	const knownNet = invalidScope
		? null
		: known.reduce((sum, c) => sum + (c.value as number), 0);
	const knownGross = invalidScope
		? null
		: known.reduce((sum, c) => sum + Math.abs(c.value as number), 0);
	const finite =
		knownNet !== null &&
		knownGross !== null &&
		Number.isFinite(knownNet) &&
		Number.isFinite(knownGross);
	const complete = !invalidScope && finite && known.length === required.size;
	return {
		complete,
		knownCount: invalidScope ? 0 : known.length,
		requiredCount: requiredIds.length,
		knownNet: finite ? knownNet : null,
		knownGross: finite ? knownGross : null,
		net: complete ? knownNet : null,
		gross: complete ? knownGross : null,
	};
}
