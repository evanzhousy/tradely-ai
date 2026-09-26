import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import { ChainScene, LifecycleScene, OrderScene } from "./order-concept-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "chain",
		label: ["Read a chain", "读期权链"],
		title: ["Find one contract in the option chain", "在期权链中找到一份合约"],
		prompt: [
			"Choose an expiration, a strike and a type. See the bid, the ask and the cost of one contract.",
			"选择到期日、行权价与类型，查看买价、卖价与一张合约的成本。",
		],
		steps: teachingSteps(
			[
				[
					"An option chain lists every ALFA contract. For October 16, the 100 call shows bid $3.60 and ask $3.75, so one contract costs $375 at the ask.",
					"期权链列出 ALFA 的全部合约。10 月 16 日到期的 100 看涨显示买价 $3.60、卖价 $3.75，按卖价买一张需 $375。",
				],
				[
					"A later expiration costs more: the November 20 105 call asks $2.95, or $295 per contract.",
					"到期越晚价格越高：11 月 20 日到期的 105 看涨卖价 $2.95，每张 $295。",
				],
				[
					"Puts sit on the other side of the same strikes. The November 20 95 put asks $2.25, or $225 per contract.",
					"看跌期权位于同一行权价的另一侧。11 月 20 日到期的 95 看跌卖价 $2.25，每张 $225。",
				],
			],
			[
				["Oct 16 100 call", "10/16 100 看涨"],
				["Nov 20 105 call", "11/20 105 看涨"],
				["Nov 20 95 put", "11/20 95 看跌"],
			],
		),
		Component: ChainScene,
	},
	{
		id: "orders",
		label: ["Market or limit", "市价或限价"],
		title: [
			"A limit order protects you in a wide spread",
			"价差很宽时，限价单能保护你",
		],
		prompt: [
			"Switch between a market order and a limit order, then move your limit price. See whether and where the order fills.",
			"在市价单与限价单之间切换，再移动你的限价，看看订单是否成交、在哪里成交。",
		],
		steps: teachingSteps(
			[
				[
					"This call is quoted $1.80 bid, $2.20 ask. A market buy takes the ask right away: $440 for 2 contracts, $40 more than the $2.00 midpoint.",
					"这张看涨报价买价 $1.80、卖价 $2.20。市价买单立即按卖价成交：2 张 $440，比 $2.00 的中间价多付 $40。",
				],
				[
					"A limit buy at $2.00 never pays more than $2.00. It waits for a seller and may not fill at all.",
					"$2.00 的限价买单绝不会付出高于 $2.00 的价格。它会等待卖方，也可能完全不成交。",
				],
				[
					"A limit at $2.20 or above fills now, at the ask. You name the most you will pay, not the price you get.",
					"限价等于或高于 $2.20 时会立即按卖价成交。你设定的是愿付的最高价，而不是成交价本身。",
				],
			],
			[
				["Market order", "市价单"],
				["Limit below the ask", "低于卖价的限价"],
				["Limit at the ask", "等于卖价的限价"],
			],
		),
		Component: OrderScene,
	},
	{
		id: "life",
		label: ["How it ends", "如何结束"],
		title: ["A position ends in one of three ways", "持仓的三种结束方式"],
		prompt: [
			"Choose how the position ends. Compare the cash, the result and what you hold afterwards.",
			"选择持仓的结束方式，比较现金、结果以及之后持有的东西。",
		],
		steps: teachingSteps(
			[
				[
					"You buy one ALFA 105 call for $1.50 plus a $0.65 fee: $150.65. Most traders end by selling it back; at $2.30 the result is +$78.70 after fees.",
					"你以 $1.50 加 $0.65 费用买入一张 ALFA 105 看涨，共 $150.65。多数交易者会卖出平仓；以 $2.30 卖出，扣除费用后结果为 +$78.70。",
				],
				[
					"If ALFA ends below $105, the call expires worthless and the whole $150.65 is lost.",
					"若 ALFA 到期时低于 $105，看涨期权作废，$150.65 全部损失。",
				],
				[
					"Exercising means paying $10,500 for 100 shares. With ALFA at $108 they are worth $10,800, and you now own the stock.",
					"行权意味着支付 $10,500 买入 100 股。ALFA 为 $108 时股票价值 $10,800，你从此持有股票。",
				],
			],
			[
				["Sell to close", "卖出平仓"],
				["Expire", "到期作废"],
				["Exercise", "行权"],
			],
		),
		Component: LifecycleScene,
	},
] as const satisfies readonly ConceptScene[];

export function OrderConceptLab({ locale }: { locale: Locale }) {
	return (
		<ConceptLab
			locale={locale}
			id="trading-options"
			label={["Interactive option trading lesson", "期权交易互动课堂"]}
			scenes={scenes}
		/>
	);
}
