import "@tanstack/react-start/server-only";
import type {
	SurfaceConceptData,
	WingExample,
} from "@/domain/learning/surface-concept";

const reference = {
	expiry: "2030-10-18",
	convention: "Forward delta · premium-unadjusted · ATM-forward",
	source: "Midquote-derived reference",
};
const complete: WingExample = {
	id: "complete",
	label: ["Compatible supplied references", "兼容的给定参考"],
	put: { ...reference, iv: 32 },
	call: { ...reference, iv: 26 },
	atm: { ...reference, iv: 24 },
};
export const surfaceConceptData: SurfaceConceptData = {
	kind: "volatility-surface",
	symbol: "OMEGA illustrative IV surface",
	modelLabel: [
		"European model · rate = dividend yield = 0",
		"欧式模型 · 利率 = 股息率 = 0",
	],
	asOf: "2030-09-06 16:15 ET",
	spot: 100,
	strikes: [90, 100, 110],
	expiries: [
		{ date: "2030-09-20", days: 14 },
		{ date: "2030-10-18", days: 42 },
		{ date: "2030-12-20", days: 105 },
	],
	datasets: [
		{
			id: "quote",
			label: ["Midquote-derived call IV", "中间报价推导的看涨 IV"],
			values: [
				[34, 28, 30],
				[32, 24, null],
				[30, 26, 28],
			],
		},
		{
			id: "trade",
			label: ["Traded-only call IV", "仅成交推导的看涨 IV"],
			values: [
				[null, 28.5, null],
				[31.5, null, null],
				[null, 26.5, 28.2],
			],
		},
	],
	ivCeiling: 45,
	wings: [
		complete,
		{
			...complete,
			id: "call-missing",
			label: ["Call wing missing", "看涨翼缺失"],
			call: { ...complete.call, iv: null },
		},
		{
			...complete,
			id: "atm-missing",
			label: ["ATM reference missing", "ATM 参考缺失"],
			atm: { ...complete.atm, iv: null },
		},
		{
			...complete,
			id: "expiry",
			label: ["Call uses another expiry", "看涨使用另一到期日"],
			call: { ...complete.call, expiry: "2030-12-20" },
		},
		{
			...complete,
			id: "convention",
			label: ["Call uses premium-adjusted delta", "看涨使用权利金调整 Delta"],
			call: { ...complete.call, convention: "Premium-adjusted delta" },
		},
		{
			...complete,
			id: "source",
			label: ["Call uses a trade-derived reference", "看涨使用成交推导参考"],
			call: { ...complete.call, source: "Trade-derived reference" },
		},
	],
	anchors: [
		{ days: 14, iv: 28 },
		{ days: 42, iv: 24 },
	],
	targetRange: [7, 70],
	defaultTarget: 30,
};
