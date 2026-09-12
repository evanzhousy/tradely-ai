import { signedPositionUnits } from "./local-greeks";

type Copy = readonly [string, string];
export type CrossDeltaConvention = {
	id: string;
	label: Copy;
	charm: number | null;
	timeBasis: "elapsed-day" | "remaining-day" | null;
	vanna: number | null;
	volBasis: "iv-point" | "vol-decimal" | null;
};
export type CharmVannaConceptData = {
	kind: "charm-vanna";
	reference: string;
	asOf: string;
	initialDelta: number;
	conventions: readonly [CrossDeltaConvention, ...CrossDeltaConvention[]];
	frames: readonly [
		{ days: number; ivPoints: number },
		...{ days: number; ivPoints: number }[],
	];
	dayRange: readonly [number, number];
	ivRange: readonly [number, number];
	quantity: number;
	multiplier: number;
	events: readonly {
		id: string;
		label: Copy;
		days: number;
		ivPoints: number;
	}[];
};
export function crossDeltaTerms(
	convention: CrossDeltaConvention,
	days: number,
	ivPoints: number,
) {
	const finite = (v: number | null) =>
		v !== null && Number.isFinite(v) ? v : null;
	const timeChange =
		Number.isFinite(days) && days >= 0 && convention.timeBasis !== null
			? convention.timeBasis === "elapsed-day"
				? days
				: -days
			: null;
	const volChange =
		Number.isFinite(ivPoints) && convention.volBasis !== null
			? convention.volBasis === "iv-point"
				? ivPoints
				: ivPoints / 100
			: null;
	const charm =
		convention.charm !== null && timeChange !== null
			? finite(convention.charm * timeChange)
			: null;
	const vanna =
		convention.vanna !== null && volChange !== null
			? finite(convention.vanna * volChange)
			: null;
	return {
		timeChange,
		volChange,
		charm,
		vanna,
		total: charm !== null && vanna !== null ? finite(charm + vanna) : null,
	};
}
export function crossPositionChange(
	deltaChange: number | null,
	quantity: number,
	multiplier: number,
	side: "long" | "short",
	known = true,
) {
	const units = signedPositionUnits(quantity, multiplier, side);
	if (
		!known ||
		deltaChange === null ||
		!Number.isFinite(deltaChange) ||
		units === null
	)
		return null;
	const result = deltaChange * units;
	return Number.isFinite(result) ? result : null;
}
