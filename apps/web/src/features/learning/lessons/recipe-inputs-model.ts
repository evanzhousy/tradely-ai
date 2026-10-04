import {
	type Copy,
	mondayScreen,
	NEXT_SESSION_DATE,
	runScreen,
	type ScreenInputs,
	SESSION_DATE,
	screenDefaults,
	tuesdayScreen,
} from "@/content/world";

/** The screen runs the inputs lesson teaches with, shared by its film and its playground. */

export const run = (inputs: Partial<ScreenInputs>) =>
	runScreen(mondayScreen, { ...screenDefaults, ...inputs }, SESSION_DATE);
export const count = (value: number) => value.toLocaleString("en-US");
/** "1 contract", "5 contracts". */
export const contracts = (value: number) =>
	`${value} ${value === 1 ? "contract" : "contracts"}`;

export const INPUT_ROWS: readonly { id: keyof ScreenInputs; label: Copy }[] = [
	{ id: "minVolumeToOi", label: ["Min volume / OI", "最低成交量/OI"] },
	{ id: "minRelativeVolume", label: ["Min relative volume", "最低相对成交量"] },
	{ id: "minVolume", label: ["Min volume", "最低成交量"] },
	{ id: "minOpenInterest", label: ["Min OI", "最低未平仓量"] },
	{ id: "maxDte", label: ["Max DTE", "最长到期天数"] },
];

export type ChangeId = "volOi" | "date" | "premium" | "zeroDte";

export const changes: readonly {
	id: ChangeId;
	text: Copy;
	kind: "input" | "method";
	effect: Copy;
}[] = [
	{
		id: "volOi",
		text: ["Raise Min volume/OI to 2", "把最低成交量/OI 提高到 2"],
		kind: "input",
		effect: [
			`Same screen, stricter: ${run({ minVolumeToOi: 2 }).length} of ${run({}).length} contracts stay`,
			`同一个筛选，更严格：${run({}).length} 份中留下 ${run({ minVolumeToOi: 2 }).length} 份`,
		],
	},
	{
		id: "date",
		text: ["Pick Tuesday in the date picker", "在日期选择器中选择周二"],
		kind: "input",
		effect: [
			`Same question, Tuesday's data: ${runScreen(tuesdayScreen, screenDefaults, NEXT_SESSION_DATE).length} contracts`,
			`同一个问题，周二的数据：${runScreen(tuesdayScreen, screenDefaults, NEXT_SESSION_DATE).length} 份合约`,
		],
	},
	{
		id: "premium",
		text: [
			"Rank by premium instead of volume/OI",
			"改为按权利金而不是成交量/OI 排名",
		],
		kind: "method",
		effect: [
			'A different measure: "biggest money" isn\'t "unusual against open interest"',
			"换了一种度量：“金额最大”不等于“相对未平仓量异常”",
		],
	},
	{
		id: "zeroDte",
		text: ["Include same-day expiries", "纳入当天到期的合约"],
		kind: "method",
		effect: [
			"The recipe excludes 0DTE by design; including it changes what the screen is for",
			"这个 Recipe 刻意排除当天到期合约；纳入它们就改变了筛选的用途",
		],
	},
];

/** How many contracts clear a Min OI of 1,000. */
export const raised = run({ minOpenInterest: 1_000 }).length;
