type Copy = readonly [string, string];
export type LevelRow = {
	strike: number;
	expiry: string;
	callOi: number | null;
	putOi: number | null;
	callMagnitude: number | null;
	putMagnitude: number | null;
};
export type PayoutRow = {
	strike: number;
	calls: number | null;
	puts: number | null;
	multiplier: number;
};
export type LevelsConceptData = {
	kind: "structural-levels";
	symbol: string;
	asOf: string;
	model: string;
	expiries: readonly string[];
	strikes: readonly number[];
	rows: readonly LevelRow[];
	payoutSets: readonly {
		id: string;
		label: Copy;
		rows: readonly PayoutRow[];
	}[];
	candidates: readonly [number, ...number[]];
	spot: number;
	level: number;
	atr: number;
	atrWindow: string;
	spotRange: readonly [number, number];
};
export function concentration(
	rows: readonly LevelRow[],
	measure: "oi" | "gamma",
	side: "call" | "put",
	strikes: readonly number[],
	expiries: readonly string[],
) {
	const values = strikes.map((strike) => {
		const selected = rows.filter((r) => r.strike === strike);
		const raw = selected.map((r) =>
			measure === "oi"
				? side === "call"
					? r.callOi
					: r.putOi
				: side === "call"
					? r.callMagnitude
					: r.putMagnitude,
		);
		return {
			strike,
			value:
				selected.length === expiries.length &&
				new Set(selected.map((r) => r.expiry)).size === expiries.length &&
				selected.every((r) => expiries.includes(r.expiry)) &&
				raw.every((v) => v !== null && Number.isFinite(v) && v >= 0)
					? raw.reduce<number>((s, v) => s + (v as number), 0)
					: null,
		};
	});
	const complete =
		values.length > 0 &&
		values.every((v) => v.value !== null && Number.isFinite(v.value));
	const maximum = complete
		? Math.max(...values.map((v) => v.value as number))
		: null;
	return {
		values,
		winners:
			maximum !== null && maximum > 0
				? values.filter((v) => v.value === maximum).map((v) => v.strike)
				: [],
		complete,
	};
}
export function expirationPayout(
	rows: readonly PayoutRow[],
	settlement: number,
) {
	if (
		!Number.isFinite(settlement) ||
		settlement < 0 ||
		!rows.length ||
		rows.some(
			(r) =>
				!Number.isFinite(r.strike) ||
				r.strike < 0 ||
				!Number.isFinite(r.multiplier) ||
				r.multiplier <= 0 ||
				[r.calls, r.puts].some(
					(v) => v === null || !Number.isInteger(v) || v < 0,
				),
		)
	)
		return null;
	const calls = rows.reduce(
		(s, r) =>
			s +
			Math.max(settlement - r.strike, 0) * (r.calls as number) * r.multiplier,
		0,
	);
	const puts = rows.reduce(
		(s, r) =>
			s +
			Math.max(r.strike - settlement, 0) * (r.puts as number) * r.multiplier,
		0,
	);
	return [calls, puts, calls + puts].every(Number.isFinite)
		? { calls, puts, total: calls + puts }
		: null;
}
export function payoutMinima(
	rows: readonly PayoutRow[],
	candidates: readonly number[],
) {
	const values = candidates.map((price) => ({
		price,
		payout: expirationPayout(rows, price),
	}));
	if (!values.length || values.some((v) => v.payout === null)) return [];
	const minimum = Math.min(...values.map((v) => v.payout?.total as number));
	return values.filter((v) => v.payout?.total === minimum).map((v) => v.price);
}
export function levelDistances(
	level: number,
	spot: number,
	atr: number | null,
	compatible = true,
) {
	if (
		!compatible ||
		![level, spot].every(Number.isFinite) ||
		level < 0 ||
		spot <= 0
	)
		return { dollars: null, percent: null, atr: null };
	const dollars = level - spot;
	const percent = (dollars / spot) * 100;
	const normalized =
		atr !== null && Number.isFinite(atr) && atr > 0 ? dollars / atr : null;
	return {
		dollars,
		percent: Number.isFinite(percent) ? percent : null,
		atr: normalized !== null && Number.isFinite(normalized) ? normalized : null,
	};
}
