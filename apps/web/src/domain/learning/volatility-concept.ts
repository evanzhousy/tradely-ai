type Copy = readonly [string, string];
export type VolatilityPair = {
	id: string;
	label: Copy;
	iv: {
		symbol: string;
		asOf: string;
		value: number | null;
		days: number | null;
		annualized: boolean;
	};
	rv: {
		symbol: string;
		asOf: string;
		value: number | null;
		sessions: number | null;
		annualized: boolean;
		/** Daily simple close-to-close returns, sample SD (n-1). */
		method: "daily-sample" | null;
		periodsPerYear: number | null;
	};
};
export type VolatilityConceptData = {
	kind: "implied-realized-volatility";
	asOf: string;
	model: {
		label: string;
		spotCents: number;
		days: readonly [number, ...number[]];
		defaultDays: number;
		initialIv: number;
		ivRange: readonly [number, number];
		priceCeilingCents: number;
		prices: readonly [
			{ id: string; label: Copy; cents: number | null },
			...{ id: string; label: Copy; cents: number | null }[],
		];
	};
	returns: {
		symbol: string;
		sessionsPerYear: number;
		windows: readonly [number, ...number[]];
		values: readonly { date: string; percent: number | null }[];
		changeRange: readonly [number, number];
		chartLimit: number;
	};
	pairs: readonly [VolatilityPair, ...VolatilityPair[]];
};

/** European ATM call with rate=dividend yield=0. Prices in cents, IV in percent, ACT/365. */
export function priceAtmCall(
	spotCents: number,
	days: number,
	ivPercent: number,
): number | null {
	if (
		![spotCents, days, ivPercent].every(Number.isFinite) ||
		spotCents <= 0 ||
		days <= 0 ||
		ivPercent < 0
	)
		return null;
	if (ivPercent === 0) return 0;
	const x = ((ivPercent / 100) * Math.sqrt(days / 365)) / (2 * Math.SQRT2);
	// Abramowitz-Stegun erf approximation; benchmarked against math.erf in tests.
	const t = 1 / (1 + 0.3275911 * x);
	const erf =
		1 -
		((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
			t +
			0.254829592) *
			t *
			Math.exp(-x * x);
	const price = spotCents * erf;
	return Number.isFinite(price) ? price : null;
}
/** Monotone inversion only within the declared IV interval; missing is not a zero price. */
export function inferAtmIv(
	spotCents: number,
	days: number,
	priceCents: number | null,
	range: readonly [number, number],
): number | null {
	if (
		priceCents === null ||
		!Number.isFinite(priceCents) ||
		!range.every(Number.isFinite) ||
		range[0] < 0 ||
		range[0] >= range[1]
	)
		return null;
	const lowPrice = priceAtmCall(spotCents, days, range[0]);
	const highPrice = priceAtmCall(spotCents, days, range[1]);
	if (
		lowPrice === null ||
		highPrice === null ||
		priceCents < lowPrice ||
		priceCents > highPrice
	)
		return null;
	if (priceCents === lowPrice) return range[0];
	let low = range[0];
	let high = range[1];
	for (let i = 0; i < 60; i++) {
		const mid = (low + high) / 2;
		const price = priceAtmCall(spotCents, days, mid);
		if (price === null) return null;
		if (price < priceCents) low = mid;
		else high = mid;
	}
	return (low + high) / 2;
}
export function realizedVolatility(
	returns: readonly (number | null)[],
	sessionsPerObservation: 1 | 2,
	sessionsPerYear: number,
) {
	if (
		![1, 2].includes(sessionsPerObservation) ||
		!Number.isFinite(sessionsPerYear) ||
		sessionsPerYear <= 0 ||
		returns.length % sessionsPerObservation !== 0
	)
		return null;
	const sampled: (number | null)[] = [];
	for (let i = 0; i < returns.length; i += sessionsPerObservation) {
		const chunk = returns.slice(i, i + sessionsPerObservation);
		if (chunk.some((r) => r === null || !Number.isFinite(r) || r < -100))
			sampled.push(null);
		else {
			const value =
				sessionsPerObservation === 1
					? chunk[0]
					: ((1 + (chunk[0] as number) / 100) *
							(1 + (chunk[1] as number) / 100) -
							1) *
						100;
			sampled.push(value !== null && Number.isFinite(value) ? value : null);
		}
	}
	const periodsPerYear = sessionsPerYear / sessionsPerObservation;
	if (
		sampled.length < 2 ||
		sampled.some((r) => r === null || !Number.isFinite(r))
	)
		return {
			sampled,
			periodsPerYear,
			mean: null,
			standardDeviation: null,
			annualized: null,
		};
	const values = sampled as number[];
	const mean = values.reduce((sum, r) => sum + r, 0) / values.length;
	const variance =
		values.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (values.length - 1);
	const standardDeviation = Math.sqrt(variance);
	const annualized = standardDeviation * Math.sqrt(periodsPerYear);
	if (![mean, standardDeviation, annualized].every(Number.isFinite))
		return {
			sampled,
			periodsPerYear,
			mean: null,
			standardDeviation: null,
			annualized: null,
		};
	return { sampled, periodsPerYear, mean, standardDeviation, annualized };
}
export function compareVolatility(pair: VolatilityPair): {
	issue: "identity" | "date" | "definition" | "missing" | null;
	points: number | null;
	relativePercent: number | null;
} {
	const issue =
		!pair.iv.symbol.trim() ||
		!pair.rv.symbol.trim() ||
		pair.iv.symbol !== pair.rv.symbol
			? "identity"
			: !Number.isFinite(Date.parse(pair.iv.asOf)) ||
					!Number.isFinite(Date.parse(pair.rv.asOf)) ||
					pair.iv.asOf !== pair.rv.asOf
				? "date"
				: pair.iv.days !== 30 ||
						pair.rv.sessions !== 20 ||
						pair.rv.method !== "daily-sample" ||
						pair.rv.periodsPerYear !== 252 ||
						!pair.iv.annualized ||
						!pair.rv.annualized
					? "definition"
					: pair.iv.value === null ||
							pair.rv.value === null ||
							![pair.iv.value, pair.rv.value].every(
								(v) => Number.isFinite(v) && v >= 0,
							)
						? "missing"
						: null;
	if (issue) return { issue, points: null, relativePercent: null };
	const points = (pair.iv.value as number) - (pair.rv.value as number);
	const relative =
		pair.rv.value === 0 ? null : (points / (pair.rv.value as number)) * 100;
	return {
		issue: null,
		points,
		relativePercent:
			relative !== null && Number.isFinite(relative) ? relative : null,
	};
}
