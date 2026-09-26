import "@tanstack/react-start/server-only";
import {
	basics,
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

const finraOptions = {
	title: "FINRA · Options",
	href: "https://www.finra.org/investors/investing/investment-products/options",
};
const oicWhatIsAnOption = {
	title: "OIC · What is an option?",
	href: "https://www.optionseducation.org/optionsoverview/what-is-an-option",
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
	{
		id: "what-options-are",
		conceptLab: {
			kind: "what-options-are",
			intro: t(
				"Move the stock at expiry to see when a call or put is worth using, compare three reasons people use options, and meet the other side of every option.",
				"移动到期时的股价，看看看涨或看跌期权何时值得行使；比较人们使用期权的三种原因，并认识每份期权的另一方。",
			),
		},
		sources: [oicWhatIsAnOption, finraOptions, basics],
		explanation: t(
			"An option is a contract that gives its holder a right, not an obligation, until a set date. A call is the right to buy 100 shares at a set price, called the strike; a put is the right to sell 100 shares at the strike. The holder pays for that right up front. The price is called the premium and is quoted per share, so a $3 quote costs $300 for one contract. On the other side, the writer receives the premium and takes on the obligation to sell (for a call) or buy (for a put) if the holder uses the right. People use options to protect shares they own, to earn income on them, or to take a view with a limited, known cost. A right that is not worth using by the deadline expires worthless, and the premium is gone.",
			"期权是一份合约，在约定日期前赋予持有人一项权利，而不是义务。看涨期权是按约定价格（行权价）买入 100 股的权利；看跌期权是按行权价卖出 100 股的权利。持有人需要预先为这项权利付费，这个价格叫权利金，按每股报价，所以 $3 的报价买一张合约需 $300。另一方是义务方：他收取权利金，并在持有人行使权利时承担卖出（看涨）或买入（看跌）的义务。人们用期权来保护已有的股票、为持股赚取收入，或以有限且已知的成本表达看法。到期时不值得行使的权利会作废，权利金也随之损失。",
		),
		example: t(
			"A call on ALFA with a $100 strike costs $3. If ALFA ends at $110, the right to buy at $100 is worth $10 a share, or $1,000 for the contract, against $300 paid. If ALFA ends at $95, nobody would use a right to pay $100, so the call expires worthless and the $300 is lost.",
			"ALFA 行权价 $100 的看涨期权售价 $3。若 ALFA 到期时为 $110，以 $100 买入的权利每股值 $10，整张合约值 $1,000，而你付出了 $300。若 ALFA 到期时为 $95，没人会用 $100 去买，看涨期权作废，$300 全部损失。",
		),
		misconception: t(
			"An option is not cheaper stock. It is a right with a deadline, and if the move doesn't come in time you can lose the whole premium.",
			"期权不是更便宜的股票，而是有期限的权利。如果行情没有及时到来，你可能损失全部权利金。",
		),
		case: (v) => {
			const quote = [250, 180, 320, 95][v];
			const below = [95, 92, 98, 90][v];
			return {
				brief: t(
					`A call on ALFA has a $100 strike and is quoted at $${dollars(quote)} per share. One contract covers 100 shares.`,
					`ALFA 行权价 $100 的看涨期权报价为每股 $${dollars(quote)}，一张合约对应 100 股。`,
				),
				questions: [
					n(
						"cost",
						"Cost of one contract, before fees?",
						"一张合约的成本（不含费用）？",
						quote,
						"USD",
						"美元",
						`$${dollars(quote)} per share × 100 shares = $${dollars(quote * 100)}.`,
						`每股 $${dollars(quote)} × 100 股 = $${dollars(quote * 100)}。`,
						0.01,
					),
					c(
						"protect",
						"You own 100 ALFA shares and worry the price will fall. Which option gives you the right to sell at a set price?",
						"你持有 100 股 ALFA，担心股价下跌。哪种期权赋予你按约定价格卖出的权利？",
						[
							["put", "A put", "看跌期权"],
							["call", "A call", "看涨期权"],
							[
								"none",
								"Neither; options can't protect shares",
								"都不行，期权无法保护股票",
							],
						],
						"put",
						"A put is the right to sell at the strike, so it can act like insurance on shares you own.",
						"看跌期权是按行权价卖出的权利，因此可以像保险一样保护你持有的股票。",
					),
					c(
						"obligation",
						"If the call holder uses the right to buy, who must deliver the shares?",
						"若看涨期权持有人行使买入权利，由谁交付股票？",
						[
							[
								"writer",
								"The writer, who sold the call",
								"义务方，即卖出这张看涨的人",
							],
							["holder", "The holder", "持有人"],
							["exchange", "The stock exchange", "证券交易所"],
						],
						"writer",
						"The writer received the premium in exchange for the obligation to sell at the strike.",
						"义务方收取了权利金，作为交换承担按行权价卖出的义务。",
					),
					c(
						"expire",
						`ALFA ends at $${below} at expiry, below the call's $100 strike. What is the call worth?`,
						`ALFA 到期时为 $${below}，低于看涨期权的 $100 行权价。看涨期权值多少？`,
						[
							[
								"zero",
								"Nothing; the premium paid is gone",
								"一文不值，已付权利金全部损失",
							],
							["refund", "The premium is refunded", "权利金会被退还"],
							["strike", "$100 per share", "每股 $100"],
						],
						"zero",
						"Nobody would pay $100 for shares worth less, so the call expires worthless. Premiums are not refunded.",
						"没人会花 $100 买价值更低的股票，因此看涨期权作废。权利金不会退还。",
					),
				],
			};
		},
	},
];
