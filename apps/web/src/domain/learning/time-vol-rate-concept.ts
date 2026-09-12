import { localDeltaChange, signedPositionUnits } from "./local-greeks";

export type OtherGreek = "theta" | "vega" | "rho";
export type FactorSpec = {
	id: OtherGreek;
	label: readonly [string, string];
	unit: readonly [string, string];
	pointBased: boolean;
	before: number;
	after: number;
	range: readonly [number, number];
	step: number;
};
export type TimeVolRateSnapshot = {
	id: string;
	label: readonly [string, string];
	contract: string;
	delta: number | null;
	/** Cents per option unit, per one declared input unit. */
	greeks: Record<OtherGreek, number | null>;
};
export type GreekShock = {
	label: readonly [string, string];
	spotCents: number;
	changes: Record<OtherGreek, number>;
};
export type TimeVolRateConceptData = {
	kind: "theta-vega-rho";
	asOf: string;
	factors: readonly [FactorSpec, ...FactorSpec[]];
	options: readonly [TimeVolRateSnapshot, ...TimeVolRateSnapshot[]];
	quantity: number;
	quantityMax: number;
	multiplier: number;
	shocks: readonly [GreekShock, ...GreekShock[]];
	attributionNote: readonly [string, string];
	contributionLimitCents: number;
};
export function inputDifference(before: number, after: number) {
	if (![before, after].every(Number.isFinite)) return null;
	const change = after - before;
	if (!Number.isFinite(change)) return null;
	const relative = before === 0 ? null : (change / before) * 100;
	return {
		change,
		relativePercent:
			relative !== null && Number.isFinite(relative) ? relative : null,
	};
}
export function greekContribution(
	coefficientCents: number | null,
	inputChange: number,
	units = 1,
) {
	if (
		coefficientCents === null ||
		![coefficientCents, inputChange, units].every(Number.isFinite)
	)
		return null;
	const value = coefficientCents * inputChange * units;
	return Number.isFinite(value) ? value : null;
}
export function combineGreekShock(
	snapshot: TimeVolRateSnapshot,
	shock: GreekShock,
	quantity: number,
	multiplier: number,
	side: "long" | "short",
) {
	const units = signedPositionUnits(quantity, multiplier, side);
	if (units === null || shock.changes.theta < 0) return null;
	const contributions = {
		spot:
			localDeltaChange(
				snapshot.delta,
				shock.spotCents,
				quantity,
				multiplier,
				side,
			)?.positionChangeCents ?? null,
		theta: greekContribution(snapshot.greeks.theta, shock.changes.theta, units),
		vega: greekContribution(snapshot.greeks.vega, shock.changes.vega, units),
		rho: greekContribution(snapshot.greeks.rho, shock.changes.rho, units),
	};
	const values = Object.values(contributions);
	const sum = values.every((v) => v !== null)
		? values.reduce((total, value) => total + value, 0)
		: null;
	return {
		contributions,
		totalCents: sum !== null && Number.isFinite(sum) ? sum : null,
	};
}
