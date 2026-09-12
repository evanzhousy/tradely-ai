import { signedPositionUnits } from "./local-greeks";
export type ExposureGreeks = {
	delta: number | null;
	gamma: number | null;
	theta: number | null;
	vega: number | null;
};
export type ExposureHolding = {
	id: string;
	quantity: number;
	multiplier: number;
	side: "long" | "short";
	greeks: ExposureGreeks;
	at: string;
	vegaScale: "point" | "unit";
};
export type PortfolioExposureData = {
	kind: "portfolio-exposure";
	source: string;
	underlying: string;
	at: string;
	stock: number;
	calls: ExposureHolding;
	put: ExposureHolding;
	hedgeFrames: readonly [number, ...number[]];
	moveFrames: readonly [number, ...number[]];
};
export function positionExposure(
	row: ExposureHolding,
	at: string,
): ExposureGreeks {
	const units = signedPositionUnits(row.quantity, row.multiplier, row.side);
	const value = (v: number | null, scale = 1) => {
		if (units === null || row.at !== at || v === null || !Number.isFinite(v))
			return null;
		const result = (v * units) / scale;
		return Number.isFinite(result) ? result : null;
	};
	return {
		delta: value(row.greeks.delta),
		gamma: value(row.greeks.gamma),
		theta: value(row.greeks.theta),
		vega: value(row.greeks.vega, row.vegaScale === "unit" ? 100 : 1),
	};
}
export function exposureSum(values: readonly (number | null)[]) {
	const known = values.filter(
		(v): v is number => v !== null && Number.isFinite(v),
	);
	const raw = known.reduce((a, b) => a + b, 0);
	const subtotal = Number.isFinite(raw) ? raw : null;
	return {
		subtotal,
		total:
			values.length > 0 && known.length === values.length ? subtotal : null,
		known: known.length,
		required: values.length,
	};
}
export function localExposureScenario(
	delta: number,
	gamma: number,
	theta: number,
	vega: number,
	spotMove: number,
	ivPoints: number,
	days: number,
) {
	const deltaTerm = delta * spotMove;
	const gammaTerm = 0.5 * gamma * spotMove ** 2;
	const volTerm = vega * ivPoints;
	const timeTerm = theta * days;
	return {
		deltaTerm,
		gammaTerm,
		volTerm,
		timeTerm,
		total: deltaTerm + gammaTerm + volTerm + timeTerm,
		nextDelta: delta + gamma * spotMove,
	};
}
