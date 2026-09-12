import "@tanstack/react-start/server-only";
import type { TimeVolRateConceptData } from "@/domain/learning/time-vol-rate-concept";

export const timeVolRateConceptData: TimeVolRateConceptData = {
	kind: "theta-vega-rho",
	asOf: "2030-09-06 10:00 ET",
	factors: [
		{
			id: "theta",
			label: ["Theta · time", "Theta · 时间"],
			unit: ["calendar day", "自然日"],
			pointBased: false,
			before: 0,
			after: 2,
			range: [0, 5],
			step: 1,
		},
		{
			id: "vega",
			label: ["Vega · implied volatility", "Vega · 隐含波动率"],
			unit: ["IV point", "IV 点"],
			pointBased: true,
			before: 20,
			after: 23,
			range: [10, 30],
			step: 1,
		},
		{
			id: "rho",
			label: ["Rho · interest rate", "Rho · 利率"],
			unit: ["rate point", "利率点"],
			pointBased: true,
			before: 4,
			after: 4.5,
			range: [0, 8],
			step: 0.25,
		},
	],
	options: [
		{
			id: "call",
			label: ["Supplied call", "给定看涨期权"],
			contract: "UPSILON 2030-10-18 $100 CALL",
			delta: 0.5,
			greeks: { theta: -4, vega: 10, rho: 3 },
		},
		{
			id: "put",
			label: ["Supplied put", "给定看跌期权"],
			contract: "UPSILON 2030-10-18 $95 PUT",
			delta: -0.4,
			greeks: { theta: -3, vega: 12, rho: -2 },
		},
	],
	quantity: 2,
	quantityMax: 5,
	multiplier: 100,
	shocks: [
		{
			label: ["Starting snapshot", "起始快照"],
			spotCents: 0,
			changes: { theta: 0, vega: 0, rho: 0 },
		},
		{
			label: ["Add the $0.40 stock rise", "加入标的上涨 $0.40"],
			spotCents: 40,
			changes: { theta: 0, vega: 0, rho: 0 },
		},
		{
			label: ["Add two calendar days", "加入两个自然日"],
			spotCents: 40,
			changes: { theta: 2, vega: 0, rho: 0 },
		},
		{
			label: ["Add the 3-point IV fall", "加入 IV 下跌 3 点"],
			spotCents: 40,
			changes: { theta: 2, vega: -3, rho: 0 },
		},
		{
			label: ["Add the 0.5-point rate rise", "加入利率上涨 0.5 点"],
			spotCents: 40,
			changes: { theta: 2, vega: -3, rho: 0.5 },
		},
	],
	attributionNote: [
		"For the long version of this two-call example, the stock rise contributes +$40. Adding two days and a 3-point IV fall brings the estimate to −$36 before the rate effect. The replay builds contributions to one hypothetical shock; it is not sequential market repricing. Shorting reverses each contribution. Missing inputs withhold their contribution and the total.",
		"在此两张看涨期权示例的多头版本中，标的上涨贡献 +$40。加入两天与 IV 下跌 3 点后，计入利率影响前估计为 −$36。回放是在累加一个假设冲击的贡献，并非市场逐步重新定价。做空反转各项贡献。缺失输入会令对应贡献和合计不可用。",
	],
	contributionLimitCents: 8000,
};
