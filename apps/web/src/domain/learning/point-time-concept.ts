type Copy = readonly [string, string];
export type KnowledgeRecord = {
	id: string;
	key: string;
	version: number;
	eventSeconds: number;
	receivedSeconds: number | null;
	contracts: number | null;
};
export type ScoreReport = {
	id: string;
	label: Copy;
	current: number;
	mean: number;
	deviation: number | null;
	count: number;
	below: number;
	minimumCount: number;
	comparable: boolean;
	complete: boolean;
};
export type EvaluationCase = {
	id: string;
	score: number;
	returnPercent: number;
};
export type PointTimeConceptData = {
	kind: "point-in-time-research";
	source: string;
	date: string;
	records: readonly KnowledgeRecord[];
	cutoffFrames: readonly [number, ...number[]];
	decay: {
		initial: number;
		halfLife: number;
		rawContracts: number;
		rawEvents: number;
		frames: readonly [number, ...number[]];
	};
	reports: readonly ScoreReport[];
	evaluation: {
		threshold: number;
		developmentPeriod: string;
		heldoutPeriod: string;
		development: readonly EvaluationCase[];
		heldout: readonly EvaluationCase[];
	};
};
/** Receipt gates availability; the supplied source revision number determines supersession. */
export function knownRecords(
	records: readonly KnowledgeRecord[],
	cutoff: number,
) {
	if (!Number.isFinite(cutoff) || cutoff < 0) return [];
	const available = records.filter(
		(r) =>
			Number.isFinite(r.eventSeconds) &&
			r.eventSeconds >= 0 &&
			r.receivedSeconds !== null &&
			Number.isFinite(r.receivedSeconds) &&
			r.receivedSeconds >= r.eventSeconds &&
			r.eventSeconds <= cutoff &&
			r.receivedSeconds <= cutoff,
	);
	const latest = new Map<string, KnowledgeRecord>();
	for (const r of available) {
		const prior = latest.get(r.key);
		if (
			!prior ||
			r.version > prior.version ||
			(r.version === prior.version &&
				(r.receivedSeconds as number) > (prior.receivedSeconds as number))
		)
			latest.set(r.key, r);
	}
	return [...latest.values()];
}
export function recencyWeight(
	initial: number,
	elapsed: number,
	halfLife: number | null,
) {
	if (
		!Number.isFinite(initial) ||
		initial < 0 ||
		!Number.isFinite(elapsed) ||
		elapsed < 0 ||
		halfLife === null ||
		!Number.isFinite(halfLife) ||
		halfLife <= 0
	)
		return null;
	return initial * 2 ** (-elapsed / halfLife);
}
export function describeScore(report: ScoreReport) {
	const reason = !report.complete
		? "coverage"
		: !report.comparable
			? "baseline"
			: !Number.isInteger(report.count) ||
					report.count < report.minimumCount ||
					report.count <= 0
				? "sample-policy"
				: null;
	if (reason) return { reason, percentile: null, z: null };
	const percentile =
		Number.isInteger(report.below) &&
		report.below >= 0 &&
		report.below <= report.count
			? (report.below / report.count) * 100
			: null;
	const z =
		report.deviation !== null &&
		Number.isFinite(report.deviation) &&
		report.deviation > 0 &&
		Number.isFinite(report.current) &&
		Number.isFinite(report.mean)
			? (report.current - report.mean) / report.deviation
			: null;
	return { reason, percentile, z: z !== null && Number.isFinite(z) ? z : null };
}
export function evaluationMatches(
	cases: readonly EvaluationCase[],
	threshold: number,
) {
	if (
		!Number.isFinite(threshold) ||
		!cases.length ||
		cases.some((c) => ![c.score, c.returnPercent].every(Number.isFinite))
	)
		return null;
	return cases.filter((c) => c.score >= threshold === c.returnPercent > 0)
		.length;
}

export function knownContractSum(records: readonly KnowledgeRecord[]) {
	if (
		records.some(
			(r) =>
				r.contracts === null ||
				!Number.isFinite(r.contracts) ||
				r.contracts < 0,
		)
	)
		return null;
	const total = records.reduce((s, r) => s + (r.contracts as number), 0);
	return Number.isFinite(total) ? total : null;
}
