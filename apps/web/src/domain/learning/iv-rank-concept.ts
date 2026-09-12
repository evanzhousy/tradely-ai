type Copy = readonly [string, string];
export type IvObservation = { date: string; iv: number | null };
export type IvHistorySample = {
	id: string;
	label: Copy;
	current: {
		symbol: string;
		reference: string;
		date: string;
		iv: number | null;
	};
	history: {
		symbol: string;
		reference: string;
		start: string;
		end: string;
		expectedCount: number | null;
		observations: readonly IvObservation[];
	};
};
export type IvRankConceptData = {
	kind: "iv-rank-percentile";
	experiment: {
		symbol: string;
		reference: string;
		currentDate: string;
		current: number;
		observations: readonly { date: string; iv: number }[];
	};
	currentRange: readonly [number, number];
	outlierRange: readonly [number, number];
	outlierFrames: readonly [number, ...number[]];
	samples: readonly [IvHistorySample, ...IvHistorySample[]];
};
const validIv = (iv: number | null): iv is number =>
	iv !== null && Number.isFinite(iv) && iv >= 0;
/** Current stays separate from the supplied history. Ties stay in the denominator. */
export function ivRankStatistics(
	history: readonly (number | null)[],
	current: number | null,
) {
	if (!validIv(current) || history.length === 0 || !history.every(validIv))
		return null;
	const minimum = Math.min(...history);
	const maximum = Math.max(...history);
	const below = history.filter((iv) => iv < current).length;
	const equal = history.filter((iv) => iv === current).length;
	const rawRank =
		maximum === minimum
			? null
			: ((current - minimum) / (maximum - minimum)) * 100;
	return {
		minimum,
		maximum,
		count: history.length,
		below,
		equal,
		above: history.length - below - equal,
		rank: rawRank !== null && Number.isFinite(rawRank) ? rawRank : null,
		percentile: (below / history.length) * 100,
	};
}
function day(value: string) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return Number.NaN;
	const date = Date.parse(value);
	return Number.isFinite(date) &&
		new Date(date).toISOString().slice(0, 10) === value
		? date
		: Number.NaN;
}
export function inspectIvHistory(sample: IvHistorySample): {
	issue: "reference" | "window" | "coverage" | "values" | null;
	statistics: ReturnType<typeof ivRankStatistics>;
	knownCount: number;
} {
	const { current, history } = sample;
	const knownCount = history.observations.filter((o) => validIv(o.iv)).length;
	const start = day(history.start);
	const end = day(history.end);
	const now = day(current.date);
	const dates = history.observations.map((o) => day(o.date));
	const issue =
		!current.symbol ||
		!current.reference ||
		current.symbol !== history.symbol ||
		current.reference !== history.reference
			? "reference"
			: ![start, end, now, ...dates].every(Number.isFinite) ||
					start > end ||
					end >= now ||
					dates.some((d) => d < start || d > end)
				? "window"
				: history.expectedCount === null ||
						!Number.isInteger(history.expectedCount) ||
						history.expectedCount <= 0 ||
						history.observations.length !== history.expectedCount ||
						new Set(dates).size !== dates.length
					? "coverage"
					: null;
	if (issue) return { issue, statistics: null, knownCount };
	const statistics = ivRankStatistics(
		history.observations.map((o) => o.iv),
		current.iv,
	);
	return { issue: statistics ? null : "values", statistics, knownCount };
}
