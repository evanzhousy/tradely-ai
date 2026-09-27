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
const signedUsd = (value: number) =>
	`${value < 0 ? "−" : ""}$${Math.abs(value).toFixed(2)}`;

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
			"ALFA shows last $100.02, bid $100.00 and ask $100.05. Buying 10 shares right away costs about 10 × $100.05 = $1,000.50 before fees, not $1,000.20. Selling 10 right away brings about $1,000.00. The $0.05 gap between bid and ask is a cost you pay each time you trade immediately.",
			"ALFA 显示最新价 $100.02、买价 $100.00、卖价 $100.05。立即买入 10 股约需 10 × $100.05 = $1,000.50（不含费用），而不是 $1,000.20。立即卖出 10 股约收回 $1,000.00。买卖价之间 $0.05 的差距，是每次立即成交都要付出的成本。",
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
			"An ALFA Oct 18 call with a $100 strike costs $4.20. If ALFA ends at $110, the right to buy at $100 is worth $10 a share, or $1,000 for the contract, against $420 paid. If ALFA ends at $95, nobody would use a right to pay $100, so the call expires worthless and the $420 is lost.",
			"ALFA 10月18日 行权价 $100 的看涨期权售价 $4.20。若 ALFA 到期时为 $110，以 $100 买入的权利每股值 $10，整张合约值 $1,000，而你付出了 $420。若 ALFA 到期时为 $95，没人会用 $100 去买，看涨期权作废，$420 全部损失。",
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
	{
		id: "trading-options",
		conceptLab: {
			kind: "trading-options",
			intro: t(
				"Find one contract in an option chain, compare a market order with a limit order in a wide spread, and follow a position from purchase to its end.",
				"在期权链中找到一份合约，比较价差很宽时的市价单与限价单，并追踪一笔持仓从买入到结束的全过程。",
			),
		},
		sources: [orders, finraOptions, basics],
		explanation: t(
			"To trade options you need a brokerage account with options approval. Brokers grant levels of approval, and buying calls and puts usually needs less than writing them. You never trade 'an ALFA option' in general: you choose one contract from the option chain, a table listing each expiration date and strike with a call and a put, each with its own bid and ask. Prices are per share, so multiply by 100 for one contract. A market order buys at whatever the best offer is, which can be far from fair value when the bid-ask spread is wide. A limit order sets the most you will pay (or the least you will accept): it fills at that price or better, or not at all. Most traders end a position by selling it back before expiry; exercising means actually buying (for a call) or selling (for a put) the 100 shares at the strike. Each trade can carry a fee.",
			"交易期权需要开通期权权限的券商账户。券商会按级别授权，买入看涨和看跌通常比卖出开仓所需的级别低。你不会笼统地交易“ALFA 期权”，而是从期权链中选择一份合约：期权链按到期日和行权价列出每份看涨与看跌合约，各自都有买价和卖价。价格按每股计，所以一张合约要乘以 100。市价单按当时最优卖价成交，价差很宽时可能远离合理价格。限价单设定你愿付的最高价（或愿接受的最低价），只会以该价格或更优价格成交，也可能不成交。多数交易者会在到期前卖出平仓；行权则意味着按行权价真正买入（看涨）或卖出（看跌）100 股。每笔交易都可能收费。",
		),
		example: t(
			"The ALFA Nov 20 105 call shows bid $2.80 and ask $2.95. Buying one at the ask costs $295 plus any fee. A limit order at $2.85 might fill at $2.85 or might not fill at all. If you later sell it back at $3.40, you receive $340 minus the fee.",
			"ALFA 11 月 20 日 105 看涨显示买价 $2.80、卖价 $2.95。按卖价买入一张需 $295 加费用。限价 $2.85 的买单可能以 $2.85 成交，也可能不成交。若之后以 $3.40 卖出平仓，你收回 $340 减去费用。",
		),
		misconception: t(
			"You do not need to exercise an option to profit from it. Selling it back is usually simpler, and before expiry it keeps the time value that exercising would give up.",
			"要从期权获利，并不需要行权。卖出平仓通常更简单，而且在到期前还能保留行权会放弃的时间价值。",
		),
		case: (v) => {
			const [ask, contracts] = [
				[220, 3],
				[145, 2],
				[310, 4],
				[85, 5],
			][v];
			const bid = ask - 40;
			const limit = ask - 20;
			const [bought, sold] = [
				[200, 250],
				[120, 90],
				[340, 410],
				[80, 135],
			][v];
			const result = ((sold - bought) * 100 * 2) / 100 - 0.65 * 2 * 2;
			return {
				brief: t(
					`An ALFA call shows bid $${dollars(bid)} and ask $${dollars(ask)}. Fees are $0.65 per contract on each trade.`,
					`某 ALFA 看涨显示买价 $${dollars(bid)}、卖价 $${dollars(ask)}。每笔交易每张合约收费 $0.65。`,
				),
				questions: [
					n(
						"cost",
						`Cost to buy ${contracts} contracts at the ask, before fees?`,
						`按卖价买入 ${contracts} 张的成本（不含费用）？`,
						(ask * 100 * contracts) / 100,
						"USD",
						"美元",
						`$${dollars(ask)} × 100 × ${contracts} = $${dollars(ask * 100 * contracts)}.`,
						`$${dollars(ask)} × 100 × ${contracts} = $${dollars(ask * 100 * contracts)}。`,
						0.01,
					),
					c(
						"limit",
						`You send a limit buy at $${dollars(limit)}, below the $${dollars(ask)} ask. What happens?`,
						`你以 $${dollars(limit)} 发出限价买单，低于 $${dollars(ask)} 的卖价。会发生什么？`,
						[
							[
								"waits",
								`It fills only if a seller accepts $${dollars(limit)} or less, and may not fill at all.`,
								`只有卖方接受 $${dollars(limit)} 或更低价格时才成交，也可能完全不成交。`,
							],
							["ask", "It fills immediately at the ask.", "会立即按卖价成交。"],
							[
								"mid",
								"The exchange fills it at the midpoint.",
								"交易所会按中间价成交。",
							],
						],
						"waits",
						"A limit order never pays more than its limit. Below the ask, it waits for a seller.",
						"限价单绝不会付出高于限价的价格。低于卖价时，它会等待卖方。",
					),
					c(
						"exit",
						"You own a call and want out before expiry. What do you usually do?",
						"你持有一张看涨期权，想在到期前退出。通常怎么做？",
						[
							["sell", "Sell the same contract to close", "卖出同一份合约平仓"],
							["exercise", "Exercise it", "行权"],
							["wait", "Wait for the broker to close it", "等券商替你平仓"],
						],
						"sell",
						"Selling to close ends the position and keeps any remaining time value. Exercise buys the shares instead.",
						"卖出平仓即可结束持仓，并保留剩余的时间价值。行权则是买入股票。",
					),
					n(
						"result",
						`You bought 2 calls at $${dollars(bought)} and later sold both at $${dollars(sold)}. Result after fees?`,
						`你以 $${dollars(bought)} 买入 2 张看涨，之后以 $${dollars(sold)} 全部卖出。扣除费用后的结果？`,
						Math.round(result * 100) / 100,
						"USD; negative for a loss",
						"美元，亏损填负数",
						`($${dollars(sold)} − $${dollars(bought)}) × 100 × 2 − $0.65 × 2 contracts × 2 trades = ${signedUsd(result)}.`,
						`（$${dollars(sold)} − $${dollars(bought)}）× 100 × 2 − $0.65 × 2 张 × 2 笔 = ${signedUsd(result)}。`,
						0.01,
					),
				],
			};
		},
	},
	{
		id: "options-risks",
		conceptLab: {
			kind: "options-risks",
			intro: t(
				"Watch a call lose value while the stock rises, compare the buyer's and writer's worst cases, and price a round trip through a wide spread.",
				"观察股价上涨时看涨期权如何贬值，比较买方与义务方的最坏情况，并计算在宽价差中一买一卖的成本。",
			),
		},
		sources: [
			finraOptions,
			oicWhatIsAnOption,
			{ title: "Tradely · Options risk disclosure", href: "/risk-disclosure" },
		],
		explanation: t(
			"Options can lose money in ways stock does not. A buyer can lose the entire premium, and quickly, because an option's time value shrinks as expiry approaches and can drop when implied volatility falls, for example after an earnings announcement. So the stock can move your way while the option still loses value. Leverage cuts both ways: a small premium controls 100 shares, so a small move is a large percentage gain or loss. A writer collects a limited premium but can lose far more; an uncovered call has no fixed maximum loss. Trading costs add up: in a wide bid-ask spread you give up the spread each time you buy at the ask and sell at the bid, plus fees. Before you trade, your broker must give you the Options Clearing Corporation's disclosure, Characteristics and Risks of Standardized Options. Read it, and size every position as if the worst case will happen.",
			"期权的亏损方式和股票不同。买方可能损失全部权利金，而且可能很快：期权的时间价值会随到期临近而缩水，隐含波动率下降时（例如财报公布后）也会下跌。所以股价朝你预期的方向走，期权仍可能贬值。杠杆是双向的：一小笔权利金控制 100 股，小幅波动就会带来很大的百分比盈亏。义务方收取有限的权利金，却可能损失得多得多；未备兑的看涨空头没有固定的最大亏损。交易成本会累积：价差很宽时，每次按卖价买入、按买价卖出都要付出价差，再加上费用。交易前，券商必须向你提供期权清算公司（OCC）的《标准化期权的特征与风险》披露文件。请认真阅读，并按最坏情况来控制每笔仓位的规模。",
		),
		example: t(
			"You pay $4.00 for a 30-day ALFA 100 call with ALFA at $100. Twenty days later ALFA is $102, but after earnings implied volatility has fallen from 35% to 25%, and the call is worth about $2.85: a $115 loss despite the right direction. A trader who instead sold a call like it for $3.00 would lose $1,700 if ALFA finished at $120.",
			"ALFA 为 $100 时，你以 $4.00 买入 30 天期的 ALFA 100 看涨。20 天后 ALFA 为 $102，但财报后隐含波动率从 35% 降到 25%，看涨期权只值约 $2.85：方向对了，仍亏 $115。若有人以 $3.00 卖出类似的看涨，而 ALFA 最终为 $120，他将亏损 $1,700。",
		),
		misconception: t(
			"'I can only lose what I put in' is true for option buyers, not for writers. And being right about direction is not enough if time or volatility works against you.",
			"“最多只亏投入的钱”只适用于期权买方，不适用于义务方。而且方向判断正确还不够，时间或波动率也可能对你不利。",
		),
		case: (v) => {
			const paid = [400, 250, 620, 115][v];
			const [bid, ask, contracts] = [
				[190, 210, 5],
				[95, 105, 3],
				[320, 360, 2],
				[140, 155, 4],
			][v];
			const roundTrip = ((ask - bid) * 100 * contracts) / 100;
			return {
				brief: t(
					`You bought an ALFA call for $${dollars(paid)} per share. A different ALFA call is quoted $${dollars(bid)} bid and $${dollars(ask)} ask.`,
					`你以每股 $${dollars(paid)} 买入了一张 ALFA 看涨。另一张 ALFA 看涨的报价为买价 $${dollars(bid)}、卖价 $${dollars(ask)}。`,
				),
				questions: [
					n(
						"max-loss",
						`On the call you bought for $${dollars(paid)}, what is the most you can lose, before fees?`,
						`你以 $${dollars(paid)} 买入的那张看涨，最多可能亏多少（不含费用）？`,
						paid,
						"USD",
						"美元",
						`A buyer can lose the whole premium: $${dollars(paid)} × 100 = $${dollars(paid * 100)}.`,
						`买方最多损失全部权利金：$${dollars(paid)} × 100 = $${dollars(paid * 100)}。`,
						0.01,
					),
					c(
						"no-limit",
						"Which position has no fixed maximum loss?",
						"哪种持仓没有固定的最大亏损？",
						[
							[
								"short-call",
								"Writing a call without owning the shares",
								"不持有股票而卖出看涨",
							],
							["long-call", "Buying a call", "买入看涨"],
							["long-put", "Buying a put", "买入看跌"],
						],
						"short-call",
						"An uncovered call writer must deliver shares at the strike however high the stock goes. Buyers can lose at most the premium.",
						"未备兑的看涨义务方无论股价涨多高都必须按行权价交付股票。买方最多损失权利金。",
					),
					n(
						"round-trip",
						`On the quoted call, you buy ${contracts} contracts at the ask and immediately sell them at the bid. Loss before fees?`,
						`对于有报价的那张看涨，你按卖价买入 ${contracts} 张，随即按买价全部卖出。不含费用的亏损是多少？`,
						roundTrip,
						"USD",
						"美元",
						`($${dollars(ask)} − $${dollars(bid)}) × 100 × ${contracts} = $${roundTrip.toFixed(2)}, lost before the price has moved at all.`,
						`（$${dollars(ask)} − $${dollars(bid)}）× 100 × ${contracts} = $${roundTrip.toFixed(2)}，价格还没动就已亏损。`,
						0.01,
					),
					c(
						"why",
						"ALFA rose a little, but your call lost value. Which could explain it?",
						"ALFA 小幅上涨，但你的看涨期权贬值了。哪种原因可能解释？",
						[
							[
								"time",
								"Time passed and implied volatility fell",
								"时间流逝且隐含波动率下降",
							],
							["strike", "The broker moved the strike", "券商改了行权价"],
							["shares", "The call turned into shares", "看涨期权变成了股票"],
						],
						"time",
						"An option's price includes time value, which shrinks each day and falls when implied volatility drops.",
						"期权价格包含时间价值，它每天都在缩水，隐含波动率下降时也会下跌。",
					),
				],
			};
		},
	},
];
