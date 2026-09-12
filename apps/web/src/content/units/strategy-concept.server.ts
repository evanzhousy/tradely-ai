import "@tanstack/react-start/server-only";
import type {
	StrategyConceptData,
	StrategyLeg,
} from "@/domain/learning/strategy-concept";

const expiry = "2030-09-20";
const stock: StrategyLeg = {
	kind: "stock",
	id: "stock",
	shares: 100,
	entryPrice: 10000,
};
const longCall: StrategyLeg = {
	kind: "option",
	id: "long-call",
	option: "CALL",
	side: "long",
	strike: 10000,
	expiry,
	contracts: 1,
	multiplier: 100,
	premium: 600,
};
const shortCall: StrategyLeg = {
	...longCall,
	id: "short-call",
	side: "short",
	strike: 11000,
	premium: 200,
};
const put: StrategyLeg = {
	...longCall,
	id: "put",
	option: "PUT",
	premium: 400,
};
export const strategyConceptData: StrategyConceptData = {
	kind: "option-strategies",
	underlying: "MU illustrative equity",
	asOf: "2030-06-03",
	expiry,
	spotRange: [6000, 14000],
	defaultSpot: 11500,
	feeMax: 10000,
	profitRange: [-400000, 400000],
	terminalRange: [-400000, 1500000],
	examples: [
		{
			id: "vertical",
			label: ["Long call vertical", "多头看涨垂直价差"],
			focusLegId: "short-call",
			legs: [longCall, shortCall],
			note: [
				"The long lower-strike call and short higher-strike call share an expiry. Together they cap both the upside payoff and the initial-premium loss in this expiry illustration.",
				"较低行权价多头看涨与较高行权价空头看涨拥有同一到期日。在此到期示例中，组合同时限制上涨支付价值与初始权利金损失。",
			],
		},
		{
			id: "protective",
			label: ["Protective put", "保护性看跌"],
			focusLegId: "put",
			legs: [stock, put],
			note: [
				"The stock remains in the supplied structure. The put can protect it; the put print alone does not establish the investor's complete outlook.",
				"给定结构中仍持有股票。看跌期权可提供保护；仅看跌成交不能确定投资者完整观点。",
			],
		},
		{
			id: "covered",
			label: ["Covered call", "备兑看涨"],
			focusLegId: "short-call",
			legs: [stock, shortCall],
			note: [
				"The supplied 100 shares cover one short call with multiplier 100. Upside is capped, while the stock still carries downside risk.",
				"给定的 100 股覆盖一张乘数为 100 的空头看涨。上涨收益受限，而股票仍有下跌风险。",
			],
		},
		{
			id: "uncovered",
			label: ["Uncovered short call", "未备兑空头看涨"],
			focusLegId: "short-call",
			legs: [shortCall],
			note: [
				"This supplied example has no covering stock. Loss keeps growing as the underlying rises beyond the plotted window; the chart edge is not a maximum loss.",
				"给定示例没有覆盖股票。标的继续上涨至图表范围之外时，损失仍会扩大；图表边缘不是最大损失。",
			],
		},
		{
			id: "straddle",
			label: ["Long straddle", "多头跨式"],
			focusLegId: "long-call",
			legs: [longCall, put],
			note: [
				"The long call and put share a strike and expiry. Their combined premium matters; a large move is needed to offset it in this expiry illustration.",
				"多头看涨与看跌具有相同行权价和到期日。应计入两者权利金；在此到期示例中，需要较大价格变动才能抵消成本。",
			],
		},
		{
			id: "collar",
			label: ["Collar", "领口策略"],
			focusLegId: "put",
			legs: [stock, { ...put, strike: 9500, premium: 300 }, shortCall],
			note: [
				"Stock, a lower-strike long put and a higher-strike short call create a floor and cap for the supplied expiry value. The complete linked structure matters.",
				"股票、较低行权价多头看跌与较高行权价空头看涨，为给定到期价值形成下限和上限。必须检查完整关联结构。",
			],
		},
	],
	roll: {
		date: "2030-09-13",
		oldContract: "NU 2030-09-20 $100 CALL",
		newContract: "NU 2030-10-18 $100 CALL",
		quantity: 1,
		multiplier: 100,
		closingPrice: 500,
		openingPrice: 700,
	},
};
