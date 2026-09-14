import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	ExpirationProfitScene,
	PremiumUnitsScene,
	ValuePartsScene,
} from "./payoff-concept-scenes";

const scenes = [
	{
		id: "premium",
		label: ["Premium", "权利金"],
		title: ["One price, three different amounts", "一个价格，三种不同金额"],
		prompt: [
			"Change the option price and quantity. Keep the units attached to every amount.",
			"改变期权价格与数量，观察每笔金额对应的单位。",
		],
		demonstration: [
			[
				"One contract: $3 per share × 100 = $300 premium.",
				"一张合约：每股 $3 × 100 = $300 权利金。",
			],
			[
				"Two contracts double the premium to $600. The per-share price stays $3.",
				"两张合约权利金为 $600，每股价格仍为 $3。",
			],
			[
				"At $4.50 per share, two contracts cost $900 before fees. The stock-price reference stays fixed.",
				"每股 $4.50 时，两张合约费用前成本为 $900，参考股价保持不变。",
			],
		],
		Component: PremiumUnitsScene,
	},
	{
		id: "value",
		label: ["Option value", "期权价值"],
		title: ["What makes up the option's value?", "期权价值由什么组成？"],
		prompt: [
			"Compare supplied examples before expiry with intrinsic value at expiry, holding spot fixed.",
			"在标的价格保持不变的比较中，查看到期前示例报价与到期内在价值。",
		],
		demonstration: [
			[
				"Before expiry, an option can have extrinsic value even with no intrinsic value.",
				"到期前，即使内在价值为零，期权仍可有外在价值。",
			],
			[
				"Compare the supplied stock-price examples and the two portions of option value.",
				"比较给定股价示例，以及期权价值的两个组成部分。",
			],
			[
				"At expiry, extrinsic value is zero in this model. This is a comparison, not a forecast price path.",
				"本模型到期时外在价值为零；这是对比示例，不是价格路径预测。",
			],
		],
		Component: ValuePartsScene,
	},
	{
		id: "profit",
		label: ["Payoff / profit", "价值 / 盈亏"],
		title: ["In the money can still mean a loss", "实值也可能亏钱"],
		prompt: [
			"Drag the stock price along the chart. See payoff and profit respond together.",
			"沿图表拖动股票价格，观察支付价值与盈亏如何同时变化。",
		],
		demonstration: [
			[
				"Start at the strike: expiration payoff is zero, but the premium has been paid.",
				"从行权价开始：到期支付价值为零，但权利金已经支付。",
			],
			[
				"At $102 the call is in the money and still loses money. Breakeven is $103 in this example.",
				"$102 时看涨期权已实值但仍亏损，本例盈亏平衡点为 $103。",
			],
			[
				"At $103, payoff exactly covers the $3 premium per share: breakeven before fees.",
				"$103 时，支付价值恰好覆盖每股 $3 权利金，费用前盈亏平衡。",
			],
			[
				"Beyond breakeven, payoff exceeds the premium. The solid line shows profit after that cost.",
				"越过盈亏平衡点后，支付价值超过权利金，实线显示扣除成本后的盈亏。",
			],
		],
		Component: ExpirationProfitScene,
	},
] as const satisfies readonly ConceptScene[];

export function PayoffConceptLab({ locale }: { locale: Locale }) {
	return (
		<ConceptLab
			locale={locale}
			id="payoff"
			label={["Interactive premium and payoff lesson", "权利金与盈亏互动课堂"]}
			scenes={scenes}
		/>
	);
}
