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
