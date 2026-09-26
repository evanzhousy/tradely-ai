import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import { RightScene, SidesScene, UsesScene } from "./option-basics-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "right",
		label: ["The right", "权利"],
		title: ["An option is a right with a deadline", "期权是有期限的权利"],
		prompt: [
			"Choose a call or a put, then drag ALFA's price at expiry. See when the right is worth using.",
			"选择看涨或看跌，再拖动到期时的 ALFA 价格，看看这项权利何时值得行使。",
		],
		steps: teachingSteps(
			[
				[
					"A call on ALFA lets you buy 100 shares at $100 until October 16, for a $3 premium ($300). If ALFA ends at $95, buying at $100 makes no sense: the call expires worthless.",
					"ALFA 看涨期权让你在 10 月 16 日前以 $100 买入 100 股，权利金 $3（$300）。若 ALFA 到期时为 $95，以 $100 买入毫无意义：看涨期权作废。",
				],
				[
					"If ALFA ends at $110, the right to buy at $100 is worth $10 a share: $1,000 for the contract, against the $300 you paid.",
					"若 ALFA 到期时为 $110，以 $100 买入的权利每股值 $10：整张合约值 $1,000，而你付出了 $300。",
				],
				[
					"A put is the opposite right: to sell at $100. With ALFA at $90 it is worth $1,000; above $100 it is worth nothing.",
					"看跌期权是相反的权利：以 $100 卖出。ALFA 为 $90 时它值 $1,000；高于 $100 时一文不值。",
				],
			],
			[
				["Call expires worthless", "看涨作废"],
				["Call worth using", "看涨值得行使"],
				["Put worth using", "看跌值得行使"],
			],
		),
		Component: RightScene,
	},
	{
		id: "uses",
		label: ["Three uses", "三种用途"],
		title: ["People use options for three reasons", "人们使用期权的三种原因"],
		prompt: [
			"Switch between protecting shares, earning income and taking a view. Compare what each one costs and gives up.",
			"在保护股票、赚取收入与表达看法之间切换，比较每种用途的成本与代价。",
		],
		steps: teachingSteps(
			[
				[
					"Protect: own 100 ALFA shares and buy a $95 put for $200. Below $95 you can sell at $95, like insurance on the shares.",
					"保护：持有 100 股 ALFA，以 $200 买入 $95 看跌。股价跌破 $95 时仍可按 $95 卖出，就像给股票买了保险。",
				],
				[
					"Earn: own the shares and sell a $110 call for $150. You keep the $150, but give up gains above $110 because the shares may be called away.",
					"收入：持有股票并以 $150 卖出 $110 看涨。你保留 $150，但放弃 $110 以上的涨幅，因为股票可能被按行权价买走。",
				],
				[
					"Take a view: buy a $105 call for $250. If ALFA rises well above $105 you gain; if not, you lose at most the $250.",
					"表达看法：以 $250 买入 $105 看涨。若 ALFA 大幅高于 $105 你就获利；否则最多损失 $250。",
				],
			],
			[
				["Protect", "保护"],
				["Earn", "收入"],
				["Take a view", "表达看法"],
			],
		),
		Component: UsesScene,
	},
	{
		id: "sides",
		label: ["Two sides", "两方"],
		title: ["Every right has another side", "每项权利都有另一方"],
		prompt: [
			"Switch between a call and a put. Follow the premium and see who holds the right and who carries the obligation.",
			"在看涨与看跌之间切换，追踪权利金流向，看看谁拥有权利、谁承担义务。",
		],
		steps: teachingSteps(
			[
				[
					"Every option has two sides. The holder pays the $300 premium for the right to buy 100 shares at $100; the writer receives it and must sell if the holder uses the right.",
					"每份期权都有两方。持有人支付 $300 权利金，获得以 $100 买入 100 股的权利；义务方收取权利金，在持有人行权时必须卖出。",
				],
				[
					"For a put, the holder may sell 100 shares at $100, and the writer must buy them if assigned.",
					"对于看跌期权，持有人可以按 $100 卖出 100 股，义务方被指派时必须买入。",
				],
				[
					"The holder decides and can lose at most the premium. The writer has no choice once assigned and can lose far more.",
					"由持有人决定，最多损失权利金。义务方一旦被指派就别无选择，而且可能损失得多得多。",
				],
			],
			[
				["Call", "看涨"],
				["Put", "看跌"],
				["Compare the risks", "比较风险"],
			],
		),
		Component: SidesScene,
	},
] as const satisfies readonly ConceptScene[];

export function OptionBasicsLab({ locale }: { locale: Locale }) {
	return (
		<ConceptLab
			locale={locale}
			id="option-basics"
			label={["Interactive option basics lesson", "期权入门互动课堂"]}
			scenes={scenes}
		/>
	);
}
