export type ActivityMetric = "relative" | "turnover";
export type ActivitySample = {
	id: string;
	contract: string;
	volume: number;
	typical: number | null;
	oi: number | null;
};
export type ActivityWindow = "hour" | "session";
export type WindowEvidence = {
	id: string;
	label: readonly [string, string];
	volume: number;
	baseline: number | null;
	currentWindow: ActivityWindow;
	baselineWindow: ActivityWindow;
	currentScope: string;
	baselineScope: string;
	completeCoverage: boolean;
};
export type ActivityConceptData = {
	kind: "unusual-activity";
	date: string;
	oiAsOf: string;
	benchmark: readonly [string, string];
	samples: readonly [ActivitySample, ...ActivitySample[]];
	denominatorMax: number;
	threshold: { initial: number; min: number; max: number; step: number };
	windowLabels: Record<ActivityWindow, readonly [string, string]>;
	windowMinutes: Record<ActivityWindow, number>;
	windows: readonly [WindowEvidence, ...WindowEvidence[]];
};
export function activityRatio(
	numerator: number | null,
	denominator: number | null,
): number | null {
	return numerator !== null &&
		denominator !== null &&
		Number.isFinite(numerator) &&
		numerator >= 0 &&
		Number.isFinite(denominator) &&
		denominator > 0
		? numerator / denominator
		: null;
}
export function activityDenominator(
	sample: ActivitySample,
	metric: ActivityMetric,
) {
	return metric === "relative" ? sample.typical : sample.oi;
}
export function compareActivityWindow(evidence: WindowEvidence) {
	const issue = !evidence.completeCoverage
		? "coverage"
		: evidence.currentScope !== evidence.baselineScope
			? "scope"
			: evidence.currentWindow !== evidence.baselineWindow
				? "window"
				: null;
	const ratio = issue
		? null
		: activityRatio(evidence.volume, evidence.baseline);
	return { ratio, issue: issue ?? (ratio === null ? "values" : null) };
}
export function summarizeActivity(
	samples: readonly ActivitySample[],
	metric: ActivityMetric,
	threshold: number,
	screenedOnly: boolean,
) {
	const rows = samples.map((sample) => {
		const ratio = activityRatio(
			sample.volume,
			activityDenominator(sample, metric),
		);
		const passes =
			ratio === null || !Number.isFinite(threshold) || threshold <= 0
				? null
				: ratio >= threshold;
		return {
			sample,
			ratio,
			passes,
			included: !screenedOnly || passes === true,
		};
	});
	const selected = rows.filter((row) => row.included);
	const complete =
		selected.length > 0 && selected.every((row) => row.ratio !== null);
	const mean = complete
		? selected.reduce((sum, row) => sum + (row.ratio as number), 0) /
			selected.length
		: null;
	const pooled = complete
		? activityRatio(
				selected.reduce((sum, row) => sum + row.sample.volume, 0),
				selected.reduce(
					(sum, row) =>
						sum + (activityDenominator(row.sample, metric) as number),
					0,
				),
			)
		: null;
	return { rows, selectedCount: selected.length, mean, pooled };
}
