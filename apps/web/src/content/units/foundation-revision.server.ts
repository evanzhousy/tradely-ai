import "@tanstack/react-start/server-only";
import type { ScenarioQuestion } from "@/domain/learning/scenario";
import { archivedFoundationUnits } from "./archive/foundations-original.server";
import {
	choose as c,
	fact as f,
	money,
	numberQuestion as n,
	signedMoney,
	type TeachingCase,
	type TeachingUnit,
	t,
} from "./authoring.server";

const identityChoices: [string, string, string][] = [
	[
		"same",
		"The same contract, seen at two moments",
		"同一份合约，在两个时刻被观测到",
	],
	[
		"different",
		"Different contracts: one of the defining terms differs",
		"不同的合约：有一项定义条款不同",
	],
	[
		"unknown",
		"Can't tell: a defining term is missing",
		"无法判断：缺少一项定义条款",
	],
];
const missingAmount = (id: string, en: string, zh: string) =>
	c(
		id,
		en,
		zh,
		[
			["unknown", "No: the contract's terms are missing", "不能：缺少合约条款"],
			[
				"standard",
				"Yes: assume 100 shares per contract",
				"能：假设每张 100 股",
			],
			["zero", "Yes: count the missing amount as zero", "能：把缺失的数当作零"],
		],
		"unknown",
		"How many shares a contract covers has to come from its terms. A missing term isn't a standard 100-share contract, and it isn't zero.",
		"一张合约对应多少股，必须来自它的条款。缺失的条款既不等于标准的 100 股，也不等于零。",
	);

function contractsCase(variant: number): TeachingCase {
	if (variant === 2)
		return {
			brief: t(
				"Records A and B are both ALFA calls with a $105 strike. A expires October 16, 2026; B's expiry is missing. You bought 3 of A at $2.00 per quoted unit, but the record leaves out how many shares each contract covers. A later price can't fill in those terms.",
				"记录 A 和 B 都是行权价 $105 的 ALFA 看涨。A 于 2026 年 10 月 16 日到期，B 的到期日缺失。你以每报价单位 $2.00 买入 3 张 A，但记录没有写明每张合约对应多少股。之后的价格也补不上这些条款。",
			),
			questions: [
				c(
					"identity",
					"Can you tell whether A and B are the same contract?",
					"你能判断 A 和 B 是不是同一份合约吗？",
					identityChoices,
					"unknown",
					"B's expiry is missing. A matching ticker and strike aren't enough to say what a contract is, and a price can't settle it either.",
					"B 的到期日缺失。标的和行权价相同，不足以确定是哪份合约，价格也无法确定这一点。",
				),
				missingAmount(
					"premium",
					"Can you work out the total premium you paid?",
					"你能算出支付的总权利金吗？",
				),
				missingAmount(
					"deliverable",
					"Can you work out how many shares the contracts deliver?",
					"你能算出这些合约交付多少股吗？",
				),
			],
		};
	const different = variant === 3;
	const count = different ? 2 : 7;
	const price = different ? 3 : 1.5;
	const multiplier = different ? 100 : 10;
	return {
		brief: t(
			`In this exercise each contract delivers ${multiplier} shares, and prices are in dollars per share. Record A is an ALFA 105 call expiring October 16, 2026, seen at 10:30 ET. Record B ${different ? "has the same terms, except that it is a put" : "has the same underlying, type, strike, expiry and terms, seen at 10:31 ET at a different price"}. You bought record A; the purchase is below.`,
			`在本练习中，每张合约交付 ${multiplier} 股，价格按每股美元计。记录 A 是 2026 年 10 月 16 日到期的 ALFA 105 看涨，10:30 ET 观测到。记录 B ${different ? "条款相同，只是它是看跌" : "的标的、类型、行权价、到期日和条款都相同，在 10:31 ET 观测到，价格不同"}。你买入的是记录 A，成交见下方。`,
		),
		facts: [
			f("Purchased contracts", "买入张数", String(count)),
			f("Execution price (USD per share)", "成交价（美元/股）", String(price)),
			f("Stated shares per contract", "给定每张股数", String(multiplier)),
		],
		questions: [
			c(
				"identity",
				"Are A and B the same contract?",
				"A 和 B 是同一份合约吗？",
				identityChoices,
				different ? "different" : "same",
				different
					? "A call and a put give different rights, so they're different contracts even with the same ticker, strike and expiry."
					: "Every defining term matches. What changed is the time it was seen and its price, not the contract.",
				different
					? "看涨和看跌赋予不同的权利，所以即使代码、行权价和到期日都相同，也是不同的合约。"
					: "每一项定义条款都相同。变化的是观测时间和价格，而不是合约本身。",
			),
			n(
				"premium",
				"What premium did you pay in total, before fees?",
				"不计费用，你一共支付了多少权利金？",
				price * count * multiplier,
				"dollars",
				"美元",
				`${money(price)} × ${multiplier} shares × ${count} contracts = ${money(price * count * multiplier, 0)}. Use the contract's own share count, not an assumed 100.`,
				`${money(price)} × ${multiplier} 股 × ${count} 张 = ${money(price * count * multiplier, 0)}。要用合约自己的股数，而不是想当然的 100。`,
			),
			n(
				"deliverable",
				"How many shares would the contracts deliver if exercised?",
				"如果行权，这些合约会交付多少股？",
				count * multiplier,
				"shares",
				"股",
				`${count} × ${multiplier} = ${count * multiplier} shares. Buying the options hasn't delivered any stock yet.`,
				`${count} × ${multiplier} = ${count * multiplier} 股。买入期权本身还没有交付任何股票。`,
			),
		],
	};
}

function rightsCase(variant: number): TeachingCase {
	if (variant === 1)
		return {
			brief: t(
				"Ben wrote 3 ALFA calls with a $65 strike, settled in shares, 100 per contract, and he's assigned. Ignore the premium and fees: this is about the exchange of cash and shares.",
				"Ben 卖出了 3 张行权价 $65 的 ALFA 看涨，以股票交割，每张 100 股，现在他被指派了。不计权利金和费用：这里只看现金和股票的交换。",
			),
			questions: [
				n(
					"obligation",
					"How much cash does Ben receive for the shares?",
					"Ben 交付股票会收到多少现金？",
					19500,
					"dollars",
					"美元",
					"$65 × 100 × 3 = $19,500, in exchange for 300 shares. That's the exchange, not Ben's profit.",
					"$65 × 100 × 3 = $19,500，换出 300 股。这是交换的金额，不是 Ben 的利润。",
				),
				c(
					"role",
					"What does assignment require Ben to do?",
					"被指派后，Ben 必须做什么？",
					[
						["buy", "Buy the shares", "买入股票"],
						["sell", "Deliver the shares at the strike", "按行权价交付股票"],
						[
							"choice",
							"Decide whether to go through with it",
							"自行决定是否履行",
						],
					],
					"sell",
					"The call's holder has the right to buy at $65, so Ben, the writer, must deliver at $65. A put writer's duty runs the other way.",
					"看涨的持有人有权按 $65 买入，所以作为义务方的 Ben 必须按 $65 交付。看跌义务方的义务方向正好相反。",
				),
			],
		};
	const closeShort = variant === 3;
	return {
		brief: t(
			closeShort
				? "You're short 3 ALFA puts, and you buy the same 3 puts to close at $1.20 a share. One contract covers 100 shares. The trade is confirmed, and nothing was exercised or assigned."
				: "You own 2 ALFA puts, and you sell those same 2 puts to close at $2.50 a share. One contract covers 100 shares. The trade is confirmed, and nothing was exercised or assigned.",
			closeShort
				? "你做空了 3 张 ALFA 看跌，现在以每股 $1.20 买入同样的 3 张平仓。一张合约对应 100 股。交易已确认，没有行权或指派。"
				: "你持有 2 张 ALFA 看跌，现在以每股 $2.50 卖出这 2 张平仓。一张合约对应 100 股。交易已确认，没有行权或指派。",
		),
		questions: [
			c(
				"role",
				"What did this trade do to your position?",
				"这笔交易对你的持仓做了什么？",
				[
					[
						"close-long",
						"Closed a long option position you held",
						"平掉了你持有的期权多头",
					],
					[
						"close-short",
						"Closed a short option position you held",
						"平掉了你持有的期权空头",
					],
					[
						"exercise",
						"Exercised the option and moved stock",
						"行使了期权并转移了股票",
					],
				],
				closeShort ? "close-short" : "close-long",
				"Read the starting position together with the instruction to close. Trading an option isn't exercising it, and the words buy and sell alone don't say whether a trade opens or closes.",
				"要把初始持仓和平仓指令一起看。交易期权不等于行权，仅凭“买入”“卖出”这两个词，也看不出是开仓还是平仓。",
			),
			n(
				"cash",
				closeShort
					? "How much premium did you pay to close, before fees?"
					: "How much premium did you receive for closing, before fees?",
				closeShort
					? "不计费用，平仓支付了多少权利金？"
					: "不计费用，平仓收到了多少权利金？",
				closeShort ? 360 : 500,
				"dollars",
				"美元",
				closeShort
					? "$1.20 × 100 × 3 = $360 paid. Your profit also depends on what you first sold the puts for."
					: "$2.50 × 100 × 2 = $500 received. Your profit also depends on what you first paid for the puts.",
				closeShort
					? "$1.20 × 100 × 3 = 支付 $360。盈亏还取决于你当初卖出这些看跌的价格。"
					: "$2.50 × 100 × 2 = 收到 $500。盈亏还取决于你当初买入这些看跌的价格。",
			),
		],
	};
}

/** Case facts for variants 1–3; variant 0 is the archived guided case (2 calls, $3, strike 100, spot 102). */
function payoffParams(variant: number) {
	if (variant === 0)
		return {
			put: false,
			strike: 100,
			paid: 3,
			spot: 102,
			count: 2,
			multiplier: 100,
			fees: 0,
		};
	return {
		put: variant !== 2,
		strike: variant === 1 ? 50 : variant === 2 ? 100 : 60,
		paid: variant === 1 ? 4 : variant === 2 ? 2.5 : 3,
		spot: variant === 1 ? 48 : variant === 2 ? 95 : 50,
		count: variant === 1 ? 3 : variant === 2 ? 4 : 2,
		multiplier: variant === 3 ? 10 : 100,
		fees: variant === 1 ? 12 : 0,
	};
}

function payoffCase(variant: number): TeachingCase {
	const { put, strike, paid, spot, count, multiplier, fees } =
		payoffParams(variant);
	const premium = paid * count * multiplier;
	const intrinsic = Math.max(put ? strike - spot : spot - strike, 0);
	const payoff = intrinsic * count * multiplier;
	const profit = payoff - premium - fees;
	return {
		brief: t(
			`You bought ${count} ALFA ${strike} ${put ? "puts" : "calls"} at ${money(paid)} a share, and each contract covers ${multiplier} shares. At expiry ALFA is ${money(spot)}, so only intrinsic value is left. ${fees ? `Fees for the whole position come to ${money(fees, 0)}.` : "There are no fees."}`,
			`你以每股 ${money(paid)} 买入 ${count} 张 ALFA ${strike} ${put ? "看跌" : "看涨"}，每张合约对应 ${multiplier} 股。到期时 ALFA 为 ${money(spot)}，只剩内在价值。${fees ? `整个持仓的费用合计 ${money(fees, 0)}。` : "没有费用。"}`,
		),
		questions: [
			n(
				"premium",
				"What premium did you pay in total, before fees?",
				"不计费用，你一共支付了多少权利金？",
				premium,
				"dollars",
				"美元",
				`${money(paid)} × ${multiplier} × ${count} = ${money(premium, 0)}.`,
				`${money(paid)} × ${multiplier} × ${count} = ${money(premium, 0)}。`,
			),
			n(
				"payoff",
				"What are the options worth at expiry, before subtracting what you paid?",
				"到期时这些期权值多少（还没减去你支付的成本）？",
				payoff,
				"dollars",
				"美元",
				`Each is worth max(${put ? `${strike} − ${spot}` : `${spot} − ${strike}`}, 0) = ${money(intrinsic)} a share, so ${money(intrinsic)} × ${multiplier} × ${count} = ${money(payoff, 0)}. An option's value stops at zero; it never goes negative.`,
				`每张每股价值 max(${put ? `${strike} − ${spot}` : `${spot} − ${strike}`}, 0) = ${money(intrinsic)}，所以 ${money(intrinsic)} × ${multiplier} × ${count} = ${money(payoff, 0)}。期权价值最低为零，不会为负。`,
			),
			n(
				"profit",
				"What is your profit or loss after the premium and fees? Use a minus sign for a loss.",
				"减去权利金和费用后，你盈亏多少？亏损请用负号。",
				profit,
				"dollars",
				"美元",
				`${money(payoff, 0)} − ${money(premium, 0)} − ${money(fees, 0)} = ${signedMoney(profit, 0)}. A positive value at expiry doesn't have to cover what you paid.`,
				`${money(payoff, 0)} − ${money(premium, 0)} − ${money(fees, 0)} = ${signedMoney(profit, 0)}。到期价值为正，不代表能覆盖你付出的成本。`,
			),
			c(
				"moneyness",
				"Is the option in the money at expiry?",
				"期权到期时是实值吗？",
				[
					["itm", "Yes: it has intrinsic value", "是：它有内在价值"],
					["otm", "No: its intrinsic value is zero", "否：它的内在价值为零"],
				],
				intrinsic > 0 ? "itm" : "otm",
				"In the money compares the strike with ALFA's price. Whether you made money also depends on what you paid and on fees.",
				"是否实值，比较的是行权价和 ALFA 的价格。是否赚钱，还取决于你支付的价格和费用。",
			),
		],
	};
}

function settlementCase(variant: number): TeachingCase {
	if (variant === 1)
		return {
			brief: t(
				"You exercise 2 ALFA calls with a $50 strike, settled in shares, 100 per contract. You're exercising them, not selling them. Ignore the premium and fees: this is about the exchange of cash and shares.",
				"你行使 2 张行权价 $50 的 ALFA 看涨，以股票交割，每张 100 股。你是行权，而不是卖出它们。不计权利金和费用：这里只看现金和股票的交换。",
			),
			questions: [
				n(
					"shares",
					"How many shares do you receive?",
					"你会收到多少股？",
					200,
					"shares",
					"股",
					"2 × 100 = 200 actual shares, because the calls settle in shares.",
					"2 × 100 = 200 股真实的股票，因为这些看涨以股票交割。",
				),
				n(
					"cash",
					"How much cash do you pay for them?",
					"你要为这些股票支付多少现金？",
					10000,
					"dollars",
					"美元",
					"$50 × 200 = $10,000 for the shares. That's a purchase at the strike, not a cash payout of the option's value.",
					"$50 × 200 = $10,000，用来买这些股票。这是按行权价买入，而不是以现金支付期权的价值。",
				),
				c(
					"delivery",
					"How is this different from selling the calls to close?",
					"这和卖出看涨平仓有什么不同？",
					[
						[
							"exercise",
							"Exercising uses the right, and the shares change hands",
							"行权是使用权利，股票会易手",
						],
						[
							"same",
							"It isn't: they're the same event",
							"没有不同：它们是同一件事",
						],
					],
					"exercise",
					"Closing sells the option itself. Exercising uses it: you buy the shares on the contract's terms.",
					"平仓是把期权本身卖掉；行权是使用它：你按合约条款买入股票。",
				),
			],
		};
	if (variant === 3)
		return {
			brief: t(
				"You bought 2 cash-settled IDX calls with a 4,000 strike for a premium of 3 points each, at $100 per point. The official settlement value the terms call for hasn't been published yet; the index last showed 4,030. These contracts never deliver shares. Ignore fees.",
				"你以每张 3 点的权利金买入 2 张行权价 4,000 的 IDX 现金结算看涨，每点 $100。条款要求的官方结算值还没有公布；指数最近显示为 4,030。这些合约从不交付股票。不计费用。",
			),
			questions: [
				c(
					"cash",
					"Can you work out the final cash payout yet?",
					"现在能算出最终的现金支付吗？",
					[
						[
							"unknown",
							"No: wait for the official settlement value",
							"不能：要等官方结算值",
						],
						[
							"spot",
							"Yes: use the last price shown, 4,030",
							"能：用最近显示的 4,030",
						],
						[
							"zero",
							"Yes: it's zero while the value is missing",
							"能：数值缺失时就是零",
						],
					],
					"unknown",
					"The last price shown isn't the value the terms name. Until the official value is published, the payout is unknown, not zero.",
					"最近显示的价格不是条款指定的数值。在官方结算值公布之前，支付金额是未知的，而不是零。",
				),
				c(
					"delivery",
					"Does the missing value turn cash settlement into share delivery?",
					"缺少结算值，会让现金结算变成股票交付吗？",
					[
						[
							"no",
							"No: the contract's terms fix how it settles",
							"不会：结算方式由合约条款决定",
						],
						[
							"yes",
							"Yes: 100 shares are delivered instead",
							"会：改为交付 100 股",
						],
					],
					"no",
					"A value that hasn't arrived doesn't rewrite the contract. It still settles in cash.",
					"一个还没公布的数值不会改写合约。它仍然以现金结算。",
				),
				n(
					"premium",
					"Even with the payout unknown, what premium did you pay in total?",
					"即使支付金额还未知，你一共支付了多少权利金？",
					600,
					"dollars",
					"美元",
					"3 points × $100 a point × 2 contracts = $600. What you paid is known even while the settlement value isn't.",
					"3 点 × 每点 $100 × 2 张 = $600。即使结算值还未知，你支付的金额是已知的。",
				),
			],
		};
	return {
		brief: t(
			"You hold 2 cash-settled IDX puts with a 4,000 strike, paying $50 per index point per contract. The official settlement value is 3,990, though the index last showed 3,980. Ignore the premium and fees.",
			"你持有 2 张行权价 4,000 的 IDX 现金结算看跌，每张每个指数点 $50。官方结算值为 3,990，而指数最近显示为 3,980。不计权利金和费用。",
		),
		questions: [
			c(
				"reference",
				"Which value do you settle against?",
				"结算用哪个数值？",
				[
					[
						"official",
						"The official settlement value, 3,990",
						"官方结算值 3,990",
					],
					["last", "The last price shown, 3,980", "最近显示的价格 3,980"],
				],
				"official",
				"The terms name the official settlement value. A price that looks more recent can't replace it.",
				"条款指定的是官方结算值。看起来更新的价格也不能替代它。",
			),
			n(
				"cash",
				"What cash do the two puts pay in total?",
				"两张看跌一共支付多少现金？",
				1000,
				"dollars",
				"美元",
				"max(4,000 − 3,990, 0) × $50 × 2 = $1,000. A put subtracts the other way round from a call.",
				"max(4,000 − 3,990, 0) × $50 × 2 = $1,000。看跌的相减方向与看涨相反。",
			),
			c(
				"delivery",
				"What do you receive?",
				"你会收到什么？",
				[
					["cash", "Cash; no shares of the index", "现金；不交付指数的股票"],
					["shares", "100 shares for each contract", "每张 100 股"],
				],
				"cash",
				"The $50 per point turns index points into dollars; it doesn't mean shares are delivered.",
				"每点 $50 是把指数点换算成美元，并不表示要交付股票。",
			),
		],
	};
}

/**
 * Variant 0, the guided case, in plainer words. Question ids, choices and answers match the
 * archived originals, so attempts saved against them still read correctly.
 */
const guided: Record<string, () => TeachingCase> = {
	"option-contracts": () => ({
		brief: t(
			"Records A and B are both ALFA 105 calls, and each contract covers 100 shares. Record A expires October 16; record B expires November 20. You bought record A; the purchase is below.",
			"记录 A 和 B 都是 ALFA 105 看涨，每张合约对应 100 股。记录 A 于 10 月 16 日到期，记录 B 于 11 月 20 日到期。你买入的是记录 A，成交见下方。",
		),
		facts: [
			f("Purchased contracts", "买入合约（张）", "4"),
			f("Execution price (USD per share)", "成交价（美元/股）", "2.00"),
		],
		questions: [
			c(
				"identity",
				"Can you treat A and B as the same contract?",
				"A 和 B 能当作同一份合约吗？",
				[
					["same", "Yes: the ticker and strike match", "能：代码和行权价相同"],
					["different", "No: the expiry differs", "不能：到期日不同"],
					["unknown", "Only the next price can tell", "只有下一个价格才能判断"],
				],
				"different",
				"The expiry is part of what a contract is, so A and B are different contracts. A price is only an observation of one of them.",
				"到期日是合约定义的一部分，所以 A 和 B 是不同的合约。价格只是对其中一份合约的观测。",
			),
			n(
				"premium",
				"What premium did you pay in total, before fees?",
				"不计费用，你一共支付了多少权利金？",
				800,
				"dollars",
				"美元",
				"$2.00 a share × 100 shares × 4 contracts = $800. That's what you paid, not a profit.",
				"每股 $2.00 × 100 股 × 4 张 = $800。这是你支付的金额，不是利润。",
			),
			n(
				"deliverable",
				"How many shares would your contracts deliver if exercised?",
				"如果行权，你的合约会交付多少股？",
				400,
				"shares",
				"股",
				"4 × 100 = 400 shares. That's what exercise would deliver, not a share-equivalent exposure: no delta was given.",
				"4 × 100 = 400 股。这是行权会交付的股数，而不是股等价敞口：题目没有给出 Delta。",
			),
		],
	}),
	"option-rights": () => ({
		brief: t(
			"Ben wrote 2 ALFA puts with a $40 strike, settled in shares, 100 per contract, and he's assigned. Ignore the premium and fees: this is about the exchange of cash and shares.",
			"Ben 卖出了 2 张行权价 $40 的 ALFA 看跌，以股票交割，每张 100 股，现在他被指派了。不计权利金和费用：这里只看现金和股票的交换。",
		),
		questions: [
			n(
				"obligation",
				"How much cash must Ben pay?",
				"Ben 必须支付多少现金？",
				8000,
				"dollars",
				"美元",
				"$40 × 100 × 2 = $8,000, for 200 shares. That's the exchange, not Ben's profit or loss.",
				"$40 × 100 × 2 = $8,000，换来 200 股。这是交换的金额，不是 Ben 的盈亏。",
			),
			c(
				"role",
				"What does assignment require Ben to do?",
				"被指派后，Ben 必须做什么？",
				[
					["buy", "Buy the shares at the strike", "按行权价买入股票"],
					["sell", "Sell the shares at the strike", "按行权价卖出股票"],
					[
						"choice",
						"Decide whether to go through with it",
						"自行决定是否履行",
					],
				],
				"buy",
				"The put's holder has the right to sell at $40, so Ben, the writer, must buy at $40. Assignment isn't optional.",
				"看跌的持有人有权按 $40 卖出，所以作为义务方的 Ben 必须按 $40 买入。指派不是可选的。",
			),
		],
	}),
	"premium-payoff": () => ({
		brief: t(
			"You bought 2 ALFA 100 calls at $3.00 a share, and each contract covers 100 shares. At expiry ALFA is $102. Ignore fees.",
			"你以每股 $3.00 买入 2 张 ALFA 100 看涨，每张合约对应 100 股。到期时 ALFA 为 $102。不计费用。",
		),
		questions: [
			n(
				"premium",
				"What premium did you pay in total?",
				"你一共支付了多少权利金？",
				600,
				"dollars",
				"美元",
				"$3.00 × 100 × 2 = $600.",
				"$3.00 × 100 × 2 = $600。",
			),
			n(
				"profit",
				"What is your profit or loss at expiry, after the premium? Use a minus sign for a loss.",
				"算上权利金，你到期盈亏多少？亏损请用负号。",
				-200,
				"dollars",
				"美元",
				"Each call is worth $102 − $100 = $2.00 a share, $1.00 less than the $3.00 you paid: −$1.00 × 100 × 2 = −$200. In the money, and still a loss.",
				"每张看涨每股值 $102 − $100 = $2.00，比你支付的 $3.00 少 $1.00：−$1.00 × 100 × 2 = −$200。实值，却仍然亏损。",
			),
		],
	}),
	"expiration-settlement": () => ({
		brief: t(
			"You hold one cash-settled IDX call with a 4,000 strike, paying $100 per index point. The official settlement value comes out at 4,012. Ignore the premium you paid.",
			"你持有一张行权价 4,000 的 IDX 现金结算看涨，每个指数点 $100。官方结算值公布为 4,012。不计你支付的权利金。",
		),
		questions: [
			n(
				"settlement-difference",
				"How far is the settlement value above the strike, in index points? Use a minus sign if it's below.",
				"结算值比行权价高多少个指数点？如果更低，请用负号。",
				12,
				"index points",
				"指数点",
				"4,012 − 4,000 = +12 points. Had settlement come in below the strike, this difference would be negative and the payout zero.",
				"4,012 − 4,000 = +12 点。如果结算值低于行权价，这个差值会是负数，支付则为零。",
			),
			n(
				"cash",
				"What cash does the call pay?",
				"这张看涨支付多少现金？",
				1200,
				"dollars",
				"美元",
				"max(4,012 − 4,000, 0) × $100 = $1,200.",
				"max(4,012 − 4,000, 0) × $100 = $1,200。",
			),
			c(
				"delivery",
				"What do you receive?",
				"你会收到什么？",
				[
					["shares", "100 shares of the index", "100 股指数股票"],
					["cash", "The cash amount; no shares", "现金金额；不交付股票"],
					["premium", "A refund of the premium you paid", "退还你支付的权利金"],
				],
				"cash",
				"The terms say cash settlement: an index can't be delivered as shares, and the premium is never refunded.",
				"条款规定现金结算：指数无法以股票形式交付，权利金也不会退还。",
			),
		],
	}),
};

const revisions: Record<string, (variant: number) => TeachingCase> = {
	"option-contracts": contractsCase,
	"option-rights": rightsCase,
	"premium-payoff": payoffCase,
	"expiration-settlement": settlementCase,
};

const foundationV4Units: TeachingUnit[] = archivedFoundationUnits.map(
	(unit) => ({
		...unit,
		version: 4,
		case: (variant) => {
			if (!Number.isInteger(variant) || variant < 0 || variant > 3)
				throw new Error("Unknown foundation variant");
			return variant === 0 ? guided[unit.id]() : revisions[unit.id](variant);
		},
	}),
);

function writerQuestion(variant: number): ScenarioQuestion {
	const { put, strike, paid, spot, count, multiplier } = payoffParams(variant);
	const received = paid * count * multiplier;
	const owed =
		Math.max(put ? strike - spot : spot - strike, 0) * count * multiplier;
	const profit = received - owed;
	return n(
		"writer-profit",
		"The writer on the other side received the same premium. What is the writer's profit or loss at expiry, before fees? Use a minus sign for a loss.",
		"另一边的义务方收到了同样的权利金。不计费用，义务方到期盈亏多少？亏损请用负号。",
		profit,
		"dollars",
		"美元",
		`${money(received, 0)} received − ${money(owed, 0)} owed = ${signedMoney(profit, 0)}. Before fees the writer's result mirrors the buyer's, and the premium is the most the writer can keep.`,
		`收到 ${money(received, 0)} − 需支付 ${money(owed, 0)} = ${signedMoney(profit, 0)}。不计费用时，义务方与买方的结果互为镜像，权利金就是义务方最多能保留的金额。`,
	);
}

const expiryRiskQuestions: ScenarioQuestion[] = [
	c(
		"auto-exercise",
		"No instructions are given for this in-the-money call at expiration. What normally happens?",
		"到期时未对这张价内看涨发出任何指示，通常会发生什么？",
		[
			[
				"auto",
				"It is exercised automatically and pays the cash amount.",
				"会被自动行权并支付现金金额。",
			],
			[
				"lapse",
				"It lapses unless you actively submit an exercise notice.",
				"除非你主动提交行权通知，否则作废。",
			],
			[
				"threshold",
				"It is exercised only if it is at least 50 points in the money.",
				"只有价内至少 50 点才会被行权。",
			],
		],
		"auto",
		"An option in the money by $0.01 or more at expiration is normally exercised automatically unless the holder instructs otherwise. Check your broker's cut-off time and policy.",
		"到期时价内 $0.01 或以上的期权，除非持有人另行指示，通常会被自动行权。请查看券商的截止时间与政策。",
	),
	c(
		"pin-risk",
		"Now take the writer's side of a $50 call when the stock closes at exactly $50.00. What can the writer know at the close?",
		"换到 $50 看涨义务方的角度：股价恰好收在 $50.00。义务方在收盘时能知道什么？",
		[
			[
				"unknown",
				"Not whether assignment will follow; the holder can still decide after the close.",
				"无法确定是否会被指派；持有人收盘后仍可决定。",
			],
			[
				"safe",
				"That there will be no assignment, because the call is not in the money.",
				"不会被指派，因为看涨期权不在价内。",
			],
			[
				"certain",
				"That assignment is certain, because the stock reached the strike.",
				"一定会被指派，因为股价到达了行权价。",
			],
		],
		"unknown",
		"An at-the-money option may or may not be exercised. The holder can act on after-hours moves, so the writer learns the result only from the assignment notice.",
		"平值期权可能被行权，也可能不被行权。持有人可以根据盘后变动作决定，因此义务方只能从指派通知得知结果。",
	),
	c(
		"am-settlement",
		"Suppose this put were AM-settled: trading stops the day before, and the settlement value comes from opening prices on expiration morning. When is its payoff fixed?",
		"假设这张看跌为上午结算：前一天停止交易，结算值来自到期日早上的开盘价格。它的到期支付何时确定？",
		[
			[
				"open",
				"At the opening-based settlement value, after trading in it has stopped.",
				"在停止交易之后，按开盘价格计算的结算值确定。",
			],
			[
				"last",
				"At the last trade you could make the day before.",
				"在前一天你能完成的最后一笔交易时确定。",
			],
			[
				"choice",
				"Whenever the holder decides to exercise.",
				"在持有人决定行权时确定。",
			],
		],
		"open",
		"An AM-settled contract's payoff depends on a value you cannot trade against: it is set after trading stops, from opening prices on expiration morning.",
		"上午结算合约的到期支付取决于一个你无法再交易的数值：它在停止交易后，由到期日早上的开盘价格决定。",
	),
	c(
		"early-assignment",
		"A different, American-style short call on a stock is deep in the money. The stock goes ex-dividend tomorrow with a $0.60 dividend, and the call has $0.05 of time value left. What risk rises today?",
		"另一张美式股票看涨空头处于深度价内。明天除息、股息 $0.60，而该看涨期权仅剩 $0.05 时间价值。今天哪种风险上升？",
		[
			[
				"early",
				"Early assignment: the holder may exercise today to collect the dividend.",
				"提前指派：持有人可能今天行权以获取股息。",
			],
			[
				"none",
				"None: short calls can be assigned only at expiration.",
				"没有：空头看涨只能在到期时被指派。",
			],
			[
				"cash",
				"The call switches to cash settlement because of the dividend.",
				"因为派息，看涨期权改为现金结算。",
			],
		],
		"early",
		"American-style options can be exercised before expiration. When the dividend exceeds the call's remaining time value, exercising before the ex-dividend date can pay the holder, so the writer may be assigned early.",
		"美式期权可在到期前行权。当股息大于看涨期权剩余的时间价值时，在除息日前行权可能对持有人有利，因此义务方可能被提前指派。",
	),
];

function withQuestion(
	unit: TeachingUnit,
	question: (variant: number) => ScenarioQuestion,
): TeachingUnit["case"] {
	return (variant) => {
		const base = unit.case(variant);
		return { ...base, questions: [...base.questions, question(variant)] };
	};
}

/** Version 5 adds the writer's side to premium-payoff and expiry-day risks to expiration-settlement. */
const v5Revisions: Record<string, (unit: TeachingUnit) => TeachingUnit> = {
	"premium-payoff": (unit) => ({
		...unit,
		version: 5,
		conceptLab: unit.conceptLab && {
			...unit.conceptLab,
			intro: t(
				"Follow the units from price to premium, separate intrinsic and extrinsic value, then drag the expiration price through a payoff chart. Find where an in-the-money option still produces a loss, then see the same contract from the writer's side.",
				"从价格单位追踪到权利金，分清内在价值与外在价值，再拖动到期价格，探索支付价值曲线。找出期权已实值、买方却仍亏损的位置，再从义务方的角度看同一合约。",
			),
		},
		explanation: t(
			`${unit.explanation.en} The writer is on the other side: writer profit is the premium received minus the payoff owed. The most a writer can keep is the premium. A short put can lose up to (strike − premium) × multiplier per contract if the stock falls to zero; an uncovered short call has no fixed maximum loss.`,
			`${unit.explanation.zh}义务方站在另一侧：义务方盈亏 = 收到的权利金 − 需支付的到期价值。义务方最多只能保留权利金。若股价跌到零，空头看跌每张最多亏损（行权价 − 权利金）× 乘数；未备兑空头看涨没有固定的最大亏损。`,
		),
		example: t(
			`${unit.example.en} The writer of those 2 calls received $600 and owes $400 at $102, a $200 profit before fees; at $120 the writer would owe $4,000 and lose $3,400.`,
			`${unit.example.zh}这 2 张看涨的义务方收到 $600，$102 时需支付 $400，费用前盈利 $200；若到期价为 $120，则需支付 $4,000，亏损 $3,400。`,
		),
		misconception: t(
			`${unit.misconception.en} For a writer, the premium received is the maximum gain; the loss can be many times larger.`,
			`${unit.misconception.zh}对义务方而言，收到的权利金就是最大收益，而亏损可能是它的许多倍。`,
		),
		case: withQuestion(unit, writerQuestion),
	}),
	"expiration-settlement": (unit) => ({
		...unit,
		version: 5,
		conceptLab: unit.conceptLab && {
			...unit.conceptLab,
			intro: t(
				`${unit.conceptLab.intro.en} Then step through four expiry-day risks.`,
				`${unit.conceptLab.intro.zh}最后逐一查看四种到期日风险。`,
			),
		},
		explanation: t(
			`${unit.explanation.en} Expiration can also surprise you. A long option in the money by $0.01 or more is normally exercised automatically unless you instruct otherwise. A writer whose option closes near the strike may not know about assignment until after the close (pin risk). American-style short calls can be assigned early, especially the day before an ex-dividend date when the dividend exceeds the call's remaining time value. Some index options are AM-settled: trading stops the day before, and the settlement value comes from opening prices on expiration morning.`,
			`${unit.explanation.zh}到期还可能带来意外。价内 $0.01 或以上的多头期权，除非另行指示，通常会被自动行权。期权收在行权价附近时，义务方可能要到收盘后才知道是否被指派（钉住风险）。美式空头看涨可能被提前指派，尤其在除息日前一天、股息大于看涨期权剩余时间价值时。部分指数期权为上午结算：前一天停止交易，结算值来自到期日早上的开盘价格。`,
		),
		example: t(
			`${unit.example.en} Separately, a long 50 call that closes at $50.02 with no instructions is normally exercised, leaving you with 100 shares bought for $5,000.`,
			`${unit.example.zh}另外，持有的 50 看涨若收在 $50.02 且未发指示，通常会被行权，你将以 $5,000 买入 100 股。`,
		),
		misconception: t(
			`${unit.misconception.en} A small in-the-money amount does not expire worthless by default, and a short option near the strike can still be assigned after the close.`,
			`${unit.misconception.zh}小幅价内的期权不会默认作废；接近行权价的空头期权在收盘后仍可能被指派。`,
		),
		case: withQuestion(
			unit,
			(variant) => expiryRiskQuestions[variant] ?? expiryRiskQuestions[0],
		),
	}),
};

/** Attempts saved against v4 of the revised lessons keep resolving to their original rubrics. */
export const archivedFoundationV4Units = foundationV4Units.filter((unit) =>
	Object.hasOwn(v5Revisions, unit.id),
);

export const revisedFoundationUnits: TeachingUnit[] = foundationV4Units.map(
	(unit) => v5Revisions[unit.id]?.(unit) ?? unit,
);
