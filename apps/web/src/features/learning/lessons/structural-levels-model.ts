import {
	ALFA,
	ALFA_ATR_14,
	count,
	daysToExpiry,
	gammaExposure,
	modelValue,
	modelVolatility,
	oct18OpenInterest,
	usd,
} from "@/content/world";

/** The numbers the walls and max pain lesson teaches with, shared by its film and its playground. */

export const SPOT = ALFA.open / 100;
export const STRIKES = oct18OpenInterest.map((row) => row.strike);
export const stock = (dollars: number) =>
	usd(Math.round(dollars * 100), Number.isInteger(dollars) ? 0 : 2);
export const gammaAt = (strike: number) =>
	Math.round(
		modelValue({ expiry: "oct18", strike, right: "call" }).gamma * 10_000,
	) / 10_000;

export type Side = "call" | "put";
export type Metric = "oi" | "gex";

/** Open interest, or gamma exposure in dollars per 1% move, by strike and side. */
export const metricAt = (metric: Metric, strike: number, side: Side) => {
	const row = oct18OpenInterest.find((entry) => entry.strike === strike);
	if (!row) return 0;
	return metric === "oi"
		? row[side]
		: Math.abs(gammaExposure(gammaAt(strike), row[side], SPOT, 1));
};
export const wallOf = (metric: Metric, side: Side) =>
	STRIKES.reduce((best, strike) =>
		metricAt(metric, strike, side) > metricAt(metric, best, side)
			? strike
			: best,
	);
export const metricText = (metric: Metric, value: number) =>
	metric === "oi" ? count(value) : `$${Math.round(value / 1000)}k`;

/** What Oct 18 holders would collect at expiry, in dollars, if ALFA settled at `settle`. */
export const payout = (settle: number, side?: Side) =>
	oct18OpenInterest.reduce(
		(sum, row) =>
			sum +
			(side !== "put" ? row.call * Math.max(settle - row.strike, 0) * 100 : 0) +
			(side !== "call" ? row.put * Math.max(row.strike - settle, 0) * 100 : 0),
		0,
	);
export const CANDIDATES = Array.from({ length: 36 }, (_, i) => 85 + i);
export const MAX_PAIN = CANDIDATES.reduce((best, settle) =>
	payout(settle) < payout(best) ? settle : best,
);
/** The model's one-standard-deviation range for ALFA at Oct 18, from its at-the-money IV. */
export const ONE_SD =
	SPOT * modelVolatility("oct18", 100) * Math.sqrt(daysToExpiry("oct18") / 365);

export const millions = (dollars: number) =>
	`$${(dollars / 1_000_000).toFixed(2)}M`;

export type Unit = "dollars" | "percent" | "atr";
export const PUT_WALL = wallOf("gex", "put");
export const CALL_WALL = wallOf("gex", "call");
export const distanceText = (level: number, unit: Unit) => {
	const dollars = level - SPOT;
	const sign = dollars < 0 ? "−" : "+";
	if (unit === "dollars") return `${sign}$${Math.abs(dollars)}`;
	if (unit === "percent")
		return `${sign}${Math.abs((dollars / SPOT) * 100).toFixed(1)}%`;
	return `${sign}${Math.abs(dollars / ALFA_ATR_14).toFixed(1)} ATR`;
};
