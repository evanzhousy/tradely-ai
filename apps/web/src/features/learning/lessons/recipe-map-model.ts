import {
	type Copy,
	dayLabel,
	mondayScreen,
	NEXT_SESSION_DATE,
	runScreen,
	type ScreenContract,
	SESSION_DATE,
	screenContractLabel,
	screenDefaults,
	tuesdayScreen,
	volumeToOi,
} from "@/content/world";

/** The runs and recipe map the auditing lesson teaches with, shared by its film and its playground. */

/** One run of the unusual-activity screen at its default thresholds. */
export function screenRun(on: string, rows: readonly ScreenContract[]) {
	const passed = runScreen(rows, screenDefaults, on);
	const ratios = passed.map(volumeToOi).sort((a, b) => a - b);
	const middle = ratios.length / 2;
	const median =
		ratios.length % 2
			? ratios[Math.floor(middle)]
			: (ratios[middle - 1] + ratios[middle]) / 2;
	return {
		on,
		passed,
		names: new Set(passed.map((row) => row.symbol)).size,
		median,
		top: passed[0],
	};
}
export const MONDAY = screenRun(SESSION_DATE, mondayScreen);
export const TUESDAY = screenRun(NEXT_SESSION_DATE, tuesdayScreen);

/** The Bottom line cell's sentence for a run: it changes with the session. */
export function bottomLine(run: ReturnType<typeof screenRun>): Copy {
	const [day, dayZh] = dayLabel(run.on);
	const [top, topZh] = screenContractLabel(run.top);
	const ratio = volumeToOi(run.top).toFixed(2);
	return [
		`${day}: ${run.passed.length} contracts flagged across ${run.names} names; the highest volume/OI is ${ratio}, the ${top}.`,
		`${dayZh}：${run.names} 个标的共 ${run.passed.length} 份合约入选；成交量/OI 最高为 ${ratio}，是 ${topZh}。`,
	];
}
/** The Takeaways cell: written into the recipe, the same on every run. */
export const TAKEAWAYS: Copy = [
	"High volume/OI can be a hedge, a spread leg or a lottery ticket; the screen can't tell which.",
	"高成交量/OI 可能是对冲、价差的一条腿，也可能是彩票式押注；筛选无法区分。",
];

export type CellId = "key" | "bottom" | "table" | "takeaways";

export const INPUTS: readonly { id: string; label: Copy; short: Copy }[] = [
	{
		id: "session",
		label: ["Market session", "交易时段"],
		short: ["Session", "时段"],
	},
	{
		id: "volOi",
		label: ["Min volume / OI", "最低成交量/OI"],
		short: ["Min vol/OI", "成交量/OI"],
	},
	{
		id: "relVol",
		label: ["Min relative volume", "最低相对成交量"],
		short: ["Min rel vol", "相对成交量"],
	},
	{
		id: "volume",
		label: ["Min volume", "最低成交量"],
		short: ["Min volume", "最低成交量"],
	},
	{
		id: "oi",
		label: ["Min OI", "最低未平仓量"],
		short: ["Min OI", "最低未平仓"],
	},
	{
		id: "dte",
		label: ["Max DTE", "最长到期天数"],
		short: ["Max DTE", "最长到期"],
	},
];
export const SOURCES: readonly {
	id: "totals" | "rows";
	label: Copy;
	short: Copy;
}[] = [
	{
		id: "totals",
		label: ["Live data 1 · screen totals", "实时数据 1 · 筛选汇总"],
		short: ["Live data 1", "实时数据 1"],
	},
	{
		id: "rows",
		label: ["Live data 2 · ranked rows", "实时数据 2 · 排名行"],
		short: ["Live data 2", "实时数据 2"],
	},
];
export const CELLS: readonly {
	id: CellId;
	label: Copy;
	source: "totals" | "rows" | null;
}[] = [
	{ id: "key", label: ["Key figures", "关键数字"], source: "totals" },
	{ id: "bottom", label: ["Bottom line", "核心结论"], source: "totals" },
	{ id: "table", label: ["Ranked table", "排名表格"], source: "rows" },
	{ id: "takeaways", label: ["Takeaways", "要点"], source: null },
];
