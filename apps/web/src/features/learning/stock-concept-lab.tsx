import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	InstrumentScene,
	QuoteScene,
	SharesScene,
} from "./stock-concept-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "shares",
		label: ["Own a slice", "拥有一小部分"],
		title: ["A share is a small piece of a company", "股票是公司的一小部分"],
		prompt: [
			"Change how many shares you own and watch your position value and its sensitivity to the price.",
			"改变你持有的股数，观察持股价值及其对价格的敏感度。",
		],
		steps: teachingSteps(
			[
				[
					"ALFA is a fictional company split into 50 million shares at $40 each. Owning 10 shares is worth $400.",
					"ALFA 是一家虚构公司，共 5,000 万股，每股 $40。持有 10 股价值 $400。",
				],
				[
					"Owning 100 shares is worth $4,000, and each $1 move in ALFA changes it by $100.",
					"持有 100 股价值 $4,000，ALFA 每变动 $1，持股价值变化 $100。",
				],
				[
					"Every owner shares the same price: 500 shares are worth $20,000, and a $1 move changes that by $500.",
					"所有股东面对同一个价格：500 股价值 $20,000，每变动 $1，价值变化 $500。",
				],
			],
			[
				["10 shares", "10 股"],
				["100 shares", "100 股"],
				["500 shares", "500 股"],
			],
		),
		Component: SharesScene,
	},
	{
		id: "quote",
		label: ["Read a quote", "读懂报价"],
		title: ["You buy at the ask and sell at the bid", "买入按卖价，卖出按买价"],
		prompt: [
			"Choose buy or sell and the number of shares. Compare the price you get with the last trade.",
			"选择买入或卖出以及股数，比较你得到的价格与最新成交价。",
		],
		steps: teachingSteps(
			[
				[
					"A quote shows the bid ($40.00), the ask ($40.05) and the last trade ($40.02). Buying 10 shares right away pays the ask: $400.50.",
					"报价显示买价（$40.00）、卖价（$40.05）和最新成交价（$40.02）。立即买入 10 股按卖价付款：$400.50。",
				],
				[
					"Selling right away receives the bid: 10 shares bring $400.00, less than the last price suggests.",
					"立即卖出按买价收款：10 股收回 $400.00，比最新价看起来的要少。",
				],
				[
					"The gap between bid and ask is a cost of trading immediately. On 100 shares, buying at the ask costs $3.00 more than the last price.",
					"买卖价之间的差距是立即成交的成本。买入 100 股时，按卖价比按最新价多付 $3.00。",
				],
			],
			[
				["Buy at the ask", "按卖价买入"],
				["Sell at the bid", "按买价卖出"],
				["Count the gap", "计算价差"],
			],
		),
		Component: QuoteScene,
	},
	{
		id: "instruments",
		label: ["Stock, ETF, index", "股票、ETF、指数"],
		title: ["A stock, an ETF and an index differ", "股票、ETF 与指数各不相同"],
		prompt: [
			"Inspect each one. Check whether you can buy it and how its options settle.",
			"逐一查看，确认能否直接买入，以及其期权如何结算。",
		],
		steps: teachingSteps(
			[
				[
					"ALFA is a stock: each share is a slice of one company, and you can buy it directly.",
					"ALFA 是股票：每一股都是一家公司的一小部分，可以直接买入。",
				],
				[
					"BRDX is an ETF: a fund that holds many stocks, with shares that trade just like a stock.",
					"BRDX 是 ETF：一只持有多只股票的基金，其份额像股票一样交易。",
				],
				[
					"IDX 500 is an index: a number calculated from 500 prices. You can't buy it, and options on it settle in cash.",
					"IDX 500 是指数：由 500 个价格计算出的数值。你不能买入它，其期权以现金结算。",
				],
			],
			[
				["Stock", "股票"],
				["ETF", "ETF"],
				["Index", "指数"],
			],
		),
		Component: InstrumentScene,
	},
] as const satisfies readonly ConceptScene[];

export function StockConceptLab({ locale }: { locale: Locale }) {
	return (
		<ConceptLab
			locale={locale}
			id="stocks"
			label={["Interactive stocks and prices lesson", "股票与价格互动课堂"]}
			scenes={scenes}
		/>
	);
}
