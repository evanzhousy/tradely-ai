import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import { DecayScene, SpreadScene, TailScene } from "./risk-concept-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "decay",
		label: ["Right, still losing", "方向对了仍亏钱"],
		title: [
			"A call can lose value while the stock rises",
			"股价上涨，看涨期权仍可能贬值",
		],
		prompt: [
			"Move ALFA's price, the days that have passed and implied volatility. Compare the call's value with the $4.00 you paid.",
			"调整 ALFA 价格、已过天数和隐含波动率，把看涨期权的价值与你支付的 $4.00 比较。",
		],
		steps: teachingSteps(
			[
				[
					"You pay $4.00 per share, $400 in all, for a 30-day ALFA 100 call while ALFA is $100 and implied volatility is 35%.",
					"ALFA 为 $100、隐含波动率为 35% 时，你以每股 $4.00（共 $400）买入 30 天期的 ALFA 100 看涨。",
				],
				[
					"Twenty days later ALFA is $102, but the call is worth only $3.47. Time value drained faster than the stock rose: a $53 loss.",
					"20 天后 ALFA 升到 $102，但看涨期权只值 $3.47。时间价值流失得比股价上涨更快：亏损 $53。",
				],
				[
					"After earnings, implied volatility drops to 25%. The same call is now worth $2.85: a $115 loss even though ALFA went up.",
					"财报公布后，隐含波动率降到 25%。同一张看涨只值 $2.85：虽然 ALFA 上涨了，仍亏 $115。",
				],
			],
			[
				["Buy at $4.00", "以 $4.00 买入"],
				["20 days later", "20 天后"],
				["Volatility falls", "波动率下降"],
			],
		),
		Component: DecayScene,
	},
	{
		id: "tail",
		label: ["Buyer vs writer", "买方与义务方"],
		title: [
			"A writer can lose far more than the premium",
			"义务方的亏损可能远超权利金",
		],
		prompt: [
			"Switch sides and move ALFA's price at expiry. Compare each side's best and worst case.",
			"切换买卖双方并移动到期时的 ALFA 价格，比较双方的最好与最坏情况。",
		],
		steps: teachingSteps(
			[
				[
					"A writer sells an ALFA 100 call without owning ALFA and collects $300. If ALFA ends at $100 or below, the writer keeps all $300.",
					"义务方在不持有 ALFA 的情况下卖出 ALFA 100 看涨，收取 $300。若 ALFA 收在 $100 或以下，义务方保留全部 $300。",
				],
				[
					"If ALFA ends at $120, the writer must deliver shares worth $120 for $100: a $1,700 loss. Every further $1 rise costs another $100.",
					"若 ALFA 收在 $120，义务方须以 $100 交付价值 $120 的股票：亏损 $1,700。股价每再涨 $1，再亏 $100。",
				],
				[
					"The buyer's worst case is fixed. At $90, or anywhere at or below $100, the call expires worthless and the buyer loses the $300 premium, no more.",
					"买方的最坏情况是固定的。在 $90，或任何不高于 $100 的价格，看涨期权作废，买方损失 $300 权利金，不会更多。",
				],
			],
			[
				["Writer keeps $300", "义务方保留 $300"],
				["ALFA jumps to $120", "ALFA 涨到 $120"],
				["Buyer's fixed worst case", "买方固定的最坏情况"],
			],
		),
		Component: TailScene,
	},
	{
		id: "spread",
		label: ["Trading costs", "交易成本"],
		title: [
			"A wide spread costs you before the price moves",
			"宽价差在价格变动前就让你付出成本",
		],
		prompt: [
			"Widen the bid-ask spread and see what buying 5 contracts and selling them straight back costs, including fees.",
			"拉宽买卖价差，看看买入 5 张再立即卖出要付出多少成本（含费用）。",
		],
		steps: teachingSteps(
			[
				[
					"In a busy market quoting $1.99 bid and $2.01 ask, buying 5 contracts and selling them straight back costs $10 in spread plus $6.50 in fees.",
					"在报价为买价 $1.99、卖价 $2.01 的活跃市场中，买入 5 张再立即卖出，价差成本 $10，外加 $6.50 费用。",
				],
				[
					"At $1.90 bid and $2.10 ask, the same round trip loses $100 to the spread plus $6.50 in fees: $106.50, about 10% of what you paid, before ALFA moves at all.",
					"报价为买价 $1.90、卖价 $2.10 时，同样一买一卖在价差上损失 $100，外加 $6.50 费用，共 $106.50，约为所付金额的 10%，而 ALFA 还没动。",
				],
				[
					"In a thinly traded contract quoting $1.70 bid and $2.30 ask, the round trip costs $306.50, over a quarter of what you paid. A limit order near the midpoint can help, but it may not fill.",
					"在交易清淡、报价为买价 $1.70、卖价 $2.30 的合约中，一买一卖成本达 $306.50，超过所付金额的四分之一。在中间价附近挂限价单会有帮助，但可能不成交。",
				],
			],
			[
				["Tight spread", "窄价差"],
				["$0.20 wide", "价差 $0.20"],
				["Thin market", "交易清淡"],
			],
		),
		Component: SpreadScene,
	},
] as const satisfies readonly ConceptScene[];

export function RiskConceptLab({ locale }: { locale: Locale }) {
	return (
		<ConceptLab
			locale={locale}
			id="options-risks"
			label={["Interactive options risk lesson", "期权风险互动课堂"]}
			scenes={scenes}
		/>
	);
}
