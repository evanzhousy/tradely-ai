import {
	type Copy,
	count,
	type SymbolFlowRow,
	symbolFlowSessions,
	usd,
} from "@/content/world";

/** The rows and formulas the Rank-column lesson teaches with, shared by its film and its playground. */

export const MONDAY = symbolFlowSessions.monday.rows;
export const rowOf = (rows: readonly SymbolFlowRow[], symbol: string) => {
	const row = rows.find((item) => item.symbol === symbol);
	if (!row) throw new Error(`Unknown symbol ${symbol}`);
	return row;
};
export const ALFA = rowOf(MONDAY, "ALFA");
export const GLYN = rowOf(MONDAY, "GLYN");

/** Whole dollars: "$6,458". */
export const dollars = (value: number) => usd(Math.round(value * 100), 0);
/** "$1.18M", "$310K". */
export const compact = (value: number) =>
	value >= 1_000_000
		? `$${(value / 1_000_000).toFixed(2)}M`
		: `$${Math.round(value / 1_000)}K`;
/** "1 trade", "3 trades". */
export const trades = (value: number) =>
	`${count(value)} ${value === 1 ? "trade" : "trades"}`;
export const perTrade = (row: SymbolFlowRow) => row.totalPremium / row.trades;
export const byDesc = <T>(rows: readonly T[], score: (row: T) => number) =>
	[...rows].sort((a, b) => score(b) - score(a));

export type FormulaId = "sum" | "perTrade" | "share";
export type FormatId = "number" | "percent" | "currency";
export type Unit = "usd" | "count" | "ratio";

export const FORMULAS: Record<
	FormulaId,
	{
		name: Copy;
		tokens: readonly { text: string; unit?: Unit }[];
		/** The output unit the live preview names, or null when the editor refuses the formula. */
		output: Unit | null;
		value: (row: SymbolFlowRow) => number;
	}
> = {
	sum: {
		name: ["Premium plus trades", "权利金加笔数"],
		tokens: [
			{ text: "[Total Premium]", unit: "usd" },
			{ text: " + " },
			{ text: "[Trades]", unit: "count" },
		],
		output: null,
		value: (row) => row.totalPremium + row.trades,
	},
	perTrade: {
		name: ["Premium per trade", "每笔权利金"],
		tokens: [
			{ text: "[Total Premium]", unit: "usd" },
			{ text: " / " },
			{ text: "[Trades]", unit: "count" },
		],
		output: "usd",
		value: perTrade,
	},
	share: {
		name: ["Call share", "看涨占比"],
		tokens: [
			{ text: "[Call Premium]", unit: "usd" },
			{ text: " / " },
			{ text: "[Total Premium]", unit: "usd" },
		],
		output: "ratio",
		value: (row) => row.callPremium / row.totalPremium,
	},
};

export const REFUSED = "Cannot add usd and count.";

export const guardFormula = (floor: number) =>
	floor > 0
		? `IF([Trades] >= ${floor}, [Total Premium] / [Trades], NA())`
		: "[Total Premium] / [Trades]";

export const SAVED_FLOOR = 20;
export const NOTICE: Copy = [
	"A custom result is descriptive and user-defined, not a canonical TradingFlow metric or forecast.",
	"自定义结果是描述性的、由用户定义的，不是 TradingFlow 的标准指标或预测。",
];
