import {
	type Copy,
	dayLabel,
	NEXT_SESSION_DATE,
	PREVIOUS_SESSION_DATE,
	SESSION_DATE,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";

/** The calendar and recipe the recipes lesson teaches with, shared by its film and its playground. */

export type NowId = "mon-1000" | "mon-1630" | "tue-0800" | "sat-1200";

export const SATURDAY = "2030-09-14";
export const SUNDAY = "2030-09-15";
export const days = [
	PREVIOUS_SESSION_DATE,
	SATURDAY,
	SUNDAY,
	SESSION_DATE,
	NEXT_SESSION_DATE,
];
export const sessionDays = new Set([
	PREVIOUS_SESSION_DATE,
	SESSION_DATE,
	NEXT_SESSION_DATE,
]);

/** Where "now" sits: a day and the fraction of that day, with the latest completed session. */
export const moments: Record<
	NowId,
	{ day: string; at: number; label: Copy; latest: string; why: Copy }
> = {
	"mon-1000": {
		day: SESSION_DATE,
		at: 10 / 24,
		label: ["Mon 10:00", "周一 10:00"],
		latest: PREVIOUS_SESSION_DATE,
		why: ["Monday's session is still trading", "周一的交易时段尚未结束"],
	},
	"mon-1630": {
		day: SESSION_DATE,
		at: 16.5 / 24,
		label: ["Mon 16:30", "周一 16:30"],
		latest: SESSION_DATE,
		why: ["Monday closed at 16:00", "周一已于 16:00 收盘"],
	},
	"tue-0800": {
		day: NEXT_SESSION_DATE,
		at: 8 / 24,
		label: ["Tue 8:00", "周二 8:00"],
		latest: SESSION_DATE,
		why: ["Tuesday opens at 9:30", "周二 9:30 才开盘"],
	},
	"sat-1200": {
		day: SATURDAY,
		at: 12 / 24,
		label: ["Sat 12:00", "周六 12:00"],
		latest: PREVIOUS_SESSION_DATE,
		why: ["no session on the weekend", "周末没有交易时段"],
	},
};

export const OPEN = 9.5 / 24;
export const CLOSE = 16 / 24;
/** Where a time of day sits in its column: trading hours get the middle half. */
export const dayFraction = (at: number) =>
	at <= OPEN
		? (at / OPEN) * 0.3
		: at <= CLOSE
			? 0.3 + ((at - OPEN) / (CLOSE - OPEN)) * 0.45
			: 0.75 + ((at - CLOSE) / (1 - CLOSE)) * 0.25;
/** "Mon 16" in English, "周一" in Chinese, for narrow columns. */
export const shortDay = (date: string, locale: Locale) => {
	const [en, zh] = dayLabel(date);
	return locale === "zh"
		? zh.split(" ")[1]
		: `${en.split(" ")[0]} ${en.split(" ")[2]}`;
};

/** Daily Market Recap's chapters before its Spotlight. */
export const chapters: readonly Copy[] = [
	["Market tone", "市场基调"],
	["Where the money went", "资金流向"],
	["Volatility pricing", "波动率定价"],
];
