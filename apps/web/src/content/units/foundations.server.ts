import "@tanstack/react-start/server-only";
import {
	basics,
	choose as c,
	money,
	numberQuestion as n,
	orders,
	quotes,
	type TeachingUnit,
	t,
} from "./authoring.server";

import { revisedFoundationUnits } from "./foundation-revision.server";

export const foundationUnits: TeachingUnit[] = [
	...revisedFoundationUnits,
	{
		id: "quotes-orders-trades",
		conceptLab: {
			kind: "quotes-orders-trades",
			intro: t(
				"Read a quote against its last trade, watch orders change the book without printing, and combine three venues into one best quote.",
				"对照最新成交读懂报价，观察订单如何改变订单簿却不产生成交记录，再把三个场所合成一个最优报价。",
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
			"The size on a quote and the size that traded are different numbers. Working out a midpoint doesn't mean anyone traded there.",
			"报价上的数量和成交的数量是两个不同的数。算出中点，并不代表有人在那里成交。",
		),
		case: (v) => {
			const bid = [2, 3.2, 4.1, 5.3][v];
			const ask = bid + [0.1, 0.2, 0.4, 0.3][v];
			return {
				brief: t(
					`An ALFA call is quoted ${money(bid)} bid and ${money(ask)} ask. Then a seller cancels an offer that never filled, and no trade message follows.`,
					`某 ALFA 看涨报价为买价 ${money(bid)}、卖价 ${money(ask)}。随后一位卖方撤销了一张从未成交的卖单，之后没有任何成交消息。`,
				),
				questions: [
					n(
						"midpoint",
						"What is the quote's midpoint, per share?",
						"这个报价的中点是每股多少？",
						(bid + ask) / 2,
						"dollars a share",
						"美元/股",
						`(${money(bid)} + ${money(ask)}) ÷ 2 = ${money((bid + ask) / 2)}. A midpoint is a reference price; nobody has traded there.`,
						`(${money(bid)} + ${money(ask)}) ÷ 2 = ${money((bid + ask) / 2)}。中点只是参考价格，没有人在那里成交。`,
					),
					c(
						"event",
						"What does the cancellation tell you?",
						"这次撤单能说明什么？",
						[
							["trade", "The cancelled contracts traded", "被撤销的合约成交了"],
							[
								"quote",
								"An order left the book; nothing traded",
								"一张订单离开了订单簿；没有成交",
							],
							["buyer", "A buyer took the offer", "有买方吃掉了这张卖单"],
						],
						"quote",
						"A cancel is an order event. With no trade message, nothing traded.",
						"撤单是订单事件。没有成交消息，就没有成交。",
					),
				],
			};
		},
	},
	{
		id: "execution-counterparties",
		conceptLab: {
			kind: "execution-counterparties",
			intro: t(
				"Watch your order meet Ben's resting offer in one trade, send a limit order through the book, and see what a print can't tell you.",
				"观察你的订单与 Ben 的挂单撮合成一笔成交，把限价单送进订单簿，再看看成交记录无法告诉你什么。",
			),
		},
		sources: [quotes, orders],
		explanation: t(
			"Every trade has a buyer and a seller. The aggressor is the party demanding immediate execution against a resting order. An incoming buyer taking an offer buys at the ask; the resting seller sells at that same ask. This is one ask-side print, not separate bullish and bearish events. At the bid, an incoming seller trades with a resting buyer. A market order accepts available prices without a limit-price guarantee. A limit order constrains price; it can rest or immediately execute if marketable. Thus the same ask-side print can come from a market order or a marketable limit order. Depth, earlier orders, cancellations and routing affect available fills and slippage.",
			"每笔成交都有买方和卖方。主动方要求立即与挂单撮合。买方主动接受卖价时买在卖价，挂单卖方也在同一卖价卖出，这是同一笔卖价成交，不是两个相反事件。主动卖方接受买价时，对手是挂单买方。市价单接受可用价格，没有限价保证。限价单限制价格，可挂单，也可在价格可成交时立即执行。因此同一卖价成交可能来自市价单或可成交限价单。深度、排队、取消与路由都会影响成交和滑点。",
		),
		example: t(
			"An incoming buy limit at $4.15 for 30 contracts meets 10 offered at $4.10 and 12 at $4.15. It fills 22, and the other 8 rest as a bid at $4.15 because nothing more is offered within the limit. The resting sellers are not the aggressors. With only the prints, the original order instructions would remain unknown.",
			"30 张、限价 $4.15 的买单遇到 $4.10 的 10 张和 $4.15 的 12 张卖单。它成交 22 张，其余 8 张作为 $4.15 的买单等待，因为限价以内已没有更多卖单。挂单卖方不是主动方。若只有成交记录，原订单指令仍未知。",
		),
		misconception: t(
			"Every trade has a seller, but that doesn't mean a seller started it. Two parties, one trade: count it once.",
			"每笔成交都有卖方，但这不代表是卖方发起的。两方参与，一笔成交：只计一次。",
		),
		case: (v) => {
			const available = [30, 25, 18, 35][v];
			const requested = available + [10, 15, 12, 5][v];
			const buyer = v < 2;
			return {
				brief: buyer
					? t(
							`You send a limit buy for ${requested} ALFA calls at $2.10. The ask is $2.10, so it can trade at once, but only ${available} contracts are offered there. Nobody adds, cancels or sends other orders.`,
							`你发出 ${requested} 张 ALFA 看涨、限价 $2.10 的买单。卖价是 $2.10，所以可以立即成交，但那里只挂着 ${available} 张。没有人新增、撤销或发出其他订单。`,
						)
					: t(
							`You send a limit sell for ${requested} ALFA calls at $2.00. The bid is $2.00, so it can trade at once, but only ${available} contracts are bid there. Nobody adds, cancels or sends other orders.`,
							`你发出 ${requested} 张 ALFA 看涨、限价 $2.00 的卖单。买价是 $2.00，所以可以立即成交，但那里只挂着 ${available} 张买单。没有人新增、撤销或发出其他订单。`,
						),
				questions: [
					n(
						"unfilled",
						"How many of your contracts can't fill right away?",
						"你的订单中有多少张不能立即成交？",
						requested - available,
						"contracts",
						"张",
						`${requested} − ${available} = ${requested - available}. They wait in the book at your limit until someone ${buyer ? "sells" : "buys"} there.`,
						`${requested} − ${available} = ${requested - available}。它们按你的限价留在订单簿中，等有人在那里${buyer ? "卖出" : "买入"}。`,
					),
					c(
						"aggressor",
						"Who started the trade?",
						"这笔成交是谁发起的？",
						[
							[
								"seller",
								buyer
									? "The resting seller, who supplied the offer"
									: "You, the incoming seller; both sides trade at the bid",
								buyer
									? "挂单的卖方，因为卖单是他挂的"
									: "你，主动到来的卖方；双方都在买价成交",
							],
							[
								"buyer",
								buyer
									? "You, the incoming buyer; both sides trade at the ask"
									: "The resting buyer, since it printed at the bid",
								buyer
									? "你，主动到来的买方；双方都在卖价成交"
									: "挂单的买方，因为成交在买价",
							],
							[
								"both",
								"Neither: count the buyer and the seller as two prints",
								"都不是：把买方和卖方算作两笔成交",
							],
						],
						buyer ? "buyer" : "seller",
						"Your incoming order asked for an immediate fill, so you started it. The resting order on the other side takes part in the same single trade.",
						"你的订单要求立即成交，所以是你发起的。对面的挂单参与的是同一笔成交。",
					),
				],
			};
		},
	},
	{
		id: "execution-side",
		conceptLab: {
			kind: "execution-side",
			intro: t(
				"Place Monday's three prints against their quotes, test what happens with the wrong quote, and see how far a location can take you.",
				"把周一的三笔成交对照各自的报价定位，检验用错报价会怎样，再看看成交位置能支持到哪一步。",
			),
		},
		sources: [quotes],
		explanation: t(
			"Execution side locates a print relative to its reference quote. In this lesson's convention, price above ask is AASK; at ask is ASK; inside a valid spread is MID; at bid is BID; below bid is BBID. MID does not have to be the exact arithmetic midpoint. This location may suggest the likely aggressor, but it does not reveal the participant's identity or opening/closing instructions. A stale, missing, locked or crossed quote and complex-order conditions can invalidate a simple classification. An outside-spread price may reflect timing or special conditions; it does not prove conviction or desperation. The quote must be comparable and contemporaneous before interpretation.",
			"成交位置是成交价相对于参考报价的位置。本课约定：高于卖价为 AASK，等于卖价为 ASK，在有效价差内为 MID，等于买价为 BID，低于买价为 BBID。MID 不一定等于算术中点。位置可支持主动方推断，但不揭示身份或开平仓指令。过时、缺失、锁定或交叉报价，以及复杂订单条件，都可能令简单分类无效。价差外成交可能来自时间差或特殊条件，不能证明确信或恐慌。先确认报价可比且时间匹配。",
		),
		example: t(
			"Against the matched 11:42 quote of $4.10/$4.20, $4.10 is BID, $4.20 ASK, $4.25 AASK, $4.05 BBID, and $4.12 MID even though the midpoint is $4.15. If the only quote is 90 seconds older, keep the price but withhold a side.",
			"对照匹配的 11:42 报价 $4.10/$4.20，$4.10 为 BID，$4.20 为 ASK，$4.25 为 AASK，$4.05 为 BBID，$4.12 为 MID，尽管中点是 $4.15。若报价早了 90 秒，应保留成交价，但不判断位置。",
		),
		misconception: t(
			"A location code doesn't prove the order type, the trader's belief or their strategy. State the feed's convention rather than assuming it.",
			"位置代码不能证明订单类型、交易者的看法或策略。要写明数据源的约定，而不是想当然。",
		),
		case: (v) => {
			const bid = [4, 2.1, 5.5, 3.3][v];
			const ask = bid + 0.2;
			const items = [
				{
					price: ask + 0.05,
					code: "AASK",
					why: t(`above the ${money(ask)} ask`, `高于 ${money(ask)} 的卖价`),
				},
				{
					price: ask,
					code: "ASK",
					why: t("exactly the ask", "正好等于卖价"),
				},
				{
					price: bid + 0.07,
					code: "MID",
					why: t(
						`between the bid and the ask, though not the exact middle, ${money(bid + 0.1)}`,
						`在买价与卖价之间，虽然不是正中间的 ${money(bid + 0.1)}`,
					),
				},
				{
					price: bid,
					code: "BID",
					why: t("exactly the bid", "正好等于买价"),
				},
				{
					price: bid - 0.05,
					code: "BBID",
					why: t(`below the ${money(bid)} bid`, `低于 ${money(bid)} 的买价`),
				},
			];
			const shift = v % items.length;
			const events = [...items.slice(shift), ...items.slice(0, shift)];
			return {
				brief: t(
					`Five separate ALFA call prints share one valid quote from the same moment: ${money(bid)} bid, ${money(ask)} ask. Use this lesson's codes: AASK above the ask, ASK at it, MID inside the spread, BID at the bid, BBID below it.`,
					`五笔不同的 ALFA 看涨成交共用同一时刻的一个有效报价：买价 ${money(bid)}、卖价 ${money(ask)}。使用本课的代码：高于卖价为 AASK，等于卖价为 ASK，在价差内为 MID，等于买价为 BID，低于买价为 BBID。`,
				),
				questions: [
					...events.map((item, i) =>
						c(
							`location-${i}`,
							`Print ${i + 1} is at ${money(item.price)}. Which code does it get?`,
							`第 ${i + 1} 笔成交在 ${money(item.price)}。它属于哪个代码？`,
							["ASK", "MID", "BBID", "AASK", "BID"].map(
								(code) => [code, code, code] as [string, string, string],
							),
							item.code,
							`${money(item.price)} is ${item.why.en}: ${item.code}.`,
							`${money(item.price)} ${item.why.zh}：${item.code}。`,
						),
					),
					c(
						"stale",
						"If that quote turns out to be 90 seconds old, what can you still keep?",
						"如果发现这个报价其实早了 90 秒，你还能保留什么？",
						[
							["same", "All five codes, unchanged", "全部五个代码，保持不变"],
							[
								"unknown",
								"The five prices, but not their codes",
								"五个成交价，但不保留代码",
							],
							[
								"reverse",
								"The codes, flipped from buys to sells",
								"代码，但把买入全部改成卖出",
							],
						],
						"unknown",
						"An old quote can't place a new print, so the codes become unreliable. The prices are still facts, and nothing says to flip them.",
						"旧报价无法给新成交定位，所以代码变得不可靠。成交价仍然是事实，也没有理由把它们反过来。",
					),
				],
			};
		},
	},
	{
		id: "flow-sentiment",
		conceptLab: {
			kind: "flow-sentiment",
			intro: t(
				"Map option type and likely aggressor to a flow label, label Monday's three prints once each, and place one put purchase inside different accounts.",
				"把期权类型与推断的主动方对应到成交流标签，为周一三笔成交各贴一次标签，再把同一笔看跌买入放进不同账户。",
			),
		},
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
			"A call isn't bullish by itself and a put isn't bearish by itself; it depends on who started the trade. Even then, a flow label doesn't show the trader's belief, whether they opened, or their whole portfolio.",
			"看涨期权本身不代表看涨，看跌期权本身也不代表看跌，要看谁发起了成交。即便如此，成交流标签也不能说明交易者的看法、是否开仓，或其完整组合。",
		),
		case: (v) => {
			const rows = [
				{
					type: "CALL",
					side: "ASK",
					answer: "bull",
					why: t(
						"A call bought at the ask: the buyer who started it gains if ALFA rises, so bullish flow.",
						"在卖价买入看涨：发起的买方在 ALFA 上涨时获利，所以是看涨成交流。",
					),
				},
				{
					type: "CALL",
					side: "BID",
					answer: "bear",
					why: t(
						"A call sold at the bid: the seller who started it gives up ALFA's upside, so bearish flow.",
						"在买价卖出看涨：发起的卖方放弃了 ALFA 的上涨空间，所以是看跌成交流。",
					),
				},
				{
					type: "PUT",
					side: "ASK",
					answer: "bear",
					why: t(
						"A put bought at the ask: the buyer who started it gains if ALFA falls, so bearish flow.",
						"在卖价买入看跌：发起的买方在 ALFA 下跌时获利，所以是看跌成交流。",
					),
				},
				{
					type: "PUT",
					side: "BID",
					answer: "bull",
					why: t(
						"A put sold at the bid: the seller who started it collects premium and loses if ALFA falls, so bullish flow.",
						"在买价卖出看跌：发起的卖方收取权利金、在 ALFA 下跌时亏损，所以是看涨成交流。",
					),
				},
			];
			const order = [...rows.slice(v), ...rows.slice(0, v)];
			return {
				brief: t(
					"Four ALFA option prints, each with a quote from the same moment and reliable evidence of who started it. Each row is one trade, counted once. Label each print by its own leg, as the lesson did.",
					"四笔 ALFA 期权成交，每笔都有同一时刻的报价，以及谁发起成交的可靠证据。每一行是一笔成交，只计一次。像本课那样，按每笔成交自身那条腿来标注。",
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
							`Which flow label does print P${v + 1}-${i + 1} get?`,
							`成交 P${v + 1}-${i + 1} 应该贴哪个成交流标签？`,
							[
								["bull", "Bullish flow", "看涨成交流"],
								["bear", "Bearish flow", "看跌成交流"],
								["neutral", "Direction can't be told", "无法判断方向"],
							],
							row.answer,
							row.why.en,
							row.why.zh,
						),
					),
					c(
						"neutral",
						"Another print lands inside the spread with no reliable evidence of who started it. What does a neutral label mean here?",
						"另一笔成交落在价差之内，没有谁发起的可靠证据。这里的中性标签是什么意思？",
						[
							[
								"flat",
								"The trader expects ALFA to stay flat",
								"交易者预期 ALFA 横盘",
							],
							[
								"unknown",
								"This evidence can't tell the direction",
								"这些证据无法判断方向",
							],
							[
								"hedged",
								"The trader's whole book is delta-neutral",
								"交易者的整个账户 Delta 中性",
							],
						],
						"unknown",
						"Neutral means the evidence can't settle the direction. It says nothing about the trader's view or their portfolio.",
						"中性表示证据无法确定方向，并不说明交易者的看法或其组合。",
					),
					c(
						"portfolio",
						"Does the put-buying print show the trader's whole portfolio is bearish?",
						"买入看跌的那笔成交，能说明交易者的整个组合看跌吗？",
						[
							[
								"yes",
								"Yes: a put buyer must be bearish overall",
								"能：买看跌的人整体上必然看跌",
							],
							[
								"no",
								"No: the put could protect shares or close a short put",
								"不能：这张看跌可能是在保护持股，或平掉原有的看跌空头",
							],
						],
						"no",
						"Nothing links this put to the trader's other positions. A shareholder buying protection gets the same bearish flow label.",
						"没有任何信息把这张看跌和交易者的其他持仓联系起来。一位买保护的持股者，也会得到同样的看跌成交流标签。",
					),
				],
			};
		},
	},
	{
		id: "validate-option-print",
		conceptLab: {
			kind: "validate-option-print",
			intro: t(
				"Read a 500-contract block field by field, sort what it establishes from what it can't, and pick the record that fills each gap.",
				"逐项读取一笔 500 张的大单，区分它能确定和不能确定的内容，再为每个缺口选择合适的记录。",
			),
		},
		sources: [quotes, basics],
		explanation: t(
			"Read an execution in this order: contract identity, event time, price per unit, count and multiplier, matched quote, then any execution conditions and linkage. Calculate premium from the execution itself. A contemporaneous valid bid/ask can support an aggressor inference; a prior or incompatible quote cannot. Opening/closing flags and linked legs would be additional evidence, not conclusions from premium size. Separate what is observed, what is calculated, what is inferred under a convention, and what is still unknown. The best next check addresses a specific missing fact rather than searching for another dramatic print or waiting to see whether price rises.",
			"按顺序检查成交：合约身份、事件时间、单位价格、数量与乘数、匹配报价，然后检查成交条件和关联。权利金应由成交本身计算。同时刻有效报价可支持主动方推断，历史或不兼容报价则不能。开平仓标记与关联策略腿是额外证据，不是金额大小的结论。区分观测、计算、约定下的推断与仍未知信息。下一项检查应针对具体缺口，而不是再找一笔大成交或等待价格上涨。",
		),
		example: t(
			"500 calls at $2.15 with multiplier 100 represent $107,500. A $2.00/$2.10 quote from 90 seconds before the execution does not establish reliable buyer initiation. The amount remains known. Obtain a time-aligned quote; even that will not identify the whole strategy without linkage.",
			"500 张看涨以 $2.15 成交、乘数 100，总额 $107,500。若 $2.00/$2.10 报价早于成交 90 秒，就不能可靠判断主动买入；金额仍然已知。应获取匹配时间报价，即便得到，也不能在缺少关联时确定完整策略。",
		),
		misconception: t(
			"An old quote makes the side uncertain; it doesn't flip it. Premium measures dollars exchanged, not conviction.",
			"旧报价让方向变得不确定，但不会把它反过来。权利金衡量的是交换的金额，而不是信心。",
		),
		case: (v) => {
			const count = [300, 400, 250, 600][v];
			const price = [2.1, 1.8, 4.1, 1.25][v];
			const stale = v === 2;
			return {
				brief: t(
					`${count} ALFA calls trade at ${money(price)}, and one contract covers 100 shares. The quote you have shows the bid at the trade price and the ask $0.10 higher. ${stale ? "That quote is 90 seconds older than the trade." : "That quote is from the same moment and isn't crossed."} Nothing says whether the trade opened or closed a position, or whether it was part of a multi-leg order.`,
					`${count} 张 ALFA 看涨以 ${money(price)} 成交，一张合约对应 100 股。你手上的报价显示买价等于成交价，卖价高 $0.10。${stale ? "这个报价比成交早了 90 秒。" : "这个报价与成交同一时刻，且没有交叉。"}没有信息说明这笔成交是开仓还是平仓，也不知道它是否属于多腿订单。`,
				),
				questions: [
					n(
						"premium",
						"How much premium changed hands?",
						"这笔成交交换了多少权利金？",
						count * price * 100,
						"dollars",
						"美元",
						`${money(price)} × ${count} × 100 = ${money(count * price * 100, 0)}.`,
						`${money(price)} × ${count} × 100 = ${money(count * price * 100, 0)}。`,
					),
					c(
						"inference",
						"What can you say about who started the trade?",
						"关于谁发起了这笔成交，你能得出什么结论？",
						[
							["buyer", "A buyer probably started it", "大概是买方发起的"],
							[
								"seller",
								"A seller probably started it; the strategy is still unknown",
								"大概是卖方发起的；策略仍然未知",
							],
							[
								"unknown",
								"You can't reliably say who started it",
								"无法可靠判断是谁发起的",
							],
						],
						stale ? "unknown" : "seller",
						stale
							? "The quote is 90 seconds older than the trade, so it can't place the print. The premium is still known; the side isn't."
							: "It printed at a bid from the same moment, which points to a seller starting it. That says nothing about whether it opened a position or what strategy it served.",
						stale
							? "报价比成交早了 90 秒，无法给这笔成交定位。权利金仍然已知，方向则不知道。"
							: "它成交在同一时刻的买价上，说明大概是卖方发起的。但这不能说明它是否开仓，也不能说明它服务于什么策略。",
					),
				],
			};
		},
	},
];
