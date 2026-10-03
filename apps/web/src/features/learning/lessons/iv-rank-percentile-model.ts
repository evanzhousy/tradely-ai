import {
	ALFA_IV30_TODAY,
	alfaIv30Weekly,
	type Copy,
	pick,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";

/** The numbers the IV rank and percentile lesson teaches with, shared by its film and its playground. */

export const WEEKS = alfaIv30Weekly.length;
export const SHOCK = alfaIv30Weekly.indexOf(Math.max(...alfaIv30Weekly));
/** A vendor outage that lost eight weeks of history, shock included. */
export const GAP = { from: 20, to: 27 } as const;
export const RECENT = 13;

export type Mark = "none" | "rank" | "percentile" | "both";
export type View = {
	mark: Mark;
	today: number;
	dropShock: boolean;
	recent: boolean;
	gaps: boolean;
};

/** The weeks a view counts, by index. */
export function counted(view: View) {
	return alfaIv30Weekly
		.map((value, i) => ({ value, i }))
		.filter(
			({ i }) =>
				(!view.recent || i >= WEEKS - RECENT) &&
				!(view.dropShock && i === SHOCK) &&
				!(view.gaps && i >= GAP.from && i <= GAP.to),
		);
}

export function stats(view: View) {
	const weeks = counted(view);
	const values = weeks.map((week) => week.value);
	const low = Math.min(...values);
	const high = Math.max(...values);
	const below = values.filter((value) => value < view.today).length;
	return {
		n: values.length,
		low,
		high,
		below,
		rank: (view.today - low) / (high - low),
		percentile: below / values.length,
	};
}

export const pct = (fraction: number) => `${Math.round(fraction * 100)}%`;
export const rankText = (rank: number, locale: Locale) =>
	rank > 1
		? pick(["above the high", "高于最高值"] as Copy, locale)
		: rank < 0
			? pick(["below the low", "低于最低值"] as Copy, locale)
			: pct(rank);

export const base: View = {
	mark: "none",
	today: ALFA_IV30_TODAY,
	dropShock: false,
	recent: false,
	gaps: false,
};
export const year = stats({ ...base, mark: "both" });
export const noShock = stats({ ...base, mark: "both", dropShock: true });
export const recent = stats({ ...base, mark: "both", recent: true });
export const gapped = stats({ ...base, mark: "both", gaps: true });

/** With the shock week back in, the IV30 that earns the rank today has without it. */
export const SAME_RANK_AT =
	Array.from({ length: 51 }, (_, i) => 20 + i).find(
		(today) => stats({ ...base, mark: "both", today }).rank >= noShock.rank,
	) ?? 70;
