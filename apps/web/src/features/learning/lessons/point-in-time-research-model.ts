import {
	type Copy,
	oct105CallBlock,
	oct105CallMessages,
	usd,
} from "@/content/world";

export const report = oct105CallMessages.find((message) => message.id === "M5");
export const correction = oct105CallMessages.find(
	(message) => message.id === "M6",
);
export const REPORTED = report?.price ?? 0;
export const CORRECTED = correction?.price ?? 0;
export const CORRECTED_AT = correction?.received ?? "";

/** Monday's facts in the order they reached the system, each with the time it happened. */
export const arrivals: readonly {
	id: string;
	arrived: Copy;
	fact: Copy;
	event: Copy;
}[] = [
	{
		id: "t1",
		arrived: ["Mon 10:12:05.1", "周一 10:12:05.1"],
		fact: ["T-1: 5 @ $2.00", "T-1：5 张 @ $2.00"],
		event: ["event 10:12:05.0", "事件 10:12:05.0"],
	},
	{
		id: "t3",
		arrived: [
			`Mon ${report?.received ?? ""}`,
			`周一 ${report?.received ?? ""}`,
		],
		fact: [`T-3: 500 @ ${usd(REPORTED)}`, `T-3：500 张 @ ${usd(REPORTED)}`],
		event: [`event ${oct105CallBlock.time}`, `事件 ${oct105CallBlock.time}`],
	},
	{
		id: "fix",
		arrived: [`Mon ${CORRECTED_AT}`, `周一 ${CORRECTED_AT}`],
		fact: [
			`T-3 corrected to ${usd(CORRECTED)}`,
			`T-3 更正为 ${usd(CORRECTED)}`,
		],
		event: [`event ${oct105CallBlock.time}`, `事件 ${oct105CallBlock.time}`],
	},
	{
		id: "late",
		arrived: ["Tue 09:00", "周二 09:00"],
		fact: ["Oct 18 120 call: 30", "10月18日 120 看涨：30"],
		event: ["event: Monday's session", "事件：周一交易时段"],
	},
];

/** Each decision time and the first arrival it can't see yet. */
export const cutoffs: readonly { time: Copy; before: number }[] = [
	{ time: ["Mon 10:50:01", "周一 10:50:01"], before: 2 },
	{ time: ["Mon 10:51", "周一 10:51"], before: 3 },
	{ time: ["Mon 16:05", "周一 16:05"], before: 3 },
];

export const BLOCK = oct105CallBlock.quantity;
export const weightAt = (minute: number, halfLife: number) =>
	BLOCK * 0.5 ** (minute / halfLife);
/** Minutes after the 10:50 block as a clock time. */
export const clock = (minute: number) => {
	const total = 10 * 60 + 50 + minute;
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

/** The 105 call's volume against its typical level on each of the last 60 sessions. */
export const history: readonly { from: number; days: number }[] = [
	{ from: 0, days: 9 },
	{ from: 0.5, days: 21 },
	{ from: 1, days: 16 },
	{ from: 1.5, days: 7 },
	{ from: 2, days: 3 },
	{ from: 2.5, days: 2 },
	{ from: 3, days: 0 },
	{ from: 3.5, days: 0 },
	{ from: 4, days: 0 },
	{ from: 4.5, days: 2 },
];
export const BUCKET = 0.5;
/** Monday: 505 contracts against a typical 120. */
export const TODAY = 4.2;
export const SESSIONS = history.reduce((sum, bucket) => sum + bucket.days, 0);
export const LOWER = history
	.filter((bucket) => bucket.from + BUCKET <= TODAY)
	.reduce((sum, bucket) => sum + bucket.days, 0);
export const PERCENTILE = Math.round((LOWER / SESSIONS) * 100);

/** How often ALFA rose the next day after its call volume topped each threshold, Jan–Jun. */
export const tried: readonly { threshold: number; rose: number }[] = [
	{ threshold: 1.5, rose: 51 },
	{ threshold: 2, rose: 53 },
	{ threshold: 2.5, rose: 49 },
	{ threshold: 3, rose: 56 },
	{ threshold: 3.5, rose: 54 },
	{ threshold: 4, rose: 70 },
	{ threshold: 4.5, rose: 58 },
	{ threshold: 5, rose: 50 },
	{ threshold: 5.5, rose: 47 },
	{ threshold: 6, rose: 55 },
];
export const best = tried.reduce((a, b) => (b.rose > a.rose ? b : a));
/** The frozen rule, run once on July and August. */
export const HOLDOUT = 52;
