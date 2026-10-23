import "@tanstack/react-start/server-only";
import type { LearningCopy } from "@/domain/learning/types";
import {
	basics,
	type ChoiceSpec,
	choose as c,
	money,
	numberQuestion as n,
	orders,
	plain,
	quotes,
	signedMoney,
	type TeachingUnit,
	t,
} from "./authoring.server";

import { revisedFoundationUnits } from "./foundation-revision.server";

/** A choice with why it misses, or without a why where it is the case's answer. */
const option = (
	id: string,
	en: string,
	zh: string,
	why: LearningCopy | undefined,
): ChoiceSpec => (why ? [id, en, zh, why.en, why.zh] : [id, en, zh]);

/** What each execution-side code means, for the why line of a code the learner picked. */
const codeMeaning: Record<string, { en: string; zh: string }> = {
	AASK: t("above the ask", "高于卖价"),
	ASK: t("exactly at the ask", "正好等于卖价"),
	MID: t("inside the spread", "在价差之内"),
	BID: t("exactly at the bid", "正好等于买价"),
	BBID: t("below the bid", "低于买价"),
};

export const foundationUnits: TeachingUnit[] = [
	...revisedFoundationUnits,
	{
		id: "quotes-orders-trades",
		version: 3,
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
			/** After the quote: an offer or a bid is cancelled, or a trade takes part of the ask or the bid. */
			const event = (["cancelOffer", "lift", "cancelBid", "hit"] as const)[v];
			const cancel = event === "cancelOffer" || event === "cancelBid";
			const askSide = event === "cancelOffer" || event === "lift";
			const shown = askSide ? 30 : 40;
			const traded = askSide ? 10 : 15;
			const left = shown - traded;
			const printed = money(askSide ? ask : bid);
			const brief = {
				cancelOffer: t(
					`An ALFA call is quoted ${money(bid)} bid and ${money(ask)} ask. Then a seller cancels an offer that never filled, and no trade message follows.`,
					`某 ALFA 看涨报价为买价 ${money(bid)}、卖价 ${money(ask)}。随后一位卖方撤销了一张从未成交的卖单，之后没有任何成交消息。`,
				),
				lift: t(
					`An ALFA call is quoted ${money(bid)} × 25 bid and ${money(ask)} × ${shown} ask, sizes in contracts. Then a trade message prints ${traded} contracts at ${money(ask)}. No resting order is cancelled.`,
					`某 ALFA 看涨报价为买价 ${money(bid)} × 25、卖价 ${money(ask)} × ${shown}，数量以合约张数计。随后一条成交消息显示 ${traded} 张以 ${money(ask)} 成交。没有挂单被撤销。`,
				),
				cancelBid: t(
					`An ALFA call is quoted ${money(bid)} bid and ${money(ask)} ask. Then a buyer cancels a bid that never filled, and no trade message follows.`,
					`某 ALFA 看涨报价为买价 ${money(bid)}、卖价 ${money(ask)}。随后一位买方撤销了一张从未成交的买单，之后没有任何成交消息。`,
				),
				hit: t(
					`An ALFA call is quoted ${money(bid)} × ${shown} bid and ${money(ask)} × 20 ask, sizes in contracts. Then a trade message prints ${traded} contracts at ${money(bid)}. No resting order is cancelled.`,
					`某 ALFA 看涨报价为买价 ${money(bid)} × ${shown}、卖价 ${money(ask)} × 20，数量以合约张数计。随后一条成交消息显示 ${traded} 张以 ${money(bid)} 成交。没有挂单被撤销。`,
				),
			}[event];
			const tradeChoice: ChoiceSpec = cancel
				? [
						"trade",
						"The cancelled contracts traded",
						"被撤销的合约成交了",
						"A cancel removes an order from the book. Only a trade message means contracts changed hands, and none followed.",
						"撤单只是把一张订单从订单簿移走。只有成交消息才表示合约换手，而之后并没有成交消息。",
					]
				: [
						"trade",
						`All ${shown} ${askSide ? "offered" : "bid"} contracts traded`,
						`${askSide ? "卖价" : "买价"}上挂出的 ${shown} 张全部成交了`,
						`The print is ${traded} contracts. ${shown} is the size that was ${askSide ? "offered" : "bid"}; the other ${left} are still there at ${printed}.`,
						`成交记录是 ${traded} 张。${shown} 张是${askSide ? "卖价" : "买价"}上挂出的数量；其余 ${left} 张仍以 ${printed} 挂在那里。`,
					];
			const buyerWhy = {
				cancelOffer: t(
					"Had a buyer taken the offer, a trade would have printed at the ask. The offer left without a trade, so nobody bought it.",
					"如果有买方接受了卖价，就会在卖价打印出一笔成交。这张卖单离开时没有成交，所以没有人买下它。",
				),
				lift: undefined,
				cancelBid: t(
					"Had a buyer taken an offer, a trade would have printed at the ask. No trade message followed, and the order that left was a bid, not an offer.",
					"如果有买方吃掉卖单，就会在卖价打印出一笔成交。之后没有成交消息，而且离开的是一张买单，不是卖单。",
				),
				hit: t(
					`The print is at ${money(bid)}, the bid. A seller sold to resting bids; a buyer taking the offer would have printed at ${money(ask)}.`,
					`成交在 ${money(bid)}，也就是买价。是卖方卖给了挂着的买单；如果是买方吃掉卖单，成交会在 ${money(ask)}。`,
				),
			}[event];
			const sellerWhy = {
				cancelOffer: t(
					"Had a seller sold to the bid, a trade would have printed at the bid. No trade message followed, and the order that left was an offer, not a bid.",
					"如果有卖方卖给买单，就会在买价打印出一笔成交。之后没有成交消息，而且离开的是一张卖单，不是买单。",
				),
				lift: t(
					`The print is at ${money(ask)}, the ask. A buyer took offered contracts; a sale to the bid would have printed at ${money(bid)}.`,
					`成交在 ${money(ask)}，也就是卖价。是买方吃掉了挂出的卖单；如果是卖给买单，成交会在 ${money(bid)}。`,
				),
				cancelBid: t(
					"Had a seller sold to the bid, a trade would have printed at the bid. The bid left without a trade, so nobody sold to it.",
					"如果有卖方卖给买单，就会在买价打印出一笔成交。这张买单离开时没有成交，所以没有人卖给它。",
				),
				hit: undefined,
			}[event];
			const eventChoices: ChoiceSpec[] = [
				tradeChoice,
				[
					"quote",
					"An order left the book; nothing traded",
					"一张订单离开了订单簿；没有成交",
					`A trade message means contracts changed hands: ${traded} printed at ${printed}. Nobody cancelled an order, so the ${askSide ? "offer shrank because a buyer took part of it" : "bid shrank because a seller sold into it"}.`,
					`成交消息表示合约换手了：${traded} 张以 ${printed} 成交。没有人撤单，所以${askSide ? "卖单变少，是因为有买方吃掉了一部分" : "买单变少，是因为有卖方卖给了它"}。`,
				],
				option(
					"buyer",
					"A buyer took the offer",
					"有买方吃掉了这张卖单",
					buyerWhy,
				),
				option(
					"seller",
					"A seller sold to the bid",
					"有卖方卖给了买单",
					sellerWhy,
				),
			];
			const sideChoices: ChoiceSpec[] = [
				[
					"ask",
					"The ask: fewer contracts offered",
					"卖价一边：挂出待卖的合约变少",
					cancel
						? "An offer is an order to sell, shown at the ask. The buyer withdrew a bid, so only the bid changes."
						: `The trade printed at ${money(bid)}, the bid: a seller sold to resting bids. Nothing offered at ${money(ask)} was touched.`,
					cancel
						? "卖单是卖出的订单，显示在卖价上。这次撤销的是买方的买单，所以只有买价一边变化。"
						: `成交在 ${money(bid)}，也就是买价：卖方卖给了挂着的买单。${money(ask)} 上挂出的卖单没有被动过。`,
				],
				[
					"bid",
					"The bid: fewer contracts bid",
					"买价一边：挂出待买的合约变少",
					cancel
						? "A bid is an order to buy. The seller withdrew an offer to sell, which sits at the ask; the bid is untouched."
						: `The trade printed at ${money(ask)}, the ask: a buyer took offered contracts. No resting bid was touched.`,
					cancel
						? "买单是买入的订单。这次撤销的是卖方的卖单，它在卖价一边；买价没有变化。"
						: `成交在 ${money(ask)}，也就是卖价：买方吃掉了挂出的卖单。挂着的买单没有被动过。`,
				],
				[
					"both",
					"Both sides: a buyer and a seller are involved",
					"两边都变：涉及一个买方和一个卖方",
					cancel
						? `A cancel involves only the order's owner. One ${askSide ? "offer" : "bid"} left the book; nothing on the ${askSide ? "bid" : "ask"} changed.`
						: `A trade has a buyer and a seller, but only the resting side of the quote shrinks. The ${askSide ? "buyer's" : "seller's"} order traded at once and never sat on the ${askSide ? "bid" : "ask"}.`,
					cancel
						? `撤单只涉及下单的那一方。离开订单簿的是一张${askSide ? "卖单" : "买单"}；${askSide ? "买价" : "卖价"}一边没有任何变化。`
						: `一笔成交有买方也有卖方，但只有挂单的那一边会变少。${askSide ? "买方" : "卖方"}的订单是立即成交的，从来没有挂在${askSide ? "买价" : "卖价"}上。`,
				],
			];
			const sideWhy = {
				cancelOffer: t(
					"An offer to sell sits at the ask. Cancelling it takes size off the ask; the bid doesn't move.",
					"卖单挂在卖价上。撤销它会让卖价上的数量变少，买价不动。",
				),
				lift: t(
					`The buyer took contracts from the ask, so the ask size falls from ${shown} to ${left}. Nothing changes on the bid.`,
					`买方从卖价上吃掉了合约，所以卖价数量从 ${shown} 张降到 ${left} 张。买价一边没有变化。`,
				),
				cancelBid: t(
					"A bid to buy sits at the bid. Cancelling it takes size off the bid; the ask doesn't move.",
					"买单挂在买价上。撤销它会让买价上的数量变少，卖价不动。",
				),
				hit: t(
					`The seller sold into the bid, so the bid size falls from ${shown} to ${left}. Nothing changes on the ask.`,
					`卖方卖给了买单，所以买价数量从 ${shown} 张降到 ${left} 张。卖价一边没有变化。`,
				),
			}[event];
			return {
				brief,
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
						cancel
							? "What does the cancellation tell you?"
							: "What does the trade message tell you?",
						cancel ? "这次撤单能说明什么？" : "这条成交消息能说明什么？",
						eventChoices,
						cancel ? "quote" : askSide ? "buyer" : "seller",
						cancel
							? "A cancel is an order event. With no trade message, nothing traded."
							: `A trade at the ${askSide ? "ask means a buyer took offered contracts" : "bid means a seller sold to resting bids"}. ${traded} traded; the quote showed ${shown}, and the other ${left} are still there.`,
						cancel
							? "撤单是订单事件。没有成交消息，就没有成交。"
							: `成交在${askSide ? "卖价，说明是买方吃掉了挂出的卖单" : "买价，说明是卖方卖给了挂着的买单"}。成交了 ${traded} 张；报价上显示的是 ${shown} 张，其余 ${left} 张仍挂在那里。`,
					),
					c(
						"side",
						"Which side of the quote does this change?",
						"这会改变报价的哪一边？",
						sideChoices,
						askSide ? "ask" : "bid",
						sideWhy.en,
						sideWhy.zh,
					),
				],
			};
		},
	},
	{
		id: "execution-counterparties",
		version: 3,
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
			/** Case 1 is a market buy, which keeps taking offers up the book instead of waiting at a limit. */
			const market = v === 1;
			const price = buyer ? 2.1 : 2;
			const rest = requested - available;
			const next = 2.2;
			const nextSize = 20;
			const brief = market
				? t(
						`You send a market buy for ${requested} ALFA calls. The ask is ${money(price)}, with ${available} contracts offered there, and the next offer is ${nextSize} contracts at ${money(next)}. Nobody adds, cancels or sends other orders.`,
						`你发出 ${requested} 张 ALFA 看涨的市价买单。卖价是 ${money(price)}，那里挂着 ${available} 张；再往上一档是 ${money(next)} 的 ${nextSize} 张。没有人新增、撤销或发出其他订单。`,
					)
				: buyer
					? t(
							`You send a limit buy for ${requested} ALFA calls at $2.10. The ask is $2.10, so it can trade at once, but only ${available} contracts are offered there. Nobody adds, cancels or sends other orders.`,
							`你发出 ${requested} 张 ALFA 看涨、限价 $2.10 的买单。卖价是 $2.10，所以可以立即成交，但那里只挂着 ${available} 张。没有人新增、撤销或发出其他订单。`,
						)
					: t(
							`You send a limit sell for ${requested} ALFA calls at $2.00. The bid is $2.00, so it can trade at once, but only ${available} contracts are bid there. Nobody adds, cancels or sends other orders.`,
							`你发出 ${requested} 张 ALFA 看涨、限价 $2.00 的卖单。买价是 $2.00，所以可以立即成交，但那里只挂着 ${available} 张买单。没有人新增、撤销或发出其他订单。`,
						);
			const remainderWhy = {
				rest: market
					? t(
							`A market order has no limit price to wait at. Once the ${available} at ${money(price)} are gone, it takes the next offer: ${rest} more at ${money(next)}.`,
							`市价单没有可以等待的限价。${money(price)} 的 ${available} 张成交后，它会接着吃下一档：在 ${money(next)} 再成交 ${rest} 张。`,
						)
					: undefined,
				next: market
					? undefined
					: buyer
						? t(
								`A limit buy never pays more than its limit. Nothing else is offered at ${money(price)} or lower, so the other ${rest} can't trade yet.`,
								`限价买单绝不会付高于限价的价格。${money(price)} 或更低已经没有其他卖单，所以其余 ${rest} 张暂时无法成交。`,
							)
						: t(
								`A limit sell never takes less than its limit. Nothing else is bid at ${money(price)} or higher, so the other ${rest} can't trade yet.`,
								`限价卖单绝不会接受低于限价的价格。${money(price)} 或更高已经没有其他买单，所以其余 ${rest} 张暂时无法成交。`,
							),
				cancel: market
					? t(
							`A market order isn't cancelled when the first offers run out. It keeps taking offers, so the other ${rest} fill at ${money(next)}.`,
							`第一档卖单用完后，市价单不会被撤销。它会继续吃卖单，所以其余 ${rest} 张在 ${money(next)} 成交。`,
						)
					: t(
							`A limit order isn't cancelled when the ${buyer ? "offers" : "bids"} at its price run out. The other ${rest} stay in the book at ${money(price)} until a ${buyer ? "seller" : "buyer"} trades with them or you cancel them.`,
							`限价上的${buyer ? "卖单" : "买单"}用完了，限价单也不会因此被撤销。其余 ${rest} 张以 ${money(price)} 留在订单簿中，直到有${buyer ? "卖方" : "买方"}与它们成交，或你自己撤单。`,
						),
			};
			return {
				brief,
				questions: [
					n(
						"unfilled",
						"How many of your contracts can't fill right away?",
						"你的订单中有多少张不能立即成交？",
						market ? 0 : rest,
						"contracts",
						"张",
						market
							? `None. A market order has no limit: after the ${available} at ${money(price)}, it takes ${rest} of the ${nextSize} offered at ${money(next)}, so all ${requested} fill.`
							: `${requested} − ${available} = ${rest}. They wait in the book at your limit until someone ${buyer ? "sells" : "buys"} there.`,
						market
							? `0 张。市价单没有限价：${money(price)} 的 ${available} 张成交后，它会接着吃掉 ${money(next)} 那 ${nextSize} 张中的 ${rest} 张，所以 ${requested} 张全部成交。`
							: `${requested} − ${available} = ${rest}。它们按你的限价留在订单簿中，等有人在那里${buyer ? "卖出" : "买入"}。`,
					),
					c(
						"aggressor",
						market ? "Who started these trades?" : "Who started the trade?",
						market ? "这些成交是谁发起的？" : "这笔成交是谁发起的？",
						[
							[
								"seller",
								market
									? "The resting sellers, who supplied the offers"
									: buyer
										? "The resting seller, who supplied the offer"
										: "You, the incoming seller; both sides trade at the bid",
								market
									? "挂单的卖方，因为卖单是他们挂的"
									: buyer
										? "挂单的卖方，因为卖单是他挂的"
										: "你，主动到来的卖方；双方都在买价成交",
								market
									? "The resting sellers only supplied the offers. Your market buy asked for an immediate fill, so you started both trades."
									: "The resting seller only supplied the offer. Your incoming buy asked for an immediate fill, so you started the trade.",
								market
									? "挂单的卖方只是提供了卖单。你的市价买单要求立即成交，所以两笔成交都是你发起的。"
									: "挂单的卖方只是提供了卖单。你的买单要求立即成交，所以是你发起的。",
							],
							[
								"buyer",
								market
									? "You, the incoming buyer; each fill is at the offer you take"
									: buyer
										? "You, the incoming buyer; both sides trade at the ask"
										: "The resting buyer, since it printed at the bid",
								market
									? "你，主动到来的买方；每笔都成交在你吃掉的卖单价格上"
									: buyer
										? "你，主动到来的买方；双方都在卖价成交"
										: "挂单的买方，因为成交在买价",
								"The resting buyer only supplied the bid. Your incoming sell asked for an immediate fill, so you started the trade.",
								"挂单的买方只是提供了买单。你的卖单要求立即成交，所以是你发起的。",
							],
							[
								"both",
								"Neither: count the buyer and the seller as two prints",
								"都不是：把买方和卖方算作两笔成交",
								market
									? `Each trade has two sides but prints once: ${available} at ${money(price)} and ${rest} at ${money(next)} are two prints, not four. Your market buy started both.`
									: "One trade has two sides but prints once. Your incoming order started it; the resting order is the other side of the same trade.",
								market
									? `每笔成交都有两方，但只记录一次：${money(price)} 的 ${available} 张和 ${money(next)} 的 ${rest} 张是两笔成交，不是四笔。两笔都是你的市价买单发起的。`
									: "一笔成交有两方，但只记录一次。你的订单发起了它，挂单是同一笔成交的另一方。",
							],
						],
						buyer ? "buyer" : "seller",
						market
							? "Your market buy asked for an immediate fill, so you started both trades. The resting sellers on the other side take part in the same trades."
							: "Your incoming order asked for an immediate fill, so you started it. The resting order on the other side takes part in the same single trade.",
						market
							? "你的市价买单要求立即成交，所以两笔成交都是你发起的。对面挂单的卖方参与的是同样这两笔成交。"
							: "你的订单要求立即成交，所以是你发起的。对面的挂单参与的是同一笔成交。",
					),
					c(
						"remainder",
						`Once the ${available} contracts at ${money(price)} have traded, what happens to the rest of your order?`,
						`${money(price)} 的 ${available} 张成交之后，你订单的其余部分会怎样？`,
						[
							option(
								"rest",
								"It waits in the book until someone trades with it",
								"留在订单簿中，等有人与它成交",
								remainderWhy.rest,
							),
							option(
								"next",
								"It trades at the next, worse price",
								"以下一个、更差的价格成交",
								remainderWhy.next,
							),
							option(
								"cancel",
								"It's cancelled automatically",
								"被自动撤销",
								remainderWhy.cancel,
							),
						],
						market ? "next" : "rest",
						market
							? `A market order takes the prices available: ${available} fill at ${money(price)} and the other ${rest} at ${money(next)}. The fill is certain; the price isn't.`
							: `Your limit keeps the order from trading at a worse price, so the other ${rest} wait in the book at ${money(price)}. A limit order trades only at its price or better.`,
						market
							? `市价单接受可用的价格：${available} 张在 ${money(price)} 成交，其余 ${rest} 张在 ${money(next)} 成交。成交有保证，价格却没有。`
							: `限价让订单不会以更差的价格成交，所以其余 ${rest} 张以 ${money(price)} 留在订单簿中。限价单只会以限价或更优价格成交。`,
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
								(code): ChoiceSpec => [
									code,
									code,
									code,
									`${code} means a print ${codeMeaning[code].en}. ${money(item.price)} is ${item.why.en}.`,
									`${code} 表示成交${codeMeaning[code].zh}。${money(item.price)} ${item.why.zh}。`,
								],
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
							[
								"same",
								"All five codes, unchanged",
								"全部五个代码，保持不变",
								"The codes depended on the quote. If it's 90 seconds old, it can't place these prints, so the codes no longer hold.",
								"代码取决于报价。如果报价早了 90 秒，就无法给这些成交定位，代码也就不再成立。",
							],
							[
								"unknown",
								"The five prices, but not their codes",
								"五个成交价，但不保留代码",
							],
							[
								"reverse",
								"The codes, flipped from buys to sells",
								"代码，但把买入全部改成卖出",
								"An old quote makes the side unknown, not reversed. Nothing in the evidence says the buys were sells.",
								"过时的报价让方向变得未知，而不是相反。证据中没有任何东西表明买入其实是卖出。",
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
					opposite: t(
						"Bearish would fit a call sold at the bid. This call was bought at the ask, and a bought call gains if ALFA rises.",
						"看跌标签适用于在买价卖出的看涨。这张看涨是在卖价买入的，买入的看涨在 ALFA 上涨时获利。",
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
					opposite: t(
						"A call isn't bullish by itself. This one was sold at the bid, and its seller gives up ALFA's upside.",
						"看涨期权本身并不代表看涨。这张是在买价卖出的，卖方放弃了 ALFA 的上涨空间。",
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
					opposite: t(
						"Buying isn't bullish by itself. A put bought at the ask gains if ALFA falls.",
						"买入本身并不代表看涨。在卖价买入的看跌在 ALFA 下跌时获利。",
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
					opposite: t(
						"A put isn't bearish by itself. This one was sold at the bid, and its seller loses if ALFA falls.",
						"看跌期权本身并不代表看跌。这张是在买价卖出的，卖方在 ALFA 下跌时亏损。",
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
								[
									"bull",
									"Bullish flow",
									"看涨成交流",
									row.opposite.en,
									row.opposite.zh,
								],
								[
									"bear",
									"Bearish flow",
									"看跌成交流",
									row.opposite.en,
									row.opposite.zh,
								],
								[
									"neutral",
									"Direction can't be told",
									"无法判断方向",
									"The side is known: there's a quote from the same moment and reliable evidence of who started it, so the print gets a direction.",
									"方向是已知的：有同一时刻的报价和谁发起的可靠证据，所以这笔成交有方向。",
								],
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
								"Neutral describes the evidence, not a forecast. Nothing here says the trader expects ALFA to stay flat.",
								"中性描述的是证据，而不是预测。这里没有任何信息说明交易者预期 ALFA 横盘。",
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
								"A label on one print says nothing about the trader's whole book. Neutral here only means the side is unknown.",
								"一笔成交的标签说明不了交易者的整个账户。这里的中性只表示方向未知。",
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
								"A put buyer isn't necessarily bearish overall: a shareholder buying protection, or someone closing a short put, prints the same way.",
								"买看跌的人整体上不一定看跌：买保护的持股者、平掉看跌空头的人，成交记录都一样。",
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
		version: 3,
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
			/** The quote beside the print: at its bid or at its ask from the same moment, 90 seconds old, or crossed. */
			const quote = (["bid", "ask", "stale", "crossed"] as const)[v];
			const quoteLine = {
				bid: t(
					"The quote you have shows the bid at the trade price and the ask $0.10 higher. That quote is from the same moment and isn't crossed.",
					"你手上的报价显示买价等于成交价，卖价高 $0.10。这个报价与成交同一时刻，且没有交叉。",
				),
				ask: t(
					"The quote you have shows the ask at the trade price and the bid $0.10 lower. That quote is from the same moment and isn't crossed.",
					"你手上的报价显示卖价等于成交价，买价低 $0.10。这个报价与成交同一时刻，且没有交叉。",
				),
				stale: t(
					"The quote you have shows the bid at the trade price and the ask $0.10 higher. That quote is 90 seconds older than the trade.",
					"你手上的报价显示买价等于成交价，卖价高 $0.10。这个报价比成交早了 90 秒。",
				),
				crossed: t(
					`The quote you have shows the ask at the trade price and the bid $0.10 higher, at ${money(price + 0.1)}. That quote is from the same moment, but it's crossed: its bid is above its ask.`,
					`你手上的报价显示卖价等于成交价，买价反而高 $0.10，为 ${money(price + 0.1)}。这个报价与成交同一时刻，但它是交叉的：买价高于卖价。`,
				),
			}[quote];
			const crossedWhy = t(
				`The quote is crossed: its ${money(price + 0.1)} bid is above its ${money(price)} ask, so it isn't a usable market and can't place the print.`,
				`这个报价是交叉的：${money(price + 0.1)} 的买价高于 ${money(price)} 的卖价，所以它不是可用的市场，无法给这笔成交定位。`,
			);
			const why = {
				buyer: {
					bid: t(
						"It printed at a bid from the same moment, which points to a seller starting it, not a buyer.",
						"它成交在同一时刻的买价上，说明大概是卖方发起的，而不是买方。",
					),
					ask: undefined,
					stale: t(
						"The quote is 90 seconds older than the trade, so it can't say who started it, buyer or seller.",
						"报价比成交早了 90 秒，无法说明是买方还是卖方发起的。",
					),
					crossed: t(
						`The print matches the ask, but that's not enough. ${crossedWhy.en}`,
						`成交价等于卖价，但这还不够。${crossedWhy.zh}`,
					),
				},
				seller: {
					bid: undefined,
					ask: t(
						"It printed at an ask from the same moment, which points to a buyer starting it, not a seller.",
						"它成交在同一时刻的卖价上，说明大概是买方发起的，而不是卖方。",
					),
					stale: t(
						"A bid from 90 seconds earlier can't place this print, so even a probable seller goes further than the evidence.",
						"90 秒前的买价无法给这笔成交定位，所以连“大概是卖方”也超出了证据。",
					),
					crossed: t(
						`The print is below the bid, but that's not enough. ${crossedWhy.en} Even a probable seller goes further than the evidence.`,
						`成交价低于买价，但这还不够。${crossedWhy.zh}连“大概是卖方”也超出了证据。`,
					),
				},
				unknown: {
					bid: t(
						"With a bid from the same moment, the print points to a seller starting it. That much you can say; it's the strategy that stays unknown.",
						"有同一时刻的买价，这笔成交说明大概是卖方发起的。这一点可以说，仍然未知的是策略。",
					),
					ask: t(
						"With an ask from the same moment, the print points to a buyer starting it. That much you can say; it's the strategy that stays unknown.",
						"有同一时刻的卖价，这笔成交说明大概是买方发起的。这一点可以说，仍然未知的是策略。",
					),
					stale: undefined,
					crossed: undefined,
				},
			};
			const explanation = {
				bid: t(
					"It printed at a bid from the same moment, which points to a seller starting it. That says nothing about whether it opened a position or what strategy it served.",
					"它成交在同一时刻的买价上，说明大概是卖方发起的。但这不能说明它是否开仓，也不能说明它服务于什么策略。",
				),
				ask: t(
					"It printed at an ask from the same moment, which points to a buyer starting it. That says nothing about whether it opened a position or what strategy it served.",
					"它成交在同一时刻的卖价上，说明大概是买方发起的。但这不能说明它是否开仓，也不能说明它服务于什么策略。",
				),
				stale: t(
					"The quote is 90 seconds older than the trade, so it can't place the print. The premium is still known; the side isn't.",
					"报价比成交早了 90 秒，无法给这笔成交定位。权利金仍然已知，方向则不知道。",
				),
				crossed: t(
					`${crossedWhy.en} The premium is still known; the side isn't.`,
					`${crossedWhy.zh}权利金仍然已知，方向则不知道。`,
				),
			}[quote];
			return {
				brief: t(
					`${count} ALFA calls trade at ${money(price)}, and one contract covers 100 shares. ${quoteLine.en} Nothing says whether the trade opened or closed a position, or whether it was part of a multi-leg order.`,
					`${count} 张 ALFA 看涨以 ${money(price)} 成交，一张合约对应 100 股。${quoteLine.zh}没有信息说明这笔成交是开仓还是平仓，也不知道它是否属于多腿订单。`,
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
							option(
								"buyer",
								"A buyer probably started it",
								"大概是买方发起的",
								why.buyer[quote],
							),
							option(
								"seller",
								"A seller probably started it; the strategy is still unknown",
								"大概是卖方发起的；策略仍然未知",
								why.seller[quote],
							),
							option(
								"unknown",
								"You can't reliably say who started it",
								"无法可靠判断是谁发起的",
								why.unknown[quote],
							),
						],
						{
							bid: "seller",
							ask: "buyer",
							stale: "unknown",
							crossed: "unknown",
						}[quote],
						explanation.en,
						explanation.zh,
					),
				],
			};
		},
	},
	{
		id: "put-call-parity",
		version: 3,
		conceptLab: {
			kind: "put-call-parity",
			intro: t(
				"Add a long Oct 18 100 call to a short 100 put and get a line like 100 shares, price the put from the call with ALFA at $102, and check a $5.90 call print against parity at its own time.",
				"把 10月18日 100 看涨多头加上 100 看跌空头，得到一条像 100 股一样的线；在 ALFA 为 $102 时由看涨推出看跌的价格；并按成交自身的时间，用平价关系核对一笔 $5.90 的看涨成交。",
			),
		},
		sources: [
			basics,
			{
				title: "Investopedia · Put-call parity",
				href: "https://www.investopedia.com/terms/p/putcallparity.asp",
			},
		],
		explanation: t(
			"A long call and a short put with the same strike and expiry together behave like owning the stock and owing the strike: at expiry one of the two is exercised or assigned, so the pair always ends as shares bought at the strike. Their prices therefore line up. With no interest or dividends, call minus put equals stock minus strike: C − P = S − K. With interest the strike is discounted, and expected dividends come off the stock: C − P = S − PV(K) − PV(dividends). American-style early exercise loosens the relationship slightly. Quotes respect parity within their spreads; a print that seems to break it usually comes from comparing prices from different moments, a late or corrected report, or one leg of a complex order.",
			"同一行权价和到期日的看涨多头加看跌空头，合起来就像持有股票、同时欠下行权价：到期时两者之一会被行权或指派，所以这一组最后总是以行权价买入股票。因此它们的价格必须对得上。没有利息和股息时，看涨减看跌等于股价减行权价：C − P = S − K。有利息时行权价要折现，预期股息要从股价中扣除：C − P = S − PV(K) − PV(股息)。美式期权可提前行权，会让这个关系略微放松。报价会在买卖价差之内遵守平价；看似违反平价的成交，通常来自拿不同时刻的价格比较、延迟或更正的报告，或者复杂订单中的一条腿。",
		),
		example: t(
			"With ALFA at $102, the Oct 18 100 call's model mid is $5.25, so the 100 put's must be $5.25 − $2.00 = $3.25. Buy the call at the $4.20 ask and sell the put at the $4.05 bid with ALFA at $100, and the pair acts like 100 shares bought at $100.15. A 14:12 call print at $5.90 looks $0.65 rich against the 14:12 put, but it executed at 13:58 with ALFA at $103.05, when parity put it at $5.90.",
			"ALFA 为 $102 时，10月18日 100 看涨的模型中间价为 $5.25，所以 100 看跌必须是 $5.25 − $2.00 = $3.25。在 ALFA 为 $100 时以 $4.20 的卖价买入看涨、以 $4.05 的买价卖出看跌，这一组就相当于以 $100.15 买入 100 股。14:12 一笔 $5.90 的看涨成交，对照 14:12 的看跌似乎贵了 $0.65，但它实际成交于 13:58，当时 ALFA 为 $103.05，平价给出的价格正是 $5.90。",
		),
		misconception: t(
			"Parity links prices from the same moment, the same strike and the same expiry. A print that seems to break it is a reason to check its time and conditions, not evidence that someone knows something.",
			"平价关系连接的是同一时刻、同一行权价、同一到期日的价格。一笔看似违反平价的成交，是去核查它的时间和条件的理由，而不是有人掌握内情的证据。",
		),
		case: (v) => {
			const spot = [102, 97, 105, 100][v];
			const strike = [100, 100, 100, 95][v];
			const call = [5.25, 1.7, 7.6, 7.1][v];
			/** A dividend paid before expiry comes off the stock: C − P = S − D − K with no interest. */
			const dividend = [0, 1, 0, 0.5][v];
			/** Whether the put compared with the call print traded in the same second, which settles the time check. */
			const sameMoment = v >= 2;
			const put = call - (spot - dividend - strike);
			const expiry = [92, 104, 110, 90][v];
			const paid = dividend > 0;
			const relationWhy = {
				plain: paid
					? t(
							`ALFA pays a ${money(dividend)} dividend before expiry. The call holder doesn't receive it, and the stock should drop by about that much when it goes ex-dividend, so it comes off S first.`,
							`ALFA 在到期前派发 ${money(dividend)} 的股息。看涨持有人拿不到它，除息时股价也应下跌约这个数，所以要先从 S 中扣除。`,
						)
					: undefined,
				dividend: paid
					? undefined
					: t(
							"No dividend is paid before this expiry, so there's nothing to take off S: C − P = S − K as it stands.",
							"这个到期日之前不派息，S 中没有可扣除的：直接用 C − P = S − K。",
						),
				add: paid
					? t(
							`The ${money(dividend)} dividend goes to shareholders, not the call holder, and the stock should drop by it when it goes ex-dividend. It comes off S; adding it gets the direction wrong.`,
							`${money(dividend)} 的股息归股东，不归看涨持有人，除息时股价也应随之下跌。它要从 S 中扣除，加上去方向就反了。`,
						)
					: t(
							"No dividend is paid before this expiry. Even if one were, it would come off S, not be added: the call holder never receives it.",
							"这个到期日之前不派息。即使派息，也应从 S 中扣除而不是加上：看涨持有人拿不到股息。",
						),
			};
			const printWhy = {
				time: sameMoment
					? t(
							"That's already settled: the put traded in the same second and ALFA didn't move. With the moment matched, look at how the call print was reported.",
							"这一点已经确定：看跌在同一秒成交，ALFA 也没有变动。时刻已经对上，就该看这笔看涨成交是怎么报告的。",
						)
					: undefined,
				codes: sameMoment
					? undefined
					: t(
							"Condition codes are worth checking, but first the prints come from different moments: the put traded a minute later. Check the call's own time and ALFA's price then.",
							"条件代码值得查看，但首先这两笔成交来自不同时刻：看跌晚一分钟成交。先核查看涨自己的成交时间和当时 ALFA 的价格。",
						),
				news: sameMoment
					? t(
							"A gap from parity isn't evidence of inside news. The prints already share a moment, so check how the call print was reported: a correction or a complex-order leg can explain a gap like this.",
							"偏离平价不是内幕消息的证据。两笔成交已经处于同一时刻，所以要看这笔看涨成交是怎么报告的：更正或复杂订单的一条腿都可能造成这样的差额。",
						)
					: t(
							"A gap from parity isn't evidence of inside news. Compare prints from the same moment first: ALFA may simply have been higher when the call traded.",
							"偏离平价不是内幕消息的证据。先比较同一时刻的成交：看涨成交时 ALFA 可能本来就更高。",
						),
				put: sameMoment
					? t(
							"Parity alone can't say which leg is off, and the put traded at the same moment. The call print's condition codes can: a correction or a complex-order leg explains a gap like this.",
							"仅凭平价无法判断哪条腿有问题，而且看跌是在同一时刻成交的。看涨成交的条件代码可以：更正或复杂订单的一条腿可以解释这样的差额。",
						)
					: t(
							"The put traded a minute later, so the two prints may describe different moments. Check the call's own time and ALFA's price then before blaming either price.",
							"看跌晚一分钟成交，两笔成交可能对应不同时刻。在怪罪任何一个价格之前，先核查看涨自己的成交时间和当时 ALFA 的价格。",
						),
			};
			return {
				brief: paid
					? t(
							`ALFA is ${money(spot)} and pays a ${money(dividend)} dividend before one expiry. Its ${strike} call for that expiry has a mid of ${money(call)} a share. The options can't be exercised early, there's no interest to account for, and one contract covers 100 shares.`,
							`ALFA 为 ${money(spot)}，在某个到期日之前会派发 ${money(dividend)} 的股息。它该到期日的 ${strike} 看涨中间价为每股 ${money(call)}。这些期权不能提前行权，不需要考虑利息，一张合约对应 100 股。`,
						)
					: t(
							`ALFA is ${money(spot)}. Its ${strike} call for one expiry has a mid of ${money(call)} a share. There's no interest and no dividend to account for, and one contract covers 100 shares.`,
							`ALFA 为 ${money(spot)}。它某个到期日的 ${strike} 看涨中间价为每股 ${money(call)}。不需要考虑利息和股息，一张合约对应 100 股。`,
						),
				questions: [
					c(
						"relation",
						"Which relation gives the put's mid in this case?",
						"在本案例中，用哪个关系求看跌的中间价？",
						[
							option(
								"plain",
								"C − P = S − K",
								"C − P = S − K",
								relationWhy.plain,
							),
							option(
								"dividend",
								"C − P = (S − D) − K, taking the dividend D off the stock",
								"C − P = (S − D) − K，从股价中扣除股息 D",
								relationWhy.dividend,
							),
							option(
								"add",
								"C − P = (S + D) − K, adding the dividend D to the stock",
								"C − P = (S + D) − K，把股息 D 加到股价上",
								relationWhy.add,
							),
						],
						paid ? "dividend" : "plain",
						paid
							? `With no interest, C − P = S − PV(D) − K, and PV(D) is simply the ${money(dividend)} dividend. It comes off the stock because the call holder doesn't receive it.`
							: "With no interest and no dividend, nothing adjusts S or K: C − P = S − K.",
						paid
							? `没有利息时，C − P = S − PV(D) − K，而 PV(D) 就是 ${money(dividend)} 的股息。它要从股价中扣除，因为看涨持有人拿不到它。`
							: "没有利息和股息，S 和 K 都不需要调整：C − P = S − K。",
					),
					n(
						"put",
						`What should the ${strike} put's mid be, per share?`,
						`${strike} 看跌的中间价应该是每股多少？`,
						put,
						"dollars a share",
						"美元/股",
						paid
							? `C − P = (S − D) − K, so P = C − (S − D − K) = ${money(call)} − (${signedMoney(spot - dividend - strike)}) = ${money(put)}.`
							: `C − P = S − K, so P = C − (S − K) = ${money(call)} − (${signedMoney(spot - strike)}) = ${money(put)}.`,
						paid
							? `C − P = (S − D) − K，所以 P = C − (S − D − K) = ${money(call)} − (${signedMoney(spot - dividend - strike)}) = ${money(put)}。`
							: `C − P = S − K，所以 P = C − (S − K) = ${money(call)} − (${signedMoney(spot - strike)}) = ${money(put)}。`,
						0.01,
					),
					n(
						"synthetic",
						`You buy one ${strike} call and sell one ${strike} put. At expiry ALFA is ${money(expiry)}. Before premiums, what are the two legs worth together? Use a minus sign for a loss.`,
						`你买入一张 ${strike} 看涨，卖出一张 ${strike} 看跌。到期时 ALFA 为 ${money(expiry)}。不计权利金，两条腿合计价值多少？亏损请用负号。`,
						(expiry - strike) * 100,
						"dollars",
						"美元",
						`The call is worth ${money(Math.max(expiry - strike, 0))} a share and the short put costs ${money(Math.max(strike - expiry, 0))}: together (${plain(expiry)} − ${strike}) × 100 = ${signedMoney((expiry - strike) * 100, 0)}, exactly like 100 shares bought at ${money(strike, 0)}.${paid ? ` Unlike shares held until then, the pair doesn't collect the ${money(dividend)} dividend.` : ""}`,
						`看涨每股值 ${money(Math.max(expiry - strike, 0))}，看跌空头每股要付 ${money(Math.max(strike - expiry, 0))}：合计 (${plain(expiry)} − ${strike}) × 100 = ${signedMoney((expiry - strike) * 100, 0)}，和以 ${money(strike, 0)} 买入的 100 股完全一样。${paid ? `不同的是，这一组不会像一直持有的股票那样收到 ${money(dividend)} 的股息。` : ""}`,
					),
					c(
						"print",
						sameMoment
							? "A call print comes in $0.60 above where parity puts it, compared with a put that traded in the same second, while ALFA didn't move. What do you check first?"
							: "A call print comes in $0.60 above where parity puts it, compared with a put that traded a minute later. What do you check first?",
						sameMoment
							? "一笔看涨成交比平价给出的价格高 $0.60，对照的是同一秒成交的看跌，期间 ALFA 没有变动。你首先要核查什么？"
							: "一笔看涨成交比平价给出的价格高 $0.60，对照的是晚一分钟成交的看跌。你首先要核查什么？",
						[
							option(
								"time",
								"The print's own execution time and ALFA's price then",
								"这笔成交自身的成交时间，以及当时的 ALFA 价格",
								printWhy.time,
							),
							option(
								"news",
								"Whether the buyer has inside news",
								"买方是否掌握内幕消息",
								printWhy.news,
							),
							option(
								"put",
								"Whether the put is mispriced",
								"看跌是否定价错误",
								printWhy.put,
							),
							option(
								"codes",
								"The print's condition codes: a corrected report, or one leg of a complex order",
								"这笔成交的条件代码：是否为更正后的报告，或复杂订单中的一条腿",
								printWhy.codes,
							),
						],
						sameMoment ? "codes" : "time",
						sameMoment
							? "With both prints from the same moment, the gap most likely comes from how the call print was reported. A corrected report, or one leg of a complex order priced as part of a package, can sit outside parity on its own; its condition codes show which."
							: "Parity holds between prices from the same moment. Check the print's own time, its condition codes and any correction before reading anything into the gap.",
						sameMoment
							? "两笔成交来自同一时刻，差额最可能来自这笔看涨成交的报告方式。更正后的报告，或作为组合一部分定价的复杂订单单腿，单独看都可能偏离平价；它的条件代码会说明是哪一种。"
							: "平价关系只在同一时刻的价格之间成立。在解读这个差额之前，先核查这笔成交自身的时间、条件代码以及是否有更正。",
					),
				],
			};
		},
	},
];
