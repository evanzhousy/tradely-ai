export type PositionEffect = "open" | "close";
export type OiTrade = {
	kind: "trade";
	time: string;
	quantity: number;
	buyer: PositionEffect;
	seller: PositionEffect;
};
export type OiRemoval = { kind: "exercise"; time: string; quantity: number };
export type OiEvent = OiTrade | OiRemoval;
export type CohortMode = "fixed" | "rolling";
export type CohortSeries = {
	id: string;
	expiry: string;
	dte: readonly [number, number];
	oi: readonly [number | null, number | null];
};
export type OiConceptData = {
	kind: "session-flow-vs-structure";
	contract: string;
	sessionDate: string;
	initialReport: { value: number; asOf: string };
	nextReport: { value: number; asOf: string; published: string };
	defaultQuantity: number;
	maxQuantity: number;
	combinations: readonly [
		{ buyer: PositionEffect; seller: PositionEffect },
		...{ buyer: PositionEffect; seller: PositionEffect }[],
	];
	events: readonly OiEvent[];
	cohortScope: string;
	reportDates: readonly [string, string];
	dteRange: readonly [number, number];
	series: readonly CohortSeries[];
};
/** Two counterparties share one contract count. Flags here are supplied, never inferred from a print. */
export function tradeOiChange(
	buyer: PositionEffect,
	seller: PositionEffect,
	quantity: number,
) {
	return buyer === seller ? (buyer === "open" ? quantity : -quantity) : 0;
}
export function replayOi(
	data: OiConceptData,
	stage: number,
	completeLedger: boolean,
) {
	const visible = data.events.slice(
		0,
		Math.max(0, Math.min(data.events.length, Math.floor(stage))),
	);
	const volume = visible.reduce(
		(sum, e) => sum + (e.kind === "trade" ? e.quantity : 0),
		0,
	);
	const calculated = completeLedger
		? data.initialReport.value +
			visible.reduce(
				(sum, e) =>
					sum +
					(e.kind === "trade"
						? tradeOiChange(e.buyer, e.seller, e.quantity)
						: -e.quantity),
				0,
			)
		: null;
	const published = stage > data.events.length;
	return {
		volume,
		calculated,
		reported: published ? data.nextReport.value : data.initialReport.value,
		asOf: published ? data.nextReport.asOf : data.initialReport.asOf,
		published,
	};
}
export function cohortMembers(
	series: readonly CohortSeries[],
	range: readonly [number, number],
	mode: CohortMode,
	report: 0 | 1,
) {
	const index = mode === "fixed" ? 0 : report;
	return series.filter(
		(s) => s.dte[index] >= range[0] && s.dte[index] <= range[1],
	);
}
function knownSum(values: readonly (number | null)[]): number | null {
	return values.some((v) => v === null || !Number.isFinite(v))
		? null
		: (values as readonly number[]).reduce((sum, v) => sum + v, 0);
}
export function compareCohorts(
	series: readonly CohortSeries[],
	range: readonly [number, number],
	mode: CohortMode,
) {
	const before = cohortMembers(series, range, mode, 0);
	const after = cohortMembers(series, range, mode, 1);
	const first = knownSum(before.map((s) => s.oi[0]));
	const second = knownSum(after.map((s) => s.oi[1]));
	const entered = after.filter((s) => !before.some((b) => b.id === s.id));
	const exited = before.filter((s) => !after.some((a) => a.id === s.id));
	const retained = before.filter((s) => after.some((a) => a.id === s.id));
	return {
		before,
		after,
		first,
		second,
		delta: first === null || second === null ? null : second - first,
		entered,
		exited,
		entryOi: knownSum(entered.map((s) => s.oi[1])),
		exitOi: knownSum(exited.map((s) => s.oi[0])),
		retainedChange: knownSum(
			retained.map((s) =>
				s.oi[0] === null || s.oi[1] === null ? null : s.oi[1] - s.oi[0],
			),
		),
	};
}
