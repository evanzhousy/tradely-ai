import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	ExpirationProfitScene,
	PremiumUnitsScene,
	ValuePartsScene,
} from "./payoff-concept-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "premium",
		label: ["Premium", "权利金"],
		title: ["From option price to total premium", "从期权价格到总权利金"],
		prompt: [
			"Change the option price or number of contracts and watch the total premium.",
			"改变期权价格或合约张数，观察总权利金。",
		],
		steps: teachingSteps(
			[
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
			[
				["Price one contract", "计算一张合约"],
				["Scale to two contracts", "扩展到两张合约"],
				["Change price per share", "改变每股价格"],
			],
		),
		Component: PremiumUnitsScene,
	},
	{
		id: "value",
		label: ["Option value", "期权价值"],
		title: ["What makes up the option's value?", "期权价值由什么组成？"],
		prompt: [
			"Compare option value before expiry with intrinsic value at expiry, keeping the stock price the same.",
			"保持股票价格不变，比较到期前的期权价值与到期时的内在价值。",
		],
		steps: teachingSteps(
			[
				[
					"Before expiry, an option can have extrinsic value even with no intrinsic value.",
					"到期前，即使内在价值为零，期权仍可有外在价值。",
				],
				[
					"Compare the stock-price examples and how much value is intrinsic versus extrinsic.",
					"比较不同股价示例，看看期权价值中有多少是内在价值、多少是外在价值。",
				],
				[
					"At expiry, extrinsic value is zero in this example.",
					"在这个例子中，到期时外在价值为零。",
				],
			],
			[
				["Separate intrinsic value", "区分内在价值"],
				["Compare value components", "比较价值组成"],
				["Set extrinsic to zero", "将外在价值归零"],
			],
		),
		Component: ValuePartsScene,
	},
	{
		id: "profit",
		label: ["Payoff / profit", "价值 / 盈亏"],
		title: ["In the money can still mean a loss", "实值也可能亏钱"],
		prompt: [
			"Move the stock price and compare payoff with profit after the premium.",
			"移动股票价格，比较到期价值与扣除权利金后的盈亏。",
		],
		steps: teachingSteps(
			[
				[
					"At the strike, expiration payoff is $0, but you already paid the premium.",
					"在行权价处，到期价值为 $0，但权利金已经支付。",
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
					"Beyond breakeven, payoff is larger than the premium, so the position shows a profit before fees.",
					"超过盈亏平衡点后，到期价值高于权利金，因此费用前开始盈利。",
				],
			],
			[
				["Pay premium at strike", "在行权价计入权利金"],
				["Enter the money", "进入实值"],
				["Reach breakeven", "到达盈亏平衡"],
				["Move beyond breakeven", "越过盈亏平衡"],
			],
		),
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
