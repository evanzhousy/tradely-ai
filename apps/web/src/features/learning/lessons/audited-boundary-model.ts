import { mondayActivity } from "@/content/world";

/** Monday volume by Oct 18 call series; the 120 call's arrives only on Tuesday. */
export const SERIES = [
	{ strike: 100, volume: mondayActivity[0].volume },
	{ strike: 105, volume: mondayActivity[1].volume },
	{ strike: 110, volume: mondayActivity[2].volume },
	{ strike: 115, volume: 0 },
	{ strike: 120, volume: null as number | null },
];
export const COVERED = SERIES.reduce((sum, row) => sum + (row.volume ?? 0), 0);
/** The 120 call's contracts, which arrive on Tuesday. */
export const LATE = 30;
export const WITH_LATE = COVERED + LATE;
export const LEADER = SERIES[2];
/** One leg of a single spread inside the leader's volume. */
export const SPREAD_LEG = 500;
export const share = (part: number, whole: number) =>
	`${Math.round((part / whole) * 100)}%`;
