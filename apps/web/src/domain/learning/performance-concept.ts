type Copy = readonly [string, string];
export type ReturnSpec = {
	start: string;
	end: string;
	currency: string;
	fees: string;
	basis: string;
};
export type PerformanceConceptData = {
	kind: "portfolio-performance";
	source: string;
	flow: {
		startCents: number;
		beforeCents: number;
		endCents: number;
		defaultFlow: number;
		frames: readonly [number, ...number[]];
		spec: ReturnSpec;
		flowAt: string;
	};
	trades: { id: string; symbol: string; pnlCents: number }[];
	lossFrames: readonly [number, ...number[]];
	benchmarks: readonly {
		id: string;
		label: Copy;
		spec: ReturnSpec;
		returnRate: number | null;
	}[];
	attribution: readonly { symbol: string; pnlCents: number | null }[];
	completeAttribution: readonly { symbol: string; pnlCents: number | null }[];
};
export function flowReturns(
	start: number | null,
	before: number | null,
	flow: number | null,
	end: number | null,
) {
	const valid = (v: number | null): v is number =>
		v !== null && Number.isFinite(v) && v >= 0;
	const after =
		valid(before) && flow !== null && Number.isFinite(flow)
			? before + flow
			: null;
	const first =
		valid(start) && start > 0 && valid(before) ? before / start - 1 : null;
	const second =
		after !== null && after > 0 && valid(end) ? end / after - 1 : null;
	const total =
		first !== null && second !== null ? (1 + first) * (1 + second) - 1 : null;
	const growth =
		valid(start) && start > 0 && valid(end) ? end / start - 1 : null;
	const finite = (v: number | null) =>
		v !== null && Number.isFinite(v) ? v : null;
	return {
		after: finite(after),
		first: finite(first),
		second: finite(second),
		twr: finite(total),
		growth: finite(growth),
	};
}
export function closedTradeStats(
	trades: readonly { id: string; pnlCents: number | null }[],
) {
	const identity = new Set(trades.map((t) => t.id)).size === trades.length;
	const known = trades.filter(
		(t) => t.pnlCents !== null && Number.isFinite(t.pnlCents),
	);
	const wins = known.filter((t) => (t.pnlCents as number) > 0);
	const losses = known.filter((t) => (t.pnlCents as number) < 0);
	const gains = wins.reduce((s, t) => s + (t.pnlCents as number), 0);
	const loss = -losses.reduce((s, t) => s + (t.pnlCents as number), 0);
	const subtotal = known.reduce((s, t) => s + (t.pnlCents as number), 0);
	const complete =
		identity &&
		trades.length > 0 &&
		known.length === trades.length &&
		[gains, loss, subtotal].every(Number.isFinite);
	return {
		complete,
		knownCount: identity ? known.length : 0,
		requiredCount: trades.length,
		subtotal: identity && Number.isFinite(subtotal) ? subtotal : null,
		total: complete ? subtotal : null,
		winRate: complete ? wins.length / trades.length : null,
		averageWin: complete && wins.length ? gains / wins.length : null,
		averageLoss: complete && losses.length ? loss / losses.length : null,
		profitFactor: complete && loss > 0 ? gains / loss : null,
	};
}
export function benchmarkDifferences(a: ReturnSpec, b: ReturnSpec) {
	const fields = ["start", "end", "currency", "fees", "basis"] as const;
	return fields.filter((key) => a[key] !== b[key]);
}
export function attributionTotal(
	rows: readonly { symbol: string; pnlCents: number | null }[],
) {
	const valid = new Set(rows.map((r) => r.symbol)).size === rows.length;
	const known = rows.filter(
		(r) => r.pnlCents !== null && Number.isFinite(r.pnlCents),
	);
	const raw = known.reduce((s, r) => s + (r.pnlCents as number), 0);
	const subtotal = valid && Number.isFinite(raw) ? raw : null;
	return {
		subtotal,
		total: rows.length > 0 && known.length === rows.length ? subtotal : null,
		knownCount: known.length,
		requiredCount: rows.length,
	};
}
