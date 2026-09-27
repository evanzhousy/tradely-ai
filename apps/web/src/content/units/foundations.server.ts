import "@tanstack/react-start/server-only";
import {
	basics,
	choose as c,
	numberQuestion as n,
	orders,
	quotes,
	type TeachingUnit,
	t,
} from "./authoring.server";

import { revisedFoundationUnits } from "./foundation-revision.server";
import { printReviewConceptData } from "./print-review-concept.server";

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
		conceptLab: {
			kind: "validate-option-print",
			data: printReviewConceptData,
			intro: t(
				"Inspect one execution, separate what its evidence can support, and choose a follow-up that closes a specific gap. These fictional records let you practice the full review before your independent case.",
				"检查一笔成交，区分证据能支持的结论，再选择填补具体缺口的后续检查。先用这些虚构记录练习完整审查流程，再进入独立案例。",
			),
		},
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
