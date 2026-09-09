import type { LearningCopy } from "./types";

export type GexCell = {
	id: string;
	strike: number;
	days: number;
	value: number | null;
};
export type GexDistribution = {
	id: string;
	label: LearningCopy;
	cells: GexCell[];
};
export type MetricsComparison = {
	gexOnly?: boolean;
	id: string;
	symbol: string;
	sessionDate: string;
	modelDate: string;
	netDex: number;
	denominators: number[];
	modelNote: LearningCopy;
	distributions: GexDistribution[];
};

/** This lesson uses the magnitude convention; signed DEX retains direction. */
export function deiMagnitude(
	netDex: number,
	denominator: number,
): number | null {
	return Number.isFinite(netDex) &&
		Number.isFinite(denominator) &&
		denominator > 0
		? (Math.abs(netDex) / denominator) * 100
		: null;
}

/** Missing contributions prevent a complete total; filtering creates a subtotal. */
export function gexTotal(
	cells: ReadonlyArray<Pick<GexCell, "value">>,
): number | null {
	return cells.length && cells.every((cell) => cell.value !== null)
		? cells.reduce((total, cell) => total + (cell.value ?? 0), 0)
		: null;
}

export function gexScale(data: MetricsComparison) {
	return Math.max(
		1,
		...data.distributions.flatMap((item) =>
			item.cells.map((cell) => Math.abs(cell.value ?? 0)),
		),
	);
}
