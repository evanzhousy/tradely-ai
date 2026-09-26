import "@tanstack/react-start/server-only";
import {
	choose as c,
	numberQuestion as n,
	orders,
	type TeachingUnit,
	t,
} from "./authoring.server";

/** Level 0: no prior market knowledge assumed. Every case uses fictional symbols. */
const investorStocks = {
	title: "Investor.gov · Stocks",
	href: "https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks",
};
const investorEtfs = {
	title: "Investor.gov · Exchange-traded funds (ETFs)",
	href: "https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-2",
};

const dollars = (cents: number) => (cents / 100).toFixed(2);

export const orientationUnits: TeachingUnit[] = [
	{
		id: "stocks-and-prices",
		conceptLab: {
			kind: "stocks-and-prices",
			intro: t(
				"Own a slice of a company, read a live quote, and tell a stock from an ETF and an index. No trading knowledge needed.",
				"拥有公司的一小部分，读懂实时报价，并分清股票、ETF 与指数。无需任何交易知识。",
			),
		},
		sources: [investorStocks, investorEtfs, orders],
		explanation: t(
			"A share is a small piece of ownership in a company, and a ticker such as ALFA identifies which company's shares you mean. The value of your shares is the number you own times the price. A live quote has three prices. The bid is the best price someone is offering to pay right now; the ask is the best price someone is offering to sell at; the last price is where the most recent trade happened, which may be seconds or minutes old. If you buy immediately you usually pay the ask, and if you sell immediately you usually receive the bid. An ETF is a fund whose shares trade like a stock while holding many companies at once. An index, such as a 500-stock average, is a calculated number: you cannot buy it directly, and options on an index settle in cash.",
			"股票是公司所有权的一小部分，像 ALFA 这样的代码表示你指的是哪家公司的股票。持股价值等于持股数量乘以价格。实时报价有三个价格：买价是此刻有人愿意支付的最高价格；卖价是此刻有人愿意出售的最低价格；最新价是最近一笔成交的价格，可能已经过去几秒或几分钟。立即买入通常按卖价成交，立即卖出通常按买价成交。ETF 是一种基金，它的份额像股票一样交易，同时持有许多公司。指数（例如 500 只股票的平均指标）是一个计算出来的数值：你不能直接买入指数，指数期权以现金结算。",
		),
		example: t(
			"ALFA shows last $40.02, bid $40.00 and ask $40.05. Buying 10 shares right away costs about 10 × $40.05 = $400.50 before fees, not $400.20. Selling 10 right away brings about $400.00. The $0.05 gap between bid and ask is a cost you pay each time you trade immediately.",
			"ALFA 显示最新价 $40.02、买价 $40.00、卖价 $40.05。立即买入 10 股约需 10 × $40.05 = $400.50（不含费用），而不是 $400.20。立即卖出 10 股约收回 $400.00。买卖价之间 $0.05 的差距，是每次立即成交都要付出的成本。",
		),
		misconception: t(
			"The last price is history, not an offer. What you can trade at right now is the bid or the ask.",
			"最新价是历史，不是报价。此刻能成交的价格是买价或卖价。",
		),
		case: (v) => {
			const [bid, ask, last, qty, side] = (
				[
					[4000, 4005, 4002, 10, "buy"],
					[2510, 2514, 2512, 20, "buy"],
					[6100, 6108, 6105, 15, "sell"],
					[1240, 1243, 1241, 50, "buy"],
				] as const
			)[v];
			const buy = side === "buy";
			const price = buy ? ask : bid;
			const total = (price * qty) / 100;
			return {
				brief: t(
					`ALFA quote: last $${dollars(last)}, bid $${dollars(bid)}, ask $${dollars(ask)}. You want to ${buy ? "buy" : "sell"} ${qty} shares right away.`,
					`ALFA 报价：最新价 $${dollars(last)}，买价 $${dollars(bid)}，卖价 $${dollars(ask)}。你想立即${buy ? "买入" : "卖出"} ${qty} 股。`,
				),
				questions: [
					n(
						"total",
						buy
							? `Total cost to buy ${qty} shares right away, before fees?`
							: `Total received for selling ${qty} shares right away, before fees?`,
						buy
							? `立即买入 ${qty} 股的总成本（不含费用）？`
							: `立即卖出 ${qty} 股收回的总额（不含费用）？`,
						total,
						"USD",
						"美元",
						`${qty} × $${dollars(price)} = $${total.toFixed(2)}. An immediate ${buy ? "buy uses the ask" : "sale uses the bid"}, not the last price.`,
						`${qty} × $${dollars(price)} = $${total.toFixed(2)}。立即${buy ? "买入按卖价" : "卖出按买价"}成交，而不是按最新价。`,
						0.01,
					),
					c(
						"price",
						`What will an immediate ${buy ? "buy most likely pay" : "sale most likely receive"} per share?`,
						`立即${buy ? "买入最可能支付" : "卖出最可能收回"}的每股价格是多少？`,
						[
							["ask", `The ask, $${dollars(ask)}`, `卖价 $${dollars(ask)}`],
							[
								"last",
								`The last price, $${dollars(last)}`,
								`最新价 $${dollars(last)}`,
							],
							["bid", `The bid, $${dollars(bid)}`, `买价 $${dollars(bid)}`],
						],
						buy ? "ask" : "bid",
						"The last price is a past trade. Right now you can buy at the ask or sell at the bid.",
						"最新价是过去的成交。此刻你只能按卖价买入，或按买价卖出。",
					),
					c(
						"direct",
						"Which of these can you not buy directly?",
						"以下哪一项不能直接买入？",
						[
							["stock", "ALFA, a company's stock", "ALFA，一家公司的股票"],
							[
								"etf",
								"BRDX, an ETF that holds many stocks",
								"BRDX，持有多只股票的 ETF",
							],
							["index", "IDX 500, a stock index", "IDX 500，一个股票指数"],
						],
						"index",
						"An index is a calculated number. You can trade funds that track it, or options on it that settle in cash, but not the index itself.",
						"指数是计算出来的数值。你可以交易跟踪它的基金，或以现金结算的指数期权，但不能买入指数本身。",
					),
				],
			};
		},
	},
];
