import type { LearningCopy } from "./types";

export type UniverseComparison = {
	id: string;
	note: LearningCopy;
	rows: Array<{
		symbol: string;
		volume: number | null;
		peerVolume: number | null;
		fresh: boolean;
		eligible: boolean;
	}>;
};

export function rankUniverse(
	data: UniverseComparison,
	admitted: string[],
	changedPeers: boolean,
) {
	const rows = data.rows.filter((row) => admitted.includes(row.symbol));
	return rows
		.map((row) => ({
			...row,
			value: changedPeers ? row.peerVolume : row.volume,
		}))
		.sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
}
