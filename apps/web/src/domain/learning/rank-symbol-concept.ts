import { activityRatio } from "./eligibility-concept";

type Copy = readonly [string, string];
export type SignedRankRow = { symbol: string; value: number };
export type ActivityRankRow = {
	symbol: string;
	volume: number | null;
	baseline: number | null;
	coverage: boolean;
	baselineComparable: boolean;
};
export type RankSymbolConceptData = {
	kind: "rank-symbols";
	source: string;
	session: string;
	signedFrames: readonly [
		readonly SignedRankRow[],
		...(readonly SignedRankRow[][]),
	];
	activity: readonly ActivityRankRow[];
	floorRange: readonly [number, number];
	handoffs: readonly {
		id: string;
		label: Copy;
		note: Copy;
		rows: readonly ActivityRankRow[];
	}[];
};
function scoreRanks<T extends { symbol: string; score: number }>(
	rows: readonly T[],
) {
	return [...rows]
		.sort((a, b) => b.score - a.score || a.symbol.localeCompare(b.symbol))
		.map((row) => ({
			...row,
			rank: 1 + rows.filter((peer) => peer.score > row.score).length,
		}));
}
export function rankSigned(rows: readonly SignedRankRow[], magnitude: boolean) {
	return scoreRanks(
		rows
			.filter((r) => Number.isFinite(r.value))
			.map((r) => ({ ...r, score: magnitude ? Math.abs(r.value) : r.value })),
	);
}
export function rankActivity(
	rows: readonly ActivityRankRow[],
	relative: boolean,
	floor: number,
) {
	const decisions = rows.map((row) => {
		const reason =
			!row.coverage ||
			row.volume === null ||
			!Number.isFinite(row.volume) ||
			row.volume < 0
				? "coverage"
				: !Number.isFinite(floor) || floor < 0
					? "floor"
					: row.volume < floor
						? "floor"
						: relative &&
								(!row.baselineComparable ||
									activityRatio(row.volume, row.baseline) === null)
							? "baseline"
							: null;
		const value =
			reason === null
				? relative
					? activityRatio(row.volume, row.baseline)
					: row.volume
				: null;
		return { row, reason, value };
	});
	const ranked = scoreRanks(
		decisions.flatMap((d) =>
			d.value === null
				? []
				: [
						{
							symbol: d.row.symbol,
							score: d.value,
							value: d.value,
							row: d.row,
						},
					],
		),
	);
	return { ranked, excluded: decisions.filter((d) => d.reason !== null) };
}
