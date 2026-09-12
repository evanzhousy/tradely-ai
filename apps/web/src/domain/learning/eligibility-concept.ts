type Copy = readonly [string, string];
export type EligibilityRow = {
	symbol: string;
	kind: "stock" | "etf";
	session: string;
	coverage: "complete" | "missing";
	volume: number | null;
	badge: string;
};
export type UniverseRule = {
	kind: "stock" | "etf" | "both";
	session: string;
	minimum: number;
};
export type CandidateDecision = {
	status: "eligible" | "excluded" | "unknown";
	reason: "kind" | "session" | "coverage" | "minimum" | "qualified";
	stage: 1 | 2 | 3 | 4;
};
export type EligibilityConceptData = {
	kind: "symbol-universe";
	source: string;
	session: string;
	rows: readonly EligibilityRow[];
	correctedRows: readonly EligibilityRow[];
	minimumRange: readonly [number, number];
	baselines: readonly { id: string; label: Copy; value: number | null }[];
	history: {
		date: string;
		currentDate: string;
		members: readonly {
			symbol: string;
			historicalMember: boolean;
			currentMember: boolean;
			volume: number | null;
			note: Copy;
		}[];
	};
};
export function assessCandidate(
	row: EligibilityRow,
	rule: UniverseRule,
): CandidateDecision {
	if (rule.kind !== "both" && row.kind !== rule.kind)
		return { status: "excluded", reason: "kind", stage: 1 };
	if (row.session !== rule.session)
		return { status: "excluded", reason: "session", stage: 2 };
	if (
		row.coverage !== "complete" ||
		row.volume === null ||
		!Number.isFinite(row.volume) ||
		row.volume < 0 ||
		!Number.isInteger(row.volume)
	)
		return { status: "unknown", reason: "coverage", stage: 3 };
	if (!Number.isFinite(rule.minimum) || rule.minimum < 0)
		return { status: "unknown", reason: "coverage", stage: 3 };
	if (row.volume < rule.minimum)
		return { status: "excluded", reason: "minimum", stage: 4 };
	return { status: "eligible", reason: "qualified", stage: 4 };
}
export function summarizeEligibility(
	rows: readonly EligibilityRow[],
	rule: UniverseRule,
) {
	const decisions = rows.map((row) => ({ row, ...assessCandidate(row, rule) }));
	const eligible = decisions.filter((d) => d.status === "eligible");
	const unknown = decisions.filter((d) => d.status === "unknown");
	const subtotal = eligible.reduce((s, d) => s + (d.row.volume as number), 0);
	const maximum = eligible.length
		? Math.max(...eligible.map((d) => d.row.volume as number))
		: null;
	const leaders =
		maximum === null
			? []
			: eligible
					.filter((d) => d.row.volume === maximum)
					.map((d) => d.row.symbol);
	return {
		decisions,
		eligible,
		unknown,
		subtotal,
		leaders,
		completeTotal: unknown.length ? null : subtotal,
	};
}
export function activityRatio(volume: number | null, baseline: number | null) {
	if (
		volume === null ||
		baseline === null ||
		![volume, baseline].every(Number.isFinite) ||
		volume < 0 ||
		baseline <= 0
	)
		return null;
	const ratio = volume / baseline;
	return Number.isFinite(ratio) ? ratio : null;
}
