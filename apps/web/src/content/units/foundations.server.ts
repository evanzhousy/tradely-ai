import "@tanstack/react-start/server-only";
import {
	basics,
	choose as c,
	fact as f,
	numberQuestion as n,
	orders,
	quotes,
	type TeachingUnit,
	t,
} from "./authoring.server";

import { executionConceptData } from "./execution-concept.server";
import { quoteConceptData } from "./quote-concept.server";

export const foundationUnits: TeachingUnit[] = [
	{
		id: "option-contracts",
		version: 3,
		conceptLab: {
			kind: "option-contracts",
			intro: t(
				"Take a contract apart, change one field, and follow its units. Explore these four scenes at your own pace before practicing with new evidence.",
				"拆解一张合约，改变一个字段，再追踪它的单位。按自己的节奏探索四个场景，然后用新证据练习。",
			),
		},
		sources: [basics],
		explanation: t(
			"An underlying is the asset or index referenced by an option. A stock, an ETF share and a cash-settled index are not interchangeable instruments. A ticker identifies an underlying; a contract also needs call/put, strike and expiration. Its multiplier states how a quoted unit converts into a cash amount. Read the product terms rather than assuming every contract delivers 100 shares. Sector is an industry classification; market capitalization is share price times shares outstanding. Share volume counts traded shares; an earnings date identifies an event, not guaranteed news timing. These describe the underlying, not option expiry or traded contract count. A missing sector on an index is not an unknown contract identity. The source date belongs to every price or volume observation: it is not part of the permanent contract key.",
			"标的是期权参考的资产或指数。股票、ETF 份额与现金结算指数并非同一类工具。代码识别标的，合约还需看涨/看跌、行权价和到期日。乘数决定报价单位如何换算成金额，不能假定所有合约均交付 100 股。行业是产业分类，市值为股价乘流通在外股数。股票成交量按股计，财报日期标识事件，不保证具体公布时刻。这些描述标的，不是期权到期日或成交张数。指数没有行业分类，并不意味着合约身份未知。每项价格或成交量都有来源日期，但该日期不是合约固定身份的一部分。",
		),
		example: t(
			"ALFA 100 call expiring October 16 and ALFA 100 call expiring November 20 share an underlying and strike but are different contracts. With a stated 100-share multiplier, 3 contracts represent 300 shares of contractual deliverable; this is not their delta-equivalent exposure. A price of $2 per share implies $200 premium for one contract. Separately, a company with 3 million shares at $40 has $120 million market capitalization.",
			"ALFA 100 看涨、10 月 16 日到期，与 ALFA 100 看涨、11 月 20 日到期，标的和行权价相同，但合约不同。给定每张 100 股，3 张对应 300 股交付数量，不等于 Delta 等价敞口。每股报价 $2，对应每张权利金 $200。另有公司发行在外 300 万股、股价 $40，市值为 $1.2 亿。",
		),
		misconception: t(
			"Do not group contracts by ticker alone. Contract count, deliverable shares, dollars and delta equivalents have different units.",
			"不能只按标的代码合并合约。合约张数、交付股数、金额和 Delta 等价量的单位不同。",
		),
		case: (v) => {
			const count = [4, 7, 9, 6][v];
			const price = [2, 1.5, 2.4, 3][v];
			return {
				brief: t(
					"Both records are ALFA 105 calls with a stated 100-share multiplier. Record A expires October 16; B expires November 20. The supplied execution price and quantity describe a purchase of record A. Calculate the premium paid before fees.",
					"两条记录均为 ALFA 105 看涨，每张给定 100 股。A 于 10 月 16 日到期，B 于 11 月 20 日到期。给定成交价与数量对应买入 A，计算不含费用的已付权利金。",
				),
				facts: [
					f("Purchased contracts", "买入合约（张）", String(count)),
					f(
						"Execution price (USD per share)",
						"成交价（美元/股）",
						String(price),
					),
				],
				questions: [
					c(
						"identity",
						"Can A and B be treated as the same contract?",
						"A 与 B 能当作同一合约吗？",
						[
							[
								"same",
								"Yes, ticker and strike match.",
								"能，标的与行权价相同。",
							],
							[
								"different",
								"No, the expiration differs.",
								"不能，到期日不同。",
							],
							[
								"unknown",
								"Only the next price can establish identity.",
								"只有下一个价格才能确定身份。",
							],
						],
						"different",
						"Expiration is part of identity; market price is an observation.",
						"到期日属于身份，市场价格是观测。",
					),
					n(
						"premium",
						"What total premium was paid for these contracts, before fees?",
						"买入这些合约共支付多少权利金（不含费用）？",
						price * count * 100,
						"USD",
						"美元",
						`$${price} per share × 100 shares per contract × ${count} contracts = $${price * count * 100}. This is premium paid, not profit.`,
						`每股 $${price} × 每张 100 股 × ${count} 张 = $${price * count * 100}。这是已付权利金，不是利润。`,
					),
					n(
						"deliverable",
						"How many deliverable shares do these contracts represent?",
						"这些合约对应多少交付股数？",
						count * 100,
						"shares",
						"股",
						`${count} × 100 = ${count * 100} shares. No delta was supplied.`,
						`${count} × 100 = ${count * 100} 股，未给定 Delta。`,
					),
				],
			};
		},
	},
	{
		id: "option-rights",
		conceptLab: {
			kind: "option-rights",
			intro: t(
				"Switch between holder and writer, track how trades change a position, and follow exercise into assignment. Explore the diagrams before applying the ideas to a new case.",
				"切换持有人与卖方，追踪交易如何改变持仓，再跟随行权进入指派流程。先探索图示，再将概念用于新案例。",
			),
		},
		sources: [
			basics,
			{
				title: "OIC · Exercising options",
				href: "https://www.optionseducation.org/optionsoverview/exercising-options",
			},
		],
		explanation: t(
			"Long means holding an option; short means having written it. A call holder has a right to buy the underlying on the stated terms; a put holder has a right to sell. The assigned writer has the corresponding obligation. Selling an option can open a short position or close a long one. Buying can open a long position or close a short one. These four position actions are different from buying or selling the underlying itself. Directional exposure also differs: a long put is not a short put, and owning a call does not mean owning the referenced shares. Exercise style and settlement specify when and how rights are used.",
			"多头表示持有期权，空头表示卖出开立期权。看涨持有人在给定条款下有权买入标的，看跌持有人有权卖出；被指派的卖方承担对应义务。卖出可以开空仓，也可以平多仓；买入可以开多仓，也可以平空仓。这四种动作与直接买卖标的不同。买入看跌不等于卖出看跌，持有看涨也不等于持有股票。行权方式与结算条款决定权利何时、如何使用。",
		),
		example: t(
			"A writer short one physically settled put at strike $50 may be assigned to buy 100 shares for $5,000 under a stated 100-share contract. The put holder has the right to sell those shares. This gross exercise amount is separate from premium received and from profit or loss.",
			"一张行权价 $50、每张 100 股的实物结算看跌期权空头，可能被指派以 $5,000 买入 100 股。持有人有权卖出这些股票。行权总额不同于已收权利金及盈亏。",
		),
		misconception: t(
			"Call/put tells you the right. Long/short tells you which side of that right or obligation you hold. Opening/closing cannot be inferred from a print's buy/sell label alone.",
			"看涨/看跌说明权利，多头/空头说明你持有权利还是承担义务。单笔买卖标签不能确定开仓或平仓。",
		),
		case: (v) => {
			const strike = [40, 65, 80, 55][v];
			const count = [2, 3, 2, 4][v];
			return {
				brief: t(
					`A writer is assigned on ${count} physically settled puts at strike $${strike}. Multiplier: 100 shares. Ignore premiums and fees for this gross exercise amount.`,
					`卖方的 ${count} 张实物结算看跌期权被指派，行权价 $${strike}，每张 100 股。计算行权总额时暂不计权利金与费用。`,
				),
				questions: [
					n(
						"obligation",
						"What gross cash amount must the writer pay?",
						"卖方应支付多少行权总额？",
						strike * count * 100,
						"USD",
						"美元",
						`Strike × contracts × multiplier = $${strike * count * 100}.`,
						`行权价 × 张数 × 乘数 = $${strike * count * 100}。`,
					),
					c(
						"role",
						"What does the assigned put writer do?",
						"被指派的看跌卖方做什么？",
						[
							[
								"buy",
								"Buy the deliverable at the strike.",
								"按行权价买入交付标的。",
							],
							[
								"sell",
								"Sell the deliverable at the strike.",
								"按行权价卖出交付标的。",
							],
							[
								"choice",
								"Choose whether to honor the obligation.",
								"自行选择是否履行义务。",
							],
						],
						"buy",
						"The put holder's right to sell creates the writer's purchase obligation.",
						"看跌持有人的卖出权利，对应卖方的买入义务。",
					),
				],
			};
		},
	},
	{
		id: "premium-payoff",
		conceptLab: {
			kind: "premium-payoff",
			intro: t(
				"Follow the units from price to premium, separate intrinsic and extrinsic value, then drag the expiration price through a payoff chart. Find where an in-the-money option still produces a loss.",
				"从价格单位追踪到权利金，分清内在价值与外在价值，再拖动到期价格，探索支付价值曲线。找出期权已实值、买方却仍亏损的位置。",
			),
		},
		sources: [
			basics,
			{
				title: "OIC · Options pricing",
				href: "https://www.optionseducation.org/optionsoverview/options-pricing",
			},
			{
				title: "OIC · Long call",
				href: "https://www.optionseducation.org/strategies/all-strategies/long-call",
			},
			{
				title: "OIC · Long put",
				href: "https://www.optionseducation.org/strategies/all-strategies/long-put",
			},
		],
		explanation: t(
			"Distinguish a quote per share, premium per contract, and total execution premium. Multiply the quote by the stated multiplier, then by contract count. Underlying notional uses the underlying price instead of the option premium. Intrinsic value at expiration is max(spot − strike, 0) for a call and max(strike − spot, 0) for a put. Before expiry, premium may also contain extrinsic value. A call is ITM above its strike; a put is ITM below it. ATM is a stated near-spot convention. ITM does not mean profitable: a buyer must recover premium and fees. Long-call expiration break-even is strike plus paid premium per share; long-put break-even is strike minus that premium, before fees.",
			"区分每股报价、每张权利金和成交总权利金。报价乘以给定乘数，再乘张数。标的名义金额使用标的价格，而非期权报价。到期看涨内在价值为 max(现价−行权价,0)，看跌为 max(行权价−现价,0)。到期前还可能有外在价值。看涨在现价高于行权价时实值，看跌相反；平值是明确的近现价约定。实值不代表盈利，买方还需收回权利金与费用。不计费用，多头看涨到期盈亏平衡价为行权价加每股权利金，多头看跌则相减。",
		),
		example: t(
			"Buy 2 calls at $3, strike $100, multiplier 100. Premium is $600. Expiration spot $102 gives $400 payoff, so profit is −$200 before fees. The calls are ITM but the buyer lost money. At purchase spot $100, referenced underlying notional was $20,000, not $600.",
			"以 $3 买入 2 张行权价 $100 的看涨，每张 100 股。权利金 $600。到期现价 $102，支付价值 $400，费用前亏损 $200。合约实值但买方亏钱。买入时现价 $100，对应标的名义金额 $20,000，不是 $600。",
		),
		misconception: t(
			"Calculate payoff and premium separately before subtracting. Preserve a negative profit; do not clamp it to zero just because option payoff is nonnegative.",
			"先分别计算到期价值与权利金，再相减。盈亏可以为负，不能因为期权到期价值非负就把亏损变为零。",
		),
		case: (v) => {
			const count = [2, 3, 4, 5][v];
			const paid = [3, 4, 2.5, 3.5][v];
			const spot = [102, 106, 101, 105][v];
			return {
				brief: t(
					`Long ${count} ALFA 100 calls, paid $${paid}/share, multiplier 100. Expiration spot $${spot}; no fees.`,
					`持有 ${count} 张 ALFA 100 看涨，每股支付 $${paid}，乘数 100。到期现价 $${spot}，不计费用。`,
				),
				questions: [
					n(
						"premium",
						"Total premium paid?",
						"支付的总权利金？",
						count * paid * 100,
						"USD",
						"美元",
						"Price per share × contracts × stated multiplier.",
						"每股价格 × 张数 × 给定乘数。",
					),
					n(
						"profit",
						"Profit at expiration, including premium?",
						"包含权利金后的到期盈亏？",
						(spot - 100 - paid) * count * 100,
						"USD; use − for a loss",
						"美元；亏损用负数",
						"(Expiration intrinsic value − paid premium/share) × 100 × count.",
						"（到期内在价值−每股支付权利金）× 100 × 张数。",
					),
				],
			};
		},
	},
	{
		id: "expiration-settlement",
		conceptLab: {
			kind: "expiration-settlement",
			intro: t(
				"Follow two different ways a long option can end, move through an exercise schedule, and compare physical delivery with cash settlement. Keep product terms and the official reference in view.",
				"追踪期权多头结束的两种不同路径，沿时间轴查看行权安排，再比较实物交付与现金结算。始终保留产品条款与官方参考值。",
			),
		},
		sources: [
			basics,
			{
				title: "OIC · Exercising options",
				href: "https://www.optionseducation.org/optionsoverview/exercising-options",
			},
			{
				title: "OIC · Equity vs. index options",
				href: "https://www.optionseducation.org/advancedconcepts/equity-vs-index-options",
			},
		],
		explanation: t(
			"An exchange trade that closes a position and an exercise are different events. A holder can sell a long option to close it without exercising. Exercise invokes the contract; assignment allocates the writer's obligation. American-style generally permits exercise before expiry under product rules; European-style restricts it to the specified expiry exercise time. The names describe timing, not geography. Physical settlement transfers the stated deliverable; cash settlement pays an amount based on the contract's settlement value. Check the actual product's last trading time, settlement reference and exercise terms. DTE counts time remaining under a stated calendar convention. 0DTE means expiry today, not no risk: prices and sensitivities can change rapidly, and a quoted spot may differ from a product's final settlement value.",
			"交易平仓与行权不是同一事件。持有人可卖出期权平仓，无需行权；行权使用合约权利，被指派则分配卖方义务。美式通常允许按产品规则在到期前行权，欧式限制为指定到期行权时点；名称描述时间，不是地理位置。实物结算交付条款中的标的，现金结算按结算参考值支付金额。应检查产品的最后交易时间、结算参考及行权条款。DTE 按声明的日历约定计数；0DTE 表示今天到期，不代表没有风险。价格和敏感度仍会快速变化，现价也可能不同于最终结算值。",
		),
		example: t(
			"A cash-settled call has strike 4,000, official settlement 4,025 and $100 per index-point multiplier. Cash payoff is (4,025−4,000)×100 = $2,500. No shares are delivered. A last displayed spot of 4,030 would not replace the specified settlement reference.",
			"现金结算看涨行权价 4,000，官方结算值 4,025，每指数点 $100。现金支付 (4,025−4,000)×100=$2,500，不交付股票。最后展示现价 4,030 不能替代给定结算参考。",
		),
		misconception: t(
			"Use the settlement reference named in the product terms, not an unrelated last trade. A purchase of an option is not itself exercise.",
			"使用条款指定的结算参考，不能使用无关最新成交。买入期权本身也不是行权。",
		),
		case: (v) => {
			const k = 4000;
			const settle = [4012, 4035, 3990, 4022][v];
			return {
				brief: t(
					`One cash-settled call: strike ${k}; official settlement ${settle}; multiplier $100/point. Ignore purchase premium.`,
					`一张现金结算看涨：行权价 ${k}，官方结算值 ${settle}，每点 $100。暂不计买入权利金。`,
				),
				questions: [
					n(
						"settlement-difference",
						"Official settlement minus strike, before clamping payoff?",
						"截断到期支付前，官方结算值减行权价是多少？",
						settle - k,
						"index points; retain a negative difference",
						"指数点；保留负差值",
						"Settlement minus strike may be negative; option payoff is then floored at zero.",
						"结算值减行权价可以为负，此时期权支付才取零下限。",
					),
					n(
						"cash",
						"What is the cash payoff?",
						"现金支付额是多少？",
						Math.max(settle - k, 0) * 100,
						"USD",
						"美元",
						"max(settlement − strike, 0) × $100/point.",
						"max(结算值−行权价,0) × 每点 $100。",
					),
					c(
						"delivery",
						"What is delivered under these terms?",
						"按这些条款交付什么？",
						[
							["shares", "100 index shares.", "100 股指数股票。"],
							["cash", "The cash amount; no shares.", "现金金额，不交付股票。"],
							[
								"premium",
								"The original purchase premium is refunded.",
								"退还原买入权利金。",
							],
						],
						"cash",
						"This product explicitly specifies cash settlement.",
						"本产品明确采用现金结算。",
					),
				],
			};
		},
	},
	{
		id: "quotes-orders-trades",
		conceptLab: {
			kind: "quotes-orders-trades",
			data: quoteConceptData,
			intro: t(
				"Move a quote, compare a cancellation with a confirmed trade, and trace the best prices across venues. These fictional examples are yours to explore before practice.",
				"移动报价，比较撤单与已确认成交，再追踪不同场所的最优价格。先自由探索这些虚构示例，再进入练习。",
			),
		},
		sources: [quotes, orders],
		explanation: t(
			"A quote advertises prices and displayed quantities; an order is an instruction; a trade is a completed execution. The bid is an offer to buy and the ask an offer to sell. Sizes are quoted in contracts in this lesson. A venue's quote is not automatically the national best bid and offer, which combines the best eligible quotations. The spread is ask minus bid; the midpoint is their arithmetic average. Last is the most recent execution, which can have a different time from the quote. A mark may be a valuation convention rather than a traded price. Quotes can change when orders arrive or cancel, without any execution. Always pair the reference quote with its timestamp.",
			"报价展示价格与可见数量，订单是指令，成交是已经完成的执行。买价是买入报价，卖价是卖出报价；本课数量以合约张数计。单一场所报价不自动等于汇总最优报价 NBBO。价差为卖价减买价，中点为两者平均。最新成交价可能早于当前报价；估值价也可能只是估值约定，并非实际成交。订单新增或取消可改变报价，而没有任何成交。比较时必须保留报价时间。",
		),
		example: t(
			"Bid $2.00 × 40, ask $2.10 × 30: spread $0.10 and midpoint $2.05. If an unfilled offer is canceled, ask size can fall without volume rising. A print of 10 contracts is an execution count in contracts, not proof that all 30 offered contracts traded.",
			"买价 $2.00×40、卖价 $2.10×30：价差 $0.10，中点 $2.05。未成交卖单取消可令卖价数量下降，而成交量不变。10 张成交不代表报价中的 30 张全数成交。",
		),
		misconception: t(
			"Displayed quote size and executed size are different quantities. A midpoint calculation does not prove someone traded at that price.",
			"报价数量与成交数量不同，算出中点不代表有人按该价成交。",
		),
		case: (v) => {
			const bid = [2, 3.2, 4.1, 5.3][v];
			const ask = bid + [0.1, 0.2, 0.4, 0.3][v];
			return {
				brief: t(
					`Bid $${bid.toFixed(2)}, ask $${ask.toFixed(2)}. An unfilled sell order is canceled; there is no execution message.`,
					`买价 $${bid.toFixed(2)}，卖价 $${ask.toFixed(2)}。一笔未成交卖单被取消，没有执行消息。`,
				),
				questions: [
					n(
						"midpoint",
						"Arithmetic midpoint?",
						"算术中点是多少？",
						(bid + ask) / 2,
						"USD/share",
						"美元/股",
						"(Bid + ask) ÷ 2; this is a reference, not an observed execution.",
						"（买价+卖价）÷2，这是参考值，不是已观测成交。",
					),
					c(
						"event",
						"What can this cancellation establish?",
						"此次取消能确定什么？",
						[
							["trade", "The canceled size traded.", "取消的数量已成交。"],
							[
								"quote",
								"An order was removed; no trade is established.",
								"订单被移除，不能据此确定成交。",
							],
							[
								"buyer",
								"A buyer consumed the offer.",
								"买方吃掉了该卖价数量。",
							],
						],
						"quote",
						"Cancellation is an order event. No execution was supplied.",
						"取消是订单事件，没有给定成交。",
					),
				],
			};
		},
	},
	{
		id: "execution-counterparties",
		conceptLab: {
			kind: "execution-counterparties",
			data: executionConceptData,
			intro: t(
				"Follow both sides of one execution, move a price limit through a displayed book, and inspect the evidence behind a trade print. Explore these fictional cases before practicing independently.",
				"追踪同一成交的双方，移动限价观察可见订单簿，再检查成交记录背后的证据。先探索这些虚构案例，再独立练习。",
			),
		},
		sources: [quotes, orders],
		explanation: t(
			"Every trade has a buyer and a seller. The aggressor is the party demanding immediate execution against a resting order. An incoming buyer taking an offer buys at the ask; the resting seller sells at that same ask. This is one ask-side print, not separate bullish and bearish events. At the bid, an incoming seller trades with a resting buyer. A market order accepts available prices without a limit-price guarantee. A limit order constrains price; it can rest or immediately execute if marketable. Thus the same ask-side print can come from a market order or a marketable limit order. Depth, earlier orders, cancellations and routing affect available fills and slippage.",
			"每笔成交都有买方和卖方。主动方要求立即与挂单撮合。买方主动接受卖价时买在卖价，挂单卖方也在同一卖价卖出，这是同一笔卖价成交，不是两个相反事件。主动卖方接受买价时，对手是挂单买方。市价单接受可用价格，没有限价保证。限价单限制价格，可挂单，也可在价格可成交时立即执行。因此同一卖价成交可能来自市价单或可成交限价单。深度、排队、取消与路由都会影响成交和滑点。",
		),
		example: t(
			"An incoming buy limit at $2.10 meets 30 contracts offered at $2.10. If it asks for 40 and no other eligible liquidity exists, 30 can fill; 10 remain unfilled under this limit. The resting seller is not the aggressor. With only the print, the original order instructions would remain unknown.",
			"买入限价 $2.10 遇到同价 30 张卖单。若买方需要 40 张且没有其他合格流动性，最多成交 30 张，余下 10 张在此限价下未成交。挂单卖方不是主动方。若只有成交记录，原订单指令仍未知。",
		),
		misconception: t(
			"Seller is a counterparty role, not proof of seller initiation. Keep one execution count even though two parties participate.",
			"卖方是对手角色，不证明卖方主动发起。两方参与仍只计一笔成交。",
		),
		case: (v) => {
			const available = [30, 25, 18, 35][v];
			const requested = available + [10, 15, 12, 5][v];
			const buyer = v < 2;
			return {
				brief: t(
					`An incoming ${buyer ? "buyer" : "seller"} has a marketable limit of $${buyer ? "2.10" : "2.00"} for ${requested} contracts. The only eligible resting ${buyer ? "offer" : "bid"} is ${available} contracts at that price. No replenishment, cancellation or other orders.`,
					`主动${buyer ? "买方" : "卖方"}以可成交限价 $${buyer ? "2.10" : "2.00"} 请求 ${requested} 张。唯一合格挂${buyer ? "卖" : "买"}单为该价格的 ${available} 张，无补单、取消或其他订单。`,
				),
				questions: [
					n(
						"unfilled",
						"How many requested contracts cannot immediately fill?",
						"多少张不能立即成交？",
						requested - available,
						"contracts",
						"张",
						"Requested quantity − eligible opposite-side quantity.",
						"请求数量−合格对手方数量。",
					),
					c(
						"aggressor",
						"Who initiates the execution?",
						"谁主动发起成交？",
						[
							[
								"seller",
								buyer
									? "The resting seller, because it supplies the offer."
									: "The incoming seller; both parties trade at the bid.",
								buyer
									? "挂单卖方，因为提供了卖价。"
									: "主动到来的卖方，双方都在买价成交。",
							],
							[
								"buyer",
								buyer
									? "The incoming buyer; both parties trade at the ask."
									: "The resting buyer, because the print is at bid.",
								buyer
									? "主动到来的买方，双方都在卖价成交。"
									: "挂单买方，因为成交在买价。",
							],
							[
								"both",
								"Count buyer and seller as two separate prints.",
								"将买方与卖方计为两笔成交。",
							],
						],
						buyer ? "buyer" : "seller",
						"The incoming order demands immediacy; the resting counterparty participates in the SAME execution.",
						"主动订单要求立即执行，挂单对手参与的是同一笔成交。",
					),
				],
			};
		},
	},
	{
		id: "execution-side",
		demonstration: { mode: "side", optionType: "CALL" },
		sources: [quotes],
		explanation: t(
			"Execution side locates a print relative to its reference quote. In this lesson's convention, price above ask is AASK; at ask is ASK; inside a valid spread is MID; at bid is BID; below bid is BBID. MID does not have to be the exact arithmetic midpoint. This location may suggest the likely aggressor, but it does not reveal the participant's identity or opening/closing instructions. A stale, missing, locked or crossed quote and complex-order conditions can invalidate a simple classification. An outside-spread price may reflect timing or special conditions; it does not prove conviction or desperation. The quote must be comparable and contemporaneous before interpretation.",
			"成交位置是成交价相对于参考报价的位置。本课约定：高于卖价为 AASK，等于卖价为 ASK，在有效价差内为 MID，等于买价为 BID，低于买价为 BBID。MID 不一定等于算术中点。位置可支持主动方推断，但不揭示身份或开平仓指令。过时、缺失、锁定或交叉报价，以及复杂订单条件，都可能令简单分类无效。价差外成交可能来自时间差或特殊条件，不能证明确信或恐慌。先确认报价可比且时间匹配。",
		),
		example: t(
			"With a matched $4.00/$4.20 quote, $4.00 is BID, $4.20 ASK, $4.25 AASK, $3.95 BBID, and $4.07 MID even though the midpoint is $4.10. If the only quote is 90 seconds older, preserve the price but withhold a reliable side interpretation.",
			"报价与成交匹配为 $4.00/$4.20 时，$4.00 为 BID，$4.20 为 ASK，$4.25 为 AASK，$3.95 为 BBID，$4.07 为 MID，尽管中点是 $4.10。若报价早了 90 秒，应保留成交价，但不作可靠方向分类。",
		),
		misconception: t(
			"A location code is not proof of market-order type, investor belief or strategy. Feed conventions should be stated rather than assumed.",
			"位置代码不证明市价单类型、投资者信念或策略，应明确数据源分类约定。",
		),
		case: (v) => {
			const bid = [4, 2.1, 5.5, 3.3][v];
			const ask = bid + 0.2;
			const items = [
				{ price: ask + 0.05, code: "AASK" },
				{ price: ask, code: "ASK" },
				{ price: bid + 0.07, code: "MID" },
				{ price: bid, code: "BID" },
				{ price: bid - 0.05, code: "BBID" },
			];
			const shift = v % items.length;
			const events = [...items.slice(shift), ...items.slice(0, shift)];
			return {
				brief: t(
					`Five separate prints share a matched, valid reference quote $${bid.toFixed(2)}/$${ask.toFixed(2)}. Apply the declared location convention to EACH execution; no special conditions.`,
					`五笔不同成交共享匹配有效报价 $${bid.toFixed(2)}/$${ask.toFixed(2)}。按声明的位置约定逐笔分类，无特殊条件。`,
				),
				questions: [
					...events.map((item, i) =>
						c(
							`location-${i}`,
							`Execution ${i + 1}: $${item.price.toFixed(2)}. Which location code?`,
							`成交 ${i + 1}：$${item.price.toFixed(2)}，属于哪个位置代码？`,
							["ASK", "MID", "BBID", "AASK", "BID"].map(
								(code) => [code, code, code] as [string, string, string],
							),
							item.code,
							"Compare the execution with both quote boundaries. Inside-spread includes prices away from the exact midpoint.",
							"同时比较买卖价边界，价差内包含非精确中点。",
						),
					),
					c(
						"stale",
						"If the quote is actually 90 seconds old, what can you retain?",
						"若报价其实早了 90 秒，可保留什么？",
						[
							[
								"same",
								"All classifications remain reliable.",
								"全部分类仍然可靠。",
							],
							[
								"unknown",
								"Keep execution prices; reliable quote-side inference is unavailable.",
								"保留成交价，不能可靠进行报价侧推断。",
							],
							[
								"reverse",
								"Reverse every buyer into seller.",
								"把所有买方反转为卖方。",
							],
						],
						"unknown",
						"Staleness weakens the reference; it does not reverse the side.",
						"过时削弱参考，不会反转方向。",
					),
				],
			};
		},
	},
	{
		id: "flow-sentiment",
		demonstration: { mode: "sentiment", optionType: "CALL" },
		sources: [quotes, basics],
		explanation: t(
			"Bullish can describe an upward price view or positive directional exposure; bearish can describe a downward view or negative exposure. Name whose view or which exposure. A flow feed's sentiment is a separate rule-based classification. Under the convention used here: likely call buying is bullish, call selling bearish, put buying bearish, and put selling bullish. The mapping follows the isolated leg's directional effect from the likely aggressor's perspective. A trade has another party with the opposite leg. Do not count each print twice. Neutral means the available execution evidence does not establish direction, not that the investor expects a flat market or owns a neutral portfolio.",
			"看涨可指向上价格观点或正向敞口，看跌可指向下观点或负向敞口，要说明谁的观点或哪项敞口。成交流情绪是另一种规则分类。本课约定：推断买入看涨为看涨，卖出看涨为看跌，买入看跌为看跌，卖出看跌为看涨。该映射从推断主动方角度描述孤立期权腿的方向影响。对手持相反腿，但每笔成交不能重复计数。中性表示现有执行证据不能确定方向，不代表投资者预期横盘或组合中性。",
		),
		example: t(
			"A buyer takes the ask on a put. The print receives a bearish flow label under this convention. The same investor may own stock and use that put as protection. A buy-to-close on an existing short put is also possible. The flow label alone cannot identify the complete strategy, portfolio, or expected future return.",
			"买方主动接受看跌期权卖价，本约定标为看跌成交流。但该投资者可能持有股票，用看跌作保护，也可能买入平掉原有空头看跌。单一标签不能确定完整策略、组合或未来收益预期。",
		),
		misconception: t(
			"Option type alone does not give sentiment. An inferred flow label does not establish a participant's belief, opening status, or complete portfolio.",
			"仅凭期权类型不能判断情绪。推断的成交流标签不确定信念、开仓状态或完整组合。",
		),
		case: (v) => {
			const rows = [
				{ type: "CALL", side: "ASK", answer: "bull" },
				{ type: "CALL", side: "BID", answer: "bear" },
				{ type: "PUT", side: "ASK", answer: "bear" },
				{ type: "PUT", side: "BID", answer: "bull" },
			];
			const order = [...rows.slice(v), ...rows.slice(0, v)];
			return {
				brief: t(
					"Four different executions, with matched quotes and reliable aggressor evidence. Each row is one print, not both counterparties counted separately. Use the isolated-leg convention.",
					"四笔不同成交均有匹配报价与可靠主动方证据。每行是一笔成交，不是重复统计两方。使用孤立单腿约定。",
				),
				worksheet: {
					columns: [
						t("Record", "记录"),
						t("Option type", "期权类型"),
						t("Execution side", "成交位置"),
					],
					rows: order.map((row, i) => [
						`P${v + 1}-${i + 1}`,
						row.type,
						row.side,
					]),
					caption: t(
						"Synthetic matched-quote execution records",
						"模拟匹配报价成交记录",
					),
				},
				questions: [
					...order.map((row, i) =>
						c(
							`classification-${i}`,
							`Classify record P${v + 1}-${i + 1}.`,
							`分类记录 P${v + 1}-${i + 1}。`,
							[
								["bull", "Bullish flow", "看涨成交流"],
								["bear", "Bearish flow", "看跌成交流"],
								["neutral", "Direction indeterminate", "方向无法确定"],
							],
							row.answer,
							"Call buy / put sell: bullish; call sell / put buy: bearish under this isolated-leg convention.",
							"本孤立单腿约定：买看涨/卖看跌为看涨，卖看涨/买看跌为看跌。",
						),
					),
					c(
						"neutral",
						"A separate inside-spread print has no reliable aggressor evidence. What does neutral mean here?",
						"另一笔价差内成交无可靠主动方证据，此处中性表示什么？",
						[
							[
								"flat",
								"The investor expects a flat market.",
								"投资者预期横盘。",
							],
							[
								"unknown",
								"Direction is indeterminate from this execution evidence.",
								"无法从此执行证据确定方向。",
							],
							[
								"hedged",
								"The whole portfolio is delta-neutral.",
								"整个组合 Delta 中性。",
							],
						],
						"unknown",
						"Unknown classification is not known portfolio neutrality or an investor's view.",
						"分类未知不等于已知组合中性或投资者观点。",
					),
					c(
						"portfolio",
						"Does the put-buy row establish a bearish complete portfolio?",
						"买看跌这一行证明完整组合看跌吗？",
						[
							[
								"yes",
								"Yes, a put buyer must be bearish overall.",
								"是，买看跌必然整体看跌。",
							],
							[
								"no",
								"No, the put can hedge stock or close an existing short put.",
								"否，可保护股票或平掉原有空头看跌。",
							],
						],
						"no",
						"Position linkage and the rest of the portfolio are not supplied.",
						"未给定持仓关联与组合其他部分。",
					),
				],
			};
		},
	},
	{
		id: "validate-option-print",
		sources: [quotes, basics],
		explanation: t(
			"Read an execution in this order: contract identity, event time, price per unit, count and multiplier, matched quote, then any execution conditions and linkage. Calculate premium from the execution itself. A contemporaneous valid bid/ask can support an aggressor inference; a prior or incompatible quote cannot. Opening/closing flags and linked legs would be additional evidence, not conclusions from premium size. Separate what is observed, what is calculated, what is inferred under a convention, and what is still unknown. The best next check addresses a specific missing fact rather than searching for another dramatic print or waiting to see whether price rises.",
			"按顺序检查成交：合约身份、事件时间、单位价格、数量与乘数、匹配报价，然后检查成交条件和关联。权利金应由成交本身计算。同时刻有效报价可支持主动方推断，历史或不兼容报价则不能。开平仓标记与关联策略腿是额外证据，不是金额大小的结论。区分观测、计算、约定下的推断与仍未知信息。下一项检查应针对具体缺口，而不是再找一笔大成交或等待价格上涨。",
		),
		example: t(
			"500 calls at $2.05 with multiplier 100 represent $102,500. A $2.00/$2.05 quote from 90 seconds before the execution does not establish reliable buyer initiation. The amount remains known. Obtain a time-aligned quote; even that will not identify the whole strategy without linkage.",
			"500 张看涨以 $2.05 成交、乘数 100，总额 $102,500。若 $2.00/$2.05 报价早于成交 90 秒，就不能可靠判断主动买入；金额仍然已知。应获取匹配时间报价，即便得到，也不能在缺少关联时确定完整策略。",
		),
		misconception: t(
			"An old quote creates uncertainty, not an automatic reversal of side. Premium is dollars exchanged, not conviction.",
			"旧报价带来不确定性，不会自动反转方向。权利金是交换金额，不是确信程度。",
		),
		case: (v) => {
			const count = [300, 400, 250, 600][v];
			const price = [2.1, 1.8, 4.1, 1.25][v];
			const stale = v === 2;
			return {
				brief: t(
					`${count} contracts trade at $${price}. Multiplier 100. The supplied bid equals the trade price and ask is $0.10 higher. ${stale ? "The quote is 90 seconds old." : "The quote is matched, uncrossed and contemporaneous."} No opening/closing or multi-leg linkage is supplied.`,
					`${count} 张以 $${price} 成交，乘数 100。所给买价等于成交价，卖价高 $0.10。${stale ? "报价早了 90 秒。" : "报价匹配、未交叉且同时刻。"}未给定开平仓或多腿关联。`,
				),
				questions: [
					n(
						"premium",
						"Execution premium?",
						"成交总权利金？",
						count * price * 100,
						"USD",
						"美元",
						"Execution price × contract count × stated multiplier.",
						"成交价格 × 张数 × 给定乘数。",
					),
					c(
						"inference",
						"Which aggressor interpretation is supported?",
						"哪项主动方解读有依据？",
						[
							["buyer", "Likely buyer-initiated.", "可能由买方主动发起。"],
							[
								"seller",
								"Likely seller-initiated, with strategy unresolved.",
								"可能由卖方主动发起，策略仍未知。",
							],
							[
								"unknown",
								"Reliable aggressor classification is unavailable.",
								"无法可靠分类主动方。",
							],
						],
						stale ? "unknown" : "seller",
						stale
							? "The earlier quote cannot classify this execution reliably."
							: "The matched bid-side location supports a seller inference, not opening intent.",
						stale
							? "较早报价不能可靠分类本笔成交。"
							: "匹配买价位置支持卖方推断，不证明开仓意图。",
					),
				],
			};
		},
	},
];
