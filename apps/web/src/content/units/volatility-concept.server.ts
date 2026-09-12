import "@tanstack/react-start/server-only";
import type {
	VolatilityConceptData,
	VolatilityPair,
} from "@/domain/learning/volatility-concept";

const pair: VolatilityPair = {
	id: "matched",
	label: ["Defined IV30 / RV20", "定义完整的 IV30 / RV20"],
	iv: {
		symbol: "PHI",
		asOf: "2030-09-13",
		value: 30,
		days: 30,
		annualized: true,
	},
	rv: {
		symbol: "PHI",
		asOf: "2030-09-13",
		value: 24,
		sessions: 20,
		annualized: true,
		method: "daily-sample",
		periodsPerYear: 252,
	},
};
export const volatilityConceptData: VolatilityConceptData = {
	kind: "implied-realized-volatility",
	asOf: "2030-09-13 16:15 ET",
	model: {
		label: "RHOX synthetic European ATM call",
		spotCents: 10000,
		days: [15, 30, 60],
		defaultDays: 30,
		initialIv: 40,
		ivRange: [0, 80],
		priceCeilingCents: 1600,
		prices: [
			{
				id: "last",
				label: ["Illustrative last price", "示例最新成交价"],
				cents: 240,
			},
			{ id: "bid", label: ["Illustrative bid", "示例买价"], cents: 228 },
			{ id: "ask", label: ["Illustrative ask", "示例卖价"], cents: 252 },
			{
				id: "missing",
				label: ["Price not supplied", "未提供价格"],
				cents: null,
			},
		],
	},
	returns: {
		symbol: "PHI synthetic session returns",
		sessionsPerYear: 252,
		windows: [8, 4],
		changeRange: [-4, 4],
		chartLimit: 6,
		values: [
			{ date: "2030-09-04", percent: 1 },
			{ date: "2030-09-05", percent: -1 },
			{ date: "2030-09-06", percent: 2 },
			{ date: "2030-09-09", percent: -2 },
			{ date: "2030-09-10", percent: 0.5 },
			{ date: "2030-09-11", percent: -0.5 },
			{ date: "2030-09-12", percent: 1 },
			{ date: "2030-09-13", percent: -1 },
		],
	},
	pairs: [
		pair,
		{
			...pair,
			id: "negative",
			label: ["IV below RV", "IV 低于 RV"],
			iv: { ...pair.iv, value: 20 },
		},
		{
			...pair,
			id: "missing",
			label: ["RV missing", "RV 缺失"],
			rv: { ...pair.rv, value: null },
		},
		{
			...pair,
			id: "identity",
			label: ["Different underlying", "不同标的"],
			rv: { ...pair.rv, symbol: "CHI" },
		},
		{
			...pair,
			id: "date",
			label: ["Older RV snapshot", "较早 RV 快照"],
			rv: { ...pair.rv, asOf: "2030-09-06" },
		},
		{
			...pair,
			id: "definition",
			label: ["Historical vol · window unknown", "历史波动率 · 窗口未知"],
			rv: { ...pair.rv, sessions: null },
		},
		{
			...pair,
			id: "sampling",
			label: ["Historical vol · sampling unknown", "历史波动率 · 采样未知"],
			rv: { ...pair.rv, method: null },
		},
	],
};
